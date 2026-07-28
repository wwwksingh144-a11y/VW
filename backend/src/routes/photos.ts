import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { db } from '../db';
import { photos } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { StorageService } from '../storage';
import { enqueuePhotoJob } from '../queue';
import { config } from '../config';
import { PipelineLogger } from '../logger';
import * as FileType from 'file-type';

const router = Router();

// Multer memory storage configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.photo.maxSizeBytes,
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (config.photo.allowedExtensions.includes(ext) || config.photo.allowedMimetypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed formats: ${config.photo.allowedExtensions.join(', ')}`));
    }
  },
});

/**
 * POST /api/photos
 * Upload original photo to Vercel Blob, create DB record, and enqueue processing job.
 */
router.post('/', upload.single('photo'), async (req: Request, res: Response, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const fileTypeResult = await FileType.fromBuffer(req.file.buffer);
    if (!fileTypeResult || !config.photo.allowedMimetypes.includes(fileTypeResult.mime)) {
      return res.status(400).json({ error: 'Invalid file content detected.' });
    }


    const userId = (req.body.userId as string) || 'admin';
    const photoId = uuidv4();
    const originalFileName = req.file.originalname;
    const originalMimeType = req.file.mimetype || 'image/jpeg';
    const ext = path.extname(originalFileName) || '.jpg';
    
    // Key format: photos/{userId}/{photoId}/original.<ext>
    const blobPath = `photos/${userId}/${photoId}/original${ext}`;

    // Upload original file to Vercel Blob
    const inputUrl = await StorageService.uploadBlob(
      blobPath,
      req.file.buffer,
      originalMimeType
    );

    // Create DB Record
    const [insertedPhoto] = await db
      .insert(photos)
      .values({
        id: photoId,
        userId,
        originalFileName,
        originalSize: req.file.size,
        originalMimeType,
        status: 'uploaded',
        inputPath: inputUrl,
        webpPath: inputUrl, // Immediately viewable fallback
      })
      .returning();

    await PipelineLogger.log(
      photoId,
      'API',
      `Received photo upload (${(req.file.size / (1024 * 1024)).toFixed(2)} MB). Stored original in Vercel Blob CDN.`
    );

    // Enqueue background processing job
    try {
      await enqueuePhotoJob({
        photoId,
        userId,
        inputUrl,
        originalFileName,
        originalMimeType,
      });

      await PipelineLogger.log(photoId, 'QUEUE', 'Enqueued job to BullMQ image processing queue in Upstash Redis.');

      // Update status to queued
      await db
        .update(photos)
        .set({ status: 'queued' })
        .where(eq(photos.id, photoId));
      
      insertedPhoto.status = 'queued';
    } catch (queueErr) {
      console.error('Queue dispatch failed, photo job queued status pending worker poll:', queueErr);
      await PipelineLogger.log(photoId, 'ERROR', `Failed to enqueue job: ${queueErr}`);
    }

    res.status(201).json({
      success: true,
      photo: insertedPhoto,
    });
  } catch (error: any) {
    console.error('Photo upload endpoint error:', error);
    next(error);
  }
});

/**
 * GET /api/photos
 * List all uploaded photos with logs
 */
router.get('/', async (req: Request, res: Response, next) => {
  try {
    const photoList = await db
      .select()
      .from(photos)
      .orderBy(desc(photos.createdAt));
    
    const photosWithLogs = await Promise.all(
      photoList.map(async (p) => ({
        ...p,
        logs: await PipelineLogger.getLogs(p.id),
      }))
    );

    res.json(photosWithLogs);
  } catch (error) {
    console.error('Failed to fetch photos:', error);
    next(error);
  }
});

/**
 * GET /api/photos/:id/status
 * Lightweight polling endpoint for photo status
 */
router.get('/:id/status', async (req: Request, res: Response, next) => {
  try {
    const photoId = String(req.params.id);
    const result = await db
      .select({
        id: photos.id,
        status: photos.status,
        errorMessage: photos.errorMessage,
        width: photos.width,
        height: photos.height,
        processedAt: photos.processedAt,
      })
      .from(photos)
      .where(eq(photos.id, photoId));

    if (result.length === 0) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    res.json(result[0]);
  } catch (error) {
    console.error('Failed to fetch photo status:', error);
    next(error);
  }
});

/**
 * GET /api/photos/:id
 * Full metadata for a photo (including WebP URL and thumbnail URL)
 */
router.get('/:id', async (req: Request, res: Response, next) => {
  try {
    const photoId = String(req.params.id);
    const result = await db
      .select()
      .from(photos)
      .where(eq(photos.id, photoId));

    if (result.length === 0) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const logs = await PipelineLogger.getLogs(photoId);
    res.json({ ...result[0], logs });
  } catch (error) {
    console.error('Failed to fetch photo metadata:', error);
    next(error);
  }
});

/**
 * DELETE /api/photos/:id
 * Delete photo metadata and associated Vercel Blob assets
 */
router.delete('/:id', async (req: Request, res: Response, next) => {
  try {
    const photoId = String(req.params.id);
    const result = await db
      .select()
      .from(photos)
      .where(eq(photos.id, photoId));

    if (result.length === 0) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    const photo = result[0];

    // Clean up Vercel Blobs asynchronously
    if (photo.inputPath) StorageService.deleteBlob(photo.inputPath);
    if (photo.webpPath) StorageService.deleteBlob(photo.webpPath);
    if (photo.thumbnailPath) StorageService.deleteBlob(photo.thumbnailPath);

    // Clean up Redis logs
    PipelineLogger.deleteLogs(photoId);

    // Delete DB record
    await db.delete(photos).where(eq(photos.id, photoId));

    res.json({ success: true, message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Failed to delete photo:', error);
    next(error);
  }
});

export default router;

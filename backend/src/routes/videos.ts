import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { db } from '../db';
import { videos } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { StorageService } from '../storage';
import { enqueueVideoJob } from '../queue';
import { config } from '../config';
import { PipelineLogger } from '../logger';
import * as FileType from 'file-type';

const router = Router();

// Multer memory storage configuration (holds file in buffer for streaming upload to Vercel Blob)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.video.maxSizeBytes,
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (config.video.allowedExtensions.includes(ext) || config.video.allowedMimetypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type. Allowed formats: ${config.video.allowedExtensions.join(', ')}`));
    }
  },
});

/**
 * POST /api/videos
 * Upload original MP4 video to Vercel Blob, create DB record, and enqueue processing job.
 */
router.post('/', upload.single('video'), async (req: Request, res: Response, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const fileTypeResult = await FileType.fromBuffer(req.file.buffer);
    if (!fileTypeResult || !config.video.allowedMimetypes.includes(fileTypeResult.mime)) {
      return res.status(400).json({ error: 'Invalid file content detected.' });
    }

    const userId = (req.body.userId as string) || 'admin';
    const videoId = uuidv4();
    const originalFileName = req.file.originalname;
    const ext = path.extname(originalFileName) || '.mp4';
    
    // Key format: videos/{userId}/{videoId}/original.<ext>
    const blobPath = `videos/${userId}/${videoId}/original${ext}`;

    // Upload original file to Vercel Blob
    const inputUrl = await StorageService.uploadBlob(
      blobPath,
      req.file.buffer,
      req.file.mimetype || 'video/mp4'
    );

    // Create DB Record
    const [insertedVideo] = await db
      .insert(videos)
      .values({
        id: videoId,
        userId,
        originalFileName,
        originalSize: req.file.size,
        status: 'uploaded',
        inputPath: inputUrl,
      })
      .returning();

    await PipelineLogger.log(
      videoId,
      'API',
      `Received payload (${(req.file.size / (1024 * 1024)).toFixed(2)} MB). Stored original file in Vercel Blob CDN.`
    );

    // Enqueue background processing job
    try {
      await enqueueVideoJob({
        videoId,
        userId,
        inputUrl,
        originalFileName,
      });

      await PipelineLogger.log(videoId, 'QUEUE', 'Enqueued job to BullMQ processing queue in Upstash Redis.');

      // Update status to queued
      await db
        .update(videos)
        .set({ status: 'queued' })
        .where(eq(videos.id, videoId));
      
      insertedVideo.status = 'queued';
    } catch (queueErr) {
      console.error('Queue dispatch failed, job queued status pending worker poll:', queueErr);
      await PipelineLogger.log(videoId, 'ERROR', `Failed to enqueue job: ${queueErr}`);
    }

    res.status(201).json({
      success: true,
      video: insertedVideo,
    });
  } catch (error: any) {
    console.error('Video upload endpoint error:', error);
    next(error);
  }
});

/**
 * GET /api/videos
 * List all uploaded videos
 */
router.get('/', async (req: Request, res: Response, next) => {
  try {
    const videoList = await db
      .select()
      .from(videos)
      .orderBy(desc(videos.createdAt));
    
    const videosWithLogs = await Promise.all(
      videoList.map(async (v) => ({
        ...v,
        logs: await PipelineLogger.getLogs(v.id),
      }))
    );

    res.json(videosWithLogs);
  } catch (error) {
    console.error('Failed to fetch videos:', error);
    next(error);
  }
});

/**
 * GET /api/videos/:id/status
 * Lightweight polling endpoint for video status
 */
router.get('/:id/status', async (req: Request, res: Response, next) => {
  try {
    const videoId = String(req.params.id);
    const result = await db
      .select({
        id: videos.id,
        status: videos.status,
        errorMessage: videos.errorMessage,
        durationSeconds: videos.durationSeconds,
        processedAt: videos.processedAt,
      })
      .from(videos)
      .where(eq(videos.id, videoId));

    if (result.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    res.json(result[0]);
  } catch (error) {
    console.error('Failed to fetch video status:', error);
    next(error);
  }
});

/**
 * GET /api/videos/:id
 * Full metadata for a video (including WebM URL, MP4 URL, thumbnail URL)
 */
router.get('/:id', async (req: Request, res: Response, next) => {
  try {
    const videoId = String(req.params.id);
    const result = await db
      .select()
      .from(videos)
      .where(eq(videos.id, videoId));

    if (result.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const logs = await PipelineLogger.getLogs(videoId);
    res.json({ ...result[0], logs });
  } catch (error) {
    console.error('Failed to fetch video metadata:', error);
    next(error);
  }
});

/**
 * DELETE /api/videos/:id
 * Delete video metadata and associated Vercel Blob assets
 */
router.delete('/:id', async (req: Request, res: Response, next) => {
  try {
    const videoId = String(req.params.id);
    const result = await db
      .select()
      .from(videos)
      .where(eq(videos.id, videoId));

    if (result.length === 0) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const video = result[0];

    // Clean up Vercel Blobs asynchronously
    if (video.inputPath) StorageService.deleteBlob(video.inputPath);
    if (video.webmPath) StorageService.deleteBlob(video.webmPath);
    if (video.mp4Path) StorageService.deleteBlob(video.mp4Path);
    if (video.thumbnailPath) StorageService.deleteBlob(video.thumbnailPath);

    // Clean up Redis logs
    PipelineLogger.deleteLogs(videoId);

    // Delete DB record
    await db.delete(videos).where(eq(videos.id, videoId));

    res.json({ success: true, message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Failed to delete video:', error);
    next(error);
  }
});


export default router;

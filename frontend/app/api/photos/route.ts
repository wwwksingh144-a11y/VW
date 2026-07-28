import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';
import { photos } from '@/lib/db/schema';
import { desc, asc, eq } from 'drizzle-orm';
import { enqueuePhotoJob } from '@/lib/queue';
import { PipelineLogger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const photoList = await db
      .select()
      .from(photos)
      .where(eq(photos.publishStatus, 'published'))
      .orderBy(desc(photos.isStarred), asc(photos.displayOrder), desc(photos.createdAt));

    const withLogs = await Promise.all(
      photoList.map(async (p) => ({
        ...p,
        logs: await PipelineLogger.getLogs(p.id),
      }))
    );

    return NextResponse.json(withLogs);
  } catch (error: any) {
    console.error('Failed to fetch photos:', error);
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let inputUrl = '';
    let originalFileName = 'image.jpg';
    let originalSize = 0;
    let originalMimeType = 'image/jpeg';
    let userId = 'admin';

    if (contentType.includes('application/json')) {
      const body = await req.json();
      inputUrl = body.inputUrl;
      originalFileName = body.originalFileName || 'image.jpg';
      originalSize = body.originalSize || 0;
      originalMimeType = body.originalMimeType || 'image/jpeg';
      userId = body.userId || 'admin';
    } else {
      const formData = await req.formData();
      const file = formData.get('photo') as File | null;
      userId = (formData.get('userId') as string) || 'admin';

      if (!file) {
        return NextResponse.json({ error: 'No photo file provided' }, { status: 400 });
      }

      const photoIdTemp = uuidv4();
      const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase() || '.jpg';
      const blobPath = `photos/${userId}/${photoIdTemp}/original${ext}`;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const blob = await put(blobPath, buffer, {
        access: 'public',
        contentType: file.type || 'image/jpeg',
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      inputUrl = blob.url;
      originalFileName = file.name;
      originalSize = file.size;
      originalMimeType = file.type || 'image/jpeg';
    }

    if (!inputUrl) {
      return NextResponse.json({ error: 'Invalid inputUrl for photo' }, { status: 400 });
    }

    const photoId = uuidv4();

    await PipelineLogger.log(photoId, 'API', `Received photo upload payload (${originalFileName}) from Vercel Blob CDN.`);

    const [insertedPhoto] = await db
      .insert(photos)
      .values({
        id: photoId,
        userId,
        originalFileName,
        originalSize,
        originalMimeType,
        status: 'queued',
        inputPath: inputUrl,
        webpPath: inputUrl, // Playable immediately using original uploaded image URL
      })
      .returning();

    // Dispatch background transcoding task to Upstash Redis
    try {
      await enqueuePhotoJob({
        photoId,
        userId,
        inputUrl,
        originalFileName,
        originalMimeType,
      });
      await PipelineLogger.log(photoId, 'QUEUE', 'Enqueued photo job to BullMQ processing queue in Upstash Redis.');
    } catch (err: any) {
      console.warn('Photo queue dispatch warning:', err);
      await PipelineLogger.log(photoId, 'ERROR', `Failed to enqueue job to Upstash Redis: ${err.message || 'Unknown error'}`);
    }

    const photoWithLogs = {
      ...insertedPhoto,
      logs: await PipelineLogger.getLogs(photoId),
    };

    return NextResponse.json(
      { success: true, photo: photoWithLogs },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Photo upload endpoint error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload photo' },
      { status: 500 }
    );
  }
}

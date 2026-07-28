import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';
import { videos } from '@/lib/db/schema';
import { desc, asc, eq } from 'drizzle-orm';
import { enqueueVideoJob } from '@/lib/queue';
import { PipelineLogger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const videoList = await db
      .select()
      .from(videos)
      .where(eq(videos.publishStatus, 'published'))
      .orderBy(desc(videos.isStarred), asc(videos.displayOrder), desc(videos.createdAt));

    const withLogs = await Promise.all(
      videoList.map(async (v) => ({
        ...v,
        logs: await PipelineLogger.getLogs(v.id),
      }))
    );

    return NextResponse.json(withLogs);
  } catch (error: any) {
    console.error('Failed to fetch videos:', error);
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    let inputUrl = '';
    let originalFileName = 'video.mp4';
    let originalSize = 0;
    let userId = 'admin';

    if (contentType.includes('application/json')) {
      const body = await req.json();
      inputUrl = body.inputUrl;
      originalFileName = body.originalFileName || 'video.mp4';
      originalSize = body.originalSize || 0;
      userId = body.userId || 'admin';
    } else {
      const formData = await req.formData();
      const file = formData.get('video') as File | null;
      userId = (formData.get('userId') as string) || 'admin';

      if (!file) {
        return NextResponse.json({ error: 'No video file provided' }, { status: 400 });
      }

      const videoIdTemp = uuidv4();
      const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase() || '.mp4';
      const blobPath = `videos/${userId}/${videoIdTemp}/original${ext}`;

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const blob = await put(blobPath, buffer, {
        access: 'public',
        contentType: file.type || 'video/mp4',
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      inputUrl = blob.url;
      originalFileName = file.name;
      originalSize = file.size;
    }

    if (!inputUrl) {
      return NextResponse.json({ error: 'Invalid inputUrl for video' }, { status: 400 });
    }

    const videoId = uuidv4();

    await PipelineLogger.log(videoId, 'API', `Received video upload payload (${originalFileName}) from Vercel Blob CDN.`);

    // Insert record with mp4Path = inputUrl so original video can be played immediately!
    const [insertedVideo] = await db
      .insert(videos)
      .values({
        id: videoId,
        userId,
        originalFileName,
        originalSize,
        status: 'queued',
        inputPath: inputUrl,
        mp4Path: inputUrl, // Playable immediately using original uploaded video URL
      })
      .returning();

    // Dispatch background transcoding task to Upstash Redis
    try {
      await enqueueVideoJob({
        videoId,
        userId,
        inputUrl,
        originalFileName,
      });
      await PipelineLogger.log(videoId, 'QUEUE', 'Enqueued video job to Upstash Redis for serverless worker.');
    } catch (err: any) {
      console.warn('Queue dispatch warning:', err);
      await PipelineLogger.log(videoId, 'ERROR', `Failed to enqueue job to Upstash Redis: ${err.message || 'Unknown error'}`);
    }

    const videoWithLogs = {
      ...insertedVideo,
      logs: await PipelineLogger.getLogs(videoId),
    };

    return NextResponse.json(
      { success: true, video: videoWithLogs },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Video upload endpoint error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to upload video' },
      { status: 500 }
    );
  }
}

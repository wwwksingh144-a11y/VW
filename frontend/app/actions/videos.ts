"use server";

import { db } from "@/lib/db";
import { videos } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function getCompletedVideos() {
  try {
    const results = await db
      .select()
      .from(videos)
      .where(eq(videos.status, "completed"))
      .orderBy(desc(videos.createdAt));
      
    // Serialize Dates for Client Component consumption
    return results.map(v => ({
      ...v,
      createdAt: v.createdAt?.toISOString() || null,
      updatedAt: v.updatedAt?.toISOString() || null,
      processedAt: v.processedAt?.toISOString() || null
    }));
  } catch (err) {
    console.error("Failed to fetch completed videos from Neon DB:", err);
    return [];
  }
}

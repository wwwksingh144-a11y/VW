"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/rbac";
import { logAdminAction } from "@/lib/auth/audit-log";
import { db } from "@/lib/db";
import { insights } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function getInsights() {
  try {
    return await db
      .select()
      .from(insights)
      .orderBy(desc(insights.createdAt));
  } catch (err) {
    console.error("Failed to fetch insights from Neon DB:", err);
    return [];
  }
}

export async function getInsightBySlug(slug: string) {
  try {
    const list = await db
      .select()
      .from(insights)
      .where(eq(insights.slug, slug))
      .limit(1);
    return list[0] || null;
  } catch (err) {
    console.error(`Failed to fetch insight by slug (${slug}):`, err);
    return null;
  }
}

export async function createInsight(data: any) {
  const user = await requireAdmin();

  const [inserted] = await db
    .insert(insights)
    .values({
      title: data.title,
      slug: data.slug,
      category: data.category,
      coverImage: data.coverImage || "",
      content: data.content || "",
      authorName: data.authorName || "Amélie Laurent",
      authorRole: data.authorRole || "Partner, Brand Architecture",
      authorAvatar: data.authorAvatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      contributors: data.contributors || null,
      isPublished: data.isPublished ?? false,
      publishedAt: data.isPublished ? new Date() : null,
    })
    .returning();

  logAdminAction(
    "insight.create", 
    user.name || user.email, 
    user.email || "unknown", 
    { slug: data.slug, title: data.title }
  );

  revalidatePath("/");
  revalidatePath("/admin/insights");
  return inserted;
}

export async function updateInsight(id: number, data: any) {
  const user = await requireAdmin();

  const [updated] = await db
    .update(insights)
    .set({
      title: data.title,
      slug: data.slug,
      category: data.category,
      coverImage: data.coverImage,
      content: data.content,
      authorName: data.authorName,
      authorRole: data.authorRole,
      authorAvatar: data.authorAvatar,
      contributors: data.contributors,
      isPublished: data.isPublished,
      publishedAt: data.isPublished ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(insights.id, id))
    .returning();

  logAdminAction(
    "insight.update", 
    user.name || user.email, 
    user.email || "unknown", 
    { insightId: id }
  );

  revalidatePath("/");
  revalidatePath("/admin/insights");
  return updated;
}

export async function deleteInsight(id: number) {
  const user = await requireAdmin();

  await db
    .delete(insights)
    .where(eq(insights.id, id));

  logAdminAction(
    "insight.delete", 
    user.name || user.email, 
    user.email || "unknown", 
    { insightId: id }
  );

  revalidatePath("/");
  revalidatePath("/admin/insights");
}

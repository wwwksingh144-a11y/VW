"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/rbac";
import { logAdminAction } from "@/lib/auth/audit-log";
import { db } from "@/lib/db";
import { projects } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function getProjects() {
  try {
    return await db
      .select()
      .from(projects)
      .orderBy(desc(projects.createdAt));
  } catch (err) {
    console.error("Failed to fetch projects from Neon DB:", err);
    return [];
  }
}

export async function getProjectBySlug(slug: string) {
  try {
    const list = await db
      .select()
      .from(projects)
      .where(eq(projects.slug, slug))
      .limit(1);
    return list[0] || null;
  } catch (err) {
    console.error(`Failed to fetch project by slug (${slug}):`, err);
    return null;
  }
}

export async function createProject(data: any) {
  const user = await requireAdmin();

  const [inserted] = await db
    .insert(projects)
    .values({
      title: data.title,
      slug: data.slug,
      category: data.category,
      year: data.year,
      coverImage: data.coverImage || "",
      content: data.content || "",
      isFeatured: data.isFeatured ?? false,
    })
    .returning();

  logAdminAction(
    "project.create", 
    user.name || user.email || "unknown", 
    user.email ?? "unknown", 
    { slug: data.slug, title: data.title }
  );

  revalidatePath("/");
  revalidatePath("/admin/projects");
  return inserted;
}

export async function updateProject(id: number, data: any) {
  const user = await requireAdmin();

  const [updated] = await db
    .update(projects)
    .set({
      title: data.title,
      slug: data.slug,
      category: data.category,
      year: data.year,
      coverImage: data.coverImage,
      content: data.content,
      isFeatured: data.isFeatured,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, id))
    .returning();

  logAdminAction(
    "project.update", 
    user.name || user.email || "unknown", 
    user.email ?? "unknown", 
    { projectId: id }
  );

  revalidatePath("/");
  revalidatePath("/admin/projects");
  return updated;
}

export async function deleteProject(id: number) {
  const user = await requireAdmin();

  await db
    .delete(projects)
    .where(eq(projects.id, id));

  logAdminAction(
    "project.delete", 
    user.name || user.email || "unknown", 
    user.email ?? "unknown", 
    { projectId: id }
  );

  revalidatePath("/");
  revalidatePath("/admin/projects");
}

import { db } from "@/lib/db";
import { adminAuditLogs } from "@/lib/db/schema";
import { headers } from "next/headers";

export async function logAdminAction(
  action: string,
  userId: string,
  userEmail: string,
  details?: Record<string, unknown>
) {
  try {
    const headersList = await headers();
    const ipAddress = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown";
    const userAgent = headersList.get("user-agent") || "unknown";

    await db.insert(adminAuditLogs).values({
      adminName: userId,
      adminEmail: userEmail,
      action: action,
      resourceType: details?.resourceType as string || "insight",
      resourceId: details?.resourceId as string || details?.insightId?.toString() || "",
      newValue: details,
      ipAddress: ipAddress,
      userAgent: userAgent,
      status: "success"
    });
  } catch (error) {
    console.error("[AUDIT LOG ERROR]", error);
  }
}

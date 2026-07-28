import { pgTable, serial, text, varchar, timestamp, boolean, jsonb, uuid, bigint, integer } from "drizzle-orm/pg-core";

export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  category: varchar("category", { length: 100 }).notNull(),
  year: varchar("year", { length: 4 }).notNull(),
  coverImage: text("cover_image"),
  content: text("content").notNull(),
  isFeatured: boolean("is_featured").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insights = pgTable("insights", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  category: varchar("category", { length: 100 }).notNull(),
  coverImage: text("cover_image"),
  content: text("content").notNull(),
  authorName: varchar("author_name", { length: 255 }),
  authorRole: varchar("author_role", { length: 255 }),
  authorAvatar: text("author_avatar"),
  contributors: jsonb("contributors"),
  isPublished: boolean("is_published").default(false),
  status: varchar("status", { length: 50 }).notNull().default("draft"), // draft, published, archived
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userProfiles = pgTable("user_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull().unique(), // maps to Better Auth user email or id
  type: varchar("type", { length: 50 }).notNull(), // 'individual' or 'company'
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  address: jsonb("address"), // { country, state, city, pincode, fullAddress }
  companyName: varchar("company_name", { length: 255 }),
  employeesCount: varchar("employees_count", { length: 50 }),
  interests: jsonb("interests"), // array of selected services
  source: varchar("source", { length: 255 }), // where did you hear of us
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const videos = pgTable("videos", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  originalFileName: text("original_file_name").notNull(),
  originalSize: bigint("original_size", { mode: "number" }).notNull(),
  durationSeconds: varchar("duration_seconds", { length: 50 }),
  status: varchar("status", { length: 50 }).notNull().default("uploaded"), // processing status
  inputPath: text("input_path").notNull(),
  webmPath: text("webm_path"),
  mp4Path: text("mp4_path"),
  thumbnailPath: text("thumbnail_path"),
  errorMessage: text("error_message"),
  // New Admin Media Fields
  heading: varchar("heading", { length: 255 }),
  subHeading: varchar("sub_heading", { length: 255 }),
  description: text("description"),
  tags: jsonb("tags"),
  category: varchar("category", { length: 100 }),
  publishStatus: varchar("publish_status", { length: 50 }).notNull().default("draft"), // published, draft, archived
  isStarred: boolean("is_starred").default(false),
  displayOrder: integer("display_order").default(0),
  createdBy: varchar("created_by", { length: 255 }),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

export const photos = pgTable("photos", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  originalFileName: text("original_file_name").notNull(),
  originalSize: bigint("original_size", { mode: "number" }).notNull(),
  originalMimeType: varchar("original_mime_type", { length: 100 }).notNull(),
  width: bigint("width", { mode: "number" }),
  height: bigint("height", { mode: "number" }),
  status: varchar("status", { length: 50 }).notNull().default("uploaded"), // processing status
  inputPath: text("input_path").notNull(),
  webpPath: text("webp_path"),
  thumbnailPath: text("thumbnail_path"),
  errorMessage: text("error_message"),
  // New Admin Media Fields
  heading: varchar("heading", { length: 255 }),
  subHeading: varchar("sub_heading", { length: 255 }),
  description: text("description"),
  altText: varchar("alt_text", { length: 255 }),
  tags: jsonb("tags"),
  category: varchar("category", { length: 100 }),
  publishStatus: varchar("publish_status", { length: 50 }).notNull().default("draft"), // published, draft, archived
  isStarred: boolean("is_starred").default(false),
  displayOrder: integer("display_order").default(0),
  createdBy: varchar("created_by", { length: 255 }),
  updatedAt: timestamp("updated_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  processedAt: timestamp("processed_at"),
});

// Admin Roles
export const adminRoles = pgTable("admin_roles", {
  email: varchar("email", { length: 255 }).primaryKey(),
  role: varchar("role", { length: 50 }).notNull(), // Developer, Admin, SEO, Content Manager
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  createdBy: varchar("created_by", { length: 255 }),
});

// Admin Audit Logs
export const adminAuditLogs = pgTable("admin_audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  timestamp: timestamp("timestamp").defaultNow(),
  adminName: varchar("admin_name", { length: 255 }),
  adminEmail: varchar("admin_email", { length: 255 }),
  role: varchar("role", { length: 50 }),
  ipAddress: varchar("ip_address", { length: 100 }),
  userAgent: text("user_agent"),
  action: varchar("action", { length: 100 }).notNull(),
  resourceType: varchar("resource_type", { length: 100 }),
  resourceId: varchar("resource_id", { length: 255 }),
  previousValue: jsonb("previous_value"),
  newValue: jsonb("new_value"),
  status: varchar("status", { length: 50 }), // success, failure
  failureReason: text("failure_reason"),
});

// Admin OTPs for Dual Verification
export const adminOtps = pgTable("admin_otps", {
  id: uuid("id").defaultRandom().primaryKey(),
  superAdminEmail: varchar("super_admin_email", { length: 255 }).notNull(),
  promotedEmail: varchar("promoted_email", { length: 255 }).notNull(),
  promotedName: varchar("promoted_name", { length: 255 }),
  roleToAssign: varchar("role_to_assign", { length: 50 }),
  superAdminOtp: varchar("super_admin_otp", { length: 10 }).notNull(),
  promotedOtp: varchar("promoted_otp", { length: 10 }).notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  status: varchar("status", { length: 50 }).default("pending"), // pending, verified, expired
  createdAt: timestamp("created_at").defaultNow(),
});

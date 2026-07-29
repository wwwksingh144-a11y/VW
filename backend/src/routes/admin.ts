import { Router } from 'express';
import bcrypt from 'bcryptjs';
import * as jose from 'jose';
import { db } from '../db';
import { adminRoles, adminAuditLogs, adminOtps, photos, videos } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import { Resend } from 'resend';
import { adminAuthMiddleware } from '../middleware/rbac';

const router = Router();
const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_missing_key');
const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'fallback-secret-for-admin-session-please-change';
const secretKey = new TextEncoder().encode(JWT_SECRET);

export async function logAdminAction(data: {
  adminName?: string;
  adminEmail?: string;
  role?: string;
  ipAddress?: string;
  userAgent?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  previousValue?: any;
  newValue?: any;
  status: 'success' | 'failure';
  failureReason?: string;
}) {
  try {
    await db.insert(adminAuditLogs).values(data);
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}

router.get('/is-admin/:email', async (req, res) => {
  try {
    const email = req.params.email;
    if (!email) return res.json({ isAdmin: false });
    if (email === process.env.SUPER_ADMIN_EMAIL) {
      return res.json({ isAdmin: true });
    }
    const [admin] = await db.select().from(adminRoles).where(eq(adminRoles.email, email));
    if (admin) {
      return res.json({ isAdmin: true });
    }
    return res.json({ isAdmin: false });
  } catch (error) {
    console.error('Error checking is-admin:', error);
    res.json({ isAdmin: false });
  }
});

router.post('/auth', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  try {
    let role = '';
    let name = 'Admin';
    let isValid = false;

    if (email === process.env.SUPER_ADMIN_EMAIL) {
      if (password === process.env.SUPER_ADMIN_PASSWORD) {
        isValid = true;
        role = 'Developer';
        name = 'Super Admin';
      }
    } else {
      const [admin] = await db.select().from(adminRoles).where(eq(adminRoles.email, email));
      if (admin) {
        isValid = await bcrypt.compare(password, admin.passwordHash);
        if (isValid) {
          role = admin.role;
          name = admin.name;
        }
      }
    }

    if (!isValid) {
      await logAdminAction({
        adminEmail: email,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        action: 'login',
        status: 'failure',
        failureReason: 'Invalid credentials'
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = await new jose.SignJWT({ email, role, name })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('12h')
      .sign(secretKey);

    await logAdminAction({
      adminEmail: email,
      adminName: name,
      role,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      action: 'login',
      status: 'success'
    });

    res.json({ token, user: { email, role, name } });
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/initiate-promotion', adminAuthMiddleware(['Developer']), async (req, res) => {
  const { name, email, role } = req.body;
  
  if (!name || !email || !role) {
    return res.status(400).json({ error: 'Name, email, and role are required' });
  }

  try {
    const superAdminOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const promotedOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60000);

    await db.insert(adminOtps).values({
      superAdminEmail: req.admin!.email,
      promotedEmail: email,
      promotedName: name,
      roleToAssign: role,
      superAdminOtp,
      promotedOtp,
      expiresAt
    });

    await resend.emails.send({
      from: 'admin@resend.dev', // Testing domain
      to: req.admin!.email,
      subject: 'Admin Promotion OTP (Super Admin)',
      html: `<p>Your OTP to approve promotion for ${email} is: <strong>${superAdminOtp}</strong></p>`
    });

    await resend.emails.send({
      from: 'admin@resend.dev',
      to: email,
      subject: 'Admin Promotion OTP',
      html: `<p>You are being promoted to ${role}. Your OTP is: <strong>${promotedOtp}</strong></p>`
    });

    await logAdminAction({
      adminEmail: req.admin!.email,
      role: req.admin!.role,
      action: 'initiate_promotion',
      resourceType: 'admin_roles',
      resourceId: email,
      status: 'success'
    });

    res.json({ success: true, message: 'OTPs sent' });
  } catch (error: any) {
    console.error('Initiate promotion error:', error);
    res.status(500).json({ error: 'Failed to initiate promotion', details: error.message });
  }
});

router.post('/verify-promotion', adminAuthMiddleware(['Developer']), async (req, res) => {
  const { email, superAdminOtp, promotedOtp, password } = req.body;
  
  if (!email || !superAdminOtp || !promotedOtp || !password) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const otpRecords = await db.select().from(adminOtps)
      .where(eq(adminOtps.promotedEmail, email));
    
    const record = otpRecords
      .filter(r => r.status === 'pending' && new Date(r.expiresAt) > new Date())
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())[0];
    
    if (!record) {
      return res.status(400).json({ error: 'No valid OTP session found or expired' });
    }

    if (record.superAdminOtp !== superAdminOtp || record.promotedOtp !== promotedOtp) {
      return res.status(400).json({ error: 'Invalid OTPs' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    
    const existing = await db.select().from(adminRoles).where(eq(adminRoles.email, email));
    if (existing.length > 0) {
      await db.update(adminRoles).set({ role: record.roleToAssign!, passwordHash, name: record.promotedName! }).where(eq(adminRoles.email, email));
    } else {
      await db.insert(adminRoles).values({
        email,
        role: record.roleToAssign!,
        passwordHash,
        name: record.promotedName!,
        createdBy: req.admin!.email
      });
    }

    await db.update(adminOtps).set({ status: 'verified' }).where(eq(adminOtps.id, record.id));

    await logAdminAction({
      adminEmail: req.admin!.email,
      role: req.admin!.role,
      action: 'verify_promotion',
      resourceType: 'admin_roles',
      resourceId: email,
      newValue: { role: record.roleToAssign },
      status: 'success'
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Verify promotion error:', error);
    res.status(500).json({ error: 'Failed to verify promotion' });
  }
});

router.get('/logs', adminAuthMiddleware(['Developer']), async (req, res) => {
  try {
    const logs = await db.select().from(adminAuditLogs).orderBy(desc(adminAuditLogs.timestamp)).limit(500);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// ==========================================
// MEDIA CRUD OPERATIONS (Photos)
// ==========================================

router.get('/media/photos', adminAuthMiddleware(), async (req, res, next) => {
  try {
    const list = await db.select().from(photos).orderBy(desc(photos.createdAt));
    res.json(list);
  } catch (error) {
    next(error);
  }
});

router.put('/media/photos/:id', adminAuthMiddleware(), async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const adminEmail = (req as any).adminEmail;
    const body = req.body;
    
    // fetch prev
    const prev = await db.select().from(photos).where(eq(photos.id, id));
    if (prev.length === 0) return res.status(404).json({ error: 'Photo not found' });

    const updateData: any = {};
    const allowedFields = ['heading', 'subHeading', 'description', 'altText', 'tags', 'category', 'publishStatus', 'isStarred', 'displayOrder'];
    for (const key of allowedFields) {
      if (body[key] !== undefined) updateData[key] = body[key];
    }
    
    updateData.updatedAt = new Date();

    const [updated] = await db.update(photos).set(updateData).where(eq(photos.id, id)).returning();
    
    await logAdminAction({
      adminEmail,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      action: 'UPDATE_PHOTO',
      resourceType: 'photo',
      resourceId: id,
      previousValue: prev[0],
      newValue: updated,
      status: 'success'
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.delete('/media/photos/:id', adminAuthMiddleware(), async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const adminEmail = (req as any).adminEmail;

    const prev = await db.select().from(photos).where(eq(photos.id, id));
    if (prev.length === 0) return res.status(404).json({ error: 'Photo not found' });

    const [updated] = await db.update(photos).set({ publishStatus: 'archived', updatedAt: new Date() }).where(eq(photos.id, id)).returning();

    await logAdminAction({
      adminEmail,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      action: 'SOFT_DELETE_PHOTO',
      resourceType: 'photo',
      resourceId: id,
      previousValue: prev[0],
      newValue: updated,
      status: 'success'
    });
    res.json({ success: true, message: 'Photo archived (soft deleted)' });
  } catch (error) {
    next(error);
  }
});

// ==========================================
// MEDIA CRUD OPERATIONS (Videos)
// ==========================================

router.get('/media/videos', adminAuthMiddleware(), async (req, res, next) => {
  try {
    const list = await db.select().from(videos).orderBy(desc(videos.createdAt));
    res.json(list);
  } catch (error) {
    next(error);
  }
});

router.put('/media/videos/:id', adminAuthMiddleware(), async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const adminEmail = (req as any).adminEmail;
    const body = req.body;
    
    const prev = await db.select().from(videos).where(eq(videos.id, id));
    if (prev.length === 0) return res.status(404).json({ error: 'Video not found' });

    const updateData: any = {};
    const allowedFields = ['heading', 'subHeading', 'description', 'tags', 'category', 'publishStatus', 'isStarred', 'displayOrder'];
    for (const key of allowedFields) {
      if (body[key] !== undefined) updateData[key] = body[key];
    }
    
    updateData.updatedAt = new Date();

    const [updated] = await db.update(videos).set(updateData).where(eq(videos.id, id)).returning();
    
    await logAdminAction({
      adminEmail,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      action: 'UPDATE_VIDEO',
      resourceType: 'video',
      resourceId: id,
      previousValue: prev[0],
      newValue: updated,
      status: 'success'
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.delete('/media/videos/:id', adminAuthMiddleware(), async (req, res, next) => {
  try {
    const id = String(req.params.id);
    const adminEmail = (req as any).adminEmail;

    const prev = await db.select().from(videos).where(eq(videos.id, id));
    if (prev.length === 0) return res.status(404).json({ error: 'Video not found' });

    const [updated] = await db.update(videos).set({ publishStatus: 'archived', updatedAt: new Date() }).where(eq(videos.id, id)).returning();

    await logAdminAction({
      adminEmail,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      action: 'SOFT_DELETE_VIDEO',
      resourceType: 'video',
      resourceId: id,
      previousValue: prev[0],
      newValue: updated,
      status: 'success'
    });
    res.json({ success: true, message: 'Video archived (soft deleted)' });
  } catch (error) {
    next(error);
  }
});

export default router;

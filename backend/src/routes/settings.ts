import { Router } from 'express';
import { db } from '../db';
import { siteSettings } from '../db/schema';
import { eq } from 'drizzle-orm';
import { adminAuthMiddleware } from '../middleware/rbac';
import { logAdminAction } from './admin';

const router = Router();

// Get settings
router.get('/', async (req, res, next) => {
  try {
    const list = await db.select().from(siteSettings);
    const settingsMap = list.reduce((acc, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {} as Record<string, string>);
    res.json(settingsMap);
  } catch (error) {
    next(error);
  }
});

// Update settings (Admin only)
router.put('/', adminAuthMiddleware(), async (req, res, next) => {
  try {
    const adminEmail = (req as any).adminEmail;
    const body = req.body; // e.g. { "hero_heading": "Brand Stories", ... }
    
    for (const [key, value] of Object.entries(body)) {
      if (typeof value === 'string') {
        const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
        if (existing.length > 0) {
          await db.update(siteSettings).set({ value, updatedAt: new Date() }).where(eq(siteSettings.key, key));
        } else {
          await db.insert(siteSettings).values({ key, value });
        }
      }
    }

    await logAdminAction({
      adminEmail,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      action: 'UPDATE_SETTINGS',
      resourceType: 'site_settings',
      newValue: body,
      status: 'success'
    });

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;

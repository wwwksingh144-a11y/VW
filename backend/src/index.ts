import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './db';
import { projects, insights, userProfiles } from './db/schema';
import { eq } from 'drizzle-orm';
import videoRoutes from './routes/videos';
import photoRoutes from './routes/photos';
import adminRoutes from './routes/admin';
import settingsRoutes from './routes/settings';
import './worker';
import './photoWorker';
import { authRateLimitMiddleware, publicRateLimitMiddleware, userActionRateLimitMiddleware } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import { validateBody, ProjectSchema, InsightSchema, UserProfileSchema } from './validators';


dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Video Processing API
app.use('/api/videos', userActionRateLimitMiddleware, videoRoutes);

// Photo Processing API
app.use('/api/photos', userActionRateLimitMiddleware, photoRoutes);

// Admin APIs (Auth, Logs, Dual-OTP Promotion)
app.use('/api/admin', adminRoutes);

// Settings API
app.use('/api/settings', settingsRoutes);

// Health check
app.get('/health', publicRateLimitMiddleware, (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});
app.get('/', publicRateLimitMiddleware, (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});


// Projects API
app.get('/api/projects', publicRateLimitMiddleware, async (req, res, next) => {
  try {
    const allProjects = await db.select().from(projects);
    res.json(allProjects);
  } catch (error) {
    next(error);
  }
});

app.post('/api/projects', authRateLimitMiddleware, validateBody(ProjectSchema), async (req, res, next) => {
  try {
    const project = await db.insert(projects).values(req.body).returning();
    res.json(project[0]);
  } catch (error) {
    next(error);
  }
});

app.put('/api/projects/:id', authRateLimitMiddleware, validateBody(ProjectSchema), async (req, res, next) => {
  try {
    const project = await db.update(projects).set({ ...req.body, updatedAt: new Date() }).where(eq(projects.id, parseInt(req.params.id as string))).returning();
    res.json(project[0]);
  } catch (error) {
    next(error);
  }
});

app.delete('/api/projects/:id', authRateLimitMiddleware, async (req, res, next) => {
  try {
    await db.delete(projects).where(eq(projects.id, parseInt(req.params.id as string)));
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// Insights API
app.get('/api/insights', publicRateLimitMiddleware, async (req, res, next) => {
  try {
    const allInsights = await db.select().from(insights);
    res.json(allInsights);
  } catch (error) {
    next(error);
  }
});

app.post('/api/insights', authRateLimitMiddleware, validateBody(InsightSchema), async (req, res, next) => {
  try {
    const insight = await db.insert(insights).values(req.body).returning();
    res.json(insight[0]);
  } catch (error) {
    next(error);
  }
});

// User Profiles API
app.get('/api/user-profiles', publicRateLimitMiddleware, async (req, res, next) => {
  try {
    const profiles = await db.select().from(userProfiles);
    res.json(profiles);
  } catch (error) {
    next(error);
  }
});

app.get('/api/user-profiles/:userId', publicRateLimitMiddleware, async (req, res, next) => {
  try {
    const profile = await db.select().from(userProfiles).where(eq(userProfiles.userId, req.params.userId as string));
    if (profile.length === 0) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    res.json(profile[0]);
  } catch (error) {
    next(error);
  }
});

app.post('/api/user-profiles', authRateLimitMiddleware, validateBody(UserProfileSchema), async (req, res, next) => {
  try {
    const profile = await db.insert(userProfiles).values(req.body).returning();
    res.json(profile[0]);
  } catch (error) {
    next(error);
  }
});

// Global Error Handler
app.use(errorHandler);

app.listen(port, () => {
  console.log(`Backend server running on port ${port}`);
});

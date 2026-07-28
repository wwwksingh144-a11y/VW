import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

// Strict schema for Project creation/update
export const ProjectSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  status: z.enum(['active', 'archived', 'draft']).optional(),
}).strict();

// Strict schema for Insight creation
export const InsightSchema = z.object({
  title: z.string().min(1).max(255),
  content: z.string(),
  projectId: z.number().int().positive().optional(),
}).strict();

// Strict schema for User Profile creation/update
export const UserProfileSchema = z.object({
  userId: z.string().min(1).max(255),
  displayName: z.string().min(1).max(255).optional(),
  bio: z.string().optional(),
}).strict();


// Generic validation middleware factory
export const validateBody = (schema: z.ZodTypeAny) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      // parse will strip out unknown properties because we used .strict() or .parse()
      // Wait, .strict() throws an error if unknown properties exist.
      const parsedData = schema.parse(req.body);
      req.body = parsedData; // Replace req.body with validated, typed data
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.issues });
      }
      next(error);
    }
  };
};

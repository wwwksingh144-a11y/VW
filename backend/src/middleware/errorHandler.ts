import { Request, Response, NextFunction } from 'express';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Error:', err);

  const statusCode = err.statusCode || 500;
  
  // Return generic error message to the client, preventing leakage
  res.status(statusCode).json({
    error: statusCode === 500 ? 'Internal Server Error' : err.message || 'An error occurred',
  });
};

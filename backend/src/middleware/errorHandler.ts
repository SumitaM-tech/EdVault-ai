import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors.map((e) => ({ path: e.path.join('.'), message: e.message })),
    });
  }

  if (err instanceof Error) {
    const status = (err as Error & { status?: number }).status ?? 500;
    if (status >= 500 && status !== 502 && status !== 503) console.error(err);
    const message = status === 500 ? 'Internal server error' : err.message;
    return res.status(status).json({ error: message });
  }

  return res.status(500).json({ error: 'Internal server error' });
}

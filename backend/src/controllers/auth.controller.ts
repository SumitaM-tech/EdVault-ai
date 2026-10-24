import { Request, Response, NextFunction } from 'express';
import { loginSchema } from '../validators/auth.validator.js';
import { loginUser } from '../services/auth.service.js';

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const input = loginSchema.parse(req.body);
    const result = await loginUser(input);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

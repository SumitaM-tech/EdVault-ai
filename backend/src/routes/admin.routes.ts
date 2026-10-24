import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, requireRoles, type AuthRequest } from '../middleware/auth.js';
import { ADMIN_ONLY, ROLES } from '../config/permissions.js';
import { generateTemporaryPassword } from '../config/env.js';

const router = Router();
router.use(authMiddleware, requireRoles(...ADMIN_ONLY));

const publicUser = { id: true, email: true, name: true, role: true, institution: true, createdAt: true } as const;

router.get('/users', async (_req, res, next) => {
  try { res.json(await prisma.user.findMany({ select: publicUser, orderBy: { createdAt: 'desc' }, take: 200 })); }
  catch (err) { next(err); }
});

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2).max(100),
  role: z.enum(ROLES),
  institution: z.string().max(150).optional(),
});

router.post('/users', async (req, res, next) => {
  try {
    const input = createSchema.parse(req.body);
    if (await prisma.user.findUnique({ where: { email: input.email } })) {
      return res.status(409).json({ error: 'A user with this email already exists.' });
    }
    const temporaryPassword = generateTemporaryPassword();
    const user = await prisma.user.create({
      data: { ...input, passwordHash: await bcrypt.hash(temporaryPassword, 10) },
      select: publicUser,
    });
    // Shown once; the new user should change it after signing in.
    res.status(201).json({ user, temporaryPassword });
  } catch (err) { next(err); }
});

router.patch('/users/:id/role', async (req: AuthRequest, res, next) => {
  try {
    const { role } = z.object({ role: z.enum(ROLES) }).parse(req.body);
    if (req.params.id === req.user!.userId) return res.status(400).json({ error: 'You cannot change your own role.' });
    const existing = await prisma.user.findUnique({ where: { id: req.params.id }, select: { id: true } });
    if (!existing) return res.status(404).json({ error: 'User not found' });
    res.json(await prisma.user.update({ where: { id: req.params.id }, data: { role }, select: publicUser }));
  } catch (err) { next(err); }
});

export default router;

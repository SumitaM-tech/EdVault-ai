import { Router } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import {
  issueCredential, getCredential, verify, revoke, listAll, credentialAuditLog,
  dashboard, fraudInsights, me,
  searchStudents, aiSummary, ocrDocument, aiChat,
  complianceReport, shareCredential, sendEmail, accessLog,
} from '../controllers/credential.controller.js';
import { authMiddleware, requireRoles } from '../middleware/auth.js';
import { ADMIN_ONLY, STAFF, STAFF_AND_RECRUITER, SHARERS } from '../config/permissions.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

/** Public verification is rate-limited so credential ids cannot be enumerated. */
export const verifyLimiter = rateLimit({
  windowMs: 60_000,
  limit: process.env.NODE_ENV === 'test' ? 10_000 : 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many verification requests, please try again in a minute.' },
});

const ADMIN_FACULTY = STAFF;

const router = Router();

// Credential detail: authenticated; students can only open their own (enforced in the service)
router.get('/:id', authMiddleware, getCredential);
router.get('/:id/audit-log', authMiddleware, requireRoles(...ADMIN_FACULTY), credentialAuditLog);

// Issue (optional PDF), revoke, share
router.post('/', authMiddleware, requireRoles(...ADMIN_FACULTY), upload.single('pdf'), issueCredential);
router.post('/:id/revoke', authMiddleware, requireRoles(...ADMIN_FACULTY), revoke);
router.post('/:id/share', authMiddleware, requireRoles(...SHARERS), shareCredential);

export default router;

const extraRouter = Router();

// Dashboard & analytics (staff only)
extraRouter.get('/dashboard/summary',   authMiddleware, requireRoles(...ADMIN_FACULTY), dashboard);
extraRouter.get('/fraud/insights',      authMiddleware, requireRoles(...ADMIN_ONLY), fraudInsights);
extraRouter.get('/access-log',          authMiddleware, requireRoles(...ADMIN_ONLY), accessLog);

// Listing / search: authenticated and scoped by role
extraRouter.get('/credentials',         authMiddleware, listAll);
extraRouter.get('/students/me',         authMiddleware, me);
extraRouter.get('/students/search',     authMiddleware, requireRoles(...STAFF_AND_RECRUITER), searchStudents);

// Public verification (rate-limited, returns no contact details)
extraRouter.get('/verify/:id',          verifyLimiter, verify);
extraRouter.post('/verify/:id',         verifyLimiter, upload.single('file'), verify);

// AI endpoints (all authenticated)
extraRouter.get('/ai/summary',          authMiddleware, aiSummary);
extraRouter.post('/ai/ocr',             authMiddleware, requireRoles(...ADMIN_FACULTY), upload.single('file'), ocrDocument);
extraRouter.post('/ai/chat',            authMiddleware, aiChat);
extraRouter.get('/ai/compliance-report', authMiddleware, requireRoles(...ADMIN_ONLY), complianceReport);

// Email
extraRouter.post('/email/send',         authMiddleware, requireRoles(...ADMIN_FACULTY), sendEmail);

export { extraRouter };

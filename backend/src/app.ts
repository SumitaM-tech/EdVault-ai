import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.routes.js';
import credentialRoutes, { extraRouter } from './routes/credential.routes.js';
import adminRoutes from './routes/admin.routes.js';
import identityRoutes from './routes/identity.routes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { env } from './config/env.js';
import { blockchainService } from './services/blockchain.service.js';
import { ipfsService } from './services/ipfs.service.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(helmet());

  const allowedOrigins = [env.CORS_ORIGIN, env.FRONTEND_URL];
  const isLocalDev = (origin: string) => /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);

  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
      if (env.NODE_ENV !== 'production' && isLocalDev(origin)) return callback(null, true);
      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
  }));

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // Reports which backing services are real and which are simulated.
  app.get('/health', (_req, res) => res.json({
    status: 'ok',
    service: 'edvault-api',
    blockchain: blockchainService.getStatus(),
    ipfs: { mode: ipfsService.mode },
  }));

  const loginLimiter = rateLimit({
    windowMs: 60_000,
    limit: env.NODE_ENV === 'test' ? 10_000 : 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts, please try again in a minute.' },
  });
  app.use('/auth', loginLimiter, authRoutes);
  app.use('/credentials', credentialRoutes);
  app.use('/admin', adminRoutes);
  app.use('/', identityRoutes);
  app.use('/', extraRouter);

  app.use((_req, res) => res.status(404).json({ error: 'Not found' }));
  app.use(errorHandler);
  return app;
}

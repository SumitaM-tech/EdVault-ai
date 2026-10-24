import { createApp } from './app.js';
import { env } from './config/env.js';
import { blockchainService } from './services/blockchain.service.js';
import { prisma } from './lib/prisma.js';

async function main() {
  try {
    await blockchainService.init();
  } catch (err) {
    console.warn('Blockchain init skipped:', (err as Error).message);
  }

  try {
    await prisma.$connect();
    console.log('Database connected');
  } catch (err) {
    console.warn('Database unavailable — API will start but data routes may fail:', (err as Error).message);
  }

  const app = createApp();

  app.listen(env.PORT, () => {
    console.log(`EdVault API running on http://localhost:${env.PORT}`);
  });
}

main().catch(async (err) => {
  console.error('Failed to start server:', err);
  await prisma.$disconnect();
  process.exit(1);
});

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

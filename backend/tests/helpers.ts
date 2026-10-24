import { vi } from 'vitest';

/** A minimal in-memory stand-in for the Prisma client (no database needed). */
export function makePrismaMock() {
  return {
    user: { findFirst: vi.fn(), findUnique: vi.fn(), create: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    credential: { findFirst: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
    verificationLog: { create: vi.fn(), findMany: vi.fn(), count: vi.fn() },
    iPFSDocument: { upsert: vi.fn() },
    $connect: vi.fn(),
    $disconnect: vi.fn(),
  };
}

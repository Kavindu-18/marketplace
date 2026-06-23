/**
 * One-shot admin seeder. Run with:
 *   ADMIN_EMAIL=admin@marketplace.lk ADMIN_PASSWORD=ChangeMe123 \
 *   npx ts-node src/seed/seed-admin.ts
 *
 * Uses PrismaClient directly — no NestJS overhead.
 * Idempotent: upsert on email.
 */
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

async function main(): Promise<void> {
  const email = process.env.ADMIN_EMAIL ?? 'admin@marketplace.lk';
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error('ADMIN_PASSWORD environment variable is required');
  }

  const prisma = new PrismaClient();
  try {
    const passwordHash = await argon2.hash(password);
    const admin = await prisma.user.upsert({
      where: { email },
      update: { passwordHash },
      create: { email, passwordHash, role: 'ADMIN', status: 'ACTIVE' },
    });
    console.log(`Admin user ready: ${admin.email} (id: ${admin.id})`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

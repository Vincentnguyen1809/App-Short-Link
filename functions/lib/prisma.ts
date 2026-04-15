import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

let prisma: PrismaClient;

export function getPrisma(env: any) {
  if (!prisma) {
    const pool = new Pool({ connectionString: env.DATABASE_URL });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
  }
  return prisma;
}

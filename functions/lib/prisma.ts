import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';

let prisma: PrismaClient | null = null;

export function getPrisma(env: { DATABASE_URL: string }) {
  if (!prisma) {
    prisma = new PrismaClient({
      datasourceUrl: env.DATABASE_URL,
    }).$extends(withAccelerate()) as PrismaClient;
  }

  return prisma;
}

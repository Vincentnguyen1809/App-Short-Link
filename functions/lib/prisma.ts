import { PrismaClient } from '@prisma/client/edge';

let prisma: PrismaClient;

export function getPrisma(env: any) {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: env.DATABASE_URL,
        },
      },
    });
  }
  return prisma;
}

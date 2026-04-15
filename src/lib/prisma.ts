import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'

/**
 * Vincent lưu ý: 
 * Trên Cloudflare Pages, chúng ta sử dụng @prisma/client/edge
 * và không cần dùng biến global singleton như môi trường Node.js truyền thống.
 */
export const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
}).$extends(withAccelerate())

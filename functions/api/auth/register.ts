import { PrismaClient } from '@prisma/client/edge';

export const onRequestPost: PagesFunction = async (context) => {
  const { env } = context;
  const { email, password, name } = await context.request.json() as any;

  if (!email || !password) {
    return new Response(JSON.stringify({ error: 'Vui lòng điền đầy đủ thông tin' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Khởi tạo Prisma bản Edge (phù hợp cho Cloudflare)
  const prisma = new PrismaClient({
    datasources: { db: { url: env.DATABASE_URL } },
  });

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return new Response(JSON.stringify({ error: 'Email này đã được đăng ký' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Lưu dữ liệu vào Supabase
    await prisma.user.create({
      data: {
        email,
        password,
        fullName: name || '',
        role: 'USER',
        status: 'PENDING'
      }
    });

    return new Response(JSON.stringify({ 
      message: 'Đăng ký THÀNH CÔNG. Dữ liệu đã lưu vào Supabase!' 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Lỗi Database: ' + error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

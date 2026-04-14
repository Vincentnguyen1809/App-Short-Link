import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';

export const onRequestPost: PagesFunction = async (context) => {
  const { env } = context;
  const { email, password, name } = await context.request.json() as any;

  // 1. Kiểm tra đầu vào
  if (!email || !password) {
    return new Response(JSON.stringify({ error: 'Vui lòng điền đầy đủ thông tin' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // 2. Khởi tạo Prisma kết nối tới Supabase
  const prisma = new PrismaClient({
    datasources: { db: { url: env.DATABASE_URL } },
  }).$extends(withAccelerate());

  try {
    // 3. Kiểm tra xem email đã tồn tại chưa
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return new Response(JSON.stringify({ error: 'Email này đã được đăng ký' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 4. LƯU THẬT VÀO DATABASE
    await prisma.user.create({
      data: {
        email,
        password, // Lưu ý: Trong thực tế nên mã hóa password, nhưng hiện tại hãy làm cho nó chạy đã
        fullName: name || '',
        role: 'USER',
        status: 'PENDING'
      }
    });

    return new Response(JSON.stringify({ 
      message: 'Đăng ký THÀNH CÔNG THẬT. Dữ liệu đã được lưu vào Supabase!' 
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

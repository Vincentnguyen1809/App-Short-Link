import { getPrisma } from '../../lib/prisma';

export const onRequestGet: PagesFunction = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return Response.redirect(`${url.origin}/login?error=Thiếu token xác nhận`, 302);
  }

  const prisma = getPrisma(env);
  const dbConnected = !!(env as any).DATABASE_URL && ((env as any).DATABASE_URL.startsWith('postgresql://') || (env as any).DATABASE_URL.startsWith('postgres://'));

  if (!dbConnected) {
    return Response.redirect(`${url.origin}/login?error=Lỗi kết nối cơ sở dữ liệu`, 302);
  }

  try {
    const user = await prisma.user.findFirst({
      where: { verificationToken: token }
    });

    if (!user) {
      return Response.redirect(`${url.origin}/login?error=Token không hợp lệ hoặc đã hết hạn`, 302);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        status: 'ACTIVE',
        verificationToken: null
      }
    });

    return Response.redirect(`${url.origin}/login?success=Xác nhận email thành công. Bạn đã có thể đăng nhập!`, 302);
  } catch (error) {
    console.error('Verification error:', error);
    return Response.redirect(`${url.origin}/login?error=Đã có lỗi xảy ra. Vui lòng thử lại.`, 302);
  }
};

import { getPrisma } from '../../lib/prisma';

export const onRequestGet: PagesFunction = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const token = url.searchParams.get('token');

  if (!token) {
    return Response.redirect(`${url.origin}/login?error=Thiếu token xác nhận`, 302);
  }

  if (!(env as { DATABASE_URL?: string }).DATABASE_URL?.startsWith('prisma://')) {
    return Response.redirect(`${url.origin}/login?error=Lỗi kết nối cơ sở dữ liệu`, 302);
  }

  const prisma = getPrisma(env as { DATABASE_URL: string });

  try {
    const user = await prisma.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      return Response.redirect(`${url.origin}/login?error=Token không hợp lệ hoặc đã hết hạn`, 302);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        status: 'ACTIVE',
        verificationToken: null,
      },
    });

    return Response.redirect(`${url.origin}/login?success=Xác nhận email thành công. Bạn đã có thể đăng nhập!`, 302);
  } catch (error) {
    const err = error as Error;
    const details = encodeURIComponent(
      JSON.stringify({
        name: err.name,
        message: err.message,
        stack: err.stack,
      }),
    );
    return Response.redirect(`${url.origin}/login?error=Đã có lỗi xảy ra&details=${details}`, 302);
  }
};

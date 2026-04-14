import { getPrisma } from '../../lib/prisma';

export const onRequestPost: PagesFunction = async (context) => {
  const { request, env } = context;
  const { email, password, name } = await request.json() as any;

  if (!email || !password) {
    return new Response(JSON.stringify({ error: 'Vui lòng điền đầy đủ thông tin' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const prisma = getPrisma(env);
  const dbConnected = !!(env as any).DATABASE_URL && ((env as any).DATABASE_URL.startsWith('postgresql://') || (env as any).DATABASE_URL.startsWith('postgres://'));

  if (!dbConnected) {
    return new Response(JSON.stringify({ error: 'Database not connected' }), { status: 503 });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return new Response(JSON.stringify({ error: 'Email đã được sử dụng' }), { status: 400 });
    }

    const verificationToken = crypto.randomUUID();
    
    // In a real app, hash the password. For this demo, we store it directly as per original mock.
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: password,
        role: 'MEMBER',
        status: 'PENDING',
        verificationToken
      }
    });

    const resendApiKey = (env as any).RESEND_API_KEY;
    const domain = (env as any).DOMAIN || new URL(request.url).origin;

    if (resendApiKey) {
      const verifyLink = `${domain}/api/auth/verify?token=${verificationToken}`;
      
      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #333; text-align: center;">Xác nhận tài khoản ThinkSmart Links</h2>
          <p style="color: #555; font-size: 16px;">Xin chào ${name || email},</p>
          <p style="color: #555; font-size: 16px;">Cảm ơn bạn đã đăng ký tài khoản. Vui lòng click vào nút bên dưới để xác nhận email của bạn:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyLink}" style="background-color: #f97316; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Xác nhận Email</a>
          </div>
          <p style="color: #777; font-size: 14px; text-align: center;">Hoặc copy link này dán vào trình duyệt: <br> <a href="${verifyLink}" style="color: #f97316;">${verifyLink}</a></p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px; text-align: center;">Nếu bạn không yêu cầu đăng ký, vui lòng bỏ qua email này.</p>
        </div>
      `;

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'ThinkSmart Links <noreply@link.thinksmartins.com>',
          to: email,
          subject: 'Xác nhận tài khoản ThinkSmart Links',
          html: emailHtml
        })
      });
    }

    return new Response(JSON.stringify({ 
      message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản.' 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return new Response(JSON.stringify({ error: 'Đã có lỗi xảy ra. Vui lòng thử lại.' }), { status: 500 });
  }
};

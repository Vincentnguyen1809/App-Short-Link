import { PrismaClient } from '@prisma/client/edge';

export const onRequestPost: PagesFunction = async (context) => {
  const { env } = context;
  const { email, password, name } = await context.request.json() as any;

  if (!email || !password) {
    return new Response(JSON.stringify({ error: 'Vui lòng điền đầy đủ thông tin' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  const prisma = new PrismaClient({
    datasources: { db: { url: env.DATABASE_URL } },
  });

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return new Response(JSON.stringify({ error: 'Email này đã được đăng ký' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    // 1. Generate Token
    const verificationToken = crypto.randomUUID();

    // 2. Save to Database
    await prisma.user.create({
      data: {
        email,
        password,
        fullName: name || '',
        role: 'USER',
        status: 'PENDING',
        verificationToken: verificationToken
      }
    });

    // 3. Send Email via Resend
    const verifyUrl = `https://app.thinksmartins.com/api/auth/verify?token=${verificationToken}`;
    
    const resendReq = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'ThinkSmart Links <noreply@link.thinksmartins.com>',
        to: email,
        subject: 'Xác nhận tài khoản ThinkSmart Links',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h2 style="color: #ff6600; text-align: center;">ThinkSmart Links</h2>
            <p>Chào bạn,</p>
            <p>Cảm ơn bạn đã đăng ký tài khoản. Vui lòng nhấn vào nút bên dưới để xác nhận email:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verifyUrl}" style="background-color: #ff6600; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Xác nhận Email ngay</a>
            </div>
          </div>
        `
      })
    });

    if (!resendReq.ok) {
      console.error('Lỗi gửi email', await resendReq.text());
    }

    return new Response(JSON.stringify({ 
      message: 'Đăng ký thành công! Vui lòng kiểm tra email để xác nhận.' 
    }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: 'Lỗi hệ thống: ' + error.message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
};

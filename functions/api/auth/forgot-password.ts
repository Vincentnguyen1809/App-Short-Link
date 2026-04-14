export const onRequestPost: PagesFunction = async (context) => {
  const { request } = context;
  const { email } = await request.json() as any;

  if (!email) {
    return new Response(JSON.stringify({ error: 'Vui lòng nhập email' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Mock logic
  console.log(`Password reset requested for: ${email}`);
  
  return new Response(JSON.stringify({ 
    message: 'Yêu cầu đã được gửi. Vui lòng kiểm tra email của bạn để lấy lại mật khẩu.' 
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
};

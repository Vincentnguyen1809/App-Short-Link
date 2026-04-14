export const onRequestPost: PagesFunction = async (context) => {
  const { request } = context;
  const { email, password, name } = await request.json() as any;

  if (!email || !password) {
    return new Response(JSON.stringify({ error: 'Vui lòng điền đầy đủ thông tin' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Note: In a real serverless environment, we can't use a global array like server.ts.
  // This would typically go into a database. For now, we'll just return success 
  // to match the original mock logic's intent, but acknowledge the limitation.
  
  return new Response(JSON.stringify({ 
    message: 'Đăng ký thành công. Vui lòng chờ Admin phê duyệt tài khoản của bạn.' 
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
};

export const onRequestPost: PagesFunction = async (context) => {
  const { request, env } = context;
  const { email, password } = await request.json() as any;

  // Simple mock authentication (matching server.ts logic)
  if (email === 'admin@thinksmartins.com' && password === 'admin123') {
    return new Response(JSON.stringify({ 
      token: 'mock-jwt-token-123', 
      user: { email, name: 'Admin', role: 'ADMIN' } 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } else {
    return new Response(JSON.stringify({ 
      error: 'Email hoặc mật khẩu không chính xác hoặc tài khoản chưa được phê duyệt' 
    }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

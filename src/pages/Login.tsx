import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/login', formData);
      localStorage.setItem('token', res.data.token);
      // Đăng nhập xong vào thẳng Dashboard
      navigate('/dashboard');
    } catch (err: any) {
      alert(err.response?.data?.error || 'Email hoặc mật khẩu không đúng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-4">
      <form onSubmit={handleLogin} className="bg-gray-800 p-8 rounded-xl shadow-2xl w-full max-w-md border border-gray-700">
        <h2 className="text-3xl font-bold mb-2 text-blue-500 text-center">Đăng nhập</h2>
        <p className="text-gray-400 text-center mb-8">Hệ thống quản lý Link</p>

        <div className="space-y-4">
          <input 
            type="email" placeholder="Email của bạn" required
            className="w-full p-4 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none" 
            onChange={e => setFormData({...formData, email: e.target.value})} 
          />
          <input 
            type="password" placeholder="Mật khẩu" required
            className="w-full p-4 rounded bg-gray-700 border border-gray-600 focus:border-blue-500 outline-none" 
            onChange={e => setFormData({...formData, password: e.target.value})} 
          />
        </div>

        <button 
          disabled={loading}
          className="w-full bg-blue-600 mt-8 p-4 rounded-lg font-bold hover:bg-blue-700 transition active:scale-95 disabled:opacity-50"
        >
          {loading ? 'Đang xác thực...' : 'Vào hệ thống'}
        </button>

        <p className="mt-6 text-center text-sm text-gray-500">
          Chưa có tài khoản? <span onClick={() => navigate('/register')} className="text-blue-400 cursor-pointer hover:underline">Đăng ký ngay</span>
        </p>
      </form>
    </div>
  );
};

export default Login;

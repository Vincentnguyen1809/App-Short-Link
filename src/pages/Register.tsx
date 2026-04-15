import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [formData, setFormData] = useState({ email: '', password: '', name: '' });
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post('/api/auth/register', formData);
      setMsg(res.data.message || 'Đăng ký thành công!');
      // Tự động nhảy về trang Login sau 3 giây để người dùng đăng nhập
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setMsg(err.response?.data?.error || 'Lỗi đăng ký, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <form onSubmit={handleSubmit} className="bg-gray-800 p-8 rounded-xl shadow-lg w-96 border border-gray-700">
        <h2 className="text-2xl font-bold mb-6 text-orange-500 text-center">ThinkSmart Links</h2>
        <p className="text-gray-400 text-sm mb-6 text-center">Đăng ký tài khoản hệ thống</p>
        
        {msg && (
          <div className={`mb-4 p-3 rounded text-sm text-center ${msg.includes('thành công') ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
            {msg}
          </div>
        )}

        <div className="space-y-4">
          <input 
            type="text" placeholder="Họ và tên" required
            className="w-full p-3 rounded bg-gray-700 border border-gray-600 focus:border-orange-500 outline-none" 
            onChange={e => setFormData({...formData, name: e.target.value})} 
          />
          <input 
            type="email" placeholder="Email" required
            className="w-full p-3 rounded bg-gray-700 border border-gray-600 focus:border-orange-500 outline-none" 
            onChange={e => setFormData({...formData, email: e.target.value})} 
          />
          <input 
            type="password" placeholder="Mật khẩu" required
            className="w-full p-3 rounded bg-gray-700 border border-gray-600 focus:border-orange-500 outline-none" 
            onChange={e => setFormData({...formData, password: e.target.value})} 
          />
        </div>

        <button 
          disabled={loading}
          className="w-full bg-orange-600 mt-6 p-3 rounded font-bold hover:bg-orange-700 transition active:scale-95 disabled:opacity-50"
        >
          {loading ? 'Đang xử lý...' : 'Đăng ký ngay'}
        </button>
        
        <p className="mt-4 text-center text-sm text-gray-500">
          Đã có tài khoản? <span onClick={() => navigate('/login')} className="text-orange-400 cursor-pointer hover:underline">Đăng nhập</span>
        </p>
      </form>
    </div>
  );
};

export default Register;

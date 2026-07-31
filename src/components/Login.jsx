'use client';
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function Login() {
  const { login, theme } = useApp();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!phone || !password) {
      setError('يرجى إدخال رقم الهاتف وكلمة المرور');
      return;
    }

    setLoading(true);
    const res = await login(phone, password);
    if (!res.success) {
      setError(res.message);
    }
    setLoading(false);
  };

  return (
    <div className="login-container" dir="rtl">
      <div className="login-card glass-panel">
        <div className="login-logo">
          <img src={theme === 'dark' ? "/logo-white.png" : "/logo-color.png"} alt="Tamowil Logo" />
        </div>
        
        <h2 className="login-title">تسجيل الدخول للموظفين</h2>
        <p className="login-subtitle">نظام إدارة العمليات السحابي - شركة تمويل</p>

        <form onSubmit={handleLogin} className="login-form">
          {error && <div className="login-error">{error}</div>}
          
          <div className="form-group">
            <label>رقم الهاتف / اسم المستخدم</label>
            <input 
              type="text" 
              className="glass-input" 
              placeholder="أدخل رقم الهاتف"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label>كلمة المرور</label>
            <input 
              type="password" 
              className="glass-input" 
              placeholder="أدخل كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', marginTop: '10px', height: '45px', fontSize: '16px' }}
            disabled={loading}
          >
            {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
          </button>
        </form>
      </div>

      <style>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-primary);
          padding: 20px;
          background-image: radial-gradient(circle at top right, rgba(0,255,170,0.1) 0%, transparent 40%),
                            radial-gradient(circle at bottom left, rgba(0,195,255,0.1) 0%, transparent 40%);
        }
        .login-card {
          width: 100%;
          max-width: 400px;
          padding: 40px 30px;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          text-align: center;
        }
        .login-logo {
          margin-bottom: 20px;
        }
        .login-logo img {
          height: 80px;
          object-fit: contain;
        }
        .login-title {
          font-size: 22px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 8px;
        }
        .login-subtitle {
          font-size: 14px;
          color: var(--text-secondary);
          margin-bottom: 30px;
        }
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
          text-align: right;
        }
        .form-group label {
          display: block;
          font-size: 14px;
          margin-bottom: 8px;
          color: var(--text-primary);
          font-weight: 500;
        }
        .login-error {
          background: rgba(255, 71, 87, 0.1);
          color: #ff4757;
          padding: 10px;
          border-radius: 8px;
          font-size: 14px;
          text-align: center;
          border: 1px solid rgba(255, 71, 87, 0.2);
        }
      `}</style>
    </div>
  );
}

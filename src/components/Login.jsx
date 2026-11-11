'use client';
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function Login() {
  const { login, theme, toggleTheme } = useApp();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!phone || !password) {
      setError('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    setLoading(true);
    const res = await login(phone.trim(), password);
    if (!res.success) {
      setError(res.message);
    }
    setLoading(false);
  };

  return (
    <div className="pro-login-page" dir="rtl">
      {/* Subtle Ambient Background Grid & Glow Orbs */}
      <div className="pro-login-ambient" aria-hidden="true">
        <div className="pro-orb pro-orb-1" />
        <div className="pro-orb pro-orb-2" />
        <div className="pro-orb pro-orb-3" />
        <div className="pro-grid-pattern" />
      </div>

      {/* Main Split Container */}
      <div className="pro-login-shell">
        {/* Right Column: Enterprise Brand & Architecture Showcase */}
        <div className="pro-showcase-panel">
          <div className="pro-showcase-top">
            <div className="pro-brand-header">
              <div className="pro-logo-box">
                <img
                  src={theme === 'dark' ? '/logo-white.png' : '/logo-color.png'}
                  alt="Tamowil Logo"
                />
              </div>
              <span className="pro-version-pill">
                <span className="pro-status-dot" />
                Enterprise Cloud v3.5
              </span>
            </div>

            <h1 className="pro-showcase-title">
              منصة <span className="pro-gradient-text">تمويل</span> الذكية لإدارة العمليات اللوجستية والمالية
            </h1>
            <p className="pro-showcase-desc">
              نظام سحابي متكامل يربط الإدارة المركزية، الفروع المستقلة، الخزائن النقدية، تسويات المناديب، ومحافظ التجار بدقة محاسبية لحظية وعزل أمني كامل.
            </p>

            {/* Feature Cards */}
            <div className="pro-feature-list">
              <div className="pro-feature-item">
                <div className="pro-feature-icon" style={{ background: 'rgba(16, 185, 129, 0.14)', color: '#10B981' }}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <polyline points="9 12 11 14 15 10" />
                  </svg>
                </div>
                <div>
                  <h3>دقة محاسبية ورقابة مالية صارمة</h3>
                  <p>إدارة الخزينة الرئيسية وخزائن العُهد الميدانية وتسويات التجار والمناديب آلياً دون أي تضارب.</p>
                </div>
              </div>

              <div className="pro-feature-item">
                <div className="pro-feature-icon" style={{ background: 'rgba(99, 102, 241, 0.14)', color: '#818CF8' }}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                    <path d="M9 22v-4h6v4" />
                    <path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01" />
                  </svg>
                </div>
                <div>
                  <h3>نظام فروع مستقلة بمعزل كامل</h3>
                  <p>لكل فرع حساب إدارة خاص به، خزائنه، مستخدموه، وشحناته المنفصلة عن المركز الرئيسي مع إشراف مركزي شامل.</p>
                </div>
              </div>

              <div className="pro-feature-item">
                <div className="pro-feature-icon" style={{ background: 'rgba(6, 182, 212, 0.14)', color: '#22D3EE' }}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <div>
                  <h3>تتبع لحظي وسجل تدقيق شامل</h3>
                  <p>مراقبة فورية لحالات الشحنات، الكشوفات، المينفيست، وسجل العمليات البرمجي والمحاسبي.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pro-showcase-footer">
            <div className="pro-security-badge">
              <svg width="16" height="16" fill="none" stroke="#10B981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>اتصال مشفر ومحمي بتقنية SSL 256-Bit • قواعد بيانات معزولة</span>
            </div>
          </div>
        </div>

        {/* Left Column: Clean Authentication Form Panel */}
        <div className="pro-auth-panel">
          {/* Top Utility Row */}
          <div className="pro-auth-topbar">
            <div className="pro-auth-portal-tag">
              <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span>بوابة الدخول الموحدة</span>
            </div>

            {toggleTheme && (
              <button
                type="button"
                onClick={toggleTheme}
                className="pro-theme-btn"
                title={theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}
              >
                {theme === 'dark' ? (
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                ) : (
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
                <span>{theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}</span>
              </button>
            )}
          </div>

          <div className="pro-auth-header">
            <h2 className="pro-auth-title">تسجيل الدخول</h2>
            <p className="pro-auth-subtitle">أدخل اسم المستخدم وكلمة المرور للوصول إلى لوحة التحكم</p>
          </div>

          {/* Sign-In Form */}
          <form onSubmit={handleLogin} className="pro-auth-form">
            {error && (
              <div className="pro-auth-error" role="alert">
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <div className="pro-field-group">
              <label htmlFor="login-username" className="pro-field-label">
                البريد الإلكتروني / اسم المستخدم
              </label>
              <div className="pro-input-wrapper">
                <span className="pro-input-icon" aria-hidden="true">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  id="login-username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  spellCheck={false}
                  autoCorrect="off"
                  autoCapitalize="none"
                  enterKeyHint="next"
                  required
                  className="pro-input"
                  placeholder="أدخل البريد الإلكتروني أو اسم المستخدم"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  dir="ltr"
                />
              </div>
            </div>

            <div className="pro-field-group">
              <label htmlFor="login-password" className="pro-field-label">
                كلمة المرور
              </label>
              <div className="pro-input-wrapper">
                <span className="pro-input-icon" aria-hidden="true">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  id="login-password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  enterKeyHint="done"
                  required
                  className="pro-input pro-input-password"
                  placeholder="أدخل كلمة المرور"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  dir="ltr"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="pro-pw-toggle"
                  aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                  title={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                >
                  {showPassword ? (
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="pro-submit-btn"
            >
              {loading ? (
                <>
                  <span className="pro-spinner" />
                  <span>جاري التحقق وفتح الجلسة...</span>
                </>
              ) : (
                <>
                  <span>تسجيل الدخول</span>
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="pro-auth-footer-note">
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>يتم توجيهك تلقائياً إلى النظام المخصص لحسابك فور التحقق من بيانات الدخول.</span>
          </div>
        </div>
      </div>

      <style>{`
        .pro-login-page {
          min-height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          position: relative;
          overflow: hidden;
          background: var(--bg-gradient-1);
        }

        .pro-login-ambient {
          position: fixed;
          inset: 0;
          pointer-events: none;
          z-index: 0;
          overflow: hidden;
        }

        .pro-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(95px);
          opacity: 0.35;
        }

        .pro-orb-1 {
          width: 520px;
          height: 520px;
          background: #10B981;
          top: -180px;
          right: -120px;
        }

        .pro-orb-2 {
          width: 560px;
          height: 560px;
          background: #6366F1;
          bottom: -220px;
          left: -140px;
        }

        .pro-orb-3 {
          width: 360px;
          height: 360px;
          background: #06B6D4;
          top: 40%;
          left: 35%;
          opacity: 0.18;
        }

        .pro-grid-pattern {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(to right, rgba(148, 163, 184, 0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(148, 163, 184, 0.06) 1px, transparent 1px);
          background-size: 36px 36px;
        }

        .pro-login-shell {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 1060px;
          min-height: 600px;
          display: grid;
          grid-template-columns: 1.08fr 0.92fr;
          border-radius: 28px;
          overflow: hidden;
          background: var(--card-bg);
          backdrop-filter: blur(28px) saturate(180%);
          -webkit-backdrop-filter: blur(28px) saturate(180%);
          border: 1px solid var(--glass-border);
          border-top: 1px solid var(--glass-top-highlight);
          box-shadow: 0 28px 80px rgba(0, 0, 0, 0.38);
        }

        /* ── Right Showcase Panel ── */
        .pro-showcase-panel {
          padding: 46px 44px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          background: linear-gradient(155deg, rgba(16, 185, 129, 0.09) 0%, rgba(99, 102, 241, 0.07) 55%, rgba(15, 23, 42, 0.25) 100%);
          border-left: 1px solid var(--glass-border);
          position: relative;
        }

        .pro-brand-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }

        .pro-logo-box img {
          height: 62px;
          width: auto;
          object-fit: contain;
        }

        .pro-version-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
          color: #10B981;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.28);
          direction: ltr;
        }

        .pro-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10B981;
          box-shadow: 0 0 10px #10B981;
        }

        .pro-showcase-title {
          font-size: 27px;
          font-weight: 900;
          line-height: 1.45;
          color: var(--text-primary);
          margin-bottom: 14px;
          letter-spacing: -0.3px;
        }

        .pro-gradient-text {
          background: linear-gradient(135deg, #10B981 0%, #34D399 50%, #60A5FA 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .pro-showcase-desc {
          font-size: 14px;
          line-height: 1.75;
          color: var(--text-secondary);
          margin-bottom: 30px;
        }

        .pro-feature-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .pro-feature-item {
          display: flex;
          align-items: flex-start;
          gap: 14px;
          padding: 15px 18px;
          border-radius: 18px;
          background: rgba(128, 128, 128, 0.05);
          border: 1px solid var(--glass-border);
          transition: transform 0.2s ease, border-color 0.2s ease;
        }

        .pro-feature-item:hover {
          transform: translateX(-4px);
          border-color: rgba(16, 185, 129, 0.3);
        }

        .pro-feature-icon {
          width: 42px;
          height: 42px;
          border-radius: 13px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .pro-feature-item h3 {
          font-size: 14px;
          font-weight: 800;
          color: var(--text-primary);
          margin: 0 0 4px 0;
        }

        .pro-feature-item p {
          font-size: 12.5px;
          line-height: 1.6;
          color: var(--text-secondary);
          margin: 0;
        }

        .pro-showcase-footer {
          margin-top: 28px;
          padding-top: 18px;
          border-top: 1px solid var(--glass-border);
        }

        .pro-security-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-secondary);
        }

        /* ── Left Auth Form Panel ── */
        .pro-auth-panel {
          padding: 48px 46px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: var(--glass-bg);
        }

        .pro-auth-topbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 32px;
        }

        .pro-auth-portal-tag {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 6px 13px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 800;
          color: var(--primary-color);
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.22);
        }

        .pro-theme-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 700;
          color: var(--text-secondary);
          background: rgba(128, 128, 128, 0.08);
          border: 1px solid var(--glass-border);
          cursor: pointer;
        }

        .pro-theme-btn:hover {
          color: var(--text-primary);
          background: rgba(128, 128, 128, 0.14);
        }

        .pro-auth-header {
          margin-bottom: 28px;
        }

        .pro-auth-title {
          font-size: 26px;
          font-weight: 900;
          color: var(--text-primary);
          margin: 0 0 8px 0;
          letter-spacing: -0.3px;
        }

        .pro-auth-subtitle {
          font-size: 14px;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.6;
        }

        /* ── Form Fields ── */
        .pro-auth-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .pro-auth-error {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 13px;
          background: rgba(239, 68, 68, 0.12);
          border: 1px solid rgba(239, 68, 68, 0.32);
          color: #F87171;
          font-size: 13px;
          font-weight: 700;
        }

        .pro-field-group {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .pro-field-label {
          font-size: 13.5px;
          font-weight: 800;
          color: var(--text-primary);
        }

        .pro-input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .pro-input-icon {
          position: absolute;
          right: 15px;
          color: var(--text-tertiary);
          display: inline-flex;
          align-items: center;
          pointer-events: none;
          z-index: 2;
        }

        .pro-input {
          width: 100%;
          height: 50px;
          padding: 10px 46px 10px 16px;
          border-radius: 14px;
          background: rgba(128, 128, 128, 0.07);
          border: 1px solid var(--glass-border);
          color: var(--text-primary);
          font-size: 14.5px;
          font-weight: 600;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;
        }

        .pro-input-password {
          padding-left: 46px;
        }

        .pro-input::placeholder {
          color: var(--text-tertiary);
          font-weight: 500;
          font-size: 13px;
          text-align: right;
        }

        .pro-input:focus {
          outline: none;
          border-color: var(--primary-color);
          box-shadow: 0 0 0 3px var(--primary-glow);
          background: rgba(128, 128, 128, 0.11);
        }

        /* Autofill highlight styling without layout shifts */
        .pro-input:is(:autofill, :-webkit-autofill) {
          box-shadow:
            inset 0 0 0 2px var(--primary-color),
            inset 0 0 0 100vmax ${theme === 'dark' ? '#0F172A' : '#F8FAFC'};
          border-color: var(--primary-color);
          -webkit-text-fill-color: ${theme === 'dark' ? '#F1F5F9' : '#0F172A'};
          caret-color: ${theme === 'dark' ? '#F1F5F9' : '#0F172A'};
        }

        .pro-input:is(:autofill, :-webkit-autofill):focus-visible {
          outline: 2px solid var(--primary-color);
          outline-offset: 2px;
        }

        .pro-pw-toggle {
          position: absolute;
          left: 12px;
          width: 34px;
          height: 34px;
          border-radius: 9px;
          border: none;
          background: transparent;
          color: var(--text-tertiary);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 2;
        }

        .pro-pw-toggle:hover {
          color: var(--text-primary);
          background: rgba(128, 128, 128, 0.12);
        }

        .pro-submit-btn {
          margin-top: 8px;
          height: 52px;
          width: 100%;
          border-radius: 14px;
          border: none;
          background: linear-gradient(135deg, #10B981 0%, #059669 100%);
          color: #FFFFFF;
          font-size: 15.5px;
          font-weight: 800;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          cursor: pointer;
          box-shadow: 0 10px 26px rgba(16, 185, 129, 0.32);
          transition: transform 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
        }

        .pro-submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 14px 30px rgba(16, 185, 129, 0.42);
        }

        .pro-submit-btn:disabled {
          opacity: 0.7;
          cursor: wait;
        }

        .pro-spinner {
          width: 18px;
          height: 18px;
          border: 2.5px solid rgba(255, 255, 255, 0.3);
          border-top-color: #FFFFFF;
          border-radius: 50%;
          animation: pro-spin 0.7s linear infinite;
        }

        @keyframes pro-spin {
          to { transform: rotate(360deg); }
        }

        .pro-auth-footer-note {
          margin-top: 28px;
          padding-top: 20px;
          border-top: 1px solid var(--glass-border);
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 600;
          color: var(--text-tertiary);
          line-height: 1.5;
        }

        @media (max-width: 920px) {
          .pro-login-shell {
            grid-template-columns: 1fr;
            max-width: 480px;
          }
          .pro-showcase-panel {
            display: none;
          }
          .pro-auth-panel {
            padding: 36px 28px;
          }
        }
      `}</style>
    </div>
  );
}

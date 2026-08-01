'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';

const NAV_ITEMS = [
  {
    id: 0, ar: 'الإحصائيات العامة', en: 'Overview',
    icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  },
  {
    id: 1, ar: 'إدارة الشحنات', en: 'Shipments',
    icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3m0 0h3l3 4v4h-3m-3-4H8m0 0a2 2 0 100 4 2 2 0 000-4zm9 0a2 2 0 100 4 2 2 0 000-4z"/></svg>,
  },
  {
    id: 2, ar: 'المحافظ والمدفوعات', en: 'Wallets & Payouts',
    icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>,
  },
  {
    id: 3, ar: 'إدارة السائقين', en: 'Drivers',
    icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>,
  },
  {
    id: 4, ar: 'التحقق من التجار', en: 'Merchants',
    icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75"/></svg>,
  },
  {
    id: 5, ar: 'تذاكر الدعم الفني', en: 'Support Tickets',
    icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  },
  {
    id: 6, ar: 'أسعار التوصيل', en: 'Pricing',
    icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>,
  },
  {
    id: 7, ar: 'التقارير المالية', en: 'Reports',
    icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>,
  },
  {
    id: 8, ar: 'الخزائن المالية', en: 'Treasury & Safes',
    icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  },
  {
    id: 9, perm: 'employees', ar: 'إدارة الموظفين', en: 'Employees',
    icon: <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75"/></svg>,
  },
];


export default function Sidebar({ activeTab, setActiveTab }) {
  const { theme, lang, toggleTheme, toggleLang, currentUser, logout, updateAdminData, getAdminData } = useApp();
  const [showSettings, setShowSettings] = useState(false);
  const [adminForm, setAdminForm] = useState({ name: '', phone: '', password: '' });

  const filteredNavItems = NAV_ITEMS.filter(item => {
    if (currentUser?.permissions?.includes('all')) return true;
    return currentUser?.permissions?.includes(item.perm);
  });
  const isAr = lang === 'ar';

  return (
    <aside className="sidebar glass-panel">
      {/* ── Brand ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px', padding: '0 12px' }}>
        <img src={theme === 'dark' ? "/logo-white.png" : "/logo-color.png"} alt="Tamowil Delivery" style={{ height: '65px', objectFit: 'contain' }} />
      </div>

      {/* ── Navigation ── */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {filteredNavItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`nav-link${activeTab === item.id ? ' active' : ''}`}
          >
            {item.icon}
            <span>{isAr ? item.ar : item.en}</span>
          </button>
        ))}
      </nav>

      {/* ── Footer Controls ── */}
      <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>

        {/* Language Toggle */}
        <button
          onClick={toggleLang}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            width: '100%', padding: '10px 14px', borderRadius: '12px',
            border: '1px solid var(--glass-border)',
            background: 'rgba(128,128,128,0.06)',
            color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/>
            </svg>
            {isAr ? 'اللغة' : 'Language'}
          </span>
          <span style={{ fontWeight: 700, fontSize: '12px', color: 'var(--primary-color)' }}>
            {isAr ? 'EN' : 'عر'}
          </span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            width: '100%', padding: '10px 14px', borderRadius: '12px',
            border: '1px solid var(--glass-border)',
            background: 'rgba(128,128,128,0.06)',
            color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {theme === 'dark' ? (
              <svg width="16" height="16" fill="none" stroke="#FBBF24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
              </svg>
            ) : (
              <svg width="16" height="16" fill="none" stroke="#818CF8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
              </svg>
            )}
            {isAr ? (theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي') : (theme === 'dark' ? 'Light Mode' : 'Dark Mode')}
          </span>
          <span style={{ color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center' }}>
            {theme === 'dark' ? (
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            ) : (
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
            )}
          </span>
        </button>
      </div>

      {/* User Profile */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '12px', background: 'var(--card-bg)', border: '1px solid var(--glass-border)', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <div style={{ flexShrink: 0, width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: 'bold', fontSize: '14px' }}>
            {currentUser?.name?.substring(0, 2) || 'م'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <span style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser?.name || 'مستخدم'}</span>
            <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentUser?.id === 'admin' ? 'المدير العام' : 'موظف'}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          {currentUser?.id === 'admin' && (
            <button onClick={() => {
              const currentData = getAdminData();
              setAdminForm({ name: currentData.name, phone: currentData.phone, password: currentData.password });
              setShowSettings(true);
            }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }} title={isAr ? 'الإعدادات' : 'Settings'}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
            </button>
          )}
          <button onClick={logout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444' }} title={isAr ? 'تسجيل الخروج' : 'Logout'}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
          </button>
        </div>
      </div>

      {/* Admin Settings Modal */}
      {showSettings && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel" style={{ width: '400px', maxWidth: '90%' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '18px', color: 'var(--text-primary)' }}>{isAr ? 'إعدادات المدير العام' : 'Admin Settings'}</h2>
            
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>{isAr ? 'الاسم' : 'Name'}</label>
              <input 
                type="text" 
                className="glass-input"
                value={adminForm.name}
                onChange={e => setAdminForm({...adminForm, name: e.target.value})}
                placeholder={isAr ? 'اسم المدير العام' : 'Admin Name'}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>{isAr ? 'رقم الهاتف (لتسجيل الدخول)' : 'Phone Number (For Login)'}</label>
              <input 
                type="text" 
                className="glass-input"
                value={adminForm.phone}
                onChange={e => setAdminForm({...adminForm, phone: e.target.value})}
                placeholder={isAr ? 'رقم الهاتف' : 'Phone Number'}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>{isAr ? 'كلمة المرور' : 'Password'}</label>
              <input 
                type="text" 
                className="glass-input"
                value={adminForm.password}
                onChange={e => setAdminForm({...adminForm, password: e.target.value})}
                placeholder={isAr ? 'كلمة المرور' : 'Password'}
                style={{ width: '100%' }}
              />
            </div>

            <div style={{ marginBottom: '20px', padding: '12px', borderRadius: '10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#EF4444', marginBottom: '4px' }}>
                ⚠️ {isAr ? 'بدء نظام جديد كلياً (تصفير الذاكرة)' : 'Fresh System Reset'}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
                {isAr ? 'تفريغ كافة المؤشرات والبيانات المؤقتة القديمة لبدء مشروع جديد نظيف متصل بقاعدة البيانات الحية.' : 'Purge legacy cached data to start fresh on database.'}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (confirm(isAr ? 'هل أنت أصل ومؤكد من تفريغ كافة البيانات والبدء بنظام حقيقي جديد كلياً؟' : 'Are you sure you want to reset and start completely fresh?')) {
                    const savedAdmin = localStorage.getItem('vanex_admin_data');
                    const savedUser = localStorage.getItem('vanex_current_user');
                    localStorage.clear();
                    if (savedAdmin) localStorage.setItem('vanex_admin_data', savedAdmin);
                    if (savedUser) localStorage.setItem('vanex_current_user', savedUser);
                    alert(isAr ? 'تم إعادة تهيئة وتصفير النظام كلياً للبدء بنظام نظيف وحقيقي!' : 'System re-initialized cleanly!');
                    window.location.reload();
                  }
                }}
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: 'none', background: '#EF4444', color: '#fff', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
              >
                🧹 {isAr ? 'تصفير وإعادة تهيئة النظام للبدء جديداً' : 'Purge & Start Fresh System'}
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setShowSettings(false)} className="glass-button" style={{ background: 'transparent', color: 'var(--text-secondary)' }}>{isAr ? 'إلغاء' : 'Cancel'}</button>
              <button onClick={() => {
                if(adminForm.name.trim() && adminForm.phone.trim() && adminForm.password.trim()) {
                  updateAdminData(adminForm);
                  alert(isAr ? 'تم تعديل بيانات المدير بنجاح!' : 'Admin details updated successfully!');
                  setShowSettings(false);
                } else {
                  alert(isAr ? 'الرجاء ملء كافة الحقول' : 'Please fill all fields');
                }
              }} className="glass-button primary">{isAr ? 'حفظ التعديلات' : 'Save Changes'}</button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

'use client';
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function EmployeesManager() {
  const { employees, saveEmployee, deleteEmployee, currentUser } = useApp();
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showPasswords, setShowPasswords] = useState({});
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: '',
    permissions: [],
    isActive: true
  });

    const availablePermissions = [
    { id: 'overview', label: 'لوحة التحكم (الرئيسية)', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg> },
    { id: 'shipments', label: 'إدارة الشحنات', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h11a2 2 0 012 2v3m0 0h3l3 4v4h-3m-3-4H8m0 0a2 2 0 100 4 2 2 0 000-4zm9 0a2 2 0 100 4 2 2 0 000-4z"/></svg> },
    { id: 'wallet', label: 'التسويات المالية', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg> },
    { id: 'drivers', label: 'إدارة السائقين', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg> },
    { id: 'merchants', label: 'إدارة المتاجر', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87m-4-12a4 4 0 010 7.75"/></svg> },
    { id: 'tickets', label: 'الدعم والتذاكر', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> },
    { id: 'pricing', label: 'أسعار التوصيل', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg> },
    { id: 'reports', label: 'التقارير والإحصائيات', icon: <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6"/></svg> },
  ];

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData({ name: '', phone: '', password: '', permissions: [], isActive: true });
    setShowModal(true);
  };

  const handleEdit = (emp) => {
    setEditingId(emp.id);
    setFormData({
      name: emp.name,
      phone: emp.phone,
      password: emp.password,
      permissions: emp.permissions || [],
      isActive: emp.isActive !== false
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm('هل أنت متأكد من حذف هذا الموظف نهائياً؟')) {
      await deleteEmployee(id);
    }
  };

  const handleTogglePermission = (id) => {
    setFormData(prev => {
      const perms = prev.permissions;
      if (perms.includes(id)) {
        return { ...prev, permissions: perms.filter(p => p !== id) };
      } else {
        return { ...prev, permissions: [...perms, id] };
      }
    });
  };

  const togglePasswordVisibility = (id) => {
    setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.password) {
      alert('الرجاء إكمال كافة الحقول الأساسية');
      return;
    }
    
    await saveEmployee({
      id: editingId,
      name: formData.name,
      phone: formData.phone,
      password: formData.password,
      permissions: formData.permissions,
      isActive: formData.isActive
    });
    
    setShowModal(false);
  };

  if (currentUser?.id !== 'admin' && !currentUser?.permissions?.includes('employees')) {
    return (
      <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', marginTop: '50px' }}>
        <h3 style={{ color: '#ff4757' }}>وصول غير مصرح</h3>
        <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>ليس لديك الصلاحيات الكافية للوصول لإدارة الموظفين.</p>
      </div>
    );
  }

  return (
    <div className="employees-manager fade-in">
      <div className="header-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px' }}>إدارة الموظفين والصلاحيات</h2>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>قم بإدارة وصول فريق العمل لخصائص النظام</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenNew} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          إضافة موظف جديد
        </button>
      </div>

      <div className="glass-panel" style={{ overflowX: 'auto', padding: '0', borderRadius: '16px' }}>
        <table className="custom-table" style={{ margin: 0, border: 'none' }}>
          <thead style={{ background: 'rgba(0,0,0,0.02)' }}>
            <tr>
              <th style={{ padding: '16px' }}>الموظف</th>
              <th>رقم الهاتف / معرّف الدخول</th>
              <th>كلمة المرور</th>
              <th>الصلاحيات الممنوحة</th>
              <th>الحالة</th>
              <th style={{ textAlign: 'center' }}>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'linear-gradient(135deg, #0D7847, #13a863)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold' }}>
                    AD
                  </div>
                  <div>
                    <div style={{ fontWeight: '600' }}>المدير العام</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>مدير النظام</div>
                  </div>
                </div>
              </td>
              <td style={{ fontFamily: 'monospace', fontSize: '14px' }}>admin</td>
              <td><span style={{ color: 'var(--text-secondary)' }}>••••••••</span></td>
              <td><span className="badge badge-success" style={{ padding: '6px 12px' }}>كافة الصلاحيات</span></td>
              <td><span className="badge badge-success">نشط</span></td>
              <td style={{ textAlign: 'center' }}><span className="text-secondary" style={{ fontSize: '12px' }}>حساب أساسي مقفل</span></td>
            </tr>
            {employees.map(emp => (
              <tr key={emp.id} style={{ transition: 'background 0.2s', ':hover': { background: 'var(--hover-bg)' } }}>
                <td style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)', fontWeight: 'bold' }}>
                      {emp.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div style={{ fontWeight: '600' }}>{emp.name}</div>
                  </div>
                </td>
                <td style={{ fontFamily: 'monospace', fontSize: '14px' }}>{emp.phone}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: 'monospace', background: 'var(--glass-bg)', padding: '4px 8px', borderRadius: '6px' }}>
                      {showPasswords[emp.id] ? emp.password : '••••••••'}
                    </span>
                    <button 
                      onClick={() => togglePasswordVisibility(emp.id)}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', padding: '4px' }}
                      title={showPasswords[emp.id] ? "إخفاء" : "إظهار"}
                    >
                      {showPasswords[emp.id] ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22"/></svg> : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                    </button>
                  </div>
                </td>
                <td>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {emp.permissions?.length === 0 && <span className="text-secondary" style={{ fontSize: '12px' }}>لا توجد صلاحيات</span>}
                    {emp.permissions?.map(p => (
                      <span key={p} className="badge" style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(13, 120, 71, 0.1)', color: '#0D7847', border: '1px solid rgba(13,120,71,0.2)', fontSize: '12px', padding: '4px 8px' }}>
                        {availablePermissions.find(ap => ap.id === p)?.icon} {availablePermissions.find(ap => ap.id === p)?.label || p}
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  {emp.isActive !== false ? 
                    <span className="badge badge-success">نشط</span> : 
                    <span className="badge badge-danger">موقوف</span>
                  }
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button className="btn btn-secondary" style={{ padding: '6px', borderRadius: '8px', background: 'var(--glass-bg)' }} onClick={() => handleEdit(emp)} title="تعديل">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button className="btn btn-danger" style={{ padding: '6px', borderRadius: '8px' }} onClick={() => handleDelete(emp.id)} title="حذف">
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {employees.length === 0 && (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>لا يوجد موظفين إضافيين حالياً. انقر على الزر أعلاه لإضافة موظف.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" style={{ backdropFilter: 'blur(4px)' }}>
          <div className="modal-content glass-panel pop-in" style={{ maxWidth: '600px', width: '95%', padding: '0', overflow: 'hidden' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.02)' }}>
              <h3 style={{ margin: 0 }}>{editingId ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}</h3>
            </div>
            
            <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>اسم الموظف المليء</label>
                  <input 
                    type="text" 
                    className="glass-input" 
                    style={{ width: '100%' }}
                    placeholder="أدخل الاسم"
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>رقم الهاتف / معرف الدخول</label>
                  <input 
                    type="text" 
                    className="glass-input" 
                    style={{ width: '100%', direction: 'ltr', textAlign: 'right' }}
                    placeholder="09X XXX XXXX"
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>كلمة المرور</label>
                  <input 
                    type="text" 
                    className="glass-input" 
                    style={{ width: '100%' }}
                    placeholder="أدخل كلمة المرور"
                    value={formData.password} 
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>حالة الحساب</label>
                  <label className="toggle-switch-custom" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '10px', cursor: 'pointer' }}>
                    <div style={{ position: 'relative', width: '44px', height: '24px', background: formData.isActive ? '#0D7847' : '#ccc', borderRadius: '24px', transition: '0.3s' }}>
                      <div style={{ position: 'absolute', top: '2px', left: formData.isActive ? '22px' : '2px', width: '20px', height: '20px', background: '#fff', borderRadius: '50%', transition: '0.3s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: formData.isActive ? '#0D7847' : '#888' }}>
                      {formData.isActive ? 'نشط (يمكنه الدخول)' : 'موقوف (ممنوع من الدخول)'}
                    </span>
                    <input 
                      type="checkbox" 
                      style={{ display: 'none' }}
                      checked={formData.isActive}
                      onChange={e => setFormData({...formData, isActive: e.target.checked})}
                    />
                  </label>
                </div>
              </div>
              
              <div style={{ background: 'var(--glass-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                <label style={{ display: 'block', marginBottom: '16px', fontWeight: 'bold', borderBottom: '1px solid var(--glass-border)', paddingBottom: '8px' }}>
                  تحديد صلاحيات الوصول للأقسام:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  {availablePermissions.map(perm => (
                    <label key={perm.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', padding: '8px', borderRadius: '8px', transition: '0.2s', background: formData.permissions.includes(perm.id) ? 'rgba(13,120,71,0.05)' : 'transparent' }}>
                      <div style={{ position: 'relative', width: '36px', height: '20px', background: formData.permissions.includes(perm.id) ? '#0D7847' : '#ccc', borderRadius: '20px', transition: '0.3s' }}>
                        <div style={{ position: 'absolute', top: '2px', left: formData.permissions.includes(perm.id) ? '18px' : '2px', width: '16px', height: '16px', background: '#fff', borderRadius: '50%', transition: '0.3s' }} />
                      </div>
                      <span style={{ fontSize: '14px' }}><span style={{display: 'flex', alignItems: 'center', gap: '4px'}}>{perm.icon} {perm.label}</span></span>
                      <input 
                        type="checkbox" 
                        style={{ display: 'none' }}
                        checked={formData.permissions.includes(perm.id)}
                        onChange={() => handleTogglePermission(perm.id)}
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '30px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" style={{ padding: '10px 24px' }} onClick={() => setShowModal(false)}>إلغاء</button>
                <button type="submit" className="btn btn-primary" style={{ padding: '10px 32px' }}>{editingId ? 'حفظ التعديلات' : 'إضافة الموظف'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <style>{`
        .fade-in { animation: fadeIn 0.4s ease-out; }
        .pop-in { animation: popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes popIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}

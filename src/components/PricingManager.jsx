'use client';
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function PricingManager() {
  const { lang, cityPricing: pricing, updateCityFee, toggleCityActive, addCity } = useApp();
  const isAr = lang === 'ar';

  const [editing, setEditing] = useState(null); // city name being edited
  const [editFee, setEditFee] = useState('');
  const [editCodFee, setEditCodFee] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newCity, setNewCity] = useState('');
  const [newFee, setNewFee] = useState('');
  const [newCodFee, setNewCodFee] = useState('');

  function startEdit(c) { setEditing(c.city); setEditFee(String(c.fee)); setEditCodFee(String(c.codFee)); }
  function saveEdit() { updateCityFee(editing, editFee, editCodFee); setEditing(null); }

  function handleAdd(e) {
    e.preventDefault();
    if (!newCity || !newFee) return;
    addCity(newCity, newFee, newCodFee || 0);
    setNewCity(''); setNewFee(''); setNewCodFee('');
    setShowAdd(false);
  }

  const activeCount   = pricing.filter(c => c.active).length;
  const avgFee        = Math.round(pricing.filter(c => c.active).reduce((s, c) => s + c.fee, 0) / (activeCount || 1));
  const maxFee        = Math.max(...pricing.map(c => c.fee));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="title-large">{isAr ? 'إدارة أسعار التوصيل' : 'Delivery Pricing'}</h1>
          <p className="subtitle">{isAr ? 'تحديد رسوم التوصيل وخدمة COD لكل مدينة.' : 'Set delivery and COD fees per city.'}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="glass-button" style={{ background: '#6366F1' }} onClick={() => window.print()}>
            <span style={{display: 'flex', gap: '4px', alignItems: 'center'}}><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg></span> {isAr ? 'طباعة كشف الأسعار' : 'Print Pricing Report'}
          </button>
          <button className="glass-button" onClick={() => setShowAdd(true)}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
            {isAr ? 'إضافة مدينة' : 'Add City'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: '14px' }}>
        {[
          { ar: 'مدن نشطة', en: 'Active Cities', val: activeCount, color: '#10B981', rgb: '16,185,129',
          icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg> },
        { ar: 'متوسط رسوم التوصيل', en: 'Average Delivery Fee', val: `${avgFee} ${isAr ? 'د.ل' : 'LYD'}`, color: '#3B82F6', rgb: '59,130,246',
          icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg> },
        { ar: 'أعلى رسوم توصيل', en: 'Highest Fee', val: `${maxFee} ${isAr ? 'د.ل' : 'LYD'}`, color: '#F59E0B', rgb: '245,158,11',
          icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg> },
        { ar: 'إجمالي المدن', en: 'Total Cities', val: pricing.length, color: '#818CF8', rgb: '129,140,248',
          icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg> },
        ].map((c, i) => (
          <div key={i} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="stat-icon" style={{ backgroundColor: c.color, boxShadow: `0 4px 14px rgba(${c.rgb},0.35)`, fontSize: '20px' }}>{c.icon}</div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)' }}>{isAr ? c.ar : c.en}</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }} dir="ltr">{c.val}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Pricing Table */}
      <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
            {isAr ? 'جدول الأسعار حسب المدينة' : 'City Pricing Table'}
          </h3>
          <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{isAr ? 'انقر على السعر للتعديل' : 'Click price to edit'}</span>
        </div>
        <table className="custom-table">
          <thead>
            <tr>
              <th>{isAr ? 'المدينة' : 'City'}</th>
              <th>{isAr ? 'رسوم التوصيل (د.ل)' : 'Delivery Fee (LYD)'}</th>
              <th>{isAr ? 'رسوم COD (د.ل)' : 'COD Fee (LYD)'}</th>
              <th>{isAr ? 'الإجمالي' : 'Total'}</th>
              <th>{isAr ? 'الحالة' : 'Status'}</th>
              <th>{isAr ? 'الإجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {pricing.map(c => (
              <tr key={c.city} style={{ opacity: c.active ? 1 : 0.5 }}>
                <td style={{ fontWeight: 700 }}>{c.city}</td>
                <td>
                  {editing === c.city ? (
                    <input type="number" className="glass-input" value={editFee} onChange={e => setEditFee(e.target.value)} style={{ width: '90px', padding: '6px 10px' }} />
                  ) : (
                    <span style={{ fontWeight: 700, color: 'var(--accent-green)' }} dir="ltr">{c.fee} {isAr ? 'د.ل' : 'LYD'}</span>
                  )}
                </td>
                <td>
                  {editing === c.city ? (
                    <input type="number" className="glass-input" value={editCodFee} onChange={e => setEditCodFee(e.target.value)} style={{ width: '90px', padding: '6px 10px' }} />
                  ) : (
                    <span style={{ color: 'var(--text-secondary)' }} dir="ltr">{c.codFee} {isAr ? 'د.ل' : 'LYD'}</span>
                  )}
                </td>
                <td style={{ fontWeight: 700, color: 'var(--accent-blue)' }} dir="ltr">{c.fee + c.codFee} {isAr ? 'د.ل' : 'LYD'}</td>
                <td>
                  <button onClick={() => toggleCityActive(c.city)} style={{ padding: '4px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '11px', background: c.active ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.12)', color: c.active ? '#10B981' : '#64748B' }}>
                    {c.active ? (isAr ? 'نشطة' : 'Active') : (isAr ? 'معطلة' : 'Inactive')}
                  </button>
                </td>
                <td>
                  {editing === c.city ? (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={saveEdit} style={{ padding: '5px 12px', borderRadius: '8px', border: 'none', background: '#10B981', color: '#fff', fontWeight: 700, fontSize: '11px', cursor: 'pointer' }}>{isAr ? 'حفظ' : 'Save'}</button>
                      <button onClick={() => setEditing(null)} style={{ padding: '5px 12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '11px', cursor: 'pointer' }}>{isAr ? 'إلغاء' : 'Cancel'}</button>
                    </div>
                  ) : (
                    <button onClick={() => startEdit(c)} style={{ padding: '5px 12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '11px', cursor: 'pointer' }}>
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{display:'inline',marginInlineEnd:'4px'}}><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> {isAr ? 'تعديل' : 'Edit'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add City Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-content glass-panel" style={{ padding: '28px', maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-primary)', marginBottom: '20px' }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{display:'inline',marginInlineEnd:'6px'}}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>{isAr ? 'إضافة مدينة جديدة' : 'Add New City'}
            </h3>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { key: 'city', label: isAr ? 'اسم المدينة' : 'City Name', val: newCity, set: setNewCity, placeholder: isAr ? 'مثال: درنة' : 'e.g. Derna' },
                { key: 'fee',  label: isAr ? 'رسوم التوصيل (د.ل)' : 'Delivery Fee (LYD)', val: newFee, set: setNewFee, placeholder: '35', type: 'number' },
                { key: 'cod',  label: isAr ? 'رسوم COD (د.ل)' : 'COD Fee (LYD)', val: newCodFee, set: setNewCodFee, placeholder: '5', type: 'number' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>{f.label}</label>
                  <input required={f.key !== 'cod'} className="glass-input" type={f.type || 'text'} placeholder={f.placeholder} value={f.val} onChange={e => f.set(e.target.value)} />
                </div>
              ))}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button type="button" onClick={() => setShowAdd(false)} style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}>{isAr ? 'إلغاء' : 'Cancel'}</button>
                <button type="submit" className="glass-button">{isAr ? 'إضافة' : 'Add City'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════ PRINTABLE PRICING REPORT (A4) ══════════════ */}
      

      <div className="printable-area hide-on-screen" dir="rtl">
        <div className="print-header" style={{ borderBottom: '3px solid #0D7847' }}>
          <div className="print-logo-container"><img src="/logo-color.png" alt="Tamowil Delivery" style={{ height: '80px' }} /></div>
          <h2 style={{ fontSize: '22px', fontWeight: '800', color: '#0D7847', margin: '10px 0 5px' }}>كشف أسعار التوصيل المعتمدة</h2>
          <p style={{ color: '#555', fontSize: '14px' }}>شركة تمويل لخدمات الشحن والتوصيل المحدودة</p>
        </div>

        <div className="print-meta-info" style={{ display: 'flex', justifyContent: 'space-between', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '12px 20px', borderRadius: '8px', marginBottom: '20px' }}>
          <div><span style={{ color: '#0D7847', fontWeight: 'bold' }}>تاريخ الإصدار:</span> {new Date().toLocaleDateString('ar-LY')}</div>
          <div><span style={{ color: '#0D7847', fontWeight: 'bold' }}>عدد المدن المغطاة:</span> {pricing.length} مدينة</div>
        </div>

        <table className="print-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
          <thead>
            <tr>
              <th style={{ backgroundColor: '#0D7847', color: '#fff', padding: '12px', border: '1px solid #0D7847', textAlign: 'right', fontSize: '14px', width: '40%' }}>المدينة</th>
              <th style={{ backgroundColor: '#0D7847', color: '#fff', padding: '12px', border: '1px solid #0D7847', textAlign: 'center', fontSize: '14px', width: '30%' }}>الإجمالي للزبون (د.ل)</th>
              <th style={{ backgroundColor: '#0D7847', color: '#fff', padding: '12px', border: '1px solid #0D7847', textAlign: 'center', fontSize: '14px', width: '30%' }}>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {pricing.map((c, index) => (
              <tr key={c.city} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f9fafb' }}>
                <td style={{ padding: '12px', border: '1px solid #d1d5db', fontWeight: 'bold', color: '#111' }}>{c.city}</td>
                <td dir="ltr" style={{ padding: '12px', border: '1px solid #d1d5db', fontWeight: 'bold', textAlign: 'center', color: '#111' }}>{c.fee + c.codFee}</td>
                <td style={{ padding: '12px', border: '1px solid #d1d5db', textAlign: 'center', color: c.active ? '#10B981' : '#EF4444', fontWeight: 'bold' }}>{c.active ? 'مُفعل' : 'مُعطل'}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: '30px', padding: '15px', background: '#f1f5f9', borderLeft: '4px solid #0D7847', borderRadius: '4px', fontSize: '12px', color: '#334155' }}>
          <strong>ملاحظة هامة:</strong> الأسعار المذكورة أعلاه تشمل رسوم التوصيل وعمولة التحصيل (COD)، وقد تخضع للتعديل بناءً على سياسة الشركة.
        </div>

        <div className="print-footer-signatures" style={{ marginTop: '60px', display: 'flex', justifyContent: 'space-between', padding: '0 20px' }}>
          <div className="print-signature-box">
            <div className="print-signature-line">توقيع المستلم</div>
          </div>
          <div className="print-signature-box">
            <div className="print-signature-line">ختم الشركة</div>
          </div>
          <div className="print-signature-box">
            <div className="print-signature-line">المدير المالي</div>
          </div>
        </div>
        <div className="print-footer-note">
          شكراً لتعاملكم مع شركة تمويل للتوصيل السريع - نظام إدارة العمليات الذكي
        </div>
      </div>
    </div>
  );
}

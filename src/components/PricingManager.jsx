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
      <div className="printable-area hide-on-screen" dir="rtl" style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#0F172A', padding: '15px' }}>
        
        {/* Header Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '3px solid #0D7847', paddingBottom: '16px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img src="/logo-color.png" alt="Tamowil Express" style={{ height: '65px', objectFit: 'contain' }} />
              <div>
                <h1 style={{ fontSize: '22px', fontWeight: '900', color: '#0D7847', margin: 0, letterSpacing: '-0.5px' }}>كشف أسعار ورسوم التوصيل المعتمدة</h1>
                <p style={{ fontSize: '13px', fontWeight: '600', color: '#475569', margin: '4px 0 0' }}>شركة تمويل لخدمات الشحن والحلول اللوجستية السريعة</p>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'left', background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '10px 16px', borderRadius: '10px' }}>
            <div style={{ fontSize: '11px', color: '#166534', fontWeight: '700' }}>رقم الكشف: PRC-{new Date().getFullYear()}{String(new Date().getMonth() + 1).padStart(2, '0')}</div>
            <div style={{ fontSize: '12px', color: '#0D7847', fontWeight: '800', marginTop: '2px' }}>تاريخ الإصدار: {new Date().toLocaleDateString('ar-LY')}</div>
          </div>
        </div>

        {/* Stats Grid Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
          <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '10px 14px', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: '600' }}>إجمالي المدن</div>
            <div style={{ fontSize: '16px', color: '#0F172A', fontWeight: '800' }}>{pricing.length} مدينة</div>
          </div>
          <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', padding: '10px 14px', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', color: '#166534', fontWeight: '600' }}>التغطية النشطة</div>
            <div style={{ fontSize: '16px', color: '#15803D', fontWeight: '800' }}>{activeCount} مدينة</div>
          </div>
          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '10px 14px', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', color: '#1E40AF', fontWeight: '600' }}>متوسط أسعار التوصيل</div>
            <div style={{ fontSize: '16px', color: '#1D4ED8', fontWeight: '800' }}>{avgFee} د.ل</div>
          </div>
          <div style={{ background: '#FEF3C7', border: '1px solid #FDE68A', padding: '10px 14px', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', color: '#92400E', fontWeight: '600' }}>أعلى رسوم توصيل</div>
            <div style={{ fontSize: '16px', color: '#B45309', fontWeight: '800' }}>{maxFee} د.ل</div>
          </div>
        </div>

        {/* Pricing Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', borderRadius: '8px', overflow: 'hidden', border: '1px solid #CBD5E1' }}>
          <thead>
            <tr style={{ background: '#0D7847', color: '#FFFFFF' }}>
              <th style={{ padding: '10px 12px', fontSize: '12px', fontWeight: '800', textAlign: 'center', width: '8%', borderBottom: '2px solid #065F46' }}>#</th>
              <th style={{ padding: '10px 12px', fontSize: '12px', fontWeight: '800', textAlign: 'right', width: '32%', borderBottom: '2px solid #065F46' }}>المدينة / المنطقة</th>
              <th style={{ padding: '10px 12px', fontSize: '12px', fontWeight: '800', textAlign: 'center', width: '20%', borderBottom: '2px solid #065F46' }}>رسوم التوصيل</th>
              <th style={{ padding: '10px 12px', fontSize: '12px', fontWeight: '800', textAlign: 'center', width: '20%', borderBottom: '2px solid #065F46' }}>رسوم التحصيل (COD)</th>
              <th style={{ padding: '10px 12px', fontSize: '13px', fontWeight: '900', textAlign: 'center', width: '20%', borderBottom: '2px solid #065F46', background: '#065F46' }}>إجمالي تكلفة التوصيل</th>
            </tr>
          </thead>
          <tbody>
            {pricing.map((c, idx) => (
              <tr key={c.city} style={{ background: idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <td style={{ padding: '9px 12px', textAlign: 'center', fontSize: '12px', color: '#64748B', fontWeight: '700' }}>{idx + 1}</td>
                <td style={{ padding: '9px 12px', textAlign: 'right', fontSize: '13px', color: '#0F172A', fontWeight: '800' }}>
                  {c.city}
                  {!c.active && <span style={{ marginRight: '8px', fontSize: '10px', background: '#FEE2E2', color: '#991B1B', padding: '2px 6px', borderRadius: '4px' }}>غير متوفر</span>}
                </td>
                <td style={{ padding: '9px 12px', textAlign: 'center', fontSize: '13px', color: '#15803D', fontWeight: '700' }} dir="ltr">{c.fee} د.ل</td>
                <td style={{ padding: '9px 12px', textAlign: 'center', fontSize: '13px', color: '#475569', fontWeight: '600' }} dir="ltr">{c.codFee} د.ل</td>
                <td style={{ padding: '9px 12px', textAlign: 'center', fontSize: '14px', color: '#0D7847', fontWeight: '900', background: idx % 2 === 0 ? '#F0FDF4' : '#DCFCE7' }} dir="ltr">
                  {c.fee + c.codFee} د.ل
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Policy Note Box */}
        <div style={{ marginTop: '24px', padding: '14px 18px', background: '#F1F5F9', borderRight: '4px solid #0D7847', borderRadius: '8px', fontSize: '11px', color: '#334155', lineHeight: '1.6' }}>
          <strong style={{ color: '#0D7847', fontSize: '12px' }}>💡 الشروط والتعليمات التنظيمية:</strong>
          <ul style={{ margin: '4px 0 0', paddingRight: '18px' }}>
            <li>الأسعار المبينة أعلاه معتمدة ورسمية ومحتسبة بالدينار الليبي (د.ل).</li>
            <li>يتم تحصيل رسوم الخدمة وفق الإجمالي الموضح شامل التوصيل المباشر وعمولة التحصيل.</li>
            <li>أي تغيير أو تعديل على جدول الأسعار يتطلب اعتماد الإدارة المالية والمدير التنفيذي لشركة تمويل.</li>
          </ul>
        </div>

        {/* Signatures & Seals Section */}
        <div style={{ marginTop: '45px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', textAlign: 'center' }}>
          <div style={{ border: '1px dashed #CBD5E1', padding: '15px', borderRadius: '10px', background: '#FAFAFA' }}>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', marginBottom: '40px' }}>اعتماد مدير العمليات</div>
            <div style={{ borderTop: '1px solid #94A3B8', paddingTop: '6px', fontSize: '11px', color: '#64748B' }}>التوقيع والتاريخ</div>
          </div>
          <div style={{ border: '1px dashed #CBD5E1', padding: '15px', borderRadius: '10px', background: '#FAFAFA' }}>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', marginBottom: '40px' }}>ختم الشركة الرسمي</div>
            <div style={{ borderTop: '1px solid #94A3B8', paddingTop: '6px', fontSize: '11px', color: '#64748B' }}>شركة تمويل للتوصيل السريع</div>
          </div>
          <div style={{ border: '1px dashed #CBD5E1', padding: '15px', borderRadius: '10px', background: '#FAFAFA' }}>
            <div style={{ fontSize: '12px', fontWeight: '800', color: '#0F172A', marginBottom: '40px' }}>اعتماد الشؤون المالية</div>
            <div style={{ borderTop: '1px solid #94A3B8', paddingTop: '6px', fontSize: '11px', color: '#64748B' }}>التوقيع والتاريخ</div>
          </div>
        </div>

        {/* Footer Note */}
        <div style={{ marginTop: '25px', textTransform: 'uppercase', fontSize: '10px', color: '#94A3B8', textAlign: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '10px' }}>
          Tamowil Logistics & Delivery System — Official Approved Pricing Report — Page 1 of 1
        </div>
      </div>
    </div>
  );
}

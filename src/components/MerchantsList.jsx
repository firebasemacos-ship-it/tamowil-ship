'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';

export default function MerchantsList() {
  const { lang, merchants, toggleUserVerification, shipmentsList, transactionLog } = useApp();
  const isAr = lang === 'ar';

  const [selectedMerchantId, setSelectedMerchantId] = useState(null);

  const handleToggleVerify = (id) => {
    toggleUserVerification(id);
  };

  const handlePrint = () => {
    window.print();
  };

  if (selectedMerchantId) {
    const merchant = merchants.find(m => m.id === selectedMerchantId);
    if (!merchant) return null;

    const mShipments = shipmentsList.filter(s => s.merchantId === merchant.id);
    const mTransactions = transactionLog.filter(t => t.ref === merchant.id || t.type_ar?.includes(merchant.id));

    return (
      <div className="flex flex-col gap-6">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <button onClick={() => setSelectedMerchantId(null)} className="text-xs px-3 py-1.5 rounded-lg border font-semibold cursor-pointer mb-2" style={{ background: 'rgba(128,128,128,0.08)', color: 'var(--text-secondary)' }}>
              {isAr ? '← العودة للقائمة' : '← Back to List'}
            </button>
            <h1 className="title-large">{isAr ? 'الملف الشخصي للتاجر' : 'Merchant Profile'}</h1>
          </div>
          <button onClick={handlePrint} style={{ padding: '8px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, background: '#6366F1', color: '#fff' }}>
            <span style={{display: 'flex', gap: '4px', alignItems: 'center'}}><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg></span> {isAr ? 'طباعة الكشف المالي' : 'Print Financial Report'}
          </button>
        </div>

        <div className="glass-card" style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{isAr ? 'اسم المتجر' : 'Store Name'}</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary-color)' }}>{merchant.storeName}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{isAr ? 'المالك' : 'Owner'}</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>{merchant.name}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{isAr ? 'رقم الهاتف' : 'Phone'}</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }} dir="ltr">{merchant.phone}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{isAr ? 'معرف التاجر' : 'Merchant ID'}</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-secondary)' }}>{merchant.id}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', borderTop: '1px solid var(--card-border)', paddingTop: '20px' }}>
            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(16,185,129,0.05)', flex: 1, minWidth: '150px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{isAr ? 'الرصيد المتاح' : 'Available Balance'}</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: '#10B981' }} dir="ltr">{merchant.walletBalance.toLocaleString()} {isAr ? 'د.ل' : 'LYD'}</div>
            </div>
            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(99,102,241,0.05)', flex: 1, minWidth: '150px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{isAr ? 'إجمالي الأرباح' : 'Total Earned'}</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#6366F1' }} dir="ltr">{merchant.totalEarned.toLocaleString()} {isAr ? 'د.ل' : 'LYD'}</div>
            </div>
            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(239,68,68,0.05)', flex: 1, minWidth: '150px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{isAr ? 'إجمالي المسحوبات' : 'Total Withdrawn'}</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#EF4444' }} dir="ltr">{merchant.totalWithdrawn.toLocaleString()} {isAr ? 'د.ل' : 'LYD'}</div>
            </div>
            <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(245,158,11,0.05)', flex: 1, minWidth: '150px' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{isAr ? 'عدد الشحنات' : 'Total Shipments'}</div>
              <div style={{ fontSize: '20px', fontWeight: 700, color: '#F59E0B' }}>{mShipments.length}</div>
            </div>
          </div>
        </div>

        {/* ══════════════ PRINTABLE MERCHANT PROFILE (A4) ══════════════ */}
        

        <div className="printable-area hide-on-screen" dir="rtl">
          <div className="print-header">
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <img src="/logo-color.png" alt="Tamowil Delivery" style={{ height: '60px' }} />
          </div>
            <p className="print-subtitle">الملف المالي للتاجر (Merchant Profile)</p>
          </div>

          <div className="print-meta-info">
            <div>اسم المتجر: {merchant.storeName}</div>
            <div>معرف التاجر: {merchant.id}</div>
          </div>
          <div className="print-meta-info">
            <div>اسم المالك: {merchant.name}</div>
            <div>رقم الهاتف: <span dir="ltr">{merchant.phone}</span></div>
          </div>
          <div className="print-meta-info" style={{ borderTop: '1px solid #ccc', paddingTop: '10px' }}>
            <div>الرصيد المتاح: {merchant.walletBalance.toLocaleString()} د.ل</div>
            <div>إجمالي المسحوبات: {merchant.totalWithdrawn.toLocaleString()} د.ل</div>
          </div>

          <div style={{ marginTop: '30px', fontWeight: 'bold', marginBottom: '10px' }}>ملخص الشحنات:</div>
          <table className="print-table">
            <thead>
              <tr>
                <th>إجمالي الشحنات</th>
                <th>أرباح محققة (د.ل)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{mShipments.length}</td>
                <td dir="ltr">{merchant.totalEarned.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

                  <div className="print-footer-signatures">
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

  return (
    <div className="flex flex-col gap-6">
      {/* Title block */}
      <div>
        <h1 className="title-large">{isAr ? 'التحقق من حسابات التجار' : 'Verify Merchant Accounts'}</h1>
        <p className="subtitle">
          {isAr
            ? 'مراجعة طلبات التسجيل المقدمة من المتاجر الجديدة وتفعيل أو إلغاء تفعيل حساباتهم.'
            : 'Review merchant signup requests and activate or deactivate their shop accounts.'}
        </p>
      </div>

      {/* Merchants list table */}
      <div className="glass-card" style={{ padding: '0', overflowX: 'auto' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>{isAr ? 'رمز التاجر' : 'Merchant ID'}</th>
              <th>{isAr ? 'اسم التاجر' : 'Owner Name'}</th>
              <th>{isAr ? 'اسم المتجر' : 'Store Name'}</th>
              <th>{isAr ? 'بيانات الاتصال' : 'Contact Details'}</th>
              <th>{isAr ? 'تاريخ الانضمام' : 'Join Date'}</th>
              <th>{isAr ? 'حالة الحساب' : 'Account Status'}</th>
              <th>{isAr ? 'الإجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {merchants.map(merchant => (
              <tr key={merchant.id}>
                <td className="font-bold">{merchant.id}</td>
                <td className="font-semibold" style={{ color: 'var(--text-primary)' }}>{merchant.name}</td>
                <td>
                  <span className="font-bold text-slate-500" style={{ color: 'var(--primary-color)' }}>
                    {merchant.storeName}
                  </span>
                </td>
                <td>
                  <div>{merchant.phone}</div>
                  <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{merchant.email}</div>
                </td>
                <td>{merchant.joinDate}</td>
                <td>
                  <span 
                    className="badge" 
                    style={{
                      backgroundColor: merchant.verified ? 'rgba(16, 185, 129, 0.15)' : 'rgba(100, 116, 139, 0.15)',
                      color: merchant.verified ? 'var(--accent-green)' : 'var(--text-secondary)'
                    }}
                  >
                    {merchant.verified 
                      ? (isAr ? 'نشط / مفعل' : 'Active / Verified') 
                      : (isAr ? 'معلق / قيد المراجعة' : 'Pending Review')}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      onClick={() => handleToggleVerify(merchant.id)}
                      className="text-xs px-3 py-1.5 rounded-lg border font-semibold cursor-pointer"
                      style={{
                        backgroundColor: merchant.verified ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                        borderColor: merchant.verified ? 'var(--accent-red)' : 'var(--accent-green)',
                        color: merchant.verified ? 'var(--accent-red)' : 'var(--accent-green)'
                      }}
                    >
                      {merchant.verified 
                        ? (isAr ? 'إلغاء التفعيل' : 'Deactivate') 
                        : (isAr ? 'تفعيل وتأكيد' : 'Activate')}
                    </button>
                    <button
                      onClick={() => setSelectedMerchantId(merchant.id)}
                      className="text-xs px-3 py-1.5 rounded-lg border font-semibold cursor-pointer"
                      style={{
                        backgroundColor: 'rgba(99, 102, 241, 0.1)',
                        borderColor: 'transparent',
                        color: '#6366F1'
                      }}
                    >
                      {isAr ? 'الملف الشخصي' : 'Profile'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

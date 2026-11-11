'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
export default function Overview() {
  const { lang, dashboardStats: stats, shipmentsList: shipments, resetSystemData } = useApp();
  const isAr = lang === 'ar';
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  async function handleConfirmReset() {
    setIsResetting(true);
    try {
      await resetSystemData();
      setShowResetModal(false);
    } catch (err) {
      alert(err.message || 'حدث خطأ أثناء تصفير النظام');
    } finally {
      setIsResetting(false);
    }
  }

  const allLogs = shipments
    .flatMap(s => s.history.map(h => ({ ...h, trackingNumber: s.trackingNumber })))
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5);

  const deliveredPct  = Math.round((stats.delivered / (stats.total || 1)) * 100);
  const progressPct   = Math.round((stats.progress  / (stats.total || 1)) * 100);
  const warehousePct  = Math.round((stats.warehouse  / (stats.total || 1)) * 100);
  const registeredPct = Math.round((stats.registered / (stats.total || 1)) * 100);

  const fmt = (val) => isAr ? `${val} د.ل` : `LYD ${val}`;

  const statCards = [
    {
      titleAr: 'إجمالي الشحنات النَشطة',
      titleEn: 'Total Active Shipments',
      value: stats.total,
      subAr: 'شحنة مسجلة بالنظام',
      subEn: 'registered shipments',
      color: '#6366F1',
      shadowRgb: '99, 102, 241',
      icon: (
        <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
        </svg>
      ),
    },
    {
      titleAr: 'شحنات مكتملة (تم التسليم)',
      titleEn: 'Completed Deliveries',
      value: stats.delivered,
      subAr: 'تم التسليم والتحصيل',
      subEn: 'successfully delivered',
      color: '#10B981',
      shadowRgb: '16, 185, 129',
      icon: (
        <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      ),
    },
    {
      titleAr: 'أموال COD المحصّلة',
      titleEn: 'COD Collected',
      value: fmt(stats.totalCodCollected),
      subAr: 'جاهزة للتحويل للتجار',
      subEn: 'ready for merchant payout',
      color: '#3B82F6',
      shadowRgb: '59, 130, 246',
      icon: (
        <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      ),
    },
    {
      titleAr: 'إيرادات الشحن الصافية',
      titleEn: 'Shipping Revenue',
      value: fmt(stats.netCompanyProfits ?? stats.totalRevenue ?? 0),
      subAr: 'صافي عمولات الشركة (COD)',
      subEn: 'net company service fees',
      color: '#10B981',
      shadowRgb: '16, 185, 129',
      icon: (
        <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
        </svg>
      ),
    },
  ];

  const bars = [
    { labelAr: 'تم التسليم',      labelEn: 'Delivered',        pct: deliveredPct,  count: stats.delivered,  color: '#10B981' },
    { labelAr: 'خارج للتوصيل',   labelEn: 'Out for Delivery', pct: progressPct,   count: stats.progress,   color: '#3B82F6' },
    { labelAr: 'في المستودع',     labelEn: 'In Warehouse',     pct: warehousePct,  count: stats.warehouse,  color: '#F59E0B' },
    { labelAr: 'مسجلة فقط',       labelEn: 'Registered',       pct: registeredPct, count: stats.registered, color: '#818CF8' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="title-large">
            {isAr ? 'أهلاً بك، مدير النظام' : 'Welcome back, Administrator'}
          </h1>
          <p className="subtitle">
            {isAr
              ? 'مراقبة وإدارة أداء الشحن، تحصيل الأموال وتذاكر الدعم الفني بشكل مباشر.'
              : 'Monitor shipping performance, cash collections, and support tickets live.'}
          </p>
        </div>

        <button
          onClick={() => setShowResetModal(true)}
          style={{
            padding: '12px 22px', borderRadius: '14px', border: '1px solid rgba(239,68,68,0.4)',
            background: 'linear-gradient(135deg, rgba(239,68,68,0.18), rgba(220,38,38,0.08))',
            color: '#EF4444', fontWeight: 800, fontSize: '13px', cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', gap: '8px',
            backdropFilter: 'blur(10px)'
          }}
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6"/>
          </svg>
          {isAr ? 'إعادة تعيين وتصفير النظام' : 'Reset System & Safes'}
        </button>
      </div>

      {/* ── Stat Cards Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '18px' }}>
        {statCards.map((card, i) => (
          <div key={i} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              className="stat-icon"
              style={{ backgroundColor: card.color, boxShadow: `0 6px 20px rgba(${card.shadowRgb}, 0.38)` }}
            >
              {card.icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                {isAr ? card.titleAr : card.titleEn}
              </div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1, marginBottom: '4px', whiteSpace: 'nowrap' }} dir="ltr">
                {card.value}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                {isAr ? card.subAr : card.subEn}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Analytics Row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: '20px', alignItems: 'start' }}>

        {/* Status Distribution Bar Chart */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              {isAr ? 'توزيع حالات الشحنات' : 'Shipment Status Distribution'}
            </h4>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
              {isAr ? 'حسب حالة التوصيل الحالية' : 'By current delivery progress'}
            </span>
          </div>
          {bars.map((bar, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: bar.color }}>
                  {isAr ? bar.labelAr : bar.labelEn}
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }} dir="ltr">
                  {bar.count} ({bar.pct}%)
                </span>
              </div>
              <div style={{ height: '10px', borderRadius: '99px', backgroundColor: 'rgba(128,128,128,0.12)', overflow: 'hidden' }}>
                <div style={{ height: '100%', borderRadius: '99px', backgroundColor: bar.color, width: `${bar.pct}%`, transition: 'width 1.2s cubic-bezier(0.34,1.56,0.64,1)' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Recent Operations Log */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h4 style={{ fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
              {isAr ? 'آخر تحديثات العمليات' : 'Recent Operations'}
            </h4>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
              {isAr ? 'سجل الأحداث الأخيرة' : 'Latest event log'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {allLogs.map((log, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', paddingBottom: '12px', borderBottom: i < allLogs.length - 1 ? '1px solid var(--card-border)' : 'none' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', marginTop: '4px', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--primary-color)' }}>{log.trackingNumber}</span>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', whiteSpace: 'nowrap' }} dir="ltr">
                      {log.timestamp ? `${new Date(log.timestamp).getHours()}:${new Date(log.timestamp).getMinutes().toString().padStart(2, '0')}` : ''}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                    {isAr ? log.detailsAr : log.detailsEn}
                  </p>
                  <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{log.location}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ══ System Reset Confirmation Modal ══ */}
      {showResetModal && (
        <div className="modal-overlay" onClick={() => !isResetting && setShowResetModal(false)}>
          <div className="modal-content glass-panel" style={{ padding: '32px', maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <div style={{ width: '50px', height: '50px', borderRadius: '16px', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', flexShrink: 0 }}>
                <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
              </div>
              <div>
                <h3 style={{ fontWeight: 900, fontSize: '17px', color: '#EF4444', margin: 0 }}>
                  {isAr ? 'تأكيد تصفير وإعادة تعيين النظام' : 'Confirm System Reset'}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: '4px 0 0' }}>
                  {isAr ? 'حذف المعاملات وتصفير الخزائن مع الحفاظ على الحسابات' : 'Purge transactions and zero safes while retaining accounts'}
                </p>
              </div>
            </div>

            <div style={{
              padding: '16px 18px', borderRadius: '14px', background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)', marginBottom: '24px', fontSize: '13px',
              color: 'var(--text-primary)', lineHeight: 1.6
            }}>
              {isAr ? (
                <>
                  ⚠️ <b>تنبيه هام جداً:</b> سيتم حذف جميع الشحنات، المعاملات المالية، طلبات السحب، وتسويات المندوبين، وتصفير جميع الخزائن إلى <b>0.00 د.ل</b> بشكل نهائي.<br/>
                  ✅ <b>الحسابات المحتفظ بها:</b> حسابات المتاجر والمندوبين والموظفين ستبقى مسجلة ونشطة في النظام.
                </>
              ) : (
                <>
                  ⚠️ <b>WARNING:</b> This will permanently delete all shipments, transactions, payouts, and driver settlements, and zero out all safes to <b>0.00 LYD</b>.<br/>
                  ✅ <b>Retained Data:</b> Merchant, driver, and employee accounts will remain active.
                </>
              )}
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                disabled={isResetting}
                onClick={() => setShowResetModal(false)}
                style={{
                  padding: '11px 22px', borderRadius: '12px', border: '1px solid var(--glass-border)',
                  background: 'transparent', color: 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer'
                }}
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={handleConfirmReset}
                style={{
                  padding: '11px 26px', borderRadius: '12px', border: 'none',
                  background: 'linear-gradient(135deg, #EF4444, #DC2626)', color: '#fff',
                  fontWeight: 800, cursor: isResetting ? 'wait' : 'pointer', fontSize: '13px',
                  boxShadow: '0 4px 16px rgba(239,68,68,0.4)', opacity: isResetting ? 0.7 : 1
                }}
              >
                {isResetting ? (isAr ? 'جاري التصفير...' : 'Resetting...') : (isAr ? 'تأكيد تصفير النظام الآن' : 'Confirm Reset Now')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

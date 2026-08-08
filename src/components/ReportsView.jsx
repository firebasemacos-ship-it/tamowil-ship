'use client';
import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';

const DAY_LABELS_AR = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'اليوم'];
const DAY_LABELS_EN = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'];

export default function ReportsView() {
  const { lang, dashboardStats: stats, shipmentsList: shipments, merchants, dateFilter } = useApp();
  const isAr = lang === 'ar';

  const fmt = v => `${Number(v || 0).toLocaleString()} ${isAr ? 'د.ل' : 'LYD'}`;

  // Revenue bar chart data (mock 7-day)
  const revenueData = stats.dailyRevenue;
  const maxRevenue  = Math.max(...revenueData, 1);

  // City distribution
  const cityMap = {};
  shipments.forEach(s => { cityMap[s.receiverCity] = (cityMap[s.receiverCity] || 0) + 1; });
  const cityData = Object.entries(cityMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxCity  = Math.max(...cityData.map(c => c[1]), 1);

  // Merchant performance
  const merchantPerf = merchants.map(m => ({
    ...m,
    shipCount: shipments.filter(s => s.merchantId === m.id).length,
    revenue: shipments.filter(s => s.merchantId === m.id && s.status === 'Delivered').reduce((sum, s) => sum + ((s.price || 0) - (s.deliveryFee || 0) - (s.codFee || 0)), 0),
  })).sort((a, b) => b.revenue - a.revenue);

  // Status breakdown
  const statusBreakdown = [
    { labelAr: 'تم التسليم',     labelEn: 'Delivered',        count: stats.delivered,  color: '#10B981', pct: Math.round((stats.delivered  / (stats.total || 1)) * 100) },
    { labelAr: 'خارج للتوصيل',  labelEn: 'Out for Delivery', count: stats.progress,   color: '#3B82F6', pct: Math.round((stats.progress   / (stats.total || 1)) * 100) },
    { labelAr: 'في المستودع',    labelEn: 'In Warehouse',     count: stats.warehouse,  color: '#F59E0B', pct: Math.round((stats.warehouse  / (stats.total || 1)) * 100) },
    { labelAr: 'مسجلة',          labelEn: 'Registered',       count: stats.registered, color: '#818CF8', pct: Math.round((stats.registered / (stats.total || 1)) * 100) },
    { labelAr: 'مرتجعة',         labelEn: 'Returned',         count: stats.returned,   color: '#F87171', pct: Math.round((stats.returned   / (stats.total || 1)) * 100) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

      {/* Header + Period Filter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="title-large">{isAr ? 'التقارير المالية' : 'Financial Reports'}</h1>
          <p className="subtitle">{isAr ? 'تحليل مفصّل للإيرادات وأداء التوصيل.' : 'Detailed revenue analysis and delivery performance.'}</p>
        </div>
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(128,128,128,0.08)', padding: '4px', borderRadius: '12px' }}>
          <button onClick={() => window.print()} style={{ padding: '7px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, background: '#6366F1', color: '#fff' }}>
            <span style={{display: 'flex', gap: '4px', alignItems: 'center'}}><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg></span> {isAr ? 'طباعة التقرير الشامل' : 'Print Comprehensive Report'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: '14px' }}>
        {[
          { ar: 'الأرباح الإجمالية (Gross)', en: 'Gross Profits', val: fmt(stats.grossProfits), color: '#818CF8', rgb: '129,140,248',
            icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg> },
          { ar: 'المبالغ المحصلة (COD)', en: 'Total COD Collected', val: fmt(stats.totalCodCollected), color: '#3B82F6', rgb: '59,130,246',
            icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg> },
          { ar: 'صافي أرباح الشركة', en: 'Net Company Profits', val: fmt(stats.netCompanyProfits), color: '#10B981', rgb: '16,185,129',
            icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg> },
          { ar: 'ما للشركة (على السائقين)', en: 'Drivers Debt to Co.', val: fmt(stats.driversPendingSettlement), color: '#F59E0B', rgb: '245,158,11',
            icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg> },
          { ar: 'ديون التجار (للشركة عليهم)', en: 'Company Debt to Merchants', val: fmt(stats.totalMerchantBalance), color: '#EF4444', rgb: '239,68,68',
            icon: <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg> },
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

      {/* Charts Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 280px', gap: '20px' }}>

        {/* Daily Revenue Bar Chart */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
              {isAr ? 'الإيرادات اليومية (آخر 7 أيام)' : 'Daily Revenue (Last 7 Days)'}
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{isAr ? 'مجموع رسوم التوصيل + COD يومياً' : 'Sum of delivery + COD fees per day'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: '140px' }}>
            {revenueData.map((val, i) => {
              const h = Math.max(8, (val / maxRevenue) * 120);
              const isToday = i === revenueData.length - 1;
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: isToday ? 'var(--primary-color)' : 'var(--text-tertiary)' }} dir="ltr">{val}</span>
                  <div style={{ width: '100%', height: `${h}px`, borderRadius: '8px 8px 4px 4px', background: isToday ? 'var(--primary-color)' : 'rgba(99,102,241,0.4)', boxShadow: isToday ? '0 4px 12px rgba(16,185,129,0.3)' : 'none', transition: 'height 0.8s ease' }} />
                  <span style={{ fontSize: '9px', color: 'var(--text-tertiary)', textAlign: 'center' }}>{isAr ? DAY_LABELS_AR[i] : DAY_LABELS_EN[i]}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Donut (CSS-only ring chart) */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            {isAr ? 'توزيع الحالات' : 'Status Breakdown'}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {statusBreakdown.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: `conic-gradient(${s.color} ${s.pct}%, transparent ${s.pct}%)`, flexShrink: 0, boxShadow: `0 0 8px ${s.color}40` }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{isAr ? s.labelAr : s.labelEn}</span>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: s.color }}>{s.pct}%</span>
                  </div>
                  <div style={{ height: '4px', borderRadius: '99px', background: 'rgba(128,128,128,0.12)', marginTop: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${s.pct}%`, background: s.color, borderRadius: '99px' }} />
                  </div>
                </div>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', minWidth: '20px', textAlign: 'center' }}>{s.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row: City Performance + Top Merchants */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Top Cities by Shipments */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
            {isAr ? 'أكثر المدن شحنات' : 'Top Cities by Shipments'}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {cityData.map(([city, count], i) => (
              <div key={city} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', minWidth: '18px' }}>#{i + 1}</span>
                <span style={{ flex: 1, fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{city}</span>
                <div style={{ width: '100px', height: '8px', borderRadius: '99px', background: 'rgba(128,128,128,0.1)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(count / maxCity) * 100}%`, background: 'var(--primary-color)', borderRadius: '99px' }} />
                </div>
                <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--primary-color)', minWidth: '24px', textAlign: 'end' }}>{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Merchants */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h3 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="18 20 18 10"/><polyline points="12 20 12 4"/><polyline points="6 20 6 14"/></svg>
            {isAr ? 'أفضل التجار أداءً' : 'Top Performing Merchants'}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {merchantPerf.map((m, i) => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px', borderRadius: '12px', background: 'rgba(128,128,128,0.05)', border: '1px solid var(--card-border)' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: ['#10B981', '#3B82F6', '#818CF8'][i] || '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--text-primary)' }}>{m.storeName}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{isAr ? `${m.shipCount} شحنة` : `${m.shipCount} shipments`}</div>
                </div>
                <div style={{ textAlign: 'end' }}>
                  <div style={{ fontWeight: 800, fontSize: '14px', color: '#10B981' }} dir="ltr">{m.revenue.toLocaleString()} {isAr ? 'د.ل' : 'LYD'}</div>
                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{isAr ? 'إجمالي COD' : 'Total COD'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════ PRINTABLE FINANCIAL REPORT (A4) ══════════════ */}
      

      <div className="printable-area hide-on-screen" dir="rtl">
        <div className="print-header">
          <div className="print-logo-container"><img src="/logo-color.png" alt="Tamowil Delivery" /></div>
          <p className="print-subtitle">التقرير المالي الشامل (Comprehensive Financial Report)</p>
        </div>

        <div className="print-meta-info">
          <div>تاريخ التقرير: {new Date().toLocaleDateString('ar-LY')}</div>
          <div>الفترة: {
            dateFilter === 'all' ? 'كل الأوقات' :
            dateFilter === 'today' ? 'اليوم' :
            dateFilter === 'week' ? 'هذا الأسبوع' :
            dateFilter === 'month' ? 'هذا الشهر' :
            dateFilter === 'year' ? 'هذه السنة' : 'مخصص'
          }</div>
        </div>

        <table className="print-table">
          <thead>
            <tr>
              <th colSpan="2">ملخص الأرباح والمحصلات</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>الأرباح الإجمالية (إجمالي رسوم التوصيل والـ COD)</td>
              <td dir="ltr" style={{ width: '150px' }}>{Number(stats.grossProfits || 0).toLocaleString()} د.ل</td>
            </tr>
            <tr>
              <td>المبالغ المحصلة (دفع عند الاستلام - COD)</td>
              <td dir="ltr">{Number(stats.totalCodCollected || 0).toLocaleString()} د.ل</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 'bold' }}>صافي أرباح التوصيل للشركة (صافي عمولة الـ COD)</td>
              <td dir="ltr" style={{ fontWeight: 'bold' }}>{Number(stats.netCompanyProfits || 0).toLocaleString()} د.ل</td>
            </tr>
          </tbody>
        </table>

        <table className="print-table">
          <thead>
            <tr>
              <th colSpan="2">حساب الديون والمستحقات</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>ما للشركة (أرصدة معلقة لدى السائقين والمناديب)</td>
              <td dir="ltr" style={{ width: '150px' }}>{Number(stats.driversPendingSettlement || 0).toLocaleString()} د.ل</td>
            </tr>
            <tr>
              <td>ما على الشركة (ديون ومستحقات لصالح المتاجر والتجار)</td>
              <td dir="ltr">{Number(stats.totalMerchantBalance || 0).toLocaleString()} د.ل</td>
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

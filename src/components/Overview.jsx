'use client';

import React from 'react';
import { useApp } from '@/context/AppContext';
export default function Overview() {
  const { lang, dashboardStats: stats, shipmentsList: shipments } = useApp();
  const isAr = lang === 'ar';

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
      titleAr: 'إجمالي الشحنات',
      titleEn: 'Total Shipments',
      value: stats.total,
      subAr: 'شحنة مسجلة بالنظام',
      subEn: 'registered in system',
      color: '#818CF8',
      shadowRgb: '129, 140, 248',
      icon: (
        <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
        </svg>
      ),
    },
    {
      titleAr: 'الشحنات المسلَّمة',
      titleEn: 'Delivered',
      value: stats.delivered,
      subAr: `نسبة نجاح ${deliveredPct}%`,
      subEn: `${deliveredPct}% success rate`,
      color: '#10B981',
      shadowRgb: '16, 185, 129',
      icon: (
        <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
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
      value: fmt(stats.totalRevenue),
      subAr: 'من رسوم التوصيل والـ COD',
      subEn: 'from delivery & service fees',
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
                      {log.timestamp.getHours()}:{log.timestamp.getMinutes().toString().padStart(2, '0')}
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
    </div>
  );
}

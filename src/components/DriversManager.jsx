'use client';
import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';

// ── SVG helper ────────────────────────────────────────────────
const S = ({ d, children, size = 16, ...p }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...p}>
    {d ? <path d={d} /> : children}
  </svg>
);

const Icon = {
  users:    <S size={18}><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></S>,
  inactive: <S size={18}><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></S>,
  box:      <S size={18}><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></S>,
  globe:    <S size={18}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></S>,
  cash:     <S size={18}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></S>,
  pending:  <S size={18}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></S>,
  settled:  <S size={18}><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></S>,
  plus:     <S size={14}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></S>,
  star:     <S size={13}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></S>,
  pin:      <S size={11}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></S>,
  check:    <S size={14}><polyline points="20 6 9 17 4 12"/></S>,
  wallet:   <S size={18}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></S>,
  history:  <S size={16}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 102.13-9.36L1 10"/></S>,
  info:     <S size={14}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></S>,
  x:        <S size={14}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></S>,
};

const Ring = ({ pct, color }) => {
  const r = 20;
  const c = Math.PI * r * 2;
  return (
    <svg width="48" height="48" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx="24" cy="24" r={r} fill="none" stroke="rgba(128,128,128,0.12)" strokeWidth="4" />
      <circle cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="4"
        strokeDasharray={c} strokeDashoffset={c - (pct / 100) * c}
        strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
    </svg>
  );
};

// ── Tab Button ────────────────────────────────────────────────
const Tab = ({ active, onClick, children, badge }) => (
  <button onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: '8px',
    padding: '10px 18px', borderRadius: '12px', border: 'none', cursor: 'pointer',
    fontWeight: 700, fontSize: '13px',
    background: active ? 'var(--primary-color)' : 'rgba(128,128,128,0.08)',
    color: active ? '#fff' : 'var(--text-secondary)',
    transition: 'all 0.2s ease',
  }}>
    {children}
    {badge > 0 && (
      <span style={{ background: active ? 'rgba(255,255,255,0.25)' : '#EF4444', color: '#fff', borderRadius: '99px', padding: '1px 7px', fontSize: '10px', fontWeight: 800 }}>
        {badge}
      </span>
    )}
  </button>
);

// ─────────────────────────────────────────────────────────────
export default function DriversManager() {
  const {
    lang,
    drivers,
    shipmentsList: shipments,
    driverSettlements: settlements,
    safes,
    addDriver,
    editDriver,
    deleteDriver,
    toggleDriverStatus,
    assignDriverToShipment,
    settleDriver
  } = useApp();
  const isAr = lang === 'ar';
  const fmt = v => `${Number(v).toLocaleString('ar-LY')} ${isAr ? 'د.ل' : 'LYD'}`;

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setTab]           = useState('drivers'); // 'drivers' | 'settlement' | 'history'
  const [showAdd, setShowAdd]         = useState(false);
  const [assignModal, setAssignModal] = useState(null);
  const [selectedDriver, setSel]      = useState('');
  const [settleModal, setSettleModal] = useState(null); // driver object
  const [editModal, setEditModal]     = useState(null); // driver object
  const [driverProfileModal, setDriverProfileModal] = useState(null); // driver object
  const [driverProfileTab, setDriverProfileTab] = useState('shipments'); // 'shipments' | 'transactions'
  const [settleForm, setSettleForm]   = useState({ amount: '', note: '', safeId: 'SAFE-001' });
  const [expandDriver, setExpand]     = useState(null);
  const [form, setForm]               = useState({ name: '', phone: '', zone: '', password: '' });

  const filteredDrivers = drivers.filter(d => {
    const q = searchQuery.toLowerCase();
    return (
      (d.name && d.name.toLowerCase().includes(q)) ||
      (d.phone && d.phone.toLowerCase().includes(q)) ||
      (d.zone && d.zone.toLowerCase().includes(q)) ||
      (d.id && String(d.id).toLowerCase().includes(q))
    );
  });

  const activeCount   = drivers.filter(d => d.active).length;
  const inactiveCount = drivers.filter(d => !d.active).length;
  const unassigned    = shipments.filter(s => !s.assignedDriver && s.status !== 'Delivered' && s.status !== 'Returned').length;
  const zones         = [...new Set(drivers.map(d => d.zone))];
  const totalPending  = drivers.reduce((s, d) => s + (d.pendingSettlement || 0), 0);
  const totalSettled  = drivers.reduce((s, d) => s + (d.codSettled || 0), 0);

  function handleAdd(e) {
    e.preventDefault();
    if (!form.name || !form.phone || !form.zone) return;
    addDriver(form);
    setForm({ name: '', phone: '', zone: '', password: '' });
    setShowAdd(false);
  }

  function handleEdit(e) {
    e.preventDefault();
    if (!editModal.phone) return;
    editDriver(editModal.id, { phone: editModal.phone, password: editModal.password });
    setEditModal(null);
  }

  function handleAssign() {
    if (!selectedDriver || !assignModal) return;
    assignDriverToShipment(assignModal, selectedDriver);
    setAssignModal(null); setSel('');
  }

  function handleSettle(e) {
    e.preventDefault();
    if (!settleModal || !settleForm.amount) return;
    settleDriver(settleModal.id, parseFloat(settleForm.amount), settleForm.note, settleForm.safeId || 'SAFE-001');
    setSettleModal(null);
    setSettleForm({ amount: '', note: '', safeId: 'SAFE-001' });
  }

  function handlePrint() {
    window.print();
  }

  const driverSettlementHistory = useMemo(() =>
    expandDriver ? settlements.filter(s => s.driverId === expandDriver) : settlements,
    [settlements, expandDriver]
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 className="title-large">{isAr ? 'إدارة السائقين' : 'Driver Management'}</h1>
          <p className="subtitle">{isAr ? 'إضافة وتتبع السائقين، تعيين الشحنات، وتسوية مبالغ COD.' : 'Manage drivers, assign shipments, and settle COD amounts.'}</p>
        </div>
        <button className="glass-button" onClick={() => setShowAdd(true)}>
          {Icon.plus} {isAr ? 'إضافة سائق' : 'Add Driver'}
        </button>
      </div>

      {/* ── KPI Cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: '14px' }}>
        {[
          { ar: 'سائقون نشطون',     en: 'Active Drivers',    val: activeCount,   color: '#10B981', rgb: '16,185,129',   icon: Icon.users },
          { ar: 'سائقون معطّلون',   en: 'Inactive',          val: inactiveCount, color: '#94A3B8', rgb: '148,163,184',  icon: Icon.inactive },
          { ar: 'شحنات بلا سائق',  en: 'Unassigned',        val: unassigned,    color: '#F59E0B', rgb: '245,158,11',   icon: Icon.box, urgent: unassigned > 0 },
          { ar: 'بانتظار التسوية', en: 'Pending Settlement', val: fmt(totalPending), color: '#EF4444', rgb: '239,68,68', icon: Icon.pending, urgent: totalPending > 0 },
          { ar: 'إجمالي المُسوَّى', en: 'Total Settled',     val: fmt(totalSettled), color: '#818CF8', rgb: '129,140,248', icon: Icon.settled },
        ].map((c, i) => (
          <div key={i} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative', overflow: 'hidden' }}>
            {c.urgent && <div style={{ position: 'absolute', top: '10px', insetInlineStart: '10px', width: '7px', height: '7px', borderRadius: '50%', background: c.color, boxShadow: `0 0 0 3px ${c.color}33`, animation: 'pulse 2s infinite' }} />}
            <div className="stat-icon" style={{ background: `linear-gradient(135deg,${c.color}cc,${c.color}77)`, boxShadow: `0 4px 16px rgba(${c.rgb},0.4)`, color: '#fff' }}>
              {c.icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '2px' }}>{isAr ? c.ar : c.en}</div>
              <div style={{ fontSize: typeof c.val === 'number' ? '22px' : '14px', fontWeight: 800, color: c.urgent ? c.color : 'var(--text-primary)', lineHeight: 1 }}>{c.val}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <Tab active={activeTab === 'drivers'}    onClick={() => setTab('drivers')}    badge={unassigned}>{Icon.users} {isAr ? 'السائقون' : 'Drivers'}</Tab>
        <Tab active={activeTab === 'settlement'} onClick={() => setTab('settlement')} badge={drivers.filter(d => d.pendingSettlement > 0).length}>{Icon.cash} {isAr ? 'التسوية المالية' : 'COD Settlement'}</Tab>
        <Tab active={activeTab === 'history'}    onClick={() => setTab('history')}    badge={0}>{Icon.history} {isAr ? 'سجل التسويات' : 'Settlement History'}</Tab>
      </div>

      {/* ═══════════ TAB: DRIVERS ═══════════ */}
      {activeTab === 'drivers' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px', alignItems: 'start' }}>

          {/* Drivers Table */}
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{Icon.users}</span>
                <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>{isAr ? 'قائمة السائقين' : 'Drivers List'}</span>
              </div>
              <input 
                type="text" 
                className="glass-input" 
                style={{ width: '220px', padding: '6px 12px', fontSize: '12px' }}
                placeholder={isAr ? 'ابحث باسم السائق، الهاتف، أو المنطقة...' : 'Search driver, phone, zone...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>{isAr ? 'الاسم' : 'Name'}</th>
                  <th>{isAr ? 'المنطقة' : 'Zone'}</th>
                  <th>{isAr ? 'اليوم' : 'Today'}</th>
                  <th>{isAr ? 'الإجمالي' : 'Total'}</th>
                  <th>{isAr ? 'التقييم' : 'Rating'}</th>
                  <th>{isAr ? 'COD معلق' : 'Pending COD'}</th>
                  <th>{isAr ? 'الحالة والإجراءات' : 'Status & Actions'}</th>
                </tr>
              </thead>
              <tbody>
                {filteredDrivers.map(d => (
                  <tr key={d.id}>
                    <td>
                      <div 
                        style={{ fontWeight: 800, fontSize: '13px', cursor: 'pointer', color: 'var(--primary-color)' }}
                        onClick={() => { setDriverProfileModal(d); setDriverProfileTab('shipments'); }}
                      >
                        {d.name}
                      </div>
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', direction: 'ltr' }}>{d.phone}</div>
                    </td>
                    <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{d.zone}</td>
                    <td style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>{d.shipmentsToday}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{d.shipmentsCompleted}</td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: '#FBBF24', fontSize: '12px' }}>
                        {Icon.star} {d.rating}
                      </span>
                    </td>
                    <td>
                      {(d.pendingSettlement || 0) > 0 ? (
                        <span style={{ fontWeight: 700, color: '#EF4444', fontSize: '12px' }} dir="ltr">
                          {(d.pendingSettlement).toLocaleString()} {isAr ? 'د.ل' : 'LYD'}
                        </span>
                      ) : (
                        <span style={{ color: '#10B981', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {Icon.check} {isAr ? 'مُسوَّى' : 'Clear'}
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <button onClick={() => toggleDriverStatus(d.id)} style={{
                          padding: '5px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '11px',
                          background: d.active ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                          color: d.active ? '#10B981' : '#EF4444'
                        }}>
                          {d.active ? (isAr ? '● نشط' : '● Active') : (isAr ? '○ معطّل' : '○ Off')}
                        </button>
                        <button onClick={() => setEditModal({ id: d.id, name: d.name, phone: d.phone, password: '' })} title={isAr ? 'تعديل' : 'Edit'} style={{
                          padding: '5px 8px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'rgba(99,102,241,0.1)', color: '#6366F1'
                        }}>
                          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm(isAr ? `هل أنت متأكد من حذف السائق (${d.name})؟` : `Delete driver ${d.name}?`)) {
                              deleteDriver(d.id);
                            }
                          }} 
                          title={isAr ? 'حذف' : 'Delete'}
                          style={{
                            padding: '5px 8px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'rgba(239,68,68,0.1)', color: '#EF4444'
                          }}
                        >
                          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Unassigned Shipments */}
          <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {Icon.box} {isAr ? 'شحنات بلا سائق' : 'Unassigned Shipments'}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
              {shipments.filter(s => !s.assignedDriver && s.status !== 'Delivered' && s.status !== 'Returned').map(s => (
                <div key={s.trackingNumber} style={{ padding: '12px', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'rgba(245,158,11,0.03)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 700, fontSize: '12px', color: 'var(--primary-color)' }}>{s.trackingNumber}</span>
                    <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '6px', fontWeight: 700, background: 'rgba(245,158,11,0.12)', color: '#F59E0B' }}>{s.status}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-primary)', marginBottom: '2px' }}>{s.receiverName}</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {Icon.pin} {s.receiverCity}
                  </div>
                  <button onClick={() => setAssignModal(s.trackingNumber)} style={{ width: '100%', padding: '7px', borderRadius: '8px', border: '1px dashed var(--primary-color)', background: 'transparent', color: 'var(--primary-color)', fontWeight: 700, fontSize: '11px', cursor: 'pointer' }}>
                    {isAr ? '+ تعيين سائق' : '+ Assign Driver'}
                  </button>
                </div>
              ))}
              {unassigned === 0 && (
                <div style={{ textAlign: 'center', padding: '30px 0' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#10B981', fontWeight: 700, padding: '8px 16px', borderRadius: '10px', background: 'rgba(16,185,129,0.08)' }}>
                    {Icon.check} {isAr ? 'جميع الشحنات موزّعة' : 'All shipments assigned'}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════ TAB: SETTLEMENT ═══════════ */}
      {activeTab === 'settlement' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Info banner */}
          <div style={{ padding: '14px 18px', borderRadius: '14px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <span style={{ color: '#10B981', flexShrink: 0 }}>{Icon.info}</span>
            {isAr
              ? 'السائقون يجمعون مبالغ COD نقداً من العملاء عند التسليم. يجب تسوية هذه المبالغ مع الشركة بشكل دوري.'
              : 'Drivers collect COD cash from customers upon delivery. These amounts must be settled with the company periodically.'}
          </div>

          {drivers.map(d => {
            const pct = d.codCollected > 0 ? Math.round((d.codSettled / d.codCollected) * 100) : 100;
            const hasPending = d.pendingSettlement > 0;
            return (
              <div key={d.id} className="glass-card" style={{
                border: hasPending ? '1px solid rgba(239,68,68,0.2)' : '1px solid var(--card-border)',
                background: hasPending ? 'rgba(239,68,68,0.02)' : undefined,
              }}>
                {hasPending && <div style={{ height: '3px', background: 'linear-gradient(90deg,#EF4444,#F87171)', borderRadius: '99px 99px 0 0', marginBottom: '0', marginTop: '-22px', marginInline: '-22px', marginBottom: '18px' }} />}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  {/* Ring */}
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <Ring pct={pct} color={hasPending ? '#EF4444' : '#10B981'} />
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, color: hasPending ? '#EF4444' : '#10B981' }}>
                      {pct}%
                    </div>
                  </div>

                  {/* Driver info */}
                  <div style={{ flex: 1, minWidth: '120px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                      <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-primary)' }}>{d.name}</span>
                      <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '6px', fontWeight: 700,
                        background: d.active ? 'rgba(16,185,129,0.1)' : 'rgba(148,163,184,0.1)',
                        color: d.active ? '#10B981' : '#94A3B8' }}>
                        {d.active ? (isAr ? 'نشط' : 'Active') : (isAr ? 'غير نشط' : 'Off')}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {Icon.pin} {d.zone}
                    </div>
                  </div>

                  {/* Financial stats */}
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    {[
                      { ar: 'إجمالي COD المحصّل', en: 'Total COD', val: d.codCollected || 0, color: 'var(--text-secondary)' },
                      { ar: 'تم تسليمه للشركة', en: 'Settled',    val: d.codSettled || 0,   color: '#10B981' },
                      { ar: 'بانتظار التسوية',   en: 'Pending',   val: d.pendingSettlement || 0, color: d.pendingSettlement > 0 ? '#EF4444' : 'var(--text-tertiary)' },
                    ].map((stat, i) => (
                      <div key={i} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginBottom: '3px', whiteSpace: 'nowrap' }}>{isAr ? stat.ar : stat.en}</div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: stat.color }} dir="ltr">{stat.val.toLocaleString()} <span style={{ fontSize: '10px', fontWeight: 400 }}>{isAr ? 'د.ل' : 'LYD'}</span></div>
                      </div>
                    ))}
                  </div>

                  {/* Settle button */}
                  <button
                    onClick={() => { setSettleModal(d); setSettleForm({ amount: d.pendingSettlement || '', note: '' }); }}
                    disabled={!hasPending}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      padding: '10px 20px', borderRadius: '12px', border: 'none', cursor: hasPending ? 'pointer' : 'not-allowed',
                      background: hasPending ? 'linear-gradient(135deg,#10B981,#059669)' : 'rgba(128,128,128,0.08)',
                      color: hasPending ? '#fff' : 'var(--text-tertiary)',
                      fontWeight: 700, fontSize: '12px', flexShrink: 0,
                      boxShadow: hasPending ? '0 4px 14px rgba(16,185,129,0.35)' : 'none',
                      opacity: hasPending ? 1 : 0.6,
                    }}
                  >
                    {Icon.settled} {isAr ? 'تسوية الآن' : 'Settle Now'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════ TAB: HISTORY ═══════════ */}
      {activeTab === 'history' && (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {Icon.history} {isAr ? 'سجل التسويات المالية' : 'Settlement History'}
            </h3>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button onClick={handlePrint} style={{ padding: '5px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 700, background: '#6366F1', color: '#fff' }}>
                <span style={{display: 'flex', gap: '4px', alignItems: 'center'}}><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg></span> {isAr ? 'طباعة الكشف' : 'Print'}
              </button>
              <button onClick={() => setExpand(null)} style={{ padding: '5px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 700, background: !expandDriver ? 'var(--primary-color)' : 'rgba(128,128,128,0.08)', color: !expandDriver ? '#fff' : 'var(--text-secondary)' }}>
                {isAr ? 'الكل' : 'All'}
              </button>
              {drivers.map(d => (
                <button key={d.id} onClick={() => setExpand(expandDriver === d.id ? null : d.id)} style={{ padding: '5px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 700, background: expandDriver === d.id ? 'var(--primary-color)' : 'rgba(128,128,128,0.08)', color: expandDriver === d.id ? '#fff' : 'var(--text-secondary)' }}>
                  {d.name.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
          <table className="custom-table">
            <thead>
              <tr>
                <th>{isAr ? 'رقم التسوية' : 'Ref'}</th>
                <th>{isAr ? 'السائق' : 'Driver'}</th>
                <th>{isAr ? 'ملاحظة' : 'Note'}</th>
                <th>{isAr ? 'التاريخ' : 'Date'}</th>
                <th>{isAr ? 'المبلغ' : 'Amount'}</th>
                <th>{isAr ? 'الحالة' : 'Status'}</th>
              </tr>
            </thead>
            <tbody>
              {driverSettlementHistory.map(s => (
                <tr key={s.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-tertiary)' }} dir="ltr">{s.id}</td>
                  <td style={{ fontWeight: 700 }}>{s.driverName}</td>
                  <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{s.note || '—'}</td>
                  <td style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{s.date.toLocaleDateString()}</td>
                  <td style={{ fontWeight: 800, color: '#10B981' }} dir="ltr">+{s.amount.toLocaleString()} {isAr ? 'د.ل' : 'LYD'}</td>
                  <td>
                    <span style={{ padding: '3px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 700, background: 'rgba(16,185,129,0.1)', color: '#10B981' }}>
                      {isAr ? 'مُسوَّى' : 'Settled'}
                    </span>
                  </td>
                </tr>
              ))}
              {driverSettlementHistory.length === 0 && (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)', fontSize: '13px' }}>{isAr ? 'لا توجد تسويات بعد.' : 'No settlements yet.'}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ══ Add Driver Modal ══ */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal-content glass-panel" style={{ padding: '28px', maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {Icon.plus} {isAr ? 'إضافة سائق جديد' : 'Add New Driver'}
            </h3>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { key: 'name',  labelAr: 'الاسم الكامل',    labelEn: 'Full Name',    ph: isAr ? 'محمد العجيلي' : 'Driver Name' },
                { key: 'phone', labelAr: 'رقم الهاتف',       labelEn: 'Phone',        ph: '09xxxxxxxx' },
                { key: 'zone',  labelAr: 'المنطقة المسؤولة', labelEn: 'Coverage Zone', ph: isAr ? 'طرابلس الغرب' : 'Tripoli West' },
                { key: 'password', labelAr: 'كلمة المرور',    labelEn: 'Password',      ph: '••••••' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>{isAr ? f.labelAr : f.labelEn}</label>
                  <input required type={f.key === 'password' ? 'password' : 'text'} className="glass-input" placeholder={f.ph} value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))} />
                </div>
              ))}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button type="button" onClick={() => setShowAdd(false)} style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}>{isAr ? 'إلغاء' : 'Cancel'}</button>
                <button type="submit" className="glass-button">{isAr ? 'حفظ' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ Assign Driver Modal ══ */}
      {assignModal && (
        <div className="modal-overlay" onClick={() => setAssignModal(null)}>
          <div className="modal-content glass-panel" style={{ padding: '28px', maxWidth: '400px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-primary)', marginBottom: '6px' }}>{isAr ? 'تعيين سائق' : 'Assign Driver'}</h3>
            <p style={{ fontSize: '12px', color: 'var(--primary-color)', marginBottom: '20px', fontWeight: 700 }}>{assignModal}</p>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>{isAr ? 'اختر السائق:' : 'Select Driver:'}</label>
            <select className="glass-input" style={{ marginBottom: '20px' }} value={selectedDriver} onChange={e => setSel(e.target.value)}>
              <option value="">{isAr ? '-- اختر سائقاً --' : '-- Choose driver --'}</option>
              {drivers.filter(d => d.active).map(d => <option key={d.id} value={d.id}>{d.name} — {d.zone}</option>)}
            </select>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button onClick={() => setAssignModal(null)} style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}>{isAr ? 'إلغاء' : 'Cancel'}</button>
              <button onClick={handleAssign} disabled={!selectedDriver} className="glass-button" style={{ opacity: selectedDriver ? 1 : 0.5 }}>{isAr ? 'تعيين' : 'Assign'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Edit Driver Modal ══ */}
      {editModal && (
        <div className="modal-overlay" onClick={() => setEditModal(null)}>
          <div className="modal-content glass-panel" style={{ padding: '28px', maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-primary)', marginBottom: '6px' }}>
              {isAr ? 'تعديل بيانات السائق' : 'Edit Driver Info'}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>{editModal.name}</p>
            <form onSubmit={handleEdit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  {isAr ? 'رقم الهاتف' : 'Phone'}
                </label>
                <input required type="text" className="glass-input" value={editModal.phone} onChange={e => setEditModal(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  {isAr ? 'كلمة المرور الجديدة' : 'New Password'}
                </label>
                <input type="text" className="glass-input" placeholder={isAr ? 'اتركها فارغة لعدم التغيير' : 'Leave empty to keep current'} value={editModal.password} onChange={e => setEditModal(p => ({ ...p, password: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button type="button" onClick={() => setEditModal(null)} style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}>{isAr ? 'إلغاء' : 'Cancel'}</button>
                <button type="submit" className="glass-button">{isAr ? 'حفظ التعديلات' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══ Settle Modal ══ */}
      {settleModal && (
        <div className="modal-overlay" onClick={() => setSettleModal(null)}>
          <div className="modal-content glass-panel" style={{ padding: '32px', maxWidth: '460px' }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '24px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981', flexShrink: 0 }}>
                {Icon.wallet}
              </div>
              <div>
                <h3 style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-primary)', margin: 0 }}>{isAr ? 'تسجيل تسوية مالية' : 'Record COD Settlement'}</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: '3px 0 0' }}>{settleModal.name} • {settleModal.zone}</p>
              </div>
            </div>

            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '22px' }}>
              {[
                { ar: 'إجمالي COD', en: 'Total COD', val: settleModal.codCollected || 0, color: 'var(--text-secondary)' },
                { ar: 'تم تسليمه', en: 'Already Settled', val: settleModal.codSettled || 0, color: '#10B981' },
                { ar: 'المبلغ المعلق', en: 'Pending Amount', val: settleModal.pendingSettlement || 0, color: '#EF4444' },
              ].map((s, i) => (
                <div key={i} style={{ padding: '12px 14px', borderRadius: '12px', background: 'rgba(128,128,128,0.06)', border: '1px solid var(--card-border)', gridColumn: i === 2 ? '1/-1' : 'auto' }}>
                  <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>{isAr ? s.ar : s.en}</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: s.color }} dir="ltr">{s.val.toLocaleString()} {isAr ? 'د.ل' : 'LYD'}</div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSettle} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  {isAr ? 'الخزينة المستلمة' : 'Receiving Safe'}
                </label>
                <select className="glass-input w-full" value={settleForm.safeId} onChange={e => setSettleForm(p => ({ ...p, safeId: e.target.value }))}>
                  {(safes || []).map(s => <option key={s.id} value={s.id}>{s.name} ({s.branch})</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  {isAr ? 'المبلغ المُسلَّم (د.ل)' : 'Amount Received (LYD)'}
                </label>
                <input required type="number" min="1" max={settleModal.pendingSettlement} className="glass-input"
                  placeholder="0.00" value={settleForm.amount} onChange={e => setSettleForm(p => ({ ...p, amount: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  {isAr ? 'ملاحظة (اختياري)' : 'Note (optional)'}
                </label>
                <input type="text" className="glass-input" placeholder={isAr ? 'تسوية أسبوع يوليو...' : 'Weekly July settlement...'}
                  value={settleForm.note} onChange={e => setSettleForm(p => ({ ...p, note: e.target.value }))} />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button type="button" onClick={() => setSettleModal(null)} style={{ padding: '11px 22px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}>
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" style={{ padding: '11px 26px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#10B981,#059669)', color: '#fff', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 14px rgba(16,185,129,0.4)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {Icon.settled} {isAr ? 'تأكيد التسوية' : 'Confirm Settlement'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ══ Driver Profile Modal ══ */}
      {driverProfileModal && (
        <div className="modal-overlay" onClick={() => setDriverProfileModal(null)}>
          <div className="modal-content glass-panel hide-on-print" style={{ padding: '0', maxWidth: '800px', height: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div style={{ padding: '24px', borderBottom: '1px solid var(--card-border)', background: 'linear-gradient(to right, rgba(16, 185, 129, 0.05), transparent)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--primary-color)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}>
                    {driverProfileModal.name.charAt(0)}
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>{driverProfileModal.name}</h2>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px', display: 'flex', gap: '12px' }}>
                      <span dir="ltr">{driverProfileModal.phone}</span>
                      <span>• {driverProfileModal.zone}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => setDriverProfileModal(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                  {Icon.x}
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '24px' }}>
                <div className="glass-card" style={{ padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{isAr ? 'شحنات مكتملة' : 'Completed'}</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary-color)' }}>{driverProfileModal.shipmentsCompleted}</div>
                </div>
                <div className="glass-card" style={{ padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{isAr ? 'COD معلق' : 'Pending COD'}</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#EF4444' }} dir="ltr">{driverProfileModal.pendingSettlement} {isAr ? 'د.ل' : 'LYD'}</div>
                </div>
                <div className="glass-card" style={{ padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{isAr ? 'إجمالي مُسوَّى' : 'Total Settled'}</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#10B981' }} dir="ltr">{driverProfileModal.codSettled} {isAr ? 'د.ل' : 'LYD'}</div>
                </div>
                <div className="glass-card" style={{ padding: '12px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{isAr ? 'التقييم' : 'Rating'}</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#FBBF24', display: 'flex', alignItems: 'center', gap: '4px' }}>{Icon.star} {driverProfileModal.rating}</div>
                </div>
              </div>
            </div>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '2px', borderBottom: '1px solid var(--card-border)', background: 'rgba(0,0,0,0.02)' }}>
              <button onClick={() => setDriverProfileTab('shipments')} style={{ flex: 1, padding: '14px', border: 'none', background: driverProfileTab === 'shipments' ? 'var(--bg-primary)' : 'transparent', borderBottom: driverProfileTab === 'shipments' ? '2px solid var(--primary-color)' : '2px solid transparent', fontWeight: 700, cursor: 'pointer', color: driverProfileTab === 'shipments' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                {isAr ? 'كشف الطلبات (الشحنات)' : 'Shipments Statement'}
              </button>
              <button onClick={() => setDriverProfileTab('transactions')} style={{ flex: 1, padding: '14px', border: 'none', background: driverProfileTab === 'transactions' ? 'var(--bg-primary)' : 'transparent', borderBottom: driverProfileTab === 'transactions' ? '2px solid var(--primary-color)' : '2px solid transparent', fontWeight: 700, cursor: 'pointer', color: driverProfileTab === 'transactions' ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
                {isAr ? 'كشف حساب حركات' : 'Transactions Statement'}
              </button>
            </div>
            {/* Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px', background: 'var(--bg-primary)' }}>
              {driverProfileTab === 'shipments' && (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>{isAr ? 'رقم التتبع' : 'Tracking No'}</th>
                      <th>{isAr ? 'المستلم' : 'Receiver'}</th>
                      <th>{isAr ? 'المدينة' : 'City'}</th>
                      <th>{isAr ? 'الإجمالي' : 'Total'}</th>
                      <th>{isAr ? 'الحالة' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shipments.filter(s => s.assignedDriver === driverProfileModal.id).map(s => (
                      <tr key={s.trackingNumber}>
                        <td style={{ fontWeight: 700, color: 'var(--accent-blue)' }}>{s.trackingNumber}</td>
                        <td>{s.receiverName} <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', direction: 'ltr' }}>{s.receiverPhone}</div></td>
                        <td>{s.receiverCity}</td>
                        <td style={{ fontWeight: 800, color: '#10B981' }} dir="ltr">{s.price + s.deliveryFee + s.codFee} {isAr ? 'د.ل' : 'LYD'}</td>
                        <td>
                           <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, background: s.status === 'Delivered' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', color: s.status === 'Delivered' ? '#10B981' : '#F59E0B' }}>
                             {s.status}
                           </span>
                        </td>
                      </tr>
                    ))}
                    {shipments.filter(s => s.assignedDriver === driverProfileModal.id).length === 0 && (
                      <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-tertiary)' }}>{isAr ? 'لا توجد شحنات' : 'No shipments'}</td></tr>
                    )}
                  </tbody>
                </table>
              )}
              {driverProfileTab === 'transactions' && (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>{isAr ? 'رقم المرجع' : 'Ref No'}</th>
                      <th>{isAr ? 'التاريخ' : 'Date'}</th>
                      <th>{isAr ? 'المبلغ المستلم' : 'Amount Settled'}</th>
                      <th>{isAr ? 'ملاحظات' : 'Notes'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {settlements.filter(s => s.driverId === driverProfileModal.id).map(s => (
                      <tr key={s.id}>
                        <td>{s.id}</td>
                        <td>{s.date.toLocaleDateString()} {s.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                        <td style={{ fontWeight: 800, color: '#10B981' }} dir="ltr">+{s.amount.toLocaleString()} {isAr ? 'د.ل' : 'LYD'}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{s.note || '—'}</td>
                      </tr>
                    ))}
                    {settlements.filter(s => s.driverId === driverProfileModal.id).length === 0 && (
                      <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-tertiary)' }}>{isAr ? 'لا توجد حركات' : 'No transactions'}</td></tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
            {/* Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--card-border)', display: 'flex', justifyContent: 'flex-end', background: 'var(--bg-primary)' }}>
              <button className="glass-button" onClick={() => window.print()} style={{ background: '#0F172A', color: '#fff' }}>
                {isAr ? 'طباعة كشف السائق' : 'Print Statement'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ PRINTABLE AREA ══════════════ */}
      
      <div className="printable-area hide-on-screen" dir="rtl">
        <div className="print-header">
          <div className="print-logo-container"><img src="/logo-color.png" alt="Tamowil Delivery" style={{ height: '70px' }} /></div>
          <p className="print-subtitle">{driverProfileModal ? 'كشف حساب وطلبات السائق' : 'كشف تسويات السائقين المنجزة'}</p>
        </div>

        {driverProfileModal ? (
          <>
            <div className="print-meta-info" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div><span style={{ fontWeight: 'bold' }}>اسم السائق:</span> {driverProfileModal.name}</div>
              <div><span style={{ fontWeight: 'bold' }}>رقم الهاتف:</span> <span dir="ltr">{driverProfileModal.phone}</span></div>
              <div><span style={{ fontWeight: 'bold' }}>المنطقة:</span> {driverProfileModal.zone}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', padding: '10px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
              <div><span style={{ fontWeight: 'bold' }}>شحنات مكتملة:</span> {driverProfileModal.shipmentsCompleted}</div>
              <div><span style={{ fontWeight: 'bold' }}>COD معلق:</span> <span dir="ltr">{driverProfileModal.pendingSettlement} د.ل</span></div>
              <div><span style={{ fontWeight: 'bold' }}>إجمالي مُسوَّى:</span> <span dir="ltr">{driverProfileModal.codSettled} د.ل</span></div>
            </div>

            <h3 style={{ fontSize: '16px', color: '#0D7847', marginTop: '20px', marginBottom: '10px', borderBottom: '2px solid #0D7847', paddingBottom: '5px' }}>كشف الحركات المالية</h3>
            <table className="print-table">
              <thead>
                <tr>
                  <th>رقم المرجع</th>
                  <th>التاريخ</th>
                  <th>المبلغ المستلم</th>
                  <th>ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {settlements.filter(s => s.driverId === driverProfileModal.id).map(s => (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td>{s.date.toLocaleDateString()} {s.date.toLocaleTimeString()}</td>
                    <td dir="ltr" style={{ fontWeight: 'bold' }}>+{s.amount.toLocaleString()} د.ل</td>
                    <td>{s.note || '—'}</td>
                  </tr>
                ))}
                {settlements.filter(s => s.driverId === driverProfileModal.id).length === 0 && (
                  <tr><td colSpan="4" style={{ textAlign: 'center' }}>لا توجد حركات</td></tr>
                )}
              </tbody>
            </table>

            <h3 style={{ fontSize: '16px', color: '#0D7847', marginTop: '30px', marginBottom: '10px', borderBottom: '2px solid #0D7847', paddingBottom: '5px' }}>كشف الشحنات (الطلبات)</h3>
            <table className="print-table">
              <thead>
                <tr>
                  <th>رقم التتبع</th>
                  <th>المستلم</th>
                  <th>المدينة</th>
                  <th>المبلغ</th>
                  <th>الحالة</th>
                </tr>
              </thead>
              <tbody>
                {shipments.filter(s => s.assignedDriver === driverProfileModal.id).map(s => (
                  <tr key={s.trackingNumber}>
                    <td>{s.trackingNumber}</td>
                    <td>{s.receiverName} - <span dir="ltr">{s.receiverPhone}</span></td>
                    <td>{s.receiverCity}</td>
                    <td dir="ltr" style={{ fontWeight: 'bold' }}>{s.price + s.deliveryFee + s.codFee} د.ل</td>
                    <td>{s.status}</td>
                  </tr>
                ))}
                {shipments.filter(s => s.assignedDriver === driverProfileModal.id).length === 0 && (
                  <tr><td colSpan="5" style={{ textAlign: 'center' }}>لا توجد شحنات</td></tr>
                )}
              </tbody>
            </table>
          </>
        ) : (
          <>
            <div className="print-meta-info">
              <div>
                العميل (السائق): {expandDriver ? drivers.find(d => d.id === expandDriver)?.name : 'جميع السائقين'}
              </div>
              <div>التاريخ: {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString()}</div>
            </div>

            <table className="print-table">
              <thead>
                <tr>
                  <th>رقم المرجع</th>
                  <th>اسم السائق</th>
                  <th>تاريخ التسوية</th>
                  <th>المبلغ المستلم</th>
                  <th>ملاحظات</th>
                </tr>
              </thead>
              <tbody>
                {driverSettlementHistory.map(s => (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td>{s.driverName}</td>
                    <td>{s.date.toLocaleDateString()}</td>
                    <td dir="ltr" style={{ fontWeight: 'bold' }}>{s.amount.toLocaleString()} د.ل</td>
                    <td>{s.note || '—'}</td>
                  </tr>
                ))}
                {driverSettlementHistory.length === 0 && (
                  <tr><td colSpan="5">لا توجد تسويات مالية</td></tr>
                )}
              </tbody>
            </table>
          </>
        )}

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

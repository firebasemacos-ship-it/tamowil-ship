'use client';
import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import AnimatedCounter from './AnimatedCounter';

// ── Helpers ──────────────────────────────────────────────────────────────────

const S_COLOR = {
  Pending:  { bg: 'rgba(251,191,36,0.14)',  text: '#FBBF24', border: 'rgba(251,191,36,0.3)' },
  Approved: { bg: 'rgba(16,185,129,0.12)',  text: '#10B981', border: 'rgba(16,185,129,0.3)' },
  Rejected: { bg: 'rgba(239,68,68,0.12)',   text: '#EF4444', border: 'rgba(239,68,68,0.3)'  },
};
const S_AR = { Pending: 'بانتظار الموافقة', Approved: 'تمت الموافقة', Rejected: 'مرفوض' };

const Svg = ({ children, size = 18, ...p }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...p}>{children}</svg>
);

const Icon = {
  wallet:   <Svg><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></Svg>,
  clock:    <Svg><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></Svg>,
  check:    <Svg><polyline points="20 6 9 17 4 12"/></Svg>,
  store:    <Svg><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></Svg>,
  bank:     <Svg><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></Svg>,
  list:     <Svg><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></Svg>,
  trending: <Svg><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></Svg>,
  plus:     <Svg><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Svg>,
  user:     <Svg><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></Svg>,
  x:        <Svg size={14}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Svg>,
  arrow:    <Svg size={14}><polyline points="9 18 15 12 9 6"/></Svg>,
  info:     <Svg><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></Svg>,
};

// ── Badge ─────────────────────────────────────────────────────────────────────
const Badge = ({ status, isAr }) => (
  <span style={{ padding: '3px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 700,
    background: S_COLOR[status]?.bg, color: S_COLOR[status]?.text, border: `1px solid ${S_COLOR[status]?.border}` }}>
    {isAr ? S_AR[status] : status}
  </span>
);

// ── MiniBar: progress fill ────────────────────────────────────────────────────
const MiniBar = ({ pct, color }) => (
  <div style={{ height: '5px', borderRadius: '99px', background: 'rgba(128,128,128,0.12)', overflow: 'hidden', marginTop: '6px' }}>
    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '99px', transition: 'width 1s ease' }} />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
export default function WalletManager() {
  const {
    lang,
    payoutRequests: payouts,
    merchants,
    transactionLog: txLog,
    shipmentsList,
    safes,
    approvePayoutRequest,
    rejectPayoutRequest,
    manualCredit
  } = useApp();
  const isAr = lang === 'ar';

  const [filterStatus, setFilter]     = useState('All');
  const [activeSection, setSection]   = useState('payouts'); // 'payouts' | 'wallets' | 'log'
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmId, setConfirmId]     = useState(null);
  const [confirmAction, setConfirm]   = useState(null);
  const [rejectNote, setRejectNote]   = useState('');
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [showManual, setShowManual]   = useState(false);
  const [manualForm, setManualForm]   = useState({ merchantId: '', amount: '', type: 'credit', description: '', safeId: 'SAFE-001' });
  const [selectedSafeId, setSelectedSafeId]   = useState('SAFE-001');
  const [printMode, setPrintMode]     = useState(null); // 'payouts' | 'wallet'

  const handlePrint = (mode) => {
    setPrintMode(mode);
    setTimeout(() => {
      window.print();
    }, 100);
  };


  const fmt = v => `${Number(v).toLocaleString('ar-LY')} ${isAr ? 'د.ل' : 'LYD'}`;

  // ── Derived stats & search filters ─────────────────────────────
  const totalBalances  = merchants.reduce((s, m) => s + m.walletBalance, 0);
  const totalPending   = payouts.filter(p => p.status === 'Pending').reduce((s, p) => s + p.amount, 0);
  const totalApproved  = payouts.filter(p => p.status === 'Approved').reduce((s, p) => s + p.amount, 0);
  const pendingCount   = payouts.filter(p => p.status === 'Pending').length;
  const maxBalance     = Math.max(...merchants.map(m => m.totalEarned), 1);

  const filteredMerchants = useMemo(() => {
    if (!searchQuery.trim()) return merchants;
    const q = searchQuery.toLowerCase().trim();
    return merchants.filter(m =>
      (m.storeName && m.storeName.toLowerCase().includes(q)) ||
      (m.name && m.name.toLowerCase().includes(q)) ||
      (m.phone && m.phone.includes(q)) ||
      (m.email && m.email.toLowerCase().includes(q)) ||
      (m.id && m.id.toLowerCase().includes(q))
    );
  }, [merchants, searchQuery]);

  const filteredPayouts = useMemo(() => {
    let list = filterStatus === 'All' ? payouts : payouts.filter(p => p.status === filterStatus);
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(p =>
      (p.merchantStore && p.merchantStore.toLowerCase().includes(q)) ||
      (p.merchantName && p.merchantName.toLowerCase().includes(q)) ||
      (p.bankAccount && p.bankAccount.toLowerCase().includes(q)) ||
      (p.id && p.id.toLowerCase().includes(q))
    );
  }, [payouts, filterStatus, searchQuery]);

  const merchantTxLog = selectedMerchant
    ? txLog.filter(t => t.merchantId === selectedMerchant.id)
    : txLog;

  const filteredTxLog = useMemo(() => {
    let list = merchantTxLog;
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(t =>
      (t.description && t.description.toLowerCase().includes(q)) ||
      (t.ref && t.ref.toLowerCase().includes(q)) ||
      (t.id && t.id.toLowerCase().includes(q)) ||
      (t.type && t.type.toLowerCase().includes(q))
    );
  }, [merchantTxLog, searchQuery]);

  // ── Actions ───────────────────────────────────────────────────
  function doApprove(id) {
    approvePayoutRequest(id, selectedSafeId || 'SAFE-001');
    setConfirmId(null);
  }
  function doReject(id) {
    rejectPayoutRequest(id);
    setConfirmId(null); setRejectNote('');
  }
  function doManualCredit(e) {
    e.preventDefault();
    if (!manualForm.merchantId || !manualForm.amount) return;
    manualCredit(manualForm.merchantId, manualForm.amount, manualForm.description, manualForm.type || 'credit', manualForm.safeId || 'SAFE-001');
    setManualForm({ merchantId: '', amount: '', type: 'credit', description: '', safeId: 'SAFE-001' });
    setShowManual(false);
  }

  // ── Tab buttons shared style ──────────────────────────────────
  const tabBtn = (id, labelAr, labelEn, badgeCount) => (
    <button key={id} onClick={() => setSection(id)} style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '10px 18px', borderRadius: '12px', border: 'none', cursor: 'pointer',
      fontWeight: 700, fontSize: '13px',
      background: activeSection === id ? 'var(--primary-color)' : 'rgba(128,128,128,0.08)',
      color: activeSection === id ? '#fff' : 'var(--text-secondary)',
      transition: 'all 0.2s ease',
    }}>
      {isAr ? labelAr : labelEn}
      {badgeCount > 0 && (
        <span style={{ background: activeSection === id ? 'rgba(255,255,255,0.25)' : '#EF4444', color: '#fff',
          borderRadius: '99px', padding: '1px 7px', fontSize: '10px', fontWeight: 800 }}>
          {badgeCount}
        </span>
      )}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 className="title-large">{isAr ? 'إدارة المحافظ والمدفوعات' : 'Wallet & Payout Management'}</h1>
          <p className="subtitle">{isAr ? 'مراجعة أرصدة التجار، الموافقة على طلبات السحب، وتتبع المعاملات المالية.' : 'Review balances, approve payouts, and track all financial transactions.'}</p>
        </div>
        <button onClick={() => setShowManual(true)} style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '11px 20px', borderRadius: '12px', border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg,#6366F1,#4F46E5)', color: '#fff', fontWeight: 700, fontSize: '13px',
          boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
        }}>
          {Icon.plus} {isAr ? 'تسوية / إيداع يدوي' : 'Manual Settlement'}
        </button>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '16px' }}>
        {[
          { labelAr: 'إجمالي الأرصدة', labelEn: 'Total Balances', rawVal: totalBalances, color: '#818CF8', rgb: '129,140,248', icon: Icon.wallet, sub: isAr ? `${merchants.length} تجار` : `${merchants.length} merchants` },
          { labelAr: 'طلبات سحب معلقة', labelEn: 'Pending Payouts', rawVal: totalPending, color: '#F59E0B', rgb: '245,158,11', icon: Icon.clock, sub: isAr ? `${pendingCount} طلب` : `${pendingCount} requests`, urgent: pendingCount > 0 },
          { labelAr: 'إجمالي المصروفات', labelEn: 'Total Paid Out', rawVal: totalApproved, color: '#10B981', rgb: '16,185,129', icon: Icon.check, sub: isAr ? 'موافق عليها' : 'Approved' },
          { labelAr: 'إجمالي المعاملات', labelEn: 'Transactions', rawVal: txLog.length, color: '#60A5FA', rgb: '96,165,250', icon: Icon.trending, sub: isAr ? 'إيداع وسحب' : 'Credits & Debits', isInt: true },
        ].map((c, i) => (
          <div key={i} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '14px', position: 'relative', overflow: 'hidden' }}>
            {c.urgent && <div style={{ position: 'absolute', top: '10px', insetInlineStart: '10px', width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444', boxShadow: '0 0 0 3px rgba(239,68,68,0.3)', animation: 'pulse 2s infinite' }} />}
            <div className="stat-icon" style={{ background: `linear-gradient(135deg,${c.color}cc,${c.color}88)`, boxShadow: `0 6px 20px rgba(${c.rgb},0.4)`, color: c.color }}>
              {c.icon}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: '3px' }}>{isAr ? c.labelAr : c.labelEn}</div>
              <div style={{ fontSize: '19px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1 }} dir="ltr">
                <AnimatedCounter value={c.rawVal} suffix={c.isInt ? '' : (isAr ? ' د.ل' : ' LYD')} />
              </div>
              <div style={{ fontSize: '11px', color: c.urgent ? '#F59E0B' : 'var(--text-tertiary)', marginTop: '3px', fontWeight: c.urgent ? 700 : 400 }}>{c.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Section Tabs ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {tabBtn('payouts', 'طلبات السحب', 'Payout Requests', pendingCount)}
        {tabBtn('wallets', 'محافظ التجار', 'Merchant Wallets', 0)}
        {tabBtn('log', 'سجل المعاملات', 'Transaction Log', 0)}
      </div>

      {/* ── Search Input Bar ───────────────────────────────────────── */}
      <div className="glass-card flex items-center gap-3" style={{ padding: '12px 18px', background: 'rgba(255, 255, 255, 0.05)', border: '1px solid var(--card-border)' }}>
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}>
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          type="text"
          className="glass-input flex-1"
          style={{ padding: '8px 12px', fontSize: '13px' }}
          placeholder={
            activeSection === 'wallets'
              ? (isAr ? 'ابحث باسم المتجر، التاجر، رقم الهاتف، المعرف...' : 'Search by store, merchant name, phone, or ID...')
              : activeSection === 'payouts'
              ? (isAr ? 'ابحث باسم التاجر، الحساب البنكي، أو رقم الطلب...' : 'Search by merchant, bank account, or payout ID...')
              : (isAr ? 'ابحث في سجل العمليات المالية، الوصف، الرقم المرجعي...' : 'Search transaction log, description, reference...')
          }
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: '14px', padding: '2px 8px' }}>
            ✕
          </button>
        )}
      </div>

      {/* ══════════════ PAYOUTS SECTION ══════════════ */}
      {activeSection === 'payouts' && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Filter bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <h3 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {Icon.list} {isAr ? 'طلبات السحب' : 'Payout Requests'}
            </h3>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <button onClick={() => handlePrint('payouts')} style={{ padding: '6px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700, background: '#6366F1', color: '#fff' }}>
                <span style={{display: 'flex', gap: '4px', alignItems: 'center'}}><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg></span> {isAr ? 'طباعة' : 'Print'}
              </button>
              {[['All','الكل'],['Pending','معلقة'],['Approved','مقبولة'],['Rejected','مرفوضة']].map(([s,ar]) => (
                <button key={s} onClick={() => setFilter(s)} style={{
                  padding: '6px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 700,
                  background: filterStatus === s ? 'var(--primary-color)' : 'rgba(128,128,128,0.08)',
                  color: filterStatus === s ? '#fff' : 'var(--text-secondary)',
                }}>
                  {isAr ? ar : s}
                </button>
              ))}
            </div>
          </div>

          {/* Request cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredPayouts.map(p => (
              <div key={p.id} style={{
                borderRadius: '16px', border: `1px solid ${p.status === 'Pending' ? 'rgba(251,191,36,0.2)' : 'var(--card-border)'}`,
                background: p.status === 'Pending' ? 'rgba(251,191,36,0.03)' : 'rgba(128,128,128,0.03)',
                overflow: 'hidden',
              }}>
                {/* Top strip for pending */}
                {p.status === 'Pending' && (
                  <div style={{ height: '3px', background: 'linear-gradient(90deg,#F59E0B,#FBBF24)' }} />
                )}
                <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* Row 1: store + amount */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-primary)' }}>{p.storeName}</span>
                        <Badge status={p.status} isAr={isAr} />
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '3px' }}>
                        {p.id} &nbsp;•&nbsp; {isAr ? 'طلب بتاريخ:' : 'Requested:'} {p.requestedAt.toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontFamily: 'monospace', letterSpacing: '0.02em', direction: 'ltr', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: 'var(--text-tertiary)' }}>{Icon.bank}</span>
                        {p.bankDetails}
                      </div>
                      {p.note && (
                        <div style={{ marginTop: '6px', fontSize: '11px', padding: '4px 10px', borderRadius: '8px',
                          background: p.status === 'Approved' ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                          color: p.status === 'Approved' ? '#10B981' : '#EF4444', display: 'inline-block' }}>
                          {p.note}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: 'end', flexShrink: 0 }}>
                      <div style={{ fontWeight: 900, fontSize: '22px', color: p.status === 'Approved' ? '#10B981' : p.status === 'Rejected' ? '#EF4444' : '#FBBF24', lineHeight: 1 }} dir="ltr">
                        {p.amount.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{isAr ? 'د.ل' : 'LYD'}</div>
                      {p.processedAt && (
                        <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                          {isAr ? 'معالج:' : 'Processed:'} {p.processedAt.toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions for pending */}
                  {p.status === 'Pending' && (
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', paddingTop: '4px', borderTop: '1px solid var(--card-border)' }}>
                      <button onClick={() => { setConfirmId(p.id); setConfirm('reject'); }} style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '9px 20px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.3)',
                        background: 'rgba(239,68,68,0.06)', color: '#EF4444', fontWeight: 700, fontSize: '12px', cursor: 'pointer',
                      }}>
                        {Icon.x} {isAr ? 'رفض' : 'Reject'}
                      </button>
                      <button onClick={() => { setConfirmId(p.id); setConfirm('approve'); }} style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '9px 20px', borderRadius: '10px', border: 'none',
                        background: 'linear-gradient(135deg,#10B981,#059669)', color: '#fff', fontWeight: 700, fontSize: '12px', cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(16,185,129,0.35)',
                      }}>
                        {Icon.check} {isAr ? 'تأكيد التحويل' : 'Approve Transfer'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {filteredPayouts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                <div style={{ fontSize: '36px', marginBottom: '10px', opacity: 0.4 }}>{Icon.list}</div>
                {isAr ? 'لا توجد طلبات سحب تنطبق عليها شروط البحث.' : 'No payout requests match your search criteria.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════ WALLETS SECTION ══════════════ */}
      {activeSection === 'wallets' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredMerchants.map(m => {
            const isSel = selectedMerchant?.id === m.id;
            const pct = Math.round((m.totalEarned / maxBalance) * 100);
            const mTx = txLog.filter(t => t.merchantId === m.id);
            return (
              <div key={m.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '0', transition: 'all 0.3s ease', cursor: 'pointer' }}>
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}
                  onClick={() => setSelectedMerchant(isSel ? null : m)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: 0 }}>
                    <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'linear-gradient(135deg,var(--primary-color),#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '20px', fontWeight: 800, color: '#fff' }}>
                      {m.storeName.charAt(0)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)' }}>{m.storeName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{m.name} • {m.email}</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0 }}>
                    {/* Financial mini stats */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginBottom: '2px' }}>{isAr ? 'مكتسب' : 'Earned'}</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)' }} dir="ltr">{m.totalEarned.toLocaleString()}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginBottom: '2px' }}>{isAr ? 'مسحوب' : 'Withdrawn'}</div>
                      <div style={{ fontSize: '13px', fontWeight: 700, color: '#EF4444' }} dir="ltr">{m.totalWithdrawn.toLocaleString()}</div>
                    </div>
                    {/* Balance big */}
                    <div style={{ background: m.walletBalance > 0 ? 'rgba(16,185,129,0.1)' : 'rgba(128,128,128,0.08)', border: `1px solid ${m.walletBalance > 0 ? 'rgba(16,185,129,0.2)' : 'var(--card-border)'}`, borderRadius: '12px', padding: '8px 16px', textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginBottom: '2px' }}>{isAr ? 'الرصيد' : 'Balance'}</div>
                      <div style={{ fontSize: '16px', fontWeight: 900, color: m.walletBalance > 0 ? '#10B981' : 'var(--text-tertiary)' }} dir="ltr">
                        {m.walletBalance.toLocaleString()} <span style={{ fontSize: '11px' }}>{isAr ? 'د.ل' : 'LYD'}</span>
                      </div>
                    </div>
                    {/* Verified badge */}
                    <span style={{ padding: '4px 12px', borderRadius: '8px', fontSize: '11px', fontWeight: 700,
                      background: m.verified ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      color: m.verified ? '#10B981' : '#EF4444' }}>
                      {m.verified ? (isAr ? 'موثّق' : 'Verified') : (isAr ? 'غير موثّق' : 'Unverified')}
                    </span>
                    {/* Print Button */}
                    <button onClick={(e) => { e.stopPropagation(); setSelectedMerchant(m); handlePrint('wallet'); }} style={{ padding: '6px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 700, background: '#6366F1', color: '#fff' }}>
                      <span style={{display: 'flex', gap: '4px', alignItems: 'center'}}><svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg></span>
                    </button>
                    {/* Expand arrow */}
                    <span style={{ color: 'var(--text-tertiary)', transform: isSel ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>{Icon.arrow}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <MiniBar pct={pct} color="var(--primary-color)" />

                {/* Expanded: tx log for this merchant */}
                {isSel && (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--card-border)' }}>
                    <div style={{ fontWeight: 700, fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                      {isAr ? 'سجل معاملات هذا التاجر' : 'Transaction History'}
                    </div>
                    {mTx.length === 0 ? (
                      <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{isAr ? 'لا توجد معاملات بعد.' : 'No transactions yet.'}</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {mTx.map(t => (
                          <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '10px', background: t.type === 'credit' ? 'rgba(16,185,129,0.05)' : 'rgba(239,68,68,0.05)', border: `1px solid ${t.type === 'credit' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)'}` }}>
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{t.description}</div>
                              <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{t.date.toLocaleString()} • {t.ref}</div>
                            </div>
                            <div style={{ fontWeight: 800, fontSize: '14px', color: t.type === 'credit' ? '#10B981' : '#EF4444' }} dir="ltr">
                              {t.type === 'credit' ? '+' : '-'}{t.amount.toLocaleString()} {isAr ? 'د.ل' : 'LYD'}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {filteredMerchants.length === 0 && (
            <div className="glass-card" style={{ textAlign: 'center', padding: '50px 0', color: 'var(--text-tertiary)', fontSize: '13px' }}>
              <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ margin: '0 auto 10px', opacity: 0.4 }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              {isAr ? 'لا توجد محافظ تجار تطابق نتيجة البحث.' : 'No merchant wallets match your search criteria.'}
            </div>
          )}
        </div>
      )}

      {/* ══════════════ TRANSACTION LOG SECTION ══════════════ */}
      {activeSection === 'log' && (
        <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
          {/* Table header */}
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {Icon.trending} {isAr ? 'سجل جميع المعاملات المالية' : 'All Financial Transactions'}
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{filteredTxLog.length} {isAr ? 'معاملة' : 'transactions'}</span>
          </div>
          <table className="custom-table">
            <thead>
              <tr>
                <th>{isAr ? 'المرجع' : 'Ref'}</th>
                <th>{isAr ? 'المتجر' : 'Store'}</th>
                <th>{isAr ? 'الوصف' : 'Description'}</th>
                <th>{isAr ? 'التاريخ' : 'Date'}</th>
                <th>{isAr ? 'النوع' : 'Type'}</th>
                <th>{isAr ? 'المبلغ' : 'Amount'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredTxLog.map(t => (
                <tr key={t.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-tertiary)' }} dir="ltr">{t.ref}</td>
                  <td style={{ fontWeight: 700 }}>{t.storeName}</td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{t.description}</td>
                  <td style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{t.date.toLocaleDateString()}</td>
                  <td>
                    <span style={{ padding: '3px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 700,
                      background: t.type === 'credit' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      color: t.type === 'credit' ? '#10B981' : '#EF4444' }}>
                      {t.type === 'credit' ? (isAr ? 'إيداع' : 'Credit') : (isAr ? 'سحب' : 'Debit')}
                    </span>
                  </td>
                  <td style={{ fontWeight: 800, color: t.type === 'credit' ? '#10B981' : '#EF4444' }} dir="ltr">
                    {t.type === 'credit' ? '+' : '-'}{Math.abs(t.amount).toLocaleString('ar-LY')} {isAr ? 'د.ل' : 'LYD'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ══════════════ CONFIRM MODAL ══════════════ */}
      {confirmId && (
        <div className="modal-overlay" onClick={() => { setConfirmId(null); setRejectNote(''); }}>
          <div className="modal-content glass-panel" style={{ padding: '32px', maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ width: '60px', height: '60px', borderRadius: '20px', margin: '0 auto 14px',
                background: confirmAction === 'approve' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: confirmAction === 'approve' ? '#10B981' : '#EF4444' }}>
                {confirmAction === 'approve' ? <Svg size={28}><polyline points="20 6 9 17 4 12"/></Svg> : <Svg size={28}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Svg>}
              </div>
              <h3 style={{ fontWeight: 800, fontSize: '17px', color: 'var(--text-primary)', marginBottom: '8px' }}>
                {isAr
                  ? (confirmAction === 'approve' ? 'تأكيد إتمام التحويل البنكي؟' : 'رفض طلب السحب؟')
                  : (confirmAction === 'approve' ? 'Confirm Bank Transfer?' : 'Reject Payout Request?')}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {isAr
                  ? (confirmAction === 'approve' ? 'سيتم خصم المبلغ من رصيد محفظة التاجر وتسجيل العملية في السجل المالي.' : 'يُرجى إدخال سبب الرفض لإبلاغ التاجر.')
                  : (confirmAction === 'approve' ? 'Amount will be deducted from merchant wallet and logged.' : 'Please enter a rejection reason to inform the merchant.')}
              </p>
            </div>

            {confirmAction === 'approve' && (
              <div style={{ marginBottom: '16px', textAlign: 'right' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  {isAr ? 'الخزينة المخصصة للصرف منها' : 'Source Safe for Payout'}
                </label>
                <select className="glass-input w-full" value={selectedSafeId} onChange={e => setSelectedSafeId(e.target.value)}>
                  {(safes || []).map(s => <option key={s.id} value={s.id}>{s.name} ({s.branch}) - رصيد: {s.balance} د.ل</option>)}
                </select>
              </div>
            )}

            {confirmAction === 'reject' && (
              <textarea
                placeholder={isAr ? 'سبب الرفض (اختياري)...' : 'Rejection reason (optional)...'}
                value={rejectNote} onChange={e => setRejectNote(e.target.value)}
                className="glass-input" rows={3}
                style={{ width: '100%', resize: 'none', marginBottom: '16px', fontSize: '13px' }}
              />
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={() => { setConfirmId(null); setRejectNote(''); }} style={{ padding: '11px 24px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer', fontSize: '13px' }}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button onClick={() => confirmAction === 'approve' ? doApprove(confirmId) : doReject(confirmId)}
                style={{ padding: '11px 28px', borderRadius: '12px', border: 'none', fontWeight: 700, cursor: 'pointer', fontSize: '13px',
                  background: confirmAction === 'approve' ? 'linear-gradient(135deg,#10B981,#059669)' : 'linear-gradient(135deg,#EF4444,#DC2626)',
                  color: '#fff', boxShadow: `0 4px 14px rgba(${confirmAction === 'approve' ? '16,185,129' : '239,68,68'},0.4)` }}>
                {isAr ? 'تأكيد' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ MANUAL SETTLEMENT / CREDIT MODAL ══════════════ */}
      {showManual && (
        <div className="modal-overlay" onClick={() => setShowManual(false)}>
          <div className="modal-content glass-panel" style={{ padding: '32px', maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '22px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: manualForm.type === 'debit' ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: manualForm.type === 'debit' ? '#EF4444' : '#10B981' }}>
                {manualForm.type === 'debit' ? Icon.bank : Icon.plus}
              </div>
              <div>
                <h3 style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-primary)', margin: 0 }}>{isAr ? 'التسوية والإيداع اليدوي للمحفظة' : 'Manual Wallet Settlement'}</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: '3px 0 0' }}>{isAr ? 'خصم أو إيداع مالي يدوي في محفظة التاجر' : 'Manual credit or debit adjustment for merchant wallet'}</p>
              </div>
            </div>
            <form onSubmit={doManualCredit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  {isAr ? 'الخزينة المحددة للمعاملة' : 'Associated Safe'}
                </label>
                <select className="glass-input w-full" value={manualForm.safeId} onChange={e => setManualForm(p => ({ ...p, safeId: e.target.value }))}>
                  {(safes || []).map(s => <option key={s.id} value={s.id}>{s.name} ({s.branch}) - رصيد: {s.balance} د.ل</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  {isAr ? 'نوع التسوية' : 'Settlement Type'}
                </label>
                <select className="glass-input" value={manualForm.type} onChange={e => setManualForm(p => ({ ...p, type: e.target.value }))}>
                  <option value="credit">{isAr ? '+ إيداع / شحن رصيد للمحفظة (+)' : '+ Credit Deposit (+)'}</option>
                  <option value="debit">{isAr ? '- خصم / تسوية رصيد من المحفظة (-)' : '- Debit Settlement (-)'}</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  {isAr ? 'اختر التاجر' : 'Select Merchant'}
                </label>
                <select required className="glass-input" value={manualForm.merchantId} onChange={e => setManualForm(p => ({ ...p, merchantId: e.target.value }))}>
                  <option value="">{isAr ? '-- اختر --' : '-- Select --'}</option>
                  {merchants.map(m => <option key={m.id} value={m.id}>{m.storeName} ({isAr ? 'رصيد:' : 'Balance:'} {m.walletBalance} {isAr ? 'د.ل' : 'LYD'})</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  {isAr ? 'المبلغ (د.ل)' : 'Amount (LYD)'}
                </label>
                <input required type="number" min="1" className="glass-input" placeholder="0.00"
                  value={manualForm.amount} onChange={e => setManualForm(p => ({ ...p, amount: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  {isAr ? 'وصف أو سبب التسوية' : 'Transaction Description / Note'}
                </label>
                <input type="text" className="glass-input" placeholder={isAr ? (manualForm.type === 'debit' ? 'مثال: تسوية نقدية للمحفظة' : 'مثال: شحن رصيد تعويضي') : 'e.g. Manual settlement note'}
                  value={manualForm.description} onChange={e => setManualForm(p => ({ ...p, description: e.target.value }))} />
              </div>
              <div style={{ padding: '12px 14px', borderRadius: '12px', background: manualForm.type === 'debit' ? 'rgba(239,68,68,0.06)' : 'rgba(16,185,129,0.06)', border: `1px solid ${manualForm.type === 'debit' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)'}`, display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <span style={{ color: manualForm.type === 'debit' ? '#EF4444' : '#10B981', flexShrink: 0 }}>{Icon.info}</span>
                {isAr 
                  ? (manualForm.type === 'debit' ? 'سيتم خصم هذا المبلغ فوراً من محفظة التاجر وتوثيقه في السجل المالي.' : 'سيتم إضافة هذا المبلغ فوراً لحساب محفظة التاجر وتوثيقه في السجل المالي.') 
                  : (manualForm.type === 'debit' ? 'This amount will be deducted immediately from the merchant wallet.' : 'This amount will be credited immediately to the merchant wallet.')}
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
                <button type="button" onClick={() => setShowManual(false)} style={{ padding: '11px 22px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}>
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" style={{ padding: '11px 24px', borderRadius: '12px', border: 'none', background: manualForm.type === 'debit' ? 'linear-gradient(135deg,#EF4444,#DC2626)' : 'linear-gradient(135deg,#10B981,#059669)', color: '#fff', fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 14px rgba(${manualForm.type === 'debit' ? '239,68,68' : '16,185,129'},0.35)`, fontSize: '13px' }}>
                  {isAr ? (manualForm.type === 'debit' ? 'تأكيد الخصم/التسوية' : 'تأكيد الإيداع') : (manualForm.type === 'debit' ? 'Confirm Debit' : 'Confirm Credit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* ══════════════ PRINTABLE REPORTS (A4) ══════════════ */}
      

      <div className="printable-area hide-on-screen" dir="rtl">
        <div className="print-header">
          <div style={{ textAlign: 'center', marginBottom: '16px' }}>
            <img src="/logo-color.png" alt="Tamowil Delivery" style={{ height: '60px' }} />
          </div>
          <p className="print-subtitle">
            {printMode === 'payouts' ? 'كشف طلبات سحب الأرصدة' : 'كشف حساب محفظة التاجر'}
          </p>
        </div>

        <div className="print-meta-info">
          <div>
            {printMode === 'wallet' && selectedMerchant ? (
              <>العميل (التاجر): {selectedMerchant.storeName}</>
            ) : (
              <>كشف عام لطلبات السحب</>
            )}
          </div>
          <div>التاريخ: {new Date().toLocaleDateString('en-GB')} {new Date().toLocaleTimeString()}</div>
        </div>

        {printMode === 'payouts' && (
          <table className="print-table">
            <thead>
              <tr>
                <th>رقم الطلب</th>
                <th>اسم التاجر</th>
                <th>المبلغ المطلوب</th>
                <th>بيانات الحساب / البنك</th>
                <th>الحالة</th>
                <th>تاريخ الطلب</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.storeName}</td>
                  <td dir="ltr">{p.amount.toLocaleString()} د.ل</td>
                  <td>{p.bankDetails}</td>
                  <td>{S_AR[p.status] || p.status}</td>
                  <td>{p.requestedAt.toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {printMode === 'wallet' && selectedMerchant && (
          <>
            <table className="print-table" style={{ marginBottom: '20px' }}>
              <thead>
                <tr>
                  <th>إجمالي المكتسب</th>
                  <th>إجمالي المسحوب</th>
                  <th>الرصيد الحالي</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td dir="ltr">{selectedMerchant.totalEarned.toLocaleString()} د.ل</td>
                  <td dir="ltr">{selectedMerchant.totalWithdrawn.toLocaleString()} د.ل</td>
                  <td dir="ltr" style={{ fontWeight: 'bold' }}>{selectedMerchant.walletBalance.toLocaleString()} د.ل</td>
                </tr>
              </tbody>
            </table>

            <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>سجل الحركات المالية المنجزة:</h3>
            <table className="print-table">
              <thead>
                <tr>
                  <th>رقم المرجع</th>
                  <th>الوصف</th>
                  <th>التاريخ</th>
                  <th>النوع</th>
                  <th>المبلغ</th>
                  <th>حالة الحركة</th>
                </tr>
              </thead>
              <tbody>
                {txLog.filter(t => t.merchantId === selectedMerchant.id).map(t => {
                  const sh = shipmentsList.find(s => s.trackingNumber === t.ref);
                  const isCancelled = sh?.status === 'Cancelled' || sh?.status === 'Returned' || t.description?.includes('ملغاة') || t.description?.includes('مرتجع') || t.status === 'Cancelled';
                  return (
                    <tr key={t.id} style={isCancelled ? { backgroundColor: '#FEE2E2', color: '#991B1B' } : {}}>
                      <td style={{ fontFamily: 'monospace' }}>{t.ref}</td>
                      <td>
                        {t.description}
                        {isCancelled && <strong style={{ color: '#DC2626', marginRight: '6px' }}>(ملغاة)</strong>}
                      </td>
                      <td>{t.date.toLocaleDateString()}</td>
                      <td>{t.type === 'credit' ? 'إيداع' : 'سحب'}</td>
                      <td dir="ltr">{t.type === 'credit' ? '+' : '-'}{t.amount.toLocaleString()} د.ل</td>
                      <td style={{ fontWeight: 'bold', color: isCancelled ? '#DC2626' : '#059669' }}>
                        {isCancelled ? 'ملغاة' : (t.type === 'credit' ? 'مكتملة' : 'تم التحويل')}
                      </td>
                    </tr>
                  );
                })}
                {txLog.filter(t => t.merchantId === selectedMerchant.id).length === 0 && (
                  <tr><td colSpan="6">لا توجد حركات مالية</td></tr>
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

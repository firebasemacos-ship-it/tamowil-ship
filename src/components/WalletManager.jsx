'use client';
import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import AnimatedCounter from './AnimatedCounter';

// ── Status Color Palette & Arabic Labels ──────────────────────────────────────
const S_COLOR = {
  Pending:  { bg: 'rgba(251,191,36,0.14)',  text: '#FBBF24', border: 'rgba(251,191,36,0.3)',  icon: '⏳' },
  Approved: { bg: 'rgba(16,185,129,0.14)',  text: '#10B981', border: 'rgba(16,185,129,0.3)',  icon: '✅' },
  Rejected: { bg: 'rgba(239,68,68,0.14)',   text: '#EF4444', border: 'rgba(239,68,68,0.3)',   icon: '❌' },
};
const S_AR = { Pending: 'بانتظار الموافقة', Approved: 'تمت الموافقة', Rejected: 'مرفوض' };

// ── SVG Icons ──────────────────────────────────────────────────────────────────
const Svg = ({ children, size = 18, ...p }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...p}>{children}</svg>
);

const Icon = {
  wallet:    <Svg><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></Svg>,
  clock:     <Svg><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></Svg>,
  check:     <Svg><polyline points="20 6 9 17 4 12"/></Svg>,
  store:     <Svg><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></Svg>,
  bank:      <Svg><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></Svg>,
  list:      <Svg><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></Svg>,
  trending:  <Svg><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></Svg>,
  plus:      <Svg><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Svg>,
  user:      <Svg><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></Svg>,
  x:         <Svg size={14}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Svg>,
  arrow:     <Svg size={14}><polyline points="9 18 15 12 9 6"/></Svg>,
  info:      <Svg><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></Svg>,
  search:    <Svg><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Svg>,
  print:     <Svg><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></Svg>,
  safe:      <Svg><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></Svg>,
  shield:    <Svg><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></Svg>
};

// ── Badge Component ────────────────────────────────────────────────────────────
const Badge = ({ status, isAr }) => (
  <span style={{
    display: 'inline-flex', alignItems: 'center', gap: '5px',
    padding: '4px 12px', borderRadius: '10px', fontSize: '11px', fontWeight: 800,
    background: S_COLOR[status]?.bg || 'rgba(128,128,128,0.1)',
    color: S_COLOR[status]?.text || 'var(--text-secondary)',
    border: `1px solid ${S_COLOR[status]?.border || 'transparent'}`,
    boxShadow: `0 2px 8px ${S_COLOR[status]?.bg || 'transparent'}`
  }}>
    <span>{S_COLOR[status]?.icon}</span>
    <span>{isAr ? S_AR[status] || status : status}</span>
  </span>
);

// ── Mini Progress Bar ──────────────────────────────────────────────────────────
const MiniBar = ({ pct, color }) => (
  <div style={{ height: '6px', borderRadius: '99px', background: 'rgba(128,128,128,0.12)', overflow: 'hidden', marginTop: '8px' }}>
    <div style={{ height: '100%', width: `${Math.min(100, Math.max(0, pct))}%`, background: color, borderRadius: '99px', transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }} />
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

  const [filterStatus, setFilter]       = useState('All');
  const [activeSection, setSection]     = useState('payouts'); // 'payouts' | 'wallets' | 'log'
  const [searchQuery, setSearchQuery]   = useState('');
  const [confirmId, setConfirmId]       = useState(null);
  const [confirmAction, setConfirm]     = useState(null);
  const [rejectNote, setRejectNote]     = useState('');
  const [selectedMerchant, setSelectedMerchant] = useState(null);
  const [showManual, setShowManual]     = useState(false);
  const [manualForm, setManualForm]     = useState({ merchantId: '', amount: '', type: 'payout', description: '', safeId: 'SAFE-001' });
  const [manualError, setManualError]   = useState(null);
  const [selectedSafeId, setSelectedSafeId] = useState('SAFE-001');
  const [printMode, setPrintMode]       = useState(null); // 'payouts' | 'wallet'

  // Cooldown lock & Toast feedback states
  const [cooldownTime, setCooldownTime] = useState(0);
  const [toastMsg, setToastMsg]         = useState(null);

  React.useEffect(() => {
    if (cooldownTime > 0) {
      const timer = setInterval(() => {
        setCooldownTime(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [cooldownTime]);

  const handlePrint = (mode) => {
    setPrintMode(mode);
    setTimeout(() => { window.print(); }, 100);
  };

  const fmt = v => `${Number(v || 0).toLocaleString('ar-LY')} ${isAr ? 'د.ل' : 'LYD'}`;

  // ── Financial Stats ──────────────────────────────────────────
  const totalBalances  = useMemo(() => merchants.reduce((s, m) => s + (m.walletBalance || 0), 0), [merchants]);
  const totalPending   = useMemo(() => payouts.filter(p => p.status === 'Pending').reduce((s, p) => s + (p.amount || 0), 0), [payouts]);
  const totalApproved  = useMemo(() => payouts.filter(p => p.status === 'Approved').reduce((s, p) => s + (p.amount || 0), 0), [payouts]);
  const pendingCount   = useMemo(() => payouts.filter(p => p.status === 'Pending').length, [payouts]);
  const maxBalance     = useMemo(() => Math.max(...merchants.map(m => m.totalEarned || 0), 1), [merchants]);

  // Main Safe (`SAFE-001`) Balance
  const mainSafe = useMemo(() => safes.find(s => s.id === 'SAFE-001') || safes[0] || { name: 'الخزينة الرئيسية', balance: 0 }, [safes]);

  // ── Filters & Search ─────────────────────────────────────────
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
  async function doApprove(id) {
    if (cooldownTime > 0) return;
    setConfirmId(null);
    setCooldownTime(60);
    setToastMsg(isAr ? '⏳ جاري اعتماد طلب السحب وصرف النقدية...' : 'Processing payout...');

    try {
      await approvePayoutRequest(id, selectedSafeId || 'SAFE-001');
      setToastMsg(isAr ? '✅ تم اعتماد طلب السحب وتوفير الكاش بنجاح!' : 'Payout approved successfully!');
      setTimeout(() => setToastMsg(null), 5000);
    } catch (err) {
      setToastMsg(isAr ? `❌ تعذر اعتماد السحب: ${err.message || 'رصيد الخزينة غير كافٍ'}` : `Error: ${err.message}`);
      setTimeout(() => setToastMsg(null), 6000);
    }
  }

  function doReject(id) {
    rejectPayoutRequest(id);
    setConfirmId(null);
    setRejectNote('');
  }

  async function doManualCredit(e) {
    e.preventDefault();
    if (!manualForm.merchantId || !manualForm.amount || cooldownTime > 0) return;

    // 1. Instantly close modal & reset state to avoid duplicate clicks
    const targetForm = { ...manualForm };
    setShowManual(false);
    setManualError(null);
    setManualForm({ merchantId: '', amount: '', type: 'payout', description: '', safeId: 'SAFE-001' });

    // 2. Start 60-second cooldown lock
    setCooldownTime(60);

    // 3. Display instant feedback toast
    setToastMsg(isAr ? '⏳ جاري تنفيذ التسوية المالية وإقفال المستحقات...' : 'Executing settlement...');

    try {
      await manualCredit(targetForm.merchantId, targetForm.amount, targetForm.description, targetForm.type || 'payout', targetForm.safeId || 'SAFE-001');
      setToastMsg(isAr ? '✅ تم إتمام التسوية المالية بنجاح!' : 'Settlement executed successfully!');
      setTimeout(() => setToastMsg(null), 5000);
    } catch (err) {
      setToastMsg(isAr ? `❌ تعذر إتمام التسوية: ${err.message || 'رصيد الخزينة المحددة غير كافٍ'}` : `Failed: ${err.message}`);
      setTimeout(() => setToastMsg(null), 6000);
    }
  }

  // ── Tab button rendering ──────────────────────────────────────
  const tabBtn = (id, labelAr, labelEn, icon, badgeCount) => (
    <button key={id} onClick={() => setSection(id)} style={{
      display: 'flex', alignItems: 'center', gap: '8px',
      padding: '12px 22px', borderRadius: '14px', border: 'none', cursor: 'pointer',
      fontWeight: 800, fontSize: '13px',
      background: activeSection === id ? 'linear-gradient(135deg, var(--primary-color), #059669)' : 'rgba(128,128,128,0.08)',
      color: activeSection === id ? '#fff' : 'var(--text-secondary)',
      boxShadow: activeSection === id ? '0 4px 16px rgba(16,185,129,0.35)' : 'none',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    }}>
      <span>{icon}</span>
      <span>{isAr ? labelAr : labelEn}</span>
      {badgeCount > 0 && (
        <span style={{
          background: activeSection === id ? 'rgba(255,255,255,0.25)' : '#EF4444',
          color: '#fff', borderRadius: '99px', padding: '2px 8px', fontSize: '11px', fontWeight: 900
        }}>
          {badgeCount}
        </span>
      )}
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative' }}>

      {/* Floating Status Toast Notification */}
      {toastMsg && (
        <div style={{
          position: 'fixed', top: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 99999,
          padding: '14px 28px', borderRadius: '16px', fontWeight: 800, fontSize: '14px',
          background: toastMsg.includes('❌') ? 'rgba(239,68,68,0.95)' : (toastMsg.includes('⏳') ? 'rgba(251,191,36,0.95)' : 'rgba(16,185,129,0.95)'),
          color: '#fff', boxShadow: '0 10px 30px rgba(0,0,0,0.35)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          {toastMsg}
        </div>
      )}

      {/* ══════════════ 1. HEADER TITLE & QUICK ACTIONS ══════════════ */}
      <div className="glass-panel" style={{
        padding: '24px 28px', borderRadius: '24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px',
        background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(99,102,241,0.04))',
        border: '1px solid rgba(16,185,129,0.2)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '18px',
            background: 'linear-gradient(135deg, var(--primary-color), #047857)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', boxShadow: '0 6px 20px rgba(16,185,129,0.4)'
          }}>
            {Icon.wallet}
          </div>
          <div>
            <h1 style={{ fontWeight: 900, fontSize: '22px', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px' }}>
              {isAr ? 'المحافظ والخدمات المالية الذكية' : 'Wallets & Financial Services'}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', margin: '4px 0 0' }}>
              {isAr ? 'إدارة سحوبات المتاجر، المعاملات المالية، والتسويات النقدية اللحظية مع الخزائن' : 'Manage merchant payouts, transaction logs, and real-time safe settlements'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Print General Report Button */}
          <button onClick={() => handlePrint('payouts')} style={{
            padding: '11px 18px', borderRadius: '14px', border: '1px solid rgba(99,102,241,0.3)',
            background: 'rgba(99,102,241,0.1)', color: '#6366F1', fontWeight: 800, cursor: 'pointer',
            fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px',
            transition: 'all 0.2s ease'
          }}>
            {Icon.print} {isAr ? 'طباعة كشف عام' : 'Print Summary'}
          </button>

          {/* New Manual Settlement Button */}
          <button
            disabled={cooldownTime > 0}
            onClick={() => {
              if (cooldownTime > 0) return;
              setManualForm({ merchantId: '', amount: '', type: 'payout', description: '', safeId: 'SAFE-001' });
              setShowManual(true);
            }}
            style={{
              padding: '11px 22px', borderRadius: '14px', border: 'none',
              background: cooldownTime > 0 ? 'rgba(128,128,128,0.2)' : 'linear-gradient(135deg, var(--primary-color), #059669)',
              color: '#fff', fontWeight: 800, cursor: cooldownTime > 0 ? 'not-allowed' : 'pointer', fontSize: '13px',
              boxShadow: cooldownTime > 0 ? 'none' : '0 4px 18px rgba(16,185,129,0.4)',
              opacity: cooldownTime > 0 ? 0.7 : 1,
              display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s ease'
            }}
          >
            {Icon.plus} {cooldownTime > 0 ? (isAr ? `انتظر (${cooldownTime}ث)` : `Wait (${cooldownTime}s)`) : (isAr ? 'تسوية ماليّة يدويّة' : 'Manual Settlement')}
          </button>
        </div>
      </div>

      {/* ══════════════ 2. FINANCIAL STATS GRID ══════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>

        {/* Total Wallets Balance */}
        <div className="glass-card" style={{
          padding: '20px 22px', borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.03))',
          border: '1px solid rgba(16,185,129,0.25)', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#10B981' }}>{isAr ? 'إجمالي أرصدة المحافظ' : 'Total Merchant Balances'}</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
              {Icon.wallet}
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: 'var(--text-primary)' }} dir="ltr">
            <AnimatedCounter value={totalBalances} /> <span style={{ fontSize: '14px', color: '#10B981', fontWeight: 800 }}>{isAr ? 'د.ل' : 'LYD'}</span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', margin: '6px 0 0' }}>
            {isAr ? 'مستحقات نقدية قائمة جاهزة للصرف للمتاجر' : 'Active total balances owed to merchants'}
          </p>
        </div>

        {/* Pending Payout Requests */}
        <div className="glass-card" style={{
          padding: '20px 22px', borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(251,191,36,0.03))',
          border: '1px solid rgba(251,191,36,0.25)', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#FBBF24' }}>{isAr ? 'طلبات سحب معلّقة' : 'Pending Payout Requests'}</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'rgba(251,191,36,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FBBF24' }}>
              {Icon.clock}
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: 'var(--text-primary)' }} dir="ltr">
            <AnimatedCounter value={totalPending} /> <span style={{ fontSize: '14px', color: '#FBBF24', fontWeight: 800 }}>{isAr ? 'د.ل' : 'LYD'}</span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', margin: '6px 0 0' }}>
            {pendingCount} {isAr ? 'طلبات سحب بانتظار الاعتماد والصرف' : 'payout requests pending approval'}
          </p>
        </div>

        {/* Total Settled Payouts */}
        <div className="glass-card" style={{
          padding: '20px 22px', borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(99,102,241,0.03))',
          border: '1px solid rgba(99,102,241,0.25)', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#6366F1' }}>{isAr ? 'إجمالي السحوبات المصروفة' : 'Total Settled Payouts'}</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366F1' }}>
              {Icon.check}
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: 'var(--text-primary)' }} dir="ltr">
            <AnimatedCounter value={totalApproved} /> <span style={{ fontSize: '14px', color: '#6366F1', fontWeight: 800 }}>{isAr ? 'د.ل' : 'LYD'}</span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', margin: '6px 0 0' }}>
            {isAr ? 'تم صرفها وتحويلها بالكامل للمتاجر' : 'Successfully paid out to merchants'}
          </p>
        </div>

        {/* Main Safe Available Balance */}
        <div className="glass-card" style={{
          padding: '20px 22px', borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(6,182,212,0.12), rgba(6,182,212,0.03))',
          border: '1px solid rgba(6,182,212,0.25)', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#06B6D4' }}>{isAr ? 'الخزينة الرئيسية المتاحة' : 'Main Safe Available Cash'}</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'rgba(6,182,212,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06B6D4' }}>
              {Icon.safe}
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: 'var(--text-primary)' }} dir="ltr">
            <AnimatedCounter value={mainSafe.balance || 0} /> <span style={{ fontSize: '14px', color: '#06B6D4', fontWeight: 800 }}>{isAr ? 'د.ل' : 'LYD'}</span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', margin: '6px 0 0', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: (mainSafe.balance || 0) >= totalPending ? '#10B981' : '#FBBF24', display: 'inline-block' }} />
            {(mainSafe.balance || 0) >= totalPending
              ? (isAr ? 'السيولة النقديّة ممتازة ومغطيّة للطلبات' : 'Sufficient cash balance for pending payouts')
              : (isAr ? 'تنبيه: السيولة النقديّة غير كافية لجميع الطلبات' : 'Attention: Low cash liquidity for payouts')}
          </p>
        </div>

      </div>

      {/* ══════════════ 3. NAVIGATION TABS & SEARCH BAR ══════════════ */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '10px' }}>
          {tabBtn('payouts', 'طلبات السحب والموافقات', 'Payout Requests', Icon.list, pendingCount)}
          {tabBtn('wallets', 'محافظ المتاجر الأهلية', 'Merchant Wallets', Icon.store, merchants.length)}
          {tabBtn('log', 'سجل جميع المعاملات المالية', 'Financial Audit Log', Icon.trending, txLog.length)}
        </div>

        {/* Search input */}
        <div style={{ position: 'relative', width: '280px' }}>
          <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)', pointerEvents: 'none' }}>
            {Icon.search}
          </span>
          <input
            type="text"
            className="glass-input"
            placeholder={isAr ? 'بحث عن متجر، عميل، أو مرجع...' : 'Search store, merchant, ref...'}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: '100%', paddingRight: '40px', paddingLeft: '14px', borderRadius: '14px', fontSize: '13px' }}
          />
        </div>
      </div>

      {/* ══════════════ 4. PAYOUT REQUESTS SECTION ══════════════ */}
      {activeSection === 'payouts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)', marginLeft: '8px' }}>
              {isAr ? 'تصفية حسب الحالة:' : 'Filter Status:'}
            </span>
            {['All', 'Pending', 'Approved', 'Rejected'].map(st => (
              <button key={st} onClick={() => setFilter(st)} style={{
                padding: '6px 14px', borderRadius: '10px', border: '1px solid var(--card-border)',
                fontSize: '12px', fontWeight: 700, cursor: 'pointer',
                background: filterStatus === st ? 'rgba(16,185,129,0.15)' : 'transparent',
                color: filterStatus === st ? '#10B981' : 'var(--text-secondary)',
                borderColor: filterStatus === st ? 'rgba(16,185,129,0.4)' : 'var(--card-border)'
              }}>
                {st === 'All' ? (isAr ? 'الكل' : 'All') : (isAr ? S_AR[st] : st)}
              </button>
            ))}
          </div>

          {/* Payout Cards Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredPayouts.map(p => (
              <div key={p.id} className="glass-card" style={{
                padding: '20px 24px', borderRadius: '20px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px',
                border: '1px solid var(--card-border)', background: 'var(--glass-bg)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}>
                {/* Merchant & Bank details */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '260px' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '16px',
                    background: 'linear-gradient(135deg, var(--primary-color), #059669)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#fff', fontWeight: 900, fontSize: '18px', boxShadow: '0 4px 14px rgba(16,185,129,0.3)'
                  }}>
                    {(p.merchantStore || p.storeName || 'م').charAt(0)}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-primary)' }}>
                      {p.merchantStore || p.storeName}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{p.merchantName}</span>
                      <span>•</span>
                      <span dir="ltr" style={{ fontFamily: 'monospace' }}>{p.bankAccount || p.bankDetails || 'تسوية نقدية'}</span>
                    </div>
                  </div>
                </div>

                {/* Requested Amount */}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '2px' }}>{isAr ? 'المبلغ المطلوب' : 'Requested Amount'}</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, color: '#10B981' }} dir="ltr">
                    {p.amount?.toLocaleString()} <span style={{ fontSize: '12px' }}>{isAr ? 'د.ل' : 'LYD'}</span>
                  </div>
                </div>

                {/* Status Badge */}
                <div>
                  <Badge status={p.status} isAr={isAr} />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {p.status === 'Pending' ? (
                    <>
                      <button onClick={() => { setConfirmId(p.id); setConfirm('approve'); }} style={{
                        padding: '9px 18px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                        fontSize: '12px', fontWeight: 800, background: 'linear-gradient(135deg, #10B981, #059669)',
                        color: '#fff', boxShadow: '0 4px 14px rgba(16,185,129,0.35)', display: 'flex', alignItems: 'center', gap: '6px'
                      }}>
                        {Icon.check} {isAr ? 'اعتماد وتوفير الكاش' : 'Approve & Pay'}
                      </button>
                      <button onClick={() => { setConfirmId(p.id); setConfirm('reject'); }} style={{
                        padding: '9px 14px', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.3)',
                        cursor: 'pointer', fontSize: '12px', fontWeight: 700, background: 'rgba(239,68,68,0.1)',
                        color: '#EF4444'
                      }}>
                        {isAr ? 'رفض' : 'Reject'}
                      </button>
                    </>
                  ) : (
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      {p.requestedAt ? new Date(p.requestedAt).toLocaleDateString('ar-LY') : ''}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {filteredPayouts.length === 0 && (
              <div className="glass-card" style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.4 }}>{Icon.list}</div>
                {isAr ? 'لا توجد طلبات سحب تنطبق عليها شروط البحث حالياً.' : 'No payout requests match your search.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════ 5. MERCHANT WALLETS SECTION ══════════════ */}
      {activeSection === 'wallets' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filteredMerchants.map(m => {
            const isSel = selectedMerchant?.id === m.id;
            const pct = Math.round(((m.totalEarned || 0) / maxBalance) * 100);
            const mTx = txLog.filter(t => t.merchantId === m.id);
            return (
              <div key={m.id} className="glass-card" style={{
                borderRadius: '20px', border: '1px solid var(--card-border)', overflow: 'hidden',
                transition: 'all 0.3s ease', background: 'var(--glass-bg)'
              }}>
                {/* Header row */}
                <div style={{
                  padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  flexWrap: 'wrap', gap: '16px', cursor: 'pointer'
                }} onClick={() => setSelectedMerchant(isSel ? null : m)}>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: '240px' }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '16px',
                      background: 'linear-gradient(135deg, var(--primary-color), #059669)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: '20px', fontWeight: 900, boxShadow: '0 4px 14px rgba(16,185,129,0.3)'
                    }}>
                      {(m.storeName || 'م').charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 900, fontSize: '16px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>{m.storeName}</span>
                        {m.verified && <span style={{ fontSize: '12px', color: '#10B981' }}>✓</span>}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                        {m.name || m.ownerName} • {m.phone}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexWrap: 'wrap' }}>
                    {/* Financial Stats */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginBottom: '2px' }}>{isAr ? 'مكتسب' : 'Earned'}</div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-secondary)' }} dir="ltr">{(m.totalEarned || 0).toLocaleString()}</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginBottom: '2px' }}>{isAr ? 'مسحوب' : 'Withdrawn'}</div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#EF4444' }} dir="ltr">{(m.totalWithdrawn || 0).toLocaleString()}</div>
                    </div>

                    {/* Balance */}
                    <div style={{
                      background: (m.walletBalance || 0) > 0 ? 'rgba(16,185,129,0.12)' : 'rgba(128,128,128,0.08)',
                      border: `1px solid ${(m.walletBalance || 0) > 0 ? 'rgba(16,185,129,0.3)' : 'var(--card-border)'}`,
                      borderRadius: '14px', padding: '10px 20px', textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginBottom: '2px' }}>{isAr ? 'الرصيد المستحق' : 'Net Wallet Balance'}</div>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: (m.walletBalance || 0) > 0 ? '#10B981' : 'var(--text-tertiary)' }} dir="ltr">
                        {(m.walletBalance || 0).toLocaleString()} <span style={{ fontSize: '12px' }}>{isAr ? 'د.ل' : 'LYD'}</span>
                      </div>
                    </div>

                    {/* Quick Settlement Button */}
                    {(m.walletBalance || 0) > 0 && (
                      <button
                        disabled={cooldownTime > 0}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (cooldownTime > 0) return;
                          setManualForm({
                            merchantId: m.id,
                            amount: String(m.walletBalance || 0),
                            type: 'payout',
                            description: `تسوية وصرف أرصدة التاجر (${m.storeName})`,
                            safeId: 'SAFE-001'
                          });
                          setShowManual(true);
                        }}
                        style={{
                          padding: '8px 16px', borderRadius: '12px', border: 'none',
                          cursor: cooldownTime > 0 ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 800,
                          background: cooldownTime > 0 ? 'rgba(128,128,128,0.2)' : 'linear-gradient(135deg, #10B981, #059669)',
                          color: '#fff', opacity: cooldownTime > 0 ? 0.7 : 1,
                          boxShadow: cooldownTime > 0 ? 'none' : '0 4px 14px rgba(16,185,129,0.35)',
                          display: 'flex', alignItems: 'center', gap: '6px'
                        }}
                      >
                        {Icon.check} {cooldownTime > 0 ? (isAr ? `انتظر (${cooldownTime}ث)` : `Wait (${cooldownTime}s)`) : (isAr ? 'تسوية مريحة' : 'Settle Wallet')}
                      </button>
                    )}

                    {/* Print Statement Button */}
                    <button onClick={(e) => { e.stopPropagation(); setSelectedMerchant(m); handlePrint('wallet'); }} style={{
                      padding: '8px 12px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                      fontSize: '12px', fontWeight: 700, background: '#6366F1', color: '#fff', display: 'flex', alignItems: 'center', gap: '4px'
                    }}>
                      {Icon.print}
                    </button>

                    {/* Expand Arrow */}
                    <span style={{ color: 'var(--text-tertiary)', transform: isSel ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>
                      {Icon.arrow}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ padding: '0 24px 16px' }}>
                  <MiniBar pct={pct} color="var(--primary-color)" />
                </div>

                {/* Expanded Transaction Log */}
                {isSel && (
                  <div style={{ padding: '20px 24px', borderTop: '1px solid var(--card-border)', background: 'rgba(0,0,0,0.02)' }}>
                    <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--text-primary)', marginBottom: '12px' }}>
                      {isAr ? 'سجل حركات محفظة هذا التاجر' : 'Merchant Wallet Transaction History'}
                    </div>
                    {mTx.length === 0 ? (
                      <p style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{isAr ? 'لا توجد حركات سابقة لهذه المحفظة.' : 'No transactions found.'}</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {mTx.map(t => (
                          <div key={t.id} style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '12px 16px', borderRadius: '12px',
                            background: t.type === 'credit' ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
                            border: `1px solid ${t.type === 'credit' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}`
                          }}>
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{t.description}</div>
                              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                                {t.date ? new Date(t.date).toLocaleDateString('ar-LY') : ''} • المرجع: {t.ref}
                              </div>
                            </div>
                            <div style={{ fontWeight: 900, fontSize: '15px', color: t.type === 'credit' ? '#10B981' : '#EF4444' }} dir="ltr">
                              {t.type === 'credit' ? '+' : '-'}{t.amount?.toLocaleString()} {isAr ? 'د.ل' : 'LYD'}
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
            <div className="glass-card" style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-tertiary)', fontSize: '13px' }}>
              <div style={{ fontSize: '40px', marginBottom: '12px', opacity: 0.4 }}>{Icon.store}</div>
              {isAr ? 'لا توجد محافظ تجار تطابق نتيجة البحث.' : 'No merchant wallets match your search.'}
            </div>
          )}
        </div>
      )}

      {/* ══════════════ 6. TRANSACTION LOG SECTION ══════════════ */}
      {activeSection === 'log' && (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '20px', border: '1px solid var(--card-border)' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              {Icon.trending} {isAr ? 'سجل جميع المعاملات المالية الموحد' : 'Unified Financial Audit Log'}
            </h3>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)' }}>{filteredTxLog.length} {isAr ? 'معاملة' : 'entries'}</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
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
                    <td style={{ fontWeight: 800 }}>{t.storeName || t.merchantStore || 'متجر'}</td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{t.description}</td>
                    <td style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      {t.date ? new Date(t.date).toLocaleDateString('ar-LY') : ''}
                    </td>
                    <td>
                      <span style={{
                        padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 800,
                        background: t.type === 'credit' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                        color: t.type === 'credit' ? '#10B981' : '#EF4444'
                      }}>
                        {t.type === 'credit' ? (isAr ? 'إيداع' : 'Credit') : (isAr ? 'سحب' : 'Debit')}
                      </span>
                    </td>
                    <td style={{ fontWeight: 900, color: t.type === 'credit' ? '#10B981' : '#EF4444' }} dir="ltr">
                      {t.type === 'credit' ? '+' : '-'}{Math.abs(t.amount || 0).toLocaleString()} {isAr ? 'د.ل' : 'LYD'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ══════════════ 7. CONFIRM MODAL ══════════════ */}
      {confirmId && (
        <div className="modal-overlay" onClick={() => { setConfirmId(null); setRejectNote(''); }}>
          <div className="modal-content glass-panel" style={{ padding: '32px', maxWidth: '440px', borderRadius: '24px' }} onClick={e => e.stopPropagation()}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '64px', height: '64px', borderRadius: '20px', margin: '0 auto 16px',
                background: confirmAction === 'approve' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: confirmAction === 'approve' ? '#10B981' : '#EF4444'
              }}>
                {confirmAction === 'approve' ? Icon.check : Icon.x}
              </div>
              <h3 style={{ fontWeight: 900, fontSize: '18px', color: 'var(--text-primary)', marginBottom: '8px' }}>
                {isAr
                  ? (confirmAction === 'approve' ? 'تأكيد اعتماد طلب السحب وصرف النقدية' : 'تأكيد رفض طلب السحب')
                  : (confirmAction === 'approve' ? 'Confirm Payout Approval & Cash Payout' : 'Confirm Payout Rejection')}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                {isAr
                  ? (confirmAction === 'approve' ? 'سيتم خصم المبلغ فوراً من محفظة التاجر وسحبه نقداً من الخزينة الرئيسية.' : 'يرجى كتابة سبب الرفض لإفادة التاجر.')
                  : (confirmAction === 'approve' ? 'Amount will be deducted from merchant wallet and withdrawn from main safe.' : 'Enter rejection note for merchant.')}
              </p>
            </div>

            {confirmAction === 'approve' && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
                  {isAr ? 'الخزينة المصدرية للصرف النظير' : 'Source Safe for Payout'}
                </label>
                <select className="glass-input w-full" value={selectedSafeId} onChange={e => setSelectedSafeId(e.target.value)} style={{ borderRadius: '12px' }}>
                  {(safes || []).map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.branch}) - رصيد: {s.balance} د.ل</option>
                  ))}
                </select>
              </div>
            )}

            {confirmAction === 'reject' && (
              <textarea
                placeholder={isAr ? 'سبب الرفض (اختياري)...' : 'Rejection reason...'}
                value={rejectNote} onChange={e => setRejectNote(e.target.value)}
                className="glass-input" rows={3}
                style={{ width: '100%', resize: 'none', marginBottom: '20px', fontSize: '13px', borderRadius: '12px' }}
              />
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button onClick={() => { setConfirmId(null); setRejectNote(''); }} style={{
                padding: '12px 24px', borderRadius: '14px', border: '1px solid var(--card-border)',
                background: 'transparent', color: 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer', fontSize: '13px'
              }}>
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button onClick={() => confirmAction === 'approve' ? doApprove(confirmId) : doReject(confirmId)} style={{
                padding: '12px 28px', borderRadius: '14px', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: '13px',
                background: confirmAction === 'approve' ? 'linear-gradient(135deg,#10B981,#059669)' : 'linear-gradient(135deg,#EF4444,#DC2626)',
                color: '#fff', boxShadow: `0 4px 16px rgba(${confirmAction === 'approve' ? '16,185,129' : '239,68,68'},0.4)`
              }}>
                {isAr ? 'تأكيد التنفيذ' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ 8. MANUAL SETTLEMENT / CREDIT MODAL ══════════════ */}
      {showManual && (
        <div className="modal-overlay" onClick={() => setShowManual(false)}>
          <div className="modal-content glass-panel" style={{ padding: '32px', maxWidth: '480px', borderRadius: '24px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '22px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '16px',
                background: manualForm.type === 'debit' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: manualForm.type === 'debit' ? '#EF4444' : '#10B981'
              }}>
                {manualForm.type === 'debit' ? Icon.bank : Icon.plus}
              </div>
              <div>
                <h3 style={{ fontWeight: 900, fontSize: '17px', color: 'var(--text-primary)', margin: 0 }}>
                  {isAr ? 'التسوية والإيداع المالي للمحفظة' : 'Manual Wallet Settlement'}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: '3px 0 0' }}>
                  {isAr ? 'خصم أو تسوية أرباح أو إيداع مالي في محفظة التاجر' : 'Financial settlement for merchant wallet'}
                </p>
              </div>
            </div>

            <form onSubmit={doManualCredit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  {isAr ? 'نوع التسوية المالية' : 'Settlement Type'}
                </label>
                <select className="glass-input" value={manualForm.type} onChange={e => setManualForm(p => ({ ...p, type: e.target.value }))} style={{ borderRadius: '12px' }}>
                  <option value="payout">{isAr ? '💸 تسوية وصرف أرباح التاجر (خصم كاش من الخزينة للتاجر)' : '💸 Merchant Payout (Cash Out from Safe)'}</option>
                  <option value="credit">{isAr ? '➕ إيداع / شحن رصيد للمحفظة' : '➕ Credit Deposit'}</option>
                  <option value="debit">{isAr ? '📥 خصم / تحصيل نقدي من التاجر إلى الخزينة' : '📥 Debit Cash Collection (Deposit to Safe)'}</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  {isAr ? 'الخزينة المحددة للمعاملة' : 'Target Safe'}
                </label>
                <select className="glass-input w-full" value={manualForm.safeId} onChange={e => setManualForm(p => ({ ...p, safeId: e.target.value }))} style={{ borderRadius: '12px' }}>
                  {(safes || []).map(s => <option key={s.id} value={s.id}>{s.name} ({s.branch}) - رصيد: {s.balance} د.ل</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  {isAr ? 'اختر التاجر المستهدف' : 'Select Merchant'}
                </label>
                <select required className="glass-input" value={manualForm.merchantId} onChange={e => setManualForm(p => ({ ...p, merchantId: e.target.value }))} style={{ borderRadius: '12px' }}>
                  <option value="">{isAr ? '-- اختر التاجر --' : '-- Select --'}</option>
                  {merchants.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.storeName} ({isAr ? 'رصيد:' : 'Balance:'} {m.walletBalance || 0} {isAr ? 'د.ل' : 'LYD'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  {isAr ? 'المبلغ المراد تسويته (د.ل)' : 'Amount (LYD)'}
                </label>
                <input required type="number" min="1" className="glass-input" placeholder="0.00"
                  value={manualForm.amount} onChange={e => setManualForm(p => ({ ...p, amount: e.target.value }))} style={{ borderRadius: '12px' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  {isAr ? 'وصف أو ملاحظة التسوية' : 'Description / Note'}
                </label>
                <input type="text" className="glass-input" placeholder={isAr ? 'مثال: تسوية نقدية للمحفظة' : 'e.g. Manual payout'}
                  value={manualForm.description} onChange={e => setManualForm(p => ({ ...p, description: e.target.value }))} style={{ borderRadius: '12px' }} />
              </div>

              {manualError && (
                <div style={{
                  padding: '14px 16px', borderRadius: '14px',
                  background: 'linear-gradient(135deg, rgba(239,68,68,0.18), rgba(220,38,38,0.12))',
                  border: '1px solid rgba(239, 68, 68, 0.4)', color: '#EF4444', fontSize: '13px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: '12px', lineHeight: 1.5
                }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {Icon.info}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '13px', marginBottom: '2px', color: '#F87171' }}>
                      {isAr ? 'تنبيه - تعذر إتمام العملية' : 'Transaction Alert'}
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>{manualError}</div>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button type="button" onClick={() => setShowManual(false)} style={{
                  padding: '12px 24px', borderRadius: '14px', border: '1px solid var(--card-border)',
                  background: 'transparent', color: 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer'
                }}>
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={cooldownTime > 0}
                  style={{
                    padding: '12px 28px', borderRadius: '14px', border: 'none',
                    background: cooldownTime > 0 ? 'rgba(128,128,128,0.2)' : (manualForm.type === 'debit' ? 'linear-gradient(135deg,#EF4444,#DC2626)' : 'linear-gradient(135deg,#10B981,#059669)'),
                    color: '#fff', fontWeight: 800, cursor: cooldownTime > 0 ? 'not-allowed' : 'pointer',
                    boxShadow: cooldownTime > 0 ? 'none' : `0 4px 16px rgba(${manualForm.type === 'debit' ? '239,68,68' : '16,185,129'},0.4)`,
                    opacity: cooldownTime > 0 ? 0.7 : 1, fontSize: '13px'
                  }}
                >
                  {cooldownTime > 0 ? (isAr ? `انتظر (${cooldownTime}ث)` : `Wait (${cooldownTime}s)`) : (isAr ? 'تأكيد التسوية المالية' : 'Confirm Settlement')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════ 9. PRINTABLE REPORTS (A4) ══════════════ */}
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
              {filteredPayouts.map(p => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.merchantStore || p.storeName}</td>
                  <td dir="ltr">{p.amount?.toLocaleString()} د.ل</td>
                  <td>{p.bankAccount || p.bankDetails}</td>
                  <td>{S_AR[p.status] || p.status}</td>
                  <td>{p.requestedAt ? new Date(p.requestedAt).toLocaleDateString('ar-LY') : ''}</td>
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
                  <td dir="ltr">{(selectedMerchant.totalEarned || 0).toLocaleString()} د.ل</td>
                  <td dir="ltr">{(selectedMerchant.totalWithdrawn || 0).toLocaleString()} د.ل</td>
                  <td dir="ltr" style={{ fontWeight: 'bold' }}>{(selectedMerchant.walletBalance || 0).toLocaleString()} د.ل</td>
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
                {txLog.filter(t => t.merchantId === selectedMerchant.id).map(t => (
                  <tr key={t.id}>
                    <td style={{ fontFamily: 'monospace' }}>{t.ref}</td>
                    <td>{t.description}</td>
                    <td>{t.date ? new Date(t.date).toLocaleDateString('ar-LY') : ''}</td>
                    <td>{t.type === 'credit' ? 'إيداع' : 'سحب'}</td>
                    <td dir="ltr">{t.type === 'credit' ? '+' : '-'}{t.amount?.toLocaleString()} د.ل</td>
                    <td style={{ fontWeight: 'bold', color: '#059669' }}>مكتملة</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <div className="print-footer-signatures">
          <div className="print-signature-box"><div className="print-signature-line">توقيع المستلم</div></div>
          <div className="print-signature-box"><div className="print-signature-line">ختم الشركة</div></div>
          <div className="print-signature-box"><div className="print-signature-line">المدير المالي</div></div>
        </div>
        <div className="print-footer-note">
          شكراً لتعاملكم مع شركة تمويل للتوصيل السريع - نظام إدارة العمليات الذكي
        </div>
      </div>

    </div>
  );
}

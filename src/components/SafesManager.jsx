'use client';
import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import AnimatedCounter from './AnimatedCounter';

// ── SVG Icons ──────────────────────────────────────────────────────────────────
const Svg = ({ children, size = 18, ...p }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" {...p}>{children}</svg>
);

const Icon = {
  safe:      <Svg><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></Svg>,
  plus:      <Svg><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Svg>,
  minus:     <Svg><line x1="5" y1="12" x2="19" y2="12"/></Svg>,
  transfer:  <Svg><polyline points="17 1 21 5 17 9"/><line x1="3" y1="5" x2="21" y2="5"/><polyline points="7 23 3 19 7 15"/><line x1="21" y1="19" x2="3" y2="19"/></Svg>,
  edit:      <Svg><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></Svg>,
  print:     <Svg><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></Svg>,
  search:    <Svg><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Svg>,
  arrowLeft: <Svg><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></Svg>,
  arrowRight:<Svg><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></Svg>,
  info:      <Svg><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></Svg>,
  trending:  <Svg><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></Svg>,
  shield:    <Svg><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></Svg>,
  truck:     <Svg><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></Svg>
};

// ── Transaction Type Badge ─────────────────────────────────────────────────────
const TxBadge = ({ type, isAr }) => {
  let bg = 'rgba(16,185,129,0.12)';
  let color = '#10B981';
  let label = isAr ? 'إيداع مالي' : 'Deposit';
  let sign = '+';

  if (type === 'withdrawal' || type === 'transfer_out') {
    bg = 'rgba(239,68,68,0.12)';
    color = '#EF4444';
    label = type === 'transfer_out' ? (isAr ? 'تحويل صادر' : 'Transfer Out') : (isAr ? 'صرف مالي' : 'Withdrawal');
    sign = '-';
  } else if (type === 'transfer_in') {
    bg = 'rgba(6,182,212,0.12)';
    color = '#06B6D4';
    label = isAr ? 'تحويل وارد' : 'Transfer In';
    sign = '+';
  }

  return (
    <span style={{
      padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 800,
      background: bg, color: color, display: 'inline-flex', alignItems: 'center', gap: '4px'
    }}>
      <span>{sign}</span>
      <span>{label}</span>
    </span>
  );
};

export default function SafesManager() {
  const { lang, safes, safeTransactions, addSafe, updateSafe, deleteSafe, recordSafeTransaction, transferBetweenSafes } = useApp();
  const isAr = lang === 'ar';
  const fmt = v => `${Number(v || 0).toLocaleString('ar-LY')} ${isAr ? 'د.ل' : 'LYD'}`;

  const [selectedSafeId, setSelectedSafeId]   = useState('ALL');
  const [viewSafeDetailId, setViewSafeDetailId] = useState(null); // Safe ID opened in detail page
  const [showAddModal, setShowAddModal]       = useState(false);
  const [showEditModal, setShowEditModal]     = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(null); // 'deposit' | 'withdrawal' | null

  const [newSafeForm, setNewSafeForm] = useState({ name: '', code: '', branch: '', initialBalance: '', notes: '' });
  const [editSafeForm, setEditSafeForm] = useState({ id: '', name: '', code: '', branch: '', initialBalance: '', notes: '' });
  const [transferForm, setTransferForm] = useState({ fromSafeId: '', toSafeId: '', amount: '', note: '' });
  const [actionForm, setActionForm] = useState({ safeId: '', amount: '', description: '', ref: '' });

  const [detailSearch, setDetailSearch] = useState('');
  const [detailTypeFilter, setDetailTypeFilter] = useState('ALL');
  const [transferError, setTransferError] = useState(null);
  const [actionError, setActionError]     = useState(null);

  // Active Safe for detail view
  const activeDetailSafe = useMemo(() => {
    if (!viewSafeDetailId) return null;
    return (safes || []).find(s => s.id === viewSafeDetailId) || null;
  }, [safes, viewSafeDetailId]);

  // Total Safes Balance
  const totalSafesBalance = useMemo(() => {
    return (safes || []).reduce((s, safe) => s + Number(safe.balance || 0), 0);
  }, [safes]);

  // Main Safe (`SAFE-001`)
  const mainSafe = useMemo(() => (safes || []).find(s => s.id === 'SAFE-001') || safes?.[0] || { balance: 0 }, [safes]);
  // Drivers Safe (`SAFE-005`)
  const driversSafe = useMemo(() => (safes || []).find(s => s.id === 'SAFE-005') || { balance: 0 }, [safes]);

  // Filtered transactions for main table
  const filteredTransactions = useMemo(() => {
    let list = safeTransactions || [];
    if (selectedSafeId !== 'ALL') {
      list = list.filter(tx => tx.safeId === selectedSafeId);
    }
    return list;
  }, [safeTransactions, selectedSafeId]);

  // Active Safe Detail Transactions
  const activeSafeTransactions = useMemo(() => {
    if (!viewSafeDetailId) return [];
    let list = (safeTransactions || []).filter(tx => tx.safeId === viewSafeDetailId);
    if (detailTypeFilter !== 'ALL') {
      list = list.filter(tx => tx.type === detailTypeFilter);
    }
    if (detailSearch.trim()) {
      const q = detailSearch.toLowerCase();
      list = list.filter(tx =>
        (tx.description && tx.description.toLowerCase().includes(q)) ||
        (tx.ref && tx.ref.toLowerCase().includes(q)) ||
        (tx.id && tx.id.toLowerCase().includes(q))
      );
    }
    return list;
  }, [safeTransactions, viewSafeDetailId, detailTypeFilter, detailSearch]);

  // Financial Summary for Active Detail Safe
  const activeSafeSummary = useMemo(() => {
    if (!activeDetailSafe) return { initial: 0, deposits: 0, withdrawals: 0, current: 0 };
    const safeTxs = (safeTransactions || []).filter(tx => tx.safeId === activeDetailSafe.id);
    const deposits = safeTxs
      .filter(t => t.type === 'deposit' || t.type === 'transfer_in')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const withdrawals = safeTxs
      .filter(t => t.type === 'withdrawal' || t.type === 'transfer_out')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const initial = Number(activeDetailSafe.initialBalance || 0);

    return {
      initial,
      deposits,
      withdrawals,
      current: Math.max(0, initial + deposits - withdrawals)
    };
  }, [activeDetailSafe, safeTransactions]);

  // ── Actions ───────────────────────────────────────────────────
  function handleAddSafeSubmit(e) {
    e.preventDefault();
    if (!newSafeForm.name) return;
    addSafe(newSafeForm);
    setNewSafeForm({ name: '', code: '', branch: '', initialBalance: '', notes: '' });
    setShowAddModal(false);
  }

  function openEditModal(safe) {
    setEditSafeForm({
      id: safe.id,
      name: safe.name || '',
      code: safe.code || '',
      branch: safe.branch || '',
      initialBalance: safe.initialBalance || 0,
      notes: safe.notes || ''
    });
    setShowEditModal(true);
  }

  function handleEditSafeSubmit(e) {
    e.preventDefault();
    if (!editSafeForm.id || !editSafeForm.name) return;
    updateSafe(editSafeForm.id, editSafeForm);
    setShowEditModal(false);
  }

  async function handleTransferSubmit(e) {
    e.preventDefault();
    if (!transferForm.fromSafeId || !transferForm.toSafeId || !transferForm.amount) return;
    setTransferError(null);
    try {
      await transferBetweenSafes(transferForm.fromSafeId, transferForm.toSafeId, transferForm.amount, transferForm.note);
      setTransferForm({ fromSafeId: '', toSafeId: '', amount: '', note: '' });
      setShowTransferModal(false);
    } catch (err) {
      setTransferError(err.message || (isAr ? 'حدث خطأ أثناء إجراء التحويل بين الخزائن' : 'Error transferring between safes'));
    }
  }

  async function handleActionSubmit(e) {
    e.preventDefault();
    if (!actionForm.safeId || !actionForm.amount || !showActionModal) return;
    setActionError(null);
    try {
      await recordSafeTransaction({
        safeId: actionForm.safeId,
        type: showActionModal,
        amount: actionForm.amount,
        description: actionForm.description || (showActionModal === 'deposit' ? (isAr ? 'إيداع مالي يدوي' : 'Manual Deposit') : (isAr ? 'صرف مالي يدوي' : 'Manual Withdrawal')),
        ref: actionForm.ref || (showActionModal === 'deposit' ? 'DEP-MANUAL' : 'WTH-MANUAL')
      });
      setActionForm({ safeId: '', amount: '', description: '', ref: '' });
      setShowActionModal(null);
    } catch (err) {
      setActionError(err.message || (isAr ? 'حدث خطأ أثناء تنفيذ المعاملة على الخزينة' : 'Error performing safe transaction'));
    }
  }

  function openActionModal(type, safeId = '') {
    setShowActionModal(type);
    setActionForm(p => ({ ...p, safeId: safeId || (safes?.[0]?.id || '') }));
  }

  // ════════════════════════════════════════════════════════════════════════
  // ── 1. DETAILED SAFE VIEW PAGE (كشف تفصيلي لخزينة محددة) ─────────────────
  // ════════════════════════════════════════════════════════════════════════
  if (viewSafeDetailId && activeDetailSafe) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header Bar */}
        <div className="glass-panel" style={{
          padding: '20px 24px', borderRadius: '20px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px',
          background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(99,102,241,0.04))',
          border: '1px solid rgba(16,185,129,0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <button onClick={() => setViewSafeDetailId(null)} style={{
              padding: '10px 18px', borderRadius: '12px', border: '1px solid var(--card-border)',
              background: 'rgba(128,128,128,0.1)', color: 'var(--text-primary)', fontWeight: 800, fontSize: '13px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              {isAr ? Icon.arrowRight : Icon.arrowLeft} {isAr ? 'العودة لكافة الخزائن' : 'Back to Safes'}
            </button>
            <div>
              <h1 style={{ fontWeight: 900, fontSize: '20px', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                {Icon.safe} {activeDetailSafe.name}
              </h1>
              <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{activeDetailSafe.code} • {activeDetailSafe.branch}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={() => openEditModal(activeDetailSafe)} style={{
              padding: '10px 16px', borderRadius: '12px', border: '1px solid rgba(99,102,241,0.3)',
              background: 'rgba(99,102,241,0.1)', color: '#6366F1', fontWeight: 800, fontSize: '12px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              {Icon.edit} {isAr ? 'تعديل الخزينة' : 'Edit Safe'}
            </button>
            <button onClick={() => openActionModal('deposit', activeDetailSafe.id)} style={{
              padding: '10px 18px', borderRadius: '12px', border: 'none',
              background: 'linear-gradient(135deg, #10B981, #059669)', color: '#fff', fontWeight: 800, fontSize: '12px', cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(16,185,129,0.35)', display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              {Icon.plus} {isAr ? 'إيداع مالي' : 'Deposit'}
            </button>
            <button onClick={() => openActionModal('withdrawal', activeDetailSafe.id)} style={{
              padding: '10px 18px', borderRadius: '12px', border: 'none',
              background: 'linear-gradient(135deg, #EF4444, #DC2626)', color: '#fff', fontWeight: 800, fontSize: '12px', cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(239,68,68,0.35)', display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              {Icon.minus} {isAr ? 'صرف مالي' : 'Withdraw'}
            </button>
            <button onClick={() => window.print()} style={{
              padding: '10px 16px', borderRadius: '12px', border: 'none',
              background: '#6366F1', color: '#fff', fontWeight: 800, fontSize: '12px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              {Icon.print} {isAr ? 'طباعة الكشف' : 'Print'}
            </button>
          </div>
        </div>

        {/* KPI Financial Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div className="glass-card" style={{ padding: '18px 20px', borderRadius: '18px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 800 }}>{isAr ? 'الرصيد الافتتاحي' : 'Initial Balance'}</div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-secondary)', marginTop: '4px' }} dir="ltr">{fmt(activeSafeSummary.initial)}</div>
          </div>
          <div className="glass-card" style={{ padding: '18px 20px', borderRadius: '18px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 800 }}>{isAr ? 'إجمالي المقبوضات والإيداعات (+)' : 'Total Deposits (+)'}</div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#10B981', marginTop: '4px' }} dir="ltr">+{fmt(activeSafeSummary.deposits)}</div>
          </div>
          <div className="glass-card" style={{ padding: '18px 20px', borderRadius: '18px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 800 }}>{isAr ? 'إجمالي المدفوعات والمصروفات (-)' : 'Total Withdrawals (-)'}</div>
            <div style={{ fontSize: '20px', fontWeight: 900, color: '#EF4444', marginTop: '4px' }} dir="ltr">-{fmt(activeSafeSummary.withdrawals)}</div>
          </div>
          <div className="glass-card" style={{
            padding: '18px 20px', borderRadius: '18px',
            background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.03))',
            border: '1px solid rgba(16,185,129,0.3)'
          }}>
            <div style={{ fontSize: '11px', color: '#10B981', fontWeight: 900 }}>{isAr ? 'الرصيد الصافي الحالي (السيولة)' : 'Current Net Liquidity'}</div>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#10B981', marginTop: '4px' }} dir="ltr">{fmt(activeSafeSummary.current)}</div>
          </div>
        </div>

        {/* Transactions Table & Filters */}
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '20px', border: '1px solid var(--card-border)' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontWeight: 900, fontSize: '15px', color: 'var(--text-primary)' }}>{isAr ? 'سجل حركات ومعاملات الخزينة التفصيلي' : 'Safe Detailed Ledger'}</span>
              <span style={{ padding: '3px 10px', borderRadius: '8px', background: 'rgba(99,102,241,0.12)', color: '#6366F1', fontSize: '11px', fontWeight: 800 }}>
                {activeSafeTransactions.length} {isAr ? 'حركة' : 'entries'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <input
                type="text" className="glass-input" style={{ padding: '8px 14px', fontSize: '12px', minWidth: '220px', borderRadius: '12px' }}
                placeholder={isAr ? 'بحث بالبيان أو المرجع...' : 'Search ref, note...'}
                value={detailSearch} onChange={e => setDetailSearch(e.target.value)}
              />
              <select className="glass-input" style={{ padding: '8px 14px', fontSize: '12px', borderRadius: '12px' }} value={detailTypeFilter} onChange={e => setDetailTypeFilter(e.target.value)}>
                <option value="ALL">{isAr ? 'جميع المعاملات' : 'All Types'}</option>
                <option value="deposit">{isAr ? '➕ إيداع مالي' : 'Deposit'}</option>
                <option value="withdrawal">{isAr ? '➖ صرف مالي' : 'Withdrawal'}</option>
                <option value="transfer_in">{isAr ? '📥 تحويل وارد' : 'Transfer In'}</option>
                <option value="transfer_out">{isAr ? '📤 تحويل صادر' : 'Transfer Out'}</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>{isAr ? 'رقم الحركة / المرجع' : 'Ref ID'}</th>
                  <th>{isAr ? 'نوع الحركة' : 'Type'}</th>
                  <th>{isAr ? 'البيان / الوصف' : 'Description'}</th>
                  <th>{isAr ? 'التاريخ والوقت' : 'Date & Time'}</th>
                  <th>{isAr ? 'المبلغ' : 'Amount'}</th>
                </tr>
              </thead>
              <tbody>
                {activeSafeTransactions.map(tx => (
                  <tr key={tx.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-tertiary)' }} dir="ltr">{tx.ref || tx.id}</td>
                    <td><TxBadge type={tx.type} isAr={isAr} /></td>
                    <td style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{tx.description}</td>
                    <td style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      {tx.date ? new Date(tx.date).toLocaleDateString('ar-LY') + ' ' + new Date(tx.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </td>
                    <td style={{ fontWeight: 900, fontSize: '14px', color: (tx.type === 'deposit' || tx.type === 'transfer_in') ? '#10B981' : '#EF4444' }} dir="ltr">
                      {(tx.type === 'deposit' || tx.type === 'transfer_in') ? '+' : '-'}{Math.abs(Number(tx.amount || 0)).toLocaleString()} {isAr ? 'د.ل' : 'LYD'}
                    </td>
                  </tr>
                ))}
                {activeSafeTransactions.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                      {isAr ? 'لا توجد حركات مسجلة لهذه الخزينة.' : 'No transactions recorded for this safe.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // ── 2. SAFES OVERVIEW & MANAGEMENT DASHBOARD ─────────────────────────────
  // ════════════════════════════════════════════════════════════════════════
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ══════════════ 1. HEADER TITLE & QUICK ACTIONS ══════════════ */}
      <div className="glass-panel" style={{
        padding: '24px 28px', borderRadius: '24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px',
        background: 'linear-gradient(135deg, rgba(6,182,212,0.08), rgba(16,185,129,0.04))',
        border: '1px solid rgba(6,182,212,0.2)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.08)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '56px', height: '56px', borderRadius: '18px',
            background: 'linear-gradient(135deg, #06B6D4, #0891B2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', boxShadow: '0 6px 20px rgba(6,182,212,0.4)'
          }}>
            {Icon.safe}
          </div>
          <div>
            <h1 style={{ fontWeight: 900, fontSize: '22px', color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px' }}>
              {isAr ? 'إدارة الخزائن النقدية والسيولة' : 'Treasury & Safe Management'}
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', margin: '4px 0 0' }}>
              {isAr ? 'مراقبة السيولة النقدية، الإيداعات، الصرف، والتحويلات المالية اللحظية بين الخزائن' : 'Monitor cash liquidity, deposits, withdrawals, and inter-safe transfers'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Transfer Between Safes */}
          <button onClick={() => {
            setTransferForm({ fromSafeId: 'SAFE-001', toSafeId: 'SAFE-002', amount: '', note: '' });
            setShowTransferModal(true);
          }} style={{
            padding: '11px 18px', borderRadius: '14px', border: '1px solid rgba(99,102,241,0.3)',
            background: 'rgba(99,102,241,0.1)', color: '#6366F1', fontWeight: 800, cursor: 'pointer',
            fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            {Icon.transfer} {isAr ? 'تحويل بين الخزائن' : 'Inter-Safe Transfer'}
          </button>

          {/* Deposit */}
          <button onClick={() => openActionModal('deposit')} style={{
            padding: '11px 18px', borderRadius: '14px', border: 'none',
            background: 'linear-gradient(135deg, #10B981, #059669)', color: '#fff',
            fontWeight: 800, cursor: 'pointer', fontSize: '13px', boxShadow: '0 4px 16px rgba(16,185,129,0.35)',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            {Icon.plus} {isAr ? 'إيداع مالي' : 'Deposit Cash'}
          </button>

          {/* Withdraw */}
          <button onClick={() => openActionModal('withdrawal')} style={{
            padding: '11px 18px', borderRadius: '14px', border: 'none',
            background: 'linear-gradient(135deg, #EF4444, #DC2626)', color: '#fff',
            fontWeight: 800, cursor: 'pointer', fontSize: '13px', boxShadow: '0 4px 16px rgba(239,68,68,0.35)',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            {Icon.minus} {isAr ? 'صرف مالي' : 'Withdraw Cash'}
          </button>

          {/* Add New Safe */}
          <button onClick={() => setShowAddModal(true)} style={{
            padding: '11px 20px', borderRadius: '14px', border: 'none',
            background: 'linear-gradient(135deg, #06B6D4, #0891B2)', color: '#fff',
            fontWeight: 800, cursor: 'pointer', fontSize: '13px', boxShadow: '0 4px 16px rgba(6,182,212,0.35)',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            {Icon.plus} {isAr ? 'إضافة خزينة جديدة' : 'Add New Safe'}
          </button>
        </div>
      </div>

      {/* ══════════════ 2. FINANCIAL STATS CARDS ══════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>

        {/* Total Safes Liquidity */}
        <div className="glass-card" style={{
          padding: '20px 22px', borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(6,182,212,0.12), rgba(6,182,212,0.03))',
          border: '1px solid rgba(6,182,212,0.25)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#06B6D4' }}>{isAr ? 'إجمالي السيولة النقدية الكلية' : 'Total Cash Liquidity'}</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'rgba(6,182,212,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06B6D4' }}>
              {Icon.safe}
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: 'var(--text-primary)' }} dir="ltr">
            <AnimatedCounter value={totalSafesBalance} /> <span style={{ fontSize: '14px', color: '#06B6D4', fontWeight: 800 }}>{isAr ? 'د.ل' : 'LYD'}</span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', margin: '6px 0 0' }}>
            {safes?.length || 0} {isAr ? 'خزائن وحسابات مصارف مغطاة بالكامل' : 'active safes & accounts'}
          </p>
        </div>

        {/* Main Center Safe Balance */}
        <div className="glass-card" style={{
          padding: '20px 22px', borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.03))',
          border: '1px solid rgba(16,185,129,0.25)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#10B981' }}>{isAr ? 'الخزينة الرئيسية (المركز)' : 'Main Center Safe'}</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10B981' }}>
              {Icon.shield}
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: 'var(--text-primary)' }} dir="ltr">
            <AnimatedCounter value={mainSafe.balance || 0} /> <span style={{ fontSize: '14px', color: '#10B981', fontWeight: 800 }}>{isAr ? 'د.ل' : 'LYD'}</span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', margin: '6px 0 0' }}>
            {isAr ? 'خزينة المركز الرئيسي المخصصة لتسوية المتاجر' : 'Main headquarters center safe'}
          </p>
        </div>

        {/* Driver Custody Field Safe Balance */}
        <div className="glass-card" style={{
          padding: '20px 22px', borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(251,191,36,0.03))',
          border: '1px solid rgba(251,191,36,0.25)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#FBBF24' }}>{isAr ? 'خزينة عُهد السائقين الميدانية' : 'Driver Custody Safe'}</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'rgba(251,191,36,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FBBF24' }}>
              {Icon.truck}
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: 'var(--text-primary)' }} dir="ltr">
            <AnimatedCounter value={driversSafe.balance || 0} /> <span style={{ fontSize: '14px', color: '#FBBF24', fontWeight: 800 }}>{isAr ? 'د.ل' : 'LYD'}</span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', margin: '6px 0 0' }}>
            {(driversSafe.balance || 0) === 0
              ? (isAr ? 'كافة عُهد السائقين مصفّرة ومسوّاة 100%' : 'All driver custody accounts fully settled')
              : (isAr ? 'مبالغ نقدية ميدانية بحوزة السائقين قبل التسوية' : 'Unsettled cash custody held by drivers')}
          </p>
        </div>

        {/* Total Safe Transactions Log Count */}
        <div className="glass-card" style={{
          padding: '20px 22px', borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(99,102,241,0.03))',
          border: '1px solid rgba(99,102,241,0.25)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#6366F1' }}>{isAr ? 'إجمالي الحركات المحاسبية' : 'Total Treasury Entries'}</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366F1' }}>
              {Icon.trending}
            </div>
          </div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: 'var(--text-primary)' }} dir="ltr">
            <AnimatedCounter value={safeTransactions?.length || 0} /> <span style={{ fontSize: '14px', color: '#6366F1', fontWeight: 800 }}>{isAr ? 'حركة' : 'txs'}</span>
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', margin: '6px 0 0' }}>
            {isAr ? 'إيداعات، صرف، وتحويلات موثقة بالسجل' : 'All safe transactions logged'}
          </p>
        </div>

      </div>

      {/* ══════════════ 3. SAFES GRID CARDS ══════════════ */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h2 style={{ fontWeight: 900, fontSize: '16px', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            {Icon.safe} {isAr ? 'الخزائن المالية وحسابات المصارف' : 'Active Safes & Accounts'}
          </h2>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-tertiary)' }}>
            {safes?.length || 0} {isAr ? 'خزينة مسجلة' : 'safes registered'}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
          {(safes || []).map(safe => {
            const isDrivers = safe.id === 'SAFE-005';
            const isMain = safe.id === 'SAFE-001';

            return (
              <div key={safe.id} className="glass-card" style={{
                borderRadius: '24px', border: `1px solid ${isMain ? 'rgba(16,185,129,0.35)' : 'var(--card-border)'}`,
                padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px',
                background: isMain
                  ? 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(0,0,0,0.02))'
                  : 'var(--glass-bg)',
                boxShadow: isMain ? '0 8px 24px rgba(16,185,129,0.12)' : 'none',
                position: 'relative'
              }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '46px', height: '46px', borderRadius: '16px',
                      background: isMain ? 'linear-gradient(135deg, #10B981, #059669)' : (isDrivers ? 'linear-gradient(135deg, #FBBF24, #D97706)' : 'linear-gradient(135deg, #06B6D4, #0891B2)'),
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
                    }}>
                      {isDrivers ? Icon.truck : (isMain ? Icon.shield : Icon.safe)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 900, fontSize: '16px', color: 'var(--text-primary)' }}>{safe.name}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '2px' }}>{safe.code} • {safe.branch}</div>
                    </div>
                  </div>

                  <span style={{
                    padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 800,
                    background: 'rgba(16,185,129,0.12)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)'
                  }}>
                    {isAr ? 'نشطة 🟢' : 'Active 🟢'}
                  </span>
                </div>

                {/* Balance Big */}
                <div style={{
                  background: 'rgba(0,0,0,0.15)', borderRadius: '16px', padding: '16px 20px',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  border: '1px solid rgba(255,255,255,0.05)'
                }}>
                  <div>
                    <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '2px' }}>{isAr ? 'السيولة المتاحة' : 'Available Balance'}</div>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: Number(safe.balance || 0) > 0 ? '#10B981' : 'var(--text-secondary)' }} dir="ltr">
                      {fmt(safe.balance)}
                    </div>
                  </div>

                  <button onClick={() => setViewSafeDetailId(safe.id)} style={{
                    padding: '8px 14px', borderRadius: '10px', border: '1px solid var(--card-border)',
                    background: 'rgba(128,128,128,0.1)', color: 'var(--text-primary)', fontWeight: 800,
                    fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                  }}>
                    {isAr ? 'كشف تفصيلي' : 'Ledger'} {isAr ? Icon.arrowLeft : Icon.arrowRight}
                  </button>
                </div>

                {/* Sub Notes */}
                {safe.notes && (
                  <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', margin: 0, lineHeight: 1.4 }}>
                    {safe.notes}
                  </p>
                )}

                {/* Actions Bar */}
                <div style={{ display: 'flex', gap: '8px', paddingTop: '4px', borderTop: '1px solid var(--card-border)' }}>
                  <button onClick={() => openActionModal('deposit', safe.id)} style={{
                    flex: 1, padding: '8px', borderRadius: '10px', border: 'none',
                    background: 'rgba(16,185,129,0.12)', color: '#10B981', fontWeight: 800, fontSize: '11px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                  }}>
                    {Icon.plus} {isAr ? 'إيداع' : 'Deposit'}
                  </button>
                  <button onClick={() => openActionModal('withdrawal', safe.id)} style={{
                    flex: 1, padding: '8px', borderRadius: '10px', border: 'none',
                    background: 'rgba(239,68,68,0.12)', color: '#EF4444', fontWeight: 800, fontSize: '11px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                  }}>
                    {Icon.minus} {isAr ? 'صرف' : 'Withdraw'}
                  </button>
                  <button onClick={() => {
                    setTransferForm({ fromSafeId: safe.id, toSafeId: 'SAFE-001', amount: '', note: '' });
                    setShowTransferModal(true);
                  }} style={{
                    flex: 1, padding: '8px', borderRadius: '10px', border: 'none',
                    background: 'rgba(99,102,241,0.12)', color: '#6366F1', fontWeight: 800, fontSize: '11px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px'
                  }}>
                    {Icon.transfer} {isAr ? 'تحويل' : 'Transfer'}
                  </button>
                  <button onClick={() => openEditModal(safe)} style={{
                    padding: '8px', borderRadius: '10px', border: 'none',
                    background: 'rgba(128,128,128,0.12)', color: 'var(--text-tertiary)', fontWeight: 800, fontSize: '11px', cursor: 'pointer'
                  }}>
                    {Icon.edit}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ══════════════ 4. RECENT TRANSACTIONS LOG ══════════════ */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '20px', border: '1px solid var(--card-border)' }}>
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <h3 style={{ fontWeight: 900, fontSize: '15px', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            {Icon.trending} {isAr ? 'سجل المعاملات المالية لجميع الخزائن' : 'All Safe Transactions Log'}
          </h3>

          <div style={{ display: 'flex', gap: '8px' }}>
            {['ALL', ...safes.map(s => s.id)].map(id => (
              <button key={id} onClick={() => setSelectedSafeId(id)} style={{
                padding: '5px 12px', borderRadius: '8px', border: '1px solid var(--card-border)',
                fontSize: '11px', fontWeight: 800, cursor: 'pointer',
                background: selectedSafeId === id ? 'rgba(6,182,212,0.15)' : 'transparent',
                color: selectedSafeId === id ? '#06B6D4' : 'var(--text-secondary)'
              }}>
                {id === 'ALL' ? (isAr ? 'جميع الخزائن' : 'All Safes') : (safes.find(s => s.id === id)?.name || id)}
              </button>
            ))}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>{isAr ? 'الخزينة' : 'Safe'}</th>
                <th>{isAr ? 'نوع الحركة' : 'Type'}</th>
                <th>{isAr ? 'البيان / الوصف' : 'Description'}</th>
                <th>{isAr ? 'المرجع' : 'Reference'}</th>
                <th>{isAr ? 'التاريخ' : 'Date'}</th>
                <th>{isAr ? 'المبلغ' : 'Amount'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(tx => {
                const sName = safes.find(s => s.id === tx.safeId)?.name || tx.safeName || tx.safeId;
                return (
                  <tr key={tx.id}>
                    <td style={{ fontWeight: 800 }}>{sName}</td>
                    <td><TxBadge type={tx.type} isAr={isAr} /></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>{tx.description}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-tertiary)' }} dir="ltr">{tx.ref}</td>
                    <td style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                      {tx.date ? new Date(tx.date).toLocaleDateString('ar-LY') : ''}
                    </td>
                    <td style={{ fontWeight: 900, color: (tx.type === 'deposit' || tx.type === 'transfer_in') ? '#10B981' : '#EF4444' }} dir="ltr">
                      {(tx.type === 'deposit' || tx.type === 'transfer_in') ? '+' : '-'}{Math.abs(Number(tx.amount || 0)).toLocaleString()} {isAr ? 'د.ل' : 'LYD'}
                    </td>
                  </tr>
                );
              })}
              {filteredTransactions.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-tertiary)' }}>
                    {isAr ? 'لا توجد حركات نقدية مسجلة.' : 'No safe transactions logged.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ══════════════ MODALS ══════════════ */}

      {/* ADD SAFE MODAL */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content glass-panel" style={{ padding: '32px', maxWidth: '460px', borderRadius: '24px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: 900, fontSize: '18px', color: 'var(--text-primary)', marginBottom: '18px' }}>
              {isAr ? 'إنشاء خزينة / حساب جديد' : 'Create New Safe / Account'}
            </h3>
            <form onSubmit={handleAddSafeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  {isAr ? 'اسم الخزينة' : 'Safe Name'}
                </label>
                <input required type="text" className="glass-input" placeholder={isAr ? 'مثال: خزينة فرع مصراتة' : 'e.g. Misrata Branch Safe'}
                  value={newSafeForm.name} onChange={e => setNewSafeForm(p => ({ ...p, name: e.target.value }))} style={{ borderRadius: '12px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  {isAr ? 'الكود المرجعي' : 'Code'}
                </label>
                <input type="text" className="glass-input" placeholder="SAFE-MISRATA"
                  value={newSafeForm.code} onChange={e => setNewSafeForm(p => ({ ...p, code: e.target.value }))} style={{ borderRadius: '12px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  {isAr ? 'الفرع / النطاق' : 'Branch'}
                </label>
                <input type="text" className="glass-input" placeholder={isAr ? 'مصراتة' : 'Misrata'}
                  value={newSafeForm.branch} onChange={e => setNewSafeForm(p => ({ ...p, branch: e.target.value }))} style={{ borderRadius: '12px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  {isAr ? 'الرصيد الافتتاحي (د.ل)' : 'Initial Balance (LYD)'}
                </label>
                <input type="number" min="0" className="glass-input" placeholder="0.00"
                  value={newSafeForm.initialBalance} onChange={e => setNewSafeForm(p => ({ ...p, initialBalance: e.target.value }))} style={{ borderRadius: '12px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  {isAr ? 'ملاحظات' : 'Notes'}
                </label>
                <input type="text" className="glass-input" placeholder="..."
                  value={newSafeForm.notes} onChange={e => setNewSafeForm(p => ({ ...p, notes: e.target.value }))} style={{ borderRadius: '12px' }} />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '11px 22px', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 700 }}>
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" style={{ padding: '11px 24px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#06B6D4,#0891B2)', color: '#fff', fontWeight: 800 }}>
                  {isAr ? 'إنشاء الخزينة' : 'Create Safe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT SAFE MODAL */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content glass-panel" style={{ padding: '32px', maxWidth: '460px', borderRadius: '24px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: 900, fontSize: '18px', color: 'var(--text-primary)', marginBottom: '18px' }}>
              {isAr ? 'تعديل بيانات الخزينة' : 'Edit Safe Data'}
            </h3>
            <form onSubmit={handleEditSafeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  {isAr ? 'اسم الخزينة' : 'Safe Name'}
                </label>
                <input required type="text" className="glass-input" value={editSafeForm.name} onChange={e => setEditSafeForm(p => ({ ...p, name: e.target.value }))} style={{ borderRadius: '12px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  {isAr ? 'الكود' : 'Code'}
                </label>
                <input type="text" className="glass-input" value={editSafeForm.code} onChange={e => setEditSafeForm(p => ({ ...p, code: e.target.value }))} style={{ borderRadius: '12px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  {isAr ? 'الفرع' : 'Branch'}
                </label>
                <input type="text" className="glass-input" value={editSafeForm.branch} onChange={e => setEditSafeForm(p => ({ ...p, branch: e.target.value }))} style={{ borderRadius: '12px' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  {isAr ? 'ملاحظات' : 'Notes'}
                </label>
                <input type="text" className="glass-input" value={editSafeForm.notes} onChange={e => setEditSafeForm(p => ({ ...p, notes: e.target.value }))} style={{ borderRadius: '12px' }} />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button type="button" onClick={() => setShowEditModal(false)} style={{ padding: '11px 22px', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 700 }}>
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" style={{ padding: '11px 24px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#10B981,#059669)', color: '#fff', fontWeight: 800 }}>
                  {isAr ? 'حفظ التعديلات' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INTER-SAFE TRANSFER MODAL */}
      {showTransferModal && (
        <div className="modal-overlay" onClick={() => setShowTransferModal(false)}>
          <div className="modal-content glass-panel" style={{ padding: '32px', maxWidth: '480px', borderRadius: '24px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366F1' }}>
                {Icon.transfer}
              </div>
              <div>
                <h3 style={{ fontWeight: 900, fontSize: '18px', color: 'var(--text-primary)', margin: 0 }}>
                  {isAr ? 'التحويل المالي بين الخزائن' : 'Inter-Safe Cash Transfer'}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: '2px 0 0' }}>
                  {isAr ? 'نقل سيولة نقدية من خزينة إلى أخرى مع التوثيق المحاسبي' : 'Transfer cash between treasuries'}
                </p>
              </div>
            </div>

            <form onSubmit={handleTransferSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  {isAr ? 'من الخزينة (الخزينة المحول منها)' : 'From Safe'}
                </label>
                <select required className="glass-input w-full" value={transferForm.fromSafeId} onChange={e => setTransferForm(p => ({ ...p, fromSafeId: e.target.value }))} style={{ borderRadius: '12px' }}>
                  <option value="">{isAr ? '-- اختر الخزينة --' : '-- Select --'}</option>
                  {(safes || []).map(s => <option key={s.id} value={s.id}>{s.name} ({s.branch}) - رصيد: {s.balance} د.ل</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  {isAr ? 'إلى الخزينة (الخزينة المستلمة)' : 'To Safe'}
                </label>
                <select required className="glass-input w-full" value={transferForm.toSafeId} onChange={e => setTransferForm(p => ({ ...p, toSafeId: e.target.value }))} style={{ borderRadius: '12px' }}>
                  <option value="">{isAr ? '-- اختر الخزينة --' : '-- Select --'}</option>
                  {(safes || []).filter(s => s.id !== transferForm.fromSafeId).map(s => <option key={s.id} value={s.id}>{s.name} ({s.branch}) - رصيد: {s.balance} د.ل</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  {isAr ? 'المبلغ المراد تحويله (د.ل)' : 'Transfer Amount (LYD)'}
                </label>
                <input required type="number" min="1" className="glass-input" placeholder="0.00"
                  value={transferForm.amount} onChange={e => setTransferForm(p => ({ ...p, amount: e.target.value }))} style={{ borderRadius: '12px' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  {isAr ? 'سبب أو ملاحظة التحويل' : 'Transfer Note'}
                </label>
                <input type="text" className="glass-input" placeholder={isAr ? 'مثال: تغذية سيولة فرع بنغازي' : 'Transfer note'}
                  value={transferForm.note} onChange={e => setTransferForm(p => ({ ...p, note: e.target.value }))} style={{ borderRadius: '12px' }} />
              </div>

              {transferError && (
                <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: '12px', fontWeight: 700 }}>
                  {transferError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button type="button" onClick={() => setShowTransferModal(false)} style={{ padding: '11px 22px', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 700 }}>
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" style={{ padding: '11px 26px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg,#6366F1,#4F46E5)', color: '#fff', fontWeight: 800, boxShadow: '0 4px 16px rgba(99,102,241,0.4)' }}>
                  {isAr ? 'تأكيد التحويل المالي' : 'Confirm Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ACTION MODAL (DEPOSIT / WITHDRAWAL) */}
      {showActionModal && (
        <div className="modal-overlay" onClick={() => setShowActionModal(null)}>
          <div className="modal-content glass-panel" style={{ padding: '32px', maxWidth: '460px', borderRadius: '24px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '16px',
                background: showActionModal === 'deposit' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: showActionModal === 'deposit' ? '#10B981' : '#EF4444'
              }}>
                {showActionModal === 'deposit' ? Icon.plus : Icon.minus}
              </div>
              <div>
                <h3 style={{ fontWeight: 900, fontSize: '18px', color: 'var(--text-primary)', margin: 0 }}>
                  {showActionModal === 'deposit' ? (isAr ? 'إيداع مالي يدوي في الخزينة' : 'Manual Safe Deposit') : (isAr ? 'صرف مالي يدوي من الخزينة' : 'Manual Safe Withdrawal')}
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: '2px 0 0' }}>
                  {showActionModal === 'deposit' ? (isAr ? 'إضافة سيولة نقدية وتوثيق الحركة' : 'Add cash to safe') : (isAr ? 'سحب/صرف سيولة نقدية من الخزينة' : 'Withdraw cash from safe')}
                </p>
              </div>
            </div>

            <form onSubmit={handleActionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  {isAr ? 'الخزينة المستهدفة' : 'Target Safe'}
                </label>
                <select required className="glass-input w-full" value={actionForm.safeId} onChange={e => setActionForm(p => ({ ...p, safeId: e.target.value }))} style={{ borderRadius: '12px' }}>
                  {(safes || []).map(s => <option key={s.id} value={s.id}>{s.name} ({s.branch}) - رصيد: {s.balance} د.ل</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  {isAr ? 'المبلغ (د.ل)' : 'Amount (LYD)'}
                </label>
                <input required type="number" min="1" className="glass-input" placeholder="0.00"
                  value={actionForm.amount} onChange={e => setActionForm(p => ({ ...p, amount: e.target.value }))} style={{ borderRadius: '12px' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  {isAr ? 'البيان / السبب' : 'Description / Note'}
                </label>
                <input type="text" className="glass-input" placeholder={showActionModal === 'deposit' ? (isAr ? 'مثال: إيداع رأس مال رأس سنة' : 'Deposit note') : (isAr ? 'مثال: شراء أدوات مكتبية' : 'Withdrawal note')}
                  value={actionForm.description} onChange={e => setActionForm(p => ({ ...p, description: e.target.value }))} style={{ borderRadius: '12px' }} />
              </div>

              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                  {isAr ? 'رقم المرجع (اختياري)' : 'Reference (Optional)'}
                </label>
                <input type="text" className="glass-input" placeholder="DEP-1001"
                  value={actionForm.ref} onChange={e => setActionForm(p => ({ ...p, ref: e.target.value }))} style={{ borderRadius: '12px' }} />
              </div>

              {actionError && (
                <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#EF4444', fontSize: '12px', fontWeight: 700 }}>
                  {actionError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button type="button" onClick={() => setShowActionModal(null)} style={{ padding: '11px 22px', borderRadius: '12px', border: '1px solid var(--card-border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 700 }}>
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" style={{
                  padding: '11px 26px', borderRadius: '12px', border: 'none',
                  background: showActionModal === 'deposit' ? 'linear-gradient(135deg,#10B981,#059669)' : 'linear-gradient(135deg,#EF4444,#DC2626)',
                  color: '#fff', fontWeight: 800, boxShadow: `0 4px 16px rgba(${showActionModal === 'deposit' ? '16,185,129' : '239,68,68'},0.4)`
                }}>
                  {showActionModal === 'deposit' ? (isAr ? 'تأكيد الإيداع' : 'Confirm Deposit') : (isAr ? 'تأكيد الصرف' : 'Confirm Withdrawal')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

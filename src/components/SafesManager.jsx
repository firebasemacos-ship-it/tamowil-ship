'use client';
import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';

export default function SafesManager() {
  const { lang, safes, safeTransactions, addSafe, updateSafe, deleteSafe, recordSafeTransaction, transferBetweenSafes } = useApp();
  const isAr = lang === 'ar';
  const fmt = v => `${Number(v || 0).toLocaleString('ar-LY')} ${isAr ? 'د.ل' : 'LYD'}`;

  const [selectedSafeId, setSelectedSafeId]   = useState('ALL');
  const [viewSafeDetailId, setViewSafeDetailId] = useState(null); // ID of safe opened in full page mode
  const [showAddModal, setShowAddModal]       = useState(false);
  const [showEditModal, setShowEditModal]     = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(null); // 'deposit' | 'withdrawal' | null

  const [newSafeForm, setNewSafeForm] = useState({
    name: '',
    code: '',
    branch: '',
    initialBalance: '',
    notes: ''
  });

  const [editSafeForm, setEditSafeForm] = useState({
    id: '',
    name: '',
    code: '',
    branch: '',
    initialBalance: '',
    notes: ''
  });

  const [transferForm, setTransferForm] = useState({
    fromSafeId: '',
    toSafeId: '',
    amount: '',
    note: ''
  });

  const [actionForm, setActionForm] = useState({
    safeId: '',
    amount: '',
    description: '',
    ref: ''
  });

  // Filter state inside safe detail view
  const [detailSearch, setDetailSearch] = useState('');
  const [detailTypeFilter, setDetailTypeFilter] = useState('ALL');

  const activeDetailSafe = useMemo(() => {
    if (!viewSafeDetailId) return null;
    return (safes || []).find(s => s.id === viewSafeDetailId) || null;
  }, [safes, viewSafeDetailId]);

  const totalSafesBalance = useMemo(() => {
    return (safes || []).reduce((s, safe) => s + Number(safe.balance || 0), 0);
  }, [safes]);

  const filteredTransactions = useMemo(() => {
    if (selectedSafeId === 'ALL') return safeTransactions || [];
    return (safeTransactions || []).filter(tx => tx.safeId === selectedSafeId);
  }, [safeTransactions, selectedSafeId]);

  // Transactions for the active detail view safe
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

  // Financial summary for active detail safe
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

  function handleTransferSubmit(e) {
    e.preventDefault();
    if (!transferForm.fromSafeId || !transferForm.toSafeId || !transferForm.amount) return;
    transferBetweenSafes(transferForm.fromSafeId, transferForm.toSafeId, transferForm.amount, transferForm.note);
    setTransferForm({ fromSafeId: '', toSafeId: '', amount: '', note: '' });
    setShowTransferModal(false);
  }

  function handleActionSubmit(e) {
    e.preventDefault();
    if (!actionForm.safeId || !actionForm.amount || !showActionModal) return;
    recordSafeTransaction({
      safeId: actionForm.safeId,
      type: showActionModal,
      amount: actionForm.amount,
      description: actionForm.description || (showActionModal === 'deposit' ? (isAr ? 'إيداع مالي يدوي' : 'Manual Deposit') : (isAr ? 'صرف مالي يدوي' : 'Manual Withdrawal')),
      ref: actionForm.ref || (showActionModal === 'deposit' ? 'DEP-MANUAL' : 'WTH-MANUAL')
    });
    setActionForm({ safeId: '', amount: '', description: '', ref: '' });
    setShowActionModal(null);
  }

  function openActionModal(type, safeId = '') {
    setShowActionModal(type);
    setActionForm(p => ({ ...p, safeId: safeId || (safes?.[0]?.id || '') }));
  }

  // ════════════════════════════════════════════════════════════════════════
  // ── DETAILED SAFE VIEW PAGE ──────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════
  if (viewSafeDetailId && activeDetailSafe) {
    return (
      <>
        <div className="hide-on-print" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Screen Header Bar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button 
                onClick={() => setViewSafeDetailId(null)}
                style={{ padding: '8px 16px', borderRadius: '10px', border: '1px solid var(--glass-border)', background: 'rgba(128,128,128,0.1)', color: 'var(--text-primary)', fontWeight: 700, fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <span>{isAr ? '→' : '←'}</span> {isAr ? 'العودة لكافة الخزائن' : 'Back to All Safes'}
              </button>
              <div>
                <h1 className="title-large" style={{ margin: 0, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/></svg> {activeDetailSafe.name}
                </h1>
                <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{activeDetailSafe.code} • {activeDetailSafe.branch}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button className="glass-button" style={{ background: 'var(--primary-color)', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => openEditModal(activeDetailSafe)}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> {isAr ? 'تعديل بيانات الخزينة' : 'Edit Safe'}
              </button>
              <button className="glass-button" style={{ background: '#10B981', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => openActionModal('deposit', activeDetailSafe.id)}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> {isAr ? 'إيداع مالي' : 'Deposit'}
              </button>
              <button className="glass-button" style={{ background: '#EF4444', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => openActionModal('withdrawal', activeDetailSafe.id)}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/></svg> {isAr ? 'صرف مالي' : 'Withdraw'}
              </button>
              <button className="glass-button" style={{ background: '#6366F1', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => window.print()}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg> {isAr ? 'طباعة الكشف' : 'Print Statement'}
              </button>
            </div>
          </div>

          {/* KPI Financial Cards for this Safe */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div className="glass-card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600 }}>{isAr ? 'الرصيد الافتتاحي' : 'Initial Balance'}</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-secondary)', marginTop: '4px' }} dir="ltr">{fmt(activeSafeSummary.initial)}</div>
            </div>
            <div className="glass-card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600 }}>{isAr ? 'إجمالي المقبوضات والإيداعات (+)' : 'Total Deposits (+)'}</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#10B981', marginTop: '4px' }} dir="ltr">+{fmt(activeSafeSummary.deposits)}</div>
            </div>
            <div className="glass-card" style={{ padding: '16px' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600 }}>{isAr ? 'إجمالي المدفوعات والمصروفات (-)' : 'Total Withdrawals (-)'}</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#EF4444', marginTop: '4px' }} dir="ltr">-{fmt(activeSafeSummary.withdrawals)}</div>
            </div>
            <div className="glass-card" style={{ padding: '16px', background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(5,150,105,0.05))', border: '1px solid rgba(16,185,129,0.3)' }}>
              <div style={{ fontSize: '11px', color: '#10B981', fontWeight: 700 }}>{isAr ? 'الرصيد الصافي الحالي (السيولة)' : 'Current Net Balance'}</div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#10B981', marginTop: '4px' }} dir="ltr">{fmt(activeSafeSummary.current)}</div>
            </div>
          </div>

          {/* Transactions Table & Filters */}
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)' }}>{isAr ? 'سجل حركات ومعاملات الخزينة' : 'Safe Transactions Ledger'}</span>
                <span style={{ padding: '2px 8px', borderRadius: '6px', background: 'rgba(99,102,241,0.12)', color: '#6366F1', fontSize: '11px', fontWeight: 700 }}>{activeSafeTransactions.length} {isAr ? 'حركة' : 'txs'}</span>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <input 
                  type="text" className="glass-input" style={{ padding: '6px 12px', fontSize: '12px', minWidth: '200px' }}
                  placeholder={isAr ? 'بحث بالبيان أو المرجع...' : 'Search description...'}
                  value={detailSearch} onChange={e => setDetailSearch(e.target.value)}
                />
                <select className="glass-input" style={{ padding: '6px 12px', fontSize: '12px' }} value={detailTypeFilter} onChange={e => setDetailTypeFilter(e.target.value)}>
                  <option value="ALL">{isAr ? 'جميع أنواع الحركات' : 'All Types'}</option>
                  <option value="deposit">{isAr ? '➕ إيداع مالي' : 'Deposit'}</option>
                  <option value="withdrawal">{isAr ? '➖ صرف مالي' : 'Withdrawal'}</option>
                  <option value="transfer_in">{isAr ? '📥 تحويل وارد' : 'Transfer In'}</option>
                  <option value="transfer_out">{isAr ? '📤 تحويل صادر' : 'Transfer Out'}</option>
                </select>
              </div>
            </div>

            <table className="custom-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{isAr ? 'التاريخ والوقت' : 'Date & Time'}</th>
                  <th>{isAr ? 'نوع الحركة' : 'Type'}</th>
                  <th>{isAr ? 'المبلغ (د.ل)' : 'Amount'}</th>
                  <th>{isAr ? 'البيان / تفاصيل العملية' : 'Description'}</th>
                  <th>{isAr ? 'المرجع' : 'Reference'}</th>
                </tr>
              </thead>
              <tbody>
                {activeSafeTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-tertiary)' }}>
                      {isAr ? 'لا توجد حركات تسوية أو معاملة مسجلة لهذه الخزينة.' : 'No transactions recorded for this safe.'}
                    </td>
                  </tr>
                ) : (
                  activeSafeTransactions.map((tx, idx) => {
                    const isDeposit = tx.type === 'deposit' || tx.type === 'transfer_in';
                    return (
                      <tr key={tx.id}>
                        <td style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{idx + 1}</td>
                        <td style={{ fontSize: '11px', color: 'var(--text-tertiary)' }} dir="ltr">
                          {new Date(tx.date).toLocaleString('ar-LY')}
                        </td>
                        <td>
                          <span style={{
                            padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 700,
                            background: isDeposit ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                            color: isDeposit ? '#10B981' : '#EF4444'
                          }}>
                            {tx.type === 'deposit' ? (isAr ? '➕ إيداع مالي' : 'Deposit') :
                             tx.type === 'withdrawal' ? (isAr ? '➖ صرف مالي' : 'Withdrawal') :
                             tx.type === 'transfer_in' ? (isAr ? '📥 تحويل وارد' : 'Transfer In') :
                             (isAr ? '📤 تحويل صادر' : 'Transfer Out')}
                          </span>
                        </td>
                        <td style={{ fontWeight: 800, color: isDeposit ? '#10B981' : '#EF4444' }} dir="ltr">
                          {isDeposit ? '+' : '-'}{fmt(tx.amount)}
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{tx.description}</td>
                        <td style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600 }}>{tx.ref}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Official Printable A4 Statement ── */}
        {renderPrintableArea(activeDetailSafe, activeSafeTransactions)}

        {renderActionModals()}
      </>
    );
  }

  // ════════════════════════════════════════════════════════════════════════
  // ── MAIN SAFES LIST PAGE ────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════
  return (
    <>
      <div className="hide-on-print" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        {/* ── Header ────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h1 className="title-large">{isAr ? 'إدارة الخزائن المالية والسيولة' : 'Treasury & Safes Management'}</h1>
            <p className="subtitle">{isAr ? 'متابعة أرصدة الخزائن النقدیة، الإيداع والصرف المباشر، والتحويل بين السيولة.' : 'Manage safes, cash flow, deposits, withdrawals, and inter-safe transfers.'}</p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button className="glass-button" style={{ background: '#10B981', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => openActionModal('deposit')}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> {isAr ? 'إيداع مالي' : 'Deposit'}
            </button>
            <button className="glass-button" style={{ background: '#EF4444', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => openActionModal('withdrawal')}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/></svg> {isAr ? 'صرف مالي' : 'Withdraw'}
            </button>
            <button className="glass-button" style={{ background: '#6366F1', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setShowTransferModal(true)}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg> {isAr ? 'تحويل بين الخزائن' : 'Transfer Between Safes'}
            </button>
            <button className="glass-button" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => setShowAddModal(true)}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> {isAr ? 'إضافة خزينة جديدة' : 'Add New Safe'}
            </button>
          </div>
        </div>

        {/* ── KPI Cards ────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#10B981,#059669)', color: '#fff' }}>
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/></svg>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)' }}>{isAr ? 'إجمالي السيولة بالأرصدة' : 'Total Safes Cash'}</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }} dir="ltr">{fmt(totalSafesBalance)}</div>
            </div>
          </div>

          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#3B82F6,#1D4ED8)', color: '#fff' }}>
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)' }}>{isAr ? 'عدد الخزائن الفعالة' : 'Active Safes'}</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{(safes || []).length} {isAr ? 'خزائن' : 'Safes'}</div>
            </div>
          </div>

          <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#818CF8,#4F46E5)', color: '#fff' }}>
              <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)' }}>{isAr ? 'إجمالي المعاملات والتحويلات' : 'Treasury Movements'}</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{(safeTransactions || []).length} {isAr ? 'معاملة' : 'Txs'}</div>
            </div>
          </div>
        </div>

        {/* ── Safes Grid Cards ──────────────────────────────────── */}
        <div>
          <h3 style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/></svg> {isAr ? 'قائمة الخزائن الحالية (اضغط لعرض السجل التفصيلي)' : 'Current Safes List (Click to view full statement)'}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {(safes || []).map(safe => (
              <div 
                key={safe.id} 
                className="glass-card" 
                style={{ display: 'flex', flexDirection: 'column', gap: '12px', border: '1px solid var(--card-border)', cursor: 'pointer', transition: 'all 0.2s ease' }} 
                onClick={() => setViewSafeDetailId(safe.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-primary)', margin: 0 }}>{safe.name}</h4>
                    <span style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600 }}>{safe.code} — {safe.branch}</span>
                  </div>
                  <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, background: 'rgba(16,185,129,0.12)', color: '#10B981' }}>
                    {isAr ? 'نشطة' : 'Active'}
                  </span>
                </div>

                <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(128,128,128,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>{isAr ? 'الرصيد المتوفر:' : 'Balance:'}</span>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-green)' }} dir="ltr">{fmt(safe.balance)}</span>
                </div>

                {safe.notes && (
                  <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                    {safe.notes}
                  </div>
                )}

                {/* Safe Action Buttons */}
                <div style={{ marginTop: 'auto', paddingTop: '8px', display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                  <button 
                    onClick={() => openEditModal(safe)}
                    style={{ padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(255,255,255,0.06)', color: 'var(--text-primary)', fontSize: '11px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title={isAr ? 'تعديل بيانات الخزينة' : 'Edit Safe'}
                  >
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button 
                    onClick={() => openActionModal('deposit', safe.id)}
                    style={{ flex: 1, padding: '6px 8px', borderRadius: '8px', border: 'none', background: 'rgba(16,185,129,0.15)', color: '#10B981', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    ➕ {isAr ? 'إيداع' : 'Deposit'}
                  </button>
                  <button 
                    onClick={() => openActionModal('withdrawal', safe.id)}
                    style={{ flex: 1, padding: '6px 8px', borderRadius: '8px', border: 'none', background: 'rgba(239,68,68,0.15)', color: '#EF4444', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    ➖ {isAr ? 'صرف' : 'Withdraw'}
                  </button>
                  <button 
                    onClick={() => setViewSafeDetailId(safe.id)}
                    style={{ flex: 1.2, padding: '6px 8px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'var(--primary-color)', color: '#fff', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    📄 {isAr ? 'فتح الكشف' : 'View Ledger'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── All Safes Overview Ledger ───────────────────────────── */}
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>📑</span>
              <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)' }}>
                {isAr ? 'كشف حركات ومعاملات كافة الخزائن' : 'All Safes Transaction Ledger'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <select className="glass-input" style={{ padding: '5px 10px', fontSize: '11px' }} value={selectedSafeId} onChange={e => setSelectedSafeId(e.target.value)}>
                <option value="ALL">{isAr ? 'جميع الخزائن' : 'All Safes'}</option>
                {(safes || []).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <button className="glass-button" style={{ padding: '5px 12px', fontSize: '11px', background: '#6366F1' }} onClick={() => window.print()}>
                {isAr ? 'طباعة الكشف' : 'Print Ledger'}
              </button>
            </div>
          </div>

          <table className="custom-table">
            <thead>
              <tr>
                <th>{isAr ? 'التاريخ والوقت' : 'Date & Time'}</th>
                <th>{isAr ? 'الخزينة' : 'Safe Name'}</th>
                <th>{isAr ? 'نوع الحركة' : 'Movement Type'}</th>
                <th>{isAr ? 'المبلغ (د.ل)' : 'Amount'}</th>
                <th>{isAr ? 'البيان / الوصف' : 'Description'}</th>
                <th>{isAr ? 'المرجع' : 'Reference'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '24px', color: 'var(--text-tertiary)' }}>
                    {isAr ? 'لا توجد حركات تسوية أو تحويلات مسجلة حتى الآن.' : 'No safe transactions logged yet.'}
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(tx => {
                  const isDeposit = tx.type === 'deposit' || tx.type === 'transfer_in';
                  return (
                    <tr key={tx.id}>
                      <td style={{ fontSize: '11px', color: 'var(--text-tertiary)' }} dir="ltr">
                        {new Date(tx.date).toLocaleString('ar-LY')}
                      </td>
                      <td style={{ fontWeight: 700 }}>{tx.safeName}</td>
                      <td>
                        <span style={{
                          padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 700,
                          background: isDeposit ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                          color: isDeposit ? '#10B981' : '#EF4444'
                        }}>
                          {tx.type === 'deposit' ? (isAr ? '➕ إيداع مالي' : 'Deposit') :
                           tx.type === 'withdrawal' ? (isAr ? '➖ صرف مالي' : 'Withdrawal') :
                           tx.type === 'transfer_in' ? (isAr ? '📥 تحويل وارد' : 'Transfer In') :
                           (isAr ? '📤 تحويل صادر' : 'Transfer Out')}
                        </span>
                      </td>
                      <td style={{ fontWeight: 800, color: isDeposit ? '#10B981' : '#EF4444' }} dir="ltr">
                        {isDeposit ? '+' : '-'}{fmt(tx.amount)}
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{tx.description}</td>
                      <td style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600 }}>{tx.ref}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Official Printable A4 Statement ── */}
      {renderPrintableArea(null, filteredTransactions)}

      {renderActionModals()}
    </>
  );

  // Helper render for Printable A4 Statement
  function renderPrintableArea(safeObj, txList) {
    return (
      <div className="printable-area hide-on-screen" dir="rtl">
        <div className="print-header">
          <div className="print-logo-container">
            <img src="/logo-color.png" alt="VANEX LOGISTICS" style={{ height: '60px', objectFit: 'contain' }} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '4px 0', color: '#0D7847' }}>
            شركة فانيكس للتوصيل والشحن - VANEX LOGISTICS
          </h2>
          <p className="print-subtitle" style={{ fontSize: '14px', marginTop: '4px' }}>
            {safeObj ? `كشف حساب حركة الخزينة المالية: (${safeObj.name})` : 'كشف حساب حركات الخزائن المالية'}
          </p>
        </div>

        <div className="print-meta-info">
          <div>
            {safeObj ? (
              <>كود الخزينة: <span>{safeObj.code}</span> • الفرع: <span>{safeObj.branch}</span> • الرصيد الحالي: <span>{fmt(safeObj.balance)}</span></>
            ) : (
              <>إجمالي السيولة بالأرصدة: <span>{fmt(totalSafesBalance)}</span> • عدد الخزائن: <span>{(safes || []).length}</span></>
            )}
          </div>
          <div>تاريخ التقرير: {new Date().toLocaleDateString('ar-LY')} {new Date().toLocaleTimeString('ar-LY')}</div>
        </div>

        <table className="print-table">
          <thead>
            <tr>
              <th>#</th>
              <th>التاريخ والوقت</th>
              <th>الخزينة</th>
              <th>نوع الحركة</th>
              <th>المبلغ (د.ل)</th>
              <th>البيان / الوصف</th>
              <th>المرجع</th>
            </tr>
          </thead>
          <tbody>
            {(txList || []).map((tx, idx) => {
              const isDeposit = tx.type === 'deposit' || tx.type === 'transfer_in';
              return (
                <tr key={tx.id || idx}>
                  <td>{idx + 1}</td>
                  <td dir="ltr">{new Date(tx.date).toLocaleString('ar-LY')}</td>
                  <td>{tx.safeName}</td>
                  <td>
                    {tx.type === 'deposit' ? 'إيداع مالي' :
                     tx.type === 'withdrawal' ? 'صرف مالي' :
                     tx.type === 'transfer_in' ? 'تحويل وارد' : 'تحويل صادر'}
                  </td>
                  <td dir="ltr" style={{ fontWeight: 'bold', color: isDeposit ? '#10B981' : '#EF4444' }}>
                    {isDeposit ? '+' : '-'}{fmt(tx.amount)}
                  </td>
                  <td>{tx.description}</td>
                  <td>{tx.ref}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="print-footer-signatures">
          <div className="print-signature-box">
            <p style={{ fontWeight: 'bold' }}>إعداد المحاسب المسؤول:</p>
            <div className="print-signature-line">التوقيع: .....................</div>
          </div>
          <div className="print-signature-box">
            <p style={{ fontWeight: 'bold' }}>اعتماد المدير المالي:</p>
            <div className="print-signature-line">التوقيع: .....................</div>
          </div>
          <div className="print-signature-box">
            <p style={{ fontWeight: 'bold' }}>ختم الإدارة المالية:</p>
            <div className="print-signature-line">الختم الرسمي</div>
          </div>
        </div>
      </div>
    );
  }

  // Helper render for Deposit / Withdraw / Transfer / Add modals
  function renderActionModals() {
    return (
      <>
        {/* ── Modal: Edit Safe ───────────────────────────────────── */}
        {showEditModal && (
          <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
            <div className="modal-content glass-panel" style={{ padding: '28px', maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-primary)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> {isAr ? 'تعديل بيانات الخزينة والرصيد' : 'Edit Safe & Initial Balance'}
              </h3>
              <form onSubmit={handleEditSafeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    {isAr ? 'اسم الخزينة' : 'Safe Name'}
                  </label>
                  <input required className="glass-input w-full" value={editSafeForm.name} onChange={e => setEditSafeForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                      {isAr ? 'كود الخزينة' : 'Code'}
                    </label>
                    <input className="glass-input w-full" value={editSafeForm.code} onChange={e => setEditSafeForm(p => ({ ...p, code: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                      {isAr ? 'الفرع' : 'Branch'}
                    </label>
                    <input className="glass-input w-full" value={editSafeForm.branch} onChange={e => setEditSafeForm(p => ({ ...p, branch: e.target.value }))} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    {isAr ? 'الرصيد الافتتاحي (د.ل)' : 'Initial Balance (LYD)'}
                  </label>
                  <input type="number" min="0" className="glass-input w-full" value={editSafeForm.initialBalance} onChange={e => setEditSafeForm(p => ({ ...p, initialBalance: e.target.value }))} />
                  <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{isAr ? 'سيتم تحديث الرصيد الافتتاحي المخزن في قاعدة البيانات.' : 'Will update initial balance in DB.'}</span>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    {isAr ? 'ملاحظات / وصف' : 'Notes'}
                  </label>
                  <textarea rows={2} className="glass-input w-full" value={editSafeForm.notes} onChange={e => setEditSafeForm(p => ({ ...p, notes: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button type="button" className="glass-button w-full" onClick={() => setShowEditModal(false)}>
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button type="submit" className="glass-button w-full" style={{ background: 'var(--primary-color)', color: '#fff' }}>
                    {isAr ? 'حفظ التغييرات' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Modal: Manual Deposit / Withdrawal ──────────────────── */}
        {showActionModal && (
          <div className="modal-overlay" onClick={() => setShowActionModal(null)}>
            <div className="modal-content glass-panel" style={{ padding: '28px', maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-primary)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: showActionModal === 'deposit' ? '#10B981' : '#EF4444' }}>
                  {showActionModal === 'deposit' ? (
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  ) : (
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  )}
                </span> 
                {showActionModal === 'deposit' ? (isAr ? 'إيداع مالي في الخزينة' : 'Deposit into Safe') : (isAr ? 'صرف مالي من الخزينة' : 'Withdraw from Safe')}
              </h3>
              <form onSubmit={handleActionSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    {isAr ? 'اختر الخزينة' : 'Select Safe'}
                  </label>
                  <select required className="glass-input w-full" value={actionForm.safeId} onChange={e => setActionForm(p => ({ ...p, safeId: e.target.value }))}>
                    <option value="">{isAr ? '-- اختر الخزينة --' : '-- Select Safe --'}</option>
                    {(safes || []).map(s => <option key={s.id} value={s.id}>{s.name} ({isAr ? 'رصيد:' : 'Bal:'} {s.balance} د.ل)</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    {isAr ? 'المبلغ (د.ل)' : 'Amount (LYD)'}
                  </label>
                  <input required type="number" min="1" className="glass-input w-full" placeholder="0.00"
                    value={actionForm.amount} onChange={e => setActionForm(p => ({ ...p, amount: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    {isAr ? 'البيان / سبب العملية' : 'Description / Note'}
                  </label>
                  <input required type="text" className="glass-input w-full" 
                    placeholder={showActionModal === 'deposit' ? (isAr ? 'مثال: إيداع عهدة نقود مفاجئة' : 'e.g. Cash deposit') : (isAr ? 'مثال: مصاريف نثريات مكتب' : 'e.g. Office petty cash')}
                    value={actionForm.description} onChange={e => setActionForm(p => ({ ...p, description: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    {isAr ? 'المرجع / رقم المستند (اختياري)' : 'Reference (optional)'}
                  </label>
                  <input type="text" className="glass-input w-full" placeholder="REC-1002"
                    value={actionForm.ref} onChange={e => setActionForm(p => ({ ...p, ref: e.target.value }))} />
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button type="button" onClick={() => setShowActionModal(null)} style={{ padding: '8px 18px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button type="submit" style={{ padding: '8px 24px', borderRadius: '8px', border: 'none', background: showActionModal === 'deposit' ? '#10B981' : '#EF4444', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                    {showActionModal === 'deposit' ? (isAr ? 'تأكيد الإيداع' : 'Confirm Deposit') : (isAr ? 'تأكيد الصرف' : 'Confirm Withdrawal')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Modal: Add Safe ────────────────────────────────────── */}
        {showAddModal && (
          <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
            <div className="modal-content glass-panel" style={{ padding: '28px', maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-primary)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3"/></svg> {isAr ? 'إضافة خزينة جديدة' : 'Add New Safe'}
              </h3>
              <form onSubmit={handleAddSafeSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    {isAr ? 'اسم الخزينة' : 'Safe Name'}
                  </label>
                  <input required type="text" className="glass-input w-full" placeholder={isAr ? 'مثال: خزينة فرع الزاوية' : 'e.g. Zawiya Safe'}
                    value={newSafeForm.name} onChange={e => setNewSafeForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    {isAr ? 'رمز / كود الخزينة (اختياري)' : 'Safe Code'}
                  </label>
                  <input type="text" className="glass-input w-full" placeholder="SAFE-ZAW"
                    value={newSafeForm.code} onChange={e => setNewSafeForm(p => ({ ...p, code: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    {isAr ? 'الفرع / المدينة' : 'Branch / City'}
                  </label>
                  <input type="text" className="glass-input w-full" placeholder={isAr ? 'الفرع الرئيسي / طرابلس / ...' : 'Main Branch'}
                    value={newSafeForm.branch} onChange={e => setNewSafeForm(p => ({ ...p, branch: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    {isAr ? 'الرصيد الافتتاحي (د.ل)' : 'Initial Balance (LYD)'}
                  </label>
                  <input type="number" min="0" className="glass-input w-full" placeholder="0.00"
                    value={newSafeForm.initialBalance} onChange={e => setNewSafeForm(p => ({ ...p, initialBalance: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    {isAr ? 'ملاحظات' : 'Notes'}
                  </label>
                  <input type="text" className="glass-input w-full" placeholder={isAr ? 'ملاحظات حول الاستخدام' : 'Usage notes'}
                    value={newSafeForm.notes} onChange={e => setNewSafeForm(p => ({ ...p, notes: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '8px 18px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button type="submit" style={{ padding: '8px 22px', borderRadius: '8px', border: 'none', background: 'var(--primary-color)', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                    {isAr ? 'حفظ الخزينة' : 'Save Safe'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Modal: Inter-Safe Transfer ──────────────────────────── */}
        {showTransferModal && (
          <div className="modal-overlay" onClick={() => setShowTransferModal(false)}>
            <div className="modal-content glass-panel" style={{ padding: '28px', maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-primary)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>🔄</span> {isAr ? 'تحويل مالي بين الخزائن' : 'Transfer Between Safes'}
              </h3>
              <form onSubmit={handleTransferSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    {isAr ? 'من الخزينة (خصم صادر)' : 'From Safe (Source)'}
                  </label>
                  <select required className="glass-input w-full" value={transferForm.fromSafeId} onChange={e => setTransferForm(p => ({ ...p, fromSafeId: e.target.value }))}>
                    <option value="">{isAr ? '-- اختر الخزينة المصدر --' : '-- Select Source --'}</option>
                    {(safes || []).map(s => <option key={s.id} value={s.id}>{s.name} ({isAr ? 'رصيد:' : 'Bal:'} {s.balance} د.ل)</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    {isAr ? 'إلى الخزينة (إيداع وارد)' : 'To Safe (Destination)'}
                  </label>
                  <select required className="glass-input w-full" value={transferForm.toSafeId} onChange={e => setTransferForm(p => ({ ...p, toSafeId: e.target.value }))}>
                    <option value="">{isAr ? '-- اختر الخزينة الهدف --' : '-- Select Destination --'}</option>
                    {(safes || []).filter(s => s.id !== transferForm.fromSafeId).map(s => <option key={s.id} value={s.id}>{s.name} ({isAr ? 'رصيد:' : 'Bal:'} {s.balance} د.ل)</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    {isAr ? 'المبلغ المحول (د.ل)' : 'Transfer Amount (LYD)'}
                  </label>
                  <input required type="number" min="1" className="glass-input w-full" placeholder="0.00"
                    value={transferForm.amount} onChange={e => setTransferForm(p => ({ ...p, amount: e.target.value }))} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>
                    {isAr ? 'ملاحظة التحويل' : 'Transfer Note'}
                  </label>
                  <input type="text" className="glass-input w-full" placeholder={isAr ? 'مثال: تغذية خزينة الفرع نقدياً' : 'e.g. Cash replenishment'}
                    value={transferForm.note} onChange={e => setTransferForm(p => ({ ...p, note: e.target.value }))} />
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                  <button type="button" onClick={() => setShowTransferModal(false)} style={{ padding: '8px 18px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-secondary)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button type="submit" style={{ padding: '8px 22px', borderRadius: '8px', border: 'none', background: '#6366F1', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>
                    {isAr ? 'تأكيد التحويل' : 'Confirm Transfer'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    );
  }
}

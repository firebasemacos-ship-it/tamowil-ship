'use client';
import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';

export default function SafesManager() {
  const { lang, safes, safeTransactions, addSafe, transferBetweenSafes } = useApp();
  const isAr = lang === 'ar';
  const fmt = v => `${Number(v || 0).toLocaleString('ar-LY')} ${isAr ? 'د.ل' : 'LYD'}`;

  const [selectedSafeId, setSelectedSafeId] = useState('ALL');
  const [showAddModal, setShowAddModal]   = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);

  const [newSafeForm, setNewSafeForm] = useState({
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

  const totalSafesBalance = useMemo(() => {
    return (safes || []).reduce((s, safe) => s + Number(safe.balance || 0), 0);
  }, [safes]);

  const filteredTransactions = useMemo(() => {
    if (selectedSafeId === 'ALL') return safeTransactions || [];
    return (safeTransactions || []).filter(tx => tx.safeId === selectedSafeId);
  }, [safeTransactions, selectedSafeId]);

  function handleAddSafeSubmit(e) {
    e.preventDefault();
    if (!newSafeForm.name) return;
    addSafe(newSafeForm);
    setNewSafeForm({ name: '', code: '', branch: '', initialBalance: '', notes: '' });
    setShowAddModal(false);
  }

  function handleTransferSubmit(e) {
    e.preventDefault();
    if (!transferForm.fromSafeId || !transferForm.toSafeId || !transferForm.amount) return;
    transferBetweenSafes(transferForm.fromSafeId, transferForm.toSafeId, transferForm.amount, transferForm.note);
    setTransferForm({ fromSafeId: '', toSafeId: '', amount: '', note: '' });
    setShowTransferModal(false);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* ── Header ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 className="title-large">{isAr ? 'إدارة الخزائن المالية والسيولة' : 'Treasury & Safes Management'}</h1>
          <p className="subtitle">{isAr ? 'متابعة أرصدة الخزائن النقدیة، إنشاء خزائن الفروع، والتحويل بين الخزائن والسيولة.' : 'Manage safes, cash flow, branch vaults, and inter-safe transfers.'}</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="glass-button" style={{ background: '#6366F1' }} onClick={() => setShowTransferModal(true)}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 014-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 01-4 4H3"/></svg>
            {isAr ? 'تحويل بين الخزائن' : 'Transfer Between Safes'}
          </button>
          <button className="glass-button" onClick={() => setShowAddModal(true)}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
            {isAr ? 'إضافة خزينة جديدة' : 'Add New Safe'}
          </button>
        </div>
      </div>

      {/* ── KPI Cards ────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#10B981,#059669)', color: '#fff', fontSize: '22px' }}>🏦</div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)' }}>{isAr ? 'إجمالي السيولة بالأرصدة' : 'Total Safes Cash'}</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }} dir="ltr">{fmt(totalSafesBalance)}</div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#3B82F6,#1D4ED8)', color: '#fff', fontSize: '22px' }}>🔐</div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)' }}>{isAr ? 'عدد الخزائن الفعالة' : 'Active Safes'}</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{(safes || []).length} {isAr ? 'خزائن' : 'Safes'}</div>
          </div>
        </div>

        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg,#818CF8,#4F46E5)', color: '#fff', fontSize: '22px' }}>📜</div>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)' }}>{isAr ? 'إجمالي المعاملات والتحويلات' : 'Treasury Movements'}</div>
            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{(safeTransactions || []).length} {isAr ? 'معاملة' : 'Txs'}</div>
          </div>
        </div>
      </div>

      {/* ── Safes Grid Cards ──────────────────────────────────── */}
      <div>
        <h3 style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-primary)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🏦</span> {isAr ? 'قائمة الخزائن الحالية' : 'Current Safes List'}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
          {(safes || []).map(safe => (
            <div key={safe.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', border: selectedSafeId === safe.id ? '2px solid var(--primary-color)' : '1px solid var(--card-border)', cursor: 'pointer' }} onClick={() => setSelectedSafeId(selectedSafeId === safe.id ? 'ALL' : safe.id)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)', margin: 0 }}>{safe.name}</h4>
                  <span style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 600 }}>{safe.code} — {safe.branch}</span>
                </div>
                <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 700, background: 'rgba(16,185,129,0.12)', color: '#10B981' }}>
                  {isAr ? 'نشطة' : 'Active'}
                </span>
              </div>

              <div style={{ padding: '12px', borderRadius: '10px', background: 'rgba(128,128,128,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>{isAr ? 'الرصيد المتوفر:' : 'Balance:'}</span>
                <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent-green)' }} dir="ltr">{fmt(safe.balance)}</span>
              </div>

              {safe.notes && (
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                  💬 {safe.notes}
                </div>
              )}

              <button 
                onClick={(e) => { e.stopPropagation(); setSelectedSafeId(safe.id); }} 
                style={{ marginTop: 'auto', padding: '6px 12px', borderRadius: '8px', border: '1px solid var(--glass-border)', background: selectedSafeId === safe.id ? 'var(--primary-color)' : 'transparent', color: selectedSafeId === safe.id ? '#fff' : 'var(--text-secondary)', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
              >
                {selectedSafeId === safe.id ? (isAr ? '✓ مفلتر بالحركات' : '✓ Filtered') : (isAr ? 'عرض كشف حركاتها' : 'View Ledger')}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Safe Transactions Ledger ───────────────────────────── */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>📑</span>
            <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)' }}>
              {isAr ? 'كشف حركات ومعاملات الخزائن' : 'Safes Transaction Ledger'}
            </span>
            {selectedSafeId !== 'ALL' && (
              <span style={{ padding: '3px 8px', borderRadius: '6px', background: 'rgba(99,102,241,0.12)', color: '#6366F1', fontSize: '11px', fontWeight: 700 }}>
                {safes.find(s => s.id === selectedSafeId)?.name}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {selectedSafeId !== 'ALL' && (
              <button className="glass-button" style={{ padding: '5px 12px', fontSize: '11px' }} onClick={() => setSelectedSafeId('ALL')}>
                {isAr ? 'عرض الكل' : 'Show All'}
              </button>
            )}
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
                        {tx.type === 'deposit' ? (isAr ? '➕ إيداع / تسوية' : 'Deposit') :
                         tx.type === 'withdrawal' ? (isAr ? '➖ سحب / صرف' : 'Withdrawal') :
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

      {/* ── Modal: Add Safe ────────────────────────────────────── */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content glass-panel" style={{ padding: '28px', maxWidth: '440px' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontWeight: 800, fontSize: '16px', color: 'var(--text-primary)', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🏦</span> {isAr ? 'إضافة خزينة فرعية أو رئيسية جديدة' : 'Add New Safe'}
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
    </div>
  );
}

'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';

export default function SystemLogView() {
  const {
    lang,
    safeTransactions,
    shipmentsList: shipments,
    driverSettlements,
    payoutRequests,
    transactionLog,
    safes,
    merchants,
    drivers
  } = useApp();

  const isAr = lang === 'ar';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [copied, setCopied] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  // Synthesize all system activities into unified detailed audit log stream
  const systemLogs = useMemo(() => {
    const logs = [];

    // 1. Safe Transactions
    (safeTransactions || []).forEach(tx => {
      const s = safes?.find(sf => sf.id === tx.safeId);
      logs.push({
        id: `SAFE-LOG-${tx.id || Math.random()}`,
        timestamp: tx.date ? new Date(tx.date) : new Date(),
        category: 'SAFE',
        level: tx.type === 'withdrawal' || tx.type === 'transfer_out' ? 'WARN' : 'FINANCIAL',
        titleAr: `حركة خزينة: ${tx.type === 'deposit' ? 'إيداع' : tx.type === 'withdrawal' ? 'صرف/سحب' : tx.type === 'transfer_in' ? 'تحويل وارد' : 'تحويل صادر'} (${Number(tx.amount || 0).toFixed(2)} د.ل)`,
        titleEn: `Safe Tx: ${tx.type} (${Number(tx.amount || 0).toFixed(2)} LYD)`,
        actor: 'النظام المحاسبي / Admin',
        reference: tx.ref || tx.safeId,
        details: {
          safeId: tx.safeId,
          safeName: s?.name || tx.safeId,
          safeBranch: s?.branch || 'المركز',
          transactionType: tx.type,
          amount: Number(tx.amount || 0),
          description: tx.description,
          referenceId: tx.ref,
          safeCurrentBalance: s?.balance
        }
      });
    });

    // 2. Shipment History & Events
    (shipments || []).forEach(s => {
      (s.history || []).forEach(h => {
        logs.push({
          id: `SHIP-LOG-${h.id || Math.random()}`,
          timestamp: h.timestamp ? new Date(h.timestamp) : new Date(),
          category: 'SHIPMENT',
          level: h.status === 'تم التسليم' ? 'SUCCESS' : h.status === 'ملغاة' || h.status === 'راجع' ? 'WARN' : 'INFO',
          titleAr: `تحديث شحنة #${s.trackingNumber}: حالة [${h.status}]`,
          titleEn: `Shipment #${s.trackingNumber}: Status [${h.status}]`,
          actor: h.location || 'نظام التتبع',
          reference: s.trackingNumber,
          details: {
            trackingNumber: s.trackingNumber,
            merchantId: s.merchantId,
            merchantName: s.merchantName,
            status: h.status,
            receiverCity: s.receiverCity,
            receiverName: s.receiverName,
            price: s.price,
            deliveryFee: s.deliveryFee,
            codFee: s.codFee,
            chargeOn: s.deliveryChargeOn,
            driverId: s.assignedDriver,
            historyDetails: h.detailsAr || h.detailsEn
          }
        });
      });
    });

    // 3. Driver Settlements
    (driverSettlements || []).forEach(st => {
      const d = drivers?.find(drv => drv.id === st.driverId);
      logs.push({
        id: `DRV-LOG-${st.id}`,
        timestamp: st.date ? new Date(st.date) : new Date(),
        category: 'SETTLEMENT',
        level: 'FINANCIAL',
        titleAr: `تسوية عُهدة سائق #${st.id}: استلام ${Number(st.amount || 0).toFixed(2)} د.ل من (${st.driverName || d?.name || st.driverId})`,
        titleEn: `Driver Settlement #${st.id}: Received ${Number(st.amount || 0).toFixed(2)} LYD from (${st.driverName || st.driverId})`,
        actor: `المحاسب (تسوية سائق: ${st.driverName || st.driverId})`,
        reference: st.id,
        details: {
          settlementId: st.id,
          driverId: st.driverId,
          driverName: st.driverName || d?.name,
          amountSettled: Number(st.amount || 0),
          note: st.note,
          status: st.status
        }
      });
    });

    // 4. Payout Requests
    (payoutRequests || []).forEach(p => {
      const m = merchants?.find(mc => mc.id === p.merchantId);
      logs.push({
        id: `PAY-LOG-${p.id}`,
        timestamp: p.requestedAt ? new Date(p.requestedAt) : new Date(),
        category: 'PAYOUT',
        level: p.status === 'Approved' ? 'SUCCESS' : p.status === 'Rejected' ? 'WARN' : 'INFO',
        titleAr: `طلب سحب أرباح تاجر #${p.id}: ${Number(p.amount || 0).toFixed(2)} د.ل - حالة [${p.status}]`,
        titleEn: `Merchant Payout #${p.id}: ${Number(p.amount || 0).toFixed(2)} LYD - Status [${p.status}]`,
        actor: m?.storeName || m?.name || p.merchantId,
        reference: p.id,
        details: {
          payoutId: p.id,
          merchantId: p.merchantId,
          merchantStore: p.merchantStore || m?.storeName,
          amount: Number(p.amount || 0),
          status: p.status,
          bankDetails: p.bankAccount || p.bankDetails
        }
      });
    });

    // Sort descending by timestamp
    return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [safeTransactions, shipments, driverSettlements, payoutRequests, safes, merchants, drivers]);

  // Filter logs by search query and category
  const filteredLogs = useMemo(() => {
    return systemLogs.filter(log => {
      if (selectedCategory !== 'ALL' && log.category !== selectedCategory) return false;

      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        log.id.toLowerCase().includes(q) ||
        log.reference.toLowerCase().includes(q) ||
        log.titleAr.toLowerCase().includes(q) ||
        log.titleEn.toLowerCase().includes(q) ||
        log.actor.toLowerCase().includes(q) ||
        JSON.stringify(log.details).toLowerCase().includes(q)
      );
    });
  }, [systemLogs, selectedCategory, searchQuery]);

  // Generate full markdown formatted diagnostic output for AI
  const formatFullLogForAI = () => {
    const timestampStr = new Date().toLocaleString('ar-LY');
    let output = `==================================================\n`;
    output += `📟 SYSTEM AUDIT DIAGNOSTIC LOG (تم الإنشاء: ${timestampStr})\n`;
    output += `==================================================\n\n`;

    output += `📊 SYSTEM SUMMARY:\n`;
    output += `- Total Log Entries: ${systemLogs.length}\n`;
    output += `- Safes Liquidity Summary:\n`;
    (safes || []).forEach(s => {
      output += `  • [${s.id}] ${s.name} (${s.branch || 'المركز'}): ${Number(s.balance || 0).toFixed(2)} LYD\n`;
    });
    output += `\n==================================================\n`;
    output += `📜 DETAILED AUDIT EVENT CHRONOLOGY:\n`;
    output += `==================================================\n\n`;

    filteredLogs.forEach((log, index) => {
      output += `[LOG #${index + 1}] [${log.level}] [${log.category}] [${log.timestamp.toISOString()}]\n`;
      output += `Title: ${log.titleAr}\n`;
      output += `Actor/Module: ${log.actor}\n`;
      output += `Reference ID: ${log.reference}\n`;
      output += `RAW DETAILS JSON:\n${JSON.stringify(log.details, null, 2)}\n`;
      output += `--------------------------------------------------\n`;
    });

    return output;
  };

  const handleCopyLogs = () => {
    const aiText = formatFullLogForAI();
    navigator.clipboard.writeText(aiText);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleDownloadLogs = () => {
    const aiText = formatFullLogForAI();
    const blob = new Blob([aiText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `system_audit_logs_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── 1. HEADER & ACTION BUTTONS ── */}
      <div className="glass-card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '54px', height: '54px', borderRadius: '18px', background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(16,185,129,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366F1', flexShrink: 0 }}>
            <svg width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M4 17l6-6-6-6M12 19h8"/>
            </svg>
          </div>
          <div>
            <h1 style={{ fontWeight: 900, fontSize: '20px', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              {isAr ? 'سجل حركات وتدقيق النظام اللحظي (Log System)' : 'System Audit & Activity Logs'}
              <span style={{ fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '20px', background: 'rgba(99,102,241,0.15)', color: '#6366F1' }}>
                {systemLogs.length} {isAr ? 'حركة مسجلة' : 'Events'}
              </span>
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', margin: '4px 0 0' }}>
              {isAr ? 'تسجيل وتشخيص شامل لكافة الحركات المالية والتنفيذية بجميع التفاصيل البرمجية.' : 'Exhaustive real-time diagnostic audit trail for financial and operational events.'}
            </p>
          </div>
        </div>

        {/* Copy for AI Button */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleCopyLogs}
            style={{
              padding: '12px 22px', borderRadius: '14px', border: 'none',
              background: copied ? 'linear-gradient(135deg, #10B981, #059669)' : 'linear-gradient(135deg, #6366F1, #4F46E5)',
              color: '#fff', fontWeight: 800, fontSize: '13px', cursor: 'pointer',
              boxShadow: copied ? '0 4px 16px rgba(16,185,129,0.4)' : '0 4px 16px rgba(99,102,241,0.4)',
              display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
            }}
          >
            {copied ? (
              <>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                {isAr ? 'تم نسخ السجل الكامل للحافظة! 📋' : 'Copied for AI! 📋'}
              </>
            ) : (
              <>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
                </svg>
                {isAr ? '📋 نسخ السجل بالكامل للـ AI (عند حدوث مشكلة)' : '📋 Copy All Logs for AI'}
              </>
            )}
          </button>

          <button
            onClick={handleDownloadLogs}
            style={{
              padding: '12px 18px', borderRadius: '14px', border: '1px solid var(--glass-border)',
              background: 'rgba(128,128,128,0.08)', color: 'var(--text-primary)', fontWeight: 700, fontSize: '13px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px'
            }}
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
            </svg>
            {isAr ? 'تنزيل TXT' : 'Download TXT'}
          </button>
        </div>
      </div>

      {/* ── 2. FILTERS & LIVE SEARCH ── */}
      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Search */}
        <div style={{ flex: 1, minWidth: '260px' }}>
          <input
            type="text"
            className="glass-input w-full"
            placeholder={isAr ? '🔍 ابحث برقم الشحنة، المرجع، اسم السائق، المأخذ أو البيان...' : '🔍 Search tracking #, ref, driver, description...'}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', ar: 'الكل', en: 'All Logs' },
            { id: 'SAFE', ar: '💰 الخزائن والأموال', en: 'Safe Txs' },
            { id: 'SETTLEMENT', ar: '🔄 تسويات المندوبين', en: 'Driver Settlements' },
            { id: 'PAYOUT', ar: '💸 مسحوبات التجار', en: 'Merchant Payouts' },
            { id: 'SHIPMENT', ar: '📦 الشحنات والحالات', en: 'Shipment Events' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '8px 14px', borderRadius: '10px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', border: 'none',
                background: selectedCategory === cat.id ? 'var(--primary-color)' : 'rgba(128,128,128,0.08)',
                color: selectedCategory === cat.id ? '#fff' : 'var(--text-secondary)', transition: 'all 0.2s'
              }}
            >
              {isAr ? cat.ar : cat.en}
            </button>
          ))}
        </div>
      </div>

      {/* ── 3. LOG STREAM TERMINAL ── */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden', background: '#090D16', border: '1px solid rgba(255,255,255,0.08)' }}>
        {/* Terminal Bar */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: '#0D1322', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#EF4444', display: 'inline-block' }}></span>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#F59E0B', display: 'inline-block' }}></span>
            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#10B981', display: 'inline-block' }}></span>
            <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#94A3B8', marginRight: '10px' }}>vanex_audit_stream.log</span>
          </div>
          <span style={{ fontSize: '11px', color: '#64748B', fontFamily: 'monospace' }}>
            {filteredLogs.length} / {systemLogs.length} {isAr ? 'سطر معروض' : 'lines'}
          </span>
        </div>

        {/* Log Entries Stream */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {filteredLogs.map((log, index) => {
            const isExpanded = expandedId === log.id;
            const levelColor =
              log.level === 'SUCCESS' ? '#10B981' :
              log.level === 'FINANCIAL' ? '#3B82F6' :
              log.level === 'WARN' ? '#F59E0B' :
              log.level === 'ERROR' ? '#EF4444' : '#94A3B8';

            return (
              <div
                key={log.id}
                style={{
                  padding: '14px 20px',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  background: isExpanded ? 'rgba(255,255,255,0.03)' : 'transparent',
                  fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
                  fontSize: '12px',
                  transition: 'background 0.15s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                    <span style={{ color: '#475569', fontSize: '11px', width: '35px', textAlign: 'right' }}>#{filteredLogs.length - index}</span>

                    {/* Level Pill */}
                    <span style={{
                      padding: '2px 8px', borderRadius: '6px', fontSize: '10px', fontWeight: 800,
                      background: `${levelColor}20`, color: levelColor, border: `1px solid ${levelColor}40`
                    }}>
                      {log.level}
                    </span>

                    {/* Timestamp */}
                    <span style={{ color: '#94A3B8', fontSize: '11px', whiteSpace: 'nowrap' }} dir="ltr">
                      {log.timestamp.toLocaleDateString('en-GB')} {log.timestamp.toLocaleTimeString()}
                    </span>

                    {/* Log Title */}
                    <span style={{ fontWeight: 700, color: '#E2E8F0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {isAr ? log.titleAr : log.titleEn}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '11px', color: '#64748B' }}>{log.actor}</span>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : log.id)}
                      style={{
                        padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)',
                        background: 'rgba(255,255,255,0.05)', color: '#6366F1', fontSize: '11px', fontWeight: 700, cursor: 'pointer'
                      }}
                    >
                      {isExpanded ? (isAr ? 'إخفاء الكود ▴' : 'Hide JSON ▴') : (isAr ? 'عرض الكود والخام { } ▾' : 'View Raw JSON { } ▾')}
                    </button>
                  </div>
                </div>

                {/* Expanded Raw JSON View */}
                {isExpanded && (
                  <div style={{ marginTop: '12px', padding: '14px', borderRadius: '10px', background: '#030712', border: '1px solid rgba(99,102,241,0.3)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '11px', color: '#94A3B8' }}>
                      <span>JSON PAYLOAD / RAW CODE DETAILS</span>
                      <span>REF: {log.reference}</span>
                    </div>
                    <pre style={{ margin: 0, color: '#34D399', fontSize: '11px', overflowX: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}

          {filteredLogs.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
              {isAr ? 'لا توجد حركات مسجلة تطابق بحثك حالياً.' : 'No audit log entries matching your search criteria.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

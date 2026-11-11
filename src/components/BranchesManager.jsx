'use client';
import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';

const Svg = ({ children, size = 16, ...p }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" style={{ flexShrink: 0 }} {...p}>{children}</svg>
);

const Icon = {
  building: <Svg size={20}><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/></Svg>,
  buildingSm: <Svg size={16}><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/></Svg>,
  shield: <Svg size={14}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></Svg>,
  external: <Svg size={15}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></Svg>,
  undo: <Svg size={15}><polyline points="9 14 4 9 9 4"/><path d="M20 20v-7a4 4 0 0 0-4-4H4"/></Svg>,
  edit: <Svg size={15}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></Svg>,
  trash: <Svg size={15}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></Svg>,
  pause: <Svg size={15}><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></Svg>,
  play: <Svg size={15}><polygon points="5 3 19 12 5 21 5 3"/></Svg>,
  search: <Svg size={15}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></Svg>,
  pin: <Svg size={13}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></Svg>,
  lock: <Svg size={15}><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></Svg>,
  wallet: <Svg size={15}><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></Svg>,
  box: <Svg size={15}><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></Svg>,
  settlement: <Svg size={15}><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></Svg>,
  users: <Svg size={15}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Svg>,
  store: <Svg size={16}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></Svg>,
  truck: <Svg size={16}><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></Svg>,
  userShield: <Svg size={16}><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/></Svg>,
  check: <Svg size={15}><polyline points="20 6 9 17 4 12"/></Svg>,
  dot: (color) => <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
};

const PERM_OPTIONS = [
  { id: 'overview', ar: 'الإحصائيات العامة', en: 'Overview' },
  { id: 'shipments', ar: 'إدارة الشحنات', en: 'Shipments' },
  { id: 'wallet', ar: 'المحافظ والمدفوعات', en: 'Wallets & Payouts' },
  { id: 'drivers', ar: 'إدارة السائقين والتسويات', en: 'Drivers & Settlements' },
  { id: 'merchants', ar: 'إدارة التجار', en: 'Merchants' },
  { id: 'safes', ar: 'الخزائن المالية للفرع', en: 'Branch Safes' },
  { id: 'reports', ar: 'التقارير المالية', en: 'Financial Reports' },
  { id: 'employees', ar: 'موظفو الفرع', en: 'Branch Staff' },
  { id: 'tickets', ar: 'تذاكر الدعم', en: 'Support Tickets' },
  { id: 'logs', ar: 'سجل حركات الفرع (Log)', en: 'Branch Audit Log' }
];

export default function BranchesManager() {
  const {
    lang,
    branches,
    saveBranch,
    deleteBranch,
    toggleBranchStatus,
    assignEntityToBranch,
    activeBranchFilter,
    setActiveBranchFilter,
    allShipments,
    allMerchants,
    allDrivers,
    allPayouts,
    allTransactions,
    allSettlements,
    allSafes,
    allSafeTransactions,
    allEmployees,
    addMerchant,
    addDriver,
    saveEmployee,
    settleDriver,
    manualCredit
  } = useApp();

  const isAr = lang === 'ar';
  const fmt = (v) => `${Number(v || 0).toLocaleString('ar-LY')} ${isAr ? 'د.ل' : 'LYD'}`;

  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [inspectorTab, setInspectorTab] = useState('financials'); // 'financials' | 'shipments' | 'settlements' | 'users' | 'admin'
  const [showModal, setShowModal] = useState(false);
  const [showPasswords, setShowPasswords] = useState({});
  const [searchQuery, setSearchQuery] = useState('');

  // Quick Add Modals inside Branch Inspector
  const [showAddBranchMerchant, setShowAddBranchMerchant] = useState(false);
  const [branchMerchantForm, setBranchMerchantForm] = useState({ storeName: '', name: '', phone: '', email: '' });

  const [showAddBranchDriver, setShowAddBranchDriver] = useState(false);
  const [branchDriverForm, setBranchDriverForm] = useState({ name: '', phone: '', zone: '', password: '' });

  const [showAddBranchEmp, setShowAddBranchEmp] = useState(false);
  const [branchEmpForm, setBranchEmpForm] = useState({ name: '', phone: '', password: '' });

  const [assignMerchantId, setAssignMerchantId] = useState('');
  const [assignDriverId, setAssignDriverId] = useState('');

  const [branchForm, setBranchForm] = useState({
    id: '',
    name: '',
    code: '',
    city: 'طرابلس',
    address: '',
    phone: '',
    adminName: '',
    adminPhone: '',
    adminPassword: '',
    active: true,
    permissions: PERM_OPTIONS.map(p => p.id)
  });

  // Compute rich metrics per branch
  const enrichedBranches = useMemo(() => {
    return (branches || []).map(b => {
      const bShipments = (allShipments || []).filter(s => s.branchId === b.id);
      const bDelivered = bShipments.filter(s => s.status === 'Delivered' || s.status === 'تم التسليم');
      const bMerchants = (allMerchants || []).filter(m => m.branchId === b.id);
      const bDrivers = (allDrivers || []).filter(d => d.branchId === b.id);
      const bEmployees = (allEmployees || []).filter(e => e.branchId === b.id);
      const bSafes = (allSafes || []).filter(s => s.branchId === b.id);
      const bSafeIds = new Set(bSafes.map(s => s.id));
      const bSafeTxs = (allSafeTransactions || []).filter(t => bSafeIds.has(t.safeId));
      const bSettlements = (allSettlements || []).filter(s => s.branchId === b.id);
      const bPayouts = (allPayouts || []).filter(p => p.branchId === b.id);
      const bTxLog = (allTransactions || []).filter(t => t.branchId === b.id);

      const mainSafe = bSafes.find(s => s.isMainSafe && !s.isCustodySafe) || bSafes.find(s => !s.isCustodySafe) || { balance: 0, name: `خزينة ${b.name}` };
      const custodySafe = bSafes.find(s => s.isCustodySafe) || { balance: 0, name: `خزينة عُهد ${b.name}` };

      const totalCod = bDelivered.reduce((sum, s) => sum + Number(s.price || 0), 0);
      const netProfit = bDelivered.reduce((sum, s) => sum + Number(s.codFee || 0), 0);
      const merchantsBalance = bMerchants.reduce((sum, m) => sum + Number(m.walletBalance || 0), 0);
      const driversPending = bDrivers.reduce((sum, d) => sum + Number(d.pendingSettlement || 0), 0);

      return {
        ...b,
        shipments: bShipments,
        deliveredShipments: bDelivered,
        merchants: bMerchants,
        drivers: bDrivers,
        employees: bEmployees,
        safes: bSafes,
        safeTransactions: bSafeTxs,
        settlements: bSettlements,
        payouts: bPayouts,
        transactions: bTxLog,
        mainSafe,
        custodySafe,
        totalCod,
        netProfit,
        merchantsBalance,
        driversPending
      };
    });
  }, [branches, allShipments, allMerchants, allDrivers, allEmployees, allSafes, allSafeTransactions, allSettlements, allPayouts, allTransactions]);

  const activeInspectedBranch = useMemo(
    () => enrichedBranches.find(b => b.id === selectedBranchId) || null,
    [enrichedBranches, selectedBranchId]
  );

  // Global KPI totals across all branches
  const globalBranchTotals = useMemo(() => {
    return enrichedBranches.reduce((acc, b) => {
      acc.totalBranches += 1;
      if (b.active !== false) acc.activeBranches += 1;
      acc.totalMainSafe += Number(b.mainSafe?.balance || 0);
      acc.totalCustodySafe += Number(b.custodySafe?.balance || 0);
      acc.totalShipments += b.shipments.length;
      acc.totalNetProfit += b.netProfit;
      acc.totalMerchants += b.merchants.length;
      acc.totalDrivers += b.drivers.length;
      return acc;
    }, {
      totalBranches: 0,
      activeBranches: 0,
      totalMainSafe: 0,
      totalCustodySafe: 0,
      totalShipments: 0,
      totalNetProfit: 0,
      totalMerchants: 0,
      totalDrivers: 0
    });
  }, [enrichedBranches]);

  const openCreateModal = () => {
    setBranchForm({
      id: '',
      name: '',
      code: `BR-${Math.floor(10 + Math.random() * 89)}`,
      city: 'طرابلس',
      address: '',
      phone: '',
      adminName: '',
      adminPhone: '',
      adminPassword: '',
      active: true,
      permissions: PERM_OPTIONS.map(p => p.id)
    });
    setShowModal(true);
  };

  const openEditModal = (branch) => {
    setBranchForm({
      id: branch.id,
      name: branch.name || '',
      code: branch.code || '',
      city: branch.city || 'طرابلس',
      address: branch.address || '',
      phone: branch.phone || '',
      adminName: branch.adminName || '',
      adminPhone: branch.adminPhone || '',
      adminPassword: branch.adminPassword || '',
      active: branch.active !== false,
      permissions: branch.permissions || PERM_OPTIONS.map(p => p.id)
    });
    setShowModal(true);
  };

  const handleSaveBranch = async (e) => {
    e.preventDefault();
    if (!branchForm.name || !branchForm.adminPhone || !branchForm.adminPassword) {
      alert(isAr ? 'يرجى إدخال اسم الفرع وبيانات دخول مدير الفرع (اسم المستخدم/الهاتف وكلمة المرور)' : 'Please fill required fields');
      return;
    }
    await saveBranch(branchForm);
    setShowModal(false);
  };

  const togglePermission = (permId) => {
    setBranchForm(prev => {
      const exists = prev.permissions.includes(permId);
      return {
        ...prev,
        permissions: exists
          ? prev.permissions.filter(p => p !== permId)
          : [...prev.permissions, permId]
      };
    });
  };

  // ══════════════════════════════════════════════════════════════════════════
  // ── DEEP BRANCH INSPECTOR VIEW (استعراض كافة تفاصيل ومعاملات الفرع)
  // ══════════════════════════════════════════════════════════════════════════
  if (activeInspectedBranch) {
    const b = activeInspectedBranch;
    const unassignedMerchants = (allMerchants || []).filter(m => m.branchId !== b.id);
    const unassignedDrivers = (allDrivers || []).filter(d => d.branchId !== b.id);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Top Inspector Bar */}
        <div className="glass-panel" style={{
          padding: '22px 26px', borderRadius: '22px',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(16,185,129,0.06))',
          border: '1px solid rgba(99,102,241,0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSelectedBranchId(null)}
              style={{
                padding: '10px 18px', borderRadius: '12px', border: '1px solid var(--card-border)',
                background: 'rgba(128,128,128,0.12)', color: 'var(--text-primary)', fontWeight: 800,
                fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              ← {isAr ? 'العودة لجميع الفروع' : 'Back to All Branches'}
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontWeight: 900, fontSize: '22px', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {Icon.building} {b.name}
                </h1>
                <span style={{
                  padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 800,
                  background: b.active !== false ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                  color: b.active !== false ? '#10B981' : '#EF4444',
                  display: 'inline-flex', alignItems: 'center', gap: '6px'
                }}>
                  {Icon.dot(b.active !== false ? '#10B981' : '#EF4444')}
                  {b.active !== false ? (isAr ? 'فرع نشط' : 'Active') : (isAr ? 'فرع موقوف' : 'Suspended')}
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                {isAr ? 'المدينة:' : 'City:'} <strong>{b.city}</strong> • {isAr ? 'الكود:' : 'Code:'} <strong>{b.code}</strong> • {isAr ? 'مدير الفرع:' : 'Admin:'} <strong>{b.adminName} ({b.adminPhone})</strong>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                setActiveBranchFilter(b.id);
              }}
              style={{
                padding: '10px 18px', borderRadius: '12px', border: 'none',
                background: activeBranchFilter === b.id
                  ? 'linear-gradient(135deg, #10B981, #059669)'
                  : 'linear-gradient(135deg, #6366F1, #4F46E5)',
                color: '#fff', fontWeight: 800, fontSize: '12px', cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(99,102,241,0.35)',
                display: 'inline-flex', alignItems: 'center', gap: '7px'
              }}
            >
              {activeBranchFilter === b.id ? Icon.check : Icon.external}
              {activeBranchFilter === b.id
                ? (isAr ? 'أنت تتصفح النظام بوضع هذا الفرع حالياً' : 'Currently Active Workspace')
                : (isAr ? 'فتح لوحة التحكم الكاملة بوضع هذا الفرع' : 'Enter Full Branch Workspace')}
            </button>
            {activeBranchFilter !== 'MAIN' && (
              <button
                onClick={() => setActiveBranchFilter('MAIN')}
                style={{
                  padding: '10px 16px', borderRadius: '12px', border: '1px solid rgba(245,158,11,0.4)',
                  background: 'rgba(245,158,11,0.12)', color: '#F59E0B', fontWeight: 800, fontSize: '12px', cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', gap: '6px'
                }}
              >
                {Icon.undo} {isAr ? 'العودة للنظام الرئيسي المستقل (المركز)' : 'Return to Main HQ'}
              </button>
            )}
            <button
              onClick={() => openEditModal(b)}
              style={{
                padding: '10px 16px', borderRadius: '12px', border: '1px solid var(--card-border)',
                background: 'rgba(128,128,128,0.1)', color: 'var(--text-primary)', fontWeight: 800, fontSize: '12px', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: '6px'
              }}
            >
              {Icon.edit} {isAr ? 'تعديل الفرع' : 'Edit Branch'}
            </button>
          </div>
        </div>

        {/* Branch Summary KPI Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(185px, 1fr))', gap: '14px' }}>
          <div className="glass-card" style={{ padding: '18px', borderRadius: '18px', border: '1px solid rgba(16,185,129,0.3)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 800 }}>{isAr ? 'خزينة الفرع الرئيسية' : 'Branch Main Safe'}</div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#10B981', marginTop: '4px' }} dir="ltr">{fmt(b.mainSafe?.balance)}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px' }}>{b.mainSafe?.name}</div>
          </div>

          <div className="glass-card" style={{ padding: '18px', borderRadius: '18px', border: '1px solid rgba(251,191,36,0.3)' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 800 }}>{isAr ? 'خزينة عُهد سائقين الفرع' : 'Branch Custody Safe'}</div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#FBBF24', marginTop: '4px' }} dir="ltr">{fmt(b.custodySafe?.balance)}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px' }}>{isAr ? 'عُهد نقدية مع مناديب الفرع' : 'Field Custody'}</div>
          </div>

          <div className="glass-card" style={{ padding: '18px', borderRadius: '18px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 800 }}>{isAr ? 'إجمالي شحنات الفرع' : 'Branch Shipments'}</div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--text-primary)', marginTop: '4px' }}>{b.shipments.length}</div>
            <div style={{ fontSize: '10px', color: '#10B981', marginTop: '4px', fontWeight: 700 }}>{b.deliveredShipments.length} {isAr ? 'تم تسليمها' : 'delivered'}</div>
          </div>

          <div className="glass-card" style={{ padding: '18px', borderRadius: '18px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 800 }}>{isAr ? 'صافي أرباح الفرع (العمولات)' : 'Branch Net Profit'}</div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#6366F1', marginTop: '4px' }} dir="ltr">{fmt(b.netProfit)}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px' }}>{isAr ? 'إجمالي التحصيل:' : 'Total COD:'} {fmt(b.totalCod)}</div>
          </div>

          <div className="glass-card" style={{ padding: '18px', borderRadius: '18px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 800 }}>{isAr ? 'مستحقات تجار الفرع' : 'Merchants Wallet Debt'}</div>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#06B6D4', marginTop: '4px' }} dir="ltr">{fmt(b.merchantsBalance)}</div>
            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px' }}>{b.merchants.length} {isAr ? 'تاجر مسجل بالفرع' : 'merchants'}</div>
          </div>

          <div className="glass-card" style={{ padding: '18px', borderRadius: '18px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 800 }}>{isAr ? 'مستخدمو الفرع' : 'Branch Users'}</div>
            <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)', marginTop: '6px' }}>
              {b.merchants.length} {isAr ? 'تاجر' : 'M'} • {b.drivers.length} {isAr ? 'سائق' : 'D'} • {b.employees.length} {isAr ? 'موظف' : 'E'}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '4px' }}>{isAr ? 'معزولون بالكامل داخل الفرع' : 'Isolated to branch'}</div>
          </div>
        </div>

        {/* Inspector Sub-Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'financials', icon: Icon.wallet, ar: `الخزائن والمعاملات المالية (${b.safeTransactions.length})`, en: 'Safes & Financials' },
            { id: 'shipments', icon: Icon.box, ar: `شحنات الفرع (${b.shipments.length})`, en: 'Branch Shipments' },
            { id: 'settlements', icon: Icon.settlement, ar: `التسويات والمدفوعات (${b.settlements.length + b.payouts.length})`, en: 'Settlements & Payouts' },
            { id: 'users', icon: Icon.users, ar: `مستخدمو الفرع (${b.merchants.length + b.drivers.length + b.employees.length})`, en: 'Branch Users' },
            { id: 'admin', icon: Icon.lock, ar: 'بيانات دخول أدمن الفرع', en: 'Branch Admin Account' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setInspectorTab(t.id)}
              style={{
                padding: '11px 20px', borderRadius: '14px', border: 'none', cursor: 'pointer',
                fontWeight: 800, fontSize: '13px',
                background: inspectorTab === t.id ? 'linear-gradient(135deg, #6366F1, #4F46E5)' : 'rgba(128,128,128,0.1)',
                color: inspectorTab === t.id ? '#fff' : 'var(--text-secondary)',
                boxShadow: inspectorTab === t.id ? '0 4px 16px rgba(99,102,241,0.3)' : 'none',
                display: 'inline-flex', alignItems: 'center', gap: '8px'
              }}
            >
              {t.icon} {isAr ? t.ar : t.en}
            </button>
          ))}
        </div>

        {/* ── TAB 1: SAFES & FINANCIAL LEDGER ── */}
        {inspectorTab === 'financials' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {b.safes.map(sf => (
                <div key={sf.id} className="glass-card" style={{ padding: '20px', borderRadius: '18px', border: '1px solid var(--card-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 900, fontSize: '15px', color: 'var(--text-primary)' }}>{sf.name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{sf.code} • {sf.id}</div>
                    </div>
                    <span style={{
                      padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 800,
                      background: sf.isCustodySafe ? 'rgba(251,191,36,0.15)' : 'rgba(16,185,129,0.15)',
                      color: sf.isCustodySafe ? '#FBBF24' : '#10B981'
                    }}>
                      {sf.isCustodySafe ? (isAr ? 'خزينة عُهد مناديب' : 'Custody Safe') : (isAr ? 'خزينة رئيسية للفرع' : 'Branch Main Safe')}
                    </span>
                  </div>
                  <div style={{ fontSize: '26px', fontWeight: 900, color: sf.isCustodySafe ? '#FBBF24' : '#10B981', marginTop: '14px' }} dir="ltr">
                    {fmt(sf.balance)}
                  </div>
                </div>
              ))}
            </div>

            <div className="glass-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '18px' }}>
              <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--card-border)', fontWeight: 800, fontSize: '14px' }}>
                {isAr ? `سجل حركات خزائن ${b.name} (${b.safeTransactions.length} حركة)` : 'Branch Safe Transactions'}
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>{isAr ? 'المرجع' : 'Ref'}</th>
                      <th>{isAr ? 'الخزينة' : 'Safe'}</th>
                      <th>{isAr ? 'النوع' : 'Type'}</th>
                      <th>{isAr ? 'البيان / التفاصيل' : 'Description'}</th>
                      <th>{isAr ? 'التاريخ' : 'Date'}</th>
                      <th>{isAr ? 'المبلغ' : 'Amount'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {b.safeTransactions.map(tx => (
                      <tr key={tx.id}>
                        <td style={{ fontFamily: 'monospace', fontSize: '11px' }} dir="ltr">{tx.ref || tx.id}</td>
                        <td style={{ fontWeight: 700 }}>{tx.safeName || tx.safeId}</td>
                        <td>
                          <span style={{
                            padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800,
                            background: (tx.type === 'deposit' || tx.type === 'transfer_in') ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                            color: (tx.type === 'deposit' || tx.type === 'transfer_in') ? '#10B981' : '#EF4444'
                          }}>
                            {(tx.type === 'deposit' || tx.type === 'transfer_in') ? (isAr ? '+ إيداع' : '+ Deposit') : (isAr ? '- صرف / سحب' : '- Withdrawal')}
                          </span>
                        </td>
                        <td>{tx.description}</td>
                        <td style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                          {tx.date ? new Date(tx.date).toLocaleString('ar-LY') : ''}
                        </td>
                        <td style={{ fontWeight: 900, color: (tx.type === 'deposit' || tx.type === 'transfer_in') ? '#10B981' : '#EF4444' }} dir="ltr">
                          {(tx.type === 'deposit' || tx.type === 'transfer_in') ? '+' : '-'}{fmt(tx.amount)}
                        </td>
                      </tr>
                    ))}
                    {b.safeTransactions.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-tertiary)' }}>
                          {isAr ? 'لا توجد حركات مالية مسجلة في خزائن هذا الفرع حتى الآن.' : 'No branch safe transactions yet.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: BRANCH SHIPMENTS ── */}
        {inspectorTab === 'shipments' && (
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '18px' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 800, fontSize: '14px' }}>
                {isAr ? `جميع شحنات ${b.name} (${b.shipments.length})` : 'Branch Shipments'}
              </span>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>{isAr ? 'رقم التتبع' : 'Tracking'}</th>
                    <th>{isAr ? 'المرسل / المتجر' : 'Sender'}</th>
                    <th>{isAr ? 'المستلم' : 'Receiver'}</th>
                    <th>{isAr ? 'المدينة' : 'City'}</th>
                    <th>{isAr ? 'الإجمالي (COD)' : 'Total COD'}</th>
                    <th>{isAr ? 'رسوم التوصيل' : 'Delivery Fee'}</th>
                    <th>{isAr ? 'عمولة الشركة' : 'Company Fee'}</th>
                    <th>{isAr ? 'الحالة' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody>
                  {b.shipments.map(sh => (
                    <tr key={sh.trackingNumber}>
                      <td style={{ fontWeight: 800, color: 'var(--primary-color)' }} dir="ltr">{sh.trackingNumber}</td>
                      <td>{sh.senderName}</td>
                      <td>{sh.receiverName} <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }} dir="ltr">({sh.receiverPhone})</span></td>
                      <td>{sh.receiverCity}</td>
                      <td style={{ fontWeight: 800 }} dir="ltr">{fmt(sh.price)}</td>
                      <td dir="ltr">{fmt(sh.deliveryFee)}</td>
                      <td style={{ color: '#10B981', fontWeight: 700 }} dir="ltr">{fmt(sh.codFee)}</td>
                      <td>
                        <span style={{
                          padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 800,
                          background: (sh.status === 'Delivered' || sh.status === 'تم التسليم') ? 'rgba(16,185,129,0.14)' : 'rgba(245,158,11,0.14)',
                          color: (sh.status === 'Delivered' || sh.status === 'تم التسليم') ? '#10B981' : '#F59E0B'
                        }}>
                          {sh.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {b.shipments.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-tertiary)' }}>
                        {isAr ? 'لا توجد شحنات مسجلة لهذا الفرع بعد.' : 'No shipments in this branch.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 3: BRANCH SETTLEMENTS & PAYOUTS ── */}
        {inspectorTab === 'settlements' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {/* Driver Settlements */}
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '18px' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--card-border)', fontWeight: 800, fontSize: '14px' }}>
                {isAr ? `تسويات مناديب الفرع (${b.settlements.length})` : 'Branch Driver Settlements'}
              </div>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>{isAr ? 'المرجع' : 'Ref'}</th>
                    <th>{isAr ? 'السائق' : 'Driver'}</th>
                    <th>{isAr ? 'المبلغ' : 'Amount'}</th>
                    <th>{isAr ? 'التاريخ' : 'Date'}</th>
                  </tr>
                </thead>
                <tbody>
                  {b.settlements.map(st => (
                    <tr key={st.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '11px' }} dir="ltr">{st.id}</td>
                      <td style={{ fontWeight: 700 }}>{st.driverName}</td>
                      <td style={{ fontWeight: 800, color: '#10B981' }} dir="ltr">{fmt(st.amount)}</td>
                      <td style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{st.date ? new Date(st.date).toLocaleDateString('ar-LY') : ''}</td>
                    </tr>
                  ))}
                  {b.settlements.length === 0 && (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-tertiary)' }}>{isAr ? 'لا توجد تسويات مناديب بعد' : 'No driver settlements'}</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Merchant Wallet Transactions */}
            <div className="glass-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '18px' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--card-border)', fontWeight: 800, fontSize: '14px' }}>
                {isAr ? `حركات وتسويات محافظ تجار الفرع (${b.transactions.length})` : 'Branch Merchant Transactions'}
              </div>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>{isAr ? 'المتجر' : 'Store'}</th>
                    <th>{isAr ? 'البيان' : 'Description'}</th>
                    <th>{isAr ? 'المبلغ' : 'Amount'}</th>
                    <th>{isAr ? 'التاريخ' : 'Date'}</th>
                  </tr>
                </thead>
                <tbody>
                  {b.transactions.map(tx => (
                    <tr key={tx.id}>
                      <td style={{ fontWeight: 700 }}>{tx.storeName}</td>
                      <td style={{ fontSize: '12px' }}>{tx.description}</td>
                      <td style={{ fontWeight: 800, color: tx.type === 'credit' ? '#10B981' : '#EF4444' }} dir="ltr">
                        {tx.type === 'credit' ? '+' : '-'}{fmt(Math.abs(tx.amount || 0))}
                      </td>
                      <td style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{tx.date ? new Date(tx.date).toLocaleDateString('ar-LY') : ''}</td>
                    </tr>
                  ))}
                  {b.transactions.length === 0 && (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-tertiary)' }}>{isAr ? 'لا توجد معاملات محافظ تجار بعد' : 'No merchant transactions'}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 4: BRANCH USERS (MERCHANTS, DRIVERS, EMPLOYEES) ── */}
        {inspectorTab === 'users' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* 1. Branch Merchants */}
            <div className="glass-card" style={{ padding: '20px', borderRadius: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontWeight: 800, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {Icon.store} {isAr ? `تجار ومتاجر ${b.name} (${b.merchants.length})` : 'Branch Merchants'}
                </h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <select
                    className="glass-input"
                    style={{ width: '220px', padding: '6px 10px', fontSize: '12px' }}
                    value={assignMerchantId}
                    onChange={e => setAssignMerchantId(e.target.value)}
                  >
                    <option value="">{isAr ? '-- ضم تاجر موجود إلى هذا الفرع --' : '-- Assign Existing Merchant --'}</option>
                    {unassignedMerchants.map(m => (
                      <option key={m.id} value={m.id}>{m.storeName} ({m.name})</option>
                    ))}
                  </select>
                  <button
                    disabled={!assignMerchantId}
                    onClick={async () => {
                      if (!assignMerchantId) return;
                      await assignEntityToBranch('merchants', assignMerchantId, b.id);
                      setAssignMerchantId('');
                    }}
                    className="glass-button"
                    style={{ padding: '6px 14px', fontSize: '12px', opacity: assignMerchantId ? 1 : 0.5 }}
                  >
                    {isAr ? 'ضم للفرع' : 'Assign'}
                  </button>
                  <button
                    onClick={() => setShowAddBranchMerchant(true)}
                    style={{
                      padding: '7px 14px', borderRadius: '10px', border: 'none',
                      background: 'linear-gradient(135deg, #10B981, #059669)', color: '#fff',
                      fontWeight: 800, fontSize: '12px', cursor: 'pointer'
                    }}
                  >
                    + {isAr ? 'إنشاء تاجر جديد بالفرع' : 'New Branch Merchant'}
                  </button>
                </div>
              </div>

              <table className="custom-table">
                <thead>
                  <tr>
                    <th>{isAr ? 'المعرف' : 'ID'}</th>
                    <th>{isAr ? 'اسم المتجر' : 'Store Name'}</th>
                    <th>{isAr ? 'المالك' : 'Owner'}</th>
                    <th>{isAr ? 'الهاتف' : 'Phone'}</th>
                    <th>{isAr ? 'الرصيد المتاح' : 'Wallet Balance'}</th>
                    <th>{isAr ? 'إجراء' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody>
                  {b.merchants.map(m => (
                    <tr key={m.id}>
                      <td style={{ fontWeight: 700 }}>{m.id}</td>
                      <td style={{ fontWeight: 800, color: 'var(--primary-color)' }}>{m.storeName}</td>
                      <td>{m.name}</td>
                      <td dir="ltr">{m.phone}</td>
                      <td style={{ fontWeight: 800, color: '#10B981' }} dir="ltr">{fmt(m.walletBalance)}</td>
                      <td>
                        <button
                          onClick={() => assignEntityToBranch('merchants', m.id, 'MAIN')}
                          style={{
                            padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)',
                            background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontSize: '11px', fontWeight: 700, cursor: 'pointer'
                          }}
                        >
                          {isAr ? 'إعادة للنظام الرئيسي' : 'Move to HQ'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {b.merchants.length === 0 && (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-tertiary)' }}>{isAr ? 'لا يوجد تجار مخصصون لهذا الفرع بعد.' : 'No merchants in this branch.'}</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 2. Branch Drivers */}
            <div className="glass-card" style={{ padding: '20px', borderRadius: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontWeight: 800, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {Icon.truck} {isAr ? `سائقو ومناديب ${b.name} (${b.drivers.length})` : 'Branch Drivers'}
                </h3>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <select
                    className="glass-input"
                    style={{ width: '220px', padding: '6px 10px', fontSize: '12px' }}
                    value={assignDriverId}
                    onChange={e => setAssignDriverId(e.target.value)}
                  >
                    <option value="">{isAr ? '-- ضم سائق موجود إلى هذا الفرع --' : '-- Assign Existing Driver --'}</option>
                    {unassignedDrivers.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.zone})</option>
                    ))}
                  </select>
                  <button
                    disabled={!assignDriverId}
                    onClick={async () => {
                      if (!assignDriverId) return;
                      await assignEntityToBranch('drivers', assignDriverId, b.id);
                      setAssignDriverId('');
                    }}
                    className="glass-button"
                    style={{ padding: '6px 14px', fontSize: '12px', opacity: assignDriverId ? 1 : 0.5 }}
                  >
                    {isAr ? 'ضم للفرع' : 'Assign'}
                  </button>
                  <button
                    onClick={() => {
                      setBranchDriverForm({ name: '', phone: '', zone: b.city || 'طرابلس', password: '' });
                      setShowAddBranchDriver(true);
                    }}
                    style={{
                      padding: '7px 14px', borderRadius: '10px', border: 'none',
                      background: 'linear-gradient(135deg, #10B981, #059669)', color: '#fff',
                      fontWeight: 800, fontSize: '12px', cursor: 'pointer'
                    }}
                  >
                    + {isAr ? 'إنشاء سائق جديد بالفرع' : 'New Branch Driver'}
                  </button>
                </div>
              </div>

              <table className="custom-table">
                <thead>
                  <tr>
                    <th>{isAr ? 'المعرف' : 'ID'}</th>
                    <th>{isAr ? 'اسم السائق' : 'Driver Name'}</th>
                    <th>{isAr ? 'الهاتف' : 'Phone'}</th>
                    <th>{isAr ? 'المنطقة' : 'Zone'}</th>
                    <th>{isAr ? 'عُهدة معلقة' : 'Pending Custody'}</th>
                    <th>{isAr ? 'إجراء' : 'Action'}</th>
                  </tr>
                </thead>
                <tbody>
                  {b.drivers.map(d => (
                    <tr key={d.id}>
                      <td style={{ fontWeight: 700 }}>{d.id}</td>
                      <td style={{ fontWeight: 800 }}>{d.name}</td>
                      <td dir="ltr">{d.phone}</td>
                      <td>{d.zone}</td>
                      <td style={{ fontWeight: 800, color: d.pendingSettlement > 0 ? '#EF4444' : '#10B981' }} dir="ltr">{fmt(d.pendingSettlement)}</td>
                      <td>
                        <button
                          onClick={() => assignEntityToBranch('drivers', d.id, 'MAIN')}
                          style={{
                            padding: '4px 10px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)',
                            background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontSize: '11px', fontWeight: 700, cursor: 'pointer'
                          }}
                        >
                          {isAr ? 'إعادة للنظام الرئيسي' : 'Move to HQ'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {b.drivers.length === 0 && (
                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-tertiary)' }}>{isAr ? 'لا يوجد سائقون مخصصون لهذا الفرع بعد.' : 'No drivers in this branch.'}</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 3. Branch Employees */}
            <div className="glass-card" style={{ padding: '20px', borderRadius: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontWeight: 800, fontSize: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {Icon.userShield} {isAr ? `موظفو إدارة ${b.name} (${b.employees.length})` : 'Branch Employees'}
                </h3>
                <button
                  onClick={() => setShowAddBranchEmp(true)}
                  style={{
                    padding: '7px 14px', borderRadius: '10px', border: 'none',
                    background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: '#fff',
                    fontWeight: 800, fontSize: '12px', cursor: 'pointer'
                  }}
                >
                  + {isAr ? 'إضافة موظف للفرع' : 'Add Branch Employee'}
                </button>
              </div>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>{isAr ? 'الاسم' : 'Name'}</th>
                    <th>{isAr ? 'رقم الهاتف / اسم الدخول' : 'Login Phone'}</th>
                    <th>{isAr ? 'كلمة المرور' : 'Password'}</th>
                    <th>{isAr ? 'الحالة' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody>
                  {b.employees.map(emp => (
                    <tr key={emp.id}>
                      <td style={{ fontWeight: 800 }}>{emp.name}</td>
                      <td dir="ltr">{emp.phone}</td>
                      <td dir="ltr">{emp.password}</td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: emp.isActive !== false ? '#10B981' : '#EF4444' }}>
                          {Icon.dot(emp.isActive !== false ? '#10B981' : '#EF4444')}
                          {emp.isActive !== false ? 'نشط' : 'موقوف'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {b.employees.length === 0 && (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: 'var(--text-tertiary)' }}>{isAr ? 'لا يوجد موظفون إضافيون في هذا الفرع (بخلاف مدير الفرع).' : 'No extra branch employees.'}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── TAB 5: BRANCH ADMIN CREDENTIALS ── */}
        {inspectorTab === 'admin' && (
          <div className="glass-card" style={{ padding: '28px', borderRadius: '20px', maxWidth: '640px' }}>
            <h3 style={{ margin: '0 0 16px', fontWeight: 900, fontSize: '17px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              {Icon.lock} {isAr ? `بيانات دخول حساب الأدمن الخاص بـ ${b.name}` : 'Dedicated Branch Admin Credentials'}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.6 }}>
              {isAr
                ? 'عند تسجيل الدخول بهذه البيانات من شاشة الدخول الرئيسية، يفتح النظام بالكامل كبيئة مستقلة خاصة بهذا الفرع فقط (بشحناته ومستخدميه وخزائنه وتسوياته المعزولة عن النظام الرئيسي).'
                : 'Logging in with these credentials opens an isolated workspace scoped strictly to this branch.'}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(128,128,128,0.08)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{isAr ? 'اسم مدير الفرع' : 'Admin Name'}</div>
                <div style={{ fontSize: '15px', fontWeight: 800, marginTop: '4px' }}>{b.adminName}</div>
              </div>
              <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(128,128,128,0.08)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{isAr ? 'اسم المستخدم / رقم الهاتف للدخول' : 'Login Username / Phone'}</div>
                <div style={{ fontSize: '15px', fontWeight: 900, color: '#6366F1', marginTop: '4px' }} dir="ltr">{b.adminPhone}</div>
              </div>
              <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(128,128,128,0.08)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{isAr ? 'كلمة المرور' : 'Password'}</div>
                <div style={{ fontSize: '15px', fontWeight: 900, color: '#10B981', marginTop: '4px' }} dir="ltr">{b.adminPassword}</div>
              </div>
              <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(128,128,128,0.08)' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{isAr ? 'الأقسام المفعلة للفرع' : 'Enabled Modules'}</div>
                <div style={{ fontSize: '13px', fontWeight: 800, marginTop: '4px' }}>{(b.permissions || []).length} {isAr ? 'أقسام' : 'modules'}</div>
              </div>
            </div>
            <button onClick={() => openEditModal(b)} className="glass-button" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              {Icon.edit} {isAr ? 'تعديل بيانات حساب مدير الفرع والصلاحيات' : 'Edit Branch Admin Credentials'}
            </button>
          </div>
        )}

        {/* Quick Add Branch Merchant Modal */}
        {showAddBranchMerchant && (
          <div className="modal-overlay" onClick={() => setShowAddBranchMerchant(false)}>
            <div className="modal-content glass-panel" style={{ padding: '28px', maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 16px', fontWeight: 800 }}>{isAr ? `إضافة تاجر جديد لـ ${b.name}` : 'Add Branch Merchant'}</h3>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await addMerchant({ ...branchMerchantForm, branchId: b.id, verified: true });
                  setBranchMerchantForm({ storeName: '', name: '', phone: '', email: '' });
                  setShowAddBranchMerchant(false);
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
              >
                <input required className="glass-input" placeholder={isAr ? 'اسم المتجر' : 'Store Name'} value={branchMerchantForm.storeName} onChange={e => setBranchMerchantForm(p => ({ ...p, storeName: e.target.value }))} />
                <input required className="glass-input" placeholder={isAr ? 'اسم صاحب المتجر' : 'Owner Name'} value={branchMerchantForm.name} onChange={e => setBranchMerchantForm(p => ({ ...p, name: e.target.value }))} />
                <input required className="glass-input" placeholder={isAr ? 'رقم الهاتف' : 'Phone'} value={branchMerchantForm.phone} onChange={e => setBranchMerchantForm(p => ({ ...p, phone: e.target.value }))} />
                <input className="glass-input" placeholder={isAr ? 'البريد الإلكتروني (اختياري)' : 'Email'} value={branchMerchantForm.email} onChange={e => setBranchMerchantForm(p => ({ ...p, email: e.target.value }))} />
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button type="button" onClick={() => setShowAddBranchMerchant(false)} className="glass-input" style={{ width: 'auto', cursor: 'pointer' }}>{isAr ? 'إلغاء' : 'Cancel'}</button>
                  <button type="submit" className="glass-button">{isAr ? 'حفظ التاجر بالفرع' : 'Save'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Quick Add Branch Driver Modal */}
        {showAddBranchDriver && (
          <div className="modal-overlay" onClick={() => setShowAddBranchDriver(false)}>
            <div className="modal-content glass-panel" style={{ padding: '28px', maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 16px', fontWeight: 800 }}>{isAr ? `إضافة سائق جديد لـ ${b.name}` : 'Add Branch Driver'}</h3>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await addDriver({ ...branchDriverForm, branchId: b.id });
                  setBranchDriverForm({ name: '', phone: '', zone: b.city || '', password: '' });
                  setShowAddBranchDriver(false);
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
              >
                <input required className="glass-input" placeholder={isAr ? 'اسم السائق' : 'Driver Name'} value={branchDriverForm.name} onChange={e => setBranchDriverForm(p => ({ ...p, name: e.target.value }))} />
                <input required className="glass-input" placeholder={isAr ? 'رقم الهاتف' : 'Phone'} value={branchDriverForm.phone} onChange={e => setBranchDriverForm(p => ({ ...p, phone: e.target.value }))} />
                <input required className="glass-input" placeholder={isAr ? 'المنطقة' : 'Zone'} value={branchDriverForm.zone} onChange={e => setBranchDriverForm(p => ({ ...p, zone: e.target.value }))} />
                <input required className="glass-input" placeholder={isAr ? 'كلمة المرور' : 'Password'} value={branchDriverForm.password} onChange={e => setBranchDriverForm(p => ({ ...p, password: e.target.value }))} />
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button type="button" onClick={() => setShowAddBranchDriver(false)} className="glass-input" style={{ width: 'auto', cursor: 'pointer' }}>{isAr ? 'إلغاء' : 'Cancel'}</button>
                  <button type="submit" className="glass-button">{isAr ? 'حفظ السائق بالفرع' : 'Save'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Quick Add Branch Employee Modal */}
        {showAddBranchEmp && (
          <div className="modal-overlay" onClick={() => setShowAddBranchEmp(false)}>
            <div className="modal-content glass-panel" style={{ padding: '28px', maxWidth: '420px' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 16px', fontWeight: 800 }}>{isAr ? `إضافة موظف لـ ${b.name}` : 'Add Branch Employee'}</h3>
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  await saveEmployee({
                    ...branchEmpForm,
                    branchId: b.id,
                    isActive: true,
                    permissions: ['overview', 'shipments', 'wallet', 'drivers', 'merchants', 'tickets', 'safes']
                  });
                  setBranchEmpForm({ name: '', phone: '', password: '' });
                  setShowAddBranchEmp(false);
                }}
                style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
              >
                <input required className="glass-input" placeholder={isAr ? 'اسم الموظف' : 'Employee Name'} value={branchEmpForm.name} onChange={e => setBranchEmpForm(p => ({ ...p, name: e.target.value }))} />
                <input required className="glass-input" placeholder={isAr ? 'رقم الهاتف / اسم الدخول' : 'Login Phone'} value={branchEmpForm.phone} onChange={e => setBranchEmpForm(p => ({ ...p, phone: e.target.value }))} />
                <input required className="glass-input" placeholder={isAr ? 'كلمة المرور' : 'Password'} value={branchEmpForm.password} onChange={e => setBranchEmpForm(p => ({ ...p, password: e.target.value }))} />
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <button type="button" onClick={() => setShowAddBranchEmp(false)} className="glass-input" style={{ width: 'auto', cursor: 'pointer' }}>{isAr ? 'إلغاء' : 'Cancel'}</button>
                  <button type="submit" className="glass-button">{isAr ? 'حفظ الموظف بالفرع' : 'Save'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════
  // ── MAIN ALL-BRANCHES COMMAND CENTER (القسم المستقل لإدارة ومراقبة كافة الفروع)
  // ══════════════════════════════════════════════════════════════════════════
  const filteredBranchCards = enrichedBranches.filter(b => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (b.name && b.name.toLowerCase().includes(q)) ||
      (b.city && b.city.toLowerCase().includes(q)) ||
      (b.code && b.code.toLowerCase().includes(q)) ||
      (b.adminName && b.adminName.toLowerCase().includes(q)) ||
      (b.adminPhone && b.adminPhone.toLowerCase().includes(q))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div className="glass-panel" style={{
        padding: '24px 28px', borderRadius: '24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px',
        background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(16,185,129,0.05))',
        border: '1px solid rgba(99,102,241,0.25)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1 style={{ fontWeight: 900, fontSize: '23px', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              {Icon.building} {isAr ? 'إدارة الفروع والأنظمة المستقلة' : 'Independent Branches Management'}
            </h1>
            <span style={{
              padding: '4px 12px', borderRadius: '99px', fontSize: '11px', fontWeight: 800,
              background: 'rgba(16,185,129,0.15)', color: '#10B981', border: '1px solid rgba(16,185,129,0.3)',
              display: 'inline-flex', alignItems: 'center', gap: '6px'
            }}>
              {Icon.shield} {isAr ? 'نظامك الرئيسي معزول 100% عن الفروع' : 'Main HQ 100% Isolated'}
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '6px 0 0' }}>
            {isAr
              ? 'لكل فرع حساب أدمن مستقل، خزينة رئيسية وخزينة عُهد سائقين خاصة به، ومستخدمون وتسويات وشحنات معزولة تماماً عن نظامك الرئيسي، مع إمكانية اطلاعك الكامل من هنا على تفاصيل ومعاملات كل فرع.'
              : 'Each branch has its own dedicated Admin account, safes, users, settlements, and shipments completely isolated from your Main HQ system.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {activeBranchFilter !== 'MAIN' && (
            <button
              onClick={() => setActiveBranchFilter('MAIN')}
              style={{
                padding: '12px 18px', borderRadius: '14px', border: '1px solid rgba(245,158,11,0.4)',
                background: 'rgba(245,158,11,0.15)', color: '#F59E0B', fontWeight: 800, fontSize: '13px', cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: '6px'
              }}
            >
              {Icon.undo} {isAr ? 'العودة لنظامك الرئيسي المستقل (المركز)' : 'Return to Main HQ System'}
            </button>
          )}
          <button
            onClick={openCreateModal}
            style={{
              padding: '12px 22px', borderRadius: '14px', border: 'none',
              background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: '#fff',
              fontWeight: 800, fontSize: '13px', cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(99,102,241,0.4)'
            }}
          >
            + {isAr ? 'إضافة فرع مستقل جديد' : 'Add New Independent Branch'}
          </button>
        </div>
      </div>

      {/* Global Branches Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
        <div className="glass-card" style={{ padding: '20px', borderRadius: '18px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 800 }}>{isAr ? 'إجمالي الفروع المستقلة' : 'Total Branches'}</div>
          <div style={{ fontSize: '26px', fontWeight: 900, color: '#6366F1', marginTop: '6px' }}>{globalBranchTotals.totalBranches}</div>
          <div style={{ fontSize: '11px', color: '#10B981', marginTop: '4px', fontWeight: 700 }}>{globalBranchTotals.activeBranches} {isAr ? 'فروع نشطة' : 'active'}</div>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderRadius: '18px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 800 }}>{isAr ? 'إجمالي سيولة خزائن الفروع' : 'Branches Main Safes Liquidity'}</div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#10B981', marginTop: '6px' }} dir="ltr">{fmt(globalBranchTotals.totalMainSafe)}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>{isAr ? 'منفصلة عن خزينة المركز الرئيسي' : 'Isolated from HQ Safe'}</div>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderRadius: '18px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 800 }}>{isAr ? 'إجمالي عُهد مناديب الفروع' : 'Branches Driver Custody'}</div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#FBBF24', marginTop: '6px' }} dir="ltr">{fmt(globalBranchTotals.totalCustodySafe)}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>{isAr ? 'عُهد ميدانية خاصة بسائقي الفروع' : 'Field custody across branches'}</div>
        </div>

        <div className="glass-card" style={{ padding: '20px', borderRadius: '18px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 800 }}>{isAr ? 'شحنات وصافي أرباح الفروع' : 'Branches Shipments & Profit'}</div>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#06B6D4', marginTop: '6px' }} dir="ltr">{fmt(globalBranchTotals.totalNetProfit)}</div>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>{globalBranchTotals.totalShipments} {isAr ? 'شحنة في كافة الفروع' : 'shipments'}</div>
        </div>
      </div>

      {/* Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <h2 style={{ margin: 0, fontWeight: 900, fontSize: '16px', color: 'var(--text-primary)' }}>
          {isAr ? 'قائمة الفروع وحسابات المدراء والمعاملات' : 'Branches & Admin Accounts'}
        </h2>
        <input
          type="text"
          className="glass-input"
          style={{ maxWidth: '320px', padding: '9px 14px', fontSize: '13px', borderRadius: '12px' }}
          placeholder={isAr ? 'بحث باسم الفرع، المدينة، أو حساب المدير...' : 'Search branch, city, admin...'}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Branches Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
        {filteredBranchCards.map(b => (
          <div key={b.id} className="glass-card" style={{
            padding: '24px', borderRadius: '24px',
            border: activeBranchFilter === b.id ? '2px solid #10B981' : '1px solid var(--card-border)',
            display: 'flex', flexDirection: 'column', gap: '18px'
          }}>
            {/* Top Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: 900, fontSize: '18px', color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    {Icon.buildingSm} {b.name}
                  </span>
                  <span style={{
                    padding: '3px 9px', borderRadius: '8px', fontSize: '11px', fontWeight: 800,
                    background: 'rgba(99,102,241,0.12)', color: '#6366F1'
                  }}>{b.code}</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  {Icon.pin} {b.city} {b.address ? `— ${b.address}` : ''}
                </div>
              </div>

              <span style={{
                padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: 800,
                background: b.active !== false ? 'rgba(16,185,129,0.14)' : 'rgba(239,68,68,0.14)',
                color: b.active !== false ? '#10B981' : '#EF4444',
                display: 'inline-flex', alignItems: 'center', gap: '6px'
              }}>
                {Icon.dot(b.active !== false ? '#10B981' : '#EF4444')}
                {b.active !== false ? (isAr ? 'نشط' : 'Active') : (isAr ? 'موقوف' : 'Suspended')}
              </span>
            </div>

            {/* Dedicated Branch Admin Credentials Box */}
            <div style={{
              padding: '12px 16px', borderRadius: '14px',
              background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px'
            }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {Icon.lock} {isAr ? 'حساب أدمن الفرع:' : 'Branch Admin:'} <strong style={{ color: 'var(--text-primary)' }}>{b.adminName}</strong>
                </div>
                <div style={{ fontSize: '12px', marginTop: '4px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <span>{isAr ? 'الدخول:' : 'Login:'} <strong style={{ color: '#6366F1' }} dir="ltr">{b.adminPhone}</strong></span>
                  <span>
                    {isAr ? 'كلمة المرور:' : 'Pass:'}{' '}
                    <strong style={{ color: '#10B981' }} dir="ltr">
                      {showPasswords[b.id] ? b.adminPassword : '••••••'}
                    </strong>
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowPasswords(p => ({ ...p, [b.id]: !p[b.id] }))}
                style={{
                  padding: '5px 10px', borderRadius: '8px', border: '1px solid var(--card-border)',
                  background: 'transparent', color: 'var(--text-secondary)', fontSize: '11px', fontWeight: 700, cursor: 'pointer'
                }}
              >
                {showPasswords[b.id] ? (isAr ? 'إخفاء' : 'Hide') : (isAr ? 'إظهار' : 'Show')}
              </button>
            </div>

            {/* Branch Safes & Operational Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.18)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 700 }}>{isAr ? 'خزينة الفرع الرئيسية' : 'Branch Main Safe'}</div>
                <div style={{ fontSize: '17px', fontWeight: 900, color: '#10B981', marginTop: '2px' }} dir="ltr">{fmt(b.mainSafe?.balance)}</div>
              </div>
              <div style={{ padding: '12px', borderRadius: '12px', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.18)' }}>
                <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', fontWeight: 700 }}>{isAr ? 'عُهد مناديب الفرع' : 'Branch Custody Safe'}</div>
                <div style={{ fontSize: '17px', fontWeight: 900, color: '#FBBF24', marginTop: '2px' }} dir="ltr">{fmt(b.custodySafe?.balance)}</div>
              </div>
            </div>

            {/* Counts Row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-secondary)', padding: '0 4px', flexWrap: 'wrap', gap: '8px' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>{Icon.box} {isAr ? 'الشحنات:' : 'Shipments:'} <strong>{b.shipments.length}</strong></span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>{Icon.store} {isAr ? 'التجار:' : 'Merchants:'} <strong>{b.merchants.length}</strong></span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>{Icon.truck} {isAr ? 'السائقون:' : 'Drivers:'} <strong>{b.drivers.length}</strong></span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>{Icon.settlement} {isAr ? 'التسويات:' : 'Settlements:'} <strong>{b.settlements.length}</strong></span>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', paddingTop: '8px', borderTop: '1px solid var(--card-border)' }}>
              <button
                onClick={() => {
                  setSelectedBranchId(b.id);
                  setInspectorTab('financials');
                }}
                style={{
                  flex: 2, padding: '10px 14px', borderRadius: '12px', border: 'none',
                  background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: '#fff',
                  fontWeight: 800, fontSize: '12px', cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px'
                }}
              >
                {Icon.search} {isAr ? 'استعراض تفاصيل ومعاملات الفرع' : 'Inspect Details & Transactions'}
              </button>

              <button
                onClick={() => openEditModal(b)}
                style={{
                  padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--card-border)',
                  background: 'rgba(128,128,128,0.1)', color: 'var(--text-primary)', fontWeight: 800, fontSize: '12px', cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                }}
                title={isAr ? 'تعديل بيانات الفرع وحساب المدير' : 'Edit Branch'}
              >
                {Icon.edit}
              </button>

              <button
                onClick={() => toggleBranchStatus(b.id)}
                style={{
                  padding: '10px 12px', borderRadius: '12px', border: '1px solid var(--card-border)',
                  background: b.active !== false ? 'rgba(245,158,11,0.12)' : 'rgba(16,185,129,0.12)',
                  color: b.active !== false ? '#F59E0B' : '#10B981',
                  fontWeight: 800, fontSize: '12px', cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                }}
                title={b.active !== false ? (isAr ? 'إيقاف الفرع' : 'Suspend') : (isAr ? 'تفعيل الفرع' : 'Activate')}
              >
                {b.active !== false ? Icon.pause : Icon.play}
              </button>

              <button
                onClick={() => {
                  if (window.confirm(isAr ? `هل أنت متأكد من حذف ${b.name}؟` : `Delete ${b.name}?`)) {
                    deleteBranch(b.id);
                  }
                }}
                style={{
                  padding: '10px 12px', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.3)',
                  background: 'rgba(239,68,68,0.1)', color: '#EF4444', fontWeight: 800, fontSize: '12px', cursor: 'pointer',
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center'
                }}
                title={isAr ? 'حذف الفرع' : 'Delete Branch'}
              >
                {Icon.trash}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Branch Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content glass-panel" style={{ padding: '28px', maxWidth: '560px', width: '95%', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 18px', fontSize: '18px', fontWeight: 900, color: 'var(--text-primary)' }}>
              {branchForm.id ? (isAr ? 'تعديل بيانات الفرع وحساب الأدمن' : 'Edit Branch & Admin') : (isAr ? 'إضافة فرع مستقل جديد' : 'Create New Independent Branch')}
            </h2>

            <form onSubmit={handleSaveBranch} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    {isAr ? 'اسم الفرع *' : 'Branch Name *'}
                  </label>
                  <input required className="glass-input" placeholder={isAr ? 'مثال: فرع مصراتة' : 'Misrata Branch'} value={branchForm.name} onChange={e => setBranchForm(p => ({ ...p, name: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    {isAr ? 'المدينة *' : 'City *'}
                  </label>
                  <input required className="glass-input" placeholder={isAr ? 'مثال: مصراتة' : 'Misrata'} value={branchForm.city} onChange={e => setBranchForm(p => ({ ...p, city: e.target.value }))} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    {isAr ? 'كود الفرع' : 'Branch Code'}
                  </label>
                  <input className="glass-input" placeholder="MIS-01" value={branchForm.code} onChange={e => setBranchForm(p => ({ ...p, code: e.target.value }))} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-secondary)' }}>
                    {isAr ? 'العنوان / الهاتف' : 'Address / Phone'}
                  </label>
                  <input className="glass-input" placeholder={isAr ? 'الشارع الرئيسي - 091xxxxxxx' : 'Address'} value={branchForm.address} onChange={e => setBranchForm(p => ({ ...p, address: e.target.value }))} />
                </div>
              </div>

              <div style={{ padding: '16px', borderRadius: '14px', background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.25)' }}>
                <div style={{ fontWeight: 800, fontSize: '13px', color: '#6366F1', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {Icon.lock} {isAr ? 'بيانات حساب أدمن الفرع (لتسجيل الدخول المستقل للفرع)' : 'Branch Admin Login Account'}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      {isAr ? 'اسم مدير الفرع *' : 'Admin Name *'}
                    </label>
                    <input required className="glass-input" placeholder={isAr ? 'مدير فرع مصراتة' : 'Admin Name'} value={branchForm.adminName} onChange={e => setBranchForm(p => ({ ...p, adminName: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      {isAr ? 'اسم الدخول / الهاتف *' : 'Login User/Phone *'}
                    </label>
                    <input required className="glass-input" placeholder="misrata" value={branchForm.adminPhone} onChange={e => setBranchForm(p => ({ ...p, adminPhone: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, marginBottom: '4px', color: 'var(--text-secondary)' }}>
                      {isAr ? 'كلمة المرور *' : 'Password *'}
                    </label>
                    <input required className="glass-input" placeholder="••••••" value={branchForm.adminPassword} onChange={e => setBranchForm(p => ({ ...p, adminPassword: e.target.value }))} />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                  {isAr ? 'الأقسام المتاحة في نظام الفرع:' : 'Branch Permitted Modules:'}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {PERM_OPTIONS.map(perm => (
                    <label key={perm.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={branchForm.permissions.includes(perm.id)}
                        onChange={() => togglePermission(perm.id)}
                      />
                      <span>{isAr ? perm.ar : perm.en}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowModal(false)} style={{ padding: '10px 20px', borderRadius: '10px', border: '1px solid var(--card-border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 700, cursor: 'pointer' }}>
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" className="glass-button">
                  {isAr ? 'حفظ واعتماد الفرع المستقل' : 'Save Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

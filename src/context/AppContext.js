'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import * as db from '@/services/mockData';
import { supabase } from '@/services/supabaseClient';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [theme, setTheme] = useState('dark');
  const [lang, setLang] = useState('ar');

  // Auth State
  const [currentUser, setCurrentUser] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [activeBranchFilter, setActiveBranchFilter] = useState('MAIN');

  // Restore Auth Session
  useEffect(() => {
    const savedUser = localStorage.getItem('vanex_current_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setCurrentUser(parsed);
      if (parsed.branchId && parsed.branchId !== 'MAIN') {
        setActiveBranchFilter(parsed.branchId);
      }
    }
  }, []);

  const getAdminData = () => {
    const savedAdmin = localStorage.getItem('vanex_admin_data');
    if (savedAdmin) return JSON.parse(savedAdmin);
    
    const oldPw = localStorage.getItem('vanex_admin_password');
    return {
      id: 'admin',
      name: 'المدير العام',
      phone: 'admin',
      password: oldPw || 'admin',
      role: 'super_admin',
      branchId: 'MAIN',
      permissions: ['all']
    };
  };

  const login = async (phone, password) => {
    const [emps, branchList] = await Promise.all([
      db.getEmployees(),
      db.getBranches()
    ]);
    const adminData = getAdminData();
    
    if (phone === adminData.phone && password === adminData.password) {
      const superUser = { ...adminData, role: 'super_admin', branchId: 'MAIN' };
      setCurrentUser(superUser);
      setActiveBranchFilter('MAIN');
      localStorage.setItem('vanex_current_user', JSON.stringify(superUser));
      return { success: true };
    }

    // Check Branch Admin credentials
    const matchedBranch = (branchList || []).find(
      b => String(b.adminPhone || '').trim() === String(phone || '').trim() && String(b.adminPassword || '') === String(password || '')
    );
    if (matchedBranch) {
      if (matchedBranch.active === false) {
        return { success: false, message: 'هذا الفرع موقوف حالياً، يرجى مراجعة الإدارة العامة' };
      }
      const branchAdminUser = {
        id: `branch_admin_${matchedBranch.id}`,
        name: matchedBranch.adminName || `مدير ${matchedBranch.name}`,
        phone: matchedBranch.adminPhone,
        role: 'branch_admin',
        branchId: matchedBranch.id,
        branchName: matchedBranch.name,
        city: matchedBranch.city,
        permissions: (matchedBranch.permissions || ['overview', 'shipments', 'wallet', 'drivers', 'merchants', 'tickets', 'reports', 'safes', 'employees', 'logs']).filter(p => p !== 'branches')
      };
      setCurrentUser(branchAdminUser);
      setActiveBranchFilter(matchedBranch.id);
      localStorage.setItem('vanex_current_user', JSON.stringify(branchAdminUser));
      return { success: true };
    }

    const emp = emps.find(e => e.phone === phone && e.password === password);
    if (emp) {
      if (emp.isActive === false) {
        return { success: false, message: 'هذا الحساب موقوف، يرجى مراجعة إدارة النظام' };
      }
      const empUser = { ...emp, branchId: emp.branchId || 'MAIN' };
      setCurrentUser(empUser);
      setActiveBranchFilter(empUser.branchId);
      localStorage.setItem('vanex_current_user', JSON.stringify(empUser));
      return { success: true };
    }
    return { success: false, message: 'بيانات الدخول غير صحيحة' };
  };

  const updateAdminData = (newData) => {
    const currentAdmin = getAdminData();
    const updated = { ...currentAdmin, ...newData };
    localStorage.setItem('vanex_admin_data', JSON.stringify(updated));
    localStorage.removeItem('vanex_admin_password');
    
    if (currentUser?.id === 'admin') {
      setCurrentUser(updated);
      localStorage.setItem('vanex_current_user', JSON.stringify(updated));
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('vanex_current_user');
  };

  // Date Filter State
  const [dateFilter, setDateFilter] = useState('all');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });

  // Real-time Data states
  const [shipmentsList, setShipmentsList] = useState([]);
  const [merchants, setMerchants] = useState([]);
  const [payoutRequests, setPayoutRequests] = useState([]);
  const [transactionLog, setTransactionLog] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [driverSettlements, setDriverSettlements] = useState([]);
  const [cityPricing, setCityPricing] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    total: 0, delivered: 0, progress: 0, warehouse: 0, registered: 0, returned: 0,
    totalCodCollected: 0, totalRevenue: 0, pendingPayouts: 0,
    totalMerchantBalance: 0, activeDrivers: 0,
    dailyRevenue: [0, 0, 0, 0, 0, 0, 0],
    pendingPayoutsCount: 0
  });

  const [loading, setLoading] = useState(true);

  // Load saved configurations from localStorage if available (client-side only)
  useEffect(() => {
    const savedTheme = localStorage.getItem('admin_theme') || 'dark';
    const savedLang = localStorage.getItem('admin_lang') || 'ar';
    setTheme(savedTheme);
    setLang(savedLang);
  }, []);

  // Update HTML attributes whenever theme/lang state changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
  }, [theme, lang]);

  const [safes, setSafes] = useState([]);
  const [safeTransactions, setSafeTransactions] = useState([]);

  // Load all Supabase data
  const refreshAllData = async () => {
    try {
      const [
        branchesData,
        shipmentsData,
        merchantsData,
        payoutsData,
        txLogData,
        driversData,
        settlementsData,
        pricingData,
        ticketsData,
        statsData,
        employeesData,
        safesData,
        safeTxsData
      ] = await Promise.all([
        db.getBranches(),
        db.getShipments(),
        db.getUsers(),
        db.getPayoutRequests(),
        db.getTransactionLog(),
        db.getDrivers(),
        db.getDriverSettlements(),
        db.getCityPricing(),
        db.getTickets(),
        db.getDashboardStats(),
        db.getEmployees(),
        db.getSafes(),
        db.getSafeTransactions()
      ]);

      setBranches(branchesData);
      setShipmentsList(shipmentsData);
      setMerchants(merchantsData);
      setPayoutRequests(payoutsData);
      setTransactionLog(txLogData);
      setDrivers(driversData);
      setDriverSettlements(settlementsData);
      setCityPricing(pricingData);
      setTickets(ticketsData);
      setDashboardStats(statsData);
      setEmployees(employeesData);
      setSafes(safesData);
      setSafeTransactions(safeTxsData);
    } catch (e) {
      console.error('Error refreshing data from Supabase:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAllData();
    const safetyTimer = setTimeout(() => setLoading(false), 1500);

    // Setup Supabase Realtime Subscription + High-Speed Hybrid Polling
    const fetchSoft = async () => {
      try {
        const [
          branchesData, shipmentsData, merchantsData, payoutsData, txLogData,
          driversData, settlementsData, pricingData, ticketsData, statsData, safesData, safeTxsData
        ] = await Promise.all([
          db.getBranches(), db.getShipments(), db.getUsers(), db.getPayoutRequests(), db.getTransactionLog(),
          db.getDrivers(), db.getDriverSettlements(), db.getCityPricing(), db.getTickets(), db.getDashboardStats(),
          db.getSafes(), db.getSafeTransactions()
        ]);
        setBranches(branchesData);
        setShipmentsList(shipmentsData);
        setMerchants(merchantsData);
        setPayoutRequests(payoutsData);
        setTransactionLog(txLogData);
        setDrivers(driversData);
        setDriverSettlements(settlementsData);
        setCityPricing(pricingData);
        setTickets(ticketsData);
        setDashboardStats(statsData);
        setSafes(safesData);
        setSafeTransactions(safeTxsData);
      } catch (e) {
        console.error('Error refreshing realtime data:', e);
      }
    };

    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        fetchSoft();
      })
      .subscribe();

    // 1-second high-speed hybrid polling loop for instant synchronization
    const pollInterval = setInterval(fetchSoft, 1000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('admin_theme', newTheme);
  };

  const toggleLang = () => {
    const newLang = lang === 'ar' ? 'en' : 'ar';
    setLang(newLang);
    localStorage.setItem('admin_lang', newLang);
  };

  // Wrapper actions that call Supabase and then refresh the local state silently for instant reflection
  const wrapAction = (actionFn) => async (...args) => {
    try {
      await actionFn(...args);
      const [
        branchesData, shipmentsData, merchantsData, payoutsData, txLogData,
        driversData, settlementsData, pricingData, ticketsData, statsData, employeesData,
        safesData, safeTxsData
      ] = await Promise.all([
        db.getBranches(), db.getShipments(), db.getUsers(), db.getPayoutRequests(), db.getTransactionLog(),
        db.getDrivers(), db.getDriverSettlements(), db.getCityPricing(), db.getTickets(), db.getDashboardStats(), db.getEmployees(),
        db.getSafes(), db.getSafeTransactions()
      ]);
      setBranches(branchesData);
      setShipmentsList(shipmentsData);
      setMerchants(merchantsData);
      setPayoutRequests(payoutsData);
      setTransactionLog(txLogData);
      setDrivers(driversData);
      setDriverSettlements(settlementsData);
      setCityPricing(pricingData);
      setTickets(ticketsData);
      setDashboardStats(statsData);
      setEmployees(employeesData);
      setSafes(safesData);
      setSafeTransactions(safeTxsData);
    } catch (e) {
      console.error('Error executing action:', e);
      throw e;
    }
  };

  const isWithinFilter = (dateStr) => {
    if (dateFilter === 'all') return true;
    if (!dateStr) return false;
    
    // In JavaScript, new Date("YYYY-MM-DD") might parse as UTC. 
    // It's safer to just compare parts or allow Date to handle it.
    const d = new Date(dateStr);
    const now = new Date();
    
    if (dateFilter === 'today') {
      return d.toDateString() === now.toDateString();
    }
    if (dateFilter === 'week') {
      const firstDay = new Date(now.setDate(now.getDate() - now.getDay()));
      firstDay.setHours(0,0,0,0);
      return d >= firstDay;
    }
    if (dateFilter === 'month') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    if (dateFilter === 'year') {
      return d.getFullYear() === now.getFullYear();
    }
    if (dateFilter === 'custom') {
      if (customDateRange.start) {
        const startD = new Date(customDateRange.start);
        startD.setHours(0,0,0,0);
        if (d < startD) return false;
      }
      if (customDateRange.end) {
        const endD = new Date(customDateRange.end);
        endD.setHours(23, 59, 59, 999);
        if (d > endD) return false;
      }
      return true;
    }
    return true;
  };

  // Determine effective isolated branch scope:
  // - Branch Admin / Branch Employee -> strictly locked to their branchId
  // - Super Admin -> defaults to 'MAIN' (HQ isolated from branches), or whichever branch they are currently previewing
  const isSuperAdmin = currentUser?.id === 'admin' || currentUser?.role === 'super_admin';
  const effectiveBranchId = isSuperAdmin
    ? (activeBranchFilter || 'MAIN')
    : (currentUser?.branchId || 'MAIN');

  const activeBranchObj = branches.find(b => b.id === effectiveBranchId) || null;

  const matchesActiveBranch = (itemBranchId) => {
    const bId = itemBranchId || 'MAIN';
    return bId === effectiveBranchId;
  };

  const scopedShipments = shipmentsList.filter(s => matchesActiveBranch(s.branchId));
  const scopedMerchants = merchants.filter(m => matchesActiveBranch(m.branchId));
  const scopedDrivers = drivers.filter(d => matchesActiveBranch(d.branchId));
  const scopedPayouts = payoutRequests.filter(p => matchesActiveBranch(p.branchId));
  const scopedTxLog = transactionLog.filter(tx => matchesActiveBranch(tx.branchId));
  const scopedSettlements = driverSettlements.filter(s => matchesActiveBranch(s.branchId));
  const scopedSafes = safes.filter(s => matchesActiveBranch(s.branchId));
  const scopedSafeIds = new Set(scopedSafes.map(s => s.id));
  const scopedSafeTransactions = safeTransactions.filter(tx => scopedSafeIds.has(tx.safeId));
  const scopedEmployees = employees.filter(e => matchesActiveBranch(e.branchId));

  const filteredShipments = scopedShipments.filter(s => isWithinFilter(s.created_at || s.createdAt || s.date));
  const filteredPayouts = scopedPayouts.filter(p => isWithinFilter(p.requested_at || p.requestedAt || p.date));
  const filteredTxLog = scopedTxLog.filter(tx => isWithinFilter(tx.date || tx.created_at));
  const filteredSettlements = scopedSettlements.filter(s => isWithinFilter(s.date || s.created_at));
  const filteredTickets = tickets.filter(t => isWithinFilter(t.created_at || t.createdAt || t.date));

  // Compute stats dynamically based on scoped & filtered data
  const deliveredShipments = filteredShipments.filter(s => s.status === 'Delivered' || s.status === 'تم التسليم' || s.status === 'تم التوصيل');
  const netCompanyProfitsVal = deliveredShipments.reduce((sum, s) => sum + Number(s.cod_fee || s.codFee || 0), 0);

  // Scoped 7-day daily revenue
  const nowDate = new Date();
  const scopedDailyRevenue = [0, 0, 0, 0, 0, 0, 0];
  deliveredShipments.forEach(s => {
    const sDate = s.createdAt ? new Date(s.createdAt) : nowDate;
    const diffDays = Math.floor((nowDate - sDate) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays < 7) {
      scopedDailyRevenue[6 - diffDays] += Number(s.codFee || 0) + Number(s.deliveryFee || 0);
    }
  });

  const computedStats = {
    total: filteredShipments.length,
    delivered: deliveredShipments.length,
    progress: filteredShipments.filter(s => s.status === 'Out for Delivery' || s.status === 'قيد التوصيل').length,
    warehouse: filteredShipments.filter(s => s.status === 'In Warehouse' || s.status === 'في المخزن' || s.status === 'Printed').length,
    registered: filteredShipments.filter(s => s.status === 'Registered' || s.status === 'قيد الانتظار').length,
    returned: filteredShipments.filter(s => s.status === 'Returned' || s.status === 'مرتجع').length,
    totalCodCollected: deliveredShipments.reduce((sum, s) => sum + Number(s.price || 0), 0),
    grossProfits: deliveredShipments.reduce((sum, s) => sum + Number(s.delivery_fee || s.deliveryFee || 0) + Number(s.cod_fee || s.codFee || 0), 0),
    netCompanyProfits: netCompanyProfitsVal,
    totalRevenue: netCompanyProfitsVal,
    pendingPayouts: filteredPayouts.filter(p => p.status === 'Pending').reduce((sum, p) => sum + Number(p.amount || 0), 0),
    totalMerchantBalance: scopedMerchants.reduce((sum, m) => sum + Number(m.walletBalance || 0), 0),
    driversPendingSettlement: scopedDrivers.reduce((sum, d) => sum + Number(d.pendingSettlement || 0), 0),
    activeDrivers: scopedDrivers.filter(d => d.active).length,
    dailyRevenue: scopedDailyRevenue,
    pendingPayoutsCount: filteredPayouts.filter(p => p.status === 'Pending').length,
  };

  return (
    <AppContext.Provider value={{
      theme,
      lang,
      toggleTheme,
      toggleLang,
      loading,

      // Date Filters
      dateFilter,
      setDateFilter,
      customDateRange,
      setCustomDateRange,

      // Auth & Employees
      currentUser,
      isSuperAdmin,
      login,
      logout: () => {
        setCurrentUser(null);
        setActiveBranchFilter('MAIN');
        localStorage.removeItem('vanex_current_user');
      },
      updateAdminData,
      getAdminData,
      employees: scopedEmployees,
      saveEmployee: wrapAction((emp) => db.saveEmployee({ ...emp, branchId: emp.branchId || effectiveBranchId })),
      deleteEmployee: wrapAction(db.deleteEmployee),

      // Multi-Branch State & Actions
      branches,
      activeBranchFilter,
      setActiveBranchFilter,
      effectiveBranchId,
      activeBranchObj,
      saveBranch: wrapAction(db.saveBranch),
      deleteBranch: wrapAction(db.deleteBranch),
      toggleBranchStatus: wrapAction(db.toggleBranchStatus),
      assignEntityToBranch: wrapAction(db.assignEntityToBranch),

      // Unfiltered Global Data (for Super Admin's Branches Manager Inspector)
      allShipments: shipmentsList,
      allMerchants: merchants,
      allDrivers: drivers,
      allPayouts: payoutRequests,
      allTransactions: transactionLog,
      allSettlements: driverSettlements,
      allSafes: safes,
      allSafeTransactions: safeTransactions,
      allEmployees: employees,

      // Scoped App States (Filtered by Active System / Branch + Date)
      shipmentsList: filteredShipments,
      merchants: scopedMerchants,
      payoutRequests: filteredPayouts,
      transactionLog: filteredTxLog,
      drivers: scopedDrivers,
      driverSettlements: filteredSettlements,
      cityPricing,
      tickets: filteredTickets,
      safes: scopedSafes,
      safeTransactions: scopedSafeTransactions,
      dashboardStats: computedStats,
      refreshAllData,

      // Global App Actions (Automatically Branch-Scoped)
      addShipment: wrapAction((data) => db.addShipment({
        ...data,
        branchId: data.branchId || effectiveBranchId,
        senderCity: data.senderCity || activeBranchObj?.city || 'طرابلس'
      })),
      editShipment: wrapAction(db.editShipment),
      deleteShipment: wrapAction(db.deleteShipment),
      updateShipmentStatus: wrapAction(db.updateShipmentStatus),
      assignDriverToShipment: wrapAction(db.assignDriverToShipment),
      recordWaybillPrinted: wrapAction(db.recordWaybillPrinted),
      addMerchant: wrapAction((data) => db.addMerchant({
        ...data,
        branchId: data.branchId || effectiveBranchId
      })),
      toggleUserVerification: wrapAction(db.toggleUserVerification),
      approvePayoutRequest: wrapAction((id, safeId) => {
        const defaultSafe = db.getBranchMainSafeId(effectiveBranchId);
        const resolvedSafe = (safeId && (effectiveBranchId === 'MAIN' || safeId !== 'SAFE-001')) ? safeId : defaultSafe;
        return db.approvePayoutRequest(id, resolvedSafe);
      }),
      rejectPayoutRequest: wrapAction(db.rejectPayoutRequest),
      manualCredit: wrapAction((merchantId, amount, description, type = 'payout', safeId) => {
        const defaultSafe = db.getBranchMainSafeId(effectiveBranchId);
        const resolvedSafe = (safeId && (effectiveBranchId === 'MAIN' || safeId !== 'SAFE-001')) ? safeId : defaultSafe;
        return db.manualCredit(merchantId, amount, description, type, resolvedSafe);
      }),
      addDriver: wrapAction((data) => db.addDriver({
        ...data,
        branchId: data.branchId || effectiveBranchId,
        zone: data.zone || activeBranchObj?.city || 'طرابلس'
      })),
      editDriver: wrapAction(db.editDriver),
      deleteDriver: wrapAction(db.deleteDriver),
      toggleDriverStatus: wrapAction(db.toggleDriverStatus),
      settleDriver: wrapAction((driverId, amount, note, safeId) => {
        const defaultSafe = db.getBranchMainSafeId(effectiveBranchId);
        const resolvedSafe = (safeId && (effectiveBranchId === 'MAIN' || safeId !== 'SAFE-001')) ? safeId : defaultSafe;
        return db.settleDriver(driverId, amount, note, resolvedSafe);
      }),
      updateCityFee: wrapAction(db.updateCityFee),
      toggleCityActive: wrapAction(db.toggleCityActive),
      addCity: wrapAction(db.addCity),
      deleteCity: wrapAction(db.deleteCity),
      addSafe: wrapAction((data) => db.addSafe({
        ...data,
        branchId: data.branchId || effectiveBranchId,
        branch: data.branch || activeBranchObj?.name || 'الفرع الرئيسي'
      })),
      updateSafe: wrapAction(db.updateSafe),
      deleteSafe: wrapAction(db.deleteSafe),
      recordSafeTransaction: wrapAction(db.recordSafeTransaction),
      transferBetweenSafes: wrapAction(db.transferBetweenSafes),
      resetSystemData: wrapAction(db.resetSystemData),
      updateTicketStatus: wrapAction(db.updateTicketStatus),
      addTicketReply: wrapAction(db.addTicketReply)
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

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

  // Restore Auth Session
  useEffect(() => {
    const savedUser = localStorage.getItem('vanex_current_user');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
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
      permissions: ['all']
    };
  };

  const login = async (phone, password) => {
    const emps = await db.getEmployees();
    const adminData = getAdminData();
    
    if (phone === adminData.phone && password === adminData.password) {
      setCurrentUser(adminData);
      localStorage.setItem('vanex_current_user', JSON.stringify(adminData));
      return { success: true };
    }
    const emp = emps.find(e => e.phone === phone && e.password === password);
    if (emp) {
      if (emp.isActive === false) {
        return { success: false, message: 'هذا الحساب موقوف، يرجى مراجعة إدارة النظام' };
      }
      setCurrentUser(emp);
      localStorage.setItem('vanex_current_user', JSON.stringify(emp));
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

    // Setup Supabase Realtime Subscription
    const channel = supabase.channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        console.log('Realtime change detected:', payload);
        // Silently refresh the dashboard without causing a full loading screen block
        // We will call a soft refresh that doesn't set setLoading(true)
        const fetchSoft = async () => {
          try {
            const [
              shipmentsData, merchantsData, payoutsData, txLogData,
              driversData, settlementsData, pricingData, ticketsData, statsData, safesData, safeTxsData
            ] = await Promise.all([
              db.getShipments(), db.getUsers(), db.getPayoutRequests(), db.getTransactionLog(),
              db.getDrivers(), db.getDriverSettlements(), db.getCityPricing(), db.getTickets(), db.getDashboardStats(),
              db.getSafes(), db.getSafeTransactions()
            ]);
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
        fetchSoft();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
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
        shipmentsData, merchantsData, payoutsData, txLogData,
        driversData, settlementsData, pricingData, ticketsData, statsData, employeesData,
        safesData, safeTxsData
      ] = await Promise.all([
        db.getShipments(), db.getUsers(), db.getPayoutRequests(), db.getTransactionLog(),
        db.getDrivers(), db.getDriverSettlements(), db.getCityPricing(), db.getTickets(), db.getDashboardStats(), db.getEmployees(),
        db.getSafes(), db.getSafeTransactions()
      ]);
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

  const filteredShipments = shipmentsList.filter(s => isWithinFilter(s.created_at || s.createdAt || s.date));
  const filteredPayouts = payoutRequests.filter(p => isWithinFilter(p.requested_at || p.requestedAt || p.date));
  const filteredTxLog = transactionLog.filter(tx => isWithinFilter(tx.date || tx.created_at));
  const filteredSettlements = driverSettlements.filter(s => isWithinFilter(s.date || s.created_at));
  const filteredTickets = tickets.filter(t => isWithinFilter(t.created_at || t.createdAt || t.date));

  // Compute stats dynamically based on filtered data
  const deliveredShipments = filteredShipments.filter(s => s.status === 'Delivered' || s.status === 'تم التوصيل');
  const computedStats = {
    total: filteredShipments.length,
    delivered: deliveredShipments.length,
    progress: filteredShipments.filter(s => s.status === 'Out for Delivery' || s.status === 'قيد التوصيل').length,
    warehouse: filteredShipments.filter(s => s.status === 'In Warehouse' || s.status === 'في المخزن').length,
    registered: filteredShipments.filter(s => s.status === 'Registered' || s.status === 'قيد الانتظار').length,
    returned: filteredShipments.filter(s => s.status === 'Returned' || s.status === 'مرتجع').length,
    totalCodCollected: deliveredShipments.reduce((sum, s) => sum + Number(s.price || 0), 0),
    grossProfits: deliveredShipments.reduce((sum, s) => sum + Number(s.delivery_fee || s.deliveryFee || 0) + Number(s.cod_fee || s.codFee || 0), 0),
    netCompanyProfits: deliveredShipments.reduce((sum, s) => sum + Number(s.cod_fee || s.codFee || 0), 0),
    pendingPayouts: filteredPayouts.filter(p => p.status === 'Pending').reduce((sum, p) => sum + Number(p.amount || 0), 0),
    totalMerchantBalance: dashboardStats.totalMerchantBalance, // keep global
    driversPendingSettlement: dashboardStats.driversPendingSettlement, // keep global
    activeDrivers: dashboardStats.activeDrivers,
    dailyRevenue: dashboardStats.dailyRevenue,
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
      login,
      logout,
      updateAdminData,
      getAdminData,
      employees,
      saveEmployee: wrapAction(db.saveEmployee),
      deleteEmployee: wrapAction(db.deleteEmployee),

      // Global App States (Filtered)
      shipmentsList: filteredShipments,
      merchants,
      payoutRequests: filteredPayouts,
      transactionLog: filteredTxLog,
      drivers,
      driverSettlements: filteredSettlements,
      cityPricing,
      tickets: filteredTickets,
      safes,
      safeTransactions,
      dashboardStats: computedStats,
      refreshAllData,

      // Global App Actions
      addShipment: wrapAction(db.addShipment),
      editShipment: wrapAction(db.editShipment),
      deleteShipment: wrapAction(db.deleteShipment),
      updateShipmentStatus: wrapAction(db.updateShipmentStatus),
      assignDriverToShipment: wrapAction(db.assignDriverToShipment),
      recordWaybillPrinted: wrapAction(db.recordWaybillPrinted),
      toggleUserVerification: wrapAction(db.toggleUserVerification),
      approvePayoutRequest: wrapAction(db.approvePayoutRequest),
      rejectPayoutRequest: wrapAction(db.rejectPayoutRequest),
      manualCredit: wrapAction(db.manualCredit),
      addDriver: wrapAction(db.addDriver),
      editDriver: wrapAction(db.editDriver),
      deleteDriver: wrapAction(db.deleteDriver),
      toggleDriverStatus: wrapAction(db.toggleDriverStatus),
      settleDriver: wrapAction(db.settleDriver),
      updateCityFee: wrapAction(db.updateCityFee),
      toggleCityActive: wrapAction(db.toggleCityActive),
      addCity: wrapAction(db.addCity),
      deleteCity: wrapAction(db.deleteCity),
      addSafe: wrapAction(db.addSafe),
      updateSafe: wrapAction(db.updateSafe),
      deleteSafe: wrapAction(db.deleteSafe),
      recordSafeTransaction: wrapAction(db.recordSafeTransaction),
      transferBetweenSafes: wrapAction(db.transferBetweenSafes),
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

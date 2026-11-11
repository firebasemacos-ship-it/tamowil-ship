'use client';
import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import Login from '@/components/Login';
import EmployeesManager from '@/components/EmployeesManager';
import Sidebar from '@/components/Sidebar';
import Overview      from '@/components/Overview';
import ShipmentsTable from '@/components/ShipmentsTable';
import MerchantsList  from '@/components/MerchantsList';
import TicketsList    from '@/components/TicketsList';
import WalletManager  from '@/components/WalletManager';
import DriversManager from '@/components/DriversManager';
import PricingManager from '@/components/PricingManager';
import ReportsView    from '@/components/ReportsView';
import SafesManager  from '@/components/SafesManager';
import SystemLogView from '@/components/SystemLogView';
import BranchesManager from '@/components/BranchesManager';
import GlobalDateFilter from '@/components/GlobalDateFilter';

export default function AdminPage() {
  const { currentUser, isSuperAdmin, activeBranchFilter, setActiveBranchFilter, activeBranchObj, loading } = useApp();
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem('admin_active_tab');
    if (saved !== null) {
      setActiveTab(parseInt(saved, 10));
    }
  }, []);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    localStorage.setItem('admin_active_tab', tabId);
  };

  // Set default active tab based on permissions if the default (0 - overview) is not allowed
  useEffect(() => {
    if (currentUser && currentUser.permissions && !currentUser.permissions.includes('all')) {
      const allowedViews = [
        { id: 0, perm: 'overview' },
        { id: 1, perm: 'shipments' },
        { id: 2, perm: 'wallet' },
        { id: 3, perm: 'drivers' },
        { id: 4, perm: 'merchants' },
        { id: 5, perm: 'tickets' },
        { id: 6, perm: 'pricing' },
        { id: 7, perm: 'reports' },
        { id: 8, perm: 'safes' },
        { id: 9, perm: 'employees' },
        { id: 10, perm: 'logs' }
      ];
      if (!currentUser.permissions.includes('overview')) {
        const firstAllowed = allowedViews.find(v => currentUser.permissions.includes(v.perm));
        if (firstAllowed && activeTab === 0 && !localStorage.getItem('admin_active_tab')) {
          handleTabChange(firstAllowed.id);
        }
      }
    }
  }, [currentUser, activeTab]);

  if (loading) {
    return (
      <div className="flex flex-col h-screen items-center justify-center" style={{ backgroundColor: 'var(--bg-color)' }}>
        <div className="relative flex items-center justify-center mb-6">
          <div className="w-16 h-16 border-4 border-slate-200 dark:border-slate-800 border-t-[var(--primary-color)] rounded-full animate-spin" style={{ borderTopColor: 'var(--primary-color)' }}></div>
          <div className="absolute">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                <line x1="12" y1="22.08" x2="12" y2="12"></line>
             </svg>
          </div>
        </div>
        <div className="font-bold tracking-wide animate-pulse" style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>
          جاري التحميل...
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }


  const views = [
    <Overview />,
    <ShipmentsTable />,
    <WalletManager />,
    <DriversManager />,
    <MerchantsList />,
    <TicketsList />,
    <PricingManager />,
    <ReportsView />,
    <SafesManager />,
    <EmployeesManager />,
    <SystemLogView />,
    <BranchesManager />
  ];

  return (
    <div className="dashboard-layout" style={{ flexDirection: 'row' }}>
      {/* Main content first in HTML = left side */}
      <main className="main-content">
        {isSuperAdmin && activeBranchFilter !== 'MAIN' && activeBranchObj && (
          <div style={{
            marginBottom: '16px', padding: '12px 20px', borderRadius: '14px',
            background: 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(16,185,129,0.12))',
            border: '1px solid rgba(99,102,241,0.4)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px'
          }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary)' }}>
              🏢 أنت تتصفح الآن البيانات المعزولة الخاصة بـ: <span style={{ color: '#10B981' }}>{activeBranchObj.name}</span> (جميع الأقسام تعرض معاملات هذا الفرع فقط)
            </div>
            <button
              onClick={() => setActiveBranchFilter('MAIN')}
              style={{
                padding: '7px 16px', borderRadius: '10px', border: 'none',
                background: '#F59E0B', color: '#fff', fontWeight: 800, fontSize: '12px', cursor: 'pointer'
              }}
            >
              ↩ العودة لنظامك الرئيسي المستقل (المركز)
            </button>
          </div>
        )}
        {currentUser?.role === 'branch_admin' && (
          <div style={{
            marginBottom: '16px', padding: '10px 18px', borderRadius: '14px',
            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#10B981' }}>
              🏢 نظام الفرع المستقل: {currentUser.branchName} ({currentUser.city})
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
              بيئة عمل وتسويات وخزائن خاصة بالفرع
            </span>
          </div>
        )}
        <GlobalDateFilter />
        {views[activeTab] ?? <Overview />}
      </main>
      {/* Sidebar last in HTML = right side */}
      <Sidebar activeTab={activeTab} setActiveTab={handleTabChange} />
    </div>
  );
}

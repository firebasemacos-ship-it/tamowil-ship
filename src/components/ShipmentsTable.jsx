'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';

/* ─────────────────────────────────────────────
   Reusable sub-components (internal)
───────────────────────────────────────────── */

function IconBox({ color, children }) {
  return (
    <div style={{
      width: 30, height: 30, borderRadius: 8,
      background: `${color}18`,
      border: `1px solid ${color}30`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color, flexShrink: 0,
    }}>
      {children}
    </div>
  );
}

function InfoRow({ label, value, mono = false, wrap = false }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: wrap ? 'column' : 'row',
      justifyContent: 'space-between',
      alignItems: wrap ? 'flex-start' : 'center',
      padding: '9px 0',
      borderBottom: '1px solid var(--glass-border)',
      gap: wrap ? 4 : 8,
    }}>
      <span style={{
        fontSize: 11, fontWeight: 600,
        color: 'var(--text-tertiary)',
        whiteSpace: 'nowrap', flexShrink: 0,
      }}>
        {label}
      </span>
      <span style={{
        fontSize: 13, fontWeight: 700,
        color: 'var(--text-primary)',
        textAlign: 'end',
        fontFamily: mono ? 'monospace' : 'inherit',
        wordBreak: wrap ? 'break-word' : 'normal',
        maxWidth: wrap ? '100%' : '60%',
      }}>
        {value || '—'}
      </span>
    </div>
  );
}

function InfoCard({ title, color, icon, rows }) {
  return (
    <div style={{
      background: 'var(--glass-bg)',
      border: '1px solid var(--glass-border)',
      borderRadius: 14,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '10px 14px',
        background: `${color}12`,
        borderBottom: `1px solid ${color}25`,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <IconBox color={color}>{icon}</IconBox>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{title}</span>
      </div>
      <div style={{ padding: '4px 14px 8px' }}>
        {rows.map((r, i) => (
          <InfoRow key={i} label={r.label} value={r.value} mono={r.mono} wrap={r.wrap} />
        ))}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
export default function ShipmentsTable() {
  const { lang, shipmentsList, merchants, updateShipmentStatus, addShipment, editShipment, deleteShipment, assignDriverToShipment, drivers, cityPricing, theme } = useApp();
  const isAr = lang === 'ar';
  const isDark = theme === 'dark';

  const [selectedShipment, setSelectedShipment] = useState(null);
  const [selectedForBulk, setSelectedForBulk] = useState([]);
  const [searchQuery, setSearchQuery]   = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [cityFilter, setCityFilter]     = useState('All');
  const [showCreate, setShowCreate]     = useState(false);
  const [merchantSearchQuery, setMerchantSearchQuery] = useState('');
  const [isMerchantDropdownOpen, setIsMerchantDropdownOpen] = useState(false);
  const [printType, setPrintType] = useState('manifest'); // 'manifest' | 'waybill'
  const [deletingTracking, setDeletingTracking] = useState(null);

  const filteredMerchants = merchants.filter(m => 
    (m.storeName && m.storeName.toLowerCase().includes(merchantSearchQuery.toLowerCase())) ||
    (m.name && m.name.toLowerCase().includes(merchantSearchQuery.toLowerCase()))
  );

  const [createForm, setCreateForm] = useState({
    senderName: '', senderPhone: '', senderCity: '',
    receiverName: '', receiverPhone: '', receiverCity: '',
    productPrice: '', deliveryFee: '', codFee: '0', merchantId: '',
    deliveryChargeOn: 'المستلم', freeService: false
  });

  const [updatingTracking, setUpdatingTracking] = useState(null);
  const [newStatus, setNewStatus]               = useState('');
  const [updateLocation, setUpdateLocation]     = useState('');
  const [updateDetailsAr, setUpdateDetailsAr]   = useState('');
  const [updateDetailsEn, setUpdateDetailsEn]   = useState('');

  const [showEdit, setShowEdit] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [bulkDriverId, setBulkDriverId] = useState('');
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkNote, setBulkNote] = useState('');
  const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
  const [bulkInputTrackings, setBulkInputTrackings] = useState('');

  const handleBulkStatusUpdate = async () => {
    if (!bulkStatus || selectedForBulk.length === 0) return;
    const count = selectedForBulk.length;
    const noteText = bulkNote.trim() 
      ? bulkNote.trim() 
      : (isAr ? `تحديث جماعي للحالة إلى ${statusLabel(bulkStatus)}` : `Bulk status update to ${bulkStatus}`);
    
    for (const tracking of selectedForBulk) {
      await updateShipmentStatus(
        tracking,
        bulkStatus,
        'مركز العمليات الرئيسي',
        noteText,
        noteText
      );
    }
    setSelectedForBulk([]);
    setBulkStatus('');
    setBulkNote('');
  };
  const [bulkSelectedStatus, setBulkSelectedStatus] = useState('In Warehouse');
  const [isProcessingBulkModal, setIsProcessingBulkModal] = useState(false);

  const [customStatusesList, setCustomStatusesList] = useState([
    { key: 'Registered', ar: 'مسجلة', en: 'Registered' },
    { key: 'In Warehouse', ar: 'في المستودع', en: 'In Warehouse' },
    { key: 'Out for Delivery', ar: 'خارج للتوصيل', en: 'Out for Delivery' },
    { key: 'Delivered', ar: 'تم التسليم', en: 'Delivered' },
    { key: 'Returned', ar: 'مرتجعة', en: 'Returned' },
    { key: 'Cancelled', ar: 'ملغاة', en: 'Cancelled' },
  ]);

  useEffect(() => {
    const saved = localStorage.getItem('vanex_custom_statuses_list');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setCustomStatusesList(parsed);
        }
      } catch (e) {}
    }
  }, []);

  const [showAddCustomStatusModal, setShowAddCustomStatusModal] = useState(false);
  const [newCustomStatusAr, setNewCustomStatusAr] = useState('');
  const [newCustomStatusEn, setNewCustomStatusEn] = useState('');

  const handleSaveCustomStatus = () => {
    if (!newCustomStatusAr.trim()) return;
    const keyName = newCustomStatusEn.trim() || newCustomStatusAr.trim();
    const newEntry = {
      key: keyName,
      ar: newCustomStatusAr.trim(),
      en: newCustomStatusEn.trim() || newCustomStatusAr.trim()
    };
    const updated = [...customStatusesList, newEntry];
    setCustomStatusesList(updated);
    localStorage.setItem('vanex_custom_statuses_list', JSON.stringify(updated));
    setNewCustomStatusAr('');
    setNewCustomStatusEn('');
    setShowAddCustomStatusModal(false);
    alert(isAr ? `تمت إضافة حالة الشحنة الجديدة (${newEntry.ar}) وحفظها بالنظام!` : `Added new status (${newEntry.en})!`);
  };

  const handleExecuteModalBulkUpdate = async () => {
    let targets = [];
    if (bulkInputTrackings.trim()) {
      targets = bulkInputTrackings.split(/[\n, ]+/).map(t => t.trim().toUpperCase()).filter(Boolean);
    } else if (selectedForBulk.length > 0) {
      targets = [...selectedForBulk];
    } else {
      targets = filteredShipments.map(s => s.trackingNumber);
    }

    if (targets.length === 0) {
      alert(isAr ? 'لا توجد شحنات محددة لتحديث حالتها!' : 'No shipments targeted!');
      return;
    }

    setIsProcessingBulkModal(true);
    let updatedCount = 0;
    for (const tracking of targets) {
      try {
        await updateShipmentStatus(
          tracking,
          bulkSelectedStatus,
          'Sorting Hub',
          `تحديث جماعي للحالة إلى ${bulkSelectedStatus}`,
          `Bulk status update to ${bulkSelectedStatus}`
        );
        updatedCount++;
      } catch (err) {
        console.error(`Error bulk updating ${tracking}:`, err);
      }
    }
    setIsProcessingBulkModal(false);
    setShowBulkStatusModal(false);
    setBulkInputTrackings('');
    setSelectedForBulk([]);
  };

  const handleToggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedForBulk(filteredShipments.map(s => s.trackingNumber));
    } else {
      setSelectedForBulk([]);
    }
  };

  const handleToggleSelect = (trackingNumber) => {
    setSelectedForBulk(prev => 
      prev.includes(trackingNumber) 
        ? prev.filter(t => t !== trackingNumber)
        : [...prev, trackingNumber]
    );
  };

  const handleDelete = (trackingNumber) => {
    setDeletingTracking(trackingNumber);
  };

  const confirmDelete = () => {
    if (deletingTracking) {
      deleteShipment(deletingTracking);
      setDeletingTracking(null);
    }
  };

  const handleOpenEdit = (shipment) => {
    setEditForm({
      trackingNumber: shipment.trackingNumber,
      senderName: shipment.senderName,
      senderPhone: shipment.senderPhone,
      senderCity: shipment.senderCity,
      receiverName: shipment.receiverName,
      receiverPhone: shipment.receiverPhone,
      receiverCity: shipment.receiverCity,
      price: shipment.price,
      deliveryFee: shipment.deliveryFee,
      codFee: shipment.codFee
    });
    setShowEdit(true);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editForm) return;
    editShipment(editForm.trackingNumber, editForm);
    setShowEdit(false);
    setEditForm(null);
  };

  const handleBulkAssign = () => {
    if (!bulkDriverId || selectedForBulk.length === 0) return;
    selectedForBulk.forEach(tracking => {
      assignDriverToShipment(tracking, bulkDriverId);
    });
    setSelectedForBulk([]);
    setBulkDriverId('');
    alert(isAr ? 'تم الإسناد بنجاح' : 'Assigned successfully');
  };

  const handlePrintManifest = () => {
    setPrintType('manifest');
    setTimeout(() => window.print(), 100);
  };

  const handlePrintWaybill = () => {
    setPrintType('waybill');
    setTimeout(() => {
      if (window.JsBarcode && selectedShipment) {
        window.JsBarcode("#barcode", selectedShipment.trackingNumber, {
          format: "CODE128",
          width: 2,
          height: 80,
          displayValue: false
        });
      }
      setTimeout(() => window.print(), 100);
    }, 100);
  };


  const statusLabel = (status) => {
    if (!status) return '';
    const match = customStatusesList.find(c => c.key === status || c.ar === status || c.en === status);
    if (match) return isAr ? match.ar : match.en;
    if (isAr) {
      if (status === 'Registered') return 'مسجلة';
      if (status === 'In Warehouse') return 'في المستودع';
      if (status === 'Out for Delivery') return 'خارج للتوصيل';
      if (status === 'Returned') return 'مرتجعة';
      if (status === 'Cancelled') return 'ملغاة';
      if (status === 'Delivered') return 'تم التسليم';
    }
    return status;
  };

  const filteredShipments = shipmentsList.filter(s => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      s.trackingNumber.toLowerCase().includes(q) ||
      s.senderName.toLowerCase().includes(q) ||
      s.receiverName.toLowerCase().includes(q) ||
      (s.receiverCity && s.receiverCity.toLowerCase().includes(q)) ||
      (s.senderCity && s.senderCity.toLowerCase().includes(q)) ||
      (s.status && s.status.toLowerCase().includes(q)) ||
      (statusLabel(s.status) && statusLabel(s.status).toLowerCase().includes(q));
    const matchStatus = statusFilter === 'All' || s.status === statusFilter;
    const matchCity   = cityFilter   === 'All' || s.receiverCity === cityFilter;
    return matchSearch && matchStatus && matchCity;
  });

  const handleOpenStatusUpdate = (shipment) => {
    setUpdatingTracking(shipment.trackingNumber);
    let nextStatus = '', defaultLoc = '', defaultAr = '', defaultEn = '';
    if (shipment.status === 'Registered') {
      nextStatus = 'In Warehouse'; defaultLoc = 'مركز الفرز الرئيسي';
      defaultAr = 'تم استقبال الشحنة في المستودع وجاري التجهيز للشحن';
      defaultEn = 'Shipment received at warehouse and preparing for transit';
    } else if (shipment.status === 'In Warehouse') {
      nextStatus = 'Out for Delivery'; defaultLoc = `${shipment.receiverCity} Hub`;
      defaultAr = 'الشحنة خارج للتوصيل الآن مع مندوب المنطقة';
      defaultEn = 'Shipment is out for delivery with local courier';
    } else if (shipment.status === 'Out for Delivery') {
      nextStatus = 'Delivered'; defaultLoc = shipment.receiverCity;
      defaultAr = 'تم تسليم الشحنة للمستلم بنجاح وتحصيل المبلغ';
      defaultEn = 'Shipment delivered successfully and cash collected';
    }
    setNewStatus(nextStatus);
    setUpdateLocation(defaultLoc);
    setUpdateDetailsAr(defaultAr);
    setUpdateDetailsEn(defaultEn);
  };

  useEffect(() => {
    if (selectedShipment) {
      const updated = shipmentsList.find(s => s.trackingNumber === selectedShipment.trackingNumber);
      if (updated) setSelectedShipment(updated);
    }
  }, [shipmentsList]);

  const handleSaveStatusUpdate = (e) => {
    e.preventDefault();
    if (!updateLocation || !updateDetailsAr || !updateDetailsEn) return;
    updateShipmentStatus(updatingTracking, newStatus, updateLocation, updateDetailsAr, updateDetailsEn);
    setUpdatingTracking(null);
  };

  function handleCreateShipment(e) {
    const productVal = Number(createForm.productPrice || 0);
    const deliveryVal = Number(createForm.deliveryFee || 0);
    const codVal = Number(createForm.codFee || 0);
    let totalPrice = 0;
    if (createForm.freeService) {
      totalPrice = 0;
    } else if (createForm.deliveryChargeOn === 'المستلم') {
      totalPrice = productVal + deliveryVal + codVal;
    } else {
      totalPrice = productVal;
    }
    
    addShipment({ ...createForm, productPrice: productVal, price: totalPrice, deliveryFee: deliveryVal, codFee: codVal });
    setCreateForm({ senderName: '', senderPhone: '', senderCity: '', receiverName: '', receiverPhone: '', receiverCity: '', productPrice: '', deliveryFee: '', codFee: '0', merchantId: '', deliveryChargeOn: 'المستلم', freeService: false });
    setShowCreate(false);
  }


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="title-large">{isAr ? 'إدارة عمليات الشحن' : 'Manage Shipments'}</h1>
          <p className="subtitle">
            {isAr ? 'مراجعة وتعديل حالات الشحنات المسجلة وتحديث سجل التتبع الخاص بها.' : 'Review, update registered shipment states, and check tracking histories.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className="glass-button" style={{ backgroundColor: 'rgba(99, 102, 241, 0.18)', borderColor: 'rgba(99, 102, 241, 0.4)', color: '#818CF8', fontWeight: 'bold' }} onClick={() => setShowAddCustomStatusModal(true)}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
            {isAr ? '➕ إضافة حالة جديدة' : '➕ Add Custom Status'}
          </button>
          <button className="glass-button" onClick={() => setShowCreate(true)}>
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
            {isAr ? 'إنشاء شحنة يدوياً' : 'Create Shipment'}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <input type="text" className="glass-input"
            placeholder={isAr ? 'ابحث برقم التتبع، المرسل، المدينة، أو الحالة...' : 'Search by tracking, sender, city, or status...'}
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <select className="glass-input" style={{ width: 160 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="All">{isAr ? 'كل الحالات' : 'All Statuses'}</option>
            {customStatusesList.map(st => (
              <option key={st.key} value={st.key}>{isAr ? st.ar : st.en}</option>
            ))}
          </select>
          <select className="glass-input" style={{ width: 150 }} value={cityFilter} onChange={e => setCityFilter(e.target.value)}>
            <option value="All">{isAr ? 'كل المدن' : 'All Cities'}</option>
            <option value="طرابلس">{isAr ? 'طرابلس' : 'Tripoli'}</option>
            <option value="بنغازي">{isAr ? 'بنغازي' : 'Benghazi'}</option>
            <option value="مصراتة">{isAr ? 'مصراتة' : 'Misrata'}</option>
            <option value="سبها">{isAr ? 'سبها' : 'Sebha'}</option>
            <option value="غريان">{isAr ? 'غريان' : 'Gharyan'}</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedForBulk.length > 0 && (
        <div className="glass-card flex items-center justify-between" style={{ padding: '12px 20px', background: 'rgba(20, 184, 166, 0.1)', border: '1px solid rgba(20, 184, 166, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {isAr ? `تم تحديد ${selectedForBulk.length} شحنة` : `${selectedForBulk.length} shipments selected`}
            </span>
            <button onClick={handlePrintManifest} className="text-xs px-3 py-1.5 rounded-lg border font-semibold cursor-pointer" style={{ backgroundColor: '#6366F1', borderColor: 'transparent', color: '#FFF' }}>
              {isAr ? <span style={{display: 'flex', gap: '4px', alignItems: 'center'}}><svg width='16' height='16' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' viewBox='0 0 24 24'><polyline points='6 9 6 2 18 2 18 9'/><path d='M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2'/><rect x='6' y='14' width='12' height='8'/></svg> طباعة المانيفست</span> : <span style={{display: 'flex', gap: '4px', alignItems: 'center'}}><svg width='16' height='16' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round' viewBox='0 0 24 24'><polyline points='6 9 6 2 18 2 18 9'/><path d='M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2'/><rect x='6' y='14' width='12' height='8'/></svg> Print Manifest</span>}
            </button>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {/* Bulk Status Update */}
            <select className="glass-input" style={{ width: 140, padding: '6px 10px', fontSize: 12 }} value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}>
              <option value="">{isAr ? 'تغيير الحالة...' : 'Change status...'}</option>
              {customStatusesList.map(st => (
                <option key={st.key} value={st.key}>{isAr ? st.ar : st.en}</option>
              ))}
            </select>
            <input
              type="text"
              className="glass-input"
              style={{ width: 200, padding: '6px 10px', fontSize: 12 }}
              placeholder={isAr ? 'ملاحظة التحديث (اختياري)...' : 'Update note (optional)...'}
              value={bulkNote}
              onChange={e => setBulkNote(e.target.value)}
            />
            <button onClick={handleBulkStatusUpdate} className="text-xs px-3 py-1.5 rounded-lg border font-semibold cursor-pointer" style={{ backgroundColor: '#10B981', borderColor: 'transparent', color: '#FFF' }}>
              {isAr ? 'تحديث الحالة' : 'Update Status'}
            </button>

            {/* Bulk Driver Assign */}
            <select className="glass-input" style={{ width: 140, padding: '6px 10px', fontSize: 12 }} value={bulkDriverId} onChange={e => setBulkDriverId(e.target.value)}>
              <option value="">{isAr ? 'اختر مندوباً...' : 'Select driver...'}</option>
              {drivers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <button onClick={handleBulkAssign} className="text-xs px-3 py-1.5 rounded-lg border font-semibold cursor-pointer" style={{ backgroundColor: 'var(--primary-color)', borderColor: 'transparent', color: '#FFF' }}>
              {isAr ? 'إسناد للمندوب' : 'Assign Driver'}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="glass-card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th style={{ width: 40 }}>
                <input type="checkbox" onChange={handleToggleSelectAll} checked={filteredShipments.length > 0 && selectedForBulk.length === filteredShipments.length} />
              </th>
              <th>{isAr ? 'رقم التتبع' : 'Tracking Number'}</th>
              <th>{isAr ? 'التاجر (المرسل)' : 'Merchant (Sender)'}</th>
              <th>{isAr ? 'المستلم' : 'Recipient'}</th>
              <th>{isAr ? 'المدينة' : 'Destination'}</th>
              <th>{isAr ? 'القيمة الكلية' : 'COD Amount'}</th>
              <th>{isAr ? 'الحالة' : 'Status'}</th>
              <th>{isAr ? 'الإجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {filteredShipments.map(shipment => (
              <tr key={shipment.trackingNumber}>
                <td>
                  <input type="checkbox" checked={selectedForBulk.includes(shipment.trackingNumber)} onChange={() => handleToggleSelect(shipment.trackingNumber)} />
                </td>
                <td
                  className="font-bold cursor-pointer hover:underline"
                  style={{ color: 'var(--primary-color)' }}
                  onClick={() => setSelectedShipment(shipment)}
                >
                  {shipment.trackingNumber}
                </td>
                <td>
                  <div className="font-semibold">{shipment.senderName}</div>
                  <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{shipment.senderPhone}</div>
                </td>
                <td>
                  <div className="font-semibold">{shipment.receiverName}</div>
                  <div className="text-[10px]" style={{ color: 'var(--text-tertiary)' }}>{shipment.receiverPhone}</div>
                </td>
                <td>{shipment.receiverCity}</td>
                <td className="font-semibold">{shipment.price} د.ل</td>
                <td>
                  <span className={`badge badge-${shipment.status.toLowerCase().replace(/\s+/g, '')}`}>
                    {statusLabel(shipment.status)}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {shipment.status !== 'Delivered' && (
                      <button onClick={() => handleOpenStatusUpdate(shipment)} className="text-xs px-2 py-1 rounded-lg border font-semibold cursor-pointer" style={{ backgroundColor: 'var(--primary-color)', borderColor: 'transparent', color: '#FFF' }}>
                        {isAr ? 'الحالة' : 'Status'}
                      </button>
                    )}
                    <button onClick={() => handleOpenEdit(shipment)} className="text-xs px-2 py-1 rounded-lg border font-semibold cursor-pointer" style={{ backgroundColor: 'rgba(99,102,241,0.1)', borderColor: 'rgba(99,102,241,0.3)', color: '#6366F1' }}>
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                    <button onClick={() => handleDelete(shipment.trackingNumber)} className="text-xs px-2 py-1 rounded-lg border font-semibold cursor-pointer" style={{ backgroundColor: 'rgba(239,68,68,0.1)', borderColor: 'rgba(239,68,68,0.3)', color: '#EF4444' }}>
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredShipments.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center py-8 font-semibold" style={{ color: 'var(--text-secondary)' }}>
                  {isAr ? 'لا توجد شحنات تطابق الفلاتر المحددة.' : 'No shipments match current filters.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Status Update Modal — Professional Redesign */}
      {updatingTracking && (() => {
        const statusColors = {
          'In Warehouse':    { color: isDark ? '#60A5FA' : '#2563EB', bg: isDark ? 'rgba(96,165,250,0.1)' : 'rgba(37,99,235,0.1)',  border: isDark ? 'rgba(96,165,250,0.3)' : 'rgba(37,99,235,0.3)'  },
          'Out for Delivery':{ color: isDark ? '#FBBF24' : '#D97706', bg: isDark ? 'rgba(251,191,36,0.1)' : 'rgba(217,119,6,0.1)',  border: isDark ? 'rgba(251,191,36,0.3)' : 'rgba(217,119,6,0.3)'  },
          'Delivered':       { color: isDark ? '#34D399' : '#059669', bg: isDark ? 'rgba(52,211,153,0.1)' : 'rgba(5,150,105,0.1)',  border: isDark ? 'rgba(52,211,153,0.3)' : 'rgba(5,150,105,0.3)'  },
        };
        const sc = statusColors[newStatus] || { color: isDark ? 'var(--primary-color)' : '#0F766E', bg: 'rgba(20,184,166,0.08)', border: 'rgba(20,184,166,0.25)' };
        const statusIcon = newStatus === 'In Warehouse'
          ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          : newStatus === 'Out for Delivery'
          ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
          : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>;

        return (
          <div className="modal-overlay" onClick={() => setUpdatingTracking(null)}>
            <div
              onClick={e => e.stopPropagation()}
              dir={isAr ? 'rtl' : 'ltr'}
              style={{
                background: isDark ? 'linear-gradient(160deg, rgba(13,18,38,0.98) 0%, rgba(8,12,28,0.99) 100%)' : 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: 20,
                boxShadow: isDark ? '0 32px 64px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.05)' : '0 32px 64px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.5)',
                backdropFilter: 'blur(40px)',
                width: '92vw',
                maxWidth: 520,
                overflow: 'hidden',
              }}
            >
              {/* ── HEADER ── */}
              <div style={{
                padding: '18px 24px',
                background: 'linear-gradient(90deg, rgba(20,184,166,0.1) 0%, transparent 70%)',
                borderBottom: '1px solid var(--glass-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {/* Icon */}
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(20,184,166,0.12)', border: '1px solid rgba(20,184,166,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#14B8A6' }}>
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
                      {isAr ? 'تحديث حالة الشحنة' : 'Update Shipment Status'}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'monospace', marginTop: 1 }}>
                      {updatingTracking}
                    </div>
                  </div>
                </div>
                <button onClick={() => setUpdatingTracking(null)} style={{
                  width: 30, height: 30, borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', flexShrink: 0,
                }}>
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>

              {/* ── BODY ── */}
              <form onSubmit={handleSaveStatusUpdate} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* New Status Display */}
                <div style={{ background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: `${sc.color}18`, border: `1px solid ${sc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: sc.color, flexShrink: 0 }}>
                    {statusIcon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: sc.color, fontWeight: 600, opacity: 0.75, marginBottom: 2 }}>
                      {isAr ? 'الحالة الجديدة (اختر لتعديلها)' : 'Target Status (Select to change)'}
                    </div>
                    <select 
                      value={newStatus}
                      onChange={(e) => {
                        const s = e.target.value;
                        setNewStatus(s);
                        const city = shipmentsList.find(x => x.trackingNumber === updatingTracking)?.receiverCity || '';
                        if (s === 'Registered') {
                          setUpdateLocation('مركز الفرز الرئيسي');
                          setUpdateDetailsAr('تم تسجيل الشحنة وقيد التجهيز');
                          setUpdateDetailsEn('Shipment registered and processing');
                        } else if (s === 'In Warehouse') {
                          setUpdateLocation('مركز الفرز الرئيسي');
                          setUpdateDetailsAr('تم استقبال الشحنة في المستودع وجاري التجهيز للشحن');
                          setUpdateDetailsEn('Shipment received at warehouse and preparing for transit');
                        } else if (s === 'Out for Delivery') {
                          setUpdateLocation(`${city} Hub`);
                          setUpdateDetailsAr('الشحنة خارج للتوصيل الآن مع مندوب المنطقة');
                          setUpdateDetailsEn('Shipment is out for delivery with local courier');
                        } else if (s === 'Delivered') {
                          setUpdateLocation(city);
                          setUpdateDetailsAr('تم تسليم الشحنة للمستلم بنجاح وتحصيل المبلغ');
                          setUpdateDetailsEn('Shipment delivered successfully and cash collected');
                        } else if (s === 'Returned') {
                          setUpdateLocation('مركز الفرز الرئيسي');
                          setUpdateDetailsAr('تم إرجاع الشحنة');
                          setUpdateDetailsEn('Shipment returned');
                        }
                      }}
                      style={{ background: 'transparent', border: 'none', color: sc.color, fontWeight: 800, fontSize: 13, outline: 'none', cursor: 'pointer', width: '100%', appearance: 'auto', padding: 0 }}
                    >
                      <option value="Registered" style={{ color: isDark ? '#000' : 'inherit' }}>{isAr ? 'مسجلة (قيد التجهيز)' : 'Registered (Processing)'}</option>
                      <option value="In Warehouse" style={{ color: isDark ? '#000' : 'inherit' }}>{isAr ? 'في المستودع' : 'In Warehouse'}</option>
                      <option value="Out for Delivery" style={{ color: isDark ? '#000' : 'inherit' }}>{isAr ? 'مع المندوب (خارج للتوصيل)' : 'Out for Delivery (With Driver)'}</option>
                      <option value="Delivered" style={{ color: isDark ? '#000' : 'inherit' }}>{isAr ? 'تم التسليم' : 'Delivered'}</option>
                      <option value="Returned" style={{ color: isDark ? '#000' : 'inherit' }}>{isAr ? 'مرتجع' : 'Returned'}</option>
                    </select>
                  </div>
                </div>

                {/* Location Field */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 7 }}>
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    {isAr ? 'الموقع الحالي للتحديث' : 'Current Location'}
                  </label>
                  <input
                    type="text" required className="glass-input"
                    placeholder={isAr ? 'مثال: مركز الفرز — طرابلس' : 'e.g. Tripoli Sorting Facility'}
                    value={updateLocation}
                    onChange={e => setUpdateLocation(e.target.value)}
                    style={{ width: '100%', color: 'var(--text-primary)' }}
                  />
                </div>

                {/* Arabic Details */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 7 }}>
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    {isAr ? 'تفاصيل التتبع — عربي' : 'Tracking Details — Arabic'}
                    <span style={{ marginRight: 'auto', fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 400 }}>AR</span>
                  </label>
                  <textarea
                    required rows="2" className="glass-input"
                    value={updateDetailsAr}
                    onChange={e => setUpdateDetailsAr(e.target.value)}
                    style={{ width: '100%', resize: 'vertical', direction: 'rtl', color: 'var(--text-primary)' }}
                  />
                </div>

                {/* English Details */}
                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 7 }}>
                    <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                    </svg>
                    {isAr ? 'تفاصيل التتبع — إنجليزي' : 'Tracking Details — English'}
                    <span style={{ marginRight: 'auto', fontSize: 10, color: 'var(--text-tertiary)', fontWeight: 400 }}>EN</span>
                  </label>
                  <textarea
                    required rows="2" className="glass-input"
                    value={updateDetailsEn}
                    onChange={e => setUpdateDetailsEn(e.target.value)}
                    style={{ width: '100%', resize: 'vertical', direction: 'ltr', color: 'var(--text-primary)' }}
                  />
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: 'var(--glass-border)', margin: '2px 0' }} />

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 10, justifyContent: isAr ? 'flex-start' : 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setUpdatingTracking(null)}
                    style={{
                      padding: '10px 20px', borderRadius: 10,
                      border: '1px solid var(--glass-border)',
                      background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                      color: 'var(--text-secondary)',
                      fontSize: 13, fontWeight: 600, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}
                  >
                    <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 1, padding: '10px 20px', borderRadius: 10,
                      background: 'linear-gradient(135deg, var(--primary-color) 0%, rgba(20,184,166,0.8) 100%)',
                      border: 'none', color: '#fff',
                      fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                      boxShadow: '0 4px 16px rgba(20,184,166,0.3)',
                    }}
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    {isAr ? 'تأكيد وحفظ التحديث' : 'Confirm & Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Delete Confirmation Modal */}
      {deletingTracking && (
        <div className="modal-overlay" onClick={() => setDeletingTracking(null)}>
          <div
            onClick={e => e.stopPropagation()}
            dir={isAr ? 'rtl' : 'ltr'}
            style={{
              background: isDark ? 'linear-gradient(160deg, rgba(13,18,38,0.98) 0%, rgba(8,12,28,0.99) 100%)' : 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: 20,
              boxShadow: isDark ? '0 32px 64px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.05)' : '0 32px 64px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.5)',
              backdropFilter: 'blur(40px)',
              width: '92vw',
              maxWidth: 400,
              overflow: 'hidden',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '18px 24px',
              background: 'linear-gradient(90deg, rgba(239,68,68,0.1) 0%, transparent 70%)',
              borderBottom: '1px solid var(--glass-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444' }}>
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M3 6h18"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
                    {isAr ? 'تأكيد الحذف' : 'Confirm Deletion'}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'monospace', marginTop: 1 }}>
                    {deletingTracking}
                  </div>
                </div>
              </div>
              <button onClick={() => setDeletingTracking(null)} style={{
                width: 30, height: 30, borderRadius: '50%',
                border: '1px solid var(--glass-border)',
                background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                color: 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', flexShrink: 0,
              }}>
                <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                {isAr ? 'هل أنت متأكد من حذف هذه الشحنة نهائياً؟ لا يمكن التراجع عن هذا الإجراء.' : 'Are you sure you want to permanently delete this shipment? This action cannot be undone.'}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 10, justifyContent: isAr ? 'flex-start' : 'flex-end', marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => setDeletingTracking(null)}
                  style={{
                    padding: '10px 20px', borderRadius: 10,
                    border: '1px solid var(--glass-border)',
                    background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)',
                    color: 'var(--text-secondary)',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  style={{
                    flex: 1, padding: '10px 20px', borderRadius: 10,
                    background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
                    border: 'none', color: '#fff',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    boxShadow: '0 4px 16px rgba(239,68,68,0.3)',
                  }}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                  </svg>
                  {isAr ? 'تأكيد الحذف' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Create Shipment Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content glass-panel"
            style={{ padding: 28, maxWidth: 560, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
              {isAr ? 'إنشاء شحنة جديدة يدوياً' : 'Create New Shipment Manually'}
            </h3>
            <form onSubmit={handleCreateShipment} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { key: 'senderName',    labelAr: 'اسم المرسل',         labelEn: 'Sender Name' },
                  { key: 'senderPhone',   labelAr: 'هاتف المرسل',        labelEn: 'Sender Phone' },
                  { key: 'senderCity',    labelAr: 'مدينة المرسل',       labelEn: 'Sender City', isCity: true },
                  { key: 'receiverName',  labelAr: 'اسم المستلم',        labelEn: 'Receiver Name' },
                  { key: 'receiverPhone', labelAr: 'هاتف المستلم',       labelEn: 'Receiver Phone' },
                  { key: 'receiverCity',  labelAr: 'مدينة المستلم (نسخ الرسوم تلقائياً)', labelEn: 'Receiver City (Auto Price)', isCity: true, isReceiverCity: true },
                  { key: 'productPrice',  labelAr: 'سعر المنتج (د.ل)',   labelEn: 'Product Price (LYD)', type: 'number' },
                  { key: 'deliveryFee',   labelAr: 'رسوم التوصيل (د.ل)', labelEn: 'Delivery Fee (LYD)', type: 'number' },
                  { key: 'codFee',        labelAr: 'رسوم التحصيل (د.ل)', labelEn: 'COD Fee (LYD)', type: 'number' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>
                      {isAr ? f.labelAr : f.labelEn}
                    </label>
                    {f.isCity ? (
                      <select 
                        required 
                        className="glass-input w-full"
                        style={{ padding: '8px 10px', fontSize: 13 }}
                        value={createForm[f.key]} 
                        onChange={e => {
                          const cityName = e.target.value;
                          if (f.isReceiverCity) {
                            const matched = (cityPricing || []).find(c => c.city === cityName);
                            setCreateForm(p => ({
                              ...p,
                              receiverCity: cityName,
                              deliveryFee: matched ? String(matched.fee ?? 0) : p.deliveryFee,
                              codFee: matched ? String(matched.codFee ?? 0) : p.codFee
                            }));
                          } else {
                            setCreateForm(p => ({ ...p, [f.key]: cityName }));
                          }
                        }}
                      >
                        <option value="">{isAr ? '-- اختر المدينة --' : '-- Select City --'}</option>
                        {(cityPricing || []).filter(c => c.active).map(c => (
                          <option key={c.city} value={c.city}>
                            {c.city} ({c.fee + c.codFee} د.ل)
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input required className="glass-input" type={f.type || 'text'}
                        value={createForm[f.key]} onChange={e => setCreateForm(p => ({ ...p, [f.key]: e.target.value }))} />
                    )}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 10, marginBottom: 10 }}>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>
                  <input type="checkbox" checked={createForm.freeService} onChange={e => setCreateForm(p => ({ ...p, freeService: e.target.checked }))} style={{ marginRight: 8, marginLeft: 8 }} />
                  {isAr ? 'خالص خدمات' : 'Free Service'}
                </label>
                <select className="glass-input" value={createForm.deliveryChargeOn} onChange={e => setCreateForm(p => ({ ...p, deliveryChargeOn: e.target.value }))} style={{ padding: '4px 8px', fontSize: 12, flex: 1 }}>
                  <option value="المستلم">{isAr ? 'التوصيل على المستلم' : 'Receiver Pays Delivery'}</option>
                  <option value="المرسل">{isAr ? 'التوصيل على المرسل' : 'Sender Pays Delivery'}</option>
                </select>
              </div>
              <div style={{ position: 'relative' }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)', display: 'block', marginBottom: 5 }}>
                  {isAr ? 'التاجر المرتبط' : 'Linked Merchant'}
                </label>
                
                <div 
                  className="glass-input" 
                  style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
                  onClick={() => setIsMerchantDropdownOpen(!isMerchantDropdownOpen)}
                >
                  <span style={{ color: createForm.merchantId ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                    {createForm.merchantId 
                      ? (() => {
                          const m = merchants.find(m => String(m.id) === String(createForm.merchantId));
                          return m ? `${m.storeName} — ${m.name}` : (isAr ? '-- اختياري --' : '-- Optional --');
                        })()
                      : (isAr ? '-- اختياري --' : '-- Optional --')}
                  </span>
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"/></svg>
                </div>

                {isMerchantDropdownOpen && (
                  <div style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4,
                    background: 'var(--bg-gradient-2)', border: '1px solid var(--glass-border)',
                    borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.15)', zIndex: 50,
                    maxHeight: 220, display: 'flex', flexDirection: 'column', overflow: 'hidden'
                  }}>
                    <div style={{ padding: '8px' }}>
                      <input 
                        type="text" 
                        autoFocus
                        className="glass-input" 
                        style={{ padding: '8px 12px', fontSize: 12 }}
                        placeholder={isAr ? 'ابحث عن متجر...' : 'Search merchant...'}
                        value={merchantSearchQuery}
                        onChange={e => setMerchantSearchQuery(e.target.value)}
                      />
                    </div>
                    <div style={{ overflowY: 'auto', flex: 1, padding: '0 4px 8px 4px' }}>
                      <div 
                        style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, borderRadius: 8, color: 'var(--text-secondary)' }}
                        onClick={() => {
                          setCreateForm(p => ({ ...p, merchantId: '' }));
                          setIsMerchantDropdownOpen(false);
                          setMerchantSearchQuery('');
                        }}
                      >
                        {isAr ? '-- بدون ربط --' : '-- No Link --'}
                      </div>
                      {filteredMerchants.map(m => (
                        <div 
                          key={m.id}
                          style={{ 
                            padding: '8px 12px', cursor: 'pointer', fontSize: 13, borderRadius: 8,
                            background: String(createForm.merchantId) === String(m.id) ? 'rgba(20,184,166,0.1)' : 'transparent',
                            color: String(createForm.merchantId) === String(m.id) ? 'var(--primary-color)' : 'var(--text-primary)'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(128,128,128,0.1)'}
                          onMouseLeave={e => e.currentTarget.style.background = String(createForm.merchantId) === String(m.id) ? 'rgba(20,184,166,0.1)' : 'transparent'}
                          onClick={() => {
                            setCreateForm(p => ({
                              ...p,
                              merchantId: m.id,
                              senderName: m.storeName || m.name || '',
                              senderPhone: m.phone || '',
                              senderCity: m.city || 'طرابلس'
                            }));
                            setIsMerchantDropdownOpen(false);
                            setMerchantSearchQuery('');
                          }}
                        >
                          {m.storeName} — {m.name}
                        </div>
                      ))}
                      {filteredMerchants.length === 0 && (
                        <div style={{ padding: '12px', textAlign: 'center', fontSize: 12, color: 'var(--text-tertiary)' }}>
                          {isAr ? 'لا يوجد تاجر مطابق' : 'No matching merchant'}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
                <button type="button" onClick={() => setShowCreate(false)}
                  style={{ padding: '10px 20px', borderRadius: 10, border: '1px solid var(--glass-border)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, cursor: 'pointer' }}>
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" className="glass-button">{isAr ? 'إنشاء الشحنة' : 'Create Shipment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SHIPMENT DETAILS MODAL — Professional Card */}
      {selectedShipment && (
        <div className="modal-overlay" onClick={() => setSelectedShipment(null)}>
          <div
            onClick={e => e.stopPropagation()}
            dir={isAr ? 'rtl' : 'ltr'}
            style={{
              background: 'var(--card-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: 20,
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              backdropFilter: 'blur(40px)',
              width: '92vw',
              maxWidth: 940,
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
            }}
          >
            {/* HEADER */}
            <div style={{
              padding: '18px 26px',
              background: 'linear-gradient(90deg, rgba(20,184,166,0.12) 0%, transparent 70%)',
              borderBottom: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '20px 20px 0 0',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{
                  background: 'rgba(20,184,166,0.12)',
                  border: '1px solid rgba(20,184,166,0.3)',
                  borderRadius: 9, padding: '5px 13px',
                  fontFamily: 'monospace', fontSize: 15, fontWeight: 800, color: '#14B8A6', letterSpacing: 1,
                }}>
                  {selectedShipment.trackingNumber}
                </div>
                <span className={`badge badge-${selectedShipment.status.toLowerCase().replace(/\s+/g, '')}`} style={{ fontSize: 11, padding: '4px 10px' }}>
                  {statusLabel(selectedShipment.status)}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={handlePrintWaybill} style={{
                  padding: '0 12px', height: 32, borderRadius: 8,
                  border: '1px solid var(--glass-border)',
                  background: 'var(--primary-color)',
                  color: '#FFF', fontWeight: 600, fontSize: 13,
                  display: 'flex', alignItems: 'center', gap: 6,
                  cursor: 'pointer', flexShrink: 0,
                }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.724.092m6.524-4.659A15.645 15.645 0 0 0 12 9c-2.457 0-4.757.5-6.84 1.39A2.25 2.25 0 0 0 3.75 12.5v4.5A2.25 2.25 0 0 0 6 19.25h12a2.25 2.25 0 0 0 2.25-2.25v-4.5a2.25 2.25 0 0 0-1.41-2.11z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 9.75v-4.5A2.25 2.25 0 0 0 17.25 3h-10.5A2.25 2.25 0 0 0 4.5 5.25v4.5" /></svg>
                  {isAr ? 'طباعة البوليصة' : 'Print Waybill'}
                </button>
                <button onClick={() => setSelectedShipment(null)} style={{
                  width: 32, height: 32, borderRadius: '50%',
                  border: '1px solid var(--glass-border)',
                  background: 'var(--glass-bg)',
                  color: 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', flexShrink: 0,
                }}>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
                    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* BODY */}
            <div style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 18 }}>

              {/* ROW 1: Merchant + Recipient */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
                <InfoCard
                  title={isAr ? 'بيانات التاجر المرسل' : 'Merchant / Sender'}
                  color="#14B8A6"
                  icon={<svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 21v-7.5a.75.75 0 0 1 .75-.75h3a.75.75 0 0 1 .75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349M3.75 21V9.349m0 0a3.001 3.001 0 0 0 3.75-.615A2.993 2.993 0 0 0 9.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 0 0 2.25 1.016c.896 0 1.7-.393 2.25-1.015a3.001 3.001 0 0 0 3.75.614m-16.5 0a3.004 3.004 0 0 1-.621-4.72l1.189-1.19A1.5 1.5 0 0 1 5.378 3h13.243a1.5 1.5 0 0 1 1.06.44l1.19 1.189a3 3 0 0 1-.621 4.72" /></svg>}
                  rows={[
                    { label: isAr ? 'اسم المتجر' : 'Store Name', value: selectedShipment.senderName },
                    { label: isAr ? 'رقم الهاتف' : 'Phone',      value: selectedShipment.senderPhone, mono: true },
                    { label: isAr ? 'المدينة'     : 'City',       value: selectedShipment.senderCity || (isAr ? 'طرابلس' : 'Tripoli') },
                  ]}
                />
                <InfoCard
                  title={isAr ? 'بيانات المستلم' : 'Recipient'}
                  color="#60A5FA"
                  icon={<svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" /></svg>}
                  rows={[
                    { label: isAr ? 'الاسم'    : 'Name',  value: selectedShipment.receiverName },
                    { label: isAr ? 'الهاتف'   : 'Phone', value: selectedShipment.receiverPhone, mono: true },
                    ...(selectedShipment.receiverBackupPhone ? [{ label: isAr ? 'هاتف احتياطي' : 'Backup Phone', value: selectedShipment.receiverBackupPhone, mono: true }] : []),
                    { label: isAr ? 'المدينة'  : 'City',    value: selectedShipment.receiverCity },
                    { label: isAr ? 'العنوان'  : 'Address', value: selectedShipment.detailedAddress || (isAr ? 'غير محدد' : 'Not Specified'), wrap: true },
                  ]}
                />
              </div>

              {/* ROW 2: Product + Financial */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
                <InfoCard
                  title={isAr ? 'تفاصيل المنتج' : 'Product Details'}
                  color="var(--accent-green)"
                  icon={<svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" /></svg>}
                  rows={[
                    { label: isAr ? 'نوع المنتج'    : 'Product Type',  value: selectedShipment.cargoType || (isAr ? 'ملابس' : 'Clothing') },
                    { label: isAr ? 'الكمية'         : 'Quantity',      value: `${selectedShipment.quantity || 1} ${isAr ? 'قطعة' : 'pcs'}` },
                    { label: isAr ? 'سعر المنتج'     : 'Product Price', value: `${selectedShipment.productPrice || 0} د.ل` },
                    { label: isAr ? 'رسوم الشحن على' : 'Delivery On',  value: selectedShipment.deliveryChargeOn || (isAr ? 'المستلم' : 'Recipient') },
                  ]}
                />

                {/* Financial — custom with highlighted total */}
                <div style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 14, overflow: 'hidden' }}>
                  <div style={{ padding: '10px 14px', background: 'rgba(245,158,11,0.08)', borderBottom: '1px solid rgba(245,158,11,0.18)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <IconBox color="var(--accent-orange)">
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879-.698a4.5 4.5 0 0 1 6.75 1.25M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
                    </IconBox>
                    <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-orange)' }}>{isAr ? 'التفاصيل المالية' : 'Financial Breakdown'}</span>
                  </div>
                  <div style={{ padding: '4px 14px 10px' }}>
                    {[
                      { label: isAr ? 'رسوم التوصيل' : 'Delivery Fee',  value: `${selectedShipment.deliveryFee} د.ل` },
                      { label: isAr ? 'رسوم COD'      : 'COD Fee',       value: `${selectedShipment.codFee} د.ل` },
                      { label: isAr ? 'قيمة المنتج'   : 'Product Value', value: `${selectedShipment.productPrice || 0} د.ل` },
                    ].map((r, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--glass-border)' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600 }}>{r.label}</span>
                        <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 700 }}>{r.value}</span>
                      </div>
                    ))}
                    <div style={{ marginTop: 10, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: 'var(--accent-green)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10"/>
                          <path d="M12 6v2m0 8v2M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.5-1.5 2-2.5 2.5S9.5 14 9.5 15.5a2.5 2.5 0 0 0 5 0"/>
                        </svg>
                        {isAr ? 'المبلغ المطلوب تحصيله' : 'Total COD'}
                      </span>
                      <span style={{ fontSize: 17, color: 'var(--accent-green)', fontWeight: 800 }}>
                        {selectedShipment.price} د.ل
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ROW 3: Options Chips */}
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="3"/>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14M12 2v2m0 16v2m8-10h-2M4 12H2m15.07-6.07-1.41 1.41M6.34 17.66l-1.41 1.41M17.66 17.66l-1.41-1.41M6.34 6.34 4.93 4.93"/>
                  </svg>
                  {isAr ? 'خيارات وخدمات الشحنة' : 'Delivery Options & Services'}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {[
                    { label: isAr ? 'توصيل للمنزل' : 'Home Delivery',  val: selectedShipment.homeDelivery },
                    { label: isAr ? 'شحن مجاني'     : 'Free Shipping',  val: selectedShipment.freeService },
                    { label: isAr ? 'معاينة وقياس'  : 'Try-on Allowed', val: selectedShipment.tryOn },
                    { label: isAr ? 'لا معاينة'     : 'No Try-on',      val: selectedShipment.noTryOn },
                    { label: isAr ? 'قابل للكسر'   : 'Fragile',        val: selectedShipment.fragile, warn: true },
                  ].map((opt, i) => (
                    <span key={i} style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                      border: `1px solid ${
                        opt.warn && opt.val ? 'rgba(245,158,11,0.4)'
                        : opt.val ? 'rgba(16,185,129,0.35)'
                        : 'var(--glass-border)'
                      }`,
                      background: opt.warn && opt.val ? 'rgba(245,158,11,0.08)' : opt.val ? 'rgba(16,185,129,0.08)' : 'rgba(128,128,128,0.05)',
                      color: opt.warn && opt.val ? 'var(--accent-orange)' : opt.val ? 'var(--accent-green)' : 'var(--text-tertiary)',
                    }}>
                      {opt.val ? (
                        opt.warn ? (
                          <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                            <line x1="12" y1="9" x2="12" y2="13"/>
                            <line x1="12" y1="17" x2="12.01" y2="17"/>
                          </svg>
                        ) : (
                          <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                            <polyline points="20 6 9 17 4 12"/>
                          </svg>
                        )
                      ) : (
                        <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" viewBox="0 0 24 24">
                          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                        </svg>
                      )}
                      {opt.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* ROW 4: Notes (conditional) */}
              {selectedShipment.notes && (
                <div style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#F59E0B' }}>
                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10 9 9 9 8 9"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: '#F59E0B', fontWeight: 700, marginBottom: 4 }}>
                      {isAr ? 'ملاحظات الشحنة' : 'Shipment Notes'}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                      {selectedShipment.notes}
                    </div>
                  </div>
                </div>
              )}

              {/* ROW 5: Timeline */}
              <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '16px 18px' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                  </svg>
                  {isAr ? 'سجل التتبع والتحديثات' : 'Tracking History'}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {[...selectedShipment.history].reverse().map((item, idx, arr) => {
                    const isFirst = idx === 0;
                    const isLast  = idx === arr.length - 1;
                    return (
                      <div key={idx} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, paddingTop: 2 }}>
                          <div style={{
                            width: 12, height: 12, borderRadius: '50%',
                            background: isFirst ? 'var(--primary-color)' : 'transparent',
                            border: `2px solid ${isFirst ? 'var(--primary-color)' : 'rgba(255,255,255,0.2)'}`,
                            boxShadow: isFirst ? '0 0 8px var(--primary-color)' : 'none',
                          }} />
                          {!isLast && <div style={{ width: 1, height: 38, background: 'rgba(255,255,255,0.07)', margin: '4px 0' }} />}
                        </div>
                        <div style={{ flex: 1, paddingBottom: isLast ? 0 : 8 }}>
                          <div style={{ fontSize: 12, fontWeight: isFirst ? 700 : 500, color: isFirst ? 'var(--text-primary)' : 'var(--text-secondary)', lineHeight: 1.4, marginBottom: 3 }}>
                            {isAr ? item.detailsAr : item.detailsEn}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-tertiary)' }}>
                            <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                              <path d="M17.657 16.657L13.414 20.9a2 2 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                              <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                            </svg>
                            <span style={{ fontWeight: 600 }}>{item.location}</span>
                            <span>•</span>
                            <span>
                              {item.timestamp
                                ? `${item.timestamp.getDate()}/${item.timestamp.getMonth()+1}/${item.timestamp.getFullYear()} ${item.timestamp.getHours()}:${String(item.timestamp.getMinutes()).padStart(2,'0')}`
                                : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Edit Shipment Modal */}
      {showEdit && editForm && (
        <div className="modal-overlay" onClick={() => setShowEdit(false)}>
          <div onClick={e => e.stopPropagation()} dir={isAr ? 'rtl' : 'ltr'} className="glass-card" style={{ width: '90vw', maxWidth: 500, padding: 24 }}>
            <h2 className="title-large mb-4">{isAr ? 'تعديل الشحنة' : 'Edit Shipment'}</h2>
            <form onSubmit={handleSaveEdit} className="flex flex-col gap-4">
              <input type="text" className="glass-input" placeholder={isAr ? 'اسم المرسل' : 'Sender Name'} value={editForm.senderName} onChange={e => setEditForm({...editForm, senderName: e.target.value})} />
              <input type="text" className="glass-input" placeholder={isAr ? 'هاتف المرسل' : 'Sender Phone'} value={editForm.senderPhone} onChange={e => setEditForm({...editForm, senderPhone: e.target.value})} />
              <input type="text" className="glass-input" placeholder={isAr ? 'اسم المستلم' : 'Receiver Name'} value={editForm.receiverName} onChange={e => setEditForm({...editForm, receiverName: e.target.value})} />
              <input type="text" className="glass-input" placeholder={isAr ? 'هاتف المستلم' : 'Receiver Phone'} value={editForm.receiverPhone} onChange={e => setEditForm({...editForm, receiverPhone: e.target.value})} />
              <div className="flex gap-2">
                <input type="number" className="glass-input flex-1" placeholder={isAr ? 'السعر الكلي' : 'Total Price'} value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} />
                <input type="number" className="glass-input flex-1" placeholder={isAr ? 'رسوم التوصيل' : 'Delivery Fee'} value={editForm.deliveryFee} onChange={e => setEditForm({...editForm, deliveryFee: e.target.value})} />
                <input type="number" className="glass-input flex-1" placeholder={isAr ? 'رسوم COD' : 'COD Fee'} value={editForm.codFee} onChange={e => setEditForm({...editForm, codFee: e.target.value})} />
              </div>
              <div className="flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setShowEdit(false)} className="px-4 py-2 rounded-lg font-bold" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button type="submit" className="px-4 py-2 rounded-lg font-bold" style={{ background: 'var(--primary-color)', color: '#FFF' }}>
                  {isAr ? 'حفظ التعديلات' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Area (Manifest or Waybill) */}
      <div className="printable-area hide-on-screen" dir="rtl">
        {printType === 'waybill' && selectedShipment ? (
          <div className="wb-page">
            {/* HEADER */}
            <div className="wb-header" style={{ marginBottom: '20px', paddingBottom: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <img src="/logo-color.png" alt="Logo" style={{ height: '55px', objectFit: 'contain' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#0D7847', lineHeight: '1.2' }}>تمويل للتوصيل السريع</span>
                  <span style={{ fontSize: '14px', color: '#555' }}>نظام إدارة العمليات الذكي</span>
                </div>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '24px', fontWeight: '900', marginBottom: '6px', color: '#000' }}>بوليصة شحن</div>
                <div style={{ fontSize: '14px', color: '#333' }}>
                  رقم الشحنة: <strong style={{ fontSize: '16px', color: '#000' }}>{selectedShipment.trackingNumber}</strong>
                </div>
                <div style={{ fontSize: '14px', marginTop: '3px', color: '#333' }}>
                  التاريخ: <strong>{new Date().toLocaleDateString('en-GB')}</strong>
                </div>
              </div>
            </div>

            {/* SENDER + RECEIVER */}
            <div className="wb-grid">
              <div className="wb-section">
                <div className="wb-section-title">بيانات المرسل</div>
                <div className="wb-section-content">
                  <div className="wb-row"><span>الاسم</span><span>{selectedShipment.senderName}</span></div>
                  <div className="wb-row"><span>الهاتف</span><span dir="ltr">{selectedShipment.senderPhone}</span></div>
                  <div className="wb-row"><span>المدينة</span><span>{selectedShipment.senderCity || 'طرابلس'}</span></div>
                </div>
              </div>

              <div className="wb-section">
                <div className="wb-section-title">بيانات المستلم</div>
                <div className="wb-section-content">
                  <div className="wb-row"><span>الاسم</span><span>{selectedShipment.receiverName}</span></div>
                  <div className="wb-row"><span>الهاتف</span><span dir="ltr">{selectedShipment.receiverPhone}</span></div>
                  <div className="wb-row"><span>المدينة</span><span>{selectedShipment.receiverCity}</span></div>
                  <div className="wb-row"><span>العنوان</span><span>{selectedShipment.detailedAddress || 'غير محدد'}</span></div>
                </div>
              </div>
            </div>

            {/* PRODUCT */}
            <div className="wb-section">
              <div className="wb-section-title">تفاصيل الشحنة</div>
              <div className="wb-section-content">
                <div className="wb-product-box">
                  <div className="wb-product-item">
                    <div>نوع المنتج</div>
                    <strong>{selectedShipment.cargoType || 'طرد'}</strong>
                  </div>
                  <div className="wb-product-item">
                    <div>الكمية</div>
                    <strong>{selectedShipment.quantity || '1 قطعة'}</strong>
                  </div>
                  <div className="wb-product-item">
                    <div>الشحن</div>
                    <strong>على المستلم</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* TOTAL ONLY */}
            <div className="wb-total-box">
              المبلغ الإجمالي المطلوب تحصيله: {selectedShipment.price} د.ل
            </div>

            {/* BARCODE */}
            <div className="wb-barcode">
              <svg id="barcode"></svg>
              <div style={{ marginTop: '5px', fontWeight: 'bold' }}>{selectedShipment.trackingNumber}</div>
            </div>

            {/* FOOTER */}
            <div className="wb-footer">
              <div>توقيع المستلم: __________</div>
              <div>تاريخ الاستلام: __________</div>
            </div>
          </div>
        ) : (
          <>
            <div className="wb-header" style={{ marginBottom: '20px', paddingBottom: '15px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <img src="/logo-color.png" alt="Logo" style={{ height: '55px', objectFit: 'contain' }} />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#0D7847', lineHeight: '1.2' }}>تمويل للتوصيل السريع</span>
                  <span style={{ fontSize: '14px', color: '#555' }}>نظام إدارة العمليات الذكي</span>
                </div>
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '24px', fontWeight: '900', marginBottom: '6px', color: '#000' }}>كشف المينفيست</div>
                <div style={{ fontSize: '14px', color: '#333' }}>
                  التاريخ: <strong style={{ fontSize: '16px', color: '#000' }}>{new Date().toLocaleDateString('en-GB')}</strong>
                </div>
                <div style={{ fontSize: '14px', marginTop: '3px', color: '#333' }}>
                  المندوب: <strong>{bulkDriverId ? drivers.find(d => d.id === bulkDriverId)?.name : '_________________'}</strong>
                </div>
              </div>
            </div>

            <table className="print-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>☑</th>
                  <th>رقم التتبع</th>
                  <th>المرسل</th>
                  <th>المستلم</th>
                  <th>هاتف المستلم</th>
                  <th>المدينة</th>
                  <th>المبلغ</th>
                  <th>التوقيع</th>
                </tr>
              </thead>
              <tbody>
                {filteredShipments.filter(s => selectedForBulk.includes(s.trackingNumber)).map(s => (
                  <tr key={s.trackingNumber}>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ width: '16px', height: '16px', border: '1px solid #333', display: 'inline-block' }}></div>
                    </td>
                    <td>{s.trackingNumber}</td>
                    <td>{s.senderName}</td>
                    <td>{s.receiverName}</td>
                    <td dir="ltr">{s.receiverPhone}</td>
                    <td>{s.receiverCity}</td>
                    <td>{s.price} د.ل</td>
                    <td></td>
                  </tr>
                ))}
              </tbody>
            </table>

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
          </>
        )}
      </div>

      {/* Bulk Status Update Modal */}
      {showBulkStatusModal && (
        <div className="modal-overlay" onClick={() => !isProcessingBulkModal && setShowBulkStatusModal(false)}>
          <div className="modal-content glass-card" style={{ maxWidth: 520, width: '90%' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <h2 className="title-medium" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                <span>⚡</span>
                {isAr ? 'تحديث حالة الشحنات الجماعية' : 'Bulk Shipment Status Update'}
              </h2>
              <button onClick={() => setShowBulkStatusModal(false)} className="text-gray-400 hover:text-white" style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label className="text-xs font-semibold block mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {isAr ? '1. اختر الحالة الجديدة المراد تطبيقها:' : '1. Select target status:'}
                </label>
                <select className="glass-input w-full" style={{ padding: '10px 14px', fontSize: 14, fontWeight: 'bold' }} value={bulkSelectedStatus} onChange={e => setBulkSelectedStatus(e.target.value)}>
                  {customStatusesList.map(st => (
                    <option key={st.key} value={st.key}>{isAr ? st.ar : st.en}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold block mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {isAr ? '2. أدخل أرقام التتبع (أو اتركها فارغة لتحديث الشحنات المحددة/المفلترة):' : '2. Enter tracking numbers (or leave empty to target selected/filtered shipments):'}
                </label>
                <textarea
                  className="glass-input w-full"
                  rows={4}
                  placeholder={isAr ? 'مثال: TO-10001, TO-10002, TO-10003...' : 'e.g. TO-10001, TO-10002...'}
                  value={bulkInputTrackings}
                  onChange={e => setBulkInputTrackings(e.target.value)}
                  style={{ fontFamily: 'monospace', fontSize: 13 }}
                />
                <span className="text-xs mt-1 block" style={{ color: 'var(--text-secondary)', opacity: 0.8 }}>
                  {selectedForBulk.length > 0 
                    ? (isAr ? `سيتم تحديث ${selectedForBulk.length} شحنة تم تحديدها بخيار الصح` : `Will update ${selectedForBulk.length} selected shipments`)
                    : (isAr ? `في حال ترك الحقل فارغاً سيتم تطبيق التحديث على كافة الشحنات المفلترة (${filteredShipments.length} شحنة)` : `If left empty, will apply to all ${filteredShipments.length} filtered shipments`)}
                </span>
              </div>

              <div className="flex gap-3 mt-4 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                <button
                  onClick={handleExecuteModalBulkUpdate}
                  disabled={isProcessingBulkModal}
                  className="glass-button primary flex-1 justify-center py-2.5"
                  style={{ backgroundColor: '#10B981', color: '#FFF', borderColor: 'transparent', fontWeight: 'bold' }}
                >
                  {isProcessingBulkModal ? (isAr ? 'جارٍ التحديث...' : 'Processing...') : (isAr ? 'تأكيد التحديث الجماعي' : 'Confirm Bulk Update')}
                </button>
                <button
                  onClick={() => setShowBulkStatusModal(false)}
                  disabled={isProcessingBulkModal}
                  className="glass-button secondary py-2.5"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Status Modal */}
      {showAddCustomStatusModal && (
        <div className="modal-overlay" onClick={() => setShowAddCustomStatusModal(false)}>
          <div className="modal-content glass-card" style={{ maxWidth: 450, width: '90%' }} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4 pb-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <h2 className="title-medium" style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                <span>➕</span>
                {isAr ? 'إضافة حالة شحنة مخصصة جديدة' : 'Add Custom Shipment Status'}
              </h2>
              <button onClick={() => setShowAddCustomStatusModal(false)} className="text-gray-400 hover:text-white" style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer' }}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>
                  {isAr ? 'اسم الحالة بالعربية:' : 'Status Name in Arabic:'}
                </label>
                <input
                  type="text"
                  className="glass-input w-full"
                  placeholder={isAr ? 'مثال: في مركز التوزيع الإقليمي' : 'e.g. In Regional Sorting Center'}
                  value={newCustomStatusAr}
                  onChange={e => setNewCustomStatusAr(e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs font-semibold block mb-1" style={{ color: 'var(--text-secondary)' }}>
                  {isAr ? 'اسم الحالة بالإنجليزية (اختياري):' : 'Status Name in English (Optional):'}
                </label>
                <input
                  type="text"
                  className="glass-input w-full"
                  placeholder={isAr ? 'مثال: Regional Hub' : 'e.g. Regional Hub'}
                  value={newCustomStatusEn}
                  onChange={e => setNewCustomStatusEn(e.target.value)}
                />
              </div>

              <div className="flex gap-3 mt-4 pt-3" style={{ borderTop: '1px solid var(--border-color)' }}>
                <button
                  onClick={handleSaveCustomStatus}
                  className="glass-button primary flex-1 justify-center py-2.5"
                  style={{ backgroundColor: '#6366F1', color: '#FFF', borderColor: 'transparent', fontWeight: 'bold' }}
                >
                  {isAr ? 'حفظ الحالة بالنظام' : 'Save Status'}
                </button>
                <button
                  onClick={() => setShowAddCustomStatusModal(false)}
                  className="glass-button secondary py-2.5"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

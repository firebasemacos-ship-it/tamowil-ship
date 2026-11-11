import { supabase } from './supabaseClient.js';

const safeNum = (v, fallback = 0) => {
  const n = Number(v);
  return isNaN(n) ? fallback : n;
};

export function isSenderPaid(chargeOn) {
  if (!chargeOn) return false;
  const str = String(chargeOn).trim().toLowerCase();
  return str === 'المرسل' || str === 'المتجر' || str === 'sender' || str === 'merchant';
}

// ─── Multi-Branch Isolation & Meta Sync Engine ────────────────
const BRANCHES_STORAGE_KEY = 'vanex_branches_meta_prod_v1';
const META_SAFE_ID = 'SYS-BRANCHES-META';

const DEFAULT_BRANCHES = [];

const DEFAULT_META = {
  branches: DEFAULT_BRANCHES,
  assignments: {
    merchants: {},
    drivers: {},
    shipments: {},
    employees: {},
    safes: {
      'SAFE-001': 'MAIN',
      'SAFE-005': 'MAIN'
    }
  }
};

let cachedBranchMeta = null;
let lastMetaSyncTime = 0;

export function getCachedBranchMeta() {
  if (cachedBranchMeta) return cachedBranchMeta;
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(BRANCHES_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        cachedBranchMeta = {
          branches: Array.isArray(parsed.branches) && parsed.branches.length > 0 ? parsed.branches : DEFAULT_BRANCHES,
          assignments: {
            merchants: { ...(parsed.assignments?.merchants || {}) },
            drivers: { ...(parsed.assignments?.drivers || {}) },
            shipments: { ...(parsed.assignments?.shipments || {}) },
            employees: { ...(parsed.assignments?.employees || {}) },
            safes: { ...DEFAULT_META.assignments.safes, ...(parsed.assignments?.safes || {}) }
          }
        };
        return cachedBranchMeta;
      }
    } catch (e) {}
  }
  cachedBranchMeta = JSON.parse(JSON.stringify(DEFAULT_META));
  return cachedBranchMeta;
}

export async function getBranchMeta(forceRemote = false) {
  const now = Date.now();
  if (!forceRemote && cachedBranchMeta && now - lastMetaSyncTime < 3000) {
    return cachedBranchMeta;
  }
  const localMeta = getCachedBranchMeta();
  try {
    const { data: metaRow } = await supabase
      .from('safes')
      .select('notes')
      .eq('id', META_SAFE_ID)
      .maybeSingle();

    if (metaRow && metaRow.notes) {
      const parsed = JSON.parse(metaRow.notes);
      cachedBranchMeta = {
        branches: Array.isArray(parsed.branches) ? parsed.branches : localMeta.branches,
        assignments: {
          merchants: { ...localMeta.assignments.merchants, ...(parsed.assignments?.merchants || {}) },
          drivers: { ...localMeta.assignments.drivers, ...(parsed.assignments?.drivers || {}) },
          shipments: { ...localMeta.assignments.shipments, ...(parsed.assignments?.shipments || {}) },
          employees: { ...localMeta.assignments.employees, ...(parsed.assignments?.employees || {}) },
          safes: { ...DEFAULT_META.assignments.safes, ...localMeta.assignments.safes, ...(parsed.assignments?.safes || {}) }
        }
      };
      lastMetaSyncTime = now;
      if (typeof window !== 'undefined') {
        localStorage.setItem(BRANCHES_STORAGE_KEY, JSON.stringify(cachedBranchMeta));
      }
      return cachedBranchMeta;
    } else {
      // Seed initial meta row in Supabase
      await saveBranchMeta(localMeta);
    }
  } catch (e) {
    console.warn('getBranchMeta sync warning:', e);
  }
  return localMeta;
}

export async function saveBranchMeta(newMeta) {
  cachedBranchMeta = newMeta;
  lastMetaSyncTime = Date.now();
  if (typeof window !== 'undefined') {
    localStorage.setItem(BRANCHES_STORAGE_KEY, JSON.stringify(newMeta));
  }
  try {
    const payload = {
      id: META_SAFE_ID,
      name: '__SYSTEM_BRANCHES_META__',
      code: 'SYS_META',
      branch: 'SYSTEM',
      initial_balance: 0,
      balance: 0,
      active: false,
      notes: JSON.stringify(newMeta)
    };
    const { data: existing } = await supabase.from('safes').select('id').eq('id', META_SAFE_ID).maybeSingle();
    if (existing) {
      await supabase.from('safes').update({ notes: JSON.stringify(newMeta) }).eq('id', META_SAFE_ID);
    } else {
      await supabase.from('safes').insert(payload);
    }
  } catch (e) {
    console.warn('saveBranchMeta error:', e);
  }
  return newMeta;
}

export async function ensureBranchSafesExist(branch) {
  if (!branch || !branch.id || branch.id === 'MAIN') return;
  const mainSafeId = branch.mainSafeId || `SAFE-MAIN-${branch.id}`;
  const custodySafeId = branch.custodySafeId || `SAFE-CUST-${branch.id}`;

  try {
    const { data: existingSafes } = await supabase
      .from('safes')
      .select('id')
      .in('id', [mainSafeId, custodySafeId]);
    const existingIds = new Set((existingSafes || []).map(s => s.id));

    if (!existingIds.has(mainSafeId)) {
      await supabase.from('safes').insert({
        id: mainSafeId,
        name: `خزينة ${branch.name}`,
        code: `${branch.code || branch.id}-SAFE`,
        branch: branch.name,
        initial_balance: 0,
        balance: 0,
        active: true,
        notes: `الخزينة الرئيسية المخصصة لـ ${branch.name}`
      });
    }
    if (!existingIds.has(custodySafeId)) {
      await supabase.from('safes').insert({
        id: custodySafeId,
        name: `خزينة عُهد السائقين - ${branch.name}`,
        code: `${branch.code || branch.id}-CUST`,
        branch: branch.name,
        initial_balance: 0,
        balance: 0,
        active: true,
        notes: `خزينة العهد الميدانية للسائقين التابعين لـ ${branch.name}`
      });
    }
  } catch (e) {
    console.warn('ensureBranchSafesExist error:', e);
  }
}

export async function getBranches() {
  const meta = await getBranchMeta();
  return meta.branches || [];
}

export async function saveBranch(branchData) {
  const meta = await getBranchMeta(true);
  const branches = [...(meta.branches || [])];

  if (branchData.id) {
    const idx = branches.findIndex(b => b.id === branchData.id);
    if (idx !== -1) {
      branches[idx] = { ...branches[idx], ...branchData };
      await ensureBranchSafesExist(branches[idx]);
    } else {
      const mainSafeId = branchData.mainSafeId || `SAFE-MAIN-${branchData.id}`;
      const custodySafeId = branchData.custodySafeId || `SAFE-CUST-${branchData.id}`;
      const created = {
        ...branchData,
        mainSafeId,
        custodySafeId,
        active: branchData.active !== false,
        permissions: branchData.permissions || ['overview', 'shipments', 'wallet', 'drivers', 'merchants', 'tickets', 'reports', 'safes', 'employees', 'logs'],
        createdAt: new Date().toISOString()
      };
      branches.push(created);
      meta.assignments.safes[mainSafeId] = created.id;
      meta.assignments.safes[custodySafeId] = created.id;
      await ensureBranchSafesExist(created);
    }
  } else {
    const newId = `BR-${Math.floor(100 + Math.random() * 900)}`;
    const mainSafeId = `SAFE-MAIN-${newId}`;
    const custodySafeId = `SAFE-CUST-${newId}`;
    const created = {
      ...branchData,
      id: newId,
      code: branchData.code || newId,
      mainSafeId,
      custodySafeId,
      active: branchData.active !== false,
      permissions: branchData.permissions || ['overview', 'shipments', 'wallet', 'drivers', 'merchants', 'tickets', 'reports', 'safes', 'employees', 'logs'],
      createdAt: new Date().toISOString()
    };
    branches.push(created);
    meta.assignments.safes[mainSafeId] = newId;
    meta.assignments.safes[custodySafeId] = newId;
    await ensureBranchSafesExist(created);
  }

  meta.branches = branches;
  await saveBranchMeta(meta);
  return branches;
}

export async function deleteBranch(branchId) {
  const meta = await getBranchMeta(true);
  meta.branches = (meta.branches || []).filter(b => b.id !== branchId);
  await saveBranchMeta(meta);
  return meta.branches;
}

export async function toggleBranchStatus(branchId) {
  const meta = await getBranchMeta(true);
  meta.branches = (meta.branches || []).map(b =>
    b.id === branchId ? { ...b, active: !b.active } : b
  );
  await saveBranchMeta(meta);
  return meta.branches;
}

export async function assignEntityToBranch(entityType, entityId, branchId) {
  const meta = await getBranchMeta(true);
  if (!meta.assignments[entityType]) {
    meta.assignments[entityType] = {};
  }
  if (!branchId || branchId === 'MAIN') {
    delete meta.assignments[entityType][entityId];
  } else {
    meta.assignments[entityType][entityId] = branchId;
  }
  await saveBranchMeta(meta);
  return meta;
}

export function resolveShipmentBranchId(sh, meta) {
  const m = meta || getCachedBranchMeta();
  const trk = sh.tracking_number || sh.trackingNumber;
  if (trk && m.assignments?.shipments?.[trk]) {
    return m.assignments.shipments[trk];
  }
  const mId = sh.merchant_id || sh.merchantId;
  if (mId && m.assignments?.merchants?.[mId]) {
    return m.assignments.merchants[mId];
  }
  const dId = sh.assigned_driver_id || sh.assignedDriver;
  if (dId && m.assignments?.drivers?.[dId]) {
    return m.assignments.drivers[dId];
  }
  return 'MAIN';
}

export function getBranchCustodySafeId(branchId, meta) {
  if (!branchId || branchId === 'MAIN') return 'SAFE-005';
  const m = meta || getCachedBranchMeta();
  const br = (m.branches || []).find(b => b.id === branchId);
  return br?.custodySafeId || `SAFE-CUST-${branchId}`;
}

export function getBranchMainSafeId(branchId, meta) {
  if (!branchId || branchId === 'MAIN') return 'SAFE-001';
  const m = meta || getCachedBranchMeta();
  const br = (m.branches || []).find(b => b.id === branchId);
  return br?.mainSafeId || `SAFE-MAIN-${branchId}`;
}

// Helper to map DB shipments to Frontend format
function mapShipmentFromDb(sh) {
  return {
    trackingNumber: sh.tracking_number,
    senderName: sh.sender_name,
    senderPhone: sh.sender_phone,
    senderCity: sh.sender_city,
    receiverName: sh.receiver_name,
    receiverPhone: sh.receiver_phone,
    receiverCity: sh.receiver_city,
    receiverBackupPhone: sh.receiver_backup_phone,
    detailedAddress: sh.detailed_address,
    status: sh.status,
    price: safeNum(sh.price),
    deliveryFee: safeNum(sh.delivery_fee),
    codFee: safeNum(sh.cod_fee),
    cargoType: sh.cargo_type,
    quantity: safeNum(sh.quantity, 1),
    productPrice: safeNum(sh.product_price),
    deliveryChargeOn: sh.delivery_charge_on,
    freeService: !!sh.free_service,
    tryOn: !!sh.try_on,
    noTryOn: !!sh.no_try_on,
    fragile: !!sh.fragile,
    homeDelivery: !!sh.home_delivery,
    assignedDriver: sh.assigned_driver_id,
    merchantId: sh.merchant_id,
    createdAt: sh.created_at ? new Date(sh.created_at) : null,
    notes: sh.notes || '',
    history: (sh.history || []).map(h => ({
      detailsAr: h.details_ar,
      detailsEn: h.details_en,
      location: h.location,
      timestamp: h.timestamp ? new Date(h.timestamp) : null
    })).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
  };
}

// Helper to map DB drivers to Frontend format
function mapDriverFromDb(d) {
  return {
    id: d.id,
    name: d.name,
    phone: d.phone || '',
    zone: d.zone || '',
    active: !!d.active,
    rating: Number(d.rating || 5.0),
    codCollected: Number(d.cod_collected || 0),
    codSettled: Number(d.cod_settled || 0),
    pendingSettlement: Number(d.pending_settlement || 0),
    shipmentsToday: Number(d.shipments_today || 0),
    shipmentsCompleted: Number(d.shipments_completed || 0)
  };
}

// ─── Shipments ────────────────────────────────────────────────

export async function getShipments() {
  const [meta, { data, error }] = await Promise.all([
    getBranchMeta(),
    supabase.from('shipments').select('*, history:shipment_history(*)')
  ]);
  if (error) {
    console.error('getShipments error:', error);
    return [];
  }
  return data.map(sh => {
    const mapped = mapShipmentFromDb(sh);
    mapped.branchId = resolveShipmentBranchId(sh, meta);
    return mapped;
  });
}

export async function generateNextTrackingNumber() {
  try {
    const { data: res } = await supabase
      .from('shipments')
      .select('tracking_number')
      .ilike('tracking_number', 'TO-%')
      .order('created_at', { ascending: false })
      .limit(20);

    let maxSeq = 10000;
    if (res && res.length > 0) {
      for (const row of res) {
        const trackStr = row.tracking_number || '';
        if (trackStr.toUpperCase().startsWith('TO-')) {
          const numPartStr = trackStr.replace(/TO-/i, '').replace(/[^0-9]/g, '');
          const numVal = parseInt(numPartStr, 10);
          if (!isNaN(numVal) && numVal > maxSeq) {
            maxSeq = numVal;
          }
        }
      }
    }
    return `TO-${maxSeq + 1}`;
  } catch (e) {
    console.error('Error generating next tracking number:', e);
    return `TO-${10000 + Math.floor(Math.random() * 89999)}`;
  }
}

export async function addShipment(data) {
  const trackingNumber = data.trackingNumber || await generateNextTrackingNumber();
  const dbShipment = {
    tracking_number: trackingNumber,
    sender_name: data.senderName,
    sender_phone: data.senderPhone,
    sender_city: data.senderCity,
    receiver_name: data.receiverName,
    receiver_phone: data.receiverPhone,
    receiver_city: data.receiverCity,
    receiver_backup_phone: data.receiverBackupPhone,
    detailed_address: data.detailedAddress,
    status: 'Registered',
    price: Number(data.price || 0),
    delivery_fee: Number(data.deliveryFee || 0),
    cod_fee: Number(data.codFee || 0),
    cargo_type: data.cargoType,
    quantity: Number(data.quantity || 1),
    product_price: Number(data.productPrice || 0),
    delivery_charge_on: data.deliveryChargeOn || 'المستلم',
    free_service: !!data.freeService,
    try_on: !!data.tryOn,
    no_try_on: !!data.noTryOn,
    fragile: !!data.fragile,
    home_delivery: !!data.homeDelivery,
    assigned_driver_id: null,
    merchant_id: data.merchantId || 'TU-04',
    notes: data.notes
  };

  const { error } = await supabase.from('shipments').insert(dbShipment);
  if (error) {
    console.error('addShipment error:', error);
    alert(`حدث خطأ أثناء إضافة الشحنة (Supabase Error): ${error.message || JSON.stringify(error)}`);
    throw new Error(error.message || 'Supabase Insert Error');
  }

  if (data.branchId && data.branchId !== 'MAIN') {
    await assignEntityToBranch('shipments', trackingNumber, data.branchId);
  }

  // Add initial history
  await supabase.from('shipment_history').insert({
    shipment_tracking: trackingNumber,
    status: 'Registered',
    location: `${data.senderCity || 'طرابلس'} Hub`,
    details_en: 'Shipment created, pending approval and pickup.',
    details_ar: 'تم إدخال الشحنة، في انتظار الموافقة والاستلام.'
  });

  return getShipments();
}

export async function recordWaybillPrinted(trackingNumber) {
  await supabase
    .from('shipments')
    .update({ status: 'Printed' })
    .eq('tracking_number', trackingNumber);

  await supabase.from('shipment_history').insert({
    shipment_tracking: trackingNumber,
    status: 'Printed',
    location: 'مكتب الشحن',
    details_ar: 'تم طباعة بوليصة الشحن',
    details_en: 'Waybill printed'
  });
  return getShipments();
}

export async function editShipment(trackingNumber, updatedData) {
  const newPrice = Number(updatedData.price || 0);
  const newDelFee = Number(updatedData.deliveryFee || 0);
  const newCodFee = Number(updatedData.codFee || 0);
  const { data: existing } = await supabase
    .from('shipments')
    .select('delivery_charge_on')
    .eq('tracking_number', trackingNumber)
    .maybeSingle();
  const senderPays = isSenderPaid(existing?.delivery_charge_on);
  const newProductPrice = senderPays ? newPrice : Math.max(0, newPrice - newDelFee - newCodFee);

  const { error } = await supabase
    .from('shipments')
    .update({
      sender_name: updatedData.senderName,
      sender_phone: updatedData.senderPhone,
      sender_city: updatedData.senderCity,
      receiver_name: updatedData.receiverName,
      receiver_phone: updatedData.receiverPhone,
      receiver_city: updatedData.receiverCity,
      price: newPrice,
      product_price: newProductPrice,
      delivery_fee: newDelFee,
      cod_fee: newCodFee,
    })
    .eq('tracking_number', trackingNumber);
  if (error) console.error('editShipment error:', error);
  return getShipments();
}

export async function deleteShipment(trackingNumber) {
  const { error } = await supabase
    .from('shipments')
    .delete()
    .eq('tracking_number', trackingNumber);
  if (error) console.error('deleteShipment error:', error);
  return getShipments();
}

const inFlightStatusUpdates = new Set();

export async function updateShipmentStatus(trackingNumber, newStatus, location, detailsAr, detailsEn) {
  const lockKey = `${trackingNumber}_${newStatus}`;
  if (inFlightStatusUpdates.has(lockKey)) {
    console.warn(`Ignored duplicate status update request for ${lockKey}`);
    return getShipments();
  }
  inFlightStatusUpdates.add(lockKey);

  try {
    const { data: existingSh } = await supabase
      .from('shipments')
      .select('status')
      .eq('tracking_number', trackingNumber)
      .maybeSingle();

    if (existingSh && (existingSh.status === newStatus || ((newStatus === 'Delivered' || newStatus === 'تم التسليم') && (existingSh.status === 'Delivered' || existingSh.status === 'تم التسليم')))) {
      console.warn(`Shipment ${trackingNumber} is already in status ${existingSh.status}, ignoring duplicate update.`);
      return getShipments();
    }

    const { error } = await supabase
      .from('shipments')
      .update({ status: newStatus })
      .eq('tracking_number', trackingNumber);

    if (error) console.error('updateShipmentStatus error:', error);

  let defaultAr = `تم تحديث حالة الشحنة إلى ${newStatus}`;
  if (newStatus === 'In Warehouse' || newStatus === 'تم الاستلام') {
    defaultAr = 'تم استلام الشحنة فعلياً داخل الفرع / مكتب الشحن';
  } else if (newStatus === 'Out for Delivery' || newStatus === 'خارج للتوصيل') {
    defaultAr = 'تم تسليم الشحنة للمندوب (خروج للتوصيل)';
  } else if (newStatus === 'Delivered' || newStatus === 'تم التسليم') {
    defaultAr = 'تم الوصول إلى الوجهة وتسليم الشحنة للزبون';
  } else if (newStatus === 'Returned' || newStatus === 'Failed' || newStatus === 'مرتجع') {
    defaultAr = 'تعذر التسليم / الشحنة مرتجعة';
  }

  // Add history event
  await supabase.from('shipment_history').insert({
    shipment_tracking: trackingNumber,
    status: newStatus,
    location: location || 'Central Sorting Facility',
    details_ar: detailsAr || defaultAr,
    details_en: detailsEn || `Shipment status updated to ${newStatus}`
  });

  // When delivered, record COD in merchant transactions and auto deposit to Main Safe (SAFE-001)
  if (newStatus === 'Delivered' || newStatus === 'تم التسليم') {
    const { data: sh } = await supabase
      .from('shipments')
      .select('*')
      .eq('tracking_number', trackingNumber)
      .single();

      if (sh) {
      const rawCashCollected = Number(sh.price || 0);
      const delFee = Number(sh.delivery_fee || 0);
      const codFee = Number(sh.cod_fee || 0);
      const merchantNet = Math.max(0, rawCashCollected - delFee - codFee);
      const netCustodyAmt = Math.max(0, rawCashCollected - delFee);

      // 1. Record Merchant Credit Transaction
      const { data: existingTx } = await supabase
        .from('transactions')
        .select('id')
        .eq('reference', trackingNumber)
        .eq('type', 'credit');

      if (!existingTx || existingTx.length === 0) {
        await supabase.from('transactions').insert({
          id: `TXN-${Date.now()}`,
          type: 'credit',
          type_ar: `تحصيل COD - شحنة ${trackingNumber}`,
          amount: merchantNet,
          reference: trackingNumber,
          status: 'Completed',
          merchant_id: sh.merchant_id || 'TU-04'
        });
      }

      // 2. Automatically Record Net COD Value into the appropriate Drivers Custody Safe (HQ or Branch)
      const meta = await getBranchMeta();
      const shBranchId = resolveShipmentBranchId(sh, meta);
      const targetCustodySafeId = getBranchCustodySafeId(shBranchId, meta);
      const safeTxs = await getSafeTransactions();
      const alreadySafeRecorded = safeTxs.some(t => t.ref === trackingNumber && t.type === 'deposit');
      if (!alreadySafeRecorded && netCustodyAmt > 0) {
        await recordSafeTransaction({
          safeId: targetCustodySafeId,
          type: 'deposit',
          amount: netCustodyAmt,
          description: `عُهدة نقدية ميدانية مع السائق - شحنة (${trackingNumber})`,
          ref: trackingNumber
        });
      }

      // 3. Update driver cod collected if driver is assigned
      if (sh.assigned_driver_id) {
        const { data: drv } = await supabase
          .from('drivers')
          .select('cod_collected, pending_settlement')
          .eq('id', sh.assigned_driver_id)
          .single();

        if (drv) {
          const driverOwes = netCustodyAmt;
          const newCollected = Number(drv.cod_collected || 0) + driverOwes;
          const newPending = Number(drv.pending_settlement || 0) + driverOwes;
          await supabase
            .from('drivers')
            .update({ cod_collected: newCollected, pending_settlement: newPending })
            .eq('id', sh.assigned_driver_id);
        }
      }
      }
    }

    return getShipments();
  } finally {
    inFlightStatusUpdates.delete(lockKey);
  }
}

export async function assignDriverToShipment(trackingNumber, driverId) {
  const updateData = { assigned_driver_id: driverId };
  if (driverId) {
    updateData.status = 'Out for Delivery';
  }

  const { error } = await supabase
    .from('shipments')
    .update(updateData)
    .eq('tracking_number', trackingNumber);
  if (error) console.error('assignDriverToShipment error:', error);

  if (driverId) {
    const { data: drv } = await supabase.from('drivers').select('name, phone').eq('id', driverId).single();
    const driverName = drv?.name || driverId;
    const driverPhone = drv?.phone || '';
    await supabase.from('shipment_history').insert({
      shipment_tracking: trackingNumber,
      status: 'Out for Delivery',
      location: 'الفرع / المحطة',
      details_ar: driverPhone ? `تم تسليم الشحنة للمندوب ${driverName} (رقم الهاتف: ${driverPhone})` : `تم تسليم الشحنة للمندوب ${driverName}`,
      details_en: `Handed to driver ${driverName} (${driverPhone})`
    });
  }

  return getShipments();
}

// ─── Users / Merchants ────────────────────────────────────────

export async function getUsers() {
  const [meta, { data: merchants, error }] = await Promise.all([
    getBranchMeta(),
    supabase.from('merchants').select('*')
  ]);
  if (error) return [];
  
  // Calculate balances dynamically (shipments table primary key is tracking_number)
  const { data: shipments } = await supabase.from('shipments').select('tracking_number, price, product_price, delivery_fee, cod_fee, status, merchant_id, delivery_charge_on');
  const { data: payouts } = await supabase.from('payout_requests').select('id, amount, status, merchant_id');
  const { data: transactions } = await supabase.from('transactions').select('id, amount, type, reference, type_ar, merchant_id');

  return merchants.map(m => {
    const mShipments = (shipments || []).filter(s => s.merchant_id === m.id && (s.status === 'Delivered' || s.status === 'تم التسليم'));
    const mApprovedPayouts = (payouts || []).filter(p => p.merchant_id === m.id && p.status === 'Approved');
    const mTransactions = (transactions || []).filter(t => t.merchant_id === m.id);
    
    const totalEarnedFromShipments = mShipments.reduce((sum, s) => {
      const price = Number(s.price || 0);
      const deliveryFee = Number(s.delivery_fee || 0);
      const codFee = Number(s.cod_fee || 0);
      return sum + Math.max(0, price - deliveryFee - codFee);
    }, 0);

    const totalWithdrawnFromPayouts = mApprovedPayouts.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    // Only count manual credit/debit transactions that are NOT already recorded as shipment COD or payout withdrawals
    const manualCredits = mTransactions.filter(t => {
      if (t.type !== 'credit' || Number(t.amount || 0) <= 0) return false;
      const ref = String(t.reference || '');
      const typeAr = String(t.type_ar || '');
      if (ref.startsWith('STX-') || ref.startsWith('STL-') || ref.startsWith('SAFE') || ref.startsWith('TXN-') || ref.startsWith('TX-') || typeAr.includes('تحصيل')) return false;
      const isShipmentRef = (shipments || []).some(s => 
        (s.tracking_number && (ref === s.tracking_number || ref.includes(s.tracking_number)))
      );
      return !isShipmentRef;
    }).reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const manualDebits = mTransactions.filter(t => {
      if ((t.type !== 'debit' && Number(t.amount || 0) >= 0) || t.type?.startsWith('safe_')) return false;
      const ref = String(t.reference || '');
      if (ref.startsWith('STX-') || ref.startsWith('STL-') || ref.startsWith('SAFE')) return false;
      const isPayoutRef = (payouts || []).some(p => p.id === ref || ref.includes(String(p.id)));
      return !isPayoutRef;
    }).reduce((sum, t) => sum + Math.abs(Number(t.amount || 0)), 0);

    const totalEarned = totalEarnedFromShipments + manualCredits;
    const totalWithdrawn = totalWithdrawnFromPayouts + manualDebits;
    const walletBalance = totalEarned - totalWithdrawn;
    
    return {
      id: m.id,
      name: m.owner_name || (m.id === 'TU-01' ? 'أحمد الورفلي' : (m.id === 'TU-02' ? 'فاطمة الزهراء' : 'سليمان الورفلي')),
      storeName: m.store_name,
      email: m.email || (m.id === 'TU-01' ? 'owner@elegance.ly' : (m.id === 'TU-02' ? 'fatima@elite.ly' : 'suleiman@gameworld.ly')),
      phone: m.phone || '0912223344',
      verified: !!m.active,
      joinDate: m.created_at ? new Date(m.created_at).toISOString().split('T')[0] : (m.id === 'TU-01' ? '2026-06-15' : (m.id === 'TU-02' ? '2026-07-01' : (m.id.startsWith('usr-') ? new Date().toISOString().split('T')[0] : '2026-07-08'))),
      walletBalance,
      totalEarned,
      totalWithdrawn,
      branchId: meta.assignments?.merchants?.[m.id] || 'MAIN'
    };
  });
}

export async function addMerchant(data) {
  const { data: existingList } = await supabase.from('merchants').select('id');
  const nextIdx = (existingList?.length || 4) + 1;
  const newId = data.id || `TU-${String(nextIdx).padStart(2, '0')}-${Math.floor(10 + Math.random() * 89)}`;
  const cleanPhone = String(data.phone || '').replace(/[\s\+\-]/g, '');

  const payload = {
    id: newId,
    store_name: data.storeName,
    owner_name: data.name || data.ownerName,
    phone: cleanPhone,
    email: data.email || `${newId.toLowerCase()}@tamowil.ly`,
    active: data.verified !== false,
    wallet_balance: 0
  };

  const { error } = await supabase.from('merchants').insert(payload);
  if (error) {
    console.error('addMerchant error:', error);
    throw new Error(error.message || 'تعذر إنشاء حساب التاجر');
  }

  if (data.branchId && data.branchId !== 'MAIN') {
    await assignEntityToBranch('merchants', newId, data.branchId);
  }

  return getUsers();
}

export async function toggleUserVerification(id) {
  const { data: m } = await supabase.from('merchants').select('active, store_name, phone').eq('id', id).single();
  if (m) {
    const nextState = !m.active;
    await supabase.from('merchants').update({ active: nextState }).eq('id', id);

    // Send WhatsApp notification if the account is activated (nextState is true)
    if (nextState && m.phone) {
      try {
        const cleanNumber = m.phone.replace(/[\s\+\-]/g, '');
        let formattedNumber = cleanNumber;
        if (cleanNumber.startsWith('0')) {
          formattedNumber = '218' + cleanNumber.substring(1);
        } else if (!cleanNumber.startsWith('218')) {
          formattedNumber = '218' + cleanNumber;
        }

        const msgText = `مرحباً *${m.store_name}*، تم تفعيل حسابك بنجاح من قبل الإدارة! يمكنك الآن تسجيل الدخول إلى لوحة التحكم واستخدام التطبيق.\n\nHello *${m.store_name}*, your account has been successfully approved and activated by the administration! You can now log in to the dashboard and start using the app.`;

        await fetch('https://expensive-michelle-huwiyyaa-4d991118.koyeb.app/message/sendText/tamowil', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': '93AA898378E7-45D8-9D3D-E437067B4B74'
          },
          body: JSON.stringify({
            number: formattedNumber,
            text: msgText,
            delay: 1000
          })
        });
      } catch (err) {
        console.error('Error sending approval WhatsApp notification:', err);
      }
    }
  }
  return getUsers();
}

// ─── Payout Requests ─────────────────────────────────────────

export async function getPayoutRequests() {
  const [meta, { data, error }] = await Promise.all([
    getBranchMeta(),
    supabase
      .from('payout_requests')
      .select('*')
      .order('requested_at', { ascending: false })
  ]);
  if (error) return [];
  return data.map(p => ({
    id: p.id,
    merchantId: p.merchant_id,
    merchantName: p.merchant_name,
    storeName: p.store_name,
    merchantStore: p.store_name,
    amount: Number(p.amount),
    bankDetails: p.bank_details,
    bankAccount: p.bank_details,
    status: p.status,
    requestedAt: p.requested_at ? new Date(p.requested_at) : null,
    processedAt: p.processed_at ? new Date(p.processed_at) : null,
    note: p.note || '',
    branchId: meta.assignments?.merchants?.[p.merchant_id] || 'MAIN'
  }));
}

const inFlightPayouts = new Set();
const inFlightManualCredits = new Set();
const inFlightSettlements = new Set();

export async function approvePayoutRequest(id, safeId = 'SAFE-001') {
  if (inFlightPayouts.has(id)) return getPayoutRequests();
  inFlightPayouts.add(id);
  try {
  const { data: p } = await supabase.from('payout_requests').select('*').eq('id', id).single();
  if (!p) throw new Error('طلب السحب غير موجود.');
  if (p.status === 'Approved') return getPayoutRequests();
  
  const amtVal = Number(p.amount || 0);
  if (safeId) {
    const safes = await getSafes();
    const safeObj = safes.find(s => s.id === safeId);
    const currentSafeBal = Number(safeObj?.balance || 0);
    if (currentSafeBal < amtVal) {
      throw new Error(`رصيد الخزينة المحددة (${safeObj?.name || safeId}) غير كافٍ لصرف المبلغ. الرصيد المتاح: ${currentSafeBal} د.ل - المطلوب: ${amtVal} د.ل`);
    }
  }

  await supabase
    .from('payout_requests')
    .update({ status: 'Approved', processed_at: new Date(), note: 'تم الموافقة على التحويل بنجاح.' })
    .eq('id', id);
  
  await supabase.from('transactions').insert({
    id: `TXN-${Date.now()}`,
    type: 'debit',
    type_ar: `سحب رصيد مالي - ${p.id}`,
    amount: -amtVal,
    reference: p.id,
    status: 'Completed',
    merchant_id: p.merchant_id
  });

  if (safeId) {
    await recordSafeTransaction({
      safeId: safeId,
      type: 'withdrawal',
      amount: amtVal,
      description: `صرف طلب سحب أرباح للتاجر (${p.store_name || p.merchant_name})`,
      ref: p.id
    });
  }

  return getPayoutRequests();
  } finally {
    inFlightPayouts.delete(id);
  }
}

export async function rejectPayoutRequest(id) {
  await supabase
    .from('payout_requests')
    .update({ status: 'Rejected', processed_at: new Date(), note: 'طلب مرفوض - البيانات البنكية خاطئة' })
    .eq('id', id);
  return getPayoutRequests();
}

// ─── Transaction Log ──────────────────────────────────────────

export async function getTransactionLog() {
  const [meta, { data, error }] = await Promise.all([
    getBranchMeta(),
    supabase
      .from('transactions')
      .select('*, merchants(store_name)')
  ]);
  if (error) return [];
  return data.map(tx => ({
    id: tx.id,
    type: tx.type,
    merchantId: tx.merchant_id,
    storeName: tx.merchants?.store_name || 'متجر غير معروف',
    amount: Number(tx.amount),
    description: tx.type_ar,
    ref: tx.reference,
    date: tx.date ? new Date(tx.date) : null,
    branchId: meta.assignments?.merchants?.[tx.merchant_id] || meta.assignments?.safes?.[tx.merchant_id] || 'MAIN'
  }));
}

export async function manualCredit(merchantId, amount, description, type = 'payout', safeId = 'SAFE-001') {
  const amtVal = Math.abs(Number(amount || 0));
  if (amtVal <= 0) throw new Error('المبلغ يجب أن يكون أكبر من صفر');

  const lockKey = `${merchantId}_${type}_${amtVal}`;
  if (inFlightManualCredits.has(lockKey)) return getTransactionLog();
  inFlightManualCredits.add(lockKey);

  try {
  const safes = await getSafes();
  const safeObj = safes.find(s => s.id === safeId);

  // Validate safe balance when paying out cash from the safe to the merchant (payout / credit)
  const isCashLeavingSafe = (type === 'payout' || type === 'credit');
  if (safeId && isCashLeavingSafe) {
    const currentSafeBal = Number(safeObj?.balance || 0);
    if (currentSafeBal < amtVal) {
      throw new Error(`رصيد الخزينة المحددة (${safeObj?.name || safeId}) غير كافٍ لصرف المبلغ للتاجر. الرصيد المتاح: ${currentSafeBal} د.ل - المطلوب: ${amtVal} د.ل`);
    }
  }

  const isMerchantBalanceIncrease = (type === 'credit');
  const transactionAmt = isMerchantBalanceIncrease ? amtVal : -amtVal;

  let defaultDesc = 'تسوية وصرف أرباح التاجر';
  if (type === 'credit') defaultDesc = 'إيداع / شحن يدوي في المحفظة';
  if (type === 'debit') defaultDesc = 'تحصيل وتخصيص نقدي من المحفظة';

  const txId = `TXN-${Date.now()}`;

  await supabase.from('transactions').insert({
    id: txId,
    type: isMerchantBalanceIncrease ? 'credit' : 'debit',
    type_ar: description || defaultDesc,
    amount: transactionAmt,
    reference: txId,
    merchant_id: merchantId
  });

  if (safeId) {
    // payout: Cash leaves safe to merchant -> withdrawal (-) from safe
    // credit: Cash leaves safe to merchant wallet -> withdrawal (-) from safe
    // debit: Cash collected from merchant into safe -> deposit (+) into safe
    const safeTxType = (type === 'payout' || type === 'credit') ? 'withdrawal' : 'deposit';
    const safeTxDesc = (type === 'payout' || type === 'credit')
      ? `صرف وتسوية أرباح التاجر نقداً من الخزينة (${description || defaultDesc})`
      : `استلام وتحصيل نقدي من التاجر إلى الخزينة (${description || defaultDesc})`;

    await recordSafeTransaction({
      safeId: safeId,
      type: safeTxType,
      amount: amtVal,
      description: safeTxDesc,
      ref: txId
    });
  }

  // Sync computed merchant wallet balance into Supabase merchants table column
  try {
    const merchants = await getUsers();
    const updatedM = merchants.find(m => m.id === merchantId);
    if (updatedM) {
      await supabase.from('merchants').update({ wallet_balance: updatedM.walletBalance }).eq('id', merchantId);
    }
  } catch (e) {
    console.warn('Sync merchant wallet_balance to DB error:', e);
  }

  return getTransactionLog();
  } finally {
    inFlightManualCredits.delete(lockKey);
  }
}

// ─── Drivers ─────────────────────────────────────────────────

export async function getDrivers() {
  const [meta, { data: drivers, error }] = await Promise.all([
    getBranchMeta(),
    supabase.from('drivers').select('*')
  ]);
  if (error) return [];

  const { data: shipments } = await supabase
    .from('shipments')
    .select('assigned_driver_id, status, price, product_price, delivery_fee, delivery_charge_on');

  const { data: settlements } = await supabase
    .from('driver_settlements')
    .select('driver_id, amount, status');

  return drivers.map(d => {
    const dShipments = (shipments || []).filter(s => s.assigned_driver_id === d.id);
    const deliveredShipments = dShipments.filter(s => s.status === 'Delivered' || s.status === 'تم التسليم');
    
    // Dynamic Single Source of Truth calculation for driver custody
    const totalCollectedFromShipments = deliveredShipments.reduce((sum, s) => {
      const cashCollected = Number(s.price || 0);
      const deliveryFee = Number(s.delivery_fee || 0);
      const driverOwes = Math.max(0, cashCollected - deliveryFee);
      return sum + driverOwes;
    }, 0);

    const dSettlements = (settlements || []).filter(st => st.driver_id === d.id && (st.status === 'Settled' || !st.status));
    const totalSettledFromSettlements = dSettlements.reduce((sum, st) => sum + Number(st.amount || 0), 0);

    const pendingSettlement = Math.max(0, totalCollectedFromShipments - totalSettledFromSettlements);

    const mapped = mapDriverFromDb(d);
    mapped.codCollected = totalCollectedFromShipments > 0 ? totalCollectedFromShipments : mapped.codCollected;
    mapped.codSettled = totalSettledFromSettlements > 0 ? totalSettledFromSettlements : mapped.codSettled;
    mapped.pendingSettlement = pendingSettlement;
    mapped.shipmentsCompleted = deliveredShipments.length;
    mapped.shipmentsToday = dShipments.length;
    mapped.branchId = meta.assignments?.drivers?.[d.id] || 'MAIN';
    return mapped;
  });
}

export async function addDriver(data) {
  const newDriver = {
    id: `DRV-00${Math.floor(10 + Math.random() * 90)}`,
    name: data.name,
    phone: data.phone,
    zone: data.zone,
    active: true,
    rating: 5.0,
    cod_collected: 0,
    cod_settled: 0,
    pending_settlement: 0,
    password: data.password
  };
  await supabase.from('drivers').insert(newDriver);
  if (data.branchId && data.branchId !== 'MAIN') {
    await assignEntityToBranch('drivers', newDriver.id, data.branchId);
  }
  return getDrivers();
}

export async function toggleDriverStatus(id) {
  const { data: d } = await supabase.from('drivers').select('active').eq('id', id).single();
  if (d) {
    await supabase.from('drivers').update({ active: !d.active }).eq('id', id);
  }
  return getDrivers();
}

export async function editDriver(id, updatedData) {
  const { error } = await supabase
    .from('drivers')
    .update({
      phone: updatedData.phone,
      password: updatedData.password
    })
    .eq('id', id);
  if (error) console.error('editDriver error:', error);
  return getDrivers();
}

export async function settleDriver(driverId, amount, note, safeId = 'SAFE-001') {
  const amountVal = Number(amount || 0);
  if (amountVal <= 0) return getDrivers();

  const lockKey = `${driverId}_${amountVal}`;
  if (inFlightSettlements.has(lockKey)) return getDrivers();
  inFlightSettlements.add(lockKey);

  try {
    const meta = await getBranchMeta();
    const drvBranchId = meta.assignments?.drivers?.[driverId] || 'MAIN';
    const custodySafeId = getBranchCustodySafeId(drvBranchId, meta);
    const defaultMainSafeId = getBranchMainSafeId(drvBranchId, meta);
    const targetSafeId = (safeId && (drvBranchId === 'MAIN' || safeId !== 'SAFE-001')) ? safeId : defaultMainSafeId;

    const { data: d } = await supabase.from('drivers').select('*').eq('id', driverId).single();
    if (d) {
      const currentPending = Number(d.pending_settlement || 0);
      const currentSettled = Number(d.cod_settled || 0);
      const settled = amountVal;
      const newSettled = currentSettled + settled;
      const newPending = Math.max(0, currentPending - settled);

      await supabase
        .from('drivers')
        .update({ cod_settled: newSettled, pending_settlement: newPending })
        .eq('id', driverId);

      const stlRef = `STL-${Date.now()}`;

      // Record settlement
      await supabase.from('driver_settlements').insert({
        id: stlRef,
        driver_id: driverId,
        amount: amountVal,
        note: note || 'تسوية يدوية',
        status: 'Settled'
      });

      // 1. Deduct settled amount from Drivers Custody Safe (HQ or Branch Custody Safe)
      await recordSafeTransaction({
        safeId: custodySafeId,
        type: 'withdrawal',
        amount: amountVal,
        description: `تفريغ عُهدة نقدية وتصفية حساب مع السائق (${d.name})`,
        ref: stlRef
      });

      // 2. Deposit net settled amount into Target Main/Branch Safe
      if (targetSafeId) {
        await recordSafeTransaction({
          safeId: targetSafeId,
          type: 'deposit',
          amount: amountVal,
          description: `استلام تسوية عُهدة نقدية من السائق (${d.name})`,
          ref: stlRef
        });
      }
    }
    return getDrivers();
  } finally {
    inFlightSettlements.delete(lockKey);
  }
}

export async function getDriverSettlements() {
  const [meta, { data, error }] = await Promise.all([
    getBranchMeta(),
    supabase
      .from('driver_settlements')
      .select('*, drivers(name)')
      .order('date', { ascending: false })
  ]);
  if (error) return [];
  return data.map(s => ({
    id: s.id,
    driverId: s.driver_id,
    driverName: s.drivers?.name || 'سائق غير معروف',
    amount: Number(s.amount),
    note: s.note,
    date: s.date ? new Date(s.date) : null,
    status: s.status,
    branchId: meta.assignments?.drivers?.[s.driver_id] || 'MAIN'
  }));
}

// ─── City Pricing ─────────────────────────────────────────────

export async function getCityPricing() {
  const { data, error } = await supabase.from('city_pricing').select('*');
  if (error) return [];
  return data.map(c => ({
    city: c.city,
    fee: Number(c.fee),
    codFee: Number(c.cod_fee),
    active: !!c.active
  }));
}

export async function updateCityFee(city, fee, codFee) {
  await supabase
    .from('city_pricing')
    .update({ fee: Number(fee), cod_fee: Number(codFee) })
    .eq('city', city);
  return getCityPricing();
}

export async function toggleCityActive(city) {
  const { data: c } = await supabase.from('city_pricing').select('active').eq('city', city).single();
  if (c) {
    await supabase.from('city_pricing').update({ active: !c.active }).eq('city', city);
  }
  return getCityPricing();
}

export async function deleteDriver(id) {
  const { error } = await supabase.from('drivers').delete().eq('id', id);
  if (error) console.error('deleteDriver error:', error);
  return getDrivers();
}

export async function addCity(city, fee, codFee) {
  await supabase.from('city_pricing').insert({
    city,
    fee: Number(fee),
    cod_fee: Number(codFee),
    active: true
  });
  return getCityPricing();
}

export async function deleteCity(cityName) {
  const { error } = await supabase.from('city_pricing').delete().eq('city', cityName);
  if (error) console.error('deleteCity error:', error);
  return getCityPricing();
}

// ─── Tickets ─────────────────────────────────────────────────

export async function getTickets() {
  const [meta, { data, error }] = await Promise.all([
    getBranchMeta(),
    supabase
      .from('tickets')
      .select('*, messages:ticket_messages(*), merchants(store_name)')
      .order('created_at', { ascending: false })
  ]);
  if (error) return [];
  return data.map(t => ({
    id: t.id,
    merchantId: t.merchant_id,
    branchId: meta.assignments?.merchants?.[t.merchant_id] || 'MAIN',
    userStore: t.merchants?.store_name || 'متجر غير معروف',
    subject: t.subject,
    subjectEn: t.subject_en,
    status: t.status,
    timestamp: t.created_at ? new Date(t.created_at) : null,
    replies: (t.messages || []).map(m => ({
      sender: m.is_user ? 'التاجر (Merchant)' : 'إدارة النظام (Admin)',
      text: m.text,
      timestamp: m.timestamp ? new Date(m.timestamp) : null
    })).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
  }));
}

export async function updateTicketStatus(id, newStatus) {
  await supabase
    .from('tickets')
    .update({ status: newStatus })
    .eq('id', id);
  return getTickets();
}

export async function addTicketReply(id, replyText) {
  await supabase.from('ticket_messages').insert({
    ticket_id: id,
    text: replyText,
    is_user: false
  });
  return getTickets();
}

// ─── Dashboard Stats ──────────────────────────────────────────

export async function getDashboardStats() {
  const shipments = await getShipments();
  const drivers = await getDrivers();
  const users = await getUsers();
  const payoutRequests = await getPayoutRequests();

  const deliveredShipments = shipments.filter(s => s.status === 'Delivered' || s.status === 'تم التسليم');

  const total      = shipments.length;
  const delivered  = deliveredShipments.length;
  const progress   = shipments.filter(s => s.status === 'Out for Delivery' || s.status === 'قيد التوصيل').length;
  const warehouse  = shipments.filter(s => s.status === 'In Warehouse' || s.status === 'بالمستودع' || s.status === 'Printed').length;
  const registered = shipments.filter(s => s.status === 'Registered' || s.status === 'Pending').length;
  const returned   = shipments.filter(s => s.status === 'Returned' || s.status === 'Failed' || s.status === 'مرتجعة').length;

  const totalCodCollected = deliveredShipments.reduce((sum, s) => sum + Number(s.price || 0), 0);
  const grossProfits      = deliveredShipments.reduce((sum, s) => sum + Number(s.deliveryFee || 0) + Number(s.codFee || 0), 0);
  const netCompanyProfits = deliveredShipments.reduce((sum, s) => sum + Number(s.codFee || 0), 0);
  
  const pendingPayouts    = payoutRequests.filter(p => p.status === 'Pending').reduce((sum, p) => sum + p.amount, 0);
  const totalMerchantBalance = users.reduce((sum, u) => sum + u.walletBalance, 0); // Company debt to merchants
  const driversPendingSettlement = drivers.reduce((sum, d) => sum + Number(d.pendingSettlement || d.pending_settlement || 0), 0); // Drivers debt to company
  const activeDrivers     = drivers.filter(d => d.active).length;

  // Dynamic 7-day daily revenue calculation
  const now = new Date();
  const dailyRevenue = [0, 0, 0, 0, 0, 0, 0];
  deliveredShipments.forEach(s => {
    const sDate = s.createdAt ? new Date(s.createdAt) : now;
    const diffDays = Math.floor((now - sDate) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays < 7) {
      dailyRevenue[6 - diffDays] += Number(s.codFee || 0) + Number(s.deliveryFee || 0);
    }
  });

  return {
    total, delivered, progress, warehouse, registered, returned,
    totalCodCollected, grossProfits, netCompanyProfits,
    totalRevenue: netCompanyProfits,
    pendingPayouts, totalMerchantBalance, driversPendingSettlement,
    activeDrivers, dailyRevenue,
    pendingPayoutsCount: payoutRequests.filter(p => p.status === 'Pending').length,
  };
}

// ─── Employees / Admin Users (Local Storage Mock) ─────────────

const ADMIN_STORAGE_KEY = 'vanex_admin_users_prod_v1';

export async function getEmployees() {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(ADMIN_STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return [];
}

export async function saveEmployee(employee) {
  if (typeof window === 'undefined') return;
  const employees = await getEmployees();
  
  if (employee.id) {
    const idx = employees.findIndex(e => e.id === employee.id);
    if (idx !== -1) {
      employees[idx] = employee;
    } else {
      employees.push(employee);
    }
  } else {
    employee.id = 'emp_' + Date.now();
    employees.push(employee);
  }
  
  localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(employees));
  return employees;
}

export async function deleteEmployee(id) {
  if (typeof window === 'undefined') return;
  const employees = await getEmployees();
  const filtered = employees.filter(e => e.id !== id);
  localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(filtered));
  return filtered;
}

// ─── Safes / Treasury System (100% Supabase Database Direct) ─────────
const DEFAULT_SAFES = [
  { id: 'SAFE-001', name: 'الخزينة الرئيسية (المركز)', code: 'SAFE-MAIN', branch: 'المركز الرئيسي', initialBalance: 0, balance: 0, active: true, notes: 'خزينة السيولة النقدية الرئيسية في المقر' },
  { id: 'SAFE-005', name: 'خزينة عُهد السائقين (العهد الميدانية)', code: 'SAFE-DRIVERS', branch: 'ميداني / السائقين', initialBalance: 0, balance: 0, active: true, notes: 'إجمالي المبالغ النقدية المتداولة كـ عُهد مع السائقين قبل التسوية' }
];

export async function getSafeTransactions() {
  let txs = [];

  // 1. Fetch from dedicated safe_transactions table in Supabase DB
  try {
    const { data: dedicatedTxs, error: dedicatedErr } = await supabase
      .from('safe_transactions')
      .select('*')
      .order('date', { ascending: false });

    if (!dedicatedErr && dedicatedTxs) {
      txs = dedicatedTxs.map(t => ({
        id: t.id,
        safeId: t.safe_id,
        safeName: t.safe_name,
        type: t.type,
        amount: Number(t.amount || 0),
        description: t.description,
        ref: t.reference,
        date: t.date || new Date().toISOString()
      }));
    }
  } catch (e) {
    console.warn('Fetch safe_transactions error:', e);
  }

  // 2. Fetch from Supabase transactions table as backup
  try {
    const { data: dbTxs } = await supabase
      .from('transactions')
      .select('*')
      .in('type', ['safe_deposit', 'safe_withdrawal', 'safe_transfer_in', 'safe_transfer_out'])
      .order('date', { ascending: false });

    if (dbTxs && dbTxs.length > 0) {
      for (const t of dbTxs) {
        let safeId = t.merchant_id || 'SAFE-001';
        let safeName = 'الخزينة';
        let ref = t.reference || t.id;

        if (t.reference && t.reference.includes('::')) {
          const parts = t.reference.split('::');
          safeId = parts[0] || safeId;
          safeName = parts[1] || safeName;
          ref = parts[2] || ref;
        }

        const rawType = (t.type || '').replace('safe_', '');
        if (!txs.some(x => x.id === t.id)) {
          txs.push({
            id: t.id,
            safeId,
            safeName,
            type: rawType,
            amount: Number(t.amount || 0),
            description: t.type_ar || 'معاملة خزينة',
            ref,
            date: t.date || new Date().toISOString()
          });
        }
      }
    }
  } catch (err) {
    console.warn('Fetch transactions backup error:', err);
  }

  // Deduplicate safe transactions by unique ID and by logical reference (shipment/settlement/payout)
  const uniqueTxs = [];
  const seenKeys = new Set();
  for (const t of txs) {
    const refStr = String(t.ref || '');
    const isUniqueRefOp =
      refStr.startsWith('TO-') ||
      refStr.startsWith('STL-') ||
      refStr.startsWith('PAY-') ||
      refStr.startsWith('TXN-') ||
      refStr.startsWith('TX-');
    const logicalKey = isUniqueRefOp ? `${t.safeId}_${refStr}_${t.type}` : (t.id ? t.id : `${t.safeId}_${refStr}_${t.type}`);
    const idKey = t.id || logicalKey;
    if (!seenKeys.has(logicalKey) && !seenKeys.has(idKey)) {
      seenKeys.add(logicalKey);
      seenKeys.add(idKey);
      uniqueTxs.push(t);
    }
  }

  return uniqueTxs.sort((a, b) => new Date(b.date) - new Date(a.date));
}

const syncingSafeShipmentRefs = new Set();

export async function getSafes() {
  let safes = [];
  const meta = await getBranchMeta();

  // Fetch strictly from dedicated safes table in Supabase DB
  try {
    const { data: dedicatedSafes, error: dedicatedErr } = await supabase
      .from('safes')
      .select('*');

    if (!dedicatedErr && dedicatedSafes) {
      safes = dedicatedSafes
        .filter(s => s.id !== META_SAFE_ID && s.code !== 'SYS_META')
        .map(s => ({
          id: s.id,
          name: s.name,
          code: s.code,
          branch: s.branch,
          initialBalance: Number(s.initial_balance || 0),
          balance: Number(s.balance || 0),
          active: s.active,
          notes: s.notes
        }));
    }
  } catch (e) {
    console.warn('Fetch safes error:', e);
  }

  // Ensure each branch has its Main Safe and Custody Safe represented
  for (const br of (meta.branches || [])) {
    const mainId = br.mainSafeId || `SAFE-MAIN-${br.id}`;
    const custId = br.custodySafeId || `SAFE-CUST-${br.id}`;
    if (!safes.some(s => s.id === mainId)) {
      safes.push({
        id: mainId,
        name: `خزينة ${br.name}`,
        code: `${br.code || br.id}-SAFE`,
        branch: br.name,
        initialBalance: 0,
        balance: 0,
        active: true,
        notes: `الخزينة الرئيسية المخصصة لـ ${br.name}`
      });
    }
    if (!safes.some(s => s.id === custId)) {
      safes.push({
        id: custId,
        name: `خزينة عُهد السائقين - ${br.name}`,
        code: `${br.code || br.id}-CUST`,
        branch: br.name,
        initialBalance: 0,
        balance: 0,
        active: true,
        notes: `خزينة العهد الميدانية للسائقين التابعين لـ ${br.name}`
      });
    }
  }

  // 2. Fetch all safe transactions 100% live from Supabase DB
  let txs = await getSafeTransactions();

  // 3. Auto-sync delivered shipments live from Supabase shipments table into the appropriate Custody Safe (HQ or Branch)
  try {
    const { data: deliveredShipments } = await supabase
      .from('shipments')
      .select('tracking_number, price, product_price, delivery_fee, cod_fee, status, delivery_charge_on, merchant_id, assigned_driver_id')
      .in('status', ['Delivered', 'تم التسليم']);

    if (deliveredShipments && deliveredShipments.length > 0) {
      for (const sh of deliveredShipments) {
        const trk = sh.tracking_number;
        if (syncingSafeShipmentRefs.has(trk)) continue;
        syncingSafeShipmentRefs.add(trk);
        try {
          const shBranchId = resolveShipmentBranchId(sh, meta);
          const targetCustodySafeId = getBranchCustodySafeId(shBranchId, meta);
          const safeObj = safes.find(s => s.id === targetCustodySafeId);

          const { data: dbCheck } = await supabase
            .from('safe_transactions')
            .select('id')
            .eq('reference', trk)
            .eq('type', 'deposit');

          const alreadyRecorded = dbCheck && dbCheck.length > 0;
          if (!alreadyRecorded) {
            const rawCashCollected = Number(sh.price || 0);
            const delFee = Number(sh.delivery_fee || 0);
            const netCustodyAmt = Math.max(0, rawCashCollected - delFee);

            if (netCustodyAmt > 0) {
              const txId = `STX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
              const desc = `عُهدة نقدية ميدانية مع السائق - شحنة (${trk})`;
              
              await supabase.from('safe_transactions').insert({
                id: txId,
                safe_id: targetCustodySafeId,
                safe_name: safeObj?.name || 'خزينة عُهد السائقين',
                type: 'deposit',
                amount: netCustodyAmt,
                description: desc,
                reference: trk
              });

              await supabase.from('transactions').insert({
                id: txId,
                type: 'safe_deposit',
                type_ar: desc,
                amount: netCustodyAmt,
                reference: `${targetCustodySafeId}::${safeObj?.name || 'خزينة عُهد السائقين'}::${trk}`,
                status: 'Completed',
                merchant_id: targetCustodySafeId
              });

              txs.unshift({
                id: txId,
                safeId: targetCustodySafeId,
                safeName: safeObj?.name || 'خزينة عُهد السائقين',
                type: 'deposit',
                amount: netCustodyAmt,
                description: desc,
                ref: trk,
                date: new Date().toISOString()
              });
            }
          }
        } finally {
          syncingSafeShipmentRefs.delete(trk);
        }
      }
    }
  } catch (err) {
    console.warn('Sync delivered shipments to safes error:', err);
  }

  // 4. Recalculate dynamic balance 100% from actual logged DB transactions + enrich with branchId & role flags
  return safes.map(s => {
    const safeTxs = txs.filter(t => t.safeId === s.id);
    const deposits = safeTxs
      .filter(t => t.type === 'deposit' || t.type === 'transfer_in')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const withdrawals = safeTxs
      .filter(t => t.type === 'withdrawal' || t.type === 'transfer_out')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const initial = Number(s.initialBalance || 0);
    const matchedBranch = (meta.branches || []).find(
      b => b.mainSafeId === s.id || b.custodySafeId === s.id || b.id === s.branch || b.name === s.branch
    );
    const resolvedBranchId =
      meta.assignments?.safes?.[s.id] ||
      matchedBranch?.id ||
      (s.id.startsWith('SAFE-MAIN-BR-') ? s.id.replace('SAFE-MAIN-', '') : null) ||
      (s.id.startsWith('SAFE-CUST-BR-') ? s.id.replace('SAFE-CUST-', '') : null) ||
      'MAIN';

    const isMainSafe =
      s.id === 'SAFE-001' ||
      s.id.startsWith('SAFE-MAIN-') ||
      (meta.branches || []).some(b => b.mainSafeId === s.id);
    const isCustodySafe =
      s.id === 'SAFE-005' ||
      s.id.startsWith('SAFE-CUST-') ||
      (meta.branches || []).some(b => b.custodySafeId === s.id);

    return {
      ...s,
      branchId: resolvedBranchId,
      isMainSafe,
      isCustodySafe,
      balance: Math.max(0, initial + deposits - withdrawals)
    };
  });
}

export async function addSafe(safeData) {
  const initialVal = Number(safeData.initialBalance || 0);
  const newSafe = {
    id: `SAFE-${Date.now()}`,
    name: safeData.name,
    code: safeData.code || `SAFE-${Math.floor(100 + Math.random() * 900)}`,
    branch: safeData.branch || 'الفرع الرئيسي',
    initialBalance: initialVal,
    balance: initialVal,
    active: true,
    notes: safeData.notes || ''
  };

  // Insert Safe into Supabase DB safes table
  try {
    await supabase.from('safes').insert({
      id: newSafe.id,
      name: newSafe.name,
      code: newSafe.code,
      branch: newSafe.branch,
      initial_balance: initialVal,
      balance: initialVal,
      active: true,
      notes: newSafe.notes || ''
    });
  } catch (e) {
    console.warn('Insert safe to Supabase error:', e);
  }

  if (safeData.branchId && safeData.branchId !== 'MAIN') {
    await assignEntityToBranch('safes', newSafe.id, safeData.branchId);
  } else {
    await assignEntityToBranch('safes', newSafe.id, 'MAIN');
  }

  // Log initial balance transaction if > 0
  if (initialVal > 0) {
    await recordSafeTransaction({
      safeId: newSafe.id,
      type: 'deposit',
      amount: initialVal,
      description: 'الرصيد الافتتاحي عند إنشاء الخزينة',
      ref: 'INITIAL'
    });
  }

  return getSafes();
}

export async function updateSafe(safeId, updatedFields) {
  const initialVal = Number(updatedFields.initialBalance || 0);

  // Update in Supabase DB safes table directly
  try {
    await supabase.from('safes').update({
      name: updatedFields.name,
      code: updatedFields.code,
      branch: updatedFields.branch,
      initial_balance: initialVal,
      notes: updatedFields.notes
    }).eq('id', safeId);
  } catch (e) {
    console.warn('Update safe in Supabase error:', e);
  }

  return getSafes();
}

export async function deleteSafe(safeId) {
  if (safeId === 'SAFE-001' || safeId === 'SAFE-005' || safeId === META_SAFE_ID) return getSafes();

  try {
    await supabase.from('safes').delete().eq('id', safeId);
    await supabase.from('safe_transactions').delete().eq('safe_id', safeId);
  } catch (e) {
    console.warn('Delete safe from Supabase error:', e);
  }

  return getSafes();
}

export async function recordSafeTransaction({ safeId, type, amount, description, ref }) {
  const safes = await getSafes();
  const amtVal = Math.abs(Number(amount || 0));
  const safeObj = safes.find(s => s.id === safeId);
  const currentBal = Number(safeObj?.balance || 0);
  const isCustody = safeId === 'SAFE-005' || safeId.startsWith('SAFE-CUST-') || !!safeObj?.isCustodySafe;

  // Validate balance if withdrawing from safe (except field driver custody safe)
  if ((type === 'withdrawal' || type === 'transfer_out') && !isCustody) {
    if (currentBal < amtVal) {
      throw new Error(`رصيد الخزينة المحددة (${safeObj?.name || safeId}) غير كافٍ لإتمام العملية. الرصيد المتاح: ${currentBal} د.ل - المطلوب: ${amtVal} د.ل`);
    }
  }

  const txId = `STX-${Date.now()}-${Math.floor(Math.random() * 100)}`;
  const descStr = description || 'معاملة خزينة';
  const refStr = ref || 'SYS';

  // Persist Transaction into Supabase DB safe_transactions & transactions tables
  try {
    await supabase.from('safe_transactions').insert({
      id: txId,
      safe_id: safeId,
      safe_name: safeObj?.name || safeId,
      type,
      amount: amtVal,
      description: descStr,
      reference: refStr
    });
  } catch (e) {}

  try {
    await supabase.from('transactions').insert({
      id: txId,
      type: `safe_${type}`,
      type_ar: descStr,
      amount: amtVal,
      reference: `${safeId}::${safeObj?.name || safeId}::${refStr}`,
      status: 'Completed',
      merchant_id: safeId
    });
  } catch (e) {}

  // Sync new balance directly to Supabase safes table column
  try {
    const updatedSafes = await getSafes();
    const updatedSafeObj = updatedSafes.find(s => s.id === safeId);
    if (updatedSafeObj) {
      await supabase.from('safes').update({ balance: updatedSafeObj.balance }).eq('id', safeId);
    }
  } catch (e) {
    console.warn('Sync safe balance to DB error:', e);
  }

  return getSafeTransactions();
}

export async function transferBetweenSafes(fromSafeId, toSafeId, amount, note) {
  const amtVal = Number(amount || 0);
  if (amtVal <= 0 || fromSafeId === toSafeId) return getSafes();

  const safes = await getSafes();
  const fromSafe = safes.find(s => s.id === fromSafeId);
  const toSafe = safes.find(s => s.id === toSafeId);
  const fromBal = Number(fromSafe?.balance || 0);

  if (fromBal < amtVal) {
    throw new Error(`رصيد الخزينة المصدر (${fromSafe?.name || fromSafeId}) غير كافٍ للتحويل. الرصيد المتاح: ${fromBal} د.ل - المطلوب: ${amtVal} د.ل`);
  }

  await recordSafeTransaction({
    safeId: fromSafeId,
    type: 'transfer_out',
    amount: amtVal,
    description: `تحويل صادرة إلى (${toSafe?.name || toSafeId}) - ${note || ''}`,
    ref: 'TRANSFER'
  });

  await recordSafeTransaction({
    safeId: toSafeId,
    type: 'transfer_in',
    amount: amtVal,
    description: `تحويل واردة من (${fromSafe?.name || fromSafeId}) - ${note || ''}`,
    ref: 'TRANSFER'
  });

  return getSafes();
}

export async function resetSystemData() {
  await supabase.from('shipment_history').delete().neq('id', 0);
  await supabase.from('shipments').delete().neq('tracking_number', '0');
  await supabase.from('transactions').delete().neq('id', '0');
  await supabase.from('payout_requests').delete().neq('id', '0');
  await supabase.from('driver_settlements').delete().neq('id', '0');
  await supabase.from('safe_transactions').delete().neq('id', '0');
  await supabase.from('safes').update({ balance: 0, initial_balance: 0 }).neq('id', META_SAFE_ID);
  await supabase.from('drivers').update({ cod_collected: 0, cod_settled: 0, pending_settlement: 0 }).neq('id', '0');
  await supabase.from('merchants').update({ wallet_balance: 0 }).neq('id', '0');
  return true;
}


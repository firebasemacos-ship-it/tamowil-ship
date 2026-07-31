import { supabase } from './supabaseClient';

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
    price: Number(sh.price || 0),
    deliveryFee: Number(sh.delivery_fee || 0),
    codFee: Number(sh.cod_fee || 0),
    cargoType: sh.cargo_type,
    quantity: Number(sh.quantity || 1),
    productPrice: Number(sh.product_price || 0),
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
  const { data, error } = await supabase
    .from('shipments')
    .select('*, history:shipment_history(*)');
  if (error) {
    console.error('getShipments error:', error);
    return [];
  }
  return data.map(mapShipmentFromDb);
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

  // Add initial history
  await supabase.from('shipment_history').insert({
    shipment_tracking: trackingNumber,
    status: 'Registered',
    location: `${data.senderCity || 'طرابلس'} Hub`,
    details_en: 'Shipment created and confirmed.',
    details_ar: 'تم إنشاء الشحنة وتأكيد البيانات.'
  });

  return getShipments();
}

export async function editShipment(trackingNumber, updatedData) {
  const { error } = await supabase
    .from('shipments')
    .update({
      sender_name: updatedData.senderName,
      sender_phone: updatedData.senderPhone,
      sender_city: updatedData.senderCity,
      receiver_name: updatedData.receiverName,
      receiver_phone: updatedData.receiverPhone,
      receiver_city: updatedData.receiverCity,
      price: Number(updatedData.price || 0),
      delivery_fee: Number(updatedData.deliveryFee || 0),
      cod_fee: Number(updatedData.codFee || 0),
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

export async function updateShipmentStatus(trackingNumber, newStatus, location, detailsAr, detailsEn) {
  const { error } = await supabase
    .from('shipments')
    .update({ status: newStatus })
    .eq('tracking_number', trackingNumber);

  if (error) console.error('updateShipmentStatus error:', error);

  // Add history event
  await supabase.from('shipment_history').insert({
    shipment_tracking: trackingNumber,
    status: newStatus,
    location: location || 'Central Sorting Facility',
    details_ar: detailsAr || `تم تحديث حالة الشحنة إلى ${newStatus}`,
    details_en: detailsEn || `Shipment status updated to ${newStatus}`
  });

  // When delivered, record COD in merchant transactions if applicable
  if (newStatus === 'Delivered') {
    const { data: sh } = await supabase
      .from('shipments')
      .select('*')
      .eq('tracking_number', trackingNumber)
      .single();

    if (sh) {
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
          amount: Number(sh.price || 0) - Number(sh.delivery_fee || 0) - Number(sh.cod_fee || 0),
          reference: trackingNumber,
          status: 'Completed',
          merchant_id: sh.merchant_id || 'TU-04'
        });
      }

      // Update driver cod collected if driver is assigned
      if (sh.assigned_driver_id) {
        const { data: drv } = await supabase
          .from('drivers')
          .select('cod_collected, pending_settlement')
          .eq('id', sh.assigned_driver_id)
          .single();

        if (drv) {
          const driverOwes = (sh.delivery_charge_on === 'المرسل') ? Number(sh.price || 0) : (Number(sh.price || 0) - Number(sh.delivery_fee || 0));
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
}

export async function assignDriverToShipment(trackingNumber, driverId) {
  const { error } = await supabase
    .from('shipments')
    .update({ assigned_driver_id: driverId })
    .eq('tracking_number', trackingNumber);
  if (error) console.error('assignDriverToShipment error:', error);
  return getShipments();
}

// ─── Users / Merchants ────────────────────────────────────────

export async function getUsers() {
  const { data: merchants, error } = await supabase.from('merchants').select('*');
  if (error) return [];
  
  // Calculate balances dynamically
  const { data: shipments } = await supabase.from('shipments').select('price, delivery_fee, cod_fee, status, merchant_id');
  const { data: payouts } = await supabase.from('payout_requests').select('amount, status, merchant_id');

  return merchants.map(m => {
    const mShipments = (shipments || []).filter(s => s.merchant_id === m.id && s.status === 'Delivered');
    const mApprovedPayouts = (payouts || []).filter(p => p.merchant_id === m.id && p.status === 'Approved');
    
    const totalEarned = mShipments.reduce((sum, s) => sum + (Number(s.price || 0) - Number(s.delivery_fee || 0) - Number(s.cod_fee || 0)), 0);
    const totalWithdrawn = mApprovedPayouts.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const walletBalance = Math.max(0, totalEarned - totalWithdrawn);
    
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
      totalWithdrawn
    };
  });
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

        const msgText = `🎉 مرحباً *${m.store_name}*، تم تفعيل حسابك بنجاح من قبل الإدارة! يمكنك الآن تسجيل الدخول إلى لوحة التحكم واستخدام التطبيق.\n\nHello *${m.store_name}*, your account has been successfully approved and activated by the administration! You can now log in to the dashboard and start using the app.`;

        await fetch('https://expensive-michelle-huwiyyaa-4d991118.koyeb.app/message/sendText/Tamowil', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': '66A834200160-4DA1-A15F-0F10C44B8A98'
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
  const { data, error } = await supabase
    .from('payout_requests')
    .select('*')
    .order('requested_at', { ascending: false });
  if (error) return [];
  return data.map(p => ({
    id: p.id,
    merchantId: p.merchant_id,
    merchantName: p.merchant_name,
    storeName: p.store_name,
    amount: Number(p.amount),
    bankDetails: p.bank_details,
    status: p.status,
    requestedAt: p.requested_at ? new Date(p.requested_at) : null,
    processedAt: p.processed_at ? new Date(p.processed_at) : null,
    note: p.note || ''
  }));
}

export async function approvePayoutRequest(id) {
  await supabase
    .from('payout_requests')
    .update({ status: 'Approved', processed_at: new Date(), note: 'تم الموافقة على التحويل بنجاح.' })
    .eq('id', id);
  
  // Record Transaction
  const { data: p } = await supabase.from('payout_requests').select('*').eq('id', id).single();
  if (p) {
    await supabase.from('transactions').insert({
      id: `TXN-${Date.now()}`,
      type: 'debit',
      type_ar: `سحب رصيد مالي - ${p.id}`,
      amount: -Number(p.amount),
      reference: p.id,
      status: 'Completed',
      merchant_id: p.merchant_id
    });
  }
  return getPayoutRequests();
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
  const { data, error } = await supabase
    .from('transactions')
    .select('*, merchants(store_name)');
  if (error) return [];
  return data.map(tx => ({
    id: tx.id,
    type: tx.type,
    merchantId: tx.merchant_id,
    storeName: tx.merchants?.store_name || 'متجر غير معروف',
    amount: Number(tx.amount),
    description: tx.type_ar,
    ref: tx.reference,
    date: tx.date ? new Date(tx.date) : null
  }));
}

export async function manualCredit(merchantId, amount, description) {
  await supabase.from('transactions').insert({
    id: `TXN-${Date.now()}`,
    type: 'credit',
    type_ar: description || 'شحن رصيد يدوي',
    amount: Number(amount),
    reference: 'MANUAL',
    merchant_id: merchantId
  });
  return getTransactionLog();
}

// ─── Drivers ─────────────────────────────────────────────────

export async function getDrivers() {
  const { data, error } = await supabase.from('drivers').select('*');
  if (error) return [];
  return data.map(mapDriverFromDb);
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

export async function settleDriver(driverId, amount, note) {
  const { data: d } = await supabase.from('drivers').select('*').eq('id', driverId).single();
  if (d) {
    const amountVal = Number(amount || 0);
    const currentPending = Number(d.pending_settlement || 0);
    const currentSettled = Number(d.cod_settled || 0);
    const settled = amountVal;
    const newSettled = currentSettled + settled;
    const newPending = Math.max(0, currentPending - settled);

    await supabase
      .from('drivers')
      .update({ cod_settled: newSettled, pending_settlement: newPending })
      .eq('id', driverId);

    // Record settlement
    await supabase.from('driver_settlements').insert({
      id: `STL-${Date.now()}`,
      driver_id: driverId,
      amount: amountVal,
      note: note || 'تسوية يدوية',
      status: 'Settled'
    });
  }
  return getDrivers();
}

export async function getDriverSettlements() {
  const { data, error } = await supabase
    .from('driver_settlements')
    .select('*, drivers(name)')
    .order('date', { ascending: false });
  if (error) return [];
  return data.map(s => ({
    id: s.id,
    driverId: s.driver_id,
    driverName: s.drivers?.name || 'سائق غير معروف',
    amount: Number(s.amount),
    note: s.note,
    date: s.date ? new Date(s.date) : null,
    status: s.status
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

export async function addCity(city, fee, codFee) {
  await supabase.from('city_pricing').insert({
    city,
    fee: Number(fee),
    cod_fee: Number(codFee),
    active: true
  });
  return getCityPricing();
}

// ─── Tickets ─────────────────────────────────────────────────

export async function getTickets() {
  const { data, error } = await supabase
    .from('tickets')
    .select('*, messages:ticket_messages(*), merchants(store_name)')
    .order('created_at', { ascending: false });
  if (error) return [];
  return data.map(t => ({
    id: t.id,
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

  const deliveredShipments = shipments.filter(s => s.status === 'Delivered');

  const total      = shipments.length;
  const delivered  = deliveredShipments.length;
  const progress   = shipments.filter(s => s.status === 'Out for Delivery').length;
  const warehouse  = shipments.filter(s => s.status === 'In Warehouse').length;
  const registered = shipments.filter(s => s.status === 'Registered').length;
  const returned   = shipments.filter(s => s.status === 'Returned').length;

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
    pendingPayouts, totalMerchantBalance, driversPendingSettlement,
    activeDrivers, dailyRevenue,
    pendingPayoutsCount: payoutRequests.filter(p => p.status === 'Pending').length,
  };
}

// ─── Employees / Admin Users (Local Storage Mock) ─────────────

const ADMIN_STORAGE_KEY = 'vanex_admin_users';

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
  return employee;
}

export async function deleteEmployee(id) {
  if (typeof window === 'undefined') return;
  let employees = await getEmployees();
  employees = employees.filter(e => e.id !== id);
  localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(employees));
}

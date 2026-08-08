import { supabase } from './supabaseClient';

const safeNum = (v, fallback = 0) => {
  const n = Number(v);
  return isNaN(n) ? fallback : n;
};

export function isSenderPaid(chargeOn) {
  if (!chargeOn) return false;
  const str = String(chargeOn).trim().toLowerCase();
  return str === 'المرسل' || str === 'المتجر' || str === 'sender' || str === 'merchant';
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
          amount: Number(sh.price || 0) - Number(sh.delivery_fee || 0) - Number(sh.cod_fee || 0),
          reference: trackingNumber,
          status: 'Completed',
          merchant_id: sh.merchant_id || 'TU-04'
        });
      }

      // Calculate net COD amount (excluding delivery fee which belongs to the driver)
      const netCustodyAmt = isSenderPaid(sh.delivery_charge_on)
        ? Number(sh.price || 0)
        : Math.max(0, (Number(sh.price || 0) > 0 ? Number(sh.price) - Number(sh.delivery_fee || 0) : Number(sh.product_price || 0)));

      // 2. Automatically Record Net COD Value into Drivers Custody Safe (SAFE-005)
      const safeTxs = await getSafeTransactions();
      const alreadySafeRecorded = safeTxs.some(t => t.ref === trackingNumber && t.type === 'deposit');
      if (!alreadySafeRecorded && netCustodyAmt > 0) {
        await recordSafeTransaction({
          safeId: 'SAFE-005',
          type: 'deposit',
          amount: netCustodyAmt,
          description: `عُهدة ميدانية مع السائق (صافي البضاعة بدون أجرة التوصيل) - (${trackingNumber})`,
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
          const driverOwes = isSenderPaid(sh.delivery_charge_on) ? Number(sh.product_price || sh.price || 0) : Number(sh.price || 0);
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
  const { data: merchants, error } = await supabase.from('merchants').select('*');
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
      const prodPrice = Number(s.product_price || 0) > 0 ? Number(s.product_price) : Math.max(0, price - deliveryFee - codFee);
      if (isSenderPaid(s.delivery_charge_on)) {
        return sum + Math.max(0, prodPrice - deliveryFee - codFee);
      } else {
        return sum + prodPrice;
      }
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

export async function approvePayoutRequest(id, safeId = 'SAFE-001') {
  const { data: p } = await supabase.from('payout_requests').select('*').eq('id', id).single();
  if (!p) throw new Error('طلب السحب غير موجود.');
  
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

export async function manualCredit(merchantId, amount, description, type = 'payout', safeId = 'SAFE-001') {
  const amtVal = Math.abs(Number(amount || 0));
  if (amtVal <= 0) throw new Error('المبلغ يجب أن يكون أكبر من صفر');

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
}

// ─── Drivers ─────────────────────────────────────────────────

export async function getDrivers() {
  const { data: drivers, error } = await supabase.from('drivers').select('*');
  if (error) return [];

  const { data: shipments } = await supabase
    .from('shipments')
    .select('assigned_driver_id, status, price, delivery_fee, delivery_charge_on');

  const { data: settlements } = await supabase
    .from('driver_settlements')
    .select('driver_id, amount, status');

  return drivers.map(d => {
    const dShipments = (shipments || []).filter(s => s.assigned_driver_id === d.id);
    const deliveredShipments = dShipments.filter(s => s.status === 'Delivered' || s.status === 'تم التسليم');
    
    // Dynamic Single Source of Truth calculation for driver custody
    const totalCollectedFromShipments = deliveredShipments.reduce((sum, s) => {
      const price = Number(s.price || 0);
      const prodPrice = Number(s.product_price || price);
      const driverOwes = isSenderPaid(s.delivery_charge_on) ? prodPrice : price;
      return sum + Math.max(0, driverOwes);
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

    // 1. Deduct settled amount from Drivers Custody Safe (SAFE-005)
    await recordSafeTransaction({
      safeId: 'SAFE-005',
      type: 'withdrawal',
      amount: amountVal,
      description: `تفريغ عُهدة نقدية وتصفية حساب مع السائق (${d.name})`,
      ref: `STL-${Date.now()}`
    });

    // 2. Deposit settled amount into Target Main/Branch Safe
    if (safeId) {
      await recordSafeTransaction({
        safeId: safeId,
        type: 'deposit',
        amount: amountVal,
        description: `استلام تسوية عُهدة نقدية من السائق (${d.name})`,
        ref: `STL-${Date.now()}`
      });
    }
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
  { id: 'SAFE-005', name: 'خزينة عُهد السائقين (العهد الميدانية)', code: 'SAFE-DRIVERS', branch: 'ميداني / السائقين', initialBalance: 0, balance: 0, active: true, notes: 'إجمالي المبالغ النقدية المتداولة كـ عُهد مع السائقين قبل التسوية' },
  { id: 'SAFE-002', name: 'خزينة فرع طرابلس', code: 'SAFE-TRIPOLI', branch: 'طرابلس', initialBalance: 0, balance: 0, active: true, notes: 'خزينة استلام العهد اليومية' },
  { id: 'SAFE-003', name: 'خزينة فرع بنغازي', code: 'SAFE-BEN', branch: 'بنغازي', initialBalance: 0, balance: 0, active: true, notes: 'خزينة التوصيل والتسويات' },
  { id: 'SAFE-004', name: 'حساب المصرف / سداد', code: 'BANK-SADAD', branch: 'إلكتروني', initialBalance: 0, balance: 0, active: true, notes: 'حساب التحويلات المصرفية والسداد الإلكتروني' }
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

  // Deduplicate safe transactions by unique ID or safeId + ref + type
  const uniqueTxs = [];
  const seenKeys = new Set();
  for (const t of txs) {
    const key = t.id ? t.id : `${t.safeId}_${t.ref}_${t.type}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueTxs.push(t);
    }
  }

  return uniqueTxs.sort((a, b) => new Date(b.date) - new Date(a.date));
}

export async function getSafes() {
  let safes = [];

  // Fetch strictly from dedicated safes table in Supabase DB
  try {
    const { data: dedicatedSafes, error: dedicatedErr } = await supabase
      .from('safes')
      .select('*');

    if (!dedicatedErr && dedicatedSafes) {
      safes = dedicatedSafes.map(s => ({
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

  // 2. Fetch all safe transactions 100% live from Supabase DB
  let txs = await getSafeTransactions();

  // 3. Auto-sync delivered shipments live from Supabase shipments table
  try {
    const { data: deliveredShipments } = await supabase
      .from('shipments')
      .select('tracking_number, price, product_price, delivery_fee, cod_fee, status, delivery_charge_on')
      .in('status', ['Delivered', 'تم التسليم']);

    if (deliveredShipments && deliveredShipments.length > 0) {
      const safeObj = safes.find(s => s.id === 'SAFE-005');
      for (const sh of deliveredShipments) {
        const trk = sh.tracking_number;
        const { data: dbCheck } = await supabase
          .from('safe_transactions')
          .select('id')
          .eq('safe_id', 'SAFE-005')
          .eq('reference', trk);

        const alreadyRecorded = dbCheck && dbCheck.length > 0;
        if (!alreadyRecorded) {
          const netCustodyAmt = isSenderPaid(sh.delivery_charge_on)
            ? Number(sh.product_price || sh.price || 0)
            : Number(sh.price || (Number(sh.product_price || 0) + Number(sh.delivery_fee || 0) + Number(sh.cod_fee || 0)));

          if (netCustodyAmt > 0) {
            const txId = `STX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
            const desc = `عُهدة نقدية ميدانية مع السائق - شحنة (${trk})`;
            
            await supabase.from('safe_transactions').insert({
              id: txId,
              safe_id: 'SAFE-005',
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
              reference: `SAFE-005::${safeObj?.name || 'خزينة عُهد السائقين'}::${trk}`,
              status: 'Completed',
              merchant_id: 'SAFE-005'
            });

            txs.unshift({
              id: txId,
              safeId: 'SAFE-005',
              safeName: safeObj?.name || 'خزينة عُهد السائقين (العهد الميدانية)',
              type: 'deposit',
              amount: netCustodyAmt,
              description: desc,
              ref: trk,
              date: new Date().toISOString()
            });
          }
        }
      }
    }
  } catch (err) {
    console.warn('Sync delivered shipments to safes error:', err);
  }

  // 4. Recalculate dynamic balance 100% from actual logged DB transactions
  return safes.map(s => {
    const safeTxs = txs.filter(t => t.safeId === s.id);
    const deposits = safeTxs
      .filter(t => t.type === 'deposit' || t.type === 'transfer_in')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const withdrawals = safeTxs
      .filter(t => t.type === 'withdrawal' || t.type === 'transfer_out')
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const initial = Number(s.initialBalance || 0);
    return {
      ...s,
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
  if (safeId === 'SAFE-001' || safeId === 'SAFE-005') return getSafes();

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

  // Validate balance if withdrawing from safe (except field driver custody safe)
  if ((type === 'withdrawal' || type === 'transfer_out') && safeId !== 'SAFE-005') {
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

const { Client } = require('pg');

const client = new Client({
  host: 'aws-0-eu-west-3.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.sxbyyxexufcyannkwthh',
  password: 'z$*9bernpQx9aSh',
  ssl: {
    rejectUnauthorized: false
  }
});

async function main() {
  try {
    console.log('Connecting to Supabase PostgreSQL database...');
    await client.connect();
    console.log('Connected successfully!');

    // 1. Create Tables
    console.log('Creating tables...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS city_pricing (
        city TEXT PRIMARY KEY,
        fee NUMERIC NOT NULL,
        cod_fee NUMERIC NOT NULL
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS merchants (
        id TEXT PRIMARY KEY,
        store_name TEXT NOT NULL,
        phone TEXT,
        active BOOLEAN DEFAULT TRUE
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS drivers (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT,
        zone TEXT,
        active BOOLEAN DEFAULT TRUE,
        rating NUMERIC DEFAULT 5.0,
        cod_collected NUMERIC DEFAULT 0,
        cod_settled NUMERIC DEFAULT 0,
        pending_settlement NUMERIC DEFAULT 0,
        password TEXT
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS shipments (
        tracking_number TEXT PRIMARY KEY,
        sender_name TEXT,
        sender_phone TEXT,
        sender_city TEXT,
        receiver_name TEXT,
        receiver_phone TEXT,
        receiver_city TEXT,
        receiver_backup_phone TEXT,
        detailed_address TEXT,
        status TEXT DEFAULT 'Registered',
        price NUMERIC,
        delivery_fee NUMERIC,
        cod_fee NUMERIC,
        cargo_type TEXT,
        quantity INTEGER DEFAULT 1,
        product_price NUMERIC DEFAULT 0,
        delivery_charge_on TEXT DEFAULT 'المستلم',
        free_service BOOLEAN DEFAULT FALSE,
        try_on BOOLEAN DEFAULT FALSE,
        no_try_on BOOLEAN DEFAULT FALSE,
        fragile BOOLEAN DEFAULT FALSE,
        home_delivery BOOLEAN DEFAULT TRUE,
        assigned_driver_id TEXT REFERENCES drivers(id) ON DELETE SET NULL,
        merchant_id TEXT REFERENCES merchants(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        notes TEXT
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS shipment_history (
        id SERIAL PRIMARY KEY,
        shipment_tracking TEXT REFERENCES shipments(tracking_number) ON DELETE CASCADE,
        status TEXT,
        location TEXT,
        details_en TEXT,
        details_ar TEXT,
        timestamp TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        type TEXT,
        type_ar TEXT,
        amount NUMERIC,
        reference TEXT,
        status TEXT,
        date TIMESTAMP DEFAULT NOW(),
        merchant_id TEXT REFERENCES merchants(id) ON DELETE CASCADE
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id TEXT PRIMARY KEY,
        subject TEXT,
        subject_en TEXT,
        status TEXT DEFAULT 'Active',
        merchant_id TEXT REFERENCES merchants(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS ticket_messages (
        id SERIAL PRIMARY KEY,
        ticket_id TEXT REFERENCES tickets(id) ON DELETE CASCADE,
        text TEXT,
        is_user BOOLEAN,
        timestamp TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS driver_settlements (
        id TEXT PRIMARY KEY,
        driver_id TEXT REFERENCES drivers(id) ON DELETE CASCADE,
        amount NUMERIC,
        note TEXT,
        date TIMESTAMP DEFAULT NOW(),
        status TEXT DEFAULT 'Settled'
      );
    `);

    console.log('Tables created successfully!');

    // 2. Insert Default Data (using INSERT ON CONFLICT DO NOTHING / UPDATE)
    console.log('Populating default reference data...');

    // City pricing
    const cities = [
      ['طرابلس', 30, 5],
      ['بنغازي', 35, 5],
      ['مصراتة', 30, 5],
      ['سرت', 35, 5],
      ['سبها', 45, 10],
      ['غريان', 32, 5],
      ['الزاوية', 28, 5],
      ['الخمس', 25, 5],
      ['درنة', 35, 5]
    ];
    for (const [city, fee, cod] of cities) {
      await client.query(
        `INSERT INTO city_pricing (city, fee, cod_fee) VALUES ($1, $2, $3) ON CONFLICT (city) DO UPDATE SET fee = $2, cod_fee = $3`,
        [city, fee, cod]
      );
    }

    // Default Merchants
    await client.query(`
      INSERT INTO merchants (id, store_name, phone, active) VALUES 
      ('usr-1', 'متجر الأناقة', '0910000000', true),
      ('usr-2', 'مجوهرات النخبة', '0912222222', true),
      ('usr-3', 'عالم الألعاب', '0913333333', true)
      ON CONFLICT (id) DO NOTHING
    `);

    // Default Drivers
    await client.query(`
      INSERT INTO drivers (id, name, phone, zone, active, rating, cod_collected, cod_settled, pending_settlement, password) VALUES 
      ('DRV-001', 'محمد العجيلي', '0921112233', 'طرابلس الغرب', true, 4.8, 2850, 2400, 450, '123'),
      ('DRV-002', 'خالد الزروق', '0922223344', 'طرابلس الشرق', true, 4.6, 1760, 1440, 320, '123'),
      ('DRV-003', 'يوسف الفقيه', '0923334455', 'سرت', false, 4.5, 980, 980, 0, '123')
      ON CONFLICT (id) DO NOTHING
    `);

    // Default Settlements
    await client.query(`
      INSERT INTO driver_settlements (id, driver_id, amount, note, date, status) VALUES 
      ('STL-001', 'DRV-001', 1200, 'تسوية أسبوع 1 يوليو', NOW() - INTERVAL '6 days', 'Settled'),
      ('STL-002', 'DRV-001', 1200, 'تسوية أسبوع 2 يوليو', NOW() - INTERVAL '1 day', 'Settled'),
      ('STL-003', 'DRV-002', 900, 'تسوية أسبوع 1 يوليو', NOW() - INTERVAL '6 days', 'Settled'),
      ('STL-004', 'DRV-002', 540, 'تسوية جزئية', NOW() - INTERVAL '2 days', 'Settled'),
      ('STL-005', 'DRV-003', 980, 'تسوية شاملة', NOW() - INTERVAL '3 days', 'Settled')
      ON CONFLICT (id) DO NOTHING
    `);

    // Default Shipments
    const initialShipments = [
      {
        tracking_number: 'VNX-1001',
        sender_name: 'محمد الفيتوري', sender_phone: '0912345678', sender_city: 'طرابلس',
        receiver_name: 'أحمد الترهوني', receiver_phone: '0929876543', receiver_city: 'بنغازي',
        status: 'Delivered', price: 450, delivery_fee: 15, cod_fee: 5,
        assigned_driver_id: 'DRV-001', merchant_id: 'usr-1', cargo_type: 'Electronics', quantity: 1, product_price: 450,
        notes: 'يُرجى الاتصال قبل التسليم بـ 30 دقيقة'
      },
      {
        tracking_number: 'VNX-1002',
        sender_name: 'فاطمة الترهوني', sender_phone: '0917654321', sender_city: 'مصراتة',
        receiver_name: 'سارة التاجوري', receiver_phone: '0927654321', receiver_city: 'طرابلس',
        status: 'Out for Delivery', price: 320, delivery_fee: 10, cod_fee: 5,
        assigned_driver_id: 'DRV-002', merchant_id: 'usr-2', cargo_type: 'Clothes', quantity: 2, product_price: 320,
        notes: 'توصيل للمكتب في حي الأندلس'
      },
      {
        tracking_number: 'VNX-1003',
        sender_name: 'معاذ الورفلي', sender_phone: '0915554433', sender_city: 'الخمس',
        receiver_name: 'خالد المقرحي', receiver_phone: '0928887766', receiver_city: 'سبها',
        status: 'In Warehouse', price: 680, delivery_fee: 25, cod_fee: 10,
        assigned_driver_id: null, merchant_id: 'usr-1', cargo_type: 'Glassware', quantity: 1, product_price: 680,
        notes: 'الرجاء الحذر، الطرد يحتوي على زجاج'
      },
      {
        tracking_number: 'VNX-1004',
        sender_name: 'منى القرقني', sender_phone: '0919998877', sender_city: 'طرابلس',
        receiver_name: 'أسماء الغرياني', receiver_phone: '0924445566', receiver_city: 'غريان',
        status: 'Registered', price: 150, delivery_fee: 12, cod_fee: 0,
        assigned_driver_id: null, merchant_id: 'usr-3', cargo_type: 'Toys', quantity: 1, product_price: 150,
        notes: ''
      }
    ];

    for (const sh of initialShipments) {
      const res = await client.query(
        `INSERT INTO shipments (
          tracking_number, sender_name, sender_phone, sender_city, receiver_name, receiver_phone, receiver_city,
          status, price, delivery_fee, cod_fee, assigned_driver_id, merchant_id, cargo_type, quantity, product_price, notes
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
         ON CONFLICT (tracking_number) DO NOTHING RETURNING tracking_number`,
        [
          sh.tracking_number, sh.sender_name, sh.sender_phone, sh.sender_city, sh.receiver_name, sh.receiver_phone, sh.receiver_city,
          sh.status, sh.price, sh.delivery_fee, sh.cod_fee, sh.assigned_driver_id, sh.merchant_id, sh.cargo_type, sh.quantity, sh.product_price, sh.notes
        ]
      );

      // If inserted, add default history
      if (res.rows.length > 0) {
        if (sh.status === 'Delivered') {
          await client.query(`
            INSERT INTO shipment_history (shipment_tracking, status, location, details_en, details_ar, timestamp) VALUES 
            ('${sh.tracking_number}', 'Registered', 'Tripoli Client Hub', 'Shipment created and scheduled for collection.', 'تم تسجيل الشحنة وجدولة الاستلام من مندوب تمويل.', NOW() - INTERVAL '3 days'),
            ('${sh.tracking_number}', 'In Warehouse', 'Tripoli Central Sorting', 'Sorted and ready for transport.', 'تم استقبال الشحنة في مركز الفرز المركزي.', NOW() - INTERVAL '2 days'),
            ('${sh.tracking_number}', 'Out for Delivery', 'Benghazi Hub', 'Out for delivery with driver.', 'الشحنة مع سائق التوصيل جاري التوجه للمستلم.', NOW() - INTERVAL '1 day'),
            ('${sh.tracking_number}', 'Delivered', 'Benghazi Destination', 'Delivered successfully and COD collected.', 'تم تسليم الشحنة بنجاح وتحصيل المبلغ.', NOW() - INTERVAL '4 hours')
          `);
        } else if (sh.status === 'Out for Delivery') {
          await client.query(`
            INSERT INTO shipment_history (shipment_tracking, status, location, details_en, details_ar, timestamp) VALUES 
            ('${sh.tracking_number}', 'Registered', 'Misrata Hub', 'Shipment created and scheduled for collection.', 'تم تسجيل الشحنة وجدولة الاستلام من مندوب تمويل.', NOW() - INTERVAL '2 days'),
            ('${sh.tracking_number}', 'In Warehouse', 'Tripoli Central Sorting', 'Sorted and ready for transport.', 'تم استقبال الشحنة في مركز الفرز المركزي.', NOW() - INTERVAL '1 day'),
            ('${sh.tracking_number}', 'Out for Delivery', 'Tripoli Hub', 'Out for delivery with driver.', 'الشحنة مع سائق التوصيل جاري التوجه للمستلم.', NOW() - INTERVAL '2 hours')
          `);
        } else if (sh.status === 'In Warehouse') {
          await client.query(`
            INSERT INTO shipment_history (shipment_tracking, status, location, details_en, details_ar, timestamp) VALUES 
            ('${sh.tracking_number}', 'Registered', 'Khoms Hub', 'Shipment created.', 'تم تسجيل الشحنة وتثبيت الوزن.', NOW() - INTERVAL '1 day'),
            ('${sh.tracking_number}', 'In Warehouse', 'Tripoli Central Sorting', 'Stored in warehouse.', 'تم الاستقبال في المستودع الرئيسي.', NOW() - INTERVAL '12 hours')
          `);
        } else {
          await client.query(`
            INSERT INTO shipment_history (shipment_tracking, status, location, details_en, details_ar, timestamp) VALUES 
            ('${sh.tracking_number}', 'Registered', 'Tripoli Hub', 'Shipment created.', 'تم إنشاء الشحنة وتأكيد البيانات.', NOW())
          `);
        }
      }
    }

    // Default Support Tickets
    const resTkt = await client.query(`
      INSERT INTO tickets (id, subject, subject_en, status, merchant_id, created_at) VALUES 
      ('TKT-501', 'تأخر شحنة سبها', 'Delay in Sabha Shipment', 'Active', 'usr-1', NOW() - INTERVAL '1 day')
      ON CONFLICT (id) DO NOTHING RETURNING id
    `);

    if (resTkt.rows.length > 0) {
      await client.query(`
        INSERT INTO ticket_messages (ticket_id, text, is_user, timestamp) VALUES 
        ('TKT-501', 'السلام عليكم، شحنة سبها VNX-1003 لم تتحرك من المستودع منذ الأمس. هل هناك أي تحديث؟', true, NOW() - INTERVAL '18 hours'),
        ('TKT-501', 'وعليكم السلام ورحمة الله، أهلاً بك يا فندم. رحلة الجنوب تتجه اليوم ليلاً وسوف تتغير حالة الشحنة فور وصولها لمستودع سبها غداً صباحاً إن شاء الله.', false, NOW() - INTERVAL '17 hours')
      `);
    }

    // Default Merchant Wallet Transactions
    await client.query(`
      INSERT INTO transactions (id, type, type_ar, amount, reference, status, date, merchant_id) VALUES 
      ('TXN-001', 'credit', 'تحصيل COD - شحنة VNX-1001', 450, 'VNX-1001', 'Completed', NOW() - INTERVAL '4 hours', 'usr-1'),
      ('TXN-002', 'debit', 'سحب رصيد - PAY-101', -470, 'PAY-101', 'Completed', NOW() - INTERVAL '3 days', 'usr-1'),
      ('TXN-003', 'credit', 'تحصيل COD - شحنة VNX-1002', 320, 'VNX-1002', 'Completed', NOW() - INTERVAL '2 hours', 'usr-2'),
      ('TXN-004', 'credit', 'تحصيل COD - شحنة VNX-1004', 150, 'VNX-1004', 'Completed', NOW(), 'usr-3')
      ON CONFLICT (id) DO NOTHING
    `);

    console.log('Database initialization populated successfully!');
  } catch (err) {
    console.error('Error running script:', err);
  } finally {
    await client.end();
    console.log('Database connection closed.');
  }
}

main();

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
    await client.connect();
    console.log('Connected to run migrations...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS payout_requests (
        id TEXT PRIMARY KEY,
        merchant_id TEXT REFERENCES merchants(id) ON DELETE CASCADE,
        merchant_name TEXT,
        store_name TEXT,
        amount NUMERIC NOT NULL,
        bank_details TEXT,
        status TEXT DEFAULT 'Pending',
        requested_at TIMESTAMP DEFAULT NOW(),
        processed_at TIMESTAMP,
        note TEXT
      );
    `);

    // Insert mock payout requests
    await client.query(`
      INSERT INTO payout_requests (id, merchant_id, merchant_name, store_name, amount, bank_details, status, requested_at, processed_at, note) VALUES 
      ('PAY-101', 'usr-1', 'أحمد الورفلي', 'متجر الأناقة', 470, 'مصرف الجمهورية - حساب رقم 1234567890', 'Approved', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days', 'تم التحويل بنجاح'),
      ('PAY-102', 'usr-1', 'أحمد الورفلي', 'متجر الأناقة', 450, 'مصرف الجمهورية - حساب رقم 1234567890', 'Pending', NOW() - INTERVAL '12 hours', null, ''),
      ('PAY-103', 'usr-2', 'فاطمة الزهراء', 'مجوهرات النخبة', 320, 'مصرف التجارة والتنمية - 0987654321', 'Pending', NOW() - INTERVAL '6 hours', null, ''),
      ('PAY-104', 'usr-3', 'سليمان الورفلي', 'عالم الألعاب', 150, 'مصرف الوحدة - 1122334455', 'Rejected', NOW() - INTERVAL '1 day', NOW() - INTERVAL '18 hours', 'بيانات الحساب غير مطابقة')
      ON CONFLICT (id) DO NOTHING
    `);

    console.log('payout_requests table created and seeded successfully!');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await client.end();
  }
}

main();

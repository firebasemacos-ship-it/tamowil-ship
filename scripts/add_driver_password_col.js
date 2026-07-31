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
    console.log('Connected to database.');
    
    // Add password column to drivers table
    await client.query('ALTER TABLE drivers ADD COLUMN IF NOT EXISTS password TEXT');
    console.log('Successfully added password column to drivers table!');
    
    // Set a default password for the seeded driver DRV-001 so they can log in
    await client.query("UPDATE drivers SET password = '123' WHERE id = 'DRV-001'");
    console.log('Successfully set password for DRV-001!');

    const res = await client.query('SELECT * FROM drivers LIMIT 1');
    console.log('Sample driver:', res.rows[0]);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();

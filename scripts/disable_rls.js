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
    
    // Disable RLS on drivers table
    await client.query('ALTER TABLE drivers DISABLE ROW LEVEL SECURITY');
    console.log('Successfully disabled RLS on drivers table!');

    const res = await client.query('SELECT * FROM drivers');
    console.log('Drivers rows:', res.rows);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();

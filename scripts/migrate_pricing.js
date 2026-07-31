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
    await client.query('ALTER TABLE city_pricing ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT TRUE');
    console.log('ALTER successfully completed via script!');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await client.end();
  }
}

main();

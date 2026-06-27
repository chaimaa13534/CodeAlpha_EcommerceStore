require('dotenv').config({ path: '../.env' });
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

async function initDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });

  console.log('✅ Connected to MySQL');

  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await connection.query(sql);

  console.log('✅ Database schema applied successfully');
  console.log('✅ Seed data inserted');
  console.log('\n🚀 Database ready! Run: npm run dev\n');

  await connection.end();
}

initDatabase().catch(err => {
  console.error('❌ Database init failed:', err.message);
  process.exit(1);
});

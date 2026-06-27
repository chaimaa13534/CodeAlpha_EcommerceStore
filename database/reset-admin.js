/**
 * ShopLux — Reset Admin Password Utility
 * Usage: node database/reset-admin.js
 *
 * Resets the admin account password to Admin@2026
 * Run this if you get "invalid email or password" with admin credentials.
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql  = require('mysql2/promise');

async function resetAdmin() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    port:     process.env.DB_PORT     || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'ecommerce_store',
  });

  const newPassword = 'Admin@2026';
  const hash = await bcrypt.hash(newPassword, 12);

  // Check if admin exists
  const [rows] = await conn.query("SELECT id FROM users WHERE email = 'admin@shoplux.com'");

  if (rows.length) {
    // Update existing admin
    await conn.query(
      "UPDATE users SET password = ?, is_active = 1 WHERE email = 'admin@shoplux.com'",
      [hash]
    );
    console.log('✅ Admin password reset to: Admin@2026');
  } else {
    // Insert fresh admin
    await conn.query(
      `INSERT INTO users (firstname, lastname, username, email, password, role)
       VALUES ('Admin', 'ShopLux', 'admin', 'admin@shoplux.com', ?, 'admin')`,
      [hash]
    );
    console.log('✅ Admin account created with password: Admin@2026');
  }

  console.log('   Email   : admin@shoplux.com');
  console.log('   Password: Admin@2026');
  await conn.end();
}

resetAdmin().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});

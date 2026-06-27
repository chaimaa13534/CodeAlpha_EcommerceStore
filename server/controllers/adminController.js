const db = require('../config/database');

// GET /api/admin/dashboard
const getDashboard = async (req, res) => {
  const [[revenue]] = await db.query(
    `SELECT COALESCE(SUM(total), 0) as total_revenue,
      COALESCE(SUM(CASE WHEN MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW()) THEN total ELSE 0 END), 0) as monthly_revenue
    FROM orders WHERE payment_status = 'paid'`
  );
  const [[orders]] = await db.query(
    `SELECT COUNT(*) as total,
      SUM(status = 'pending') as pending,
      SUM(status = 'shipped') as shipped,
      SUM(status = 'delivered') as delivered
    FROM orders`
  );
  const [[users]] = await db.query(
    `SELECT COUNT(*) as total,
      SUM(MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())) as new_this_month
    FROM users WHERE role = 'user'`
  );
  const [[products]] = await db.query(
    `SELECT COUNT(*) as total,
      SUM(stock = 0) as out_of_stock,
      SUM(is_featured = 1) as featured
    FROM products WHERE is_active = 1`
  );

  const [topProducts] = await db.query(
    `SELECT p.id, p.name, p.image, p.price, p.sold_count,
      COALESCE(SUM(oi.subtotal), 0) as revenue
    FROM products p
    LEFT JOIN order_items oi ON oi.product_id = p.id
    GROUP BY p.id ORDER BY p.sold_count DESC LIMIT 5`
  );

  const [recentOrders] = await db.query(
    `SELECT o.id, o.order_number, o.total, o.status, o.created_at,
      u.firstname, u.lastname, u.email
    FROM orders o JOIN users u ON o.user_id = u.id
    ORDER BY o.created_at DESC LIMIT 8`
  );

  const [monthlyData] = await db.query(
    `SELECT MONTH(created_at) as month, YEAR(created_at) as year,
      COUNT(*) as orders, COALESCE(SUM(total), 0) as revenue
    FROM orders
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
    GROUP BY YEAR(created_at), MONTH(created_at)
    ORDER BY year, month`
  );

  res.json({
    success: true,
    data: { revenue, orders, users, products, topProducts, recentOrders, monthlyData }
  });
};

// GET /api/admin/users
const getUsers = async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
  const lim = Math.min(parseInt(limit) || 20, 50);

  const conditions = ["role != 'admin'"];
  const params = [];
  if (search) {
    conditions.push('(firstname LIKE ? OR lastname LIKE ? OR email LIKE ? OR username LIKE ?)');
    params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
  }
  const where = `WHERE ${conditions.join(' AND ')}`;

  const [[{ total }]] = await db.query(`SELECT COUNT(*) as total FROM users ${where}`, params);
  const [users] = await db.query(
    `SELECT id, firstname, lastname, username, email, avatar, role, is_active, created_at,
      (SELECT COUNT(*) FROM orders WHERE user_id = users.id) as order_count
    FROM users ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, lim, offset]
  );

  res.json({ success: true, data: users, pagination: { total, page: parseInt(page), limit: lim, pages: Math.ceil(total / lim) } });
};

// PUT /api/admin/users/:id/toggle
const toggleUserStatus = async (req, res) => {
  const [rows] = await db.query("SELECT id, is_active FROM users WHERE id = ? AND role != 'admin'", [req.params.id]);
  if (!rows.length) return res.status(404).json({ success: false, message: 'User not found.' });
  await db.query('UPDATE users SET is_active = ? WHERE id = ?', [rows[0].is_active ? 0 : 1, req.params.id]);
  res.json({ success: true, message: `User ${rows[0].is_active ? 'deactivated' : 'activated'}.` });
};

module.exports = { getDashboard, getUsers, toggleUserStatus };

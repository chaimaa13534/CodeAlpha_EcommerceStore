const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

const generateOrderNumber = () =>
  `SL-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

// POST /api/orders
const createOrder = async (req, res) => {
  const { shipping_firstname, shipping_lastname, shipping_address, shipping_city,
    shipping_postal, shipping_country, shipping_phone, payment_method, notes } = req.body;

  if (!shipping_firstname || !shipping_lastname || !shipping_address || !shipping_city || !shipping_postal) {
    return res.status(400).json({ success: false, message: 'Shipping address is required.' });
  }

  const [cartItems] = await db.query(
    `SELECT ci.quantity, p.id as product_id, p.name, p.image,
      COALESCE(p.sale_price, p.price) as unit_price, p.stock
    FROM cart_items ci JOIN products p ON ci.product_id = p.id
    WHERE ci.user_id = ? AND p.is_active = 1`,
    [req.user.id]
  );

  if (!cartItems.length) return res.status(400).json({ success: false, message: 'Cart is empty.' });

  for (const item of cartItems) {
    if (item.stock < item.quantity) {
      return res.status(400).json({ success: false, message: `Insufficient stock for "${item.name}".` });
    }
  }

  const subtotal = cartItems.reduce((s, i) => s + (parseFloat(i.unit_price) * i.quantity), 0);
  const shipping_cost = subtotal > 100 ? 0 : 9.99;
  const tax = subtotal * 0.20;
  const total = subtotal + shipping_cost + tax;
  const order_number = generateOrderNumber();

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [order] = await conn.query(
      `INSERT INTO orders (order_number, user_id, subtotal, shipping_cost, tax, total,
        shipping_firstname, shipping_lastname, shipping_address, shipping_city,
        shipping_postal, shipping_country, shipping_phone, payment_method, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [order_number, req.user.id, subtotal.toFixed(2), shipping_cost.toFixed(2), tax.toFixed(2), total.toFixed(2),
        shipping_firstname, shipping_lastname, shipping_address, shipping_city,
        shipping_postal, shipping_country || 'Morocco', shipping_phone || null,
        payment_method || 'card', notes || null]
    );

    for (const item of cartItems) {
      await conn.query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_image, unit_price, quantity, subtotal)
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [order.insertId, item.product_id, item.name, item.image,
          item.unit_price, item.quantity, (item.unit_price * item.quantity).toFixed(2)]
      );
      await conn.query(
        'UPDATE products SET stock = stock - ?, sold_count = sold_count + ? WHERE id = ?',
        [item.quantity, item.quantity, item.product_id]
      );
    }

    // Simulate payment success
    await conn.query('UPDATE orders SET status = ?, payment_status = ? WHERE id = ?',
      ['paid', 'paid', order.insertId]);

    await conn.query('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);
    await conn.commit();

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      order: { id: order.insertId, order_number, total: total.toFixed(2) }
    });
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// GET /api/orders
const getOrders = async (req, res) => {
  const isAdmin = req.user.role === 'admin';
  const { page = 1, limit = 10, status } = req.query;
  const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);

  const conditions = [];
  const params = [];
  if (!isAdmin) { conditions.push('o.user_id = ?'); params.push(req.user.id); }
  if (status)   { conditions.push('o.status = ?'); params.push(status); }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const lim = Math.min(parseInt(limit) || 10, 50);

  const [countRows] = await db.query(`SELECT COUNT(*) as t FROM orders o ${where}`, params);
  const [orders] = await db.query(
    `SELECT o.*, u.firstname, u.lastname, u.email,
      (SELECT COUNT(*) FROM order_items WHERE order_id = o.id) as item_count
    FROM orders o JOIN users u ON o.user_id = u.id
    ${where} ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
    [...params, lim, offset]
  );

  res.json({
    success: true, data: orders,
    pagination: { total: countRows[0].t, page: parseInt(page), limit: lim, pages: Math.ceil(countRows[0].t / lim) }
  });
};

// GET /api/orders/:id
const getOrder = async (req, res) => {
  const [rows] = await db.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ success: false, message: 'Order not found.' });
  if (req.user.role !== 'admin' && rows[0].user_id !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  const [items] = await db.query('SELECT * FROM order_items WHERE order_id = ?', [req.params.id]);
  res.json({ success: true, data: { ...rows[0], items } });
};

// PUT /api/orders/:id (admin status update)
const updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  const validStatuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status.' });
  }

  const [rows] = await db.query('SELECT id FROM orders WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ success: false, message: 'Order not found.' });

  await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
  res.json({ success: true, message: 'Order status updated.' });
};

module.exports = { createOrder, getOrders, getOrder, updateOrderStatus };

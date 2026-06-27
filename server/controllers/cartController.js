const db = require('../config/database');

// GET /api/cart
const getCart = async (req, res) => {
  const [items] = await db.query(
    `SELECT ci.id, ci.quantity, ci.product_id,
      p.name, p.price, p.sale_price, p.image, p.stock,
      (COALESCE(p.sale_price, p.price) * ci.quantity) as line_total
    FROM cart_items ci
    JOIN products p ON ci.product_id = p.id
    WHERE ci.user_id = ? AND p.is_active = 1`,
    [req.user.id]
  );

  const subtotal = items.reduce((s, i) => s + parseFloat(i.line_total), 0);
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  res.json({ success: true, data: { items, subtotal: subtotal.toFixed(2), itemCount } });
};

// POST /api/cart
const addToCart = async (req, res) => {
  const { product_id, quantity = 1 } = req.body;
  if (!product_id) return res.status(400).json({ success: false, message: 'product_id is required.' });

  const [product] = await db.query('SELECT id, stock FROM products WHERE id = ? AND is_active = 1', [product_id]);
  if (!product.length) return res.status(404).json({ success: false, message: 'Product not found.' });
  if (product[0].stock < 1) return res.status(400).json({ success: false, message: 'Product out of stock.' });

  const [existing] = await db.query(
    'SELECT id, quantity FROM cart_items WHERE user_id = ? AND product_id = ?',
    [req.user.id, product_id]
  );

  const qty = Math.min(parseInt(quantity) || 1, product[0].stock);

  if (existing.length) {
    const newQty = Math.min(existing[0].quantity + qty, product[0].stock);
    await db.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [newQty, existing[0].id]);
  } else {
    await db.query('INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)',
      [req.user.id, product_id, qty]);
  }

  res.json({ success: true, message: 'Added to cart.' });
};

// PUT /api/cart/:id
const updateCartItem = async (req, res) => {
  const { quantity } = req.body;
  if (!quantity || quantity < 1) {
    return res.status(400).json({ success: false, message: 'Quantity must be at least 1.' });
  }

  const [item] = await db.query(
    'SELECT ci.id, p.stock FROM cart_items ci JOIN products p ON ci.product_id = p.id WHERE ci.id = ? AND ci.user_id = ?',
    [req.params.id, req.user.id]
  );
  if (!item.length) return res.status(404).json({ success: false, message: 'Cart item not found.' });
  if (quantity > item[0].stock) {
    return res.status(400).json({ success: false, message: `Only ${item[0].stock} items available.` });
  }

  await db.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [parseInt(quantity), req.params.id]);
  res.json({ success: true, message: 'Cart updated.' });
};

// DELETE /api/cart/:id
const removeFromCart = async (req, res) => {
  const [item] = await db.query('SELECT id FROM cart_items WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!item.length) return res.status(404).json({ success: false, message: 'Cart item not found.' });
  await db.query('DELETE FROM cart_items WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Item removed from cart.' });
};

// DELETE /api/cart (clear all)
const clearCart = async (req, res) => {
  await db.query('DELETE FROM cart_items WHERE user_id = ?', [req.user.id]);
  res.json({ success: true, message: 'Cart cleared.' });
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };

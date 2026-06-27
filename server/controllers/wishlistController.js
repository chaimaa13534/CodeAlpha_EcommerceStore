const db = require('../config/database');

// GET /api/wishlist
const getWishlist = async (req, res) => {
  const [items] = await db.query(
    `SELECT w.id, w.created_at, p.id as product_id, p.name, p.price, p.sale_price, p.image,
      p.avg_rating, p.review_count, p.stock, c.name as category_name
    FROM wishlists w
    JOIN products p ON w.product_id = p.id
    JOIN categories c ON p.category_id = c.id
    WHERE w.user_id = ? AND p.is_active = 1
    ORDER BY w.created_at DESC`,
    [req.user.id]
  );
  res.json({ success: true, data: items });
};

// POST /api/wishlist
const addToWishlist = async (req, res) => {
  const { product_id } = req.body;
  if (!product_id) return res.status(400).json({ success: false, message: 'product_id is required.' });

  const [product] = await db.query('SELECT id FROM products WHERE id = ? AND is_active = 1', [product_id]);
  if (!product.length) return res.status(404).json({ success: false, message: 'Product not found.' });

  const [existing] = await db.query(
    'SELECT id FROM wishlists WHERE user_id = ? AND product_id = ?', [req.user.id, product_id]
  );
  if (existing.length) {
    return res.status(409).json({ success: false, message: 'Already in wishlist.' });
  }

  await db.query('INSERT INTO wishlists (user_id, product_id) VALUES (?, ?)', [req.user.id, product_id]);
  res.status(201).json({ success: true, message: 'Added to wishlist.' });
};

// DELETE /api/wishlist/:id
const removeFromWishlist = async (req, res) => {
  const [item] = await db.query(
    'SELECT id FROM wishlists WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]
  );
  if (!item.length) return res.status(404).json({ success: false, message: 'Item not found in wishlist.' });

  await db.query('DELETE FROM wishlists WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Removed from wishlist.' });
};

// GET /api/wishlist/check/:product_id
const checkWishlist = async (req, res) => {
  const [rows] = await db.query(
    'SELECT id FROM wishlists WHERE user_id = ? AND product_id = ?',
    [req.user.id, req.params.product_id]
  );
  res.json({ success: true, inWishlist: rows.length > 0, wishlistId: rows[0]?.id || null });
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist, checkWishlist };

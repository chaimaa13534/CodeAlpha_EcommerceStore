const db = require('../config/database');

// POST /api/reviews
const createReview = async (req, res) => {
  const { product_id, rating, title, comment } = req.body;
  if (!product_id || !rating) {
    return res.status(400).json({ success: false, message: 'product_id and rating are required.' });
  }
  if (rating < 1 || rating > 5) {
    return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
  }

  const [product] = await db.query('SELECT id FROM products WHERE id = ? AND is_active = 1', [product_id]);
  if (!product.length) return res.status(404).json({ success: false, message: 'Product not found.' });

  const [existing] = await db.query(
    'SELECT id FROM reviews WHERE user_id = ? AND product_id = ?', [req.user.id, product_id]
  );
  if (existing.length) {
    return res.status(409).json({ success: false, message: 'You have already reviewed this product.' });
  }

  await db.query(
    'INSERT INTO reviews (user_id, product_id, rating, title, comment) VALUES (?, ?, ?, ?, ?)',
    [req.user.id, product_id, parseInt(rating), title || null, comment || null]
  );

  // Update product avg_rating and review_count
  await db.query(
    `UPDATE products SET
      avg_rating = (SELECT AVG(rating) FROM reviews WHERE product_id = ?),
      review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = ?)
    WHERE id = ?`,
    [product_id, product_id, product_id]
  );

  res.status(201).json({ success: true, message: 'Review submitted.' });
};

// PUT /api/reviews/:id
const updateReview = async (req, res) => {
  const { rating, title, comment } = req.body;
  const [review] = await db.query('SELECT * FROM reviews WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
  if (!review.length) return res.status(404).json({ success: false, message: 'Review not found.' });

  if (rating && (rating < 1 || rating > 5)) {
    return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5.' });
  }

  await db.query(
    'UPDATE reviews SET rating = ?, title = ?, comment = ? WHERE id = ?',
    [rating || review[0].rating, title !== undefined ? title : review[0].title,
      comment !== undefined ? comment : review[0].comment, req.params.id]
  );

  await db.query(
    `UPDATE products SET
      avg_rating = (SELECT AVG(rating) FROM reviews WHERE product_id = ?),
      review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = ?)
    WHERE id = ?`,
    [review[0].product_id, review[0].product_id, review[0].product_id]
  );

  res.json({ success: true, message: 'Review updated.' });
};

// DELETE /api/reviews/:id
const deleteReview = async (req, res) => {
  const [review] = await db.query(
    'SELECT * FROM reviews WHERE id = ? AND (user_id = ? OR ? = "admin")',
    [req.params.id, req.user.id, req.user.role]
  );
  if (!review.length) return res.status(404).json({ success: false, message: 'Review not found.' });

  await db.query('DELETE FROM reviews WHERE id = ?', [req.params.id]);

  await db.query(
    `UPDATE products SET
      avg_rating = COALESCE((SELECT AVG(rating) FROM reviews WHERE product_id = ?), 0),
      review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = ?)
    WHERE id = ?`,
    [review[0].product_id, review[0].product_id, review[0].product_id]
  );

  res.json({ success: true, message: 'Review deleted.' });
};

module.exports = { createReview, updateReview, deleteReview };

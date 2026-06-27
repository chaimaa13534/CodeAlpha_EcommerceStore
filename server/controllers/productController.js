const db = require('../config/database');

const slugify = (text) =>
  text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// GET /api/products
const getProducts = async (req, res) => {
  const {
    category, search, min_price, max_price,
    sort = 'created_at', order = 'DESC',
    page = 1, limit = 12, featured
  } = req.query;

  const allowedSorts = { price_asc: 'p.price ASC', price_desc: 'p.price DESC',
    popular: 'p.sold_count DESC', rating: 'p.avg_rating DESC',
    newest: 'p.created_at DESC', oldest: 'p.created_at ASC' };

  const sortClause = allowedSorts[sort] || 'p.created_at DESC';
  const offset = (Math.max(1, parseInt(page)) - 1) * parseInt(limit);
  const lim = Math.min(parseInt(limit) || 12, 50);

  const conditions = ['p.is_active = 1'];
  const params = [];

  if (category) { conditions.push('c.slug = ?'); params.push(category); }
  if (search)   { conditions.push('(p.name LIKE ? OR p.description LIKE ?)'); params.push(`%${search}%`, `%${search}%`); }
  if (min_price) { conditions.push('p.price >= ?'); params.push(parseFloat(min_price)); }
  if (max_price) { conditions.push('p.price <= ?'); params.push(parseFloat(max_price)); }
  if (featured === '1') { conditions.push('p.is_featured = 1'); }

  const where = conditions.join(' AND ');

  const [countRows] = await db.query(
    `SELECT COUNT(*) as total FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE ${where}`,
    params
  );
  const total = countRows[0].total;

  const [products] = await db.query(
    `SELECT p.id, p.name, p.slug, p.price, p.sale_price, p.image, p.stock, p.sold_count,
      p.avg_rating, p.review_count, p.is_featured, p.created_at,
      c.id as category_id, c.name as category_name, c.slug as category_slug
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE ${where}
    ORDER BY ${sortClause}
    LIMIT ? OFFSET ?`,
    [...params, lim, offset]
  );

  res.json({
    success: true,
    data: products,
    pagination: { total, page: parseInt(page), limit: lim, pages: Math.ceil(total / lim) }
  });
};

// GET /api/products/:id
const getProduct = async (req, res) => {
  const identifier = req.params.id;
  const col = /^\d+$/.test(identifier) ? 'p.id' : 'p.slug';

  const [rows] = await db.query(
    `SELECT p.*, c.name as category_name, c.slug as category_slug
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE ${col} = ? AND p.is_active = 1`,
    [identifier]
  );
  if (!rows.length) return res.status(404).json({ success: false, message: 'Product not found.' });

  // fetch reviews
  const [reviews] = await db.query(
    `SELECT r.*, u.firstname, u.lastname, u.avatar
    FROM reviews r JOIN users u ON r.user_id = u.id
    WHERE r.product_id = ? ORDER BY r.created_at DESC LIMIT 10`,
    [rows[0].id]
  );

  res.json({ success: true, data: { ...rows[0], reviews } });
};

// POST /api/products (admin)
const createProduct = async (req, res) => {
  const { category_id, name, description, price, sale_price, stock, is_featured } = req.body;
  if (!category_id || !name || !price) {
    return res.status(400).json({ success: false, message: 'category_id, name and price are required.' });
  }

  const image = req.file ? `/uploads/products/${req.file.filename}` : null;
  let slug = slugify(name);
  const [ex] = await db.query('SELECT id FROM products WHERE slug = ?', [slug]);
  if (ex.length) slug = `${slug}-${Date.now()}`;

  const [result] = await db.query(
    `INSERT INTO products (category_id, name, slug, description, price, sale_price, image, stock, is_featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [category_id, name.trim(), slug, description || null, parseFloat(price),
      sale_price ? parseFloat(sale_price) : null, image, parseInt(stock) || 0, is_featured ? 1 : 0]
  );

  res.status(201).json({ success: true, message: 'Product created.', id: result.insertId });
};

// PUT /api/products/:id (admin)
const updateProduct = async (req, res) => {
  const { category_id, name, description, price, sale_price, stock, is_featured, is_active } = req.body;
  const [existing] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
  if (!existing.length) return res.status(404).json({ success: false, message: 'Product not found.' });

  const image = req.file ? `/uploads/products/${req.file.filename}` : existing[0].image;

  await db.query(
    `UPDATE products SET category_id = ?, name = ?, description = ?, price = ?, sale_price = ?,
    image = ?, stock = ?, is_featured = ?, is_active = ? WHERE id = ?`,
    [
      category_id || existing[0].category_id,
      name ? name.trim() : existing[0].name,
      description !== undefined ? description : existing[0].description,
      price ? parseFloat(price) : existing[0].price,
      sale_price !== undefined ? (sale_price ? parseFloat(sale_price) : null) : existing[0].sale_price,
      image,
      stock !== undefined ? parseInt(stock) : existing[0].stock,
      is_featured !== undefined ? (is_featured ? 1 : 0) : existing[0].is_featured,
      is_active !== undefined ? (is_active ? 1 : 0) : existing[0].is_active,
      req.params.id
    ]
  );
  res.json({ success: true, message: 'Product updated.' });
};

// DELETE /api/products/:id (admin)
const deleteProduct = async (req, res) => {
  const [rows] = await db.query('SELECT id FROM products WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ success: false, message: 'Product not found.' });
  await db.query('UPDATE products SET is_active = 0 WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Product removed.' });
};

module.exports = { getProducts, getProduct, createProduct, updateProduct, deleteProduct };

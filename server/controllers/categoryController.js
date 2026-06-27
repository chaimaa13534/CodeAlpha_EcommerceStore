const db = require('../config/database');

const slugify = (text) =>
  text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

// GET /api/categories
const getCategories = async (req, res) => {
  const [rows] = await db.query(
    `SELECT c.*, COUNT(p.id) as product_count
    FROM categories c
    LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
    WHERE c.is_active = 1
    GROUP BY c.id
    ORDER BY c.name ASC`
  );
  res.json({ success: true, data: rows });
};

// POST /api/categories (admin)
const createCategory = async (req, res) => {
  const { name, description, icon } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Name is required.' });

  const slug = slugify(name);
  const image = req.file ? `/uploads/categories/${req.file.filename}` : null;

  const [result] = await db.query(
    'INSERT INTO categories (name, slug, description, icon, image) VALUES (?, ?, ?, ?, ?)',
    [name.trim(), slug, description || null, icon || null, image]
  );
  res.status(201).json({ success: true, message: 'Category created.', id: result.insertId });
};

// PUT /api/categories/:id (admin)
const updateCategory = async (req, res) => {
  const { name, description, icon, is_active } = req.body;
  const [existing] = await db.query('SELECT * FROM categories WHERE id = ?', [req.params.id]);
  if (!existing.length) return res.status(404).json({ success: false, message: 'Category not found.' });

  const image = req.file ? `/uploads/categories/${req.file.filename}` : existing[0].image;

  await db.query(
    'UPDATE categories SET name = ?, description = ?, icon = ?, image = ?, is_active = ? WHERE id = ?',
    [name || existing[0].name, description !== undefined ? description : existing[0].description,
      icon || existing[0].icon, image, is_active !== undefined ? (is_active ? 1 : 0) : existing[0].is_active,
      req.params.id]
  );
  res.json({ success: true, message: 'Category updated.' });
};

// DELETE /api/categories/:id (admin)
const deleteCategory = async (req, res) => {
  const [rows] = await db.query('SELECT id FROM categories WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ success: false, message: 'Category not found.' });

  const [products] = await db.query('SELECT COUNT(*) as c FROM products WHERE category_id = ?', [req.params.id]);
  if (products[0].c > 0) {
    return res.status(400).json({ success: false, message: 'Cannot delete category with existing products.' });
  }

  await db.query('DELETE FROM categories WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Category deleted.' });
};

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };

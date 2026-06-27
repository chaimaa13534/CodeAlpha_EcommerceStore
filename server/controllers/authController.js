const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/register
const register = async (req, res) => {
  const { firstname, lastname, username, email, password } = req.body;

  if (!firstname || !lastname || !username || !email || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }

  const [existing] = await db.query(
    'SELECT id FROM users WHERE email = ? OR username = ?',
    [email.toLowerCase(), username.toLowerCase()]
  );
  if (existing.length) {
    return res.status(409).json({ success: false, message: 'Email or username already in use.' });
  }

  const hash = await bcrypt.hash(password, 12);
  const [result] = await db.query(
    'INSERT INTO users (firstname, lastname, username, email, password) VALUES (?, ?, ?, ?, ?)',
    [firstname.trim(), lastname.trim(), username.toLowerCase().trim(), email.toLowerCase().trim(), hash]
  );

  const token = generateToken(result.insertId);
  res.status(201).json({
    success: true,
    message: 'Account created successfully.',
    token,
    user: { id: result.insertId, firstname, lastname, username, email, role: 'user' }
  });
};

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const [rows] = await db.query(
    'SELECT id, firstname, lastname, username, email, password, avatar, role, is_active FROM users WHERE email = ?',
    [email.toLowerCase()]
  );
  if (!rows.length) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  const user = rows[0];
  if (!user.is_active) {
    return res.status(403).json({ success: false, message: 'Your account has been deactivated.' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ success: false, message: 'Invalid email or password.' });
  }

  const token = generateToken(user.id);
  delete user.password;
  res.json({ success: true, message: 'Login successful.', token, user });
};

// GET /api/auth/profile
const getProfile = async (req, res) => {
  const [rows] = await db.query(
    `SELECT u.id, u.firstname, u.lastname, u.username, u.email, u.avatar, u.role, u.created_at,
      (SELECT COUNT(*) FROM orders WHERE user_id = u.id) as order_count,
      (SELECT COUNT(*) FROM wishlists WHERE user_id = u.id) as wishlist_count,
      (SELECT COUNT(*) FROM reviews WHERE user_id = u.id) as review_count
    FROM users u WHERE u.id = ?`,
    [req.user.id]
  );
  res.json({ success: true, user: rows[0] });
};

// PUT /api/auth/profile
const updateProfile = async (req, res) => {
  const { firstname, lastname, username } = req.body;
  const avatar = req.file ? `/uploads/avatars/${req.file.filename}` : undefined;

  const updates = [];
  const vals = [];
  if (firstname) { updates.push('firstname = ?'); vals.push(firstname.trim()); }
  if (lastname)  { updates.push('lastname = ?');  vals.push(lastname.trim()); }
  if (username)  { updates.push('username = ?');  vals.push(username.toLowerCase().trim()); }
  if (avatar)    { updates.push('avatar = ?');    vals.push(avatar); }

  if (!updates.length) return res.status(400).json({ success: false, message: 'Nothing to update.' });

  if (username) {
    const [ex] = await db.query('SELECT id FROM users WHERE username = ? AND id != ?', [username, req.user.id]);
    if (ex.length) return res.status(409).json({ success: false, message: 'Username already taken.' });
  }

  vals.push(req.user.id);
  await db.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, vals);

  const [rows] = await db.query(
    'SELECT id, firstname, lastname, username, email, avatar, role FROM users WHERE id = ?',
    [req.user.id]
  );
  res.json({ success: true, message: 'Profile updated.', user: rows[0] });
};

// PUT /api/auth/password
const changePassword = async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password) {
    return res.status(400).json({ success: false, message: 'Both fields required.' });
  }
  if (new_password.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
  }

  const [rows] = await db.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
  const valid = await bcrypt.compare(current_password, rows[0].password);
  if (!valid) return res.status(401).json({ success: false, message: 'Current password is incorrect.' });

  const hash = await bcrypt.hash(new_password, 12);
  await db.query('UPDATE users SET password = ? WHERE id = ?', [hash, req.user.id]);
  res.json({ success: true, message: 'Password changed successfully.' });
};

module.exports = { register, login, getProfile, updateProfile, changePassword };

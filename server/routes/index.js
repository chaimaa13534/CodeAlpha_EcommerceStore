const express = require('express');
const router = express.Router();

const { authenticate, isAdmin } = require('../middleware/auth');
const { upload, setUploadFolder } = require('../middleware/upload');

const authCtrl      = require('../controllers/authController');
const productCtrl   = require('../controllers/productController');
const categoryCtrl  = require('../controllers/categoryController');
const cartCtrl      = require('../controllers/cartController');
const orderCtrl     = require('../controllers/orderController');
const reviewCtrl    = require('../controllers/reviewController');
const wishlistCtrl  = require('../controllers/wishlistController');
const adminCtrl     = require('../controllers/adminController');

// ── AUTH ────────────────────────────────────────────────
router.post('/auth/register', authCtrl.register);
router.post('/auth/login',    authCtrl.login);
router.get('/auth/profile',   authenticate, authCtrl.getProfile);
router.put('/auth/profile',   authenticate, setUploadFolder('avatars'), upload.single('avatar'), authCtrl.updateProfile);
router.put('/auth/password',  authenticate, authCtrl.changePassword);

// ── CATEGORIES ──────────────────────────────────────────
router.get('/categories',         categoryCtrl.getCategories);
router.post('/categories',        authenticate, isAdmin, setUploadFolder('categories'), upload.single('image'), categoryCtrl.createCategory);
router.put('/categories/:id',     authenticate, isAdmin, setUploadFolder('categories'), upload.single('image'), categoryCtrl.updateCategory);
router.delete('/categories/:id',  authenticate, isAdmin, categoryCtrl.deleteCategory);

// ── PRODUCTS ─────────────────────────────────────────────
router.get('/products',       productCtrl.getProducts);
router.get('/products/:id',   productCtrl.getProduct);
router.post('/products',      authenticate, isAdmin, setUploadFolder('products'), upload.single('image'), productCtrl.createProduct);
router.put('/products/:id',   authenticate, isAdmin, setUploadFolder('products'), upload.single('image'), productCtrl.updateProduct);
router.delete('/products/:id',authenticate, isAdmin, productCtrl.deleteProduct);

// ── CART ─────────────────────────────────────────────────
router.get('/cart',          authenticate, cartCtrl.getCart);
router.post('/cart',         authenticate, cartCtrl.addToCart);
router.put('/cart/:id',      authenticate, cartCtrl.updateCartItem);
router.delete('/cart',       authenticate, cartCtrl.clearCart);
router.delete('/cart/:id',   authenticate, cartCtrl.removeFromCart);

// ── ORDERS ───────────────────────────────────────────────
router.get('/orders',        authenticate, orderCtrl.getOrders);
router.post('/orders',       authenticate, orderCtrl.createOrder);
router.get('/orders/:id',    authenticate, orderCtrl.getOrder);
router.put('/orders/:id',    authenticate, isAdmin, orderCtrl.updateOrderStatus);

// ── REVIEWS ──────────────────────────────────────────────
router.post('/reviews',         authenticate, reviewCtrl.createReview);
router.put('/reviews/:id',      authenticate, reviewCtrl.updateReview);
router.delete('/reviews/:id',   authenticate, reviewCtrl.deleteReview);

// ── WISHLIST ─────────────────────────────────────────────
router.get('/wishlist',                   authenticate, wishlistCtrl.getWishlist);
router.post('/wishlist',                  authenticate, wishlistCtrl.addToWishlist);
router.get('/wishlist/check/:product_id', authenticate, wishlistCtrl.checkWishlist);
router.delete('/wishlist/:id',            authenticate, wishlistCtrl.removeFromWishlist);

// ── ADMIN ────────────────────────────────────────────────
router.get('/admin/dashboard',         authenticate, isAdmin, adminCtrl.getDashboard);
router.get('/admin/users',             authenticate, isAdmin, adminCtrl.getUsers);
router.put('/admin/users/:id/toggle',  authenticate, isAdmin, adminCtrl.toggleUserStatus);

module.exports = router;

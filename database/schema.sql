-- ============================================================
-- ShopLux - E-Commerce Database Schema
-- MySQL 8.0+
-- ============================================================

CREATE DATABASE IF NOT EXISTS store
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE store;

-- ============================================================
-- TABLE: users
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  firstname VARCHAR(100) NOT NULL,
  lastname VARCHAR(100) NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  avatar VARCHAR(500) DEFAULT NULL,
  role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_username (username),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: categories
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(120) NOT NULL UNIQUE,
  description TEXT DEFAULT NULL,
  image VARCHAR(500) DEFAULT NULL,
  icon VARCHAR(100) DEFAULT NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_slug (slug),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: products
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id INT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(280) NOT NULL UNIQUE,
  description TEXT DEFAULT NULL,
  price DECIMAL(10,2) NOT NULL,
  sale_price DECIMAL(10,2) DEFAULT NULL,
  image VARCHAR(500) DEFAULT NULL,
  images JSON DEFAULT NULL,
  stock INT UNSIGNED NOT NULL DEFAULT 0,
  sold_count INT UNSIGNED NOT NULL DEFAULT 0,
  avg_rating DECIMAL(3,2) DEFAULT 0.00,
  review_count INT UNSIGNED DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  is_featured TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_category (category_id),
  INDEX idx_price (price),
  INDEX idx_rating (avg_rating),
  INDEX idx_sold (sold_count),
  INDEX idx_active (is_active),
  INDEX idx_featured (is_featured),
  FULLTEXT idx_search (name, description)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: cart_items
-- ============================================================
CREATE TABLE IF NOT EXISTS cart_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_cart_item (user_id, product_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: orders
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_number VARCHAR(50) NOT NULL UNIQUE,
  user_id INT UNSIGNED NOT NULL,
  status ENUM('pending','paid','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending',
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  tax DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total DECIMAL(10,2) NOT NULL,
  shipping_firstname VARCHAR(100) NOT NULL,
  shipping_lastname VARCHAR(100) NOT NULL,
  shipping_address VARCHAR(255) NOT NULL,
  shipping_city VARCHAR(100) NOT NULL,
  shipping_postal VARCHAR(20) NOT NULL,
  shipping_country VARCHAR(100) NOT NULL DEFAULT 'Morocco',
  shipping_phone VARCHAR(30) DEFAULT NULL,
  payment_method VARCHAR(50) DEFAULT 'card',
  payment_status ENUM('pending','paid','failed','refunded') NOT NULL DEFAULT 'pending',
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_status (status),
  INDEX idx_order_number (order_number),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: order_items
-- ============================================================
CREATE TABLE IF NOT EXISTS order_items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_image VARCHAR(500) DEFAULT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_order (order_id),
  INDEX idx_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: reviews
-- ============================================================
CREATE TABLE IF NOT EXISTS reviews (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  rating TINYINT UNSIGNED NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title VARCHAR(255) DEFAULT NULL,
  comment TEXT DEFAULT NULL,
  is_verified TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_review (user_id, product_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_product (product_id),
  INDEX idx_user (user_id),
  INDEX idx_rating (rating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLE: wishlists
-- ============================================================
CREATE TABLE IF NOT EXISTS wishlists (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  product_id INT UNSIGNED NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_wishlist (user_id, product_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SEED DATA: categories
-- ============================================================
INSERT INTO categories (name, slug, description, icon) VALUES
('Electronics', 'electronics', 'Smartphones, laptops, audio & tech accessories', 'fas fa-microchip'),
('Fashion', 'fashion', 'Clothing, shoes, bags & accessories for all styles', 'fas fa-tshirt'),
('Home & Living', 'home', 'Furniture, décor, kitchen & home improvement', 'fas fa-home'),
('Books', 'books', 'Bestsellers, textbooks, fiction & non-fiction', 'fas fa-book'),
('Sports', 'sports', 'Equipment, clothing & gear for every sport', 'fas fa-dumbbell');

-- ============================================================
-- SEED DATA: admin user (password: Admin@2026)
-- ============================================================
INSERT INTO users (firstname, lastname, username, email, password, role) VALUES
('Admin', 'ShopLux', 'admin', 'admin@shoplux.com', '$2a$12$caw6BGu4E0f1U1luDS7JX.68I3Kt2Sh3f9/yDD25LGTqIqByes/OS', 'admin');

-- ============================================================
-- SEED DATA: sample products
-- ============================================================
INSERT INTO products (category_id, name, slug, description, price, sale_price, stock, is_featured) VALUES
(1, 'iPhone 15 Pro Max', 'iphone-15-pro-max', 'The most powerful iPhone ever. Titanium design, A17 Pro chip, 48MP camera system with 5x optical zoom.', 1299.99, 1199.99, 25, 1),
(1, 'Samsung Galaxy S24 Ultra', 'samsung-galaxy-s24-ultra', 'Ultimate Galaxy AI experience with built-in S Pen, 200MP camera, and Snapdragon 8 Gen 3.', 1199.99, NULL, 18, 1),
(1, 'Sony WH-1000XM5 Headphones', 'sony-wh-1000xm5', 'Industry-leading noise canceling headphones with 30-hour battery life and crystal-clear hands-free calling.', 349.99, 299.99, 42, 0),
(1, 'Apple MacBook Pro 14"', 'apple-macbook-pro-14', 'Supercharged by M3 Pro or M3 Max chip. Up to 22 hours battery. Liquid Retina XDR display.', 1999.99, NULL, 12, 1),
(2, 'Nike Air Max 270', 'nike-air-max-270', 'Lightweight, breathable upper with Max Air 270 unit for all-day comfort and iconic style.', 149.99, 119.99, 60, 0),
(2, 'Levi''s 511 Slim Jeans', 'levis-511-slim-jeans', 'Classic slim fit jeans crafted from stretch denim for comfort and style. Available in multiple washes.', 79.99, NULL, 85, 0),
(3, 'Dyson V15 Detect Vacuum', 'dyson-v15-detect', 'Reveals and captures microscopic dust. Laser detects particles invisible to the naked eye.', 749.99, 649.99, 20, 1),
(3, 'Philips Hue Smart Bulb Pack', 'philips-hue-smart-bulbs', '4-pack color ambiance bulbs. Control with voice or app. 16 million colors and warm whites.', 129.99, NULL, 55, 0),
(4, 'Atomic Habits - James Clear', 'atomic-habits-james-clear', 'The life-changing million copy #1 bestseller. Build good habits, break bad ones, master the tiny changes that lead to results.', 19.99, 14.99, 200, 0),
(5, 'Garmin Forerunner 965', 'garmin-forerunner-965', 'Premium GPS smartwatch for running and triathlon. AMOLED display, training readiness, race predictor.', 599.99, NULL, 30, 1);

# 🛍️ ShopLux — Premium E-Commerce Platform

![ShopLux Banner](https://via.placeholder.com/1200x400/6C63FF/FFFFFF?text=ShopLux+%E2%80%94+Premium+E-Commerce)

> A full-stack, production-ready e-commerce web application built with **Node.js**, **Express.js**, **MySQL** and **Vanilla JavaScript**. Designed as a professional portfolio project with premium UI/UX.

---

## ✨ Features

### 🔐 Authentication
- JWT-based authentication (register, login, logout)
- Password hashing with bcryptjs (12 salt rounds)
- Protected routes middleware
- Auto token refresh & expiry handling

### 👤 User Management
- Full profile management (name, username, avatar upload)
- Password change with validation
- User dashboard with order history & wishlist
- Admin user management with activate/deactivate

### 🛒 Products
- Full CRUD with admin panel
- Category filtering & full-text search
- Sort by: price, popularity, rating, newest
- Product quick view modal
- Image upload with Multer
- Stock management in real-time
- Featured products & sale prices
- Discount percentage auto-calculation

### 🗂️ Categories
- 5 built-in categories: Electronics, Fashion, Home, Books, Sports
- Admin create/edit/delete categories
- Product count per category

### 🛍️ Shopping Cart
- Add / update / remove items
- Quantity control with stock validation
- Cart persisted in MySQL per user
- Real-time subtotal calculation

### 📦 Orders
- One-click checkout with simulated payment
- Full order history with status tracking
- Order detail modal
- Admin order status management
- Automatic stock deduction on order

### ❤️ Wishlist
- Add/remove products
- Real-time wishlist badge
- Check if product is already in wishlist

### ⭐ Reviews & Ratings
- 1–5 star rating system
- Title + comment reviews
- Automatic average rating update
- One review per user per product

### 🛡️ Admin Panel
- Dashboard: revenue, orders, users, products stats
- Top products & recent orders widgets
- Full product CRUD with image upload
- Order status management
- User activate/deactivate
- All data in real-time

### 🎨 UI/UX
- Dark Mode (persisted in localStorage)
- Hero carousel with auto-slide
- Infinite scroll-ready pagination
- Product quick view modal
- Responsive: mobile / tablet / desktop
- Skeleton loading screens
- Toast notifications (success, error, warning, info)
- Smooth CSS animations & transitions
- Professional 404 page
- Back to top button

---

## 🏗️ Architecture

```
ecommerce-store/
├── server/
│   ├── config/
│   │   └── database.js          # MySQL connection pool
│   ├── controllers/
│   │   ├── authController.js    # Register, login, profile
│   │   ├── productController.js # CRUD products
│   │   ├── categoryController.js
│   │   ├── cartController.js
│   │   ├── orderController.js
│   │   ├── reviewController.js
│   │   ├── wishlistController.js
│   │   └── adminController.js   # Dashboard, users
│   ├── middleware/
│   │   ├── auth.js              # JWT middleware
│   │   ├── errorHandler.js      # Global error handler
│   │   └── upload.js            # Multer file upload
│   ├── routes/
│   │   └── index.js             # All API routes
│   ├── uploads/                 # Uploaded images
│   └── app.js                   # Express entry point
│
├── client/
│   ├── assets/
│   │   ├── css/
│   │   │   ├── variables.css    # Design tokens
│   │   │   ├── base.css         # Reset & utilities
│   │   │   ├── components.css   # Buttons, cards, forms…
│   │   │   ├── layout.css       # Navbar, footer, sidebar
│   │   │   ├── pages.css        # Page-specific styles
│   │   │   ├── animations.css   # Keyframes & transitions
│   │   │   └── responsive.css   # Mobile-first breakpoints
│   │   └── js/
│   │       ├── api.js           # API client (fetch wrapper)
│   │       ├── auth.js          # Auth state manager
│   │       ├── cart.js          # Cart manager
│   │       ├── ui.js            # Toast, Stars, Format, ProductCard…
│   │       └── app.js           # Main app controller
│   ├── pages/
│   │   ├── login.html
│   │   ├── register.html
│   │   ├── product.html
│   │   ├── cart.html
│   │   ├── checkout.html
│   │   ├── orders.html
│   │   ├── dashboard.html
│   │   ├── wishlist.html
│   │   ├── admin.html
│   │   └── 404.html
│   └── index.html               # Home page (SPA root)
│
├── database/
│   ├── schema.sql               # Complete MySQL schema + seed
│   └── init.js                  # Database initializer script
│
├── .env.example
├── package.json
└── README.md
```

---

## 🚀 Installation

### Prerequisites
- **Node.js** >= 18.x
- **MySQL** 8.x
- **npm** >= 9.x

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/shoplux-ecommerce.git
cd shoplux-ecommerce
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment
```bash
cp .env.example .env
```
Edit `.env` with your MySQL credentials:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ecommerce_store
JWT_SECRET=my_super_secret_key_2026
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

### 4. Initialize the database
```bash
# Option A – using the init script
npm run db:init

# Option B – directly with MySQL CLI
mysql -u root -p < database/schema.sql
```

### 5. Start the server
```bash
# Development (with nodemon)
npm run dev

# Production
npm start
```

### 6. Open in browser
```
http://localhost:5000
```

---

## 🔑 Default Admin Credentials

| Field    | Value                  |
|----------|------------------------|
| Email    | `admin@shoplux.com`    |
| Password | `Admin@2026`           |
| Role     | Admin                  |

> ⚠️ Change these credentials immediately in production!

---

## 🌐 API Reference

### Authentication
| Method | Endpoint              | Auth | Description         |
|--------|-----------------------|------|---------------------|
| POST   | `/api/auth/register`  | ❌    | Register new user   |
| POST   | `/api/auth/login`     | ❌    | Login               |
| GET    | `/api/auth/profile`   | ✅    | Get profile         |
| PUT    | `/api/auth/profile`   | ✅    | Update profile      |
| PUT    | `/api/auth/password`  | ✅    | Change password     |

### Products
| Method | Endpoint              | Auth  | Description        |
|--------|-----------------------|-------|--------------------|
| GET    | `/api/products`       | ❌     | List products      |
| GET    | `/api/products/:id`   | ❌     | Get product        |
| POST   | `/api/products`       | Admin | Create product     |
| PUT    | `/api/products/:id`   | Admin | Update product     |
| DELETE | `/api/products/:id`   | Admin | Delete product     |

### Query Parameters (GET /api/products)
```
?category=electronics   Filter by category slug
?search=iphone          Full-text search
?sort=popular           newest|popular|rating|price_asc|price_desc
?page=1&limit=12        Pagination
?min_price=100          Minimum price filter
?max_price=500          Maximum price filter
?featured=1             Featured products only
```

### Cart
| Method | Endpoint        | Auth | Description         |
|--------|-----------------|------|---------------------|
| GET    | `/api/cart`     | ✅    | Get cart items      |
| POST   | `/api/cart`     | ✅    | Add item to cart    |
| PUT    | `/api/cart/:id` | ✅    | Update quantity     |
| DELETE | `/api/cart/:id` | ✅    | Remove item         |
| DELETE | `/api/cart`     | ✅    | Clear cart          |

### Orders
| Method | Endpoint          | Auth  | Description         |
|--------|-------------------|-------|---------------------|
| GET    | `/api/orders`     | ✅     | List orders         |
| POST   | `/api/orders`     | ✅     | Create order        |
| GET    | `/api/orders/:id` | ✅     | Order details       |
| PUT    | `/api/orders/:id` | Admin | Update status       |

### Reviews
| Method | Endpoint            | Auth | Description    |
|--------|---------------------|------|----------------|
| POST   | `/api/reviews`      | ✅    | Create review  |
| PUT    | `/api/reviews/:id`  | ✅    | Update review  |
| DELETE | `/api/reviews/:id`  | ✅    | Delete review  |

### Wishlist
| Method | Endpoint                        | Auth | Description       |
|--------|---------------------------------|------|-------------------|
| GET    | `/api/wishlist`                 | ✅    | Get wishlist      |
| POST   | `/api/wishlist`                 | ✅    | Add to wishlist   |
| DELETE | `/api/wishlist/:id`             | ✅    | Remove from wishlist |
| GET    | `/api/wishlist/check/:product_id` | ✅  | Check if saved    |

### Admin
| Method | Endpoint                        | Auth  | Description        |
|--------|---------------------------------|-------|--------------------|
| GET    | `/api/admin/dashboard`          | Admin | Dashboard stats    |
| GET    | `/api/admin/users`              | Admin | List users         |
| PUT    | `/api/admin/users/:id/toggle`   | Admin | Toggle user status |

---

## 🗃️ Database Schema

```sql
users          -- User accounts (id, name, email, password, avatar, role)
categories     -- Product categories (id, name, slug, icon)
products       -- Products (id, name, price, stock, avg_rating, is_featured…)
cart_items     -- Shopping cart (user_id, product_id, quantity)
orders         -- Orders (id, order_number, user_id, status, total, shipping…)
order_items    -- Order line items (order_id, product_id, quantity, price)
reviews        -- Product reviews (user_id, product_id, rating, comment)
wishlists      -- Saved products (user_id, product_id)
```

---

## 🛠️ npm Scripts

```bash
npm run dev       # Start development server (nodemon)
npm start         # Start production server
npm run db:init   # Initialize database schema + seed data
```

---

## 🔒 Security

- **Helmet** — Security headers
- **CORS** — Cross-origin resource sharing
- **express-rate-limit** — 200 req/15min globally, 20 for auth
- **bcryptjs** — Password hashing (12 salt rounds)
- **JWT** — Stateless authentication (7-day expiry)
- **Morgan** — HTTP request logging
- **Input validation** — Server-side field validation
- **Admin middleware** — Role-based route protection
- **Parameterized queries** — SQL injection prevention

---

## 🎨 Design System

| Token            | Value                      |
|------------------|----------------------------|
| Primary color    | `#6C63FF` (purple)         |
| Accent color     | `#FF6584` (pink)           |
| Success          | `#10B981` (green)          |
| Warning          | `#F59E0B` (amber)          |
| Danger           | `#EF4444` (red)            |
| Font (UI)        | Inter                      |
| Font (Display)   | Playfair Display           |
| Border radius    | 0.375rem – 1.5rem          |

---

## 📁 Environment Variables

```env
PORT=5000                              # Server port
DB_HOST=localhost                      # MySQL host
DB_PORT=3306                           # MySQL port
DB_USER=root                           # MySQL user
DB_PASSWORD=                           # MySQL password
DB_NAME=ecommerce_store                # Database name
JWT_SECRET=my_super_secret_key_2026    # JWT signing secret
JWT_EXPIRES_IN=7d                      # Token expiry
NODE_ENV=development                   # Environment
UPLOAD_PATH=./server/uploads           # Upload directory
MAX_FILE_SIZE=5242880                  # 5MB in bytes
```

---

## 🚀 Deployment (GitHub)

```bash
# Initialize git
git init
git add .
git commit -m "🚀 Initial commit — ShopLux E-Commerce"

# Create repo on GitHub then push
git remote add origin https://github.com/yourusername/shoplux-ecommerce.git
git branch -M main
git push -u origin main
```

---

## 📸 Pages Overview

| Page          | URL                      | Auth Required |
|---------------|--------------------------|---------------|
| Home          | `/`                      | ❌             |
| Product       | `/pages/product.html`    | ❌             |
| Login         | `/pages/login.html`      | ❌             |
| Register      | `/pages/register.html`   | ❌             |
| Cart          | `/pages/cart.html`       | ✅             |
| Checkout      | `/pages/checkout.html`   | ✅             |
| Orders        | `/pages/orders.html`     | ✅             |
| Dashboard     | `/pages/dashboard.html`  | ✅             |
| Wishlist      | `/pages/wishlist.html`   | ✅             |
| Admin         | `/pages/admin.html`      | Admin only    |
| 404           | `/pages/404.html`        | ❌             |

---

## 🧑‍💻 Tech Stack

| Layer      | Technology                      |
|------------|---------------------------------|
| Runtime    | Node.js 18+                     |
| Framework  | Express.js 4                    |
| Database   | MySQL 8 + mysql2                |
| Auth       | JWT + bcryptjs                  |
| Upload     | Multer                          |
| Security   | Helmet, CORS, Rate Limit        |
| Logging    | Morgan                          |
| Frontend   | HTML5, CSS3, Vanilla JS ES6     |
| Fonts      | Google Fonts (Inter, Playfair)  |
| Icons      | Font Awesome 6                  |

---

## 📄 License

MIT License — free to use for personal and commercial projects.

---

<div align="center">
  <strong>Built with ❤️ for portfolio purposes</strong><br/>
  <em>ShopLux — Premium E-Commerce · Node.js · Express · MySQL</em>
</div>

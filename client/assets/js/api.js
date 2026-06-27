

const API_BASE = '/api';

const Api = {
  // Core fetch wrapper
  async request(method, endpoint, data = null, isForm = false) {
    const headers = {};
    const token = localStorage.getItem('sl_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (!isForm) headers['Content-Type'] = 'application/json';

    const options = { method, headers };
    if (data) {
      options.body = isForm ? data : JSON.stringify(data);
    }

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, options);
      const json = await res.json();

      if (!res.ok) {
        const err = new Error(json.message || 'Request failed');
        err.status = res.status;
        err.data   = json;

        // Only auto-logout on 401 for protected routes (not login/register)
        const isAuthEndpoint = endpoint === '/auth/login' || endpoint === '/auth/register';
        if (res.status === 401 && !isAuthEndpoint) {
          localStorage.removeItem('sl_token');
          localStorage.removeItem('sl_user');
          window.dispatchEvent(new Event('auth:logout'));
        }

        throw err;
      }

      return json;
    } catch (err) {
      // Re-throw errors that already have a status (our API errors)
      if (err.status) throw err;

      // Network / parse errors
      const netErr = new Error('Network error. Please check your connection.');
      netErr.status = 0;
      throw netErr;
    }
  },

  get:    (endpoint)       => Api.request('GET',    endpoint),
  post:   (endpoint, data) => Api.request('POST',   endpoint, data),
  put:    (endpoint, data) => Api.request('PUT',    endpoint, data),
  del:    (endpoint)       => Api.request('DELETE', endpoint),
  upload: (endpoint, form) => Api.request('POST',   endpoint, form, true),
  putUpload: (endpoint, form) => Api.request('PUT', endpoint, form, true),

  // ── Auth ──
  auth: {
    register: (d) => Api.post('/auth/register', d),
    login:    (d) => Api.post('/auth/login', d),
    profile:  ()  => Api.get('/auth/profile'),
    update:   (f) => Api.putUpload('/auth/profile', f),
    password: (d) => Api.put('/auth/password', d),
  },

  // ── Products ──
  products: {
    list:   (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return Api.get(`/products${qs ? '?' + qs : ''}`);
    },
    get:    (id)    => Api.get(`/products/${id}`),
    create: (f)     => Api.upload('/products', f),
    update: (id, f) => Api.putUpload(`/products/${id}`, f),
    delete: (id)    => Api.del(`/products/${id}`),
  },

  // ── Categories ──
  categories: {
    list:   ()      => Api.get('/categories'),
    create: (f)     => Api.upload('/categories', f),
    update: (id, f) => Api.putUpload(`/categories/${id}`, f),
    delete: (id)    => Api.del(`/categories/${id}`),
  },

  // ── Cart ──
  cart: {
    get:    ()        => Api.get('/cart'),
    add:    (d)       => Api.post('/cart', d),
    update: (id, qty) => Api.put(`/cart/${id}`, { quantity: qty }),
    remove: (id)      => Api.del(`/cart/${id}`),
    clear:  ()        => Api.del('/cart'),
  },

  // ── Orders ──
  orders: {
    list: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return Api.get(`/orders${qs ? '?' + qs : ''}`);
    },
    create:       (d)           => Api.post('/orders', d),
    get:          (id)          => Api.get(`/orders/${id}`),
    updateStatus: (id, status)  => Api.put(`/orders/${id}`, { status }),
  },

  // ── Reviews ──
  reviews: {
    create: (d)     => Api.post('/reviews', d),
    update: (id, d) => Api.put(`/reviews/${id}`, d),
    delete: (id)    => Api.del(`/reviews/${id}`),
  },

  // ── Wishlist ──
  wishlist: {
    get:    ()    => Api.get('/wishlist'),
    add:    (id)  => Api.post('/wishlist', { product_id: id }),
    remove: (id)  => Api.del(`/wishlist/${id}`),
    check:  (pid) => Api.get(`/wishlist/check/${pid}`),
  },

  // ── Admin ──
  admin: {
    dashboard: () => Api.get('/admin/dashboard'),
    users: (params = {}) => {
      const qs = new URLSearchParams(params).toString();
      return Api.get(`/admin/users${qs ? '?' + qs : ''}`);
    },
    toggleUser: (id) => Api.put(`/admin/users/${id}/toggle`),
  }
};

window.Api = Api;

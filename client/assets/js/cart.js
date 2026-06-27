/* ═══════════════════════════════════════════
   ShopLux – Cart Manager (cart.js)
   ═══════════════════════════════════════════ */

const Cart = {
  _count: 0,

  async refresh() {
    if (!Auth.isLoggedIn) { this._setCount(0); return; }
    try {
      const res = await Api.cart.get();
      this._setCount(res.data.itemCount || 0);
    } catch { /* ignore */ }
  },

  _setCount(n) {
    this._count = n;
    const badge = document.getElementById('cartBadge');
    if (!badge) return;
    badge.textContent = n;
    badge.style.display = n > 0 ? 'flex' : 'none';
  },

  async add(productId, qty = 1) {
    if (!Auth.requireAuth()) return;
    try {
      await Api.cart.add({ product_id: productId, quantity: qty });
      this._setCount(this._count + qty);
      Toast.show('Added to cart!', 'success', 'fas fa-shopping-bag');
    } catch (err) {
      Toast.show(err.message || 'Could not add to cart.', 'error');
    }
  },

  get count() { return this._count; }
};

window.Cart = Cart;

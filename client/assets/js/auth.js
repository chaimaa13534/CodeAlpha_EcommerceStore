/* ═══════════════════════════════════════════
   ShopLux – Auth State Manager (auth.js)
   ═══════════════════════════════════════════ */

const Auth = {
  _user: null,
  _token: null,

  init() {
    this._token = localStorage.getItem('sl_token');
    try {
      const raw = localStorage.getItem('sl_user');
      this._user = raw ? JSON.parse(raw) : null;
    } catch { this._user = null; }
    this._updateUI();
    window.addEventListener('auth:logout', () => this.logout(false));
  },

  get user()  { return this._user; },
  get token() { return this._token; },
  get isLoggedIn() { return !!this._token && !!this._user; },
  get isAdmin()    { return this._user?.role === 'admin'; },

  setSession(token, user) {
    this._token = token;
    this._user  = user;
    localStorage.setItem('sl_token', token);
    localStorage.setItem('sl_user', JSON.stringify(user));
    this._updateUI();
    if (typeof Cart !== 'undefined') Cart.refresh();
  },

  logout(redirect = true) {
    this._token = null;
    this._user  = null;
    localStorage.removeItem('sl_token');
    localStorage.removeItem('sl_user');
    this._updateUI();
    if (redirect) {
      Toast.show('Logged out successfully.', 'info');
      setTimeout(() => window.location.href = '/', 600);
    }
  },

  requireAuth(redirectTo) {
    if (!this.isLoggedIn) {
      const back = redirectTo || window.location.pathname;
      window.location.href = `/pages/login.html?redirect=${encodeURIComponent(back)}`;
      return false;
    }
    return true;
  },

  _updateUI() {
    const guestLinks = document.getElementById('guestLinks');
    const userLinks  = document.getElementById('userLinks');
    const adminLink  = document.getElementById('adminLink');
    const header     = document.getElementById('dropdownHeader');

    if (!guestLinks) return;

    if (this.isLoggedIn) {
      guestLinks.classList.add('hidden');
      userLinks.classList.remove('hidden');
      if (adminLink) adminLink.classList.toggle('hidden', !this.isAdmin);
      if (header) {
        header.querySelector('.dropdown-name').textContent = `${this._user.firstname} ${this._user.lastname}`;
        header.querySelector('.dropdown-email').textContent = this._user.email;
      }
    } else {
      guestLinks.classList.remove('hidden');
      userLinks.classList.add('hidden');
      if (adminLink) adminLink.classList.add('hidden');
      if (header) {
        header.querySelector('.dropdown-name').textContent = 'Welcome!';
        header.querySelector('.dropdown-email').textContent = 'Sign in to continue';
      }
    }
  }
};

window.Auth = Auth;

/* ═══════════════════════════════════════════
   ShopLux – Main App Controller (app.js)
   ═══════════════════════════════════════════ */

/* ── State ── */
let currentPage = 1;
let currentFilters = {};
let heroInterval = null;
let currentSlide = 0;
let recentlyViewed = JSON.parse(localStorage.getItem('sl_recent') || '[]');

/* ── Init ── */
document.addEventListener('DOMContentLoaded', async () => {
  // Init auth & cart
  Auth.init();
  await Cart.refresh();
  await loadWishlistBadge();

  // Hide loader
  setTimeout(() => document.getElementById('loader')?.classList.add('hidden'), 600);

  // Parse URL params
  const params = new URLSearchParams(window.location.search);
  if (params.get('category')) currentFilters.category = params.get('category');
  if (params.get('search'))   currentFilters.search   = params.get('search');
  if (params.get('sort'))     currentFilters.sort      = params.get('sort');

  // Update search input
  if (currentFilters.search) {
    const si = document.getElementById('searchInput');
    if (si) si.value = currentFilters.search;
  }

  // Update sort select
  if (currentFilters.sort) {
    const ss = document.getElementById('sortSelect');
    if (ss) ss.value = currentFilters.sort;
  }

  // Update active category nav
  if (currentFilters.category) {
    document.querySelectorAll('.cat-link').forEach(l => {
      l.classList.toggle('active', l.dataset.cat === currentFilters.category);
    });
  }

  // Bind events
  bindNavbar();
  bindSearch();
  bindFilters();
  initHero();
  initTheme();
  initBackToTop();

  // Load page data
  await loadCategories();
  await loadFeaturedProducts();
  await loadProducts();
  loadRecentlyViewed();
});

/* ── Navbar ── */
function bindNavbar() {
  // Scroll shadow
  window.addEventListener('scroll', () => {
    document.getElementById('navbar')?.classList.toggle('scrolled', window.scrollY > 10);
    document.getElementById('backToTop')?.classList.toggle('visible', window.scrollY > 400);
  });

  // Avatar dropdown
  const avatarBtn = document.getElementById('avatarBtn');
  const dropdown  = document.getElementById('userDropdown');
  if (avatarBtn && dropdown) {
    avatarBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('open');
    });
    document.addEventListener('click', () => dropdown.classList.remove('open'));
  }

  // Logout
  document.getElementById('logoutBtn')?.addEventListener('click', () => Auth.logout());

  // Hamburger / sidebar
  const ham     = document.getElementById('hamburger');
  const sidebar = document.getElementById('mobileSidebar');
  const overlay = document.getElementById('sidebarOverlay');
  const close   = document.getElementById('sidebarClose');

  const openSidebar  = () => { sidebar?.classList.add('open'); overlay?.classList.add('open'); };
  const closeSidebar = () => { sidebar?.classList.remove('open'); overlay?.classList.remove('open'); };

  ham?.addEventListener('click', openSidebar);
  close?.addEventListener('click', closeSidebar);
  overlay?.addEventListener('click', closeSidebar);

  // Back to top
  document.getElementById('backToTop')?.addEventListener('click', () =>
    window.scrollTo({ top: 0, behavior: 'smooth' })
  );
}

/* ── Search ── */
function bindSearch() {
  const form     = document.getElementById('searchForm');
  const input    = document.getElementById('searchInput');
  const dropdown = document.getElementById('searchDropdown');
  let searchTimeout;

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    currentFilters.search = q;
    currentFilters.category = '';
    currentPage = 1;
    dropdown?.classList.add('hidden');
    updateURL();
    loadProducts();
    // scroll to products
    document.getElementById('productsSection')?.scrollIntoView({ behavior: 'smooth' });
  });

  input?.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    const q = input.value.trim();
    if (q.length < 2) { dropdown?.classList.add('hidden'); return; }
    searchTimeout = setTimeout(() => liveSearch(q), 300);
  });

  input?.addEventListener('blur', () => setTimeout(() => dropdown?.classList.add('hidden'), 200));
  input?.addEventListener('focus', () => {
    if (input.value.trim().length >= 2) dropdown?.classList.remove('hidden');
  });
}

async function liveSearch(q) {
  const dropdown = document.getElementById('searchDropdown');
  if (!dropdown) return;
  try {
    const res = await Api.products.list({ search: q, limit: 6 });
    if (!res.data.length) {
      dropdown.innerHTML = `<p class="search-no-results">No results for "<strong>${escapeHtml(q)}</strong>"</p>`;
    } else {
      dropdown.innerHTML = res.data.map(p => `
        <div class="search-item" onclick="goToProduct(${p.id}, '${p.slug || ''}')">
          ${p.image
            ? `<img src="${p.image}" alt="${escapeHtml(p.name)}">`
            : `<div class="search-item-img"><i class="fas fa-image" style="margin:auto;display:flex;height:100%;align-items:center;justify-content:center;color:var(--text-muted)"></i></div>`}
          <div class="search-item-info">
            <p class="search-item-name">${escapeHtml(p.name)}</p>
            <p class="search-item-price">${Format.price(p.sale_price || p.price)}</p>
          </div>
        </div>`).join('');
    }
    dropdown.classList.remove('hidden');
  } catch { dropdown.classList.add('hidden'); }
}

/* ── Filters ── */
function bindFilters() {
  document.getElementById('sortSelect')?.addEventListener('change', (e) => {
    currentFilters.sort = e.target.value;
    currentPage = 1;
    updateURL();
    loadProducts();
  });

  document.getElementById('applyPrice')?.addEventListener('click', () => {
    const min = document.getElementById('minPrice')?.value;
    const max = document.getElementById('maxPrice')?.value;
    if (min) currentFilters.min_price = min;
    if (max) currentFilters.max_price = max;
    currentPage = 1;
    loadProducts();
  });

  document.getElementById('gridView')?.addEventListener('click', () => {
    document.getElementById('productsGrid')?.classList.remove('list-view');
    document.getElementById('gridView')?.classList.add('active');
    document.getElementById('listView')?.classList.remove('active');
  });
  document.getElementById('listView')?.addEventListener('click', () => {
    document.getElementById('productsGrid')?.classList.add('list-view');
    document.getElementById('listView')?.classList.add('active');
    document.getElementById('gridView')?.classList.remove('active');
  });
}

function updateURL() {
  const params = new URLSearchParams();
  if (currentFilters.category) params.set('category', currentFilters.category);
  if (currentFilters.search)   params.set('search',   currentFilters.search);
  if (currentFilters.sort)     params.set('sort',     currentFilters.sort);
  const newUrl = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
  history.replaceState({}, '', newUrl);
}

function resetFilters() {
  currentFilters = {};
  currentPage = 1;
  const si = document.getElementById('searchInput');
  if (si) si.value = '';
  const ss = document.getElementById('sortSelect');
  if (ss) ss.value = 'newest';
  history.replaceState({}, '', '/');
  loadProducts();
}
window.resetFilters = resetFilters;

/* ── Hero Carousel ── */
function initHero() {
  const slides = document.querySelectorAll('.hero-slide');
  const dots   = document.querySelectorAll('.hero-dot');
  if (!slides.length) return;

  function showSlide(n) {
    slides.forEach((s, i) => s.classList.toggle('active', i === n));
    dots.forEach((d, i)   => d.classList.toggle('active', i === n));
    currentSlide = n;
  }

  document.getElementById('heroNext')?.addEventListener('click', () =>
    showSlide((currentSlide + 1) % slides.length));
  document.getElementById('heroPrev')?.addEventListener('click', () =>
    showSlide((currentSlide - 1 + slides.length) % slides.length));
  dots.forEach((d, i) => d.addEventListener('click', () => showSlide(i)));

  heroInterval = setInterval(() => showSlide((currentSlide + 1) % slides.length), 5000);
}

/* ── Theme ── */
function initTheme() {
  const saved = localStorage.getItem('sl_theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  updateThemeIcon(saved);

  document.getElementById('themeToggle')?.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme');
    const next    = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('sl_theme', next);
    updateThemeIcon(next);
  });
}
function updateThemeIcon(theme) {
  const icon = document.querySelector('#themeToggle i');
  if (icon) icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
}

/* ── Back to Top ── */
function initBackToTop() {
  document.getElementById('backToTop')?.addEventListener('click', () =>
    window.scrollTo({ top: 0, behavior: 'smooth' })
  );
}

/* ── Load Categories ── */
async function loadCategories() {
  const grid = document.getElementById('categoriesGrid');
  if (!grid) return;
  try {
    const res = await Api.categories.list();
    grid.innerHTML = res.data.map(c => `
      <a href="/?category=${c.slug}" class="category-card ${currentFilters.category === c.slug ? 'active' : ''}">
        <div class="category-card-icon"><i class="${c.icon || 'fas fa-tag'}"></i></div>
        <p class="category-card-name">${escapeHtml(c.name)}</p>
        <p class="category-card-count">${c.product_count} products</p>
      </a>`).join('');
  } catch {
    grid.innerHTML = '';
  }
}

/* ── Load Featured Products ── */
async function loadFeaturedProducts() {
  const grid = document.getElementById('featuredGrid');
  if (!grid) return;
  grid.innerHTML = ProductCard.renderSkeleton(4);
  try {
    const res = await Api.products.list({ featured: '1', limit: 8, sort: 'popular' });
    if (!res.data.length) { grid.closest('section')?.classList.add('hidden'); return; }
    grid.innerHTML = res.data.map(p => ProductCard.render(p)).join('');
    grid.classList.add('stagger');
  } catch {
    grid.closest('section')?.classList.add('hidden');
  }
}

/* ── Load Products ── */
async function loadProducts() {
  const grid  = document.getElementById('productsGrid');
  const empty = document.getElementById('productsEmpty');
  const title = document.getElementById('productsTitle');
  const pag   = document.getElementById('pagination');
  if (!grid) return;

  grid.innerHTML = ProductCard.renderSkeleton(8);
  if (empty) empty.classList.add('hidden');

  // Build title
  if (title) {
    if (currentFilters.search)   title.textContent = `Search: "${currentFilters.search}"`;
    else if (currentFilters.category) {
      const cats = { electronics: 'Electronics', fashion: 'Fashion',
        home: 'Home & Living', books: 'Books', sports: 'Sports' };
      title.textContent = cats[currentFilters.category] || currentFilters.category;
    }
    else title.textContent = 'All Products';
  }

  try {
    const params = { ...currentFilters, page: currentPage, limit: 12 };
    const res = await Api.products.list(params);

    if (!res.data.length) {
      grid.innerHTML = '';
      if (empty) empty.classList.remove('hidden');
      if (pag) pag.innerHTML = '';
      return;
    }

    grid.innerHTML = res.data.map(p => ProductCard.render(p)).join('');
    grid.classList.add('stagger');

    // Pagination
    if (pag) {
      Pagination.render(pag, res.pagination, (p) => {
        currentPage = p;
        loadProducts();
        document.getElementById('productsSection')?.scrollIntoView({ behavior: 'smooth' });
      });
    }
  } catch {
    grid.innerHTML = `<p style="color:var(--color-danger);grid-column:1/-1;text-align:center;padding:var(--spacing-10)">Failed to load products.</p>`;
  }
}

/* ── Wishlist Badge ── */
async function loadWishlistBadge() {
  if (!Auth.isLoggedIn) return;
  try {
    const res = await Api.wishlist.get();
    const badge = document.getElementById('wishlistBadge');
    if (badge && res.data.length) {
      badge.textContent = res.data.length;
      badge.style.display = 'flex';
    }
  } catch { /* ignore */ }
}

/* ── Recently Viewed ── */
function loadRecentlyViewed() {
  const section = document.getElementById('recentSection');
  const grid    = document.getElementById('recentGrid');
  if (!section || !grid || !recentlyViewed.length) return;

  // We'd need actual product data here; show section if we have IDs
  section.style.display = 'block';
  // Fetch each product lazily
  Promise.all(recentlyViewed.slice(0, 6).map(id => Api.products.get(id).catch(() => null)))
    .then(results => {
      const valid = results.filter(Boolean).map(r => r.data);
      if (!valid.length) { section.style.display = 'none'; return; }
      grid.innerHTML = valid.map(p => ProductCard.render(p)).join('');
    });
}

function addToRecentlyViewed(id) {
  recentlyViewed = [id, ...recentlyViewed.filter(x => x !== id)].slice(0, 10);
  localStorage.setItem('sl_recent', JSON.stringify(recentlyViewed));
}
window.addToRecentlyViewed = addToRecentlyViewed;

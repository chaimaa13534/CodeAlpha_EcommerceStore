/* ═══════════════════════════════════════════
   ShopLux – UI Helpers (ui.js)
   ═══════════════════════════════════════════ */

/* ── TOAST ── */
const Toast = {
  show(message, type = 'info', icon = null, title = null) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const icons = { success: 'fas fa-check-circle', error: 'fas fa-times-circle',
      warning: 'fas fa-exclamation-triangle', info: 'fas fa-info-circle' };
    const titles = { success: 'Success', error: 'Error', warning: 'Warning', info: 'Info' };

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <i class="${icon || icons[type]} toast-icon"></i>
      <div class="toast-body">
        <p class="toast-title">${title || titles[type]}</p>
        <p class="toast-msg">${message}</p>
      </div>
      <button class="toast-close"><i class="fas fa-times"></i></button>
    `;

    const close = () => {
      toast.classList.add('toast-exit');
      setTimeout(() => toast.remove(), 350);
    };
    toast.querySelector('.toast-close').addEventListener('click', close);
    container.appendChild(toast);
    setTimeout(close, 4000);
  }
};

/* ── STARS ── */
const Stars = {
  render(rating, max = 5) {
    let html = '<div class="stars">';
    for (let i = 1; i <= max; i++) {
      if (rating >= i)         html += '<i class="fas fa-star filled"></i>';
      else if (rating >= i-.5) html += '<i class="fas fa-star-half-alt filled half"></i>';
      else                     html += '<i class="far fa-star"></i>';
    }
    return html + '</div>';
  }
};

/* ── FORMAT ── */
const Format = {
  price(n, currency = 'USD') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(n);
  },
  date(d) {
    return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  },
  datetime(d) {
    return new Date(d).toLocaleString('en-US', { year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' });
  },
  number(n) { return new Intl.NumberFormat('en-US').format(n); },
  ago(d) {
    const sec = Math.floor((Date.now() - new Date(d)) / 1000);
    if (sec < 60)   return 'just now';
    if (sec < 3600) return `${Math.floor(sec/60)}m ago`;
    if (sec < 86400)return `${Math.floor(sec/3600)}h ago`;
    return `${Math.floor(sec/86400)}d ago`;
  }
};

/* ── PRODUCT CARD ── */
const ProductCard = {
  render(p, options = {}) {
    const effectivePrice = p.sale_price || p.price;
    const discount = p.sale_price ? Math.round((1 - p.sale_price / p.price) * 100) : 0;
    const imagePath = p.image || '';
    const isNew = new Date(p.created_at) > new Date(Date.now() - 7 * 86400000);

    return `
    <div class="product-card animate-fade-in-up" data-id="${p.id}">
      <div class="product-card-badges">
        ${discount ? `<span class="card-badge badge-sale">-${discount}%</span>` : ''}
        ${isNew    ? `<span class="card-badge badge-new">New</span>`            : ''}
        ${p.is_featured ? `<span class="card-badge badge-featured">⭐</span>`  : ''}
        ${p.sold_count > 50 ? `<span class="card-badge badge-hot">Hot</span>`  : ''}
      </div>
      <button class="product-card-wishlist" title="Add to Wishlist" onclick="toggleWishlist(event, ${p.id})">
        <i class="fas fa-heart"></i>
      </button>
      <div class="product-card-img" onclick="goToProduct(${p.id}, '${p.slug || ''}')">
        ${imagePath
          ? `<img src="${imagePath}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=\\'product-card-img-placeholder\\'><i class=\\'fas fa-image\\'></i></div>'">`
          : `<div class="product-card-img-placeholder"><i class="fas fa-image"></i></div>`
        }
      </div>
      <div class="product-card-body">
        <p class="product-card-category">${p.category_name || ''}</p>
        <h3 class="product-card-name" onclick="goToProduct(${p.id}, '${p.slug || ''}')">${escapeHtml(p.name)}</h3>
        <div class="product-card-rating">
          ${Stars.render(parseFloat(p.avg_rating || 0))}
          <span class="rating-count">(${p.review_count || 0})</span>
        </div>
        ${p.stock === 0
          ? `<p class="stock-out"><i class="fas fa-times-circle"></i> Out of stock</p>`
          : p.stock <= 5
          ? `<p class="stock-low"><i class="fas fa-exclamation-circle"></i> Only ${p.stock} left</p>`
          : ''
        }
        <div class="product-card-footer">
          <div class="product-card-price">
            ${p.sale_price
              ? `<span class="price-original">${Format.price(p.price)}</span>
                 <span class="price-sale price-main">${Format.price(p.sale_price)}</span>`
              : `<span class="price-main">${Format.price(p.price)}</span>`
            }
          </div>
          <div class="product-card-actions">
            <button class="btn btn-sm btn-outline btn-icon" title="Quick View"
              onclick="openQuickView(event, ${p.id})">
              <i class="fas fa-eye"></i>
            </button>
            <button class="btn btn-sm btn-primary" onclick="Cart.add(${p.id})"
              ${p.stock === 0 ? 'disabled' : ''} title="Add to Cart">
              <i class="fas fa-shopping-bag"></i>
            </button>
          </div>
        </div>
      </div>
    </div>`;
  },

  renderSkeleton(count = 4) {
    return Array.from({ length: count }, () =>
      `<div class="skeleton skeleton-card"></div>`
    ).join('');
  }
};

/* ── PAGINATION ── */
const Pagination = {
  render(container, pagination, onPage) {
    if (!pagination || pagination.pages <= 1) { container.innerHTML = ''; return; }
    const { page, pages } = pagination;
    let html = '';
    html += `<button class="page-btn" ${page <= 1 ? 'disabled' : ''} onclick="(${onPage})(${page - 1})"><i class="fas fa-chevron-left"></i></button>`;
    for (let i = 1; i <= pages; i++) {
      if (i === 1 || i === pages || (i >= page - 1 && i <= page + 1)) {
        html += `<button class="page-btn ${i === page ? 'active' : ''}" onclick="(${onPage})(${i})">${i}</button>`;
      } else if (i === page - 2 || i === page + 2) {
        html += `<span class="page-btn" style="border:none;background:none;cursor:default">…</span>`;
      }
    }
    html += `<button class="page-btn" ${page >= pages ? 'disabled' : ''} onclick="(${onPage})(${page + 1})"><i class="fas fa-chevron-right"></i></button>`;
    container.innerHTML = html;
  }
};

/* ── HELPERS ── */
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, m => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m]));
}

function goToProduct(id, slug) {
  window.location.href = `/pages/product.html?id=${id}`;
}

async function toggleWishlist(event, productId) {
  event.stopPropagation();
  if (!Auth.requireAuth()) return;
  try {
    const res = await Api.wishlist.check(productId);
    if (res.inWishlist) {
      await Api.wishlist.remove(res.wishlistId);
      Toast.show('Removed from wishlist.', 'info', 'fas fa-heart-broken');
      event.currentTarget.classList.remove('active');
    } else {
      await Api.wishlist.add(productId);
      Toast.show('Added to wishlist!', 'success', 'fas fa-heart');
      event.currentTarget.classList.add('active');
    }
    // Update badge
    const wRes = await Api.wishlist.get();
    const badge = document.getElementById('wishlistBadge');
    if (badge) {
      badge.textContent = wRes.data.length;
      badge.style.display = wRes.data.length > 0 ? 'flex' : 'none';
    }
  } catch (err) {
    Toast.show(err.message || 'Failed.', 'error');
  }
}

async function openQuickView(event, productId) {
  event.stopPropagation();
  const overlay = document.getElementById('quickViewOverlay');
  const content = document.getElementById('quickViewContent');
  if (!overlay || !content) return;

  overlay.classList.add('open');
  content.innerHTML = `<div style="padding:3rem;text-align:center"><div class="spinner spinner-lg"></div></div>`;

  try {
    const res = await Api.products.get(productId);
    const p   = res.data;
    const effectivePrice = p.sale_price || p.price;
    content.innerHTML = `
      <div class="quick-view-content">
        <div class="quick-view-img">
          ${p.image
            ? `<img src="${p.image}" alt="${escapeHtml(p.name)}">`
            : `<div class="product-card-img-placeholder" style="height:100%"><i class="fas fa-image fa-3x"></i></div>`}
        </div>
        <div class="product-info" style="padding:var(--spacing-6) var(--spacing-6) var(--spacing-6) 0">
          <p class="product-info-category">${p.category_name || ''}</p>
          <h2 style="font-size:var(--text-2xl);margin-bottom:var(--spacing-4)">${escapeHtml(p.name)}</h2>
          <div class="product-info-rating">
            ${Stars.render(parseFloat(p.avg_rating || 0))}
            <span class="rating-count">(${p.review_count || 0} reviews)</span>
          </div>
          <div class="product-info-price" style="margin:var(--spacing-4) 0">
            ${p.sale_price
              ? `<span class="price-original">${Format.price(p.price)}</span>
                 <span class="price-sale price-main">${Format.price(p.sale_price)}</span>`
              : `<span class="price-main">${Format.price(p.price)}</span>`}
          </div>
          <p style="color:var(--text-secondary);font-size:var(--text-sm);line-height:1.7;margin-bottom:var(--spacing-6)">${escapeHtml(p.description || '')}</p>
          <div class="product-info-actions">
            <button class="btn btn-primary" onclick="Cart.add(${p.id})" ${p.stock === 0 ? 'disabled' : ''}>
              <i class="fas fa-shopping-bag"></i> ${p.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
            <a href="/pages/product.html?id=${p.id}" class="btn btn-outline">View Details</a>
          </div>
        </div>
      </div>`;
  } catch {
    content.innerHTML = `<p style="padding:2rem;text-align:center;color:var(--color-danger)">Could not load product.</p>`;
  }
}

/* Close quick view */
document.addEventListener('DOMContentLoaded', () => {
  const overlay = document.getElementById('quickViewOverlay');
  const closeBtn = document.getElementById('quickViewClose');
  if (overlay) {
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('open'); });
  }
  if (closeBtn) closeBtn.addEventListener('click', () => overlay?.classList.remove('open'));
});

window.Toast = Toast;
window.Stars = Stars;
window.Format = Format;
window.ProductCard = ProductCard;
window.Pagination = Pagination;
window.escapeHtml = escapeHtml;
window.goToProduct = goToProduct;
window.toggleWishlist = toggleWishlist;
window.openQuickView = openQuickView;

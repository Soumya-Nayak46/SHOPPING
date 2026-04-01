/* ============================================================
   SHOPPING WEB — Clean Frontend Script
============================================================ */

const API_BASE_URL = '/api';
const FREE_SHIPPING = 24;
const SHIPPING_COST = 1.5;

const CURRENCY_RATES = {
  USD: { rate: 1, symbol: '$' },
  INR: { rate: 83.5, symbol: '₹' },
  EUR: { rate: 0.92, symbol: '€' },
  GBP: { rate: 0.79, symbol: '£' },
  AED: { rate: 3.67, symbol: 'د.إ ' },
  JPY: { rate: 149.5, symbol: '¥' },
  CAD: { rate: 1.36, symbol: 'C$' },
  AUD: { rate: 1.53, symbol: 'A$' }
};

const COLOR_MAP = {
  black: '#222',
  white: '#eee',
  blue: '#3b82f6',
  green: '#22c55e',
  brown: '#92400e',
  beige: '#d4b896',
  red: '#ef4444',
  pink: '#ec4899'
};

const CATEGORY_CFG = {
  tops: { emoji: '👔', grad: 'linear-gradient(135deg,#667eea,#764ba2)' },
  bottoms: { emoji: '👖', grad: 'linear-gradient(135deg,#2563eb,#7c3aed)' },
  shoes: { emoji: '👟', grad: 'linear-gradient(135deg,#f97316,#ef4444)' },
  outerwear: { emoji: '🧥', grad: 'linear-gradient(135deg,#059669,#0d9488)' },
  bags: { emoji: '👜', grad: 'linear-gradient(135deg,#e11d48,#be185d)' },
  accessories: { emoji: '💎', grad: 'linear-gradient(135deg,#0ea5e9,#6366f1)' }
};

let allProducts = [];
let filteredProducts = [];
let bundle = [];
let instanceCounter = 0;
let dialogProductId = null;
let currentUser = null;
let currentToken = null;
let currentCurrency = localStorage.getItem('sw-currency') || 'INR';
let dragCounter = 0;
let wishlist = JSON.parse(localStorage.getItem('sw-wishlist') || '[]');

const filters = {
  category: 'all',
  color: 'all',
  season: 'all',
  maxPrice: 36,
  search: ''
};

const $ = (selector) => document.querySelector(selector);

const dom = {
  loginOverlay: $('#login-overlay'),
  panelLogin: $('#panel-login'),
  panelRegister: $('#panel-register'),
  formLogin: $('#form-login'),
  formRegister: $('#form-register'),
  goRegister: $('#go-register'),
  goLogin: $('#go-login'),
  userAvatar: $('#user-avatar'),
  userInitial: $('#user-initial'),
  logoutBtn: $('#logout-btn'),
  mainHeader: $('#main-header'),
  mainFilters: $('#main-filters'),
  mainContent: $('#main-content'),
  currencySelect: $('#currency-select'),
  themeToggle: $('#theme-toggle'),
  themeIcon: $('#theme-icon'),
  search: $('#search'),
  priceRange: $('#price-range'),
  priceVal: $('#price-val'),
  resultsCount: $('#results-count'),
  clearFilters: $('#clear-filters'),
  grid: $('#product-grid'),
  noResults: $('#no-results'),
  template: $('#product-card-template'),
  dropZone: $('#drop-zone'),
  dropPh: $('#drop-ph'),
  bundleList: $('#bundle-list'),
  clearBundle: $('#clear-bundle'),
  shipMsg: $('#ship-msg'),
  shipFill: $('#ship-fill'),
  sCount: $('#s-count'),
  sSub: $('#s-sub'),
  sShip: $('#s-ship'),
  sTotal: $('#s-total'),
  ctaBtn: $('#cta-btn'),
  dialog: $('#qv-dialog'),
  payDialog: $('#pay-dialog'),
  toasts: $('#toast-container'),
  

  ordersBtn: $('#orders-btn'),
  ordersDialog: $('#orders-dialog'),
  ordersClose: $('#orders-close'),
  ordersList: $('#orders-list'),
  ordersLoading: $('#orders-loading'),
  ordersEmpty: $('#orders-empty'),

profileDialog: $('#profile-dialog'),
profileClose: $('#profile-close'),
profileName: $('#profile-name'),
profileEmail: $('#profile-email'),
profilePhone: $('#profile-phone'),
profileCountry: $('#profile-country'),


adminBtn: $('#admin-btn'),
adminDialog: $('#admin-dialog'),
adminClose: $('#admin-close'),
adminProductForm: $('#admin-product-form'),
adminOrdersList: $('#admin-orders-list'),
adminName: $('#admin-name'),
adminPrice: $('#admin-price'),
adminCategory: $('#admin-category'),
adminColor: $('#admin-color'),
adminSeason: $('#admin-season'),
adminImage: $('#admin-image'),
adminDescription: $('#admin-description')
};
const FALLBACK_PRODUCTS = [
  { id: 1, name: 'Silk Blouse', price: 16, category: 'tops', color: 'white', season: 'spring', image: '', description: 'Elegant silk blouse with pearl buttons and a relaxed fit perfect for layering.' },
  { id: 2, name: 'Cashmere Sweater', price: 28, category: 'tops', color: 'beige', season: 'winter', image: '', description: 'Ultra-soft cashmere crew neck sweater for ultimate warmth and luxury.' },
  { id: 3, name: 'Linen Camp Shirt', price: 13, category: 'tops', color: 'blue', season: 'summer', image: '', description: 'Breathable linen camp collar shirt with a relaxed summer silhouette.' },
  { id: 4, name: 'Graphic Tee', price: 12, category: 'tops', color: 'black', season: 'all-season', image: '', description: 'Premium heavyweight cotton tee with abstract geometric print.' }
];

function convertPrice(amountUSD) {
  const cfg = CURRENCY_RATES[currentCurrency] || CURRENCY_RATES.USD;
  const converted = amountUSD * cfg.rate;

  if (currentCurrency === 'INR') {
    return `${cfg.symbol}${Math.round(converted).toLocaleString('en-IN')}`;
  }
  if (currentCurrency === 'JPY') {
    return `${cfg.symbol}${Math.round(converted)}`;
  }
  return `${cfg.symbol}${converted.toFixed(2)}`;
}

function toast(message, type = 'info') {
  if (!dom.toasts) return;
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  dom.toasts.appendChild(el);
  setTimeout(() => {
    el.classList.add('out');
    el.addEventListener('animationend', () => el.remove(), { once: true });
  }, 2500);
}
function saveWishlist() {
  localStorage.setItem('sw-wishlist', JSON.stringify(wishlist));
}

function isInWishlist(productId) {
  return wishlist.includes(Number(productId));
}

function toggleWishlist(productId) {
  const id = Number(productId);
  if (isInWishlist(id)) {
    wishlist = wishlist.filter((item) => Number(item) !== id);
    toast('Removed from wishlist', 'info');
  } else {
    wishlist.push(id);
    toast('Added to wishlist', 'success');
  }
  saveWishlist();
  renderProducts();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function saveSession() {
  if (currentUser) {
    localStorage.setItem('sw-user', JSON.stringify(currentUser));
  } else {
    localStorage.removeItem('sw-user');
  }

  if (currentToken) {
    localStorage.setItem('sw-token', currentToken);
  } else {
    localStorage.removeItem('sw-token');
  }
}


function loadSession() {
  try {
    currentUser = JSON.parse(localStorage.getItem('sw-user') || 'null');
  } catch (_err) {
    currentUser = null;
  }
  currentToken = localStorage.getItem('sw-token') || null;
}

function showApp() {
  if (dom.loginOverlay) dom.loginOverlay.style.display = 'none';
  if (dom.mainHeader) dom.mainHeader.style.display = '';
  if (dom.mainFilters) dom.mainFilters.style.display = '';
  if (dom.mainContent) dom.mainContent.style.display = '';
  updateUserUI();
}

function showLogin() {
  if (dom.loginOverlay) dom.loginOverlay.style.display = '';
  if (dom.mainHeader) dom.mainHeader.style.display = 'none';
  if (dom.mainFilters) dom.mainFilters.style.display = 'none';
  if (dom.mainContent) dom.mainContent.style.display = 'none';
}

function updateUserUI() {
  const name = currentUser?.name || currentUser?.firstName || 'User';

  if (dom.userInitial) {
    dom.userInitial.textContent = name.charAt(0).toUpperCase();
  }

  if (dom.adminBtn) {
    if (currentUser?.role === 'admin') {
      dom.adminBtn.classList.remove('hidden');
    } else {
      dom.adminBtn.classList.add('hidden');
    }
  }
}

async function loginRequest(email, password) {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Login failed');
  return data;
}

async function registerRequest(payload) {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Registration failed');
  return data;
}

function setupAuthForms() {
  dom.goRegister?.addEventListener('click', () => {
    dom.panelLogin.hidden = true;
    dom.panelRegister.hidden = false;
  });

  dom.goLogin?.addEventListener('click', () => {
    dom.panelRegister.hidden = true;
    dom.panelLogin.hidden = false;
  });

  $('#pw-toggle-li')?.addEventListener('click', () => {
    const input = $('#li-pass');
    if (input) input.type = input.type === 'password' ? 'text' : 'password';
  });

  $('#pw-toggle-reg')?.addEventListener('click', () => {
    const input = $('#reg-pass');
    if (input) input.type = input.type === 'password' ? 'text' : 'password';
  });

  dom.formLogin?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = $('#li-email')?.value.trim() || '';
    const password = $('#li-pass')?.value || '';

    try {
      const data = await loginRequest(email, password);
      currentUser = data.user;
      currentToken = data.token;
      saveSession();
      showApp();
      toast('Login successful', 'success');
      dom.formLogin.reset();
    } catch (err) {
      toast(err.message, 'error');
    }
  });

  dom.formRegister?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const payload = {
      firstName: $('#reg-fname')?.value.trim() || '',
      lastName: $('#reg-lname')?.value.trim() || '',
      email: $('#reg-email')?.value.trim() || '',
      phone: $('#reg-phone')?.value.trim() || '',
      country: $('#reg-country')?.value || '',
      password: $('#reg-pass')?.value || ''
    };

    if (!isValidEmail(payload.email)) {
      toast('Please enter a valid email address', 'error');
      return;
    }

    if (payload.password.length < 6) {
      toast('Password must be at least 6 characters', 'error');
      return;
    }

    try {
      await registerRequest(payload);
      toast('Registration successful. Please login.', 'success');
      dom.formRegister.reset();
      dom.panelRegister.hidden = true;
      dom.panelLogin.hidden = false;
      const loginEmail = $('#li-email');
      if (loginEmail) loginEmail.value = payload.email;
    } catch (err) {
      toast(err.message, 'error');
    }
  });

  dom.logoutBtn?.addEventListener('click', () => {
    currentUser = null;
    currentToken = null;
    saveSession();
    showLogin();
    toast('Logged out successfully', 'info');
  });
}

async function loadProducts() {
  try {
    const res = await fetch(`${API_BASE_URL}/products`);
    if (!res.ok) throw new Error('Failed to load products');
    const data = await res.json();
    allProducts = Array.isArray(data) && data.length ? data : FALLBACK_PRODUCTS;
  } catch (_err) {
    allProducts = FALLBACK_PRODUCTS;
    toast('Using fallback products', 'info');
  }
  filteredProducts = [...allProducts];
}

function createCard(product) {
  if (!dom.template) return document.createElement('div');
  const clone = dom.template.content.cloneNode(true);
  const card = clone.querySelector('.product-card');
  card.dataset.id = product.id;

  const img = clone.querySelector('.card-img');
  if (img) {
    img.src = product.image || '';
    img.alt = product.name;
    img.onerror = function onImageError() {
      this.style.display = 'none';
      const cfg = CATEGORY_CFG[product.category] || { emoji: '📦', grad: 'linear-gradient(135deg,#475569,#334155)' };
      const holder = card.querySelector('.card-image');
      if (holder) {
        holder.style.background = cfg.grad;
        holder.insertAdjacentHTML('beforeend', `<span style="font-size:52px;filter:drop-shadow(0 4px 10px rgba(0,0,0,.25))">${cfg.emoji}</span>`);
      }
    };
  }

  const badge = clone.querySelector('.card-badge');
  if (badge) badge.textContent = product.category;

  const name = clone.querySelector('.card-name');
  if (name) name.textContent = product.name;

  const price = clone.querySelector('.card-price');
  if (price) price.textContent = convertPrice(product.price);

  const dotLabel = clone.querySelector('.dot-label');
  if (dotLabel) dotLabel.textContent = product.color;

  const season = clone.querySelector('.tag-season');
  if (season) season.textContent = product.season;

  const dot = clone.querySelector('.tag-color .dot');
  if (dot) {
    dot.style.background = COLOR_MAP[product.color] || '#888';
    if (product.color === 'white') {
      dot.style.border = '1px solid #999';
    }
  }
  const footer = clone.querySelector('.card-footer');
if (footer) {
  const wishBtn = document.createElement('button');
  wishBtn.type = 'button';
  wishBtn.className = 'card-wish';
  wishBtn.title = 'Wishlist';
  wishBtn.textContent = isInWishlist(product.id) ? '♥' : '♡';
  footer.prepend(wishBtn);
}

  return clone;
}

function renderProducts() {
  if (!dom.grid) return;
  dom.grid.innerHTML = '';

  if (!filteredProducts.length) {
    if (dom.noResults) dom.noResults.hidden = false;
    if (dom.resultsCount) dom.resultsCount.textContent = '0 products';
    return;
  }

  if (dom.noResults) dom.noResults.hidden = true;
  const frag = document.createDocumentFragment();
  filteredProducts.forEach((product) => frag.appendChild(createCard(product)));
  dom.grid.appendChild(frag);
  if (dom.resultsCount) {
    dom.resultsCount.textContent = `${filteredProducts.length} product${filteredProducts.length === 1 ? '' : 's'}`;
  }
}

function addToBundle(productId) {
  const product = allProducts.find((item) => Number(item.id) === Number(productId));
  if (!product) return;
  instanceCounter += 1;
  bundle.push({
    instanceId: instanceCounter,
    product,
    qty: 1
  });
  renderBundle();
  toast(`${product.name} added to your look`, 'success');
}

function removeFromBundle(instanceId) {
  const index = bundle.findIndex((item) => Number(item.instanceId) === Number(instanceId));
  if (index === -1) return;
  const name = bundle[index].product.name;
  bundle.splice(index, 1);
  renderBundle();
  toast(`${name} removed`, 'info');
}

function increaseQty(instanceId) {
  const item = bundle.find((i) => Number(i.instanceId) === Number(instanceId));
  if (!item) return;
  item.qty += 1;
  renderBundle();
}

function decreaseQty(instanceId) {
  const item = bundle.find((i) => Number(i.instanceId) === Number(instanceId));
  if (!item) return;

  if (item.qty > 1) {
    item.qty -= 1;
  } else {
    const index = bundle.findIndex((i) => Number(i.instanceId) === Number(instanceId));
    if (index !== -1) bundle.splice(index, 1);
  }

  renderBundle();
}

function clearBundle() {
  bundle = [];
  renderBundle();
}

function renderBundle() {
  if (!dom.bundleList) return;
  dom.bundleList.innerHTML = '';

  if (dom.dropPh) dom.dropPh.hidden = bundle.length > 0;
  if (dom.clearBundle) dom.clearBundle.hidden = bundle.length === 0;

  bundle.forEach((item) => {
    const row = document.createElement('div');
    row.className = 'bundle-item';
    row.dataset.iid = item.instanceId;
    row.innerHTML = `
  <div class="bi-img">
    <img src="${item.product.image || ''}" alt="${item.product.name}">
  </div>
  <div class="bi-info">
    <div class="bi-name">${item.product.name}</div>
    <div class="bi-price">${convertPrice(item.product.price)}</div>
    <div class="qty-controls">
      <button class="qty-btn qty-minus" type="button">−</button>
      <span class="qty-value">${item.qty}</span>
      <button class="qty-btn qty-plus" type="button">+</button>
    </div>
  </div>
  <button class="bi-remove" type="button" title="Remove">✕</button>
`;

    const img = row.querySelector('img');
    img.onerror = function bundleImageFallback() {
      this.style.display = 'none';
      const holder = row.querySelector('.bi-img');
      const cfg = CATEGORY_CFG[item.product.category] || { emoji: '📦', grad: 'linear-gradient(135deg,#475569,#334155)' };
      holder.style.background = cfg.grad;
      holder.innerHTML = `<span style="font-size:18px">${cfg.emoji}</span>`;
    };

    dom.bundleList.appendChild(row);
  });

  updateSummary();
}

function updateSummary() {
  const count = bundle.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = bundle.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const freeShipping = subtotal >= FREE_SHIPPING;
  const shipping = count === 0 ? 0 : freeShipping ? 0 : SHIPPING_COST;
  const total = subtotal + shipping;
  const progress = Math.min(100, subtotal / FREE_SHIPPING * 100);

  if (dom.sCount) dom.sCount.textContent = String(count);
  if (dom.sSub) dom.sSub.textContent = convertPrice(subtotal);
  if (dom.sShip) dom.sShip.textContent = count === 0 ? '—' : freeShipping ? 'FREE ✓' : convertPrice(shipping);
  if (dom.sTotal) dom.sTotal.textContent = convertPrice(total);
  if (dom.shipFill) dom.shipFill.style.width = `${progress}%`;

  if (dom.shipMsg) {
    if (count === 0) {
      dom.shipMsg.textContent = 'Add items to start building!';
      dom.shipMsg.className = 'ship-msg';
    } else if (freeShipping) {
      dom.shipMsg.textContent = '🎉 You qualified for FREE shipping!';
      dom.shipMsg.className = 'ship-msg ok';
    } else {
      dom.shipMsg.textContent = `Add ${convertPrice(FREE_SHIPPING - subtotal)} more for free shipping`;
      dom.shipMsg.className = 'ship-msg';
    }
  }

  if (dom.ctaBtn) {
    dom.ctaBtn.disabled = count === 0;
    dom.ctaBtn.textContent = count === 0 ? 'Build Your Look First' : `Checkout — ${convertPrice(total)}`;
  }
}

function applyFilters() {
  filteredProducts = allProducts.filter((product) => {
    if (filters.category !== 'all' && product.category !== filters.category) return false;
    if (filters.color !== 'all' && product.color !== filters.color) return false;
    if (filters.season !== 'all' && product.season !== filters.season) return false;
    if (Number(product.price) > Number(filters.maxPrice)) return false;
    if (filters.search) {
      const query = filters.search.toLowerCase();
      const text = `${product.name} ${product.category} ${product.color} ${product.description}`.toLowerCase();
      if (!text.includes(query)) return false;
    }
    return true;
  });

  renderProducts();
  updateURL();
}

function setFilterPill(groupId, value) {
  const group = document.getElementById(groupId);
  if (!group) return;
  group.querySelectorAll('.pill').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.v === value);
  });
}

function setupFilters() {
  $('#f-category')?.addEventListener('click', (e) => {
    const pill = e.target.closest('.pill');
    if (!pill) return;
    filters.category = pill.dataset.v;
    setFilterPill('f-category', filters.category);
    applyFilters();
  });

  $('#f-color')?.addEventListener('click', (e) => {
    const pill = e.target.closest('.pill');
    if (!pill) return;
    filters.color = pill.dataset.v;
    setFilterPill('f-color', filters.color);
    applyFilters();
  });

  $('#f-season')?.addEventListener('click', (e) => {
    const pill = e.target.closest('.pill');
    if (!pill) return;
    filters.season = pill.dataset.v;
    setFilterPill('f-season', filters.season);
    applyFilters();
  });

  dom.priceRange?.addEventListener('input', (e) => {
    filters.maxPrice = Number(e.target.value);
    if (dom.priceVal) dom.priceVal.textContent = convertPrice(filters.maxPrice);
    applyFilters();
  });

  dom.search?.addEventListener('input', (e) => {
    filters.search = e.target.value.trim();
    applyFilters();
  });

  dom.clearFilters?.addEventListener('click', () => {
    filters.category = 'all';
    filters.color = 'all';
    filters.season = 'all';
    filters.maxPrice = 3006;
    filters.search = '';
    setFilterPill('f-category', 'all');
    setFilterPill('f-color', 'all');
    setFilterPill('f-season', 'all');
    if (dom.priceRange) dom.priceRange.value = '36';
    if (dom.priceVal) dom.priceVal.textContent = convertPrice(36);
    if (dom.search) dom.search.value = '';
    applyFilters();
    toast('Filters cleared', 'info');
  });
}

function updateURL() {
  const params = new URLSearchParams();
  if (filters.category !== 'all') params.set('category', filters.category);
  if (filters.color !== 'all') params.set('color', filters.color);
  if (filters.season !== 'all') params.set('season', filters.season);
  if (filters.maxPrice < 3006) params.set('maxPrice', String(filters.maxPrice));
  if (filters.search) params.set('q', filters.search);
  const query = params.toString();
  window.history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}`);
}

function readURL() {
  const params = new URLSearchParams(window.location.search);
  if (params.has('category')) filters.category = params.get('category');
  if (params.has('color')) filters.color = params.get('color');
  if (params.has('season')) filters.season = params.get('season');
  if (params.has('maxPrice')) filters.maxPrice = Number(params.get('maxPrice')) || 3006;
  if (params.has('q')) filters.search = params.get('q') || '';

  if (dom.priceRange) dom.priceRange.value = String(filters.maxPrice);
  if (dom.priceVal) dom.priceVal.textContent = convertPrice(filters.maxPrice);
  if (dom.search) dom.search.value = filters.search;
  setFilterPill('f-category', filters.category);
  setFilterPill('f-color', filters.color);
  setFilterPill('f-season', filters.season);
}

function setupDialog() {
  $('#qv-close')?.addEventListener('click', () => dom.dialog?.close());
  dom.dialog?.addEventListener('click', (e) => {
    if (e.target === dom.dialog) dom.dialog.close();
  });

  $('#qv-add')?.addEventListener('click', () => {
    if (dialogProductId !== null) {
      addToBundle(dialogProductId);
      dom.dialog?.close();
    }
  });
}

function openDialog(productId) {
  const product = allProducts.find((item) => Number(item.id) === Number(productId));
  if (!product || !dom.dialog) return;
  dialogProductId = product.id;

  const img = dom.dialog.querySelector('.qv-img');
  if (img) {
    img.src = product.image || '';
    img.alt = product.name;
    img.onerror = function dialogImageFallback() {
      this.style.display = 'none';
      const holder = dom.dialog.querySelector('.qv-image');
      const cfg = CATEGORY_CFG[product.category] || { grad: 'linear-gradient(135deg,#475569,#334155)' };
      holder.style.background = cfg.grad;
    };
  }

  const badge = dom.dialog.querySelector('.qv-badge');
  if (badge) badge.textContent = product.category;
  const name = dom.dialog.querySelector('.qv-name');
  if (name) name.textContent = product.name;
  const desc = dom.dialog.querySelector('.qv-desc');
  if (desc) desc.textContent = product.description || 'No description available.';
  const price = dom.dialog.querySelector('.qv-price');
  if (price) price.textContent = convertPrice(product.price);
  const season = dom.dialog.querySelector('.qv-season');
  if (season) season.textContent = product.season;

  const dot = dom.dialog.querySelector('.qv-color .dot');
  const label = dom.dialog.querySelector('.qv-color span:last-child');
  if (dot) {
    dot.style.background = COLOR_MAP[product.color] || '#888';
    if (product.color === 'white') dot.style.border = '1px solid #999';
  }
  if (label) label.textContent = product.color;

  dom.dialog.showModal();
}

function setupGridActions() {

dom.grid?.addEventListener('click', (e) => {
  const card = e.target.closest('.product-card');
  if (!card) return;
  const id = Number(card.dataset.id);

  if (e.target.closest('.card-wish')) {
    toggleWishlist(id);
    return;
  }

  if (e.target.closest('.qv-btn')) {
    openDialog(id);
    return;
  }

  if (e.target.closest('.card-add')) {
    addToBundle(id);
  }
});

  dom.bundleList?.addEventListener('click', (e) => {
    const btn = e.target.closest('.bi-remove');
    if (!btn) return;
    const row = btn.closest('.bundle-item');
    if (!row) return;
    removeFromBundle(Number(row.dataset.iid));
  });

  dom.clearBundle?.addEventListener('click', () => {
    clearBundle();
    toast('Bundle cleared', 'info');
  });
}

function setupDragAndDrop() {
  dom.grid?.addEventListener('dragstart', (e) => {
    const card = e.target.closest('.product-card');
    if (!card) return;
    e.dataTransfer.setData('text/plain', card.dataset.id);
    e.dataTransfer.effectAllowed = 'copy';
    requestAnimationFrame(() => card.classList.add('dragging'));
  });

  dom.grid?.addEventListener('dragend', (e) => {
    const card = e.target.closest('.product-card');
    if (card) card.classList.remove('dragging');
  });

  dom.dropZone?.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  });

  dom.dropZone?.addEventListener('dragenter', (e) => {
    e.preventDefault();
    dragCounter += 1;
    dom.dropZone.classList.add('drag-over');
  });

  dom.dropZone?.addEventListener('dragleave', () => {
    dragCounter -= 1;
    if (dragCounter <= 0) {
      dragCounter = 0;
      dom.dropZone.classList.remove('drag-over');
    }
  });

  dom.dropZone?.addEventListener('drop', (e) => {
    e.preventDefault();
    dragCounter = 0;
    dom.dropZone.classList.remove('drag-over');
    const id = Number(e.dataTransfer.getData('text/plain'));
    if (id) addToBundle(id);
  });
}

function setupCurrency() {
  if (dom.currencySelect) {
    dom.currencySelect.value = currentCurrency;
    dom.currencySelect.addEventListener('change', (e) => {
      currentCurrency = e.target.value;
      localStorage.setItem('sw-currency', currentCurrency);
      if (dom.priceVal) dom.priceVal.textContent = convertPrice(filters.maxPrice);
      renderProducts();
      renderBundle();
      toast(`Currency changed to ${currentCurrency}`, 'info');
    });
  }
}

function updateThemeIcon(theme) {
  if (dom.themeIcon) {
    dom.themeIcon.textContent = theme === 'dark' ? '☽' : '☀';
  }
}

function setupTheme() {
  const savedTheme = localStorage.getItem('sw-theme') || 'dark';
  document.documentElement.dataset.theme = savedTheme;
  updateThemeIcon(savedTheme);
  dom.themeToggle?.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('sw-theme', next);
    updateThemeIcon(next);
  });
}

function getOrderTotals() {
  const subtotal = bundle.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const shipping = subtotal >= FREE_SHIPPING ? 0 : SHIPPING_COST;
  const total = subtotal + shipping;
  return { subtotal, shipping, total };
}

function closePaymentPanels() {
  $('#panel-upi')?.classList.add('hidden');
  $('#panel-cod')?.classList.add('hidden');
  $('#btn-upi')?.classList.remove('active');
  $('#btn-cod')?.classList.remove('active');
}

function setupPaymentDialog() {
  const paySummary = $('#pay-summary-line');
  const panelUpi = $('#panel-upi');
  const panelCod = $('#panel-cod');
  const btnUpi = $('#btn-upi');
  const btnCod = $('#btn-cod');
  const qrCodeContainer = $('#qr-code-container');
  const upiAmount = $('#upi-amount');
  const upiCheckbox = $('#upi-payment-done');
  const upiConfirmBtn = $('#upi-confirm-btn');
  const upiStatus = $('#upi-payment-status');
  const codForm = $('#cod-form');

  if (upiStatus) upiStatus.classList.add('hidden');
  closePaymentPanels();

  dom.ctaBtn?.addEventListener('click', () => {
    if (!bundle.length) {
      toast('Add items before checkout', 'error');
      return;
    }
    const { subtotal, shipping, total } = getOrderTotals();
    if (paySummary) {
      paySummary.textContent = `Items: ${bundle.length} • Subtotal: ${convertPrice(subtotal)} • Shipping: ${shipping === 0 ? 'FREE' : convertPrice(shipping)} • Total: ${convertPrice(total)}`;
    }
    closePaymentPanels();
    if (upiCheckbox) upiCheckbox.checked = false;
    if (upiConfirmBtn) upiConfirmBtn.disabled = true;
    if (upiStatus) upiStatus.classList.add('hidden');
    if (qrCodeContainer) qrCodeContainer.innerHTML = '';
    dom.payDialog?.showModal();
  });

  btnUpi?.addEventListener('click', () => {
    panelUpi?.classList.remove('hidden');
    panelCod?.classList.add('hidden');
    btnUpi.classList.add('active');
    btnCod?.classList.remove('active');

    const { total } = getOrderTotals();
    const amountInInr = total * CURRENCY_RATES.INR.rate;
    if (upiAmount) upiAmount.textContent = `₹${Math.round(amountInInr).toLocaleString('en-IN')}`;

   if (qrCodeContainer) {
  qrCodeContainer.innerHTML = '';
  const orderRef = `ORD-${Date.now()}`;

  // ✅ UPDATED UPI LINK
  const upiUrl = `upi://pay?pa=6370926354@ibl&pn=SAS%20SHOPPING&tr=${orderRef}&tn=Shopping%20Purchase&am=${amountInInr.toFixed(2)}&cu=INR`;

  if (window.QRCode) {
    new QRCode(qrCodeContainer, {
      text: upiUrl,
      width: 220,
      height: 220,
      colorDark: '#000000',
      colorLight: '#ffffff'
    });
  } else {
    qrCodeContainer.innerHTML = '<p>QR library not loaded</p>';
  }
}
  });

  btnCod?.addEventListener('click', () => {
    panelCod?.classList.remove('hidden');
    panelUpi?.classList.add('hidden');
    btnCod.classList.add('active');
    btnUpi?.classList.remove('active');
  });

  upiCheckbox?.addEventListener('change', () => {
    if (upiConfirmBtn) upiConfirmBtn.disabled = !upiCheckbox.checked;
  });

  upiConfirmBtn?.addEventListener('click', async () => {
    if (!upiCheckbox?.checked) {
      toast('Complete the payment and tick the checkbox', 'error');
      return;
    }

    const { total } = getOrderTotals();
const payload = {
  items: bundle.map((item) => ({
    productId: item.product.id,
    productName: item.product.name,
    quantity: item.qty
  })),
  total,
  paymentMethod: 'upi',
  shippingAddress: null
};


    try {
      if (upiStatus) upiStatus.classList.remove('hidden');
      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {})
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to place order');
      dom.payDialog?.close();
      clearBundle();
      toast('UPI order placed successfully', 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      if (upiStatus) upiStatus.classList.add('hidden');
    }
  });

  codForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const shippingAddress = {
      flat: $('#cod-flat')?.value.trim() || '',
      building: $('#cod-building')?.value.trim() || '',
      area: $('#cod-area')?.value.trim() || '',
      city: $('#cod-city')?.value.trim() || '',
      pin: $('#cod-pin')?.value.trim() || '',
      state: $('#cod-state')?.value || ''
    };

    if (!/^\d{6}$/.test(shippingAddress.pin)) {
      toast('Please enter a valid 6-digit PIN code', 'error');
      return;
    }

    const { total } = getOrderTotals();


const payload = {
  items: bundle.map((item) => ({
    productId: item.product.id,
    productName: item.product.name,
    quantity: item.qty
  })),
  total,
  paymentMethod: 'cod',
  shippingAddress
};

    try {
      const res = await fetch(`${API_BASE_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {})
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to place order');
      dom.payDialog?.close();
      codForm.reset();
      clearBundle();
      toast('COD order placed successfully', 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  });

  $('#pay-close')?.addEventListener('click', () => dom.payDialog?.close());
  dom.payDialog?.addEventListener('click', (e) => {
    if (e.target === dom.payDialog) dom.payDialog.close();
  });
}
function formatOrderDate(value) {
  if (!value) return 'N/A';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString('en-IN');
}

function renderOrders(orders) {
  if (!dom.ordersList) return;

  dom.ordersList.innerHTML = '';

  if (!Array.isArray(orders) || orders.length === 0) {
    dom.ordersEmpty?.classList.remove('hidden');
    return;
  }

  dom.ordersEmpty?.classList.add('hidden');

  const trackingSteps = ['Placed', 'Confirmed', 'Shipped', 'Delivered'];

  orders.forEach((order, index) => {
    const card = document.createElement('div');
    card.className = 'order-card';

    const currentStepIndex = trackingSteps.indexOf(order.status || 'Placed');

    const trackingHtml = trackingSteps.map((step, stepIndex) => {
      const isActive = stepIndex <= currentStepIndex;
      return `
        <div class="track-step ${isActive ? 'active' : ''}">
          <div class="track-dot">${stepIndex + 1}</div>
          <div class="track-label">${step}</div>
        </div>
      `;
    }).join('');

    const itemsHtml = Array.isArray(order.items)
      ? order.items.map((item) => `
          <div class="order-item-row">
            <span>${item.productName || item.name || `Product ID: ${item.productId || 'N/A'}`}</span>
            <span>Qty: ${item.quantity ?? 1}</span>
          </div>
        `).join('')
      : '<div class="order-item-row"><span>No items</span></div>';

    card.innerHTML = `
      <div class="order-top">
        <div>
          <div class="order-id">Order #${order.id || order._id || index + 1}</div>
          <div class="order-date">${formatOrderDate(order.createdAt || order.date)}</div>
        </div>
        <div class="order-total">${convertPrice(Number(order.total || 0))}</div>
      </div>

      <div class="order-meta">
        <span>Payment: ${(order.paymentMethod || 'N/A').toUpperCase()}</span>
        <span>Status: ${order.status || 'Placed'}</span>
      </div>

      <div class="order-tracking">
        ${trackingHtml}
      </div>

      <div class="order-items">
        ${itemsHtml}
      </div>
    `;

    dom.ordersList.appendChild(card);
  });
}

async function fetchMyOrders() {
  const res = await fetch(`${API_BASE_URL}/orders/my`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {})
    }
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to load orders');
  return Array.isArray(data) ? data : (data.orders || []);
}

function setupOrdersDialog() {
  dom.ordersBtn?.addEventListener('click', async () => {
    if (!currentToken) {
      toast('Please login first', 'error');
      return;
    }

    if (dom.ordersList) dom.ordersList.innerHTML = '';
    dom.ordersEmpty?.classList.add('hidden');
    dom.ordersLoading?.classList.remove('hidden');

    dom.ordersDialog?.showModal();

    try {
      const orders = await fetchMyOrders();
      renderOrders(orders);
    } catch (err) {
      toast(err.message, 'error');
      dom.ordersEmpty?.classList.remove('hidden');
    } finally {
      dom.ordersLoading?.classList.add('hidden');
    }
  });

  dom.ordersClose?.addEventListener('click', () => {
    dom.ordersDialog?.close();
  });

  dom.ordersDialog?.addEventListener('click', (e) => {
    if (e.target === dom.ordersDialog) dom.ordersDialog.close();
  });
}
function setupProfileDialog() {
  dom.userAvatar?.addEventListener('click', () => {
    if (!currentUser) return;

    const fullName =
      currentUser.name ||
      `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() ||
      'User';

    if (dom.profileName) dom.profileName.textContent = fullName;
    if (dom.profileEmail) dom.profileEmail.textContent = currentUser.email || 'N/A';
    if (dom.profilePhone) dom.profilePhone.textContent = currentUser.phone || 'N/A';
    if (dom.profileCountry) dom.profileCountry.textContent = currentUser.country || 'N/A';

    dom.profileDialog?.showModal();
  });

  dom.profileClose?.addEventListener('click', () => {
    dom.profileDialog?.close();
  });

  dom.profileDialog?.addEventListener('click', (e) => {
    if (e.target === dom.profileDialog) dom.profileDialog.close();
  });
}

async function fetchAllOrdersAdmin() {
  const res = await fetch(`${API_BASE_URL}/orders`, {
    headers: {
      'Content-Type': 'application/json',
      ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {})
    }
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to fetch all orders');
  return data;
}

async function addProductAdmin(payload) {
  const res = await fetch(`${API_BASE_URL}/products`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {})
    },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to add product');
  return data;
}

async function updateOrderStatus(orderId, status) {
  const res = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(currentToken ? { Authorization: `Bearer ${currentToken}` } : {})
    },
    body: JSON.stringify({ status })
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Failed to update status');
  return data;
}

function renderAdminOrders(orders) {
  if (!dom.adminOrdersList) return;

  dom.adminOrdersList.innerHTML = '';

  orders.forEach((order) => {
    const card = document.createElement('div');
    card.className = 'order-card';

    const itemsHtml = Array.isArray(order.items)
      ? order.items.map((item) => `
          <div class="order-item-row">
            <span>${item.productName || `Product ID: ${item.productId}`}</span>
            <span>Qty: ${item.quantity ?? 1}</span>
          </div>
        `).join('')
      : '';

    card.innerHTML = `
      <div class="order-top">
        <div>
          <div class="order-id">Order #${order.id}</div>
          <div class="order-date">${formatOrderDate(order.createdAt)}</div>
          <div class="order-date">${order.email || 'No email'}</div>
        </div>
        <div class="order-total">${convertPrice(Number(order.total || 0))}</div>
      </div>

      <div class="order-meta">
        <span>Payment: ${(order.paymentMethod || 'N/A').toUpperCase()}</span>
        <span>Status: ${order.status || 'Placed'}</span>
      </div>

      <div class="order-items">${itemsHtml}</div>

      <div class="order-actions">
        <button class="status-btn" data-id="${order.id}" data-status="Confirmed">Confirm</button>
        <button class="status-btn" data-id="${order.id}" data-status="Shipped">Ship</button>
        <button class="status-btn" data-id="${order.id}" data-status="Delivered">Deliver</button>
        <button class="status-btn" data-id="${order.id}" data-status="Cancelled">Cancel</button>
      </div>
    `;

    dom.adminOrdersList.appendChild(card);
  });

  dom.adminOrdersList.querySelectorAll('.status-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      try {
        await updateOrderStatus(btn.dataset.id, btn.dataset.status);
        const orders = await fetchAllOrdersAdmin();
        renderAdminOrders(orders);
        toast('Order status updated', 'success');
      } catch (err) {
        toast(err.message, 'error');
      }
    });
  });
}

function setupAdminDialog() {
  dom.adminBtn?.addEventListener('click', async () => {
    if (currentUser?.role !== 'admin') {
      toast('Admin access only', 'error');
      return;
    }

    dom.adminDialog?.showModal();

    try {
      const orders = await fetchAllOrdersAdmin();
      renderAdminOrders(orders);
    } catch (err) {
      toast(err.message, 'error');
    }
  });

  dom.adminClose?.addEventListener('click', () => {
    dom.adminDialog?.close();
  });

  dom.adminDialog?.addEventListener('click', (e) => {
    if (e.target === dom.adminDialog) dom.adminDialog.close();
  });

  dom.adminProductForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const payload = {
      name: dom.adminName?.value.trim(),
      price: Number(dom.adminPrice?.value),
      category: dom.adminCategory?.value,
      color: dom.adminColor?.value.trim(),
      season: dom.adminSeason?.value.trim(),
      image: dom.adminImage?.value.trim(),
      description: dom.adminDescription?.value.trim()
    };

    try {
      await addProductAdmin(payload);
      toast('Product added successfully', 'success');
      dom.adminProductForm.reset();
      await loadProducts();
      applyFilters();
    } catch (err) {
      toast(err.message, 'error');
    }
  });
}

async function init() {
  loadSession();
  setupAuthForms();
  setupTheme();
  setupCurrency();
  setupFilters();
  setupDialog();
  setupGridActions();
  setupDragAndDrop();
  setupPaymentDialog();
  setupOrdersDialog();
  setupProfileDialog();
  setupAdminDialog();

  await loadProducts();
  readURL();
  applyFilters();
  renderBundle();

  if (currentUser) {
    showApp();
  } else {
    showLogin();
  }
}

window.addEventListener('error', (event) => {
  console.error('JavaScript error:', event.error || event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

document.addEventListener('DOMContentLoaded', () => {
  init().catch((err) => {
    console.error('Initialization error:', err);
    toast('Application failed to initialize', 'error');
  });
})
;

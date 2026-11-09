/**
 * Casekaaran — Product Catalog, Brand & Model Discovery Engine
 */
const ProductCatalog = (function () {
  let state = {
    brands: [],
    models: [],
    products: [],
    selectedBrand: null,
    selectedModel: null,
    selectedCaseType: null,
    sortBy: 'newest',
    searchQuery: ''
  };

  /**
   * Fetch active brands from backend API or local verified registry
   */
  async function loadBrands() {
    // Pre-seed immediately with PHONE_MODELS_DATA registry
    if (window.PHONE_MODELS_DATA && window.PHONE_MODELS_DATA.brands) {
      state.brands = [
        ...window.PHONE_MODELS_DATA.brands,
        { id: 'apple', name: 'Apple', slug: 'apple', icon: 'bi-apple' },
        { id: 'oneplus', name: 'OnePlus', slug: 'oneplus', icon: 'bi-phone' },
        { id: 'google-pixel', name: 'Google Pixel', slug: 'google-pixel', icon: 'bi-google' },
        { id: 'xiaomi', name: 'Xiaomi', slug: 'xiaomi', icon: 'bi-phone' },
        { id: 'motorola', name: 'Motorola', slug: 'motorola', icon: 'bi-phone' }
      ];
      renderBrandCards();
      populateBrandDropdowns();
    }

    try {
      const res = await API.get('/brands');
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        const existingSlugs = new Set(res.data.map(b => b.slug));
        const merged = [...res.data];
        if (window.PHONE_MODELS_DATA && window.PHONE_MODELS_DATA.brands) {
          window.PHONE_MODELS_DATA.brands.forEach(b => {
            if (!existingSlugs.has(b.slug)) {
              merged.push(b);
            }
          });
        }
        state.brands = merged;
        renderBrandCards();
        populateBrandDropdowns();
      }
    } catch (err) {
      console.warn('Using verified local brand registry:', err);
    }
  }

  /**
   * Fetch models for a given brand
   */
  async function loadModels(brandSlug) {
    if (!brandSlug) return;

    // Immediate zero-latency local registry resolution
    if (window.PHONE_MODELS_DATA && window.PHONE_MODELS_DATA.models && window.PHONE_MODELS_DATA.models[brandSlug]) {
      state.models = window.PHONE_MODELS_DATA.models[brandSlug];
      populateModelDropdowns();
      renderPopularModels();
    }

    try {
      const res = await API.get(`/brands/${brandSlug}/models`);
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        state.models = res.data;
        populateModelDropdowns();
        renderPopularModels();
      }
    } catch (err) {
      console.warn('Using verified local phone model registry for brand:', brandSlug);
    }
  }

  /**
   * Helper to resolve phone model ID from slug
   */
  function getModelIdFromSlug(slug) {
    if (!slug) return null;
    const clean = String(slug).toLowerCase().trim();
    const registry = window.PHONE_MODELS_DATA;
    if (!registry || !registry.models) return null;
    for (const b in registry.models) {
      const found = registry.models[b].find(m => m.slug.toLowerCase() === clean);
      if (found) return found.id;
    }
    return null;
  }

  /**
   * Helper to resolve phone model name from ID
   */
  function getModelNameFromId(id) {
    if (!id) return null;
    const numId = Number(id);
    const registry = window.PHONE_MODELS_DATA;
    if (!registry || !registry.models) return null;
    for (const b in registry.models) {
      const found = registry.models[b].find(m => Number(m.id) === numId);
      if (found) return found.name;
    }
    return null;
  }

  /**
   * Get verified local product catalog matching active filters
   */
  function getLocalCatalogProducts(filters = {}) {
    const registry = window.PHONE_MODELS_DATA;
    let list = (registry && registry.allProducts) ? [...registry.allProducts] : [];

    // Filter by model ID or slug
    if (filters.phone_model_id || filters.model) {
      const targetSlug = filters.model ? String(filters.model).toLowerCase().trim() : '';
      const targetId = filters.phone_model_id ? Number(filters.phone_model_id) : (targetSlug ? getModelIdFromSlug(targetSlug) : null);

      list = list.filter(p => {
        if (targetId && p.phone_model_id && Number(p.phone_model_id) === targetId) return true;
        if (targetSlug && p.phone_model_slug && p.phone_model_slug.toLowerCase() === targetSlug) return true;
        if (targetSlug && p.phone_model_name && p.phone_model_name.toLowerCase().includes(targetSlug)) return true;
        if (targetSlug && p.compatible_models && Array.isArray(p.compatible_models) && p.compatible_models.some(m => m.toLowerCase().includes(targetSlug))) return true;
        // Universal 3D cases (Scuderia & Black Panther) match all phone models
        if (p.id === 5 || p.id === 6) return true;
        return false;
      });
    }

    // Filter by brand
    if (filters.brand) {
      const b = filters.brand.toLowerCase().trim();
      list = list.filter(p => !p.brand_slug || p.brand_slug.toLowerCase() === b || p.id === 5 || p.id === 6);
    }

    // Filter by case type
    if (filters.case_type) {
      const ct = filters.case_type.toLowerCase().trim();
      list = list.filter(p => (p.case_type_slug && p.case_type_slug.toLowerCase() === ct) || (p.case_type && p.case_type.toLowerCase().includes(ct)));
    }

    // Filter by search query
    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(p => p.name.toLowerCase().includes(q) || (p.material && p.material.toLowerCase().includes(q)) || (p.phone_model_name && p.phone_model_name.toLowerCase().includes(q)));
    }

    // Sort order
    if (filters.sort === 'price_asc') {
      list.sort((a, b) => a.base_price - b.base_price);
    } else if (filters.sort === 'price_desc') {
      list.sort((a, b) => b.base_price - a.base_price);
    }

    return list;
  }

  /**
   * Fetch products with multi-attribute filtering & sorting
   */
  async function loadProducts(filters = {}) {
    // 1. Immediately render verified products with zero latency
    const local = getLocalCatalogProducts(filters);
    state.products = local;
    renderProductGrid();

    // 2. Fetch live updates from backend API
    try {
      let query = new URLSearchParams();
      if (filters.brand) query.append('brand', filters.brand);
      if (filters.model) query.append('model', filters.model);
      if (filters.phone_model_id) query.append('phone_model_id', filters.phone_model_id);
      if (filters.case_type) query.append('case_type', filters.case_type);
      if (filters.sort) query.append('sort', filters.sort);
      if (filters.search) query.append('search', filters.search);

      const res = await API.get(`/products?${query.toString()}`);
      if (res && res.success && Array.isArray(res.data)) {
        if (res.data.length > 0) {
          // Merge API data with local demo products so demo products are always visible
          const apiIds = new Set(res.data.map(p => p.id));
          const apiSlugs = new Set(res.data.map(p => p.slug));
          const localOnly = local.filter(p => !apiIds.has(p.id) && !apiSlugs.has(p.slug));
          state.products = [...res.data, ...localOnly];
        } else if (local.length > 0) {
          state.products = local;
        } else {
          state.products = [];
        }
        renderProductGrid();
      }
    } catch (err) {
      console.warn('API sync fallback, displaying verified local catalog:', err);
      state.products = local;
      renderProductGrid();
    }
  }

  /**
   * Render Brand selection grid on Homepage & Catalog
   */
  function renderBrandCards() {
    const container = document.getElementById('brands-grid');
    if (!container) return;

    if (!state.brands.length) {
      container.innerHTML = `<div class="col-12 text-center text-muted py-4">${I18n.t('common.loading')}</div>`;
      return;
    }

    container.innerHTML = state.brands.map(brand => `
      <div class="col">
        <div class="brand-card ${state.selectedBrand === brand.slug ? 'active' : ''}" 
             onclick="ProductCatalog.selectBrand('${brand.slug}')">
          <div class="brand-icon-wrap">
            <i class="bi ${brand.icon || 'bi-phone'}"></i>
          </div>
          <span class="brand-name">${brand.name}</span>
        </div>
      </div>
    `).join('');
  }

  /**
   * Render Popular Phone Models Pills
   */
  function renderPopularModels() {
    const container = document.getElementById('popular-models-container');
    if (!container) return;

    const popular = state.models.length ? state.models : [
      { id: 101, name: 'iPhone 16 Pro Max', slug: 'iphone-16-pro-max', brand_slug: 'apple' },
      { id: 102, name: 'iPhone 15 Pro', slug: 'iphone-15-pro', brand_slug: 'apple' },
      { id: 103, name: 'iPhone 15', slug: 'iphone-15', brand_slug: 'apple' },
      { id: 201, name: 'Galaxy S24 Ultra', slug: 'galaxy-s24-ultra', brand_slug: 'samsung' },
      { id: 202, name: 'Galaxy A55', slug: 'galaxy-a55', brand_slug: 'samsung' },
      { id: 301, name: 'OnePlus 12', slug: 'oneplus-12', brand_slug: 'oneplus' },
      { id: 401, name: 'Pixel 9 Pro', slug: 'pixel-9-pro', brand_slug: 'google-pixel' }
    ];

    container.innerHTML = popular.map(model => `
      <div class="col-6 col-md-4 col-lg-3">
        <a href="products.html?model=${model.slug}" class="model-pill">
          <span>${model.name}</span>
          <span class="model-case-count"><i class="bi bi-arrow-right"></i></span>
        </a>
      </div>
    `).join('');
  }

  /**
   * Populate quick phone finder dropdowns
   */
  function populateBrandDropdowns() {
    const select = document.getElementById('finder-brand-select');
    if (!select) return;

    select.innerHTML = `<option value="">${I18n.t('finder.chooseBrand')}</option>` +
      state.brands.map(b => `<option value="${b.slug}">${b.name}</option>`).join('');

    select.onchange = (e) => {
      const slug = e.target.value;
      if (slug) {
        loadModels(slug);
        if (window.Trending3DExperience && ['samsung', 'redmi', 'nothing'].includes(slug)) {
          Trending3DExperience.selectBrand(slug);
        }
      }
    };
  }

  function populateModelDropdowns() {
    const select = document.getElementById('finder-model-select');
    if (!select) return;

    select.disabled = false;
    select.innerHTML = `<option value="">${I18n.t('finder.chooseModel')}</option>` +
      state.models.map(m => `<option value="${m.slug}" data-id="${m.id}">${m.name}</option>`).join('');

    select.onchange = (e) => {
      const selectedOption = e.target.selectedOptions[0];
      const modelId = selectedOption ? Number(selectedOption.dataset.id) : null;
      if (window.Trending3DExperience && modelId) {
        Trending3DExperience.selectModel(modelId);
      }
    };
  }

  /**
   * Render Product Grid
   */
  function renderProductGrid() {
    const container = document.getElementById('product-grid-container');
    if (!container) return;

    if (!state.products.length) {
      container.innerHTML = `
        <div class="col-12 text-center py-5" style="grid-column: 1 / -1;">
          <div style="font-size: 2.5rem; color: var(--color-text-muted); margin-bottom: 12px;"><i class="bi bi-box-seam"></i></div>
          <h5 class="fw-bold" style="font-family: var(--font-display);">No compatible cases found</h5>
          <p class="text-muted" style="font-size: 0.875rem;">Try choosing another phone model or resetting your filters.</p>
          <button class="btn-ck btn-ck-secondary btn-ck-sm mt-2" onclick="window.location.href='products.html'">Reset Filters</button>
        </div>
      `;
      return;
    }

    container.innerHTML = state.products.map((p) => {
      const discountPct = p.original_price > p.base_price 
        ? Math.round(((p.original_price - p.base_price) / p.original_price) * 100) 
        : 0;

      const compatibleLabel = p.phone_model_name 
        ? `Compatible: ${p.phone_model_name}` 
        : (Array.isArray(p.compatible_models) && p.compatible_models.length 
            ? `Compatible: ${p.compatible_models[0]}` 
            : (p.case_type || 'Custom Fit'));

      return `
        <div class="col">
          <div class="product-card h-100 d-flex flex-column is-visible">
            <div class="product-image-wrap">
              <div class="badge-stack">
                ${discountPct > 0 ? `<span class="discount-badge">-${discountPct}%</span>` : ''}
                <span class="stock-tag in-stock"><i class="bi bi-check2"></i> ${I18n.t('product.inStock')} (${p.stock_quantity || 25})</span>
              </div>
              <a href="product-details.html?slug=${p.slug}">
                <img src="${p.image_url}" alt="${p.name}" loading="lazy" />
              </a>
            </div>
            <div class="product-content d-flex flex-column flex-grow-1">
              <span class="product-model-label" style="font-size: 0.75rem; color: var(--color-soft-gold);">
                <i class="bi bi-shield-check me-1"></i>${compatibleLabel}
              </span>
              <a href="product-details.html?slug=${p.slug}" class="product-title" title="${p.name}">${p.name}</a>
              <div class="product-price-row mb-2">
                <span class="current-price">${CONFIG.CURRENCY_SYMBOL}${p.base_price}</span>
                ${p.original_price > p.base_price ? `<span class="original-price">${CONFIG.CURRENCY_SYMBOL}${p.original_price}</span>` : ''}
                ${discountPct > 0 ? `<span class="save-percent">${discountPct}% off</span>` : ''}
              </div>
              
              <div class="mt-auto d-grid gap-2 pt-2">
                <a href="product-details.html?slug=${p.slug}" class="btn-ck btn-ck-secondary btn-ck-sm text-center">
                  <span>${I18n.t('product.viewDetails')}</span> <i class="bi bi-arrow-right"></i>
                </a>
                <div class="row g-2">
                  <div class="col-6">
                    <button class="btn-ck btn-ck-outline btn-ck-sm w-100" onclick="ProductCatalog.addToCart(${p.id})">
                      <i class="bi bi-bag-plus"></i> Add
                    </button>
                  </div>
                  <div class="col-6">
                    <button class="btn-ck btn-ck-primary btn-ck-sm w-100" onclick="ProductCatalog.buyNow(${p.id})">
                      <i class="bi bi-lightning-fill"></i> Buy Now
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Trigger scroll reveal observer for newly inserted products
    if (typeof initScrollAnimations === 'function') {
      initScrollAnimations();
    }
  }

  function addToCart(productId) {
    const p = state.products.find(x => x.id === productId);
    if (!p) return false;

    const mId = p.phone_model_id || (state.selectedModel ? getModelIdFromSlug(state.selectedModel) : 120);
    const mName = p.phone_model_name || getModelNameFromId(mId) || 'Selected Smartphone';

    if (typeof Cart !== 'undefined' && Cart.addItem) {
      Cart.addItem({
        product_id: p.id,
        variant_id: p.variant_id || p.id,
        product_name: p.name,
        phone_model_id: mId,
        phone_model_name: mName,
        colour_name: 'Midnight Black',
        price: Number(p.base_price),
        original_price: Number(p.original_price || p.base_price),
        image_url: p.image_url,
        quantity: 1
      });
      return true;
    }
    return false;
  }

  function buyNow(productId) {
    const success = addToCart(productId);
    if (success !== false) {
      window.location.href = 'checkout.html';
    }
  }

  function getModelIdFromSlug(slug) {
    const registry = window.PHONE_MODELS_DATA;
    if (!registry || !registry.models) return 120;
    for (const b in registry.models) {
      const found = registry.models[b].find(m => m.slug === slug || String(m.id) === String(slug));
      if (found) return found.id;
    }
    return 120;
  }

  function selectBrand(brandSlug) {
    state.selectedBrand = brandSlug;
    renderBrandCards();
    window.location.href = `products.html?brand=${brandSlug}`;
  }

  // Handle URL query parameters on catalog page
  function initCatalogPage() {
    const params = new URLSearchParams(window.location.search);
    const brand = params.get('brand');
    const model = params.get('model');
    const phone_model_id = params.get('phone_model_id');
    const search = params.get('search');
    const sort = params.get('sort');

    if (brand) state.selectedBrand = brand;
    if (model) state.selectedModel = model;
    if (search) state.searchQuery = search;
    if (sort) state.sortBy = sort;

    loadBrands();
    if (brand) loadModels(brand);
    loadProducts({ brand, model, phone_model_id, search, sort });

    // Listen to language change to re-render texts
    window.addEventListener('languageChanged', () => {
      renderBrandCards();
      renderPopularModels();
      renderProductGrid();
    });
  }

  return {
    init: initCatalogPage,
    loadBrands,
    loadModels,
    loadProducts,
    selectBrand,
    addToCart,
    buyNow
  };
})();

window.ProductCatalog = ProductCatalog;

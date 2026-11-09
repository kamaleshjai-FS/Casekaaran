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
   * Fetch active brands from backend API
   */
  async function loadBrands() {
    try {
      const res = await API.get('/brands');
      if (res && res.success && Array.isArray(res.data)) {
        state.brands = res.data;
        renderBrandCards();
        populateBrandDropdowns();
      }
    } catch (err) {
      console.error('Failed to load brands:', err);
    }
  }

  /**
   * Fetch models for a given brand
   */
  async function loadModels(brandSlug) {
    if (!brandSlug) return;
    try {
      const res = await API.get(`/brands/${brandSlug}/models`);
      if (res && res.success && Array.isArray(res.data)) {
        state.models = res.data;
        populateModelDropdowns();
        renderPopularModels();
      }
    } catch (err) {
      console.error('Failed to load models for brand:', brandSlug, err);
    }
  }

  /**
   * Fetch products with multi-attribute filtering & sorting
   */
  async function loadProducts(filters = {}) {
    try {
      let query = new URLSearchParams();
      if (filters.brand) query.append('brand', filters.brand);
      if (filters.model) query.append('model', filters.model);
      if (filters.case_type) query.append('case_type', filters.case_type);
      if (filters.sort) query.append('sort', filters.sort);
      if (filters.search) query.append('search', filters.search);

      const res = await API.get(`/products?${query.toString()}`);
      if (res && res.success && Array.isArray(res.data)) {
        state.products = res.data;
        renderProductGrid();
      }
    } catch (err) {
      console.error('Failed to load products:', err);
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

    select.addEventListener('change', (e) => {
      const slug = e.target.value;
      if (slug) {
        loadModels(slug);
      }
    });
  }

  function populateModelDropdowns() {
    const select = document.getElementById('finder-model-select');
    if (!select) return;

    select.disabled = false;
    select.innerHTML = `<option value="">${I18n.t('finder.chooseModel')}</option>` +
      state.models.map(m => `<option value="${m.slug}">${m.name}</option>`).join('');
  }

  /**
   * Render Product Grid
   */
  function renderProductGrid() {
    const container = document.getElementById('product-grid-container');
    if (!container) return;

    if (!state.products.length) {
      container.innerHTML = `
        <div class="col-12 empty-state">
          <div class="empty-state-icon"><i class="bi bi-box-seam"></i></div>
          <h5>No compatible cases found</h5>
          <p class="text-muted">Try choosing another phone model or resetting your filters.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = state.products.map(p => {
      const discountPct = p.original_price > p.base_price 
        ? Math.round(((p.original_price - p.base_price) / p.original_price) * 100) 
        : 0;
      
      const compatibleLabel = p.compatible_models && p.compatible_models.length 
        ? p.compatible_models[0] 
        : 'All Supported Models';

      return `
        <div class="col">
          <div class="product-card">
            <div class="product-image-wrap">
              ${discountPct > 0 ? `<span class="discount-badge">${discountPct}% OFF</span>` : ''}
              <span class="stock-tag in-stock"><i class="bi bi-check2"></i> ${I18n.t('product.inStock')}</span>
              <a href="product-details.html?slug=${p.slug}">
                <img src="${p.image_url}" alt="${p.name}" loading="lazy" />
              </a>
            </div>
            <div class="product-content">
              <span class="product-model-label">${p.case_type || 'Protective Case'}</span>
              <a href="product-details.html?slug=${p.slug}" class="product-title" title="${p.name}">${p.name}</a>
              <div class="product-price-row">
                <span class="current-price">${CONFIG.CURRENCY_SYMBOL}${p.base_price}</span>
                ${p.original_price > p.base_price ? `<span class="original-price">${CONFIG.CURRENCY_SYMBOL}${p.original_price}</span>` : ''}
                ${discountPct > 0 ? `<span class="save-percent">${discountPct}% off</span>` : ''}
              </div>
              <a href="product-details.html?slug=${p.slug}" class="btn-ck btn-ck-secondary btn-ck-sm btn-block">
                <i class="bi bi-eye"></i> ${I18n.t('product.viewDetails')}
              </a>
            </div>
          </div>
        </div>
      `;
    }).join('');
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
    const search = params.get('search');

    if (brand) state.selectedBrand = brand;
    if (model) state.selectedModel = model;
    if (search) state.searchQuery = search;

    loadBrands();
    if (brand) loadModels(brand);
    loadProducts({ brand, model, search });

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
    selectBrand
  };
})();

window.ProductCatalog = ProductCatalog;

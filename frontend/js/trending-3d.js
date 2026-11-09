/**
 * Casekaaran — NEW TRENDING 3D Cases & Phone Model Selection Engine
 * Complete customer journey:
 * 1. Brand selection (Samsung, Redmi, Nothing)
 * 2. Instant model search & filter (supporting all aliases like M12, POCO M6, S24 Ultra, CMF)
 * 3. Selected phone presentation & camera arrangement spotlight
 * 4. Compatible in-stock 3D cases catalogue (stock > 0 only)
 * 5. Direct Add to Cart with inventory verification
 */
const Trending3DExperience = (function () {
  let activeBrand = 'samsung';
  let activeModel = null;
  let searchQuery = '';

  function getRegistry() {
    return window.PHONE_MODELS_DATA || null;
  }

  function init() {
    const registry = getRegistry();
    if (!registry) {
      console.warn('PHONE_MODELS_DATA registry not found.');
      return;
    }

    // Default to Samsung Galaxy S24 Ultra (id 120) or first Samsung model
    const samsungModels = registry.models.samsung || [];
    activeModel = samsungModels.find(m => m.slug === 'samsung-s24-ultra') || samsungModels[0];

    renderBrandCards();
    renderModelGrid();
    renderSpotlight();
    renderCases();
    setupEventListeners();
    syncWithTopFinder();
  }

  /**
   * Render the 3 Brand Selection Cards
   */
  function renderBrandCards() {
    const container = document.getElementById('trending3d-brands');
    if (!container) return;

    const registry = getRegistry();
    if (!registry || !registry.brands) return;

    container.innerHTML = registry.brands.map(brand => {
      const isActive = brand.slug === activeBrand;
      return `
        <div class="brand-select-card ${isActive ? 'active' : ''}" 
             data-brand="${brand.slug}" 
             onclick="Trending3DExperience.selectBrand('${brand.slug}')">
          <div class="brand-card-top">
            <div class="brand-icon-box">
              <i class="bi ${brand.icon}"></i>
            </div>
            <span class="brand-models-badge">${brand.modelsCount} Models</span>
          </div>
          <h4 class="brand-title">${brand.name}</h4>
          <p class="brand-tagline">${brand.tagline}</p>
          <div class="brand-check-pill"><i class="bi bi-check-lg"></i></div>
        </div>
      `;
    }).join('');
  }

  /**
   * Filter and render phone models for the active brand
   */
  function renderModelGrid() {
    const container = document.getElementById('trending3d-models-grid');
    const countBadge = document.getElementById('trending3d-models-count');
    if (!container) return;

    const registry = getRegistry();
    if (!registry || !registry.models || !registry.models[activeBrand]) {
      container.innerHTML = `<div class="text-white-50 p-3">No models available for this brand.</div>`;
      return;
    }

    const allModels = registry.models[activeBrand];
    const query = searchQuery.trim().toLowerCase();

    // Filter by name and all aliases
    const filtered = allModels.filter(m => {
      if (!query) return true;
      if (m.name.toLowerCase().includes(query)) return true;
      if (m.slug.toLowerCase().includes(query)) return true;
      if (Array.isArray(m.aliases)) {
        return m.aliases.some(alias => alias.toLowerCase().includes(query));
      }
      return false;
    });

    if (countBadge) {
      countBadge.textContent = `${filtered.length} of ${allModels.length} models`;
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="col-12 text-center py-4 text-white-50">
          <i class="bi bi-search mb-2 d-block" style="font-size: 1.5rem; color: var(--color-soft-gold);"></i>
          <p class="mb-1">No phone models matching "<strong>${escapeHtml(searchQuery)}</strong>"</p>
          <button class="btn btn-sm btn-outline-light rounded-pill mt-2" onclick="Trending3DExperience.clearSearch()">Clear Search</button>
        </div>
      `;
      return;
    }

    container.innerHTML = filtered.map(model => {
      const isSelected = activeModel && activeModel.id === model.id;
      return `
        <div class="model-tile ${isSelected ? 'selected' : ''}" 
             data-id="${model.id}" 
             onclick="Trending3DExperience.selectModel(${model.id})">
          <div class="model-tile-info">
            <span class="model-tile-name" title="${model.name}">${model.name}</span>
            <span class="model-tile-camera"><i class="bi bi-camera me-1"></i>${model.camera}</span>
          </div>
          <div class="model-tile-icon">
            <i class="bi bi-check"></i>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Render Selected Phone Device Spotlight & Camera Arrangement
   */
  function renderSpotlight() {
    const container = document.getElementById('trending3d-spotlight');
    if (!container || !activeModel) return;

    const brandName = activeBrand.charAt(0).toUpperCase() + activeBrand.slice(1);

    container.innerHTML = `
      <div class="row align-items-center g-4">
        <div class="col-md-4 text-center">
          <div class="spotlight-device-img-frame">
            <img src="${activeModel.image}" alt="${activeModel.name}" loading="lazy" />
          </div>
        </div>
        <div class="col-md-8">
          <span class="spotlight-meta-badge">
            <i class="bi bi-shield-check"></i> Verified Compatibility
          </span>
          <h3 class="spotlight-model-title">${brandName} ${activeModel.name}</h3>
          
          <div class="spotlight-camera-callout">
            <i class="bi bi-camera-fill"></i>
            <div>
              <strong>Camera Module:</strong> ${activeModel.camera}
            </div>
          </div>
          
          <p class="spotlight-fit-guarantee mb-3">
            <i class="bi bi-check-circle-fill"></i>
            <span>100% Guaranteed Precision Fit — Exact laser cutouts for camera lenses, flash, mic ports & buttons.</span>
          </p>

          <div class="d-flex align-items-center gap-3 flex-wrap">
            <span class="badge" style="background: rgba(16, 185, 129, 0.2); color: #34D399; border: 1px solid rgba(16, 185, 129, 0.4); padding: 6px 12px; font-size: 0.75rem;">
              <span class="pulse-dot-green me-1 d-inline-block"></span> In Stock & Ready to Ship
            </span>
            <span class="text-white-50" style="font-size: 0.8125rem;">
              Showing compatible <strong>3D cases</strong> below
            </span>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render Compatible 3D Cases in Stock (strictly stock_quantity > 0)
   */
  function renderCases() {
    const container = document.getElementById('trending3d-cases-grid');
    if (!container) return;

    const registry = getRegistry();
    if (!registry || !registry.cases3D) return;

    // Strict in-stock filtering
    const inStockCases = registry.cases3D.filter(c => c.in_stock && c.stock_quantity > 0);

    if (inStockCases.length === 0) {
      container.innerHTML = `
        <div class="col-12 text-center py-5 text-white-50">
          <p>Currently all 3D cases for this model are reserved. Check back shortly!</p>
        </div>
      `;
      return;
    }

    container.innerHTML = inStockCases.map(item => {
      const discountPct = Math.round(((item.original_price - item.base_price) / item.original_price) * 100);
      const modelDisplayName = activeModel ? activeModel.name : 'Selected Phone';

      return `
        <div class="col-lg-6">
          <div class="trending-3d-card h-100">
            <div class="trending-3d-img-container">
              <div class="trending-3d-badge-bar">
                <span class="badge-3d-series">⚡ NEW TRENDING 3D</span>
                <span class="badge-3d-stock">
                  <span class="pulse-dot-green"></span> In Stock (${item.stock_quantity})
                </span>
              </div>
              <img id="img-case-${item.id}" src="${item.primary_image}" alt="${item.name}" loading="lazy" />
              <button class="trending-3d-ref-trigger" onclick="Trending3DExperience.openReferenceModal(${item.id})">
                <i class="bi bi-eye"></i> View Reference Detail
              </button>
            </div>

            <div class="trending-3d-content">
              <h4 class="trending-3d-title">${item.name}</h4>
              <p class="trending-3d-material"><i class="bi bi-layers me-1 text-gold"></i> ${item.material}</p>
              
              <div class="trending-3d-features-list">
                ${(item.features || []).map(f => `<span class="feature-pill-dark">${f}</span>`).join('')}
              </div>

              <div class="trending-3d-price-row">
                <span class="price-current-3d">₹${item.base_price}</span>
                <span class="price-orig-3d">₹${item.original_price}</span>
                <span class="price-discount-3d">-${discountPct}% OFF</span>
              </div>

              <div class="mt-auto">
                <button class="btn-add-3d-cart" onclick="Trending3DExperience.addToCart(${item.id})">
                  <i class="bi bi-bag-plus-fill"></i>
                  <span>Add for ${modelDisplayName}</span>
                </button>
                <div class="text-center mt-2">
                  <span class="text-white-50" style="font-size: 0.75rem;">
                    <i class="bi bi-shield-check text-success"></i> 100% Camera & Button Fit Guaranteed
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Select a Smartphone Brand
   */
  function selectBrand(brandSlug) {
    if (activeBrand === brandSlug) return;
    activeBrand = brandSlug;
    searchQuery = '';
    const searchInput = document.getElementById('trending3d-search-input');
    if (searchInput) searchInput.value = '';

    const registry = getRegistry();
    if (registry && registry.models && registry.models[brandSlug]) {
      const models = registry.models[brandSlug];
      // pick first model or retain similar if exists
      activeModel = models[0];
    }

    renderBrandCards();
    renderModelGrid();
    renderSpotlight();
    renderCases();
    syncWithTopFinder();
  }

  /**
   * Select a Phone Model
   */
  function selectModel(modelId) {
    const registry = getRegistry();
    if (!registry || !registry.models || !registry.models[activeBrand]) return;

    const found = registry.models[activeBrand].find(m => m.id === modelId);
    if (!found) return;

    activeModel = found;
    renderModelGrid();
    renderSpotlight();
    renderCases();
    syncWithTopFinder();
  }

  /**
   * Add 3D Case to Cart with selected model
   */
  function addToCart(caseId) {
    const registry = getRegistry();
    if (!registry || !activeModel) {
      if (typeof API !== 'undefined' && API.toast) {
        API.toast('Select Model', 'Please select your exact phone model first', 'error');
      }
      return;
    }

    const item = registry.cases3D.find(c => c.id === caseId);
    if (!item) return;

    // Strict in-stock validation
    if (!item.in_stock || item.stock_quantity <= 0) {
      if (typeof API !== 'undefined' && API.toast) {
        API.toast('Out of Stock', 'This case is currently out of stock for the selected phone', 'error');
      }
      return;
    }

    if (typeof Cart !== 'undefined' && Cart.addItem) {
      Cart.addItem({
        product_id: item.id,
        variant_id: item.id,
        product_name: item.name,
        phone_model_id: activeModel.id,
        phone_model_name: activeModel.name,
        colour_name: '3D Ferrari Scuderia / Tactile Honeycomb',
        price: item.base_price,
        original_price: item.original_price,
        image_url: item.primary_image,
        quantity: 1
      });
    } else {
      console.log('Added to cart:', item.name, 'for', activeModel.name);
    }
  }

  /**
   * Setup Event Listeners for Search & Input
   */
  function setupEventListeners() {
    const searchInput = document.getElementById('trending3d-search-input');
    const clearBtn = document.getElementById('trending3d-search-clear');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        if (clearBtn) {
          clearBtn.style.display = searchQuery ? 'block' : 'none';
        }
        renderModelGrid();
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        clearSearch();
      });
    }
  }

  function clearSearch() {
    searchQuery = '';
    const searchInput = document.getElementById('trending3d-search-input');
    const clearBtn = document.getElementById('trending3d-search-clear');
    if (searchInput) {
      searchInput.value = '';
      searchInput.focus();
    }
    if (clearBtn) clearBtn.style.display = 'none';
    renderModelGrid();
  }

  /**
   * Synchronize active selection with the top quick phone finder dropdowns
   */
  function syncWithTopFinder() {
    const brandSelect = document.getElementById('finder-brand-select');
    const modelSelect = document.getElementById('finder-model-select');

    if (brandSelect && activeBrand) {
      // Ensure the option exists
      if (!Array.from(brandSelect.options).some(o => o.value === activeBrand)) {
        const opt = document.createElement('option');
        opt.value = activeBrand;
        opt.textContent = activeBrand.charAt(0).toUpperCase() + activeBrand.slice(1);
        brandSelect.appendChild(opt);
      }
      brandSelect.value = activeBrand;
    }

    if (modelSelect && activeBrand) {
      const registry = getRegistry();
      const models = registry && registry.models && registry.models[activeBrand] ? registry.models[activeBrand] : [];
      
      modelSelect.disabled = false;
      modelSelect.innerHTML = `<option value="">-- Choose Phone Model --</option>` +
        models.map(m => `<option value="${m.slug}" data-id="${m.id}">${m.name}</option>`).join('');

      if (activeModel) {
        modelSelect.value = activeModel.slug;
      }
    }
  }

  /**
   * Modal to inspect authentic reference photo and details
   */
  function openReferenceModal(caseId) {
    const registry = getRegistry();
    const item = registry && registry.cases3D ? registry.cases3D.find(c => c.id === caseId) : null;
    const realImg = item ? item.real_photo : 'assets/icons/reference-3d-case.jpeg';
    const caseName = item ? item.name : '3D Tactile Case';

    let modal = document.getElementById('reference-photo-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'reference-photo-modal';
      modal.className = 'modal fade';
      modal.tabIndex = -1;
      modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered modal-lg">
          <div class="modal-content" style="background: #101B2D; color: #FFF; border: 1px solid var(--color-soft-gold); border-radius: 20px;">
            <div class="modal-header border-bottom border-secondary">
              <h5 class="modal-title font-display text-white" id="ref-modal-title">Authentic 3D Case Reference</h5>
              <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body p-4 text-center">
              <div class="mb-3 rounded-4 overflow-hidden" style="max-height: 520px; background: #000; border: 1px solid rgba(208, 166, 107, 0.4);">
                <img id="ref-modal-img" src="${realImg}" alt="Reference 3D Case" style="width: 100%; height: auto; object-fit: contain;" />
              </div>
              <div class="text-start">
                <span class="badge" style="background: var(--color-soft-gold); color: #101B2D; font-weight: bold;">AUTHENTIC ATELIER PRODUCTION</span>
                <p class="mt-2 mb-1" style="font-size: 0.875rem; color: #D2D9E8;">
                  Features physical 3D embossed shield relief, Italian tricolor racing stripe, tactile hexagonal honeycomb backplate, and laser-calibrated camera bezels for <strong id="ref-modal-model" class="text-gold"></strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
    }

    const modalTitle = document.getElementById('ref-modal-title');
    const modalImg = document.getElementById('ref-modal-img');
    const modalModel = document.getElementById('ref-modal-model');

    if (modalTitle) modalTitle.textContent = `${caseName} — Authentic Production`;
    if (modalImg) modalImg.src = realImg;
    if (modalModel && activeModel) modalModel.textContent = activeModel.name;

    if (window.bootstrap && window.bootstrap.Modal) {
      const bsModal = new bootstrap.Modal(modal);
      bsModal.show();
    } else {
      alert(`Viewing ${caseName} for ${activeModel ? activeModel.name : ''}`);
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }

  return {
    init,
    selectBrand,
    selectModel,
    addToCart,
    clearSearch,
    openReferenceModal,
    getActiveModel: () => activeModel,
    getActiveBrand: () => activeBrand
  };
})();

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  Trending3DExperience.init();
});

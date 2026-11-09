/**
 * Casekaaran — Product Details View & Compatibility Engine
 */
document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get('slug') || 'aeroshield-magsafe-matte-case';

  let currentProduct = null;
  let selectedModelId = null;
  let selectedModelName = null;
  let selectedQty = 1;

  try {
    const res = await API.get(`/products/${slug}`);
    if (res && res.success && res.data) {
      currentProduct = res.data;
      renderDetails(currentProduct);
    } else {
      // Use fallback
      currentProduct = {
        id: 1,
        name: 'AeroShield MagSafe Matte Case',
        slug: 'aeroshield-magsafe-matte-case',
        base_price: 699,
        original_price: 999,
        material: 'High-Impact Polycarbonate & German TPU Edge Bumper',
        description: 'Engineered specifically for extreme drop protection with an integrated N52 Neodymium MagSafe magnetic ring. Tested up to 12ft military-grade drops with raised 1.2mm camera bezels to prevent scratches.',
        case_type: 'MagSafe Matte',
        images: [
          'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1601593346740-925612772716?w=800&auto=format&fit=crop&q=80',
          'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800&auto=format&fit=crop&q=80'
        ],
        compatible_models: [
          { id: 101, name: 'iPhone 16 Pro Max' },
          { id: 102, name: 'iPhone 16 Pro' },
          { id: 103, name: 'iPhone 15 Pro' },
          { id: 201, name: 'Galaxy S24 Ultra' }
        ],
        stock: 24
      };
      renderDetails(currentProduct);
    }
  } catch (err) {
    console.error('Error fetching product details:', err);
  }

  function renderDetails(p) {
    document.title = `${p.name} — Casekaaran`;

    const titleEl = document.getElementById('pd-title');
    const priceEl = document.getElementById('pd-price');
    const origPriceEl = document.getElementById('pd-original-price');
    const discountEl = document.getElementById('pd-discount');
    const descEl = document.getElementById('pd-description');
    const materialEl = document.getElementById('pd-material');
    const mainImgEl = document.getElementById('pd-main-image');
    const thumbsContainer = document.getElementById('pd-thumbnails');
    const modelSelect = document.getElementById('pd-model-select');
    const compatBox = document.getElementById('pd-compat-box');

    if (titleEl) titleEl.textContent = p.name;
    if (priceEl) priceEl.textContent = `${CONFIG.CURRENCY_SYMBOL}${p.base_price}`;
    if (origPriceEl) {
      if (p.original_price > p.base_price) {
        origPriceEl.textContent = `${CONFIG.CURRENCY_SYMBOL}${p.original_price}`;
        const pct = Math.round(((p.original_price - p.base_price) / p.original_price) * 100);
        if (discountEl) discountEl.textContent = `${pct}% OFF`;
      } else {
        origPriceEl.style.display = 'none';
        if (discountEl) discountEl.style.display = 'none';
      }
    }
    if (descEl) descEl.textContent = p.description;
    if (materialEl) materialEl.textContent = p.material;

    // Gallery Images
    const imgs = p.images && p.images.length ? p.images : [p.image_url || 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800'];
    if (mainImgEl) mainImgEl.src = imgs[0];

    if (thumbsContainer) {
      thumbsContainer.innerHTML = imgs.map((imgUrl, idx) => `
        <img src="${imgUrl}" 
             class="img-thumbnail ${idx === 0 ? 'border-primary' : ''}" 
             style="width: 72px; height: 72px; object-fit: cover; cursor: pointer; border-radius: 8px;"
             onclick="changeMainImage('${imgUrl}', this)" />
      `).join('');
    }

    // Populate Phone Models
    if (modelSelect) {
      modelSelect.innerHTML = `<option value="">-- ${I18n.t('product.filterModel')} --</option>` +
        (p.compatible_models || []).map(m => `
          <option value="${m.id}" data-name="${m.name}">${m.name}</option>
        `).join('');

      modelSelect.addEventListener('change', (e) => {
        selectedModelId = e.target.value;
        const selectedOpt = e.target.options[e.target.selectedIndex];
        selectedModelName = selectedOpt ? selectedOpt.getAttribute('data-name') : null;

        if (compatBox) {
          if (selectedModelName) {
            compatBox.style.display = 'flex';
            compatBox.innerHTML = `
              <i class="bi bi-shield-check" style="font-size: 1.25rem;"></i>
              <div>
                <strong>100% Fit Confirmed:</strong> Calibrated laser cutouts for ${selectedModelName}. Lens protection and responsive click buttons guaranteed.
              </div>
            `;
          } else {
            compatBox.style.display = 'none';
          }
        }
      });

      // Auto-select first model if available
      if (p.compatible_models && p.compatible_models.length > 0) {
        modelSelect.value = p.compatible_models[0].id;
        modelSelect.dispatchEvent(new Event('change'));
      }
    }
  }

  // Quantity adjustments
  const qtyMinus = document.getElementById('qty-minus');
  const qtyPlus = document.getElementById('qty-plus');
  const qtyInput = document.getElementById('qty-input');

  if (qtyMinus && qtyPlus && qtyInput) {
    qtyMinus.addEventListener('click', () => {
      let val = parseInt(qtyInput.value) || 1;
      if (val > 1) {
        val -= 1;
        qtyInput.value = val;
        selectedQty = val;
      }
    });

    qtyPlus.addEventListener('click', () => {
      let val = parseInt(qtyInput.value) || 1;
      if (val < 10) {
        val += 1;
        qtyInput.value = val;
        selectedQty = val;
      }
    });

    qtyInput.addEventListener('change', () => {
      let val = parseInt(qtyInput.value) || 1;
      if (val < 1) val = 1;
      if (val > 10) val = 10;
      qtyInput.value = val;
      selectedQty = val;
    });
  }

  // Add To Cart & Buy Now Buttons
  const addBtn = document.getElementById('btn-add-to-cart');
  const buyBtn = document.getElementById('btn-buy-now');

  if (addBtn) {
    addBtn.addEventListener('click', () => {
      if (!currentProduct) return;
      if (!selectedModelId) {
        API.toast('Select Phone Model', 'Please choose your exact smartphone model above', 'error');
        return;
      }

      Cart.addItem({
        product_id: currentProduct.id,
        product_name: currentProduct.name,
        phone_model_id: Number(selectedModelId),
        phone_model_name: selectedModelName,
        price: currentProduct.base_price,
        original_price: currentProduct.original_price,
        image_url: currentProduct.images ? currentProduct.images[0] : currentProduct.image_url,
        quantity: selectedQty
      });
    });
  }

  if (buyBtn) {
    buyBtn.addEventListener('click', () => {
      if (!currentProduct) return;
      if (!selectedModelId) {
        API.toast('Select Phone Model', 'Please choose your exact smartphone model above', 'error');
        return;
      }

      const added = Cart.addItem({
        product_id: currentProduct.id,
        product_name: currentProduct.name,
        phone_model_id: Number(selectedModelId),
        phone_model_name: selectedModelName,
        price: currentProduct.base_price,
        original_price: currentProduct.original_price,
        image_url: currentProduct.images ? currentProduct.images[0] : currentProduct.image_url,
        quantity: selectedQty
      });

      if (added) {
        window.location.href = 'checkout.html';
      }
    });
  }
});

function changeMainImage(url, thumbEl) {
  const mainImg = document.getElementById('pd-main-image');
  if (mainImg) mainImg.src = url;

  document.querySelectorAll('#pd-thumbnails img').forEach(img => {
    img.classList.remove('border-primary');
  });
  if (thumbEl) thumbEl.classList.add('border-primary');
}

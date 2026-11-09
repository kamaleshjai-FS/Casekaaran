/**
 * Casekaaran — Shopping Cart Engine
 */
const Cart = (function () {
  let items = [];

  function init() {
    try {
      const stored = localStorage.getItem(CONFIG.STORAGE_KEYS.CART);
      items = stored ? JSON.parse(stored) : [];
    } catch (e) {
      items = [];
    }
    updateBadge();
  }

  function persist() {
    localStorage.setItem(CONFIG.STORAGE_KEYS.CART, JSON.stringify(items));
    updateBadge();
    window.dispatchEvent(new CustomEvent('cartUpdated', { detail: { items, count: getCount() } }));
  }

  function updateBadge() {
    const badges = document.querySelectorAll('.cart-badge');
    const count = getCount();
    badges.forEach(badge => {
      badge.textContent = count;
      badge.style.display = count > 0 ? 'flex' : 'none';
    });
  }

  function getCount() {
    return items.reduce((acc, item) => acc + (item.quantity || 1), 0);
  }

  function getItems() {
    return [...items];
  }

  /**
   * Add product variant & exact phone model to cart
   */
  function addItem(item) {
    if (!item.phone_model_id || !item.phone_model_name) {
      API.toast(I18n.t('product.filterModel'), 'Please select your exact phone model before adding to cart', 'error');
      return false;
    }

    const existingIndex = items.findIndex(i => 
      i.product_id === item.product_id && 
      i.phone_model_id === item.phone_model_id &&
      (i.variant_id === item.variant_id || !item.variant_id)
    );

    if (existingIndex > -1) {
      items[existingIndex].quantity += (item.quantity || 1);
    } else {
      items.push({
        product_id: item.product_id,
        variant_id: item.variant_id || item.product_id,
        product_name: item.product_name,
        phone_model_id: item.phone_model_id,
        phone_model_name: item.phone_model_name,
        colour_name: item.colour_name || 'Standard',
        price: Number(item.price),
        original_price: Number(item.original_price || item.price),
        image_url: item.image_url,
        quantity: Number(item.quantity || 1)
      });
    }

    persist();
    API.toast(item.product_name, `${item.phone_model_name} case added to cart`, 'success');
    return true;
  }

  function removeItem(productId, modelId, variantId) {
    items = items.filter(i => !(i.product_id === productId && i.phone_model_id === modelId && (!variantId || i.variant_id === variantId)));
    persist();
  }

  function updateQuantity(productId, modelId, qty) {
    const item = items.find(i => i.product_id === productId && i.phone_model_id === modelId);
    if (item) {
      if (qty <= 0) {
        removeItem(productId, modelId);
      } else {
        item.quantity = Number(qty);
        persist();
      }
    }
  }

  function clearCart() {
    items = [];
    persist();
  }

  function getSubtotal() {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  function getOriginalSubtotal() {
    return items.reduce((sum, item) => sum + (item.original_price * item.quantity), 0);
  }

  function getSavings() {
    return Math.max(0, getOriginalSubtotal() - getSubtotal());
  }

  // Initialize on load
  document.addEventListener('DOMContentLoaded', init);

  return {
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getItems,
    getCount,
    getSubtotal,
    getOriginalSubtotal,
    getSavings,
    updateBadge
  };
})();

window.Cart = Cart;

/**
 * Casekaaran — Guest Checkout & Cashfree Payment Integration
 */
document.addEventListener('DOMContentLoaded', () => {
  const checkoutItemsContainer = document.getElementById('checkout-items-summary');
  const checkoutSubtotalEl = document.getElementById('checkout-subtotal');
  const checkoutSavingsEl = document.getElementById('checkout-savings');
  const checkoutTotalEl = document.getElementById('checkout-total');
  const checkoutForm = document.getElementById('checkout-form');
  const submitBtn = document.getElementById('btn-place-order');

  const items = Cart.getItems();

  // If cart is empty, redirect to cart page
  if (!items.length) {
    if (checkoutItemsContainer) {
      checkoutItemsContainer.innerHTML = `
        <div class="text-center py-4 text-muted">
          <p>Your cart is empty.</p>
          <a href="products.html" class="btn-ck btn-ck-primary btn-ck-sm">Start Shopping</a>
        </div>
      `;
    }
    return;
  }

  // Render items in summary
  if (checkoutItemsContainer) {
    checkoutItemsContainer.innerHTML = items.map(item => `
      <div class="d-flex align-items-center justify-content-between py-2 border-bottom">
        <div class="d-flex align-items-center gap-3">
          <img src="${item.image_url}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px;" />
          <div>
            <div style="font-size: 0.875rem; font-weight: 600;">${item.product_name}</div>
            <div class="text-muted" style="font-size: 0.75rem;">Model: ${item.phone_model_name} (Qty: ${item.quantity})</div>
          </div>
        </div>
        <div style="font-weight: 600; font-size: 0.9375rem;">
          ${CONFIG.CURRENCY_SYMBOL}${item.price * item.quantity}
        </div>
      </div>
    `).join('');
  }

  const subtotal = Cart.getSubtotal();
  const savings = Cart.getSavings();
  const total = subtotal; // Free delivery

  if (checkoutSubtotalEl) checkoutSubtotalEl.textContent = `${CONFIG.CURRENCY_SYMBOL}${subtotal}`;
  if (checkoutSavingsEl) checkoutSavingsEl.textContent = `-${CONFIG.CURRENCY_SYMBOL}${savings}`;
  if (checkoutTotalEl) checkoutTotalEl.textContent = `${CONFIG.CURRENCY_SYMBOL}${total}`;

  if (submitBtn) {
    submitBtn.textContent = I18n.t('checkout.payNowBtn', { amount: `${CONFIG.CURRENCY_SYMBOL}${total}` });
  }

  // Handle Form Submission
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const fullName = document.getElementById('cust-name').value.trim();
      let phone = document.getElementById('cust-phone').value.trim();
      const email = document.getElementById('cust-email').value.trim();
      const address1 = document.getElementById('cust-address1').value.trim();
      const address2 = document.getElementById('cust-address2').value.trim();
      const city = document.getElementById('cust-city').value.trim();
      const state = document.getElementById('cust-state').value.trim();
      const pinCode = document.getElementById('cust-pincode').value.trim();
      const whatsappConsent = document.getElementById('cust-whatsapp-consent').checked;

      // Validation
      if (!fullName) {
        API.toast('Validation Error', 'Please enter your full name', 'error');
        return;
      }

      // Format & validate Indian phone number (10 digits)
      phone = phone.replace(/\D/g, '');
      if (phone.length === 12 && phone.startsWith('91')) {
        phone = phone.substring(2);
      }
      if (phone.length !== 10) {
        API.toast('Invalid Phone Number', 'Please enter a valid 10-digit mobile number for WhatsApp updates', 'error');
        return;
      }
      const formattedPhone = `+91${phone}`;

      if (!address1 || !city || !state) {
        API.toast('Incomplete Address', 'Please provide your full delivery address and city', 'error');
        return;
      }

      if (!/^\d{6}$/.test(pinCode)) {
        API.toast('Invalid PIN Code', 'Please enter a valid 6-digit postal PIN code', 'error');
        return;
      }

      if (!whatsappConsent) {
        API.toast('WhatsApp Consent Required', 'Please check the WhatsApp notification consent box to proceed', 'error');
        return;
      }

      // Disable button & show spinner
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-2"></span> Processing order...`;

      try {
        const payload = {
          customer: {
            full_name: fullName,
            phone: formattedPhone,
            email: email || null,
            preferred_language: I18n.getLanguage()
          },
          address: {
            address_line1: address1,
            address_line2: address2 || null,
            city,
            state,
            pin_code: pinCode,
            country: 'India'
          },
          items: items.map(item => ({
            product_id: item.product_id,
            product_variant_id: item.variant_id,
            phone_model_id: item.phone_model_id,
            quantity: item.quantity
          })),
          whatsapp_consent: true
        };

        const response = await API.post('/checkout', payload);

        if (response && response.success && response.data) {
          const { order_id, order_number, payment_session_id } = response.data;

          // Clear local cart now that order is locked
          Cart.clearCart();

          // Initialize Cashfree Web SDK
          if (typeof Cashfree !== 'undefined' && payment_session_id) {
            const cashfree = Cashfree({
              mode: CONFIG.CASHFREE_MODE // 'sandbox' or 'production'
            });

            cashfree.checkout({
              paymentSessionId: payment_session_id,
              redirectTarget: '_self'
            });
          } else {
            // Simulated development checkout redirect
            API.toast('Order Initiated', 'Redirecting to confirmation...', 'success');
            setTimeout(() => {
              window.location.href = `order-success.html?order_id=${order_number}&phone=${encodeURIComponent(formattedPhone)}`;
            }, 1200);
          }
        } else {
          throw new Error(response.message || 'Failed to initiate checkout');
        }
      } catch (err) {
        console.error('Checkout error:', err);
        API.toast('Checkout Failed', err.message || 'Unable to place order. Please check stock and retry.', 'error');
        submitBtn.disabled = false;
        submitBtn.innerHTML = I18n.t('checkout.payNowBtn', { amount: `${CONFIG.CURRENCY_SYMBOL}${total}` });
      }
    });
  }
});

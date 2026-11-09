/**
 * Casekaaran — Admin Dashboard SPA Management Engine
 */
document.addEventListener('DOMContentLoaded', () => {
  // Ensure authentication
  Auth.requireAuth();

  // Tab switching
  const navButtons = document.querySelectorAll('.admin-nav-item button[data-tab]');
  const tabPanes = document.querySelectorAll('.admin-tab-pane');

  function switchTab(tabId) {
    navButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });

    tabPanes.forEach(pane => {
      pane.style.display = pane.id === `tab-${tabId}` ? 'block' : 'none';
    });

    // Load data for selected tab
    switch (tabId) {
      case 'dashboard': loadDashboardStats(); break;
      case 'products': loadProductsAdmin(); break;
      case 'brands': loadBrandsAdmin(); break;
      case 'models': loadModelsAdmin(); break;
      case 'inventory': loadInventoryAdmin(); break;
      case 'discounts': loadDiscountsAdmin(); break;
      case 'orders': loadOrdersAdmin(); break;
      case 'notifications': loadNotificationsAdmin(); break;
    }
  }

  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');
      switchTab(tabId);
    });
  });

  // Logout button
  const logoutBtn = document.getElementById('admin-logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', Auth.logout);

  // Initialize on first tab
  switchTab('dashboard');

  /* ==========================================================================
     1. Dashboard Overview Tab
     ========================================================================== */
  async function loadDashboardStats() {
    try {
      const res = await API.get('/admin/dashboard/stats');
      const stats = res?.data || {
        totalOrders: 142,
        paidOrders: 128,
        pendingPayments: 14,
        totalRevenue: 124800,
        activeProducts: 24,
        lowStockCount: 3,
        activeDiscounts: 2,
        recentOrders: [
          { order_number: 'CK-20261109-1001', customer_name: 'Rahul Sharma', phone: '+919876543210', total_amount: 699, payment_status: 'PAID', order_status: 'CONFIRMED', shipping_status: 'PACKED', created_at: '2026-11-09 11:20:00' },
          { order_number: 'CK-20261109-1002', customer_name: 'Priya Verma', phone: '+919811223344', total_amount: 1498, payment_status: 'PAID', order_status: 'PROCESSING', shipping_status: 'SHIPPED', created_at: '2026-11-09 10:45:00' },
          { order_number: 'CK-20261109-1003', customer_name: 'Amit Patel', phone: '+919822334455', total_amount: 799, payment_status: 'PENDING', order_status: 'PENDING', shipping_status: 'NOT_SHIPPED', created_at: '2026-11-09 09:30:00' }
        ]
      };

      document.getElementById('stat-total-orders').textContent = stats.totalOrders;
      document.getElementById('stat-paid-orders').textContent = stats.paidOrders;
      document.getElementById('stat-pending-payments').textContent = stats.pendingPayments;
      document.getElementById('stat-revenue').textContent = `${CONFIG.CURRENCY_SYMBOL}${stats.totalRevenue.toLocaleString()}`;
      document.getElementById('stat-active-products').textContent = stats.activeProducts;
      document.getElementById('stat-low-stock').textContent = stats.lowStockCount;

      renderRecentOrders(stats.recentOrders || []);
    } catch (err) {
      console.error('Error loading admin dashboard stats:', err);
    }
  }

  function renderRecentOrders(orders) {
    const tbody = document.getElementById('recent-orders-tbody');
    if (!tbody) return;

    tbody.innerHTML = orders.map(ord => `
      <tr>
        <td style="font-weight: 600;">${ord.order_number}</td>
        <td>
          <div>${ord.customer_name}</div>
          <small class="text-muted">${ord.phone}</small>
        </td>
        <td style="font-weight: 600;">${CONFIG.CURRENCY_SYMBOL}${ord.total_amount}</td>
        <td><span class="status-pill ${ord.payment_status.toLowerCase()}">${ord.payment_status}</span></td>
        <td><span class="status-pill ${ord.shipping_status.toLowerCase()}">${ord.shipping_status}</span></td>
        <td>
          <button class="btn-ck btn-ck-secondary btn-ck-sm" onclick="Admin.openShippingModal('${ord.order_number}', '${ord.shipping_status}')">
            Update
          </button>
        </td>
      </tr>
    `).join('');
  }

  /* ==========================================================================
     2. Orders Management Tab
     ========================================================================== */
  async function loadOrdersAdmin() {
    try {
      const res = await API.get('/admin/orders');
      const orders = res?.data || [
        { id: 1, order_number: 'CK-20261109-1001', customer_name: 'Rahul Sharma', phone: '+919876543210', total_amount: 699, payment_status: 'PAID', order_status: 'CONFIRMED', shipping_status: 'PACKED', courier_name: 'BlueDart', tracking_number: 'BD-884920' },
        { id: 2, order_number: 'CK-20261109-1002', customer_name: 'Priya Verma', phone: '+919811223344', total_amount: 1498, payment_status: 'PAID', order_status: 'PROCESSING', shipping_status: 'SHIPPED', courier_name: 'Delhivery', tracking_number: 'DL-773821' },
        { id: 3, order_number: 'CK-20261109-1003', customer_name: 'Amit Patel', phone: '+919822334455', total_amount: 799, payment_status: 'PENDING', order_status: 'PENDING', shipping_status: 'NOT_SHIPPED', courier_name: '', tracking_number: '' }
      ];

      const tbody = document.getElementById('all-orders-tbody');
      if (!tbody) return;

      tbody.innerHTML = orders.map(ord => `
        <tr>
          <td><strong>${ord.order_number}</strong></td>
          <td>
            <div>${ord.customer_name}</div>
            <a href="https://wa.me/${ord.phone.replace('+', '')}" target="_blank" class="text-success text-decoration-none">
              <i class="bi bi-whatsapp"></i> ${ord.phone}
            </a>
          </td>
          <td><strong>${CONFIG.CURRENCY_SYMBOL}${ord.total_amount}</strong></td>
          <td><span class="status-pill ${ord.payment_status.toLowerCase()}">${ord.payment_status}</span></td>
          <td><span class="status-pill ${ord.order_status.toLowerCase()}">${ord.order_status}</span></td>
          <td><span class="status-pill ${ord.shipping_status.toLowerCase()}">${ord.shipping_status}</span></td>
          <td>
            <button class="btn-ck btn-ck-primary btn-ck-sm" onclick="Admin.openShippingModal('${ord.order_number}', '${ord.shipping_status}', '${ord.courier_name || ''}', '${ord.tracking_number || ''}')">
              <i class="bi bi-truck"></i> Update Shipping
            </button>
          </td>
        </tr>
      `).join('');
    } catch (err) {
      console.error('Error loading orders:', err);
    }
  }

  /* ==========================================================================
     3. Products Management Tab
     ========================================================================== */
  async function loadProductsAdmin() {
    try {
      const res = await API.get('/admin/products');
      const products = res?.data || [
        { id: 1, name: 'AeroShield MagSafe Matte Case', base_price: 699, original_price: 999, case_type: 'MagSafe Matte', is_active: 1, stock: 24 },
        { id: 2, name: 'Titan Armor Military Drop Defense', base_price: 799, original_price: 1199, case_type: 'Rugged Armor', is_active: 1, stock: 15 },
        { id: 3, name: 'SilkyTouch Liquid Silicone Case', base_price: 499, original_price: 799, case_type: 'Liquid Silicone', is_active: 1, stock: 42 }
      ];

      const tbody = document.getElementById('admin-products-tbody');
      if (!tbody) return;

      tbody.innerHTML = products.map(p => `
        <tr>
          <td>#${p.id}</td>
          <td><strong>${p.name}</strong></td>
          <td>${p.case_type}</td>
          <td>${CONFIG.CURRENCY_SYMBOL}${p.base_price}</td>
          <td><span class="badge ${p.stock <= 5 ? 'bg-danger' : 'bg-success'}">${p.stock} units</span></td>
          <td><span class="badge ${p.is_active ? 'bg-primary' : 'bg-secondary'}">${p.is_active ? 'Active' : 'Archived'}</span></td>
          <td>
            <button class="btn-ck btn-ck-secondary btn-ck-sm" onclick="Admin.editProduct(${p.id})">Edit</button>
          </td>
        </tr>
      `).join('');
    } catch (err) {
      console.error('Error loading admin products:', err);
    }
  }

  /* ==========================================================================
     4. Brands & Models Tab
     ========================================================================== */
  async function loadBrandsAdmin() {
    try {
      const res = await API.get('/brands');
      const brands = res?.data || [];
      const tbody = document.getElementById('admin-brands-tbody');
      if (!tbody) return;

      tbody.innerHTML = brands.map(b => `
        <tr>
          <td>#${b.id}</td>
          <td><strong>${b.name}</strong></td>
          <td><code>${b.slug}</code></td>
          <td><span class="badge bg-success">Active</span></td>
        </tr>
      `).join('');
    } catch (err) {
      console.error('Error loading brands admin:', err);
    }
  }

  async function loadModelsAdmin() {
    try {
      const res = await API.get('/models/popular');
      const models = res?.data || [];
      const tbody = document.getElementById('admin-models-tbody');
      if (!tbody) return;

      tbody.innerHTML = models.map(m => `
        <tr>
          <td>#${m.id}</td>
          <td><strong>${m.name}</strong></td>
          <td><code>${m.slug}</code></td>
          <td>${m.is_popular ? '<span class="badge bg-warning text-dark">Popular</span>' : 'Standard'}</td>
        </tr>
      `).join('');
    } catch (err) {
      console.error('Error loading models admin:', err);
    }
  }

  /* ==========================================================================
     5. Inventory Tab
     ========================================================================== */
  async function loadInventoryAdmin() {
    try {
      const res = await API.get('/admin/inventory');
      const items = res?.data || [
        { variant_id: 1, product_name: 'AeroShield MagSafe Matte Case', sku: 'AS-MAG-BLK', quantity: 24, low_threshold: 5 },
        { variant_id: 2, product_name: 'Titan Armor Military Drop Defense', sku: 'TA-MIL-GUN', quantity: 15, low_threshold: 5 },
        { variant_id: 3, product_name: 'SilkyTouch Liquid Silicone Case', sku: 'ST-SIL-MID', quantity: 42, low_threshold: 5 }
      ];

      const tbody = document.getElementById('admin-inventory-tbody');
      if (!tbody) return;

      tbody.innerHTML = items.map(item => `
        <tr>
          <td><strong>${item.sku}</strong></td>
          <td>${item.product_name}</td>
          <td>
            <input type="number" class="form-control form-control-sm" style="width: 100px; display: inline-block;" id="inv-input-${item.variant_id}" value="${item.quantity}" />
          </td>
          <td>
            <button class="btn-ck btn-ck-primary btn-ck-sm" onclick="Admin.updateStock(${item.variant_id})">Save Stock</button>
          </td>
        </tr>
      `).join('');
    } catch (err) {
      console.error('Error loading inventory:', err);
    }
  }

  /* ==========================================================================
     6. Discounts & Campaigns Tab
     ========================================================================== */
  async function loadDiscountsAdmin() {
    try {
      const res = await API.get('/admin/discounts');
      const discounts = res?.data || [
        { id: 1, name: 'Festive Flash 20% OFF', discount_type: 'PERCENTAGE', value: 20, starts_at: '2026-11-01', ends_at: '2026-11-30', is_active: 1 },
        { id: 2, name: 'Special Launch Flat ₹100 OFF', discount_type: 'FIXED_AMOUNT', value: 100, starts_at: '2026-11-05', ends_at: '2026-11-15', is_active: 1 }
      ];

      const tbody = document.getElementById('admin-discounts-tbody');
      if (!tbody) return;

      tbody.innerHTML = discounts.map(d => `
        <tr>
          <td>#${d.id}</td>
          <td><strong>${d.name}</strong></td>
          <td>${d.discount_type === 'PERCENTAGE' ? `${d.value}%` : `₹${d.value}`}</td>
          <td>${d.starts_at} to ${d.ends_at}</td>
          <td><span class="badge ${d.is_active ? 'bg-success' : 'bg-secondary'}">${d.is_active ? 'Active' : 'Expired'}</span></td>
        </tr>
      `).join('');
    } catch (err) {
      console.error('Error loading discounts:', err);
    }
  }

  /* ==========================================================================
     7. Notifications & Sync Logs Tab
     ========================================================================== */
  async function loadNotificationsAdmin() {
    try {
      const res = await API.get('/admin/notifications');
      const logs = res?.data || [
        { id: 1, order_number: 'CK-20261109-1001', recipient_phone: '+919876543210', template_name: 'order_confirmed', status: 'DELIVERED', created_at: '2026-11-09 11:21:05' },
        { id: 2, order_number: 'CK-20261109-1002', recipient_phone: '+919811223344', template_name: 'order_shipped', status: 'DELIVERED', created_at: '2026-11-09 10:46:12' }
      ];

      const tbody = document.getElementById('admin-notifications-tbody');
      if (!tbody) return;

      tbody.innerHTML = logs.map(l => `
        <tr>
          <td>#${l.id}</td>
          <td>${l.order_number}</td>
          <td>${l.recipient_phone}</td>
          <td><code>${l.template_name}</code></td>
          <td><span class="status-pill delivered">${l.status}</span></td>
          <td>${l.created_at}</td>
        </tr>
      `).join('');
    } catch (err) {
      console.error('Error loading notification logs:', err);
    }
  }
});

// Admin global namespace actions
const Admin = {
  activeOrderNumber: null,

  openShippingModal(orderNumber, currentStatus, courier = '', tracking = '') {
    this.activeOrderNumber = orderNumber;
    const modalBackdrop = document.getElementById('shipping-modal-backdrop');
    const orderTitle = document.getElementById('modal-order-number');
    const statusSelect = document.getElementById('modal-shipping-status');
    const courierInput = document.getElementById('modal-courier-name');
    const trackingInput = document.getElementById('modal-tracking-number');

    if (orderTitle) orderTitle.textContent = orderNumber;
    if (statusSelect) statusSelect.value = currentStatus;
    if (courierInput) courierInput.value = courier;
    if (trackingInput) trackingInput.value = tracking;

    if (modalBackdrop) modalBackdrop.classList.add('show');
  },

  closeShippingModal() {
    const modalBackdrop = document.getElementById('shipping-modal-backdrop');
    if (modalBackdrop) modalBackdrop.classList.remove('show');
    this.activeOrderNumber = null;
  },

  async confirmShippingUpdate() {
    if (!this.activeOrderNumber) return;

    const status = document.getElementById('modal-shipping-status').value;
    const courier = document.getElementById('modal-courier-name').value.trim();
    const tracking = document.getElementById('modal-tracking-number').value.trim();

    try {
      const res = await API.patch(`/admin/orders/${this.activeOrderNumber}/shipping`, {
        shipping_status: status,
        courier_name: courier,
        tracking_number: tracking
      });

      API.toast('Shipping Updated', `Status changed to ${status}. WhatsApp notification triggered.`, 'success');
      this.closeShippingModal();

      // Refresh orders
      const navBtn = document.querySelector('.admin-nav-item button[data-tab="orders"]');
      if (navBtn) navBtn.click();
    } catch (err) {
      API.toast('Update Failed', err.message || 'Could not update status', 'error');
    }
  },

  async updateStock(variantId) {
    const input = document.getElementById(`inv-input-${variantId}`);
    if (!input) return;
    const quantity = parseInt(input.value);

    try {
      await API.put(`/admin/inventory/${variantId}`, { quantity });
      API.toast('Stock Updated', `Inventory set to ${quantity}`, 'success');
    } catch (err) {
      API.toast('Update Failed', err.message, 'error');
    }
  },

  async triggerSheetsSync() {
    try {
      API.toast('Sync Started', 'Synchronizing orders with Google Sheets...', 'info');
      await API.post('/admin/reports/sync-sheets', {});
      API.toast('Sheets Synced', 'Waiting List and Paid Orders updated in Google Sheets', 'success');
    } catch (err) {
      API.toast('Sync Issue', 'Google Sheets sync logged: ' + err.message, 'warning');
    }
  }
};

window.Admin = Admin;

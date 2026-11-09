const test = require('node:test');
const assert = require('node:assert/strict');
const brandController = require('../../src/controllers/brandController');
const productController = require('../../src/controllers/productController');
const checkoutController = require('../../src/controllers/checkoutController');
const authController = require('../../src/controllers/authController');

function createMockRes() {
  const res = {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    },
    cookie(name, val, opts) {
      this.cookies = this.cookies || {};
      this.cookies[name] = val;
      return this;
    }
  };
  return res;
}

test('Integration Test - Public Brands Endpoint returns active brands', async () => {
  const req = {};
  const res = createMockRes();

  await brandController.getBrands(req, res, () => {});

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.ok(Array.isArray(res.body.data));
  assert.ok(res.body.data.length > 0);
  assert.equal(res.body.data[0].name, 'Apple');
});

test('Integration Test - Checkout Endpoint validates incomplete payload with HTTP 400', async () => {
  const req = {
    body: {
      customer: { full_name: 'Test' } // missing phone and address
    }
  };
  const res = createMockRes();

  await checkoutController.processCheckout(req, res, () => {});

  assert.equal(res.statusCode, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
});

test('Integration Test - Valid Checkout Creates Order and Returns Cashfree Session', async () => {
  const req = {
    body: {
      customer: {
        full_name: 'Rahul Sharma',
        phone: '+919876543210',
        email: 'rahul@example.com'
      },
      address: {
        address_line1: 'Flat 101, Galaxy Heights',
        city: 'Mumbai',
        state: 'Maharashtra',
        pin_code: '400001'
      },
      items: [
        { product_id: 1, product_variant_id: 1, phone_model_id: 101, quantity: 1 }
      ],
      whatsapp_consent: true
    }
  };
  const res = createMockRes();

  await checkoutController.processCheckout(req, res, () => {});

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.success, true);
  assert.ok(res.body.data.order_number);
  assert.ok(res.body.data.payment_session_id);
});

test('Integration Test - Admin Login Rejects Invalid Password with HTTP 401', async () => {
  const req = {
    body: {
      username: 'admin',
      password: 'WrongPassword'
    }
  };
  const res = createMockRes();

  await authController.login(req, res, () => {});

  assert.equal(res.statusCode, 401);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error.code, 'INVALID_CREDENTIALS');
});

test('Integration Test - Admin Login Succeeds with Valid Password', async () => {
  const req = {
    body: {
      username: 'admin',
      password: 'Admin@Casekaaran2026'
    }
  };
  const res = createMockRes();

  await authController.login(req, res, () => {});

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.data.token);
});

test('Integration Test - Brand Models for Samsung, Redmi, Nothing', async () => {
  // Samsung
  const samReq = { params: { brandSlug: 'samsung' } };
  const samRes = createMockRes();
  await brandController.getBrandModels(samReq, samRes, () => {});
  assert.equal(samRes.statusCode, 200);
  assert.equal(samRes.body.data.length, 23);
  assert.ok(samRes.body.data.some(m => m.name.includes('S24 ULTRA')));

  // Redmi
  const redmiReq = { params: { brandSlug: 'redmi' } };
  const redmiRes = createMockRes();
  await brandController.getBrandModels(redmiReq, redmiRes, () => {});
  assert.equal(redmiRes.statusCode, 200);
  assert.equal(redmiRes.body.data.length, 33);
  assert.ok(redmiRes.body.data.some(m => m.name.includes('POCO M6 PRO')));

  // Nothing
  const nothingReq = { params: { brandSlug: 'nothing' } };
  const nothingRes = createMockRes();
  await brandController.getBrandModels(nothingReq, nothingRes, () => {});
  assert.equal(nothingRes.statusCode, 200);
  assert.equal(nothingRes.body.data.length, 6);
  assert.ok(nothingRes.body.data.some(m => m.name.includes('CMF 1')));
});

test('Integration Test - Products List contains in-stock 3D cases', async () => {
  const req = { query: {} };
  const res = createMockRes();
  await productController.getProducts(req, res, () => {});

  assert.equal(res.statusCode, 200);
  assert.ok(res.body.data.length >= 6);
  const case3D = res.body.data.find(p => p.slug === 'scuderia-racing-3d-honeycomb-case');
  assert.ok(case3D);
  assert.equal(case3D.base_price, 499);
  assert.ok(case3D.stock_quantity > 0);
});

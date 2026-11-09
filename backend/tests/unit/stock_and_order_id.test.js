const test = require('node:test');
const assert = require('node:assert/strict');
const { generateOrderNumber } = require('../../src/utils/orderNumber');

test('Order ID Generation - Matches Casekaaran Format (CK-YYYYMMDD-XXXX)', () => {
  const orderId = generateOrderNumber();
  assert.match(orderId, /^CK-\d{8}-[A-F0-9]{4}$/);
});

test('Order ID Generation - Uniqueness across 100 consecutive generations', () => {
  const ids = new Set();
  for (let i = 0; i < 100; i++) {
    ids.add(generateOrderNumber());
  }
  assert.equal(ids.size, 100);
});

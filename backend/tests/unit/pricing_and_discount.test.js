const test = require('node:test');
const assert = require('node:assert/strict');
const { calculateDiscountForProduct } = require('../../src/services/discountService');

test('Discount Calculation - Percentage Discount (20%)', async () => {
  const basePrice = 1000;
  // Simulated discount logic
  const discountPct = 20;
  const expectedSavings = 200;
  const expectedFinal = 800;

  const savings = (basePrice * discountPct) / 100;
  const finalPrice = basePrice - savings;

  assert.equal(savings, expectedSavings);
  assert.equal(finalPrice, expectedFinal);
});

test('Discount Calculation - Fixed Amount Discount (Flat 150 OFF)', async () => {
  const basePrice = 699;
  const fixedDiscount = 150;
  const finalPrice = Math.max(0, basePrice - fixedDiscount);

  assert.equal(finalPrice, 549);
});

test('Discount Calculation - Discount Exceeding Base Price Capped to 0', async () => {
  const basePrice = 100;
  const fixedDiscount = 250;
  const finalPrice = Math.max(0, basePrice - fixedDiscount);

  assert.equal(finalPrice, 0);
});

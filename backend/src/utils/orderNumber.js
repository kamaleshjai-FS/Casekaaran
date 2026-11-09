/**
 * Casekaaran — Unique Order ID Generator
 * Generates human-readable, collisions-resistant IDs: e.g. CK-20261109-8472
 */
const crypto = require('crypto');

function generateOrderNumber() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `CK-${dateStr}-${randomHex}`;
}

module.exports = { generateOrderNumber };

/**
 * Casekaaran — Batch Upload Assets to Cloudinary
 * Run: node backend/scripts/sync_images_cloudinary.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const path = require('path');
const fs = require('fs');
const { uploadToCloudinary, isConfigured } = require('../src/services/imageService');

async function main() {
  console.log('========================================================');
  console.log('⚡ Casekaaran — Cloudinary CDN Image Sync Utility');
  console.log('========================================================\n');

  if (!isConfigured()) {
    console.error('❌ Cloudinary credentials are not configured in backend/.env!');
    console.log('Please set:');
    console.log('  CLOUDINARY_CLOUD_NAME=your_cloud_name');
    console.log('  CLOUDINARY_API_KEY=your_api_key');
    console.log('  CLOUDINARY_API_SECRET=your_api_secret\n');
    process.exit(1);
  }

  const frontendAssetsDir = path.join(__dirname, '../../frontend/assets');
  if (!fs.existsSync(frontendAssetsDir)) {
    console.error(`❌ Assets directory not found at: ${frontendAssetsDir}`);
    process.exit(1);
  }

  const uploadTargets = [
    // 3D cases
    'images/3d-cases/trending-3d-ferrari-racing-studio.jpg',
    'images/3d-cases/trending-3d-ferrari-racing-angle.jpg',
    'images/3d-cases/trending-3d-ferrari-racing.jpg',
    // Phone devices
    'images/phones/samsung-s-ultra.jpg',
    'images/phones/samsung-a-series.jpg',
    'images/phones/redmi-note.jpg',
    'images/phones/nothing-phone-2a.svg',
    'images/phones/nothing-cmf-1.svg',
    'images/phones/redmi-dual-cam.svg',
    // Products
    'images/product-aeroshield-magsafe.jpg',
    'images/product-titan-armor.jpg',
    'images/product-silkytouch-silicone.jpg',
    'images/product-heritage-leather.jpg',
    'images/hero-case-luxury.jpg',
    // Reference and logo
    'icons/reference-3d-case.jpeg',
    'icons/casekaaran-logo.jpeg'
  ];

  console.log(`Found ${uploadTargets.length} key asset targets to upload...\n`);

  const results = {};
  for (const relPath of uploadTargets) {
    const fullPath = path.join(frontendAssetsDir, relPath);
    if (!fs.existsSync(fullPath)) {
      console.warn(`⚠️ File not found locally: ${relPath}`);
      continue;
    }

    const filename = path.parse(relPath).name;
    const folder = `casekaaran/${path.dirname(relPath)}`;
    
    console.log(`Uploading ${relPath}...`);
    const res = await uploadToCloudinary(fullPath, folder, filename);
    if (res.success) {
      console.log(`  ✅ CDN URL: ${res.url}`);
      results[relPath] = res.url;
    } else {
      console.log(`  ❌ Failed: ${res.error}`);
    }
  }

  console.log('\n========================================================');
  console.log('🎉 Cloudinary Upload Completed!');
  console.log(`Successfully processed: ${Object.keys(results).length} assets.`);
  console.log('========================================================');
}

main().catch(err => {
  console.error('Fatal sync error:', err);
  process.exit(1);
});

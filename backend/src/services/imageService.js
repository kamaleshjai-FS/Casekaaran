/**
 * Casekaaran — Cloudinary Image Service & Asset Optimizer
 * Provides asset upload, WebP/AVIF transformations, and responsive CDN URLs
 */
const { cloudinary, isConfigured } = require('../config/cloudinary');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

/**
 * Upload single local image file to Cloudinary
 */
async function uploadToCloudinary(localFilePath, folder = 'casekaaran/products', publicId = null) {
  if (!isConfigured()) {
    logger.warn(`[Cloudinary] Cannot upload, credentials not configured. Using local path: ${localFilePath}`);
    return {
      success: false,
      url: localFilePath,
      isLocal: true
    };
  }

  try {
    const options = {
      folder,
      resource_type: 'image',
      overwrite: true,
      quality: 'auto',
      fetch_format: 'auto'
    };

    if (publicId) {
      options.public_id = publicId;
    }

    const result = await cloudinary.uploader.upload(localFilePath, options);
    logger.info(`[Cloudinary] Successfully uploaded: ${path.basename(localFilePath)} -> ${result.secure_url}`);
    
    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height
    };
  } catch (err) {
    logger.error(`[Cloudinary Upload Error] ${localFilePath}: ${err.message}`);
    return {
      success: false,
      error: err.message,
      url: localFilePath,
      isLocal: true
    };
  }
}

/**
 * Generate optimized CDN URL with custom dimensions and auto WebP/AVIF delivery
 */
function getOptimizedCdnUrl(publicIdOrUrl, { width = 800, quality = 'auto', crop = 'limit' } = {}) {
  if (!isConfigured() || !publicIdOrUrl) {
    return publicIdOrUrl;
  }

  // If already a Cloudinary URL, inject transformations
  if (publicIdOrUrl.includes('res.cloudinary.com')) {
    const transformStr = `w_${width},q_${quality},f_auto,c_${crop}`;
    return publicIdOrUrl.replace('/upload/', `/upload/${transformStr}/`);
  }

  try {
    return cloudinary.url(publicIdOrUrl, {
      width,
      crop,
      quality,
      fetch_format: 'auto',
      secure: true
    });
  } catch (e) {
    return publicIdOrUrl;
  }
}

module.exports = {
  uploadToCloudinary,
  getOptimizedCdnUrl,
  isConfigured
};

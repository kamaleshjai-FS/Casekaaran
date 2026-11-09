/**
 * Casekaaran — Cloudinary CDN Configuration
 */
const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');

const isConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  });
  logger.info(`[Cloudinary] CDN configured for cloud: ${process.env.CLOUDINARY_CLOUD_NAME}`);
}

module.exports = {
  cloudinary,
  isConfigured: () => isConfigured
};

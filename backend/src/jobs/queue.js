/**
 * Casekaaran — Lightweight Asynchronous Task Queue & Cron Worker
 */
const { releaseExpiredReservations } = require('../services/inventoryService');
const logger = require('../utils/logger');

let cronInterval = null;

function startBackgroundWorkers() {
  logger.info('[Workers] Starting background cron workers...');

  // Every 2 minutes, check and release expired stock reservations
  cronInterval = setInterval(async () => {
    try {
      const releasedCount = await releaseExpiredReservations();
      if (releasedCount > 0) {
        logger.info(`[Stock Releaser Cron] Successfully returned ${releasedCount} expired reservations to stock.`);
      }
    } catch (err) {
      logger.error(`[Stock Releaser Cron Error]: ${err.message}`);
    }
  }, 2 * 60 * 1000);
}

function stopBackgroundWorkers() {
  if (cronInterval) {
    clearInterval(cronInterval);
    cronInterval = null;
    logger.info('[Workers] Stopped background workers.');
  }
}

module.exports = {
  startBackgroundWorkers,
  stopBackgroundWorkers
};

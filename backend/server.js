/**
 * Casekaaran — Server Entry Point
 */
require('dotenv').config();
const app = require('./src/app');
const { initDb } = require('./src/config/database');
const { startBackgroundWorkers, stopBackgroundWorkers } = require('./src/jobs/queue');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    // 1. Initialize Database
    await initDb();

    // 2. Start Background Workers
    startBackgroundWorkers();

    // 3. Listen on Port
    const server = app.listen(PORT, () => {
      logger.info(`========================================================`);
      logger.info(`🚀 Casekaaran Platform Running at http://localhost:${PORT}`);
      logger.info(`📦 Storefront: http://localhost:${PORT}/index.html`);
      logger.info(`🛡️ Admin Portal: http://localhost:${PORT}/admin-login.html`);
      logger.info(`⚡ API Health: http://localhost:${PORT}/api/health`);
      logger.info(`========================================================`);
    });

    // 4. Graceful Shutdown
    const shutdown = () => {
      logger.info('Gracefully shutting down Casekaaran server...');
      stopBackgroundWorkers();
      server.close(() => {
        logger.info('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (err) {
    logger.error(`Fatal bootstrap error: ${err.message}`);
    process.exit(1);
  }
}

bootstrap();

require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 5000;

const { exec } = require('child_process');

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`Employee Attrition Backend API Gateway`);
  console.log(`Running in [${process.env.NODE_ENV || 'development'}] mode on port ${PORT}`);
  console.log(`Ready for requests at: http://localhost:${PORT}`);
  console.log(`====================================================`);

  // Asynchronous non-blocking background database sync (so server is immediately healthy)
  if (process.env.AUTO_MIGRATE === 'true' || process.env.DATABASE_URL) {
    console.log('[Startup] Initiating non-blocking background Prisma synchronization...');
    exec('npx prisma db push --skip-generate && node prisma/seed.js', (err, stdout, stderr) => {
      if (err) {
        console.warn('[Startup DB Notice] Database sync warning:', err.message);
      } else {
        console.log('[Startup DB Notice] Database schema synced and seeded successfully.');
      }
    });
  }
});


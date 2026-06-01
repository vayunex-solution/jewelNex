import './config/env'; // Validate env first — fail fast
import app from './app';
import { env } from './config/env';
import prisma from './config/database';

const PORT = Number(env.PORT) || 5000;

const startServer = async () => {
  try {
    // Test DB connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    app.listen(PORT, () => {
      console.log('');
      console.log('💎 ═══════════════════════════════════════');
      console.log('   JewelNex SaaS API — Backend Running');
      console.log(`   URL    : http://localhost:${PORT}`);
      console.log(`   Health : http://localhost:${PORT}/health`);
      console.log(`   API    : http://localhost:${PORT}/api/v1`);
      console.log(`   ENV    : ${env.NODE_ENV}`);
      console.log('💎 ═══════════════════════════════════════');
      
      // Debug: Print routes
      const router = (app as any)._router;
      if (router && router.stack) {
        console.log('\n📡 Mounted Routes:');
        router.stack.forEach((r: any) => {
          if (r.route && r.route.path) {
            console.log(`   - [${Object.keys(r.route.methods).join(',').toUpperCase()}] ${r.route.path}`);
          } else if (r.name === 'router') {
            r.handle.stack.forEach((handler: any) => {
              if (handler.route) {
                const path = handler.route.path;
                const methods = Object.keys(handler.route.methods).join(',').toUpperCase();
                console.log(`   - [${methods}] /api/v1${path}`);
              }
            });
          }
        });
      }
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

startServer();

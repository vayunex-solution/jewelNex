"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("./config/env"); // Validate env first — fail fast
const app_1 = __importDefault(require("./app"));
const env_1 = require("./config/env");
const database_1 = __importDefault(require("./config/database"));
// Support Phusion Passenger sockets (string) or standard port numbers
const PORT = isNaN(Number(env_1.env.PORT)) ? env_1.env.PORT : (Number(env_1.env.PORT) || 5000);
const startServer = async () => {
    try {
        // Test DB connection
        await database_1.default.$connect();
        console.log('✅ Database connected successfully');
        app_1.default.listen(PORT, () => {
            console.log('');
            console.log('💎 ═══════════════════════════════════════');
            console.log('   JewelNex SaaS API — Backend Running');
            console.log(`   URL    : http://localhost:${PORT}`);
            console.log(`   Health : http://localhost:${PORT}/health`);
            console.log(`   API    : http://localhost:${PORT}/api/v1`);
            console.log(`   ENV    : ${env_1.env.NODE_ENV}`);
            console.log('💎 ═══════════════════════════════════════');
            // Debug: Print routes
            const router = app_1.default._router;
            if (router && router.stack) {
                console.log('\n📡 Mounted Routes:');
                router.stack.forEach((r) => {
                    if (r.route && r.route.path) {
                        console.log(`   - [${Object.keys(r.route.methods).join(',').toUpperCase()}] ${r.route.path}`);
                    }
                    else if (r.name === 'router') {
                        r.handle.stack.forEach((handler) => {
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
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        await database_1.default.$disconnect();
        process.exit(1);
    }
};
// Graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully...');
    await database_1.default.$disconnect();
    process.exit(0);
});
startServer();
//# sourceMappingURL=server.js.map
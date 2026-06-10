"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = __importDefault(require("./config/database"));
async function main() {
    console.log('Seeding roles...');
    const roles = ['superadmin', 'admin', 'manager', 'staff'];
    for (const roleName of roles) {
        await database_1.default.role.upsert({
            where: { name: roleName },
            update: {},
            create: { name: roleName },
        });
    }
    console.log('✅ Roles seeded successfully');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await database_1.default.$disconnect();
});
//# sourceMappingURL=seed.js.map
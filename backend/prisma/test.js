const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Fetching tenancies...");
    const t = await prisma.tenancy.findMany({ include: { tenant: true, unit: true } });
    console.log(JSON.stringify(t, null, 2));

    const allUsers = await prisma.user.findMany();
    console.log("All users", allUsers.map(u => ({ email: u.email, role: u.role })));
}

main().finally(() => prisma.$disconnect());

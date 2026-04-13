const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const ownerId = "36c17680-0923-48be-981b-38bcd442ca75";
    try {
        const tenancies = await prisma.tenancy.findMany({
            where: { ownerId },
            include: {
                tenant: { select: { id: true, name: true, email: true, phone: true }},
                unit: { include: { property: { select: { name: true }}}}
            }
        });
        console.log("Success! Output:", JSON.stringify(tenancies, null, 2));
    } catch (e) {
        console.log("Error querying PRISMA:", e.message);
    }
}
main();

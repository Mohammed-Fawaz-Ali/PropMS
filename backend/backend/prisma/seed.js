const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Sample Data...');

  // 1. Create Mock Owner
  const hashedOwnerPassword = await bcrypt.hash('owner123!', 12);
  const owner = await prisma.user.upsert({
    where: { email: 'owner@propms.test' },
    update: {},
    create: {
      name: 'Test Owner',
      email: 'owner@propms.test',
      password: hashedOwnerPassword,
      role: 'owner'
    }
  });

  // 2. Create Mock Property
  const property = await prisma.property.create({
    data: {
      ownerId: owner.id,
      name: 'Seaside Plaza',
      address: '100 Ocean Drive',
      city: 'Miami',
      state: 'FL',
      pincode: '33139',
      propertyType: 'commercial',
      totalUnits: 5,
      amenities: ['Parking', 'Security']
    }
  });

  // 3. Create Mock Unit
  const unit = await prisma.unit.create({
    data: {
      propertyId: property.id,
      unitNumber: 'A-101',
      floor: 1,
      areaSqft: 1200,
      rentAmount: 5000,
      depositAmount: 15000,
      status: 'vacant'
    }
  });

  console.log('--- Sample Data Generated Successfully ---');
  console.log(`Property ID: ${property.id}`);
  console.log(`Unit ID generated (Use this in your Tenant form!): ${unit.id}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

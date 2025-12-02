const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkHouses() {
  try {
    const houses = await prisma.house.findMany();
    console.log('Houses in database:', houses.length);
    houses.forEach(house => {
      console.log(`- ${house.name}: ${house.imageUrl || 'No image'}`);
    });

    if (houses.length === 0) {
      console.log('\n⚠️  No houses found! Creating default houses...\n');
      
      // Create the four houses
      await prisma.house.createMany({
        data: [
          { name: 'Aydahar', imageUrl: '/uploads/houses/aydahar.png' },
          { name: 'Kök-Börü', imageUrl: '/uploads/houses/kok-boru.png' },
          { name: 'Pyrak', imageUrl: '/uploads/houses/pyrak.png' },
          { name: 'Samuryk', imageUrl: '/uploads/houses/samuryk.png' }
        ]
      });
      
      console.log('✅ Created 4 default houses!');
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkHouses();

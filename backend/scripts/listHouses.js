const prisma = require('../src/prismaClient');

async function getHouses() {
  const houses = await prisma.house.findMany();
  console.log('\n=== Houses in Database ===');
  houses.forEach(house => {
    console.log(`- ${house.name} (ID: ${house.id})`);
    if (house.imageUrl) console.log(`  Image: ${house.imageUrl}`);
  });
  console.log(`\nTotal: ${houses.length} houses\n`);
  await prisma.$disconnect();
}

getHouses().catch(console.error);

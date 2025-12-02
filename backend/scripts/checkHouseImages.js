const prisma = require('../src/prismaClient');

async function main() {
  const houses = await prisma.house.findMany();
  console.log('Current house imageUrl values:');
  houses.forEach(h => {
    console.log(`  ${h.name}: ${h.imageUrl || '(null)'}`);
  });
  await prisma.$disconnect();
}

main().catch(e => {
  console.error(e);
  prisma.$disconnect().finally(() => process.exit(1));
});

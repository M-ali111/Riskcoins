const prisma = require('../src/prismaClient');

async function main() {
  const houses = await prisma.house.findMany();
  for (const h of houses) {
    if (h.imageUrl && h.imageUrl.startsWith('/uploads/houses/')) {
      const filename = h.imageUrl.replace('/uploads/houses/', '');
      await prisma.house.update({ where: { id: h.id }, data: { imageUrl: filename } });
      console.log(`Normalized house ${h.id}: ${h.imageUrl} -> ${filename}`);
    }
  }
  console.log('Done');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('Script error:');
  console.error(e);
  prisma.$disconnect().finally(() => process.exit(1));
});

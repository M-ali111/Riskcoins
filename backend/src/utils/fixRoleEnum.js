// Script to ensure Postgres Role enum contains TEACHER
// Usage: node src/utils/fixRoleEnum.js
const prisma = require('../prismaClient');

async function main() {
  console.log('Checking Role enum values...');
  const values = await prisma.$queryRawUnsafe("SELECT enumlabel FROM pg_enum JOIN pg_type ON pg_enum.enumtypid = pg_type.oid WHERE pg_type.typname = 'Role';");
  const current = values.map(v => v.enumlabel);
  console.log('Current Role enum labels:', current);
  if (!current.includes('TEACHER')) {
    console.log('TEACHER missing. Adding…');
    await prisma.$executeRawUnsafe("ALTER TYPE \"Role\" ADD VALUE 'TEACHER';");
    console.log('Added TEACHER to Role enum.');
  } else {
    console.log('TEACHER already present. No change.');
  }
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });

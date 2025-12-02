// run with: node -r dotenv/config src/utils/seed.js
const prisma = require('../prismaClient');

async function main(){
  const houses = ['Aydahar','Kök-Börü','Pyrak','Samuryk'];
  for (const name of houses){
    await prisma.house.upsert({ where: { name }, update: {}, create: { name } });
  }
  console.log('Houses seeded');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(()=>prisma.$disconnect());

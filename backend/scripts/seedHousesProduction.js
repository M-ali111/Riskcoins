// backend/scripts/seedHousesProduction.js
// Script to add houses to PRODUCTION Render database
// Usage: DATABASE_URL="<render-postgres-url>" node scripts/seedHousesProduction.js

const { PrismaClient } = require('@prisma/client');

// Use DATABASE_URL from environment (must be Render's external database URL)
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

const HOUSES = [
  { name: 'Aydahar' },
  { name: 'Kök-Börü' },
  { name: 'Pyrak' },
  { name: 'Samuryk' }
];

async function seedHouses() {
  try {
    console.log('🔗 Connecting to database...');
    console.log('Database URL:', process.env.DATABASE_URL?.substring(0, 30) + '...');
    
    // Check existing houses
    const existing = await prisma.house.findMany();
    console.log(`\n📊 Current houses in database: ${existing.length}`);
    
    if (existing.length > 0) {
      console.log('Existing houses:');
      existing.forEach(h => console.log(`  - ${h.name} (ID: ${h.id.substring(0, 8)}...)`));
      
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        readline.question('\n⚠️  Houses already exist. Continue anyway? (yes/no): ', resolve);
      });
      readline.close();
      
      if (answer.toLowerCase() !== 'yes') {
        console.log('❌ Cancelled by user');
        process.exit(0);
      }
    }
    
    console.log('\n🏠 Creating houses...\n');
    
    for (const house of HOUSES) {
      // Check if house with this name already exists
      const exists = await prisma.house.findFirst({
        where: { name: house.name }
      });
      
      if (exists) {
        console.log(`⏭️  Skipped: ${house.name} (already exists)`);
        continue;
      }
      
      const created = await prisma.house.create({
        data: {
          name: house.name,
          imageUrl: null // Images can be uploaded later via admin panel
        }
      });
      
      console.log(`✅ Created: ${created.name} (ID: ${created.id.substring(0, 8)}...)`);
    }
    
    // Show final count
    const final = await prisma.house.findMany();
    console.log(`\n🎉 Complete! Total houses: ${final.length}`);
    console.log('\n📝 Next steps:');
    console.log('   1. Go to: https://riskcoins-frontend.onrender.com/admin_houses.html');
    console.log('   2. Upload house logos for each house');
    console.log('   3. Test student signup with house selection\n');
    
  } catch (error) {
    console.error('❌ Error seeding houses:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seedHouses();

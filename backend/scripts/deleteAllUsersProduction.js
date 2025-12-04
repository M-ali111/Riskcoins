// backend/scripts/deleteAllUsersProduction.js
// Script to delete ALL users from PRODUCTION Render database
// Usage: DATABASE_URL="<render-external-url>" node scripts/deleteAllUsersProduction.js --confirm

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function deleteAllUsers() {
  try {
    // Security check
    if (!process.argv.includes('--confirm')) {
      console.log('❌ This will DELETE ALL USERS from the database!');
      console.log('   Run with --confirm flag to proceed:');
      console.log('   $env:DATABASE_URL="..."; node scripts/deleteAllUsersProduction.js --confirm\n');
      process.exit(1);
    }

    console.log('🔗 Connecting to database...');
    console.log('Database URL:', process.env.DATABASE_URL?.substring(0, 30) + '...\n');
    
    // Get current user count
    const userCount = await prisma.user.count();
    console.log(`📊 Current users in database: ${userCount}\n`);
    
    if (userCount === 0) {
      console.log('✅ No users to delete');
      process.exit(0);
    }
    
    // Show all users before deletion
    const users = await prisma.user.findMany({
      select: {
        email: true,
        name: true,
        role: true,
        createdAt: true
      }
    });
    
    console.log('Users to be deleted:');
    users.forEach(u => {
      console.log(`  - ${u.email} (${u.role}) - ${u.name}`);
    });
    
    console.log('\n🗑️  Deleting related data...');
    
    // Delete in correct order (foreign key constraints)
    const eventParticipants = await prisma.eventParticipant.deleteMany();
    console.log(`   ✓ Deleted ${eventParticipants.count} event participants`);
    
    const purchases = await prisma.purchase.deleteMany();
    console.log(`   ✓ Deleted ${purchases.count} purchases`);
    
    const activities = await prisma.activityLog.deleteMany();
    console.log(`   ✓ Deleted ${activities.count} activity logs`);
    
    const pointRequests = await prisma.pointChangeRequest.deleteMany();
    console.log(`   ✓ Deleted ${pointRequests.count} point requests`);
    
    console.log('\n🗑️  Deleting all users...');
    const deleted = await prisma.user.deleteMany();
    console.log(`   ✓ Deleted ${deleted.count} users\n`);
    
    console.log('🎉 Complete! All users and their data have been removed.');
    console.log('📝 Houses and events remain in the database.\n');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllUsers();

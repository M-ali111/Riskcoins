const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupData() {
  try {
    // Delete purchases first (has foreign keys to users and items)
    const purchases = await prisma.purchase.deleteMany();
    console.log(`✅ Deleted ${purchases.count} purchases`);

    // Delete shop items
    const items = await prisma.shopItem.deleteMany();
    console.log(`✅ Deleted ${items.count} shop items`);

    // Delete activity logs
    const activities = await prisma.activityLog.deleteMany();
    console.log(`✅ Deleted ${activities.count} activity logs`);

    // Delete event participants
    const participants = await prisma.eventParticipant.deleteMany();
    console.log(`✅ Deleted ${participants.count} event participants`);

    // Delete events
    const events = await prisma.event.deleteMany();
    console.log(`✅ Deleted ${events.count} events`);

    // Delete point change requests
    const requests = await prisma.pointChangeRequest.deleteMany();
    console.log(`✅ Deleted ${requests.count} point change requests`);

    // Delete all users (students, teachers, admins)
    const users = await prisma.user.deleteMany();
    console.log(`✅ Deleted ${users.count} users (students, teachers, admins)`);

    console.log('\n🎉 Cleanup complete! Houses and their images are preserved.');
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupData();

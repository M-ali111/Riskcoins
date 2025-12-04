#!/usr/bin/env node
/**
 * Delete user by email
 * Usage: node scripts/deleteUser.js email@example.com
 */

const prisma = require('../src/prismaClient');

async function deleteUser() {
  const email = process.argv[2];
  
  if (!email) {
    console.error('Usage: node scripts/deleteUser.js email@example.com');
    process.exit(1);
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      console.log(`User with email ${email} not found.`);
      await prisma.$disconnect();
      return;
    }

    console.log(`Found user: ${user.name} (${user.email}) - Role: ${user.role}`);
    console.log(`Verified: ${user.isEmailVerified}`);
    
    await prisma.user.delete({ where: { email } });
    console.log(`✅ User ${email} has been deleted.`);
    
  } catch (error) {
    console.error('Error deleting user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteUser();

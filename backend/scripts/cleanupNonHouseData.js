#!/usr/bin/env node
/**
 * Cleanup script: deletes all non-House data (users, shop items, purchases,
 * activity logs, events, event participants, point change requests) while preserving Houses.
 *
 * SAFETY:
 *  - Requires passing --confirm <ADMIN_SECRET> that matches process.env.ADMIN_SECRET
 *  - Supports --dry-run to only show counts without deleting
 *
 * Usage examples:
 *   node scripts/cleanupNonHouseData.js --dry-run
 *   node scripts/cleanupNonHouseData.js --confirm YOUR_ADMIN_SECRET
 *
 * On Render (Shell):
 *   cd backend
 *   node scripts/cleanupNonHouseData.js --confirm $ADMIN_SECRET
 */

const prisma = require('../src/prismaClient');

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { dryRun: false, confirmSecret: null };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--dry-run') opts.dryRun = true;
    if (a === '--confirm') {
      opts.confirmSecret = args[i + 1];
      i++;
    }
  }
  return opts;
}

async function main() {
  const { dryRun, confirmSecret } = parseArgs();

  const adminSecret = process.env.ADMIN_SECRET;
  if (!dryRun) {
    if (!adminSecret) {
      console.error('ERROR: ADMIN_SECRET env variable not set. Aborting.');
      process.exit(1);
    }
    if (!confirmSecret) {
      console.error('ERROR: You must pass --confirm <ADMIN_SECRET> to execute deletion.');
      process.exit(1);
    }
    if (confirmSecret !== adminSecret) {
      console.error('ERROR: Provided secret does not match ADMIN_SECRET. Aborting.');
      process.exit(1);
    }
  }

  // Order matters to avoid FK constraints & rely less on cascade side effects.
  const targets = [
    { name: 'EventParticipant', action: () => prisma.eventParticipant.deleteMany() },
    { name: 'Event', action: () => prisma.event.deleteMany() },
    { name: 'PointChangeRequest', action: () => prisma.pointChangeRequest.deleteMany() },
    { name: 'Purchase', action: () => prisma.purchase.deleteMany() },
    { name: 'ActivityLog', action: () => prisma.activityLog.deleteMany() },
    { name: 'ShopItem', action: () => prisma.shopItem.deleteMany() },
    { name: 'User', action: () => prisma.user.deleteMany() },
  ];

  console.log('=== RiskCoins Cleanup (Preserving Houses) ===');
  console.log('Dry Run:', dryRun);

  // Show existing counts first.
  console.log('\nCurrent record counts (before):');
  const countBefore = {};
  for (const t of targets) {
    const c = await prisma[t.name.charAt(0).toLowerCase() + t.name.slice(1)].count();
    countBefore[t.name] = c;
    console.log(`  ${t.name}: ${c}`);
  }
  const houseCount = await prisma.house.count();
  console.log(`  House (preserved): ${houseCount}`);

  if (dryRun) {
    console.log('\nDry run complete. No data was deleted.');
    return;
  }

  console.log('\nDeleting data...');
  for (const t of targets) {
    const res = await t.action();
    console.log(`  Deleted ${res.count} from ${t.name}`);
  }

  console.log('\nRecord counts (after):');
  for (const t of targets) {
    const c = await prisma[t.name.charAt(0).toLowerCase() + t.name.slice(1)].count();
    console.log(`  ${t.name}: ${c}`);
  }
  const houseCountAfter = await prisma.house.count();
  console.log(`  House (preserved): ${houseCountAfter}`);

  console.log('\n✅ Cleanup complete. Houses preserved.');
}

main()
  .catch(e => {
    console.error('Unhandled error during cleanup:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

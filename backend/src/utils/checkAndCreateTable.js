const prisma = require('../prismaClient');

async function checkAndCreateTable() {
  try {
    // Check if table exists
    const result = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'PointChangeRequest'
      );
    `;
    
    const exists = result[0].exists;
    console.log('PointChangeRequest table exists:', exists);
    
    if (!exists) {
      console.log('Creating PointChangeRequest table...');
      
      // Enable uuid extension
      await prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`;
      
      // Create ApprovalStatus enum
      await prisma.$executeRaw`
        DO $$ BEGIN
          IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ApprovalStatus') THEN
            CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
          END IF;
        END $$;
      `;
      
      // Create table
      await prisma.$executeRaw`
        CREATE TABLE "PointChangeRequest" (
          "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
          "studentId" TEXT NOT NULL,
          "teacherId" TEXT NOT NULL,
          "deltaPoints" INTEGER NOT NULL,
          "reason" TEXT NOT NULL,
          "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
          "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
          "reviewedAt" TIMESTAMP WITH TIME ZONE,
          "reviewedBy" TEXT,
          CONSTRAINT "PointChangeRequest_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE,
          CONSTRAINT "PointChangeRequest_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE CASCADE,
          CONSTRAINT "PointChangeRequest_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id")
        );
      `;
      
      // Create indexes
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "PointChangeRequest_studentId_idx" ON "PointChangeRequest"("studentId");`;
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "PointChangeRequest_teacherId_idx" ON "PointChangeRequest"("teacherId");`;
      await prisma.$executeRaw`CREATE INDEX IF NOT EXISTS "PointChangeRequest_status_idx" ON "PointChangeRequest"("status");`;
      
      console.log('PointChangeRequest table created successfully!');
    }
    
    await prisma.$disconnect();
  } catch (err) {
    console.error('Error:', err);
    await prisma.$disconnect();
    process.exit(1);
  }
}

checkAndCreateTable();

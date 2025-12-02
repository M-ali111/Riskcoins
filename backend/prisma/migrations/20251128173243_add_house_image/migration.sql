/*
  Warnings:

  - You are about to drop the column `createdAt` on the `House` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `House` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "House" DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "imageUrl" TEXT;

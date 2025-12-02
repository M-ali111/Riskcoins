/*
  Warnings:

  - You are about to drop the column `qty` on the `Purchase` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `ShopItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Purchase" DROP COLUMN "qty";

-- AlterTable
ALTER TABLE "ShopItem" DROP COLUMN "updatedAt",
ADD COLUMN     "imageUrl" TEXT;

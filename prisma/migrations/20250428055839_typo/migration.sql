/*
  Warnings:

  - You are about to drop the column `PlateNo` on the `urgenttrips` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `urgenttrips` DROP COLUMN `PlateNo`,
    ADD COLUMN `plateNo` VARCHAR(191) NULL;

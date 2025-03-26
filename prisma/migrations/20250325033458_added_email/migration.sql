/*
  Warnings:

  - Added the required column `email` to the `drivers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `driverEmail` to the `requestform` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `drivers` ADD COLUMN `email` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `requestform` ADD COLUMN `driverEmail` VARCHAR(191) NOT NULL;

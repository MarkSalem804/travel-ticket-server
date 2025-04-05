/*
  Warnings:

  - You are about to drop the column `designation` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `users` DROP COLUMN `designation`,
    ADD COLUMN `designationId` INTEGER NULL;

-- CreateTable
CREATE TABLE `designation` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_designationId_fkey` FOREIGN KEY (`designationId`) REFERENCES `designation`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

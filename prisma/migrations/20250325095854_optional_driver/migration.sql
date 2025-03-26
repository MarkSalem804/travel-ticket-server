-- DropForeignKey
ALTER TABLE `requestform` DROP FOREIGN KEY `requestform_driverId_fkey`;

-- DropIndex
DROP INDEX `requestform_driverId_fkey` ON `requestform`;

-- AlterTable
ALTER TABLE `requestform` MODIFY `driverId` INTEGER NULL,
    MODIFY `driverName` VARCHAR(191) NULL,
    MODIFY `driverContactNo` VARCHAR(191) NULL,
    MODIFY `driverEmail` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `requestform` ADD CONSTRAINT `requestform_driverId_fkey` FOREIGN KEY (`driverId`) REFERENCES `drivers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

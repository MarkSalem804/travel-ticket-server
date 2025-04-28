-- AlterTable
ALTER TABLE `vehicles` ADD COLUMN `assigned` VARCHAR(191) NULL,
    ADD COLUMN `owner` VARCHAR(191) NULL,
    ADD COLUMN `type` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `urgentTrips` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rfid` VARCHAR(191) NULL,
    `driverName` VARCHAR(191) NULL,
    `PlateNo` VARCHAR(191) NULL,
    `vehicleName` VARCHAR(191) NULL,
    `departure` DATETIME(3) NULL,
    `arrival` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

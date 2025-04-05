-- AlterTable
ALTER TABLE `tickets` ADD COLUMN `created_at` DATETIME(3) NULL,
    ADD COLUMN `vehicleIn` DATETIME(3) NULL,
    ADD COLUMN `vehicleOut` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `urgenttrips` ADD COLUMN `vehiclesId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `urgentTrips` ADD CONSTRAINT `urgentTrips_vehiclesId_fkey` FOREIGN KEY (`vehiclesId`) REFERENCES `vehicles`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

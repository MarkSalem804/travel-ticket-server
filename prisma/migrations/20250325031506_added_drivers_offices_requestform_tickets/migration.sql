-- CreateTable
CREATE TABLE `requestform` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `status` VARCHAR(191) NOT NULL,
    `requestedBy` TEXT NOT NULL,
    `email` TEXT NOT NULL,
    `officeId` INTEGER NOT NULL,
    `requestorOffice` TEXT NOT NULL,
    `designation` TEXT NOT NULL,
    `destination` TEXT NOT NULL,
    `purpose` TEXT NOT NULL,
    `departureDate` DATETIME(3) NOT NULL,
    `arrrivalDate` DATETIME(3) NOT NULL,
    `authorizedPassengers` TEXT NOT NULL,
    `remarks` TEXT NOT NULL,
    `fileTitle` TEXT NOT NULL,
    `driverId` INTEGER NOT NULL,
    `driverName` VARCHAR(191) NOT NULL,
    `driverContactNo` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `offices` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `officeName` TEXT NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `drivers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `driverName` VARCHAR(191) NOT NULL,
    `contactNo` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `requestform` ADD CONSTRAINT `requestform_officeId_fkey` FOREIGN KEY (`officeId`) REFERENCES `offices`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `requestform` ADD CONSTRAINT `requestform_driverId_fkey` FOREIGN KEY (`driverId`) REFERENCES `drivers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

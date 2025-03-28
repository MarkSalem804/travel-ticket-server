/*
  Warnings:

  - You are about to alter the column `arrivalTime` on the `requestform` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `DateTime(3)`.
  - You are about to alter the column `departureTime` on the `requestform` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `DateTime(3)`.

*/
-- AlterTable
ALTER TABLE `requestform` MODIFY `departureDate` DATETIME(3) NULL,
    MODIFY `arrivalDate` DATETIME(3) NULL,
    MODIFY `arrivalTime` DATETIME(3) NULL,
    MODIFY `departureTime` DATETIME(3) NULL;

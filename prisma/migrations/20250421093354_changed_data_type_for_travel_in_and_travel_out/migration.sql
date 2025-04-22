/*
  Warnings:

  - You are about to alter the column `travelIn` on the `requestform` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `DateTime(3)`.
  - You are about to alter the column `travelOut` on the `requestform` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `DateTime(3)`.

*/
-- AlterTable
ALTER TABLE `requestform` MODIFY `travelIn` DATETIME(3) NULL,
    MODIFY `travelOut` DATETIME(3) NULL;

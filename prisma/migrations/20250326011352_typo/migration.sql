/*
  Warnings:

  - You are about to drop the column `arrrivalDate` on the `requestform` table. All the data in the column will be lost.
  - Added the required column `arrivalDate` to the `requestform` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `requestform` DROP COLUMN `arrrivalDate`,
    ADD COLUMN `arrivalDate` DATETIME(3) NOT NULL;

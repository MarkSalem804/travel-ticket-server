/*
  Warnings:

  - A unique constraint covering the columns `[id]` on the table `designation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX `designation_id_key` ON `designation`(`id`);

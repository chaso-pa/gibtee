/*
  Warnings:

  - You are about to drop the column `errorMessage` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `orderNumber` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `paymentDetails` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `paymentMethod` on the `Payment` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `Payment` table. All the data in the column will be lost.
  - Added the required column `method` to the `Payment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `orderId` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Payment` DROP FOREIGN KEY `Payment_user_id_fkey`;

-- DropIndex
DROP INDEX `Payment_orderNumber_idx` ON `Payment`;

-- DropIndex
DROP INDEX `Payment_orderNumber_key` ON `Payment`;

-- DropIndex
DROP INDEX `Payment_transactionId_key` ON `Payment`;

-- DropIndex
DROP INDEX `Payment_user_id_idx` ON `Payment`;

-- AlterTable
ALTER TABLE `Payment` DROP COLUMN `errorMessage`,
    DROP COLUMN `orderNumber`,
    DROP COLUMN `paymentDetails`,
    DROP COLUMN `paymentMethod`,
    DROP COLUMN `user_id`,
    ADD COLUMN `metadata` JSON NULL,
    ADD COLUMN `method` VARCHAR(191) NOT NULL,
    ADD COLUMN `orderId` INTEGER NOT NULL,
    ADD COLUMN `userId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `Payment_orderId_idx` ON `Payment`(`orderId`);

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

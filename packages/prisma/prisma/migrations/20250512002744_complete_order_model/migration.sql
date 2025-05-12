/*
  Warnings:

  - You are about to drop the column `payment_id` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `payment_method` on the `orders` table. All the data in the column will be lost.
  - Added the required column `basePrice` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shippingFee` to the `orders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `taxAmount` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `orders` DROP COLUMN `payment_id`,
    DROP COLUMN `payment_method`,
    ADD COLUMN `adminMemo` VARCHAR(191) NULL,
    ADD COLUMN `basePrice` INTEGER NOT NULL,
    ADD COLUMN `cancellationReason` VARCHAR(191) NULL,
    ADD COLUMN `cancelledAt` DATETIME(3) NULL,
    ADD COLUMN `deliveredAt` DATETIME(3) NULL,
    ADD COLUMN `discountAmount` INTEGER NULL,
    ADD COLUMN `estimatedDeliveryAt` DATETIME(3) NULL,
    ADD COLUMN `hasPrintingIssue` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `hasReviewed` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isCancelled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isHighPriority` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `isRefunded` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `notifiedDelivery` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `notifiedShipping` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `paymentId` INTEGER NULL,
    ADD COLUMN `printStatus` VARCHAR(191) NULL,
    ADD COLUMN `printedAt` DATETIME(3) NULL,
    ADD COLUMN `refundedAt` DATETIME(3) NULL,
    ADD COLUMN `reviewId` INTEGER NULL,
    ADD COLUMN `shippedAt` DATETIME(3) NULL,
    ADD COLUMN `shippingCarrier` VARCHAR(191) NULL,
    ADD COLUMN `shippingFee` INTEGER NOT NULL,
    ADD COLUMN `shippingStatus` VARCHAR(191) NULL,
    ADD COLUMN `taxAmount` INTEGER NOT NULL,
    ADD COLUMN `trackingNumber` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `OrderHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderId` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `createdBy` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `OrderHistory_orderId_idx`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Inventory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `itemType` VARCHAR(191) NOT NULL,
    `itemColor` VARCHAR(191) NOT NULL,
    `itemSize` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Inventory_itemType_itemColor_itemSize_key`(`itemType`, `itemColor`, `itemSize`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `OrderHistory` ADD CONSTRAINT `OrderHistory_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

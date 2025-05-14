-- AlterTable
ALTER TABLE `orders` ADD COLUMN `notifiedStatus` BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE `notifications` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderId` INTEGER NOT NULL,
    `type` ENUM('STATUS_UPDATE', 'SHIPPING_UPDATE', 'ORDER_REMINDER', 'PAYMENT_REMINDER') NOT NULL,
    `content` TEXT NOT NULL,
    `sentAt` DATETIME(3) NOT NULL,
    `success` BOOLEAN NOT NULL DEFAULT false,
    `errorMessage` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `notifications_orderId_idx`(`orderId`),
    INDEX `notifications_type_idx`(`type`),
    INDEX `notifications_sentAt_idx`(`sentAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `notifications` ADD CONSTRAINT `notifications_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

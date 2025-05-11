/*
  Warnings:

  - You are about to drop the column `shipping_address` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `shipping_postal_code` on the `orders` table. All the data in the column will be lost.
  - You are about to alter the column `payment_method` on the `orders` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(5))`.

*/
-- AlterTable
ALTER TABLE `orders` DROP COLUMN `shipping_address`,
    DROP COLUMN `shipping_postal_code`,
    ADD COLUMN `building_name` VARCHAR(191) NULL,
    ADD COLUMN `city` VARCHAR(191) NULL,
    ADD COLUMN `postal_code` VARCHAR(191) NULL,
    ADD COLUMN `prefecture` VARCHAR(191) NULL,
    ADD COLUMN `shirtColor` ENUM('white', 'black', 'navy', 'red') NOT NULL DEFAULT 'white',
    ADD COLUMN `street_address` VARCHAR(191) NULL,
    MODIFY `payment_method` ENUM('credit_card', 'line_pay', 'convenience_store', 'bank_transfer') NULL;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `line_user_id` VARCHAR(191) NOT NULL,
    `display_name` VARCHAR(191) NULL,
    `profile_image_url` VARCHAR(191) NULL,
    `status` ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_line_user_id_key`(`line_user_id`),
    INDEX `users_line_user_id_idx`(`line_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `images` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `original_image_path` VARCHAR(191) NOT NULL,
    `ghibli_image_path` VARCHAR(191) NULL,
    `tshirt_preview_path` VARCHAR(191) NULL,
    `status` ENUM('pending', 'processing', 'completed', 'failed') NOT NULL DEFAULT 'pending',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `images_user_id_idx`(`user_id`),
    INDEX `images_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `image_id` INTEGER NOT NULL,
    `order_number` VARCHAR(191) NOT NULL,
    `status` ENUM('pending', 'paid', 'processing', 'printing', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'pending',
    `shirtSize` ENUM('XS', 'S', 'M', 'L', 'XL', 'XXL') NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `price` DECIMAL(10, 2) NOT NULL,
    `shipping_address` VARCHAR(191) NULL,
    `shipping_postal_code` VARCHAR(191) NULL,
    `recipient_name` VARCHAR(191) NULL,
    `recipient_phone` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `payment_id` VARCHAR(191) NULL,
    `payment_method` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `orders_order_number_key`(`order_number`),
    INDEX `orders_order_number_idx`(`order_number`),
    INDEX `orders_status_idx`(`status`),
    INDEX `orders_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `images` ADD CONSTRAINT `images_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_image_id_fkey` FOREIGN KEY (`image_id`) REFERENCES `images`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

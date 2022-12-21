-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `name` VARCHAR(191) NOT NULL,
    `hash` LONGTEXT NULL,
    `salt` VARCHAR(191) NULL,
    `userTier` ENUM('GOD', 'CIVILIAN') NULL DEFAULT 'CIVILIAN',

    UNIQUE INDEX `User_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Account` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `balance` DECIMAL(65, 30) NULL DEFAULT 0.00,
    `userId` INTEGER NOT NULL,
    `tag` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Account_tag_key`(`tag`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TransactionEntry` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `description` VARCHAR(191) NOT NULL,
    `debitAmount` DECIMAL(65, 30) NOT NULL DEFAULT 0.0,
    `creditAmount` DECIMAL(65, 30) NOT NULL DEFAULT 0.0,
    `debitAccountID` INTEGER NULL,
    `creditAccountID` INTEGER NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `transactionReference` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(65, 30) NOT NULL DEFAULT 0.0,
    `gateway` ENUM('PAYSTACK', 'FLUTTERWAVE') NOT NULL,
    `status` ENUM('PENDING', 'FULFILLED') NOT NULL DEFAULT 'PENDING',
    `userId` INTEGER NOT NULL,

    UNIQUE INDEX `Payment_transactionReference_key`(`transactionReference`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Account` ADD CONSTRAINT `Account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransactionEntry` ADD CONSTRAINT `TransactionEntry_debitAccountID_fkey` FOREIGN KEY (`debitAccountID`) REFERENCES `Account`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TransactionEntry` ADD CONSTRAINT `TransactionEntry_creditAccountID_fkey` FOREIGN KEY (`creditAccountID`) REFERENCES `Account`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

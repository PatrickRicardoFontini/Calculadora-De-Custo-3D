-- AlterTable
ALTER TABLE `usuarios` ADD COLUMN `resetTokenExpira` DATETIME(3) NULL,
    ADD COLUMN `resetTokenHash` VARCHAR(191) NULL;

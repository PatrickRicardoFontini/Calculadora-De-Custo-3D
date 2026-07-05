-- AlterTable
ALTER TABLE `orcamentos` ADD COLUMN `margemExtras` DECIMAL(5, 2) NULL;

-- AlterTable
ALTER TABLE `usuarios` ADD COLUMN `margemExtrasPadrao` DECIMAL(5, 2) NULL;

-- CreateTable
CREATE TABLE `orcamento_extras` (
    `id` VARCHAR(191) NOT NULL,
    `orcamentoId` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NOT NULL,
    `valorCusto` DECIMAL(10, 2) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `orcamento_extras` ADD CONSTRAINT `orcamento_extras_orcamentoId_fkey` FOREIGN KEY (`orcamentoId`) REFERENCES `orcamentos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

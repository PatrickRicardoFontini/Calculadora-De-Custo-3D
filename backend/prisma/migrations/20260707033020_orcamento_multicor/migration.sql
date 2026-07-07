-- CreateTable
CREATE TABLE `orcamento_filamento_extras` (
    `id` VARCHAR(191) NOT NULL,
    `orcamentoId` VARCHAR(191) NOT NULL,
    `filamentoId` VARCHAR(191) NOT NULL,
    `pesoUsadoG` DECIMAL(10, 2) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `orcamento_filamento_extras` ADD CONSTRAINT `orcamento_filamento_extras_orcamentoId_fkey` FOREIGN KEY (`orcamentoId`) REFERENCES `orcamentos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orcamento_filamento_extras` ADD CONSTRAINT `orcamento_filamento_extras_filamentoId_fkey` FOREIGN KEY (`filamentoId`) REFERENCES `filamentos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

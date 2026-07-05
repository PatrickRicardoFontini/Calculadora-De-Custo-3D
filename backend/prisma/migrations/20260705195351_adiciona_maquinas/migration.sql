-- AlterTable
ALTER TABLE `orcamentos` ADD COLUMN `maquinaId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `usuarios` ADD COLUMN `margemPadrao` DECIMAL(5, 2) NULL,
    ADD COLUMN `precoKwh` DECIMAL(10, 4) NULL;

-- CreateTable
CREATE TABLE `maquinas` (
    `id` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `potenciaWatts` DECIMAL(10, 2) NOT NULL,
    `precoCompra` DECIMAL(10, 2) NOT NULL,
    `vidaUtilHoras` DECIMAL(10, 2) NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `maquinas` ADD CONSTRAINT `maquinas_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orcamentos` ADD CONSTRAINT `orcamentos_maquinaId_fkey` FOREIGN KEY (`maquinaId`) REFERENCES `maquinas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

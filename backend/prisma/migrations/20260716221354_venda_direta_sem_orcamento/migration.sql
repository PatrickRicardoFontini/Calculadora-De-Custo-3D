-- DropForeignKey
ALTER TABLE `vendas` DROP FOREIGN KEY `vendas_orcamentoId_fkey`;

-- AlterTable
ALTER TABLE `vendas` ADD COLUMN `clienteId` VARCHAR(191) NULL,
    ADD COLUMN `descricao` VARCHAR(191) NULL,
    MODIFY `orcamentoId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `vendas` ADD CONSTRAINT `vendas_orcamentoId_fkey` FOREIGN KEY (`orcamentoId`) REFERENCES `orcamentos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendas` ADD CONSTRAINT `vendas_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clientes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

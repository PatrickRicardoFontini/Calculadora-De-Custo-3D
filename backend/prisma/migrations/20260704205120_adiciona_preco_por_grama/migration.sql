-- AlterTable
ALTER TABLE `filamentos` ADD COLUMN `precoPorGrama` DECIMAL(10, 4) NULL;

-- AlterTable
ALTER TABLE `movimento_estoque` ADD COLUMN `precoPago` DECIMAL(10, 2) NULL;

-- DataMigration: preenche precoPorGrama dos filamentos existentes com base na compra original
-- (precoPago / pesoTotalG), já que daqui pra frente a aplicação sempre grava esse campo direto
UPDATE `filamentos` SET `precoPorGrama` = `precoPago` / `pesoTotalG` WHERE `pesoTotalG` != 0;

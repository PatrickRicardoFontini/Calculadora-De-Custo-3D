-- AlterTable: adiciona a nova coluna antes de migrar os dados
ALTER TABLE `movimento_estoque` ADD COLUMN `precoPorKg` DECIMAL(10, 2) NULL;

-- DataMigration: converte o valor total pago (precoPago) da compra registrada em cada
-- reabastecimento para preço por kg, preservando o significado histórico do dado
-- (precoPago antigo era o total pago por quantidadeG gramas)
UPDATE `movimento_estoque`
SET `precoPorKg` = `precoPago` * 1000 / `quantidadeG`
WHERE `precoPago` IS NOT NULL;

-- AlterTable: remove as colunas que não existem mais no schema
ALTER TABLE `movimento_estoque` DROP COLUMN `precoPago`;
ALTER TABLE `filamentos` DROP COLUMN `precoPago`;

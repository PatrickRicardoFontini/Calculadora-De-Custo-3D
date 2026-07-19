-- AlterTable
ALTER TABLE `vendas` ADD COLUMN `dataPagamento` DATETIME(3) NULL,
    ADD COLUMN `pago` BOOLEAN NOT NULL DEFAULT false;

-- DataMigration: vendas que já existiam antes desse campo existir são presumidas como já
-- resolvidas (pago=true), com dataPagamento igual à própria dataVenda. Só vendas novas,
-- criadas depois dessa migration, nascem com o default pago=false, exigindo confirmação
-- explícita de que o dinheiro entrou
UPDATE `vendas` SET `pago` = true, `dataPagamento` = `dataVenda`;

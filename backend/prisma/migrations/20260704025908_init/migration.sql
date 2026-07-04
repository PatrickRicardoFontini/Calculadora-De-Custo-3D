-- CreateTable
CREATE TABLE `usuarios` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `senhaHash` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `usuarios_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clientes` (
    `id` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `whatsapp` VARCHAR(191) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `filamentos` (
    `id` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `tipo` VARCHAR(191) NOT NULL,
    `cor` VARCHAR(191) NOT NULL,
    `precoPago` DECIMAL(10, 2) NOT NULL,
    `pesoTotalG` DECIMAL(10, 2) NOT NULL,
    `pesoAtualG` DECIMAL(10, 2) NOT NULL,
    `estoqueMinimoG` DECIMAL(10, 2) NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orcamentos` (
    `id` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `clienteId` VARCHAR(191) NOT NULL,
    `filamentoId` VARCHAR(191) NOT NULL,
    `pesoUsadoG` DECIMAL(10, 2) NOT NULL,
    `horasImpressao` DECIMAL(10, 2) NOT NULL,
    `valorCalculado` DECIMAL(10, 2) NOT NULL,
    `valorAtual` DECIMAL(10, 2) NOT NULL,
    `status` ENUM('PENDENTE', 'ACEITO', 'RECUSADO') NOT NULL DEFAULT 'PENDENTE',
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orcamento_historico` (
    `id` VARCHAR(191) NOT NULL,
    `orcamentoId` VARCHAR(191) NOT NULL,
    `valor` DECIMAL(10, 2) NOT NULL,
    `registradoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vendas` (
    `id` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `orcamentoId` VARCHAR(191) NOT NULL,
    `valorFinal` DECIMAL(10, 2) NOT NULL,
    `dataVenda` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `vendas_orcamentoId_key`(`orcamentoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `movimento_estoque` (
    `id` VARCHAR(191) NOT NULL,
    `filamentoId` VARCHAR(191) NOT NULL,
    `vendaId` VARCHAR(191) NULL,
    `quantidadeG` DECIMAL(10, 2) NOT NULL,
    `tipo` ENUM('ENTRADA', 'SAIDA') NOT NULL,
    `data` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `clientes` ADD CONSTRAINT `clientes_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `filamentos` ADD CONSTRAINT `filamentos_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orcamentos` ADD CONSTRAINT `orcamentos_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orcamentos` ADD CONSTRAINT `orcamentos_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `clientes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orcamentos` ADD CONSTRAINT `orcamentos_filamentoId_fkey` FOREIGN KEY (`filamentoId`) REFERENCES `filamentos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orcamento_historico` ADD CONSTRAINT `orcamento_historico_orcamentoId_fkey` FOREIGN KEY (`orcamentoId`) REFERENCES `orcamentos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendas` ADD CONSTRAINT `vendas_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vendas` ADD CONSTRAINT `vendas_orcamentoId_fkey` FOREIGN KEY (`orcamentoId`) REFERENCES `orcamentos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimento_estoque` ADD CONSTRAINT `movimento_estoque_filamentoId_fkey` FOREIGN KEY (`filamentoId`) REFERENCES `filamentos`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movimento_estoque` ADD CONSTRAINT `movimento_estoque_vendaId_fkey` FOREIGN KEY (`vendaId`) REFERENCES `vendas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

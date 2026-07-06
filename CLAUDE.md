# Calculadora de custos para impressão 3D

## Visão geral

Produto multi-tenant pra makers de impressão 3D: calculadora de orçamento, controle de
estoque de filamento, orçamento com negociação, venda automática com baixa de estoque, e
receita mensal. Objetivo é vender pra outros makers, não é só uso pessoal. Existem
concorrentes diretos no Brasil (3D Control, PrintWorks3D, Precifi3D) e internacionais
(3D Print Manager, PrintFarmHQ), então o diferencial é nicho (maker solo com uma
impressora, não frota) e o fluxo específico de negociação com histórico e texto pronto
pro WhatsApp.

## Stack

- Backend: Node.js, Express, TypeScript, Prisma, MySQL — pasta /backend
- Frontend: React, TypeScript, Vite — pasta /frontend, projeto separado, fala com o
  backend só via fetch/REST
- Ambiente local: MySQL via XAMPP, localhost:3306, usuário root sem senha, banco
  calculadora_custos
- Ainda sem deploy, roda só localmente

## Decisões arquiteturais — não reverter sem avisar o dono do projeto

- `Filamento.precoPorGrama` é um campo direto, não derivado de preço/peso total.
  Reabastecer pede preço por kg (não valor total pago), recalcula precoPorGrama a partir
  só da compra mais recente, sem média ponderada
- `Filamento.pesoTotalG` significa total histórico comprado (soma de tudo, inclusive
  reabastecimentos), não entra em nenhum cálculo de preço
- `Orcamento.status` só tem PENDENTE, ACEITO, RECUSADO. Não existe status "NEGOCIADO":
  negociação é um novo registro em `OrcamentoHistorico` enquanto o orçamento continua
  PENDENTE
- Orçamento recusado nunca é excluído, só muda de status
- Energia e depreciação de `Maquina` são sempre calculadas na hora (potência ÷ 1000 ×
  preço do kWh; preço de compra ÷ vida útil em horas), nunca armazenadas prontas, pra não
  ficar desatualizado se o preço do kWh mudar
- Receita mensal é uma agregação calculada na hora em cima de `Venda`, não é tabela
  própria
- Autenticação é JWT (não sessão com cookie), token no localStorage do frontend. Toda
  rota é multi-tenant, sempre filtrada pelo usuarioId do usuário autenticado
- Excluir Filamento ou Maquina com registro vinculado nunca pode deixar um erro de banco
  não tratado derrubar o servidor inteiro (já aconteceu uma vez). Maquina usa
  `onDelete: SetNull` na relação com Orcamento
- Custos extras (`OrcamentoExtra`) têm margem própria (`Orcamento.margemExtras`),
  separada da margem principal aplicada em filamento+energia+depreciação. Ela é
  travada no momento da criação do orçamento (default vindo de
  `Usuario.margemExtrasPadrao`) e não tem endpoint pra alterar depois — só dá pra
  adicionar/remover item extra, nunca editar. `Orcamento` não guarda
  custoEnergiaHora/taxaDepreciacaoHora/margemPercentual prontos (só o `valorCalculado`
  final), então adicionar/remover extra recalcula por diferença: extrai a parte
  "principal" subtraindo o valor de extras antigo do `valorCalculado` atual, soma o
  valor de extras novo. Cada mudança de extras atualiza `valorCalculado` e `valorAtual`
  juntos e gera um novo registro em `OrcamentoHistorico`, igual à negociação manual de
  valor
- A mensagem de WhatsApp é montada no backend, não mais no frontend: `Usuario.templateWhatsapp`
  guarda um modelo com marcadores ({cliente}, {material}, {peso}, {horas}, {valor},
  {extras}), nulo significa "usar o modelo padrão" (constante `MODELO_PADRAO_WHATSAPP`).
  Existe uma única função de substituição de marcadores (`renderizarMensagemWhatsapp`),
  usada tanto pra prévia (com dados de exemplo, sem precisar salvar o modelo antes) quanto
  pra mensagem real de um orçamento — evita ter a lógica de template duplicada entre
  prévia e envio de verdade

## Já construído e testado

1. Filamento: cadastro com marca (lista nacional/internacional + "outra"), preço por kg,
   estoque com alerta de mínimo, reabastecimento, histórico de movimentação
2. Calculadora de orçamento (filamento, horas, energia, depreciação, margem)
3. Cliente, orçamento com negociação (histórico de valor), aceitar/recusar, mensagem de
   WhatsApp com link wa.me, com modelo customizável por conta (marcadores + prévia)
4. Venda automática ao aceitar, com baixa de estoque em transação atômica, sem bloquear
   se o estoque ficar insuficiente
5. Receita mensal com histórico de vendas filtrável por mês
6. Máquina (impressora): CRUD completo, lista de modelos comuns pré-preenchendo potência
7. Autenticação real (registro, login, JWT), substituindo o usuário fixo de seed
8. Custos extras no orçamento: itens avulsos (descrição + custo) com margem própria,
   somados ao valor final; adicionar/remover só com orçamento PENDENTE, texto do
   WhatsApp lista o que está incluso

## Pendente

- Auditoria de tratamento de erro nas rotas que ainda seguem o padrão antigo (clientes,
  orçamentos, receita), garantindo que nenhuma derruba o servidor num erro de banco não
  tratado
- Ainda sem verificação de email, recuperação de senha, rate limiting de login
- Ainda sem validação com outros makers reais (decisão consciente do dono do projeto até
  agora, priorizando funcionalidade)
- Ainda sem deploy

## Convenções

- Nomes de campo, rotas e mensagens de erro em português
- Cada funcionalidade nova chega aqui como um prompt já definido, vindo de uma sessão de
  planejamento anterior. Se algo no prompt não bater com o que já existe no código, parar
  e perguntar antes de assumir

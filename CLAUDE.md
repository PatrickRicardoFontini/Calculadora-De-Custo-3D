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

## Identidade visual — vale pra toda tela nova daqui pra frente

- Sistema de design "cinza-verde": paleta e tipografia vêm de arquivos de referência
  HTML standalone, guardados em `/design-reference` (só o tema escuro,
  `proposta-visual-v5e-cinzaverde-escuro.html`, foi efetivamente recebido nesta sessão;
  o tema claro foi derivado das variáveis de cor passadas em texto, já que o arquivo
  `proposta-visual-v5d-cinzaverde-claro.html` não chegou a ser anexado — vale a pena
  conferir com o dono do projeto se algum dia esse arquivo aparecer). Esses arquivos são
  a fonte da verdade visual — qualquer dúvida de cor/estilo de cartão se resolve olhando
  eles, não este resumo
- Tema claro/escuro via atributo `data-theme` na tag `<html>` ("light"/"dark"), lido de
  `localStorage` (chave "tema") com prioridade sobre `prefers-color-scheme` do sistema,
  que só vale no primeiro acesso sem escolha salva. Todas as cores são variáveis CSS
  (`frontend/src/index.css`); estrutura (espessura de borda 3px, raio de canto 14px,
  sombra `4px 4px 0 var(--border)`) é fixa e igual nos dois temas — só a cor muda,
  nunca redesenha o componente
- Verde é reservado pra marca (logo "calc3d", item de menu ativo) e status "aceito";
  dourado é sempre "pendente"; vermelho/coral é sempre "recusado" ou erro. Não usar
  verde em botão qualquer só porque é a cor de destaque — dilui o significado. Por
  isso "Abrir no WhatsApp" usa estilo neutro/secundário, não o verde da marca do
  WhatsApp
- Fredoka (500/600) pra títulos, logo, nome de seção e rótulo de card; IBM Plex Sans
  (400/500) pro corpo e formulário; Space Mono (700) pra todo número exibido (preço,
  peso, hora, percentual) — classe utilitária `.numero`, aplicada manualmente span por
  span onde um valor numérico aparece misturado com texto de rótulo
  (nunca no texto inteiro de um parágrafo)
- Navegação é barra lateral fixa (`.sidebar`), não mais abas horizontais — logo no
  topo, itens principais empilhados, Sair e alternador de tema juntos embaixo,
  separados por divisória
- Botões têm três variantes só: primário (`.botao-primario`, verde, ação principal
  tipo Salvar/Calcular/Aceitar), secundário (`.botao-secundario`, neutro) e perigo
  (`.botao-perigo`, vermelho preenchido, tipo Excluir/Recusar/Remover) — mesma
  borda/canto do cartão nos três casos

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
- `Orcamento.nome` é o único campo do orçamento editável em qualquer status (PUT
  /orcamentos/:id/nome não exige PENDENTE), porque é só organização/identificação, não
  mexe em valor nem gera registro de histórico — diferente de valor e extras, que só
  podem mudar enquanto o orçamento está pendente. O backend nunca gera sugestão de nome
  sozinho, só salva o que vier no campo; a sugestão (tipo + cor do filamento) é
  responsabilidade do frontend antes de enviar

## Já construído e testado

1. Filamento: cadastro com marca (lista nacional/internacional + "outra"), preço por kg,
   estoque com alerta de mínimo, reabastecimento, histórico de movimentação
2. Calculadora de orçamento (filamento, horas, energia, depreciação, margem)
3. Cliente, orçamento com nome (sugerido a partir do filamento, editável a qualquer
   momento) como identificador principal na lista, negociação (histórico de valor),
   aceitar/recusar, mensagem de WhatsApp com link wa.me, com modelo customizável por
   conta (marcadores + prévia)
4. Venda automática ao aceitar, com baixa de estoque em transação atômica, sem bloquear
   se o estoque ficar insuficiente
5. Receita mensal com histórico de vendas filtrável por mês
6. Máquina (impressora): CRUD completo, lista de modelos comuns pré-preenchendo potência
7. Autenticação real (registro, login, JWT), substituindo o usuário fixo de seed
8. Custos extras no orçamento: itens avulsos (descrição + custo) com margem própria,
   somados ao valor final; adicionar/remover só com orçamento PENDENTE, texto do
   WhatsApp lista o que está incluso
9. Identidade visual "cinza-verde" com tema claro/escuro alternável, aplicada em todas
   as telas (login, registro, estoque, calculadora, orçamentos, máquinas, receita),
   com barra lateral de navegação substituindo as abas horizontais

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

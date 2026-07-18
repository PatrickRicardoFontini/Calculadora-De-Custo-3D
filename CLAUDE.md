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

## Responsividade — vale pra toda tela nova daqui pra frente

- Breakpoint único em 768px (`@media (max-width: 768px)`), sem variáveis CSS
  (custom properties não funcionam dentro de condição de media query, tem que ser
  literal em cada regra)
- Navegação: abaixo do breakpoint, a `.sidebar` some por padrão e vira gaveta —
  `position: fixed`, `transform: translateX(-100%)`, desliza pra dentro com a classe
  `.sidebar-aberta` quando aberta, com um `.overlay-gaveta` escurecido atrás que fecha
  a gaveta ao tocar. Uma `.barra-mobile` fixa aparece no topo só nesse breakpoint, com
  botão hamburguer e o rótulo da aba atual. **É a mesma `<aside className="sidebar">`
  e o mesmo `<nav className="nav-principal">` do desktop, só muda de posição/exibição
  via CSS e uma classe condicional — nunca duplicar esse componente.** Selecionar um
  item do menu fecha a gaveta (`selecionarAba` em `App.tsx`). Scroll do body trava
  (`document.body.style.overflow = "hidden"`) enquanto a gaveta está aberta
- Qualquer grid/formulário lado a lado vira 1 coluna abaixo do breakpoint: `.formulario`
  (grid principal usado em todo cadastro) e `.grupo-config` (bloco de configuração da
  Máquinas) têm `grid-template-columns: 1fr` nesse breakpoint. Linhas flexíveis com
  múltiplos campos/botões (`.painel-inline`, `.edicao-valor`, `.edicao-nome`,
  `.filtros-status`, `.card-orcamento-cabecalho`) têm `flex-wrap: wrap` sempre (não só
  no breakpoint), e os inputs de largura fixa dentro delas têm `max-width: 100%` de
  segurança
- Texto e containers: `overflow-wrap: break-word` está no `body` (`index.css`) e vale
  por herança pra qualquer texto novo, não precisa repetir por componente — só reforçar
  explicitamente em `pre`/textos que já têm regra própria de `white-space`
- Filamentos (Estoque) não usa mais tabela: é `.lista-filamentos`/`.card-filamento`
  (mesmo padrão de cartão do `.card-orcamento`) sempre, em qualquer largura — não existe
  mais o caso especial de tabela-vira-cartão-só-no-mobile que essa tela tinha antes. As
  outras (Máquinas, Receita, detalhamento da Calculadora) continuam usando o fallback
  mais simples abaixo
- Qualquer outra tabela (`.tabela`) só ganha scroll horizontal controlado abaixo do
  breakpoint: envolver em `<div className="tabela-scroll">`, que aplica
  `overflow-x: auto` e `white-space: nowrap` nas células só nesse breakpoint — não
  força `min-width`, deixa o conteúdo real decidir se cabe ou não

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
- Orçamento multi-cor: `Orcamento.filamentoId`/`pesoUsadoG` continuam sendo a cor
  principal, sem mudar. Cada cor adicional é uma linha em `OrcamentoFilamentoExtra`
  (orcamentoId, filamentoId, pesoUsadoG) — não existe campo "é multi-cor" separado, é só
  inferido pela existência de linhas ali. `calcularCusto` (calculo.ts) ganhou um 5º
  parâmetro opcional `itensFilamentoExtras`; sem ele o comportamento é idêntico ao de
  antes (cor única), então nada que já existia mudou. A validação e a busca dos
  filamentos de `coresAdicionais` são compartilhadas (`lib/coresAdicionais.ts`) entre
  `POST /calculadora` (prévia) e `POST /orcamentos` (criação), pra não duplicar a lógica
  entre os dois
- **Cores só são definidas na criação do orçamento, não são editáveis depois** (ao
  contrário de custos extras, que continuam editáveis com o orçamento pendente). Motivo:
  o custo de cada cor entra com a MESMA margemPercentual do resto (energia/depreciação),
  e essa margem só está disponível na hora da criação (não fica guardada no Orçamento,
  só o `valorCalculado` final — mesma razão de energia/depreciação não guardadas).
  Sem a margem, não tem como recalcular o valor com precisão se uma cor for
  adicionada/removida depois; uma tentativa anterior de contornar isso aplicando o custo
  puro (sem markup) na edição pós-criação foi revertida por criar um furo real de
  precificação. Diferente de `OrcamentoExtra`, que tem sua própria `margemExtras`
  guardada e por isso consegue recalcular corretamente a qualquer momento — decidir quais
  materiais compõem a peça é decisão de antes de imprimir, custo extra (acessório) é do
  tipo que se negocia depois. Não existem endpoints de adicionar/remover cor após a
  criação
- Ao aceitar (PUT /orcamentos/:id/status), cada filamento envolvido (principal + cada
  cor) gera seu próprio `MovimentoEstoque` de saída e desconta seu próprio `pesoAtualG`;
  o aviso de estoque baixo considera todos eles, não só o principal. `{material}` e
  `{peso}` na mensagem de WhatsApp somam/listam todas as cores quando há mais de uma
- Todo handler de rota assíncrono é envolvido por `asyncHandler` (`lib/asyncHandler.ts`),
  que encaminha qualquer erro pra `next(err)`. Existe um middleware de erro central em
  `server.ts` (precisa ser o último registrado) que loga o erro completo no servidor mas
  só responde um erro genérico ("Requisição inválida" pra 4xx, "Erro interno do
  servidor" pra 5xx) — nunca stack trace, mensagem crua do Prisma ou caminho de arquivo
  na resposta HTTP. Sem isso, Express 4 deixa uma rejeição de promise não tratada
  derrubar o processo inteiro (não só a requisição que falhou), o que afetaria todos os
  usuários, não só quem disparou o erro
- CORS lê `ALLOWED_ORIGIN` do `.env` (default `http://localhost:5173`), em vez de aberto
  pra qualquer origem. Ajustar essa variável no ambiente de produção quando o frontend
  for hospedado em domínio próprio
- Login e registro compartilham um único limite de 10 tentativas por 15 minutos por IP
  (`express-rate-limit`, mesma instância aplicada às duas rotas — não são dois
  orçamentos de 10+10 separados), pra dificultar força bruta de senha
- `Usuario.senhaHash` nunca é buscado do banco fora do login: rotas que retornam dados
  de usuário (`registro`, `GET /me`, `PUT /configuracoes`) usam o `select` compartilhado
  `USUARIO_SELECT_SEGURO` (`lib/usuarioSelect.ts`), que exclui o campo estruturalmente
  em vez de depender de lembrar de tirá-lo manualmente da resposta
- `POST /auth/registro` não tem nenhum caminho de "assumir" uma conta existente (havia
  uma lógica antiga ligada à conta placeholder do seed que permitia registrar por cima
  de um hash de senha inválido) — email já cadastrado sempre retorna 409, sem exceção. A
  conta placeholder do seed (`default@calculadora.local`) serve só pra inspecionar dados
  direto no banco, não loga nem aceita registro por cima dela
- Campo de senha (visualizar/esconder + indicador de força) é um componente único
  reutilizável, `CampoSenha` (`frontend/src/components/CampoSenha.tsx`), usado em Login,
  Registro e Redefinir senha — nunca duplicar o campo cru nessas telas. O indicador de
  força (`lib/forcaSenha.ts`) é uma heurística própria (tamanho + variedade de
  caractere), só visual via prop `mostrarForca`; não bloqueia envio, o mínimo de 8
  caracteres continua sendo a única regra que impede
- Redefinição de senha: `Usuario.resetTokenHash`/`resetTokenExpira` guardam o hash
  SHA-256 de um token aleatório de 32 bytes (não o token em si, e não é bcrypt — o token
  já é alta entropia, diferente de senha escolhida por humano), com validade de 1 hora.
  `POST /auth/esqueci-senha` sempre responde a mesma mensagem genérica, exista ou não o
  email, pra não revelar quais emails estão cadastrados; só gera token e manda email
  quando o usuário existe de verdade. `POST /auth/redefinir-senha` confere o hash, a
  validade e limpa os dois campos depois de trocar a senha (com bcrypt, como já era),
  invalidando o token pra sempre — não existe reuso. `esqueci-senha` compartilha o
  limitador de tentativas do login/registro (mesma instância), já que também é uma
  superfície de abuso (spam de email, cota diária do Resend)
- Email transacional via Resend (`lib/email.ts`), remetente configurável por
  `RESEND_FROM_EMAIL` (default `onboarding@resend.dev`, que funciona sem verificar
  domínio mas só entrega pro email da própria conta Resend — trocar por um remetente de
  domínio verificado antes de abrir pra outros makers, senão o email de redefinição não
  chega pra ninguém além do dono da conta Resend). O link do email usa `ALLOWED_ORIGIN`
  pra montar a URL do frontend (mesma variável do CORS, já que representa a mesma
  origem — sem criar uma segunda variável redundante)
- O link de redefinição aponta pra uma URL de verdade (`/redefinir-senha?token=...`),
  não pra uma rota de um router client-side (o projeto não tem um). `App.tsx` detecta
  esse caminho no primeiro carregamento (`window.location.pathname`) pra abrir a tela
  direto, e limpa a URL (`history.replaceState`) ao voltar pro login
- O backend Express também sabe servir o frontend compilado (`express.static` +
  rota coringa devolvendo `index.html` pra qualquer caminho fora de `/api/`, em
  `server.ts`), pra testar tudo atrás de um único túnel (Cloudflare Tunnel) numa porta
  só, sem hospedagem. Isso só ativa se a pasta `frontend/dist` existir no disco
  (`fs.existsSync`) — sem build feito, o backend se comporta exatamente como antes, os
  dois processos separados (`vite dev` + `tsx watch`) continuam sendo o fluxo normal do
  dia a dia. A rota coringa exclui explicitamente caminhos começando com `/api/`, pra um
  endpoint inexistente continuar dando 404 em vez de devolver a página HTML por engano
- `frontend/src/api/client.ts`'s `API_URL` verifica especificamente `!== undefined`
  (não uma checagem de falsy tipo `||`), porque uma string vazia definida de propósito
  em `VITE_API_URL` significa "caminho relativo, sem domínio fixo" — necessário no modo
  consolidado, onde quem abre o link do túnel roda o app no aparelho dele, não no
  computador de quem hospeda, então `localhost` seria endereço errado. `frontend/.env.production`
  fixa `VITE_API_URL=/api` (relativo, mas mantendo o prefixo `/api` que as rotas do
  backend exigem) — assim um `npm run build` puro já produz o build certo pro modo
  consolidado, sem precisar passar variável de ambiente na mão. `.env` (usado por
  `vite dev`) continua com a URL absoluta de sempre, então o fluxo de desenvolvimento
  normal não muda
- `Filamento.corHex` é opcional (String, tipo `#RRGGBB`, validado por regex no backend),
  preenchido por um `<input type="color">` ao lado do campo de texto `cor` (que continua
  sendo o nome livre, tipo "Verde Militar" — os dois campos coexistem, um não substitui
  o outro). Filamento sem `corHex` (todo cadastro anterior a essa mudança) mostra um
  indicador cinza neutro (`var(--text-secondary)`) em vez de tentar adivinhar a cor pelo
  nome. **Cor só é editável isoladamente após a criação** — clicar no indicador do
  cartão abre um seletor de cor inline que só manda `corHex` pro `PUT /filamentos/:id`
  (que já aceitava o campo desde a criação do endpoint, só não tinha UI pra isso); não
  existe tela de edição geral de filamento (tipo/marca/preço não são editáveis depois de
  criados, só via Reabastecer pra preço/estoque) — decisão consciente do dono do projeto
  pra manter o escopo mínimo necessário
- Ajuda contextual pra quem não conhece o vocabulário do negócio: componente `Dica`
  (`frontend/src/components/Dica.tsx`), um ícone "?" que mostra um texto curto ao passar
  o mouse ou tocar/clicar (os dois gatilhos juntos, não só hover, porque hover sozinho
  não é confiável em touch). Isso é orientação de conteúdo pra usuário leigo, não
  acessibilidade técnica (leitor de tela, navegação por teclado) — não confundir os dois
  tipos de trabalho se um dia isso for revisitado. Nos campos de energia/depreciação por
  hora da Calculadora, a dica só aparece quando nenhuma máquina está selecionada
  (`!maquinaId`), já que depois de selecionar uma máquina os campos preenchem sozinhos e
  a dica perde o sentido
- "Conta nova" (pra decidir se mostra a mensagem de boas-vindas) é um sinal calculado no
  frontend — zero filamentos e zero orçamentos ao carregar `App.tsx` — não um campo
  salvo no banco, conforme pedido explicitamente. A dispensa da mensagem (pra não voltar
  a aparecer depois de fechada, mesmo que a conta continue "nova" nesse sentido) é
  persistida em `localStorage` por conta (`boasVindasVista_{usuarioId}`), verificada
  antes de sequer buscar filamentos/orçamentos — uma conta já dispensada, ou qualquer
  conta com algum dado, nunca dispara essas duas requisições extras no login
- `PUT /orcamentos/:id/cliente` troca o cliente do orçamento, independente do status
  (pendente, aceito ou recusado) — mesmo raciocínio de `Orcamento.nome`: identidade do
  cliente é só organização/identificação, não afeta valor nem gera registro de
  histórico. Aceita `clienteId` de um cliente existente ou `clienteNome`/`clienteWhatsapp`
  pra criar um novo na hora, mesmo padrão flexível já usado em `POST /orcamentos`.
  Validação e ownership check foram extraídos pra `lib/clienteOrcamento.ts`
  (`validarClienteInput` e `clienteExistente`), compartilhados entre os dois endpoints,
  seguindo o mesmo padrão já estabelecido em `lib/coresAdicionais.ts`: a checagem de posse
  do `clienteId` roda fora da `$transaction`, com `return res.status(404)` direto — nunca
  `throw` de dentro da transação, porque o middleware de erro central só devolve mensagem
  genérica ("Requisição inválida") pra qualquer erro lançado, o que apagaria a mensagem
  específica "Cliente não encontrado"
- `DELETE /orcamentos/:id` só exclui enquanto o status for PENDENTE, devolvendo erro
  claro ("Só é possível excluir orçamentos pendentes") caso contrário. Motivo: aceito já
  tem venda e baixa de estoque reais vinculadas (apagar destruiria registro financeiro,
  fora de escopo); recusado continua protegido por ser dado de negócio (taxa de
  conversão, histórico), não erro de digitação — mesma proteção de sempre. Como nenhuma
  das tabelas filhas (`OrcamentoHistorico`, `OrcamentoExtra`, `OrcamentoFilamentoExtra`)
  tem `onDelete: Cascade` no schema, a exclusão apaga as três manualmente antes do
  `Orcamento`, num único `prisma.$transaction([...])` em array-form (mesmo padrão do
  DELETE de `Filamento`). `Venda`/`MovimentoEstoque` não entram nessa limpeza porque só
  existem depois do aceite (status ACEITO), então nunca existem pra um orçamento PENDENTE
- `Venda.orcamentoId` é opcional (`String?`), pra permitir venda lançada direto (sem
  passar pelo fluxo de calcular/criar orçamento) — já tem a peça pronta em estoque e
  vendeu por um valor combinado. `Venda` ganhou `clienteId` (opcional, relação direta com
  `Cliente`, separada da relação indireta via `Orcamento`) e `descricao` (só preenchida
  quando não vem de orçamento, já que com orçamento o material já descreve o que foi
  vendido). Não existe `filamentoId`/`pesoUsadoG` direto em `Venda`: o material de uma
  venda direta com desconto de estoque é lido através do próprio `MovimentoEstoque`
  vinculado (`Venda.movimentos`), evitando um campo redundante
- A lógica de baixa de estoque (criar `MovimentoEstoque` de saída, decrementar
  `Filamento.pesoAtualG`, checar se ficou abaixo do mínimo) foi extraída pra
  `lib/estoque.ts` (`descontarEstoque` e `calcularEstoqueBaixo`), compartilhada entre o
  aceite de orçamento (`PUT /orcamentos/:id/status`) e `POST /vendas` — não duplica a
  mesma transação em dois lugares
- `validarClienteInput` (`lib/clienteOrcamento.ts`) ganhou um terceiro parâmetro opcional
  `{ obrigatorio }` (default `true`, preservando o comportamento de sempre em
  `POST /orcamentos` e `PUT /orcamentos/:id/cliente`): em `POST /vendas` o cliente é
  totalmente opcional (`{ obrigatorio: false }`), então "nem clienteId nem clienteNome"
  não é erro nesse caso — só valida o formato de clienteNome/clienteWhatsapp quando um
  dos dois é de fato informado
- `POST /vendas` aceita no máximo um filamento (sem suporte a multi-cor, que continua
  exclusivo do fluxo de orçamento) — `filamentoId` e `pesoUsadoG` juntos são opcionais
  como um par: informar só um dos dois é erro de validação. Quando vem `dataVenda` (do
  `<input type="date">`, formato `YYYY-MM-DD`), o backend monta a data via componentes
  numéricos (`new Date(ano, mes-1, dia)`, meia-noite local) em vez de `new Date(string)`
  (que interpreta string de data pura como meia-noite UTC): isso evitava que a data
  exibida "voltasse" um dia pra quem está num fuso atrás de UTC, como o Brasil
- `GET /receita/vendas` agora lida com dois formatos de venda na mesma resposta: quando
  `venda.orcamento` existe, os campos vêm dele como sempre (cliente, filamento, horas,
  valorCalculado); quando não existe (venda direta), `clienteNome`/`descricao` vêm da
  própria `Venda` e o material (quando houve desconto de estoque) vem do primeiro
  `MovimentoEstoque` vinculado — `horasImpressao` e `valorCalculado` ficam `null` nesse
  caso, já que só fazem sentido pra um orçamento calculado. A resposta também expõe
  `orcamentoId` e `clienteId` crus (além dos campos já derivados/formatados), pro
  frontend decidir o que é editável e pré-preencher o formulário de edição sem precisar
  de uma segunda requisição
- `PUT /vendas/:id` edita `valorFinal` e `dataVenda` em qualquer venda (não mexe em
  estoque nem gera histórico — `Venda` não tem um `OrcamentoHistorico` equivalente).
  `descricao` e cliente (`clienteId`/`clienteNome`/`clienteWhatsapp`) só são aceitos
  quando `orcamentoId` é nulo (venda direta); mandar esses campos numa venda vinda de
  orçamento é erro 400 explícito ("só podem ser editados em vendas lançadas
  diretamente"), porque cliente de uma venda-de-orçamento já é gerenciado do lado do
  orçamento (`PUT /orcamentos/:id/cliente`) — evita ter dois controles pro mesmo dado
- `DELETE /vendas/:id` pode derrubar receita e desfazer desconto de estoque ao mesmo
  tempo, então é feito numa única `$transaction`: se a venda tinha `MovimentoEstoque`
  vinculado (desconto que aconteceu na hora da venda), cria uma nova `ENTRADA` de
  estorno pra cada filamento envolvido (mesma quantidade que saiu) via `estornarEstoque`
  (`lib/estoque.ts`, contraparte de `descontarEstoque`) e incrementa
  `Filamento.pesoAtualG` de volta. A `SAIDA` original não é apagada (continua existindo
  como histórico) — só perde a referência da venda (`vendaId` → `null`), automaticamente
  via `onDelete: SetNull` na relação `MovimentoEstoque.venda` (mesmo padrão já usado em
  `Orcamento.maquinaId`), não precisa de código manual pra isso. Quando a venda vinha de
  um orçamento aceito, o orçamento **não muda de status** — continua ACEITO, porque o
  aceite em si é um fato histórico verdadeiro, a venda é que foi desfeita depois (tipo um
  estorno/reembolso), são coisas diferentes
- `MovimentoEstoque.observacao` (`String?`) guarda o motivo de uma entrada gerada
  automaticamente pelo sistema (hoje só o estorno de venda excluída, texto "Estorno da
  venda excluída em {data}", formato `pt-BR`) — `null` pra toda movimentação manual
  (compra inicial, reabastecimento, saída de venda normal). Aparece no painel "Ver
  movimentações" do Estoque quando presente

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
10. Responsividade completa com breakpoint único em 768px: navegação em gaveta no
    mobile reaproveitando o mesmo componente do desktop, formulários/grids empilhados,
    tabela de filamentos em cartões e demais tabelas com scroll horizontal controlado
11. Orçamento multi-cor: adicionar quantas cores forem necessárias (cada uma com seu
    filamento e peso) na Calculadora antes de calcular/salvar — cores são definidas só
    na criação, não editáveis depois; custo de filamento passa a ser a soma de todas as
    cores usadas (já refletido na prévia de cálculo, não só ao salvar), aceite desconta
    o estoque de cada filamento envolvido, mensagem de WhatsApp lista todos os materiais
12. Auditoria de segurança completa antes de abrir pra outros makers: verificação de
    posse em toda rota por id (nenhuma violação encontrada; um caminho legado de
    "assumir conta" no registro foi removido — ver Decisões arquiteturais), tratamento
    de erro (`asyncHandler` + middleware central em todas as rotas, item que estava
    pendente desde a sessão de autenticação), segredos (`.env` sempre ignorado pelo git,
    nunca commitado, `JWT_SECRET` já era forte), CORS configurável, rate limiting em
    login/registro, `senhaHash` nunca exposto (`USUARIO_SELECT_SEGURO`), confirmação de
    que não existe SQL cru em lugar nenhum (só Prisma), e validação de entrada (sem
    número negativo em campo de preço/peso/margem, limites de tamanho de texto)
13. Campo de senha com visualizar/esconder e indicador de força (fraca/média/forte),
    componente `CampoSenha` reutilizado em Login, Registro e Redefinir senha
14. Recuperação de senha: link "Esqueci minha senha" no Login, email de verdade via
    Resend com link de token de uso único (validade de 1 hora, resposta sempre genérica
    pra não revelar quais emails existem), tela de redefinir senha usando o mesmo
    `CampoSenha`
15. Modo consolidado pra teste via túnel: backend serve o frontend compilado (estático +
    rota coringa de SPA) na mesma porta da API, ativado automaticamente quando
    `frontend/dist` existe. Testado rodando só o backend em `http://localhost:3333` e
    confirmando login, cadastro de filamento, cálculo e criação de orçamento — tudo
    funcionando na porta única, sem quebrar o fluxo normal de dois processos separados
16. Tela de Filamentos cadastrados (Estoque) redesenhada em cartões (`.card-filamento`)
    no lugar da tabela HTML antiga: indicador de cor de verdade (`corHex`, opcional,
    editável isoladamente clicando no círculo), alerta de estoque baixo destacando o
    cartão inteiro (borda esquerda dourada + badge "Estoque baixo"), ações lado a lado
    com Excluir menor/discreto (ícone de lixeira) em vez de competir visualmente com
    Reabastecer/Ver movimentações. Testado com filamento sem `corHex` (mostra indicador
    cinza neutro), com `corHex` escolhido na criação, editando a cor de um já existente,
    e em mobile (375px)
17. Orientação e ajuda contextual pra quem usa a aplicação pela primeira vez: ícone de
    dica em preço do kWh, vida útil da máquina, custo de energia/depreciação por hora
    (só quando preenchidos manualmente, sem máquina selecionada), margem de lucro e
    margem de custos extras; estados vazios com orientação nas abas Estoque (com botão
    que leva ao formulário de cadastro) e Máquinas (deixando claro que é opcional);
    mensagem de boas-vindas na primeira vez (conta sem filamento e sem orçamento), que
    não volta a aparecer depois de fechada. Testado criando uma conta nova de teste:
    mensagem de boas-vindas apareceu, foi fechada e não reapareceu num recarregamento
    seguinte nem passou a aparecer numa conta com dados; dicas testadas em cada campo
    (inclusive o desaparecimento das dicas de energia/depreciação ao selecionar uma
    máquina); estados vazios testados nas duas abas; tudo verificado em mobile também
18. Trocar cliente de um orçamento (qualquer status) e excluir orçamento (só pendente):
    seção "Cliente" no card expandido da aba Orçamentos com edição inline (troca pra
    existente ou cria novo, mesmo padrão existente/novo da Calculadora), botão "Excluir
    orçamento" visível só quando pendente, com confirmação explícita antes de excluir de
    verdade. Testado via script cobrindo os três status (troca de cliente funcionando em
    pendente/aceito/recusado, tanto pra cliente existente quanto criando um novo; exclusão
    bem-sucedida em pendente; exclusão bloqueada com erro claro em aceito e em recusado) e
    depois no navegador (edição de cliente nos três status, botão de excluir aparecendo só
    no pendente, exclusão removendo o orçamento da lista de verdade após confirmação)
19. Venda lançada direto na Receita, sem passar pelo fluxo de calcular/criar orçamento
    (peça que já estava pronta em estoque, vendida por um valor combinado): botão
    "Lançar venda" abre formulário com descrição, valor, data (pré-preenchida com hoje),
    cliente opcional (existente ou novo, mesmo padrão de sempre) e uma opção "Descontar
    do estoque" que, quando marcada, revela filamento + peso usado (no máximo um
    material, sem suporte a multi-cor). Reaproveita a mesma lógica de baixa de estoque já
    usada no aceite de orçamento (`lib/estoque.ts`). Testado via script cobrindo venda
    sem cliente/sem estoque, com cliente existente, com cliente novo + desconto de
    estoque (conferindo a baixa), validação de filamentoId sem pesoUsadoG e de descrição
    ausente, confirmando que o fluxo antigo (orçamento aceito) continua gerando venda
    normalmente e que `GET /receita/vendas` mostra os dois formatos juntos sem quebrar; e
    depois no navegador, testando os três cenários de principal a fim (sem cliente,
    cliente existente, cliente novo com desconto de estoque) e conferindo o desconto real
    na aba Estoque
20. Editar e excluir vendas já registradas na Receita (tanto vindas de orçamento aceito
    quanto vendas diretas): cada linha do histórico ganhou "Editar" (formulário inline
    mostrando valor+data sempre, e descrição+cliente só quando é venda direta) e
    "Excluir" com confirmação explícita, já que exclusão pode mexer em receita e estoque
    ao mesmo tempo. Excluir uma venda com desconto de estoque devolve o estoque (nova
    entrada de estorno, com observação explicando o motivo) sem apagar a saída original;
    excluir a venda de um orçamento aceito não muda o status do orçamento. Testado via
    script cobrindo edição de valor/data/descrição/cliente (existente e novo) numa venda
    direta, edição de só valor/data numa venda de orçamento, rejeição ao tentar editar
    descrição numa venda de orçamento, exclusão com estorno (conferindo o estoque
    devolvido e a movimentação de entrada com a observação certa via "ver
    movimentações"), exclusão sem estoque envolvido, e exclusão de venda de orçamento
    confirmando que ele continua ACEITO depois; e depois no navegador, criando vendas de
    verdade pela UI, editando uma venda direta (valor, data, descrição e cliente novo) e
    conferindo a lista atualizada, confirmando que a edição de uma venda de orçamento só
    mostra valor/data, e validando a exclusão com estorno (via chamada autenticada
    simulando a confirmação, já que o `confirm()` nativo bloqueia automação de
    navegador) conferindo o estoque devolvido e o orçamento permanecendo ACEITO

## Pendente

- Ainda sem verificação de email
- Ainda sem validação com outros makers reais (decisão consciente do dono do projeto até
  agora, priorizando funcionalidade)
- Ainda sem deploy
- Antes de abrir pra outros makers de verdade: verificar um domínio próprio no Resend e
  trocar `RESEND_FROM_EMAIL` — sem isso, o email de redefinição de senha só chega pro
  email da própria conta Resend cadastrada (`onboarding@resend.dev` é só pra teste)

## Convenções

- Nomes de campo, rotas e mensagens de erro em português
- Cada funcionalidade nova chega aqui como um prompt já definido, vindo de uma sessão de
  planejamento anterior. Se algo no prompt não bater com o que já existe no código, parar
  e perguntar antes de assumir

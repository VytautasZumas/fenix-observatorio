# Fenix Observatório

Aplicação estática, sem dependências de compilação. Sirva `dist/` por HTTPS.

Etapa 1: até 10 monitorados e 10 expansões exploratórias; TRX direto e USDT oficial; paginação retomável, deduplicação por hash/tipo/índice do recibo, filtros, grafo SVG com zoom, nós arrastáveis e disposição entradas → monitorados → saídas, regras locais e exportação com SHA-256. IndexedDB mantém um caso neste navegador. Chave TronGrid somente em memória. Fuso inicial America/Sao_Paulo. Nada é enviado a um banco remoto nesta versão.

Coleta: janela fixa até 60 segundos antes da consulta, somente solidificado. Até 3 páginas de 50 registros por fluxo a cada atualização; janelas incompletas continuam na próxima consulta. Após o histórico inicial, sobreposição de 2 minutos. A periodicidade de 5 minutos não é garantia de latência ou disponibilidade. Se a cota for excedida, o cursor é preservado. Recibos token são consultados para recuperar os índices reais dos logs.

O funding inicial pesquisa até 1.000 registros recebidos, fora da janela de monitoramento, em ordem crescente. Não inclui TRX interno, ativação ou delegações. Não atribui controle comum. Recursos e taxas exibidos são da transação inteira.

Seleção para o gráfico: as transações coletadas entram primeiro no explorador, sem marcação; só as marcadas (caixa à esquerda de cada linha, ou a caixa do cabeçalho para todas as filtradas) aparecem no gráfico, e desmarcar remove. O filtro "Marcadas no gráfico / Fora do gráfico" ajuda na triagem. Casos salvos antes desta versão mantêm todas as transações já coletadas marcadas. Explodir (↗ na linha, no painel de inspeção ou "Explodir marcadas") passa a monitorar a contraparte que ainda não está no caso: em saídas, a partir da data da transação; em entradas, desde o início do monitoramento. Vale o limite de 10 expansões, e as transações novas chegam desmarcadas. Cada transação marcada é uma seta própria: várias entre os mesmos dois nós se abrem em arcos; uma única fica reta.

Uso: cadastre endereço com checksum válido e início; informe chave TronGrid em Configurações se necessário; atualize até concluir o histórico; crie regras para os próximos eventos. Alertas não são retroativos. Expansões não disparam alertas, exceto transferências que também envolvam monitorados e sejam coletadas pelo fluxo deles. Exporte o caso antes de limpar o navegador ou trocar de dispositivo. Ao importar, o caso atual é substituído após confirmação. Recibos de detalhe são consultados novamente após importação.

Limites: sem TRX interno, outros tokens, delegação histórica, atribuição automática, conversão para moeda fiduciária, execução com navegador fechado. Grafo exibe até 100 nós, mantendo os demais movimentos na tabela. Janela histórica longa pode consumir muitas consultas e espaço no navegador. Exportação preserva respostas e horários de coleta; hash não autentica a fonte nem estabelece cadeia de custódia por si só.

Etapa 2: coletor agendado, banco remoto, segredo de API no serviço e envio de e-mail pelo servidor para operação contínua.

Validação: `node --check dist/app.js` e `node tests/core.cjs`. As consultas públicas em `/tmp` são fixtures externas de validação, sem dados de usuário. A aparência e o acesso pós-publicação dependem de revisão em navegador.

Posições manuais são mantidas em IndexedDB e no backup. Uma contraparte nos dois sentidos tem duas ocorrências visuais do mesmo endereço. As arestas são agrupadas por origem e destino com setas; a seleção do par mantém os dois sentidos no explorador. Organizar fluxo restaura posições automáticas, Enquadrar ajusta a câmera. Arrastar o fundo move a câmera; setas do teclado movem o nó focado. Expansões sem relação direta com monitorados ficam em uma coluna adicional.

Conexões exibem valor e ativo, com totais separados para TRX e USDT em conexões agregadas. Botão Mostrar/Ocultar data e hora persiste a preferência local; em agregados mostra intervalo do primeiro ao último movimento. Clique na linha ou no rótulo abre o movimento mais recente à direita; o seletor permite percorrer os demais da mesma direção/ativo filtrado, sem misturar o fluxo contrário. Recibo, taxas, hash e TronScan permanecem disponíveis.

## Atualização: investigação e e-mail

Página inteira usa o viewport do navegador e mantém a inspeção lateral. Voltar ao painel ou Escape retorna. Shift + arraste desenha sempre um retângulo entre o ponto inicial e o atual, independentemente do caminho do mouse, para seleção dos centros dos nós. Shift + clique alterna um nó. Arrastar um selecionado move o grupo. Clique no fundo (sem arrastar) ou Escape limpa a seleção. Clicar em uma conexão também desmarca os nós e abre a transação. Arrastar o fundo apenas move a câmera e preserva a seleção.

Explorador: período no fuso configurado (minuto final inclusivo), direção, ativo independente do filtro do grafo e valores exatos com >, >=, <, <= ou =. Filtros operam sobre os dados coletados, não completam automaticamente histórico pendente.

E-mail: EmailJS REST a partir do navegador, com Service ID, Template ID e Public Key próprios do usuário. Não utiliza chave privada, senha ou domínio próprio. Template: To Email {{to_email}}, Subject {{subject}}, Body {{message}}. Remetente conectado no provedor. Um destinatário por regra; regras anteriores permitem Definir e-mail. Configuração e botão de teste em Configurações. Conta, serviço e template precisam existir; não são criados automaticamente.

O envio ocorre na coleta que detecta novos eventos elegíveis, após persistir a ocorrência. Não é execução 24h: depende de página aberta/ativa, periodicidade, quotas e atraso da fonte/provedor. Regras não enviam sobre carga inicial. Envios são serializados, com intervalo mínimo de 1,1 s. Status accepted significa aceito pelo provedor, não confirmação de entrega. Sem configuração, destinatário, rejeição e resultado incerto têm estados visíveis. Não há repetição automática de resultados incertos. Reenvio explícito pode duplicar. Eventos importados não enviam automaticamente. Configuração usa apenas identificadores públicos; o provedor recebe os dados incluídos no alerta.

Testes de e-mail usam fetch simulado; não comprovam envio real. O usuário precisa enviar um teste com sua conta para validar remetente/template e recebimento. Os limites atuais do plano devem ser conferidos no EmailJS. Resend exige backend para segredo e domínio verificado para envio normal a destinatários arbitrários; não foi integrado nesta etapa.

## Organização dos nós selecionados

Shift+H coloca os centros na mesma coordenada Y (média dos selecionados), mantendo cada X. Shift+V usa o mesmo X (média), mantendo Y. Ctrl+Shift+H e Ctrl+Shift+V também distribuem os centros com espaçamento uniforme no respectivo eixo, preservando os extremos. Se todos coincidirem no eixo de distribuição, aplica 90 unidades entre centros ao redor da posição original. Os comandos afetam somente os nós visíveis selecionados e salvam as posições. Botões equivalentes aparecem na barra do grafo. Atalhos são ignorados em campos de edição, diálogos, durante arraste e fora da aba de monitoramento. Shift+clique continua alternando nós na seleção.

Nome de referência: ao selecionar qualquer endereço no grafo, o formulário junto ao TronScan permite salvar ou remover um nome de até 60 caracteres. Nomes de contrapartes ficam em nodeLabels, sem incluí-las no monitoramento. Monitorados sincronizam também o label existente. O mesmo nome aparece em todas as ocorrências do endereço e acompanha o backup do caso. Trata-se de anotação do usuário, não de atribuição verificada.

## Fenix Observatório — ambiente visual escuro

Grafo em primeiro plano, endereços em lateral recolhível, inspeção independente à direita e explorador em gaveta inferior. A gaveta começa recolhida, abre pelo rodapé, redimensiona pelo puxador ou setas do teclado e oferece Ampliar/Restaurar. Abrir, fechar ou redimensionar preserva a câmera, os nós, filtros e rolagem. Preferências de abertura e altura persistem no caso. Selecionar nó ou transação abre a inspeção; Ver movimentos no explorador abre a gaveta com a seleção atual. Novos controles de zoom e estados responsivos para telas menores.

A marca foi atualizada para Fenix Observatório, inclusive nos e-mails e nomes de backup. O domínio e a base IndexedDB foram preservados para manter os casos existentes e a configuração de origem do EmailJS. Arquivos antigos continuam compatíveis.

Verificação do layout: HTML com estrutura e IDs verificados, testes funcionais em tests/core.cjs. tests/browser.cjs usa dados sintéticos e intercepta as solicitações externas; a execução de Chromium neste ambiente foi impedida por restrições de sockets. Revisão visual real permanece pendente.

Projeto independente: Fenix Observatório. Para trazer dados do domínio anterior, exporte o caso no antigo Observatório e importe em Configurações neste domínio. O navegador isola o armazenamento entre os dois sites.

## Menu do nó e exclusão pelo teclado

Com um nó marcado (clique, Shift + clique ou Shift + arraste), Delete ou Backspace remove-o do gráfico. A remoção desmarca as transações que desenham o nó, e elas continuam coletadas no explorador. O botão Restaurar nós devolve os nós removidos com suas transações, e marcar de novo uma transação no explorador também traz o nó de volta. Monitorados continuam sendo coletados mesmo fora do gráfico. As teclas não agem enquanto há digitação em campos ou diálogos abertos.

O botão direito sobre um nó (ou Shift+F10 / tecla Menu com o nó focado) abre o menu com estas opções:
- Excluir do gráfico.
- Trocar cor: 9 cores, mais a cor padrão.
- Trocar forma: círculo, quadrado, losango, hexágono ou triângulo.
- Renomear: o mesmo nome de referência do inspetor.
- Inserir comentário: até 500 caracteres. O nó ganha um selo e o texto aparece na inspeção.
- Inserir seta customizada: clique no nó de destino e informe um rótulo opcional. Esc cancela.
- Monitorar: abre o cadastro já preenchido. Uma expansão passa a ser monitorada e o histórico é recoletado desde a data informada, sem alertas retroativos.

Excluir, cor e forma valem para toda a seleção quando o nó clicado faz parte dela. As setas customizadas são tracejadas em roxo, abrem na inspeção ao clicar e podem ser excluídas pelo menu ou com Delete. Elas são anotações do analista e não transações. Cores, formas, comentários, setas e nós ocultos ficam em `nodeStyles`, `nodeComments`, `customArrows` e `graphHidden`, acompanham o backup e são saneados na importação.

Teste de navegador desta função: `NODE_PATH=$(npm root -g) node tests/node-menu.cjs`.

## Avisos fecháveis e comentários no gráfico

Os avisos de coleta, como histórico em carregamento ou erro, têm um × para fechar. Um aviso fechado só volta quando o texto dele muda, por exemplo com um novo erro ou outro ativo pendente. Isso vale enquanto a página estiver aberta.

O comentário de um nó aparece no gráfico como uma caixa ligada ao nó por uma linha tracejada. Arraste a caixa para posicioná-la, ou use as setas do teclado com a caixa focada. Ela guarda a distância até o nó e acompanha o nó quando ele é movido. Clique na caixa para inspecionar o nó. Duplo clique ou Enter edita o comentário. Salvar o comentário vazio remove a caixa. A posição fica em `commentPositions` e vai junto no backup.

## Coluna da direita: inspeção e explorador

O explorador fica na coluna da direita, abaixo da inspeção. Arraste o divisor entre os dois painéis para escolher quanto espaço o explorador ocupa. Os botões Ampliar e Recolher continuam funcionando. Com a inspeção recolhida, o explorador ocupa a coluna inteira.

Ao clicar numa transação, seja na lista ou numa conexão do gráfico, a linha fica destacada e rola até ficar visível no explorador. Os dados da transação aparecem no painel "Transação selecionada", abaixo da lista: valor, origem, destino, hash, recibo e taxas, exibir no gráfico e explodir. O × fecha esse painel. A inspeção de cima continua mostrando os nós, os grupos e as setas customizadas.

Os filtros de período, ativo e valor ficam recolhidos no botão Filtros, que mostra quantos estão ativos. Na tabela lateral, a coluna de hash fica oculta, mas o hash aparece nos dados da transação. Em telas estreitas, os painéis ficam empilhados abaixo do gráfico.

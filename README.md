# ProduçãoLite — Ordens de Produção e Custos

Lançamento de ordens de produção sobre o ERP em DBISAM, pela **bmAPI**: produtos acabados
(entradas), matérias-primas (saídas), lotes, mão de obra e custos, com baixa de estoque e
kardex. Conversão do módulo de produção do Delphi.

Mesmo layout e stack do **erp-compras**: Express + Vite (middleware) + React 19 +
React Router + Tailwind 4 + mysql2, fonte Jost, tema claro/escuro, casca com sidebar,
cabeçalho da tela e barra de status. O design system (`ListaCrm`, `FormCrm`, `MenuAcoes`,
`ConfirmDialog`, `AvisoErro`, `Dica`) veio de lá, com o âmbar do ProduçãoLite no lugar do azul.

## Rodando

```bash
npm install
cp .env.example .env      # preencha MYSQL_USER / MYSQL_PASSWORD
npm run dev               # http://localhost:3004
```

O MySQL guarda apenas o cadastro de servidores da bmAPI (`bmapi.servidores`): o token
(X-API-Key) digitado no login encontra a linha do cliente, com a URL e a porta. Os dados de
produção ficam no DBISAM do ERP, acessados só pelo servidor Node.

## Executável para os clientes

```bash
npm run build:exe
```

Gera `build/ProducaoLite.exe` (~57 MB, Windows x64), com o Node embutido. Para entregar,
copie para uma pasta:

```
ProducaoLite.exe
dist\            (gerada pelo build, vai junto)
.env             (senha do MySQL, SESSION_SECRET, PRODUCAO_PORT)
```

O cliente executa o .exe: ele sobe o servidor e abre o navegador em `localhost`. A janela
de console precisa ficar aberta enquanto o sistema estiver em uso. Rodando na máquina do
cliente, um servidor bmAPI cadastrado como `localhost` volta a funcionar — o que não
acontece na versão hospedada, em que quem chama a bmAPI é o servidor na nuvem.

## Telas

| Tela | O que faz |
|---|---|
| Painel Geral | Indicadores da produção e atalhos |
| Ordens de Produção | Histórico de movimentações e a nova OP (entradas, saídas, técnicos) |
| Fichas Técnicas | Receitas reutilizáveis de produção |
| Parâmetros Produtos | Unidades, fator de conversão e quebra (`ESP_WET_PRODUTOS`) |
| Técnicos & Equipe | Operadores, valor/hora e centro de custo |
| Relatórios & Custos | Demonstrativo do período e impressão |

## Tabelas

Próprias: `ESP_WET_PRODUCAO_OP`, `ESP_WET_PRODUCAO_PRODUTOS`, `ESP_WET_PRODUCAO_TECNICOS`,
`ESP_WET_PRODUCAO_PADROES` (+ `_PRODUTOS` / `_TECNICOS`), `ESP_WET_PRODUTOS`, `ESP_WET_TECNICOS`.

Do ERP: `PRODUTOSPRINCIPAL`, `PRODUTOSREFERENCIA`, `PRODUTOSREFEMPRESA`, `PRODUTOSCARDEX`,
`PROCUSTOSEMP`, `PROLOTES`, `PROLOTESCARDEX`, `CCUSTOS`, `ORCAMENTOM`/`ORCAMENTOP`, `OSM`/`OSP`.

## Histórico

### 1.0.3
- Layout e stack do **erp-compras** em todo o app: `globals.css` (campos com moldura e
  barra à esquerda, select customizado, tabelas `planilha`), `ListaCrm` nas listas,
  `FormCrm`/`TelaCheia` nos formulários, `MenuAcoes`, `ConfirmDialog`, `AvisoErro` e
  `Dica`. O destaque continua âmbar; o azul ficou só no fundo dos campos e na opção
  escolhida do select, como manda o padrão.
- Casca com React Router: `LayoutApp` (sidebar recolhível, cabeçalho da tela e barra de
  status com versão, servidor, filial e usuário) e uma rota por tela.
- Login pelo **token (X-API-Key)** do servidor, não mais pelo número: a busca em
  `bmapi.servidores` é pelo token e a rota `GET /api/servidores/:numero` saiu, para
  ninguém varrer números e ver a identificação de outros clientes. O token não é guardado
  no navegador. Tela refeita no modelo do erp-compras.
- Correção: ao recarregar a página, as telas consultavam a API antes de o token de sessão
  ser definido, tomavam 401 e caíam para o login.
- Preferências das listas (larguras, ordem, grade, modo das Ações) ainda valem só na aba;
  o destino é `WEB_USUARIOS.CONFIG_LISTAS`.

### 1.0.1
- PWA: manifesto, ícones (normal e maskable) e service worker próprios, sem dependência
  nova. O service worker só é registrado na versão compilada e não guarda nada de `/api`:
  o cache serve apenas para abrir a tela sem rede, já que os dados vêm da bmAPI.

### 1.0.0
- Primeira versão publicada.
- Telas no layout do Admin B2B: painel chapado ocupando a área de trabalho, grade com
  cabeçalho fixo, coluna indicadora e coluna Ações fixa.
- Campos no padrão da casa: data `dd/mm/aaaa` com calendário próprio, números digitados da
  direita para a esquerda, sim/não em toggle, seleção do conteúdo ao focar e confirmação
  em toda exclusão ou remoção.
- Correções na gravação da OP contra o DBISAM: nomes de tabela e coluna (`PROLOTES.IDPRO`,
  `PROCUSTOSEMP`, `PRODUTOSCARDEX.ESTOQUEVALOR` / `CORRECAOAPONTAMENTO`,
  `ESP_WET_PRODUCAO_TECNICOS`), `ORDER BY` com a coluna no SELECT, contagem de colunas do
  kardex e leitura do ID gerado (o script precisa começar por um SELECT).

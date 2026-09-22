# ProduçãoLite — Ordens de Produção e Custos

Lançamento de ordens de produção sobre o ERP em DBISAM, pela **bmAPI**: produtos acabados
(entradas), matérias-primas (saídas), lotes, mão de obra e custos, com baixa de estoque e
kardex. Conversão do módulo de produção do Delphi.

Mesmo layout e stack do **Admin B2B** (`b2bweb/admin`): Express + Vite (middleware) +
React 19 + Tailwind 4 + mysql2, fonte Jost, tema claro/escuro, sidebar + header.

## Rodando

```bash
npm install
cp .env.example .env      # preencha MYSQL_USER / MYSQL_PASSWORD
npm run dev               # http://localhost:3004
```

O MySQL guarda apenas o cadastro de servidores da bmAPI (`bmapi.servidores`): o número
digitado no login informa a URL, a porta e o token (X-API-Key) do cliente. Os dados de
produção ficam no DBISAM do ERP, acessados só pelo servidor Node.

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

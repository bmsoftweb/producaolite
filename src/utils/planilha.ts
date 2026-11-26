/**
 * Classes das tabelas de digitação (planilha) e da casca das telas de lançamento,
 * no padrão do erp-compras. As listas de consulta não usam nada disto: quem desenha
 * a grade é o ListaCrm.
 *
 * O visual dos campos dentro das células vem da regra global `table.planilha`
 * do index.css (campo ocupa a célula inteira, sem moldura, barra da esquerda mantida).
 */

/** Painel que ocupa toda a área de trabalho */
export const PAINEL = 'flex-1 flex flex-col min-h-0 bg-white dark:bg-stone-900';

/** Barra de ferramentas no topo do painel */
export const BARRA =
  'px-4 py-2.5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between gap-3 shrink-0 bg-white dark:bg-stone-900 overflow-x-auto overflow-y-hidden';

export const TABELA = 'planilha w-full text-xs border-collapse';

export const TH =
  'px-2 py-2 text-center font-semibold text-stone-600 dark:text-stone-300 whitespace-nowrap bg-stone-50 dark:bg-stone-950 border-b border-r border-stone-200 dark:border-stone-800';

export const TR = 'transition-colors hover:bg-stone-50/60 dark:hover:bg-stone-800/40';

export const TD = 'px-2 py-1 align-middle text-stone-700 dark:text-stone-300 border-b border-r border-stone-200 dark:border-stone-800';

export const BTN_PRIMARIO =
  'flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0 whitespace-nowrap';

export const BTN_SECUNDARIO =
  'flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-semibold text-stone-600 dark:text-stone-300 border border-stone-300 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer disabled:opacity-40 shrink-0 whitespace-nowrap';

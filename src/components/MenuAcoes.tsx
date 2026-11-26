
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Loader2, MoreHorizontal, type LucideIcon } from 'lucide-react';

/** Dentro do menu "...": as ações viram itens com nome em vez de ícones soltos */
const EmMenu = createContext(false);
/** Modo botões da coluna Ações (ícone ao lado de "Ações"): cada ação vira um botão baixo com uma palavra */
export const ComoBotao = createContext(false);

type Tom = 'normal' | 'verde' | 'perigo';

interface AcaoProps {
  icone: LucideIcon;
  titulo: string;
  descricao: string;
  /** Palavra do botão no modo botões (padrão: a primeira palavra do título) */
  rotulo?: string;
  onClick: () => void;
  carregando?: boolean;
  tom?: Tom;
}

const HOVER_ICONE: Record<Tom, string> = {
  normal: 'hover:text-amber-600 hover:bg-amber-50 dark:hover:text-amber-400 dark:hover:bg-amber-950/40',
  verde: 'hover:text-emerald-600 hover:bg-emerald-50 dark:hover:text-emerald-400 dark:hover:bg-emerald-950/40',
  perigo: 'hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-950/40',
};
const COR_ITEM: Record<Tom, string> = { normal: 'text-amber-600 dark:text-amber-400', verde: 'text-emerald-600 dark:text-emerald-400', perigo: 'text-rose-600 dark:text-rose-400' };
const COR_BOTAO: Record<Tom, string> = {
  normal: 'text-amber-700 border-amber-200 bg-amber-50 hover:bg-amber-100 dark:text-amber-300 dark:border-amber-900 dark:bg-amber-950/40 dark:hover:bg-amber-900/50',
  verde: 'text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 dark:text-emerald-300 dark:border-emerald-900 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50',
  perigo: 'text-rose-700 border-rose-200 bg-rose-50 hover:bg-rose-100 dark:text-rose-300 dark:border-rose-900 dark:bg-rose-950/40 dark:hover:bg-rose-900/50',
};
/** Largura única dos botões (cabe "Consultar"): todos iguais e alinhados entre as linhas, com o Vazio do mesmo tamanho */
const W_BOTAO = 'w-[62px]';
/**
 * Forma comum do botão de ação e do desativado: baixo, maiúsculas pequenas.
 */
const FORMA_BOTAO = `${W_BOTAO} shrink-0 h-[22px] px-1 inline-flex items-center justify-center gap-1 rounded-md border text-[8.5px] font-semibold uppercase tracking-wide leading-none whitespace-nowrap overflow-hidden`;
/** Palavra do botão: o text-box corta a caixa na altura das maiúsculas (sem o espaço das descendentes da Jost), senão ela fica acima do meio */
const Palavra: React.FC<{ children: React.ReactNode }> = ({ children }) => <span className="inline-block [text-box:trim-both_cap_alphabetic]">{children}</span>;

/** Ação de linha: ícone solto na coluna Ações (descrição no tooltip), item (ícone e nome) dentro do MenuAcoes ou botão com uma palavra */
export const BotaoAcao: React.FC<AcaoProps> = ({ icone: Icone, titulo, descricao, rotulo, onClick, carregando, tom = 'normal' }) => {
  const emMenu = useContext(EmMenu);
  const comoBotao = useContext(ComoBotao);
  const clicar = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick();
  };
  if (comoBotao && !emMenu) {
    return (
      <button type="button" onClick={clicar} disabled={carregando} title={`${titulo}: ${descricao}`}
        className={`${FORMA_BOTAO} transition-colors cursor-pointer disabled:cursor-wait ${COR_BOTAO[tom]}`}>
        {carregando && <Loader2 className="w-3 h-3 animate-spin" />}
        <Palavra>{rotulo ?? titulo.split(' ')[0]}</Palavra>
      </button>
    );
  }
  if (emMenu) {
    return (
      <button role="menuitem" type="button" onClick={clicar} disabled={carregando} className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer disabled:cursor-wait">
        {carregando ? <Loader2 className="w-4 h-4 shrink-0 animate-spin text-stone-400" /> : <Icone className={`w-4 h-4 shrink-0 ${COR_ITEM[tom]}`} />}
        <span className={`text-xs font-medium whitespace-nowrap ${tom === 'perigo' ? 'text-rose-700 dark:text-rose-400' : 'text-stone-800 dark:text-stone-100'}`}>{titulo}</span>
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={clicar}
      disabled={carregando}
      title={`${titulo}: ${descricao}`}
      className={`p-1 rounded text-stone-400 ${HOVER_ICONE[tom]} transition-colors cursor-pointer disabled:cursor-wait`}
    >
      {carregando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Icone className="w-3.5 h-3.5" />}
    </button>
  );
};

/**
 * Botão "..." da coluna Ações que abre as ações da linha num menu. As ações ficam montadas depois
 * da primeira abertura: o menu fecha ao escolher, mas o diálogo que a ação abriu continua aberto.
 */
export const MenuAcoes: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const botao = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<React.CSSProperties | null>(null);
  const [montado, setMontado] = useState(false);

  useEffect(() => {
    if (!pos) return;
    const fechar = () => setPos(null);
    const tecla = (e: KeyboardEvent) => e.key === 'Escape' && fechar();
    document.addEventListener('mousedown', fechar);
    document.addEventListener('scroll', fechar, true);
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('mousedown', fechar);
      document.removeEventListener('scroll', fechar, true);
      document.removeEventListener('keydown', tecla);
    };
  }, [pos]);

  const abrir = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (pos) return setPos(null);
    const r = botao.current!.getBoundingClientRect();
    // Perto do pé da tela, abre para cima
    const vertical = r.bottom + 380 > window.innerHeight ? { bottom: window.innerHeight - r.top + 4 } : { top: r.bottom + 4 };
    setPos({ ...vertical, right: window.innerWidth - r.right });
    setMontado(true);
  };

  return (
    <>
      <button
        ref={botao}
        type="button"
        onClick={abrir}
        title="Ações"
        className={`p-1 rounded transition-colors cursor-pointer ${pos ? 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/40' : 'text-stone-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:text-amber-400 dark:hover:bg-amber-950/40'}`}
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {montado &&
        // No body: dentro da célula fixa da coluna Ações ficaria cortado; o span segura os cliques da linha
        createPortal(
          <span onClick={(e) => e.stopPropagation()} onDoubleClick={(e) => e.stopPropagation()}>
            <div
              role="menu"
              onMouseDown={(e) => e.stopPropagation()}
              onClickCapture={() => setPos(null)}
              style={pos ?? { display: 'none' }}
              className="fixed z-[60] min-w-48 py-1 rounded-lg border border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-900 shadow-xl"
            >
              <EmMenu.Provider value={true}>{children}</EmMenu.Provider>
            </div>
          </span>,
          document.body,
        )}
    </>
  );
};

/** Linha divisória entre grupos de itens do menu (fora do menu não aparece) */
export const SeparadorAcoes: React.FC = () => (useContext(EmMenu) ? <div className="my-1 border-t border-stone-100 dark:border-stone-800" /> : null);

/**
 * Lugar da ação que não vale na linha (mantém as posições): com icone/titulo, a ação aparece desativada em cinza bem
 * claro (ícone ou botão); sem eles, só o espaço. No menu não aparece.
 */
export const Vazio: React.FC<{ icone?: LucideIcon; titulo?: string; rotulo?: string }> = ({ icone: Icone, titulo, rotulo }) => {
  const [menu, botao] = [useContext(EmMenu), useContext(ComoBotao)];
  if (menu) return null;
  const dica = titulo && `${titulo}: não disponível nesta situação`;
  if (botao) {
    return (
      <span title={dica} className={`${FORMA_BOTAO} cursor-default ${titulo ? 'text-stone-300 border-stone-200 dark:text-stone-600 dark:border-stone-800' : 'border-transparent'}`}>
        {titulo && <Palavra>{rotulo ?? titulo.split(' ')[0]}</Palavra>}
      </span>
    );
  }
  return (
    <span title={dica} className="shrink-0 w-[22px] h-[22px] inline-flex items-center justify-center text-stone-200 dark:text-stone-700 cursor-default">
      {Icone && <Icone className="w-3.5 h-3.5" />}
    </span>
  );
};

/** Se está dentro do menu "..." (para ações que mudam de forma no menu) */
export const useEmMenu = () => useContext(EmMenu);

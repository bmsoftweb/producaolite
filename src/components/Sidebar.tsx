import React, { useLayoutEffect, useState } from 'react';
import { usePathname } from '@/lib/nav';
import Link from '@/lib/link';
import {
  LayoutDashboard, Factory, ScrollText, PackageCheck, Users, BarChart3,
  LogOut, Menu, X, User, Sun, Moon, ChevronLeft, ChevronRight, type LucideIcon,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { Usuario } from '../types';

/** Menu lateral no modelo do erp-compras: grupos com título, recolher no desktop e drawer no mobile. */

const CHAVE_RECOLHIDO = 'producaolite_menu_recolhido';

type Item = { name: string; icon: LucideIcon; href: string };

const GRUPOS: { titulo: string; itens: Item[] }[] = [
  { titulo: 'Visão Geral', itens: [{ name: 'Painel Geral', icon: LayoutDashboard, href: '/dashboard' }] },
  {
    titulo: 'Produção',
    itens: [
      { name: 'Ordens de Produção', icon: Factory, href: '/producao' },
      { name: 'Fichas Técnicas', icon: ScrollText, href: '/padroes' },
    ],
  },
  {
    titulo: 'Cadastros',
    itens: [
      { name: 'Parâmetros Produtos', icon: PackageCheck, href: '/produtos' },
      { name: 'Técnicos & Equipe', icon: Users, href: '/tecnicos' },
    ],
  },
  { titulo: 'Relatórios', itens: [{ name: 'Relatórios & Custos', icon: BarChart3, href: '/relatorios' }] },
];

interface SidebarProps {
  usuario: Usuario;
  onOpenMeusDados: () => void;
  onLogout: () => void;
}

export default function Sidebar({ usuario, onOpenMeusDados, onLogout }: SidebarProps) {
  const [mobileAberto, setMobileAberto] = useState(false);
  const [recolhido, setRecolhido] = useState(() => {
    try {
      return localStorage.getItem(CHAVE_RECOLHIDO) === '1';
    } catch {
      return false;
    }
  });
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  // As telas usam --larg-menu como margem esquerda
  useLayoutEffect(() => {
    document.documentElement.style.setProperty('--larg-menu', recolhido ? '4rem' : '16rem');
  }, [recolhido]);

  const alternar = () =>
    setRecolhido((r) => {
      try {
        localStorage.setItem(CHAVE_RECOLHIDO, r ? '0' : '1');
      } catch {
        // sem storage: vale só até recarregar
      }
      return !r;
    });

  const conteudo = (rec: boolean) => (
    <div className="flex flex-col h-full bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 border-r border-stone-200 dark:border-stone-800 select-none">
      {/* Marca: mesma altura do header das telas */}
      <div className={`h-[var(--altura-topo)] shrink-0 ${rec ? 'justify-center' : 'px-4 justify-between'} border-b border-stone-200 dark:border-stone-800/80 flex items-center gap-3 bg-stone-50/50 dark:bg-transparent`}>
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20 shrink-0">
            <Factory className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div className={rec ? 'hidden' : 'min-w-0'}>
            <h1 className="text-sm font-bold text-stone-900 dark:text-white leading-tight truncate">
              Produção<span className="text-amber-500 dark:text-amber-400 font-extrabold">Lite</span>
            </h1>
            <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate">Ordens & Custos</p>
          </div>
        </div>
        <button
          onClick={() => setMobileAberto(false)}
          title="Fechar menu lateral"
          className="lg:hidden p-1.5 rounded-lg text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navegação */}
      <div className="flex-1 overflow-y-auto py-4">
        {GRUPOS.map((g, i) => (
          <div key={g.titulo} className={i ? 'pt-3' : ''}>
            {rec ? (
              i ? <div className="mx-4 mb-2 border-t border-stone-200 dark:border-stone-800" /> : null
            ) : (
              <div className="px-4 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">{g.titulo}</div>
            )}
            {g.itens.map(({ name, icon: Icon, href }) => {
              const ativo = pathname.startsWith(href);
              const classe = `relative w-full flex items-center ${rec ? 'justify-center' : 'pl-4 pr-9'} py-[11px] text-left transition-colors group border-l-2 cursor-pointer ${
                ativo
                  ? 'border-amber-600 bg-amber-50 text-amber-700 font-semibold dark:border-amber-400 dark:bg-amber-950/40 dark:text-amber-300'
                  : 'border-transparent text-stone-600 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-300 dark:hover:bg-stone-800/70 dark:hover:text-white'
              }`;
              return (
                <Link key={href} href={href} onClick={() => setMobileAberto(false)} title={rec ? name : undefined} className={classe}>
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                        ativo ? 'text-amber-600 dark:text-amber-300' : 'text-stone-400 group-hover:text-amber-600 dark:group-hover:text-amber-400'
                      }`}
                    />
                    {!rec && <div className="text-xs truncate">{name}</div>}
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* Usuário, tema e sair */}
      <div className={`p-3 border-t border-stone-200 dark:border-stone-800/80 flex ${rec ? 'flex-col' : ''} items-center justify-between gap-2 bg-stone-50 dark:bg-stone-950/60`}>
        <button
          onClick={onOpenMeusDados}
          title="Meus dados"
          className="flex items-center gap-2.5 min-w-0 text-left rounded-lg p-1 -m-1 hover:bg-stone-100 dark:hover:bg-stone-800/70 transition-colors cursor-pointer"
        >
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-semibold text-xs shrink-0">
            {usuario.nome ? usuario.nome.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
          </div>
          <div className={rec ? 'hidden' : 'min-w-0'}>
            <div className="text-xs font-semibold text-stone-900 dark:text-white truncate leading-tight">{usuario.nome}</div>
            <div className="text-[10px] text-stone-500 dark:text-stone-400 truncate mt-0.5">
              {usuario.nivelDescricao || usuario.email || 'Operador'}
            </div>
          </div>
        </button>
        <div className={`flex ${rec ? 'flex-col' : ''} items-center gap-1 shrink-0`}>
          <button
            onClick={toggleTheme}
            title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
            className="p-1.5 rounded-lg text-stone-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:text-amber-400 dark:hover:bg-amber-950/50 transition-colors cursor-pointer shrink-0"
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
          <button
            onClick={onLogout}
            title="Encerrar sessão"
            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:text-rose-400 dark:hover:bg-rose-950/50 transition-colors cursor-pointer shrink-0"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Abrir o menu no mobile */}
      <button
        onClick={() => setMobileAberto(true)}
        title="Abrir menu de navegação"
        className="print:hidden lg:hidden fixed top-4 left-4 z-30 p-2 rounded-xl bg-white dark:bg-stone-900 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-700 shadow-sm cursor-pointer"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Sidebar fixa no desktop */}
      <aside className={`print:hidden hidden lg:flex flex-col ${recolhido ? 'w-16' : 'w-64'} fixed top-0 left-0 h-screen z-30 transition-[width] duration-200`}>
        {conteudo(recolhido)}
        <button
          type="button"
          onClick={alternar}
          title={recolhido ? 'Abrir o menu' : 'Esconder o menu'}
          className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-14 rounded-full flex items-center justify-center bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-stone-500 hover:text-amber-600 dark:text-stone-400 dark:hover:text-amber-400 shadow-sm cursor-pointer"
        >
          {recolhido ? <ChevronRight className="w-2.5 h-2.5 shrink-0" strokeWidth={3} /> : <ChevronLeft className="w-2.5 h-2.5 shrink-0" strokeWidth={3} />}
        </button>
      </aside>

      {/* Drawer no mobile */}
      {mobileAberto && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-xs" onClick={() => setMobileAberto(false)} aria-hidden="true" />
          <div className="relative flex-1 flex flex-col max-w-xs w-full h-full shadow-2xl z-10">{conteudo(false)}</div>
        </div>
      )}
    </>
  );
}

import React from 'react';
import { Search, X } from 'lucide-react';
import { INPUT_CLASS } from '@/components/FormCrm';

/** Botão com cara de campo que abre uma pesquisa (cópia do CampoPesquisa da TelaDav do erp-vendas) */
export const CampoPesquisa: React.FC<{ texto?: string; vazio: string; onAbrir: () => void; onLimpar?: () => void; obrigatorio?: boolean; autoFocus?: boolean }> = ({ texto, vazio, onAbrir, onLimpar, obrigatorio, autoFocus }) => (
  <div className="relative">
    <button type="button" autoFocus={autoFocus} onClick={onAbrir} data-obrigatorio={obrigatorio ? '' : undefined} className={`${INPUT_CLASS} campo-botao text-left flex items-center gap-2 cursor-pointer`}>
      <Search className="w-3.5 h-3.5 text-stone-400 shrink-0" />
      <span className={`truncate ${texto ? '' : 'text-stone-400 font-normal'}`}>{texto || vazio}</span>
    </button>
    {texto && onLimpar && (
      <button type="button" onClick={onLimpar} title="Limpar" className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-stone-400 hover:text-stone-700 cursor-pointer">
        <X className="w-3.5 h-3.5" />
      </button>
    )}
  </div>
);

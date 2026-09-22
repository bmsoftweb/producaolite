import React, { useState } from 'react';
import { Modal } from './Modal';
import { ItemDav } from '../types';
import { fetchDavs } from '../services/api';
import { formatDateBR, hojeISO, formatDecimal } from '../utils/formatters';
import { INPUT_CLASS, LABEL_CLASS, FIELD_WRAPPER_CLASS } from '../utils/formStyles';
import { FileText, Search, Loader2, Check, AlertCircle } from 'lucide-react';

interface CapturaDavModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportarItens: (itens: ItemDav[]) => void;
}

export const CapturaDavModal: React.FC<CapturaDavModalProps> = ({
  isOpen,
  onClose,
  onImportarItens,
}) => {
  const [d1, setD1] = useState(hojeISO(-30));
  const [d2, setD2] = useState(hojeISO());
  const [numDav, setNumDav] = useState('');
  const [itens, setItens] = useState<ItemDav[]>([]);
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleBuscar = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      setErro(null);
      const res = await fetchDavs({
        d1,
        d2,
        id: numDav ? parseInt(numDav, 10) : undefined,
      });
      setItens(res);
      // Seleciona todos por padrão
      setSelecionados(new Set(res.map((_, idx) => idx)));
    } catch (err: any) {
      setErro(err.message || 'Erro ao consultar DAVs.');
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (index: number) => {
    const next = new Set(selecionados);
    if (next.has(index)) next.delete(index);
    else next.add(index);
    setSelecionados(next);
  };

  const handleConfirmar = () => {
    const itensEscolhidos = itens.filter((_, idx) => selecionados.has(idx));
    if (itensEscolhidos.length === 0) {
      setErro('Selecione pelo menos um item para importar.');
      return;
    }
    onImportarItens(itensEscolhidos);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Capturar Itens do DAV / Orçamento"
      subtitle="Importe produtos acabados de orçamentos para gerar as ordens de produção"
      size="xl"
    >
      <div className="space-y-4">
        {/* Barra de Filtros */}
        <form onSubmit={handleBuscar} className="p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-800 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-3">
            <label className={LABEL_CLASS}>Data Inicial</label>
            <div className={FIELD_WRAPPER_CLASS}>
              <input
                type="date"
                value={d1}
                onChange={(e) => setD1(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <label className={LABEL_CLASS}>Data Final</label>
            <div className={FIELD_WRAPPER_CLASS}>
              <input
                type="date"
                value={d2}
                onChange={(e) => setD2(e.target.value)}
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <label className={LABEL_CLASS}>Número do DAV (opcional)</label>
            <div className={FIELD_WRAPPER_CLASS}>
              <input
                type="number"
                value={numDav}
                onChange={(e) => setNumDav(e.target.value)}
                placeholder="Todos"
                className={INPUT_CLASS}
              />
            </div>
          </div>

          <div className="sm:col-span-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-3 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              <span>Consultar DAVs</span>
            </button>
          </div>
        </form>

        {erro && (
          <div className="flex items-center gap-2 p-2.5 text-xs text-red-700 bg-red-50 dark:bg-red-950/40 dark:text-red-300 rounded-lg">
            <AlertCircle size={14} />
            <span>{erro}</span>
          </div>
        )}

        {/* Listagem de itens */}
        <div className="border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden">
          <div className="max-h-72 overflow-y-auto">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-stone-400 gap-2">
                <Loader2 size={24} className="animate-spin text-amber-500" />
                <span className="text-xs">Buscando itens de orçamentos...</span>
              </div>
            ) : itens.length === 0 ? (
              <div className="py-10 text-center text-xs text-stone-400">
                Nenhum item de DAV encontrado para o filtro informado.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 font-semibold sticky top-0">
                  <tr>
                    <th className="p-2.5 w-10 text-center">
                      <input
                        type="checkbox"
                        checked={selecionados.size === itens.length && itens.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) setSelecionados(new Set(itens.map((_, i) => i)));
                          else setSelecionados(new Set());
                        }}
                        className="rounded text-amber-600"
                      />
                    </th>
                    <th className="p-2.5">Código</th>
                    <th className="p-2.5">Descrição do Produto</th>
                    <th className="p-2.5 text-right">Qtd Total</th>
                    <th className="p-2.5 text-center">UN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-stone-800 dark:text-stone-200">
                  {itens.map((it, idx) => {
                    const marcado = selecionados.has(idx);
                    return (
                      <tr
                        key={idx}
                        onClick={() => toggleItem(idx)}
                        className={`cursor-pointer transition-colors ${
                          marcado
                            ? 'bg-amber-50/60 dark:bg-amber-950/20'
                            : 'hover:bg-stone-50 dark:hover:bg-stone-800/50'
                        }`}
                      >
                        <td className="p-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={marcado}
                            onChange={() => toggleItem(idx)}
                            className="rounded text-amber-600"
                          />
                        </td>
                        <td className="p-2.5 font-mono text-stone-500">{it.idProduto}</td>
                        <td className="p-2.5 font-medium">{it.descricao}</td>
                        <td className="p-2.5 text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatDecimal(it.qtdTotal)}
                        </td>
                        <td className="p-2.5 text-center text-stone-500 font-mono">{it.unvenda || 'UN'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-stone-200 dark:border-stone-800">
          <span className="text-xs text-stone-500">
            {selecionados.size} de {itens.length} item(ns) selecionado(s)
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={selecionados.size === 0}
              onClick={handleConfirmar}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:opacity-50 rounded-lg flex items-center gap-1.5 shadow-sm"
            >
              <Check size={14} />
              <span>Importar para Entradas</span>
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

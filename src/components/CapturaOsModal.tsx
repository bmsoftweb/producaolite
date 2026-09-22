import React, { useState } from 'react';
import { Modal } from './Modal';
import { ItemOs, ProdutoOs } from '../types';
import { fetchOs, fetchOsProdutos } from '../services/api';
import { formatDateBR, hojeISO, formatDecimal } from '../utils/formatters';
import { INPUT_CLASS, LABEL_CLASS, FIELD_WRAPPER_CLASS } from '../utils/formStyles';
import { Wrench, Search, Loader2, Check, AlertCircle, ArrowRight } from 'lucide-react';

interface CapturaOsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportarProdutosOs: (produtos: ProdutoOs[], idOs: number) => void;
}

export const CapturaOsModal: React.FC<CapturaOsModalProps> = ({
  isOpen,
  onClose,
  onImportarProdutosOs,
}) => {
  const [d1, setD1] = useState(hojeISO(-30));
  const [d2, setD2] = useState(hojeISO());
  const [osList, setOsList] = useState<ItemOs[]>([]);
  const [osSelecionada, setOsSelecionada] = useState<ItemOs | null>(null);
  const [produtosOs, setProdutosOs] = useState<ProdutoOs[]>([]);
  const [loadingOs, setLoadingOs] = useState(false);
  const [loadingProds, setLoadingProds] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleBuscar = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setLoadingOs(true);
      setErro(null);
      setOsSelecionada(null);
      setProdutosOs([]);
      const res = await fetchOs({ d1, d2 });
      setOsList(res);
    } catch (err: any) {
      setErro(err.message || 'Erro ao consultar Ordens de Serviço.');
    } finally {
      setLoadingOs(false);
    }
  };

  const selecionarOs = async (os: ItemOs) => {
    setOsSelecionada(os);
    try {
      setLoadingProds(true);
      const prods = await fetchOsProdutos(os.id);
      setProdutosOs(prods);
    } catch (err: any) {
      setErro(err.message || 'Erro ao consultar produtos da OS.');
    } finally {
      setLoadingProds(false);
    }
  };

  const handleConfirmar = () => {
    if (!osSelecionada || produtosOs.length === 0) return;
    onImportarProdutosOs(produtosOs, osSelecionada.id);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Capturar Matérias-Primas da Ordem de Serviço (OS)"
      subtitle="Importe as peças e materiais utilizados em uma OS como saídas/insumos da OP"
      size="xl"
    >
      <div className="space-y-4">
        {/* Filtro por Período */}
        <form onSubmit={handleBuscar} className="p-3 bg-stone-50 dark:bg-stone-800/40 rounded-xl border border-stone-200 dark:border-stone-800 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          <div className="sm:col-span-4">
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

          <div className="sm:col-span-4">
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

          <div className="sm:col-span-4">
            <button
              type="submit"
              disabled={loadingOs}
              className="w-full py-2 px-3 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-colors disabled:opacity-50"
            >
              {loadingOs ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
              <span>Consultar Ordens de Serviço</span>
            </button>
          </div>
        </form>

        {erro && (
          <div className="flex items-center gap-2 p-2.5 text-xs text-red-700 bg-red-50 dark:bg-red-950/40 dark:text-red-300 rounded-lg">
            <AlertCircle size={14} />
            <span>{erro}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Tabela de OS */}
          <div className="md:col-span-6 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden">
            <div className="bg-stone-100 dark:bg-stone-800 px-3 py-2 text-xs font-semibold text-stone-600 dark:text-stone-300 border-b border-stone-200 dark:border-stone-800">
              Ordens de Serviço do Período
            </div>
            <div className="max-h-64 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800">
              {loadingOs ? (
                <div className="py-12 flex flex-col items-center justify-center text-stone-400 gap-2">
                  <Loader2 size={20} className="animate-spin text-amber-500" />
                  <span className="text-xs">Buscando ordens de serviço...</span>
                </div>
              ) : osList.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-400">
                  Nenhuma OS encontrada no período.
                </div>
              ) : (
                osList.map((os) => {
                  const ativa = osSelecionada?.id === os.id;
                  return (
                    <div
                      key={os.id}
                      onClick={() => selecionarOs(os)}
                      className={`p-2.5 text-xs cursor-pointer transition-colors flex items-center justify-between ${
                        ativa
                          ? 'bg-amber-500/10 text-amber-900 dark:text-amber-200 font-medium'
                          : 'hover:bg-stone-50 dark:hover:bg-stone-800/50'
                      }`}
                    >
                      <div>
                        <div className="font-semibold flex items-center gap-1.5">
                          <Wrench size={13} className="text-amber-500" />
                          <span>OS #{os.id}</span>
                          <span className="text-[11px] text-stone-400 font-normal">
                            ({formatDateBR(os.data)})
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-500 dark:text-stone-400 truncate max-w-[200px] mt-0.5">
                          {os.nomeCliente || 'Cliente sem identificação'}
                        </div>
                      </div>
                      <ArrowRight size={14} className={ativa ? 'text-amber-500' : 'text-stone-300'} />
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Produtos da OS */}
          <div className="md:col-span-6 border border-stone-200 dark:border-stone-800 rounded-xl overflow-hidden">
            <div className="bg-stone-100 dark:bg-stone-800 px-3 py-2 text-xs font-semibold text-stone-600 dark:text-stone-300 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
              <span>Peças & Materiais da OS</span>
              {osSelecionada && (
                <span className="text-[11px] font-mono font-normal text-stone-400">
                  OS #{osSelecionada.id}
                </span>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto">
              {!osSelecionada ? (
                <div className="py-12 text-center text-xs text-stone-400">
                  Selecione uma OS ao lado para visualizar os materiais usados.
                </div>
              ) : loadingProds ? (
                <div className="py-12 flex flex-col items-center justify-center text-stone-400 gap-2">
                  <Loader2 size={20} className="animate-spin text-amber-500" />
                  <span className="text-xs">Consultando produtos...</span>
                </div>
              ) : produtosOs.length === 0 ? (
                <div className="py-8 text-center text-xs text-stone-400">
                  Nenhum produto/peça registrado nesta OS.
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 dark:bg-stone-800/50 text-stone-500 font-semibold border-b border-stone-100 dark:border-stone-800">
                    <tr>
                      <th className="p-2">Item</th>
                      <th className="p-2 text-right">Qtd</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                    {produtosOs.map((p, idx) => (
                      <tr key={idx} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/30">
                        <td className="p-2 font-medium">{p.descricao}</td>
                        <td className="p-2 text-right font-mono font-semibold text-amber-600">
                          {formatDecimal(p.qtdade)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!osSelecionada || produtosOs.length === 0}
            onClick={handleConfirmar}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:opacity-50 rounded-lg flex items-center gap-1.5 shadow-sm"
          >
            <Check size={14} />
            <span>Importar Peças como Insumos</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

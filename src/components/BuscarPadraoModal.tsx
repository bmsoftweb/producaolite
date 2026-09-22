import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { PadraoProd } from '../types';
import { fetchPadroes, fetchPadraoItens } from '../services/api';
import { ScrollText, Search, Loader2, Check, AlertCircle, ArrowDownLeft, ArrowUpRight, Users } from 'lucide-react';
import { INPUT_CLASS, FIELD_WRAPPER_CLASS } from '../utils/formStyles';
import { formatDecimal } from '../utils/formatters';

interface BuscarPadraoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCarregarPadrao: (dados: { produtos: any[]; tecnicos: any[]; nomePadrao: string }) => void;
}

export const BuscarPadraoModal: React.FC<BuscarPadraoModalProps> = ({
  isOpen,
  onClose,
  onCarregarPadrao,
}) => {
  const [padroes, setPadroes] = useState<PadraoProd[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(false);
  const [padraoSelecionado, setPadraoSelecionado] = useState<PadraoProd | null>(null);
  const [detalhes, setDetalhes] = useState<{ produtos: any[]; tecnicos: any[] } | null>(null);
  const [loadingDetalhes, setLoadingDetalhes] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      carregarPadroes();
      setPadraoSelecionado(null);
      setDetalhes(null);
      setBusca('');
      setErro(null);
    }
  }, [isOpen]);

  const carregarPadroes = async () => {
    try {
      setLoading(true);
      const res = await fetchPadroes();
      setPadroes(res);
    } catch (err: any) {
      setErro(err.message || 'Erro ao consultar padrões.');
    } finally {
      setLoading(false);
    }
  };

  const selecionarPadrao = async (padrao: PadraoProd) => {
    setPadraoSelecionado(padrao);
    try {
      setLoadingDetalhes(true);
      const res = await fetchPadraoItens(padrao.id);
      setDetalhes(res);
    } catch (err: any) {
      setErro(err.message || 'Erro ao carregar itens da ficha técnica.');
    } finally {
      setLoadingDetalhes(false);
    }
  };

  const handleConfirmar = () => {
    if (!padraoSelecionado || !detalhes) return;
    onCarregarPadrao({
      produtos: detalhes.produtos || [],
      tecnicos: detalhes.tecnicos || [],
      nomePadrao: padraoSelecionado.nome,
    });
    onClose();
  };

  const filtrados = padroes.filter(
    (p) =>
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (p.codigo && p.codigo.toLowerCase().includes(busca.toLowerCase())),
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Carregar Ficha Técnica / Receita Padrão"
      subtitle="Selecione um modelo pré-configurado de produção para preencher o formulário"
      size="xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Coluna Esquerda: Lista de Padrões */}
        <div className="md:col-span-5 space-y-2 border-b md:border-b-0 md:border-r border-stone-200 dark:border-stone-800 pb-4 md:pb-0 md:pr-4">
          <div className="relative">
            <div className={FIELD_WRAPPER_CLASS}>
              <input
                type="text"
                placeholder="Buscar por código ou nome..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className={`${INPUT_CLASS} pl-8`}
              />
            </div>
            <Search size={14} className="absolute left-2.5 top-2.5 text-stone-400" />
          </div>

          <div className="max-h-80 overflow-y-auto space-y-1 pr-1">
            {loading ? (
              <div className="py-8 flex flex-col items-center justify-center text-stone-400 gap-2">
                <Loader2 size={20} className="animate-spin text-amber-500" />
                <span className="text-xs">Carregando fichas técnicas...</span>
              </div>
            ) : filtrados.length === 0 ? (
              <div className="py-6 text-center text-xs text-stone-400">
                Nenhuma ficha técnica encontrada.
              </div>
            ) : (
              filtrados.map((p) => {
                const ativo = padraoSelecionado?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => selecionarPadrao(p)}
                    className={`p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                      ativo
                        ? 'border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-200'
                        : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/60'
                    }`}
                  >
                    <div className="font-semibold text-sm flex items-center gap-1.5">
                      <ScrollText size={14} className="text-amber-500 shrink-0" />
                      <span className="truncate">{p.nome}</span>
                    </div>
                    {p.codigo && (
                      <span className="text-[11px] text-stone-400 font-mono">
                        Cód: {p.codigo}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Coluna Direita: Pré-visualização dos Itens */}
        <div className="md:col-span-7 space-y-3">
          {erro && (
            <div className="flex items-center gap-2 p-2.5 text-xs text-red-700 bg-red-50 dark:bg-red-950/40 dark:text-red-300 rounded-lg">
              <AlertCircle size={14} />
              <span>{erro}</span>
            </div>
          )}

          {!padraoSelecionado ? (
            <div className="h-64 flex flex-col items-center justify-center text-center text-stone-400 p-4 border border-dashed border-stone-200 dark:border-stone-800 rounded-xl">
              <ScrollText size={32} className="stroke-1 mb-2 text-stone-300 dark:text-stone-700" />
              <p className="text-xs">
                Selecione uma ficha técnica à esquerda para ver a composição de produtos e equipe técnica.
              </p>
            </div>
          ) : loadingDetalhes ? (
            <div className="h-64 flex flex-col items-center justify-center text-stone-400 gap-2">
              <Loader2 size={24} className="animate-spin text-amber-500" />
              <span className="text-xs">Carregando composição do padrão...</span>
            </div>
          ) : detalhes ? (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              <div className="font-semibold text-xs text-stone-700 dark:text-stone-300 flex items-center gap-1">
                <ArrowDownLeft size={14} className="text-emerald-500" />
                <span>Produtos Acabados (Entradas)</span>
              </div>
              <div className="space-y-1">
                {detalhes.produtos
                  .filter((p) => p.tipoMov === 'E')
                  .map((it, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded bg-stone-50 dark:bg-stone-800/60 text-xs flex items-center justify-between"
                    >
                      <span className="truncate font-medium">{it.descricao}</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400">
                        {formatDecimal(it.qtdadeUnControle)} un
                      </span>
                    </div>
                  ))}
              </div>

              <div className="font-semibold text-xs text-stone-700 dark:text-stone-300 flex items-center gap-1 pt-2">
                <ArrowUpRight size={14} className="text-blue-500" />
                <span>Insumos / Matérias-Primas (Saídas)</span>
              </div>
              <div className="space-y-1">
                {detalhes.produtos
                  .filter((p) => p.tipoMov === 'S')
                  .map((it, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded bg-stone-50 dark:bg-stone-800/60 text-xs flex items-center justify-between"
                    >
                      <span className="truncate font-medium">{it.descricao}</span>
                      <span className="font-mono text-stone-600 dark:text-stone-300">
                        {formatDecimal(it.qtdadeUnControle)} un
                      </span>
                    </div>
                  ))}
              </div>

              {detalhes.tecnicos && detalhes.tecnicos.length > 0 && (
                <>
                  <div className="font-semibold text-xs text-stone-700 dark:text-stone-300 flex items-center gap-1 pt-2">
                    <Users size={14} className="text-purple-500" />
                    <span>Equipe Técnica Prevista</span>
                  </div>
                  <div className="space-y-1">
                    {detalhes.tecnicos.map((tc, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded bg-stone-50 dark:bg-stone-800/60 text-xs flex items-center justify-between"
                      >
                        <span className="truncate font-medium">{tc.nomeTecnico}</span>
                        <span className="font-mono text-purple-600 dark:text-purple-400">
                          {tc.horasTotais}h ({tc.horaIni} às {tc.horaFim})
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 pt-4 mt-2 border-t border-stone-200 dark:border-stone-800">
        <button
          type="button"
          onClick={onClose}
          className="px-3 py-1.5 text-xs text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
        >
          Cancelar
        </button>
        <button
          type="button"
          disabled={!padraoSelecionado || !detalhes}
          onClick={handleConfirmar}
          className="px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:opacity-50 rounded-lg flex items-center gap-1.5 shadow-sm"
        >
          <Check size={14} />
          <span>Carregar na Produção</span>
        </button>
      </div>
    </Modal>
  );
};

import React, { useState, useEffect } from 'react';
import { Modal } from './Modal';
import { Lote } from '../types';
import { fetchLotes, criarLote } from '../services/api';
import { formatDateBR, formatDecimal, hojeISO } from '../utils/formatters';
import { INPUT_CLASS, LABEL_CLASS, FIELD_WRAPPER_CLASS } from '../utils/formStyles';
import { Tag, Plus, Check, Loader2, AlertCircle, Calendar } from 'lucide-react';

interface LoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  idPro: number;
  descricaoProduto: string;
  loteAtual?: string;
  onSelecionarLote: (lote: string, validade?: string) => void;
}

export const LoteModal: React.FC<LoteModalProps> = ({
  isOpen,
  onClose,
  idPro,
  descricaoProduto,
  loteAtual,
  onSelecionarLote,
}) => {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Modo novo lote
  const [modoNovo, setModoNovo] = useState(false);
  const [novoNome, setNovoNome] = useState('');
  const [fabricacao, setFabricacao] = useState(hojeISO());
  const [validade, setValidade] = useState(hojeISO(180));
  const [criando, setCriando] = useState(false);

  useEffect(() => {
    if (isOpen && idPro) {
      carregarLotes();
      setModoNovo(false);
      setNovoNome('');
      setErro(null);
    }
  }, [isOpen, idPro]);

  const carregarLotes = async () => {
    try {
      setLoading(true);
      const res = await fetchLotes(idPro);
      setLotes(res);
    } catch (err: any) {
      setErro(err.message || 'Erro ao consultar lotes do produto.');
    } finally {
      setLoading(false);
    }
  };

  const handleCriarLote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome.trim()) {
      setErro('Informe o código ou nome do lote.');
      return;
    }

    try {
      setCriando(true);
      setErro(null);
      await criarLote({
        idPro,
        lote: novoNome.trim(),
        fabricacao: fabricacao || undefined,
        validade: validade || undefined,
      });

      onSelecionarLote(novoNome.trim(), validade);
      onClose();
    } catch (err: any) {
      setErro(err.message || 'Erro ao cadastrar lote.');
    } finally {
      setCriando(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Controle de Lote"
      subtitle={`Produto: ${descricaoProduto || 'Selecione o produto'}`}
      size="md"
    >
      <div className="space-y-4">
        {erro && (
          <div className="flex items-center gap-2 p-3 text-xs text-red-700 bg-red-50 dark:bg-red-950/40 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-900">
            <AlertCircle size={15} className="shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {/* Alternador: Selecionar existente ou Criar novo */}
        <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
          <span className="text-xs font-semibold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
            {modoNovo ? 'Cadastrar Novo Lote' : 'Lotes Disponíveis'}
          </span>
          <button
            type="button"
            onClick={() => setModoNovo(!modoNovo)}
            className="text-xs font-medium text-amber-600 dark:text-amber-400 hover:text-amber-700 flex items-center gap-1 transition-colors"
          >
            {modoNovo ? 'Ver lotes existentes' : '+ Cadastrar novo lote'}
          </button>
        </div>

        {modoNovo ? (
          <form onSubmit={handleCriarLote} className="space-y-3">
            <div>
              <label className={LABEL_CLASS}>Identificação do Lote</label>
              <div className={FIELD_WRAPPER_CLASS}>
                <input
                  type="text"
                  required
                  value={novoNome}
                  onChange={(e) => setNovoNome(e.target.value.toUpperCase())}
                  placeholder="Ex: LOT-2026-001"
                  className={INPUT_CLASS}
                  autoFocus
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLASS}>Data de Fabricação</label>
                <div className={FIELD_WRAPPER_CLASS}>
                  <input
                    type="date"
                    value={fabricacao}
                    onChange={(e) => setFabricacao(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              <div>
                <label className={LABEL_CLASS}>Data de Validade</label>
                <div className={FIELD_WRAPPER_CLASS}>
                  <input
                    type="date"
                    value={validade}
                    onChange={(e) => setValidade(e.target.value)}
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setModoNovo(false)}
                className="px-3 py-1.5 text-xs text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={criando}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg flex items-center gap-1.5 disabled:opacity-50"
              >
                {criando ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                <span>Salvar e Selecionar</span>
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-2">
            {loading ? (
              <div className="py-8 flex flex-col items-center justify-center text-stone-400 gap-2">
                <Loader2 size={24} className="animate-spin text-amber-500" />
                <span className="text-xs">Consultando lotes...</span>
              </div>
            ) : lotes.length === 0 ? (
              <div className="py-6 text-center text-xs text-stone-500">
                Nenhum lote registrado para este produto.
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setModoNovo(true)}
                    className="text-amber-600 font-semibold hover:underline"
                  >
                    Clique aqui para cadastrar um novo lote
                  </button>
                </div>
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                {lotes.map((item) => {
                  const isSelecionado = loteAtual === item.lote;
                  return (
                    <div
                      key={item.id || item.lote}
                      onClick={() => {
                        onSelecionarLote(item.lote, item.validade);
                        onClose();
                      }}
                      className={`p-3 rounded-lg border text-xs cursor-pointer flex items-center justify-between transition-all ${
                        isSelecionado
                          ? 'border-amber-500 bg-amber-500/10 text-amber-900 dark:text-amber-200'
                          : 'border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-800/60'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-sm flex items-center gap-1.5">
                          <Tag size={13} className="text-amber-500" />
                          {item.lote}
                        </div>
                        <div className="text-[11px] text-stone-400 mt-0.5 flex items-center gap-3">
                          <span>Fab: {formatDateBR(item.fabricacao)}</span>
                          <span>Val: {formatDateBR(item.validade)}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-medium text-xs bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded">
                          Saldo: {formatDecimal(item.qtd)}
                        </span>
                        {isSelecionado && (
                          <span className="block text-[10px] text-amber-600 font-bold mt-1">
                            Atual
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

import React, { useState, useEffect } from 'react';
import { ItemProducao, TecnicoOP } from '../types';
import { fetchProducao, fetchTecnicosOP, excluirProducao } from '../services/api';
import {
  formatCurrencyBRL,
  formatDateBR,
  formatDecimal,
  formatQtd,
  hojeISO,
} from '../utils/formatters';
import { INPUT_CLASS, FIELD_WRAPPER_CLASS } from '../utils/formStyles';
import {
  PAINEL, BARRA, BTN_PRIMARIO, BTN_SECUNDARIO, GRADE_AREA, TABELA, TH, TH_INDICADOR, TH_ACOES,
  TR, TD, TD_INDICADOR, TD_ACOES, INDICADOR, BTN_ACAO, BTN_ACAO_EXCLUIR, TD_VAZIO, MSG_ERRO,
  MSG_SUCESSO, RODAPE,
} from '../utils/listaStyles';
import { ProducaoForm } from './ProducaoForm';
import { Modal } from './Modal';
import { ConfirmModal } from './ConfirmModal';
import { DateField } from './DateField';
import {
  Plus,
  Search,
  RefreshCw,
  Trash2,
  Users,
  Printer,
  ArrowDownLeft,
  ArrowUpRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ChevronRight,
  Inbox,
} from 'lucide-react';

interface ProducaoViewProps {
  onImprimirOp?: (idProducao: number) => void;
}

export const ProducaoView: React.FC<ProducaoViewProps> = ({ onImprimirOp }) => {
  // Controle de visão: lista ou formulário de nova OP
  const [modoFormulario, setModoFormulario] = useState(false);

  // Filtros
  const [d1, setD1] = useState(hojeISO(-30));
  const [d2, setD2] = useState(hojeISO());
  const [tipoMov, setTipoMov] = useState('');
  const [busca, setBusca] = useState('');

  // Dados
  const [itens, setItens] = useState<ItemProducao[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  // Modal de Técnicos da OP
  const [modalTecnicosAberto, setModalTecnicosAberto] = useState(false);
  const [opSelecionada, setOpSelecionada] = useState<number | null>(null);
  const [tecnicosOp, setTecnicosOp] = useState<TecnicoOP[]>([]);
  const [loadingTecnicos, setLoadingTecnicos] = useState(false);

  // Confirmação de Exclusão
  const [opParaExcluir, setOpParaExcluir] = useState<number | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  useEffect(() => {
    // Só recarrega com datas completas (o campo devolve '' enquanto está sendo digitado)
    if (d1 && d2) carregarMovimentos();
  }, [d1, d2, tipoMov]);

  const carregarMovimentos = async () => {
    try {
      setLoading(true);
      setErro(null);
      const res = await fetchProducao({
        d1,
        d2,
        tipo_mov: tipoMov || undefined,
        busca: busca.trim() || undefined,
      });
      setItens(res);
    } catch (err: any) {
      setErro(err.message || 'Erro ao carregar histórico de produção.');
    } finally {
      setLoading(false);
    }
  };

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    carregarMovimentos();
  };

  const abrirTecnicos = async (idProducao: number) => {
    setOpSelecionada(idProducao);
    setModalTecnicosAberto(true);
    try {
      setLoadingTecnicos(true);
      const res = await fetchTecnicosOP(idProducao);
      setTecnicosOp(res);
    } catch (err: any) {
      setErro(err.message || 'Erro ao consultar equipe da OP.');
    } finally {
      setLoadingTecnicos(false);
    }
  };

  const confirmarExclusao = async () => {
    if (!opParaExcluir) return;
    try {
      setExcluindo(true);
      await excluirProducao(opParaExcluir);
      setSucesso(`Ordem de Produção #${opParaExcluir} e seus lançamentos no Kardex foram estornados com sucesso!`);
      setTimeout(() => setSucesso(null), 4000);
      carregarMovimentos();
    } catch (err: any) {
      setErro(err.message || 'Erro ao excluir ordem de produção.');
    } finally {
      setExcluindo(false);
      setOpParaExcluir(null);
    }
  };

  // Se o usuário clicou em "Nova"
  if (modoFormulario) {
    return (
      <ProducaoForm
        onVoltar={() => {
          setModoFormulario(false);
          carregarMovimentos();
        }}
        onProducaoCriada={(idOp) => {
          setModoFormulario(false);
          setSucesso(`Ordem de Produção #${idOp} finalizada e gravada com sucesso!`);
          setTimeout(() => setSucesso(null), 5000);
          carregarMovimentos();
        }}
      />
    );
  }

  const totalEntradas = itens.filter((i) => i.tipoMov === 'E').length;
  const totalSaidas = itens.filter((i) => i.tipoMov === 'S').length;
  const valorTotalMovimentado = itens.reduce((acc, i) => acc + (i.custoTotalTotal || 0), 0);

  const campo = `${INPUT_CLASS} ${FIELD_WRAPPER_CLASS}`;

  return (
    <div className={PAINEL}>
      {/* Barra de ferramentas: filtros + nova OP */}
      <form onSubmit={handleBuscar} className={BARRA}>
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-36">
            <DateField value={d1} onChange={setD1} required className={campo} />
          </div>
          <span className="text-[11px] text-stone-400">até</span>
          <div className="w-36">
            <DateField value={d2} onChange={setD2} required className={campo} />
          </div>
          <select
            value={tipoMov}
            onChange={(e) => setTipoMov(e.target.value)}
            title="Tipo de movimento"
            className={`${campo} !w-44 cursor-pointer`}
          >
            <option value="">Todos os movimentos</option>
            <option value="E">Entradas (Fabricados)</option>
            <option value="S">Saídas (Insumos)</option>
          </select>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="relative w-52 sm:w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Produto, lote ou doc… (Enter)"
              className={`${campo} pl-9`}
            />
          </div>
          <button type="submit" disabled={loading} title="Recarregar" className={BTN_SECUNDARIO}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button type="button" onClick={() => setModoFormulario(true)} className={BTN_PRIMARIO}>
            <Plus className="w-3.5 h-3.5" />
            <span>Nova OP</span>
          </button>
        </div>
      </form>

      {erro && (
        <div className={MSG_ERRO}>
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{erro}</span>
        </div>
      )}
      {sucesso && (
        <div className={MSG_SUCESSO}>
          <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{sucesso}</span>
        </div>
      )}

      {/* Grade de Histórico */}
      <div className={GRADE_AREA}>
        <table className={TABELA}>
          <thead className="sticky top-0 z-10">
            <tr>
              <th className={TH_INDICADOR} />
              <th className={`${TH} w-16`}>Tipo</th>
              <th className={`${TH} w-20`}>OP</th>
              <th className={`${TH} w-24`}>Data</th>
              <th className={`${TH} w-32`}>Documento</th>
              <th className={TH}>Produto / Insumo</th>
              <th className={`${TH} w-24`}>Qtd Contr.</th>
              <th className={`${TH} w-14`}>UN</th>
              <th className={`${TH} w-28`}>Qtd Estoque</th>
              <th className={`${TH} w-28`}>Custo Unit</th>
              <th className={`${TH} w-32`}>Custo Total</th>
              <th className={`${TH} w-28`}>Lote</th>
              <th className={TH_ACOES}>Ações</th>
            </tr>
          </thead>
          <tbody className={loading && itens.length > 0 ? 'opacity-60' : undefined}>
            {loading && itens.length === 0 ? (
              <tr>
                <td colSpan={13} className={TD_VAZIO}>
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Carregando dados da produção…
                  </span>
                </td>
              </tr>
            ) : itens.length === 0 ? (
              <tr>
                <td colSpan={13} className={TD_VAZIO}>
                  <div className="flex flex-col items-center gap-2">
                    <Inbox className="w-8 h-8" />
                    <span className="text-sm font-medium text-stone-600 dark:text-stone-300">
                      Nenhuma movimentação de produção no período selecionado
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              itens.map((it) => {
                const isEntrada = it.tipoMov === 'E';
                return (
                  <tr key={it.id} className={TR}>
                    <td className={TD_INDICADOR}>
                      <ChevronRight className={INDICADOR} />
                    </td>
                    <td className={`${TD} text-center`}>
                      <span
                        className={`inline-flex items-center gap-0.5 font-bold text-[11px] ${
                          isEntrada ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        {isEntrada ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                        {isEntrada ? 'E' : 'S'}
                      </span>
                    </td>
                    <td className={`${TD} text-right font-mono`}>{it.idProducao}</td>
                    <td className={`${TD} text-center`}>{formatDateBR(it.data || it.dataOp)}</td>
                    <td className={`${TD} font-mono`}>{it.descricaoOp || '–'}</td>
                    <td className={TD}>
                      <span className="font-semibold text-stone-900 dark:text-stone-100">{it.descricaoProduto}</span>
                      <span className="ml-1.5 text-[11px] font-mono text-stone-400">#{it.idPro}</span>
                    </td>
                    <td className={`${TD} text-right font-mono`}>{formatQtd(it.qtdadeUnControle)}</td>
                    <td className={`${TD} text-center font-mono`}>{it.unControle || 'UN'}</td>
                    <td className={`${TD} text-right font-mono`}>
                      {formatQtd(it.qtdadeUnEstoque)} {it.unEstoque}
                    </td>
                    <td className={`${TD} text-right font-mono`}>{formatCurrencyBRL(it.custoTotalUnit)}</td>
                    <td
                      className={`${TD} text-right font-mono font-semibold ${
                        isEntrada ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {formatCurrencyBRL(it.custoTotalTotal)}
                    </td>
                    <td className={`${TD} font-mono`}>{it.lote || '–'}</td>
                    <td className={TD_ACOES}>
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => abrirTecnicos(it.idProducao)}
                          title="Ver técnicos apontados na OP"
                          className={BTN_ACAO}
                        >
                          <Users className="w-3.5 h-3.5" />
                        </button>
                        {onImprimirOp && (
                          <button
                            type="button"
                            onClick={() => onImprimirOp(it.idProducao)}
                            title="Imprimir OP"
                            className={BTN_ACAO}
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setOpParaExcluir(it.idProducao)}
                          title="Excluir Ordem de Produção (estornar estoque e kardex)"
                          className={BTN_ACAO_EXCLUIR}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Totais ao pé */}
      <div className={RODAPE}>
        <span>
          Itens: <strong className="text-stone-800 dark:text-stone-200">{itens.length}</strong>
        </span>
        <span>
          Entradas: <strong className="text-emerald-600 dark:text-emerald-400">{totalEntradas}</strong>
        </span>
        <span>
          Saídas / Insumos: <strong className="text-blue-600 dark:text-blue-400">{totalSaidas}</strong>
        </span>
        <span className="ml-auto">
          Valor total:{' '}
          <strong className="font-mono text-stone-800 dark:text-stone-200">{formatCurrencyBRL(valorTotalMovimentado)}</strong>
        </span>
      </div>

      {/* Modal de Técnicos da OP */}
      {modalTecnicosAberto && (
        <Modal
          isOpen={modalTecnicosAberto}
          onClose={() => setModalTecnicosAberto(false)}
          title={`Equipe Técnica da OP #${opSelecionada}`}
          subtitle="Horas trabalhadas e valores de mão de obra registrados"
          size="lg"
        >
          {loadingTecnicos ? (
            <div className="py-8 flex items-center justify-center text-stone-400 gap-2 text-xs">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Consultando técnicos da OP…</span>
            </div>
          ) : tecnicosOp.length === 0 ? (
            <div className="py-8 text-center text-xs text-stone-400">
              Nenhum apontamento de técnico registrado para esta ordem de produção.
            </div>
          ) : (
            <div className="overflow-x-auto border border-stone-200 dark:border-stone-800">
              <table className={TABELA}>
                <thead>
                  <tr>
                    <th className={TH}>Técnico</th>
                    <th className={TH}>Data</th>
                    <th className={TH}>Horário</th>
                    <th className={TH}>Horas</th>
                    <th className={TH}>Valor/Hora</th>
                    <th className={TH}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {tecnicosOp.map((tc) => (
                    <tr key={tc.id} className={TR}>
                      <td className={`${TD} font-medium`}>{tc.nomeTecnico}</td>
                      <td className={`${TD} text-center`}>{formatDateBR(tc.data)}</td>
                      <td className={`${TD} text-center font-mono`}>
                        {tc.horaIni} às {tc.horaFim}
                      </td>
                      <td className={`${TD} text-right font-mono`}>{formatDecimal(tc.horasTotais)} h</td>
                      <td className={`${TD} text-right font-mono`}>{formatCurrencyBRL(tc.valorHora)}</td>
                      <td className={`${TD} text-right font-mono font-semibold`}>{formatCurrencyBRL(tc.valorTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal>
      )}

      {opParaExcluir && (
        <ConfirmModal
          titulo={`Excluir OP #${opParaExcluir}`}
          mensagem={
            <>
              Você tem certeza que deseja excluir esta Ordem de Produção?
              <strong className="text-rose-600 dark:text-rose-400 mt-2 block">
                Atenção: os produtos acabados e insumos serão estornados do Kardex (CARDEX), dos saldos de lotes
                (PRODUTOSLOTES) e do estoque da empresa.
              </strong>
            </>
          }
          textoConfirmar="Excluir e Estornar"
          processando={excluindo}
          onConfirmar={confirmarExclusao}
          onCancelar={() => setOpParaExcluir(null)}
        />
      )}
    </div>
  );
};

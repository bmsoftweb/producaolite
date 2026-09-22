import React, { useState, useEffect } from 'react';
import { Tecnico, CentroCusto } from '../types';
import {
  fetchTecnicos,
  criarTecnico,
  atualizarTecnico,
  excluirTecnico,
  fetchCentrosCusto,
} from '../services/api';
import { formatCurrencyBRL } from '../utils/formatters';
import { INPUT_CLASS, LABEL_CLASS, FIELD_WRAPPER_CLASS } from '../utils/formStyles';
import {
  PAINEL, BARRA, BARRA_INFO, BTN_PRIMARIO, BTN_SECUNDARIO, GRADE_AREA, TABELA, TH, TH_INDICADOR,
  TH_ACOES, TR, TD, TD_INDICADOR, TD_ACOES, INDICADOR, BTN_ACAO, BTN_ACAO_EXCLUIR, TD_VAZIO,
  MSG_ERRO, MSG_SUCESSO,
} from '../utils/listaStyles';
import { Modal } from './Modal';
import { ConfirmModal } from './ConfirmModal';
import { NumberField } from './NumberField';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Save,
  ChevronRight,
  Inbox,
} from 'lucide-react';

export const TecnicosView: React.FC = () => {
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [centrosCusto, setCentrosCusto] = useState<CentroCusto[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  // Modal Novo / Editar
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Partial<Tecnico> | null>(null);
  const [salvando, setSalvando] = useState(false);

  // Confirmação de exclusão
  const [excluindo, setExcluindo] = useState<Tecnico | null>(null);
  const [processandoExclusao, setProcessandoExclusao] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      setErro(null);
      const [tecs, ccs] = await Promise.all([
        fetchTecnicos(),
        fetchCentrosCusto().catch(() => []),
      ]);
      setTecnicos(tecs);
      setCentrosCusto(ccs);
    } catch (err: any) {
      setErro(err.message || 'Erro ao carregar técnicos.');
    } finally {
      setLoading(false);
    }
  };

  const abrirNovo = () => {
    setEditando({
      nome: '',
      valorHora: 0,
      idCc: centrosCusto[0]?.id || 0,
    });
    setModalAberto(true);
  };

  const abrirEdicao = (t: Tecnico) => {
    setEditando({ ...t });
    setModalAberto(true);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editando || !editando.nome?.trim()) {
      setErro('Informe o nome do técnico.');
      return;
    }

    try {
      setSalvando(true);
      setErro(null);

      if (editando.id) {
        await atualizarTecnico(editando.id, {
          nome: editando.nome.trim(),
          valorHora: Number(editando.valorHora) || 0,
          idCc: Number(editando.idCc) || 0,
        });
        setSucesso(`Técnico "${editando.nome}" atualizado com sucesso!`);
      } else {
        await criarTecnico({
          nome: editando.nome.trim(),
          valorHora: Number(editando.valorHora) || 0,
          idCc: Number(editando.idCc) || 0,
        });
        setSucesso(`Técnico "${editando.nome}" cadastrado com sucesso!`);
      }

      setModalAberto(false);
      setTimeout(() => setSucesso(null), 3000);
      carregarDados();
    } catch (err: any) {
      setErro(err.message || 'Erro ao salvar dados do técnico.');
    } finally {
      setSalvando(false);
    }
  };

  const confirmarExclusao = async () => {
    if (!excluindo) return;
    const { id, nome } = excluindo;
    try {
      setProcessandoExclusao(true);
      await excluirTecnico(id);
      setSucesso(`Técnico "${nome}" excluído com sucesso!`);
      setTimeout(() => setSucesso(null), 3000);
      carregarDados();
    } catch (err: any) {
      setErro(err.message || 'Erro ao excluir técnico.');
    } finally {
      setProcessandoExclusao(false);
      setExcluindo(null);
    }
  };

  const filtrados = tecnicos.filter(
    (t) =>
      t.nome.toLowerCase().includes(busca.toLowerCase()) ||
      t.descricaoCc?.toLowerCase().includes(busca.toLowerCase()) ||
      String(t.id).includes(busca),
  );

  return (
    <div className={PAINEL}>
      {/* Barra de ferramentas */}
      <div className={BARRA}>
        <div className={BARRA_INFO}>
          {loading ? 'Carregando técnicos…' : `${filtrados.length} de ${tecnicos.length} técnico(s)`}
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="relative w-52 sm:w-64 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar…"
              className={`${INPUT_CLASS} ${FIELD_WRAPPER_CLASS} pl-9`}
            />
          </div>
          <button type="button" onClick={carregarDados} disabled={loading} title="Recarregar" className={BTN_SECUNDARIO}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button type="button" onClick={abrirNovo} className={BTN_PRIMARIO}>
            <Plus className="w-3.5 h-3.5" />
            <span>Novo</span>
          </button>
        </div>
      </div>

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

      {/* Grade */}
      <div className={GRADE_AREA}>
        <table className={TABELA}>
          <thead className="sticky top-0 z-10">
            <tr>
              <th className={TH_INDICADOR} />
              <th className={`${TH} w-20`}>ID</th>
              <th className={TH}>Nome do Técnico / Operador</th>
              <th className={`${TH} w-36`}>Valor Hora</th>
              <th className={`${TH} w-56`}>Centro de Custo</th>
              <th className={TH_ACOES}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading && tecnicos.length === 0 ? (
              <tr>
                <td colSpan={6} className={TD_VAZIO}>
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Carregando técnicos…
                  </span>
                </td>
              </tr>
            ) : filtrados.length === 0 ? (
              <tr>
                <td colSpan={6} className={TD_VAZIO}>
                  <div className="flex flex-col items-center gap-2">
                    <Inbox className="w-8 h-8" />
                    <span className="text-sm font-medium text-stone-600 dark:text-stone-300">
                      Nenhum técnico encontrado
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              filtrados.map((t) => (
                <tr key={t.id} className={TR} onDoubleClick={() => abrirEdicao(t)}>
                  <td className={TD_INDICADOR}>
                    <ChevronRight className={INDICADOR} />
                  </td>
                  <td className={`${TD} text-right font-mono`}>{t.id}</td>
                  <td className={`${TD} font-semibold text-stone-900 dark:text-stone-100`}>{t.nome}</td>
                  <td className={`${TD} text-right font-mono`}>{formatCurrencyBRL(t.valorHora)}</td>
                  <td className={TD}>{t.descricaoCc || 'Padrão da Empresa'}</td>
                  <td className={TD_ACOES}>
                    <div className="inline-flex items-center gap-1">
                      <button type="button" onClick={() => abrirEdicao(t)} title="Editar técnico" className={BTN_ACAO}>
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => setExcluindo(t)} title="Excluir técnico" className={BTN_ACAO_EXCLUIR}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Criar / Editar Técnico */}
      {modalAberto && editando && (
        <Modal
          isOpen={modalAberto}
          onClose={() => setModalAberto(false)}
          title={editando.id ? 'Editar Técnico' : 'Novo Técnico'}
          subtitle="Informe os dados para cálculo de mão de obra nas ordens de produção"
          size="sm"
        >
          <form onSubmit={handleSalvar} className="space-y-4">
            <div>
              <label className={LABEL_CLASS}>Nome Completo</label>
              <div className={FIELD_WRAPPER_CLASS}>
                <input
                  type="text"
                  required
                  value={editando.nome || ''}
                  onChange={(e) => setEditando({ ...editando, nome: e.target.value })}
                  placeholder="Ex: João da Silva"
                  className={INPUT_CLASS}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className={LABEL_CLASS}>Valor da Hora (R$)</label>
              <div className={FIELD_WRAPPER_CLASS}>
                <NumberField
                  scale={2}
                  required
                  value={editando.valorHora ?? ''}
                  onChange={(v) => setEditando({ ...editando, valorHora: Number(v) || 0 })}
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <div>
              <label className={LABEL_CLASS}>Centro de Custo Padrão</label>
              <div className={FIELD_WRAPPER_CLASS}>
                <select
                  value={editando.idCc || 0}
                  onChange={(e) =>
                    setEditando({ ...editando, idCc: parseInt(e.target.value, 10) || 0 })
                  }
                  className={INPUT_CLASS}
                >
                  <option value="0">Padrão</option>
                  {centrosCusto.map((cc) => (
                    <option key={cc.id} value={cc.id}>
                      {cc.descricao}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
              <button type="button" onClick={() => setModalAberto(false)} className={BTN_SECUNDARIO}>
                Cancelar
              </button>
              <button type="submit" disabled={salvando} className={BTN_PRIMARIO}>
                {salvando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Salvar</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {excluindo && (
        <ConfirmModal
          titulo="Excluir técnico"
          mensagem={
            <>
              Tem certeza que deseja excluir o técnico <strong>{excluindo.nome}</strong>?
            </>
          }
          processando={processandoExclusao}
          onConfirmar={confirmarExclusao}
          onCancelar={() => setExcluindo(null)}
        />
      )}
    </div>
  );
};

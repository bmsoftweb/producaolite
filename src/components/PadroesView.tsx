import React, { useState, useEffect } from 'react';
import { PadraoProd, ProdutoPrincipal, Tecnico } from '../types';
import {
  fetchPadroes,
  fetchPadraoItens,
  salvarPadrao,
  excluirPadrao,
  buscarProduto,
  fetchTecnicos,
} from '../services/api';
import { formatDecimal, formatQtd } from '../utils/formatters';
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
  Trash2,
  RefreshCw,
  ArrowDownLeft,
  ArrowUpRight,
  Users,
  Eye,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Save,
  ChevronRight,
  Inbox,
} from 'lucide-react';

/** Tabela interna dos modais (composição da ficha), no mesmo estilo chapado da grade */
const SUB_TABELA = 'w-full text-left text-xs border border-stone-200 dark:border-stone-800';
const SUB_TH = 'px-3 py-2 font-semibold text-stone-500 bg-stone-50 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800';
const SUB_TD = 'px-3 py-1.5 border-b border-stone-100 dark:border-stone-800/60';

export const PadroesView: React.FC = () => {
  const [padroes, setPadroes] = useState<PadraoProd[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  // Visualização de Itens do Padrão
  const [modalDetalhesAberto, setModalDetalhesAberto] = useState(false);
  const [padraoVisualizando, setPadraoVisualizando] = useState<PadraoProd | null>(null);
  const [itensPadrao, setItensPadrao] = useState<{ produtos: any[]; tecnicos: any[] } | null>(null);
  const [loadingDetalhes, setLoadingDetalhes] = useState(false);

  // Modal Novo Padrão
  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [novoCodigo, setNovoCodigo] = useState('');
  const [novoNome, setNovoNome] = useState('');
  const [produtosNovo, setProdutosNovo] = useState<
    { tipoMov: 'E' | 'S'; idPro: number; descricao: string; qtdadeUnControle: number }[]
  >([]);
  const [tecnicosNovo, setTecnicosNovo] = useState<
    { idTecnico: number; nomeTecnico: string; horasTotais: number; valorHora: number }[]
  >([]);
  const [salvandoNovo, setSalvandoNovo] = useState(false);

  // Apoio para novo padrão
  const [buscaProd, setBuscaProd] = useState('');
  const [sugestoesProd, setSugestoesProd] = useState<ProdutoPrincipal[]>([]);
  const [tipoMovNovo, setTipoMovNovo] = useState<'E' | 'S'>('E');
  const [tecnicosDisponiveis, setTecnicosDisponiveis] = useState<Tecnico[]>([]);

  // Confirmações de exclusão/remoção
  const [excluindo, setExcluindo] = useState<PadraoProd | null>(null);
  const [processandoExclusao, setProcessandoExclusao] = useState(false);
  const [removendo, setRemovendo] = useState<{ tipo: 'produto' | 'tecnico'; idx: number; nome: string } | null>(null);

  useEffect(() => {
    carregarPadroes();
    fetchTecnicos().then(setTecnicosDisponiveis).catch(() => {});
  }, []);

  const carregarPadroes = async () => {
    try {
      setLoading(true);
      setErro(null);
      const res = await fetchPadroes();
      setPadroes(res);
    } catch (err: any) {
      setErro(err.message || 'Erro ao carregar fichas técnicas.');
    } finally {
      setLoading(false);
    }
  };

  const verDetalhes = async (padrao: PadraoProd) => {
    setPadraoVisualizando(padrao);
    setModalDetalhesAberto(true);
    try {
      setLoadingDetalhes(true);
      const res = await fetchPadraoItens(padrao.id);
      setItensPadrao(res);
    } catch (err: any) {
      setErro(err.message || 'Erro ao carregar itens da ficha técnica.');
    } finally {
      setLoadingDetalhes(false);
    }
  };

  const confirmarExclusao = async () => {
    if (!excluindo) return;
    const { id, nome } = excluindo;
    try {
      setProcessandoExclusao(true);
      await excluirPadrao(id);
      setSucesso(`Ficha técnica "${nome}" excluída com sucesso!`);
      setTimeout(() => setSucesso(null), 3000);
      carregarPadroes();
    } catch (err: any) {
      setErro(err.message || 'Erro ao excluir ficha técnica.');
    } finally {
      setProcessandoExclusao(false);
      setExcluindo(null);
    }
  };

  const confirmarRemocao = () => {
    if (!removendo) return;
    if (removendo.tipo === 'produto') {
      setProdutosNovo((prev) => prev.filter((_, i) => i !== removendo.idx));
    } else {
      setTecnicosNovo((prev) => prev.filter((_, i) => i !== removendo.idx));
    }
    setRemovendo(null);
  };

  // Busca rápida de produto no modal novo
  useEffect(() => {
    if (!buscaProd.trim() || buscaProd.length < 2) {
      setSugestoesProd([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await buscarProduto(buscaProd);
        setSugestoesProd(res);
      } catch {
        setSugestoesProd([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [buscaProd]);

  const adicionarProdutoNovo = (p: ProdutoPrincipal) => {
    setProdutosNovo((prev) => [
      ...prev,
      {
        tipoMov: tipoMovNovo,
        idPro: p.id,
        descricao: p.descricao,
        qtdadeUnControle: 1,
      },
    ]);
    setBuscaProd('');
    setSugestoesProd([]);
  };

  const adicionarTecnicoNovo = (t: Tecnico) => {
    setTecnicosNovo((prev) => [
      ...prev,
      {
        idTecnico: t.id,
        nomeTecnico: t.nome,
        horasTotais: 1,
        valorHora: t.valorHora || 0,
      },
    ]);
  };

  const salvarNovoPadrao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoNome.trim()) {
      setErro('Informe o nome da ficha técnica.');
      return;
    }
    if (produtosNovo.length === 0) {
      setErro('Adicione pelo menos um produto (Entrada ou Saída) à ficha técnica.');
      return;
    }

    try {
      setSalvandoNovo(true);
      await salvarPadrao({
        codigo: novoCodigo.trim() || undefined,
        nome: novoNome.trim(),
        produtos: produtosNovo.map((p) => ({
          tipoMov: p.tipoMov,
          idPro: p.idPro,
          qtdadeUnControle: p.qtdadeUnControle,
        })),
        tecnicos: tecnicosNovo.map((t) => ({
          idTecnico: t.idTecnico,
          horaIni: '08:00',
          horaFim: '09:00',
          horasTotais: t.horasTotais,
          valorHora: t.valorHora,
          valorTotal: t.horasTotais * t.valorHora,
        })),
      });

      setModalNovoAberto(false);
      setNovoCodigo('');
      setNovoNome('');
      setProdutosNovo([]);
      setTecnicosNovo([]);
      setSucesso(`Ficha técnica "${novoNome.trim()}" cadastrada com sucesso!`);
      setTimeout(() => setSucesso(null), 3000);
      carregarPadroes();
    } catch (err: any) {
      setErro(err.message || 'Erro ao cadastrar ficha técnica.');
    } finally {
      setSalvandoNovo(false);
    }
  };

  const filtrados = padroes.filter(
    (p) =>
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (p.codigo && p.codigo.toLowerCase().includes(busca.toLowerCase())),
  );

  const tabelaComposicao = (titulo: React.ReactNode, cor: string, colunaNome: string, linhas: any[], valor: (it: any) => string, colunaValor = 'Qtd Base') => (
    <div>
      <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2 ${cor}`}>{titulo}</h4>
      <table className={SUB_TABELA}>
        <thead>
          <tr>
            <th className={SUB_TH}>{colunaNome}</th>
            <th className={`${SUB_TH} text-right w-28`}>{colunaValor}</th>
          </tr>
        </thead>
        <tbody>
          {linhas.length === 0 ? (
            <tr>
              <td colSpan={2} className={`${SUB_TD} text-center text-stone-400 py-3`}>
                Nenhum item
              </td>
            </tr>
          ) : (
            linhas.map((it, idx) => (
              <tr key={idx}>
                <td className={`${SUB_TD} font-medium`}>{it.descricao ?? it.nomeTecnico}</td>
                <td className={`${SUB_TD} text-right font-mono`}>{valor(it)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className={PAINEL}>
      {/* Barra de ferramentas */}
      <div className={BARRA}>
        <div className={BARRA_INFO}>
          {loading ? 'Carregando fichas técnicas…' : `${filtrados.length} de ${padroes.length} ficha(s) técnica(s)`}
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
          <button type="button" onClick={carregarPadroes} disabled={loading} title="Recarregar" className={BTN_SECUNDARIO}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => {
              setNovoCodigo('');
              setNovoNome('');
              setProdutosNovo([]);
              setTecnicosNovo([]);
              setModalNovoAberto(true);
            }}
            className={BTN_PRIMARIO}
          >
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
              <th className={`${TH} w-40`}>Código</th>
              <th className={TH}>Nome / Descrição da Ficha Técnica</th>
              <th className={TH_ACOES}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading && padroes.length === 0 ? (
              <tr>
                <td colSpan={5} className={TD_VAZIO}>
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Carregando fichas técnicas…
                  </span>
                </td>
              </tr>
            ) : filtrados.length === 0 ? (
              <tr>
                <td colSpan={5} className={TD_VAZIO}>
                  <div className="flex flex-col items-center gap-2">
                    <Inbox className="w-8 h-8" />
                    <span className="text-sm font-medium text-stone-600 dark:text-stone-300">
                      Nenhuma ficha técnica encontrada
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              filtrados.map((p) => (
                <tr key={p.id} className={TR} onDoubleClick={() => verDetalhes(p)}>
                  <td className={TD_INDICADOR}>
                    <ChevronRight className={INDICADOR} />
                  </td>
                  <td className={`${TD} text-right font-mono`}>{p.id}</td>
                  <td className={`${TD} font-mono`}>{p.codigo || '–'}</td>
                  <td className={`${TD} font-semibold text-stone-900 dark:text-stone-100`}>{p.nome}</td>
                  <td className={TD_ACOES}>
                    <div className="inline-flex items-center gap-1">
                      <button type="button" onClick={() => verDetalhes(p)} title="Ver composição da ficha técnica" className={BTN_ACAO}>
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => setExcluindo(p)} title="Excluir ficha técnica" className={BTN_ACAO_EXCLUIR}>
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

      {/* Modal de Detalhes da Ficha Técnica */}
      {modalDetalhesAberto && padraoVisualizando && (
        <Modal
          isOpen={modalDetalhesAberto}
          onClose={() => setModalDetalhesAberto(false)}
          title={`Ficha Técnica: ${padraoVisualizando.nome}`}
          subtitle={`Código: ${padraoVisualizando.codigo || 'Sem código'} • ID #${padraoVisualizando.id}`}
          size="lg"
        >
          {loadingDetalhes ? (
            <div className="py-8 flex items-center justify-center text-stone-400 gap-2 text-xs">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Consultando composição…</span>
            </div>
          ) : itensPadrao ? (
            <div className="space-y-4">
              {tabelaComposicao(
                <><ArrowDownLeft size={14} /> Produtos Fabricados (Entradas)</>,
                'text-emerald-600 dark:text-emerald-400',
                'Produto',
                itensPadrao.produtos.filter((p) => p.tipoMov === 'E'),
                (it) => formatQtd(it.qtdadeUnControle),
              )}
              {tabelaComposicao(
                <><ArrowUpRight size={14} /> Matérias-Primas / Insumos (Saídas)</>,
                'text-blue-600 dark:text-blue-400',
                'Insumo',
                itensPadrao.produtos.filter((p) => p.tipoMov === 'S'),
                (it) => formatQtd(it.qtdadeUnControle),
              )}
              {itensPadrao.tecnicos?.length > 0 &&
                tabelaComposicao(
                  <><Users size={14} /> Equipe Técnica Prevista</>,
                  'text-purple-600 dark:text-purple-400',
                  'Técnico',
                  itensPadrao.tecnicos,
                  (tc) => `${formatDecimal(tc.horasTotais)} h`,
                  'Horas',
                )}
            </div>
          ) : null}
        </Modal>
      )}

      {/* Modal Criar Nova Ficha Técnica */}
      {modalNovoAberto && (
        <Modal
          isOpen={modalNovoAberto}
          onClose={() => setModalNovoAberto(false)}
          title="Nova Ficha Técnica / Receita Padrão"
          subtitle="Defina o modelo de composição para produtos e equipe"
          size="xl"
        >
          <form onSubmit={salvarNovoPadrao} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLASS}>Código (opcional)</label>
                <div className={FIELD_WRAPPER_CLASS}>
                  <input
                    type="text"
                    value={novoCodigo}
                    onChange={(e) => setNovoCodigo(e.target.value.toUpperCase())}
                    placeholder="Ex: MOD-01"
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              <div>
                <label className={LABEL_CLASS}>Nome / Descrição da Receita</label>
                <div className={FIELD_WRAPPER_CLASS}>
                  <input
                    type="text"
                    required
                    value={novoNome}
                    onChange={(e) => setNovoNome(e.target.value)}
                    placeholder="Ex: Conjunto Motorizado A"
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
            </div>

            {/* Inclusão de Produto */}
            <div className="pt-2 border-t border-stone-200 dark:border-stone-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider">
                  Itens da Ficha Técnica
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setTipoMovNovo('E')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                      tipoMovNovo === 'E'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    + Entrada (Fabricado)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoMovNovo('S')}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                      tipoMovNovo === 'S'
                        ? 'bg-blue-500 text-white'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                    }`}
                  >
                    + Saída (Insumo)
                  </button>
                </div>
              </div>

              <div className="relative">
                <div className={`relative ${FIELD_WRAPPER_CLASS}`}>
                  <input
                    type="text"
                    value={buscaProd}
                    onChange={(e) => setBuscaProd(e.target.value)}
                    placeholder={`Pesquisar produto para adicionar como ${
                      tipoMovNovo === 'E' ? 'Entrada (Fabricado)' : 'Saída (Insumo)'
                    }...`}
                    className={`${INPUT_CLASS} pl-8`}
                  />
                  <Search size={14} className="absolute left-2.5 top-2.5 text-stone-400" />
                </div>

                {sugestoesProd.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg shadow-lg z-30 max-h-48 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800">
                    {sugestoesProd.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => adicionarProdutoNovo(p)}
                        className="p-2 text-xs hover:bg-amber-500/10 cursor-pointer flex items-center justify-between"
                      >
                        <span className="font-semibold">{p.descricao}</span>
                        <span className="text-stone-400 font-mono">#{p.id}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Produtos adicionados */}
              <div className="max-h-40 overflow-y-auto border border-stone-200 dark:border-stone-800 divide-y divide-stone-100 dark:divide-stone-800">
                {produtosNovo.length === 0 ? (
                  <div className="p-4 text-center text-xs text-stone-400">
                    Nenhum produto adicionado à ficha técnica ainda.
                  </div>
                ) : (
                  produtosNovo.map((it, idx) => (
                    <div key={idx} className="px-3 py-1.5 text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                            it.tipoMov === 'E'
                              ? 'bg-emerald-500/15 text-emerald-600'
                              : 'bg-blue-500/15 text-blue-600'
                          }`}
                        >
                          {it.tipoMov}
                        </span>
                        <span className="font-medium">{it.descricao}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <NumberField
                          scale={4}
                          value={it.qtdadeUnControle}
                          onChange={(v) => {
                            const q = Number(v) || 0;
                            setProdutosNovo((prev) =>
                              prev.map((p, i) => (i === idx ? { ...p, qtdadeUnControle: q } : p)),
                            );
                          }}
                          className={`${INPUT_CLASS} ${FIELD_WRAPPER_CLASS} w-28`}
                        />
                        <button
                          type="button"
                          onClick={() => setRemovendo({ tipo: 'produto', idx, nome: it.descricao })}
                          title="Remover item"
                          className={BTN_ACAO_EXCLUIR}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Inclusão de Técnicos */}
            <div className="pt-2 border-t border-stone-200 dark:border-stone-800 space-y-2">
              <span className="text-xs font-bold text-stone-700 dark:text-stone-300 uppercase tracking-wider block">
                Técnicos Previstos (opcional)
              </span>

              <div className="flex flex-wrap gap-1.5">
                {tecnicosDisponiveis.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => adicionarTecnicoNovo(t)}
                    className="px-2 py-1 text-xs rounded bg-stone-100 dark:bg-stone-800 hover:bg-purple-50 hover:text-purple-600 transition-colors flex items-center gap-1"
                  >
                    <Plus size={11} />
                    <span>{t.nome}</span>
                  </button>
                ))}
              </div>

              {tecnicosNovo.length > 0 && (
                <div className="max-h-32 overflow-y-auto border border-stone-200 dark:border-stone-800 divide-y divide-stone-100 dark:divide-stone-800">
                  {tecnicosNovo.map((tc, idx) => (
                    <div key={idx} className="px-3 py-1.5 text-xs flex items-center justify-between">
                      <span className="font-medium">{tc.nomeTecnico}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-stone-400">Horas:</span>
                        <NumberField
                          scale={2}
                          value={tc.horasTotais}
                          onChange={(v) => {
                            const h = Number(v) || 0;
                            setTecnicosNovo((prev) =>
                              prev.map((t, i) => (i === idx ? { ...t, horasTotais: h } : t)),
                            );
                          }}
                          className={`${INPUT_CLASS} ${FIELD_WRAPPER_CLASS} w-20`}
                        />
                        <button
                          type="button"
                          onClick={() => setRemovendo({ tipo: 'tecnico', idx, nome: tc.nomeTecnico })}
                          title="Remover técnico"
                          className={BTN_ACAO_EXCLUIR}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
              <button type="button" onClick={() => setModalNovoAberto(false)} className={BTN_SECUNDARIO}>
                Cancelar
              </button>
              <button type="submit" disabled={salvandoNovo || produtosNovo.length === 0} className={BTN_PRIMARIO}>
                {salvandoNovo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Salvar</span>
              </button>
            </div>
          </form>
        </Modal>
      )}

      {excluindo && (
        <ConfirmModal
          titulo="Excluir ficha técnica"
          mensagem={
            <>
              Tem certeza que deseja excluir a ficha técnica <strong>{excluindo.nome}</strong>?
            </>
          }
          processando={processandoExclusao}
          onConfirmar={confirmarExclusao}
          onCancelar={() => setExcluindo(null)}
        />
      )}

      {removendo && (
        <ConfirmModal
          titulo={removendo.tipo === 'produto' ? 'Remover item' : 'Remover técnico'}
          mensagem={
            <>
              Remover <strong>{removendo.nome}</strong> desta ficha técnica?
            </>
          }
          textoConfirmar="Remover"
          onConfirmar={confirmarRemocao}
          onCancelar={() => setRemovendo(null)}
        />
      )}
    </div>
  );
};

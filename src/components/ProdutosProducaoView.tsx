import React, { useState, useEffect } from 'react';
import { ProdutoEsp, ProdutoPrincipal } from '../types';
import { fetchProdutosEsp, salvarProdutoEsp, buscarProduto } from '../services/api';
import { formatDecimal } from '../utils/formatters';
import { INPUT_CLASS, LABEL_CLASS, FIELD_WRAPPER_CLASS } from '../utils/formStyles';
import {
  PAINEL, BARRA, BARRA_INFO, BTN_PRIMARIO, BTN_SECUNDARIO, GRADE_AREA, TABELA, TH, TH_INDICADOR,
  TH_ACOES, TR, TD, TD_INDICADOR, TD_ACOES, INDICADOR, BTN_ACAO, TD_VAZIO, MSG_ERRO, MSG_SUCESSO,
} from '../utils/listaStyles';
import { Modal } from './Modal';
import { NumberField } from './NumberField';
import { Toggle } from './Toggle';
import {
  Plus,
  Search,
  Pencil,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Save,
  ChevronRight,
  Inbox,
} from 'lucide-react';

export const ProdutosProducaoView: React.FC = () => {
  const [produtos, setProdutos] = useState<ProdutoEsp[]>([]);
  const [busca, setBusca] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  // Modal de edição / parametrização
  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState<Partial<ProdutoEsp> | null>(null);
  const [salvando, setSalvando] = useState(false);

  // Busca de produto no ERP para novo vínculo
  const [buscaProdErp, setBuscaProdErp] = useState('');
  const [sugestoesErp, setSugestoesErp] = useState<ProdutoPrincipal[]>([]);
  const [buscandoErp, setBuscandoErp] = useState(false);

  useEffect(() => {
    carregarProdutos();
  }, []);

  const carregarProdutos = async () => {
    try {
      setLoading(true);
      setErro(null);
      const res = await fetchProdutosEsp();
      setProdutos(res);
    } catch (err: any) {
      setErro(err.message || 'Erro ao carregar parâmetros de produtos.');
    } finally {
      setLoading(false);
    }
  };

  // Busca no ERP com debounce
  useEffect(() => {
    if (!buscaProdErp.trim() || buscaProdErp.length < 2) {
      setSugestoesErp([]);
      return;
    }
    const timer = setTimeout(async () => {
      setBuscandoErp(true);
      try {
        const res = await buscarProduto(buscaProdErp);
        setSugestoesErp(res);
      } catch {
        setSugestoesErp([]);
      } finally {
        setBuscandoErp(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [buscaProdErp]);

  const abrirNovo = () => {
    setEditando({
      idPro: 0,
      descricao: '',
      unControle: 'UN',
      unEstoque: 'UN',
      fatorConversao: 1,
      tipoUnBaixa: 'E',
      quebra: 'N',
    });
    setBuscaProdErp('');
    setSugestoesErp([]);
    setModalAberto(true);
  };

  const abrirEdicao = (prod: ProdutoEsp) => {
    setEditando({ ...prod });
    setBuscaProdErp('');
    setSugestoesErp([]);
    setModalAberto(true);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editando || !editando.idPro) {
      setErro('Selecione um produto do ERP para parametrizar.');
      return;
    }

    try {
      setSalvando(true);
      setErro(null);
      await salvarProdutoEsp({
        idPro: editando.idPro,
        unControle: editando.unControle || 'UN',
        unEstoque: editando.unEstoque || 'UN',
        fatorConversao: Number(editando.fatorConversao) || 1,
        tipoUnBaixa: editando.tipoUnBaixa || 'E',
        quebra: editando.quebra || 'N',
      });

      setModalAberto(false);
      setSucesso(`Parâmetros de "${editando.descricao || editando.idPro}" salvos com sucesso!`);
      setTimeout(() => setSucesso(null), 3000);
      carregarProdutos();
    } catch (err: any) {
      setErro(err.message || 'Erro ao salvar parâmetros.');
    } finally {
      setSalvando(false);
    }
  };

  const filtrados = produtos.filter(
    (p) =>
      p.descricao?.toLowerCase().includes(busca.toLowerCase()) ||
      String(p.idPro).includes(busca),
  );

  return (
    <div className={PAINEL}>
      {/* Barra de ferramentas */}
      <div className={BARRA}>
        <div className={BARRA_INFO}>
          {loading
            ? 'Carregando parâmetros…'
            : `${filtrados.length} de ${produtos.length} produto(s) parametrizado(s) • tabela ESP_WET_PRODUTOS`}
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
          <button type="button" onClick={carregarProdutos} disabled={loading} title="Recarregar" className={BTN_SECUNDARIO}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button type="button" onClick={abrirNovo} className={BTN_PRIMARIO}>
            <Plus className="w-3.5 h-3.5" />
            <span>Parametrizar</span>
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
              <th className={`${TH} w-24`}>Cód Pro</th>
              <th className={TH}>Descrição do Produto</th>
              <th className={`${TH} w-28`}>Un Controle</th>
              <th className={`${TH} w-28`}>Un Estoque</th>
              <th className={`${TH} w-32`}>Fator Conversão</th>
              <th className={`${TH} w-28`}>Tipo Baixa</th>
              <th className={`${TH} w-24`}>Quebra</th>
              <th className={TH_ACOES}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading && produtos.length === 0 ? (
              <tr>
                <td colSpan={9} className={TD_VAZIO}>
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Carregando parâmetros…
                  </span>
                </td>
              </tr>
            ) : filtrados.length === 0 ? (
              <tr>
                <td colSpan={9} className={TD_VAZIO}>
                  <div className="flex flex-col items-center gap-2">
                    <Inbox className="w-8 h-8" />
                    <span className="text-sm font-medium text-stone-600 dark:text-stone-300">
                      Nenhum produto parametrizado encontrado
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              filtrados.map((p) => (
                <tr key={p.id || p.idPro} className={TR} onDoubleClick={() => abrirEdicao(p)}>
                  <td className={TD_INDICADOR}>
                    <ChevronRight className={INDICADOR} />
                  </td>
                  <td className={`${TD} text-right font-mono`}>{p.idPro}</td>
                  <td className={`${TD} font-semibold text-stone-900 dark:text-stone-100`}>{p.descricao}</td>
                  <td className={`${TD} text-center font-mono`}>{p.unControle || '–'}</td>
                  <td className={`${TD} text-center font-mono`}>{p.unEstoque || '–'}</td>
                  <td className={`${TD} text-right font-mono`}>{formatDecimal(p.fatorConversao, 4)}</td>
                  <td className={`${TD} text-center`}>{p.tipoUnBaixa === 'E' ? 'Estoque' : 'Controle'}</td>
                  <td className={`${TD} text-center`}>
                    <span className={p.quebra === 'S' ? 'font-semibold text-emerald-700 dark:text-emerald-400' : 'text-stone-400'}>
                      {p.quebra === 'S' ? 'Sim' : 'Não'}
                    </span>
                  </td>
                  <td className={TD_ACOES}>
                    <button type="button" onClick={() => abrirEdicao(p)} title="Editar parâmetros do produto" className={BTN_ACAO}>
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Parametrizar Produto */}
      {modalAberto && editando && (
        <Modal
          isOpen={modalAberto}
          onClose={() => setModalAberto(false)}
          title={editando.id ? 'Editar Parâmetros do Produto' : 'Parametrizar Novo Produto'}
          subtitle="Configure a conversão entre unidade de controle e estoque na produção"
          size="md"
        >
          <form onSubmit={handleSalvar} className="space-y-4">
            {/* Seleção do Produto se for novo */}
            {!editando.id ? (
              <div className="relative">
                <label className={LABEL_CLASS}>Selecionar Produto no ERP</label>
                <div className={`relative ${FIELD_WRAPPER_CLASS}`}>
                  <input
                    type="text"
                    value={buscaProdErp}
                    onChange={(e) => setBuscaProdErp(e.target.value)}
                    placeholder="Digite código ou descrição do produto..."
                    className={`${INPUT_CLASS} pl-8`}
                  />
                  <Search size={14} className="absolute left-2.5 top-2.5 text-stone-400" />
                  {buscandoErp && (
                    <Loader2 size={14} className="animate-spin absolute right-2.5 top-2.5 text-amber-500" />
                  )}
                </div>

                {sugestoesErp.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-lg shadow-lg z-30 max-h-48 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800">
                    {sugestoesErp.map((p) => (
                      <div
                        key={p.id}
                        onClick={() => {
                          setEditando({
                            ...editando,
                            idPro: p.id,
                            descricao: p.descricao,
                            unControle: p.un || 'UN',
                            unEstoque: p.un || 'UN',
                          });
                          setBuscaProdErp('');
                          setSugestoesErp([]);
                        }}
                        className="p-2 text-xs hover:bg-amber-500/10 cursor-pointer flex items-center justify-between"
                      >
                        <span className="font-semibold">{p.descricao}</span>
                        <span className="text-stone-400 font-mono">#{p.id}</span>
                      </div>
                    ))}
                  </div>
                )}

                {editando.idPro ? (
                  <div className="mt-2 p-2 bg-stone-50 dark:bg-stone-800/60 rounded text-xs">
                    Produto selecionado: <strong>{editando.descricao}</strong> (ID #{editando.idPro})
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="p-3 bg-stone-50 dark:bg-stone-800/60 rounded-lg text-xs">
                Produto: <strong className="text-stone-900 dark:text-stone-100">{editando.descricao}</strong>
                <span className="text-stone-400 font-mono ml-2">#{editando.idPro}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL_CLASS}>Unidade de Controle</label>
                <div className={FIELD_WRAPPER_CLASS}>
                  <input
                    type="text"
                    required
                    value={editando.unControle || ''}
                    onChange={(e) =>
                      setEditando({ ...editando, unControle: e.target.value.toUpperCase() })
                    }
                    placeholder="Ex: CX, KG, UN"
                    className={INPUT_CLASS}
                  />
                </div>
              </div>

              <div>
                <label className={LABEL_CLASS}>Unidade de Estoque</label>
                <div className={FIELD_WRAPPER_CLASS}>
                  <input
                    type="text"
                    required
                    value={editando.unEstoque || ''}
                    onChange={(e) =>
                      setEditando({ ...editando, unEstoque: e.target.value.toUpperCase() })
                    }
                    placeholder="Ex: UN"
                    className={INPUT_CLASS}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className={LABEL_CLASS}>
                Fator de Conversão (Qtd Estoque = Qtd Controle × Fator)
              </label>
              <div className={FIELD_WRAPPER_CLASS}>
                <NumberField
                  scale={4}
                  required
                  value={editando.fatorConversao ?? ''}
                  onChange={(v) => setEditando({ ...editando, fatorConversao: Number(v) || 0 })}
                  className={INPUT_CLASS}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 items-end">
              <div>
                <label className={LABEL_CLASS}>Tipo de Baixa</label>
                <div className={FIELD_WRAPPER_CLASS}>
                  <select
                    value={editando.tipoUnBaixa || 'E'}
                    onChange={(e) =>
                      setEditando({ ...editando, tipoUnBaixa: e.target.value as 'E' | 'C' })
                    }
                    className={INPUT_CLASS}
                  >
                    <option value="E">Estoque (E)</option>
                    <option value="C">Controle (C)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className={LABEL_CLASS}>Permite Quebra / Perda</label>
                <div className="py-1.5">
                  <Toggle
                    checked={editando.quebra === 'S'}
                    onChange={(v) => setEditando({ ...editando, quebra: v ? 'S' : 'N' })}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
              <button type="button" onClick={() => setModalAberto(false)} className={BTN_SECUNDARIO}>
                Cancelar
              </button>
              <button type="submit" disabled={salvando || !editando.idPro} className={BTN_PRIMARIO}>
                {salvando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Salvar</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};

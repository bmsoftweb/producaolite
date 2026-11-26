import React, { useState, useEffect, useCallback } from 'react';
import { ArrowDownLeft, ArrowUpRight, Eye, Loader2, Plus, Save, Search, Trash2, Users } from 'lucide-react';
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
import { useRefreshDaTela } from '@/components/LayoutApp';
import { ListaCrm } from '@/components/ListaCrm';
import { Campo, GradeCampos, INPUT_CLASS, SecaoCrm, TelaCheia } from '@/components/FormCrm';
import { BotaoAcao } from '@/components/MenuAcoes';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { AvisoErro } from '@/components/AvisoErro';
import { Modal } from './Modal';
import { NumberField } from './NumberField';

interface ItemNovo {
  tipoMov: 'E' | 'S';
  idPro: number;
  descricao: string;
  qtdadeUnControle: number;
}
interface TecnicoNovo {
  idTecnico: number;
  nomeTecnico: string;
  horasTotais: number;
  valorHora: number;
}

/** Composição da ficha mostrada no modal de detalhes: lista enxuta, sem busca nem paginação */
const Composicao: React.FC<{
  titulo: React.ReactNode;
  cor: string;
  rotuloNome: string;
  rotuloValor: string;
  linhas: any[];
  valor: (it: any) => string;
  id: string;
}> = ({ titulo, cor, rotuloNome, rotuloValor, linhas, valor, id }) => (
  <div>
    <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2 ${cor}`}>{titulo}</h4>
    <ListaCrm
      id={id}
      className="max-h-56"
      linhas={linhas.map((it, i) => ({ ...it, _k: i }))}
      chave={(it: any) => it._k}
      buscar={false}
      paginar={false}
      vazio="Nenhum item"
      colunas={[
        { key: 'nome', label: rotuloNome, largura: 320, render: (it: any) => it.descricao ?? it.nomeTecnico },
        { key: 'valor', label: rotuloValor, alinhar: 'numero', largura: 120, render: valor },
      ]}
    />
  </div>
);

export const PadroesView: React.FC = () => {
  const [padroes, setPadroes] = useState<PadraoProd[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  // Composição de uma ficha já gravada
  const [padraoVendo, setPadraoVendo] = useState<PadraoProd | null>(null);
  const [itensPadrao, setItensPadrao] = useState<{ produtos: any[]; tecnicos: any[] } | null>(null);
  const [carregandoItens, setCarregandoItens] = useState(false);

  // Nova ficha
  const [novo, setNovo] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const [itens, setItens] = useState<ItemNovo[]>([]);
  const [tecnicos, setTecnicos] = useState<TecnicoNovo[]>([]);
  const [salvando, setSalvando] = useState(false);
  const [erroForm, setErroForm] = useState('');

  // Apoio da nova ficha
  const [buscaProd, setBuscaProd] = useState('');
  const [sugestoesProd, setSugestoesProd] = useState<ProdutoPrincipal[]>([]);
  const [tipoMovNovo, setTipoMovNovo] = useState<'E' | 'S'>('E');
  const [tecnicosDisponiveis, setTecnicosDisponiveis] = useState<Tecnico[]>([]);

  const [excluindo, setExcluindo] = useState<PadraoProd | null>(null);
  const [removendo, setRemovendo] = useState<{ tipo: 'produto' | 'tecnico'; idx: number; nome: string } | null>(null);

  const carregar = useCallback(async () => {
    try {
      setCarregando(true);
      setPadroes(await fetchPadroes());
    } catch (err: any) {
      setErro(err.message || 'Erro ao carregar fichas técnicas.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => void carregar(), [carregar]);
  useRefreshDaTela(carregar);

  useEffect(() => {
    fetchTecnicos().then(setTecnicosDisponiveis).catch(() => {});
  }, []);

  // Busca rápida de produto na nova ficha
  useEffect(() => {
    if (buscaProd.trim().length < 2) {
      setSugestoesProd([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setSugestoesProd(await buscarProduto(buscaProd));
      } catch {
        setSugestoesProd([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [buscaProd]);

  const verDetalhes = async (padrao: PadraoProd) => {
    setPadraoVendo(padrao);
    setItensPadrao(null);
    try {
      setCarregandoItens(true);
      setItensPadrao(await fetchPadraoItens(padrao.id));
    } catch (err: any) {
      setErro(err.message || 'Erro ao carregar itens da ficha técnica.');
    } finally {
      setCarregandoItens(false);
    }
  };

  const abrirNovo = () => {
    setCodigo('');
    setNome('');
    setItens([]);
    setTecnicos([]);
    setBuscaProd('');
    setSugestoesProd([]);
    setErroForm('');
    setNovo(true);
  };

  const confirmarExclusao = async () => {
    const p = excluindo!;
    await excluirPadrao(p.id);
    setExcluindo(null);
    setSucesso(`Ficha técnica "${p.nome}" excluída.`);
    await carregar();
  };

  const confirmarRemocao = () => {
    const r = removendo!;
    if (r.tipo === 'produto') setItens((prev) => prev.filter((_, i) => i !== r.idx));
    else setTecnicos((prev) => prev.filter((_, i) => i !== r.idx));
    setRemovendo(null);
  };

  const salvar = async () => {
    if (!nome.trim()) {
      setErroForm('Informe o nome da ficha técnica.');
      return;
    }
    if (itens.length === 0) {
      setErroForm('Adicione pelo menos um produto (entrada ou saída) à ficha técnica.');
      return;
    }
    setSalvando(true);
    setErroForm('');
    try {
      await salvarPadrao({
        codigo: codigo.trim() || undefined,
        nome: nome.trim(),
        produtos: itens.map((p) => ({ tipoMov: p.tipoMov, idPro: p.idPro, qtdadeUnControle: p.qtdadeUnControle })),
        tecnicos: tecnicos.map((t) => ({
          idTecnico: t.idTecnico,
          horaIni: '08:00',
          horaFim: '09:00',
          horasTotais: t.horasTotais,
          valorHora: t.valorHora,
          valorTotal: t.horasTotais * t.valorHora,
        })),
      });
      setNovo(false);
      setSucesso(`Ficha técnica "${nome.trim()}" cadastrada.`);
      await carregar();
    } catch (err: any) {
      setErroForm(err.message || 'Erro ao cadastrar ficha técnica.');
    } finally {
      setSalvando(false);
    }
  };

  if (novo) {
    return (
      <>
        <TelaCheia
          rodape="Nova ficha técnica / receita padrão"
          onVoltar={() => setNovo(false)}
          rotuloVoltar="Cancelar"
          onSubmit={() => salvar()}
          rotuloPrincipal={salvando ? 'Salvando…' : 'Salvar'}
          iconePrincipal={<Save className="w-4 h-4" />}
          salvando={salvando}
        >
          <GradeCampos>
            <Campo rotulo="Código" span={1} dica="Opcional">
              <input
                autoFocus
                maxLength={20}
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                placeholder="MOD-01"
                className={INPUT_CLASS}
              />
            </Campo>
            <Campo rotulo="Nome / descrição da receita" span={3}>
              <input
                required
                maxLength={100}
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex.: Conjunto motorizado A"
                className={INPUT_CLASS}
              />
            </Campo>
          </GradeCampos>

          <SecaoCrm
            titulo="Itens da ficha técnica"
            direita={
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setTipoMovNovo('E')}
                  aria-pressed={tipoMovNovo === 'E'}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    tipoMovNovo === 'E' ? 'bg-emerald-500 text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  + Entrada (fabricado)
                </button>
                <button
                  type="button"
                  onClick={() => setTipoMovNovo('S')}
                  aria-pressed={tipoMovNovo === 'S'}
                  className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                    tipoMovNovo === 'S' ? 'bg-sky-500 text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                  }`}
                >
                  + Saída (insumo)
                </button>
              </div>
            }
          >
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none z-10" />
              <input
                value={buscaProd}
                onChange={(e) => setBuscaProd(e.target.value)}
                placeholder={`Pesquisar produto para adicionar como ${tipoMovNovo === 'E' ? 'entrada (fabricado)' : 'saída (insumo)'}…`}
                className={`${INPUT_CLASS} pl-8`}
              />
              {sugestoesProd.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-md shadow-lg z-30 max-h-48 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800">
                  {sugestoesProd.map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => {
                        setItens((prev) => [...prev, { tipoMov: tipoMovNovo, idPro: p.id, descricao: p.descricao, qtdadeUnControle: 1 }]);
                        setBuscaProd('');
                        setSugestoesProd([]);
                      }}
                      className="w-full p-2 text-xs hover:bg-amber-500/10 cursor-pointer flex items-center justify-between gap-3 text-left"
                    >
                      <span className="font-semibold truncate">{p.descricao}</span>
                      <span className="text-stone-400 font-mono shrink-0">#{p.id}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <table className="planilha w-full text-xs border border-stone-200 dark:border-stone-800">
              <thead>
                <tr>
                  <th className="px-3 py-2 w-14 text-center font-semibold text-stone-500 bg-stone-50 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800">Tipo</th>
                  <th className="px-3 py-2 text-left font-semibold text-stone-500 bg-stone-50 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800">Produto</th>
                  <th className="px-3 py-2 w-32 text-right font-semibold text-stone-500 bg-stone-50 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800">Qtd base</th>
                  <th className="px-3 py-2 w-12 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950" />
                </tr>
              </thead>
              <tbody>
                {itens.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-3 py-6 text-center text-stone-400">
                      Nenhum produto adicionado à ficha técnica ainda.
                    </td>
                  </tr>
                ) : (
                  itens.map((it, idx) => (
                    <tr key={`${it.idPro}-${idx}`} className="border-b border-stone-100 dark:border-stone-800/60">
                      <td className="px-3 py-1.5 text-center">
                        <span className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${it.tipoMov === 'E' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-sky-500/15 text-sky-600'}`}>
                          {it.tipoMov}
                        </span>
                      </td>
                      <td className="px-3 py-1.5 font-medium">{it.descricao}</td>
                      <td>
                        <NumberField
                          scale={4}
                          value={it.qtdadeUnControle}
                          onChange={(v) => {
                            const q = Number(v) || 0;
                            setItens((prev) => prev.map((p, i) => (i === idx ? { ...p, qtdadeUnControle: q } : p)));
                          }}
                          className={`${INPUT_CLASS} text-right`}
                        />
                      </td>
                      <td className="px-1 py-1.5 text-center">
                        <BotaoAcao
                          icone={Trash2}
                          titulo="Remover"
                          descricao="Remover o item da ficha técnica"
                          tom="perigo"
                          onClick={() => setRemovendo({ tipo: 'produto', idx, nome: it.descricao })}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </SecaoCrm>

          <SecaoCrm titulo="Técnicos previstos (opcional)">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {tecnicosDisponiveis.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTecnicos((prev) => [...prev, { idTecnico: t.id, nomeTecnico: t.nome, horasTotais: 1, valorHora: t.valorHora || 0 }])}
                  className="px-2 py-1 text-xs rounded-md bg-stone-100 dark:bg-stone-800 hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-950/40 transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={11} />
                  <span>{t.nome}</span>
                </button>
              ))}
            </div>

            {tecnicos.length > 0 && (
              <table className="planilha w-full text-xs border border-stone-200 dark:border-stone-800">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-stone-500 bg-stone-50 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800">Técnico</th>
                    <th className="px-3 py-2 w-28 text-right font-semibold text-stone-500 bg-stone-50 dark:bg-stone-950 border-b border-stone-200 dark:border-stone-800">Horas</th>
                    <th className="px-3 py-2 w-12 border-b border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950" />
                  </tr>
                </thead>
                <tbody>
                  {tecnicos.map((tc, idx) => (
                    <tr key={`${tc.idTecnico}-${idx}`} className="border-b border-stone-100 dark:border-stone-800/60">
                      <td className="px-3 py-1.5 font-medium">{tc.nomeTecnico}</td>
                      <td>
                        <NumberField
                          scale={2}
                          value={tc.horasTotais}
                          onChange={(v) => {
                            const h = Number(v) || 0;
                            setTecnicos((prev) => prev.map((t, i) => (i === idx ? { ...t, horasTotais: h } : t)));
                          }}
                          className={`${INPUT_CLASS} text-right`}
                        />
                      </td>
                      <td className="px-1 py-1.5 text-center">
                        <BotaoAcao
                          icone={Trash2}
                          titulo="Remover"
                          descricao="Remover o técnico da ficha técnica"
                          tom="perigo"
                          onClick={() => setRemovendo({ tipo: 'tecnico', idx, nome: tc.nomeTecnico })}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </SecaoCrm>
        </TelaCheia>

        {removendo && (
          <ConfirmDialog
            titulo={removendo.tipo === 'produto' ? 'Remover item' : 'Remover técnico'}
            mensagem={
              <>
                Remover <strong>{removendo.nome}</strong> desta ficha técnica?
              </>
            }
            confirmar="Remover"
            onConfirmar={confirmarRemocao}
            onCancelar={() => setRemovendo(null)}
          />
        )}
        {erroForm && <AvisoErro mensagem={erroForm} onFechar={() => setErroForm('')} />}
      </>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0">
      <ListaCrm
        className="flex-1"
        id="padroes"
        linhas={padroes}
        carregando={carregando}
        chave={(p) => p.id}
        onNovo={abrirNovo}
        onEditar={verDetalhes}
        vazio="Nenhuma ficha técnica cadastrada."
        colunas={[
          { key: 'id', label: 'ID', alinhar: 'numero', largura: 70 },
          { key: 'codigo', label: 'Código', largura: 140, render: (p) => p.codigo || '–' },
          { key: 'nome', label: 'Nome / descrição da ficha técnica', largura: 360 },
        ]}
        acoes={(p) => (
          <>
            <BotaoAcao icone={Eye} titulo="Composição" descricao="Ver a composição da ficha técnica" onClick={() => verDetalhes(p)} />
            <BotaoAcao icone={Trash2} titulo="Excluir" descricao="Excluir a ficha técnica" tom="perigo" onClick={() => setExcluindo(p)} />
          </>
        )}
      />

      {padraoVendo && (
        <Modal
          isOpen
          onClose={() => setPadraoVendo(null)}
          title={`Ficha técnica: ${padraoVendo.nome}`}
          subtitle={`Código: ${padraoVendo.codigo || 'sem código'} • ID #${padraoVendo.id}`}
          size="lg"
        >
          {carregandoItens ? (
            <div className="py-8 flex items-center justify-center text-stone-400 gap-2 text-xs">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Consultando composição…</span>
            </div>
          ) : itensPadrao ? (
            <div className="space-y-4">
              <Composicao
                id="padrao-entradas"
                titulo={<><ArrowDownLeft size={14} /> Produtos fabricados (entradas)</>}
                cor="text-emerald-600 dark:text-emerald-400"
                rotuloNome="Produto"
                rotuloValor="Qtd base"
                linhas={itensPadrao.produtos.filter((p) => p.tipoMov === 'E')}
                valor={(it) => formatQtd(it.qtdadeUnControle)}
              />
              <Composicao
                id="padrao-saidas"
                titulo={<><ArrowUpRight size={14} /> Matérias-primas / insumos (saídas)</>}
                cor="text-sky-600 dark:text-sky-400"
                rotuloNome="Insumo"
                rotuloValor="Qtd base"
                linhas={itensPadrao.produtos.filter((p) => p.tipoMov === 'S')}
                valor={(it) => formatQtd(it.qtdadeUnControle)}
              />
              {itensPadrao.tecnicos?.length > 0 && (
                <Composicao
                  id="padrao-tecnicos"
                  titulo={<><Users size={14} /> Equipe técnica prevista</>}
                  cor="text-purple-600 dark:text-purple-400"
                  rotuloNome="Técnico"
                  rotuloValor="Horas"
                  linhas={itensPadrao.tecnicos}
                  valor={(tc) => `${formatDecimal(tc.horasTotais)} h`}
                />
              )}
            </div>
          ) : null}
        </Modal>
      )}

      {excluindo && (
        <ConfirmDialog
          titulo="Excluir ficha técnica"
          mensagem={
            <>
              Tem certeza que deseja excluir a ficha técnica <strong>{excluindo.nome}</strong>?
            </>
          }
          onConfirmar={confirmarExclusao}
          onCancelar={() => setExcluindo(null)}
        />
      )}

      {erro && <AvisoErro mensagem={erro} onFechar={() => setErro('')} />}
      {sucesso && <AvisoErro mensagem={sucesso} tom="sucesso" onFechar={() => setSucesso('')} />}
    </div>
  );
};

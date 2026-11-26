import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Pencil, Search } from 'lucide-react';
import { ProdutoEsp, ProdutoPrincipal } from '../types';
import { fetchProdutosEsp, salvarProdutoEsp, buscarProduto } from '../services/api';
import { formatDecimal } from '../utils/formatters';
import { useRefreshDaTela } from '@/components/LayoutApp';
import { ListaCrm } from '@/components/ListaCrm';
import { Campo, FormCrm, INPUT_CLASS } from '@/components/FormCrm';
import { BotaoAcao } from '@/components/MenuAcoes';
import { AvisoErro } from '@/components/AvisoErro';
import { NumberField } from './NumberField';
import { Toggle } from './Toggle';

const NOVO: Partial<ProdutoEsp> = {
  idPro: 0,
  descricao: '',
  unControle: 'UN',
  unEstoque: 'UN',
  fatorConversao: 1,
  tipoUnBaixa: 'E',
  quebra: 'N',
};

export const ProdutosProducaoView: React.FC = () => {
  const [produtos, setProdutos] = useState<ProdutoEsp[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const [form, setForm] = useState<Partial<ProdutoEsp> | null>(null);
  const [erroForm, setErroForm] = useState('');
  const [salvando, setSalvando] = useState(false);

  // Busca de produto no ERP para um novo vínculo
  const [buscaProdErp, setBuscaProdErp] = useState('');
  const [sugestoesErp, setSugestoesErp] = useState<ProdutoPrincipal[]>([]);
  const [buscandoErp, setBuscandoErp] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setCarregando(true);
      setProdutos(await fetchProdutosEsp());
    } catch (err: any) {
      setErro(err.message || 'Erro ao carregar parâmetros de produtos.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => void carregar(), [carregar]);
  useRefreshDaTela(carregar);

  // Busca no ERP com debounce
  useEffect(() => {
    if (buscaProdErp.trim().length < 2) {
      setSugestoesErp([]);
      return;
    }
    const timer = setTimeout(async () => {
      setBuscandoErp(true);
      try {
        setSugestoesErp(await buscarProduto(buscaProdErp));
      } catch {
        setSugestoesErp([]);
      } finally {
        setBuscandoErp(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [buscaProdErp]);

  const muda = (campo: keyof ProdutoEsp, valor: unknown) => setForm((f) => (f ? { ...f, [campo]: valor } : f));

  const abrir = (p: Partial<ProdutoEsp>) => {
    setErroForm('');
    setBuscaProdErp('');
    setSugestoesErp([]);
    setForm({ ...p });
  };

  const salvar = async () => {
    if (!form) return;
    if (!form.idPro) {
      setErroForm('Selecione um produto do ERP para parametrizar.');
      return;
    }
    setSalvando(true);
    setErroForm('');
    try {
      await salvarProdutoEsp({
        idPro: form.idPro,
        unControle: form.unControle || 'UN',
        unEstoque: form.unEstoque || 'UN',
        fatorConversao: Number(form.fatorConversao) || 1,
        tipoUnBaixa: form.tipoUnBaixa || 'E',
        quebra: form.quebra || 'N',
      });
      setSucesso(`Parâmetros de "${form.descricao || form.idPro}" salvos.`);
      setForm(null);
      await carregar();
    } catch (err: any) {
      setErroForm(err.message || 'Erro ao salvar parâmetros.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0">
      {form ? (
        <FormCrm
          id="produtos-producao"
          onSubmit={(e) => (e.preventDefault(), salvar())}
          onCancel={() => setForm(null)}
          saving={salvando}
          erro={erroForm}
          onFecharErro={() => setErroForm('')}
          rodape={form.id ? `Produto #${form.idPro}` : 'Parametrizar produto'}
        >
          {form.id ? (
            <Campo rotulo="Produto" span={4}>
              <div className="p-2 px-3 rounded-md bg-stone-50 dark:bg-stone-800/60 text-xs">
                <strong className="text-stone-900 dark:text-stone-100">{form.descricao}</strong>
                <span className="text-stone-400 font-mono ml-2">#{form.idPro}</span>
              </div>
            </Campo>
          ) : (
            <Campo rotulo="Produto no ERP" span={4} dica="Digite o código ou a descrição e escolha na lista">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-400 pointer-events-none z-10" />
                <input
                  autoFocus
                  required={!form.idPro}
                  value={buscaProdErp}
                  onChange={(e) => setBuscaProdErp(e.target.value)}
                  placeholder="Código ou descrição do produto…"
                  className={`${INPUT_CLASS} pl-8`}
                />
                {buscandoErp && <Loader2 className="animate-spin absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-500" />}

                {sugestoesErp.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-md shadow-lg z-30 max-h-48 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800">
                    {sugestoesErp.map((p) => (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => {
                          setForm((f) => (f ? { ...f, idPro: p.id, descricao: p.descricao, unControle: p.un || 'UN', unEstoque: p.un || 'UN' } : f));
                          setBuscaProdErp('');
                          setSugestoesErp([]);
                        }}
                        className="w-full p-2 text-xs hover:bg-amber-500/10 cursor-pointer flex items-center justify-between gap-3 text-left"
                      >
                        <span className="font-semibold truncate">{p.descricao}</span>
                        <span className="text-stone-400 font-mono shrink-0">#{p.id}</span>
                      </button>
                    ))}
                  </div>
                )}

                {form.idPro ? (
                  <p className="mt-2 text-xs text-stone-500 dark:text-stone-400">
                    Selecionado: <strong className="text-stone-800 dark:text-stone-200">{form.descricao}</strong> (#{form.idPro})
                  </p>
                ) : null}
              </div>
            </Campo>
          )}

          <Campo rotulo="Unidade de controle">
            <input
              required
              maxLength={6}
              value={form.unControle || ''}
              onChange={(e) => muda('unControle', e.target.value.toUpperCase())}
              placeholder="CX, KG, UN"
              className={INPUT_CLASS}
            />
          </Campo>
          <Campo rotulo="Unidade de estoque">
            <input
              required
              maxLength={6}
              value={form.unEstoque || ''}
              onChange={(e) => muda('unEstoque', e.target.value.toUpperCase())}
              placeholder="UN"
              className={INPUT_CLASS}
            />
          </Campo>
          <Campo rotulo="Fator de conversão" span={2} dica="Qtd estoque = qtd controle × fator">
            <NumberField
              scale={4}
              required
              value={form.fatorConversao ?? ''}
              onChange={(v) => muda('fatorConversao', Number(v) || 0)}
              className={INPUT_CLASS}
            />
          </Campo>
          <Campo rotulo="Tipo de baixa">
            <select value={form.tipoUnBaixa || 'E'} onChange={(e) => muda('tipoUnBaixa', e.target.value as 'E' | 'C')} className={INPUT_CLASS}>
              <option value="E">Estoque (E)</option>
              <option value="C">Controle (C)</option>
            </select>
          </Campo>
          <Campo rotulo="Permite quebra / perda">
            <Toggle checked={form.quebra === 'S'} onChange={(v) => muda('quebra', v ? 'S' : 'N')} />
          </Campo>
        </FormCrm>
      ) : (
        <ListaCrm
          className="flex-1"
          id="produtos-producao"
          linhas={produtos}
          carregando={carregando}
          chave={(p) => p.id || p.idPro}
          onNovo={() => abrir({ ...NOVO })}
          rotuloNovo="Parametrizar"
          onEditar={(p) => abrir(p)}
          vazio="Nenhum produto parametrizado (tabela ESP_WET_PRODUTOS)."
          colunas={[
            { key: 'idPro', label: 'Cód Pro', alinhar: 'numero', largura: 90 },
            { key: 'descricao', label: 'Descrição do produto', largura: 320 },
            { key: 'unControle', label: 'Un controle', alinhar: 'centro', largura: 100, render: (p) => p.unControle || '–' },
            { key: 'unEstoque', label: 'Un estoque', alinhar: 'centro', largura: 100, render: (p) => p.unEstoque || '–' },
            { key: 'fatorConversao', label: 'Fator conversão', alinhar: 'numero', largura: 130, render: (p) => formatDecimal(p.fatorConversao, 4) },
            { key: 'tipoUnBaixa', label: 'Tipo baixa', alinhar: 'centro', largura: 100, render: (p) => (p.tipoUnBaixa === 'E' ? 'Estoque' : 'Controle') },
            {
              key: 'quebra',
              label: 'Quebra',
              alinhar: 'centro',
              largura: 80,
              render: (p) => (
                <span className={p.quebra === 'S' ? 'font-semibold text-emerald-700 dark:text-emerald-400' : 'text-stone-400'}>
                  {p.quebra === 'S' ? 'Sim' : 'Não'}
                </span>
              ),
            },
          ]}
          acoes={(p) => <BotaoAcao icone={Pencil} titulo="Editar" descricao="Alterar os parâmetros do produto" onClick={() => abrir(p)} />}
        />
      )}

      {erro && <AvisoErro mensagem={erro} onFechar={() => setErro('')} />}
      {sucesso && <AvisoErro mensagem={sucesso} tom="sucesso" onFechar={() => setSucesso('')} />}
    </div>
  );
};

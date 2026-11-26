import React, { useState, useEffect, useCallback } from 'react';
import { ArrowDownLeft, ArrowUpRight, Loader2, Printer, Trash2, Users } from 'lucide-react';
import { ItemProducao, TecnicoOP } from '../types';
import { fetchProducao, fetchTecnicosOP, excluirProducao } from '../services/api';
import {
  formatCurrencyBRL,
  formatDateBR,
  formatDecimal,
  formatQtd,
  hojeISO,
} from '../utils/formatters';
import { useRefreshDaTela } from '@/components/LayoutApp';
import { ListaCrm } from '@/components/ListaCrm';
import { INPUT_CLASS } from '@/components/FormCrm';
import { BotaoAcao } from '@/components/MenuAcoes';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { AvisoErro } from '@/components/AvisoErro';
import { ProducaoForm } from './ProducaoForm';
import { Modal } from './Modal';
import { DateField } from './DateField';

interface ProducaoViewProps {
  onImprimirOp?: (idProducao: number) => void;
}

export const ProducaoView: React.FC<ProducaoViewProps> = ({ onImprimirOp }) => {
  // Controle de visão: lista ou formulário de nova OP
  const [modoFormulario, setModoFormulario] = useState(false);

  // Filtros do período
  const [d1, setD1] = useState(hojeISO(-30));
  const [d2, setD2] = useState(hojeISO());
  const [tipoMov, setTipoMov] = useState('');

  const [itens, setItens] = useState<ItemProducao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  // Modal de técnicos da OP
  const [opSelecionada, setOpSelecionada] = useState<number | null>(null);
  const [tecnicosOp, setTecnicosOp] = useState<TecnicoOP[]>([]);
  const [carregandoTecnicos, setCarregandoTecnicos] = useState(false);

  const [opParaExcluir, setOpParaExcluir] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    // Só busca com datas completas (o campo devolve '' enquanto está sendo digitado)
    if (!d1 || !d2) return;
    try {
      setCarregando(true);
      setItens(await fetchProducao({ d1, d2, tipo_mov: tipoMov || undefined }));
    } catch (err: any) {
      setErro(err.message || 'Erro ao carregar histórico de produção.');
    } finally {
      setCarregando(false);
    }
  }, [d1, d2, tipoMov]);

  useEffect(() => void carregar(), [carregar]);
  useRefreshDaTela(carregar);

  const abrirTecnicos = async (idProducao: number) => {
    setOpSelecionada(idProducao);
    setTecnicosOp([]);
    try {
      setCarregandoTecnicos(true);
      setTecnicosOp(await fetchTecnicosOP(idProducao));
    } catch (err: any) {
      setErro(err.message || 'Erro ao consultar equipe da OP.');
    } finally {
      setCarregandoTecnicos(false);
    }
  };

  const confirmarExclusao = async () => {
    const id = opParaExcluir!;
    await excluirProducao(id);
    setOpParaExcluir(null);
    setSucesso(`Ordem de Produção #${id} e seus lançamentos no Kardex foram estornados.`);
    await carregar();
  };

  // Se o usuário clicou em "Nova OP"
  if (modoFormulario) {
    return (
      <ProducaoForm
        onVoltar={() => {
          setModoFormulario(false);
          carregar();
        }}
        onProducaoCriada={(idOp) => {
          setModoFormulario(false);
          setSucesso(`Ordem de Produção #${idOp} finalizada e gravada.`);
          carregar();
        }}
      />
    );
  }

  const totalEntradas = itens.filter((i) => i.tipoMov === 'E').length;
  const totalSaidas = itens.filter((i) => i.tipoMov === 'S').length;
  const valorTotal = itens.reduce((acc, i) => acc + (i.custoTotalTotal || 0), 0);

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0">
      <ListaCrm
        className="flex-1"
        id="producao"
        linhas={itens}
        carregando={carregando}
        chave={(i) => i.id}
        onNovo={() => setModoFormulario(true)}
        rotuloNovo="Nova OP"
        vazio="Nenhuma movimentação de produção no período selecionado."
        barraExtra={
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-36">
              <DateField value={d1} onChange={setD1} required className={INPUT_CLASS} />
            </div>
            <span className="text-[11px] text-stone-400">até</span>
            <div className="w-36">
              <DateField value={d2} onChange={setD2} required className={INPUT_CLASS} />
            </div>
            <select
              value={tipoMov}
              onChange={(e) => setTipoMov(e.target.value)}
              title="Tipo de movimento"
              className={`${INPUT_CLASS} !w-44 cursor-pointer`}
            >
              <option value="">Todos os movimentos</option>
              <option value="E">Entradas (fabricados)</option>
              <option value="S">Saídas (insumos)</option>
            </select>
          </div>
        }
        colunas={[
          {
            key: 'tipoMov',
            label: 'Tipo',
            alinhar: 'centro',
            largura: 60,
            render: (it) => {
              const entrada = it.tipoMov === 'E';
              return (
                <span className={`inline-flex items-center gap-0.5 font-bold text-[11px] ${entrada ? 'text-emerald-600 dark:text-emerald-400' : 'text-sky-600 dark:text-sky-400'}`}>
                  {entrada ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                  {entrada ? 'E' : 'S'}
                </span>
              );
            },
          },
          { key: 'idProducao', label: 'OP', alinhar: 'numero', largura: 70 },
          { key: 'data', label: 'Data', alinhar: 'centro', largura: 90, render: (it) => formatDateBR(it.data || it.dataOp) },
          { key: 'descricaoOp', label: 'Documento', largura: 130, render: (it) => it.descricaoOp || '–' },
          {
            key: 'descricaoProduto',
            label: 'Produto / Insumo',
            largura: 300,
            render: (it) => (
              <>
                <span className="font-semibold text-stone-900 dark:text-stone-100">{it.descricaoProduto}</span>
                <span className="ml-1.5 text-[11px] font-mono text-stone-400">#{it.idPro}</span>
              </>
            ),
          },
          { key: 'qtdadeUnControle', label: 'Qtd contr.', alinhar: 'numero', largura: 100, render: (it) => formatQtd(it.qtdadeUnControle) },
          { key: 'unControle', label: 'UN', alinhar: 'centro', largura: 60, render: (it) => it.unControle || 'UN' },
          {
            key: 'qtdadeUnEstoque',
            label: 'Qtd estoque',
            alinhar: 'numero',
            largura: 120,
            render: (it) => `${formatQtd(it.qtdadeUnEstoque)} ${it.unEstoque || ''}`.trim(),
          },
          { key: 'custoTotalUnit', label: 'Custo unit', alinhar: 'numero', largura: 110, render: (it) => formatCurrencyBRL(it.custoTotalUnit) },
          {
            key: 'custoTotalTotal',
            label: 'Custo total',
            alinhar: 'numero',
            largura: 130,
            render: (it) => (
              <span className={`font-semibold ${it.tipoMov === 'E' ? 'text-emerald-600 dark:text-emerald-400' : 'text-sky-600 dark:text-sky-400'}`}>
                {formatCurrencyBRL(it.custoTotalTotal)}
              </span>
            ),
          },
          { key: 'lote', label: 'Lote', largura: 110, render: (it) => it.lote || '–' },
        ]}
        rodape={(key) => {
          if (key === 'descricaoProduto') {
            return (
              <span className="text-[11px]">
                {itens.length} item(ns) • <strong className="text-emerald-600 dark:text-emerald-400">{totalEntradas}</strong> entrada(s) •{' '}
                <strong className="text-sky-600 dark:text-sky-400">{totalSaidas}</strong> saída(s)
              </span>
            );
          }
          if (key === 'custoTotalTotal') return <strong className="font-mono">{formatCurrencyBRL(valorTotal)}</strong>;
          return null;
        }}
        acoes={(it) => (
          <>
            <BotaoAcao
              icone={Users}
              titulo="Técnicos"
              descricao="Ver os técnicos apontados na OP"
              onClick={() => abrirTecnicos(it.idProducao)}
            />
            {onImprimirOp && (
              <BotaoAcao icone={Printer} titulo="Imprimir" descricao="Imprimir a ordem de produção" onClick={() => onImprimirOp(it.idProducao)} />
            )}
            <BotaoAcao
              icone={Trash2}
              titulo="Excluir"
              descricao="Excluir a OP, estornando estoque e kardex"
              tom="perigo"
              onClick={() => setOpParaExcluir(it.idProducao)}
            />
          </>
        )}
      />

      {/* Técnicos apontados na OP */}
      {opSelecionada !== null && (
        <Modal
          isOpen
          onClose={() => setOpSelecionada(null)}
          title={`Equipe técnica da OP #${opSelecionada}`}
          subtitle="Horas trabalhadas e valores de mão de obra registrados"
          size="lg"
        >
          {carregandoTecnicos ? (
            <div className="py-8 flex items-center justify-center text-stone-400 gap-2 text-xs">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Consultando técnicos da OP…</span>
            </div>
          ) : (
            <ListaCrm
              id="producao-tecnicos"
              className="max-h-[50vh]"
              linhas={tecnicosOp}
              chave={(tc) => tc.id}
              buscar={false}
              paginar={false}
              vazio="Nenhum apontamento de técnico nesta ordem de produção."
              colunas={[
                { key: 'nomeTecnico', label: 'Técnico', largura: 220 },
                { key: 'data', label: 'Data', alinhar: 'centro', largura: 90, render: (tc) => formatDateBR(tc.data) },
                { key: 'horario', label: 'Horário', alinhar: 'centro', largura: 120, render: (tc) => `${tc.horaIni} às ${tc.horaFim}` },
                { key: 'horasTotais', label: 'Horas', alinhar: 'numero', largura: 90, render: (tc) => `${formatDecimal(tc.horasTotais)} h` },
                { key: 'valorHora', label: 'Valor/hora', alinhar: 'numero', largura: 110, render: (tc) => formatCurrencyBRL(tc.valorHora) },
                {
                  key: 'valorTotal',
                  label: 'Total',
                  alinhar: 'numero',
                  largura: 120,
                  render: (tc) => <strong className="font-mono">{formatCurrencyBRL(tc.valorTotal)}</strong>,
                },
              ]}
            />
          )}
        </Modal>
      )}

      {opParaExcluir !== null && (
        <ConfirmDialog
          titulo={`Excluir OP #${opParaExcluir}`}
          mensagem={
            <>
              Você tem certeza que deseja excluir esta Ordem de Produção?
              <strong className="text-rose-600 dark:text-rose-400 mt-2 block">
                Os produtos acabados e insumos serão estornados do Kardex (CARDEX), dos saldos de lotes (PRODUTOSLOTES) e do
                estoque da empresa.
              </strong>
            </>
          }
          confirmar="Excluir e estornar"
          onConfirmar={confirmarExclusao}
          onCancelar={() => setOpParaExcluir(null)}
        />
      )}

      {erro && <AvisoErro mensagem={erro} onFechar={() => setErro('')} />}
      {sucesso && <AvisoErro mensagem={sucesso} tom="sucesso" onFechar={() => setSucesso('')} />}
    </div>
  );
};

import React, { useState, useEffect, useCallback } from 'react';
import { ArrowDownLeft, ArrowUpRight, Printer, Users } from 'lucide-react';
import { Empresa } from '../types';
import { fetchRelatorio } from '../services/api';
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
import { AvisoErro } from '@/components/AvisoErro';
import { ImpressaoProducao } from './ImpressaoProducao';
import { DateField } from './DateField';

interface RelatoriosViewProps {
  empresa: Empresa;
}

export const RelatoriosView: React.FC<RelatoriosViewProps> = ({ empresa }) => {
  const [d1, setD1] = useState(hojeISO(-30));
  const [d2, setD2] = useState(hojeISO());
  const [dados, setDados] = useState<{ producao: any[]; horas: any[] }>({ producao: [], horas: [] });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [modoImpressao, setModoImpressao] = useState(false);

  const carregar = useCallback(async () => {
    if (!d1 || !d2) return;
    try {
      setCarregando(true);
      setDados(await fetchRelatorio({ d1, d2 }));
    } catch (err: any) {
      setErro(err.message || 'Erro ao carregar relatório.');
    } finally {
      setCarregando(false);
    }
  }, [d1, d2]);

  useEffect(() => void carregar(), [carregar]);
  useRefreshDaTela(carregar);

  if (modoImpressao) {
    // A prévia de impressão rola dentro da área de trabalho; na impressão ocupa a página
    return (
      <div className="flex-1 overflow-y-auto min-h-0 print:overflow-visible">
        <ImpressaoProducao empresa={empresa} d1={d1} d2={d2} dados={dados} onVoltar={() => setModoImpressao(false)} />
      </div>
    );
  }

  const custoEntradas = dados.producao.filter((p) => p.tipoMov === 'E').reduce((acc, p) => acc + (p.custoTotalTotal || 0), 0);
  const custoSaidas = dados.producao.filter((p) => p.tipoMov === 'S').reduce((acc, p) => acc + (p.custoTotalTotal || 0), 0);
  const horasTecnicos = dados.horas.reduce((acc, h) => acc + (h.horasTotais || 0), 0);
  const valorTecnicos = dados.horas.reduce((acc, h) => acc + (h.valorTotal || 0), 0);

  const resumo = [
    { titulo: 'Total fabricado (entradas)', icone: <ArrowDownLeft size={14} className="text-emerald-500" />, valor: formatCurrencyBRL(custoEntradas), cor: 'text-emerald-600 dark:text-emerald-400' },
    { titulo: 'Total insumos (saídas)', icone: <ArrowUpRight size={14} className="text-sky-500" />, valor: formatCurrencyBRL(custoSaidas), cor: 'text-sky-600 dark:text-sky-400' },
    { titulo: `Total mão de obra (${formatDecimal(horasTecnicos)} h)`, icone: <Users size={14} className="text-purple-500" />, valor: formatCurrencyBRL(valorTecnicos), cor: 'text-purple-600 dark:text-purple-400' },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0">
      {/* Resumo: faixa chapada com divisórias */}
      <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-stone-200 dark:border-stone-800 shrink-0 divide-y sm:divide-y-0 sm:divide-x divide-stone-200 dark:divide-stone-800 bg-white dark:bg-stone-900">
        {resumo.map((r) => (
          <div key={r.titulo} className="px-4 py-3">
            <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
              {r.icone}
              {r.titulo}
            </span>
            <div className={`text-lg font-bold font-mono mt-0.5 ${r.cor}`}>{r.valor}</div>
          </div>
        ))}
      </div>

      <ListaCrm
        className="flex-1"
        id="relatorios"
        linhas={dados.producao}
        carregando={carregando}
        chave={(p) => p.id ?? `${p.idProducao}-${p.tipoMov}-${p.idPro}-${p.data || p.dataOp}`}
        vazio="Nenhum lançamento no período."
        barraExtra={
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-36">
              <DateField value={d1} onChange={setD1} required className={INPUT_CLASS} />
            </div>
            <span className="text-[11px] text-stone-400">até</span>
            <div className="w-36">
              <DateField value={d2} onChange={setD2} required className={INPUT_CLASS} />
            </div>
            <button
              type="button"
              onClick={() => setModoImpressao(true)}
              disabled={dados.producao.length === 0 && dados.horas.length === 0}
              title="Imprimir o demonstrativo do período"
              className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir / PDF</span>
            </button>
          </div>
        }
        colunas={[
          {
            key: 'tipoMov',
            label: 'Tipo',
            alinhar: 'centro',
            largura: 60,
            render: (p) => {
              const entrada = p.tipoMov === 'E';
              return (
                <span className={`inline-flex items-center gap-0.5 font-bold text-[11px] ${entrada ? 'text-emerald-600 dark:text-emerald-400' : 'text-sky-600 dark:text-sky-400'}`}>
                  {entrada ? <ArrowDownLeft size={12} /> : <ArrowUpRight size={12} />}
                  {entrada ? 'E' : 'S'}
                </span>
              );
            },
          },
          { key: 'idProducao', label: 'OP', alinhar: 'numero', largura: 70 },
          { key: 'data', label: 'Data', alinhar: 'centro', largura: 90, render: (p) => formatDateBR(p.data || p.dataOp) },
          { key: 'descricaoProduto', label: 'Produto / Insumo', largura: 320 },
          { key: 'qtdadeUnControle', label: 'Qtd', alinhar: 'numero', largura: 100, render: (p) => formatQtd(p.qtdadeUnControle) },
          { key: 'unControle', label: 'UN', alinhar: 'centro', largura: 60, render: (p) => p.unControle || 'UN' },
          { key: 'custoTotalUnit', label: 'Custo unit', alinhar: 'numero', largura: 110, render: (p) => formatCurrencyBRL(p.custoTotalUnit) },
          {
            key: 'custoTotalTotal',
            label: 'Custo total',
            alinhar: 'numero',
            largura: 130,
            render: (p) => (
              <span className={`font-semibold ${p.tipoMov === 'E' ? 'text-emerald-600 dark:text-emerald-400' : 'text-sky-600 dark:text-sky-400'}`}>
                {formatCurrencyBRL(p.custoTotalTotal)}
              </span>
            ),
          },
        ]}
        rodape={(key) => {
          if (key === 'descricaoProduto') {
            return (
              <span className="text-[11px]">
                {dados.producao.length} movimentação(ões) • {dados.horas.length} apontamento(s) de técnico
              </span>
            );
          }
          if (key === 'custoTotalTotal') return <strong className="font-mono">{formatCurrencyBRL(custoEntradas + custoSaidas)}</strong>;
          return null;
        }}
      />

      {erro && <AvisoErro mensagem={erro} onFechar={() => setErro('')} />}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { Empresa } from '../types';
import { fetchRelatorio } from '../services/api';
import {
  formatCurrencyBRL,
  formatDateBR,
  formatDecimal,
  formatQtd,
  hojeISO,
} from '../utils/formatters';
import { INPUT_CLASS, FIELD_WRAPPER_CLASS } from '../utils/formStyles';
import {
  PAINEL, BARRA, BTN_PRIMARIO, BTN_SECUNDARIO, GRADE_AREA, TABELA, TH, TH_INDICADOR, TR, TD,
  TD_INDICADOR, INDICADOR, TD_VAZIO, MSG_ERRO, RODAPE,
} from '../utils/listaStyles';
import { ImpressaoProducao } from './ImpressaoProducao';
import { DateField } from './DateField';
import {
  Printer,
  Loader2,
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Users,
  RefreshCw,
  ChevronRight,
  Inbox,
} from 'lucide-react';

interface RelatoriosViewProps {
  empresa: Empresa;
}

export const RelatoriosView: React.FC<RelatoriosViewProps> = ({ empresa }) => {
  const [d1, setD1] = useState(hojeISO(-30));
  const [d2, setD2] = useState(hojeISO());
  const [dados, setDados] = useState<{ producao: any[]; horas: any[] }>({
    producao: [],
    horas: [],
  });
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [modoImpressao, setModoImpressao] = useState(false);

  useEffect(() => {
    carregarRelatorio();
  }, []);

  const carregarRelatorio = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      setLoading(true);
      setErro(null);
      const res = await fetchRelatorio({ d1, d2 });
      setDados(res);
    } catch (err: any) {
      setErro(err.message || 'Erro ao carregar relatório.');
    } finally {
      setLoading(false);
    }
  };

  if (modoImpressao) {
    // A prévia de impressão rola dentro da área de trabalho; na impressão ocupa a página
    return (
      <div className="flex-1 overflow-y-auto min-h-0 print:overflow-visible">
        <ImpressaoProducao
          empresa={empresa}
          d1={d1}
          d2={d2}
          dados={dados}
          onVoltar={() => setModoImpressao(false)}
        />
      </div>
    );
  }

  const totalCustoEntradas = dados.producao
    .filter((p) => p.tipoMov === 'E')
    .reduce((acc, p) => acc + (p.custoTotalTotal || 0), 0);

  const totalCustoSaidas = dados.producao
    .filter((p) => p.tipoMov === 'S')
    .reduce((acc, p) => acc + (p.custoTotalTotal || 0), 0);

  const totalHorasTecnicos = dados.horas.reduce((acc, h) => acc + (h.horasTotais || 0), 0);
  const totalValorTecnicos = dados.horas.reduce((acc, h) => acc + (h.valorTotal || 0), 0);

  const campo = `${INPUT_CLASS} ${FIELD_WRAPPER_CLASS}`;

  const resumo = [
    {
      titulo: 'Total Fabricado (Entradas)',
      icone: <ArrowDownLeft size={14} className="text-emerald-500" />,
      valor: formatCurrencyBRL(totalCustoEntradas),
      cor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      titulo: 'Total Insumos (Saídas)',
      icone: <ArrowUpRight size={14} className="text-blue-500" />,
      valor: formatCurrencyBRL(totalCustoSaidas),
      cor: 'text-blue-600 dark:text-blue-400',
    },
    {
      titulo: `Total Mão de Obra (${formatDecimal(totalHorasTecnicos)} h)`,
      icone: <Users size={14} className="text-purple-500" />,
      valor: formatCurrencyBRL(totalValorTecnicos),
      cor: 'text-purple-600 dark:text-purple-400',
    },
  ];

  return (
    <div className={PAINEL}>
      {/* Barra de ferramentas: período + impressão */}
      <form onSubmit={carregarRelatorio} className={BARRA}>
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-36">
            <DateField value={d1} onChange={setD1} required className={campo} />
          </div>
          <span className="text-[11px] text-stone-400">até</span>
          <div className="w-36">
            <DateField value={d2} onChange={setD2} required className={campo} />
          </div>
          <button type="submit" disabled={loading || !d1 || !d2} className={BTN_SECUNDARIO}>
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            <span>Atualizar</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setModoImpressao(true)}
          disabled={dados.producao.length === 0 && dados.horas.length === 0}
          className={BTN_PRIMARIO}
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Imprimir / PDF</span>
        </button>
      </form>

      {erro && (
        <div className={MSG_ERRO}>
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{erro}</span>
        </div>
      )}

      {/* Resumo: faixa chapada com divisórias */}
      <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-stone-200 dark:border-stone-800 shrink-0 divide-y sm:divide-y-0 sm:divide-x divide-stone-200 dark:divide-stone-800">
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

      {/* Movimentações do período */}
      <div className={GRADE_AREA}>
        <table className={TABELA}>
          <thead className="sticky top-0 z-10">
            <tr>
              <th className={TH_INDICADOR} />
              <th className={`${TH} w-16`}>Tipo</th>
              <th className={`${TH} w-20`}>OP</th>
              <th className={`${TH} w-24`}>Data</th>
              <th className={TH}>Produto / Insumo</th>
              <th className={`${TH} w-24`}>Qtd</th>
              <th className={`${TH} w-14`}>UN</th>
              <th className={`${TH} w-28`}>Custo Unit</th>
              <th className={`${TH} w-32`}>Custo Total</th>
            </tr>
          </thead>
          <tbody className={loading && dados.producao.length > 0 ? 'opacity-60' : undefined}>
            {loading && dados.producao.length === 0 ? (
              <tr>
                <td colSpan={9} className={TD_VAZIO}>
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Carregando relatório…
                  </span>
                </td>
              </tr>
            ) : dados.producao.length === 0 ? (
              <tr>
                <td colSpan={9} className={TD_VAZIO}>
                  <div className="flex flex-col items-center gap-2">
                    <Inbox className="w-8 h-8" />
                    <span className="text-sm font-medium text-stone-600 dark:text-stone-300">
                      Nenhum lançamento no período
                    </span>
                  </div>
                </td>
              </tr>
            ) : (
              dados.producao.map((p, idx) => {
                const isEntrada = p.tipoMov === 'E';
                return (
                  <tr key={idx} className={TR}>
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
                    <td className={`${TD} text-right font-mono`}>{p.idProducao}</td>
                    <td className={`${TD} text-center`}>{formatDateBR(p.data || p.dataOp)}</td>
                    <td className={`${TD} font-medium`}>{p.descricaoProduto}</td>
                    <td className={`${TD} text-right font-mono`}>{formatQtd(p.qtdadeUnControle)}</td>
                    <td className={`${TD} text-center font-mono`}>{p.unControle || 'UN'}</td>
                    <td className={`${TD} text-right font-mono`}>{formatCurrencyBRL(p.custoTotalUnit)}</td>
                    <td
                      className={`${TD} text-right font-mono font-semibold ${
                        isEntrada ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {formatCurrencyBRL(p.custoTotalTotal)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className={RODAPE}>
        <span>
          Movimentações do período:{' '}
          <strong className="text-stone-800 dark:text-stone-200">{dados.producao.length}</strong>
        </span>
        <span>
          Apontamentos de técnicos: <strong className="text-stone-800 dark:text-stone-200">{dados.horas.length}</strong>
        </span>
      </div>
    </div>
  );
};

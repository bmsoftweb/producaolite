import React from 'react';
import { Empresa } from '../types';
import { formatCurrencyBRL, formatDateBR, formatDateTimeBR, formatDecimal } from '../utils/formatters';
import { Printer, ArrowLeft } from 'lucide-react';

interface ImpressaoProducaoProps {
  empresa: Empresa;
  d1: string;
  d2: string;
  dados: {
    producao: any[];
    horas: any[];
  };
  onVoltar: () => void;
}

export const ImpressaoProducao: React.FC<ImpressaoProducaoProps> = ({
  empresa,
  d1,
  d2,
  dados,
  onVoltar,
}) => {
  const totalCustoEntradas = dados.producao
    .filter((p) => p.tipoMov === 'E')
    .reduce((acc, p) => acc + (p.custoTotalTotal || 0), 0);

  const totalCustoSaidas = dados.producao
    .filter((p) => p.tipoMov === 'S')
    .reduce((acc, p) => acc + (p.custoTotalTotal || 0), 0);

  const totalHorasTecnicos = dados.horas.reduce((acc, h) => acc + (h.horasTotais || 0), 0);
  const totalValorTecnicos = dados.horas.reduce((acc, h) => acc + (h.valorTotal || 0), 0);

  return (
    <div className="bg-stone-100 dark:bg-stone-950 min-h-screen p-4 sm:p-8 print:p-0 print:bg-white text-stone-900 dark:text-stone-100 print:text-black">
      {/* Barra de Ações (Oculta na impressão) */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <button
          type="button"
          onClick={onVoltar}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-700 dark:text-stone-300 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:bg-stone-50 flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <ArrowLeft size={16} />
          <span>Voltar para Relatórios</span>
        </button>

        <button
          type="button"
          onClick={() => window.print()}
          className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 flex items-center gap-2 cursor-pointer shadow-md shadow-amber-500/20"
        >
          <Printer size={16} />
          <span>Imprimir / Gerar PDF (A4)</span>
        </button>
      </div>

      {/* Folha A4 de Relatório */}
      <div className="max-w-4xl mx-auto bg-white text-black p-8 sm:p-12 rounded-2xl shadow-xl print:shadow-none print:p-0 border border-stone-200 print:border-none">
        {/* Cabeçalho do Relatório */}
        <div className="border-b-2 border-stone-800 pb-4 mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight uppercase">
              {empresa.nome}
            </h1>
            <p className="text-xs text-stone-600">
              CNPJ: {empresa.cnpj || '–'} • {empresa.cidade || ''} - {empresa.uf || ''}
            </p>
            <h2 className="text-sm font-semibold mt-2 text-stone-800">
              Relatório Analítico de Produção e Horas Técnicas
            </h2>
          </div>

          <div className="text-right text-xs text-stone-500">
            <div>Período: <strong>{formatDateBR(d1)}</strong> a <strong>{formatDateBR(d2)}</strong></div>
            <div>Emitido em: {formatDateTimeBR(new Date().toISOString())}</div>
          </div>
        </div>

        {/* Seção 1: Itens de Produção */}
        <div className="mb-8">
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 border-b border-stone-300 pb-1 mb-2">
            1. Movimentações de Ordens de Produção
          </h3>

          <table className="w-full text-left text-[11px]">
            <thead className="border-b border-stone-300 font-semibold text-stone-700">
              <tr>
                <th className="py-1 w-12 text-center">Tipo</th>
                <th className="py-1 w-14">OP #</th>
                <th className="py-1 w-20">Data</th>
                <th className="py-1">Produto / Insumo</th>
                <th className="py-1 w-16 text-right">Qtd</th>
                <th className="py-1 w-12 text-center">UN</th>
                <th className="py-1 w-20 text-right">Custo Unit</th>
                <th className="py-1 w-24 text-right">Custo Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {dados.producao.map((p, idx) => (
                <tr key={idx}>
                  <td className="py-1 text-center font-bold">
                    {p.tipoMov === 'E' ? 'ENTRADA' : 'SAÍDA'}
                  </td>
                  <td className="py-1 font-mono">#{p.idProducao}</td>
                  <td className="py-1">{formatDateBR(p.data || p.dataOp)}</td>
                  <td className="py-1 font-medium">{p.descricaoProduto}</td>
                  <td className="py-1 text-right font-mono">{formatDecimal(p.qtdadeUnControle)}</td>
                  <td className="py-1 text-center font-mono">{p.unControle || 'UN'}</td>
                  <td className="py-1 text-right font-mono">{formatCurrencyBRL(p.custoTotalUnit)}</td>
                  <td className="py-1 text-right font-mono font-semibold">
                    {formatCurrencyBRL(p.custoTotalTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Subtotais de Produção */}
          <div className="mt-3 pt-2 border-t border-stone-300 flex justify-end gap-6 text-xs font-semibold">
            <span>Total Fabricados (Entradas): {formatCurrencyBRL(totalCustoEntradas)}</span>
            <span>Total Insumos (Saídas): {formatCurrencyBRL(totalCustoSaidas)}</span>
          </div>
        </div>

        {/* Seção 2: Apontamento de Técnicos */}
        {dados.horas && dados.horas.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-800 border-b border-stone-300 pb-1 mb-2">
              2. Horas Técnicas e Mão de Obra
            </h3>

            <table className="w-full text-left text-[11px]">
              <thead className="border-b border-stone-300 font-semibold text-stone-700">
                <tr>
                  <th className="py-1 w-14">OP #</th>
                  <th className="py-1 w-20">Data</th>
                  <th className="py-1">Técnico / Operador</th>
                  <th className="py-1 w-24 text-center">Horário</th>
                  <th className="py-1 w-20 text-right">Horas</th>
                  <th className="py-1 w-20 text-right">Valor/Hora</th>
                  <th className="py-1 w-24 text-right">Valor Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-200">
                {dados.horas.map((h, idx) => (
                  <tr key={idx}>
                    <td className="py-1 font-mono">#{h.idProducao}</td>
                    <td className="py-1">{formatDateBR(h.data)}</td>
                    <td className="py-1 font-medium">{h.nomeTecnico}</td>
                    <td className="py-1 text-center font-mono">{h.horaIni} às {h.horaFim}</td>
                    <td className="py-1 text-right font-mono">{formatDecimal(h.horasTotais)} h</td>
                    <td className="py-1 text-right font-mono">{formatCurrencyBRL(h.valorHora)}</td>
                    <td className="py-1 text-right font-mono font-semibold">{formatCurrencyBRL(h.valorTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Subtotais de Mão de Obra */}
            <div className="mt-3 pt-2 border-t border-stone-300 flex justify-end gap-6 text-xs font-semibold">
              <span>Total Horas: {formatDecimal(totalHorasTecnicos)} h</span>
              <span>Total Mão de Obra: {formatCurrencyBRL(totalValorTecnicos)}</span>
            </div>
          </div>
        )}

        {/* Rodapé Final do Relatório */}
        <div className="mt-12 pt-4 border-t-2 border-stone-800 flex justify-between text-xs text-stone-500">
          <span>Produção Lite — BMsoft sistemas</span>
          <span>Página 1 de 1</span>
        </div>
      </div>
    </div>
  );
};

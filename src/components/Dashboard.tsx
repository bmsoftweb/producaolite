import React, { useState, useEffect } from 'react';
import { Usuario, Empresa, ServidorInfo, DbConnectionStatus, ItemProducao } from '../types';
import { fetchProducao, fetchTecnicos, fetchPadroes } from '../services/api';
import { formatCurrencyBRL, formatDateBR, formatDecimal, hojeISO } from '../utils/formatters';
import {
  Factory,
  Package,
  Layers,
  Users,
  Plus,
  ArrowRight,
  ScrollText,
  BarChart3,
  Activity,
  ArrowDownLeft,
  ArrowUpRight,
  Loader2,
} from 'lucide-react';
import { NavTab } from './Sidebar';

interface DashboardProps {
  usuario: Usuario;
  empresa: Empresa;
  servidor: ServidorInfo;
  dbStatus: DbConnectionStatus | null;
  onNavigate: (tab: NavTab) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  usuario,
  empresa,
  servidor,
  dbStatus,
  onNavigate,
}) => {
  const [loading, setLoading] = useState(false);
  const [recentes, setRecentes] = useState<ItemProducao[]>([]);
  const [totalOpsMes, setTotalOpsMes] = useState(0);
  const [totalEntradasMes, setTotalEntradasMes] = useState(0);
  const [totalSaidasMes, setTotalSaidasMes] = useState(0);
  const [totalTecnicos, setTotalTecnicos] = useState(0);
  const [totalPadroes, setTotalPadroes] = useState(0);

  useEffect(() => {
    carregarDados();
  }, []);

  const carregarDados = async () => {
    try {
      setLoading(true);
      const primeiroDiaMes = `${hojeISO().slice(0, 7)}-01`;
      const hoje = hojeISO();

      const [movimentos, tecs, pads] = await Promise.all([
        fetchProducao({ d1: primeiroDiaMes, d2: hoje }).catch(() => []),
        fetchTecnicos().catch(() => []),
        fetchPadroes().catch(() => []),
      ]);

      setRecentes(movimentos.slice(0, 6));
      setTotalTecnicos(tecs.length);
      setTotalPadroes(pads.length);

      // Agrupa OPs únicas
      const opsUnicas = new Set(movimentos.map((m) => m.idProducao));
      setTotalOpsMes(opsUnicas.size);

      const entradas = movimentos.filter((m) => m.tipoMov === 'E');
      const saidas = movimentos.filter((m) => m.tipoMov === 'S');
      setTotalEntradasMes(entradas.length);
      setTotalSaidasMes(saidas.length);
    } catch (err) {
      console.error('Erro ao carregar métricas do dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-in fade-in duration-200">
      {/* Banner de Boas-Vindas */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent dark:from-amber-950/20 dark:to-transparent rounded-2xl p-6 border border-amber-500/20 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Painel de Controle
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-stone-900 dark:text-stone-100 tracking-tight mt-0.5">
              Olá, {usuario.nome}!
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400 mt-1">
              Empresa ativa: <strong className="text-stone-800 dark:text-stone-200">{empresa.nome}</strong> • Servidor #{servidor.numero}
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('producao')}
            className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:from-amber-700 active:to-amber-800 transition-all shadow-md shadow-amber-500/20 flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Plus size={16} />
            <span>Nova Ordem de Produção</span>
          </button>
        </div>
      </div>

      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: OPs no Mês */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              OPs no Mês
            </span>
            <div className="text-2xl font-extrabold text-stone-900 dark:text-stone-100 font-mono mt-1">
              {loading ? <Loader2 size={20} className="animate-spin text-amber-500" /> : totalOpsMes}
            </div>
            <span className="text-[11px] text-stone-400 mt-1 block">
              Ordens geradas no período atual
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Factory size={24} />
          </div>
        </div>

        {/* Card 2: Produtos Acabados */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Entradas (Fabricados)
            </span>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
              {loading ? <Loader2 size={20} className="animate-spin text-emerald-500" /> : totalEntradasMes}
            </div>
            <span className="text-[11px] text-stone-400 mt-1 block">
              Itens acabados no mês
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <ArrowDownLeft size={24} />
          </div>
        </div>

        {/* Card 3: Insumos Consumidos */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Saídas (Insumos)
            </span>
            <div className="text-2xl font-extrabold text-blue-600 dark:text-blue-400 font-mono mt-1">
              {loading ? <Loader2 size={20} className="animate-spin text-blue-500" /> : totalSaidasMes}
            </div>
            <span className="text-[11px] text-stone-400 mt-1 block">
              Matérias-primas requisitadas
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <ArrowUpRight size={24} />
          </div>
        </div>

        {/* Card 4: Técnicos Cadastrados */}
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 border border-stone-200 dark:border-stone-800 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">
              Equipe Técnica
            </span>
            <div className="text-2xl font-extrabold text-purple-600 dark:text-purple-400 font-mono mt-1">
              {loading ? <Loader2 size={20} className="animate-spin text-purple-500" /> : totalTecnicos}
            </div>
            <span className="text-[11px] text-stone-400 mt-1 block">
              Profissionais disponíveis
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
            <Users size={24} />
          </div>
        </div>
      </div>

      {/* Atalhos Rápidos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => onNavigate('producao')}
          className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-amber-400 dark:hover:border-amber-500/50 hover:shadow-md transition-all text-left group cursor-pointer"
        >
          <Factory size={20} className="text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
          <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200">Ordens de Produção</h4>
          <p className="text-[11px] text-stone-400 mt-0.5">Histórico e apontamento de OPs</p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('padroes')}
          className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-amber-400 dark:hover:border-amber-500/50 hover:shadow-md transition-all text-left group cursor-pointer"
        >
          <ScrollText size={20} className="text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
          <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200">Fichas Técnicas</h4>
          <p className="text-[11px] text-stone-400 mt-0.5">{totalPadroes} modelo(s) cadastrado(s)</p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('tecnicos')}
          className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-amber-400 dark:hover:border-amber-500/50 hover:shadow-md transition-all text-left group cursor-pointer"
        >
          <Users size={20} className="text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
          <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200">Técnicos & Operadores</h4>
          <p className="text-[11px] text-stone-400 mt-0.5">Valores e centros de custo</p>
        </button>

        <button
          type="button"
          onClick={() => onNavigate('relatorios')}
          className="p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-amber-400 dark:hover:border-amber-500/50 hover:shadow-md transition-all text-left group cursor-pointer"
        >
          <BarChart3 size={20} className="text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
          <h4 className="text-xs font-bold text-stone-800 dark:text-stone-200">Relatórios de Custos</h4>
          <p className="text-[11px] text-stone-400 mt-0.5">Analítico e horas técnicas</p>
        </button>
      </div>

      {/* Tabela de Movimentações Recentes */}
      <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-stone-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity size={18} className="text-amber-500" />
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              Últimas Movimentações de Produção
            </h3>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('producao')}
            className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-700 flex items-center gap-1 transition-colors"
          >
            <span>Ver todas as OPs</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100/70 dark:bg-stone-800/70 text-stone-600 dark:text-stone-300 font-semibold">
              <tr>
                <th className="p-3 w-16 text-center">Tipo</th>
                <th className="p-3 w-20">OP #</th>
                <th className="p-3 w-28">Data</th>
                <th className="p-3">Produto / Insumo</th>
                <th className="p-3 w-24 text-right">Qtd</th>
                <th className="p-3 w-16 text-center">UN</th>
                <th className="p-3 w-32 text-right">Custo Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 dark:divide-stone-800 text-stone-800 dark:text-stone-200">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400">
                    <Loader2 size={20} className="animate-spin text-amber-500 mx-auto mb-2" />
                    <span>Carregando dados...</span>
                  </td>
                </tr>
              ) : recentes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400">
                    Nenhuma produção recente registrada no mês atual.
                  </td>
                </tr>
              ) : (
                recentes.map((it) => {
                  const isEntrada = it.tipoMov === 'E';
                  return (
                    <tr key={it.id} className="hover:bg-stone-50/70 dark:hover:bg-stone-800/40">
                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded font-bold text-[10px] ${
                            isEntrada
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                              : 'bg-blue-500/15 text-blue-700 dark:text-blue-400'
                          }`}
                        >
                          {isEntrada ? 'E' : 'S'}
                        </span>
                      </td>
                      <td className="p-3 font-mono font-bold text-stone-700 dark:text-stone-300">
                        #{it.idProducao}
                      </td>
                      <td className="p-3 text-stone-500">{formatDateBR(it.data || it.dataOp)}</td>
                      <td className="p-3 font-medium">{it.descricaoProduto}</td>
                      <td className="p-3 text-right font-mono font-semibold">
                        {formatDecimal(it.qtdadeUnControle)}
                      </td>
                      <td className="p-3 text-center font-mono text-stone-500">
                        {it.unControle || 'UN'}
                      </td>
                      <td
                        className={`p-3 text-right font-mono font-bold ${
                          isEntrada ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'
                        }`}
                      >
                        {formatCurrencyBRL(it.custoTotalTotal)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

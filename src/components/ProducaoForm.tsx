import React, { useState, useEffect, useRef } from 'react';
import {
  FormOP,
  FormEntrada,
  FormSaida,
  FormTecnico,
  CentroCusto,
  Tecnico,
  ProdutoPrincipal,
  ProdutoEsp,
  ItemDav,
  ProdutoOs,
} from '../types';
import {
  fetchCentrosCusto,
  fetchTecnicos,
  buscarProduto,
  fetchCustoProduto,
  fetchProdutosEsp,
  criarProducao,
} from '../services/api';
import {
  formatCurrencyBRL,
  formatDecimal,
  hojeISO,
  calcHoras,
  toInputDate,
} from '../utils/formatters';
import { INPUT_CLASS, LABEL_CLASS, FIELD_WRAPPER_CLASS } from '../utils/formStyles';
import {
  PAINEL, BARRA, BTN_PRIMARIO, BTN_SECUNDARIO, TABELA, TH, TR, TD, BTN_ACAO_EXCLUIR, MSG_ERRO, MSG_SUCESSO,
} from '../utils/listaStyles';
import { ConfirmModal } from './ConfirmModal';
import { DateField } from './DateField';
import { NumberField } from './NumberField';
import { LoteModal } from './LoteModal';
import { CalcularModal } from './CalcularModal';
import { BuscarPadraoModal } from './BuscarPadraoModal';
import { SalvarPadraoModal } from './SalvarPadraoModal';
import { CapturaDavModal } from './CapturaDavModal';
import { CapturaOsModal } from './CapturaOsModal';
import {
  Factory,
  ArrowDownLeft,
  ArrowUpRight,
  Users,
  Plus,
  Trash2,
  Tag,
  Search,
  RefreshCw,
  Calculator,
  BookmarkPlus,
  BookOpen,
  FileSpreadsheet,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  DollarSign,
  X,
} from 'lucide-react';

interface ProducaoFormProps {
  onVoltar: () => void;
  onProducaoCriada: (idOp: number) => void;
  opInicial?: {
    op: FormOP;
    entradas: FormEntrada[];
    saidas: FormSaida[];
    tecnicos: FormTecnico[];
  };
}

export const ProducaoForm: React.FC<ProducaoFormProps> = ({
  onVoltar,
  onProducaoCriada,
  opInicial,
}) => {
  // Cabeçalho da OP
  const [op, setOp] = useState<FormOP>(() => opInicial?.op || {
    data: hojeISO(),
    doc: '',
    obs: '',
    qtdadeQuebraUnEstoque: 0,
  });

  // Tabelas filhas
  const [entradas, setEntradas] = useState<FormEntrada[]>(() => opInicial?.entradas || []);
  const [saidas, setSaidas] = useState<FormSaida[]>(() => opInicial?.saidas || []);
  const [tecnicos, setTecnicos] = useState<FormTecnico[]>(() => opInicial?.tecnicos || []);

  // Dados auxiliares
  const [centrosCusto, setCentrosCusto] = useState<CentroCusto[]>([]);
  const [tecnicosCadastrados, setTecnicosCadastrados] = useState<Tecnico[]>([]);
  const [produtosParametrizados, setProdutosParametrizados] = useState<Record<number, ProdutoEsp>>({});

  // Modais
  const [modalLoteAberto, setModalLoteAberto] = useState(false);
  const [loteAlvo, setLoteAlvo] = useState<{ tipo: 'E' | 'S'; index: number } | null>(null);

  const [modalCalcularAberto, setModalCalcularAberto] = useState(false);
  const [modalBuscarPadraoAberto, setModalBuscarPadraoAberto] = useState(false);
  const [modalSalvarPadraoAberto, setModalSalvarPadraoAberto] = useState(false);
  const [modalDavAberto, setModalDavAberto] = useState(false);
  const [modalOsAberto, setModalOsAberto] = useState(false);

  // Estados de busca rápida de produto
  const [buscaEntrada, setBuscaEntrada] = useState('');
  const [sugestoesEntrada, setSugestoesEntrada] = useState<ProdutoPrincipal[]>([]);
  const [buscandoEntrada, setBuscandoEntrada] = useState(false);

  const [buscaSaida, setBuscaSaida] = useState('');
  const [sugestoesSaida, setSugestoesSaida] = useState<ProdutoPrincipal[]>([]);
  const [buscandoSaida, setBuscandoSaida] = useState(false);

  // Estado de envio e erros
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  // Confirmação de remoção de linha (entrada, saída ou técnico)
  const [removendo, setRemovendo] = useState<{ tipo: 'E' | 'S' | 'T'; idx: number; nome: string } | null>(null);

  // Carrega dados iniciais de apoio
  useEffect(() => {
    carregarApoio();
  }, []);

  const carregarApoio = async () => {
    try {
      const [ccs, tecs, espList] = await Promise.all([
        fetchCentrosCusto(),
        fetchTecnicos(),
        fetchProdutosEsp().catch(() => []),
      ]);
      setCentrosCusto(ccs);
      setTecnicosCadastrados(tecs);

      const espMap: Record<number, ProdutoEsp> = {};
      for (const p of espList) {
        espMap[p.idPro] = p;
      }
      setProdutosParametrizados(espMap);
    } catch (err: any) {
      console.error('Erro ao carregar dados de apoio:', err);
    }
  };

  // Busca de produtos da entrada com debounce
  useEffect(() => {
    if (!buscaEntrada.trim() || buscaEntrada.length < 2) {
      setSugestoesEntrada([]);
      return;
    }
    const timer = setTimeout(async () => {
      setBuscandoEntrada(true);
      try {
        const res = await buscarProduto(buscaEntrada);
        setSugestoesEntrada(res);
      } catch {
        setSugestoesEntrada([]);
      } finally {
        setBuscandoEntrada(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [buscaEntrada]);

  // Busca de produtos da saída com debounce
  useEffect(() => {
    if (!buscaSaida.trim() || buscaSaida.length < 2) {
      setSugestoesSaida([]);
      return;
    }
    const timer = setTimeout(async () => {
      setBuscandoSaida(true);
      try {
        const res = await buscarProduto(buscaSaida);
        setSugestoesSaida(res);
      } catch {
        setSugestoesSaida([]);
      } finally {
        setBuscandoSaida(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [buscaSaida]);

  // Totais
  const totalCustoSaidas = saidas.reduce((acc, s) => acc + (s.custoTotalTotal || 0), 0);
  const totalCustoTecnicos = tecnicos.reduce((acc, t) => acc + (t.valorTotal || 0), 0);
  const custoGeralProducao = totalCustoSaidas + totalCustoTecnicos;
  const totalQtdEntradas = entradas.reduce((acc, e) => acc + (e.qtdadeUnControle || 0), 0);
  const custoUnitarioEntrada = totalQtdEntradas > 0 ? custoGeralProducao / totalQtdEntradas : 0;

  // Rateio automático de custo para as entradas
  useEffect(() => {
    if (entradas.length === 0) return;
    setEntradas((prev) =>
      prev.map((e) => {
        const cTotal = totalQtdEntradas > 0 ? (e.qtdadeUnControle / totalQtdEntradas) * custoGeralProducao : 0;
        const cUnit = e.qtdadeUnControle > 0 ? cTotal / e.qtdadeUnControle : 0;
        return {
          ...e,
          custoTotalUnit: Math.round(cUnit * 10000) / 10000,
          custoTotalTotal: Math.round(cTotal * 100) / 100,
        };
      }),
    );
  }, [totalCustoSaidas, totalCustoTecnicos, totalQtdEntradas]);

  // Adicionar produto de entrada selecionado
  const handleSelecionarEntrada = async (prod: ProdutoPrincipal) => {
    setBuscaEntrada('');
    setSugestoesEntrada([]);

    const esp = produtosParametrizados[prod.id];
    const fator = esp?.fatorConversao || 1;
    const unControle = esp?.unControle || prod.un || 'UN';
    const unEstoque = esp?.unEstoque || prod.un || 'UN';
    const tipoBaixa = esp?.tipoUnBaixa || 'E';

    let custo = 0;
    try {
      const cRes = await fetchCustoProduto(prod.id);
      custo = cRes.custo || 0;
    } catch {}

    const novoItem: FormEntrada = {
      idPro: prod.id,
      descricao: prod.descricao,
      qtdadeUnControle: 1,
      qtdadeUnEstoque: 1 * fator,
      unControle,
      unEstoque,
      fatorConversao: fator,
      tipoUnBaixa: tipoBaixa,
      custoTotalUnit: custo,
      custoTotalTotal: custo,
      lote: '',
      idCc: centrosCusto[0]?.id || 0,
    };

    setEntradas((prev) => [...prev, novoItem]);
  };

  // Adicionar insumo de saída selecionado
  const handleSelecionarSaida = async (prod: ProdutoPrincipal) => {
    setBuscaSaida('');
    setSugestoesSaida([]);

    const esp = produtosParametrizados[prod.id];
    const fator = esp?.fatorConversao || 1;
    const unControle = esp?.unControle || prod.un || 'UN';
    const unEstoque = esp?.unEstoque || prod.un || 'UN';
    const tipoBaixa = esp?.tipoUnBaixa || 'E';

    let custo = 0;
    try {
      const cRes = await fetchCustoProduto(prod.id);
      custo = cRes.custo || 0;
    } catch {}

    const novoItem: FormSaida = {
      idPro: prod.id,
      descricao: prod.descricao,
      qtdadeUnControle: 1,
      qtdadeUnEstoque: 1 * fator,
      unControle,
      unEstoque,
      fatorConversao: fator,
      tipoUnBaixa: tipoBaixa,
      quebraUnControle: 0,
      quebraUnEstoque: 0,
      custoTotalUnit: custo,
      custoTotalTotal: custo,
      lote: '',
      idCc: centrosCusto[0]?.id || 0,
    };

    setSaidas((prev) => [...prev, novoItem]);
  };

  // Alteração de campos em Entradas
  const handleAtualizarEntrada = (index: number, campo: keyof FormEntrada, valor: any) => {
    setEntradas((prev) => {
      const copy = [...prev];
      const item = { ...copy[index], [campo]: valor };

      if (campo === 'qtdadeUnControle') {
        const q = parseFloat(valor) || 0;
        item.qtdadeUnControle = q;
        item.qtdadeUnEstoque = Math.round(q * (item.fatorConversao || 1) * 10000) / 10000;
        item.custoTotalTotal = Math.round(q * (item.custoTotalUnit || 0) * 100) / 100;
      }

      copy[index] = item;
      return copy;
    });
  };

  // Alteração de campos em Saídas
  const handleAtualizarSaida = (index: number, campo: keyof FormSaida, valor: any) => {
    setSaidas((prev) => {
      const copy = [...prev];
      const item = { ...copy[index], [campo]: valor };

      if (campo === 'qtdadeUnControle' || campo === 'custoTotalUnit' || campo === 'quebraUnControle') {
        const q = campo === 'qtdadeUnControle' ? parseFloat(valor) || 0 : item.qtdadeUnControle;
        const c = campo === 'custoTotalUnit' ? parseFloat(valor) || 0 : item.custoTotalUnit;
        const qb = campo === 'quebraUnControle' ? parseFloat(valor) || 0 : item.quebraUnControle;

        item.qtdadeUnControle = q;
        item.custoTotalUnit = c;
        item.quebraUnControle = qb;
        item.qtdadeUnEstoque = Math.round(q * (item.fatorConversao || 1) * 10000) / 10000;
        item.quebraUnEstoque = Math.round(qb * (item.fatorConversao || 1) * 10000) / 10000;
        item.custoTotalTotal = Math.round(q * c * 100) / 100;
      }

      copy[index] = item;
      return copy;
    });
  };

  // Adicionar técnico
  const handleAdicionarTecnico = (tecnico: Tecnico) => {
    const horaIni = '08:00';
    const horaFim = '09:00';
    const horas = calcHoras(horaIni, horaFim);
    const vTotal = Math.round(horas * (tecnico.valorHora || 0) * 100) / 100;

    const novoTec: FormTecnico = {
      idTecnico: tecnico.id,
      nomeTecnico: tecnico.nome,
      data: op.data || hojeISO(),
      horaIni,
      horaFim,
      horasTotais: horas,
      valorHora: tecnico.valorHora || 0,
      valorTotal: vTotal,
      idCc: tecnico.idCc || centrosCusto[0]?.id || 0,
    };

    setTecnicos((prev) => [...prev, novoTec]);
  };

  // Atualizar técnico
  const handleAtualizarTecnico = (index: number, campo: keyof FormTecnico, valor: any) => {
    setTecnicos((prev) => {
      const copy = [...prev];
      const item = { ...copy[index], [campo]: valor };

      if (campo === 'horaIni' || campo === 'horaFim' || campo === 'valorHora') {
        const ini = campo === 'horaIni' ? valor : item.horaIni;
        const fim = campo === 'horaFim' ? valor : item.horaFim;
        const vHora = campo === 'valorHora' ? parseFloat(valor) || 0 : item.valorHora;
        const horas = calcHoras(ini, fim);

        item.horaIni = ini;
        item.horaFim = fim;
        item.horasTotais = horas;
        item.valorHora = vHora;
        item.valorTotal = Math.round(horas * vHora * 100) / 100;
      }

      copy[index] = item;
      return copy;
    });
  };

  // Aplicação do multiplicador proporcional (CalcularModal)
  const handleAplicarFator = (fator: number) => {
    setEntradas((prev) =>
      prev.map((e) => {
        const nQtd = Math.round(e.qtdadeUnControle * fator * 10000) / 10000;
        return {
          ...e,
          qtdadeUnControle: nQtd,
          qtdadeUnEstoque: Math.round(nQtd * (e.fatorConversao || 1) * 10000) / 10000,
        };
      }),
    );

    setSaidas((prev) =>
      prev.map((s) => {
        const nQtd = Math.round(s.qtdadeUnControle * fator * 10000) / 10000;
        const nQb = Math.round((s.quebraUnControle || 0) * fator * 10000) / 10000;
        return {
          ...s,
          qtdadeUnControle: nQtd,
          qtdadeUnEstoque: Math.round(nQtd * (s.fatorConversao || 1) * 10000) / 10000,
          quebraUnControle: nQb,
          quebraUnEstoque: Math.round(nQb * (s.fatorConversao || 1) * 10000) / 10000,
          custoTotalTotal: Math.round(nQtd * (s.custoTotalUnit || 0) * 100) / 100,
        };
      }),
    );

    setSucesso(`Proporção de ${fator.toFixed(2)}x aplicada com sucesso em todas as quantidades!`);
    setTimeout(() => setSucesso(null), 3000);
  };

  // Refazer custos: atualiza custos de todos os insumos de saída via bmAPI
  const handleRefazerCustos = async () => {
    try {
      setSalvando(true);
      let atualizados = 0;
      const novasSaidas = await Promise.all(
        saidas.map(async (s) => {
          try {
            const res = await fetchCustoProduto(s.idPro);
            const novoCusto = res.custo || 0;
            atualizados++;
            return {
              ...s,
              custoTotalUnit: novoCusto,
              custoTotalTotal: Math.round(s.qtdadeUnControle * novoCusto * 100) / 100,
            };
          } catch {
            return s;
          }
        }),
      );
      setSaidas(novasSaidas);
      setSucesso(`Custos das matérias-primas atualizados com sucesso (${atualizados} itens)!`);
      setTimeout(() => setSucesso(null), 3000);
    } catch (err: any) {
      setErro(err.message || 'Erro ao refazer custos.');
    } finally {
      setSalvando(false);
    }
  };

  // Carregar padrão / receita
  const handleCarregarPadrao = async (dados: { produtos: any[]; tecnicos: any[]; nomePadrao: string }) => {
    const novasEntradas: FormEntrada[] = [];
    const novasSaidas: FormSaida[] = [];

    for (const p of dados.produtos) {
      const esp = produtosParametrizados[p.idPro];
      const fator = esp?.fatorConversao || 1;
      const unControle = esp?.unControle || 'UN';
      const unEstoque = esp?.unEstoque || 'UN';
      const tipoBaixa = esp?.tipoUnBaixa || 'E';

      let custo = p.custoTotalUnit || 0;
      if (!custo) {
        try {
          const c = await fetchCustoProduto(p.idPro);
          custo = c.custo || 0;
        } catch {}
      }

      if (p.tipoMov === 'E') {
        novasEntradas.push({
          idPro: p.idPro,
          descricao: p.descricao,
          qtdadeUnControle: p.qtdadeUnControle,
          qtdadeUnEstoque: p.qtdadeUnControle * fator,
          unControle,
          unEstoque,
          fatorConversao: fator,
          tipoUnBaixa: tipoBaixa,
          custoTotalUnit: custo,
          custoTotalTotal: p.qtdadeUnControle * custo,
          lote: '',
          idCc: centrosCusto[0]?.id || 0,
        });
      } else {
        novasSaidas.push({
          idPro: p.idPro,
          descricao: p.descricao,
          qtdadeUnControle: p.qtdadeUnControle,
          qtdadeUnEstoque: p.qtdadeUnControle * fator,
          unControle,
          unEstoque,
          fatorConversao: fator,
          tipoUnBaixa: tipoBaixa,
          quebraUnControle: 0,
          quebraUnEstoque: 0,
          custoTotalUnit: custo,
          custoTotalTotal: p.qtdadeUnControle * custo,
          lote: '',
          idCc: centrosCusto[0]?.id || 0,
        });
      }
    }

    const novosTecnicos: FormTecnico[] = dados.tecnicos.map((t) => ({
      idTecnico: t.idTecnico,
      nomeTecnico: t.nomeTecnico,
      data: op.data || hojeISO(),
      horaIni: t.horaIni || '08:00',
      horaFim: t.horaFim || '09:00',
      horasTotais: t.horasTotais || 1,
      valorHora: t.valorHora || 0,
      valorTotal: t.valorTotal || 0,
      idCc: centrosCusto[0]?.id || 0,
    }));

    setEntradas(novasEntradas);
    setSaidas(novasSaidas);
    setTecnicos(novosTecnicos);
    setSucesso(`Receita "${dados.nomePadrao}" carregada com sucesso!`);
    setTimeout(() => setSucesso(null), 3000);
  };

  // Importar DAV
  const handleImportarDav = (itensDav: ItemDav[]) => {
    const novos: FormEntrada[] = itensDav.map((it) => {
      const esp = produtosParametrizados[it.idProduto];
      const fator = esp?.fatorConversao || 1;
      return {
        idPro: it.idProduto,
        descricao: it.descricao,
        qtdadeUnControle: it.qtdTotal,
        qtdadeUnEstoque: it.qtdTotal * fator,
        unControle: esp?.unControle || it.unvenda || 'UN',
        unEstoque: esp?.unEstoque || it.unvenda || 'UN',
        fatorConversao: fator,
        tipoUnBaixa: esp?.tipoUnBaixa || 'E',
        custoTotalUnit: 0,
        custoTotalTotal: 0,
        lote: '',
        idCc: centrosCusto[0]?.id || 0,
      };
    });
    setEntradas((prev) => [...prev, ...novos]);
    setSucesso(`${itensDav.length} produto(s) importado(s) do DAV para Entradas!`);
    setTimeout(() => setSucesso(null), 3000);
  };

  // Importar OS
  const handleImportarOs = async (produtosOs: ProdutoOs[], idOs: number) => {
    const novos: FormSaida[] = await Promise.all(
      produtosOs.map(async (p) => {
        const esp = produtosParametrizados[p.idPro];
        const fator = esp?.fatorConversao || 1;
        let custo = 0;
        try {
          const c = await fetchCustoProduto(p.idPro);
          custo = c.custo || 0;
        } catch {}
        return {
          idPro: p.idPro,
          descricao: p.descricao,
          qtdadeUnControle: p.qtdade,
          qtdadeUnEstoque: p.qtdade * fator,
          unControle: esp?.unControle || 'UN',
          unEstoque: esp?.unEstoque || 'UN',
          fatorConversao: fator,
          tipoUnBaixa: esp?.tipoUnBaixa || 'E',
          quebraUnControle: 0,
          quebraUnEstoque: 0,
          custoTotalUnit: custo,
          custoTotalTotal: Math.round(p.qtdade * custo * 100) / 100,
          lote: '',
          idCc: centrosCusto[0]?.id || 0,
        };
      }),
    );
    setSaidas((prev) => [...prev, ...novos]);
    setOp((prev) => ({
      ...prev,
      doc: prev.doc || `OS-${idOs}`,
      obs: (prev.obs ? prev.obs + '\n' : '') + `Capturado da OS #${idOs}`,
    }));
    setSucesso(`${produtosOs.length} insumo(s) importado(s) da OS #${idOs}!`);
    setTimeout(() => setSucesso(null), 3000);
  };

  // Validação e Conclusão da Produção
  const handleConcluirProducao = async () => {
    setErro(null);

    if (entradas.length === 0) {
      setErro('Informe pelo menos 1 produto de Entrada (Produto Acabado).');
      return;
    }

    for (const e of entradas) {
      if (e.qtdadeUnControle <= 0) {
        setErro(`A quantidade de entrada para "${e.descricao}" deve ser maior que zero.`);
        return;
      }
    }

    for (const s of saidas) {
      if (s.qtdadeUnControle <= 0) {
        setErro(`A quantidade de insumo para "${s.descricao}" deve ser maior que zero.`);
        return;
      }
    }

    // Validação de horários de técnicos: checar sobreposição para o mesmo técnico
    for (let i = 0; i < tecnicos.length; i++) {
      for (let j = i + 1; j < tecnicos.length; j++) {
        const t1 = tecnicos[i];
        const t2 = tecnicos[j];
        if (t1.idTecnico === t2.idTecnico && t1.data === t2.data) {
          if (
            (t1.horaIni >= t2.horaIni && t1.horaIni < t2.horaFim) ||
            (t1.horaFim > t2.horaIni && t1.horaFim <= t2.horaFim) ||
            (t1.horaIni <= t2.horaIni && t1.horaFim >= t2.horaFim)
          ) {
            setErro(
              `Conflito de horários para o técnico ${t1.nomeTecnico} na data ${t1.data}: ${t1.horaIni}-${t1.horaFim} conflita com ${t2.horaIni}-${t2.horaFim}.`,
            );
            return;
          }
        }
      }
    }

    try {
      setSalvando(true);
      const res = await criarProducao({
        op,
        entradas,
        saidas,
        tecnicos,
      });

      onProducaoCriada(res.idOp);
    } catch (err: any) {
      setErro(err.message || 'Erro ao gravar ordem de produção.');
    } finally {
      setSalvando(false);
    }
  };

  const confirmarRemocao = () => {
    if (!removendo) return;
    const { tipo, idx } = removendo;
    if (tipo === 'E') setEntradas((prev) => prev.filter((_, i) => i !== idx));
    else if (tipo === 'S') setSaidas((prev) => prev.filter((_, i) => i !== idx));
    else setTecnicos((prev) => prev.filter((_, i) => i !== idx));
    setRemovendo(null);
  };

  const campo = `${INPUT_CLASS} ${FIELD_WRAPPER_CLASS}`;
  /** Célula com campo editável: menos respiro vertical que a célula de texto */
  const TD_CAMPO = `${TD} !py-1`;

  const tituloSecao = (
    icone: React.ReactNode,
    titulo: string,
    contagem: string,
    resumo: React.ReactNode,
    fundo = 'bg-stone-50 dark:bg-stone-950/60',
  ) => (
    <div className={`px-4 py-2.5 border-y border-stone-200 dark:border-stone-800 ${fundo} flex flex-wrap items-center justify-between gap-3`}>
      <div className="flex items-center gap-2">
        {icone}
        <h3 className="text-xs font-bold text-stone-800 dark:text-stone-100 uppercase tracking-wider">{titulo}</h3>
        <span className="text-[11px] text-stone-400 font-mono">{contagem}</span>
      </div>
      <div className="text-[11px] text-stone-500">{resumo}</div>
    </div>
  );

  const botaoLote = (lote: string, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center justify-between px-2 py-1.5 bg-stone-50 dark:bg-stone-800/80 text-stone-700 dark:text-stone-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors text-left font-mono text-[11px] cursor-pointer"
    >
      <span className="truncate">{lote || '+ Informar lote'}</span>
      <Tag size={12} className="text-amber-500 shrink-0 ml-1" />
    </button>
  );

  const buscaProduto = (
    valor: string,
    setValor: (v: string) => void,
    buscando: boolean,
    sugestoes: ProdutoPrincipal[],
    onSelecionar: (p: ProdutoPrincipal) => void,
    placeholder: string,
  ) => (
    <div className="px-4 py-2.5 border-b border-stone-200 dark:border-stone-800">
      <div className="relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 pointer-events-none" />
        <input
          type="text"
          placeholder={placeholder}
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          className={`${campo} pl-9`}
        />
        {buscando && (
          <Loader2 className="w-4 h-4 animate-spin absolute right-2.5 top-1/2 -translate-y-1/2 text-amber-500" />
        )}

        {sugestoes.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg shadow-lg z-30 max-h-56 overflow-y-auto divide-y divide-stone-100 dark:divide-stone-800">
            {sugestoes.map((p) => (
              <div
                key={p.id}
                onClick={() => onSelecionar(p)}
                className="px-3 py-2 text-xs hover:bg-amber-500/10 cursor-pointer flex items-center justify-between transition-colors"
              >
                <div>
                  <span className="font-semibold text-stone-800 dark:text-stone-200">{p.descricao}</span>
                  <span className="text-stone-400 font-mono text-[11px] ml-2">#{p.id}</span>
                </div>
                <span className="text-[11px] font-mono text-stone-500">{p.un || 'UN'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const selectCc = (valor: number, onChange: (v: number) => void) => (
    <select value={valor} onChange={(e) => onChange(parseInt(e.target.value, 10) || 0)} className={campo}>
      <option value="0">Padrão</option>
      {centrosCusto.map((cc) => (
        <option key={cc.id} value={cc.id}>
          {cc.descricao}
        </option>
      ))}
    </select>
  );

  const linhaVazia = (colunas: number, texto: string) => (
    <tr>
      <td colSpan={colunas} className="px-3 py-8 text-center text-stone-400 border-b border-stone-100 dark:border-stone-800/60">
        {texto}
      </td>
    </tr>
  );

  const acaoRapida = 'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-stone-300 text-stone-600 hover:bg-stone-100 dark:border-stone-700 dark:text-stone-300 dark:hover:bg-stone-800 transition-colors cursor-pointer shrink-0 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div className={PAINEL}>
      {/* Barra de ferramentas: título da OP e ações rápidas */}
      <div className={BARRA}>
        <div className="flex items-center gap-2 min-w-0">
          <Factory className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="text-xs font-semibold text-stone-800 dark:text-stone-100 truncate">
            Nova Ordem de Produção & Apontamento
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button type="button" onClick={() => setModalDavAberto(true)} className={acaoRapida} title="Capturar itens de orçamento/DAV">
            <FileSpreadsheet size={13} className="text-amber-500" />
            <span>Capturar DAV</span>
          </button>
          <button type="button" onClick={() => setModalOsAberto(true)} className={acaoRapida} title="Capturar peças de Ordem de Serviço">
            <Wrench size={13} className="text-amber-500" />
            <span>Capturar OS</span>
          </button>
          <button type="button" onClick={() => setModalBuscarPadraoAberto(true)} className={acaoRapida} title="Carregar receita/ficha técnica padrão">
            <BookOpen size={13} className="text-amber-500" />
            <span>Buscar Padrão</span>
          </button>
          <button
            type="button"
            onClick={() => setModalSalvarPadraoAberto(true)}
            disabled={entradas.length === 0}
            className={acaoRapida}
            title="Salvar composição atual como receita padrão"
          >
            <BookmarkPlus size={13} className="text-amber-500" />
            <span>Salvar Padrão</span>
          </button>
          <button
            type="button"
            onClick={() => setModalCalcularAberto(true)}
            disabled={entradas.length === 0}
            className={acaoRapida}
            title="Recalcular proporção de produção"
          >
            <Calculator size={13} className="text-amber-500" />
            <span>Multiplicador</span>
          </button>
          <button
            type="button"
            onClick={handleRefazerCustos}
            disabled={saidas.length === 0 || salvando}
            className={acaoRapida}
            title="Atualizar custos das matérias-primas via tabela de custos"
          >
            <RefreshCw size={13} className={salvando ? 'animate-spin' : 'text-amber-500'} />
            <span>Refazer Custos</span>
          </button>
        </div>
      </div>

      {/* Corpo rolável */}
      <div className="flex-1 overflow-y-auto min-h-0">
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

        {/* Cabeçalho da OP */}
        <div className="px-4 py-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className={LABEL_CLASS}>Data da OP</label>
            <DateField value={op.data} onChange={(v) => setOp({ ...op, data: v })} required className={campo} />
          </div>

          <div>
            <label className={LABEL_CLASS}>Documento / Nº Controle</label>
            <input
              type="text"
              value={op.doc}
              onChange={(e) => setOp({ ...op, doc: e.target.value })}
              placeholder="Ex: OP-2026-001"
              className={campo}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Perda/Quebra Geral (Un Estoque)</label>
            <NumberField
              scale={4}
              value={op.qtdadeQuebraUnEstoque || ''}
              onChange={(v) => setOp({ ...op, qtdadeQuebraUnEstoque: Number(v) || 0 })}
              className={campo}
            />
          </div>

          <div>
            <label className={LABEL_CLASS}>Observações</label>
            <input
              type="text"
              value={op.obs}
              onChange={(e) => setOp({ ...op, obs: e.target.value })}
              placeholder="Ex: Produção lote especial"
              className={campo}
            />
          </div>
        </div>

        {/* SEÇÃO 1: ENTRADAS (Produtos Acabados Gerados) */}
        {tituloSecao(
          <ArrowDownLeft size={16} className="text-emerald-500" />,
          '1. Entradas — Produtos Acabados Gerados',
          `${entradas.length} item(ns)`,
          <>
            Custo unitário rateado:{' '}
            <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrencyBRL(custoUnitarioEntrada)}</strong>
          </>,
          'bg-emerald-50 dark:bg-emerald-950/30',
        )}
        {buscaProduto(
          buscaEntrada,
          setBuscaEntrada,
          buscandoEntrada,
          sugestoesEntrada,
          handleSelecionarEntrada,
          'Pesquisar produto acabado por código ou descrição para incluir…',
        )}
        <div className="overflow-x-auto">
          <table className={TABELA}>
            <thead>
              <tr>
                <th className={TH}>Produto Acabado</th>
                <th className={`${TH} w-32`}>Qtd Controle</th>
                <th className={`${TH} w-14`}>UN</th>
                <th className={`${TH} w-28`}>Qtd Estoque</th>
                <th className={`${TH} w-40`}>Lote / Validade</th>
                <th className={`${TH} w-44`}>Centro de Custo</th>
                <th className={`${TH} w-28`}>Custo Unit</th>
                <th className={`${TH} w-32`}>Custo Total</th>
                <th className={`${TH} w-12`} />
              </tr>
            </thead>
            <tbody>
              {entradas.length === 0
                ? linhaVazia(9, 'Nenhum produto acabado adicionado. Use o campo acima para incluir.')
                : entradas.map((item, idx) => (
                    <tr key={idx} className={TR}>
                      <td className={TD}>
                        <span className="font-semibold text-stone-900 dark:text-stone-100">{item.descricao}</span>
                        <span className="ml-1.5 text-[11px] font-mono text-stone-400">#{item.idPro}</span>
                      </td>
                      <td className={TD_CAMPO}>
                        <NumberField
                          scale={4}
                          value={item.qtdadeUnControle || ''}
                          onChange={(v) => handleAtualizarEntrada(idx, 'qtdadeUnControle', v)}
                          className={`${campo} font-semibold`}
                        />
                      </td>
                      <td className={`${TD} text-center font-mono`}>{item.unControle}</td>
                      <td className={`${TD} text-right font-mono`}>
                        {formatDecimal(item.qtdadeUnEstoque)} {item.unEstoque}
                      </td>
                      <td className={TD_CAMPO}>
                        {botaoLote(item.lote, () => {
                          setLoteAlvo({ tipo: 'E', index: idx });
                          setModalLoteAberto(true);
                        })}
                      </td>
                      <td className={TD_CAMPO}>
                        {selectCc(item.idCc, (v) => handleAtualizarEntrada(idx, 'idCc', v))}
                      </td>
                      <td className={`${TD} text-right font-mono`}>{formatCurrencyBRL(item.custoTotalUnit)}</td>
                      <td className={`${TD} text-right font-mono font-semibold text-emerald-600 dark:text-emerald-400`}>
                        {formatCurrencyBRL(item.custoTotalTotal)}
                      </td>
                      <td className={`${TD} text-center`}>
                        <button
                          type="button"
                          onClick={() => setRemovendo({ tipo: 'E', idx, nome: item.descricao })}
                          className={BTN_ACAO_EXCLUIR}
                          title="Remover produto da entrada"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* SEÇÃO 2: SAÍDAS (Insumos e Matérias-Primas Consumidas) */}
        {tituloSecao(
          <ArrowUpRight size={16} className="text-blue-500" />,
          '2. Saídas — Insumos e Matérias-Primas Consumidas',
          `${saidas.length} insumo(s)`,
          <>
            Total insumos:{' '}
            <strong className="text-blue-600 dark:text-blue-400 font-mono">{formatCurrencyBRL(totalCustoSaidas)}</strong>
          </>,
          'bg-rose-50 dark:bg-rose-950/30',
        )}
        {buscaProduto(
          buscaSaida,
          setBuscaSaida,
          buscandoSaida,
          sugestoesSaida,
          handleSelecionarSaida,
          'Pesquisar matéria-prima / insumo por código ou descrição para incluir…',
        )}
        <div className="overflow-x-auto">
          <table className={TABELA}>
            <thead>
              <tr>
                <th className={TH}>Matéria-Prima / Insumo</th>
                <th className={`${TH} w-32`}>Qtd Consumida</th>
                <th className={`${TH} w-14`}>UN</th>
                <th className={`${TH} w-28`}>Qtd Estoque</th>
                <th className={`${TH} w-32`}>Quebra/Perda</th>
                <th className={`${TH} w-40`}>Lote Insumo</th>
                <th className={`${TH} w-32`}>Custo Unit</th>
                <th className={`${TH} w-32`}>Custo Total</th>
                <th className={`${TH} w-12`} />
              </tr>
            </thead>
            <tbody>
              {saidas.length === 0
                ? linhaVazia(9, 'Nenhum insumo consumido adicionado. Use o campo acima para incluir matérias-primas.')
                : saidas.map((item, idx) => (
                    <tr key={idx} className={TR}>
                      <td className={TD}>
                        <span className="font-semibold text-stone-900 dark:text-stone-100">{item.descricao}</span>
                        <span className="ml-1.5 text-[11px] font-mono text-stone-400">#{item.idPro}</span>
                      </td>
                      <td className={TD_CAMPO}>
                        <NumberField
                          scale={4}
                          value={item.qtdadeUnControle || ''}
                          onChange={(v) => handleAtualizarSaida(idx, 'qtdadeUnControle', v)}
                          className={`${campo} font-semibold`}
                        />
                      </td>
                      <td className={`${TD} text-center font-mono`}>{item.unControle}</td>
                      <td className={`${TD} text-right font-mono`}>
                        {formatDecimal(item.qtdadeUnEstoque)} {item.unEstoque}
                      </td>
                      <td className={TD_CAMPO}>
                        <NumberField
                          scale={4}
                          value={item.quebraUnControle || ''}
                          onChange={(v) => handleAtualizarSaida(idx, 'quebraUnControle', v)}
                          className={campo}
                        />
                      </td>
                      <td className={TD_CAMPO}>
                        {botaoLote(item.lote, () => {
                          setLoteAlvo({ tipo: 'S', index: idx });
                          setModalLoteAberto(true);
                        })}
                      </td>
                      <td className={TD_CAMPO}>
                        <NumberField
                          scale={4}
                          value={item.custoTotalUnit || ''}
                          onChange={(v) => handleAtualizarSaida(idx, 'custoTotalUnit', v)}
                          className={campo}
                        />
                      </td>
                      <td className={`${TD} text-right font-mono font-semibold text-blue-600 dark:text-blue-400`}>
                        {formatCurrencyBRL(item.custoTotalTotal)}
                      </td>
                      <td className={`${TD} text-center`}>
                        <button
                          type="button"
                          onClick={() => setRemovendo({ tipo: 'S', idx, nome: item.descricao })}
                          className={BTN_ACAO_EXCLUIR}
                          title="Remover insumo da saída"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* SEÇÃO 3: TÉCNICOS E MÃO DE OBRA */}
        {tituloSecao(
          <Users size={16} className="text-purple-500" />,
          '3. Mão de Obra — Técnicos & Operadores',
          `${tecnicos.length} técnico(s)`,
          <>
            Total mão de obra:{' '}
            <strong className="text-purple-600 dark:text-purple-400 font-mono">{formatCurrencyBRL(totalCustoTecnicos)}</strong>
          </>,
          'bg-sky-50 dark:bg-sky-950/30',
        )}
        <div className="px-4 py-2.5 border-b border-stone-200 dark:border-stone-800 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-semibold text-stone-500">Adicionar técnico:</span>
          {tecnicosCadastrados.map((tec) => (
            <button
              key={tec.id}
              type="button"
              onClick={() => handleAdicionarTecnico(tec)}
              className="px-2.5 py-1 text-xs font-medium rounded-lg border border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:border-amber-400 hover:text-amber-600 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus size={12} />
              <span>{tec.nome}</span>
              <span className="text-[10px] text-stone-400">({formatCurrencyBRL(tec.valorHora)}/h)</span>
            </button>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className={TABELA}>
            <thead>
              <tr>
                <th className={TH}>Técnico / Operador</th>
                <th className={`${TH} w-40`}>Data de Execução</th>
                <th className={`${TH} w-28`}>Hora Início</th>
                <th className={`${TH} w-28`}>Hora Fim</th>
                <th className={`${TH} w-24`}>Horas Totais</th>
                <th className={`${TH} w-32`}>Valor/Hora</th>
                <th className={`${TH} w-32`}>Valor Total</th>
                <th className={`${TH} w-44`}>Centro de Custo</th>
                <th className={`${TH} w-12`} />
              </tr>
            </thead>
            <tbody>
              {tecnicos.length === 0
                ? linhaVazia(9, 'Nenhum técnico apontado nesta OP. Clique nos botões acima para vincular mão de obra.')
                : tecnicos.map((item, idx) => (
                    <tr key={idx} className={TR}>
                      <td className={`${TD} font-semibold text-stone-900 dark:text-stone-100`}>{item.nomeTecnico}</td>
                      <td className={TD_CAMPO}>
                        <DateField
                          value={item.data}
                          onChange={(v) => handleAtualizarTecnico(idx, 'data', v)}
                          className={campo}
                        />
                      </td>
                      <td className={TD_CAMPO}>
                        <input
                          type="time"
                          value={item.horaIni}
                          onChange={(e) => handleAtualizarTecnico(idx, 'horaIni', e.target.value)}
                          className={`${campo} text-center font-mono`}
                        />
                      </td>
                      <td className={TD_CAMPO}>
                        <input
                          type="time"
                          value={item.horaFim}
                          onChange={(e) => handleAtualizarTecnico(idx, 'horaFim', e.target.value)}
                          className={`${campo} text-center font-mono`}
                        />
                      </td>
                      <td className={`${TD} text-right font-mono`}>{formatDecimal(item.horasTotais)} h</td>
                      <td className={TD_CAMPO}>
                        <NumberField
                          scale={2}
                          value={item.valorHora || ''}
                          onChange={(v) => handleAtualizarTecnico(idx, 'valorHora', v)}
                          className={campo}
                        />
                      </td>
                      <td className={`${TD} text-right font-mono font-semibold text-stone-900 dark:text-stone-100`}>
                        {formatCurrencyBRL(item.valorTotal)}
                      </td>
                      <td className={TD_CAMPO}>
                        {selectCc(item.idCc, (v) => handleAtualizarTecnico(idx, 'idCc', v))}
                      </td>
                      <td className={`${TD} text-center`}>
                        <button
                          type="button"
                          onClick={() => setRemovendo({ tipo: 'T', idx, nome: item.nomeTecnico })}
                          className={BTN_ACAO_EXCLUIR}
                          title="Remover técnico"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Barra de totais e ações, fixa ao pé da tela */}
      <div className="px-4 py-3 border-t border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-950/40 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-[11px] text-stone-500">
          <span>
            Insumos:{' '}
            <strong className="font-mono text-blue-600 dark:text-blue-400">{formatCurrencyBRL(totalCustoSaidas)}</strong>
          </span>
          <span>
            Mão de obra:{' '}
            <strong className="font-mono text-purple-600 dark:text-purple-400">{formatCurrencyBRL(totalCustoTecnicos)}</strong>
          </span>
          <span>
            Custo geral OP:{' '}
            <strong className="font-mono text-amber-700 dark:text-amber-300">{formatCurrencyBRL(custoGeralProducao)}</strong>
          </span>
          <span>
            Custo médio unitário:{' '}
            <strong className="font-mono text-emerald-600 dark:text-emerald-400">{formatCurrencyBRL(custoUnitarioEntrada)}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2.5 justify-end shrink-0">
          <button type="button" onClick={onVoltar} disabled={salvando} className={BTN_SECUNDARIO}>
            <X className="w-3.5 h-3.5" />
            <span>Cancelar</span>
          </button>
          <button
            type="button"
            onClick={handleConcluirProducao}
            disabled={salvando || entradas.length === 0}
            className={BTN_PRIMARIO}
          >
            {salvando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>{salvando ? 'Gravando e atualizando estoque…' : 'Concluir e Salvar OP'}</span>
          </button>
        </div>
      </div>

      {removendo && (
        <ConfirmModal
          titulo={removendo.tipo === 'T' ? 'Remover técnico' : 'Remover item'}
          mensagem={
            <>
              Remover <strong>{removendo.nome}</strong> desta ordem de produção?
            </>
          }
          textoConfirmar="Remover"
          onConfirmar={confirmarRemocao}
          onCancelar={() => setRemovendo(null)}
        />
      )}

      {/* Modais Anexados */}
      {modalLoteAberto && loteAlvo && (
        <LoteModal
          isOpen={modalLoteAberto}
          onClose={() => {
            setModalLoteAberto(false);
            setLoteAlvo(null);
          }}
          idPro={
            loteAlvo.tipo === 'E'
              ? entradas[loteAlvo.index]?.idPro
              : saidas[loteAlvo.index]?.idPro
          }
          descricaoProduto={
            loteAlvo.tipo === 'E'
              ? entradas[loteAlvo.index]?.descricao
              : saidas[loteAlvo.index]?.descricao
          }
          loteAtual={
            loteAlvo.tipo === 'E'
              ? entradas[loteAlvo.index]?.lote
              : saidas[loteAlvo.index]?.lote
          }
          onSelecionarLote={(lote, validade) => {
            if (loteAlvo.tipo === 'E') {
              handleAtualizarEntrada(loteAlvo.index, 'lote', lote);
              if (validade) handleAtualizarEntrada(loteAlvo.index, 'loteValidade', validade);
            } else {
              handleAtualizarSaida(loteAlvo.index, 'lote', lote);
            }
          }}
        />
      )}

      {modalCalcularAberto && (
        <CalcularModal
          isOpen={modalCalcularAberto}
          onClose={() => setModalCalcularAberto(false)}
          qtdAtualEntrada={entradas[0]?.qtdadeUnControle || 1}
          onAplicarFator={handleAplicarFator}
        />
      )}

      {modalBuscarPadraoAberto && (
        <BuscarPadraoModal
          isOpen={modalBuscarPadraoAberto}
          onClose={() => setModalBuscarPadraoAberto(false)}
          onCarregarPadrao={handleCarregarPadrao}
        />
      )}

      {modalSalvarPadraoAberto && (
        <SalvarPadraoModal
          isOpen={modalSalvarPadraoAberto}
          onClose={() => setModalSalvarPadraoAberto(false)}
          entradas={entradas}
          saidas={saidas}
          tecnicos={tecnicos}
          onSucesso={(nome) => {
            setSucesso(`Modelo padrão "${nome}" cadastrado com sucesso!`);
            setTimeout(() => setSucesso(null), 3000);
          }}
        />
      )}

      {modalDavAberto && (
        <CapturaDavModal
          isOpen={modalDavAberto}
          onClose={() => setModalDavAberto(false)}
          onImportarItens={handleImportarDav}
        />
      )}

      {modalOsAberto && (
        <CapturaOsModal
          isOpen={modalOsAberto}
          onClose={() => setModalOsAberto(false)}
          onImportarProdutosOs={handleImportarOs}
        />
      )}
    </div>
  );
};

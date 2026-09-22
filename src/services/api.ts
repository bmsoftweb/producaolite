import {
  DbConnectionStatus,
  Usuario,
  Empresa,
  ServidorInfo,
  ItemProducao,
  TecnicoOP,
  ProdutoEsp,
  Tecnico,
  CentroCusto,
  Lote,
  ProdutoPrincipal,
  PadraoProd,
  ItemDav,
  ItemOs,
  ProdutoOs,
  FormOP,
  FormEntrada,
  FormSaida,
  FormTecnico,
} from '../types';

/**
 * O token de sessão acompanha toda requisição no header Authorization.
 * A chave da bmAPI fica só no servidor.
 */
let tokenAtual: string | null = null;
let aoExpirar: ((motivo: string) => void) | null = null;

export function setTokenSessao(token: string | null) {
  tokenAtual = token;
}

/** Chamado quando o servidor recusa a sessão (401), para voltar ao login */
export function onSessaoExpirada(fn: (motivo: string) => void) {
  aoExpirar = fn;
}

function headers(extra: Record<string, string> = {}): Record<string, string> {
  const h: Record<string, string> = { ...extra };
  if (tokenAtual) h.Authorization = `Bearer ${tokenAtual}`;
  return h;
}

async function parseOrThrow(res: Response): Promise<any> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.error || `Falha na requisição (HTTP ${res.status}).`;
    if (res.status === 401 && tokenAtual && aoExpirar) aoExpirar(msg);
    throw new Error(msg);
  }
  return data;
}

async function get<T = any>(url: string): Promise<T> {
  return parseOrThrow(await fetch(url, { headers: headers() }));
}

async function send<T = any>(method: string, url: string, body?: unknown): Promise<T> {
  return parseOrThrow(
    await fetch(url, {
      method,
      headers: headers({ 'Content-Type': 'application/json' }),
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  );
}

// ------------------------------------------------------------
// Autenticação
// ------------------------------------------------------------
export async function login(
  servidor: number,
  email: string,
  senha: string,
): Promise<{ token: string; usuario: Usuario; empresa: Empresa; servidor: ServidorInfo }> {
  const res = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ servidor, email, senha }),
  });
  return parseOrThrow(res);
}

export async function consultarServidor(numero: number): Promise<{ identificacao: string; connected: boolean; error?: string }> {
  return get(`/api/servidores/${numero}`);
}

export async function validarSessao(): Promise<{ usuario: Usuario; empresa: Empresa; servidor: ServidorInfo }> {
  return get('/api/auth/sessao');
}

export async function salvarMeusDados(dados: { email: string; paginaInicial: string; senha?: string; senhaConfirma?: string }): Promise<void> {
  await send('PUT', '/api/auth/meus-dados', dados);
}

// ------------------------------------------------------------
// Status da bmAPI
// ------------------------------------------------------------
export async function fetchDbStatus(): Promise<DbConnectionStatus> {
  return get('/api/db/status');
}

// ------------------------------------------------------------
// Produção – Listagem e exclusão
// ------------------------------------------------------------
export async function fetchProducao(params: {
  d1: string;
  d2: string;
  tipo_mov?: string;
  busca?: string;
}): Promise<ItemProducao[]> {
  const q = new URLSearchParams();
  q.set('d1', params.d1);
  q.set('d2', params.d2);
  if (params.tipo_mov) q.set('tipo_mov', params.tipo_mov);
  if (params.busca) q.set('busca', params.busca);
  return get(`/api/producao?${q.toString()}`);
}

export async function fetchTecnicosOP(idProducao: number): Promise<TecnicoOP[]> {
  return get(`/api/producao/${idProducao}/tecnicos`);
}

export async function excluirProducao(id: number): Promise<void> {
  await send('DELETE', `/api/producao/${id}`);
}

// ------------------------------------------------------------
// Produção – Criação
// ------------------------------------------------------------
export async function criarProducao(dados: {
  op: FormOP;
  entradas: FormEntrada[];
  saidas: FormSaida[];
  tecnicos: FormTecnico[];
}): Promise<{ idOp: number }> {
  return send('POST', '/api/producao', dados);
}

// ------------------------------------------------------------
// Parâmetros de Produtos (ESP_WET_PRODUTOS)
// ------------------------------------------------------------
export async function fetchProdutosEsp(): Promise<ProdutoEsp[]> {
  return get('/api/producao/produtos-esp');
}

export async function salvarProdutoEsp(dados: Partial<ProdutoEsp>): Promise<{ id: number }> {
  return send('POST', '/api/producao/produtos-esp', dados);
}

// ------------------------------------------------------------
// Busca de Produtos do ERP
// ------------------------------------------------------------
export async function buscarProduto(q: string): Promise<ProdutoPrincipal[]> {
  return get(`/api/producao/buscar-produto?q=${encodeURIComponent(q)}`);
}

// ------------------------------------------------------------
// Custo do Produto
// ------------------------------------------------------------
export async function fetchCustoProduto(idPro: number): Promise<{ custo: number }> {
  return get(`/api/producao/custo-produto/${idPro}`);
}

// ------------------------------------------------------------
// Lotes
// ------------------------------------------------------------
export async function fetchLotes(idPro: number): Promise<Lote[]> {
  return get(`/api/producao/lotes/${idPro}`);
}

export async function criarLote(dados: { idPro: number; lote: string; fabricacao?: string; validade?: string }): Promise<{ id: number }> {
  return send('POST', '/api/producao/lotes', dados);
}

// ------------------------------------------------------------
// Centros de Custo
// ------------------------------------------------------------
export async function fetchCentrosCusto(): Promise<CentroCusto[]> {
  return get('/api/producao/cc');
}

// ------------------------------------------------------------
// Técnicos
// ------------------------------------------------------------
export async function fetchTecnicos(): Promise<Tecnico[]> {
  return get('/api/producao/tecnicos');
}

export async function criarTecnico(dados: Omit<Tecnico, 'id' | 'descricaoCc'>): Promise<{ id: number }> {
  return send('POST', '/api/producao/tecnicos', dados);
}

export async function atualizarTecnico(id: number, dados: Omit<Tecnico, 'id' | 'descricaoCc'>): Promise<void> {
  await send('PUT', `/api/producao/tecnicos/${id}`, dados);
}

export async function excluirTecnico(id: number): Promise<void> {
  await send('DELETE', `/api/producao/tecnicos/${id}`);
}

// ------------------------------------------------------------
// Fichas Técnicas / Padrões
// ------------------------------------------------------------
export async function fetchPadroes(): Promise<PadraoProd[]> {
  return get('/api/producao/padroes');
}

export async function fetchPadraoItens(id: number): Promise<{ produtos: any[]; tecnicos: any[] }> {
  return get(`/api/producao/padroes/${id}/itens`);
}

export async function salvarPadrao(dados: any): Promise<{ id: number }> {
  return send('POST', '/api/producao/padroes', dados);
}

export async function excluirPadrao(id: number): Promise<void> {
  await send('DELETE', `/api/producao/padroes/${id}`);
}

// ------------------------------------------------------------
// Captura de DAV
// ------------------------------------------------------------
export async function fetchDavs(params: { d1: string; d2: string; id?: number }): Promise<ItemDav[]> {
  const q = new URLSearchParams({ d1: params.d1, d2: params.d2 });
  if (params.id) q.set('id', String(params.id));
  return get(`/api/producao/davs?${q.toString()}`);
}

// ------------------------------------------------------------
// Captura de OS
// ------------------------------------------------------------
export async function fetchOs(params: { d1: string; d2: string }): Promise<ItemOs[]> {
  return get(`/api/producao/os?d1=${params.d1}&d2=${params.d2}`);
}

export async function fetchOsProdutos(idOs: number): Promise<ProdutoOs[]> {
  return get(`/api/producao/os/${idOs}/produtos`);
}

// ------------------------------------------------------------
// Relatório
// ------------------------------------------------------------
export async function fetchRelatorio(params: { d1: string; d2: string }): Promise<{ producao: any[]; horas: any[] }> {
  return get(`/api/producao/relatorio?d1=${params.d1}&d2=${params.d2}`);
}

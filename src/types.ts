// =====================================================================
// Tipos do domínio ProducaoLite
// =====================================================================

export interface Usuario {
  id: number;
  idPessoa: number;
  idEmpresa: number;
  nome: string;
  email: string;
  nomePessoa: string;
  nivel: 'A' | 'G' | 'S' | 'V' | 'C';
  nivelDescricao: string;
  listaPreco: string;
  paginaInicial: string;
}

export interface Empresa {
  id: number;
  nome: string;
  fantasia: string;
  apelido: string;
  cnpj: string;
  cidade: string;
  uf: string;
}

export interface ServidorInfo {
  numero: number;
  identificacao: string;
}

export interface DbConnectionStatus {
  connected: boolean;
  latencyMs: number;
  servidor: number;
  identificacao: string;
  empresa?: string | null;
  error?: string;
}

export interface ConfigPublica {
  idEmpresa: number;
}

// =====================================================================
// Produção
// =====================================================================

export interface ItemProducao {
  id: number;
  idProducao: number;
  descricaoOp: string;
  dataOp: string;
  data: string;
  tipoMov: 'E' | 'S';
  idPro: number;
  descricaoProduto: string;
  tipoPro: string;
  qtdadeUnControle: number;
  unControle: string;
  qtdadeUnEstoque: number;
  unEstoque: string;
  custoTotalUnit: number;
  custoTotalTotal: number;
  lote: string;
  controle: number;
  idCc: number;
  descricaoCc: string;
  datahoraMov: string;
}

export interface TecnicoOP {
  id: number;
  idProducao: number;
  idTecnico: number;
  nomeTecnico: string;
  data: string;
  horaIni: string;
  horaFim: string;
  horasTotais: number;
  valorHora: number;
  valorTotal: number;
  idCc: number;
  descricaoCc: string;
}

export interface ProdutoEsp {
  id: number;
  idPro: number;
  descricao: string;
  unControle: string;
  unEstoque: string;
  fatorConversao: number;
  tipoUnBaixa: 'E' | 'C';
  quebra: 'S' | 'N';
  tipoPro: string;
}

export interface Tecnico {
  id: number;
  nome: string;
  valorHora: number;
  idCc: number;
  descricaoCc: string;
}

export interface CentroCusto {
  id: number;
  descricao: string;
}

export interface Lote {
  id: number;
  lote: string;
  qtd: number;
  fabricacao: string;
  validade: string;
}

export interface ProdutoPrincipal {
  id: number;
  descricao: string;
  tipo: string;
  un: string;
}

export interface PadraoProd {
  id: number;
  codigo: string;
  nome: string;
}

export interface PadraoItem {
  id: number;
  tipoMov: 'E' | 'S';
  idPro: number;
  descricao: string;
  qtdadeUnControle: number;
  custoTotalUnit: number;
}

export interface PadraoTecnico {
  id: number;
  idTecnico: number;
  nomeTecnico: string;
  horaIni: string;
  horaFim: string;
  horasTotais: number;
  valorHora: number;
  valorTotal: number;
}

// Dados usados no formulário de nova OP
export interface FormEntrada {
  idPro: number;
  descricao: string;
  qtdadeUnControle: number;
  qtdadeUnEstoque: number;
  unControle: string;
  unEstoque: string;
  fatorConversao: number;
  tipoUnBaixa: string;
  custoTotalUnit: number;
  custoTotalTotal: number;
  lote: string;
  loteValidade?: string;
  idCc: number;
  idPai?: number;
}

export interface FormSaida {
  idPro: number;
  descricao: string;
  qtdadeUnControle: number;
  qtdadeUnEstoque: number;
  unControle: string;
  unEstoque: string;
  fatorConversao: number;
  tipoUnBaixa: string;
  quebraUnControle: number;
  quebraUnEstoque: number;
  custoTotalUnit: number;
  custoTotalTotal: number;
  lote: string;
  idCc: number;
  idPai?: number;
}

export interface FormTecnico {
  idTecnico: number;
  nomeTecnico: string;
  data: string;
  horaIni: string;
  horaFim: string;
  horasTotais: number;
  valorHora: number;
  valorTotal: number;
  idCc: number;
}

export interface FormOP {
  data: string;
  doc: string;
  obs: string;
  qtdadeQuebraUnEstoque: number;
}

// DAV para captura
export interface ItemDav {
  idProduto: number;
  descricao: string;
  qtdTotal: number;
  unvenda: string;
}

// OS para captura
export interface ItemOs {
  id: number;
  data: string;
  nomeCliente: string;
  complemento: string;
  capturado: string;
}

export interface ProdutoOs {
  id: number;
  idPro: number;
  descricao: string;
  qtdade: number;
}

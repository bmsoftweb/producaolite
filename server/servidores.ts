import mysql from 'mysql2/promise';
import { config } from './config.js';

/**
 * Cadastro dos servidores da bmAPI (MySQL bmapi.servidores).
 *
 * No login o usuário informa o token (X-API-Key) do seu servidor, e é por ele que a
 * linha é encontrada: pelo número qualquer um poderia varrer o cadastro e ver a
 * identificação dos outros clientes. O token nunca é devolvido ao navegador.
 */

export interface Servidor {
  numero: number;
  identificacao: string;
  /** URL base já com protocolo e porta, ex.: http://localhost:9000 */
  baseUrl: string;
  token: string;
  /** Regras por cliente de servidores.config (chaves em maiúsculas) */
  config: Record<string, string>;
}

/** Texto "CHAVE=VALOR" por linha; linhas vazias ou com # são ignoradas */
export function lerConfig(texto: string | null): Record<string, string> {
  const cfg: Record<string, string> = {};
  for (const linha of String(texto || '').split(/\r?\n/)) {
    const i = linha.indexOf('=');
    if (i < 1 || linha.trim().startsWith('#')) continue;
    cfg[linha.slice(0, i).trim().toUpperCase()] = linha.slice(i + 1).trim();
  }
  return cfg;
}

const pool = mysql.createPool({
  host: config.mysql.host,
  port: config.mysql.port,
  user: config.mysql.user,
  password: config.mysql.password,
  database: config.mysql.database,
  waitForConnections: true,
  connectionLimit: 5,
  connectTimeout: 20000,
  enableKeepAlive: true,
});

/** Junta url e port da tabela: aceita url com ou sem protocolo, barra final ou porta */
export function montarBaseUrl(url: string, port: string): string {
  let base = String(url || '').trim().replace(/\/+$/, '');
  if (!/^https?:\/\//i.test(base)) base = `http://${base}`;
  const porta = String(port || '').trim();
  const temPorta = /^https?:\/\/[^/]+:\d+/i.test(base);
  if (porta && !temPorta) {
    const u = new URL(base);
    u.port = porta;
    base = u.toString().replace(/\/+$/, '');
  }
  return base;
}

const CACHE_MS = 60_000;
const cache = new Map<number, { servidor: Servidor | null; ate: number }>();

function montarServidor(r: any): Servidor | null {
  return r && r.url && r.token
    ? {
        numero: Number(r.id),
        identificacao: String(r.identificacao || `Servidor ${r.id}`).trim(),
        baseUrl: montarBaseUrl(r.url, r.port),
        token: String(r.token).trim(),
        config: lerConfig(r.config),
      }
    : null;
}

const SELECT = 'SELECT id, url, port, token, identificacao, config FROM servidores';

/** Pelo número (id): usado pela sessão já autenticada, nunca pelo login */
export async function buscarServidor(numero: number): Promise<Servidor | null> {
  if (!Number.isInteger(numero) || numero < 1 || numero > 999) return null;

  const emCache = cache.get(numero);
  if (emCache && emCache.ate > Date.now()) return emCache.servidor;

  const [rows] = await pool.query<any[]>(`${SELECT} WHERE id = ? LIMIT 1`, [numero]);
  const servidor = montarServidor(rows[0]);

  cache.set(numero, { servidor, ate: Date.now() + CACHE_MS });
  return servidor;
}

/** Pelo token (X-API-Key) digitado no login; sem cache, para o token revogado parar de valer na hora */
export async function buscarServidorPorToken(token: string): Promise<Servidor | null> {
  const chave = String(token || '').trim();
  if (!chave) return null;

  const [rows] = await pool.query<any[]>(`${SELECT} WHERE token = ? LIMIT 1`, [chave]);
  const servidor = montarServidor(rows[0]);

  // O cache por número é compartilhado com a sessão: aproveita a linha já lida
  if (servidor) cache.set(servidor.numero, { servidor, ate: Date.now() + CACHE_MS });
  return servidor;
}

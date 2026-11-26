import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number | string | undefined | null): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num === undefined || num === null || isNaN(num)) return 'R$ 0,00';
  
  return 'R$ ' + new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}

export function formatNumber(value: number | string | undefined | null, decimals: number = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num === undefined || num === null || isNaN(num)) {
    if (decimals === 0) return '0';
    return '0,' + '0'.repeat(decimals);
  }
  
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(num);
}

/** Número no padrão brasileiro com 2 a 4 casas (quantidades com 3 ou 4 casas não são cortadas): 50 → 50,00; 0.125 → 0,125 */
export function formatNumero(value: number | string | undefined | null): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 }).format(num == null || isNaN(num) ? 0 : num);
}

/**
 * Tipo de apresentação de uma coluna da grade que não tem tipo configurado ("texto"), pelo tipo no banco:
 * decimal vira moeda (preço, custo, valor, total) ou número. O resto continua como veio.
 */
export function tipoPelaColuna(coluna: string, tipoBanco?: string): string {
  if (!/^(decimal|numeric|float|double)/i.test(tipoBanco || '')) return 'texto';
  return /preco|custo|valor|total/i.test(coluna) ? 'moeda' : 'numero';
}

export function parseBankingInput(value: string, decimals: number = 2): number {
  const cleanValue = value.replace(/\D/g, '');
  if (cleanValue === '') return 0;
  return parseFloat(cleanValue) / Math.pow(10, decimals);
}

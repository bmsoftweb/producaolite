export function formatCurrencyBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 }).format(
    Number(value) || 0,
  );
}

/** Número com N casas decimais, sem símbolo de moeda */
export function formatDecimal(value: number | null | undefined, casas = 2): string {
  if (value === null || value === undefined) return '–';
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas }).format(
    Number(value) || 0,
  );
}

/** Quantidade: até 4 casas, sem zeros à direita */
export function formatQtd(value: number | null | undefined): string {
  if (value === null || value === undefined) return '';
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 4 }).format(Number(value) || 0);
}

export function formatDateBR(dateStr: string | null | undefined): string {
  if (!dateStr) return '–';
  const parts = String(dateStr).split('T')[0].split(' ')[0].split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return String(dateStr);
}

export function formatDateTimeBR(dateStr: string | null | undefined): string {
  if (!dateStr) return '–';
  const date = new Date(String(dateStr).replace(' ', 'T'));
  if (isNaN(date.getTime())) return String(dateStr);
  return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export function toInputDate(value: any): string {
  if (!value) return '';
  return String(value).replace(' ', 'T').slice(0, 10);
}

export function hojeISO(deslocamento = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + deslocamento);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Diferença entre duas horas no formato HH:MM em horas decimais */
export function calcHoras(ini: string, fim: string): number {
  const [h1, m1] = (ini || '00:00').split(':').map(Number);
  const [h2, m2] = (fim || '00:00').split(':').map(Number);
  const totalMin = (h2 * 60 + m2) - (h1 * 60 + m1);
  return Math.max(0, Math.round(totalMin * 100 / 60) / 100);
}

/**
 * Preferências de listas e formulários (larguras, ordem, grade, olho das Ações).
 * Mesma interface do erp-compras, mas aqui só valem enquanto a aba está aberta.
 *
 * ponytail: guardado em memória; quando WEB_USUARIOS.CONFIG_LISTAS existir na base,
 * trocar os dois corpos por fetch('/api/user/config-listas') GET/PUT, como no erp-compras.
 */
let memoria: Record<string, any> = {};

export function lerConfigListas(): Promise<Record<string, any>> {
  return Promise.resolve(memoria);
}

export async function gravarConfigLista(chave: string, valor: unknown) {
  memoria = { ...memoria, [chave]: valor };
}

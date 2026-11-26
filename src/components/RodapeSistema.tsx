import React from 'react';
import { Database } from 'lucide-react';
import { DbConnectionStatus, Empresa, ServidorInfo, Usuario } from '../types';

/**
 * Barra de status do pé da tela, como no erp-compras: versão, servidor da bmAPI
 * (com a latência da última checagem), filial e usuário.
 */
export const RodapeSistema: React.FC<{
  empresa: Empresa;
  servidor: ServidorInfo;
  usuario: Usuario;
  dbStatus: DbConnectionStatus | null;
}> = ({ empresa, servidor, usuario, dbStatus }) => (
  <footer className="print:hidden h-6 shrink-0 px-4 flex items-center gap-4 overflow-hidden whitespace-nowrap border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 text-[10px] text-stone-500 dark:text-stone-400">
    <span>Versão {__APP_VERSION__}</span>
    <span
      className="flex items-center gap-1.5"
      title={dbStatus?.connected ? `${servidor.identificacao || 'bmAPI'} • ${dbStatus.latencyMs}ms` : dbStatus?.error || 'Verificando a conexão com o servidor...'}
    >
      <Database className={`w-3 h-3 ${dbStatus?.connected ? 'text-emerald-500' : 'text-rose-500 animate-pulse'}`} />
      Servidor #{servidor.numero}
      <span className={`font-mono font-semibold ${dbStatus?.connected ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
        {dbStatus?.connected ? `${dbStatus.latencyMs}ms` : 'offline'}
      </span>
    </span>
    <span className="truncate">Filial: {empresa.fantasia || empresa.nome}</span>
    <span className="truncate">Usuário: {usuario.nome}</span>
  </footer>
);

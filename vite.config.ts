import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';

const { version } = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'package.json'), 'utf8'));

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    // Versão mostrada na barra de status (RodapeSistema)
    define: { __APP_VERSION__: JSON.stringify(version) },
    resolve: {
      alias: {
        // O design system veio do erp-compras, que tem components/ e lib/ na raiz;
        // aqui eles moram em src/, então os caminhos @/... apontam para lá.
        '@/components': path.resolve(__dirname, 'src/components'),
        '@/lib': path.resolve(__dirname, 'src/lib'),
        '@/context': path.resolve(__dirname, 'src/context'),
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR === 'true' ? false : { port: 24682 },
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

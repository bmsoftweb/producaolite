import React, { createContext, useContext, useState } from 'react';
import { applyTheme, getInitialTheme, ThemeMode } from '../utils/theme';

/**
 * Tema claro/escuro, no formato que a Sidebar do erp-compras usa (theme/toggleTheme).
 * Quem liga/desliga a classe .dark continua sendo o utils/theme.ts do projeto.
 */
interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    const inicial = getInitialTheme();
    applyTheme(inicial);
    return inicial;
  });

  const toggleTheme = () => {
    setTheme((atual) => {
      const novo: ThemeMode = atual === 'light' ? 'dark' : 'light';
      applyTheme(novo);
      return novo;
    });
  };

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme precisa estar dentro do ThemeProvider');
  return ctx;
}

import React, { useState, useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { DbConnectionStatus, Usuario } from './types';
import {
  lerSessao,
  salvarSessao,
  limparSessao,
  atualizarSessao,
  SessaoSalva,
} from './utils/session';
import { setTokenSessao, onSessaoExpirada, fetchDbStatus } from './services/api';
import { LoginView } from './components/LoginView';
import { LayoutApp } from './components/LayoutApp';
import { Dashboard } from './components/Dashboard';
import { ProducaoView } from './components/ProducaoView';
import { PadroesView } from './components/PadroesView';
import { ProdutosProducaoView } from './components/ProdutosProducaoView';
import { TecnicosView } from './components/TecnicosView';
import { RelatoriosView } from './components/RelatoriosView';

/** Telas do menu; a página inicial do usuário (WEB_USUARIOS.PAGINA_INICIAL) usa estas mesmas chaves */
const TELAS = ['dashboard', 'producao', 'padroes', 'produtos', 'tecnicos', 'relatorios'];

export const App: React.FC = () => {
  // O token precisa valer já na primeira renderização: os efeitos das telas rodam antes
  // do efeito do App e, sem ele, a primeira consulta volta 401 e derruba a sessão.
  const [sessao, setSessao] = useState<SessaoSalva | null>(() => {
    const salva = lerSessao();
    setTokenSessao(salva?.token ?? null);
    return salva;
  });
  const [dbStatus, setDbStatus] = useState<DbConnectionStatus | null>(null);

  useEffect(() => {
    setTokenSessao(sessao?.token ?? null);
  }, [sessao?.token]);

  // Handler de expiração de token (401)
  useEffect(() => {
    onSessaoExpirada((motivo) => {
      console.warn('Sessão expirada:', motivo);
      limparSessao();
      setSessao(null);
      setTokenSessao(null);
    });
  }, []);

  // Monitora status da conexão com a bmAPI
  const atualizarStatus = async () => {
    if (!sessao?.token) return;
    try {
      setDbStatus(await fetchDbStatus());
    } catch {
      setDbStatus(null);
    }
  };

  useEffect(() => {
    if (!sessao?.token) return;
    atualizarStatus();
    const interval = setInterval(atualizarStatus, 30000);
    return () => clearInterval(interval);
  }, [sessao?.token]);

  // Se não estiver autenticado, exibe a tela de login
  if (!sessao || !sessao.token) {
    return (
      <LoginView
        onLoginSuccess={(dados) => {
          const novaSessao: SessaoSalva = {
            token: dados.token,
            usuario: dados.usuario,
            empresa: dados.empresa,
            servidor: dados.servidor,
          };
          salvarSessao(novaSessao, dados.lembrar);
          setTokenSessao(dados.token);
          setSessao(novaSessao);
        }}
      />
    );
  }

  const inicial = TELAS.includes(sessao.usuario.paginaInicial) ? sessao.usuario.paginaInicial : 'dashboard';

  const sair = () => {
    limparSessao();
    setSessao(null);
    setTokenSessao(null);
  };

  const trocarUsuario = (dados: Partial<Usuario>) => {
    const usuario = { ...sessao.usuario, ...dados };
    atualizarSessao({ usuario });
    setSessao({ ...sessao, usuario });
  };

  return (
    <Routes>
      <Route
        element={
          <LayoutApp
            usuario={sessao.usuario}
            empresa={sessao.empresa}
            servidor={sessao.servidor}
            dbStatus={dbStatus}
            onLogout={sair}
            onUsuarioAtualizado={trocarUsuario}
          />
        }
      >
        <Route
          path="/dashboard"
          element={
            /* Único painel com respiro nas bordas; as telas de lista ocupam a área toda */
            <div className="flex-1 overflow-y-auto min-h-0 px-4 sm:px-6 lg:px-8 py-6">
              <Dashboard
                usuario={sessao.usuario}
                empresa={sessao.empresa}
                servidor={sessao.servidor}
                dbStatus={dbStatus}
              />
            </div>
          }
        />
        <Route path="/producao" element={<ProducaoView />} />
        <Route path="/padroes" element={<PadroesView />} />
        <Route path="/produtos" element={<ProdutosProducaoView />} />
        <Route path="/tecnicos" element={<TecnicosView />} />
        <Route path="/relatorios" element={<RelatoriosView empresa={sessao.empresa} />} />
      </Route>
      <Route path="*" element={<Navigate to={`/${inicial}`} replace />} />
    </Routes>
  );
};

export default App;

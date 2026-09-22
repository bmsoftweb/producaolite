import React, { useState, useEffect } from 'react';
import { Usuario, Empresa, ServidorInfo, DbConnectionStatus } from './types';
import {
  lerSessao,
  salvarSessao,
  limparSessao,
  atualizarSessao,
  SessaoSalva,
} from './utils/session';
import { setTokenSessao, onSessaoExpirada, fetchDbStatus } from './services/api';
import { LoginView } from './components/LoginView';
import { Sidebar, NavTab } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { ProducaoView } from './components/ProducaoView';
import { PadroesView } from './components/PadroesView';
import { ProdutosProducaoView } from './components/ProdutosProducaoView';
import { TecnicosView } from './components/TecnicosView';
import { RelatoriosView } from './components/RelatoriosView';
import { MeusDadosModal } from './components/MeusDadosModal';

export const App: React.FC = () => {
  const [sessao, setSessao] = useState<SessaoSalva | null>(() => lerSessao());
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [sidebarMobileOpen, setSidebarMobileOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState<DbConnectionStatus | null>(null);
  const [meusDadosAberto, setMeusDadosAberto] = useState(false);

  // Inicializa token da API
  useEffect(() => {
    if (sessao?.token) {
      setTokenSessao(sessao.token);
      if (sessao.usuario?.paginaInicial) {
        const pag = sessao.usuario.paginaInicial as NavTab;
        if (['dashboard', 'producao', 'padroes', 'produtos', 'tecnicos', 'relatorios'].includes(pag)) {
          setActiveTab(pag);
        }
      }
    } else {
      setTokenSessao(null);
    }
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
      const status = await fetchDbStatus();
      setDbStatus(status);
    } catch {
      setDbStatus(null);
    }
  };

  useEffect(() => {
    if (sessao?.token) {
      atualizarStatus();
      const interval = setInterval(atualizarStatus, 30000);
      return () => clearInterval(interval);
    }
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
          if (dados.usuario.paginaInicial) {
            setActiveTab(dados.usuario.paginaInicial as NavTab);
          }
        }}
      />
    );
  }

  const titulosPorAba: Record<NavTab, { titulo: string; subtitulo: string }> = {
    dashboard: {
      titulo: 'Painel Geral de Produção',
      subtitulo: 'Visão consolidada de ordens, matérias-primas e equipe técnica',
    },
    producao: {
      titulo: 'Ordens de Produção & Apontamentos',
      subtitulo: 'Lançamento de produtos fabricados, insumos e custos',
    },
    padroes: {
      titulo: 'Fichas Técnicas / Padrões',
      subtitulo: 'Modelos e receitas reutilizáveis de produção',
    },
    produtos: {
      titulo: 'Parâmetros de Produtos',
      subtitulo: 'Fatores de conversão e regras de estoque (ESP_WET_PRODUTOS)',
    },
    tecnicos: {
      titulo: 'Técnicos & Mão de Obra',
      subtitulo: 'Cadastro de operadores, taxas e centros de custo',
    },
    relatorios: {
      titulo: 'Relatórios de Produção',
      subtitulo: 'Demonstrativo analítico de custos e horas técnicas',
    },
  };

  const { titulo } = titulosPorAba[activeTab] || titulosPorAba.dashboard;

  return (
    <div className="h-screen overflow-hidden print:h-auto print:overflow-visible bg-stone-100/70 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex font-sans antialiased selection:bg-amber-500 selection:text-white">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        usuario={sessao.usuario}
        onOpenMeusDados={() => setMeusDadosAberto(true)}
        onLogout={() => {
          limparSessao();
          setSessao(null);
          setTokenSessao(null);
        }}
        isOpenMobile={sidebarMobileOpen}
        onCloseMobile={() => setSidebarMobileOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 min-h-0">
        <Header
          titulo={titulo}
          empresa={sessao.empresa}
          servidor={sessao.servidor}
          dbStatus={dbStatus}
          onOpenMobileSidebar={() => setSidebarMobileOpen(true)}
          onRefreshDbStatus={atualizarStatus}
        />

        {/* Telas de trabalho ocupam toda a área útil, sem container; o painel rola com rodapé */}
        {activeTab === 'dashboard' ? (
          <main className="flex-1 overflow-y-auto min-h-0 w-full flex flex-col">
            <div className="flex-1 px-4 sm:px-6 lg:px-8 py-6">
              <Dashboard
                usuario={sessao.usuario}
                empresa={sessao.empresa}
                servidor={sessao.servidor}
                dbStatus={dbStatus}
                onNavigate={setActiveTab}
              />
            </div>

            <footer className="bg-white dark:bg-stone-900 border-t border-stone-200 dark:border-stone-800 text-stone-500 text-xs py-4 px-4">
              <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
                <div>
                  <strong>Produção<span className="text-amber-500">Lite</span></strong> • Ordens de Produção e Custos
                </div>
                <div className="flex items-center gap-4">
                  <span>Servidor #{sessao.servidor.numero}</span>
                  <span>•</span>
                  <span>Integração via bmAPI</span>
                  <span>•</span>
                  <span>Controle de Lotes e Insumos</span>
                </div>
              </div>
            </footer>
          </main>
        ) : (
          <main className="flex-1 flex flex-col min-h-0 w-full print:block">
            {activeTab === 'producao' && <ProducaoView />}
            {activeTab === 'padroes' && <PadroesView />}
            {activeTab === 'produtos' && <ProdutosProducaoView />}
            {activeTab === 'tecnicos' && <TecnicosView />}
            {activeTab === 'relatorios' && <RelatoriosView empresa={sessao.empresa} />}
          </main>
        )}
      </div>

      {/* Modal Meus Dados */}
      {meusDadosAberto && (
        <MeusDadosModal
          isOpen={meusDadosAberto}
          onClose={() => setMeusDadosAberto(false)}
          usuario={sessao.usuario}
          onUsuarioAtualizado={(novo) => {
            const userAtualizado = { ...sessao.usuario, ...novo };
            atualizarSessao({ usuario: userAtualizado });
            setSessao({ ...sessao, usuario: userAtualizado });
          }}
        />
      )}
    </div>
  );
};

export default App;

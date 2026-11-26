import React, { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle2, Eye, EyeOff, Factory, KeyRound, Loader2, Lock, Mail, Moon, Sun } from 'lucide-react';
import { login, consultarServidor } from '../services/api';
import { Usuario, Empresa, ServidorInfo } from '../types';
import { lerLembrete, salvarLembrete, limparLembrete } from '../utils/session';
import { useTheme } from '../context/ThemeContext';
import { AvisoErro } from '@/components/AvisoErro';
import { Toggle } from '@/components/Toggle';

/** Tela de entrada no modelo do erp-compras: painel da marca à esquerda, formulário à direita */

const LABEL = 'block text-[10px] font-bold uppercase tracking-widest ml-1 mb-1.5 text-stone-400 dark:text-stone-500';
const INPUT =
  'w-full bg-stone-50 dark:bg-stone-800/80 p-3 text-sm font-medium text-stone-800 dark:text-stone-100 placeholder:text-stone-400 placeholder:font-normal transition-all';
const ICONE = 'absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400 dark:text-stone-500 pointer-events-none';

interface LoginViewProps {
  onLoginSuccess: (dados: {
    token: string;
    usuario: Usuario;
    empresa: Empresa;
    servidor: ServidorInfo;
    lembrar: boolean;
  }) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  // Token (X-API-Key) do servidor do cliente: nunca fica guardado no navegador
  const [tokenServidor, setTokenServidor] = useState('');
  const [mostrarToken, setMostrarToken] = useState(false);
  const [servidorInfo, setServidorInfo] = useState<{ identificacao: string; connected: boolean } | null>(null);
  const [checandoServidor, setChecandoServidor] = useState(false);

  const [email, setEmail] = useState<string>(() => lerLembrete() || '');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [lembrar, setLembrar] = useState<boolean>(() => !!lerLembrete());

  const [entrando, setEntrando] = useState(false);
  const [erro, setErro] = useState('');
  const { theme, toggleTheme } = useTheme();

  // Confere o token digitado e mostra de quem é o servidor
  useEffect(() => {
    const chave = tokenServidor.trim();
    if (chave.length < 8) {
      setServidorInfo(null);
      return;
    }

    const timer = setTimeout(async () => {
      setChecandoServidor(true);
      try {
        const info = await consultarServidor(chave);
        setServidorInfo({ identificacao: info.identificacao, connected: info.connected });
      } catch {
        setServidorInfo(null);
      } finally {
        setChecandoServidor(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [tokenServidor]);

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault();
    const chave = tokenServidor.trim();
    if (!chave) {
      setErro('Informe o token do seu servidor.');
      return;
    }

    setErro('');
    setEntrando(true);
    try {
      const res = await login(chave, email.trim() || 'admin', senha);

      // Só o usuário é lembrado; o token do servidor não é guardado
      if (lembrar && email.trim()) salvarLembrete(email.trim());
      else limparLembrete();

      onLoginSuccess({ token: res.token, usuario: res.usuario, empresa: res.empresa, servidor: res.servidor, lembrar });
    } catch (err: any) {
      setErro(err.message || 'Falha ao autenticar. Verifique seus dados.');
    } finally {
      setEntrando(false);
    }
  };

  /** Marca: ícone + nome, no painel esquerdo e, no celular, acima do formulário */
  const marca = (
    <div className="flex items-center gap-2.5">
      <div className="w-9 h-9 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl flex items-center justify-center shadow-lg shadow-amber-200/50 dark:shadow-none shrink-0">
        <Factory className="w-5 h-5 text-white stroke-[2.2]" />
      </div>
      <span className="text-sm font-black tracking-wider uppercase text-stone-800 dark:text-stone-100">ProduçãoLite</span>
    </div>
  );

  return (
    <main className="min-h-screen flex relative bg-white dark:bg-stone-900 text-stone-900 dark:text-white font-sans">
      {/* Painel esquerdo: identidade visual (oculto em telas pequenas) */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col p-12 bg-white dark:bg-stone-950 isolate">
        <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
          {/* Engrenagens: marca d'água de um app de produção */}
          <svg
            viewBox="0 0 380 470"
            aria-hidden="true"
            className="absolute top-1/2 right-[6%] -translate-y-1/2 w-[min(440px,70%)] text-amber-200 dark:text-amber-400/25"
          >
            <g stroke="currentColor" fill="none" opacity={0.85}>
              {/* Engrenagem maior */}
              <circle cx={170} cy={190} r={90} strokeWidth={28} />
              <circle cx={170} cy={190} r={26} fill="currentColor" stroke="none" />
              {Array.from({ length: 12 }, (_, i) => (
                <rect
                  key={`g1-${i}`}
                  x={156}
                  y={56}
                  width={28}
                  height={32}
                  rx={5}
                  fill="currentColor"
                  stroke="none"
                  transform={`rotate(${i * 30} 170 190)`}
                />
              ))}
            </g>

            <g stroke="currentColor" fill="none" opacity={0.6}>
              {/* Engrenagem menor, encaixada na primeira */}
              <circle cx={288} cy={348} r={56} strokeWidth={20} />
              <circle cx={288} cy={348} r={16} fill="currentColor" stroke="none" />
              {Array.from({ length: 10 }, (_, i) => (
                <rect
                  key={`g2-${i}`}
                  x={277}
                  y={260}
                  width={22}
                  height={26}
                  rx={4}
                  fill="currentColor"
                  stroke="none"
                  transform={`rotate(${i * 36} 288 348)`}
                />
              ))}
            </g>
          </svg>
          <div className="absolute top-[15%] left-[10%] w-[280px] h-[280px] rounded-[40%] rotate-12 blur-3xl bg-amber-100/70 dark:bg-amber-500/10" />
          <div className="absolute bottom-[10%] right-[5%] w-[220px] h-[220px] rounded-[45%] -rotate-12 blur-2xl bg-orange-100/60 dark:bg-orange-500/10" />
        </div>

        {marca}

        <div className="flex-1 flex flex-col justify-center">
          <h1 className="text-6xl font-black leading-[0.95] tracking-tight text-stone-900 dark:text-white">
            Ordens de<br />
            <span className="text-amber-600 dark:text-amber-400">Produção</span>
          </h1>
          <p className="mt-4 text-sm font-medium max-w-xs text-stone-500 dark:text-stone-400">
            Produtos fabricados, matérias-primas, lotes e custo da mão de obra.
          </p>
        </div>
      </div>

      {/* Painel direito: formulário de entrada */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative bg-stone-50 dark:bg-stone-900">
        <button
          type="button"
          onClick={toggleTheme}
          title={theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
          className="absolute top-6 right-6 z-20 p-2 rounded-xl border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
        >
          {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>

        <div className="w-full max-w-md">
          <div className="flex lg:hidden mb-8">{marca}</div>

          <h2 className="text-3xl font-black tracking-tight text-stone-900 dark:text-white">Entrar</h2>
          <p className="text-sm font-medium mt-1.5 text-stone-500 dark:text-stone-400">
            Informe o token do seu servidor bmAPI. Usuário e senha são os do sistema BMsoft.
          </p>

          {erro && <AvisoErro mensagem={erro} onFechar={() => setErro('')} />}

          <form onSubmit={entrar} className="flex flex-col gap-5 mt-8">
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="input-login-token" className={LABEL}>
                  Token do servidor
                </label>
                {checandoServidor ? (
                  <span className="text-[11px] text-stone-400 flex items-center gap-1 mb-1.5">
                    <Loader2 size={11} className="animate-spin" /> Verificando…
                  </span>
                ) : servidorInfo ? (
                  <span
                    className={`text-[11px] font-medium flex items-center gap-1 mb-1.5 ${
                      servidorInfo.connected ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    <CheckCircle2 size={12} />
                    {servidorInfo.identificacao}
                    {!servidorInfo.connected && ' • fora do ar'}
                  </span>
                ) : null}
              </div>
              <div className="relative">
                <KeyRound className={ICONE} />
                <input
                  id="input-login-token"
                  type={mostrarToken ? 'text' : 'password'}
                  required
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                  value={tokenServidor}
                  onChange={(e) => {
                    setTokenServidor(e.target.value);
                    setErro('');
                  }}
                  onFocus={(e) => e.target.select()}
                  className={`${INPUT} pl-11 pr-10`}
                  placeholder="token (X-API-Key) do seu servidor"
                />
                <button
                  type="button"
                  onClick={() => setMostrarToken(!mostrarToken)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
                  tabIndex={-1}
                  title={mostrarToken ? 'Esconder o token' : 'Mostrar o token'}
                >
                  {mostrarToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="input-login-usuario" className={LABEL}>
                Usuário ou e-mail
              </label>
              <div className="relative">
                <Mail className={ICONE} />
                <input
                  id="input-login-usuario"
                  type="text"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErro('');
                  }}
                  onFocus={(e) => e.target.select()}
                  className={`${INPUT} pl-11`}
                  placeholder="admin (ou em branco)"
                />
              </div>
            </div>

            <div>
              <label htmlFor="input-login-senha" className={LABEL}>
                Senha
              </label>
              <div className="relative">
                <Lock className={ICONE} />
                <input
                  id="input-login-senha"
                  type={mostrarSenha ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={senha}
                  onChange={(e) => {
                    setSenha(e.target.value);
                    setErro('');
                  }}
                  onFocus={(e) => e.target.select()}
                  className={`${INPUT} pl-11 pr-10`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 cursor-pointer"
                  tabIndex={-1}
                  title={mostrarSenha ? 'Esconder a senha' : 'Mostrar a senha'}
                >
                  {mostrarSenha ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="py-1">
              <Toggle
                id="input-login-lembrar"
                checked={lembrar}
                onChange={setLembrar}
                size="sm"
                label={
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500 dark:text-stone-400">
                    Lembrar meu usuário
                  </span>
                }
                title="Traz o usuário preenchido no próximo acesso. O token do servidor nunca é guardado."
              />
            </div>

            <button
              type="submit"
              disabled={entrando}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-amber-200 dark:shadow-none transition-all flex items-center justify-center gap-2 mt-2 group disabled:opacity-70 cursor-pointer"
            >
              {entrando ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span className="uppercase tracking-wide">Entrar</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="flex items-center justify-between mt-8 pt-4 border-t border-stone-200 dark:border-stone-800 text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-stone-500">
            <span>ProduçãoLite by BMsoft Sistemas</span>
            <span className="normal-case">© {new Date().getFullYear()}</span>
          </div>
        </div>
      </div>
    </main>
  );
};

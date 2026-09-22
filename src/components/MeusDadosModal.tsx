import React, { useState } from 'react';
import { Modal } from './Modal';
import { Usuario } from '../types';
import { salvarMeusDados } from '../services/api';
import { INPUT_CLASS, LABEL_CLASS, FIELD_WRAPPER_CLASS } from '../utils/formStyles';
import { KeyRound, Mail, Home, Check, AlertCircle } from 'lucide-react';

interface MeusDadosModalProps {
  isOpen: boolean;
  onClose: () => void;
  usuario: Usuario;
  onUsuarioAtualizado: (novoUsuario: Partial<Usuario>) => void;
}

export const MeusDadosModal: React.FC<MeusDadosModalProps> = ({
  isOpen,
  onClose,
  usuario,
  onUsuarioAtualizado,
}) => {
  const [email, setEmail] = useState(usuario.email || '');
  const [paginaInicial, setPaginaInicial] = useState(usuario.paginaInicial || 'dashboard');
  const [senha, setSenha] = useState('');
  const [senhaConfirma, setSenhaConfirma] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setSucesso(false);

    if (senha && senha !== senhaConfirma) {
      setErro('A confirmação de senha não confere com a nova senha.');
      return;
    }

    try {
      setLoading(true);
      await salvarMeusDados({
        email: email.trim(),
        paginaInicial,
        ...(senha ? { senha, senhaConfirma } : {}),
      });

      onUsuarioAtualizado({
        email: email.trim(),
        paginaInicial,
      });

      setSucesso(true);
      setSenha('');
      setSenhaConfirma('');
      setTimeout(() => {
        setSucesso(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      setErro(err.message || 'Erro ao salvar alterações.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Meus Dados"
      subtitle={`Usuário: ${usuario.nome} (${usuario.nomePessoa || 'Sem vínculo'})`}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {erro && (
          <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 dark:bg-red-950/40 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-900">
            <AlertCircle size={16} className="shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {sucesso && (
          <div className="flex items-center gap-2 p-3 text-sm text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-900">
            <Check size={16} className="shrink-0" />
            <span>Dados atualizados com sucesso!</span>
          </div>
        )}

        {/* E-mail */}
        <div>
          <label className={LABEL_CLASS}>
            <span className="flex items-center gap-1.5">
              <Mail size={14} /> E-mail
            </span>
          </label>
          <div className={FIELD_WRAPPER_CLASS}>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu.email@empresa.com"
              className={INPUT_CLASS}
            />
          </div>
        </div>

        {/* Página Inicial */}
        <div>
          <label className={LABEL_CLASS}>
            <span className="flex items-center gap-1.5">
              <Home size={14} /> Página Inicial
            </span>
          </label>
          <div className={FIELD_WRAPPER_CLASS}>
            <select
              value={paginaInicial}
              onChange={(e) => setPaginaInicial(e.target.value)}
              className={INPUT_CLASS}
            >
              <option value="dashboard">Dashboard</option>
              <option value="producao">Ordens de Produção</option>
              <option value="padroes">Fichas Técnicas</option>
              <option value="relatorios">Relatórios</option>
            </select>
          </div>
        </div>

        {/* Troca de Senha */}
        <div className="pt-2 border-t border-stone-200 dark:border-stone-800">
          <h4 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <KeyRound size={14} /> Alterar Senha (opcional)
          </h4>

          <div className="space-y-3">
            <div>
              <label className={LABEL_CLASS}>Nova Senha</label>
              <div className={FIELD_WRAPPER_CLASS}>
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Deixe em branco para não alterar"
                  className={INPUT_CLASS}
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div>
              <label className={LABEL_CLASS}>Confirmar Nova Senha</label>
              <div className={FIELD_WRAPPER_CLASS}>
                <input
                  type="password"
                  value={senhaConfirma}
                  onChange={(e) => setSenhaConfirma(e.target.value)}
                  placeholder="Confirme a nova senha"
                  className={INPUT_CLASS}
                  autoComplete="new-password"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Ações */}
        <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:opacity-50 rounded-lg transition-colors shadow-sm"
          >
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

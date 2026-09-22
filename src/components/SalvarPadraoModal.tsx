import React, { useState } from 'react';
import { Modal } from './Modal';
import { salvarPadrao } from '../services/api';
import { FormEntrada, FormSaida, FormTecnico } from '../types';
import { INPUT_CLASS, LABEL_CLASS, FIELD_WRAPPER_CLASS } from '../utils/formStyles';
import { Save, Loader2, AlertCircle } from 'lucide-react';

interface SalvarPadraoModalProps {
  isOpen: boolean;
  onClose: () => void;
  entradas: FormEntrada[];
  saidas: FormSaida[];
  tecnicos: FormTecnico[];
  onSucesso: (nome: string) => void;
}

export const SalvarPadraoModal: React.FC<SalvarPadraoModalProps> = ({
  isOpen,
  onClose,
  entradas,
  saidas,
  tecnicos,
  onSucesso,
}) => {
  const [codigo, setCodigo] = useState('');
  const [nome, setNome] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setErro('Informe o nome da ficha técnica / modelo padrão.');
      return;
    }

    try {
      setSalvando(true);
      setErro(null);

      const prodsPayload = [
        ...entradas.map((e) => ({
          tipoMov: 'E',
          idPro: e.idPro,
          qtdadeUnControle: e.qtdadeUnControle,
          custoTotalUnit: e.custoTotalUnit,
        })),
        ...saidas.map((s) => ({
          tipoMov: 'S',
          idPro: s.idPro,
          qtdadeUnControle: s.qtdadeUnControle,
          custoTotalUnit: s.custoTotalUnit,
        })),
      ];

      const tecsPayload = tecnicos.map((t) => ({
        idTecnico: t.idTecnico,
        horaIni: t.horaIni,
        horaFim: t.horaFim,
        horasTotais: t.horasTotais,
        valorHora: t.valorHora,
        valorTotal: t.valorTotal,
      }));

      await salvarPadrao({
        codigo: codigo.trim() || undefined,
        nome: nome.trim(),
        produtos: prodsPayload,
        tecnicos: tecsPayload,
      });

      onSucesso(nome.trim());
      onClose();
    } catch (err: any) {
      setErro(err.message || 'Erro ao salvar modelo padrão.');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Salvar como Modelo Padrão"
      subtitle="Grave a composição atual como uma receita/ficha técnica reutilizável"
      size="sm"
    >
      <form onSubmit={handleSalvar} className="space-y-4">
        {erro && (
          <div className="flex items-center gap-2 p-2.5 text-xs text-red-700 bg-red-50 dark:bg-red-950/40 dark:text-red-300 rounded-lg border border-red-200 dark:border-red-900">
            <AlertCircle size={15} className="shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        <div>
          <label className={LABEL_CLASS}>Código de Referência (opcional)</label>
          <div className={FIELD_WRAPPER_CLASS}>
            <input
              type="text"
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase())}
              placeholder="Ex: MOD-01"
              className={INPUT_CLASS}
            />
          </div>
        </div>

        <div>
          <label className={LABEL_CLASS}>Nome / Descrição da Receita</label>
          <div className={FIELD_WRAPPER_CLASS}>
            <input
              type="text"
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Montagem Conjunto X"
              className={INPUT_CLASS}
              autoFocus
            />
          </div>
        </div>

        <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg text-xs text-stone-500 space-y-1">
          <div>Entradas: <strong>{entradas.length} item(ns)</strong></div>
          <div>Saídas/Insumos: <strong>{saidas.length} item(ns)</strong></div>
          <div>Técnicos: <strong>{tecnicos.length} profissional(is)</strong></div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200 dark:border-stone-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={salvando}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:opacity-50 rounded-lg flex items-center gap-1.5 shadow-sm"
          >
            {salvando ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            <span>Salvar Modelo</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

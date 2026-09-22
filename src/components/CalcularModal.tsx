import React, { useState } from 'react';
import { Modal } from './Modal';
import { Calculator, Sparkles } from 'lucide-react';
import { INPUT_CLASS, LABEL_CLASS, FIELD_WRAPPER_CLASS } from '../utils/formStyles';

interface CalcularModalProps {
  isOpen: boolean;
  onClose: () => void;
  qtdAtualEntrada: number;
  onAplicarFator: (fator: number) => void;
}

export const CalcularModal: React.FC<CalcularModalProps> = ({
  isOpen,
  onClose,
  qtdAtualEntrada,
  onAplicarFator,
}) => {
  const [modo, setModo] = useState<'fator' | 'quantidade'>('quantidade');
  const [fator, setFator] = useState('1');
  const [novaQtd, setNovaQtd] = useState(String(qtdAtualEntrada || 1));

  const handleCalcular = (e: React.FormEvent) => {
    e.preventDefault();
    let f = 1;
    if (modo === 'fator') {
      f = parseFloat(fator.replace(',', '.')) || 1;
    } else {
      const qNova = parseFloat(novaQtd.replace(',', '.')) || 0;
      const qBase = qtdAtualEntrada || 1;
      f = qBase > 0 ? qNova / qBase : 1;
    }

    if (f <= 0) {
      alert('O fator ou quantidade resultante deve ser maior que zero.');
      return;
    }

    onAplicarFator(f);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Calcular / Redimensionar Produção"
      subtitle="Recalcula proporcionalmente todas as entradas, matérias-primas e horas"
      size="sm"
    >
      <form onSubmit={handleCalcular} className="space-y-4">
        {/* Escolha do modo */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 dark:bg-stone-800/80 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setModo('quantidade')}
            className={`py-2 px-3 rounded-lg transition-all ${
              modo === 'quantidade'
                ? 'bg-white dark:bg-stone-900 text-amber-600 shadow-xs'
                : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
            }`}
          >
            Pela Nova Quantidade
          </button>
          <button
            type="button"
            onClick={() => setModo('fator')}
            className={`py-2 px-3 rounded-lg transition-all ${
              modo === 'fator'
                ? 'bg-white dark:bg-stone-900 text-amber-600 shadow-xs'
                : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'
            }`}
          >
            Por Fator Multiplicador
          </button>
        </div>

        {modo === 'quantidade' ? (
          <div className="space-y-3">
            <div className="text-xs text-stone-500">
              Quantidade base atual da entrada: <strong className="text-stone-800 dark:text-stone-200">{qtdAtualEntrada || 1}</strong>
            </div>

            <div>
              <label className={LABEL_CLASS}>Nova Quantidade Desejada</label>
              <div className={FIELD_WRAPPER_CLASS}>
                <input
                  type="number"
                  step="any"
                  required
                  value={novaQtd}
                  onChange={(e) => setNovaQtd(e.target.value)}
                  placeholder="Ex: 50"
                  className={INPUT_CLASS}
                  autoFocus
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className={LABEL_CLASS}>Fator Multiplicador (ex: 2 para dobrar, 0.5 para metade)</label>
              <div className={FIELD_WRAPPER_CLASS}>
                <input
                  type="number"
                  step="any"
                  required
                  value={fator}
                  onChange={(e) => setFator(e.target.value)}
                  placeholder="Ex: 2.0"
                  className={INPUT_CLASS}
                  autoFocus
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-lg"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 rounded-lg flex items-center gap-1.5 shadow-sm"
          >
            <Sparkles size={14} />
            <span>Aplicar Proporção</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};

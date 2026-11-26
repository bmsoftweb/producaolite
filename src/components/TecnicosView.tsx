import React, { useState, useEffect, useCallback } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { Tecnico, CentroCusto } from '../types';
import {
  fetchTecnicos,
  criarTecnico,
  atualizarTecnico,
  excluirTecnico,
  fetchCentrosCusto,
} from '../services/api';
import { formatCurrencyBRL } from '../utils/formatters';
import { useRefreshDaTela } from '@/components/LayoutApp';
import { ListaCrm } from '@/components/ListaCrm';
import { Campo, FormCrm, INPUT_CLASS } from '@/components/FormCrm';
import { BotaoAcao } from '@/components/MenuAcoes';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { AvisoErro } from '@/components/AvisoErro';
import { NumberField } from './NumberField';

const NOVO: Partial<Tecnico> = { nome: '', valorHora: 0, idCc: 0 };

export const TecnicosView: React.FC = () => {
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [centrosCusto, setCentrosCusto] = useState<CentroCusto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const [form, setForm] = useState<Partial<Tecnico> | null>(null);
  const [erroForm, setErroForm] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState<Tecnico | null>(null);

  const carregar = useCallback(async () => {
    try {
      setCarregando(true);
      const [tecs, ccs] = await Promise.all([fetchTecnicos(), fetchCentrosCusto().catch(() => [])]);
      setTecnicos(tecs);
      setCentrosCusto(ccs);
    } catch (err: any) {
      setErro(err.message || 'Erro ao carregar técnicos.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => void carregar(), [carregar]);
  useRefreshDaTela(carregar);

  const muda = (campo: keyof Tecnico, valor: unknown) => setForm((f) => (f ? { ...f, [campo]: valor } : f));
  const abrir = (t: Partial<Tecnico>) => (setErroForm(''), setForm({ ...t }));

  const salvar = async () => {
    if (!form) return;
    if (!form.nome?.trim()) {
      setErroForm('Informe o nome do técnico.');
      return;
    }
    setSalvando(true);
    setErroForm('');
    try {
      const dados = {
        nome: form.nome.trim(),
        valorHora: Number(form.valorHora) || 0,
        idCc: Number(form.idCc) || 0,
      };
      if (form.id) {
        await atualizarTecnico(form.id, dados);
        setSucesso(`Técnico "${dados.nome}" atualizado.`);
      } else {
        await criarTecnico(dados);
        setSucesso(`Técnico "${dados.nome}" cadastrado.`);
      }
      setForm(null);
      await carregar();
    } catch (err: any) {
      setErroForm(err.message || 'Erro ao salvar dados do técnico.');
    } finally {
      setSalvando(false);
    }
  };

  const confirmarExclusao = async () => {
    const t = excluindo!;
    await excluirTecnico(t.id);
    setExcluindo(null);
    setSucesso(`Técnico "${t.nome}" excluído.`);
    await carregar();
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 min-w-0">
      {form ? (
        <FormCrm
          id="tecnicos"
          onSubmit={(e) => (e.preventDefault(), salvar())}
          onCancel={() => setForm(null)}
          saving={salvando}
          erro={erroForm}
          onFecharErro={() => setErroForm('')}
          rodape={form.id ? `Técnico #${form.id}` : 'Inclusão'}
        >
          <Campo rotulo="Nome completo" span={2}>
            <input
              autoFocus
              required
              maxLength={60}
              value={form.nome || ''}
              onChange={(e) => muda('nome', e.target.value)}
              placeholder="Ex.: João da Silva"
              className={INPUT_CLASS}
            />
          </Campo>
          <Campo rotulo="Valor da hora (R$)">
            <NumberField
              scale={2}
              required
              value={form.valorHora ?? ''}
              onChange={(v) => muda('valorHora', Number(v) || 0)}
              className={INPUT_CLASS}
            />
          </Campo>
          <Campo rotulo="Centro de custo padrão" dica="Usado no rateio da mão de obra das ordens">
            <select
              value={form.idCc || 0}
              onChange={(e) => muda('idCc', parseInt(e.target.value, 10) || 0)}
              className={INPUT_CLASS}
            >
              <option value="0">Padrão da empresa</option>
              {centrosCusto.map((cc) => (
                <option key={cc.id} value={cc.id}>
                  {cc.descricao}
                </option>
              ))}
            </select>
          </Campo>
        </FormCrm>
      ) : (
        <ListaCrm
          className="flex-1"
          id="tecnicos"
          linhas={tecnicos}
          carregando={carregando}
          chave={(t) => t.id}
          onNovo={() => abrir({ ...NOVO, idCc: centrosCusto[0]?.id || 0 })}
          onEditar={(t) => abrir(t)}
          vazio="Nenhum técnico cadastrado."
          colunas={[
            { key: 'id', label: 'ID', alinhar: 'numero', largura: 70 },
            { key: 'nome', label: 'Nome do técnico / operador', largura: 300 },
            { key: 'valorHora', label: 'Valor hora', alinhar: 'numero', largura: 130, render: (t) => formatCurrencyBRL(t.valorHora) },
            { key: 'descricaoCc', label: 'Centro de custo', largura: 240, render: (t) => t.descricaoCc || 'Padrão da empresa' },
          ]}
          acoes={(t) => (
            <>
              <BotaoAcao icone={Pencil} titulo="Editar" descricao="Alterar os dados do técnico" onClick={() => abrir(t)} />
              <BotaoAcao icone={Trash2} titulo="Excluir" descricao="Excluir o técnico" tom="perigo" onClick={() => setExcluindo(t)} />
            </>
          )}
        />
      )}

      {excluindo && (
        <ConfirmDialog
          titulo="Excluir técnico"
          mensagem={
            <>
              Tem certeza que deseja excluir o técnico <strong>{excluindo.nome}</strong>?
            </>
          }
          onConfirmar={confirmarExclusao}
          onCancelar={() => setExcluindo(null)}
        />
      )}

      {erro && <AvisoErro mensagem={erro} onFechar={() => setErro('')} />}
      {sucesso && <AvisoErro mensagem={sucesso} tom="sucesso" onFechar={() => setSucesso('')} />}
    </div>
  );
};

import { Router, Request, Response } from 'express';
import {
  consultar,
  consultarUm,
  executar,
  sqlTexto,
  sqlInteiro,
  sqlNumero,
  sqlData,
  sqlDataHora,
  agoraISO,
  hojeISO,
  BmapiError,
} from './bmapi.js';
import { config } from './config.js';

/**
 * Rotas da API de Ordens de Produção (ProducaoLite).
 *
 * Tabelas DBISAM utilizadas:
 *  - ESP_WET_PRODUCAO_OP:          Cabeçalhos das OPs
 *  - ESP_WET_PRODUCAO_PRODUTOS:    Itens (Entradas/Saídas) por OP
 *  - ESP_WET_PRODUCAO_TECNICOS:         Técnicos e horas por OP
 *  - ESP_WET_PRODUCAO_PADROES:     Fichas técnicas/padrões
 *  - ESP_WET_PRODUCAO_PADROES_PRODUTOS: Itens dos padrões
 *  - ESP_WET_PRODUCAO_PADROES_TECNICOS: Técnicos dos padrões
 *  - ESP_WET_PRODUTOS:             Parâmetros de produção dos produtos
 *  - ESP_WET_TECNICOS:             Cadastro de técnicos
 *  - PRODUTOSPRINCIPAL:            Produtos do ERP
 *  - PRODUTOSREFERENCIA:           Referências de produtos
 *  - PRODUTOSREFEMPRESA:           Saldo e reservas por empresa/referência
 *  - PRODUTOSCARDEX:               Kardex (movimentações de estoque)
 *  - PROCUSTOSEMP:            Custos de produção por empresa/produto
 *  - PROLOTES:                     Lotes de produtos
 *  - PROLOTESCARDEX:               Kardex de lotes
 *  - CCUSTOS:                      Centros de custo
 *  - ORCAMENTOM / ORCAMENTOP:      DAVs/Orçamentos para captura
 *  - OSM / OSP:                    Ordens de Serviço para captura
 */

function arredondar(v: number, casas = 4): number {
  return Math.round(v * 10 ** casas) / 10 ** casas;
}

export function createProducaoRouter() {
  const router = Router();

  // =====================================================================
  // LISTAGEM DE MOVIMENTAÇÕES DE PRODUÇÃO
  // =====================================================================

  /**
   * GET /api/producao
   * Lista as movimentações de produção (ESP_WET_PRODUCAO_PRODUTOS com JOIN OP)
   * com filtros: d1, d2, tipo_mov (E/S/''), busca (produto, lote)
   */
  router.get('/producao', async (req: Request, res: Response) => {
    try {
      const d1 = String(req.query.d1 || hojeISO(-30));
      const d2 = String(req.query.d2 || hojeISO());
      const tipoMov = String(req.query.tipo_mov || '');
      const busca = String(req.query.busca || '').trim().toUpperCase();

      let filtroTipo = '';
      if (tipoMov === 'E' || tipoMov === 'S') filtroTipo = `AND A.TIPO_MOV = ${sqlTexto(tipoMov)}`;

      let filtroBusca = '';
      if (busca) {
        filtroBusca = `AND (UPPER(C.DESCRICAO) LIKE '%${busca.replace(/'/g, "''")}%' OR UPPER(A.LOTE) LIKE '%${busca.replace(/'/g, "''")}%')`;
      }

      const rows = await consultar(`
        SELECT
          A.ID id,
          A.ID_PRODUCAO id_producao,
          RIGHT('000000' + CAST(A.ID_PRODUCAO AS VARCHAR(6)), 6) + ' - ' + COALESCE(D.OBS, '') descricao_op,
          D.DATA data_op,
          A.DATA data,
          A.TIPO_MOV tipo_mov,
          A.ID_PRO id_pro,
          C.DESCRICAO descricao_produto,
          C.TIPO tipo_pro,
          A.QTDADE_UN_CONTROLE qtdade_un_controle,
          B.UN_CONTROLE un_controle,
          A.QTDADE_UN_ESTOQUE qtdade_un_estoque,
          B.UN_ESTOQUE un_estoque,
          A.CUSTO_TOTAL_UNIT custo_total_unit,
          A.CUSTO_TOTAL_TOTAL custo_total_total,
          A.LOTE lote,
          A.CONTROLE controle,
          A.ID_CC id_cc,
          E.DESCRICAO descricao_cc,
          A.DATAHORA_MOV datahora_mov
        FROM ESP_WET_PRODUCAO_PRODUTOS A
        LEFT JOIN ESP_WET_PRODUTOS B ON B.ID_PRO = A.ID_PRO
        LEFT JOIN PRODUTOSPRINCIPAL C ON C.ID = A.ID_PRO
        LEFT JOIN ESP_WET_PRODUCAO_OP D ON D.ID = A.ID_PRODUCAO
        LEFT JOIN CCUSTOS E ON E.ID = A.ID_CC
        WHERE D.DATA BETWEEN :d1 AND :d2
        ${filtroTipo}
        ${filtroBusca}
        ORDER BY A.ID_PRODUCAO, A.TIPO_MOV
        TOP 500
      `, { d1, d2 });

      res.json(rows.map((r) => ({
        id: Number(r.id),
        idProducao: Number(r.id_producao),
        descricaoOp: String(r.descricao_op || '').trim(),
        dataOp: r.data_op,
        data: r.data,
        tipoMov: String(r.tipo_mov || '').trim(),
        idPro: Number(r.id_pro),
        descricaoProduto: String(r.descricao_produto || '').trim(),
        tipoPro: String(r.tipo_pro || '').trim(),
        qtdadeUnControle: Number(r.qtdade_un_controle || 0),
        unControle: String(r.un_controle || '').trim(),
        qtdadeUnEstoque: Number(r.qtdade_un_estoque || 0),
        unEstoque: String(r.un_estoque || '').trim(),
        custoTotalUnit: Number(r.custo_total_unit || 0),
        custoTotalTotal: Number(r.custo_total_total || 0),
        lote: String(r.lote || '').trim(),
        controle: Number(r.controle || 0),
        idCc: Number(r.id_cc || 0),
        descricaoCc: String(r.descricao_cc || '').trim(),
        datahoraMov: r.datahora_mov,
      })));
    } catch (err: any) {
      res.status(err?.status || 500).json({ error: err.message });
    }
  });

  /**
   * GET /api/producao/:id/tecnicos
   * Técnicos vinculados a uma OP específica
   */
  router.get('/producao/:id/tecnicos', async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const rows = await consultar(`
        SELECT
          A.ID id, A.ID_PRODUCAO id_producao, A.ID_TECNICO id_tecnico,
          B.NOME nome_tecnico, A.DATA data,
          A.HORA_INI hora_ini, A.HORA_FIM hora_fim,
          A.HORAS_TOTAIS horas_totais, A.VALOR_HORA valor_hora, A.VALOR_TOTAL valor_total,
          A.ID_CC id_cc, C.DESCRICAO descricao_cc
        FROM ESP_WET_PRODUCAO_TECNICOS A
        LEFT JOIN ESP_WET_TECNICOS B ON B.ID = A.ID_TECNICO
        LEFT JOIN CCUSTOS C ON C.ID = A.ID_CC
        WHERE A.ID_PRODUCAO = :id
        ORDER BY A.ID
      `, { id });
      res.json(rows.map((r) => ({
        id: Number(r.id),
        idProducao: Number(r.id_producao),
        idTecnico: Number(r.id_tecnico),
        nomeTecnico: String(r.nome_tecnico || '').trim(),
        data: r.data,
        horaIni: r.hora_ini,
        horaFim: r.hora_fim,
        horasTotais: Number(r.horas_totais || 0),
        valorHora: Number(r.valor_hora || 0),
        valorTotal: Number(r.valor_total || 0),
        idCc: Number(r.id_cc || 0),
        descricaoCc: String(r.descricao_cc || '').trim(),
      })));
    } catch (err: any) {
      res.status(err?.status || 500).json({ error: err.message });
    }
  });

  // =====================================================================
  // CRIAÇÃO / FINALIZAÇÃO DE OP
  // =====================================================================

  /**
   * POST /api/producao
   * Cria e finaliza uma nova Ordem de Produção completa com entradas, saídas e técnicos.
   * Equivale a btnNovaProducaoClick no Delphi.
   */
  router.post('/producao', async (req: Request, res: Response) => {
    try {
      const u = req.usuario!;
      const { op, entradas, saidas, tecnicos } = req.body;

      if (!entradas?.length && !saidas?.length) {
        return res.status(400).json({ error: 'Informe pelo menos uma entrada ou saída.' });
      }

      const idEmpresa = config.idEmpresa;
      const agora = agoraISO();
      const dataOp = String(op?.data || hojeISO()).slice(0, 10);

      // --- Gravar cabeçalho da OP ---
      const sqlOp = `
        SELECT ID FROM ESP_WET_PRODUCAO_OP WHERE ID = -1;
        INSERT INTO ESP_WET_PRODUCAO_OP (DATA, DOC, OBS, QTDADE_QUEBRA_UN_ESTOQUE)
        VALUES (${sqlData(dataOp)}, ${sqlTexto(op?.doc || '', 20)}, ${sqlTexto(op?.obs || '', 200)}, ${sqlNumero(op?.qtdadeQuebraUnEstoque || 0)});
        SELECT ID id FROM ESP_WET_PRODUCAO_OP ORDER BY ID DESC TOP 1
      `;
      const resOp = await consultar(sqlOp);
      const idOp = Number(resOp[0]?.id);
      if (!idOp) throw new BmapiError('Falha ao criar a Ordem de Produção.');

      const idsProdutosAfetados: Set<number> = new Set();

      // --- Gravar entradas (produtos acabados) ---
      for (const e of (entradas || [])) {
        const idPro = Number(e.idPro);
        idsProdutosAfetados.add(idPro);

        // Verificar/criar lote se necessário
        if (e.lote) {
          const loteExiste = await consultarUm(
            `SELECT ID id FROM PROLOTES WHERE IDPRO = :idPro AND LOTE = :lote ORDER BY ID TOP 1`,
            { idPro, lote: e.lote },
          );
          if (!loteExiste) {
            if (!e.loteValidade) throw new BmapiError(`Lote '${e.lote}' não existe. Informe a data de validade para criá-lo.`);
            await executar(`
              INSERT INTO PROLOTES (ID_EMPRESA, IDPRO, LOTE, QTD, FABRICACAO, VALIDADE)
              VALUES (${sqlInteiro(idEmpresa)}, ${sqlInteiro(idPro)}, ${sqlTexto(e.lote)}, 0,
                      CURRENT_DATE, ${sqlData(e.loteValidade)})
            `);
          }
        }

        // Inserir o produto da OP
        const sqlProd = `
          SELECT ID FROM ESP_WET_PRODUCAO_PRODUTOS WHERE ID = -1;
          INSERT INTO ESP_WET_PRODUCAO_PRODUTOS
            (ID_PRODUCAO, TIPO_MOV, ID_PRO, DATA, QTDADE_UN_CONTROLE, QTDADE_UN_ESTOQUE,
             CUSTO_TOTAL_UNIT, CUSTO_TOTAL_TOTAL, DATAHORA_MOV, CONTROLE, LOTE, ID_CC)
          VALUES
            (${sqlInteiro(idOp)}, 'E', ${sqlInteiro(idPro)}, ${sqlData(dataOp)},
             ${sqlNumero(e.qtdadeUnControle)}, ${sqlNumero(e.qtdadeUnEstoque)},
             ${sqlNumero(e.custoTotalUnit)}, ${sqlNumero(e.custoTotalTotal)},
             ${sqlTexto(agora)}, ${sqlInteiro(e.idPai || idOp)}, ${sqlTexto(e.lote || '')},
             ${sqlInteiro(e.idCc || 0)});
          SELECT ID id FROM ESP_WET_PRODUCAO_PRODUTOS ORDER BY ID DESC TOP 1
        `;
        const resProd = await consultar(sqlProd);
        const idProdItem = Number(resProd[0]?.id);

        // Atualizar saldo do lote (entrada)
        if (e.lote) {
          await executar(`
            UPDATE PROLOTES SET QTD = QTD + ${sqlNumero(e.qtdadeUnEstoque)}
            WHERE IDPRO = ${sqlInteiro(idPro)} AND LOTE = ${sqlTexto(e.lote)}
          `);
          await executar(`
            INSERT INTO PROLOTESCARDEX
              (ID_EMPRESA, ID_PESSOA, NOME, DATA, ID_PRO, ID_LOTE, FLUXO, QTD, LINK_TP, LINK_ID)
            VALUES
              (${sqlInteiro(idEmpresa)}, 0, 'PRODUCAO', CURRENT_DATE,
               ${sqlInteiro(idPro)},
               (SELECT ID FROM PROLOTES WHERE IDPRO = ${sqlInteiro(idPro)} AND LOTE = ${sqlTexto(e.lote)} ORDER BY ID TOP 1),
               'E', ${sqlNumero(e.qtdadeUnEstoque)}, 'PR', ${sqlInteiro(idProdItem)})
          `);
        }

        // Atualizar estoque em PRODUTOSREFEMPRESA (entrada)
        const ref = await consultarUm(
          `SELECT A.ID id_ref FROM PRODUTOSREFERENCIA A WHERE A.ID_PRODUTO = :idPro ORDER BY A.ID TOP 1`,
          { idPro },
        );
        if (ref) {
          await executar(`
            UPDATE PRODUTOSREFEMPRESA SET ESTOQUE = ESTOQUE + ${sqlNumero(e.qtdadeUnEstoque)}
            WHERE ID_EMPRESA = ${sqlInteiro(idEmpresa)} AND ID_REF = ${sqlInteiro(ref.id_ref)}
          `);
          // Gravar no Kardex
          const custo = await consultarUm(
            `SELECT ID id, CUSTOREAL custo FROM PROCUSTOSEMP WHERE ID_EMPRESA = :emp AND ID_PRODUTO = :pro ORDER BY ID TOP 1`,
            { emp: idEmpresa, pro: idPro },
          );
          const custoUnit = Number(custo?.custo || 0);
          await executar(`
            INSERT INTO PRODUTOSCARDEX
              (DH_EVENTO, ID_EMPRESA, ID_REFERENCIA, ID_PESSOA, CLIFOR, ID_USUARIO, ID_VENDEDOR,
               DOCUMENTO, DATA, HISTORICO, TIPOMOV, QTDADE, ESTOQUEQTDADE, VALORUNIT, VALORTOTAL,
               CUSTOMEDIO, ESTOQUEVALOR, CT_UNIT, CT_TOTAL, CT_MEDIO, CT_SALDO, LINK_TP, LINK_ID,
               ATCUSTO, CORRECAOAPONTAMENTO)
            VALUES
              (CURRENT_TIMESTAMP, ${sqlInteiro(idEmpresa)}, ${sqlInteiro(ref.id_ref)}, 0, '', ${sqlInteiro(u.id)}, 0,
               'PR' + RIGHT('000000' + CAST(${sqlInteiro(idOp)} AS VARCHAR(6)), 6),
               ${sqlData(dataOp)}, 'GERADO NO SISTEMA DE PRODUCAO' + CASE WHEN ${sqlTexto(e.lote || '')} <> '' THEN ' #' + ${sqlTexto(e.lote || '')} ELSE '' END,
               'E', ${sqlNumero(e.qtdadeUnEstoque)}, 0, ${sqlNumero(custoUnit)},
               ${sqlNumero(arredondar(custoUnit * Number(e.qtdadeUnEstoque)))},
               0, 0, 0, 0, 0, 0, 'PR', ${sqlInteiro(idProdItem)}, 'S', 'N')
          `);
        }
      }

      // --- Gravar saídas (matérias-primas / insumos) ---
      for (const s of (saidas || [])) {
        const idPro = Number(s.idPro);
        idsProdutosAfetados.add(idPro);

        const sqlProd = `
          SELECT ID FROM ESP_WET_PRODUCAO_PRODUTOS WHERE ID = -1;
          INSERT INTO ESP_WET_PRODUCAO_PRODUTOS
            (ID_PRODUCAO, TIPO_MOV, ID_PRO, DATA, QTDADE_UN_CONTROLE, QTDADE_UN_ESTOQUE,
             QUEBRA_UN_CONTROLE, QUEBRA_UN_ESTOQUE, CUSTO_TOTAL_UNIT, CUSTO_TOTAL_TOTAL,
             DATAHORA_MOV, CONTROLE, LOTE, ID_CC)
          VALUES
            (${sqlInteiro(idOp)}, 'S', ${sqlInteiro(idPro)}, ${sqlData(dataOp)},
             ${sqlNumero(s.qtdadeUnControle)}, ${sqlNumero(s.qtdadeUnEstoque)},
             ${sqlNumero(s.quebraUnControle || 0)}, ${sqlNumero(s.quebraUnEstoque || 0)},
             ${sqlNumero(s.custoTotalUnit)}, ${sqlNumero(s.custoTotalTotal)},
             ${sqlTexto(agora)}, ${sqlInteiro(s.idPai || idOp)}, ${sqlTexto(s.lote || '')},
             ${sqlInteiro(s.idCc || 0)});
          SELECT ID id FROM ESP_WET_PRODUCAO_PRODUTOS ORDER BY ID DESC TOP 1
        `;
        const resProd = await consultar(sqlProd);
        const idProdItem = Number(resProd[0]?.id);

        // Atualizar saldo do lote (saída)
        if (s.lote) {
          await executar(`
            UPDATE PROLOTES SET QTD = QTD - ${sqlNumero(s.qtdadeUnEstoque)}
            WHERE IDPRO = ${sqlInteiro(idPro)} AND LOTE = ${sqlTexto(s.lote)}
          `);
          await executar(`
            INSERT INTO PROLOTESCARDEX
              (ID_EMPRESA, ID_PESSOA, NOME, DATA, ID_PRO, ID_LOTE, FLUXO, QTD, LINK_TP, LINK_ID)
            VALUES
              (${sqlInteiro(idEmpresa)}, 0, 'PRODUCAO', CURRENT_DATE,
               ${sqlInteiro(idPro)},
               (SELECT ID FROM PROLOTES WHERE IDPRO = ${sqlInteiro(idPro)} AND LOTE = ${sqlTexto(s.lote)} ORDER BY ID TOP 1),
               'S', ${sqlNumero(s.qtdadeUnEstoque)}, 'PR', ${sqlInteiro(idProdItem)})
          `);
        }

        // Atualizar estoque em PRODUTOSREFEMPRESA (saída)
        const ref = await consultarUm(
          `SELECT A.ID id_ref FROM PRODUTOSREFERENCIA A WHERE A.ID_PRODUTO = :idPro ORDER BY A.ID TOP 1`,
          { idPro },
        );
        if (ref) {
          await executar(`
            UPDATE PRODUTOSREFEMPRESA SET ESTOQUE = ESTOQUE - ${sqlNumero(s.qtdadeUnEstoque)}
            WHERE ID_EMPRESA = ${sqlInteiro(idEmpresa)} AND ID_REF = ${sqlInteiro(ref.id_ref)}
          `);
          const custo = await consultarUm(
            `SELECT ID id, CUSTOREAL custo FROM PROCUSTOSEMP WHERE ID_EMPRESA = :emp AND ID_PRODUTO = :pro ORDER BY ID TOP 1`,
            { emp: idEmpresa, pro: idPro },
          );
          const custoUnit = Number(custo?.custo || 0);
          await executar(`
            INSERT INTO PRODUTOSCARDEX
              (DH_EVENTO, ID_EMPRESA, ID_REFERENCIA, ID_PESSOA, CLIFOR, ID_USUARIO, ID_VENDEDOR,
               DOCUMENTO, DATA, HISTORICO, TIPOMOV, QTDADE, ESTOQUEQTDADE, VALORUNIT, VALORTOTAL,
               CUSTOMEDIO, ESTOQUEVALOR, CT_UNIT, CT_TOTAL, CT_MEDIO, CT_SALDO, LINK_TP, LINK_ID,
               ATCUSTO, CORRECAOAPONTAMENTO)
            VALUES
              (CURRENT_TIMESTAMP, ${sqlInteiro(idEmpresa)}, ${sqlInteiro(ref.id_ref)}, 0, '', ${sqlInteiro(u.id)}, 0,
               'PR' + RIGHT('000000' + CAST(${sqlInteiro(idOp)} AS VARCHAR(6)), 6),
               ${sqlData(dataOp)}, 'GERADO NO SISTEMA DE PRODUCAO',
               'S', ${sqlNumero(s.qtdadeUnEstoque)}, 0, ${sqlNumero(custoUnit)},
               ${sqlNumero(arredondar(custoUnit * Number(s.qtdadeUnEstoque)))},
               0, 0, 0, 0, 0, 0, 'PR', ${sqlInteiro(idProdItem)}, 'S', 'N')
          `);
        }
      }

      // --- Gravar técnicos ---
      for (const t of (tecnicos || [])) {
        await executar(`
          INSERT INTO ESP_WET_PRODUCAO_TECNICOS
            (ID_PRODUCAO, ID_TECNICO, DATA, HORA_INI, HORA_FIM, HORAS_TOTAIS, VALOR_HORA, VALOR_TOTAL, ID_CC)
          VALUES
            (${sqlInteiro(idOp)}, ${sqlInteiro(t.idTecnico)}, ${sqlData(t.data || dataOp)},
             ${sqlTexto(t.horaIni || '00:00')}, ${sqlTexto(t.horaFim || '00:00')},
             ${sqlNumero(t.horasTotais || 0)}, ${sqlNumero(t.valorHora || 0)}, ${sqlNumero(t.valorTotal || 0)},
             ${sqlInteiro(t.idCc || 0)})
        `);
      }

      res.json({ ok: true, idOp });
    } catch (err: any) {
      res.status(err?.status || 500).json({ error: err.message });
    }
  });

  /**
   * DELETE /api/producao/:id
   * Exclui uma movimentação de produção e estorna Kardex e saldo de lote.
   * Equivale a btnExcluirProducaoClick no Delphi.
   */
  router.delete('/producao/:id', async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const idEmpresa = config.idEmpresa;

      const item = await consultarUm(`
        SELECT A.ID id, A.ID_PRODUCAO id_producao, A.TIPO_MOV tipo_mov, A.ID_PRO id_pro,
               A.QTDADE_UN_ESTOQUE qtdade_un_estoque, A.LOTE lote
        FROM ESP_WET_PRODUCAO_PRODUTOS A WHERE A.ID = :id
      `, { id });
      if (!item) return res.status(404).json({ error: 'Movimentação não encontrada.' });

      const idPro = Number(item.id_pro);
      const qtd = Number(item.qtdade_un_estoque || 0);
      const tipoMov = String(item.tipo_mov || '').trim();
      const lote = String(item.lote || '').trim();

      // Estornar Kardex
      const cardex = await consultarUm(
        `SELECT ID id, ID_REFERENCIA id_ref FROM PRODUTOSCARDEX WHERE LINK_TP = 'PR' AND LINK_ID = :id ORDER BY ID TOP 1`,
        { id },
      );
      if (cardex) await executar(`DELETE FROM PRODUTOSCARDEX WHERE ID = ${sqlInteiro(cardex.id)}`);

      // Estornar lote
      if (lote) {
        const loteReg = await consultarUm(
          `SELECT ID id FROM PROLOTES WHERE IDPRO = :idPro AND LOTE = :lote ORDER BY ID TOP 1`,
          { idPro, lote },
        );
        if (loteReg) {
          const sinal = tipoMov === 'E' ? '-' : '+';
          await executar(`UPDATE PROLOTES SET QTD = QTD ${sinal} ${sqlNumero(qtd)} WHERE ID = ${sqlInteiro(loteReg.id)}`);
          await executar(`DELETE FROM PROLOTESCARDEX WHERE LINK_TP = 'PR' AND LINK_ID = ${sqlInteiro(id)}`);
        }
      }

      // Estornar saldo em PRODUTOSREFEMPRESA
      const ref = await consultarUm(
        `SELECT A.ID id_ref FROM PRODUTOSREFERENCIA A WHERE A.ID_PRODUTO = :idPro ORDER BY A.ID TOP 1`,
        { idPro },
      );
      if (ref) {
        const sinal = tipoMov === 'E' ? '-' : '+';
        await executar(`
          UPDATE PRODUTOSREFEMPRESA SET ESTOQUE = ESTOQUE ${sinal} ${sqlNumero(qtd)}
          WHERE ID_EMPRESA = ${sqlInteiro(idEmpresa)} AND ID_REF = ${sqlInteiro(ref.id_ref)}
        `);
      }

      // Excluir o item
      await executar(`DELETE FROM ESP_WET_PRODUCAO_PRODUTOS WHERE ID = ${sqlInteiro(id)}`);

      // Verificar se a OP ficou sem itens e excluir a OP também
      const idOp = Number(item.id_producao);
      const countItens = await consultarUm(
        `SELECT COUNT(*) n FROM ESP_WET_PRODUCAO_PRODUTOS WHERE ID_PRODUCAO = :idOp`,
        { idOp },
      );
      if (Number(countItens?.n || 0) === 0) {
        await executar(`DELETE FROM ESP_WET_PRODUCAO_TECNICOS WHERE ID_PRODUCAO = ${sqlInteiro(idOp)}`);
        await executar(`DELETE FROM ESP_WET_PRODUCAO_OP WHERE ID = ${sqlInteiro(idOp)}`);
      }

      res.json({ ok: true });
    } catch (err: any) {
      res.status(err?.status || 500).json({ error: err.message });
    }
  });

  // =====================================================================
  // PRODUTOS PARA PRODUÇÃO (ESP_WET_PRODUTOS)
  // =====================================================================

  router.get('/producao/produtos-esp', async (_req: Request, res: Response) => {
    try {
      const rows = await consultar(`
        SELECT A.ID id, A.ID_PRO id_pro, B.DESCRICAO descricao,
               A.UN_CONTROLE un_controle, A.UN_ESTOQUE un_estoque,
               A.FATOR_CONVERSAO fator_conversao, A.TIPO_UN_BAIXA tipo_un_baixa,
               A.QUEBRA quebra, B.TIPO tipo_pro
        FROM ESP_WET_PRODUTOS A
        LEFT JOIN PRODUTOSPRINCIPAL B ON B.ID = A.ID_PRO
        ORDER BY B.DESCRICAO TOP 2000
      `);
      res.json(rows.map((r) => ({
        id: Number(r.id),
        idPro: Number(r.id_pro),
        descricao: String(r.descricao || '').trim(),
        unControle: String(r.un_controle || '').trim(),
        unEstoque: String(r.un_estoque || '').trim(),
        fatorConversao: Number(r.fator_conversao || 1),
        tipoUnBaixa: String(r.tipo_un_baixa || 'E').trim(),
        quebra: String(r.quebra || 'N').trim(),
        tipoPro: String(r.tipo_pro || '').trim(),
      })));
    } catch (err: any) {
      res.status(err?.status || 500).json({ error: err.message });
    }
  });

  router.post('/producao/produtos-esp', async (req: Request, res: Response) => {
    try {
      const { idPro, unControle, unEstoque, fatorConversao, tipoUnBaixa, quebra } = req.body;
      if (!idPro) return res.status(400).json({ error: 'Informe o ID do produto.' });

      const existe = await consultarUm(`SELECT ID id FROM ESP_WET_PRODUTOS WHERE ID_PRO = :id`, { id: Number(idPro) });
      if (existe) {
        await executar(`
          UPDATE ESP_WET_PRODUTOS
          SET UN_CONTROLE = ${sqlTexto(unControle || '', 10)},
              UN_ESTOQUE = ${sqlTexto(unEstoque || '', 10)},
              FATOR_CONVERSAO = ${sqlNumero(fatorConversao || 1)},
              TIPO_UN_BAIXA = ${sqlTexto(tipoUnBaixa || 'E', 1)},
              QUEBRA = ${sqlTexto(quebra || 'N', 1)}
          WHERE ID_PRO = ${sqlInteiro(idPro)}
        `);
        res.json({ ok: true, id: Number(existe.id) });
      } else {
        const r = await consultar(`
          SELECT ID FROM ESP_WET_PRODUTOS WHERE ID = -1;
          INSERT INTO ESP_WET_PRODUTOS (ID_PRO, UN_CONTROLE, UN_ESTOQUE, FATOR_CONVERSAO, TIPO_UN_BAIXA, QUEBRA)
          VALUES (${sqlInteiro(idPro)}, ${sqlTexto(unControle || '', 10)}, ${sqlTexto(unEstoque || '', 10)},
                  ${sqlNumero(fatorConversao || 1)}, ${sqlTexto(tipoUnBaixa || 'E', 1)}, ${sqlTexto(quebra || 'N', 1)});
          SELECT ID id FROM ESP_WET_PRODUTOS ORDER BY ID DESC TOP 1
        `);
        res.json({ ok: true, id: Number(r[0]?.id) });
      }
    } catch (err: any) {
      res.status(err?.status || 500).json({ error: err.message });
    }
  });

  // =====================================================================
  // BUSCA DE PRODUTOS DO ERP (PRODUTOSPRINCIPAL)
  // =====================================================================

  router.get('/producao/buscar-produto', async (req: Request, res: Response) => {
    try {
      const q = String(req.query.q || '').trim().toUpperCase();
      if (!q || q.length < 2) return res.json([]);
      const rows = await consultar(`
        SELECT ID id, DESCRICAO descricao, TIPO tipo, UNVENDA un
        FROM PRODUTOSPRINCIPAL
        WHERE UPPER(DESCRICAO) LIKE '%${q.replace(/'/g, "''")}%'
        ORDER BY DESCRICAO TOP 30
      `);
      res.json(rows.map((r) => ({
        id: Number(r.id),
        descricao: String(r.descricao || '').trim(),
        tipo: String(r.tipo || '').trim(),
        un: String(r.un || '').trim(),
      })));
    } catch (err: any) {
      res.status(err?.status || 500).json({ error: err.message });
    }
  });

  // =====================================================================
  // CUSTO DO PRODUTO (PROCUSTOSEMP)
  // =====================================================================

  router.get('/producao/custo-produto/:idPro', async (req: Request, res: Response) => {
    try {
      const idPro = Number(req.params.idPro);
      const row = await consultarUm(
        `SELECT ID id, CUSTOREAL custo FROM PROCUSTOSEMP WHERE ID_EMPRESA = :emp AND ID_PRODUTO = :pro ORDER BY ID TOP 1`,
        { emp: config.idEmpresa, pro: idPro },
      );
      res.json({ custo: Number(row?.custo || 0) });
    } catch (err: any) {
      res.status(err?.status || 500).json({ error: err.message });
    }
  });

  // =====================================================================
  // LOTES
  // =====================================================================

  router.get('/producao/lotes/:idPro', async (req: Request, res: Response) => {
    try {
      const idPro = Number(req.params.idPro);
      const rows = await consultar(`
        SELECT ID id, LOTE lote, QTD qtd, FABRICACAO fabricacao, VALIDADE validade
        FROM PROLOTES
        WHERE IDPRO = :idPro AND QTD > 0
        ORDER BY LOTE
      `, { idPro });
      res.json(rows.map((r) => ({
        id: Number(r.id),
        lote: String(r.lote || '').trim(),
        qtd: Number(r.qtd || 0),
        fabricacao: r.fabricacao,
        validade: r.validade,
      })));
    } catch (err: any) {
      res.status(err?.status || 500).json({ error: err.message });
    }
  });

  router.post('/producao/lotes', async (req: Request, res: Response) => {
    try {
      const { idPro, lote, fabricacao, validade } = req.body;
      if (!idPro || !lote) return res.status(400).json({ error: 'Informe o produto e o lote.' });

      const existe = await consultarUm(
        `SELECT ID id FROM PROLOTES WHERE IDPRO = :idPro AND LOTE = :lote ORDER BY ID TOP 1`,
        { idPro: Number(idPro), lote: String(lote) },
      );
      if (existe) return res.status(400).json({ error: `Lote '${lote}' já existe para este produto.` });

      const r = await consultar(`
        SELECT ID FROM PROLOTES WHERE ID = -1;
        INSERT INTO PROLOTES (ID_EMPRESA, IDPRO, LOTE, QTD, FABRICACAO, VALIDADE)
        VALUES (${sqlInteiro(config.idEmpresa)}, ${sqlInteiro(idPro)}, ${sqlTexto(lote)},
                0, ${sqlData(fabricacao || hojeISO())}, ${sqlData(validade || hojeISO(365))});
        SELECT ID id FROM PROLOTES ORDER BY ID DESC TOP 1
      `);
      res.json({ ok: true, id: Number(r[0]?.id) });
    } catch (err: any) {
      res.status(err?.status || 500).json({ error: err.message });
    }
  });

  // =====================================================================
  // CENTROS DE CUSTO
  // =====================================================================

  router.get('/producao/cc', async (_req: Request, res: Response) => {
    try {
      const rows = await consultar(`SELECT ID id, DESCRICAO descricao FROM CCUSTOS ORDER BY DESCRICAO TOP 200`);
      res.json(rows.map((r) => ({ id: Number(r.id), descricao: String(r.descricao || '').trim() })));
    } catch (err: any) {
      res.status(err?.status || 500).json({ error: err.message });
    }
  });

  // =====================================================================
  // TÉCNICOS (ESP_WET_TECNICOS)
  // =====================================================================

  router.get('/producao/tecnicos', async (_req: Request, res: Response) => {
    try {
      const rows = await consultar(`
        SELECT A.ID id, A.NOME nome, A.VALOR_HORA valor_hora, A.ID_CC id_cc, B.DESCRICAO descricao_cc
        FROM ESP_WET_TECNICOS A
        LEFT JOIN CCUSTOS B ON B.ID = A.ID_CC
        ORDER BY A.NOME TOP 200
      `);
      res.json(rows.map((r) => ({
        id: Number(r.id),
        nome: String(r.nome || '').trim(),
        valorHora: Number(r.valor_hora || 0),
        idCc: Number(r.id_cc || 0),
        descricaoCc: String(r.descricao_cc || '').trim(),
      })));
    } catch (err: any) {
      res.status(err?.status || 500).json({ error: err.message });
    }
  });

  router.post('/producao/tecnicos', async (req: Request, res: Response) => {
    try {
      const { nome, valorHora, idCc } = req.body;
      if (!nome) return res.status(400).json({ error: 'Informe o nome do técnico.' });
      const r = await consultar(`
        SELECT ID FROM ESP_WET_TECNICOS WHERE ID = -1;
        INSERT INTO ESP_WET_TECNICOS (NOME, VALOR_HORA, ID_CC)
        VALUES (${sqlTexto(nome, 60)}, ${sqlNumero(valorHora || 0)}, ${sqlInteiro(idCc || 0)});
        SELECT ID id FROM ESP_WET_TECNICOS ORDER BY ID DESC TOP 1
      `);
      res.json({ ok: true, id: Number(r[0]?.id) });
    } catch (err: any) {
      res.status(err?.status || 500).json({ error: err.message });
    }
  });

  router.put('/producao/tecnicos/:id', async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { nome, valorHora, idCc } = req.body;
      if (!nome) return res.status(400).json({ error: 'Informe o nome do técnico.' });
      await executar(`
        UPDATE ESP_WET_TECNICOS SET NOME = ${sqlTexto(nome, 60)},
               VALOR_HORA = ${sqlNumero(valorHora || 0)}, ID_CC = ${sqlInteiro(idCc || 0)}
        WHERE ID = ${sqlInteiro(id)}
      `);
      res.json({ ok: true });
    } catch (err: any) {
      res.status(err?.status || 500).json({ error: err.message });
    }
  });

  router.delete('/producao/tecnicos/:id', async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      await executar(`DELETE FROM ESP_WET_TECNICOS WHERE ID = ${sqlInteiro(id)}`);
      res.json({ ok: true });
    } catch (err: any) {
      res.status(err?.status || 500).json({ error: err.message });
    }
  });

  // =====================================================================
  // FICHAS TÉCNICAS / PADRÕES (ESP_WET_PRODUCAO_PADROES)
  // =====================================================================

  router.get('/producao/padroes', async (_req: Request, res: Response) => {
    try {
      const rows = await consultar(`
        SELECT ID id, CODIGO codigo, NOME nome
        FROM ESP_WET_PRODUCAO_PADROES
        ORDER BY NOME TOP 500
      `);
      res.json(rows.map((r) => ({ id: Number(r.id), codigo: String(r.codigo || '').trim(), nome: String(r.nome || '').trim() })));
    } catch (err: any) {
      res.status(err?.status || 500).json({ error: err.message });
    }
  });

  router.get('/producao/padroes/:id/itens', async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const prods = await consultar(`
        SELECT A.ID id, A.TIPO_MOV tipo_mov, A.ID_PRO id_pro, B.DESCRICAO descricao,
               A.QTDADE_UN_CONTROLE qtdade_un_controle, A.CUSTO_TOTAL_UNIT custo_total_unit
        FROM ESP_WET_PRODUCAO_PADROES_PRODUTOS A
        LEFT JOIN PRODUTOSPRINCIPAL B ON B.ID = A.ID_PRO
        WHERE A.ID_PRODUCAO_PADRAO = :id
        ORDER BY A.TIPO_MOV, A.ID
      `, { id });
      const tecs = await consultar(`
        SELECT A.ID id, A.ID_TECNICO id_tecnico, B.NOME nome_tecnico,
               A.HORA_INI hora_ini, A.HORA_FIM hora_fim, A.HORAS_TOTAIS horas_totais,
               A.VALOR_HORA valor_hora, A.VALOR_TOTAL valor_total
        FROM ESP_WET_PRODUCAO_PADROES_TECNICOS A
        LEFT JOIN ESP_WET_TECNICOS B ON B.ID = A.ID_TECNICO
        WHERE A.ID_PRODUCAO_PADRAO = :id
        ORDER BY A.ID
      `, { id });
      res.json({
        produtos: prods.map((r) => ({
          id: Number(r.id), tipoMov: String(r.tipo_mov || '').trim(),
          idPro: Number(r.id_pro), descricao: String(r.descricao || '').trim(),
          qtdadeUnControle: Number(r.qtdade_un_controle || 0), custoTotalUnit: Number(r.custo_total_unit || 0),
        })),
        tecnicos: tecs.map((r) => ({
          id: Number(r.id), idTecnico: Number(r.id_tecnico), nomeTecnico: String(r.nome_tecnico || '').trim(),
          horaIni: r.hora_ini, horaFim: r.hora_fim, horasTotais: Number(r.horas_totais || 0),
          valorHora: Number(r.valor_hora || 0), valorTotal: Number(r.valor_total || 0),
        })),
      });
    } catch (err: any) {
      res.status(err?.status || 500).json({ error: err.message });
    }
  });

  router.post('/producao/padroes', async (req: Request, res: Response) => {
    try {
      const { codigo, nome, produtos, tecnicos } = req.body;
      if (!codigo || !nome) return res.status(400).json({ error: 'Informe o código e o nome do padrão.' });

      // Deletar padrão existente com mesmo código
      await executar(`
        DELETE FROM ESP_WET_PRODUCAO_PADROES_PRODUTOS
        WHERE ID_PRODUCAO_PADRAO IN (SELECT ID FROM ESP_WET_PRODUCAO_PADROES WHERE CODIGO = ${sqlTexto(codigo)})
      `);
      await executar(`DELETE FROM ESP_WET_PRODUCAO_PADROES WHERE CODIGO = ${sqlTexto(codigo)}`);

      const r = await consultar(`
        SELECT ID FROM ESP_WET_PRODUCAO_PADROES WHERE ID = -1;
        INSERT INTO ESP_WET_PRODUCAO_PADROES (CODIGO, NOME) VALUES (${sqlTexto(codigo, 20)}, ${sqlTexto(nome, 60)});
        SELECT ID id FROM ESP_WET_PRODUCAO_PADROES ORDER BY ID DESC TOP 1
      `);
      const idPadrao = Number(r[0]?.id);
      if (!idPadrao) throw new BmapiError('Falha ao criar o padrão de produção.');

      for (const p of (produtos || [])) {
        await executar(`
          INSERT INTO ESP_WET_PRODUCAO_PADROES_PRODUTOS (ID_PRODUCAO_PADRAO, TIPO_MOV, ID_PRO, QTDADE_UN_CONTROLE, CUSTO_TOTAL_UNIT)
          VALUES (${sqlInteiro(idPadrao)}, ${sqlTexto(p.tipoMov || 'S', 1)}, ${sqlInteiro(p.idPro)},
                  ${sqlNumero(p.qtdadeUnControle || 0)}, ${sqlNumero(p.custoTotalUnit || 0)})
        `);
      }
      for (const t of (tecnicos || [])) {
        await executar(`
          INSERT INTO ESP_WET_PRODUCAO_PADROES_TECNICOS (ID_PRODUCAO_PADRAO, ID_TECNICO, HORA_INI, HORA_FIM, HORAS_TOTAIS, VALOR_HORA, VALOR_TOTAL)
          VALUES (${sqlInteiro(idPadrao)}, ${sqlInteiro(t.idTecnico)},
                  ${sqlTexto(t.horaIni || '00:00')}, ${sqlTexto(t.horaFim || '00:00')},
                  ${sqlNumero(t.horasTotais || 0)}, ${sqlNumero(t.valorHora || 0)}, ${sqlNumero(t.valorTotal || 0)})
        `);
      }

      res.json({ ok: true, id: idPadrao });
    } catch (err: any) {
      res.status(err?.status || 500).json({ error: err.message });
    }
  });

  router.delete('/producao/padroes/:id', async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      await executar(`DELETE FROM ESP_WET_PRODUCAO_PADROES_TECNICOS WHERE ID_PRODUCAO_PADRAO = ${sqlInteiro(id)}`);
      await executar(`DELETE FROM ESP_WET_PRODUCAO_PADROES_PRODUTOS WHERE ID_PRODUCAO_PADRAO = ${sqlInteiro(id)}`);
      await executar(`DELETE FROM ESP_WET_PRODUCAO_PADROES WHERE ID = ${sqlInteiro(id)}`);
      res.json({ ok: true });
    } catch (err: any) {
      res.status(err?.status || 500).json({ error: err.message });
    }
  });

  // =====================================================================
  // CAPTURA DE DAV (ORCAMENTOM / ORCAMENTOP)
  // =====================================================================

  router.get('/producao/davs', async (req: Request, res: Response) => {
    try {
      const d1 = String(req.query.d1 || hojeISO(-30));
      const d2 = String(req.query.d2 || hojeISO());
      const idDav = req.query.id ? Number(req.query.id) : null;

      let filtroId = '';
      if (idDav) filtroId = `AND B.ID = ${sqlInteiro(idDav)}`;

      const rows = await consultar(`
        SELECT A.ID_PRODUTO id_produto, C.DESCRICAO descricao, SUM(A.QTDADE) qtd_total, C.UNVENDA unvenda
        FROM ORCAMENTOP A
        LEFT JOIN ORCAMENTOM B ON B.ID = A.ID_ORC
        LEFT JOIN PRODUTOSPRINCIPAL C ON C.ID = A.ID_PRODUTO
        WHERE B.DATA BETWEEN :d1 AND :d2 ${filtroId}
        GROUP BY A.ID_PRODUTO, C.DESCRICAO, C.UNVENDA
        ORDER BY C.DESCRICAO
      `, { d1, d2 });
      res.json(rows.map((r) => ({
        idProduto: Number(r.id_produto),
        descricao: String(r.descricao || '').trim(),
        qtdTotal: Number(r.qtd_total || 0),
        unvenda: String(r.unvenda || '').trim(),
      })));
    } catch (err: any) {
      res.status(err?.status || 500).json({ error: err.message });
    }
  });

  // =====================================================================
  // CAPTURA DE OS (OSM / OSP)
  // =====================================================================

  router.get('/producao/os', async (req: Request, res: Response) => {
    try {
      const d1 = String(req.query.d1 || hojeISO(-30));
      const d2 = String(req.query.d2 || hojeISO());
      const rows = await consultar(`
        SELECT A.ID id, A.GERACAO_DATA data, B.NOME nome_cliente, A.COMPLEMENTO complemento, A.CAPTURADO capturado
        FROM OSM A
        LEFT JOIN PESSOAS B ON B.ID = A.ID_CLIENTE
        WHERE A.GERACAO_DATA BETWEEN :d1 AND :d2
        ORDER BY A.ID DESC TOP 100
      `, { d1, d2 });
      res.json(rows.map((r) => ({
        id: Number(r.id),
        data: r.data,
        nomeCliente: String(r.nome_cliente || '').trim(),
        complemento: String(r.complemento || '').trim(),
        capturado: String(r.capturado || 'N').trim(),
      })));
    } catch (err: any) {
      res.status(err?.status || 500).json({ error: err.message });
    }
  });

  router.get('/producao/os/:id/produtos', async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const rows = await consultar(`
        SELECT A.ID id, A.ID_PRO id_pro, B.DESCRICAO descricao, A.QTDADE qtdade
        FROM OSP A
        LEFT JOIN PRODUTOSPRINCIPAL B ON B.ID = A.ID_PRO
        WHERE A.ID_OS = :id
        ORDER BY A.ID
      `, { id });
      res.json(rows.map((r) => ({
        id: Number(r.id),
        idPro: Number(r.id_pro),
        descricao: String(r.descricao || '').trim(),
        qtdade: Number(r.qtdade || 0),
      })));
    } catch (err: any) {
      res.status(err?.status || 500).json({ error: err.message });
    }
  });

  // =====================================================================
  // RELATÓRIO DE PRODUÇÃO
  // =====================================================================

  router.get('/producao/relatorio', async (req: Request, res: Response) => {
    try {
      const d1 = String(req.query.d1 || hojeISO(-30));
      const d2 = String(req.query.d2 || hojeISO());
      const rows = await consultar(`
        SELECT
          A.ID id, A.ID_PRODUCAO id_producao, A.DATA data, A.TIPO_MOV tipo_mov,
          C.TIPO tipo_pro, A.ID_PRO id_pro, C.DESCRICAO descricao_produto,
          A.QTDADE_UN_CONTROLE qtdade_un_controle, B.UN_CONTROLE un_controle,
          A.QTDADE_UN_ESTOQUE qtdade_un_estoque, B.UN_ESTOQUE un_estoque,
          A.CUSTO_TOTAL_UNIT custo_total_unit, A.CUSTO_TOTAL_TOTAL custo_total_total,
          A.LOTE lote
        FROM ESP_WET_PRODUCAO_PRODUTOS A
        LEFT JOIN ESP_WET_PRODUTOS B ON B.ID_PRO = A.ID_PRO
        LEFT JOIN PRODUTOSPRINCIPAL C ON C.ID = A.ID_PRO
        LEFT JOIN ESP_WET_PRODUCAO_OP D ON D.ID = A.ID_PRODUCAO
        WHERE D.DATA BETWEEN :d1 AND :d2
        ORDER BY A.ID_PRODUCAO, A.TIPO_MOV
        TOP 2000
      `, { d1, d2 });
      const horas = await consultar(`
        SELECT
          A.ID id, A.ID_PRODUCAO id_producao, A.ID_TECNICO id_tecnico, B.NOME nome,
          A.HORA_INI hora_ini, A.HORA_FIM hora_fim, A.HORAS_TOTAIS horas_totais,
          A.VALOR_HORA valor_hora, A.VALOR_TOTAL valor_total
        FROM ESP_WET_PRODUCAO_TECNICOS A
        LEFT JOIN ESP_WET_TECNICOS B ON B.ID = A.ID_TECNICO
        LEFT JOIN ESP_WET_PRODUCAO_OP D ON D.ID = A.ID_PRODUCAO
        WHERE D.DATA BETWEEN :d1 AND :d2
        ORDER BY A.ID_PRODUCAO, A.ID
        TOP 2000
      `, { d1, d2 });
      res.json({ producao: rows, horas });
    } catch (err: any) {
      res.status(err?.status || 500).json({ error: err.message });
    }
  });

  return router;
}

import { valorGuardadoMeta } from "./metas";
import { gerarParcelas, parcelaNoMes } from "./financiamento";

export function chaveMes(ano, mes) {
  return `${ano}-${mes}`;
}

function filtrarMes(lista, ano, mes) {
  const resultado = [];
  for (let i = 0; i < lista.length; i++) {
    const m = lista[i];
    const d = m.data.toDate();
    if (d.getFullYear() === ano && d.getMonth() === mes) {
      resultado.push(m);
    }
  }
  return resultado;
}

function somaTipoNoMes(movimentacoes, tipo, ano, mes) {
  const doMes = filtrarMes(movimentacoes, ano, mes);
  let total = 0;
  for (let i = 0; i < doMes.length; i++) {
    if (doMes[i].tipo === tipo) {
      total = total + doMes[i].valor;
    }
  }
  return total;
}

function transferidoParaMetaNoMes(movimentacoes, metaId, ano, mes) {
  const doMes = filtrarMes(movimentacoes, ano, mes);
  let total = 0;
  for (let i = 0; i < doMes.length; i++) {
    const m = doMes[i];
    if (m.metaId === metaId) {
      if (m.tipo === "transferencia") {
        total = total + m.valor;
      } else if (m.tipo === "resgate") {
        total = total - m.valor;
      }
    }
  }
  return total;
}

// Média mensal histórica, usada como projeção para meses futuros que ainda
// não têm movimentações lançadas.
function mediaHistoricaMensal(movimentacoes, tipo, antesDe) {
  const historico = [];
  for (let i = 0; i < movimentacoes.length; i++) {
    const m = movimentacoes[i];
    if (m.tipo === tipo && m.data.toDate() < antesDe) {
      historico.push(m);
    }
  }
  if (historico.length === 0) {
    return 0;
  }

  // conta quantos meses diferentes aparecem no histórico, e soma os valores
  const mesesVistos = {};
  let total = 0;
  for (let i = 0; i < historico.length; i++) {
    const m = historico[i];
    const d = m.data.toDate();
    const chave = chaveMes(d.getFullYear(), d.getMonth());
    mesesVistos[chave] = true;
    total = total + m.valor;
  }
  const quantidadeMeses = Object.keys(mesesVistos).length;
  return total / quantidadeMeses;
}

// Planejamento mês a mês até a data-limite da meta: distribui, de forma
// proporcional à receita prevista de cada mês, o valor que ainda falta
// guardar (meses com mais renda prevista contribuem mais). As parcelas de
// financiamento ativas em cada mês entram como despesa projetada.
//
// Fechamento manual de mês: meta.mesesFechados guarda as chaves ("ano-mes")
// dos meses que o usuário já fechou. Um mês fechado tem seu aporte travado
// no que foi realmente transferido (não entra mais na conta de "recomendado"),
// e o valor que falta é redistribuído automaticamente só entre os meses
// ainda abertos.
export function calcularPlanejamento({
  meta,
  movimentacoes,
  financiamentos,
  hoje = new Date(),
}) {
  if (!meta) {
    return { meses: [], valorFaltante: 0, viavel: true, mensagem: "" };
  }

  const mesesFechados = meta.mesesFechados ?? [];

  const inicioMesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const limite = meta.dataLimite.toDate();
  const fimMes = new Date(limite.getFullYear(), limite.getMonth(), 1);

  const mesesRange = [];
  const cursor = new Date(inicioMesAtual);
  while (cursor <= fimMes) {
    mesesRange.push({ ano: cursor.getFullYear(), mes: cursor.getMonth() });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const valorGuardado = valorGuardadoMeta(movimentacoes, meta.id);
  let valorFaltante = meta.valorAlvo - valorGuardado;
  if (valorFaltante < 0) {
    valorFaltante = 0;
  }

  const listaFinanciamentos = financiamentos ?? [];
  const parcelasPorFinanciamento = [];
  for (let i = 0; i < listaFinanciamentos.length; i++) {
    const financiamento = listaFinanciamentos[i];
    parcelasPorFinanciamento.push({
      financiamento,
      parcelas: gerarParcelas(financiamento),
    });
  }

  const infoMeses = [];
  for (let i = 0; i < mesesRange.length; i++) {
    const ano = mesesRange[i].ano;
    const mes = mesesRange[i].mes;
    const dataMes = new Date(ano, mes, 1);
    const temDadosReais = dataMes <= inicioMesAtual;
    // Só um mês que já tem dado real pode estar fechado (não dá pra fechar
    // um mês futuro que ainda não aconteceu).
    const fechado = temDadosReais && mesesFechados.indexOf(chaveMes(ano, mes)) !== -1;

    const receitaReal = somaTipoNoMes(movimentacoes, "receita", ano, mes);
    const despesaReal = somaTipoNoMes(movimentacoes, "despesa", ano, mes);

    let receitaPrevista;
    if (temDadosReais && receitaReal > 0) {
      receitaPrevista = receitaReal;
    } else {
      receitaPrevista = mediaHistoricaMensal(movimentacoes, "receita", hoje);
    }

    let despesaBase;
    if (temDadosReais && despesaReal > 0) {
      despesaBase = despesaReal;
    } else {
      despesaBase = mediaHistoricaMensal(movimentacoes, "despesa", hoje);
    }

    let parcelasDoMes = 0;
    for (let j = 0; j < parcelasPorFinanciamento.length; j++) {
      const item = parcelasPorFinanciamento[j];
      parcelasDoMes = parcelasDoMes + parcelaNoMes(item.financiamento, item.parcelas, ano, mes);
    }

    infoMeses.push({
      ano,
      mes,
      receitaPrevista,
      despesaProjetada: despesaBase + parcelasDoMes,
      parcelasFinanciamento: parcelasDoMes,
      temDadosReais,
      fechado,
    });
  }

  // Só os meses ainda abertos disputam o rateio do valor que falta.
  const mesesAbertos = [];
  for (let i = 0; i < infoMeses.length; i++) {
    if (!infoMeses[i].fechado) {
      mesesAbertos.push(infoMeses[i]);
    }
  }
  let somaReceitaPrevistaAbertos = 0;
  for (let i = 0; i < mesesAbertos.length; i++) {
    somaReceitaPrevistaAbertos = somaReceitaPrevistaAbertos + mesesAbertos[i].receitaPrevista;
  }

  let risco = false;
  const meses = [];
  for (let i = 0; i < infoMeses.length; i++) {
    const info = infoMeses[i];

    if (info.fechado) {
      const aporteReal = transferidoParaMetaNoMes(movimentacoes, meta.id, info.ano, info.mes);
      meses.push({
        ano: info.ano,
        mes: info.mes,
        receitaPrevista: info.receitaPrevista,
        despesaProjetada: info.despesaProjetada,
        parcelasFinanciamento: info.parcelasFinanciamento,
        aporteRecomendado: aporteReal,
        limiteGastos: info.receitaPrevista - aporteReal - info.parcelasFinanciamento,
        aporteReal,
        status: "fechado",
        fechavel: false,
      });
      continue;
    }

    let proporcao;
    if (somaReceitaPrevistaAbertos > 0) {
      proporcao = info.receitaPrevista / somaReceitaPrevistaAbertos;
    } else {
      proporcao = 1 / mesesAbertos.length;
    }
    const aporteRecomendado = valorFaltante * proporcao;
    // A parcela de financiamento é um compromisso já assumido: sai do
    // limite de gastos livres do mês, junto com o valor reservado pra meta.
    const limiteGastos = info.receitaPrevista - aporteRecomendado - info.parcelasFinanciamento;

    let aporteReal = null;
    if (info.temDadosReais) {
      aporteReal = transferidoParaMetaNoMes(movimentacoes, meta.id, info.ano, info.mes);
    }

    if (aporteRecomendado + info.parcelasFinanciamento > info.receitaPrevista) {
      risco = true;
    }

    let status;
    if (!info.temDadosReais) {
      status = "futuro";
    } else if (aporteRecomendado <= 0) {
      status = "cumprido";
    } else if (aporteReal >= aporteRecomendado) {
      status = "cumprido";
    } else if (aporteReal > 0) {
      status = "parcial";
    } else {
      status = "pendente";
    }

    meses.push({
      ano: info.ano,
      mes: info.mes,
      receitaPrevista: info.receitaPrevista,
      despesaProjetada: info.despesaProjetada,
      parcelasFinanciamento: info.parcelasFinanciamento,
      aporteRecomendado,
      limiteGastos,
      aporteReal,
      status,
      // só o mês atual (o primeiro com dado real, ainda aberto) pode ser
      // fechado por vez, pra não pular meses sem fechar os anteriores.
      fechavel: info.temDadosReais,
    });
  }

  let mensagem = "";
  if (risco) {
    mensagem =
      "Em pelo menos um mês, o valor recomendado pra guardar é maior que a receita prevista. No ritmo atual, a meta corre risco de não ser cumprida no prazo.";
  }

  return {
    meses,
    valorFaltante,
    viavel: !risco,
    mensagem,
  };
}

// Convenção de sinal: receita e resgate aumentam o saldo; despesa e
// transferência (pra meta) diminuem. Transferência/resgate não contam
// como receita/despesa nos KPIs do mês, só afetam o saldo.
export function valorComSinal(m) {
  if (m.tipo === "receita" || m.tipo === "resgate") {
    return m.valor;
  }
  if (m.tipo === "despesa" || m.tipo === "transferencia") {
    return -m.valor;
  }
  return 0;
}

export function calcularSaldoAcumulado(movimentacoes, ateData = new Date()) {
  let total = 0;
  for (let i = 0; i < movimentacoes.length; i++) {
    const m = movimentacoes[i];
    if (m.data.toDate() <= ateData) {
      total = total + valorComSinal(m);
    }
  }
  return total;
}

export function movimentacoesDoMes(movimentacoes, ano, mes) {
  const resultado = [];
  for (let i = 0; i < movimentacoes.length; i++) {
    const m = movimentacoes[i];
    const d = m.data.toDate();
    if (d.getFullYear() === ano && d.getMonth() === mes) {
      resultado.push(m);
    }
  }
  return resultado;
}

export function calcularKPIsMes(movimentacoes, ano, mes) {
  const doMes = movimentacoesDoMes(movimentacoes, ano, mes);
  let receitas = 0;
  let despesas = 0;
  for (let i = 0; i < doMes.length; i++) {
    const m = doMes[i];
    if (m.tipo === "receita") {
      receitas = receitas + m.valor;
    }
    if (m.tipo === "despesa") {
      despesas = despesas + m.valor;
    }
  }
  return { receitas, despesas, economia: receitas - despesas };
}

// Saldo líquido de UM mês isolado (não é o acumulado histórico): base para
// decidir quanto desse mês específico pode ser transferido pra uma meta.
export function calcularSaldoMes(movimentacoes, ano, mes) {
  const doMes = movimentacoesDoMes(movimentacoes, ano, mes);
  let total = 0;
  for (let i = 0; i < doMes.length; i++) {
    total = total + valorComSinal(doMes[i]);
  }
  return total;
}

// Economia média mensal histórica (receitas - despesas - transferências +
// resgates por mês, em média). Usada pra projetar meses futuros sem dados.
export function calcularEconomiaMediaMensal(movimentacoes) {
  if (movimentacoes.length === 0) {
    return 0;
  }

  // soma o total de cada mês num objeto, usando "ano-mes" como chave
  const totalPorMes = {};
  for (let i = 0; i < movimentacoes.length; i++) {
    const m = movimentacoes[i];
    const d = m.data.toDate();
    const chave = d.getFullYear() + "-" + d.getMonth();
    if (totalPorMes[chave] === undefined) {
      totalPorMes[chave] = 0;
    }
    totalPorMes[chave] = totalPorMes[chave] + valorComSinal(m);
  }

  const chaves = Object.keys(totalPorMes);
  let soma = 0;
  for (let i = 0; i < chaves.length; i++) {
    soma = soma + totalPorMes[chaves[i]];
  }
  return soma / chaves.length;
}

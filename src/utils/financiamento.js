// Tabela Price: parcelas fixas, juros decrescente e amortização crescente.
export function gerarParcelasPrice(valorFinanciado, taxaMensal, numParcelas) {
  const i = taxaMensal;
  const pmt =
    i === 0
      ? valorFinanciado / numParcelas
      : (valorFinanciado * i) / (1 - Math.pow(1 + i, -numParcelas));

  let saldoDevedor = valorFinanciado;
  const parcelas = [];
  for (let n = 1; n <= numParcelas; n++) {
    const juros = saldoDevedor * i;
    const amortizacao = pmt - juros;
    saldoDevedor = Math.max(0, saldoDevedor - amortizacao);
    parcelas.push({ numero: n, valor: pmt, juros, amortizacao, saldoDevedor });
  }
  return parcelas;
}

// Tabela SAC: amortização constante, parcela e juros decrescentes.
export function gerarParcelasSAC(valorFinanciado, taxaMensal, numParcelas) {
  const amortizacao = valorFinanciado / numParcelas;
  let saldoDevedor = valorFinanciado;
  const parcelas = [];
  for (let n = 1; n <= numParcelas; n++) {
    const juros = saldoDevedor * taxaMensal;
    const valor = amortizacao + juros;
    saldoDevedor = Math.max(0, saldoDevedor - amortizacao);
    parcelas.push({ numero: n, valor, juros, amortizacao, saldoDevedor });
  }
  return parcelas;
}

export function gerarParcelas(financiamento) {
  if (financiamento.sistema === "SAC") {
    return gerarParcelasSAC(
      financiamento.valorFinanciado,
      financiamento.taxaJurosMensal,
      financiamento.numParcelas
    );
  }
  return gerarParcelasPrice(
    financiamento.valorFinanciado,
    financiamento.taxaJurosMensal,
    financiamento.numParcelas
  );
}

// Valor da parcela de um financiamento num mês/ano específico (0 se o
// financiamento ainda não começou ou já terminou naquele mês).
export function parcelaNoMes(financiamento, parcelas, ano, mes) {
  const inicio = financiamento.dataInicio.toDate();
  const indice =
    (ano - inicio.getFullYear()) * 12 + (mes - inicio.getMonth());
  const parcela = parcelas[indice];
  return parcela ? parcela.valor : 0;
}

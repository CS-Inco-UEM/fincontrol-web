// Uma meta "cresce" só por transferência real de saldo (nunca valor mágico),
// e "encolhe" por resgate. Por isso o valor guardado é sempre derivado das
// movimentações vinculadas à meta (campo metaId), nunca um número solto.
export function valorGuardadoMeta(movimentacoes, metaId) {
  let total = 0;
  for (let i = 0; i < movimentacoes.length; i++) {
    const m = movimentacoes[i];
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

export function mesesRestantes(meta, hoje = new Date()) {
  const limite = meta.dataLimite.toDate();
  const diff =
    (limite.getFullYear() - hoje.getFullYear()) * 12 +
    (limite.getMonth() - hoje.getMonth());
  if (diff < 1) {
    return 1;
  }
  return diff;
}

export function indicadoresMeta(meta, movimentacoes, hoje = new Date()) {
  const guardado = valorGuardadoMeta(movimentacoes, meta.id);

  let faltante = meta.valorAlvo - guardado;
  if (faltante < 0) {
    faltante = 0;
  }

  const restantes = mesesRestantes(meta, hoje);

  let progresso = 0;
  if (meta.valorAlvo > 0) {
    progresso = guardado / meta.valorAlvo;
    if (progresso > 1) {
      progresso = 1;
    }
  }

  return {
    guardado,
    faltante,
    progresso,
    mesesRestantes: restantes,
    economiaMensalNecessaria: faltante / restantes,
  };
}

// A "meta principal" (exibida com destaque na Visão geral) é a mais urgente:
// a que tem a data-limite mais próxima.
export function metaPrincipal(metas) {
  if (metas.length === 0) {
    return null;
  }
  let maisProxima = metas[0];
  for (let i = 1; i < metas.length; i++) {
    if (metas[i].dataLimite.toMillis() < maisProxima.dataLimite.toMillis()) {
      maisProxima = metas[i];
    }
  }
  return maisProxima;
}

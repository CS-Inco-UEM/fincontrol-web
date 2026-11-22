import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import GraficoFluxo from "../components/GraficoFluxo";
import { ouvirMovimentacoes } from "../services/movimentacoesService";
import { ouvirMetas } from "../services/metasService";
import { calcularKPIsMes, calcularSaldoAcumulado } from "../utils/saldo";
import { indicadoresMeta, metaPrincipal } from "../utils/metas";

const moeda = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const NOME_MES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];
const NOME_MES_ABREV = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

function fimDoMes(ano, mes) {
  return new Date(ano, mes + 1, 0, 23, 59, 59);
}

export default function VisaoGeral() {
  const { user } = useAuth();
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [metas, setMetas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const [mesSelecionado, setMesSelecionado] = useState(() => {
    const hoje = new Date();
    return { ano: hoje.getFullYear(), mes: hoje.getMonth() };
  });

  useEffect(() => {
    return ouvirMovimentacoes(user.uid, (lista) => {
      setMovimentacoes(lista);
      setCarregando(false);
    }, () => setCarregando(false));
  }, [user.uid]);

  useEffect(() => {
    return ouvirMetas(user.uid, setMetas, () => {});
  }, [user.uid]);

  function mudarMes(delta) {
    setMesSelecionado(({ ano, mes }) => {
      const d = new Date(ano, mes + delta, 1);
      return { ano: d.getFullYear(), mes: d.getMonth() };
    });
  }

  function irParaHoje() {
    const hoje = new Date();
    setMesSelecionado({ ano: hoje.getFullYear(), mes: hoje.getMonth() });
  }

  const { ano, mes } = mesSelecionado;
  const saldo = calcularSaldoAcumulado(movimentacoes, fimDoMes(ano, mes));
  const kpis = calcularKPIsMes(movimentacoes, ano, mes);

  const inicioMesAtual = new Date(ano, mes, 1);
  const existeHistoricoAnterior = movimentacoes.some((m) => m.data.toDate() < inicioMesAtual);
  const mesAnterior = new Date(ano, mes - 1, 1);
  const saldoAnterior = existeHistoricoAnterior
    ? calcularSaldoAcumulado(movimentacoes, fimDoMes(mesAnterior.getFullYear(), mesAnterior.getMonth()))
    : null;
  const variacao =
    saldoAnterior !== null && saldoAnterior !== 0
      ? ((saldo - saldoAnterior) / Math.abs(saldoAnterior)) * 100
      : null;

  const meta = metaPrincipal(metas);
  const indMeta = meta ? indicadoresMeta(meta, movimentacoes) : null;

  // O gráfico só mostra os meses que realmente têm alguma movimentação
  // lançada. Sem nenhum lançamento ainda, mostra uma janela padrão (os
  // últimos 6 meses) só pra não ficar em branco; com histórico muito longo,
  // limita aos últimos 12 meses com dado, pra não poluir o gráfico.
  const chavesVistas = {};
  for (let i = 0; i < movimentacoes.length; i++) {
    const d = movimentacoes[i].data.toDate();
    const chave = d.getFullYear() * 12 + d.getMonth();
    chavesVistas[chave] = true;
  }
  const chavesComDadosArr = [];
  for (const chave in chavesVistas) {
    chavesComDadosArr.push(Number(chave));
  }

  let chavesReais;
  if (chavesComDadosArr.length === 0) {
    const referencia = ano * 12 + mes;
    chavesReais = [];
    for (let i = 0; i < 6; i++) {
      chavesReais.push(referencia - 5 + i);
    }
  } else {
    let minimo = chavesComDadosArr[0];
    let maximo = chavesComDadosArr[0];
    for (let i = 1; i < chavesComDadosArr.length; i++) {
      if (chavesComDadosArr[i] < minimo) {
        minimo = chavesComDadosArr[i];
      }
      if (chavesComDadosArr[i] > maximo) {
        maximo = chavesComDadosArr[i];
      }
    }
    const todas = [];
    for (let k = minimo; k <= maximo; k++) todas.push(k);
    chavesReais = todas.length > 12 ? todas.slice(-12) : todas;
  }

  // Projeção: só faz sentido havendo histórico de verdade pra tirar uma
  // média. Estende 3 meses além do último mês real, com a média histórica
  // de receitas/despesas (nunca invade meses passados nem reais).
  const QTD_PROJETADOS = chavesComDadosArr.length > 0 ? 3 : 0;
  let mediaReceitas = 0;
  let mediaDespesas = 0;
  if (QTD_PROJETADOS > 0) {
    let somaReceitas = 0;
    let somaDespesas = 0;
    for (let i = 0; i < chavesComDadosArr.length; i++) {
      const k = chavesComDadosArr[i];
      const kpiDoMes = calcularKPIsMes(movimentacoes, Math.floor(k / 12), k % 12);
      somaReceitas = somaReceitas + kpiDoMes.receitas;
      somaDespesas = somaDespesas + kpiDoMes.despesas;
    }
    mediaReceitas = somaReceitas / chavesComDadosArr.length;
    mediaDespesas = somaDespesas / chavesComDadosArr.length;
  }
  const ultimaChaveReal = chavesReais[chavesReais.length - 1];
  const chavesProjetadas = [];
  for (let i = 0; i < QTD_PROJETADOS; i++) {
    chavesProjetadas.push(ultimaChaveReal + i + 1);
  }

  const chavesSerie = [];
  for (let i = 0; i < chavesReais.length; i++) {
    chavesSerie.push(chavesReais[i]);
  }
  for (let i = 0; i < chavesProjetadas.length; i++) {
    chavesSerie.push(chavesProjetadas[i]);
  }

  const serie = chavesSerie.map((chave, i) => {
    const anoSerie = Math.floor(chave / 12);
    const mesSerie = chave % 12;
    const ehProjetado = i >= chavesReais.length;
    let k;
    if (ehProjetado) {
      k = { receitas: mediaReceitas, despesas: mediaDespesas };
    } else {
      k = calcularKPIsMes(movimentacoes, anoSerie, mesSerie);
    }
    return {
      label: `${NOME_MES_ABREV[mesSerie]}/${String(anoSerie).slice(2)}`,
      receitas: k.receitas,
      despesas: k.despesas,
    };
  });

  return (
    <Layout
      titulo="Visão geral"
      subtitulo={`Olá, ${user.displayName?.split(" ")[0] ?? ""}. Acompanhe sua saúde financeira.`}
      acoes={
        <>
          <button className="botao-secundario" onClick={() => mudarMes(-1)}>◀</button>
          <strong>{NOME_MES[mes]} de {ano}</strong>
          <button className="botao-secundario" onClick={() => mudarMes(1)}>▶</button>
          <button className="botao-secundario" onClick={irParaHoje}>Hoje</button>
        </>
      }
    >
      {carregando ? (
        <div className="resumo-grade">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="resumo-item">
              <div className="skeleton skeleton-linha" style={{ width: "60%" }} />
              <div className="skeleton skeleton-linha" style={{ width: "40%", height: 22 }} />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="resumo-grade">
            <div className="resumo-item">
              <span className="resumo-rotulo">Saldo disponível</span>
              <div className="resumo-valor">{moeda(saldo)}</div>
              {variacao !== null && (
                <div className={"resumo-variacao " + (variacao >= 0 ? "texto-sucesso" : "texto-perigo")}>
                  {variacao >= 0 ? "↑" : "↓"} {Math.abs(variacao).toFixed(1)}% neste mês
                </div>
              )}
            </div>
            <div className="resumo-item">
              <span className="resumo-rotulo">Receitas do mês</span>
              <div className="resumo-valor texto-sucesso">{moeda(kpis.receitas)}</div>
            </div>
            <div className="resumo-item">
              <span className="resumo-rotulo">Despesas do mês</span>
              <div className="resumo-valor texto-perigo">{moeda(kpis.despesas)}</div>
            </div>
            <div className="resumo-item">
              <span className="resumo-rotulo">Economia do mês</span>
              <div className={"resumo-valor " + (kpis.economia >= 0 ? "texto-sucesso" : "texto-perigo")}>
                {moeda(kpis.economia)}
              </div>
            </div>
          </div>

          <div className="cartao" style={{ marginBottom: 16 }}>
            <div className="cartao-cabecalho">
              <h2>Fluxo financeiro</h2>
            </div>
            <GraficoFluxo dados={serie} qtdProjetados={QTD_PROJETADOS} />
          </div>

          {meta && indMeta && (
            <div className="cartao">
              <div className="cartao-cabecalho">
                <h3>Progresso da meta "{meta.nome}"</h3>
              </div>
              <div className="barra-fundo">
                <div className="barra-preenchida" style={{ width: `${indMeta.progresso * 100}%` }} />
              </div>
              <p className="texto-fraco" style={{ marginTop: 8, marginBottom: 0 }}>
                {moeda(indMeta.guardado)} guardado de {moeda(meta.valorAlvo)} · falta{" "}
                {moeda(indMeta.faltante)} · previsão de conclusão em{" "}
                {meta.dataLimite.toDate().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
              </p>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}

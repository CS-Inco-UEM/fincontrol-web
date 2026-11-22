// gráfico de linha simples, desenhado à mão em svg (sem biblioteca de gráficos).
// Os últimos `qtdProjetados` pontos são projeção (média histórica), não dado
// real, e aparecem tracejados pra não serem confundidos com o resto.
export default function GraficoFluxo({ dados, qtdProjetados = 0 }) {
  if (!dados || dados.length === 0) return null;

  const largura = 600;
  const altura = 170;
  const margem = 8;
  const indiceCorte = dados.length - 1 - qtdProjetados;

  let maximo = 1;
  for (let i = 0; i < dados.length; i++) {
    if (dados[i].receitas > maximo) {
      maximo = dados[i].receitas;
    }
    if (dados[i].despesas > maximo) {
      maximo = dados[i].despesas;
    }
  }

  function coordenadas(chave) {
    const pontos = [];
    for (let i = 0; i < dados.length; i++) {
      const x = margem + (i / Math.max(1, dados.length - 1)) * (largura - margem * 2);
      const y = altura - margem - (dados[i][chave] / maximo) * (altura - margem * 2);
      pontos.push([x, y]);
    }
    return pontos;
  }

  function linha(chave, cor) {
    const todos = coordenadas(chave);
    const reais = todos.slice(0, indiceCorte + 1);
    const projetados = todos.slice(indiceCorte);
    return (
      <>
        <polyline
          points={reais.map((p) => p.join(",")).join(" ")}
          fill="none" stroke={cor} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        />
        {qtdProjetados > 0 && (
          <polyline
            points={projetados.map((p) => p.join(",")).join(" ")}
            fill="none" stroke={cor} strokeWidth="2.5" strokeDasharray="5 5"
            strokeLinecap="round" strokeLinejoin="round" opacity="0.6"
          />
        )}
      </>
    );
  }

  return (
    <div className="grafico-caixa">
      <svg viewBox={`0 0 ${largura} ${altura}`} width="100%" height={altura} preserveAspectRatio="none">
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={0}
            x2={largura}
            y1={altura - margem - f * (altura - margem * 2)}
            y2={altura - margem - f * (altura - margem * 2)}
            stroke="#262a33"
            strokeWidth="1"
          />
        ))}
        {linha("receitas", "#34d399")}
        {linha("despesas", "#f87171")}
      </svg>
      <div className="eixo-x">
        {dados.map((d, i) => (
          <span key={d.label} className={i > indiceCorte ? "texto-fraco" : ""}>{d.label}</span>
        ))}
      </div>
      <div className="grafico-legenda">
        <span><i className="legenda-ponto" style={{ background: "#34d399" }} />Receitas</span>
        <span><i className="legenda-ponto" style={{ background: "#f87171" }} />Despesas</span>
        {qtdProjetados > 0 && <span className="texto-fraco">┄ Projeção (média histórica)</span>}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import EstadoVazio from "../components/EstadoVazio";
import { fecharMes, ouvirMetas } from "../services/metasService";
import { ouvirMovimentacoes } from "../services/movimentacoesService";
import { ouvirFinanciamentos } from "../services/financiamentosService";
import { metaPrincipal } from "../utils/metas";
import { calcularPlanejamento } from "../utils/planejamento";

const moeda = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const NOME_MES_ABREV = [
  "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

const ROTULO_STATUS = {
  cumprido: "Cumprido",
  parcial: "Parcial",
  pendente: "Pendente",
  futuro: "Futuro",
  fechado: "Fechado",
};

export default function Planejamento() {
  const { user } = useAuth();
  const [metas, setMetas] = useState([]);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [financiamentos, setFinanciamentos] = useState([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    return ouvirMetas(user.uid, setMetas, () => {});
  }, [user.uid]);

  useEffect(() => {
    return ouvirMovimentacoes(user.uid, setMovimentacoes, () => {});
  }, [user.uid]);

  useEffect(() => {
    return ouvirFinanciamentos(user.uid, setFinanciamentos, () => {});
  }, [user.uid]);

  const meta = metaPrincipal(metas);
  const plano = calcularPlanejamento({ meta, movimentacoes, financiamentos });

  // Mês futuro ainda não tem lançamento nenhum, então o valor recomendado é
  // sempre a mesma média histórica — como card, isso vira uma fileira de
  // cartões repetidos; como tabela compacta, fica claro que é só projeção.
  const mesesComDados = plano.meses.filter((m) => m.status !== "futuro");
  const mesesFuturos = plano.meses.filter((m) => m.status === "futuro");

  async function handleFecharMes(ano, mes) {
    if (!meta) return;
    if (
      !window.confirm(
        "Fechar este mês? O valor recomendado fica travado no que foi realmente transferido, e o restante é redistribuído entre os próximos meses."
      )
    ) {
      return;
    }
    try {
      await fecharMes(user.uid, meta.id, ano, mes);
    } catch (e) {
      console.error(e);
      setErro("Não foi possível fechar o mês.");
    }
  }

  return (
    <Layout titulo="Planejamento" subtitulo="Distribuição mensal do valor necessário até a meta em destaque.">
      {erro && <p className="erro" style={{ marginBottom: 12 }}>{erro}</p>}

      {!meta ? (
        <div className="cartao">
          <EstadoVazio
            titulo="Nenhuma meta pra planejar"
            descricao="Cadastre uma meta na tela de Metas pra ver a distribuição mensal aqui."
          />
        </div>
      ) : (
        <>
          <p style={{ marginBottom: 16 }}>
            Considerando a meta <strong>{meta.nome}</strong>, ainda falta {moeda(plano.valorFaltante)}.
          </p>
          {plano.mensagem && <p className="erro" style={{ marginBottom: 16 }}>{plano.mensagem}</p>}

          {mesesComDados.length > 0 && (
            <div className="grade-cartoes" style={{ marginBottom: mesesFuturos.length > 0 ? 20 : 0 }}>
              {mesesComDados.map((m) => {
                let progresso = 0;
                if (m.limiteGastos > 0) {
                  progresso = m.gastoReal / m.limiteGastos;
                  if (progresso > 1) {
                    progresso = 1;
                  }
                }

                let classeGasto = "";
                if (m.gastoReal > m.limiteGastos) {
                  classeGasto = "texto-perigo";
                }
                // Disponível = o que ainda cabe gastar no mês, já tirando o
                // que foi reservado pra meta e a parcela de financiamento
                // (isso é o limiteGastos) e o que já foi gasto de fato.
                const disponivel = m.limiteGastos - m.gastoReal;

                return (
                  <div key={`${m.ano}-${m.mes}`} className="cartao">
                    <div className="cartao-cabecalho">
                      <h3>{NOME_MES_ABREV[m.mes]}/{m.ano}</h3>
                      <span className={`badge badge-${m.status}`}>{ROTULO_STATUS[m.status]}</span>
                    </div>

                    <div className="mini-stats" style={{ marginTop: 10 }}>
                      <div className="mini-stat">
                        <p className="mini-stat-rotulo">Entrada</p>
                        <p className="mini-stat-valor texto-sucesso">{moeda(m.receitaPrevista)}</p>
                      </div>
                      <div className="mini-stat">
                        <p className="mini-stat-rotulo">Saída</p>
                        <p className="mini-stat-valor texto-perigo">{moeda(m.gastoReal)}</p>
                      </div>
                      {m.parcelasFinanciamento > 0 && (
                        <div className="mini-stat">
                          <p className="mini-stat-rotulo">Financiamento</p>
                          <p className="mini-stat-valor texto-perigo">{moeda(m.parcelasFinanciamento)}</p>
                        </div>
                      )}
                    </div>

                    <hr className="divisor-cartao" />

                    <div className="resumo-valor" style={{ fontSize: 22 }}>{moeda(m.aporteRecomendado)}</div>
                    <p className="texto-fraco" style={{ margin: "2px 0 12px" }}>recomendado pra guardar nesse mês</p>

                    <div className="barra-fundo">
                      <div className="barra-preenchida" style={{ width: `${progresso * 100}%` }} />
                    </div>

                    <div className="mini-stats" style={{ marginTop: 10 }}>
                      <div className="mini-stat">
                        <p className="mini-stat-rotulo">Disponível pra gastar</p>
                        <p className={"mini-stat-valor " + classeGasto}>{moeda(disponivel)}</p>
                        <p className="texto-fraco" style={{ margin: "2px 0 0", fontSize: 11 }}>
                          de {moeda(m.limiteGastos)} de limite
                        </p>
                      </div>
                      <div className="mini-stat">
                        <p className="mini-stat-rotulo">Aporte real</p>
                        <p className="mini-stat-valor">{m.aporteReal === null ? "—" : moeda(m.aporteReal)}</p>
                      </div>
                    </div>

                    {m.fechavel && (
                      <button
                        className="botao-secundario"
                        style={{ marginTop: 14 }}
                        onClick={() => handleFecharMes(m.ano, m.mes)}
                      >
                        Fechar mês
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {mesesFuturos.length > 0 && (
            <div className="cartao">
              <h3 style={{ marginTop: 0, marginBottom: 2 }}>Próximos meses (projeção)</h3>
              <p className="texto-fraco" style={{ marginTop: 0, marginBottom: 14 }}>
                Com base na média histórica, enquanto não há lançamentos nesses meses.
              </p>
              <div className="tabela-wrap">
                <table className="tabela">
                  <thead>
                    <tr>
                      <th>Mês</th>
                      <th className="direita">Entrada</th>
                      <th className="direita">Saída</th>
                      <th className="direita">Financiamento</th>
                      <th className="direita">A guardar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mesesFuturos.map((m) => {
                      const saidaProjetada = m.despesaProjetada - m.parcelasFinanciamento;
                      return (
                        <tr key={`${m.ano}-${m.mes}`}>
                          <td>{NOME_MES_ABREV[m.mes]}/{m.ano}</td>
                          <td className="direita texto-sucesso">{moeda(m.receitaPrevista)}</td>
                          <td className="direita texto-perigo">{moeda(saidaProjetada)}</td>
                          <td className="direita">
                            {m.parcelasFinanciamento > 0 ? (
                              <span className="texto-perigo">{moeda(m.parcelasFinanciamento)}</span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="direita">{moeda(m.aporteRecomendado)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}

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

const CLASSE_STATUS = {
  cumprido: "texto-sucesso",
  fechado: "texto-sucesso",
  parcial: "texto-fraco",
  futuro: "texto-fraco",
  pendente: "texto-perigo",
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

      <div className="cartao">
        {!meta ? (
          <EstadoVazio
            titulo="Nenhuma meta pra planejar"
            descricao="Cadastre uma meta na tela de Metas pra ver a distribuição mensal aqui."
          />
        ) : (
          <>
            <p>
              Considerando a meta <strong>{meta.nome}</strong>, ainda falta {moeda(plano.valorFaltante)}.
            </p>
            {plano.mensagem && <p className="erro">{plano.mensagem}</p>}

            <div className="tabela-wrap">
              <table className="tabela">
                <thead>
                  <tr>
                    <th>Mês</th>
                    <th className="direita">A guardar</th>
                    <th className="direita">Parcela financiamento</th>
                    <th className="direita">Limite de gastos</th>
                    <th className="direita">Gasto no mês</th>
                    <th className="direita">Aporte real</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {plano.meses.map((m) => {
                    let classeGasto = "";
                    if (m.gastoReal !== null && m.gastoReal > m.limiteGastos) {
                      classeGasto = "texto-perigo";
                    }
                    return (
                    <tr key={`${m.ano}-${m.mes}`}>
                      <td>{NOME_MES_ABREV[m.mes]}/{m.ano}</td>
                      <td className="direita">{moeda(m.aporteRecomendado)}</td>
                      <td className="direita">{moeda(m.parcelasFinanciamento)}</td>
                      <td className="direita">{moeda(m.limiteGastos)}</td>
                      <td className={"direita " + classeGasto}>{m.gastoReal === null ? "—" : moeda(m.gastoReal)}</td>
                      <td className="direita">{m.aporteReal === null ? "—" : moeda(m.aporteReal)}</td>
                      <td className={CLASSE_STATUS[m.status]}>{ROTULO_STATUS[m.status]}</td>
                      <td>
                        {m.fechavel && (
                          <button className="botao-secundario" onClick={() => handleFecharMes(m.ano, m.mes)}>
                            Fechar mês
                          </button>
                        )}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}

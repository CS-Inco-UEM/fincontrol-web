import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import EstadoVazio from "../components/EstadoVazio";
import FinanciamentoForm from "../components/FinanciamentoForm";
import { IconeExcluir } from "../components/icones";
import {
  adicionarFinanciamento,
  excluirFinanciamento,
  ouvirFinanciamentos,
} from "../services/financiamentosService";
import { gerarParcelas } from "../utils/financiamento";

const moeda = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function statusSimulacao(fin) {
  const inicio = fin.dataInicio.toDate();
  const hoje = new Date();
  const mesesDecorridos =
    (hoje.getFullYear() - inicio.getFullYear()) * 12 + (hoje.getMonth() - inicio.getMonth());
  if (mesesDecorridos < 0) return "Não iniciado";
  if (mesesDecorridos >= fin.numParcelas) return "Concluído";
  return "Em andamento";
}

export default function Simulacoes() {
  const { user } = useAuth();
  const [financiamentos, setFinanciamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [modalAberto, setModalAberto] = useState(false);

  useEffect(() => {
    return ouvirFinanciamentos(user.uid, (l) => {
      setFinanciamentos(l);
      setCarregando(false);
    }, () => {
      setErro("Erro ao carregar simulações.");
      setCarregando(false);
    });
  }, [user.uid]);

  async function excluir(fin) {
    if (!window.confirm(`Excluir a simulação "${fin.descricao}"?`)) return;
    try {
      await excluirFinanciamento(user.uid, fin.id);
    } catch (e) {
      console.error(e);
      setErro("Não foi possível excluir essa simulação.");
    }
  }

  return (
    <Layout
      titulo="Simulações"
      subtitulo="Compare simulações de financiamento pelo sistema Price ou SAC."
      acoes={<button className="botao" onClick={() => setModalAberto(true)}>+ Nova simulação</button>}
    >
      {erro && <p className="erro" style={{ marginBottom: 12 }}>{erro}</p>}

      {carregando ? (
        <div className="grade-cartoes">
          {[0, 1].map((i) => (
            <div key={i} className="cartao">
              <div className="skeleton skeleton-linha" style={{ width: "55%" }} />
              <div className="skeleton skeleton-linha" style={{ width: "75%" }} />
            </div>
          ))}
        </div>
      ) : financiamentos.length === 0 ? (
        <div className="cartao">
          <EstadoVazio
            titulo="Nenhuma simulação cadastrada"
            descricao="Simule um financiamento (carro, imóvel, equipamento) pelos sistemas Price ou SAC."
          />
        </div>
      ) : (
        <div className="grade-cartoes">
          {financiamentos.map((f) => {
            const parcelas = gerarParcelas(f);
            const primeira = parcelas[0];
            const ultima = parcelas[parcelas.length - 1];
            let total = 0;
            for (let i = 0; i < parcelas.length; i++) {
              total = total + parcelas[i].valor;
            }
            const status = statusSimulacao(f);

            return (
              <div key={f.id} className="cartao">
                <div className="cartao-cabecalho">
                  <h3>{f.descricao}</h3>
                  <button className="botao-icone perigo" onClick={() => excluir(f)} aria-label="Excluir">
                    <IconeExcluir />
                  </button>
                </div>

                <p className="texto-fraco" style={{ margin: "0 0 10px" }}>
                  Sistema {f.sistema === "SAC" ? "SAC" : "Price"} · {(f.taxaJurosMensal * 100).toFixed(2)}% a.m. ·{" "}
                  <span className={status === "Concluído" ? "texto-sucesso" : "texto-fraco"}>
                    {status}
                  </span>
                </p>

                <div className="resumo-valor" style={{ fontSize: 20 }}>{moeda(f.valorFinanciado)}</div>
                <p className="texto-fraco" style={{ margin: "2px 0 10px" }}>em {f.numParcelas}x</p>

                <p className="texto-fraco" style={{ margin: 0 }}>
                  {f.sistema === "SAC"
                    ? <>1ª parcela {moeda(primeira.valor)} · última {moeda(ultima.valor)}</>
                    : <>Parcela fixa de {moeda(primeira.valor)}</>}
                  <br />
                  Total estimado: {moeda(total)}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {modalAberto && (
        <Modal titulo="Nova simulação de financiamento" onFechar={() => setModalAberto(false)}>
          <FinanciamentoForm
            onSalvar={async (dados) => {
              await adicionarFinanciamento(user.uid, dados);
              setModalAberto(false);
            }}
            onCancelar={() => setModalAberto(false)}
          />
        </Modal>
      )}
    </Layout>
  );
}

import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import EstadoVazio from "../components/EstadoVazio";
import MetaForm from "../components/MetaForm";
import TransferenciaForm from "../components/TransferenciaForm";
import { IconeEditar, IconeExcluir } from "../components/icones";
import { adicionarMeta, atualizarMeta, excluirMeta, ouvirMetas } from "../services/metasService";
import { adicionarMovimentacao, ouvirMovimentacoes } from "../services/movimentacoesService";
import { indicadoresMeta } from "../utils/metas";

const moeda = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Metas() {
  const { user } = useAuth();
  const [metas, setMetas] = useState([]);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);
  const [acaoAberta, setAcaoAberta] = useState(null); // { meta, tipo }

  useEffect(() => {
    return ouvirMetas(user.uid, (l) => {
      setMetas(l);
      setCarregando(false);
    }, () => {
      setErro("Erro ao carregar metas.");
      setCarregando(false);
    });
  }, [user.uid]);

  useEffect(() => {
    return ouvirMovimentacoes(user.uid, setMovimentacoes, () => {});
  }, [user.uid]);

  function abrirNova() {
    setEditando(null);
    setModalAberto(true);
  }

  function abrirEdicao(meta) {
    setEditando(meta);
    setModalAberto(true);
  }

  async function salvar(dados) {
    if (editando) {
      await atualizarMeta(user.uid, editando.id, dados);
    } else {
      await adicionarMeta(user.uid, dados);
    }
    setModalAberto(false);
    setEditando(null);
  }

  async function excluir(meta) {
    if (!window.confirm(`Excluir a meta "${meta.nome}"?`)) return;
    try {
      await excluirMeta(user.uid, meta.id);
    } catch (e) {
      console.error(e);
      setErro("Não foi possível excluir essa meta.");
    }
  }

  return (
    <Layout
      titulo="Metas"
      subtitulo="Acompanhe o progresso de cada meta de economia."
      acoes={<button className="botao" onClick={abrirNova}>+ Nova meta</button>}
    >
      {erro && <p className="erro" style={{ marginBottom: 12 }}>{erro}</p>}

      {carregando ? (
        <div className="grade-cartoes">
          {[0, 1].map((i) => (
            <div key={i} className="cartao">
              <div className="skeleton skeleton-linha" style={{ width: "50%" }} />
              <div className="skeleton skeleton-linha" style={{ width: "80%", height: 22 }} />
            </div>
          ))}
        </div>
      ) : metas.length === 0 ? (
        <div className="cartao">
          <EstadoVazio
            titulo="Nenhuma meta cadastrada"
            descricao="Crie uma meta de economia (uma viagem, uma reserva, uma compra) pra começar a planejar."
          />
        </div>
      ) : (
        <div className="grade-cartoes">
          {metas.map((meta) => {
            const ind = indicadoresMeta(meta, movimentacoes);
            return (
              <div key={meta.id} className="cartao">
                <div className="cartao-cabecalho">
                  <h3>{meta.nome}</h3>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="botao-icone" onClick={() => abrirEdicao(meta)} aria-label="Editar">
                      <IconeEditar />
                    </button>
                    <button className="botao-icone perigo" onClick={() => excluir(meta)} aria-label="Excluir">
                      <IconeExcluir />
                    </button>
                  </div>
                </div>

                <div className="resumo-valor" style={{ fontSize: 20 }}>{moeda(ind.guardado)}</div>
                <p className="texto-fraco" style={{ margin: "2px 0 10px" }}>de {moeda(meta.valorAlvo)}</p>

                <div className="barra-fundo">
                  <div className="barra-preenchida" style={{ width: `${ind.progresso * 100}%` }} />
                </div>

                <p className="texto-fraco" style={{ marginTop: 8 }}>
                  {(ind.progresso * 100).toFixed(0)}% concluído · falta {moeda(ind.faltante)}
                  <br />
                  Previsão de conclusão: {meta.dataLimite.toDate().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                </p>

                <div className="linha-botoes" style={{ marginTop: 10 }}>
                  <button className="botao-secundario" onClick={() => setAcaoAberta({ meta, tipo: "transferencia" })}>
                    Transferir saldo
                  </button>
                  <button className="botao-secundario" onClick={() => setAcaoAberta({ meta, tipo: "resgate" })}>
                    Resgatar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalAberto && (
        <Modal titulo={editando ? "Editar meta" : "Nova meta"} onFechar={() => setModalAberto(false)}>
          <MetaForm
            key={editando?.id ?? "nova"}
            inicial={editando}
            onSalvar={salvar}
            onCancelar={() => setModalAberto(false)}
          />
        </Modal>
      )}

      {acaoAberta && (
        <Modal
          titulo={acaoAberta.tipo === "transferencia" ? "Transferir para a meta" : "Resgatar da meta"}
          onFechar={() => setAcaoAberta(null)}
        >
          <TransferenciaForm
            meta={acaoAberta.meta}
            tipo={acaoAberta.tipo}
            maxResgate={indicadoresMeta(acaoAberta.meta, movimentacoes).guardado}
            movimentacoes={movimentacoes}
            onConfirmar={async (dados) => {
              await adicionarMovimentacao(user.uid, dados);
              setAcaoAberta(null);
            }}
            onCancelar={() => setAcaoAberta(null)}
          />
        </Modal>
      )}
    </Layout>
  );
}

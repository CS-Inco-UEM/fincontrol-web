import { Fragment, useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";
import Modal from "../components/Modal";
import EstadoVazio from "../components/EstadoVazio";
import MovimentacaoForm from "../components/MovimentacaoForm";
import { IconeEditar, IconeExcluir } from "../components/icones";
import {
  adicionarMovimentacao,
  atualizarMovimentacao,
  excluirMovimentacao,
  ouvirMovimentacoes,
} from "../services/movimentacoesService";

const moeda = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const NOME_MES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const ROTULO_TIPO = {
  receita: "Receita",
  despesa: "Despesa",
  transferencia: "Transferência",
  resgate: "Resgate",
};

export default function Movimentacoes() {
  const { user } = useAuth();
  const [lista, setLista] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");

  const [modalAberto, setModalAberto] = useState(false);
  const [editando, setEditando] = useState(null);

  useEffect(() => {
    return ouvirMovimentacoes(
      user.uid,
      (l) => {
        setLista(l);
        setCarregando(false);
      },
      (e) => {
        console.error(e);
        setErro("Erro ao carregar movimentações.");
        setCarregando(false);
      }
    );
  }, [user.uid]);

  const termoBusca = busca.trim().toLowerCase();
  const listaFiltrada = lista.filter((m) => {
    const bateTipo = filtroTipo === "todos" || m.tipo === filtroTipo;
    const bateBusca =
      !termoBusca ||
      m.descricao.toLowerCase().includes(termoBusca) ||
      (m.categoria || "").toLowerCase().includes(termoBusca);
    return bateTipo && bateBusca;
  });

  // Tabela agrupada por mês (igual ao app de referência): como a lista já
  // vem ordenada por data (mais recente primeiro), meses iguais sempre ficam
  // em sequência — um objeto guarda em que posição do array "grupos" cada
  // mês já apareceu, pra não criar grupo duplicado.
  const indicePorMes = {};
  const grupos = [];
  for (let i = 0; i < listaFiltrada.length; i++) {
    const m = listaFiltrada[i];
    const d = m.data.toDate();
    const chave = d.getFullYear() + "-" + d.getMonth();
    if (indicePorMes[chave] === undefined) {
      indicePorMes[chave] = grupos.length;
      grupos.push({
        rotulo: `${NOME_MES[d.getMonth()]} de ${d.getFullYear()}`,
        itens: [],
      });
    }
    grupos[indicePorMes[chave]].itens.push(m);
  }

  function abrirNovo() {
    setEditando(null);
    setModalAberto(true);
  }

  function abrirEdicao(mov) {
    setEditando(mov);
    setModalAberto(true);
  }

  async function salvar(dados) {
    if (editando) {
      await atualizarMovimentacao(user.uid, editando.id, dados);
    } else {
      await adicionarMovimentacao(user.uid, dados);
    }
    setModalAberto(false);
    setEditando(null);
  }

  async function excluir(mov) {
    if (!window.confirm(`Excluir "${mov.descricao}"?`)) return;
    try {
      await excluirMovimentacao(user.uid, mov.id);
    } catch (e) {
      console.error(e);
      setErro("Não foi possível excluir essa movimentação.");
    }
  }

  return (
    <Layout
      titulo="Movimentações"
      subtitulo="Receitas, despesas e transferências lançadas na conta."
      acoes={<button className="botao" onClick={abrirNovo}>+ Nova movimentação</button>}
    >
      {erro && <p className="erro" style={{ marginBottom: 12 }}>{erro}</p>}

      <div className="cartao">
        <div className="barra-filtros">
          <input
            className="campo campo-busca"
            type="text"
            placeholder="Buscar por descrição ou categoria"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <select className="campo" style={{ maxWidth: 190 }} value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
            <option value="todos">Todos os tipos</option>
            <option value="receita">Receita</option>
            <option value="despesa">Despesa</option>
            <option value="transferencia">Transferência</option>
            <option value="resgate">Resgate</option>
          </select>
        </div>

        {carregando ? (
          <div>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton skeleton-linha" style={{ width: "100%" }} />
            ))}
          </div>
        ) : listaFiltrada.length === 0 ? (
          lista.length === 0 ? (
            <EstadoVazio
              titulo="Nenhuma movimentação lançada"
              descricao="Registre sua primeira receita ou despesa pra começar a acompanhar o saldo."
            />
          ) : (
            <p className="texto-fraco">Nenhuma movimentação encontrada com esse filtro.</p>
          )
        ) : (
          <div className="tabela-wrap">
            <table className="tabela">
              <thead>
                <tr>
                  <th>Descrição</th>
                  <th>Categoria</th>
                  <th>Data</th>
                  <th>Tipo</th>
                  <th className="direita">Valor</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {grupos.map((grupo) => (
                  <Fragment key={grupo.rotulo}>
                    <tr className="linha-grupo-mes">
                      <td colSpan={6}>{grupo.rotulo}</td>
                    </tr>
                    {grupo.itens.map((m) => {
                      const positivo = m.tipo === "receita" || m.tipo === "resgate";
                      return (
                        <tr key={m.id}>
                          <td>{m.descricao}</td>
                          <td>{m.categoria}</td>
                          <td>{m.data.toDate().toLocaleDateString("pt-BR")}</td>
                          <td><span className={`badge badge-${m.tipo}`}>{ROTULO_TIPO[m.tipo]}</span></td>
                          <td className={"direita " + (positivo ? "texto-sucesso" : "texto-perigo")}>
                            {positivo ? "+ " : "- "}{moeda(m.valor)}
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                              {(m.tipo === "receita" || m.tipo === "despesa") && (
                                <button className="botao-icone" onClick={() => abrirEdicao(m)} aria-label="Editar">
                                  <IconeEditar />
                                </button>
                              )}
                              <button className="botao-icone perigo" onClick={() => excluir(m)} aria-label="Excluir">
                                <IconeExcluir />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalAberto && (
        <Modal titulo={editando ? "Editar movimentação" : "Nova movimentação"} onFechar={() => setModalAberto(false)}>
          <MovimentacaoForm
            key={editando?.id ?? "nova"}
            inicial={editando}
            onSalvar={salvar}
            onCancelar={() => setModalAberto(false)}
          />
        </Modal>
      )}
    </Layout>
  );
}

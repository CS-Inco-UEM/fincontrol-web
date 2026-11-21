import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import MovimentacaoForm from "../components/MovimentacaoForm";
import {
  adicionarMovimentacao,
  atualizarMovimentacao,
  excluirMovimentacao,
  ouvirMovimentacoes,
} from "../services/movimentacoesService";

const moeda = (v) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Movimentacoes() {
  const { user } = useAuth();
  const [lista, setLista] = useState([]);
  const [editando, setEditando] = useState(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    return ouvirMovimentacoes(
      user.uid,
      setLista,
      (e) => {
        console.error(e);
        setErro("Erro ao carregar movimentações.");
      }
    );
  }, [user.uid]);

  async function salvar(dados) {
    if (editando) {
      await atualizarMovimentacao(user.uid, editando.id, dados);
      setEditando(null);
    } else {
      await adicionarMovimentacao(user.uid, dados);
    }
  }

  async function excluir(mov) {
    if (!window.confirm(`Excluir "${mov.descricao}"?`)) return;
    try {
      await excluirMovimentacao(user.uid, mov.id);
    } catch (e) {
      console.error(e);
      setErro("Não foi possível excluir.");
    }
  }

  return (
    <main style={{ maxWidth: 700, margin: "40px auto", padding: "0 16px" }}>
      <header style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>Movimentações</h1>
        <Link to="/">Voltar ao Dashboard</Link>
      </header>

      <MovimentacaoForm
        key={editando?.id ?? "novo"}
        inicial={editando}
        onSalvar={salvar}
        onCancelar={() => setEditando(null)}
      />

      {erro && <p style={{ color: "crimson" }}>{erro}</p>}

      {lista.length === 0 ? (
        <p>Nenhuma movimentação registrada.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {lista.map((m) => (
            <li
              key={m.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #ccc",
                padding: "8px 0",
              }}
            >
              <div>
                <strong>{m.descricao}</strong>
                <div style={{ fontSize: 13, opacity: 0.7 }}>
                  {m.categoria} · {m.data.toDate().toLocaleDateString("pt-BR")}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ color: m.tipo === "receita" ? "green" : "crimson" }}>
                  {m.tipo === "receita" ? "+" : "-"} {moeda(m.valor)}
                </span>
                {(m.tipo === "receita" || m.tipo === "despesa") && (
                  <button onClick={() => setEditando(m)}>Editar</button>
                )}
                <button onClick={() => excluir(m)}>Excluir</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
import { useState } from "react";
import { CATEGORIAS } from "../utils/categorias";

function paraInputData(timestamp) {
  const d = timestamp ? timestamp.toDate() : new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

export default function MovimentacaoForm({ inicial, onSalvar, onCancelar }) {
  const [tipo, setTipo] = useState(inicial?.tipo ?? "despesa");
  const [valor, setValor] = useState(inicial ? String(inicial.valor) : "");
  const [descricao, setDescricao] = useState(inicial?.descricao ?? "");
  const [categoria, setCategoria] = useState(inicial?.categoria ?? CATEGORIAS[0]);
  const [data, setData] = useState(paraInputData(inicial?.data));
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    const valorNum = parseFloat(valor);
    if (!descricao.trim() || !categoria || !data || valor === "") {
      setErro("Preencha todos os campos.");
      return;
    }
    if (isNaN(valorNum) || valorNum <= 0) {
      setErro("O valor deve ser maior que zero.");
      return;
    }

    setSalvando(true);
    try {
      await onSalvar({
        tipo,
        valor: valorNum,
        descricao: descricao.trim(),
        categoria,
        // meio-dia evita problemas de fuso horário na data
        data: new Date(`${data}T12:00:00`),
      });
      if (!inicial) {
        setValor("");
        setDescricao("");
      }
    } catch (err) {
      console.error(err);
      setErro("Não foi possível salvar. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8, marginBottom: 24 }}>
      <h2>{inicial ? "Editar movimentação" : "Nova movimentação"}</h2>

      <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
        <option value="despesa">Despesa</option>
        <option value="receita">Receita</option>
      </select>

      <input
        type="number"
        step="0.01"
        min="0"
        placeholder="Valor (R$)"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
      />

      <input
        type="text"
        placeholder="Descrição"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
      />

      <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
        {CATEGORIAS.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <input type="date" value={data} onChange={(e) => setData(e.target.value)} />

      {erro && <p style={{ color: "crimson", margin: 0 }}>{erro}</p>}

      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar"}
        </button>
        {inicial && (
          <button type="button" onClick={onCancelar}>Cancelar</button>
        )}
      </div>
    </form>
  );
}
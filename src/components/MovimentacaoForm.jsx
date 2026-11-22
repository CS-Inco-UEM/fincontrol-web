import { useState } from "react";
import { categoriasPorTipo } from "../utils/categorias";

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
  const [categoria, setCategoria] = useState(inicial?.categoria ?? categoriasPorTipo(inicial?.tipo ?? "despesa")[0]);
  const categorias = categoriasPorTipo(tipo);

  function handleTipo(novoTipo) {
    setTipo(novoTipo);
    if (!categoriasPorTipo(novoTipo).includes(categoria)) {
      setCategoria(categoriasPorTipo(novoTipo)[0]);
    }
  }
  const [data, setData] = useState(paraInputData(inicial?.data));
  const [duracaoMeses, setDuracaoMeses] = useState("1");
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
        duracaoMeses: inicial ? 1 : parseInt(duracaoMeses, 10) || 1,
      });
      if (!inicial) {
        setValor("");
        setDescricao("");
        setDuracaoMeses("1");
      }
    } catch (err) {
      console.error(err);
      setErro("Não foi possível salvar. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="formulario">
      <select className="campo" value={tipo} onChange={(e) => handleTipo(e.target.value)}>
        <option value="despesa">Despesa</option>
        <option value="receita">Receita</option>
      </select>

      <input
        className="campo"
        type="number"
        step="0.01"
        min="0"
        placeholder="Valor (R$)"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
      />

      <input
        className="campo"
        type="text"
        placeholder="Descrição"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
      />

      <select className="campo" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
        {categorias.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <input className="campo" type="date" value={data} onChange={(e) => setData(e.target.value)} />

      {!inicial && (
        <label className="rotulo">
          Repetir por quantos meses (1 = não repete)
          <input
            className="campo"
            type="number"
            min="1"
            value={duracaoMeses}
            onChange={(e) => setDuracaoMeses(e.target.value)}
          />
        </label>
      )}

      {erro && <p className="erro">{erro}</p>}

      <div className="linha-botoes">
        <button className="botao" type="submit" disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar"}
        </button>
        <button className="botao-secundario" type="button" onClick={onCancelar}>Cancelar</button>
      </div>
    </form>
  );
}

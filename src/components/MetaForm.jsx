import { useState } from "react";

function paraInputData(timestamp) {
  if (!timestamp) return "";
  const d = timestamp.toDate();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

export default function MetaForm({ inicial, onSalvar, onCancelar }) {
  const [nome, setNome] = useState(inicial?.nome ?? "");
  const [valorAlvo, setValorAlvo] = useState(inicial ? String(inicial.valorAlvo) : "");
  const [dataLimite, setDataLimite] = useState(paraInputData(inicial?.dataLimite));
  const [dataInicio, setDataInicio] = useState(paraInputData(inicial?.dataInicio));
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    const valorNum = parseFloat(valorAlvo);
    if (!nome.trim() || !dataLimite || valorAlvo === "") {
      setErro("Preencha nome, valor e data-limite.");
      return;
    }
    if (isNaN(valorNum) || valorNum <= 0) {
      setErro("O valor da meta deve ser maior que zero.");
      return;
    }

    setSalvando(true);
    try {
      await onSalvar({
        nome: nome.trim(),
        valorAlvo: valorNum,
        dataLimite: new Date(`${dataLimite}T12:00:00`),
        dataInicio: dataInicio ? new Date(`${dataInicio}T12:00:00`) : null,
      });
      if (!inicial) {
        setNome("");
        setValorAlvo("");
        setDataLimite("");
        setDataInicio("");
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
      <input
        className="campo"
        type="text"
        placeholder="Nome da meta"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
      />

      <input
        className="campo"
        type="number"
        step="0.01"
        min="0"
        placeholder="Valor-alvo (R$)"
        value={valorAlvo}
        onChange={(e) => setValorAlvo(e.target.value)}
      />

      <label className="rotulo">
        Data-limite
        <input
          className="campo"
          type="date"
          value={dataLimite}
          onChange={(e) => setDataLimite(e.target.value)}
        />
      </label>

      <label className="rotulo">
        Data de início (opcional)
        <input
          className="campo"
          type="date"
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
        />
      </label>

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

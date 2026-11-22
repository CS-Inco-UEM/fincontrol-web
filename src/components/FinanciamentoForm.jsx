import { useState } from "react";

export default function FinanciamentoForm({ onSalvar, onCancelar }) {
  const [descricao, setDescricao] = useState("");
  const [valorFinanciado, setValorFinanciado] = useState("");
  const [taxaJuros, setTaxaJuros] = useState("");
  const [numParcelas, setNumParcelas] = useState("");
  const [sistema, setSistema] = useState("PRICE");
  const [dataInicio, setDataInicio] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    const valorNum = parseFloat(valorFinanciado);
    const taxaNum = parseFloat(taxaJuros);
    const parcelasNum = parseInt(numParcelas, 10);

    if (!descricao.trim() || valorFinanciado === "" || taxaJuros === "" || !numParcelas || !dataInicio) {
      setErro("Preencha todos os campos.");
      return;
    }
    if (isNaN(valorNum) || valorNum <= 0) {
      setErro("O valor financiado deve ser maior que zero.");
      return;
    }
    if (isNaN(taxaNum) || taxaNum < 0) {
      setErro("A taxa de juros não pode ser negativa.");
      return;
    }
    if (isNaN(parcelasNum) || parcelasNum <= 0) {
      setErro("O número de parcelas deve ser maior que zero.");
      return;
    }

    setSalvando(true);
    try {
      await onSalvar({
        descricao: descricao.trim(),
        valorFinanciado: valorNum,
        taxaJurosMensal: taxaNum / 100,
        numParcelas: parcelasNum,
        sistema,
        dataInicio: new Date(`${dataInicio}T12:00:00`),
      });
      setDescricao("");
      setValorFinanciado("");
      setTaxaJuros("");
      setNumParcelas("");
      setDataInicio("");
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
        placeholder="Descrição (ex: financiamento do carro)"
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
      />

      <input
        className="campo"
        type="number"
        step="0.01"
        min="0"
        placeholder="Valor financiado (R$)"
        value={valorFinanciado}
        onChange={(e) => setValorFinanciado(e.target.value)}
      />

      <input
        className="campo"
        type="number"
        step="0.01"
        min="0"
        placeholder="Taxa de juros ao mês (%)"
        value={taxaJuros}
        onChange={(e) => setTaxaJuros(e.target.value)}
      />

      <input
        className="campo"
        type="number"
        min="1"
        placeholder="Número de parcelas"
        value={numParcelas}
        onChange={(e) => setNumParcelas(e.target.value)}
      />

      <select className="campo" value={sistema} onChange={(e) => setSistema(e.target.value)}>
        <option value="PRICE">Tabela Price (parcelas fixas)</option>
        <option value="SAC">SAC (amortização constante)</option>
      </select>

      <label className="rotulo">
        Data da primeira parcela
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
          {salvando ? "Salvando..." : "Simular e salvar"}
        </button>
        <button className="botao-secundario" type="button" onClick={onCancelar}>Cancelar</button>
      </div>
    </form>
  );
}

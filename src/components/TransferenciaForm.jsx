import { useState } from "react";
import { calcularSaldoMes } from "../utils/saldo";

const moeda = (v) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function chaveMes(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Transferência (saldo -> meta) e resgate (meta -> saldo) são sempre
// registrados como movimentação de verdade, nunca um ajuste direto no
// valor da meta. A transferência parte do saldo de um MÊS específico
// (nunca do acumulado nem de projeções) — por isso pede pra escolher o
// mês; o resgate é limitado pelo valor guardado na própria meta.
export default function TransferenciaForm({
  meta,
  tipo,
  maxResgate,
  movimentacoes,
  onConfirmar,
  onCancelar,
}) {
  const hoje = new Date();
  const [valor, setValor] = useState("");
  const [mesEscolhido, setMesEscolhido] = useState(chaveMes(hoje));
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const titulo = tipo === "transferencia" ? "Transferir para a meta" : "Resgatar da meta";

  const partesMes = mesEscolhido.split("-");
  const anoSel = parseInt(partesMes[0], 10);
  const mesSel = parseInt(partesMes[1], 10);
  const saldoDoMes =
    tipo === "transferencia" ? calcularSaldoMes(movimentacoes, anoSel, mesSel - 1) : 0;
  const limite = tipo === "resgate" ? maxResgate : saldoDoMes;

  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");

    const valorNum = parseFloat(valor);
    if (isNaN(valorNum) || valorNum <= 0) {
      setErro("Informe um valor maior que zero.");
      return;
    }
    if (tipo === "resgate" && valorNum > maxResgate) {
      setErro(`Essa meta só tem ${moeda(maxResgate)} guardado.`);
      return;
    }
    if (tipo === "transferencia" && valorNum > saldoDoMes) {
      setErro(`O saldo desse mês é de ${moeda(saldoDoMes)}.`);
      return;
    }

    // A transferência é datada dentro do mês escolhido (hoje, se for o mês
    // atual; senão o último dia dele), pra entrar no saldo daquele mês.
    const fimDoMesEscolhido = new Date(anoSel, mesSel, 0);
    const data = fimDoMesEscolhido < hoje ? fimDoMesEscolhido : hoje;

    setSalvando(true);
    try {
      await onConfirmar({
        tipo,
        valor: valorNum,
        descricao: `${titulo}: ${meta.nome}`,
        categoria: "Outros",
        metaId: meta.id,
        data: tipo === "transferencia" ? data : hoje,
      });
    } catch (err) {
      console.error(err);
      setErro("Não foi possível concluir. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="formulario">
      {tipo === "transferencia" && (
        <label className="rotulo">
          Mês de origem do saldo
          <input
            className="campo"
            type="month"
            max={chaveMes(hoje)}
            value={mesEscolhido}
            onChange={(e) => setMesEscolhido(e.target.value)}
          />
        </label>
      )}
      <p className="texto-fraco" style={{ margin: 0 }}>
        {tipo === "resgate" ? "Guardado na meta" : "Saldo desse mês"}: {moeda(limite)}
      </p>
      <input
        className="campo"
        type="number"
        step="0.01"
        min="0"
        placeholder="Valor (R$)"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
      />
      {erro && <p className="erro">{erro}</p>}
      <div className="linha-botoes">
        <button className="botao" type="submit" disabled={salvando}>
          {salvando ? "Enviando..." : "Confirmar"}
        </button>
        <button className="botao-secundario" type="button" onClick={onCancelar}>Cancelar</button>
      </div>
    </form>
  );
}

import { IconeVazio } from "./icones";

export default function EstadoVazio({ titulo, descricao, acaoTexto, onAcao }) {
  return (
    <div className="estado-vazio">
      <IconeVazio />
      <h3>{titulo}</h3>
      <p>{descricao}</p>
      {acaoTexto && (
        <button className="botao" onClick={onAcao}>
          {acaoTexto}
        </button>
      )}
    </div>
  );
}

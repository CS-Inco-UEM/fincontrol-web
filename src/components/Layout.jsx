import Sidebar from "./Sidebar";

export default function Layout({ titulo, subtitulo, acoes, children }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="conteudo">
        <div className="cabecalho-pagina">
          <div>
            <h1>{titulo}</h1>
            {subtitulo && <p>{subtitulo}</p>}
          </div>
          {acoes && <div className="cabecalho-acoes">{acoes}</div>}
        </div>
        {children}
      </main>
    </div>
  );
}

import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";

export default function Login() {
  const { user, loading, login } = useAuth();
  const [erro, setErro] = useState("");

  if (loading) return <p className="pagina-estreita">Carregando...</p>;
  if (user) return <Navigate to="/" replace />;

  async function handleLogin() {
    setErro("");
    try {
      await login();
    } catch (e) {
      if (e.code === "auth/popup-closed-by-user") {
        setErro("Login cancelado. Tente novamente.");
      } else {
        setErro("Não foi possível entrar com o Google. Tente novamente.");
      }
      console.error(e);
    }
  }

  return (
    <main className="pagina-estreita">
      <Logo grande />
      <p className="texto-fraco">
        Saldo, metas de economia e simulação de financiamento em um só lugar.
      </p>
      <button className="botao" onClick={handleLogin}>Entrar com Google</button>
      {erro && <p className="erro">{erro}</p>}
    </main>
  );
}

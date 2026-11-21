import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { user, loading, login } = useAuth();
  const [erro, setErro] = useState("");

  if (loading) return <p>Carregando...</p>;
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
    <main style={{ maxWidth: 360, margin: "80px auto", textAlign: "center" }}>
      <h1>FinControl Web</h1>
      <p>Controle financeiro pessoal com simulador de financiamento.</p>
      <button onClick={handleLogin}>Entrar com Google</button>
      {erro && <p style={{ color: "crimson" }}>{erro}</p>}
    </main>
  );
}
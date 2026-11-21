import { useAuth } from "../context/AuthContext";

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <main style={{ maxWidth: 600, margin: "40px auto" }}>
      <header style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>Dashboard</h1>
        <button onClick={logout}>Sair</button>
      </header>
      <p>Olá, {user.displayName}!</p>
      <p>UID: {user.uid}</p>
    </main>
  );
}
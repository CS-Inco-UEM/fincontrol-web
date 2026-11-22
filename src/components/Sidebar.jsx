import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "./Logo";
import { IconeGrade, IconeSetas, IconeAlvo, IconeTendencia, IconeCalculadora } from "./icones";

const ITENS = [
  { to: "/", fim: true, rotulo: "Visão geral", Icone: IconeGrade },
  { to: "/movimentacoes", rotulo: "Movimentações", Icone: IconeSetas },
  { to: "/metas", rotulo: "Metas", Icone: IconeAlvo },
  { to: "/planejamento", rotulo: "Planejamento", Icone: IconeTendencia },
  { to: "/simulacoes", rotulo: "Simulações", Icone: IconeCalculadora },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const nomeExibido = user.displayName || user.email || "Usuário";
  const iniciais = nomeExibido.trim().charAt(0).toUpperCase();
  const primeiroNome = nomeExibido.split(" ")[0];

  return (
    <aside className="sidebar">
      <Logo />

      <nav className="menu-lateral">
        {ITENS.map(({ to, fim, rotulo, Icone }) => (
          <NavLink
            key={to}
            to={to}
            end={fim}
            className={({ isActive }) => "item-menu" + (isActive ? " ativo" : "")}
          >
            <Icone />
            <span className="rotulo-item">{rotulo}</span>
          </NavLink>
        ))}
      </nav>

      <div className="usuario-sidebar">
        <span className="avatar-inicial">{iniciais}</span>
        <div className="usuario-sidebar-info">
          <strong>{primeiroNome}</strong>
          <button onClick={logout}>Sair</button>
        </div>
      </div>
    </aside>
  );
}

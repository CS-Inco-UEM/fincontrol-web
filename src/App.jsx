import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import PrivateRoute from "./components/PrivateRoute";
import Login from "./pages/Login";
import VisaoGeral from "./pages/VisaoGeral";
import Movimentacoes from "./pages/Movimentacoes";
import Metas from "./pages/Metas";
import Planejamento from "./pages/Planejamento";
import Simulacoes from "./pages/Simulacoes";

export default function App() {
  return (
    <HashRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <VisaoGeral />
              </PrivateRoute>
            }
          />
          <Route
            path="/movimentacoes"
            element={
              <PrivateRoute>
                <Movimentacoes />
              </PrivateRoute>
            }
          />
          <Route
            path="/metas"
            element={
              <PrivateRoute>
                <Metas />
              </PrivateRoute>
            }
          />
          <Route
            path="/planejamento"
            element={
              <PrivateRoute>
                <Planejamento />
              </PrivateRoute>
            }
          />
          <Route
            path="/simulacoes"
            element={
              <PrivateRoute>
                <Simulacoes />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </HashRouter>
  );
}

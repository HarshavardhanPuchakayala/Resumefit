import { BrowserRouter, Navigate, NavLink, Route, Routes } from "react-router-dom";
import { useAuth } from "./AuthContext";
import AuthPage from "./pages/AuthPage";
import ResumePage from "./pages/ResumePage";
import MatchPage from "./pages/MatchPage";

function Layout({ children }) {
  const { logout } = useAuth();
  const link = ({ isActive }) =>
    `rounded px-3 py-1.5 text-sm font-medium ${
      isActive ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-200"
    }`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <span className="font-bold">ResumeFit</span>
          <nav className="flex items-center gap-2">
            <NavLink to="/resume" className={link}>My resume</NavLink>
            <NavLink to="/match" className={link}>Match a job</NavLink>
            <button
              onClick={logout}
              className="px-3 py-1.5 text-sm text-slate-600 hover:underline"
            >
              Log out
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-6">{children}</main>
    </div>
  );
}

function Protected({ children }) {
  const { token } = useAuth();
  return token ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
}

function Guest({ children }) {
  const { token } = useAuth();
  if (token) return <Navigate to="/resume" replace />;
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      {children}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/resume" replace />} />
        <Route path="/login" element={<Guest><AuthPage mode="login" /></Guest>} />
        <Route path="/signup" element={<Guest><AuthPage mode="signup" /></Guest>} />
        <Route path="/resume" element={<Protected><ResumePage /></Protected>} />
        <Route path="/match" element={<Protected><MatchPage /></Protected>} />
        <Route path="*" element={<Navigate to="/resume" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
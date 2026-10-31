import { createContext, useContext, useEffect, useState } from "react";
import { api, clearToken, getToken, setToken } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(getToken());

  useEffect(() => {
    const onExpired = () => setTokenState(null);
    window.addEventListener("auth-expired", onExpired);
    return () => window.removeEventListener("auth-expired", onExpired);
  }, []);

  async function login(email, password) {
    const data = await api("/auth/login", {
      method: "POST",
      body: { email, password },
    });
    setToken(data.access_token);
    setTokenState(data.access_token);
  }

  async function signup(email, password) {
    await api("/auth/signup", { method: "POST", body: { email, password } });
    await login(email, password);
  }

  function logout() {
    clearToken();
    setTokenState(null);
  }

  return (
    <AuthContext.Provider value={{ token, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
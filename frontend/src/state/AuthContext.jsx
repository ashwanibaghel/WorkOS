import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api/client.js";
import { getSocket } from "../api/socket.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("workos_token");
    if (!token) {
      setLoading(false);
      return;
    }
    api.get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => localStorage.removeItem("workos_token"))
      .finally(() => setLoading(false));
  }, []);

  const login = async (payload, mode = "login") => {
    const res = await api.post(`/auth/${mode}`, payload);
    if (res.data.token) {
      localStorage.setItem("workos_token", res.data.token);
      setUser(res.data.user);
      getSocket().connect();
    }
    return res.data;
  };

  const loginWithGoogle = async (credential) => {
    const res = await api.post("/auth/google", { credential });
    localStorage.setItem("workos_token", res.data.token);
    setUser(res.data.user);
    getSocket().connect();
    return res.data;
  };

  const verifyEmail = async (token) => {
    const res = await api.get(`/auth/verify-email/${token}`);
    localStorage.setItem("workos_token", res.data.token);
    setUser(res.data.user);
    getSocket().connect();
    return res.data;
  };

  const resendVerification = async (email) => {
    const res = await api.post("/auth/resend-verification", { email });
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("workos_token");
    getSocket().disconnect();
    setUser(null);
  };

  const value = useMemo(
    () => ({ user, loading, login, loginWithGoogle, verifyEmail, resendVerification, logout }),
    [user, loading]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);

import { createContext, useEffect, useMemo, useState } from "react";
import apiClient, { tokenStorageKey, userStorageKey } from "../api/client";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem(tokenStorageKey);
    const storedUser = localStorage.getItem(userStorageKey);

    if (storedToken) {
      setToken(storedToken);
    }

    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem(userStorageKey);
      }
    }

    setIsReady(true);
  }, []);

  const saveSession = (sessionToken, sessionUser) => {
    localStorage.setItem(tokenStorageKey, sessionToken);
    localStorage.setItem(userStorageKey, JSON.stringify(sessionUser));
    setToken(sessionToken);
    setUser(sessionUser);
  };

  const saveSessionFromResponse = (session) => {
    saveSession(session.token, session.user);
  };

  const login = async (credentials) => {
    const response = await apiClient.post("/auth/login", credentials);
    const session = response.data.data;
    saveSessionFromResponse(session);
    return session.user;
  };

  const signup = async (payload) => {
    const response = await apiClient.post("/auth/signup", payload);
    const session = response.data.data;
    saveSessionFromResponse(session);
    return session.user;
  };

  const logout = () => {
    localStorage.removeItem(tokenStorageKey);
    localStorage.removeItem(userStorageKey);
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      isReady,
      isAuthenticated: Boolean(token),
      login,
      signup,
      saveSessionFromResponse,
      logout
    }),
    [isReady, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    const storedRole = localStorage.getItem("user_role");
    const storedUserId = localStorage.getItem("user_id");

    if (storedToken) {
      setToken(storedToken);
      setRole(storedRole);
      setUserId(storedUserId);
    }

    setLoading(false);
  }, []);

  const login = (data) => {
    localStorage.setItem("auth_token", data.token);
    localStorage.setItem("user_role", data.userRole);
    localStorage.setItem("user_id", data.userId);

    setToken(data.token);
    setRole(data.userRole);
    setUserId(data.userId);
  };

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setRole(null);
    setUserId(null);
  };

  return (
    <AuthContext.Provider value={{ token, role, userId, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

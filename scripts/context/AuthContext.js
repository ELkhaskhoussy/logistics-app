import React, { createContext, useContext, useEffect, useState } from "react";
import { getToken, getUserRole, getUserId, saveAuthData, clearAuthData } from "../../app/utils/tokenStorage";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAuthData = async () => {
      try {
        const storedToken = await getToken();
        const storedRole = await getUserRole();
        const storedUserId = await getUserId();

        if (storedToken) {
          setToken(storedToken);
          setRole(storedRole);
          setUserId(storedUserId);
        }
      } catch (error) {
        console.error("Failed to load auth data", error);
      } finally {
        setLoading(false);
      }
    };

    loadAuthData();
  }, []);

  const login = async (data) => {
    try {
      await saveAuthData(data.token, data.userRole, data.userId);
      setToken(data.token);
      setRole(data.userRole);
      setUserId(data.userId);
    } catch (error) {
      console.error("Failed to login", error);
    }
  };

  const logout = async () => {
    try {
      await clearAuthData();
      setToken(null);
      setRole(null);
      setUserId(null);
    } catch (error) {
      console.error("Failed to logout", error);
    }
  };

  return (
    <AuthContext.Provider value={{ token, role, userId, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

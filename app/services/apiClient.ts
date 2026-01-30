const API_BASE = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8081";

export const apiFetch = async (url: string, options: any = {}) => {
  const token = localStorage.getItem("token");

  return fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });
};

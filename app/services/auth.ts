import axios from 'axios';
import { Platform } from 'react-native';
import { clearAuthData } from '../utils/tokenStorage';
import { clearUserCache } from '../utils/userCache';

/* ======================================================
   API BASE URL
====================================================== */

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  (Platform.OS === 'android'
    ? 'http://10.0.2.2:8081'
    : 'http://192.168.1.19:8081');

console.log('[AUTH] API BASE URL:', API_BASE_URL);

/* ======================================================
   AXIOS CLIENT
====================================================== */

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Log requests
apiClient.interceptors.request.use((config) => {
  console.log('[AUTH] 🚀 Request:', config.method?.toUpperCase(), config.url);
  return config;
});

// Log responses & throw errors properly
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('[AUTH] ❌ API error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

/* ======================================================
   TYPES
====================================================== */

export interface RegisterUserData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: 'SENDER' | 'TRANSPORTER';
}

export interface AuthResponse {
  userId: number;
  userRole: string;
  token: string;
  message?: string;
}

/* ======================================================
   SIGNUP
====================================================== */

export const registerUser = async (
  userData: RegisterUserData
): Promise<AuthResponse> => {

  console.log('[AUTH] 📝 Signing up:', userData.email);

  const response = await apiClient.post('/users/auth/signup', {
    email: userData.email,
    password: userData.password,
    firstName: userData.firstName,
    lastName: userData.lastName,
    role: userData.role,
  });

  // backend must return token + userId
  if (!response.data?.token) {
    throw new Error('Signup failed: no token returned');
  }

  console.log('[AUTH] ✅ Signup success:', response.data);

  return response.data;
};

/* ======================================================
   LOGIN
====================================================== */

export const loginUser = async (
  email: string,
  password: string
): Promise<AuthResponse> => {

  console.log('[AUTH] 🔑 Logging in:', email);

  const response = await apiClient.post('/users/auth/login', {
    email,
    password,
  });

  if (!response.data?.token) {
    throw new Error('Login failed: no token returned');
  }

  console.log('[AUTH] ✅ Login success:', response.data);

  return response.data;
};

/* ======================================================
   GOOGLE COMPLETE PROFILE
====================================================== */

export const completeGoogleProfile = async (data: {
  email: string;
  phone: string;
  role: 'SENDER' | 'TRANSPORTER';
}) => {

  const response = await apiClient.post(
    '/users/auth/google/complete-profile',
    data
  );

  return response.data;
};

/* ======================================================
   LOGOUT
====================================================== */

export const logoutUser = async () => {
  await clearAuthData();
  await clearUserCache();
  console.log('[AUTH] 👋 Logged out');
};

export default {
  registerUser,
  loginUser,
  completeGoogleProfile,
  logoutUser,
};

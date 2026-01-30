/**
 * Auth Service
 * 
 * Handles authentication operations:
 * - User registration (signup)
 * - User login
 * - Google OAuth authentication
 * - Logout
 */

import apiClient from '../networking/client';
import { ENDPOINTS } from '../networking/endpoints';
import type { AuthResponse, GoogleRegisterRequest, SignUpRequest } from '../networking/types';
import { clearAuthData } from '../utils/tokenStorage';
import { clearUserCache } from '../utils/userCache';

/* ======================================================
<<<<<<< HEAD
   SIGNUP
====================================================== */

export const registerUser = async (
  userData: SignUpRequest
): Promise<AuthResponse> => {
  console.log('[AUTH] 📝 Signing up:', userData.email);

  try {
    const response = await apiClient.post<AuthResponse>(
      ENDPOINTS.AUTH.SIGNUP,
      {
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName || userData.firstName,
        role: userData.role,
      }
    );

    if (!response.data?.token) {
      throw new Error('Signup failed: no token returned');
    }

    console.log('[AUTH] ✅ Signup success');
    return response.data;

  } catch (error: any) {
    console.error('[AUTH] ❌ Registration failed:', error);

    const errorMessage =
      error.response?.data?.message || error.message || 'Registration failed';
    throw new Error(errorMessage);
  }
};

/* ======================================================
   LOGIN
====================================================== */

export const loginUser = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  console.log('[AUTH] � Logging in:', email);

  const response = await apiClient.post<AuthResponse>(
    ENDPOINTS.AUTH.LOGIN,
    {
      email,
      password,
    }
  );

  if (!response.data?.token) {
    throw new Error('Login failed: no token returned');
  }

  console.log('[AUTH] ✅ Login success');
=======
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

>>>>>>> 234c6a2 (Continue with google+updated profiles)
  return response.data;
};

/* ======================================================
<<<<<<< HEAD
   GOOGLE AUTH
====================================================== */

export const authenticateWithGoogle = async (
  idToken: string
): Promise<AuthResponse> => {
  console.log('[AUTH] 🔐 Authenticating with Google');

  const response = await apiClient.post<AuthResponse>(
    ENDPOINTS.AUTH.GOOGLE_AUTH,
    { idToken }
  );

  console.log('[AUTH] ✅ Google auth response received');
=======
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

>>>>>>> 234c6a2 (Continue with google+updated profiles)
  return response.data;
};

/* ======================================================
<<<<<<< HEAD
   GOOGLE REGISTER (with role selection)
====================================================== */

export const registerWithGoogle = async (
  userData: GoogleRegisterRequest
): Promise<AuthResponse> => {
  console.log('[AUTH] � Registering with Google:', userData.email);

  const response = await apiClient.post<AuthResponse>(
    ENDPOINTS.AUTH.GOOGLE_REGISTER,
    userData
  );

  if (!response.data?.token) {
    throw new Error('Google registration failed: no token returned');
  }

  console.log('[AUTH] ✅ Google registration success');
=======
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

>>>>>>> 234c6a2 (Continue with google+updated profiles)
  return response.data;
};

/* ======================================================
   LOGOUT
====================================================== */

<<<<<<< HEAD
export const logoutUser = async (): Promise<void> => {
=======
export const logoutUser = async () => {
>>>>>>> 234c6a2 (Continue with google+updated profiles)
  await clearAuthData();
  await clearUserCache();
  console.log('[AUTH] 👋 Logged out');
};

/* ======================================================
   EXPORTS
====================================================== */

export default {
  registerUser,
  loginUser,
<<<<<<< HEAD
  authenticateWithGoogle,
  registerWithGoogle,
=======
  completeGoogleProfile,
>>>>>>> 234c6a2 (Continue with google+updated profiles)
  logoutUser,
};

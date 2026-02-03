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
  return response.data;
};

/* ======================================================
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
  return response.data;
};

/* ======================================================
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
  return response.data;
};

/* ======================================================
   LOGOUT
====================================================== */

export const logoutUser = async (): Promise<void> => {
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
  authenticateWithGoogle,
  registerWithGoogle,
  logoutUser,
};

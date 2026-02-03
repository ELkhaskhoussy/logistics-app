/**
 * Authentication Service
 * 
 * Handles user authentication operations:
 * - User registration (signup)
 * - User login
 * - Google OAuth
 * - Logout
 */

import apiClient from '../networking/client';
import { ENDPOINTS } from '../networking/endpoints';
import type {
  AuthResponse,
  GoogleRegisterRequest,
  LoginRequest,
  SignUpRequest
} from '../networking/types';
import { clearAuthData } from '../utils/tokenStorage';
import { clearUserCache } from '../utils/userCache';

<<<<<<< HEAD
// Platform-specific API URL configuration
// Android Emulator: Use 10.0.2.2 to access host machine's localhost
// iOS Simulator/Web: Use localhost
const getApiBaseUrl = (): string => {
    const defaultPort = 8080; // user-service port (confirmed in backend application.yml)

    // Check for environment variable first
    if (process.env.EXPO_PUBLIC_API_URL) {
        console.log('[AUTH] Using API URL from env:', process.env.EXPO_PUBLIC_API_URL);
        return process.env.EXPO_PUBLIC_API_URL;
    }

    // Platform-specific URLs
    if (Platform.OS === 'android') {
        const androidUrl = `http://10.0.2.2:${defaultPort}`;
        console.log('[AUTH] Platform: Android - Using emulator URL:', androidUrl);
        return androidUrl;
    } else {
        const localUrl = `http://localhost:${defaultPort}`;
        console.log('[AUTH] Platform:', Platform.OS, '- Using localhost URL:', localUrl);
        return localUrl;
    }
};

const API_BASE_URL = getApiBaseUrl();

console.log('[AUTH] API Base URL configured as:', API_BASE_URL);

// Create axios instance with default config
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 15000, // 15 seconds timeout
});

// Add request interceptor for debugging
apiClient.interceptors.request.use(
    (config) => {
        console.log('[AUTH] 🚀 Making request:', {
            method: config.method?.toUpperCase(),
            url: config.url,
            baseURL: config.baseURL,
            fullURL: `${config.baseURL}${config.url}`,
        });
        return config;
    },
    (error) => {
        console.error('[AUTH] ❌ Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// Add response interceptor for debugging
apiClient.interceptors.response.use(
    (response) => {
        console.log('[AUTH] ✅ Response received:', {
            status: response.status,
            statusText: response.statusText,
            data: response.data,
        });
        return response;
    },
    (error) => {
        console.error('[AUTH] ❌ Response error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
        });
        return Promise.reject(error);
    }
);

// Types matching backend DTOs
export interface RegisterUserData {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: 'SENDER' | 'TRANSPORTER';
    phone?: string;
    vehicleType?: string;
    licensePlate?: string;
}

export interface RegisterResponse {
    success: boolean;
    message: string;
    userId?: number;
    token?: string;
    userRole?: string;
}

/**
 * Register a new user (sender or transporter)
 * Endpoint: POST /signup
 * 
 * @param userData - User registration data
 * @returns Promise with registration response
 */
export const registerUser = async (userData: RegisterUserData): Promise<RegisterResponse> => {
    console.log('[AUTH] 📝 registerUser called with data:', {
        email: userData.email,
        role: userData.role,
        firstName: userData.firstName,
        lastName: userData.lastName,
        hasPhone: !!userData.phone,
        hasVehicleType: !!userData.vehicleType,
        hasLicensePlate: !!userData.licensePlate,
    });

    try {
        // Prepare request matching backend SignUpRequest DTO
        const requestBody = {
            email: userData.email,
            password: userData.password,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: userData.role, // SENDER or TRANSPORTER (uppercase)
        };

        console.log('[AUTH] 📤 Sending registration request to:', `${API_BASE_URL}/users/auth/signup`);
        console.log('[AUTH] 📦 Request body:', JSON.stringify(requestBody, null, 2));

        const response = await apiClient.post('/users/auth/signup', requestBody);

        // Backend returns: { token, message, userRole, userId }
        console.log('[AUTH] ✅ Registration successful!', response.data);

        return {
            success: true,
            message: response.data.message || 'Registration successful',
            userId: response.data.userId,
            token: response.data.token,
            userRole: response.data.userRole,
        };
    } catch (error: any) {
        console.error('[AUTH] ❌ Registration error caught:', error);

        // Detailed error logging
        if (error.response) {
            // Server responded with error status
            console.error('[AUTH] Server error response:', {
                status: error.response.status,
                statusText: error.response.statusText,
                data: error.response.data,
                headers: error.response.headers,
            });

            const errorMessage = error.response.data?.message
                || error.response.data?.error
                || `Server error: ${error.response.status}`;

            throw new Error(errorMessage);
        } else if (error.request) {
            // Request made but no response received
            console.error('[AUTH] No response received:', {
                request: error.request,
                message: error.message,
            });

            throw new Error('Unable to connect to server. Please ensure the backend is running on ' + API_BASE_URL);
        } else {
            // Something else went wrong
            console.error('[AUTH] Unexpected error:', error.message);
            throw new Error('An unexpected error occurred: ' + error.message);
        }
    }
=======
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
        lastName: userData.lastName || userData.firstName, // Fallback to firstName
        role: userData.role,
      }
    );

    // Backend must return token + userId
    if (!response.data?.token) {
      throw new Error('Signup failed: no token returned');
    }

    console.log('[AUTH] ✅ Signup success');
    return response.data;

  } catch (error: any) {
    console.error('[AUTH] ❌ Registration failed:', error);

    // Extract actual error message from backend
    const errorMessage =
      error.response?.data?.message || error.message || 'Registration failed';
    throw new Error(errorMessage);
  }
>>>>>>> ddf968e (fixing last rebase)
};

/**
 * Login user
 * Endpoint: POST /users/auth/login
 */
export const loginUser = async (email: string, password: string) => {
    console.log('[AUTH] 🔑 loginUser called for:', email);

<<<<<<< HEAD
    try {
        const response = await apiClient.post('/users/auth/login', {
            email,
            password,
        });

        console.log('[AUTH] ✅ Login successful!', response.data);

        return {
            success: true,
            ...response.data,
        };
    } catch (error: any) {
        console.error('[AUTH] ❌ Login error:', error);
=======
export const loginUser = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  console.log('[AUTH] 🔑 Logging in:', email);

  const response = await apiClient.post<AuthResponse>(
    ENDPOINTS.AUTH.LOGIN,
    {
      email,
      password,
    }
  );
>>>>>>> ddf968e (fixing last rebase)

        if (error.response) {
            // Server responded with error
            const status = error.response.status;
            const message = error.response.data?.message;

<<<<<<< HEAD
            if (status === 401 || status === 403) {
                // Invalid credentials
                throw new Error(message || 'Invalid email or password');
            } else if (status === 404) {
                // User not found
                throw new Error('Email address not found. Please sign up first.');
            } else {
                // Other server errors
                throw new Error(message || 'Login failed. Please try again.');
            }
        } else if (error.request) {
            // Request made but no response
            throw new Error('Unable to connect to server. Please check your internet connection.');
        } else {
            // Something else went wrong
            throw new Error('An unexpected error occurred. Please try again.');
        }
    }
};

/**
 * Logout user
 * Clears all stored authentication data
 */
export const logoutUser = async () => {
    console.log('[AUTH] 👋 logoutUser called');
    try {
        await clearAuthData();
        await clearUserCache();
        console.log('[AUTH] ✅ Logout successful - token and cache cleared');
    } catch (error) {
        console.error('[AUTH] ❌ Logout error:', error);
        throw error;
    }
=======
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

  // Note: New users will have needsRoleSelection=true WITHOUT a token
  // Existing users will have token + userRole
  // Both are valid responses, so we don't check for token here

  console.log('[AUTH] ✅ Google auth response received');
  return response.data;
};

/* ======================================================
   GOOGLE REGISTER (with role selection)
====================================================== */

export const registerWithGoogle = async (
  userData: GoogleRegisterRequest
): Promise<AuthResponse> => {
  console.log('[AUTH] 📝 Registering with Google:', userData.email);

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
>>>>>>> ddf968e (fixing last rebase)
};

/* ======================================================
   EXPORTS
====================================================== */

export default {
<<<<<<< HEAD
    registerUser,
    loginUser,
    logoutUser,
=======
  registerUser,
  loginUser,
  authenticateWithGoogle,
  registerWithGoogle,
  logoutUser,
>>>>>>> ddf968e (fixing last rebase)
};

// Export types for convenience
export type { AuthResponse, GoogleRegisterRequest, LoginRequest, SignUpRequest };


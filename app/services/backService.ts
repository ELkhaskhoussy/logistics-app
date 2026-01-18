import axios, { AxiosInstance } from 'axios';
import { getToken } from '../utils/tokenStorage';

/**
 * Centralized Backend Service Configuration
 * - Live Backend URL: http://84.46.254.94:8080
 * - Provides a configured axios instance for all API calls
 * - Handles authentication token injection
 * - Implements request/response logging
 */

// ============================================
// API Base URL Configuration
// ============================================

/**
 * Live backend URL - used for all environments
 * Override with EXPO_PUBLIC_API_URL environment variable if needed
 */
const LIVE_BACKEND_URL = 'http://84.46.254.94:8080';

export const getApiBaseUrl = (): string => {
    // Allow environment variable override for testing
    if (process.env.EXPO_PUBLIC_API_URL) {
        console.log('[BACK-SERVICE] Using API URL from env:', process.env.EXPO_PUBLIC_API_URL);
        return process.env.EXPO_PUBLIC_API_URL;
    }

    console.log('[BACK-SERVICE] Using live backend URL:', LIVE_BACKEND_URL);
    return LIVE_BACKEND_URL;
};

export const API_BASE_URL = getApiBaseUrl();

// ============================================
// Axios Instance Configuration
// ============================================

/**
 * Pre-configured axios instance for all API calls
 * - Base URL points to live backend
 * - 15 second timeout
 * - Automatic JSON content-type header
 * - Request/response interceptors for logging and auth
 */
export const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// ============================================
// Request Interceptor
// ============================================

/**
 * Intercept all outgoing requests to:
 * - Automatically inject JWT token from storage
 * - Log request details for debugging
 */
apiClient.interceptors.request.use(
    async (config) => {
        // Log request details
        console.log('[BACK-SERVICE] 🚀 Request:', {
            method: config.method?.toUpperCase(),
            url: config.url,
            baseURL: config.baseURL,
            fullURL: `${config.baseURL}${config.url}`,
        });

        // Inject authentication token if available
        try {
            const token = await getToken();
            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
                console.log('[BACK-SERVICE] 🔑 Token injected');
            }
        } catch (error) {
            console.warn('[BACK-SERVICE] ⚠️ Could not retrieve token:', error);
        }

        return config;
    },
    (error) => {
        console.error('[BACK-SERVICE] ❌ Request interceptor error:', error);
        return Promise.reject(error);
    }
);

// ============================================
// Response Interceptor
// ============================================

/**
 * Intercept all incoming responses to:
 * - Log response details
 * - Handle common error cases
 */
apiClient.interceptors.response.use(
    (response) => {
        console.log('[BACK-SERVICE] ✅ Response:', {
            status: response.status,
            statusText: response.statusText,
            url: response.config.url,
        });
        return response;
    },
    (error) => {
        const status = error.response?.status;
        const url = error.config?.url;

        console.error('[BACK-SERVICE] ❌ Response error:', {
            url,
            status,
            message: error.message,
            data: error.response?.data,
        });

        // Handle common HTTP errors
        if (error.response) {
            switch (status) {
                case 401:
                    console.error('[BACK-SERVICE] 🔒 Unauthorized - Token may be expired');
                    break;
                case 403:
                    console.error('[BACK-SERVICE] 🚫 Forbidden - Insufficient permissions');
                    break;
                case 404:
                    console.error('[BACK-SERVICE] 🔍 Not Found');
                    break;
                case 500:
                    console.error('[BACK-SERVICE] 💥 Server Error');
                    break;
            }
        } else if (error.request) {
            console.error('[BACK-SERVICE] 📡 No response received - Network issue or server down');
        }

        return Promise.reject(error);
    }
);

// ============================================
// Exports
// ============================================

export default {
    apiClient,
    API_BASE_URL,
    getApiBaseUrl,
};

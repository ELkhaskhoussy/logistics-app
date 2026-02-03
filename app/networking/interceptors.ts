import { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { getToken } from '../utils/tokenStorage';

/**
 * Request Interceptor
 * 
 * Automatically injects JWT token and logs request details
 */
const requestInterceptor = async (config: AxiosRequestConfig) => {
    // Log request details
    console.log('[API] 🚀 Request:', {
        method: config.method?.toUpperCase(),
        url: config.url,
        fullURL: `${config.baseURL}${config.url}`,
    });

    // Inject JWT token if available
    try {
        const token = await getToken();
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('[API] 🔑 Token injected');
        }
    } catch (error) {
        console.warn('[API] ⚠️ Could not retrieve token:', error);
    }

    return config;
};

/**
 * Request Error Interceptor
 */
const requestErrorInterceptor = (error: any) => {
    console.error('[API] ❌ Request error:', error);
    return Promise.reject(error);
};

/**
 * Response Interceptor
 * 
 * Logs successful responses
 */
const responseInterceptor = (response: AxiosResponse) => {
    console.log('[API] ✅ Response:', {
        status: response.status,
        statusText: response.statusText,
        url: response.config.url,
    });
    return response;
};

/**
 * Response Error Interceptor
 * 
 * Handles common error cases and logs error details
 */
const responseErrorInterceptor = (error: AxiosError) => {
    const status = error.response?.status;
    const url = error.config?.url;

    console.error('[API] ❌ Response error:', {
        url,
        status,
        message: error.message,
        data: error.response?.data,
    });

    // Handle common HTTP errors
    if (error.response) {
        switch (status) {
            case 401:
                console.error('[API] 🔒 Unauthorized - Token may be expired');
                break;
            case 403:
                console.error('[API] 🚫 Forbidden - Insufficient permissions');
                break;
            case 404:
                console.error('[API] 🔍 Not Found');
                break;
            case 500:
                console.error('[API] 💥 Server Error');
                break;
        }
    } else if (error.request) {
        console.error('[API] 🌐 No response received - Network issue or server down');
    }

    return Promise.reject(error);
};

/**
 * Setup all interceptors on the provided Axios instance
 */
export const setupInterceptors = (client: AxiosInstance): void => {
    // Request interceptors
    client.interceptors.request.use(
        requestInterceptor,
        requestErrorInterceptor
    );

    // Response interceptors
    client.interceptors.response.use(
        responseInterceptor,
        responseErrorInterceptor
    );
};

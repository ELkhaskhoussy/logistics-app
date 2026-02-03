/**
 * Centralized API Client
 * 
 * Single Axios instance used throughout the application
 * Configured with environment-based base URL and interceptors
 */

import axios, { AxiosInstance } from 'axios';
import { getApiConfig } from './config';
import { setupInterceptors } from './interceptors';

/**
 * Create and configure the API client
 */
const createApiClient = (): AxiosInstance => {
    const config = getApiConfig();

    const client = axios.create({
        baseURL: config.baseURL,
        timeout: config.timeout,
        headers: {
            'Content-Type': 'application/json',
        },
    });

    // Setup interceptors
    setupInterceptors(client);

    console.log('[API CLIENT] Initialized with base URL:', config.baseURL);

    return client;
};

/**
 * Single API client instance
 * Import this in all service files
 */
export const apiClient = createApiClient();

/**
 * Default export
 */
export default apiClient;

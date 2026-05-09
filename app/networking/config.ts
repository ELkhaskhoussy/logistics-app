/**
 * Environment Configuration
 * 
 * Manages API base URLs for different environments (development, production)
 * Automatically uses EXPO_PUBLIC_API_URL from .env if available
 */

export type Environment = 'development' | 'production';

export interface ApiConfig {
    baseURL: string;
    timeout: number;
}

/**
 * API configuration for each environment
 */
export const API_CONFIG: Record<Environment, ApiConfig> = {
    development: {
        baseURL: 'http://localhost:8080',  // Local backend for web dev
        timeout: 15000,
    },
    production: {
        baseURL: '/api',  // Nginx reverse proxy — avoids CORS, no hardcoded IP
        timeout: 30000,
    },
};

/**
 * Get current environment from process.env or default to development
 */
export const getEnvironment = (): Environment => {
    const env = process.env.EXPO_PUBLIC_ENV as Environment;
    return env === 'production' ? 'production' : 'development';
};

/**
 * Get API configuration for current environment
 * Priority: process.env.EXPO_PUBLIC_API_URL > environment config
 */
export const getApiConfig = (): ApiConfig => {
    const env = getEnvironment();
    const config = API_CONFIG[env];

    // Allow environment variable to override
    if (process.env.EXPO_PUBLIC_API_URL) {
        return {
            ...config,
            baseURL: process.env.EXPO_PUBLIC_API_URL,
        };
    }

    console.log(`[NETWORKING] Environment: ${env}, Base URL: ${config.baseURL}`);
    return config;
};

/**
 * Get base API URL for current environment
 */
export const getApiBaseUrl = (): string => {
    return getApiConfig().baseURL;
};

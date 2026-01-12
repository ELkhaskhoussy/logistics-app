import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'auth_token';
const USER_ROLE_KEY = 'user_role';
const USER_ID_KEY = 'user_id';

/**
 * Platform-safe storage wrapper
 * Uses SecureStore for native (iOS/Android) and localStorage for web
 */

/**
 * Save authentication data securely
 * Native: Uses SecureStore (encrypted)
 * Web: Uses localStorage (not encrypted - use HTTPS in production)
 */
export const saveAuthData = async (token: string, userRole: string | any, userId: number): Promise<void> => {
    try {
        // Convert userRole to string if it's an object/enum
        const roleString = typeof userRole === 'string' ? userRole : String(userRole);

        if (Platform.OS === 'web') {
            // Web: Use localStorage
            localStorage.setItem(TOKEN_KEY, token);
            localStorage.setItem(USER_ROLE_KEY, roleString);
            localStorage.setItem(USER_ID_KEY, userId.toString());
            console.log('✅ [TOKEN] Auth data saved to localStorage (web)', { role: roleString });
        } else {
            // Native: Use SecureStore
            await SecureStore.setItemAsync(TOKEN_KEY, token);
            await SecureStore.setItemAsync(USER_ROLE_KEY, roleString);
            await SecureStore.setItemAsync(USER_ID_KEY, userId.toString());
            console.log('✅ [TOKEN] Auth data saved to SecureStore (native)', { role: roleString });
        }
    } catch (error) {
        console.error('❌ [TOKEN] Failed to save auth data:', error);
        throw error;
    }
};

/**
 * Get stored authentication token
 */
export const getToken = async (): Promise<string | null> => {
    try {
        if (Platform.OS === 'web') {
            return localStorage.getItem(TOKEN_KEY);
        } else {
            return await SecureStore.getItemAsync(TOKEN_KEY);
        }
    } catch (error) {
        console.error('❌ [TOKEN] Failed to get token:', error);
        return null;
    }
};

/**
 * Get stored user role
 */
export const getUserRole = async (): Promise<string | null> => {
    try {
        if (Platform.OS === 'web') {
            return localStorage.getItem(USER_ROLE_KEY);
        } else {
            return await SecureStore.getItemAsync(USER_ROLE_KEY);
        }
    } catch (error) {
        console.error('❌ [TOKEN] Failed to get user role:', error);
        return null;
    }
};

/**
 * Get stored user ID
 */
export const getUserId = async (): Promise<number | null> => {
    try {
        let userId: string | null;
        if (Platform.OS === 'web') {
            userId = localStorage.getItem(USER_ID_KEY);
        } else {
            userId = await SecureStore.getItemAsync(USER_ID_KEY);
        }
        return userId ? parseInt(userId, 10) : null;
    } catch (error) {
        console.error('❌ [TOKEN] Failed to get user ID:', error);
        return null;
    }
};

/**
 * Clear all authentication data (for logout)
 */
export const clearAuthData = async (): Promise<void> => {
    try {
        if (Platform.OS === 'web') {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_ROLE_KEY);
            localStorage.removeItem(USER_ID_KEY);
            console.log('✅ [TOKEN] Auth data cleared from localStorage (web)');
        } else {
            await SecureStore.deleteItemAsync(TOKEN_KEY);
            await SecureStore.deleteItemAsync(USER_ROLE_KEY);
            await SecureStore.deleteItemAsync(USER_ID_KEY);
            console.log('✅ [TOKEN] Auth data cleared from SecureStore (native)');
        }
    } catch (error) {
        console.error('❌ [TOKEN] Failed to clear auth data:', error);
        throw error;
    }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = async (): Promise<boolean> => {
    const token = await getToken();
    return token !== null && token !== '';
};

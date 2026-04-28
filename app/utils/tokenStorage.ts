import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const TOKEN_KEY = 'auth_token';
const USER_ROLE_KEY = 'user_role';
const USER_ID_KEY = 'user_id';
const GOOGLE_USER_KEY = 'googleUser';

/**
 * Platform-safe storage wrapper
 * Uses AsyncStorage for native (iOS/Android) and localStorage for web
 */

/**
 * Save authentication data securely
 * Native: Uses AsyncStorage
 * Web: Uses localStorage
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
            // Native: Use AsyncStorage
            await AsyncStorage.setItem(TOKEN_KEY, token);
            await AsyncStorage.setItem(USER_ROLE_KEY, roleString);
            await AsyncStorage.setItem(USER_ID_KEY, userId.toString());
            console.log('✅ [TOKEN] Auth data saved to AsyncStorage (native)', { role: roleString });
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
            return await AsyncStorage.getItem(TOKEN_KEY);
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
            return await AsyncStorage.getItem(USER_ROLE_KEY);
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
            userId = await AsyncStorage.getItem(USER_ID_KEY);
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
            await AsyncStorage.removeItem(TOKEN_KEY);
            await AsyncStorage.removeItem(USER_ROLE_KEY);
            await AsyncStorage.removeItem(USER_ID_KEY);
            console.log('✅ [TOKEN] Auth data cleared from AsyncStorage (native)');
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

/**
 * Save Google user data temporarily for role selection
 */
export const saveGoogleUser = async (data: any): Promise<void> => {
    try {
        const json = JSON.stringify(data);
        if (Platform.OS === 'web') {
            localStorage.setItem(GOOGLE_USER_KEY, json);
        } else {
            await AsyncStorage.setItem(GOOGLE_USER_KEY, json);
        }
    } catch (error) {
        console.error('❌ [TOKEN] Failed to save Google user:', error);
    }
};

/**
 * Get temporary Google user data
 */
export const getGoogleUser = async (): Promise<any | null> => {
    try {
        let json: string | null = null;
        if (Platform.OS === 'web') {
            json = localStorage.getItem(GOOGLE_USER_KEY);
        } else {
            json = await AsyncStorage.getItem(GOOGLE_USER_KEY);
        }
        return json ? JSON.parse(json) : null;
    } catch (error) {
        console.error('❌ [TOKEN] Failed to get Google user:', error);
        return null;
    }
};

/**
 * Clear temporary Google user data
 */
export const clearGoogleUser = async (): Promise<void> => {
    try {
        if (Platform.OS === 'web') {
            localStorage.removeItem(GOOGLE_USER_KEY);
        } else {
            await AsyncStorage.removeItem(GOOGLE_USER_KEY);
        }
    } catch (error) {
        console.error('❌ [TOKEN] Failed to clear Google user:', error);
    }
};

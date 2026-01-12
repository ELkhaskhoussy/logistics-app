import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_CACHE_PREFIX = 'user_profile_';

/**
 * User profile caching utilities using AsyncStorage
 * Provides persistent storage optimized for mobile
 */

export interface UserProfile {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    imageUrl?: string;
    role: string;
}

/**
 * Save user profile to cache
 */
export const saveUserToCache = async (userId: number, userData: UserProfile): Promise<void> => {
    try {
        const key = `${USER_CACHE_PREFIX}${userId}`;
        await AsyncStorage.setItem(key, JSON.stringify(userData));
        console.log('✅ [CACHE] User profile saved to cache');
    } catch (error) {
        console.error('❌ [CACHE] Failed to save user profile:', error);
    }
};

/**
 * Get user profile from cache
 */
export const getUserFromCache = async (userId: number): Promise<UserProfile | null> => {
    try {
        const key = `${USER_CACHE_PREFIX}${userId}`;
        const cachedData = await AsyncStorage.getItem(key);

        if (cachedData) {
            console.log('✅ [CACHE] User profile found in cache');
            return JSON.parse(cachedData);
        }

        console.log('[CACHE] No cached user profile found');
        return null;
    } catch (error) {
        console.error('❌ [CACHE] Failed to get user profile from cache:', error);
        return null;
    }
};

/**
 * Clear all user profile cache
 * Called on logout
 */
export const clearUserCache = async (): Promise<void> => {
    try {
        // Get all keys
        const keys = await AsyncStorage.getAllKeys();

        // Filter keys that start with user profile prefix
        const userKeys = keys.filter(key => key.startsWith(USER_CACHE_PREFIX));

        // Remove all user profile keys
        if (userKeys.length > 0) {
            await AsyncStorage.multiRemove(userKeys);
            console.log(`✅ [CACHE] Cleared ${userKeys.length} user profile(s) from cache`);
        }
    } catch (error) {
        console.error('❌ [CACHE] Failed to clear user cache:', error);
    }
};

/**
 * Check if valid cache exists for user
 */
export const hasValidCache = async (userId: number): Promise<boolean> => {
    const cachedUser = await getUserFromCache(userId);
    return cachedUser !== null;
};

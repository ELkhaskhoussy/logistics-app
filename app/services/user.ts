import backService from './backService';
import { getToken } from '../utils/tokenStorage';
import { getUserFromCache, saveUserToCache, UserProfile } from '../utils/userCache';


/**
 * Fetch user profile with caching
 * Checks cache first, fetches from backend if not found
 */
export const fetchUserProfile = async (userId: number): Promise<UserProfile> => {
    console.log(`[USER] Fetching profile for user ID: ${userId}`);

    // Check cache first
    const cachedUser = await getUserFromCache(userId);
    if (cachedUser) {
        console.log('[USER] ✅ Using cached profile data');
        return cachedUser;
    }

    // Cache miss - fetch from backend
    console.log('[USER] Cache miss, fetching from backend...');

    // Get authentication token
    const token = await getToken();
    if (!token) {
        throw new Error('No authentication token found. Please login again.');
    }

    try {
        const response = await backService.get(`/users/${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });
        const userData: UserProfile = response.data;

        console.log('[USER] ✅ Profile fetched from backend:', userData);

        // Save to cache for future use
        await saveUserToCache(userId, userData);

        return userData;
    } catch (error: any) {
        console.error('[USER] ❌ Failed to fetch profile:', error);

        if (error.response) {
            throw new Error(error.response.data?.message || 'Failed to fetch user profile');
        } else if (error.request) {
            throw new Error('Unable to connect to server');
        } else {
            throw new Error('An unexpected error occurred');
        }
    }
};

/**
 * Update user profile (future feature)
 * Would invalidate cache and refetch
 */
export const updateUserProfile = async (userId: number, updates: Partial<UserProfile>): Promise<UserProfile> => {
    // TODO: Implement PUT /users/{id} endpoint
    throw new Error('Not implemented yet');
};

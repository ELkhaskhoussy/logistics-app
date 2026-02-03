<<<<<<< HEAD
import { getToken } from '../utils/tokenStorage';
import { getUserFromCache, saveUserToCache, UserProfile } from '../utils/userCache';
import { apiClient } from './backService';


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
        const response = await apiClient.get(`/users/${userId}`, {
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
 * Update user's phone number
 */
export const updateUserPhone = async (userId: number, phone: string): Promise<void> => {
    console.log(`[USER] Updating phone for user ID: ${userId}`);

    const token = await getToken();
    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        await apiClient.put(
            `/users/${userId}/phone`,
            { phone },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            }
        );

        console.log('[USER] ✅ Phone number updated successfully');

        // Clear cache to force refetch on next profile load
        const { clearUserCache } = require('../utils/userCache');
        await clearUserCache();

    } catch (error: any) {
        console.error('[USER] ❌ Failed to update phone:', error);
        throw new Error(error.response?.data?.message || 'Failed to update phone number');
    }
};

/**
 * Update user profile (future feature)
 * Would invalidate cache and refetch
 */
export const updateUserProfile = async (userId: number, updates: Partial<UserProfile>): Promise<UserProfile> => {
    // TODO: Implement PUT /users/{id} endpoint
    throw new Error('Not implemented yet');
=======
/**
 * User Service
 * 
 * Handles user-related operations:
 * - Get user by ID
 * - Update user phone
 * - Update user profile
 */

import apiClient from '../networking/client';
import { ENDPOINTS } from '../networking/endpoints';
import type { User } from '../networking/types';

/* ======================================================
   GET USER BY ID
====================================================== */

export const getUserById = async (id: number): Promise<User> => {
  const response = await apiClient.get<User>(ENDPOINTS.USERS.GET_BY_ID(id));
  return response.data;
};

/* ======================================================
   UPDATE USER PHONE
====================================================== */

export const updateUserPhone = async (
  id: number,
  phone: string
): Promise<User> => {
  const response = await apiClient.put<User>(
    ENDPOINTS.USERS.UPDATE_PHONE(id),
    { phone }
  );
  return response.data;
};

/* ======================================================
   EXPORTS
====================================================== */

export default {
  getUserById,
  updateUserPhone,
>>>>>>> ddf968e (fixing last rebase)
};

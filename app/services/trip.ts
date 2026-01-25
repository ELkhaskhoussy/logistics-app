import { getToken } from '../utils/tokenStorage';
import { API_BASE_URL, apiClient } from './backService';

// Using centralized backend service configuration
console.log('[TRIP-SERVICE] Using API_BASE_URL:', API_BASE_URL);

// ============================================
// Collection & Delivery Stop DTOs
// ============================================

export interface CollectionStopDTO {
    city?: string;
    locationName?: string;
    fullAddress?: string;
    startTime?: string;  // ISO format LocalDateTime
    endTime?: string;    // ISO format LocalDateTime
}

export interface DeliveryStopDTO {
    city?: string;
    locationName?: string;
    fullAddress?: string;
    startTime?: string;
    endTime?: string;
}

// ============================================
// Trip DTOs
// ============================================

export interface CreateTripRequest {
    transporterId: number;
    totalCapacityKg: number;
    departureCity: string;
    arrivalCity: string;
    departureTime: string;  // ISO8601 format
    arrivalTime: string;    // ISO8601 format
    pricePerKg: number;
    collectionStops: CollectionStopDTO[];
    deliveryStops: DeliveryStopDTO[];
}

export interface Trip {
    id: string;
    transporterId: number;
    status: string;
    totalCapacityKg: number;
    availableCapacityKg: number;
    departureCity: string;
    arrivalCity: string;
    departureTime: string;
    arrivalTime: string;
    pricePerKg: number;
    createdAt: string;
}

// ============================================
// Transporter Profile DTOs
// ============================================

export interface TransporterProfileDTO {
    displayName: string;
    bio: string;
    pricingPerKg: number;
    vehicleType?: string;
    licensePlate?: string;
}

export interface TransporterProfileResponse {
    id: number;
    userId: number;
    displayName: string;
    bio: string;
    pricingPerKg: number;
    photoUrl?: string;
    vehicleType?: string;
    licensePlate?: string;
}

// ============================================
// Trip Management Functions
// ============================================

/**
 * Create a new trip
 */
export const createTrip = async (tripData: CreateTripRequest): Promise<Trip> => {
    console.log('[TRIP] Creating trip with data:', tripData);

    const token = await getToken();
    if (!token) {
        throw new Error('No authentication token found. Please login again.');
    }

    try {
        const response = await apiClient.post(
            '/catalog/trips',
            tripData,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            }
        );

        console.log('[TRIP] ✅ Trip created successfully:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('[TRIP] ❌ Failed to create trip:', error);
        console.error('[TRIP] Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status,
            headers: error.response?.headers,
        });

        if (error.response) {
            const status = error.response.status;
            const message = error.response.data?.message || error.response.data?.error;
            const fullError = JSON.stringify(error.response.data, null, 2);

            console.error('[TRIP] Server returned:', fullError);

            if (status === 401 || status === 403) {
                throw new Error('Authentication failed. Please login again.');
            } else if (status === 400) {
                throw new Error(message || `Invalid trip data: ${fullError}`);
            } else {
                throw new Error(message || `Failed to create trip (Error ${status})`);
            }
        } else if (error.request) {
            console.error('[TRIP] No response from server. Request:', error.request);
            throw new Error('Unable to connect to server. Please check your internet connection.');
        } else {
            throw new Error('An unexpected error occurred');
        }
    }
};

/**
 * Fetch trips for a transporter
 */
export const fetchTransporterTrips = async (transporterId: number): Promise<Trip[]> => {
    console.log(`[TRIP] Fetching trips for transporter ID: ${transporterId}`);

    const token = await getToken();
    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        const response = await apiClient.get(
            `/catalog/trips/transporter/${transporterId}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            }
        );

        console.log('[TRIP] ✅ Trips fetched:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('[TRIP] ❌ Failed to fetch trips:', error);

        if (error.response) {
            throw new Error(error.response.data?.message || 'Failed to fetch trips');
        } else if (error.request) {
            throw new Error('Unable to connect to server');
        } else {
            throw new Error('An unexpected error occurred');
        }
    }
};

// ============================================
// Transporter Profile Management
// ============================================

/**
 * Create a new transporter profile
 */
export const createTransporterProfile = async (
    userId: number,
    profileData: TransporterProfileDTO
): Promise<void> => {
    console.log(`[TRANSPORTER] Creating profile for user ID: ${userId}`);

    const token = await getToken();
    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        await apiClient.post(
            `/catalog/transporters?userId=${userId}`,
            profileData,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            }
        );
        console.log('[TRANSPORTER] ✅ Profile created successfully');
    } catch (error: any) {
        console.error('[TRANSPORTER] ❌ Failed to create profile:', error);
        throw new Error(error.response?.data?.error || 'Failed to create transporter profile');
    }
};

/**
 * Fetch transporter profile by user ID
 */
export const fetchTransporterProfile = async (
    userId: number
): Promise<TransporterProfileResponse | null> => {
    console.log(`[TRANSPORTER] Fetching profile for user ID: ${userId}`);

    const token = await getToken();
    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        const response = await apiClient.get(
            `/catalog/transporters/${userId}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            }
        );
        console.log('[TRANSPORTER] ✅ Profile fetched:', response.data);
        return response.data;
    } catch (error: any) {
        if (error.response?.status === 404) {
            console.log('[TRANSPORTER] Profile not found');
            return null;
        }
        console.error('[TRANSPORTER] ❌ Failed to fetch profile:', error);
        throw new Error('Failed to fetch transporter profile');
    }
};

/**
 * Update transporter profile
 */
export const updateTransporterProfile = async (
    userId: number,
    updates: Partial<TransporterProfileDTO>
): Promise<void> => {
    console.log(`[TRANSPORTER] Updating profile for user ID: ${userId}`);

    const token = await getToken();
    if (!token) {
        throw new Error('No authentication token found');
    }

    try {
        await apiClient.put(
            `/catalog/transporters/${userId}`,
            updates,
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            }
        );
        console.log('[TRANSPORTER] ✅ Profile updated successfully');
    } catch (error: any) {
        console.error('[TRANSPORTER] ❌ Failed to update profile:', error);
        throw new Error('Failed to update transporter profile');
    }
};

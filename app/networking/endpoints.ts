/**
 * Centralized API Endpoints
 * 
 * All API endpoint paths are defined here for easy maintenance
 * All endpoints go through the API Gateway (port 8080)
 */

export const ENDPOINTS = {
    // ==========================================
    // Authentication Endpoints
    // ==========================================
    AUTH: {
        SIGNUP: '/users/auth/signup',
        LOGIN: '/users/auth/login',
        GOOGLE_AUTH: '/users/auth/google',
        GOOGLE_REGISTER: '/users/auth/google/register',
        LOGOUT: '/users/auth/logout',
    },

    // ==========================================
    // User Endpoints
    // ==========================================
    USERS: {
        GET_BY_ID: (id: number) => `/users/${id}`,
        UPDATE_PHONE: (id: number) => `/users/${id}/phone`,
        UPDATE_PROFILE: (id: number) => `/users/${id}`,
    },

    // ==========================================
    // Catalog Endpoints - Transporter
    // ==========================================
    CATALOG: {
        // Transporter Profile
        GET_TRANSPORTER_PROFILE: (id: number) => `/catalog/transporters/${id}`,
        CREATE_TRANSPORTER_PROFILE: '/catalog/transporters',
        UPDATE_TRANSPORTER_PROFILE: (id: number) => `/catalog/transporters/${id}`,
        UPLOAD_TRANSPORTER_PHOTO: (id: number) => `/catalog/transporters/${id}/photo`,

        // Trips
        CREATE_TRIP: '/catalog/trips',
        GET_TRIP: (id: string | number) => `/catalog/trips/${id}`,
        UPDATE_TRIP: (id: string | number) => `/catalog/trips/${id}`,
        DELETE_TRIP: (id: string | number) => `/catalog/trips/${id}`,
        GET_TRANSPORTER_TRIPS: (transporterId: number) => `/catalog/trips/transporter/${transporterId}`,
        SEARCH_TRIPS: '/catalog/trips/search',

        // Bookings
        CREATE_BOOKING: '/catalog/bookings',
        GET_BOOKING: (id: string | number) => `/catalog/bookings/${id}`,
        GET_USER_BOOKINGS: (userId: number) => `/catalog/bookings/user/${userId}`,
    },
} as const;

/**
 * Helper function to build query string from parameters
 */
export const buildQueryString = (params: Record<string, any>): string => {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
            searchParams.append(key, String(value));
        }
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : '';
};

/**
 * Trip Service
 * 
 * Handles trip-related operations:
 * - Create/update/delete trips
 * - Search trips
 * - Get transporter's trips
 */

import apiClient from '../networking/client';
import { ENDPOINTS, buildQueryString } from '../networking/endpoints';
import type { CreateTripRequest, SearchTripsParams, Trip, UpdateTripRequest } from '../networking/types';

// Re-export types from original file for backward compatibility
export interface CollectionStopDTO {
    city?: string;
    locationName?: string;
    fullAddress?: string;
    startTime?: string;
    endTime?: string;
}

export interface DeliveryStopDTO {
    city?: string;
    locationName?: string;
    fullAddress?: string;
    startTime?: string;
    endTime?: string;
}

export interface ExtendedCreateTripRequest extends CreateTripRequest {
    collectionStops?: CollectionStopDTO[];
    deliveryStops?: DeliveryStopDTO[];
}

/* ======================================================
   CREATE TRIP
====================================================== */

export const createTrip = async (
    tripData: ExtendedCreateTripRequest
): Promise<Trip> => {
    console.log('[TRIP] Creating trip:', tripData);

    const response = await apiClient.post<Trip>(
        ENDPOINTS.CATALOG.CREATE_TRIP,
        tripData
    );

    console.log('[TRIP] ✅ Trip created:', response.data.id);
    return response.data;
};

/* ======================================================
   GET TRIP BY ID
====================================================== */

export const getTripById = async (tripId: string | number): Promise<Trip> => {
    const response = await apiClient.get<Trip>(ENDPOINTS.CATALOG.GET_TRIP(tripId));
    return response.data;
};

/* ======================================================
   UPDATE TRIP
====================================================== */

export const updateTrip = async (
    tripId: string | number,
    updates: UpdateTripRequest
): Promise<Trip> => {
    console.log('[TRIP] Updating trip:', tripId);

    const response = await apiClient.put<Trip>(
        ENDPOINTS.CATALOG.UPDATE_TRIP(tripId),
        updates
    );

    console.log('[TRIP] ✅ Trip updated');
    return response.data;
};

/* ======================================================
   DELETE TRIP
====================================================== */

export const deleteTrip = async (tripId: string | number): Promise<void> => {
    console.log('[TRIP] Deleting trip:', tripId);

    await apiClient.delete(ENDPOINTS.CATALOG.DELETE_TRIP(tripId));

    console.log('[TRIP] ✅ Trip deleted');
};

/* ======================================================
   GET TRANSPORTER TRIPS
====================================================== */

export const fetchTransporterTrips = async (
    transporterId: number
): Promise<Trip[]> => {
    console.log('[TRIP] Fetching trips for transporter:', transporterId);

    const response = await apiClient.get<Trip[]>(
        ENDPOINTS.CATALOG.GET_TRANSPORTER_TRIPS(transporterId)
    );

    console.log('[TRIP] ✅ Fetched', response.data.length, 'trips');
    return response.data;
};

/* ======================================================
   SEARCH TRIPS
====================================================== */

export const searchTrips = async (
    params: SearchTripsParams
): Promise<Trip[]> => {
    console.log('[TRIP] Searching trips:', params);

    const queryString = buildQueryString(params);
    const url = `${ENDPOINTS.CATALOG.SEARCH_TRIPS}${queryString}`;

    const response = await apiClient.get<Trip[]>(url);

    console.log('[TRIP] ✅ Found', response.data.length, 'trips');
    return response.data;
};

/* ======================================================
   LEGACY EXPORTS (for backward compatibility)
====================================================== */

// Re-export transporter profile functions from transporter service
// These will eventually be removed once components are updated
import {
    createTransporterProfile as createProfile,
    getTransporterProfile as fetchProfile,
    updateTransporterProfile as updateProfile,
} from './transporter';

export const createTransporterProfile = createProfile;
export const fetchTransporterProfile = fetchProfile;
export const updateTransporterProfile = updateProfile;

/* ======================================================
   EXPORTS
====================================================== */

export default {
    createTrip,
    getTripById,
    updateTrip,
    deleteTrip,
    fetchTransporterTrips,
    searchTrips,
    // Legacy transporter profile functions
    createTransporterProfile,
    fetchTransporterProfile,
    updateTransporterProfile,
};

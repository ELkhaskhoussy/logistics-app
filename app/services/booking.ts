/**
 * Booking Service
 *
 * Handles reservation demand operations:
 * - Fetch PENDING demands for a trip
 * - Accept / Decline a demand (PUT /bookings/{id}/status)
 */

import apiClient from '../networking/client';
import type { Booking } from '../networking/types';

const BASE = '/bookings';

// ── GET pending demands for a trip ─────────────────────────────────
export const getPendingDemandsByTrip = async (tripId: string): Promise<Booking[]> => {
    console.log('[BOOKING] Fetching pending demands for trip:', tripId);
    const response = await apiClient.get<Booking[]>(`${BASE}/trip/${tripId}/pending`);
    console.log('[BOOKING] ✅ Pending demands fetched:', response.data.length);
    return response.data;
};

// ── Update booking status (Accept → CONFIRMED | Decline → CANCELLED) ─
export const updateBookingStatus = async (
    bookingId: string,
    status: 'CONFIRMED' | 'CANCELLED'
): Promise<Booking> => {
    console.log(`[BOOKING] Updating booking ${bookingId} → ${status}`);
    const response = await apiClient.put<Booking>(`${BASE}/${bookingId}/status`, { status });
    console.log('[BOOKING] ✅ Status updated:', response.data.status);
    return response.data;
};

/**
 * TypeScript Types for API Requests and Responses
 */

// ==========================================
// Auth Types
// ==========================================

export interface SignUpRequest {
    firstName: string;
    lastName?: string;
    email: string;
    password: string;
    role: 'SENDER' | 'TRANSPORTER';
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface GoogleAuthRequest {
    idToken: string;
}

export interface GoogleRegisterRequest {
    email: string;
    firstName: string;
    lastName?: string;
    imageUrl?: string;
    role: 'SENDER' | 'TRANSPORTER';
}

export interface AuthResponse {
    userId: number;
    userRole: string;
    token: string;
    message?: string;
    // Google OAuth specific fields (for new users needing role selection)
    needsRoleSelection?: boolean;
    email?: string;
    firstName?: string;
    lastName?: string;
    imageUrl?: string;
}

// ==========================================
// User Types
// ==========================================

export interface User {
    id: number;
    firstName: string;
    lastName?: string;
    email: string;
    phone?: string;
    role: string;
    profileImageUrl?: string;
}

export interface UpdatePhoneRequest {
    phone: string;
}

// ==========================================
// Transporter Types
// ==========================================

export interface TransporterProfile {
    userId: number;
    displayName: string;
    bio?: string;
    photoUrl?: string;
    vehicleType?: string;
    licensePlate?: string;
    pricingPerKg?: number;
}

export interface CreateTransporterProfileRequest {
    displayName: string;
    bio?: string;
    pricingPerKg?: number;
}

export interface UpdateTransporterProfileRequest {
    displayName?: string;
    bio?: string;
    vehicleType?: string;
    licensePlate?: string;
    pricingPerKg?: number;
}

// ==========================================
// Trip Types
// ==========================================

export interface Trip {
    id: string;
    transporterId: number;
    departureCity: string;
    arrivalCity: string;
    departureDate: string;
    availableWeight: number;
    pricePerKg: number;
    status: string;
}

export interface CreateTripRequest {
    transporterId: number;
    departureCity: string;
    arrivalCity: string;
    departureDate: string;
    availableWeight: number;
    pricePerKg: number;
}

export interface UpdateTripRequest {
    departureCity?: string;
    arrivalCity?: string;
    departureDate?: string;
    availableWeight?: number;
    pricePerKg?: number;
    status?: string;
}

export interface SearchTripsParams {
    from?: string;
    to?: string;
    date?: string;
    minWeight?: number;
    maxPricePerKg?: number;
}

// ==========================================
// Booking Types
// ==========================================

export interface Booking {
    id: string;
    senderId: number;
    tripId: string;
    status: string;
    createdAt: string;
}

export interface CreateBookingRequest {
    senderId: number;
    tripId: string;
}

// ==========================================
// API Error Types
// ==========================================

export interface ApiError {
    message: string;
    status?: number;
    code?: string;
}

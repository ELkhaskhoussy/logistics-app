/**
 * Transporter Service
 * 
 * Handles transporter-specific operations:
 * - Get/Create/Update transporter profile
 * - Upload transporter photo
 * - Get transporter's trips
 */

import apiClient from '../networking/client';
import { ENDPOINTS } from '../networking/endpoints';
import type {
    CreateTransporterProfileRequest,
    TransporterProfile,
    UpdateTransporterProfileRequest,
} from '../networking/types';

/* ======================================================
   GET TRANSPORTER PROFILE
====================================================== */

export const getTransporterProfile = async (
    userId: number
): Promise<TransporterProfile> => {
    const response = await apiClient.get<TransporterProfile>(
        ENDPOINTS.CATALOG.GET_TRANSPORTER_PROFILE(userId)
    );
    return response.data;
};

/* ======================================================
   CREATE TRANSPORTER PROFILE
====================================================== */

export const createTransporterProfile = async (
    userId: number,
    data: CreateTransporterProfileRequest
): Promise<TransporterProfile> => {
    const response = await apiClient.post<TransporterProfile>(
        ENDPOINTS.CATALOG.CREATE_TRANSPORTER_PROFILE,
        {
            userId,
            ...data,
        }
    );
    return response.data;
};

/* ======================================================
   UPDATE TRANSPORTER PROFILE
====================================================== */

export const updateTransporterProfile = async (
    userId: number,
    data: UpdateTransporterProfileRequest
): Promise<TransporterProfile> => {
    const response = await apiClient.put<TransporterProfile>(
        ENDPOINTS.CATALOG.UPDATE_TRANSPORTER_PROFILE(userId),
        data
    );
    return response.data;
};

/* ======================================================
   UPLOAD TRANSPORTER PHOTO
====================================================== */

export const uploadTransporterPhoto = async (
    userId: number,
    formData: FormData
): Promise<{ photoUrl: string }> => {
    const response = await apiClient.post<{ photoUrl: string }>(
        ENDPOINTS.CATALOG.UPLOAD_TRANSPORTER_PHOTO(userId),
        formData,
        {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        }
    );
    return response.data;
};

/* ======================================================
   EXPORTS
====================================================== */

export default {
    getTransporterProfile,
    createTransporterProfile,
    updateTransporterProfile,
    uploadTransporterPhoto,
};

import { apiClient } from './backService';

export const getUserById = async (id: number) => {
  const response = await apiClient.get(`/users/${id}`);
  return response.data;
};
export const updateUserPhone = async (id: number, phone: string) => {
  const response = await apiClient.put(`/users/${id}/phone`, { phone });
  return response.data;
};


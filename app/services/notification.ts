/**
 * Notification centre.
 * The bell badge and the notifications screen both read from here.
 */
import { apiClient } from './backService';

export interface AppNotification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  referenceId?: string;
  /** "BOOKING" | "TRIP" — where to navigate on tap. */
  referenceType?: string;
  read: boolean;
  createdAt: string;
}

const BASE = '/notifications';

export const getMyNotifications = async (userId: number | string): Promise<AppNotification[]> => {
  const response = await apiClient.get<AppNotification[]>(`${BASE}/user/${userId}`);
  return Array.isArray(response.data) ? response.data : [];
};

export const getUnreadCount = async (userId: number | string): Promise<number> => {
  const response = await apiClient.get<{ count: number }>(`${BASE}/user/${userId}/unread-count`);
  return response.data?.count ?? 0;
};

export const markNotificationRead = async (id: number): Promise<void> => {
  await apiClient.put(`${BASE}/${id}/read`);
};

export const markAllNotificationsRead = async (userId: number | string): Promise<void> => {
  await apiClient.put(`${BASE}/user/${userId}/read-all`);
};

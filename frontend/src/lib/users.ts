import { api } from './api';

export type UserProfile = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

export const UsersAPI = {
  // Profil bilgilerini getir
  getProfile: () => api<UserProfile>('/users/me'),

  // Profil bilgilerini güncelle
  updateProfile: (data: { name?: string }) => 
    api<UserProfile>('/users/me', {
      method: 'PUT',
      jsonBody: data,
    }),

  // Şifre değiştir
  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    api<{ success: boolean }>('/users/me/change-password', {
      method: 'POST',
      jsonBody: data,
    }),
};

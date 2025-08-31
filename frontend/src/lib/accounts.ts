import { api } from './api';
import { type AccountType } from './types';

export type AccountDTO = {
  id: string;
  name: string;
  type: AccountType;
  currency: string; // ISO 4217
  createdAt: string;
  updatedAt: string;
  deletedAt?: string; // Soft delete için
};

export type CreateAccountInput = {
  name: string;
  type?: AccountType;
  currency?: string; // default TRY
};

export const AccountsAPI = {
  list: () => api<AccountDTO[]>('/accounts'),
  create: (data: CreateAccountInput) =>
    api<AccountDTO>('/accounts', { method: 'POST', jsonBody: data }),
  get: (id: string) =>
    api<AccountDTO>(`/accounts/${id}`),
  update: (id: string, data: Partial<CreateAccountInput>) =>
    api<AccountDTO>(`/accounts/${id}`, { method: 'PATCH', jsonBody: data }),
  delete: (id: string) =>
    api(`/accounts/${id}`, { method: 'DELETE' }),
  restore: (id: string) =>
    api<AccountDTO>(`/accounts/${id}/restore`, { method: 'POST' }),
  listDeleted: () => api<AccountDTO[]>('/accounts/deleted'),
};

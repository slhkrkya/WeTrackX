import { api } from './api';

export type AccountType = 'CASH' | 'BANK' | 'CARD' | 'WALLET';

export type AccountDTO = {
  id: string;
  name: string;
  type: AccountType;
  currency: string; // ISO 4217
  createdAt: string;
  updatedAt: string;
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
};

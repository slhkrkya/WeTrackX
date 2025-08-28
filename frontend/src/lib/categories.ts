import { api } from './api';

export type CategoryKind = 'INCOME' | 'EXPENSE';

export type CategoryDTO = {
  id: string;
  name: string;
  kind: CategoryKind;
  color?: string | null;
  createdAt: string;
  updatedAt: string;
};

export const CategoriesAPI = {
  list: (kind?: CategoryKind) =>
    api<CategoryDTO[]>(`/categories${kind ? `?kind=${kind}` : ''}`),
  create: (data: { name: string; kind: CategoryKind; color?: string }) =>
    api<CategoryDTO>('/categories', { method: 'POST', jsonBody: data }),
};
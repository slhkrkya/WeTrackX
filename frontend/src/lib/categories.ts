import { api } from './api';
import { type CategoryKind } from './types';

export type CategoryDTO = {
  id: string;
  name: string;
  kind: CategoryKind;
  color?: string | null;
  priority: number;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
};

export const CategoriesAPI = {
  list: (kind?: CategoryKind) =>
    api<CategoryDTO[]>(`/categories${kind ? `?type=${kind}` : ''}`),
  create: (data: { name: string; kind: CategoryKind; color?: string; priority?: number }) =>
    api<CategoryDTO>('/categories', { method: 'POST', jsonBody: { ...data, type: data.kind } }),
};
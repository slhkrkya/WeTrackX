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
  get: (id: string) =>
    api<CategoryDTO>(`/categories/${id}`),
  update: (id: string, data: Partial<{ name: string; kind: CategoryKind; color?: string; priority?: number }>) => {
    const payload: any = { ...data };
    if (data.kind) payload.type = data.kind;
    return api<CategoryDTO>(`/categories/${id}`, { method: 'PATCH', jsonBody: payload });
  },
  delete: (id: string) =>
    api(`/categories/${id}`, { method: 'DELETE' }),
};
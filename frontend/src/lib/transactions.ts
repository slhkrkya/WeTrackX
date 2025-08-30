import { api } from './api';

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export type UpsertIncomeExpense = {
  type: 'INCOME' | 'EXPENSE';
  title: string;
  amount: number;
  currency?: string;        // default TRY
  date: string;
  description?: string;
  accountId: string;
  categoryId: string;
};

export type UpsertTransfer = {
  type: 'TRANSFER';
  title: string;
  amount: number;
  currency?: string;        // default TRY
  date: string;
  description?: string;
  fromAccountId: string;
  toAccountId: string;
};
export type TxListQuery = {
  page?: number;
  pageSize?: number;
  from?: string;
  to?: string;
  type?: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  accountId?: string;
  categoryId?: string;
  q?: string;
  sort?: 'date' | 'amount';
  order?: 'asc' | 'desc';
};
export type TxListItem = {
  id: string;
  type: TransactionType;
  title: string;
  amount: string;    // backend numeric -> string
  currency: string;
  date: string;
  description?: string;
  account?: { id: string; name: string } | null;
  fromAccount?: { id: string; name: string } | null;
  toAccount?: { id: string; name: string } | null;
  category?: { id: string; name: string } | null;
};

function qs(obj: Record<string, string | number | boolean | undefined>) {
  const p = Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return p.length ? `?${p.join('&')}` : '';
}

export const TransactionsAPI = {
  create: (payload: UpsertIncomeExpense | UpsertTransfer) =>
    api('/transactions', { method: 'POST', jsonBody: payload }),

  list: (query: TxListQuery = {}) =>
    api<{ items: TxListItem[]; total: number; page: number; pageSize: number }>(
      '/transactions' + qs(query)
    ),
  get: (id: string) =>
    api<TxListItem>(`/transactions/${id}`),
  update: (id: string, payload: Partial<UpsertIncomeExpense | UpsertTransfer>) =>
    api(`/transactions/${id}`, { method: 'PATCH', jsonBody: payload }),
  delete: (id: string) =>
    api(`/transactions/${id}`, { method: 'DELETE' }),
};
import { api } from './api';

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export type CreateIncomeExpense = {
  type: 'INCOME' | 'EXPENSE';
  amount: number;           // pozitif sayı
  currency?: string;        // default TRY
  date: string;             // ISO
  description?: string;
  title: string;
  accountId: string;        // zorunlu
  categoryId: string;       // zorunlu
};

export type CreateTransfer = {
  type: 'TRANSFER';
  amount: number;           // pozitif sayı
  currency?: string;        // default TRY
  date: string;             // ISO
  description?: string;
  title: string;
  fromAccountId: string;    // zorunlu
  toAccountId: string;      // zorunlu
};
export type TxListQuery = {
  limit?: number;
  from?: string;
  to?: string;
  type?: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  accountId?: string;
  categoryId?: string;
  q?: string;
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
  create: (payload: CreateIncomeExpense | CreateTransfer) =>
    api('/transactions', { method: 'POST', jsonBody: payload }),

  list: (query: TxListQuery = {}) =>
    api<TxListItem[]>('/transactions' + qs(query)),
};
import { api } from './api';

export type BalanceItem = { accountId: string; name: string; currency: string; balance: string };
export type Cashflow = { income: string; expense: string; net: string };
export type CategoryTotal = { categoryId: string; name: string; color?: string; priority?: number; total: string };
export type MonthlyPoint = { month: string; income: string; expense: string };

export type TxItem = {
  id: string;
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  title: string;
  amount: string;
  currency: string;
  date: string;
  description?: string;
  account?: { id: string; name: string };
  fromAccount?: { id: string; name: string };
  toAccount?: { id: string; name: string };
  category?: { id: string; name: string };
};

export const ReportsAPI = {
  balances: () => api<BalanceItem[]>('/reports/balances'),
  cashflow: (from?: string, to?: string) => api<Cashflow>(`/reports/summary${buildRange(from, to)}`),
  categoryTotals: (kind: 'INCOME' | 'EXPENSE', from?: string, to?: string) =>
    api<CategoryTotal[]>(`/reports/category-totals?kind=${kind}${rangeQuery(from, to)}`),
  monthlySeries: (months = 6) => api<MonthlyPoint[]>(`/reports/monthly-series?months=${months}`),
  recentTransactions: (limit = 10, accountId?: string) => {
    const params = new URLSearchParams();
    params.append('page', '1');
    params.append('pageSize', limit.toString());
    if (accountId) params.append('accountId', accountId);
    return api<{ items: TxItem[]; total: number; page: number; pageSize: number }>(`/transactions?${params.toString()}`);
  },
  byCategory: (period: 'month', ym: string) => api<Array<CategoryTotal & { type: 'INCOME' | 'EXPENSE' }>>(`/reports/by-category?period=${period}&date=${encodeURIComponent(ym)}`),
};

function buildRange(from?: string, to?: string) {
  const q: string[] = [];
  if (from) q.push(`from=${encodeURIComponent(from)}`);
  if (to) q.push(`to=${encodeURIComponent(to)}`);
  return q.length ? `?${q.join('&')}` : '';
}
function rangeQuery(from?: string, to?: string) {
  const q: string[] = [];
  if (from) q.push(`from=${encodeURIComponent(from)}`);
  if (to) q.push(`to=${encodeURIComponent(to)}`);
  return q.length ? `&${q.join('&')}` : '';
}

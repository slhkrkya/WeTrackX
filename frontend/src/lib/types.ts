export type AccountType = 'BANK' | 'CASH' | 'CARD' | 'WALLET';

export const ACCOUNT_TYPE_LABELS_TR: Record<AccountType, string> = {
  BANK: 'Banka',
  CASH: 'Nakit',
  CARD: 'Kart',
  WALLET: 'Cüzdan',
};

export type CategoryKind = 'INCOME' | 'EXPENSE';

export const CATEGORY_KIND_LABELS_TR: Record<CategoryKind, string> = {
  INCOME: 'Gelir',
  EXPENSE: 'Gider',
};

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';

export const KIND_LABELS_TR: Record<TransactionType, string> = {
  INCOME: 'Gelir',
  EXPENSE: 'Gider',
  TRANSFER: 'Transfer',
};

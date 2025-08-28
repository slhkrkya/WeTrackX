export function fmtMoney(value: string | number, currency = 'TRY', locale = 'tr-TR') {
  const n = typeof value === 'string' ? Number(value) : value;
  return new Intl.NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 2 }).format(n);
}

export function fmtDate(iso: string, locale = 'tr-TR') {
  const d = new Date(iso);
  return d.toLocaleDateString(locale, { year: 'numeric', month: '2-digit', day: '2-digit' });
}

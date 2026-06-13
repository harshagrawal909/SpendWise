export const SUPPORTED_CURRENCIES = [
  { code: 'INR', name: 'Indian Rupee (₹)', symbol: '₹' },
  { code: 'USD', name: 'US Dollar ($)', symbol: '$' },
  { code: 'EUR', name: 'Euro (€)', symbol: '€' },
  { code: 'GBP', name: 'British Pound (£)', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen (¥)', symbol: '¥' },
  { code: 'AUD', name: 'Australian Dollar (A$)', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar (C$)', symbol: 'C$' },
  { code: 'CNY', name: 'Chinese Yuan (¥)', symbol: '¥' },
  { code: 'AED', name: 'UAE Dirham (د.إ)', symbol: 'د.إ' },
  { code: 'SAR', name: 'Saudi Riyal (ر.س)', symbol: 'ر.س' },
  { code: 'SGD', name: 'Singapore Dollar (S$)', symbol: 'S$' },
];

export function formatCurrency(value: unknown, currencyCode: string = 'INR') {
  const n = Number(value ?? 0);
  if (Number.isNaN(n)) return '0';
  
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(n);
  } catch (e) {
    const symbol = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode)?.symbol || currencyCode;
    return `${symbol}${n.toFixed(2)}`;
  }
}

let cache = {
  rates: null,
  timestamp: 0
};

// Hardcoded fallback exchange rates (with USD as base)
const FALLBACK_RATES = {
  USD: 1.0,
  INR: 83.5,
  EUR: 0.92,
  GBP: 0.78,
  JPY: 157.0,
  AUD: 1.51,
  CAD: 1.37,
  CNY: 7.25,
  NZD: 1.63,
  CHF: 0.89,
  AED: 3.67,
  SAR: 3.75,
  SGD: 1.35
};

export async function getExchangeRates() {
  const now = Date.now();
  // Cache for 1 hour (3600000 ms)
  if (cache.rates && (now - cache.timestamp < 3600000)) {
    return cache.rates;
  }

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    const data = await res.json();
    if (data && data.result === 'success' && data.rates) {
      cache.rates = data.rates;
      cache.timestamp = now;
      console.log('Exchange rates fetched and cached successfully.');
      return data.rates;
    }
  } catch (err) {
    console.error('Error fetching exchange rates from API, using fallback:', err.message);
  }

  // Fallback to memory cache or default dictionary
  return cache.rates || FALLBACK_RATES;
}

export async function convertCurrency(amount, from, to) {
  if (from === to) return amount;
  
  const rates = await getExchangeRates();
  const fromRate = rates[from];
  const toRate = rates[to];

  if (!fromRate || !toRate) {
    console.warn(`Unsupported currency conversion: ${from} to ${to}. Fallback to direct mapping.`);
    return amount;
  }

  // Convert from source currency to base (USD), then to target currency
  const amountInUSD = amount / fromRate;
  const converted = amountInUSD * toRate;
  
  return Math.round(converted * 100) / 100; // Round to 2 decimal places
}

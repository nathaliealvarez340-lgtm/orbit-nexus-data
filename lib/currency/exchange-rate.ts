const MXN_USD_FALLBACK_RATE = 18;
const TWELVE_HOURS_IN_MS = 12 * 60 * 60 * 1000;
const FRANKFURTER_RATE_URL = "https://api.frankfurter.app/latest?from=MXN&to=USD";

type ExchangeRateCache = {
  expiresAt: number;
  rate: number;
  source: string;
  updatedAt: string;
} | null;

let exchangeRateCache: ExchangeRateCache = null;

export type MxnUsdExchangeRate = {
  rate: number;
  source: string;
  updatedAt: string;
};

function buildFallbackRate() {
  return {
    rate: MXN_USD_FALLBACK_RATE,
    source: "fallback",
    updatedAt: new Date().toISOString()
  };
}

export function roundEstimatedUsd(amountMxn: number, rate: number) {
  if (!Number.isFinite(amountMxn) || amountMxn <= 0) {
    return 0;
  }

  return Math.round(amountMxn / rate);
}

export async function getMxnUsdExchangeRate() {
  const now = Date.now();

  if (exchangeRateCache && exchangeRateCache.expiresAt > now) {
    return {
      rate: exchangeRateCache.rate,
      source: exchangeRateCache.source,
      updatedAt: exchangeRateCache.updatedAt
    } satisfies MxnUsdExchangeRate;
  }

  try {
    const response = await fetch(FRANKFURTER_RATE_URL, {
      headers: {
        Accept: "application/json"
      },
      next: {
        revalidate: 43_200
      }
    });

    if (!response.ok) {
      throw new Error(`Exchange rate request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as {
      date?: string;
      rates?: {
        USD?: number;
      };
    };

    const rate = payload.rates?.USD;

    if (!rate || !Number.isFinite(rate) || rate <= 0) {
      throw new Error("Exchange rate response did not include a valid USD value.");
    }

    const nextValue = {
      rate,
      source: "frankfurter",
      updatedAt: payload.date ? new Date(payload.date).toISOString() : new Date().toISOString()
    };

    exchangeRateCache = {
      ...nextValue,
      expiresAt: now + TWELVE_HOURS_IN_MS
    };

    return nextValue satisfies MxnUsdExchangeRate;
  } catch (error) {
    console.warn("[currency/mxn-usd] Falling back to static exchange rate", error);

    const fallback = buildFallbackRate();

    exchangeRateCache = {
      ...fallback,
      expiresAt: now + TWELVE_HOURS_IN_MS
    };

    return fallback satisfies MxnUsdExchangeRate;
  }
}

export function getMxnUsdFallbackRate() {
  return MXN_USD_FALLBACK_RATE;
}

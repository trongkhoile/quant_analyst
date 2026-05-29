// In-memory latest-signal store (single Worker instance demo).
export type Signal = {
  symbol: string | null;
  timestamp: number;
  ai_score: number;
  label: "BUY NOW" | "SELL NOW" | "WAIT";
  color_state: "buy" | "sell" | "neutral";
  breakdown: { l2: number; l3: number; l4: number };
  metrics: {
    rsi: number | null;
    stoch_k: number | null;
    stoch_d: number | null;
    flow: number | null;
    delta: number | null;
  };
  // Layer 1 EMA trend information – will be populated per‑timeframe
  layer_1_trend?: {
    trend_direction: "UP" | "DOWN" | "SIDEWAYS";
    ema_fast_value: number;
    ema_mid_value: number;
    ema_slow_value: number;
    allowed_side: "BUY" | "SELL";
  };
  execution_timeframe?: string;
};

let latestSignals: Map<string, Signal> = new Map();

export function setLatestSignal(s: Signal) {
  // Use symbol + timeframe as key to support multiple timeframes
  const key = `${s.symbol ?? "UNKNOWN"}:${s.execution_timeframe ?? "M15"}`;
  latestSignals.set(key, s);
}
export function getLatestSignal(symbol: string, timeframe?: string): Signal | null {
  // If timeframe is provided, return specific timeframe signal
  if (timeframe) {
    const key = `${symbol}:${timeframe}`;
    return latestSignals.get(key) ?? null;
  }
  // Fallback: return any signal for this symbol (backward compatibility)
  for (const [key, value] of latestSignals.entries()) {
    if (key.startsWith(symbol + ":")) {
      return value;
    }
  }
  return null;
}

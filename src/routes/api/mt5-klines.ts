import { createFileRoute } from "@tanstack/react-router";
import { updateSignalFromKlines, type KlineInput } from "@/lib/binance-fetcher";

const MT5_SECRET = process.env["MT5_SECRET"];

export const Route = createFileRoute("/api/mt5-klines")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (MT5_SECRET) {
          const authHeader = request.headers.get("x-mt5-secret");
          if (authHeader !== MT5_SECRET) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
              status: 401,
              headers: { "content-type": "application/json" },
            });
          }
        }

        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return new Response(JSON.stringify({ error: "Invalid JSON" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        const { symbol, timeframe, klines } = body as any;

        if (!symbol || !timeframe || !Array.isArray(klines) || klines.length === 0) {
          return new Response(
            JSON.stringify({ error: "Required: symbol (string), timeframe (string), klines (array)" }),
            { status: 400, headers: { "content-type": "application/json" } }
          );
        }

        const validTimeframes = ["M5", "M15", "H1", "H4"];
        if (!validTimeframes.includes(timeframe)) {
          return new Response(
            JSON.stringify({ error: `timeframe must be one of: ${validTimeframes.join(", ")}` }),
            { status: 400, headers: { "content-type": "application/json" } }
          );
        }

        try {
          await updateSignalFromKlines(symbol, timeframe, klines as KlineInput[]);
          return new Response(
            JSON.stringify({ ok: true, symbol, timeframe, candles: klines.length }),
            { status: 200, headers: { "content-type": "application/json" } }
          );
        } catch (err) {
          console.error("mt5-klines processing failed", err);
          return new Response(
            JSON.stringify({ error: "Signal processing failed", detail: String(err) }),
            { status: 500, headers: { "content-type": "application/json" } }
          );
        }
      },
    },
  },
});

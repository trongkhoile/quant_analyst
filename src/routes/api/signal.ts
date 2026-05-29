import { createFileRoute } from "@tanstack/react-router";
import { calculateAIScore } from "@/lib/scoring_engine.js";
import { setLatestSignal, getLatestSignal, type Signal } from "@/lib/signal-store.server";

export const Route = createFileRoute("/api/signal")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: unknown;
        try {
          payload = await request.json();
        } catch {
          return new Response(JSON.stringify({ error: "Invalid JSON" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        if (!payload || typeof payload !== "object") {
          return new Response(JSON.stringify({ error: "Payload must be an object" }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        try {
          const result = calculateAIScore(payload) as Signal;
          setLatestSignal(result);
          return new Response(JSON.stringify(result), {
            status: 200,
            headers: { "content-type": "application/json" },
          });
        } catch (err) {
          console.error("calculateAIScore failed", err);
          return new Response(
            JSON.stringify({ error: "Scoring failed", detail: String(err) }),
            { status: 422, headers: { "content-type": "application/json" } },
          );
        }
      },
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const symbol = url.searchParams.get("symbol");
        const timeframe = url.searchParams.get("timeframe") ?? "M15";

        if (!symbol) {
          return new Response(
            JSON.stringify({ error: "Symbol parameter is required" }),
            { status: 400, headers: { "content-type": "application/json" } },
          );
        }

        const latestSignal = getLatestSignal(symbol, timeframe);
        if (!latestSignal) {
          return new Response(
            JSON.stringify({ error: `No signal data available for ${symbol} @ ${timeframe}` }),
            { status: 404, headers: { "content-type": "application/json" } },
          );
        }
        return new Response(JSON.stringify(latestSignal), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    },
  },
});

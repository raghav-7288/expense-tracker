# AI-Powered Spending Insights — Implementation Suggestions

## 1. Architecture Approach

**Option A: Client-side with OpenAI/Anthropic API (via Edge Function)**
- Create a Supabase Edge Function that accepts transaction data and calls an LLM API
- The client sends aggregated/anonymized spending data to the edge function
- The edge function returns natural-language insights

**Option B: Rule-based engine + LLM enhancement**
- Build a local analytics engine (`src/engines/insights.ts`) with deterministic rules (e.g., "spending up 30% vs last month")
- Optionally enhance with an LLM for natural-language summaries

---

## 2. Feature Ideas

| Insight Type | Description |
|---|---|
| **Spending anomalies** | Flag unusual transactions or categories that spike vs. historical average |
| **Monthly summaries** | "You spent 20% more on dining this month compared to your 3-month average" |
| **Budget predictions** | "At this pace, you'll exceed your monthly average by ₹5,000" |
| **Savings opportunities** | "Your subscription spending has grown 40% — review recurring charges" |
| **Category trends** | "Transportation costs have been declining for 3 months straight" |
| **Cash flow forecast** | Predict next month's balance based on income/expense patterns |

---

## 3. Suggested File Structure

```
src/
├── engines/
│   └── insights.ts          # Pure functions: anomaly detection, trend calc, etc.
├── services/
│   └── insights.ts          # Calls Supabase Edge Function for LLM-powered insights
├── hooks/
│   └── useInsights.ts       # TanStack Query hook wrapping the service
├── components/
│   └── dashboard/
│       └── InsightsCard.tsx  # UI component displaying insights
├── types/
│   └── insights.ts          # Insight interfaces
supabase/
└── functions/
    └── generate-insights/   # Edge Function calling OpenAI/Anthropic
        └── index.ts
```

---

## 4. Data Flow

1. **Aggregate locally** — In `src/engines/insights.ts`, compute stats (category totals, month-over-month deltas, averages) from cached transaction data already in TanStack Query.
2. **Send to Edge Function** — POST the aggregated stats (not raw transactions) to a Supabase Edge Function. This keeps tokens low and avoids leaking PII.
3. **LLM generates insights** — The edge function prompts the LLM with structured data and a system prompt like: *"You are a personal finance advisor. Given the following spending summary, provide 3-5 actionable insights."*
4. **Cache & display** — Cache the response with TanStack Query (stale time ~1 hour). Show in an `InsightsCard` on the dashboard.

---

## 5. Implementation Tips

- **Keep costs low:** Only call the LLM once per day/session, cache aggressively, and send aggregated data (not individual transactions).
- **Graceful degradation:** If the LLM call fails or the user hasn't set up the API key, fall back to the deterministic rule-based insights from `engines/insights.ts`.
- **Privacy:** Never send raw descriptions/notes to the LLM — only category names, amounts, and dates.
- **Env variable:** Add `VITE_INSIGHTS_ENABLED` feature flag so the feature can be toggled.
- **Edge Function secrets:** Store `OPENAI_API_KEY` (or `ANTHROPIC_API_KEY`) in Supabase Edge Function secrets, never expose to the client.
- **Streaming (optional):** Use SSE from the edge function for a typing effect in the UI.

---

## 6. Minimal MVP Path

1. Add `src/engines/insights.ts` with pure functions that detect: top spending category, month-over-month change, and largest single transaction.
2. Create `InsightsCard.tsx` showing these rule-based insights on the dashboard (no LLM needed).
3. Later, add the Supabase Edge Function + LLM layer for richer natural-language insights.

This gives immediate value with zero API costs, and a clear upgrade path to AI-generated summaries.


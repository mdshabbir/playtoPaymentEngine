export type DashboardResponse = {
  merchant_id: number;
  available_balance_paise: number;
  held_balance_paise: number;
  recent_ledger: Array<{
    id: number;
    entry_type: string;
    amount_paise: number;
    reference: string;
    created_at: string;
    payout_id: string | null;
  }>;
  recent_payouts: Array<{
    id: string;
    amount_paise: number;
    status: string;
    attempt_count: number;
    failure_reason: string;
    created_at: string;
    updated_at: string;
  }>;
};

function resolveApiBase() {
  const configuredBase = import.meta.env.VITE_API_BASE;
  if (configuredBase) return configuredBase;

  const hostname = window.location.hostname;
  const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1";
  if (isLocalHost) return "http://localhost:8000/api/v1";

  // In production, default to same-origin API path so Vercel rewrites can proxy
  // to the backend and avoid browser CORS issues.
  return "/api/v1";
}

const API_BASE = resolveApiBase();
const DIRECT_BACKEND_BASE = "https://playto-payment-engine-api.onrender.com/api/v1";
const MERCHANT_ID = import.meta.env.VITE_MERCHANT_ID ?? "1";

async function fetchJsonWithFallback<T>(path: string, init: RequestInit): Promise<{ res: Response; data: T }> {
  const primaryRes = await fetch(`${API_BASE}${path}`, init);
  const contentType = primaryRes.headers.get("content-type") ?? "";

  // Some Vercel deployments can return index.html for /api paths when rewrites
  // are not applied yet. Retry against backend directly in that scenario.
  if (API_BASE === "/api/v1" && contentType.includes("text/html")) {
    const fallbackRes = await fetch(`${DIRECT_BACKEND_BASE}${path}`, init);
    const fallbackData = await fallbackRes.json();
    return { res: fallbackRes, data: fallbackData as T };
  }

  const primaryData = await primaryRes.json();
  return { res: primaryRes, data: primaryData as T };
}

export async function getDashboard(): Promise<DashboardResponse> {
  const { res, data } = await fetchJsonWithFallback<DashboardResponse>("/dashboard", {
    headers: { "X-Merchant-ID": MERCHANT_ID }
  });
  if (!res.ok) throw new Error("Failed to load dashboard");
  return data;
}

export async function createPayout(input: { amount_paise: number; bank_account_id: number }) {
  const idemKey = crypto.randomUUID();
  const { res, data } = await fetchJsonWithFallback<{ detail?: string }>("/payouts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Merchant-ID": MERCHANT_ID,
      "Idempotency-Key": idemKey
    },
    body: JSON.stringify(input)
  });
  if (!res.ok) throw new Error(data.detail ?? "Payout request failed");
  return data;
}

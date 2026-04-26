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

const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000/api/v1";
const MERCHANT_ID = import.meta.env.VITE_MERCHANT_ID ?? "1";

export async function getDashboard(): Promise<DashboardResponse> {
  const res = await fetch(`${API_BASE}/dashboard`, {
    headers: { "X-Merchant-ID": MERCHANT_ID }
  });
  if (!res.ok) throw new Error("Failed to load dashboard");
  return res.json();
}

export async function createPayout(input: { amount_paise: number; bank_account_id: number }) {
  const idemKey = crypto.randomUUID();
  const res = await fetch(`${API_BASE}/payouts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Merchant-ID": MERCHANT_ID,
      "Idempotency-Key": idemKey
    },
    body: JSON.stringify(input)
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail ?? "Payout request failed");
  return data;
}


import { useCallback, useEffect, useState } from "react";

import { createPayout, DashboardResponse, getDashboard } from "../api/client";
import { BalanceCards } from "../components/BalanceCards";
import { LedgerTable } from "../components/LedgerTable";
import { PayoutForm } from "../components/PayoutForm";
import { PayoutHistoryTable } from "../components/PayoutHistoryTable";

export function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await getDashboard();
      setData(res);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = setInterval(() => void load(), 5000);
    return () => clearInterval(id);
  }, [load]);

  async function handlePayout(amountPaise: number, bankAccountId: number) {
    await createPayout({ amount_paise: amountPaise, bank_account_id: bankAccountId });
    await load();
  }

  if (loading) return <div className="p-8 text-slate-700">Loading dashboard...</div>;
  if (error || !data) return <div className="p-8 text-red-600">{error ?? "Unknown error"}</div>;

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-8">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">Playto Payout Dashboard</h1>
        <p className="text-sm text-slate-500">Merchant ID: {data.merchant_id}</p>
      </header>
      <BalanceCards
        availableBalancePaise={data.available_balance_paise}
        heldBalancePaise={data.held_balance_paise}
      />
      <PayoutForm onSubmit={handlePayout} />
      <PayoutHistoryTable items={data.recent_payouts} />
      <LedgerTable items={data.recent_ledger} />
    </main>
  );
}


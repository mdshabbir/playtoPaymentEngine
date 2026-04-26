import { FormEvent, useState } from "react";

type Props = {
  onSubmit: (amountPaise: number, bankAccountId: number) => Promise<void>;
};

export function PayoutForm({ onSubmit }: Props) {
  const [amountRupees, setAmountRupees] = useState("0");
  const [bankAccountId, setBankAccountId] = useState("1");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const amountPaise = Math.round(Number(amountRupees) * 100);
      await onSubmit(amountPaise, Number(bankAccountId));
      setAmountRupees("0");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Request payout</h2>
      <div className="mt-4 grid gap-3">
        <label className="text-sm text-slate-700">
          Amount (INR)
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={amountRupees}
            onChange={(e) => setAmountRupees(e.target.value)}
            type="number"
            min="1"
            step="1"
            required
          />
        </label>
        <label className="text-sm text-slate-700">
          Bank account ID
          <input
            className="mt-1 w-full rounded-md border px-3 py-2"
            value={bankAccountId}
            onChange={(e) => setBankAccountId(e.target.value)}
            type="number"
            min="1"
            required
          />
        </label>
      </div>
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      <button
        disabled={loading}
        className="mt-4 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Submit payout"}
      </button>
    </form>
  );
}


import { FormEvent, useState } from "react";
import { Send, Building2, IndianRupee } from 'lucide-react';

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
    <div className="card">
      <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <Send className="text-brand" size={20} />
        Request New Payout
      </h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <IndianRupee size={14} className="text-slate-400" />
              Amount (INR)
            </label>
            <div className="relative group">
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none transition-all focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/5"
                value={amountRupees}
                onChange={(e) => setAmountRupees(e.target.value)}
                type="number"
                min="1"
                step="1"
                required
                placeholder="0.00"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
              <Building2 size={14} className="text-slate-400" />
              Bank Account ID
            </label>
            <input
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none transition-all focus:border-brand focus:bg-white focus:ring-4 focus:ring-brand/5"
              value={bankAccountId}
              onChange={(e) => setBankAccountId(e.target.value)}
              type="number"
              min="1"
              required
              placeholder="e.g. 1"
            />
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-red-50 text-red-600 text-sm border border-red-100 animate-in fade-in slide-in-from-top-1">
            {error}
          </div>
        )}

        <button
          disabled={loading}
          className="w-full btn-primary h-12 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-base"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Send size={18} />
              Initiate Payout
            </>
          )}
        </button>
      </form>
    </div>
  );
}

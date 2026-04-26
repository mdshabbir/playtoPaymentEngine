import { Clock, CheckCircle2, XCircle, AlertCircle, ArrowUpRight } from 'lucide-react';

type Payout = {
  id: string;
  amount_paise: number;
  status: string;
  attempt_count: number;
  failure_reason: string;
  updated_at: string;
};

function formatRupees(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(paise / 100);
}

const statusConfig: Record<string, { icon: any, class: string, label: string }> = {
  pending: { icon: Clock, class: "bg-slate-100 text-slate-600 border-slate-200", label: "Pending" },
  processing: { icon: Clock, class: "bg-blue-50 text-brand border-brand/10", label: "Processing" },
  completed: { icon: CheckCircle2, class: "bg-emerald-50 text-emerald-600 border-emerald-100", label: "Completed" },
  failed: { icon: XCircle, class: "bg-red-50 text-red-600 border-red-100", label: "Failed" }
};

export function PayoutHistoryTable({ items }: { items: Payout[] }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <History className="text-brand" size={20} />
          Payout History
        </h2>
        <button className="text-sm font-medium text-brand hover:underline flex items-center gap-1">
          View All <ArrowUpRight size={14} />
        </button>
      </div>

      <div className="overflow-x-auto -mx-6">
        <table className="min-w-full">
          <thead>
            <tr className="bg-slate-50/50 border-y border-slate-100">
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Reference</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {items.map((item) => {
              const config = statusConfig[item.status] || statusConfig.pending;
              const Icon = config.icon;
              return (
                <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-mono text-slate-400">#</span>
                    <span className="text-sm font-medium text-slate-600">{item.id.slice(0, 8)}...</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-slate-900">{formatRupees(item.amount_paise)}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.class}`}>
                        <Icon size={12} />
                        {config.label}
                      </span>
                      {item.failure_reason && (
                        <span className="mt-1 flex items-center gap-1 text-[10px] text-red-500 font-medium">
                          <AlertCircle size={10} />
                          {item.failure_reason}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs text-slate-500">
                      {new Date(item.updated_at).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-10 text-center text-sm text-slate-400 italic">
                  No payout history available yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { History } from 'lucide-react';

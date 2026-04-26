type Payout = {
  id: string;
  amount_paise: number;
  status: string;
  attempt_count: number;
  failure_reason: string;
  updated_at: string;
};

function formatRupees(paise: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(paise / 100);
}

const statusClass: Record<string, string> = {
  pending: "bg-slate-100 text-slate-700",
  processing: "bg-blue-100 text-blue-700",
  completed: "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-700"
};

export function PayoutHistoryTable({ items }: { items: Payout[] }) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Payout history</h2>
      <div className="mt-4 overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="py-2">Payout ID</th>
              <th className="py-2">Amount</th>
              <th className="py-2">Status</th>
              <th className="py-2">Attempts</th>
              <th className="py-2">Updated</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="py-2 font-mono text-xs">{item.id}</td>
                <td className="py-2">{formatRupees(item.amount_paise)}</td>
                <td className="py-2">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass[item.status] || "bg-slate-100 text-slate-700"}`}>
                    {item.status}
                  </span>
                  {item.failure_reason ? <p className="mt-1 text-xs text-red-600">{item.failure_reason}</p> : null}
                </td>
                <td className="py-2">{item.attempt_count}</td>
                <td className="py-2">{new Date(item.updated_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


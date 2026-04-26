type Entry = {
  id: number;
  entry_type: string;
  amount_paise: number;
  reference: string;
  created_at: string;
};

function formatRupees(paise: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(paise / 100);
}

export function LedgerTable({ items }: { items: Entry[] }) {
  return (
    <div className="rounded-xl border bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Recent ledger entries</h2>
      <div className="mt-4 overflow-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b text-left text-slate-500">
              <th className="py-2">Type</th>
              <th className="py-2">Amount</th>
              <th className="py-2">Reference</th>
              <th className="py-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-b">
                <td className="py-2 capitalize">{item.entry_type.replace("_", " ")}</td>
                <td className="py-2">{formatRupees(item.amount_paise)}</td>
                <td className="py-2">{item.reference || "-"}</td>
                <td className="py-2">{new Date(item.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


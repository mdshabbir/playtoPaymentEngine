import { FileText, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

type Entry = {
  id: number;
  entry_type: string;
  amount_paise: number;
  reference: string;
  created_at: string;
};

function formatRupees(paise: number) {
  return new Intl.NumberFormat("en-IN", { 
    style: "currency", 
    currency: "INR",
    maximumFractionDigits: 0 
  }).format(paise / 100);
}

export function LedgerTable({ items }: { items: Entry[] }) {
  return (
    <div className="card">
      <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <FileText className="text-brand" size={20} />
        Recent Activity
      </h2>

      <div className="space-y-4">
        {items.map((item) => {
          const isCredit = item.amount_paise > 0;
          return (
            <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isCredit ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                }`}>
                  {isCredit ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900 capitalize">
                    {item.entry_type.replace("_", " ")}
                  </p>
                  <p className="text-xs text-slate-500">
                    {item.reference || "Internal Transfer"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-sm font-bold ${isCredit ? 'text-emerald-600' : 'text-slate-900'}`}>
                  {isCredit ? '+' : ''}{formatRupees(item.amount_paise)}
                </p>
                <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                  {new Date(item.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </p>
              </div>
            </div>
          );
        })}
        {items.length === 0 && (
          <div className="py-8 text-center text-sm text-slate-400 italic">
            No recent activity to show.
          </div>
        )}
      </div>
    </div>
  );
}

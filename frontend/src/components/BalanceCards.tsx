import { Wallet, Lock } from 'lucide-react';

type Props = {
  availableBalancePaise: number;
  heldBalancePaise: number;
};

function formatRupees(paise: number) {
  return new Intl.NumberFormat("en-IN", { 
    style: "currency", 
    currency: "INR",
    maximumFractionDigits: 0 
  }).format(paise / 100);
}

export function BalanceCards({ availableBalancePaise, heldBalancePaise }: Props) {
  return (
    <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2">
      <div className="card group hover:border-brand/30 transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Wallet size={24} className="scale-90 md:scale-100" />
          </div>
          <span className="text-[10px] md:text-xs font-medium bg-emerald-100 text-emerald-700 px-2.5 py-0.5 rounded-full">Available</span>
        </div>
        <p className="text-xs md:text-sm font-medium text-slate-500 mb-1">Available Balance</p>
        <p className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{formatRupees(availableBalancePaise)}</p>
        <div className="mt-4 pt-4 border-t border-slate-50 flex items-center text-[10px] md:text-xs text-slate-400">
          <span>Ready for instant payout</span>
        </div>
      </div>

      <div className="card group hover:border-brand/30 transition-all duration-300">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <Lock size={24} className="scale-90 md:scale-100" />
          </div>
          <span className="text-[10px] md:text-xs font-medium bg-amber-100 text-amber-700 px-2.5 py-0.5 rounded-full">Pending</span>
        </div>
        <p className="text-xs md:text-sm font-medium text-slate-500 mb-1">Held Balance</p>
        <p className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">{formatRupees(heldBalancePaise)}</p>
        <div className="mt-4 pt-4 border-t border-slate-50 flex items-center text-[10px] md:text-xs text-slate-400">
          <span>Processing in background</span>
        </div>
      </div>
    </div>
  );
}

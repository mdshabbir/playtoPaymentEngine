type Props = {
  availableBalancePaise: number;
  heldBalancePaise: number;
};

function formatRupees(paise: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(paise / 100);
}

export function BalanceCards({ availableBalancePaise, heldBalancePaise }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-500">Available balance</p>
        <p className="mt-2 text-2xl font-semibold text-emerald-700">{formatRupees(availableBalancePaise)}</p>
      </div>
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-500">Held balance</p>
        <p className="mt-2 text-2xl font-semibold text-amber-700">{formatRupees(heldBalancePaise)}</p>
      </div>
    </div>
  );
}


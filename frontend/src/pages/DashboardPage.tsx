import { useCallback, useEffect, useState } from "react";
import { Bell, Search, User, Menu, X, Wallet } from 'lucide-react';

import { createPayout, DashboardResponse, getDashboard } from "../api/client";
import { BalanceCards } from "../components/BalanceCards";
import { LedgerTable } from "../components/LedgerTable";
import { PayoutForm } from "../components/PayoutForm";
import { PayoutHistoryTable } from "../components/PayoutHistoryTable";
import { Sidebar } from "../components/Sidebar";

export function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-white">
      <div className="w-10 h-10 border-4 border-brand/20 border-t-brand rounded-full animate-spin" />
    </div>
  );

  if (error || !data) return (
    <div className="flex items-center justify-center h-screen bg-white p-8">
      <div className="card max-w-md text-center">
        <div className="text-red-500 mb-4 flex justify-center">
          <Bell size={48} />
        </div>
        <h3 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h3>
        <p className="text-slate-600 mb-6">{error ?? "Unknown error occurred while loading dashboard."}</p>
        <button onClick={() => window.location.reload()} className="btn-primary w-full">Retry</button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-slate-50/30 overflow-x-hidden">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="flex-1 min-w-0">
        {/* Header */}
        <header className="h-16 md:h-20 bg-white border-b border-slate-100 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 hover:text-brand"
            >
              <Menu size={20} />
            </button>
            
            <div className="relative hidden md:block w-64 lg:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search transactions..." 
                className="w-full bg-slate-50 border-none rounded-2xl py-2.5 pl-12 pr-4 text-sm focus:ring-2 focus:ring-brand/10 outline-none transition-all"
              />
            </div>

            {/* Mobile Logo (Visible only on mobile header) */}
            <div className="flex items-center gap-2 lg:hidden">
              <div className="w-8 h-8 bg-brand rounded-lg flex items-center justify-center">
                <Wallet className="text-white" size={16} />
              </div>
              <span className="font-bold text-slate-900">Playto</span>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <button className="md:hidden w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600">
              <Search size={20} />
            </button>
            <button className="w-10 h-10 rounded-xl md:rounded-2xl bg-slate-50 flex items-center justify-center text-slate-600 hover:text-brand transition-colors">
              <Bell size={20} />
            </button>
            <div className="h-8 md:h-10 w-[1px] bg-slate-100 mx-1 md:mx-2" />
            <div className="flex items-center gap-2 md:gap-3 pl-1 md:pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900 leading-none">Merchant #{data.merchant_id}</p>
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mt-1">Verified</p>
              </div>
              <div className="w-10 h-10 rounded-xl md:rounded-2xl bg-brand/10 text-brand flex items-center justify-center border border-brand/10">
                <User size={20} />
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-4 md:p-8 max-w-7xl mx-auto space-y-6 md:space-y-8">
          <section>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Overview</h1>
                <p className="text-slate-500 mt-1 font-medium text-sm md:text-base">Welcome back! Here's what's happening today.</p>
              </div>
              <div className="bg-white p-1 rounded-2xl border border-slate-100 shadow-sm flex self-start md:self-auto">
                <button className="px-4 py-2 rounded-xl text-xs md:text-sm font-bold bg-brand text-white shadow-md shadow-brand/20">All Time</button>
                <button className="px-4 py-2 rounded-xl text-xs md:text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">Last 30 Days</button>
              </div>
            </div>
            
            <BalanceCards
              availableBalancePaise={data.available_balance_paise}
              heldBalancePaise={data.held_balance_paise}
            />
          </section>

          <div className="grid gap-6 md:gap-8 lg:grid-cols-3 items-start">
            <div className="lg:col-span-2 space-y-6 md:space-y-8 overflow-hidden">
              <PayoutHistoryTable items={data.recent_payouts} />
              <LedgerTable items={data.recent_ledger} />
            </div>
            <div className="space-y-6 md:space-y-8">
              <PayoutForm onSubmit={handlePayout} />
              
              <div className="card bg-brand text-white border-none overflow-hidden relative">
                <div className="relative z-10">
                  <h3 className="font-bold text-lg mb-2">Need Help?</h3>
                  <p className="text-white/80 text-sm mb-4">Contact our support team for any issues regarding your payouts.</p>
                  <button className="bg-white text-brand px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors">
                    Contact Support
                  </button>
                </div>
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute -left-4 -top-4 w-24 h-24 bg-brand-light/30 rounded-full blur-2xl" />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

import { LayoutDashboard, Send, History, Settings, LogOut, Wallet } from 'lucide-react';

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  active?: boolean;
}

function SidebarItem({ icon: Icon, label, active }: SidebarItemProps) {
  return (
    <div className={`flex items-center space-x-3 px-4 py-3 rounded-2xl cursor-pointer transition-all duration-200 ${active ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-slate-600 hover:bg-slate-50 hover:text-brand'
      }`}>
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </div>
  );
}

export function Sidebar() {
  return (
    <div className="w-64 h-screen border-r border-slate-100 flex flex-col p-6 sticky top-0 bg-white">
      <div className="flex items-center space-x-2 px-4 mb-10">
        <div className="w-10 h-10 bg-brand rounded-2xl flex items-center justify-center">
          <Wallet className="text-white" size={24} />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-bold tracking-tight text-slate-900 leading-none">Playto</span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Payment Engine</span>
        </div>
      </div>

      <nav className="flex-1 space-y-2">
        <SidebarItem icon={LayoutDashboard} label="Dashboard" active />
        <SidebarItem icon={Send} label="Payouts" />
        <SidebarItem icon={History} label="Transactions" />
        <SidebarItem icon={Settings} label="Settings" />
      </nav>

      <div className="pt-6 border-t border-slate-100">
        <SidebarItem icon={LogOut} label="Log Out" />
      </div>
    </div>
  );
}

import { LayoutDashboard, Send, History, Settings, LogOut, Wallet, X } from 'lucide-react';

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

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-100 flex flex-col p-6 transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:w-64 lg:h-screen lg:sticky lg:top-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between px-4 mb-10">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-brand rounded-2xl flex items-center justify-center">
              <Wallet className="text-white" size={24} />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold tracking-tight text-slate-900 leading-none">Playto</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-1">Payment Engine</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="lg:hidden p-2 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={20} />
          </button>
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
    </>
  );
}

import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import {
  Store,
  ShoppingCart,
  Package,
  Receipt,
  BarChart3,
  Bell,
  Settings,
  User,
  AlertTriangle,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { formatRupiah } from '../utils/formatters';

interface NavbarProps {
  onOpenSettings: () => void;
  onQuickRestock: (productId: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSettings, onQuickRestock }) => {
  const {
    activeTab,
    setActiveTab,
    cartTotals,
    lowStockProducts,
    settings,
    activeCashier,
  } = useStore();

  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    {
      id: 'pos' as const,
      label: 'Point of Sale (Kasir)',
      icon: ShoppingCart,
      badge: cartTotals.totalUnits > 0 ? cartTotals.totalUnits : null,
      badgeColor: 'bg-emerald-500 text-white',
    },
    {
      id: 'inventory' as const,
      label: 'Inventaris & Stok',
      icon: Package,
      badge: lowStockProducts.length > 0 ? lowStockProducts.length : null,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'history' as const,
      label: 'Riwayat Penjualan',
      icon: Receipt,
    },
    {
      id: 'reports' as const,
      label: 'Laporan & Analisis',
      icon: BarChart3,
    },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand & Store Name */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-900/30 flex-shrink-0">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div className="truncate">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm sm:text-base tracking-tight text-white truncate">
                  {settings.name}
                </span>
                <span className="hidden md:inline-flex text-[10px] uppercase font-semibold tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded-sm">
                  POS PRO
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate hidden sm:block">
                {settings.tagline}
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-tab-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge !== null && item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        isActive ? 'bg-white text-emerald-800' : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {/* Live Time Clock */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/50 px-2.5 py-1.5 rounded-lg border border-slate-700/40">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-mono text-slate-300 font-medium">{currentTime}</span>
            </div>

            {/* Low Stock Alert Dropdown (Automasi Peringatan Stok < 10) */}
            <div className="relative">
              <button
                id="low-stock-bell-btn"
                onClick={() => setIsAlertOpen(!isAlertOpen)}
                className="relative p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
                title="Peringatan Stok Menipis"
              >
                <Bell className="w-5 h-5" />
                {lowStockProducts.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-amber-500 text-slate-900 text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-slate-900 animate-pulse">
                    {lowStockProducts.length}
                  </span>
                )}
              </button>

              {/* Dropdown Menu */}
              {isAlertOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsAlertOpen(false)}
                  />
                  <div
                    id="stock-alert-dropdown"
                    className="absolute right-0 mt-2 w-80 sm:w-96 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 z-50 p-4 animate-in fade-in zoom-in-95 duration-150"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <h4 className="font-bold text-xs text-slate-900">
                          Peringatan Stok Menipis (&lt;10 Unit)
                        </h4>
                      </div>
                      <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                        {lowStockProducts.length} Produk
                      </span>
                    </div>

                    {lowStockProducts.length === 0 ? (
                      <div className="text-center py-6 text-slate-500 text-xs">
                        <Sparkles className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                        Semua stok produk dalam kondisi aman!
                      </div>
                    ) : (
                      <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                        {lowStockProducts.map((prod) => (
                          <div
                            key={prod.id}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/60 border border-amber-200/70 hover:bg-amber-50 transition"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-slate-900 truncate">
                                {prod.name}
                              </p>
                              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                                <span>SKU: {prod.sku}</span>
                                <span>•</span>
                                <span className="font-semibold text-rose-600">
                                  Sisa: {prod.stock} {prod.unit}
                                </span>
                              </div>
                            </div>
                            <button
                              id={`quick-restock-${prod.id}`}
                              onClick={() => {
                                setIsAlertOpen(false);
                                onQuickRestock(prod.id);
                              }}
                              className="ml-2 px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-semibold flex items-center gap-1 flex-shrink-0 transition active:scale-95 shadow-xs"
                            >
                              <span>Restock</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-3 mt-3 border-t border-slate-100 flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Automasi Notifikasi Stok</span>
                      <button
                        onClick={() => {
                          setIsAlertOpen(false);
                          setActiveTab('inventory');
                        }}
                        className="text-emerald-600 hover:text-emerald-700 font-semibold"
                      >
                        Buka Inventaris →
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Cashier Badge */}
            <div className="hidden md:flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 px-3 py-1.5 rounded-xl text-xs text-slate-300">
              <div className="w-6 h-6 rounded-full bg-emerald-700 text-emerald-100 flex items-center justify-center text-[10px] font-bold">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="text-left">
                <p className="text-[10px] text-slate-400 leading-none">Kasir</p>
                <p className="font-medium text-slate-200 leading-tight">{activeCashier}</p>
              </div>
            </div>

            {/* Settings Button */}
            <button
              id="open-settings-nav-btn"
              onClick={onOpenSettings}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
              title="Pengaturan Toko & Backup"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs Bar */}
        <div className="lg:hidden flex items-center justify-around gap-1 py-1.5 border-t border-slate-800/80">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[11px] font-semibold transition active:scale-95 cursor-pointer ${
                  isActive
                    ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  {item.badge !== null && item.badge !== undefined && (
                    <span
                      className={`absolute -top-1.5 -right-2.5 text-[8px] font-mono font-bold px-1 rounded-full ${
                        isActive ? 'bg-emerald-400 text-slate-950' : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="truncate">
                  {item.id === 'pos'
                    ? 'Kasir'
                    : item.id === 'inventory'
                    ? 'Stok'
                    : item.id === 'history'
                    ? 'Riwayat'
                    : 'Laporan'}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};

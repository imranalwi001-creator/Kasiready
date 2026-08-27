import React, { useState, useEffect } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { LoginPage } from './components/auth/LoginPage';
import { POSPage } from './components/pos/POSPage';
import { InventoryPage } from './components/inventory/InventoryPage';
import { SalesHistoryPage } from './components/history/SalesHistoryPage';
import { ReportsDashboard } from './components/reports/ReportsDashboard';
import { CashDrawerPage } from './components/cash/CashDrawerPage';
import { SettingsPage } from './components/settings/SettingsPage';
import {
  ShoppingCart,
  Package,
  Receipt,
  BarChart3,
  Wallet,
  Coins,
  Settings,
  Bell,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Building2,
  LogOut,
  ShieldCheck,
  UserCheck,
  ChevronDown,
  Lock,
} from 'lucide-react';
import { TabType, UserRole } from './types';

const MainAppContent: React.FC = () => {
  const {
    currentUser,
    logout,
    activeTab,
    setActiveTab,
    canAccessTab,
    hasRole,
    cartTotals,
    lowStockProducts,
    settings,
    stores,
    activeStoreId,
    setActiveStoreId,
    activeStore,
  } = useStore();

  const [quickRestockId, setQuickRestockId] = useState<string | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isStoreMenuOpen, setIsStoreMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

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
      setCurrentDate(
        now.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // If user is not logged in, render the login page
  if (!currentUser) {
    return <LoginPage />;
  }

  const handleQuickRestock = (productId: string) => {
    if (canAccessTab('inventory')) {
      setQuickRestockId(productId);
      setActiveTab('inventory');
    }
  };

  const navItems = [
    {
      id: 'pos' as TabType,
      label: 'Kasir (POS)',
      icon: ShoppingCart,
      badge: cartTotals.totalUnits > 0 ? cartTotals.totalUnits : null,
      badgeColor: 'bg-indigo-600 text-white',
      allowed: canAccessTab('pos'),
    },
    {
      id: 'inventory' as TabType,
      label: 'Inventaris',
      icon: Package,
      badge: lowStockProducts.length > 0 ? lowStockProducts.length : null,
      badgeColor: 'bg-amber-500 text-slate-900',
      allowed: canAccessTab('inventory'),
    },
    {
      id: 'history' as TabType,
      label: 'Riwayat',
      icon: Receipt,
      allowed: canAccessTab('history'),
    },
    {
      id: 'cash-drawer' as TabType,
      label: 'Buku Kas & Shift',
      icon: Wallet,
      allowed: canAccessTab('cash-drawer'),
    },
    {
      id: 'reports' as TabType,
      label: 'Laporan',
      icon: BarChart3,
      allowed: canAccessTab('reports'),
    },
    {
      id: 'settings' as TabType,
      label: 'Pengaturan',
      icon: Settings,
      allowed: canAccessTab('settings'),
    },
  ].filter((item) => item.allowed);

  const getPageTitle = () => {
    switch (activeTab) {
      case 'pos':
        return 'Point of Sale (Kasir)';
      case 'inventory':
        return 'Manajemen Inventaris & Stok';
      case 'history':
        return 'Riwayat Transaksi Penjualan';
      case 'cash-drawer':
        return 'Buku Kas, Modal Awal & Pengeluaran Operasional';
      case 'reports':
        return 'Laporan Keuangan & Analisis';
      case 'settings':
        return 'Pusat Pengaturan Sistem POS';
      default:
        return 'Point of Sale';
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return { label: 'Super Admin', bg: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'admin':
        return { label: 'Admin Toko', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      case 'kasir':
        return { label: 'Kasir POS', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    }
  };

  const roleBadge = getRoleBadge(currentUser.role);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 text-slate-800 font-sans select-none">
      {/* High Density Left Sidebar (Desktop) */}
      <aside className="hidden md:flex w-20 bg-slate-900 flex-col items-center py-5 gap-6 text-slate-400 border-r border-slate-800 shrink-0 z-30 justify-between">
        {/* Top Logo / App Brand */}
        <div className="flex flex-col items-center gap-6">
          <div
            onClick={() => setActiveTab('pos')}
            className="w-12 h-12 bg-indigo-600 hover:bg-indigo-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-900/40 cursor-pointer transition-all active:scale-95"
            title={`${settings.name} (POS PRO)`}
          >
            {settings.name ? settings.name.charAt(0).toUpperCase() : 'K'}
          </div>

          {/* Nav Icons */}
          <nav className="flex flex-col gap-3 items-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  id={`sidebar-nav-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`relative p-3 rounded-xl cursor-pointer transition-all group ${
                    isActive
                      ? 'bg-slate-800 text-white shadow-xs ring-1 ring-slate-700/60'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                  title={item.label}
                >
                  <Icon className="w-5 h-5" />
                  {item.badge !== null && item.badge !== undefined && (
                    <span
                      className={`absolute -top-1 -right-1 text-[9px] font-bold px-1.5 py-0.2 rounded-full ring-2 ring-slate-900 ${
                        isActive ? 'bg-indigo-500 text-white' : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                  {/* Tooltip on hover */}
                  <span className="absolute left-full ml-3 px-2 py-1 bg-slate-800 text-white text-[11px] font-medium rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Settings & Logout Button */}
        <div className="flex flex-col items-center gap-2">
          {hasRole(['super_admin', 'admin']) && (
            <button
              id="sidebar-settings-btn"
              onClick={() => setActiveTab('settings')}
              className={`p-3 rounded-xl cursor-pointer transition-all group relative ${
                activeTab === 'settings'
                  ? 'bg-slate-800 text-white shadow-xs ring-1 ring-slate-700/60'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Pengaturan Gateway, Printer & User"
            >
              <Settings className="w-5 h-5" />
              <span className="absolute left-full ml-3 px-2 py-1 bg-slate-800 text-white text-[11px] font-medium rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md">
                Pengaturan
              </span>
            </button>
          )}

          <button
            id="sidebar-logout-btn"
            onClick={logout}
            className="p-3 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl cursor-pointer transition-all group relative"
            title="Keluar (Logout)"
          >
            <LogOut className="w-5 h-5" />
            <span className="absolute left-full ml-3 px-2 py-1 bg-slate-800 text-white text-[11px] font-medium rounded-md whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50 shadow-md">
              Keluar
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* High Density Top Header */}
        <header className="h-14 sm:h-16 bg-white border-b border-slate-200 flex items-center justify-between px-3 sm:px-6 shrink-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile App Icon */}
            <div
              onClick={() => setActiveTab('pos')}
              className="md:hidden w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0 cursor-pointer"
            >
              {settings.name ? settings.name.charAt(0).toUpperCase() : 'K'}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate">
                  {getPageTitle()}
                </h1>
                <span className={`hidden sm:inline-flex text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${roleBadge.bg}`}>
                  {roleBadge.label}
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-400 truncate hidden sm:block">
                {activeStore ? activeStore.name : settings.name} &bull; {settings.tagline}
              </p>
            </div>
          </div>

          {/* Right Header Toolbar: Multi-Store Switcher, Stock Alert, User Profile */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Multi-Store Branch Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                id="header-store-switcher-btn"
                onClick={() => setIsStoreMenuOpen(!isStoreMenuOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="max-w-[100px] sm:max-w-[140px] truncate">
                  {activeStore ? activeStore.name : 'Pilih Cabang'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isStoreMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsStoreMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 z-50 p-2 animate-in fade-in zoom-in-95 duration-150">
                    <p className="text-[10px] font-bold uppercase text-slate-400 px-2 py-1">
                      Pilih Cabang Aktif
                    </p>
                    <div className="space-y-1">
                      {stores.map((s) => {
                        const isSelected = s.id === activeStoreId;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => {
                              setActiveStoreId(s.id);
                              setIsStoreMenuOpen(false);
                            }}
                            className={`w-full text-left p-2 rounded-lg text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                              isSelected
                                ? 'bg-indigo-50 text-indigo-700 font-bold'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="truncate">{s.name}</p>
                              <span className="text-[10px] text-slate-400 font-mono">{s.code} &bull; {s.phone}</span>
                            </div>
                            {s.isMain && (
                              <span className="text-[9px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-bold">
                                Pusat
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Low Stock Alert Dropdown */}
            <div className="relative">
              <button
                id="header-low-stock-bell"
                onClick={() => setIsAlertOpen(!isAlertOpen)}
                className={`relative p-2 rounded-xl transition border ${
                  lowStockProducts.length > 0
                    ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100 border-transparent'
                }`}
                title="Peringatan Stok Menipis"
              >
                <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                {lowStockProducts.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                    {lowStockProducts.length}
                  </span>
                )}
              </button>

              {/* Stock Alert Dropdown */}
              {isAlertOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsAlertOpen(false)}
                  />
                  <div
                    id="stock-alert-dropdown-panel"
                    className="absolute right-0 mt-2 w-80 sm:w-96 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 z-50 p-4 animate-in fade-in zoom-in-95 duration-150"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <h4 className="font-bold text-xs text-slate-900">
                          Peringatan Stok Menipis (&le;10 Unit)
                        </h4>
                      </div>
                      <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                        {lowStockProducts.length} Produk
                      </span>
                    </div>

                    {lowStockProducts.length === 0 ? (
                      <div className="text-center py-6 text-slate-500 text-xs">
                        <Sparkles className="w-6 h-6 text-indigo-600 mx-auto mb-2" />
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
                            {canAccessTab('inventory') && (
                              <button
                                id={`quick-restock-header-${prod.id}`}
                                onClick={() => {
                                  setIsAlertOpen(false);
                                  handleQuickRestock(prod.id);
                                }}
                                className="ml-2 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold flex items-center gap-1 shrink-0 transition active:scale-95 shadow-xs cursor-pointer"
                              >
                                <span>Restock</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Mobile Settings Icon */}
            {hasRole(['super_admin', 'admin']) && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`md:hidden p-2 rounded-xl transition ${
                  activeTab === 'settings'
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
                title="Pengaturan"
              >
                <Settings className="w-4 h-4" />
              </button>
            )}

            {/* User Profile Dropdown Menu */}
            <div className="relative">
              <button
                type="button"
                id="header-user-menu-btn"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1.5 sm:px-2.5 rounded-xl hover:bg-slate-100 transition cursor-pointer border border-slate-200/80"
              >
                <img
                  src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                  alt={currentUser.name}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover border border-slate-200"
                />
                <div className="flex flex-col items-start text-left hidden sm:flex">
                  <span className="text-xs font-bold text-slate-900 leading-tight">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] text-slate-500 leading-tight">
                    @{currentUser.username}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
              </button>

              {/* User Menu Modal / Dropdown */}
              {isUserMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 z-50 p-3 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center gap-3 pb-2.5 border-b border-slate-100">
                      <img
                        src={currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                        alt={currentUser.name}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-900 truncate">{currentUser.name}</p>
                        <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                        <span className={`inline-block mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded border ${roleBadge.bg}`}>
                          {roleBadge.label}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 text-xs">
                      {hasRole(['super_admin', 'admin']) && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            setActiveTab('settings');
                          }}
                          className={`w-full text-left px-2.5 py-2 rounded-xl font-semibold flex items-center gap-2 cursor-pointer ${
                            activeTab === 'settings'
                              ? 'bg-indigo-50 text-indigo-700 font-bold'
                              : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <Settings className="w-4 h-4 text-slate-400" />
                          <span>Pengaturan POS</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-bold flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Keluar Akun (Logout)</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden flex items-center justify-around bg-slate-900 text-white py-2 px-2 border-t border-slate-800 shrink-0">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition ${
                  isActive ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <div className="relative">
                  <Icon className="w-4 h-4 mb-0.5" />
                  {item.badge !== null && item.badge !== undefined && (
                    <span className="absolute -top-1 -right-2 text-[8px] font-bold px-1 rounded-full bg-rose-600 text-white">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Page Views */}
        <div className="flex-1 overflow-y-auto bg-slate-100">
          {activeTab === 'pos' && <POSPage />}
          {activeTab === 'inventory' && canAccessTab('inventory') && (
            <InventoryPage
              initialRestockProductId={quickRestockId}
              onClearInitialRestock={() => setQuickRestockId(null)}
            />
          )}
          {activeTab === 'history' && <SalesHistoryPage />}
          {activeTab === 'cash-drawer' && canAccessTab('cash-drawer') && <CashDrawerPage />}
          {activeTab === 'reports' && canAccessTab('reports') && <ReportsDashboard />}
          {activeTab === 'settings' && canAccessTab('settings') && <SettingsPage />}
        </div>

        {/* High Density Status Footer */}
        <footer className="h-8 sm:h-9 bg-slate-900 text-slate-300 flex items-center px-4 sm:px-6 text-[10px] font-medium justify-between border-t border-slate-800 shrink-0 select-none z-10">
          <div className="flex items-center gap-4 sm:gap-6 uppercase tracking-wider text-[9px] sm:text-[10px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="hidden sm:inline text-slate-400">Kasir:</span> {currentUser.name}
            </span>
            <span className="hidden sm:flex items-center gap-1.5 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-indigo-400" />
              <span className="text-slate-400">Cabang:</span> {activeStore?.name || 'Pusat'}
            </span>
            {lowStockProducts.length > 0 ? (
              <span
                onClick={() => canAccessTab('inventory') && setActiveTab('inventory')}
                className="text-amber-400 hover:underline cursor-pointer flex items-center gap-1 font-bold"
              >
                <AlertTriangle className="w-3 h-3 text-amber-400" />
                Stok Rendah: {lowStockProducts.length} Produk
              </span>
            ) : (
              <span className="text-emerald-400 hidden sm:inline">
                Stok Aman (100%)
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-slate-400 font-mono text-[9px] sm:text-[10px]">
            <span>{currentDate}</span>
            <span>•</span>
            <span className="text-slate-200 font-bold">{currentTime}</span>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default function App() {
  return (
    <StoreProvider>
      <MainAppContent />
    </StoreProvider>
  );
}

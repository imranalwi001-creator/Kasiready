import React, { useState, useEffect } from 'react';
import { StoreProvider, useStore } from './context/StoreContext';
import { LoginPage } from './components/auth/LoginPage';
import { DashboardOverviewPage } from './components/dashboard/DashboardOverviewPage';
import { POSPage } from './components/pos/POSPage';
import { CustomersPage } from './components/customers/CustomersPage';
import { InventoryPage } from './components/inventory/InventoryPage';
import { SalesHistoryPage } from './components/history/SalesHistoryPage';
import { ReportsDashboard } from './components/reports/ReportsDashboard';
import { CashDrawerPage } from './components/cash/CashDrawerPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { DigitalProductsPage } from './components/digital/DigitalProductsPage';
import { DocumentationModal } from './components/modals/DocumentationModal';
import { ActivityLogsModal } from './components/modals/ActivityLogsModal';
import { LicenseModal } from './components/modals/LicenseModal';
import { GlobalSearchModal } from './components/modals/GlobalSearchModal';
import { PromotionModal } from './components/modals/PromotionModal';
import { BrandLogo } from './components/common/BrandLogo';
import {
  LayoutGrid,
  Users,
  Package,
  CreditCard,
  Receipt,
  TrendingUp,
  Wallet,
  BookOpen,
  FileText,
  Clock,
  ShieldCheck,
  Tag,
  Settings,
  Bell,
  Search,
  Moon,
  Sun,
  LogOut,
  ChevronDown,
  ChevronRight,
  Building2,
  AlertTriangle,
  Sparkles,
  Zap,
  ExternalLink,
  Menu,
  X,
  ArrowRight,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronLeft,
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
    theme,
    toggleTheme,
  } = useStore();

  const [quickRestockId, setQuickRestockId] = useState<string | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isStoreMenuOpen, setIsStoreMenuOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('averion_pos_sidebar_collapsed');
      return saved ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  // Persist sidebar collapsed state
  useEffect(() => {
    try {
      localStorage.setItem('averion_pos_sidebar_collapsed', JSON.stringify(isSidebarCollapsed));
    } catch {
      // ignore
    }
  }, [isSidebarCollapsed]);

  // Sections collapse toggles
  const [isKontenOpen, setIsKontenOpen] = useState(true);
  const [isMarketingOpen, setIsMarketingOpen] = useState(true);
  const [isConfigOpen, setIsConfigOpen] = useState(true);

  // Time ticker
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
          weekday: 'long',
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

  // Global Ctrl + K search shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!currentUser) {
    return <LoginPage />;
  }

  const handleQuickRestock = (productId: string) => {
    if (canAccessTab('inventory')) {
      setQuickRestockId(productId);
      setActiveTab('inventory');
    }
  };

  // Main primary navigation items matching Averion layout with POS as the primary item
  const primaryNavItems = [
    {
      id: 'pos' as TabType,
      label: 'Canvas (Kasir POS)',
      icon: CreditCard,
      badge: cartTotals.totalUnits > 0 ? cartTotals.totalUnits : null,
      badgeColor: 'bg-[#00A876] text-white font-bold',
      allowed: canAccessTab('pos'),
    },
    {
      id: 'digital-products' as TabType,
      label: 'Produk Digital (PPOB)',
      icon: Zap,
      badge: 'PPOB',
      badgeColor: 'bg-emerald-500 text-white font-bold',
      allowed: canAccessTab('digital-products'),
    },
    {
      id: 'dashboard' as TabType,
      label: 'Dashboard',
      icon: LayoutGrid,
      allowed: canAccessTab('dashboard'),
    },
    {
      id: 'inventory' as TabType,
      label: 'Products (Stok)',
      icon: Package,
      badge: lowStockProducts.length > 0 ? lowStockProducts.length : null,
      badgeColor: 'bg-amber-400 text-slate-900',
      allowed: canAccessTab('inventory'),
    },
    {
      id: 'history' as TabType,
      label: 'Transactions',
      icon: Receipt,
      allowed: canAccessTab('history'),
    },
    {
      id: 'cash-drawer' as TabType,
      label: 'Cash Drawer',
      icon: Wallet,
      allowed: canAccessTab('cash-drawer'),
    },
    {
      id: 'customers' as TabType,
      label: 'Users & Member',
      icon: Users,
      allowed: canAccessTab('customers'),
    },
    {
      id: 'reports' as TabType,
      label: 'Funnel Analytics',
      icon: TrendingUp,
      allowed: canAccessTab('reports'),
    },
  ].filter((item) => item.allowed);

  const getPageUppercaseTitle = () => {
    switch (activeTab) {
      case 'pos':
        return 'CANVAS (POINT OF SALE - KASIR)';
      case 'digital-products':
        return 'PRODUK DIGITAL & PPOB (PULSA, DATA, PLN, E-WALLET)';
      case 'dashboard':
        return 'DASHBOARD';
      case 'customers':
        return 'USERS & MEMBERS';
      case 'inventory':
        return 'PRODUCTS (INVENTARIS & STOK)';
      case 'history':
        return 'TRANSACTIONS (RIWAYAT PENJUALAN)';
      case 'reports':
        return 'FUNNEL ANALYTICS & LAPORAN';
      case 'cash-drawer':
        return 'CASH DRAWER & SHIFT KASIR';
      case 'settings':
        return 'SETTINGS (PENGATURAN TOKO)';
      default:
        return 'CANVAS (POINT OF SALE - KASIR)';
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return { label: 'Super Admin', bg: 'bg-purple-900/60 text-purple-200 border-purple-700' };
      case 'admin':
        return { label: 'Admin Toko', bg: 'bg-blue-900/60 text-blue-200 border-blue-700' };
      case 'kasir':
        return { label: 'Kasir POS', bg: 'bg-emerald-900/60 text-emerald-200 border-emerald-700' };
    }
  };

  const roleBadge = getRoleBadge(currentUser.role);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F4F7F9] text-slate-800 font-sans select-none">
      {/* Averion Obsidian & Emerald Sidebar (Desktop) */}
      <aside
        className={`hidden lg:flex ${
          isSidebarCollapsed ? 'w-20 px-2' : 'w-64 px-4'
        } bg-[#0B1320] flex-col py-5 text-white shrink-0 z-30 justify-between select-none shadow-2xl border-r border-slate-800/80 transition-all duration-300 ease-in-out`}
      >
        {/* Top Logo & Branding & Nav */}
        <div className="space-y-5 overflow-y-auto pr-0.5 scrollbar-none">
          {/* Logo & Collapse/Expand Toggle Area */}
          {!isSidebarCollapsed ? (
            <div className="flex items-center justify-between px-1">
              <div
                onClick={() => setActiveTab('pos')}
                className="flex items-center gap-3 cursor-pointer transition-all active:scale-95 group min-w-0"
              >
                <BrandLogo
                  logoType={settings.logoType}
                  logoPreset={settings.logoPreset}
                  logoUrl={settings.logoUrl}
                  storeName={settings.name}
                  size="sm"
                />
                <div className="min-w-0 truncate">
                  <h1 className="text-sm font-extrabold tracking-tight text-white leading-tight font-sans flex items-center gap-1.5 truncate">
                    <span>{settings.name || 'Averion POS'}</span>
                  </h1>
                  <p className="text-[10px] text-slate-400 truncate">
                    {settings.tagline || 'Studio POS Pro'}
                  </p>
                </div>
              </div>

              {/* Sidebar Collapse Toggle Button */}
              <button
                type="button"
                id="averion-collapse-sidebar-btn"
                onClick={() => setIsSidebarCollapsed(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer shrink-0"
                title="Kecilkan Menu (Icon Only)"
              >
                <PanelLeftClose className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div
                onClick={() => setActiveTab('pos')}
                className="cursor-pointer hover:scale-105 transition shrink-0"
                title={settings.name || 'Averion POS'}
              >
                <BrandLogo
                  logoType={settings.logoType}
                  logoPreset={settings.logoPreset}
                  logoUrl={settings.logoUrl}
                  storeName={settings.name}
                  size="sm"
                />
              </div>

              {/* Sidebar Expand Toggle Button */}
              <button
                type="button"
                id="averion-expand-sidebar-btn"
                onClick={() => setIsSidebarCollapsed(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                title="Perluas Menu"
              >
                <PanelLeftOpen className="w-4 h-4 text-[#00A876]" />
              </button>
            </div>
          )}

          {/* Primary Nav List */}
          <nav className="space-y-1.5 pt-1">
            {primaryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              if (isSidebarCollapsed) {
                return (
                  <button
                    key={item.id}
                    id={`averion-sidebar-nav-${item.id}`}
                    onClick={() => setActiveTab(item.id)}
                    title={item.label}
                    className={`w-full relative flex items-center justify-center p-3 rounded-xl transition-all cursor-pointer group ${
                      isActive
                        ? 'bg-[#00A876] text-white shadow-md shadow-[#00A876]/25 font-bold'
                        : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} />
                    {item.badge !== null && item.badge !== undefined && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-[#0B1320]" />
                    )}
                  </button>
                );
              }

              return (
                <button
                  key={item.id}
                  id={`averion-sidebar-nav-${item.id}`}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#00A876] text-white shadow-md shadow-[#00A876]/25 font-bold'
                      : 'text-slate-400 hover:bg-slate-800/70 hover:text-white font-medium'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== null && item.badge !== undefined && (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive ? 'bg-white text-[#00A876]' : item.badgeColor
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sub Sections */}
          {!isSidebarCollapsed ? (
            <>
              {/* Sub Section 1: KONTEN */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsKontenOpen(!isKontenOpen)}
                  className="w-full flex items-center justify-between px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  <span>KONTEN</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${isKontenOpen ? '' : '-rotate-90'}`}
                  />
                </button>

                {isKontenOpen && (
                  <div className="space-y-1 mt-1">
                    <button
                      type="button"
                      onClick={() => setIsDocModalOpen(true)}
                      className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800/70 hover:text-white transition cursor-pointer"
                    >
                      <BookOpen className="w-4 h-4 shrink-0 text-slate-400" />
                      <span>Dokumentasi</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Sub Section 2: MARKETING & GROWTH */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsMarketingOpen(!isMarketingOpen)}
                  className="w-full flex items-center justify-between px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  <span>MARKETING & GROWTH</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${isMarketingOpen ? '' : '-rotate-90'}`}
                  />
                </button>

                {isMarketingOpen && (
                  <div className="space-y-1 mt-1">
                    <button
                      type="button"
                      onClick={() => setIsPromoModalOpen(true)}
                      className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800/70 hover:text-white transition cursor-pointer"
                    >
                      <Tag className="w-4 h-4 shrink-0 text-slate-400" />
                      <span>Promosi & Diskon</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Sub Section 3: KONFIGURASI */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setIsConfigOpen(!isConfigOpen)}
                  className="w-full flex items-center justify-between px-3.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  <span>KONFIGURASI</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform ${isConfigOpen ? '' : '-rotate-90'}`}
                  />
                </button>

                {isConfigOpen && (
                  <div className="space-y-1 mt-1">
                    {hasRole(['super_admin', 'admin']) && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('settings')}
                        className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                          activeTab === 'settings'
                            ? 'bg-[#00A876] text-white font-bold'
                            : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
                        }`}
                      >
                        <Settings className="w-4 h-4 shrink-0 text-slate-400" />
                        <span>Pengaturan Toko</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsActivityModalOpen(true)}
                      className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800/70 hover:text-white transition cursor-pointer"
                    >
                      <Clock className="w-4 h-4 shrink-0 text-slate-400" />
                      <span>Activity Logs</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsLicenseModalOpen(true)}
                      className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800/70 hover:text-white transition cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4 shrink-0 text-slate-400" />
                      <span>License Pro</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="pt-2 border-t border-slate-800/80 space-y-1.5">
              <button
                type="button"
                onClick={() => setIsDocModalOpen(true)}
                title="Dokumentasi"
                className="w-full flex items-center justify-center p-3 rounded-xl text-slate-400 hover:bg-slate-800/70 hover:text-white transition cursor-pointer"
              >
                <BookOpen className="w-5 h-5 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => setIsPromoModalOpen(true)}
                title="Promosi & Diskon"
                className="w-full flex items-center justify-center p-3 rounded-xl text-slate-400 hover:bg-slate-800/70 hover:text-white transition cursor-pointer"
              >
                <Tag className="w-5 h-5 shrink-0" />
              </button>

              {hasRole(['super_admin', 'admin']) && (
                <button
                  type="button"
                  onClick={() => setActiveTab('settings')}
                  title="Pengaturan Toko"
                  className={`w-full flex items-center justify-center p-3 rounded-xl transition cursor-pointer ${
                    activeTab === 'settings'
                      ? 'bg-[#00A876] text-white font-bold'
                      : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
                  }`}
                >
                  <Settings className="w-5 h-5 shrink-0" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsActivityModalOpen(true)}
                title="Activity Logs"
                className="w-full flex items-center justify-center p-3 rounded-xl text-slate-400 hover:bg-slate-800/70 hover:text-white transition cursor-pointer"
              >
                <Clock className="w-5 h-5 shrink-0" />
              </button>

              <button
                type="button"
                onClick={() => setIsLicenseModalOpen(true)}
                title="License Pro"
                className="w-full flex items-center justify-center p-3 rounded-xl text-slate-400 hover:bg-slate-800/70 hover:text-white transition cursor-pointer"
              >
                <ShieldCheck className="w-5 h-5 shrink-0" />
              </button>
            </div>
          )}
        </div>

        {/* Bottom Workspace Card & Logout Button */}
        <div className="pt-4 border-t border-slate-800/80 space-y-3 shrink-0">
          {!isSidebarCollapsed ? (
            <>
              {/* Averion Studio / Store Card */}
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-7 h-7 rounded-lg bg-[#00A876]/20 border border-[#00A876]/30 flex items-center justify-center text-[#00A876] shrink-0">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate">
                    <p className="text-xs font-bold text-white truncate leading-tight">
                      Averion Studio
                    </p>
                    <span className="text-[10px] text-slate-400 truncate block">
                      Asisten POS Toko
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDocModalOpen(true)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  title="Bantuan"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={logout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800/80 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4 rotate-180 text-rose-400" />
                <span>Keluar Akun</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <button
                type="button"
                onClick={() => setIsDocModalOpen(true)}
                title="Averion Studio - Bantuan"
                className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-[#00A876] hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={logout}
                title="Keluar Akun"
                className="w-10 h-10 rounded-xl flex items-center justify-center text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4 rotate-180" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main App Layout Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#F4F7F9]">
        {/* Averion Midnight Deep Topbar (Exact match to screenshot) */}
        <header className="h-14 bg-[#0B1320] text-white flex items-center justify-between px-4 sm:px-6 shrink-0 z-20 shadow-md">
          {/* Left: Mobile Menu Toggle & Uppercase Breadcrumb */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Mobile Drawer Button */}
            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(true)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Breadcrumb Title */}
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-100">
              {getPageUppercaseTitle()}
            </span>
          </div>

          {/* Center: Global Search Bar with Ctrl K */}
          <div className="hidden md:flex items-center">
            <button
              type="button"
              onClick={() => setIsSearchModalOpen(true)}
              className="w-64 lg:w-80 bg-slate-800/90 hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 text-slate-300 rounded-lg px-3.5 py-1.5 flex items-center justify-between text-xs transition cursor-pointer shadow-inner"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-400">Cari...</span>
              </div>
              <span className="font-mono text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded border border-slate-600">
                Ctrl K
              </span>
            </button>
          </div>

          {/* Right: Notifications, Multi-Store, Theme, User Pill */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Multi-Store Branch Selector Dropdown */}
            <div className="relative">
              <button
                type="button"
                id="header-store-switcher-btn"
                onClick={() => setIsStoreMenuOpen(!isStoreMenuOpen)}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/90 hover:bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700/80 transition cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-[#00A876] shrink-0" />
                <span className="max-w-[100px] truncate">
                  {activeStore ? activeStore.name : 'Cabang'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isStoreMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsStoreMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-800 z-50 p-2 animate-in fade-in zoom-in-95 duration-150">
                    <p className="text-[10px] font-bold uppercase text-slate-400 px-2 py-1">
                      Pilih Cabang Toko
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
                                ? 'bg-[#00A876] text-white font-bold'
                                : 'hover:bg-slate-800 text-slate-300'
                            }`}
                          >
                            <div className="min-w-0">
                              <p className="truncate">{s.name}</p>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {s.code} &bull; {s.phone}
                              </span>
                            </div>
                            {s.isMain && (
                              <span className="text-[9px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-bold">
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

            {/* Low Stock Bell Alert */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsAlertOpen(!isAlertOpen)}
                className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition relative cursor-pointer"
                title="Pemberitahuan Stok"
              >
                <Bell className="w-4 h-4" />
                {lowStockProducts.length > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-[#0B1320]" />
                )}
              </button>

              {/* Alert Dropdown Panel */}
              {isAlertOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsAlertOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-80 bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 z-50 p-4 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        <h4 className="font-bold text-xs text-slate-900">
                          Peringatan Stok Menipis
                        </h4>
                      </div>
                      <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                        {lowStockProducts.length} Produk
                      </span>
                    </div>

                    {lowStockProducts.length === 0 ? (
                      <div className="text-center py-6 text-slate-500 text-xs">
                        <Sparkles className="w-6 h-6 text-[#00A876] mx-auto mb-2" />
                        Semua stok barang dalam kondisi aman!
                      </div>
                    ) : (
                      <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                        {lowStockProducts.map((prod) => (
                          <div
                            key={prod.id}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 hover:bg-amber-50 transition"
                          >
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-slate-900 truncate">
                                {prod.name}
                              </p>
                              <span className="text-[11px] text-rose-600 font-bold">
                                Sisa: {prod.stock} {prod.unit}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setIsAlertOpen(false);
                                handleQuickRestock(prod.id);
                              }}
                              className="ml-2 px-2.5 py-1 rounded-lg bg-[#00A876] hover:bg-[#008f65] text-white text-[11px] font-semibold flex items-center gap-1 shrink-0 cursor-pointer"
                            >
                              <span>Restock</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Dark/Light Mode Switcher Button */}
            <button
              type="button"
              id="header-theme-toggle-btn"
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              title={theme === 'dark' ? 'Ganti ke Mode Terang (Light Mode)' : 'Ganti ke Mode Gelap (Dark Mode)'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-300" />
              )}
            </button>

            {/* User Profile Pill with Emerald Avatar Circle (Ady Sheva / Imran Alwi) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full hover:bg-slate-800 transition cursor-pointer border border-slate-700/60"
              >
                {/* Emerald circle avatar */}
                <div className="w-7 h-7 rounded-full bg-[#00A876] text-white font-bold flex items-center justify-center text-xs shadow-xs">
                  {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <span className="text-xs font-bold text-slate-200 hidden sm:inline">
                  {currentUser.name || 'Ady Sheva'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Menu Modal / Dropdown */}
              {isUserMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsUserMenuOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-800 z-50 p-3 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center gap-3 pb-2.5 border-b border-slate-800">
                      <div className="w-10 h-10 rounded-xl bg-[#00A876] text-white font-bold flex items-center justify-center text-base">
                        {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'A'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-white truncate">
                          {currentUser.name}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate">
                          {currentUser.email}
                        </p>
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
                          className="w-full text-left px-2.5 py-2 rounded-xl text-slate-300 hover:bg-slate-800 font-semibold flex items-center gap-2 cursor-pointer"
                        >
                          <Settings className="w-4 h-4 text-slate-400" />
                          <span>Pengaturan POS</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setIsLicenseModalOpen(true);
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-xl text-slate-300 hover:bg-slate-800 font-semibold flex items-center gap-2 cursor-pointer"
                      >
                        <ShieldCheck className="w-4 h-4 text-slate-400" />
                        <span>Lisensi Pro Enterprise</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full text-left px-2.5 py-2 rounded-xl text-rose-400 hover:bg-rose-950/40 font-bold flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Keluar Akun (Logout)</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Dynamic Page Views */}
        <div className="flex-1 overflow-y-auto bg-[#F4F7F9] dark:bg-[#070D18] text-slate-900 dark:text-slate-100 transition-colors duration-150">
          {activeTab === 'dashboard' && (
            <DashboardOverviewPage
              onOpenAddProduct={() => setActiveTab('inventory')}
              onOpenAddCustomer={() => setActiveTab('customers')}
              onOpenDocumentation={() => setIsDocModalOpen(true)}
            />
          )}
          {activeTab === 'customers' && canAccessTab('customers') && <CustomersPage />}
          {activeTab === 'pos' && <POSPage />}
          {activeTab === 'digital-products' && canAccessTab('digital-products') && <DigitalProductsPage />}
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
      </main>

      {/* Mobile Drawer Sidebar */}
      {isMobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-[#0B1320] text-white p-5 flex flex-col justify-between shadow-2xl animate-in slide-in-from-left duration-200 border-r border-slate-800">
            <div className="space-y-6 overflow-y-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <BrandLogo
                    logoType={settings.logoType}
                    logoPreset={settings.logoPreset}
                    logoUrl={settings.logoUrl}
                    storeName={settings.name}
                    size="sm"
                  />
                  <div className="min-w-0">
                    <span className="text-sm font-extrabold text-white truncate block">
                      {settings.name || 'Averion POS'}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate block">
                      {settings.tagline || 'Studio POS Pro'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1.5">
                {primaryNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                        isActive
                          ? 'bg-[#00A876] text-white font-bold shadow-md shadow-[#00A876]/25'
                          : 'text-slate-400 hover:bg-slate-800/70 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-white text-[#00A876]' : item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-800 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setIsMobileSidebarOpen(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <LogOut className="w-4 h-4 rotate-180 text-rose-400" />
                <span>Keluar Akun</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global Modals */}
      <GlobalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
      <DocumentationModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
      />
      <ActivityLogsModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
      />
      <LicenseModal
        isOpen={isLicenseModalOpen}
        onClose={() => setIsLicenseModalOpen(false)}
      />
      <PromotionModal
        isOpen={isPromoModalOpen}
        onClose={() => setIsPromoModalOpen(false)}
      />
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

import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  DigitalCategory,
  DigitalProduct,
  DigitalTransaction,
  DigitalInquiryData,
  PaymentMethod,
} from '../../types';
import {
  DIGITAL_CATEGORIES,
  DIGITAL_PROVIDERS,
  detectProviderFromPhone,
  sampleInquiryPLN,
} from '../../data/initialDigitalData';
import { formatRupiah } from '../../utils/formatters';
import { inquirePLNData, DEFAULT_PPOB_SETTINGS } from '../../services/ppobService';
import { useToast } from '../../context/ToastContext';
import { DigitalCheckoutModal } from './DigitalCheckoutModal';
import { DigitalReceiptModal } from './DigitalReceiptModal';
import { DepositTopupModal } from './DepositTopupModal';
import { DigitalMarginModal } from './DigitalMarginModal';
import {
  Smartphone,
  Wifi,
  Zap,
  Wallet,
  Receipt,
  Gamepad2,
  Tv,
  CheckCircle2,
  TrendingUp,
  Search,
  Plus,
  ArrowRight,
  Copy,
  Check,
  Printer,
  MessageSquare,
  Sparkles,
  Layers,
  HelpCircle,
  Clock,
  ShieldCheck,
  AlertCircle,
  Tag,
  User,
  History,
  Store as StoreIcon,
  RefreshCw,
  Download,
} from 'lucide-react';

const CATEGORY_ICONS: Record<DigitalCategory, React.ComponentType<{ className?: string }>> = {
  pulsa: Smartphone,
  data: Wifi,
  pln: Zap,
  ewallet: Wallet,
  postpaid: Receipt,
  game: Gamepad2,
};

export const DigitalProductsPage: React.FC = () => {
  const {
    digitalProducts,
    digitalTransactions,
    digitalDepositBalance,
    topUpDepositBalance,
    processDigitalTransaction,
    updateDigitalProductPrice,
    settings,
    currentUser,
    customers,
    syncProductsFromDigiFlazz,
  } = useStore();

  const { toast } = useToast();

  // Active Main Tab: 'pos' (Quick Sale), 'history' (Riwayat), 'catalog' (Katalog & Margin)
  const [activeSubTab, setActiveSubTab] = useState<'pos' | 'history' | 'catalog'>('pos');

  // Quick Sale State
  const [selectedCategory, setSelectedCategory] = useState<DigitalCategory>('pulsa');
  const [targetNumber, setTargetNumber] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<DigitalProduct | null>(null);

  // Inquiry for PLN / Postpaid
  const [inquiryData, setInquiryData] = useState<DigitalInquiryData | null>(null);
  const [isInquiring, setIsInquiring] = useState<boolean>(false);
  const [inquiryError, setInquiryError] = useState<string>('');

  // Modals state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isReceiptOpen, setIsReceiptOpen] = useState<boolean>(false);
  const [selectedTxForReceipt, setSelectedTxForReceipt] = useState<DigitalTransaction | null>(null);
  const [isTopupOpen, setIsTopupOpen] = useState<boolean>(false);
  const [isMarginModalOpen, setIsMarginModalOpen] = useState<boolean>(false);
  const [productToEditMargin, setProductToEditMargin] = useState<DigitalProduct | null>(null);
  const [copiedSNId, setCopiedSNId] = useState<string | null>(null);

  // History & Catalog Search/Filters
  const [historySearch, setHistorySearch] = useState<string>('');
  const [historyCategoryFilter, setHistoryCategoryFilter] = useState<string>('all');
  const [catalogSearch, setCatalogSearch] = useState<string>('');
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<string>('all');
  const [isSyncingProducts, setIsSyncingProducts] = useState<boolean>(false);
  const [syncNotification, setSyncNotification] = useState<string | null>(null);

  const handleSyncDigiFlazzProducts = async () => {
    setIsSyncingProducts(true);
    setSyncNotification(null);
    const loadingToast = toast.loading('Sinkronisasi Produk', 'Mengunduh daftar produk aktif & harga modal dari DigiFlazz...');
    try {
      const res = await syncProductsFromDigiFlazz();
      loadingToast.dismiss();
      if (res.count > 0) {
        toast.success('Sinkronisasi Berhasil', `Berhasil menyinkronkan ${res.count} produk aktif dari server DigiFlazz!`);
      } else {
        toast.error('Sinkronisasi Gagal', res.error || 'Gagal menyinkronkan produk dari DigiFlazz.');
      }
    } catch (err: any) {
      loadingToast.dismiss();
      toast.error('Terjadi Kesalahan', err.message || 'Gagal menghubungi server DigiFlazz');
    } finally {
      setIsSyncingProducts(false);
    }
  };

  // Auto detect provider from target number when typing for pulsa/data/postpaid
  useEffect(() => {
    if (['pulsa', 'data'].includes(selectedCategory)) {
      if (targetNumber.length >= 4) {
        const detected = detectProviderFromPhone(targetNumber);
        if (detected) {
          setSelectedProvider(detected.name);
        }
      }
    }
  }, [targetNumber, selectedCategory]);

  // Reset or set defaults on category change
  const handleCategoryChange = (cat: DigitalCategory) => {
    setSelectedCategory(cat);
    setInquiryData(null);
    setInquiryError('');

    if (cat === 'pln') {
      setSelectedProvider('PLN Listrik');
    } else if (cat === 'ewallet') {
      if (!['DANA', 'GoPay', 'OVO', 'ShopeePay', 'LinkAja', 'Maxim'].includes(selectedProvider)) {
        setSelectedProvider('DANA');
      }
    } else if (cat === 'game') {
      setSelectedProvider('Mobile Legends');
    } else if (cat === 'postpaid') {
      setSelectedProvider('');
    } else {
      if (targetNumber.length >= 4) {
        const detected = detectProviderFromPhone(targetNumber);
        if (detected) setSelectedProvider(detected.name);
      }
    }
  };

  // Perform Inquiry for PLN / Postpaid
  const handlePerformInquiry = async () => {
    if (!targetNumber || targetNumber.length < 9) {
      toast.warning('Nomor Meter Belum Lengkap', 'Nomor ID Pelanggan / No. Meter PLN minimal 9-12 digit');
      setInquiryError('Nomor ID Pelanggan / No. Meter minimal 9-12 digit');
      return;
    }
    setIsInquiring(true);
    setInquiryError('');
    setInquiryData(null);

    try {
      const config = settings.ppobGateway || DEFAULT_PPOB_SETTINGS;
      const res = await inquirePLNData(config, targetNumber);
      setInquiryData(res);
      setCustomerName(res.subscriberName);
      toast.success('Data PLN Ditemukan', `${res.subscriberName} • Daya: ${res.tariffPower}`);
    } catch {
      setInquiryError('Data ID Pelanggan tidak ditemukan.');
      toast.error('Inquiry Gagal', 'Data ID Pelanggan / No. Meter tidak ditemukan.');
    } finally {
      setIsInquiring(false);
    }
  };

  // Filter products for the POS screen
  const availableProducts = useMemo(() => {
    return digitalProducts.filter((p) => {
      // Exclude prepaid token/vouchers from postpaid list
      if (selectedCategory === 'postpaid') {
        const isPrepaidVoucher = p.denomination > 0 && p.costPrice > 0 && !p.name.toLowerCase().includes('tagihan') && !p.name.toLowerCase().includes('pascabayar') && !p.name.toLowerCase().includes('speedy') && !p.name.toLowerCase().includes('indihome') && !p.name.toLowerCase().includes('bpjs') && !p.name.toLowerCase().includes('pdam');
        if (isPrepaidVoucher || p.name.toLowerCase().includes('pertagas')) return false;
      }
      if (p.category !== selectedCategory) return false;
      if (selectedCategory === 'postpaid' && !selectedProvider) {
        return true;
      }
      if (selectedProvider) {
        const provA = (p.provider || '').toLowerCase().trim();
        const provB = (selectedProvider || '').toLowerCase().trim();
        if (provA !== provB && !provA.includes(provB) && !provB.includes(provA)) {
          return false;
        }
      }
      return true;
    });
  }, [digitalProducts, selectedCategory, selectedProvider]);

  // List of unique providers for current category
  const categoryProviders = useMemo(() => {
    const set = new Set<string>();
    const cellularProviders = ['Telkomsel', 'Indosat Ooredoo', 'XL Axiata', 'Axis', 'Tri (3)', 'Smartfren'];
    const ewalletProviders = ['DANA', 'GoPay', 'OVO', 'ShopeePay', 'LinkAja', 'Maxim'];

    digitalProducts
      .filter((p) => {
        if (p.category !== selectedCategory) return false;
        if (selectedCategory === 'game') {
          if (cellularProviders.includes(p.provider) || ewalletProviders.includes(p.provider)) return false;
        }
        if (selectedCategory === 'ewallet') {
          if (cellularProviders.includes(p.provider)) return false;
        }
        if (selectedCategory === 'pulsa' || selectedCategory === 'data') {
          if (ewalletProviders.includes(p.provider)) return false;
        }
        return true;
      })
      .forEach((p) => set.add(p.provider));
    return Array.from(set);
  }, [digitalProducts, selectedCategory]);

  // Daily statistics calculation
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTxs = digitalTransactions.filter(
      (tx) => tx.createdAt.startsWith(todayStr) && tx.status === 'success'
    );
    const totalRevenue = todayTxs.reduce((sum, tx) => sum + tx.totalPaid, 0);
    const totalProfit = todayTxs.reduce((sum, tx) => sum + tx.profit, 0);
    const count = todayTxs.length;
    return { count, totalRevenue, totalProfit };
  }, [digitalTransactions]);

  // Handle open checkout
  const handleSelectProduct = (product: DigitalProduct) => {
    if (!targetNumber || targetNumber.length < 4) {
      toast.warning(
        'Nomor Tujuan Diperlukan',
        'Silakan masukkan nomor handphone / ID Pelanggan terlebih dahulu sebelum memilih produk.'
      );
      return;
    }
    setSelectedProduct(product);
    setIsCheckoutOpen(true);
  };

  const handleCopyHistorySN = (sn: string, id: string) => {
    navigator.clipboard.writeText(sn);
    setCopiedSNId(id);
    setTimeout(() => setCopiedSNId(null), 2000);
  };

  const handleOpenReceiptFromHistory = (tx: DigitalTransaction) => {
    setSelectedTxForReceipt(tx);
    setIsReceiptOpen(true);
  };

  // Filtered History
  const filteredHistory = useMemo(() => {
    return digitalTransactions.filter((tx) => {
      const matchCat = historyCategoryFilter === 'all' || tx.category === historyCategoryFilter;
      const q = historySearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        tx.invoiceNumber.toLowerCase().includes(q) ||
        tx.targetNumber.toLowerCase().includes(q) ||
        (tx.serialNumber && tx.serialNumber.toLowerCase().includes(q)) ||
        (tx.customerName && tx.customerName.toLowerCase().includes(q)) ||
        tx.productName.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [digitalTransactions, historyCategoryFilter, historySearch]);

  // Filtered Catalog
  const filteredCatalog = useMemo(() => {
    return digitalProducts.filter((p) => {
      const matchCat = catalogCategoryFilter === 'all' || p.category === catalogCategoryFilter;
      const q = catalogSearch.toLowerCase().trim();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.provider.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [digitalProducts, catalogCategoryFilter, catalogSearch]);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-100 dark:bg-slate-950 pb-16">
      {/* Top Header Bar */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-4 sticky top-0 z-10 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Title & Badge */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#00A876] text-white flex items-center justify-center shadow-lg shadow-[#00A876]/25">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase">
                  Produk Digital & PPOB
                </h1>
                <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-[#00A876]">
                  Real-Time Switcher
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Isi Pulsa, Paket Data, Token PLN Listrik, Top Up E-Wallet, dan Pembayaran Tagihan
              </p>
            </div>
          </div>

          {/* Deposit Balance & Today's Profit Stats */}
          <div className="flex items-center flex-wrap gap-2.5">
            {/* PPOB Mode Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs">
              <Zap className="w-3.5 h-3.5 text-[#00A876]" />
              <span className="font-bold text-slate-700 dark:text-slate-200">
                Mode: {settings.ppobGateway?.mode === 'manual' ? '📝 Input Manual' : '⚡ Auto-API (DigiFlazz)'}
              </span>
            </div>

            {/* Live Deposit Balance Card */}
            <div className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shadow-xs">
              <div className="w-7 h-7 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-[#00A876]">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block leading-tight">
                  Saldo Modal Server
                </span>
                <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100">
                  {formatRupiah(digitalDepositBalance)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsTopupOpen(true)}
                className="ml-1 px-2.5 py-1 rounded-xl bg-[#00A876] hover:bg-[#009267] text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Isi Saldo</span>
              </button>
            </div>

            {/* Daily Profit Summary Pill */}
            <div className="hidden lg:flex items-center gap-3 px-3.5 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-900/50 text-xs">
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
                <TrendingUp className="w-4 h-4 text-[#00A876]" />
                <span>Untung Hari Ini:</span>
                <span className="font-black">{formatRupiah(stats.totalProfit)}</span>
              </div>
              <span className="text-emerald-300 dark:text-emerald-800">|</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                {stats.count} Transaksi
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveSubTab('pos')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeSubTab === 'pos'
                ? 'bg-[#00A876] text-white shadow-sm shadow-[#00A876]/25'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Beli & Transaksi Cepat</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('history')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeSubTab === 'history'
                ? 'bg-[#00A876] text-white shadow-sm shadow-[#00A876]/25'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat & Cek SN / Token ({digitalTransactions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('catalog')}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition cursor-pointer shrink-0 ${
              activeSubTab === 'catalog'
                ? 'bg-[#00A876] text-white shadow-sm shadow-[#00A876]/25'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Katalog & Atur Margin Harga</span>
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1">
        {/* VIEW 1: TRANSAKSI CEPAT (POS) */}
        {activeSubTab === 'pos' && (
          <div className="space-y-6">
            {/* Category Selector Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              {DIGITAL_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                const Icon = CATEGORY_ICONS[cat.id] || Smartphone;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryChange(cat.id)}
                    className={`p-3.5 rounded-2xl flex flex-col items-center justify-center gap-2 text-center transition cursor-pointer border ${
                      isSelected
                        ? 'bg-white dark:bg-slate-900 border-[#00A876] shadow-md shadow-[#00A876]/10 ring-2 ring-[#00A876]'
                        : 'bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition ${
                        isSelected
                          ? 'bg-[#00A876] text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-black text-slate-900 dark:text-slate-100 block">
                        {cat.label}
                      </span>
                      <span className="text-[10px] text-slate-400 line-clamp-1">
                        {cat.description}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Smart Input & Operator Section */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00A876] animate-pulse" />
                  <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-slate-100">
                    Input Nomor Tujuan & Operator
                  </h3>
                </div>

                {/* Detected Operator Pill */}
                {selectedProvider && (
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-900/60 text-xs">
                    <span className="text-slate-400 font-medium">Operator Terdeteksi:</span>
                    <span className="font-black text-[#00A876] uppercase tracking-wide">
                      {selectedProvider}
                    </span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                {/* Target Number Input */}
                <div className="md:col-span-6 space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    {selectedCategory === 'pln'
                      ? 'No. Meter / ID Pelanggan PLN (11-12 Digit)'
                      : selectedCategory === 'ewallet'
                      ? 'No. HP Akun E-Wallet (DANA/GoPay/OVO)'
                      : selectedCategory === 'game'
                      ? 'User ID & Server ID Game'
                      : selectedCategory === 'postpaid'
                      ? 'ID Pelanggan / No. Kontrak / No. Rekening'
                      : 'Nomor HP Pelanggan (08xx)'}
                  </label>
                  <div className="relative">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      {selectedCategory === 'pln' ? (
                        <Zap className="w-5 h-5 text-amber-500" />
                      ) : selectedCategory === 'ewallet' ? (
                        <Wallet className="w-5 h-5 text-blue-500" />
                      ) : selectedCategory === 'postpaid' ? (
                        <Receipt className="w-5 h-5 text-indigo-500" />
                      ) : (
                        <Smartphone className="w-5 h-5 text-[#00A876]" />
                      )}
                    </div>
                    <input
                      type="text"
                      value={targetNumber}
                      onChange={(e) => setTargetNumber(e.target.value.replace(/\s+/g, ''))}
                      placeholder={
                        selectedCategory === 'pln'
                          ? 'Contoh: 14283920192'
                          : selectedCategory === 'postpaid'
                          ? 'Contoh: 530000000001 (No. Rekening / Tagihan)'
                          : 'Contoh: 081234567890'
                      }
                      className="w-full pl-11 pr-24 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-base font-bold tracking-wide focus:outline-hidden focus:ring-2 focus:ring-[#00A876]"
                    />
                    {/* Clear button */}
                    {targetNumber && (
                      <button
                        type="button"
                        onClick={() => {
                          setTargetNumber('');
                          setInquiryData(null);
                        }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-2 py-1 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                </div>

                {/* Customer Name or Quick Contact Picker */}
                <div className="md:col-span-3 space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Nama Pembeli (Opsional)
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Nama pelanggan..."
                      className="w-full pl-10 pr-3 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#00A876]"
                    />
                  </div>
                </div>

                {/* Action for PLN / Postpaid Inquiry */}
                {selectedCategory === 'pln' || selectedCategory === 'postpaid' ? (
                  <div className="md:col-span-3">
                    <button
                      type="button"
                      onClick={handlePerformInquiry}
                      disabled={isInquiring || !targetNumber}
                      className="w-full py-3 px-4 rounded-2xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-black shadow-md shadow-amber-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Search className="w-4 h-4" />
                      <span>
                        {isInquiring
                          ? 'Mengecek...'
                          : selectedCategory === 'pln'
                          ? 'Cek Nama & Daya PLN'
                          : 'Cek Tagihan Pelanggan'}
                      </span>
                    </button>
                  </div>
                ) : (
                  /* Provider Switcher Dropdown / Pills */
                  <div className="md:col-span-3 space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                      {selectedCategory === 'game'
                        ? 'Pilih Game / Publisher'
                        : selectedCategory === 'ewallet'
                        ? 'Pilih Dompet Digital'
                        : selectedCategory === 'postpaid'
                        ? 'Pilih Layanan Tagihan'
                        : 'Pilih Operator Manual'}
                    </label>
                    <select
                      value={selectedProvider}
                      onChange={(e) => setSelectedProvider(e.target.value)}
                      className="w-full px-3 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-[#00A876]"
                    >
                      <option value="">
                        {selectedCategory === 'game'
                          ? 'Semua Game'
                          : selectedCategory === 'ewallet'
                          ? 'Semua E-Wallet'
                          : selectedCategory === 'postpaid'
                          ? 'Semua Layanan'
                          : 'Semua Operator'}
                      </option>
                      {categoryProviders.map((prov) => (
                        <option key={prov} value={prov}>
                          {prov}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* PLN / POSTPAID INQUIRY RESULT BOX */}
              {inquiryData && (
                <div className="mt-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-xs font-black uppercase text-amber-800 dark:text-amber-300">
                        Hasil Inquiry PLN Valid
                      </span>
                    </div>
                    <p className="text-sm font-black text-slate-900 dark:text-slate-100">
                      {inquiryData.subscriberName}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
                      <span>ID: {inquiryData.subscriberId}</span>
                      <span>•</span>
                      <span>Daya: {inquiryData.tariffPower}</span>
                      {inquiryData.kwhEstimate && (
                        <>
                          <span>•</span>
                          <span>Estimasi: {inquiryData.kwhEstimate}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-[#00A876] text-xs font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Meter Aktif
                    </span>
                  </div>
                </div>
              )}

              {inquiryError && (
                <div className="mt-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{inquiryError}</span>
                </div>
              )}
            </div>

            {/* Product Denomination Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  Pilih Nominal Produk ({availableProducts.length} Pilihan)
                </h3>
                {selectedProvider && (
                  <span className="text-xs text-slate-500">
                    Menampilkan produk <strong className="text-slate-800 dark:text-slate-200">{selectedProvider}</strong>
                  </span>
                )}
              </div>

              {availableProducts.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <HelpCircle className="w-10 h-10 mx-auto text-slate-400" />
                  <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    Tidak Ada Produk Ditemukan
                  </h4>
                  <p className="text-xs text-slate-500">
                    Silakan pilih operator lain atau periksa input nomor tujuan.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
                  {availableProducts.map((prod) => {
                    const profit = Math.max(0, prod.sellingPrice - prod.costPrice);
                    return (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => handleSelectProduct(prod)}
                        className="group p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 hover:border-[#00A876] dark:hover:border-[#00A876] shadow-xs hover:shadow-md hover:shadow-[#00A876]/10 transition cursor-pointer text-left flex flex-col justify-between relative overflow-hidden"
                      >
                        {/* Top Meta */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                              {prod.provider}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-lg">
                              Untung +{formatRupiah(profit)}
                            </span>
                          </div>

                          <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-[#00A876] transition line-clamp-1">
                            {prod.name}
                          </h4>
                          {prod.description && (
                            <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">
                              {prod.description}
                            </p>
                          )}
                        </div>

                        {/* Bottom Price Bar */}
                        <div className="pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-end justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase font-bold block">
                              Modal: {formatRupiah(prod.costPrice)}
                            </span>
                            <span className="text-base font-black text-slate-900 dark:text-slate-100">
                              {formatRupiah(prod.sellingPrice)}
                            </span>
                          </div>

                          <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 group-hover:bg-[#00A876] group-hover:text-white text-slate-600 dark:text-slate-300 flex items-center justify-center transition shadow-xs">
                            <ArrowRight className="w-4 h-4" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: RIWAYAT & CEK SN */}
        {activeSubTab === 'history' && (
          <div className="space-y-5">
            {/* Filter Bar */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="relative w-full md:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  placeholder="Cari nomor, invoice, nama, SN..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-[#00A876]"
                />
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setHistoryCategoryFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    historyCategoryFilter === 'all'
                      ? 'bg-[#00A876] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  Semua
                </button>
                {DIGITAL_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setHistoryCategoryFilter(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                      historyCategoryFilter === cat.id
                        ? 'bg-[#00A876] text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Transaction Cards List */}
            {filteredHistory.length === 0 ? (
              <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-2">
                <History className="w-10 h-10 mx-auto text-slate-400" />
                <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  Belum Ada Riwayat Transaksi
                </h4>
                <p className="text-xs text-slate-500">
                  Transaksi digital yang berhasil akan tercatat secara otomatis di sini.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredHistory.map((tx) => (
                  <div
                    key={tx.id}
                    className="p-4 sm:p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Left: Product & Meta */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-[#00A876] text-[10px] font-black uppercase tracking-wide">
                          {tx.category.toUpperCase()} • {tx.provider}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {tx.processingMode === 'auto_api' ? '⚡ API' : '📝 Manual'}
                        </span>
                        <span className="text-xs font-mono font-bold text-slate-400">
                          {tx.invoiceNumber}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(tx.createdAt).toLocaleString('id-ID')}
                        </span>
                      </div>

                      <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
                        {tx.productName}
                      </h4>

                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                        <span>
                          Tujuan: <strong className="text-slate-900 dark:text-white font-mono">{tx.targetNumber}</strong>
                        </span>
                        {tx.customerName && (
                          <>
                            <span>•</span>
                            <span>Nama: {tx.customerName}</span>
                          </>
                        )}
                        <span>•</span>
                        <span>Kasir: {tx.cashierName}</span>
                      </div>

                      {/* Prominent Monospace SN / Token Display */}
                      <div className="mt-2 inline-flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                        <span className="text-[10px] font-bold uppercase text-slate-400">
                          {tx.category === 'pln' ? 'Token PLN:' : 'SN:'}
                        </span>
                        <span className="font-mono font-black text-xs sm:text-sm text-[#00A876] select-all">
                          {tx.serialNumber || '-'}
                        </span>
                        {tx.serialNumber && (
                          <button
                            type="button"
                            onClick={() => handleCopyHistorySN(tx.serialNumber!, tx.id)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                            title="Salin SN"
                          >
                            {copiedSNId === tx.id ? (
                              <Check className="w-3.5 h-3.5 text-[#00A876]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Right: Payment & Action Buttons */}
                    <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800">
                      <div className="text-right">
                        <span className="text-base font-black text-slate-900 dark:text-slate-100 block">
                          {formatRupiah(tx.totalPaid)}
                        </span>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          Untung: +{formatRupiah(tx.profit)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenReceiptFromHistory(tx)}
                          className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5 text-[#00A876]" />
                          <span>Struk</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 3: KATALOG & ATUR MARGIN */}
        {activeSubTab === 'catalog' && (
          <div className="space-y-5">
            {syncNotification && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center justify-between animate-fade-in shadow-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{syncNotification}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSyncNotification(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold px-2 py-0.5 rounded-lg"
                >
                  Tutup
                </button>
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => setCatalogSearch(e.target.value)}
                    placeholder="Cari produk digital atau kode SKU..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-[#00A876]"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSyncDigiFlazzProducts}
                  disabled={isSyncingProducts}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-md shadow-emerald-500/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingProducts ? 'animate-spin' : ''}`} />
                  <span>{isSyncingProducts ? 'Menarik Produk...' : 'Tarik Produk dari DigiFlazz'}</span>
                </button>
              </div>

              {/* Category Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto no-scrollbar">
                <button
                  type="button"
                  onClick={() => setCatalogCategoryFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                    catalogCategoryFilter === 'all'
                      ? 'bg-[#00A876] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Semua ({digitalProducts.length})
                </button>
                {DIGITAL_CATEGORIES.map((cat) => {
                  const count = digitalProducts.filter((p) => p.category === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setCatalogCategoryFilter(cat.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                        catalogCategoryFilter === cat.id
                          ? 'bg-[#00A876] text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {cat.label} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Catalog Table */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-black tracking-wider">
                    <tr>
                      <th className="px-5 py-3.5">Produk</th>
                      <th className="px-4 py-3.5">Kategori</th>
                      <th className="px-4 py-3.5">Provider</th>
                      <th className="px-4 py-3.5">Harga Modal (HPP)</th>
                      <th className="px-4 py-3.5">Harga Jual Toko</th>
                      <th className="px-4 py-3.5">Keuntungan / Margin</th>
                      <th className="px-4 py-3.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredCatalog.map((prod) => {
                      const margin = Math.max(0, prod.sellingPrice - prod.costPrice);
                      const marginPct = prod.costPrice > 0 ? ((margin / prod.costPrice) * 100).toFixed(1) : '0';
                      return (
                        <tr
                          key={prod.id}
                          className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                        >
                          <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-slate-100">
                            <div>{prod.name}</div>
                            <span className="text-[10px] text-slate-400 font-mono">{prod.id}</span>
                          </td>
                          <td className="px-4 py-3.5 uppercase font-bold text-slate-500">
                            {prod.category}
                          </td>
                          <td className="px-4 py-3.5 font-bold text-slate-700 dark:text-slate-300">
                            {prod.provider}
                          </td>
                          <td className="px-4 py-3.5 font-mono text-slate-600 dark:text-slate-400">
                            {formatRupiah(prod.costPrice)}
                          </td>
                          <td className="px-4 py-3.5 font-mono font-bold text-slate-900 dark:text-slate-100">
                            {formatRupiah(prod.sellingPrice)}
                          </td>
                          <td className="px-4 py-3.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                            +{formatRupiah(margin)} ({marginPct}%)
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <button
                              type="button"
                              onClick={() => {
                                setProductToEditMargin(prod);
                                setIsMarginModalOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-[#00A876] hover:text-white text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
                            >
                              Ubah Harga
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODALS */}
      <DigitalCheckoutModal
        product={selectedProduct}
        targetNumber={targetNumber}
        customerName={customerName}
        inquiryData={inquiryData || undefined}
        settings={settings}
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onConfirmPayment={processDigitalTransaction}
        onOpenReceipt={(tx) => {
          setSelectedTxForReceipt(tx);
          setIsReceiptOpen(true);
        }}
      />

      <DigitalReceiptModal
        transaction={selectedTxForReceipt}
        settings={settings}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
      />

      <DepositTopupModal
        currentBalance={digitalDepositBalance}
        isOpen={isTopupOpen}
        onClose={() => setIsTopupOpen(false)}
        onTopUp={topUpDepositBalance}
      />

      <DigitalMarginModal
        product={productToEditMargin}
        isOpen={isMarginModalOpen}
        onClose={() => setIsMarginModalOpen(false)}
        onUpdatePrice={updateDigitalProductPrice}
      />
    </div>
  );
};

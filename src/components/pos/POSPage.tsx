import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { Product, Sale, CartItem } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { CheckoutModal } from './CheckoutModal';
import { ReceiptModal } from '../receipt/ReceiptModal';
import { StoreModal } from '../common/StoreModal';
import { BarcodeScannerModal } from '../common/BarcodeScannerModal';
import { DigitalPriceTagModal } from './DigitalPriceTagModal';
import { OpenShiftModal } from '../cash/OpenShiftModal';
import { AddExpenseModal } from '../cash/AddExpenseModal';
import { PaymentSuccessBanner } from './PaymentSuccessBanner';
import { playScanBeep } from '../../utils/soundNotifications';
import {
  Search,
  Barcode,
  Camera,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Check,
  AlertTriangle,
  PackageX,
  ShoppingBag,
  CreditCard,
  Banknote,
  Building2,
  ChevronDown,
  Sparkles,
  X,
  Tag,
  ArrowUpDown,
  Filter,
  Flame,
  Coins,
  TrendingDown,
  Wallet,
  Zap,
  Lock,
  BookmarkCheck,
  Clock,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';

interface SavedTransaction {
  id: string;
  timestamp: string;
  timeLabel: string;
  items: CartItem[];
  totalUnits: number;
  subtotal: number;
  note?: string;
}

const SAVED_TX_KEY = 'pos_saved_transactions_v2';

export const POSPage: React.FC = () => {
  const {
    products,
    categories,
    cart,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
    loadCart,
    cartTotals,
    settings,
    activeStore,
    stores,
    activeStoreId,
    setActiveStoreId,
    currentShift,
    getDailyCashSummary,
    setActiveTab,
  } = useStore();

  const { toast, confirm: confirmModal } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [quickTagFilter, setQuickTagFilter] = useState<'all' | 'promo' | 'low_stock' | 'ready'>('all');
  const [sortBy, setSortBy] = useState<'default' | 'price_asc' | 'price_desc' | 'stock_desc'>('default');
  const [isDigitalPriceTagOpen, setIsDigitalPriceTagOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isSavedTransactionsOpen, setIsSavedTransactionsOpen] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<{ message: string; type: 'success' | 'error' | 'warning' } | null>(null);

  // Saved / Held transactions state
  const [savedTransactions, setSavedTransactions] = useState<SavedTransaction[]>(() => {
    try {
      const stored = localStorage.getItem(SAVED_TX_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const saveTransactionsToStorage = (list: SavedTransaction[]) => {
    setSavedTransactions(list);
    try {
      localStorage.setItem(SAVED_TX_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  };

  const handleHoldCurrentTransaction = () => {
    if (cart.length === 0) {
      setScanFeedback({
        message: 'Keranjang belanja masih kosong untuk disimpan',
        type: 'warning',
      });
      setTimeout(() => setScanFeedback(null), 2500);
      return;
    }

    const now = new Date();
    const timeLabel = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    const newSaved: SavedTransaction = {
      id: `hold-${Date.now()}`,
      timestamp: now.toISOString(),
      timeLabel,
      items: [...cart],
      totalUnits: cartTotals.totalUnits,
      subtotal: cartTotals.subtotal,
      note: `Antrean #${savedTransactions.length + 1} (${timeLabel})`,
    };

    const updated = [newSaved, ...savedTransactions];
    saveTransactionsToStorage(updated);
    clearCart();

    playScanBeep(settings.audioNotification?.volume || 80);
    setScanFeedback({
      message: `Transaksi (${newSaved.totalUnits} unit) berhasil disimpan ke antrean`,
      type: 'success',
    });
    setTimeout(() => setScanFeedback(null), 3000);
  };

  const handleRestoreTransaction = async (tx: SavedTransaction) => {
    if (cart.length > 0) {
      const confirmReplace = await confirmModal({
        title: 'Ganti Pesanan Aktif?',
        message: 'Keranjang kasir saat ini berisi item. Apakah Anda ingin menimpa keranjang dengan transaksi tersimpan ini?',
        confirmText: 'Ya, Muat Transaksi',
        type: 'warning',
      });
      if (!confirmReplace) return;
    }

    loadCart(tx.items);
    const updated = savedTransactions.filter((s) => s.id !== tx.id);
    saveTransactionsToStorage(updated);
    setIsSavedTransactionsOpen(false);

    toast.success('Transaksi Dimuat', `Transaksi (${tx.totalUnits} unit) berhasil dimuat kembali ke keranjang.`);
  };

  const handleDeleteSavedTransaction = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const confirmed = await confirmModal({
      title: 'Hapus Antrean Pesanan?',
      message: 'Transaksi tersimpan ini akan dihapus permanen dari antrean.',
      confirmText: 'Ya, Hapus',
      type: 'danger',
    });
    if (confirmed) {
      const updated = savedTransactions.filter((s) => s.id !== id);
      saveTransactionsToStorage(updated);
      toast.info('Antrean Dihapus', 'Transaksi tersimpan telah dihapus.');
    }
  };

  const handleClearCart = async () => {
    if (cart.length === 0) return;
    const confirmed = await confirmModal({
      title: 'Kosongkan Keranjang?',
      message: 'Apakah Anda yakin ingin menghapus seluruh pesanan yang ada di keranjang belanja?',
      confirmText: 'Ya, Kosongkan',
      type: 'danger',
    });
    if (confirmed) {
      clearCart();
      toast.info('Keranjang Dikosongkan', 'Seluruh item belanja kasir telah direset.');
    }
  };

  const todaySummary = useMemo(() => {
    return getDailyCashSummary();
  }, [getDailyCashSummary]);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filtered Products for the active store branch
  const branchProducts = useMemo(() => {
    return products.filter((p) => p.storeId === activeStoreId);
  }, [products, activeStoreId]);

  const filteredProducts = useMemo(() => {
    return branchProducts
      .filter((p) => {
        // Category Filter
        const matchCategory =
          selectedCategoryId === 'all' || p.categoryId === selectedCategoryId;

        // Quick Tag Filter
        let matchTag = true;
        if (quickTagFilter === 'promo') {
          matchTag = p.price > 50000;
        } else if (quickTagFilter === 'low_stock') {
          matchTag = p.stock > 0 && p.stock <= (p.minStockAlert || 10);
        } else if (quickTagFilter === 'ready') {
          matchTag = p.stock > 0;
        }

        // Search text query
        const query = searchQuery.toLowerCase().trim();
        const matchSearch =
          !query ||
          p.name.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query);

        return matchCategory && matchTag && matchSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.price - b.price;
        if (sortBy === 'price_desc') return b.price - a.price;
        if (sortBy === 'stock_desc') return b.stock - a.stock;
        return 0;
      });
  }, [branchProducts, selectedCategoryId, quickTagFilter, searchQuery, sortBy]);

  // Handle scanned barcode from camera modal or physical scanner
  const handleBarcodeScanned = (barcode: string) => {
    const cleanCode = barcode.trim().toLowerCase();
    if (!cleanCode) return;

    const matchedProduct = branchProducts.find(
      (p) =>
        p.sku.toLowerCase() === cleanCode ||
        p.name.toLowerCase() === cleanCode
    );

    if (matchedProduct) {
      if (matchedProduct.stock > 0) {
        const success = addToCart(matchedProduct);
        if (success) {
          playScanBeep(settings.audioNotification?.volume || 80);
          setScanFeedback({
            message: `+ ${matchedProduct.name} ditambahkan ke keranjang`,
            type: 'success',
          });
        } else {
          setScanFeedback({
            message: `Stok tidak mencukupi untuk ${matchedProduct.name}`,
            type: 'warning',
          });
        }
      } else {
        setScanFeedback({
          message: `Stok habis untuk ${matchedProduct.name}`,
          type: 'error',
        });
      }
    } else {
      setScanFeedback({
        message: `Produk dengan barcode/SKU "${barcode}" tidak ditemukan di cabang ini`,
        type: 'warning',
      });
    }

    setTimeout(() => setScanFeedback(null), 3000);
  };

  // Barcode / SKU quick scan handler (Enter key on search input)
  const handleKeyDownSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const query = searchQuery.trim();
      if (!query) return;
      handleBarcodeScanned(query);
      setSearchQuery('');
    }
  };

  const handleCheckoutSuccess = (sale: Sale) => {
    setIsCheckoutOpen(false);
    setIsMobileCartOpen(false);
    setCompletedSale(sale);
    setIsReceiptOpen(true);
  };

  const estimatedTax = settings.enableTax
    ? Math.round(cartTotals.subtotal * (settings.taxRate / 100))
    : 0;
  const estimatedTotal = cartTotals.subtotal + estimatedTax;

  return (
    <div id="pos-page" className="h-full flex flex-col p-2.5 sm:p-4 overflow-hidden relative">
      {/* Toast Feedback */}
      {scanFeedback && (
        <div
          className={`fixed bottom-16 sm:bottom-12 right-4 sm:right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl border flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-5 ${
            scanFeedback.type === 'success'
              ? 'bg-slate-900 text-white border-emerald-500/40'
              : scanFeedback.type === 'error'
              ? 'bg-rose-900 text-white border-rose-500'
              : 'bg-amber-900 text-amber-100 border-amber-500'
          }`}
        >
          {scanFeedback.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span>{scanFeedback.message}</span>
        </div>
      )}

      {/* Store Branch & Cash Drawer Status Top Bar */}
      <div className="bg-slate-900 text-white px-3 sm:px-4 py-2 rounded-2xl mb-2 sm:mb-3 flex items-center justify-between shadow-xs shrink-0 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Building2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <select
            value={activeStoreId}
            onChange={(e) => setActiveStoreId(e.target.value)}
            className="bg-slate-800 text-white text-xs px-2.5 py-1.5 rounded-xl border border-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer max-w-[170px] sm:max-w-xs truncate"
          >
            {stores.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
        </div>

        {/* Task Bar: Saved Transactions, Cash Status, Expenses */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Saved / Held Transactions Trigger */}
          <button
            type="button"
            id="btn-saved-transactions"
            onClick={() => setIsSavedTransactionsOpen(true)}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition active:scale-95 cursor-pointer shadow-xs border ${
              savedTransactions.length > 0
                ? 'bg-indigo-600 border-indigo-500 text-white animate-pulse'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title="Daftar Transaksi Tersimpan / Diparkir"
          >
            <BookmarkCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tersimpan</span>
            {savedTransactions.length > 0 && (
              <span className="bg-white text-indigo-900 px-1.5 py-0.2 rounded-full font-black text-[10px]">
                {savedTransactions.length}
              </span>
            )}
          </button>

          <div className="hidden md:flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700 text-xs">
            <Coins className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-slate-400 text-[11px]">Modal:</span>
            <span className="font-mono font-bold text-amber-300">
              {formatRupiah(todaySummary.openingFloat)}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700 text-xs">
            <Wallet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="text-slate-400 text-[11px]">Kas Laci:</span>
            <span className="font-mono font-bold text-emerald-300">
              {formatRupiah(todaySummary.expectedCashInDrawer)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsAddExpenseModalOpen(true)}
            className="px-2.5 py-1.5 bg-rose-600/90 hover:bg-rose-600 text-white text-[11px] sm:text-xs font-bold rounded-xl flex items-center gap-1 transition active:scale-95 cursor-pointer shadow-xs"
            title="Catat Kas Keluar"
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Kas Keluar</span>
          </button>

          <button
            type="button"
            onClick={() => setIsOpenShiftModalOpen(true)}
            className="px-2.5 py-1.5 bg-emerald-600/90 hover:bg-emerald-600 text-white text-[11px] sm:text-xs font-bold rounded-xl flex items-center gap-1 transition active:scale-95 cursor-pointer shadow-xs"
            title="Atur Modal Awal Kasir"
          >
            <Coins className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Modal Kas</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout: Catalog & Cart Sidebar */}
      <div className="flex-1 flex flex-col lg:flex-row gap-2.5 sm:gap-4 overflow-hidden min-h-0">
        {/* Left Section: Catalog (Search, Categories, Product Grid) */}
        <section className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white sm:bg-slate-50/70 rounded-2xl sm:rounded-3xl border border-slate-200/80 p-2.5 sm:p-4">
          {/* Top Search & Scanner Action Bar */}
          <div className="space-y-2 shrink-0 pb-1.5">
            <div className="flex items-center gap-2">
              {/* Search Input */}
              <div className="relative flex-1 flex items-center min-w-0">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  id="pos-search-product-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDownSearch}
                  placeholder="Cari nama produk, SKU, barcode..."
                  className="w-full pl-9 pr-8 py-2 sm:py-2.5 bg-slate-50 sm:bg-white border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00A876] focus:bg-white transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Digital Price Tag Button */}
              <button
                type="button"
                id="open-digital-price-tag-btn"
                onClick={() => setIsDigitalPriceTagOpen(true)}
                className="p-2 sm:px-3 sm:py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1.5 shrink-0 transition active:scale-95 cursor-pointer"
                title="Buka Layar Tag Harga Digital Pelanggan"
              >
                <Tag className="w-4 h-4 text-amber-600" />
                <span className="hidden sm:inline">Tag Harga</span>
              </button>

              {/* Barcode Camera Scanner Button */}
              <button
                type="button"
                id="pos-open-camera-scanner-btn"
                onClick={() => setIsBarcodeScannerOpen(true)}
                className="p-2 sm:px-3 sm:py-2.5 rounded-xl bg-[#00A876] hover:bg-[#009267] text-white text-xs font-bold flex items-center gap-1.5 shrink-0 transition active:scale-95 shadow-md shadow-[#00A876]/25 cursor-pointer"
                title="Scan Barcode Kamera"
              >
                <Camera className="w-4 h-4" />
                <span className="hidden sm:inline">Scan</span>
              </button>

              {/* Quick Sort Dropdown */}
              <div className="hidden sm:flex items-center gap-1 bg-white px-2 py-2 rounded-xl border border-slate-200 text-xs shrink-0">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-slate-700 text-xs font-medium focus:outline-none cursor-pointer"
                >
                  <option value="default">Urutan Standar</option>
                  <option value="price_asc">Harga Terendah</option>
                  <option value="price_desc">Harga Tertinggi</option>
                  <option value="stock_desc">Stok Terbanyak</option>
                </select>
              </div>
            </div>

            {/* Category Chips Bar with Horizontal Scroll */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-0.5 scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTab('digital-products')}
                className="px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/25 animate-pulse"
                title="Buka Penjualan Pulsa, Paket Data, Token PLN & PPOB"
              >
                <Zap className="w-3.5 h-3.5 fill-white" />
                <span>⚡ Pulsa & PPOB</span>
              </button>

              <button
                id="filter-category-all"
                onClick={() => setSelectedCategoryId('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  selectedCategoryId === 'all'
                    ? 'bg-[#00A876] text-white shadow-md shadow-[#00A876]/25'
                    : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-100'
                }`}
              >
                <span>Semua</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                    selectedCategoryId === 'all'
                      ? 'bg-white/25 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {branchProducts.length}
                </span>
              </button>

              {categories.map((cat) => {
                const count = branchProducts.filter((p) => p.categoryId === cat.id).length;
                const isSelected = selectedCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    id={`filter-category-${cat.id}`}
                    onClick={() => setSelectedCategoryId(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      isSelected
                        ? 'bg-[#00A876] text-white shadow-md shadow-[#00A876]/25'
                        : 'bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-100'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: isSelected ? '#ffffff' : (cat.color || '#00A876') }}
                    />
                    <span>{cat.name}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isSelected
                          ? 'bg-white/25 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Status Tag Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none text-[11px]">
              <button
                type="button"
                onClick={() => setQuickTagFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer shrink-0 ${
                  quickTagFilter === 'all'
                    ? 'bg-slate-800 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua Status
              </button>
              <button
                type="button"
                onClick={() => setQuickTagFilter('ready')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer flex items-center gap-1 shrink-0 ${
                  quickTagFilter === 'ready'
                    ? 'bg-[#00A876] text-white font-bold'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>Ready ({branchProducts.filter((p) => p.stock > 0).length})</span>
              </button>
              <button
                type="button"
                onClick={() => setQuickTagFilter('low_stock')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer flex items-center gap-1 shrink-0 ${
                  quickTagFilter === 'low_stock'
                    ? 'bg-rose-600 text-white font-bold'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                <span>Menipis ({branchProducts.filter((p) => p.stock > 0 && p.stock <= (p.minStockAlert || 10)).length})</span>
              </button>
              <button
                type="button"
                onClick={() => setQuickTagFilter('promo')}
                className={`px-2.5 py-1 rounded-lg font-medium transition cursor-pointer flex items-center gap-1 shrink-0 ${
                  quickTagFilter === 'promo'
                    ? 'bg-amber-500 text-white font-bold'
                    : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60'
                }`}
              >
                <Flame className="w-3 h-3 text-amber-500" />
                <span>Unggulan</span>
              </button>
            </div>
          </div>

          {/* Product Grid Area (Scrollable) */}
          <div className="flex-1 overflow-y-auto pr-1">
            {filteredProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3 bg-white rounded-2xl border border-slate-200">
                <PackageX className="w-12 h-12 text-slate-300 mx-auto" />
                <h4 className="font-bold text-slate-700 text-sm">Produk Tidak Ditemukan</h4>
                <p className="text-xs text-slate-400 max-w-sm">
                  {searchQuery
                    ? `Tidak ada produk yang cocok dengan kata kunci "${searchQuery}" di cabang ${activeStore?.name}.`
                    : `Belum ada produk terdaftar untuk cabang ${activeStore?.name}. Buka menu Inventaris untuk menambah produk.`}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
                  >
                    Hapus Pencarian
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
                {filteredProducts.map((product) => {
                  const cartItem = cart.find((item) => item.product.id === product.id);
                  const isOutOfStock = product.stock <= 0;
                  const isLowStock =
                    product.stock > 0 && product.stock <= (product.minStockAlert || 10);
                  const currentQtyInCart = cartItem ? cartItem.quantity : 0;
                  const remainingStock = product.stock - currentQtyInCart;

                  return (
                    <div
                      key={product.id}
                      id={`product-card-${product.id}`}
                      onClick={() => {
                        if (!isOutOfStock && remainingStock > 0) {
                          addToCart(product);
                        }
                      }}
                      className={`group relative bg-white p-2.5 sm:p-3 rounded-2xl border transition-all duration-150 flex flex-col justify-between cursor-pointer select-none shadow-xs ${
                        isOutOfStock
                          ? 'opacity-60 border-slate-200 bg-slate-50 cursor-not-allowed'
                          : isLowStock
                          ? 'border-rose-200 hover:border-rose-500 hover:shadow-md'
                          : 'border-slate-200 hover:border-[#00A876] hover:shadow-md active:scale-98'
                      }`}
                    >
                      {/* Product Thumbnail & Badges */}
                      <div className="w-full h-24 sm:h-28 bg-slate-100 rounded-xl mb-2 relative overflow-hidden shrink-0">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />

                        {/* Low stock tint */}
                        {isLowStock && (
                          <div className="absolute inset-0 bg-rose-500/10 pointer-events-none flex items-center justify-center">
                            <span className="bg-rose-600 text-white text-[9px] px-2 py-0.5 rounded-md uppercase font-black shadow-xs">
                              Stok Menipis
                            </span>
                          </div>
                        )}

                        {/* Stock Tag Top Right */}
                        <div className="absolute top-1 right-1">
                          {isOutOfStock ? (
                            <span className="bg-slate-900 text-white px-2 py-0.5 rounded text-[9px] font-bold uppercase shadow-xs">
                              Habis
                            </span>
                          ) : isLowStock ? (
                            <span className="bg-rose-600 text-white px-2 py-0.5 rounded text-[10px] font-bold shadow-xs">
                              Stok: {product.stock}
                            </span>
                          ) : (
                            <span className="bg-white/95 text-slate-800 px-2 py-0.5 rounded text-[10px] font-bold shadow-xs border border-slate-200/60">
                              Stok: {product.stock}
                            </span>
                          )}
                        </div>

                        {/* SKU Tag Bottom Left */}
                        <div className="absolute bottom-1 left-1 bg-slate-900/70 backdrop-blur-2xs text-[9px] font-mono text-white px-1.5 py-0.2 rounded">
                          {product.sku}
                        </div>

                        {/* Cart Quantity Badge */}
                        {currentQtyInCart > 0 && (
                          <div className="absolute top-1 left-1 bg-[#00A876] text-white font-bold text-[11px] w-5 h-5 rounded-full flex items-center justify-center shadow-md ring-2 ring-white">
                            {currentQtyInCart}
                          </div>
                        )}
                      </div>

                      {/* Product Name & Price */}
                      <div className="min-w-0 space-y-1">
                        <h3 className="text-xs sm:text-sm font-bold truncate text-slate-900" title={product.name}>
                          {product.name}
                        </h3>
                        <div className="flex items-center justify-between">
                          <p className="text-[#00A876] font-bold text-xs sm:text-sm">
                            {formatRupiah(product.price)}
                          </p>
                          <button
                            type="button"
                            disabled={isOutOfStock || remainingStock <= 0}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!isOutOfStock && remainingStock > 0) {
                                addToCart(product);
                              }
                            }}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs transition ${
                              isOutOfStock || remainingStock <= 0
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : 'bg-emerald-50 text-[#00A876] hover:bg-[#00A876] hover:text-white'
                            }`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Right Section: High Density Cart Sidebar (Desktop) */}
        {/* Right Section: Task-Oriented POS Cart & Checkout Workflow Panel */}
        <aside
          id="pos-cart-panel"
          className="hidden lg:flex w-80 xl:w-96 bg-white rounded-2xl sm:rounded-3xl border border-slate-200 flex-col shrink-0 overflow-hidden shadow-xs h-full"
        >
          {/* Header */}
          <div className="p-3.5 sm:p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/70 shrink-0">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-[#00A876]" />
              <h2 className="font-extrabold text-sm sm:text-base text-slate-900">
                Keranjang Kasir ({cartTotals.totalUnits} Unit)
              </h2>
            </div>
            {cart.length > 0 && (
              <button
                id="clear-cart-btn"
                onClick={handleClearCart}
                className="text-rose-600 hover:text-rose-700 text-xs font-bold transition cursor-pointer flex items-center gap-1"
                title="Batalkan dan kosongkan keranjang"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Batal</span>
              </button>
            )}
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 flex flex-col gap-3">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2.5">
                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300">
                  <ShoppingBag className="w-7 h-7" />
                </div>
                <div>
                  <p className="font-bold text-slate-700 text-xs sm:text-sm">Keranjang Masih Kosong</p>
                  <p className="text-[11px] text-slate-400 max-w-[200px] mt-0.5">
                    Klik produk di katalog atau tekan tombol <strong>Scan Barcode</strong> di atas.
                  </p>
                </div>
                {savedTransactions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsSavedTransactionsOpen(true)}
                    className="mt-2 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 transition cursor-pointer"
                  >
                    Buka {savedTransactions.length} Transaksi Tersimpan
                  </button>
                )}
              </div>
            ) : (
              cart.map(({ product, quantity }) => {
                const itemSubtotal = product.price * quantity;
                const canAddMore = quantity < product.stock;

                return (
                  <div
                    key={product.id}
                    id={`cart-item-${product.id}`}
                    className="flex items-center gap-2.5 pb-2.5 border-b border-slate-100 last:border-none last:pb-0"
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-10 h-10 bg-slate-100 rounded-xl object-cover shrink-0 border border-slate-200/60"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold leading-tight truncate text-slate-900">
                        {product.name}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {formatRupiah(product.price)} x {quantity}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <div className="text-xs sm:text-sm font-bold text-slate-900">
                        {formatRupiah(itemSubtotal)}
                      </div>
                      <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                        <button
                          type="button"
                          onClick={() => updateCartQty(product.id, quantity - 1)}
                          className="w-5 h-5 rounded bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center text-[10px] cursor-pointer"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="w-4 text-center text-[11px] font-bold text-slate-800">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          disabled={!canAddMore}
                          onClick={() => updateCartQty(product.id, quantity + 1)}
                          className={`w-5 h-5 rounded flex items-center justify-center text-[10px] cursor-pointer ${
                            canAddMore
                              ? 'bg-white text-slate-700 hover:bg-slate-200'
                              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Cart Footer: Summary & High-Contrast Task Buttons (Bayar, Simpan, Batal) */}
          <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 space-y-2.5 shrink-0">
            <div className="flex justify-between text-xs text-slate-500">
              <span>Subtotal ({cartTotals.totalUnits} unit)</span>
              <span className="font-semibold text-slate-700">
                {formatRupiah(cartTotals.subtotal)}
              </span>
            </div>
            {settings.enableTax && (
              <div className="flex justify-between text-xs text-slate-500">
                <span>Pajak (PPN {settings.taxRate}%)</span>
                <span>+{formatRupiah(estimatedTax)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg sm:text-xl font-black text-slate-900 pt-1 border-t border-slate-200">
              <span>Total</span>
              <span className="text-[#00A876]">{formatRupiah(estimatedTotal)}</span>
            </div>

            {/* Task-Oriented Workflow Action Buttons: Bayar, Simpan Transaksi, Batal */}
            <div className="space-y-2 pt-1.5">
              {/* Primary Prominent Bayar Button */}
              <button
                type="button"
                id="open-checkout-btn"
                disabled={cart.length === 0}
                onClick={() => setIsCheckoutOpen(true)}
                className={`w-full py-3.5 px-4 rounded-xl shadow-lg transition-transform active:scale-95 text-xs sm:text-sm font-black uppercase tracking-wide cursor-pointer flex items-center justify-center gap-2 ${
                  cart.length > 0
                    ? 'bg-[#00A876] hover:bg-[#009267] text-white shadow-[#00A876]/30'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Bayar Sekarang ({formatRupiah(estimatedTotal)})</span>
              </button>

              {/* Secondary Task Buttons: Simpan Transaksi & Batal */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="hold-transaction-btn"
                  disabled={cart.length === 0}
                  onClick={handleHoldCurrentTransaction}
                  className="py-2.5 px-3 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed text-indigo-900 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  title="Simpan sementara / Parkir pesanan"
                >
                  <BookmarkCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Simpan Transaksi</span>
                </button>

                <button
                  type="button"
                  id="cancel-transaction-btn"
                  disabled={cart.length === 0}
                  onClick={handleClearCart}
                  className="py-2.5 px-3 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 disabled:opacity-40 disabled:cursor-not-allowed text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                  title="Batalkan transaksi saat ini"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  <span>Batal</span>
                </button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Mobile Floating Cart Summary Drawer Trigger */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-14 left-0 right-0 p-3 bg-white/95 backdrop-blur-md border-t border-slate-200 z-30 shadow-2xl flex items-center justify-between gap-2">
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] text-slate-400 font-bold uppercase truncate">{cartTotals.totalUnits} Item Terpilih</span>
            <span className="text-base font-black text-[#00A876] truncate">{formatRupiah(estimatedTotal)}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleHoldCurrentTransaction}
              className="p-2.5 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold cursor-pointer"
              title="Simpan Transaksi"
            >
              <BookmarkCheck className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsMobileCartOpen(true)}
              className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold cursor-pointer"
            >
              Detail
            </button>
            <button
              type="button"
              onClick={() => setIsCheckoutOpen(true)}
              className="px-4 py-2.5 bg-[#00A876] hover:bg-[#009267] text-white rounded-xl text-xs font-black shadow-md shadow-[#00A876]/30 cursor-pointer flex items-center gap-1"
            >
              <span>Bayar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Mobile Cart Drawer Modal */}
      {isMobileCartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-t-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#00A876]" />
                <h3 className="font-bold text-sm text-slate-900">Keranjang ({cartTotals.totalUnits} Item)</h3>
              </div>
              <button
                onClick={() => setIsMobileCartOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.map(({ product, quantity }) => (
                <div key={product.id} className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-xs font-bold text-slate-900 truncate">{product.name}</p>
                    <p className="text-[10px] text-slate-500">{formatRupiah(product.price)} x {quantity}</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => updateCartQty(product.id, quantity - 1)}
                      className="w-6 h-6 rounded-lg bg-white text-slate-700 flex items-center justify-center text-xs"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-xs font-bold">{quantity}</span>
                    <button
                      onClick={() => updateCartQty(product.id, quantity + 1)}
                      disabled={quantity >= product.stock}
                      className="w-6 h-6 rounded-lg bg-white text-slate-700 flex items-center justify-center text-xs disabled:opacity-50"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-2">
              <div className="flex justify-between text-base font-black text-slate-900">
                <span>Total Bayar</span>
                <span className="text-[#00A876]">{formatRupiah(estimatedTotal)}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    handleHoldCurrentTransaction();
                    setIsMobileCartOpen(false);
                  }}
                  className="py-2.5 bg-indigo-50 border border-indigo-200 text-indigo-800 font-bold text-xs rounded-xl flex items-center justify-center gap-1"
                >
                  <BookmarkCheck className="w-3.5 h-3.5" />
                  <span>Simpan Transaksi</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleClearCart();
                    setIsMobileCartOpen(false);
                  }}
                  className="py-2.5 bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Batal</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsMobileCartOpen(false);
                  setIsCheckoutOpen(true);
                }}
                className="w-full py-3 bg-[#00A876] hover:bg-[#009267] text-white font-black text-sm rounded-xl shadow-lg shadow-[#00A876]/25"
              >
                Bayar Sekarang ({formatRupiah(estimatedTotal)})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Saved / Held Transactions Modal */}
      {isSavedTransactionsOpen && (
        <div
          id="saved-transactions-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsSavedTransactionsOpen(false);
          }}
        >
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 flex flex-col max-h-[85vh]">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookmarkCheck className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base">Daftar Transaksi Tersimpan</h3>
                  <p className="text-[11px] text-slate-400">{savedTransactions.length} transaksi dalam antrean</p>
                </div>
              </div>
              <button
                onClick={() => setIsSavedTransactionsOpen(false)}
                className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-2.5">
              {savedTransactions.length === 0 ? (
                <div className="py-10 text-center text-slate-400 space-y-2">
                  <BookmarkCheck className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-700 text-xs sm:text-sm">Belum Ada Transaksi Tersimpan</p>
                  <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                    Gunakan tombol "Simpan Transaksi" saat ada pelanggan yang ingin menunda sementara pesanannya.
                  </p>
                </div>
              ) : (
                savedTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    onClick={() => handleRestoreTransaction(tx)}
                    className="p-3.5 rounded-2xl border border-indigo-100 bg-indigo-50/60 hover:bg-indigo-100/80 transition flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xs text-indigo-950">
                          {tx.note || 'Transaksi Tersimpan'}
                        </span>
                        <span className="text-[10px] text-indigo-700 bg-indigo-200/70 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {tx.timeLabel}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 truncate mt-1">
                        {tx.items.map((i) => `${i.product.name} (x${i.quantity})`).join(', ')}
                      </p>
                      <p className="text-xs font-black text-[#00A876] mt-0.5">
                        {formatRupiah(tx.subtotal)} ({tx.totalUnits} unit)
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleDeleteSavedTransaction(tx.id, e)}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition cursor-pointer"
                        title="Hapus Transaksi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        className="px-3 py-1.5 bg-indigo-600 group-hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Buka</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Barcode Camera Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isBarcodeScannerOpen}
        onClose={() => setIsBarcodeScannerOpen(false)}
        onScan={handleBarcodeScanned}
        onHoldTransaction={handleHoldCurrentTransaction}
        onProceedToCheckout={() => {
          setIsBarcodeScannerOpen(false);
          setIsCheckoutOpen(true);
        }}
        mode="pos"
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSuccess={handleCheckoutSuccess}
      />

      {/* Printable Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        sale={completedSale}
        settings={settings}
        onClose={() => {
          setIsReceiptOpen(false);
          setCompletedSale(null);
        }}
        isNewTransaction={true}
      />

      {/* Store Branch Modal */}
      <StoreModal
        isOpen={isStoreModalOpen}
        onClose={() => setIsStoreModalOpen(false)}
      />

      {/* Digital Price Tag Display Modal */}
      <DigitalPriceTagModal
        isOpen={isDigitalPriceTagOpen}
        onClose={() => setIsDigitalPriceTagOpen(false)}
      />

      {/* Cash Drawer: Open Shift Modal */}
      <OpenShiftModal
        isOpen={isOpenShiftModalOpen}
        onClose={() => setIsOpenShiftModalOpen(false)}
      />

      {/* Cash Drawer: Add Expense Modal */}
      <AddExpenseModal
        isOpen={isAddExpenseModalOpen}
        onClose={() => setIsAddExpenseModalOpen(false)}
      />

      {/* Floating Payment Success Notification Banner */}
      <PaymentSuccessBanner
        sale={completedSale}
        onClose={() => {}}
        onPrint={() => setIsReceiptOpen(true)}
      />
    </div>
  );
};


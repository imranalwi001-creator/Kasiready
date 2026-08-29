import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { formatRupiah } from '../../utils/formatters';
import {
  Search,
  X,
  Package,
  Receipt,
  Users,
  ShoppingCart,
  ArrowRight,
  Sparkles,
  Layers,
  Settings,
  Wallet,
  BarChart3,
  Mic,
  MicOff,
  Plus,
  Check,
  Tag,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab?: (tab: string) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
}) => {
  const {
    products,
    categories,
    sales,
    customers,
    setActiveTab,
    addToCart,
    cart,
  } = useStore();
  const { toast } = useToast();

  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [addedProductId, setAddedProductId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setVoiceSupported(!!SpeechRecognition);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedCategory('all');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const toggleVoiceSearch = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.warning('Fitur Tidak Didukung', 'Browser Anda tidak mendukung Web Speech API untuk pencarian suara.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'id-ID';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListening(true);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setQuery(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Matched Dynamic Products
  const matchedProducts = useMemo(() => {
    const q = query.toLowerCase().trim();
    return products.filter((p) => {
      const matchesCategory =
        selectedCategory === 'all' || p.categoryId === selectedCategory;
      if (!matchesCategory) return false;

      if (!q) return true;

      const categoryName = categories.find((c) => c.id === p.categoryId)?.name || '';
      const nameMatch = p.name.toLowerCase().includes(q);
      const skuMatch = p.sku.toLowerCase().includes(q);
      const barcodeMatch = p.barcode ? p.barcode.toLowerCase().includes(q) : false;
      const catMatch = categoryName.toLowerCase().includes(q);

      return nameMatch || skuMatch || barcodeMatch || catMatch;
    });
  }, [products, categories, query, selectedCategory]);

  const matchedSales = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return sales
      .filter(
        (s) =>
          (s.invoiceNumber && s.invoiceNumber.toLowerCase().includes(q)) ||
          s.id.toLowerCase().includes(q) ||
          (s.customerName && s.customerName.toLowerCase().includes(q))
      )
      .slice(0, 4);
  }, [sales, query]);

  const matchedCustomers = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return customers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.phone && c.phone.includes(q)) ||
          (c.email && c.email.toLowerCase().includes(q))
      )
      .slice(0, 4);
  }, [customers, query]);

  // Global Keyboard listener for Escape & shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
      if (e.key === 'ArrowDown' && isOpen) {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < matchedProducts.length - 1 ? prev + 1 : prev
        );
      }
      if (e.key === 'ArrowUp' && isOpen) {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
      }
      if (e.key === 'Enter' && isOpen && matchedProducts[selectedIndex]) {
        e.preventDefault();
        handleQuickAddToCart(matchedProducts[selectedIndex]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, matchedProducts, selectedIndex]);

  const handleQuickAddToCart = (product: any) => {
    if (product.stock <= 0) {
      toast.warning('Stok Habis', `Stok produk "${product.name}" sedang habis.`);
      return;
    }
    addToCart(product);
    toast.success('Ditambahkan ke Keranjang', `1x ${product.name}`);
    setAddedProductId(product.id);
    setTimeout(() => setAddedProductId(null), 1200);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-16 p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Search input field */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3 bg-slate-50/70 dark:bg-slate-900/80">
          <div className="w-10 h-10 rounded-2xl bg-[#00A876]/15 text-[#00A876] flex items-center justify-center shrink-0">
            <Search className="w-5 h-5" />
          </div>

          <input
            ref={inputRef}
            type="text"
            placeholder="Cari produk dinamis, barcode, SKU, invoice kasir, atau pelanggan..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="flex-1 bg-transparent border-none outline-none text-sm sm:text-base font-medium text-slate-800 dark:text-white placeholder-slate-400"
          />

          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {voiceSupported && (
            <button
              type="button"
              onClick={toggleVoiceSearch}
              title={isListening ? 'Mendengarkan...' : 'Pencarian Suara (Voice-to-Text)'}
              className={`p-2.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                isListening
                  ? 'bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-[#00A876] hover:text-white'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              <span className="hidden sm:inline">{isListening ? 'Merekam...' : 'Suara'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="text-[10px] font-mono bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-1.5 rounded-lg font-bold hover:bg-slate-300 transition cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* Dynamic Category Filter Pills */}
        <div className="px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#00A876] text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Semua Kategori ({products.length})
          </button>
          {categories.map((cat) => {
            const count = products.filter((p) => p.categoryId === cat.id).length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? 'bg-[#00A876] text-white shadow-xs font-bold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <span>{cat.name}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Results Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-5 text-xs flex-1">
          {/* Quick Navigation Jumps if no query */}
          {!query && selectedCategory === 'all' && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#00A876]" />
                Pintasan Menu Cepat
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { tab: 'pos', title: 'Kasir POS', desc: 'Transaksi Kasir', icon: ShoppingCart },
                  { tab: 'inventory', title: 'Inventaris', desc: 'Kelola Stok Barang', icon: Package },
                  { tab: 'history', title: 'Riwayat Transaksi', desc: 'Daftar Invoice Struk', icon: Receipt },
                  { tab: 'customers', title: 'Member Pelanggan', desc: 'Poin & Loyalitas', icon: Users },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.tab}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.tab as any);
                        onClose();
                      }}
                      className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-[#00A876] hover:bg-teal-50/50 dark:hover:bg-slate-800 text-left transition cursor-pointer group"
                    >
                      <div className="w-8 h-8 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[#00A876] mb-2 group-hover:scale-105 transition">
                        <Icon className="w-4 h-4" />
                      </div>
                      <p className="font-bold text-slate-900 dark:text-white">{item.title}</p>
                      <span className="text-[10px] text-slate-400">{item.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Products Dynamic Results */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-[#00A876]" />
                Produk Ditemukan ({matchedProducts.length})
              </p>
              <span className="text-[10px] text-slate-400">
                Gunakan panah &amp; Enter untuk tambah ke POS
              </span>
            </div>

            {matchedProducts.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                <Package className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="font-bold text-slate-700 dark:text-slate-300">
                  Tidak ada produk yang cocok
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Coba kata kunci lain atau pilih kategori &quot;Semua Kategori&quot;
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {matchedProducts.slice(0, 8).map((p, idx) => {
                  const isSelected = idx === selectedIndex;
                  const isAdded = addedProductId === p.id;
                  const cartItem = cart.find((item) => item.product.id === p.id);
                  const isLowStock = p.stock <= (p.minStock || 5);
                  const isOutOfStock = p.stock <= 0;

                  return (
                    <div
                      key={p.id}
                      className={`p-3 rounded-2xl border transition flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-[#00A876] bg-teal-50/70 dark:bg-slate-800/90 shadow-sm ring-1 ring-[#00A876]'
                          : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                          {p.image ? (
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Package className="w-5 h-5 text-[#00A876]" />
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-900 dark:text-white truncate">
                              {p.name}
                            </p>
                            {isOutOfStock ? (
                              <span className="text-[9px] bg-rose-100 text-rose-700 font-bold px-1.5 py-0.2 rounded">
                                Habis
                              </span>
                            ) : isLowStock ? (
                              <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">
                                Sisa {p.stock}
                              </span>
                            ) : null}
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                            <span>SKU: {p.sku}</span>
                            {p.barcode && (
                              <>
                                <span>&bull;</span>
                                <span>Barcode: {p.barcode}</span>
                              </>
                            )}
                            <span>&bull;</span>
                            <span className="capitalize">{p.category}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="font-extrabold text-sm text-[#00A876]">
                            {formatRupiah(p.price)}
                          </p>
                          <span className="text-[10px] text-slate-400">
                            Stok: {p.stock} {p.unit}
                          </span>
                        </div>

                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={() => handleQuickAddToCart(p)}
                          className={`px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                            isOutOfStock
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                              : isAdded
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-[#00A876] hover:bg-[#008f65] text-white shadow-sm shadow-[#00A876]/20 active:scale-95'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Ditambahkan!</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-3.5 h-3.5" />
                              <span>{cartItem ? `+1 (${cartItem.quantity})` : '+ Keranjang'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Transactions Results */}
          {matchedSales.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-teal-600" />
                Transaksi ({matchedSales.length})
              </p>
              <div className="space-y-1.5">
                {matchedSales.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => {
                      setActiveTab('history');
                      onClose();
                    }}
                    className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-teal-50 dark:hover:bg-slate-800 flex items-center justify-between transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-teal-600">
                        <Receipt className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white font-mono">
                          {s.invoiceNumber || s.id}
                        </p>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Pelanggan: {s.customerName || 'Umum'} &bull; {s.paymentMethod.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatRupiah(s.totalAmount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customers Results */}
          {matchedCustomers.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                Pelanggan ({matchedCustomers.length})
              </p>
              <div className="space-y-1.5">
                {matchedCustomers.map((c) => (
                  <div
                    key={c.id}
                    onClick={() => {
                      setActiveTab('customers');
                      onClose();
                    }}
                    className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-teal-50 dark:hover:bg-slate-800 flex items-center justify-between transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-indigo-600">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{c.name}</p>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {c.phone || c.email}
                        </span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 rounded-lg font-bold text-[10px]">
                      {c.tier} ({c.points} Pts)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-100 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>&uarr;&darr; Pilih Produk</span>
            <span>&bull;</span>
            <span>&crarr; Tambah ke Keranjang</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setActiveTab('pos');
              onClose();
            }}
            className="font-bold text-[#00A876] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Buka Kasir POS</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};


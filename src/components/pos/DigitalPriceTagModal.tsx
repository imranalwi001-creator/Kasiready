import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import {
  Tag,
  X,
  Search,
  Maximize2,
  Minimize2,
  Printer,
  Plus,
  Check,
  Sparkles,
  ShoppingBag,
  Layers,
  ArrowUpDown,
  Filter,
  CheckCircle2,
  Flame,
  AlertTriangle,
  QrCode,
  Barcode as BarcodeIcon,
} from 'lucide-react';

interface DigitalPriceTagModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DigitalPriceTagModal: React.FC<DigitalPriceTagModalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    products,
    categories,
    activeStore,
    addToCart,
    cartTotals,
    settings,
  } = useStore();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'customer_cards' | 'shelf_esl' | 'compact_grid'>('customer_cards');
  const [sortBy, setSortBy] = useState<'name' | 'price_asc' | 'price_desc' | 'stock'>('name');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [addedItemEffect, setAddedItemEffect] = useState<string | null>(null);

  // Filter products for active store
  const storeProducts = useMemo(() => {
    return products.filter((p) => p.storeId === activeStore.id);
  }, [products, activeStore]);

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    return storeProducts
      .filter((p) => {
        const matchCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
        const matchSearch =
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.sku.toLowerCase().includes(searchQuery.toLowerCase());
        return matchCategory && matchSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price_asc') return a.price - b.price;
        if (sortBy === 'price_desc') return b.price - a.price;
        if (sortBy === 'stock') return b.stock - a.stock;
        return a.name.localeCompare(b.name);
      });
  }, [storeProducts, selectedCategory, searchQuery, sortBy]);

  if (!isOpen) return null;

  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) return;
    const added = addToCart(product, 1);
    if (added) {
      setAddedItemEffect(product.id);
      setTimeout(() => {
        setAddedItemEffect(null);
      }, 700);
    }
  };

  const handlePrintShelfLabels = () => {
    window.print();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  return (
    <div
      id="digital-price-tag-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto"
    >
      <div
        className={`relative bg-slate-900 text-slate-100 rounded-2xl shadow-2xl border border-slate-700 w-full flex flex-col transition-all duration-200 overflow-hidden ${
          isFullscreen ? 'fixed inset-0 rounded-none z-50 h-screen max-w-none' : 'max-w-6xl max-h-[92vh] h-full'
        }`}
      >
        {/* Header Bar */}
        <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Digital Price Tag &amp; Display Pelanggan
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {activeStore.name}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Katalog harga visual interaktif untuk display kasir &amp; pemilihan langsung pelanggan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Cart Status Badge */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
              <span className="text-slate-300">
                <strong className="text-white">{cartTotals.totalUnits}</strong> item di kasir
              </span>
              <span className="font-bold text-emerald-400">({formatRupiah(cartTotals.subtotal)})</span>
            </div>

            {/* Print Shelf Tags */}
            <button
              id="print-shelf-tags-btn"
              onClick={handlePrintShelfLabels}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
              title="Cetak Label Rak Harga"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Fullscreen Toggle */}
            <button
              id="toggle-price-tag-fullscreen-btn"
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
              title="Layar Penuh Display Pelanggan"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              id="close-price-tag-modal-btn"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-300 border border-slate-700 hover:border-rose-500/30 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter & View Controls */}
        <div className="bg-slate-900/90 px-4 sm:px-6 py-3 border-b border-slate-800 space-y-3 no-print">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama produk, SKU, atau barcode..."
                className="w-full bg-slate-800/90 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Mode & Sort Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Display Style Toggle */}
              <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
                <button
                  onClick={() => setViewMode('customer_cards')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    viewMode === 'customer_cards'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Katalog Visual</span>
                </button>
                <button
                  onClick={() => setViewMode('shelf_esl')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    viewMode === 'shelf_esl'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <BarcodeIcon className="w-3.5 h-3.5" />
                  <span>Label Rak ESL</span>
                </button>
                <button
                  onClick={() => setViewMode('compact_grid')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                    viewMode === 'compact_grid'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Grid Rapat</span>
                </button>
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
                <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer"
                >
                  <option value="name" className="bg-slate-800 text-white">Nama (A-Z)</option>
                  <option value="price_asc" className="bg-slate-800 text-white">Harga Termurah</option>
                  <option value="price_desc" className="bg-slate-800 text-white">Harga Termahal</option>
                  <option value="stock" className="bg-slate-800 text-white">Stok Terbanyak</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                selectedCategory === 'all'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700'
              }`}
            >
              <span>Semua Kategori</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900/60">
                {storeProducts.length}
              </span>
            </button>

            {categories.map((cat) => {
              const count = storeProducts.filter((p) => p.categoryId === cat.id).length;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: cat.color || '#6366f1' }}
                  />
                  <span>{cat.name}</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900/60 text-slate-300">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Body: Price Tag Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950/60">
          {filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-500 mb-3">
                <Tag className="w-8 h-8" />
              </div>
              <h3 className="text-base font-bold text-white">Tidak ada produk yang cocok</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Coba ubah kata kunci pencarian atau pilih kategori lain untuk menampilkan daftar harga digital.
              </p>
            </div>
          ) : viewMode === 'customer_cards' ? (
            /* --- MODE 1: VISUAL CUSTOMER CARDS --- */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => {
                const isOutOfStock = product.stock <= 0;
                const isLowStock = product.stock > 0 && product.stock <= product.minStockAlert;
                const isJustAdded = addedItemEffect === product.id;
                const cat = categories.find((c) => c.id === product.categoryId);

                return (
                  <div
                    key={product.id}
                    className={`bg-slate-900 rounded-2xl border transition-all duration-200 overflow-hidden flex flex-col group relative ${
                      isJustAdded
                        ? 'border-emerald-400 ring-2 ring-emerald-400/50 scale-102'
                        : 'border-slate-800 hover:border-indigo-500/60 hover:shadow-xl hover:shadow-indigo-500/10'
                    }`}
                  >
                    {/* Top Image Banner */}
                    <div className="relative h-44 bg-slate-950 overflow-hidden">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />

                      {/* Category Badge */}
                      <div className="absolute top-2.5 left-2.5">
                        <span
                          className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-sm border border-white/10"
                          style={{
                            backgroundColor: (cat?.color || '#4f46e5') + 'dd',
                            color: '#ffffff',
                          }}
                        >
                          {cat?.name || 'Umum'}
                        </span>
                      </div>

                      {/* Stock Badge */}
                      <div className="absolute top-2.5 right-2.5">
                        {isOutOfStock ? (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-rose-500/90 text-white backdrop-blur-xs">
                            Habis
                          </span>
                        ) : isLowStock ? (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-amber-500/90 text-white backdrop-blur-xs flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Sisa {product.stock}
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-emerald-500/80 text-white backdrop-blur-xs">
                            Ready ({product.stock} {product.unit})
                          </span>
                        )}
                      </div>

                      {/* Promo Tag Pill if applicable */}
                      {product.price > 50000 && (
                        <div className="absolute bottom-2 left-2.5 flex items-center gap-1 bg-amber-400 text-slate-950 px-2 py-0.5 rounded-md text-[10px] font-black shadow-xs">
                          <Flame className="w-3 h-3" />
                          <span>BEST VALUE</span>
                        </div>
                      )}
                    </div>

                    {/* Product Details & Big Price Typography */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                          <span>SKU: {product.sku}</span>
                          <span>Satuan: {product.unit}</span>
                        </div>
                        <h3 className="font-bold text-sm sm:text-base text-white line-clamp-2 mt-1 leading-snug">
                          {product.name}
                        </h3>
                        {product.description && (
                          <p className="text-xs text-slate-400 line-clamp-1 mt-0.5">
                            {product.description}
                          </p>
                        )}
                      </div>

                      {/* Prominent High-Contrast Digital Price Box */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-end justify-between gap-2">
                        <div>
                          <span className="text-[10px] text-slate-400 font-semibold block uppercase">
                            Harga Pas
                          </span>
                          <span className="text-xl sm:text-2xl font-black text-amber-400 tracking-tight">
                            {formatRupiah(product.price)}
                          </span>
                        </div>

                        {/* Direct Add to Cart Action */}
                        <button
                          onClick={() => handleAddToCart(product)}
                          disabled={isOutOfStock}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                            isOutOfStock
                              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                              : isJustAdded
                              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 active:scale-95'
                          }`}
                        >
                          {isJustAdded ? (
                            <>
                              <Check className="w-4 h-4" />
                              <span>Ditambah</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4" />
                              <span>Pilih</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : viewMode === 'shelf_esl' ? (
            /* --- MODE 2: ELECTRONIC SHELF LABELS (ESL / LABEL RAK HARGA) --- */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((product) => {
                const cat = categories.find((c) => c.id === product.categoryId);
                const isJustAdded = addedItemEffect === product.id;

                return (
                  <div
                    key={product.id}
                    className="bg-white text-slate-900 rounded-xl p-4 shadow-md border-2 border-slate-300 relative overflow-hidden font-sans flex flex-col justify-between"
                  >
                    {/* Shelf Tag Header */}
                    <div className="flex items-center justify-between border-b-2 border-slate-900 pb-1.5 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                        <span className="font-black text-xs uppercase tracking-wider text-slate-800">
                          {settings.name}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-slate-100 px-1.5 py-0.5 rounded border border-slate-300">
                        {cat?.name || 'REGULER'}
                      </span>
                    </div>

                    {/* Product Name */}
                    <div className="mb-2">
                      <h4 className="font-bold text-sm text-slate-900 leading-snug line-clamp-2">
                        {product.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        SKU: {product.sku} | Unit: {product.unit}
                      </p>
                    </div>

                    {/* Massive ESL Price Typography */}
                    <div className="my-2 bg-slate-50 rounded-lg p-2 border border-slate-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 block">HARGA RETAIL</span>
                        <div className="text-2xl sm:text-3xl font-black text-slate-950 font-mono tracking-tight">
                          {formatRupiah(product.price)}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-400 block font-mono">STOK</span>
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                          {product.stock} {product.unit}
                        </span>
                      </div>
                    </div>

                    {/* Simulated Barcode Graphics & Action */}
                    <div className="pt-2 border-t border-dashed border-slate-300 flex items-center justify-between gap-2">
                      {/* Barcode representation */}
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-0.5 h-6">
                          {[3, 1, 4, 1, 5, 9, 2, 6, 5, 3, 5, 8, 9, 7, 9, 3, 2, 3, 8, 4, 6].map((w, i) => (
                            <div
                              key={i}
                              className="bg-slate-900 h-full"
                              style={{ width: `${(w % 3) + 1}px` }}
                            />
                          ))}
                        </div>
                        <div className="text-[9px] font-mono text-slate-600 tracking-wider">
                          *{product.sku}*
                        </div>
                      </div>

                      {/* Add Button for Cashier/Customer */}
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock <= 0}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Pilih</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* --- MODE 3: COMPACT DENSE GRID --- */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {filteredProducts.map((product) => {
                const isOutOfStock = product.stock <= 0;
                return (
                  <div
                    key={product.id}
                    onClick={() => !isOutOfStock && handleAddToCart(product)}
                    className={`bg-slate-900 p-3 rounded-xl border border-slate-800 hover:border-indigo-500 flex flex-col justify-between cursor-pointer transition ${
                      isOutOfStock ? 'opacity-50 cursor-not-allowed' : 'hover:scale-102 hover:shadow-lg'
                    }`}
                  >
                    <div className="w-full h-20 bg-slate-950 rounded-lg overflow-hidden mb-2">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-white truncate">{product.name}</h4>
                      <p className="text-[10px] text-slate-400 font-mono">{product.sku}</p>
                    </div>
                    <div className="mt-2 pt-1 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-black text-amber-400">
                        {formatRupiah(product.price)}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">{product.stock} {product.unit}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Summary / Quick Actions */}
        <div className="bg-slate-900 border-t border-slate-800 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs no-print">
          <div className="text-slate-400">
            Menampilkan <strong className="text-white">{filteredProducts.length}</strong> produk di{' '}
            <strong className="text-indigo-400">{activeStore.name}</strong>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition cursor-pointer"
            >
              Kembali ke Kasir POS
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';
import { formatRupiah, formatNumber } from '../../utils/formatters';
import { ProductModal } from './ProductModal';
import { CategoryModal } from './CategoryModal';
import { RestockModal } from './RestockModal';
import { StockAuditLogsModal } from './StockAuditLogsModal';
import { TransferStockModal } from './TransferStockModal';
import { StoreModal } from '../common/StoreModal';
import {
  Package,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Layers,
  History,
  Edit2,
  Trash2,
  PlusCircle,
  LayoutGrid,
  List,
  AlertCircle,
  Coins,
  TrendingDown,
  CheckCircle2,
  Building2,
  ArrowRightLeft,
} from 'lucide-react';

interface InventoryPageProps {
  initialRestockProductId?: string | null;
  onClearInitialRestock?: () => void;
}

export const InventoryPage: React.FC<InventoryPageProps> = ({
  initialRestockProductId,
  onClearInitialRestock,
}) => {
  const {
    products,
    categories,
    deleteProduct,
    lowStockProducts,
    stores,
    activeStoreId,
  } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low' | 'out' | 'safe'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isAuditLogsOpen, setIsAuditLogsOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [restockTargetProduct, setRestockTargetProduct] = useState<Product | null>(null);
  const [transferTargetProduct, setTransferTargetProduct] = useState<Product | null>(null);

  // If redirected from quick restock alert bell in navbar
  React.useEffect(() => {
    if (initialRestockProductId) {
      const prod = products.find((p) => p.id === initialRestockProductId);
      if (prod) {
        setRestockTargetProduct(prod);
      }
      if (onClearInitialRestock) {
        onClearInitialRestock();
      }
    }
  }, [initialRestockProductId, products, onClearInitialRestock]);

  // Filtered list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchStore = selectedStoreFilter === 'all' || p.storeId === selectedStoreFilter;
      const matchCat = selectedCategory === 'all' || p.categoryId === selectedCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchSearch =
        !query ||
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query);

      let matchStock = true;
      if (stockStatusFilter === 'low') {
        matchStock = p.stock > 0 && p.stock <= (p.minStockAlert || 10);
      } else if (stockStatusFilter === 'out') {
        matchStock = p.stock <= 0;
      } else if (stockStatusFilter === 'safe') {
        matchStock = p.stock > (p.minStockAlert || 10);
      }

      return matchStore && matchCat && matchSearch && matchStock;
    });
  }, [products, selectedStoreFilter, selectedCategory, searchQuery, stockStatusFilter]);

  // Inventory stats based on selected branch
  const totalProducts = filteredProducts.length;
  const outOfStockCount = filteredProducts.filter((p) => p.stock <= 0).length;
  const lowStockCount = filteredProducts.filter(
    (p) => p.stock > 0 && p.stock <= (p.minStockAlert || 10)
  ).length;
  const totalStockUnits = filteredProducts.reduce((acc, p) => acc + p.stock, 0);
  const totalAssetValue = filteredProducts.reduce(
    (acc, p) => acc + (p.costPrice || p.price) * p.stock,
    0
  );

  const handleDelete = (prod: Product) => {
    if (
      confirm(
        `Apakah Anda yakin ingin menghapus "${prod.name}" (${prod.sku}) dari database produk?`
      )
    ) {
      deleteProduct(prod.id);
    }
  };

  const getCategoryName = (catId: string) => {
    return categories.find((c) => c.id === catId)?.name || 'Umum';
  };

  const getCategoryColor = (catId: string) => {
    return categories.find((c) => c.id === catId)?.color || '#4f46e5';
  };

  const getStoreName = (storeId?: string) => {
    return stores.find((s) => s.id === storeId)?.name || 'Toko Utama';
  };

  return (
    <div id="inventory-page" className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* Top Header & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-indigo-600" />
            Manajemen Inventaris Multi-Toko
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola stok per cabang, transfer persediaan, kategori, dan automasi peringatan stok menipis
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsStoreModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Kelola Cabang ({stores.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setTransferTargetProduct(null);
              setIsTransferModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-600" />
            <span>Transfer Stok Cabang</span>
          </button>

          <button
            id="open-audit-logs-btn"
            onClick={() => setIsAuditLogsOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>Riwayat Audit</span>
          </button>

          <button
            id="open-categories-btn"
            onClick={() => setIsCategoryModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>Kategori</span>
          </button>

          <button
            id="add-new-product-btn"
            onClick={() => {
              setEditingProduct(null);
              setIsProductModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-200 transition active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Produk</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Produk */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span className="font-semibold">Total Item Produk</span>
            <Package className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900">{totalProducts}</p>
          <p className="text-[11px] text-slate-400 mt-1">
            {formatNumber(totalStockUnits)} unit stok fisik aktif
          </p>
        </div>

        {/* Nilai Aset Stok */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span className="font-semibold">Nilai Aset Persediaan</span>
            <Coins className="w-4 h-4 text-sky-600" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900">
            {formatRupiah(totalAssetValue)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Estimasi modal persediaan</p>
        </div>

        {/* Stok Menipis (Automasi <= 10) */}
        <div
          onClick={() => setStockStatusFilter(stockStatusFilter === 'low' ? 'all' : 'low')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            stockStatusFilter === 'low'
              ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/30'
              : 'bg-white border-slate-200 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span className="font-semibold text-amber-700">Stok Menipis (&le;10)</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-600">{lowStockCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">Klik untuk filter produk menipis</p>
        </div>

        {/* Stok Habis (0 Unit) */}
        <div
          onClick={() => setStockStatusFilter(stockStatusFilter === 'out' ? 'all' : 'out')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            stockStatusFilter === 'out'
              ? 'bg-red-50 border-red-400 ring-2 ring-red-400/30'
              : 'bg-white border-slate-200 hover:border-red-300'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span className="font-semibold text-red-700">Stok Habis (0)</span>
            <TrendingDown className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-red-600">{outOfStockCount}</p>
          <p className="text-[11px] text-slate-400 mt-1">Klik untuk filter produk habis</p>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="inventory-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan nama produk atau kode SKU..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />
          </div>

          {/* Filters: Store Branch & Category */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Store Branch Filter */}
            <div className="flex items-center gap-1">
              <Building2 className="w-4 h-4 text-slate-400" />
              <select
                value={selectedStoreFilter}
                onChange={(e) => setSelectedStoreFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Semua Cabang Toko</option>
                {stores.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                }`}
                title="Tampilan Tabel"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                }`}
                title="Tampilan Grid"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Stock Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1">
          <span className="text-[11px] text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Status Stok:
          </span>
          {[
            { id: 'all', label: 'Semua Status' },
            { id: 'low', label: `Menipis (\u226410)` },
            { id: 'out', label: `Habis (0)` },
            { id: 'safe', label: 'Stok Aman' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStockStatusFilter(tab.id as any)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                stockStatusFilter === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product Content: Table or Grid */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="font-bold text-slate-700 text-sm">Tidak Ada Produk</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Tidak ada produk yang sesuai dengan kriteria pencarian dan filter cabang toko saat ini.
          </p>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Produk</th>
                  <th className="py-3 px-4">Cabang Toko</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Harga Jual</th>
                  <th className="py-3 px-4">Harga Modal</th>
                  <th className="py-3 px-4 text-center">Status &amp; Level Stok</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((prod) => {
                  const isOutOfStock = prod.stock <= 0;
                  const isLowStock = prod.stock > 0 && prod.stock <= (prod.minStockAlert || 10);

                  return (
                    <tr
                      key={prod.id}
                      id={`inventory-row-${prod.id}`}
                      className="hover:bg-slate-50/80 transition"
                    >
                      {/* Product Name & Image */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.image}
                            alt={prod.name}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-100"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                              {prod.name}
                            </p>
                            <span className="font-mono text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded-xs">
                              {prod.sku}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Store Branch Badge */}
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold text-[11px] border border-slate-200">
                          <Building2 className="w-3 h-3 text-indigo-600" />
                          {getStoreName(prod.storeId)}
                        </span>
                      </td>

                      {/* Category */}
                      <td className="py-3 px-4">
                        <span
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
                          style={{
                            backgroundColor: `${getCategoryColor(prod.categoryId)}15`,
                            color: getCategoryColor(prod.categoryId),
                          }}
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: getCategoryColor(prod.categoryId) }}
                          />
                          {getCategoryName(prod.categoryId)}
                        </span>
                      </td>

                      {/* Selling Price */}
                      <td className="py-3 px-4 font-bold text-indigo-700">
                        {formatRupiah(prod.price)}
                      </td>

                      {/* Cost Price */}
                      <td className="py-3 px-4 text-slate-500">
                        {prod.costPrice ? formatRupiah(prod.costPrice) : '-'}
                      </td>

                      {/* Stock Level Badge */}
                      <td className="py-3 px-4 text-center">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 font-bold text-[11px]">
                            <AlertCircle className="w-3 h-3" />
                            Habis (0 {prod.unit})
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-bold text-[11px]">
                            <AlertTriangle className="w-3 h-3 text-amber-500" />
                            Menipis: {prod.stock} {prod.unit}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-[11px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            {prod.stock} {prod.unit}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setTransferTargetProduct(prod);
                              setIsTransferModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                            title="Transfer Stok ke Cabang Lain"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                          </button>

                          <button
                            id={`restock-btn-${prod.id}`}
                            onClick={() => setRestockTargetProduct(prod)}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 font-semibold text-[11px] flex items-center gap-1 transition cursor-pointer"
                            title="Tambah Stok"
                          >
                            <PlusCircle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Restock</span>
                          </button>

                          <button
                            onClick={() => {
                              setEditingProduct(prod);
                              setIsProductModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 transition cursor-pointer"
                            title="Edit Produk"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(prod)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                            title="Hapus Produk"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((prod) => {
            const isOutOfStock = prod.stock <= 0;
            const isLowStock = prod.stock > 0 && prod.stock <= (prod.minStockAlert || 10);

            return (
              <div
                key={prod.id}
                className="bg-white rounded-2xl border border-slate-200 p-3.5 flex flex-col justify-between space-y-3 shadow-2xs hover:shadow-sm transition"
              >
                <div className="space-y-2">
                  <div className="relative h-28 w-full rounded-xl overflow-hidden bg-slate-100">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2 left-2">
                      {isOutOfStock ? (
                        <span className="text-[10px] font-bold bg-red-600 text-white px-2 py-0.5 rounded-md">
                          Habis
                        </span>
                      ) : isLowStock ? (
                        <span className="text-[10px] font-bold bg-amber-500 text-slate-900 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          Sisa {prod.stock}
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium bg-slate-900/70 text-white px-2 py-0.5 rounded-md backdrop-blur-xs">
                          {prod.stock} {prod.unit}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span className="font-mono">{prod.sku}</span>
                      <span className="font-bold text-slate-600">{getStoreName(prod.storeId)}</span>
                    </div>
                    <h4 className="font-bold text-xs text-slate-900 line-clamp-1 mt-0.5">{prod.name}</h4>
                    <p className="font-black text-sm text-indigo-700 mt-1">
                      {formatRupiah(prod.price)}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
                  <button
                    onClick={() => setRestockTargetProduct(prod)}
                    className="flex-1 py-1.5 px-2 rounded-lg bg-amber-50 text-amber-800 hover:bg-amber-100 text-[11px] font-semibold border border-amber-200 flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-3 h-3" />
                    <span>Restock</span>
                  </button>
                  <button
                    onClick={() => {
                      setEditingProduct(prod);
                      setIsProductModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(prod)}
                    className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sub Modals */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setEditingProduct(null);
        }}
        productToEdit={editingProduct}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
      />

      <RestockModal
        isOpen={Boolean(restockTargetProduct)}
        product={restockTargetProduct}
        onClose={() => setRestockTargetProduct(null)}
      />

      <StockAuditLogsModal
        isOpen={isAuditLogsOpen}
        onClose={() => setIsAuditLogsOpen(false)}
      />

      <TransferStockModal
        isOpen={isTransferModalOpen}
        product={transferTargetProduct}
        onClose={() => {
          setIsTransferModalOpen(false);
          setTransferTargetProduct(null);
        }}
      />

      <StoreModal
        isOpen={isStoreModalOpen}
        onClose={() => setIsStoreModalOpen(false)}
      />
    </div>
  );
};

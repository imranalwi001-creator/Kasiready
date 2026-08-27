import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
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
} from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { products, sales, customers, setActiveTab } = useStore();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

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
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Search matches
  const matchedProducts = useMemo(() => {
    if (!query.trim()) return products.slice(0, 4);
    const q = query.toLowerCase();
    return products
      .filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      .slice(0, 5);
  }, [products, query]);

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Search input field */}
        <div className="p-4 border-b border-slate-200 flex items-center gap-3 bg-slate-50/50">
          <Search className="w-5 h-5 text-[#00A876]" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Cari produk, invoice transaksi, SKU, atau nama pelanggan..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-hidden text-sm sm:text-base font-medium text-slate-800 placeholder-slate-400"
          />
          <span className="text-[10px] font-mono bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-bold">
            ESC
          </span>
        </div>

        {/* Results Body */}
        <div className="p-4 max-h-[60vh] overflow-y-auto space-y-4 text-xs">
          {/* Quick Navigation jumps */}
          {!query && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Pintasan Menu
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('dashboard');
                    onClose();
                  }}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-[#00A876] hover:bg-teal-50/50 text-left transition cursor-pointer"
                >
                  <p className="font-bold text-slate-900">Dashboard</p>
                  <span className="text-[10px] text-slate-400">Ringkasan</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('pos');
                    onClose();
                  }}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-[#00A876] hover:bg-teal-50/50 text-left transition cursor-pointer"
                >
                  <p className="font-bold text-slate-900">Kasir POS</p>
                  <span className="text-[10px] text-slate-400">Transaksi</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('inventory');
                    onClose();
                  }}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-[#00A876] hover:bg-teal-50/50 text-left transition cursor-pointer"
                >
                  <p className="font-bold text-slate-900">Inventaris</p>
                  <span className="text-[10px] text-slate-400">Stok Barang</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('history');
                    onClose();
                  }}
                  className="p-2.5 rounded-xl border border-slate-200 hover:border-[#00A876] hover:bg-teal-50/50 text-left transition cursor-pointer"
                >
                  <p className="font-bold text-slate-900">Riwayat</p>
                  <span className="text-[10px] text-slate-400">Daftar Nota</span>
                </button>
              </div>
            </div>
          )}

          {/* Products Results */}
          {matchedProducts.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                Produk ({matchedProducts.length})
              </p>
              <div className="space-y-1.5">
                {matchedProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setActiveTab('inventory');
                      onClose();
                    }}
                    className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-teal-50 hover:border-[#00A876]/30 flex items-center justify-between transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#00A876]">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{p.name}</p>
                        <span className="text-[11px] text-slate-500 font-mono">
                          SKU: {p.sku} &bull; Stok: {p.stock} {p.unit}
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-[#00A876]">{formatRupiah(p.price)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Transactions Results */}
          {matchedSales.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
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
                    className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-teal-50 hover:border-[#00A876]/30 flex items-center justify-between transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-teal-600">
                        <Receipt className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 font-mono">
                          {s.invoiceNumber || s.id}
                        </p>
                        <span className="text-[11px] text-slate-500">
                          Pelanggan: {s.customerName || 'Umum'} &bull; {s.paymentMethod.toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <span className="font-bold text-slate-900">{formatRupiah(s.totalAmount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customers Results */}
          {matchedCustomers.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
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
                    className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-teal-50 hover:border-[#00A876]/30 flex items-center justify-between transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-teal-600">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{c.name}</p>
                        <span className="text-[11px] text-slate-500">{c.phone || c.email}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 bg-teal-100 text-teal-800 rounded font-bold text-[10px]">
                      {c.tier} ({c.points} Pts)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

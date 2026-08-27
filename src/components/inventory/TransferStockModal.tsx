import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';
import { X, ArrowRightLeft, Building2, Package, AlertCircle } from 'lucide-react';

interface TransferStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
}

export const TransferStockModal: React.FC<TransferStockModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const { stores, transferProductStock, products } = useStore();

  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [targetStoreId, setTargetStoreId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (product) {
        setSelectedProductId(product.id);
        const otherStore = stores.find((s) => s.id !== product.storeId);
        setTargetStoreId(otherStore ? otherStore.id : '');
      } else {
        const firstProd = products[0];
        setSelectedProductId(firstProd ? firstProd.id : '');
        const otherStore = stores.find((s) => s.id !== firstProd?.storeId);
        setTargetStoreId(otherStore ? otherStore.id : '');
      }
      setQuantity(1);
      setNotes('');
      setError(null);
    }
  }, [isOpen, product, products, stores]);

  if (!isOpen) return null;

  const currentProduct = products.find((p) => p.id === selectedProductId);
  const sourceStore = stores.find((s) => s.id === currentProduct?.storeId);
  const targetStore = stores.find((s) => s.id === targetStoreId);

  const availableStoresForTarget = stores.filter((s) => s.id !== currentProduct?.storeId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProduct || !targetStoreId || quantity <= 0) return;

    if (quantity > currentProduct.stock) {
      setError(`Jumlah transfer melebihi stok yang tersedia (${currentProduct.stock} ${currentProduct.unit}).`);
      return;
    }

    const success = transferProductStock(
      currentProduct.id,
      targetStoreId,
      quantity,
      notes.trim()
    );

    if (success) {
      onClose();
    } else {
      setError('Gagal memproses transfer stok antar cabang.');
    }
  };

  return (
    <div
      id="transfer-stock-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="transfer-stock-modal-card"
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-base">Transfer Stok Antar Cabang</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Product Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Package className="w-3.5 h-3.5 text-slate-400" />
              Pilih Produk &amp; Cabang Asal
            </label>
            <select
              value={selectedProductId}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                setError(null);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              {products.map((p) => {
                const s = stores.find((st) => st.id === p.storeId);
                return (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sku}) • {s?.name || 'Toko'} • Stok: {p.stock} {p.unit}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Source & Target Indicator */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-slate-500 block">Cabang Asal:</span>
              <span className="font-bold text-slate-900">{sourceStore?.name}</span>
            </div>
            <ArrowRightLeft className="w-4 h-4 text-indigo-500" />
            <div className="text-right">
              <span className="text-[10px] text-slate-500 block">Stok Tersedia:</span>
              <span className="font-black text-indigo-600">
                {currentProduct?.stock || 0} {currentProduct?.unit}
              </span>
            </div>
          </div>

          {/* Target Branch */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              Cabang Tujuan Transfer *
            </label>
            <select
              required
              value={targetStoreId}
              onChange={(e) => {
                setTargetStoreId(e.target.value);
                setError(null);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">-- Pilih Cabang Tujuan --</option>
              {availableStoresForTarget.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Jumlah Unit yang Ditransfer *
            </label>
            <input
              type="number"
              min="1"
              max={currentProduct?.stock || 1}
              required
              value={quantity}
              onChange={(e) => {
                setQuantity(Number(e.target.value) || 0);
                setError(null);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Catatan / Surat Jalan Transfer (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Permintaan restock cabang mingguan"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!targetStoreId || quantity <= 0 || (currentProduct && quantity > currentProduct.stock)}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              Kirim Transfer Stok
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { Product } from '../../types';
import { X, PlusCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface RestockModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export const RestockModal: React.FC<RestockModalProps> = ({
  isOpen,
  onClose,
  product,
}) => {
  const { restockProduct } = useStore();
  const { toast } = useToast();

  const [additionalStock, setAdditionalStock] = useState<number>(10);
  const [note, setNote] = useState<string>('Restock dari supplier');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAdditionalStock(10);
      setNote('Restock dari supplier');
      setIsSuccess(false);
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const currentStock = product.stock;
  const newProjectedStock = currentStock + (Number(additionalStock) || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(additionalStock);
    if (qty <= 0) return;

    restockProduct(product.id, qty, note.trim() || 'Restock barang');
    toast.success(
      'Restock Berhasil',
      `+${qty} ${product.unit} ditambahkan ke "${product.name}". Total stok sekarang: ${newProjectedStock} ${product.unit}.`
    );
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 400);
  };

  return (
    <div
      id="restock-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="restock-modal-card"
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base">Restock &amp; Tambah Stok</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {isSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Stok berhasil ditambahkan dan dicatat di database!</span>
            </div>
          )}

          {/* Product Brief */}
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
            <img
              src={product.image}
              alt={product.name}
              className="w-12 h-12 rounded-lg object-cover border border-slate-200 shrink-0"
              referrerPolicy="no-referrer"
            />
            <div className="min-w-0">
              <h4 className="font-bold text-xs text-slate-900 truncate">{product.name}</h4>
              <p className="text-[11px] text-slate-500 font-mono">SKU: {product.sku}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[11px] text-slate-600">Stok Saat Ini:</span>
                <span
                  className={`text-xs font-bold ${
                    currentStock <= 10 ? 'text-amber-600' : 'text-emerald-700'
                  }`}
                >
                  {currentStock} {product.unit}
                </span>
                {currentStock <= 10 && (
                  <AlertTriangle className="w-3 h-3 text-amber-500 ml-0.5" />
                )}
              </div>
            </div>
          </div>

          {/* Input Quantity */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Jumlah Tambahan Stok ({product.unit}) *
            </label>
            <input
              type="number"
              min="1"
              id="restock-qty-input"
              value={additionalStock || ''}
              onChange={(e) => setAdditionalStock(Number(e.target.value) || 0)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-base font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
              autoFocus
              required
            />
            <div className="flex gap-2 mt-2">
              {[5, 10, 20, 50, 100].map((qty) => (
                <button
                  key={qty}
                  type="button"
                  onClick={() => setAdditionalStock(qty)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
                >
                  +{qty}
                </button>
              ))}
            </div>
          </div>

          {/* Note / Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Keterangan / Sumber Pasokan
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Pengiriman dari Distributor ABC"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Forecast Box */}
          <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-xs space-y-1">
            <div className="flex justify-between text-slate-600">
              <span>Stok Awal:</span>
              <span className="font-semibold">{currentStock} {product.unit}</span>
            </div>
            <div className="flex justify-between text-amber-800">
              <span>Tambahan Restock:</span>
              <span className="font-bold">+{additionalStock || 0} {product.unit}</span>
            </div>
            <div className="pt-1.5 border-t border-amber-200 flex justify-between font-extrabold text-slate-900">
              <span>Proyeksi Total Stok Baru:</span>
              <span className="text-amber-800 font-black">{newProjectedStock} {product.unit}</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              id="confirm-restock-btn"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Simpan Tambahan Stok</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

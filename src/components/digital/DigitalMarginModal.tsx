import React, { useState, useEffect } from 'react';
import { DigitalProduct } from '../../types';
import { useToast } from '../../context/ToastContext';
import { formatRupiah } from '../../utils/formatters';
import { Tag, X, Check, ArrowRight, TrendingUp } from 'lucide-react';

interface DigitalMarginModalProps {
  product: DigitalProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdatePrice: (productId: string, newSellingPrice: number) => void;
}

export const DigitalMarginModal: React.FC<DigitalMarginModalProps> = ({
  product,
  isOpen,
  onClose,
  onUpdatePrice,
}) => {
  const { toast, confirm: confirmModal } = useToast();
  const [sellingPrice, setSellingPrice] = useState<number>(() => product?.sellingPrice || 0);
  const [sellingPriceStr, setSellingPriceStr] = useState<string>(() => product?.sellingPrice.toString() || '0');
  const [isSaved, setIsSaved] = useState(false);

  React.useEffect(() => {
    if (product) {
      setSellingPrice(product.sellingPrice);
      setSellingPriceStr(product.sellingPrice.toString());
      setIsSaved(false);
    }
  }, [product]);

  if (!isOpen || !product) return null;

  const costPrice = product.costPrice;
  const adminFee = product.adminFee || 0;
  const currentMargin = Math.max(0, sellingPrice - costPrice);
  const marginPercentage = costPrice > 0 ? ((currentMargin / costPrice) * 100).toFixed(1) : '0';

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    const num = Number(raw) || 0;
    setSellingPrice(num);
    setSellingPriceStr(raw);
  };

  const handleQuickMargin = (marginAmount: number) => {
    const newPrice = costPrice + marginAmount;
    setSellingPrice(newPrice);
    setSellingPriceStr(newPrice.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sellingPrice < costPrice) {
      const confirmed = await confirmModal({
        title: 'Harga Jual di Bawah Modal?',
        message: 'Harga jual yang dimasukkan lebih rendah dari harga modal (akan rugi). Tetap lanjutkan?',
        confirmText: 'Ya, Tetap Simpan',
        type: 'danger',
      });
      if (!confirmed) return;
    }
    onUpdatePrice(product.id, sellingPrice);
    toast.success('Harga Jual Diperbarui', `Harga jual "${product.name}" berhasil diubah.`);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                Atur Harga Jual & Margin
              </h3>
              <p className="text-xs text-slate-500 line-clamp-1">{product.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Modal & Cost Overview */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Harga Modal (HPP)
              </span>
              <span className="text-base font-black text-slate-800 dark:text-slate-100">
                {formatRupiah(costPrice)}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50">
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                Keuntungan / Untung
              </span>
              <div className="flex items-baseline gap-1">
                <span className="text-base font-black text-emerald-600 dark:text-emerald-400">
                  {formatRupiah(currentMargin)}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold">({marginPercentage}%)</span>
              </div>
            </div>
          </div>

          {/* Quick Preset Margin Buttons */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 block">
              Preset Margin Keuntungan Toko
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1000, 1500, 2000, 3000].map((mg) => (
                <button
                  key={mg}
                  type="button"
                  onClick={() => handleQuickMargin(mg)}
                  className="py-2 px-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 hover:text-[#00A876] dark:hover:text-[#00A876] transition cursor-pointer border border-transparent hover:border-emerald-300"
                >
                  +{formatRupiah(mg)}
                </button>
              ))}
            </div>
          </div>

          {/* New Selling Price Input */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
              Harga Jual ke Pelanggan (Rp)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                Rp
              </span>
              <input
                type="text"
                value={sellingPriceStr ? Number(sellingPriceStr).toLocaleString('id-ID') : ''}
                onChange={handlePriceChange}
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-base font-bold focus:outline-hidden focus:ring-2 focus:ring-[#00A876]"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="w-2/3 py-3 rounded-2xl bg-[#00A876] hover:bg-[#009267] text-white text-xs font-black shadow-lg shadow-[#00A876]/25 transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSaved ? <Check className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
              <span>{isSaved ? 'Tersimpan!' : 'Simpan Harga Jual'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

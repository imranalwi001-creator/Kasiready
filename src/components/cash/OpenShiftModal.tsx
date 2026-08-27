import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatRupiah } from '../../utils/formatters';
import {
  Coins,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Store as StoreIcon,
  User,
  Info,
} from 'lucide-react';

interface OpenShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const QUICK_FLOAT_OPTIONS = [100000, 200000, 300000, 500000, 1000000];

export const OpenShiftModal: React.FC<OpenShiftModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentShift, openShift, activeStore, currentUser } = useStore();
  const [openingFloat, setOpeningFloat] = useState<number>(
    currentShift ? currentShift.openingFloat : 300000
  );
  const [notes, setNotes] = useState<string>(
    currentShift?.notes || 'Modal awal kasir untuk uang kembalian'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (openingFloat < 0) {
      alert('Modal awal tidak boleh negatif.');
      return;
    }

    setIsSubmitting(true);
    try {
      openShift(openingFloat, notes);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Gagal membuka shift kasir.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                {currentShift ? 'Atur Ulang Modal Kas Awal' : 'Buka Kasir & Input Modal Awal'}
              </h2>
              <p className="text-xs text-slate-300">
                Pencatatan dana awal (cash float) uang kembalian di laci
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Active Store & Cashier Info */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div className="flex items-center gap-2">
              <StoreIcon className="w-4 h-4 text-indigo-600 shrink-0" />
              <div className="truncate">
                <span className="text-slate-400 block text-[10px] font-medium">Cabang Toko</span>
                <span className="font-bold text-slate-800 truncate block">
                  {activeStore?.name || 'Toko Pusat'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="truncate">
                <span className="text-slate-400 block text-[10px] font-medium">Kasir Bertugas</span>
                <span className="font-bold text-slate-800 truncate block">
                  {currentUser?.name || 'Kasir'}
                </span>
              </div>
            </div>
          </div>

          {/* Nominal Input */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Nominal Modal Awal (Cash Float) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-sm">
                Rp
              </div>
              <input
                type="number"
                min={0}
                step={5000}
                required
                value={openingFloat || ''}
                onChange={(e) => setOpeningFloat(Number(e.target.value))}
                placeholder="0"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl text-slate-900 font-mono font-bold text-lg outline-none transition"
              />
            </div>
            <div className="mt-2 text-xs text-indigo-700 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Terbilang: <span className="font-bold">{formatRupiah(openingFloat || 0)}</span>
            </div>
          </div>

          {/* Quick Amount Chips */}
          <div>
            <span className="block text-[11px] font-semibold text-slate-500 mb-1.5">
              Pilihan Nominal Cepat:
            </span>
            <div className="flex flex-wrap gap-2">
              {QUICK_FLOAT_OPTIONS.map((amt) => (
                <button
                  type="button"
                  key={amt}
                  onClick={() => setOpeningFloat(amt)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    openingFloat === amt
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {formatRupiah(amt)}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Catatan Pecahan Uang / Keterangan
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Pecahan 50rb (4x), 20rb (4x), 10rb (2x)"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 rounded-xl text-xs text-slate-800 outline-none transition"
            />
          </div>

          {/* Helper notice */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              Modal kas awal akan otomatis dipisahkan dari omset transaksi. Sistem akan menggunakan nominal ini untuk menghitung total saldo kas fisik yang wajib ada di laci kasir saat tutup buku harian.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold rounded-xl text-xs transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-600/30 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{currentShift ? 'Perbarui Modal Awal' : 'Buka Shift Kasir'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

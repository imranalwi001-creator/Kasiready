import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { CashExpense, ExpenseCategory, ExpensePaymentMethod } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import {
  TrendingDown,
  X,
  CheckCircle2,
  Receipt,
  Truck,
  Coffee,
  ShoppingBag,
  Zap,
  Wrench,
  HelpCircle,
  Banknote,
  CreditCard,
  Calendar,
  User,
  Store as StoreIcon,
} from 'lucide-react';

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  editExpense?: CashExpense | null;
  onSuccess?: () => void;
}

const EXPENSE_CATEGORIES: {
  id: ExpenseCategory;
  label: string;
  desc: string;
  icon: any;
  color: string;
}[] = [
  {
    id: 'supplies',
    label: 'Perlengkapan Toko',
    desc: 'Plastik kresek, kertas struk thermal, lakban, ATK',
    icon: ShoppingBag,
    color: 'text-amber-600 bg-amber-50 border-amber-200',
  },
  {
    id: 'meal',
    label: 'Uang Makan / Konsumsi',
    desc: 'Makan kasir, air galon, snack shift',
    icon: Coffee,
    color: 'text-orange-600 bg-orange-50 border-orange-200',
  },
  {
    id: 'transport',
    label: 'Transport & Ongkir',
    desc: 'Bensin operasional, kurir pengiriman, parkir',
    icon: Truck,
    color: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  {
    id: 'utilities',
    label: 'Utilitas & Tagihan',
    desc: 'Token listrik, pulsa data, PDAM, iuran toko',
    icon: Zap,
    color: 'text-purple-600 bg-purple-50 border-purple-200',
  },
  {
    id: 'restock_daily',
    label: 'Belanja Stok Harian',
    desc: 'Kulakan cepat / beli stok mendesak',
    icon: Receipt,
    color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  },
  {
    id: 'maintenance',
    label: 'Perbaikan & Kebersihan',
    desc: 'Beli sabun pel, perbaikan alat kasir',
    icon: Wrench,
    color: 'text-teal-600 bg-teal-50 border-teal-200',
  },
  {
    id: 'other',
    label: 'Pengeluaran Lainnya',
    desc: 'Biaya tak terduga lainnya',
    icon: HelpCircle,
    color: 'text-slate-600 bg-slate-100 border-slate-200',
  },
];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({
  isOpen,
  onClose,
  editExpense,
  onSuccess,
}) => {
  const { addExpense, updateExpense, activeStore, currentUser } = useStore();

  const [amount, setAmount] = useState<number>(editExpense ? editExpense.amount : 0);
  const [category, setCategory] = useState<ExpenseCategory>(
    editExpense ? editExpense.category : 'supplies'
  );
  const [description, setDescription] = useState<string>(
    editExpense ? editExpense.description : ''
  );
  const [paymentMethod, setPaymentMethod] = useState<ExpensePaymentMethod>(
    editExpense ? editExpense.paymentMethod : 'cash'
  );
  const [receiptNumber, setReceiptNumber] = useState<string>(
    editExpense?.receiptNumber || ''
  );
  const [notes, setNotes] = useState<string>(editExpense?.notes || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) {
      alert('Masukkan nominal pengeluaran yang valid.');
      return;
    }
    if (!description.trim()) {
      alert('Harap isi keperluan / deskripsi pengeluaran.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editExpense) {
        updateExpense(editExpense.id, {
          amount,
          category,
          description: description.trim(),
          paymentMethod,
          receiptNumber: receiptNumber.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      } else {
        addExpense({
          storeId: activeStore?.id || 'store-1',
          amount,
          category,
          description: description.trim(),
          paymentMethod,
          recordedBy: currentUser?.name || 'Kasir',
          recordedById: currentUser?.id,
          receiptNumber: receiptNumber.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      }

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan pengeluaran.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-rose-900 via-slate-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-300 shadow-inner">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                {editExpense ? 'Edit Pengeluaran Kas' : 'Catat Pengeluaran (Kas Keluar)'}
              </h2>
              <p className="text-xs text-slate-300">
                Pencatatan biaya operasional harian toko
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4.5 overflow-y-auto flex-1">
          {/* Store & User Context */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div className="flex items-center gap-2">
              <StoreIcon className="w-4 h-4 text-slate-500 shrink-0" />
              <div className="truncate">
                <span className="text-slate-400 block text-[10px]">Lokasi Cabang</span>
                <span className="font-bold text-slate-800 truncate block">
                  {activeStore?.name || 'Toko Pusat'}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-slate-500 shrink-0" />
              <div className="truncate">
                <span className="text-slate-400 block text-[10px]">Dicatat Oleh</span>
                <span className="font-bold text-slate-800 truncate block">
                  {currentUser?.name || 'Kasir'}
                </span>
              </div>
            </div>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nominal Pengeluaran <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-bold text-sm">
                Rp
              </div>
              <input
                type="number"
                min={500}
                step={500}
                required
                value={amount || ''}
                onChange={(e) => setAmount(Number(e.target.value))}
                placeholder="0"
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-300 focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-100 rounded-xl text-slate-900 font-mono font-bold text-lg outline-none transition"
              />
            </div>
            {amount > 0 && (
              <div className="mt-1.5 text-xs text-rose-700 font-semibold">
                Terbilang: <span className="font-bold">{formatRupiah(amount)}</span>
              </div>
            )}
          </div>

          {/* Payment Source */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Sumber Dana Pembayaran <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                className={`p-3 rounded-xl border flex items-center gap-3 transition cursor-pointer text-left ${
                  paymentMethod === 'cash'
                    ? 'border-emerald-500 bg-emerald-50/50 ring-2 ring-emerald-500/20 text-emerald-900'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Banknote className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-xs block">Kas Tunai (Laci)</span>
                  <span className="text-[10px] text-slate-500 block truncate">
                    Memotong saldo fisik di laci
                  </span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('transfer')}
                className={`p-3 rounded-xl border flex items-center gap-3 transition cursor-pointer text-left ${
                  paymentMethod === 'transfer'
                    ? 'border-indigo-500 bg-indigo-50/50 ring-2 ring-indigo-500/20 text-indigo-900'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-xs block">Transfer Bank</span>
                  <span className="text-[10px] text-slate-500 block truncate">
                    Rekening / Petty Cash Bank
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Kategori Pos Pengeluaran <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {EXPENSE_CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                      isSelected
                        ? `${cat.color} font-bold ring-2 ring-indigo-500/30`
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs block truncate leading-tight">{cat.label}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Deskripsi / Keperluan <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Beli Kantong Plastik Sedang 3 Pack di Toko Sebelah"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 focus:bg-white focus:border-rose-500 focus:ring-2 focus:ring-rose-100 rounded-xl text-xs text-slate-800 outline-none transition"
            />
          </div>

          {/* Receipt Number & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                No. Nota / Bon Bukti (Opsional)
              </label>
              <input
                type="text"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                placeholder="Contoh: BON-0982"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white rounded-lg text-xs outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Catatan Tambahan (Opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan persetujuan / keterangan"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:bg-white rounded-lg text-xs outline-none"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
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
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-md shadow-rose-600/30 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{editExpense ? 'Simpan Perubahan' : 'Simpan Kas Keluar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

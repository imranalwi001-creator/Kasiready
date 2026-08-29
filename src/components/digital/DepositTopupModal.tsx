import React, { useState } from 'react';
import { formatRupiah } from '../../utils/formatters';
import { Wallet, X, Check, ArrowUpRight, ShieldCheck } from 'lucide-react';

interface DepositTopupModalProps {
  currentBalance: number;
  isOpen: boolean;
  onClose: () => void;
  onTopUp: (amount: number, note?: string) => void;
}

const QUICK_AMOUNTS = [100000, 250000, 500000, 1000000, 2000000, 5000000];

export const DepositTopupModal: React.FC<DepositTopupModalProps> = ({
  currentBalance,
  isOpen,
  onClose,
  onTopUp,
}) => {
  const [amount, setAmount] = useState<number>(500000);
  const [customAmountStr, setCustomAmountStr] = useState<string>('500000');
  const [note, setNote] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleQuickSelect = (val: number) => {
    setAmount(val);
    setCustomAmountStr(val.toString());
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    const num = Number(raw) || 0;
    setAmount(num);
    setCustomAmountStr(raw);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;
    onTopUp(amount, note || 'Top Up Saldo Deposit Server PPOB');
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-[#00A876]">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                Isi Saldo Modal Deposit
              </h3>
              <p className="text-xs text-slate-500">Saldo saat ini: {formatRupiah(currentBalance)}</p>
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

        {isSuccess ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-[#00A876] flex items-center justify-center animate-bounce">
              <Check className="w-8 h-8" />
            </div>
            <h4 className="text-lg font-black text-slate-900 dark:text-slate-100">Top Up Berhasil!</h4>
            <p className="text-xs text-slate-500">
              Saldo modal deposit berhasil ditambahkan sebesar {formatRupiah(amount)}.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Quick Nominal Buttons */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 block">
                Pilih Nominal Cepat
              </label>
              <div className="grid grid-cols-3 gap-2">
                {QUICK_AMOUNTS.map((val) => {
                  const isSelected = amount === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleQuickSelect(val)}
                      className={`py-2.5 px-3 rounded-2xl text-xs font-bold transition cursor-pointer border ${
                        isSelected
                          ? 'bg-[#00A876] text-white border-[#00A876] shadow-sm shadow-[#00A876]/30'
                          : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {formatRupiah(val)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Nominal Input */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                Atau Masukkan Nominal Lain (Rp)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                  Rp
                </span>
                <input
                  type="text"
                  value={customAmountStr ? Number(customAmountStr).toLocaleString('id-ID') : ''}
                  onChange={handleCustomChange}
                  placeholder="0"
                  className="w-full pl-12 pr-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-base font-bold focus:outline-hidden focus:ring-2 focus:ring-[#00A876]"
                />
              </div>
            </div>

            {/* Catatan / Keterangan */}
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                Catatan / Sumber Dana (Opsional)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Contoh: Transfer Bank BCA / Kas Toko"
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-[#00A876]"
              />
            </div>

            {/* Information Notice */}
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#00A876] shrink-0 mt-0.5" />
              <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">
                Saldo deposit digunakan sebagai modal transaksi pulsa, paket data, PLN, dan PPOB. Setiap transaksi sukses akan memotong saldo sesuai HPP (Harga Modal).
              </p>
            </div>

            {/* Submit button */}
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
                disabled={amount <= 0}
                className="w-2/3 py-3 rounded-2xl bg-[#00A876] hover:bg-[#009267] disabled:opacity-50 text-white text-xs font-black shadow-lg shadow-[#00A876]/25 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Tambah Saldo Deposit</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

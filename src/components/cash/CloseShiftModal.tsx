import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { CashShift } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import {
  Lock,
  X,
  CheckCircle2,
  AlertTriangle,
  Calculator,
  Coins,
  ArrowDownCircle,
  ArrowUpCircle,
  HelpCircle,
  FileText,
  Clock,
  User,
  Store as StoreIcon,
} from 'lucide-react';

interface CloseShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  shiftToClose?: CashShift | null;
  onClosedSuccess?: (closedShift: CashShift) => void;
}

const DENOMINATIONS = [
  { value: 100000, label: 'Rp 100.000 (Seratus Ribu)' },
  { value: 50000, label: 'Rp 50.000 (Lima Puluh Ribu)' },
  { value: 20000, label: 'Rp 20.000 (Dua Puluh Ribu)' },
  { value: 10000, label: 'Rp 10.000 (Sepuluh Ribu)' },
  { value: 5000, label: 'Rp 5.000 (Lima Ribu)' },
  { value: 2000, label: 'Rp 2.000 (Dua Ribu)' },
  { value: 1000, label: 'Rp 1.000 (Seribu / Koin)' },
];

export const CloseShiftModal: React.FC<CloseShiftModalProps> = ({
  isOpen,
  onClose,
  shiftToClose,
  onClosedSuccess,
}) => {
  const {
    currentShift,
    closeShift,
    getDailyCashSummary,
    activeStore,
    currentUser,
  } = useStore();

  const activeTargetShift = shiftToClose || currentShift;
  const targetDate = activeTargetShift?.date || new Date().toISOString().split('T')[0];
  const targetStoreId = activeTargetShift?.storeId || activeStore?.id || 'store-1';

  // Live calculated summary
  const summary = useMemo(() => {
    return getDailyCashSummary(targetDate, targetStoreId);
  }, [getDailyCashSummary, targetDate, targetStoreId]);

  const [useCalculator, setUseCalculator] = useState(true);
  const [denomCounts, setDenomCounts] = useState<Record<number, number>>({
    100000: 0,
    50000: 0,
    20000: 0,
    10000: 0,
    5000: 0,
    2000: 0,
    1000: 0,
  });
  const [customCoins, setCustomCoins] = useState<number>(0);
  const [directActualCash, setDirectActualCash] = useState<number>(summary.expectedCashInDrawer);
  const [notes, setNotes] = useState<string>('Tutup buku shift harian kasir.');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Calculate actual cash from denominations or direct input
  const calculatedActualCash = useMemo(() => {
    if (!useCalculator) return directActualCash;
    let sum = customCoins || 0;
    Object.entries(denomCounts).forEach(([val, count]) => {
      const parsedCount = typeof count === 'number' ? count : Number(count) || 0;
      sum += Number(val) * parsedCount;
    });
    return sum;
  }, [useCalculator, denomCounts, customCoins, directActualCash]);

  const expectedCash = summary.expectedCashInDrawer;
  const difference = calculatedActualCash - expectedCash;

  if (!isOpen || !activeTargetShift) return null;

  const handleDenomChange = (val: number, countStr: string) => {
    const count = parseInt(countStr, 10) || 0;
    setDenomCounts((prev) => ({
      ...prev,
      [val]: Math.max(0, count),
    }));
  };

  const handleFillExact = () => {
    setDirectActualCash(expectedCash);
    // Simple greedy fill for denomination calculator
    let rem = expectedCash;
    const newCounts: Record<number, number> = {};
    [100000, 50000, 20000, 10000, 5000, 2000, 1000].forEach((den) => {
      const c = Math.floor(rem / den);
      newCounts[den] = c;
      rem -= c * den;
    });
    setDenomCounts(newCounts);
    setCustomCoins(rem);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (calculatedActualCash < 0) {
      alert('Total uang fisik tidak valid.');
      return;
    }

    if (
      difference !== 0 &&
      !window.confirm(
        `Terdapat selisih kas sebesar ${formatRupiah(Math.abs(difference))} (${
          difference > 0 ? 'LEBIH' : 'KURANG'
        }). Lanjutkan penutupan kasir?`
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      const closed = closeShift(activeTargetShift.id, calculatedActualCash, notes);
      if (onClosedSuccess) onClosedSuccess(closed);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Gagal melakukan penutupan kasir.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                Tutup Kasir & Rekonsiliasi Kas (Z-Report)
              </h2>
              <p className="text-xs text-slate-300">
                Hitung uang fisik di laci dan bandingkan dengan sistem
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

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 text-slate-800">
          {/* Shift Metadata */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Cabang Toko</span>
              <span className="font-bold text-slate-800 truncate block">
                {activeStore?.name || 'Toko Pusat'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Kasir Penutup</span>
              <span className="font-bold text-slate-800 truncate block">
                {currentUser?.name || 'Kasir'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Waktu Mulai Shift</span>
              <span className="font-bold text-slate-800 block">
                {new Date(activeTargetShift.startTime).toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          {/* Cash Breakdown Math */}
          <div className="bg-slate-900 text-white rounded-xl p-4 space-y-2.5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Rincian Kas Seharusnya di Laci (Expected Cash)
            </h3>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  Modal Awal Kasir (Opening Float)
                </span>
                <span className="font-mono font-bold text-slate-100">
                  {formatRupiah(summary.openingFloat)}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center gap-1.5">
                  <ArrowDownCircle className="w-3.5 h-3.5 text-emerald-400" />
                  (+) Pemasukan Penjualan Tunai
                </span>
                <span className="font-mono font-bold text-emerald-400">
                  +{formatRupiah(summary.cashSales)}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="flex items-center gap-1.5">
                  <ArrowUpCircle className="w-3.5 h-3.5 text-rose-400" />
                  (-) Pengeluaran Kas Operasional Tunai
                </span>
                <span className="font-mono font-bold text-rose-400">
                  -{formatRupiah(summary.cashExpenses)}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-700 flex justify-between items-center text-sm font-bold">
                <span className="text-slate-200">Total Kas Wajib di Laci:</span>
                <span className="text-emerald-300 font-mono text-base">
                  {formatRupiah(expectedCash)}
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 pt-1 flex justify-between">
              <span>* Penjualan Digital Non-Tunai (QRIS/EDC/Transfer):</span>
              <span className="font-mono text-slate-300 font-semibold">
                {formatRupiah(summary.digitalSales)}
              </span>
            </div>
          </div>

          {/* Physical Cash Input / Counter */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Calculator className="w-4 h-4 text-indigo-600" />
                Hitung Fisik Uang di Laci Kasir
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setUseCalculator(!useCalculator)}
                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold underline cursor-pointer"
                >
                  {useCalculator ? 'Mode Input Manual Total' : 'Mode Hitung Lembaran'}
                </button>
                <button
                  type="button"
                  onClick={handleFillExact}
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-1 rounded font-semibold transition cursor-pointer"
                >
                  Isi Pas Sesuai Sistem
                </button>
              </div>
            </div>

            {useCalculator ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                {DENOMINATIONS.map((den) => (
                  <div
                    key={den.value}
                    className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <div className="min-w-0 pr-2">
                      <span className="text-xs font-bold text-slate-800 block">
                        {formatRupiah(den.value)}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate font-mono">
                        = {formatRupiah(den.value * (denomCounts[den.value] || 0))}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <input
                        type="number"
                        min={0}
                        value={denomCounts[den.value] || ''}
                        onChange={(e) => handleDenomChange(den.value, e.target.value)}
                        placeholder="0"
                        className="w-16 px-2 py-1 bg-white border border-slate-300 rounded font-mono text-xs font-bold text-center outline-none focus:border-indigo-500"
                      />
                      <span className="text-[10px] text-slate-500 font-medium">lbr</span>
                    </div>
                  </div>
                ))}
                {/* Coins */}
                <div className="flex items-center justify-between p-2 bg-slate-50 border border-slate-200 rounded-lg sm:col-span-2">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Koin Pecahan Lainnya / Receh
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Total nominal uang koin gabungan
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-xs font-bold text-slate-400">Rp</span>
                    <input
                      type="number"
                      min={0}
                      value={customCoins || ''}
                      onChange={(e) => setCustomCoins(Number(e.target.value))}
                      placeholder="0"
                      className="w-28 px-2 py-1 bg-white border border-slate-300 rounded font-mono text-xs font-bold text-right outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Nominal Uang Fisik Riil di Laci (Rp)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-sm">
                    Rp
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={directActualCash || ''}
                    onChange={(e) => setDirectActualCash(Number(e.target.value))}
                    placeholder="0"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-mono text-lg font-bold text-slate-900 focus:bg-white focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Reconciliation Status Card */}
          <div
            className={`p-4 rounded-xl border flex items-center justify-between ${
              difference === 0
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : difference > 0
                ? 'bg-blue-50 border-blue-300 text-blue-950'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}
          >
            <div className="flex items-center gap-3">
              {difference === 0 ? (
                <div className="w-10 h-10 rounded-xl bg-emerald-200 text-emerald-800 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : (
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    difference > 0
                      ? 'bg-blue-200 text-blue-800'
                      : 'bg-rose-200 text-rose-800'
                  }`}
                >
                  <AlertTriangle className="w-5 h-5" />
                </div>
              )}
              <div>
                <div className="font-bold text-xs">
                  {difference === 0
                    ? 'Status Rekonsiliasi: PAS / SESUAI (BALANCE)'
                    : difference > 0
                    ? `Status Rekonsiliasi: KAS LEBIH (SURPLUS)`
                    : `Status Rekonsiliasi: KAS KURANG (DEFISIT)`}
                </div>
                <div className="text-[11px] opacity-80">
                  Fisik dihitung: {formatRupiah(calculatedActualCash)} | Sistem: {formatRupiah(expectedCash)}
                </div>
              </div>
            </div>

            <div className="text-right font-mono font-bold text-base">
              {difference === 0
                ? 'Rp 0'
                : `${difference > 0 ? '+' : '-'}${formatRupiah(Math.abs(difference))}`}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Catatan Penutupan Kasir
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Catatan penutupan / serah terima shift kasir..."
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:bg-white focus:border-indigo-500"
            />
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
              className="px-5 py-2.5 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Selesaikan Tutup Kasir (Z-Report)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

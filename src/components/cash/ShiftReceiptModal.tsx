import React, { useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { CashShift } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import {
  Printer,
  X,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Download,
  Share2,
  Calendar,
  Clock,
  Coins,
  Store as StoreIcon,
} from 'lucide-react';

interface ShiftReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  shift: CashShift | null;
}

export const ShiftReceiptModal: React.FC<ShiftReceiptModalProps> = ({
  isOpen,
  onClose,
  shift,
}) => {
  const { settings, stores, getDailyCashSummary } = useStore();
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !shift) return null;

  const storeObj = stores.find((s) => s.id === shift.storeId);
  const storeName = storeObj ? storeObj.name : settings.name;
  const storeAddress = storeObj ? storeObj.address : settings.address;
  const storePhone = storeObj ? storeObj.phone : settings.phone;

  const summary = getDailyCashSummary(shift.date, shift.storeId);
  const diff = shift.cashDifference ?? 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Top Action Bar */}
        <div className="px-5 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-xs tracking-wide">
              Berita Acara Rekap Kas (Z-Report)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white text-xs font-bold flex items-center gap-1.5 px-2.5 transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak</span>
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Thermal Receipt Canvas */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-100 flex justify-center">
          <div
            ref={printRef}
            className="w-full max-w-[340px] bg-white p-5 shadow-sm border border-slate-200 rounded-lg font-mono text-[11px] text-slate-800 space-y-3"
          >
            {/* Header */}
            <div className="text-center border-b border-dashed border-slate-400 pb-3">
              <h1 className="font-bold text-sm text-slate-950 uppercase">{storeName}</h1>
              <p className="text-[10px] text-slate-600 leading-tight">{storeAddress}</p>
              <p className="text-[10px] text-slate-600">Telp: {storePhone}</p>
              <div className="mt-2 inline-block px-2 py-0.5 bg-slate-900 text-white font-bold text-[10px] rounded">
                LAPORAN TUTUP KASIR (Z-REPORT)
              </div>
            </div>

            {/* Metadata */}
            <div className="space-y-0.5 border-b border-dashed border-slate-400 pb-2 text-[10px]">
              <div className="flex justify-between">
                <span className="text-slate-500">ID Shift:</span>
                <span className="font-bold">{shift.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tanggal:</span>
                <span>{shift.date}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Buka Shift:</span>
                <span>
                  {new Date(shift.startTime).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              {shift.endTime && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Tutup Shift:</span>
                  <span>
                    {new Date(shift.endTime).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Kasir:</span>
                <span className="font-bold">{shift.cashierName}</span>
              </div>
            </div>

            {/* Section 1: Modal Awal */}
            <div className="space-y-1 border-b border-dashed border-slate-400 pb-2">
              <div className="font-bold text-[11px] text-slate-900 uppercase">
                1. DANA MODAL AWAL
              </div>
              <div className="flex justify-between font-bold">
                <span>Modal Awal Kasir:</span>
                <span>{formatRupiah(shift.openingFloat)}</span>
              </div>
            </div>

            {/* Section 2: Pemasukan Transaksi */}
            <div className="space-y-1 border-b border-dashed border-slate-400 pb-2">
              <div className="font-bold text-[11px] text-slate-900 uppercase">
                2. HASIL PENJUALAN ({summary.salesCount} TRX)
              </div>
              <div className="flex justify-between">
                <span>(+) Penjualan Tunai (Cash):</span>
                <span className="font-bold">{formatRupiah(summary.cashSales)}</span>
              </div>
              <div className="flex justify-between">
                <span>(+) Penjualan Digital:</span>
                <span>{formatRupiah(summary.digitalSales)}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-950 pt-0.5 border-t border-slate-200">
                <span>Total Omset Penjualan:</span>
                <span>{formatRupiah(summary.grossSales)}</span>
              </div>
            </div>

            {/* Section 3: Pengeluaran Kas */}
            <div className="space-y-1 border-b border-dashed border-slate-400 pb-2">
              <div className="font-bold text-[11px] text-slate-900 uppercase">
                3. PENGELUARAN OPERASIONAL ({summary.expensesCount} POS)
              </div>
              <div className="flex justify-between">
                <span>(-) Kas Keluar Tunai:</span>
                <span className="font-bold">{formatRupiah(summary.cashExpenses)}</span>
              </div>
              <div className="flex justify-between">
                <span>(-) Pengeluaran Transfer:</span>
                <span>{formatRupiah(summary.nonCashExpenses)}</span>
              </div>
              <div className="flex justify-between font-bold text-rose-800 pt-0.5 border-t border-slate-200">
                <span>Total Pengeluaran:</span>
                <span>{formatRupiah(summary.totalExpenses)}</span>
              </div>
            </div>

            {/* Section 4: Rekonsiliasi Kas di Laci */}
            <div className="space-y-1 border-b border-dashed border-slate-400 pb-2 bg-slate-50 p-2 rounded">
              <div className="font-bold text-[11px] text-slate-900 uppercase">
                4. REKONSILIASI KAS LACI
              </div>
              <div className="flex justify-between">
                <span>Kas Seharusnya (Sistem):</span>
                <span className="font-bold">{formatRupiah(shift.expectedCash)}</span>
              </div>
              <div className="flex justify-between">
                <span>Uang Fisik Dihitung:</span>
                <span className="font-bold text-slate-900">
                  {formatRupiah(shift.actualCash ?? shift.expectedCash)}
                </span>
              </div>
              <div className="flex justify-between font-bold pt-1 border-t border-slate-300">
                <span>Selisih Kas:</span>
                <span
                  className={
                    diff === 0
                      ? 'text-emerald-700'
                      : diff > 0
                      ? 'text-blue-700'
                      : 'text-rose-700'
                  }
                >
                  {diff === 0 ? 'PAS (Rp 0)' : `${diff > 0 ? '+' : ''}${formatRupiah(diff)}`}
                </span>
              </div>
            </div>

            {/* Section 5: Laba Bersih Operasional */}
            <div className="space-y-1 border-b border-dashed border-slate-400 pb-2 text-[10px]">
              <div className="font-bold text-slate-900 uppercase">
                5. ESTIMASI LABA HARI INI
              </div>
              <div className="flex justify-between">
                <span>Laba Kotor Penjualan:</span>
                <span>{formatRupiah(summary.grossProfit)}</span>
              </div>
              <div className="flex justify-between font-bold text-emerald-800">
                <span>Laba Operasional Bersih:</span>
                <span>{formatRupiah(summary.netOperatingProfit)}</span>
              </div>
            </div>

            {/* Notes & Signatures */}
            {shift.notes && (
              <div className="text-[10px] text-slate-600 italic">
                Catatan: {shift.notes}
              </div>
            )}

            <div className="pt-4 grid grid-cols-2 gap-4 text-center text-[10px] text-slate-600">
              <div>
                <p>Kasir Bertugas</p>
                <div className="h-10"></div>
                <p className="font-bold border-t border-slate-400 pt-1">
                  ({shift.cashierName})
                </p>
              </div>
              <div>
                <p>Manager / Supervisor</p>
                <div className="h-10"></div>
                <p className="font-bold border-t border-slate-400 pt-1">
                  ({shift.closedBy || 'Supervisor'})
                </p>
              </div>
            </div>

            <div className="text-center text-[9px] text-slate-400 pt-2">
              *** Laporan dibuat otomatis oleh POS System ***
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 bg-white border-t border-slate-200 flex justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl transition cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};

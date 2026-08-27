import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatIndonesianDate, formatRupiah } from '../../utils/formatters';
import {
  Clock,
  X,
  Search,
  Filter,
  CheckCircle2,
  Package,
  Receipt,
  RotateCcw,
  Wallet,
  ShieldCheck,
  Building2,
} from 'lucide-react';

interface ActivityLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ActivityLogsModal: React.FC<ActivityLogsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { stockLogs, sales, cashShifts, cashExpenses, currentUser } = useStore();
  const [filterType, setFilterType] = useState<'all' | 'sales' | 'stock' | 'cash'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  // Combine and sort real activities
  const combinedActivities = useMemo(() => {
    const list: Array<{
      id: string;
      date: string;
      type: 'sale' | 'stock' | 'cash' | 'system';
      title: string;
      subtitle: string;
      actor: string;
      tagColor: string;
    }> = [];

    // Sales activities
    sales.forEach((s) => {
      list.push({
        id: `sale-${s.id}`,
        date: s.date,
        type: 'sale',
        title: `Transaksi Selesai #${s.invoiceNumber || s.id.slice(-6)}`,
        subtitle: `${s.items.length} item • Total: ${formatRupiah(s.totalAmount)} (${s.paymentMethod.toUpperCase()})`,
        actor: s.cashierName || 'Kasir',
        tagColor: 'bg-emerald-50 text-[#00A876] border-emerald-200',
      });
    });

    // Stock logs activities
    stockLogs.forEach((l) => {
      list.push({
        id: `stock-${l.id}`,
        date: l.date,
        type: 'stock',
        title: `Pembaruan Stok: ${l.productName}`,
        subtitle: `${l.note} (${l.previousStock} -> ${l.newStock} unit)`,
        actor: 'Admin Gudang',
        tagColor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      });
    });

    // Cash shift activities
    cashShifts.forEach((cs) => {
      list.push({
        id: `shift-${cs.id}`,
        date: cs.startTime,
        type: 'cash',
        title: `Buku Kas Shift Kasir: ${cs.cashierName}`,
        subtitle: `Modal Awal: ${formatRupiah(cs.openingFloat)} • Status: ${cs.status.toUpperCase()}`,
        actor: cs.cashierName,
        tagColor: 'bg-amber-50 text-amber-800 border-amber-200',
      });
    });

    // Sort descending by date
    return list.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [sales, stockLogs, cashShifts]);

  const filteredLogs = useMemo(() => {
    return combinedActivities
      .filter((item) => {
        if (filterType === 'sales') return item.type === 'sale';
        if (filterType === 'stock') return item.type === 'stock';
        if (filterType === 'cash') return item.type === 'cash';
        return true;
      })
      .filter((item) => {
        const match =
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.actor.toLowerCase().includes(searchQuery.toLowerCase());
        return match;
      });
  }, [combinedActivities, filterType, searchQuery]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#00A876] flex items-center justify-center text-white font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold">Activity Logs (Audit Trail)</h2>
              <p className="text-[11px] text-slate-400">Rekam jejak aktivitas penjualan, inventaris & kasir</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari log aktivitas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-[#00A876]"
            />
          </div>

          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 w-full sm:w-auto">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'sales', label: 'Penjualan' },
              { id: 'stock', label: 'Inventaris' },
              { id: 'cash', label: 'Buku Kas' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterType(tab.id as any)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition cursor-pointer ${
                  filterType === tab.id
                    ? 'bg-[#00A876] text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Logs List */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3">
          {filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              Tidak ada log aktivitas yang cocok dengan kriteria pencarian.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition flex items-start justify-between gap-4 shadow-2xs"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-bold text-slate-900">{log.title}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${log.tagColor}`}>
                      {log.type.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{log.subtitle}</p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1.5">
                    <span>Oleh: <strong>{log.actor}</strong></span>
                    <span>&bull;</span>
                    <span>{formatIndonesianDate(log.date)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Total: {filteredLogs.length} Aktivitas Tercatat</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

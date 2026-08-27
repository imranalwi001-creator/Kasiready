import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatIndonesianDate } from '../../utils/formatters';
import { X, History, ArrowDownRight, ArrowUpRight, Filter, Search } from 'lucide-react';

interface StockAuditLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StockAuditLogsModal: React.FC<StockAuditLogsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { stockLogs } = useStore();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'sale' | 'restock' | 'adjustment'>('all');

  if (!isOpen) return null;

  const filteredLogs = stockLogs.filter((log) => {
    const matchType = typeFilter === 'all' || log.type === typeFilter;
    const query = search.toLowerCase();
    const matchSearch =
      !query ||
      log.productName.toLowerCase().includes(query) ||
      log.sku.toLowerCase().includes(query) ||
      log.note.toLowerCase().includes(query);
    return matchType && matchSearch;
  });

  return (
    <div
      id="stock-logs-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="stock-logs-modal-card"
        className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-6"
      >
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-bold text-base">Riwayat Perubahan Stok (Audit Trail)</h3>
              <p className="text-[11px] text-slate-400">
                Catatan otomatis setiap penjualan, restock, dan penyesuaian barang
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[75vh] flex flex-col">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari nama produk, SKU, atau no nota..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              {(['all', 'sale', 'restock', 'adjustment'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer shrink-0 ${
                    typeFilter === t
                      ? 'bg-indigo-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {t === 'all'
                    ? 'Semua'
                    : t === 'sale'
                    ? 'Penjualan'
                    : t === 'restock'
                    ? 'Restock'
                    : 'Penyesuaian'}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl">
            {filteredLogs.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Tidak ada riwayat aktivitas stok yang tercatat.
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3">Waktu</th>
                    <th className="py-2.5 px-3">Produk</th>
                    <th className="py-2.5 px-3">Tipe</th>
                    <th className="py-2.5 px-3 text-center">Perubahan</th>
                    <th className="py-2.5 px-3 text-center">Stok Akhir</th>
                    <th className="py-2.5 px-3">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredLogs.map((log) => {
                    const isPositive = log.quantityChange > 0;
                    return (
                      <tr key={log.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                          {formatIndonesianDate(log.date)}
                        </td>
                        <td className="py-2.5 px-3">
                          <p className="font-bold text-slate-900">{log.productName}</p>
                          <p className="font-mono text-[10px] text-slate-400">{log.sku}</p>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                              log.type === 'sale'
                                ? 'bg-red-50 text-red-700 border border-red-200'
                                : log.type === 'restock'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-sky-50 text-sky-700 border border-sky-200'
                            }`}
                          >
                            {log.type === 'sale'
                              ? 'Penjualan'
                              : log.type === 'restock'
                              ? 'Restock'
                              : log.type === 'initial'
                              ? 'Stok Awal'
                              : 'Penyesuaian'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold">
                          <span
                            className={`inline-flex items-center gap-0.5 ${
                              isPositive ? 'text-emerald-700' : 'text-red-600'
                            }`}
                          >
                            {isPositive ? (
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowDownRight className="w-3.5 h-3.5" />
                            )}
                            {isPositive ? `+${log.quantityChange}` : log.quantityChange}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                          {log.newStock}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 text-[11px]">
                          {log.note}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

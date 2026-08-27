import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { CashExpense, CashShift, ExpenseCategory } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { OpenShiftModal } from './OpenShiftModal';
import { AddExpenseModal } from './AddExpenseModal';
import { CloseShiftModal } from './CloseShiftModal';
import { ShiftReceiptModal } from './ShiftReceiptModal';
import {
  Coins,
  TrendingDown,
  TrendingUp,
  Wallet,
  Lock,
  Plus,
  Printer,
  Calendar,
  Building2,
  Receipt,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Clock,
  User,
  ShoppingBag,
  Coffee,
  Truck,
  Zap,
  Wrench,
  HelpCircle,
  Banknote,
  CreditCard,
  Edit2,
  Trash2,
  Sparkles,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  Layers,
} from 'lucide-react';

export const CashDrawerPage: React.FC = () => {
  const {
    currentShift,
    cashShifts,
    cashExpenses,
    deleteExpense,
    getDailyCashSummary,
    stores,
    activeStoreId,
    setActiveStoreId,
    activeStore,
    currentUser,
  } = useStore();

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedStoreId, setSelectedStoreId] = useState<string>(activeStoreId || 'store-1');
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'expenses' | 'shifts'>('overview');

  // Modals state
  const [isOpenShiftModalOpen, setIsOpenShiftModalOpen] = useState(false);
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [selectedShiftForReceipt, setSelectedShiftForReceipt] = useState<CashShift | null>(null);
  const [expenseToEdit, setExpenseToEdit] = useState<CashExpense | null>(null);

  // Expense table search & filter
  const [expenseSearch, setExpenseSearch] = useState('');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>('all');

  // Calculate live daily summary for selected date and store
  const summary = useMemo(() => {
    return getDailyCashSummary(selectedDate, selectedStoreId);
  }, [getDailyCashSummary, selectedDate, selectedStoreId]);

  // Filtered expenses for date & store
  const filteredExpenses = useMemo(() => {
    return cashExpenses
      .filter((e) => {
        const matchesDate = e.date.startsWith(selectedDate);
        const matchesStore = selectedStoreId === 'all' || e.storeId === selectedStoreId;
        const matchesCategory =
          expenseCategoryFilter === 'all' || e.category === expenseCategoryFilter;
        const matchesSearch =
          !expenseSearch ||
          e.description.toLowerCase().includes(expenseSearch.toLowerCase()) ||
          e.recordedBy.toLowerCase().includes(expenseSearch.toLowerCase()) ||
          (e.receiptNumber && e.receiptNumber.toLowerCase().includes(expenseSearch.toLowerCase()));
        return matchesDate && matchesStore && matchesCategory && matchesSearch;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [cashExpenses, selectedDate, selectedStoreId, expenseCategoryFilter, expenseSearch]);

  // Filtered shifts history
  const filteredShifts = useMemo(() => {
    return cashShifts
      .filter((s) => {
        const matchesStore = selectedStoreId === 'all' || s.storeId === selectedStoreId;
        return matchesStore;
      })
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [cashShifts, selectedStoreId]);

  const handleDeleteExpense = (id: string, desc: string) => {
    if (window.confirm(`Hapus pencatatan pengeluaran "${desc}"?`)) {
      deleteExpense(id);
    }
  };

  const getCategoryBadge = (cat: ExpenseCategory) => {
    switch (cat) {
      case 'supplies':
        return { label: 'Perlengkapan', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'meal':
        return { label: 'Uang Makan', color: 'bg-orange-100 text-orange-800 border-orange-200' };
      case 'transport':
        return { label: 'Transport/Ongkir', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'utilities':
        return { label: 'Utilitas/Listrik', color: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'restock_daily':
        return { label: 'Belanja Stok', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'maintenance':
        return { label: 'Perbaikan', color: 'bg-teal-100 text-teal-800 border-teal-200' };
      default:
        return { label: 'Lain-lain', color: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  return (
    <div id="cash-drawer-dashboard" className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header & Filter Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Buku Kas & Rekap Shift Harian</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full">
                  Real-time Cash Flow
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                Pemisahan otomatis Modal Kas Awal, Pemasukan Penjualan, dan Pengeluaran Operasional
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls & Filters */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Store Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-300 px-3 py-1.5 rounded-xl text-xs font-semibold">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedStoreId}
              onChange={(e) => {
                setSelectedStoreId(e.target.value);
                if (e.target.value !== 'all') {
                  setActiveStoreId(e.target.value);
                }
              }}
              className="bg-transparent text-slate-800 outline-none cursor-pointer pr-1"
            >
              <option value="all">Semua Cabang Toko</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.isMain ? '(Pusat)' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Date Selector Quick Buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs">
            <button
              onClick={() => setSelectedDate(todayStr)}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                selectedDate === todayStr
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hari Ini
            </button>
            <button
              onClick={() => setSelectedDate(yesterdayStr)}
              className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                selectedDate === yesterdayStr
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kemarin
            </button>
            <div className="flex items-center pl-1">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs text-slate-700 font-semibold outline-none cursor-pointer"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <button
            onClick={() => {
              setExpenseToEdit(null);
              setIsAddExpenseModalOpen(true);
            }}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5 transition cursor-pointer"
          >
            <TrendingDown className="w-3.5 h-3.5" />
            <span>+ Catat Kas Keluar</span>
          </button>

          <button
            onClick={() => setIsOpenShiftModalOpen(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5 transition cursor-pointer"
          >
            <Coins className="w-3.5 h-3.5" />
            <span>{currentShift ? 'Atur Modal Awal' : 'Buka Kasir'}</span>
          </button>

          {currentShift && currentShift.status === 'open' && (
            <button
              onClick={() => setIsCloseShiftModalOpen(true)}
              className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5 transition cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tutup Kasir</span>
            </button>
          )}

          <button
            onClick={() => {
              // Open modal with dummy/current shift for printing today's summary
              const activeOrLatestShift: CashShift = currentShift || {
                id: `shift-rekap-${selectedDate}`,
                storeId: selectedStoreId,
                date: selectedDate,
                startTime: new Date().toISOString(),
                cashierId: currentUser?.id || 'cashier-1',
                cashierName: currentUser?.name || 'Kasir',
                openingFloat: summary.openingFloat,
                cashSales: summary.cashSales,
                nonCashSales: summary.digitalSales,
                cashExpenses: summary.cashExpenses,
                expectedCash: summary.expectedCashInDrawer,
                actualCash: summary.actualCashInDrawer ?? summary.expectedCashInDrawer,
                cashDifference: summary.cashDifference ?? 0,
                status: 'closed',
              };
              setSelectedShiftForReceipt(activeOrLatestShift);
              setIsReceiptModalOpen(true);
            }}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 flex items-center gap-1.5 transition cursor-pointer"
            title="Cetak Berita Acara Rekap Kas Harian"
          >
            <Printer className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cetak Struk Z-Report</span>
          </button>
        </div>
      </div>

      {/* Active Cashier Shift Banner */}
      {currentShift ? (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-4.5 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4 border border-indigo-900/50">
          <div className="flex items-center gap-3.5">
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                  Shift Kasir Sedang Aktif (BUKA)
                </span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full font-semibold">
                  Mulai {new Date(currentShift.startTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-200 mt-0.5">
                Kasir: <span className="text-white font-bold">{currentShift.cashierName}</span> • Cabang:{' '}
                <span className="text-white font-bold">{activeStore?.name}</span> • Modal Awal Kas:{' '}
                <span className="text-amber-300 font-bold font-mono">{formatRupiah(currentShift.openingFloat)}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-medium">
                Estimasi Kas Fisik Saat Ini
              </span>
              <span className="text-base font-bold font-mono text-emerald-300">
                {formatRupiah(summary.expectedCashInDrawer)}
              </span>
            </div>
            <button
              onClick={() => setIsCloseShiftModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Tutup Kasir (Shift)</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between gap-4 text-amber-900">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-200 text-amber-800 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-xs">Belum Ada Shift Kasir Aktif</h4>
              <p className="text-[11px] text-amber-800/80">
                Klik tombol "Buka Kasir" untuk menginput modal kas awal uang kembalian laci sebelum transaksi.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsOpenShiftModalOpen(true)}
            className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer shrink-0"
          >
            Buka Kasir Sekarang
          </button>
        </div>
      )}

      {/* 4 Key Mathematical Metric Cards (High Contrast & Clear Differentiation) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Modal Awal */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-indigo-300 transition group">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              1. Modal Kas Awal
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-xl sm:text-2xl font-bold text-slate-900">
            {formatRupiah(summary.openingFloat)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>Uang Kembalian Laci</span>
            <button
              onClick={() => setIsOpenShiftModalOpen(true)}
              className="text-indigo-600 hover:text-indigo-800 font-bold cursor-pointer"
            >
              Ubah Modal
            </button>
          </div>
        </div>

        {/* Card 2: Hasil Penjualan */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-emerald-300 transition group">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              2. Hasil Penjualan ({summary.salesCount} Trx)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-xl sm:text-2xl font-bold text-emerald-600">
            {formatRupiah(summary.grossSales)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>Tunai: <b className="text-slate-800">{formatRupiah(summary.cashSales)}</b></span>
            <span>Digital: <b className="text-slate-800">{formatRupiah(summary.digitalSales)}</b></span>
          </div>
        </div>

        {/* Card 3: Pengeluaran Operasional */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-rose-300 transition group">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              3. Kas Keluar ({summary.expensesCount} Pos)
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-xl sm:text-2xl font-bold text-rose-600">
            {formatRupiah(summary.totalExpenses)}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between border-t border-slate-100 pt-2">
            <span>Kas Laci: <b className="text-slate-800">{formatRupiah(summary.cashExpenses)}</b></span>
            <span>Transfer: <b className="text-slate-800">{formatRupiah(summary.nonCashExpenses)}</b></span>
          </div>
        </div>

        {/* Card 4: Kas di Laci Kasir (Expected Cash) */}
        <div className="bg-gradient-to-tr from-slate-900 to-indigo-950 text-white rounded-2xl p-5 border border-indigo-900/50 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
              4. Saldo Kas di Laci
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <div className="font-mono text-xl sm:text-2xl font-bold text-emerald-300">
            {formatRupiah(summary.expectedCashInDrawer)}
          </div>
          <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between border-t border-slate-800 pt-2 font-mono">
            <span>Modal + Tunai - Kas Keluar</span>
            <span className="text-emerald-400 font-bold">Wajib Ada di Laci</span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveSubTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'overview'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Arus Kas & Analisis Laba Harian</span>
        </button>

        <button
          onClick={() => setActiveSubTab('expenses')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer relative ${
            activeSubTab === 'expenses'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <TrendingDown className="w-4 h-4" />
          <span>Buku Pengeluaran Operasional</span>
          {filteredExpenses.length > 0 && (
            <span className="text-[10px] bg-rose-500 text-white font-bold px-1.5 py-0.2 rounded-full">
              {filteredExpenses.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('shifts')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
            activeSubTab === 'shifts'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Riwayat Shift & Rekonsiliasi Kas</span>
        </button>
      </div>

      {/* SUB-TAB 1: OVERVIEW & CASH FLOW ANALYSIS */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Detailed Financial Calculation Formula Banner */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Formula Pemisahan & Rekonsiliasi Kas Harian ({selectedDate})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-center">
              {/* Step 1 */}
              <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-amber-800 block mb-1">
                  Modal Awal (A)
                </span>
                <span className="font-mono text-base font-bold text-amber-900 block">
                  {formatRupiah(summary.openingFloat)}
                </span>
                <span className="text-[10px] text-amber-700/80 block mt-1">Uang kembalian laci</span>
              </div>

              {/* Step 2 */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-emerald-800 block mb-1">
                  (+) Penjualan Tunai (B)
                </span>
                <span className="font-mono text-base font-bold text-emerald-900 block">
                  +{formatRupiah(summary.cashSales)}
                </span>
                <span className="text-[10px] text-emerald-700/80 block mt-1">Masuk ke laci kasir</span>
              </div>

              {/* Step 3 */}
              <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-rose-800 block mb-1">
                  (-) Kas Keluar Tunai (C)
                </span>
                <span className="font-mono text-base font-bold text-rose-900 block">
                  -{formatRupiah(summary.cashExpenses)}
                </span>
                <span className="text-[10px] text-rose-700/80 block mt-1">Diambil dari laci kas</span>
              </div>

              {/* Step 4 */}
              <div className="p-4 bg-slate-900 text-white rounded-xl">
                <span className="text-[10px] uppercase font-bold text-indigo-300 block mb-1">
                  (=) Kas Seharusnya di Laci (A + B - C)
                </span>
                <span className="font-mono text-base font-bold text-emerald-300 block">
                  {formatRupiah(summary.expectedCashInDrawer)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-1">Saldo fisik wajib laci</span>
              </div>

              {/* Step 5 */}
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-indigo-800 block mb-1">
                  Laba Bersih Operasional
                </span>
                <span className="font-mono text-base font-bold text-indigo-900 block">
                  {formatRupiah(summary.netOperatingProfit)}
                </span>
                <span className="text-[10px] text-indigo-700/80 block mt-1">Laba Kotor - Biaya Kas</span>
              </div>
            </div>
          </div>

          {/* Breakdown Grids */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Channel Breakdown */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  Rincian Penerimaan Penjualan
                </h3>
                <span className="text-xs font-mono font-bold text-slate-900">
                  {formatRupiah(summary.grossSales)}
                </span>
              </div>

              <div className="space-y-3">
                {/* Cash Sales */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="flex items-center gap-1.5 text-slate-700">
                      <Banknote className="w-3.5 h-3.5 text-emerald-600" />
                      Penjualan Tunai (Cash)
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatRupiah(summary.cashSales)} (
                      {summary.grossSales > 0
                        ? Math.round((summary.cashSales / summary.grossSales) * 100)
                        : 0}
                      %)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          summary.grossSales > 0
                            ? (summary.cashSales / summary.grossSales) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Digital / Non-Cash Sales */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="flex items-center gap-1.5 text-slate-700">
                      <CreditCard className="w-3.5 h-3.5 text-indigo-600" />
                      Penjualan Digital (QRIS / EDC / Transfer)
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatRupiah(summary.digitalSales)} (
                      {summary.grossSales > 0
                        ? Math.round((summary.digitalSales / summary.grossSales) * 100)
                        : 0}
                      %)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          summary.grossSales > 0
                            ? (summary.digitalSales / summary.grossSales) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600">
                Pemasukan digital langsung masuk ke rekening bank/e-wallet merchant dan tidak mempengaruhi uang fisik di laci kasir.
              </div>
            </div>

            {/* Expenses Channel Breakdown */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-rose-600" />
                  Rincian Pengeluaran Operasional
                </h3>
                <span className="text-xs font-mono font-bold text-rose-600">
                  {formatRupiah(summary.totalExpenses)}
                </span>
              </div>

              <div className="space-y-3">
                {/* Cash Expenses */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="flex items-center gap-1.5 text-slate-700">
                      <Banknote className="w-3.5 h-3.5 text-rose-600" />
                      Kas Keluar Tunai (Laci)
                    </span>
                    <span className="font-mono font-bold text-rose-600">
                      {formatRupiah(summary.cashExpenses)} (
                      {summary.totalExpenses > 0
                        ? Math.round((summary.cashExpenses / summary.totalExpenses) * 100)
                        : 0}
                      %)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-rose-500 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          summary.totalExpenses > 0
                            ? (summary.cashExpenses / summary.totalExpenses) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                {/* Transfer Expenses */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="flex items-center gap-1.5 text-slate-700">
                      <CreditCard className="w-3.5 h-3.5 text-blue-600" />
                      Pengeluaran Transfer / Rekening
                    </span>
                    <span className="font-mono font-bold text-slate-900">
                      {formatRupiah(summary.nonCashExpenses)} (
                      {summary.totalExpenses > 0
                        ? Math.round((summary.nonCashExpenses / summary.totalExpenses) * 100)
                        : 0}
                      %)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-blue-500 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          summary.totalExpenses > 0
                            ? (summary.nonCashExpenses / summary.totalExpenses) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600 flex justify-between items-center">
                <span>Total item pengeluaran dicatat:</span>
                <span className="font-bold text-slate-900">{summary.expensesCount} Transaksi Pengeluaran</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: EXPENSES TABLE */}
      {activeSubTab === 'expenses' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Table Toolbar */}
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={expenseSearch}
                  onChange={(e) => setExpenseSearch(e.target.value)}
                  placeholder="Cari keperluan, nota, atau kasir..."
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={expenseCategoryFilter}
                onChange={(e) => setExpenseCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-none font-medium cursor-pointer"
              >
                <option value="all">Semua Kategori</option>
                <option value="supplies">Perlengkapan Toko</option>
                <option value="meal">Uang Makan / Minum</option>
                <option value="transport">Transport / Ongkir</option>
                <option value="utilities">Utilitas / Listrik</option>
                <option value="restock_daily">Belanja Stok Harian</option>
                <option value="maintenance">Perbaikan / Kebersihan</option>
                <option value="other">Lain-lain</option>
              </select>
            </div>

            <button
              onClick={() => {
                setExpenseToEdit(null);
                setIsAddExpenseModalOpen(true);
              }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-1.5 transition cursor-pointer self-end sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Pengeluaran</span>
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Waktu</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Deskripsi / Keperluan</th>
                  <th className="py-3 px-4">Sumber Dana</th>
                  <th className="py-3 px-4">Dicatat Oleh</th>
                  <th className="py-3 px-4 text-right">Nominal</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Tidak ada data pengeluaran kas pada tanggal {selectedDate}.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => {
                    const catBadge = getCategoryBadge(exp.category);
                    return (
                      <tr key={exp.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                          {new Date(exp.date).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded border ${catBadge.color}`}
                          >
                            {catBadge.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <div className="font-bold text-slate-800 truncate">{exp.description}</div>
                          {exp.receiptNumber && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              No. Nota: {exp.receiptNumber}
                            </div>
                          )}
                          {exp.notes && (
                            <div className="text-[10px] text-slate-500 italic truncate">
                              {exp.notes}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          {exp.paymentMethod === 'cash' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
                              <Banknote className="w-3.5 h-3.5" />
                              Kas Tunai (Laci)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700">
                              <CreditCard className="w-3.5 h-3.5" />
                              Transfer Bank
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-medium">
                          {exp.recordedBy}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-rose-600 text-sm whitespace-nowrap">
                          -{formatRupiah(exp.amount)}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => {
                                setExpenseToEdit(exp);
                                setIsAddExpenseModalOpen(true);
                              }}
                              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                              title="Edit Pengeluaran"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(exp.id, exp.description)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                              title="Hapus Pengeluaran"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: SHIFTS & RECONCILIATION HISTORY */}
      {activeSubTab === 'shifts' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Riwayat Sesi Shift & Berita Acara Rekap Kas (Z-Report)
              </h3>
              <p className="text-[11px] text-slate-500">
                Pencatatan riwayat buka/tutup kasir dan selisih rekonsiliasi fisik
              </p>
            </div>
            <button
              onClick={() => setIsOpenShiftModalOpen(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition cursor-pointer"
            >
              Buka Shift Baru
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Kasir & Jam Shift</th>
                  <th className="py-3 px-4 text-right">Modal Awal</th>
                  <th className="py-3 px-4 text-right">Penjualan Tunai</th>
                  <th className="py-3 px-4 text-right">Kas Keluar</th>
                  <th className="py-3 px-4 text-right">Kas Seharusnya</th>
                  <th className="py-3 px-4 text-right">Fisik Dihitung</th>
                  <th className="py-3 px-4 text-center">Status / Selisih</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredShifts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-400">
                      Belum ada riwayat shift kasir.
                    </td>
                  </tr>
                ) : (
                  filteredShifts.map((sh) => {
                    const diff = sh.cashDifference ?? 0;
                    return (
                      <tr key={sh.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-900 font-bold whitespace-nowrap">
                          {sh.date}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="font-bold text-slate-800">{sh.cashierName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {new Date(sh.startTime).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                            {sh.endTime ? ` - ${new Date(sh.endTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` : ' (Aktif)'}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-amber-700 whitespace-nowrap">
                          {formatRupiah(sh.openingFloat)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 whitespace-nowrap">
                          +{formatRupiah(sh.cashSales)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-rose-600 whitespace-nowrap">
                          -{formatRupiah(sh.cashExpenses)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                          {formatRupiah(sh.expectedCash)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-indigo-900 whitespace-nowrap">
                          {sh.actualCash !== undefined ? formatRupiah(sh.actualCash) : '-'}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          {sh.status === 'open' ? (
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              SHIFT BUKA
                            </span>
                          ) : (
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                                diff === 0
                                  ? 'bg-slate-100 text-slate-800 border-slate-300'
                                  : diff > 0
                                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                                  : 'bg-rose-100 text-rose-800 border-rose-300'
                              }`}
                            >
                              {diff === 0
                                ? 'PAS (Rp 0)'
                                : diff > 0
                                ? `LEBIH (+${formatRupiah(diff)})`
                                : `KURANG (-${formatRupiah(Math.abs(diff))})`}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSelectedShiftForReceipt(sh);
                              setIsReceiptModalOpen(true);
                            }}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                            title="Lihat & Cetak Struk Rekap Kas"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <OpenShiftModal
        isOpen={isOpenShiftModalOpen}
        onClose={() => setIsOpenShiftModalOpen(false)}
      />

      <AddExpenseModal
        isOpen={isAddExpenseModalOpen}
        onClose={() => {
          setIsAddExpenseModalOpen(false);
          setExpenseToEdit(null);
        }}
        editExpense={expenseToEdit}
      />

      <CloseShiftModal
        isOpen={isCloseShiftModalOpen}
        onClose={() => setIsCloseShiftModalOpen(false)}
        onClosedSuccess={(closedShift) => {
          setSelectedShiftForReceipt(closedShift);
          setIsReceiptModalOpen(true);
        }}
      />

      <ShiftReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setSelectedShiftForReceipt(null);
        }}
        shift={selectedShiftForReceipt}
      />
    </div>
  );
};

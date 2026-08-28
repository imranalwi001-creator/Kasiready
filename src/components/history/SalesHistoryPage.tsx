import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { Sale } from '../../types';
import {
  formatRupiah,
  formatIndonesianDate,
  getPaymentMethodLabel,
  getPaymentMethodColor,
} from '../../utils/formatters';
import { ReceiptModal } from '../receipt/ReceiptModal';
import {
  Receipt,
  Search,
  Filter,
  Eye,
  Printer,
  RotateCcw,
  User,
  CreditCard,
  Banknote,
  Building2,
  QrCode,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  Smartphone,
  Zap,
  Award,
  TrendingUp,
  RefreshCw,
  ShoppingBag,
  Clock,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';

export const SalesHistoryPage: React.FC = () => {
  const { sales, refundSale, settleDebtSale, settings, stores } = useStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'today' | '7days' | '30days' | 'all'>('all');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [receiptSale, setReceiptSale] = useState<Sale | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [debtSettleAmount, setDebtSettleAmount] = useState<number>(0);
  const [isSettlingDebt, setIsSettlingDebt] = useState(false);

  // Trigger subtle loading animation on filter change for perceived responsiveness
  const handleFilterChange = (callback: () => void) => {
    setIsDataLoading(true);
    callback();
    setTimeout(() => {
      setIsDataLoading(false);
    }, 250);
  };

  const handleRefresh = () => {
    setIsDataLoading(true);
    setTimeout(() => {
      setIsDataLoading(false);
    }, 350);
  };

  // Persistent Daily Revenue & Transaction Counts for Today
  const todayMetrics = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();

    const todaySales = sales.filter((s) => {
      const saleTime = new Date(s.date).getTime();
      return saleTime >= startOfToday;
    });

    const completed = todaySales.filter((s) => s.status === 'completed');
    const revenue = completed.reduce((sum, s) => sum + s.totalAmount, 0);
    const count = completed.length;
    const totalUnits = completed.reduce(
      (sum, s) => sum + s.items.reduce((acc, i) => acc + i.quantity, 0),
      0
    );
    const avgTicket = count > 0 ? Math.round(revenue / count) : 0;
    const cashCount = completed.filter((s) => s.paymentMethod === 'cash').length;
    const digitalCount = completed.filter((s) => s.paymentMethod !== 'cash').length;

    return {
      revenue,
      count,
      totalUnits,
      avgTicket,
      cashCount,
      digitalCount,
      dateString: now.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    };
  }, [sales]);

  // Filter logic
  const filteredSales = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = now.getTime() - 7 * 86400000;
    const thirtyDaysAgo = now.getTime() - 30 * 86400000;

    return sales.filter((s) => {
      const saleTime = new Date(s.date).getTime();

      // Store filter
      const matchStore = storeFilter === 'all' || s.storeId === storeFilter;

      // Date filter
      let matchDate = true;
      if (dateFilter === 'today') {
        matchDate = saleTime >= startOfToday;
      } else if (dateFilter === '7days') {
        matchDate = saleTime >= sevenDaysAgo;
      } else if (dateFilter === '30days') {
        matchDate = saleTime >= thirtyDaysAgo;
      }

      // Payment filter
      const matchPayment = paymentFilter === 'all' || s.paymentMethod === paymentFilter;

      // Status filter
      let matchStatus = true;
      if (statusFilter === 'completed') {
        matchStatus = s.status === 'completed' && (!s.debtRemaining || s.debtRemaining <= 0);
      } else if (statusFilter === 'debt') {
        matchStatus = (s.debtRemaining || 0) > 0;
      } else if (statusFilter === 'refunded') {
        matchStatus = s.status === 'refunded';
      }

      // Search filter
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.invoiceNumber.toLowerCase().includes(q) ||
        s.cashierName.toLowerCase().includes(q) ||
        (s.customerName && s.customerName.toLowerCase().includes(q)) ||
        (s.paymentGatewayRef && s.paymentGatewayRef.toLowerCase().includes(q)) ||
        s.items.some((it) => it.productName.toLowerCase().includes(q));

      return matchStore && matchDate && matchPayment && matchStatus && matchSearch;
    });
  }, [sales, storeFilter, dateFilter, paymentFilter, statusFilter, searchQuery]);

  // Aggregate stats
  const completedSales = filteredSales.filter((s) => s.status === 'completed');
  const totalRevenue = completedSales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalCount = completedSales.length;
  const averageTicket = totalCount > 0 ? Math.round(totalRevenue / totalCount) : 0;
  const totalPiutang = filteredSales.reduce((sum, s) => sum + (s.debtRemaining || 0), 0);

  const handleOpenReceipt = (sale: Sale) => {
    setReceiptSale(sale);
    setIsReceiptOpen(true);
  };

  const handleRefund = (sale: Sale) => {
    const reason = prompt(
      `Konfirmasi pembatalan/retur transaksi ${sale.invoiceNumber}. Masukkan alasan:`
    );
    if (reason !== null) {
      refundSale(sale.id, reason || 'Dibatalkan oleh kasir');
      setSelectedSale(null);
    }
  };

  const handleSettleDebtSubmit = (sale: Sale) => {
    if (!debtSettleAmount || debtSettleAmount <= 0) return;
    settleDebtSale(sale.id, debtSettleAmount);
    setIsSettlingDebt(false);
    setDebtSettleAmount(0);
    const updated = sales.find((s) => s.id === sale.id);
    if (updated) {
      setSelectedSale(updated);
    } else {
      setSelectedSale(null);
    }
  };

  const getStoreName = (storeId?: string) => {
    return stores.find((s) => s.id === storeId)?.name || 'Toko Utama';
  };

  const handleExportCSV = () => {
    const headers = [
      'No Nota',
      'Cabang Toko',
      'Tanggal Transaksi',
      'Jatuh Tempo Piutang',
      'Kasir',
      'Nama Pelanggan',
      'Metode Pembayaran',
      'Status Piutang / Bayar',
      'Total Item (Pcs)',
      'Subtotal (Rp)',
      'Diskon (Rp)',
      'Diskon Poin (Rp)',
      'Pajak PPN (Rp)',
      'Total Akhir (Rp)',
      'Dibayar (Rp)',
      'Kembalian (Rp)',
      'Sisa Piutang (Rp)',
      'Status Transaksi',
      'Rincian Produk',
    ];

    const rows = filteredSales.map((s) => {
      const itemsDetail = s.items.map((i) => `${i.productName} (${i.quantity}x)`).join('; ');
      const paymentStatusStr =
        s.debtRemaining && s.debtRemaining > 0
          ? s.paidAmount > 0
            ? 'Bayar Sebagian'
            : 'Belum Lunas / Tempo'
          : 'Lunas';

      return [
        `"${s.invoiceNumber}"`,
        `"${getStoreName(s.storeId)}"`,
        `"${formatIndonesianDate(s.date)}"`,
        `"${s.dueDate ? formatIndonesianDate(s.dueDate) : '-'}"`,
        `"${s.cashierName}"`,
        `"${s.customerName || 'Umum'}"`,
        `"${getPaymentMethodLabel(s.paymentMethod)}"`,
        `"${paymentStatusStr}"`,
        s.items.reduce((acc, i) => acc + i.quantity, 0),
        s.subtotal,
        s.discount,
        s.pointsDiscount || 0,
        s.tax,
        s.totalAmount,
        s.paidAmount,
        s.changeAmount || 0,
        s.debtRemaining || 0,
        `"${s.status === 'completed' ? 'Selesai' : 'Dibatalkan'}"`,
        `"${itemsDetail}"`,
      ];
    });

    // Add UTF-8 BOM (\uFEFF) for direct Excel compatibility
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `Laporan_Transaksi_Averion_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div id="sales-history-page" className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Receipt className="w-6 h-6 text-[#00A876]" />
            Riwayat Penjualan &amp; Transaksi POS
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Semua transaksi kasir, piutang tempo, gateway digital QRIS, dan ekspor akuntansi CSV
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={handleRefresh}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-50 shadow-2xs transition cursor-pointer"
            title="Muat Ulang Data"
          >
            <RefreshCw className={`w-4 h-4 ${isDataLoading ? 'animate-spin text-[#00A876]' : ''}`} />
          </button>

          <button
            id="export-sales-csv-btn"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#00A876] hover:bg-[#008f65] text-white text-xs font-bold shadow-xs transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Ekspor CSV Akuntansi</span>
          </button>
        </div>
      </div>

      {/* PERSISTENT DAILY SUMMARY CARD: Highlights total daily revenue and number of transactions */}
      <div
        id="persistent-daily-summary-card"
        className="relative overflow-hidden bg-gradient-to-br from-[#0B1320] via-[#121E31] to-[#0B1320] rounded-2xl p-5 sm:p-6 text-white border border-slate-800 shadow-xl"
      >
        <div className="absolute -top-10 -right-10 w-64 h-64 bg-[#00A876]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#00A876]/20 text-[#00A876] border border-[#00A876]/30 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-[#00A876] animate-pulse" />
                Live Daily Performance
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {todayMetrics.dateString}
              </span>
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Total Omset Penjualan Hari Ini
              </p>
              <div className="flex items-baseline gap-3 mt-0.5">
                <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
                  {formatRupiah(todayMetrics.revenue)}
                </span>
                <span className="text-xs font-bold text-[#00A876] bg-[#00A876]/20 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                  <TrendingUp className="w-3 h-3" />
                  Hari Ini
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/5 p-3.5 rounded-xl border border-white/10 backdrop-blur-xs">
            <div className="border-r border-white/10 pr-2">
              <span className="text-[11px] font-medium text-slate-400 block">Total Transaksi</span>
              <p className="text-base sm:text-lg font-bold text-white mt-0.5 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-[#00A876]" />
                {todayMetrics.count} <span className="text-xs font-normal text-slate-400">Order</span>
              </p>
            </div>

            <div className="border-r border-white/10 pr-2">
              <span className="text-[11px] font-medium text-slate-400 block">Unit Terjual</span>
              <p className="text-base sm:text-lg font-bold text-white mt-0.5 flex items-center gap-1.5">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                {todayMetrics.totalUnits} <span className="text-xs font-normal text-slate-400">Pcs</span>
              </p>
            </div>

            <div className="border-r border-white/10 pr-2">
              <span className="text-[11px] font-medium text-slate-400 block">Avg. Basket</span>
              <p className="text-xs sm:text-sm font-bold text-white mt-0.5 truncate">
                {formatRupiah(todayMetrics.avgTicket)}
              </p>
            </div>

            <div>
              <span className="text-[11px] font-medium text-slate-400 block">Metode Bayar</span>
              <p className="text-[11px] font-semibold text-slate-300 mt-0.5">
                <span className="text-[#00A876] font-bold">{todayMetrics.cashCount} Tunai</span> &bull; {todayMetrics.digitalCount} Digital
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards for Selected Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Omset Sesuai Filter</p>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatRupiah(totalRevenue)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            Dari {totalCount} transaksi berhasil
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Volume Transaksi</p>
          <p className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">
            {totalCount} Transaksi
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {sales.filter((s) => s.status === 'refunded').length} transaksi retur/batal
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold">Rata-rata Basket</p>
          <p className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">
            {formatRupiah(averageTicket)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Rata-rata per transaksi</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            Total Piutang Belum Lunas
          </p>
          <p className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">
            {formatRupiah(totalPiutang)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {filteredSales.filter((s) => (s.debtRemaining || 0) > 0).length} nota memiliki tagihan tempo
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search */}
          <div className="sm:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              id="history-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nota, kasir, pelanggan, produk..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00A876] focus:bg-white"
            />
          </div>

          {/* Store Branch Filter */}
          <div className="sm:col-span-2">
            <select
              value={storeFilter}
              onChange={(e) => handleFilterChange(() => setStoreFilter(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-white bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00A876]"
            >
              <option value="all">Semua Cabang</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => handleFilterChange(() => setStatusFilter(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00A876]"
            >
              <option value="all">Semua Status Bayar</option>
              <option value="completed">Lunas Penuh</option>
              <option value="debt">Belum Lunas / Piutang</option>
              <option value="refunded">Dibatalkan / Retur</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="sm:col-span-2">
            <select
              value={dateFilter}
              onChange={(e) => handleFilterChange(() => setDateFilter(e.target.value as any))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00A876]"
            >
              <option value="all">Semua Waktu</option>
              <option value="today">Hari Ini</option>
              <option value="7days">7 Hari Terakhir</option>
              <option value="30days">30 Hari Terakhir</option>
            </select>
          </div>

          {/* Payment Method Filter */}
          <div className="sm:col-span-2">
            <select
              value={paymentFilter}
              onChange={(e) => handleFilterChange(() => setPaymentFilter(e.target.value))}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#00A876]"
            >
              <option value="all">Semua Pembayaran</option>
              <option value="cash">Tunai (Cash)</option>
              <option value="gopay">GoPay Digital</option>
              <option value="ovo">OVO Push</option>
              <option value="qris">QRIS Dinamis</option>
              <option value="transfer">Transfer Bank (VA)</option>
              <option value="debit">Kartu Debit/EDC</option>
            </select>
          </div>
        </div>
      </div>

      {/* SKELETON LOADING OR TRANSACTIONS TABLE */}
      {isDataLoading ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden p-6 space-y-4 animate-pulse">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-md w-48" />
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-md w-24" />
          </div>
          <div className="space-y-3.5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="flex items-center justify-between py-2.5 border-b border-slate-50 dark:border-slate-800 last:border-0 gap-4">
                <div className="space-y-1.5 w-1/4">
                  <div className="h-3.5 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded w-1/2" />
                </div>
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-20 hidden sm:block" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-24 hidden md:block" />
                <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-16" />
                <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded-full w-20" />
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-20" />
                <div className="w-16 h-7 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0" />
              </div>
            ))}
          </div>
        </div>
      ) : filteredSales.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <Receipt className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
          <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm">Tidak Ada Transaksi</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Tidak ada transaksi yang cocok dengan filter cabang toko dan pencarian yang dipilih.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">No. Nota &amp; Cabang</th>
                  <th className="py-3 px-4">Waktu Transaksi</th>
                  <th className="py-3 px-4">Kasir &amp; Pelanggan</th>
                  <th className="py-3 px-4">Item Terjual</th>
                  <th className="py-3 px-4">Metode Bayar</th>
                  <th className="py-3 px-4 text-right">Total Akhir</th>
                  <th className="py-3 px-4 text-center">Status Bayar</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSales.map((sale) => {
                  const payColor = getPaymentMethodColor(sale.paymentMethod);
                  const totalUnits = sale.items.reduce((acc, i) => acc + i.quantity, 0);
                  const hasDebt = (sale.debtRemaining || 0) > 0;

                  return (
                    <tr
                      key={sale.id}
                      id={`sale-row-${sale.id}`}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                    >
                      {/* Invoice & Branch */}
                      <td className="py-3 px-4">
                        <p className="font-mono font-bold text-slate-900 dark:text-white">{sale.invoiceNumber}</p>
                        <span className="inline-flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-medium mt-0.5">
                          <Building2 className="w-2.5 h-2.5 text-slate-400" />
                          {getStoreName(sale.storeId)}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                        {formatIndonesianDate(sale.date)}
                      </td>

                      {/* Cashier & Customer */}
                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{sale.cashierName}</p>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{sale.customerName || 'Umum'}</span>
                          {sale.pointsRedeemed && sale.pointsRedeemed > 0 ? (
                            <span className="text-[10px] text-amber-600 font-bold ml-1">
                              (-{sale.pointsRedeemed} Pts)
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Items Summary */}
                      <td className="py-3 px-4 max-w-[200px]">
                        <p className="font-medium text-slate-700 dark:text-slate-300 truncate">
                          {sale.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {sale.items.length} jenis ({totalUnits} unit)
                        </p>
                      </td>

                      {/* Payment Method Badge */}
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${payColor.bg} ${payColor.border}`}
                        >
                          {sale.paymentMethod === 'cash' && <Banknote className="w-3 h-3" />}
                          {sale.paymentMethod === 'gopay' && <Smartphone className="w-3 h-3" />}
                          {sale.paymentMethod === 'ovo' && <Zap className="w-3 h-3" />}
                          {sale.paymentMethod === 'qris' && <QrCode className="w-3 h-3" />}
                          {sale.paymentMethod === 'debit' && <CreditCard className="w-3 h-3" />}
                          {sale.paymentMethod === 'transfer' && <Building2 className="w-3 h-3" />}
                          <span>{getPaymentMethodLabel(sale.paymentMethod)}</span>
                        </span>
                        {sale.paymentGatewayRef && (
                          <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                            Ref: {sale.paymentGatewayRef}
                          </span>
                        )}
                      </td>

                      {/* Total Amount */}
                      <td className="py-3 px-4 text-right">
                        <span className="font-black text-slate-900 dark:text-white text-xs sm:text-sm block">
                          {formatRupiah(sale.totalAmount)}
                        </span>
                        {hasDebt && (
                          <span className="text-[10px] font-bold text-rose-600 block">
                            Sisa Piutang: {formatRupiah(sale.debtRemaining || 0)}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 text-center">
                        {sale.status === 'refunded' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-700 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                            <XCircle className="w-3 h-3 text-red-600" />
                            Dibatalkan
                          </span>
                        ) : hasDebt ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                              <Clock className="w-3 h-3 text-amber-600" />
                              {sale.paidAmount > 0 ? 'Bayar Sebagian' : 'Tempo / Piutang'}
                            </span>
                            {sale.dueDate && (
                              <span className="text-[9px] text-slate-400 block">
                                Tempo: {new Date(sale.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3 text-[#00A876]" />
                            Lunas
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedSale(sale)}
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="Lihat Detail Transaksi"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenReceipt(sale)}
                            className="p-1.5 rounded-lg text-[#00A876] hover:bg-emerald-50 dark:hover:bg-slate-800 transition cursor-pointer"
                            title="Cetak Ulang Struk"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transaction Detail Modal */}
      {selectedSale && (
        <div
          id="sale-detail-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedSale(null);
          }}
        >
          <div
            id="sale-detail-card"
            className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150 my-6"
          >
            <div className="bg-slate-900 dark:bg-slate-950 text-white px-6 py-4 flex items-center justify-between border-b border-slate-800">
              <div>
                <h3 className="font-bold text-base">Detail Transaksi Penjualan</h3>
                <p className="text-xs font-mono text-[#00A876]">
                  {selectedSale.invoiceNumber}
                </p>
              </div>
              <button
                onClick={() => setSelectedSale(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Metadata Grid */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs">
                <div>
                  <span className="text-slate-400 block">Cabang Toko</span>
                  <span className="font-bold text-slate-800 dark:text-white">
                    {getStoreName(selectedSale.storeId)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Tanggal &amp; Waktu</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {formatIndonesianDate(selectedSale.date)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Kasir</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedSale.cashierName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">Pelanggan / Member</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedSale.customerName || 'Pelanggan Umum'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block">Metode Pembayaran</span>
                  <span className="font-bold text-[#00A876] uppercase">
                    {getPaymentMethodLabel(selectedSale.paymentMethod)}
                  </span>
                </div>
                {selectedSale.dueDate && (
                  <div>
                    <span className="text-slate-400 block">Jatuh Tempo Piutang</span>
                    <span className="font-bold text-amber-600">
                      {formatIndonesianDate(selectedSale.dueDate)}
                    </span>
                  </div>
                )}
              </div>

              {/* Debt Settlement Box if Unpaid */}
              {selectedSale.debtRemaining && selectedSale.debtRemaining > 0 ? (
                <div className="p-4 bg-amber-50/80 dark:bg-amber-950/30 rounded-2xl border border-amber-200 dark:border-amber-800/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span className="text-xs font-bold text-amber-900 dark:text-amber-300">
                        Tagihan Piutang Belum Lunas
                      </span>
                    </div>
                    <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                      Sisa: {formatRupiah(selectedSale.debtRemaining)}
                    </span>
                  </div>

                  {isSettlingDebt ? (
                    <div className="space-y-2 pt-2 border-t border-amber-200 dark:border-amber-800/60">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                        Nominal Bayar Pelunasan (Rp):
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={debtSettleAmount || ''}
                          onChange={(e) => setDebtSettleAmount(Math.min(selectedSale.debtRemaining || 0, Number(e.target.value) || 0))}
                          max={selectedSale.debtRemaining}
                          placeholder={`Maks ${formatRupiah(selectedSale.debtRemaining)}`}
                          className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={() => setDebtSettleAmount(selectedSale.debtRemaining || 0)}
                          className="px-2.5 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-[11px] font-bold cursor-pointer"
                        >
                          Lunas Penuh
                        </button>
                      </div>
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setIsSettlingDebt(false)}
                          className="px-3 py-1.5 text-xs text-slate-500 font-semibold cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSettleDebtSubmit(selectedSale)}
                          disabled={!debtSettleAmount || debtSettleAmount <= 0}
                          className="px-4 py-1.5 bg-[#00A876] hover:bg-[#008f65] text-white rounded-xl text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                        >
                          Simpan Pembayaran
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsSettlingDebt(true);
                        setDebtSettleAmount(selectedSale.debtRemaining || 0);
                      }}
                      className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Terima Pembayaran Piutang Sekarang</span>
                    </button>
                  )}
                </div>
              ) : null}

              {/* Items List */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                  Daftar Barang ({selectedSale.items.length} jenis)
                </h4>
                <div className="border border-slate-200 dark:border-slate-700/60 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {selectedSale.items.map((item) => (
                    <div key={item.productId} className="p-3 flex items-center justify-between bg-white dark:bg-slate-900">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{item.productName}</p>
                        <p className="text-slate-400 text-[11px]">
                          {formatRupiah(item.price)} &times; {item.quantity}
                        </p>
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {formatRupiah(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Calculations */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold text-slate-800 dark:text-white">
                    {formatRupiah(selectedSale.subtotal)}
                  </span>
                </div>
                {selectedSale.discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Diskon Promo</span>
                    <span>-{formatRupiah(selectedSale.discount)}</span>
                  </div>
                )}
                {selectedSale.pointsDiscount && selectedSale.pointsDiscount > 0 ? (
                  <div className="flex justify-between text-amber-600 font-semibold">
                    <span>Diskon Poin ({selectedSale.pointsRedeemed} Pts)</span>
                    <span>-{formatRupiah(selectedSale.pointsDiscount)}</span>
                  </div>
                ) : null}
                {selectedSale.tax > 0 && (
                  <div className="flex justify-between">
                    <span>Pajak (PPN)</span>
                    <span>+{formatRupiah(selectedSale.tax)}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between text-sm font-black text-slate-900 dark:text-white">
                  <span>Total Tagihan Akhir</span>
                  <span className="text-[#00A876] font-black">
                    {formatRupiah(selectedSale.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 pt-1">
                  <span>Dibayar ({getPaymentMethodLabel(selectedSale.paymentMethod)})</span>
                  <span>{formatRupiah(selectedSale.paidAmount)}</span>
                </div>
                {selectedSale.changeAmount > 0 && (
                  <div className="flex justify-between text-[11px] text-emerald-700 font-semibold">
                    <span>Kembalian</span>
                    <span>{formatRupiah(selectedSale.changeAmount)}</span>
                  </div>
                )}
                {selectedSale.debtRemaining && selectedSale.debtRemaining > 0 ? (
                  <div className="flex justify-between text-[11px] text-rose-600 font-bold">
                    <span>Sisa Piutang</span>
                    <span>{formatRupiah(selectedSale.debtRemaining)}</span>
                  </div>
                ) : null}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
                {selectedSale.status === 'completed' && (
                  <button
                    onClick={() => handleRefund(selectedSale)}
                    className="inline-flex items-center gap-1 text-xs text-red-600 hover:text-red-800 font-semibold p-2 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Batalkan / Retur</span>
                  </button>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={() => handleOpenReceipt(selectedSale)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00A876] hover:bg-[#008f65] text-white text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak Struk</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        sale={receiptSale}
        settings={settings}
        onClose={() => {
          setIsReceiptOpen(false);
          setReceiptSale(null);
        }}
        isNewTransaction={false}
      />
    </div>
  );
};

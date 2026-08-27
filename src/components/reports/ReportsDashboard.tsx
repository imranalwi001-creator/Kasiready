import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import {
  formatRupiah,
  formatNumber,
  formatShortDate,
  getPaymentMethodLabel,
} from '../../utils/formatters';
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Percent,
  Package,
  Calendar,
  Download,
  CreditCard,
  Layers,
  Award,
  ArrowUpRight,
  Building2,
  Users,
  Smartphone,
  Zap,
  Sparkles,
  FileSpreadsheet,
  FileText,
  Printer,
} from 'lucide-react';
import {
  exportFinancialReportToExcel,
  exportFinancialReportToPDF,
} from '../../utils/exportReports';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';

export const ReportsDashboard: React.FC = () => {
  const { sales, products, categories, stores, settings, currentUser } = useStore();
  const [timeRange, setTimeRange] = useState<'7days' | '30days' | 'all'>('7days');
  const [storeFilter, setStoreFilter] = useState<string>('all');
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);

  // Filter completed sales based on time range and store
  const filteredSales = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = now.getTime() - 7 * 86400000;
    const thirtyDaysAgo = now.getTime() - 30 * 86400000;

    return sales
      .filter((s) => s.status === 'completed')
      .filter((s) => {
        const matchStore = storeFilter === 'all' || s.storeId === storeFilter;
        const t = new Date(s.date).getTime();
        let matchTime = true;
        if (timeRange === '7days') matchTime = t >= sevenDaysAgo;
        if (timeRange === '30days') matchTime = t >= thirtyDaysAgo;
        return matchStore && matchTime;
      });
  }, [sales, timeRange, storeFilter]);

  // Aggregate Key Metrics
  const totalRevenue = useMemo(
    () => filteredSales.reduce((acc, s) => acc + s.totalAmount, 0),
    [filteredSales]
  );
  const totalTransactions = filteredSales.length;
  const avgOrderValue = totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0;

  // Calculate Total Cost and Gross Profit
  const totalCost = useMemo(() => {
    return filteredSales.reduce((acc, s) => {
      const saleCost = s.items.reduce(
        (iAcc, item) => iAcc + (item.costPrice || 0) * item.quantity,
        0
      );
      return acc + saleCost;
    }, 0);
  }, [filteredSales]);

  const grossProfit = Math.max(0, totalRevenue - totalCost);
  const profitMargin = totalRevenue > 0 ? ((grossProfit / totalRevenue) * 100).toFixed(1) : '0';

  const totalItemsSold = useMemo(() => {
    return filteredSales.reduce((acc, s) => {
      return acc + s.items.reduce((iAcc, item) => iAcc + item.quantity, 0);
    }, 0);
  }, [filteredSales]);

  // Loyalty Points Metrics in Period
  const loyaltyMetrics = useMemo(() => {
    const pointsRedeemedTotal = filteredSales.reduce(
      (sum, s) => sum + (s.pointsRedeemed || 0),
      0
    );
    const pointsDiscountTotal = filteredSales.reduce(
      (sum, s) => sum + (s.pointsDiscount || 0),
      0
    );
    const memberSalesCount = filteredSales.filter((s) => s.customerId).length;

    return {
      pointsRedeemedTotal,
      pointsDiscountTotal,
      memberSalesCount,
    };
  }, [filteredSales]);

  // Store Performance Comparison
  const storeComparison = useMemo(() => {
    return stores.map((st) => {
      const stSales = sales
        .filter((s) => s.status === 'completed' && s.storeId === st.id)
        .filter((s) => {
          const now = new Date();
          const sevenDaysAgo = now.getTime() - 7 * 86400000;
          const thirtyDaysAgo = now.getTime() - 30 * 86400000;
          const t = new Date(s.date).getTime();
          if (timeRange === '7days') return t >= sevenDaysAgo;
          if (timeRange === '30days') return t >= thirtyDaysAgo;
          return true;
        });

      const revenue = stSales.reduce((acc, s) => acc + s.totalAmount, 0);
      const orders = stSales.length;

      return {
        id: st.id,
        name: st.name,
        code: st.code,
        revenue,
        orders,
      };
    });
  }, [stores, sales, timeRange]);

  // Daily Trend Data for Area Chart
  const trendData = useMemo(() => {
    const map: { [key: string]: { date: string; displayDate: string; revenue: number; orders: number } } = {};

    const daysCount = timeRange === '7days' ? 7 : timeRange === '30days' ? 30 : 14;
    const now = new Date();
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      map[key] = {
        date: key,
        displayDate: formatShortDate(key),
        revenue: 0,
        orders: 0,
      };
    }

    filteredSales.forEach((s) => {
      const key = s.date.slice(0, 10);
      if (map[key]) {
        map[key].revenue += s.totalAmount;
        map[key].orders += 1;
      } else {
        map[key] = {
          date: key,
          displayDate: formatShortDate(key),
          revenue: s.totalAmount,
          orders: 1,
        };
      }
    });

    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredSales, timeRange]);

  // Payment Method Breakdown for Pie Chart
  const paymentData = useMemo(() => {
    const counts: { [key: string]: { name: string; value: number; count: number; color: string } } = {
      cash: { name: 'Tunai (Cash)', value: 0, count: 0, color: '#4f46e5' },
      gopay: { name: 'GoPay Digital', value: 0, count: 0, color: '#0284c7' },
      ovo: { name: 'OVO Push Pay', value: 0, count: 0, color: '#7c3aed' },
      qris: { name: 'QRIS Universal', value: 0, count: 0, color: '#f43f5e' },
      debit: { name: 'Kartu Debit/EDC', value: 0, count: 0, color: '#0ea5e9' },
      transfer: { name: 'Transfer Bank (VA)', value: 0, count: 0, color: '#f59e0b' },
    };

    filteredSales.forEach((s) => {
      if (counts[s.paymentMethod]) {
        counts[s.paymentMethod].value += s.totalAmount;
        counts[s.paymentMethod].count += 1;
      }
    });

    return Object.values(counts).filter((p) => p.value > 0);
  }, [filteredSales]);

  // Category Sales Breakdown for Bar Chart
  const categoryData = useMemo(() => {
    const catMap: { [catId: string]: { name: string; revenue: number; units: number; color: string } } = {};

    categories.forEach((cat) => {
      catMap[cat.id] = {
        name: cat.name,
        revenue: 0,
        units: 0,
        color: cat.color || '#4f46e5',
      };
    });

    filteredSales.forEach((s) => {
      s.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        const catId = prod?.categoryId || 'cat-1';
        if (catMap[catId]) {
          catMap[catId].revenue += item.subtotal;
          catMap[catId].units += item.quantity;
        }
      });
    });

    return Object.values(catMap).filter((c) => c.revenue > 0);
  }, [filteredSales, categories, products]);

  // Top Selling Products Leaderboard
  const topProducts = useMemo(() => {
    const prodMap: { [prodId: string]: { name: string; sku: string; quantity: number; revenue: number } } = {};

    filteredSales.forEach((s) => {
      s.items.forEach((item) => {
        if (!prodMap[item.productId]) {
          prodMap[item.productId] = {
            name: item.productName,
            sku: item.sku,
            quantity: 0,
            revenue: 0,
          };
        }
        prodMap[item.productId].quantity += item.quantity;
        prodMap[item.productId].revenue += item.subtotal;
      });
    });

    return Object.values(prodMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);
  }, [filteredSales]);

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      await exportFinancialReportToPDF({
        sales: filteredSales,
        stores,
        products,
        categories,
        settings,
        currentUser,
        timeRange,
        storeFilterId: storeFilter,
        totalRevenue,
        totalCost,
        grossProfit,
        profitMargin,
        totalTransactions,
        avgOrderValue,
        totalItemsSold,
        paymentData,
        categoryData,
        topProducts,
      });
    } catch (err) {
      console.error('Export PDF error:', err);
      alert('Gagal mengekspor laporan PDF.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      await exportFinancialReportToExcel({
        sales: filteredSales,
        stores,
        products,
        categories,
        settings,
        currentUser,
        timeRange,
        storeFilterId: storeFilter,
        totalRevenue,
        totalCost,
        grossProfit,
        profitMargin,
        totalTransactions,
        avgOrderValue,
        totalItemsSold,
        paymentData,
        categoryData,
        topProducts,
      });
    } catch (err) {
      console.error('Export Excel error:', err);
      alert('Gagal mengekspor laporan Excel.');
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <div id="reports-dashboard" className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-5">
      {/* Header & Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
            Laporan Keuangan &amp; Analisis Multi-Cabang
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Evaluasi performa penjualan cabang, gateway digital OVO / GoPay, dan program loyalitas
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Branch Filter Dropdown */}
          <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-2xs">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <select
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
              className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            >
              <option value="all">Semua Cabang Toko</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Time Range Pills */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              id="time-range-7days"
              onClick={() => setTimeRange('7days')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                timeRange === '7days'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              7 Hari
            </button>
            <button
              id="time-range-30days"
              onClick={() => setTimeRange('30days')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                timeRange === '30days'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              30 Hari
            </button>
            <button
              id="time-range-all"
              onClick={() => setTimeRange('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                timeRange === 'all'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              Semua Data
            </button>
          </div>

          {/* Export Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              id="export-pdf-btn"
              onClick={handleExportPDF}
              disabled={isExportingPDF}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-2xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Unduh Laporan Keuangan format PDF"
            >
              {isExportingPDF ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FileText className="w-4 h-4" />
              )}
              <span>Unduh PDF</span>
            </button>

            <button
              type="button"
              id="export-excel-btn"
              onClick={handleExportExcel}
              disabled={isExportingExcel}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
              title="Unduh Laporan Keuangan format Excel (.xlsx)"
            >
              {isExportingExcel ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <FileSpreadsheet className="w-4 h-4" />
              )}
              <span>Unduh Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary Financial Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Pendapatan / Omset */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span className="font-semibold text-slate-700">Total Pendapatan</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-indigo-700">
            {formatRupiah(totalRevenue)}
          </p>
          <div className="flex items-center gap-1 text-[11px] text-indigo-600 mt-2 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Omset Penjualan Bersih</span>
          </div>
        </div>

        {/* Estimasi Keuntungan Kotor */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span className="font-semibold text-slate-700">Estimasi Laba Kotor</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-700">
            {formatRupiah(grossProfit)}
          </p>
          <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-2">
            <Percent className="w-3 h-3 text-emerald-600" />
            <span>Margin Laba: </span>
            <span className="font-bold text-emerald-700">{profitMargin}%</span>
          </div>
        </div>

        {/* Total Transaksi */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span className="font-semibold text-slate-700">Jumlah Transaksi</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900">
            {totalTransactions} <span className="text-xs font-normal text-slate-500">Struk</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-2">
            {totalItemsSold} total unit produk terjual
          </p>
        </div>

        {/* Rata-rata Nilai Transaksi (AOV) */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-2">
            <span className="font-semibold text-slate-700">Rata-rata Transaksi</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-black text-slate-900">
            {formatRupiah(avgOrderValue)}
          </p>
          <p className="text-[11px] text-slate-400 mt-2">Nilai belanja per pelanggan</p>
        </div>
      </div>

      {/* Branch Breakdown Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-sm text-slate-900">Performa Penjualan Antar Cabang Toko</h3>
          </div>
          <span className="text-xs text-slate-400">Total {stores.length} Cabang Terdaftar</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {storeComparison.map((st) => (
            <div
              key={st.id}
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-xs">{st.name}</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-slate-600 border border-slate-200">
                  {st.code}
                </span>
              </div>
              <p className="text-lg font-black text-indigo-700">{formatRupiah(st.revenue)}</p>
              <p className="text-[11px] text-slate-500">{st.orders} transaksi diselesaikan</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Chart: Tren Penjualan Harian */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Tren Pendapatan Penjualan</h3>
              <p className="text-xs text-slate-400">Fluktuasi omset harian dari waktu ke waktu</p>
            </div>
            <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-200">
              Total {formatRupiah(totalRevenue)}
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="displayDate"
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={{ stroke: '#e2e8f0' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `Rp${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  formatter={(val: number) => [formatRupiah(val), 'Pendapatan']}
                  labelFormatter={(label) => `Tanggal: ${label}`}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Chart: Metode Pembayaran Termasuk Digital Gateway */}
        <div className="lg:col-span-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-sm text-slate-900">Distribusi Gateway &amp; Metode Bayar</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">OVO, GoPay, QRIS, VA &amp; Tunai</p>
          </div>

          <div className="h-52 w-full flex items-center justify-center">
            {paymentData.length === 0 ? (
              <p className="text-xs text-slate-400">Belum ada data pembayaran</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                  >
                    {paymentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number) => [formatRupiah(val), 'Total']}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="space-y-1.5 pt-2 border-t border-slate-100 text-xs">
            {paymentData.map((p) => {
              const pct = totalRevenue > 0 ? ((p.value / totalRevenue) * 100).toFixed(0) : '0';
              return (
                <div key={p.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                    <span className="text-slate-700 font-medium">{p.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">{formatRupiah(p.value)}</span>
                    <span className="text-slate-400 text-[10px] ml-1">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Secondary Row: Category Breakdown & Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Performance */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-600" />
            <div>
              <h3 className="font-bold text-sm text-slate-900">Penjualan per Kategori</h3>
              <p className="text-xs text-slate-400">Kontribusi omset dari setiap kategori produk</p>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 10, fill: '#64748b' }}
                  axisLine={false}
                  tickFormatter={(v) => `Rp${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#334155' }}
                  width={110}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(val: number) => [formatRupiah(val), 'Pendapatan']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Bar dataKey="revenue" fill="#4f46e5" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Products Leaderboard */}
        <div className="lg:col-span-6 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <div>
                <h3 className="font-bold text-sm text-slate-900">Produk Terlaris (Top 5)</h3>
                <p className="text-xs text-slate-400">Peringkat barang dengan kuantitas terjual terbanyak</p>
              </div>
            </div>
            <span className="text-[10px] font-semibold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
              Leaderboard
            </span>
          </div>

          <div className="space-y-2.5">
            {topProducts.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">Belum ada data transaksi</p>
            ) : (
              topProducts.map((prod, idx) => (
                <div
                  key={prod.sku}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold ${
                        idx === 0
                          ? 'bg-amber-400 text-slate-950 shadow-xs'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-900'
                          : idx === 2
                          ? 'bg-amber-700 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-slate-900 truncate">{prod.name}</p>
                      <p className="text-[10px] font-mono text-slate-400">{prod.sku}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-bold text-xs text-indigo-700">{formatRupiah(prod.revenue)}</p>
                    <p className="text-[10px] font-semibold text-slate-600">
                      {prod.quantity} unit terjual
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

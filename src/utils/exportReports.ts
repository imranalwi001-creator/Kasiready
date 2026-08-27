import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Sale, Store, Product, Category, StoreSettings, User } from '../types';
import { formatRupiah, formatIndonesianDate, getPaymentMethodLabel } from './formatters';

export interface FinancialReportExportOptions {
  sales: Sale[];
  stores: Store[];
  products: Product[];
  categories: Category[];
  settings: StoreSettings;
  currentUser: User | null;
  timeRange: '7days' | '30days' | 'all';
  storeFilterId: string; // 'all' or storeId
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  profitMargin: string;
  totalTransactions: number;
  avgOrderValue: number;
  totalItemsSold: number;
  paymentData: { name: string; value: number; count: number }[];
  categoryData: { name: string; revenue: number; units: number }[];
  topProducts: { name: string; sku: string; quantity: number; revenue: number }[];
}

/**
 * Exports financial report to a well-structured multi-sheet Excel (.xlsx) file
 */
export function exportFinancialReportToExcel(options: FinancialReportExportOptions): void {
  const {
    sales,
    stores,
    settings,
    currentUser,
    timeRange,
    storeFilterId,
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
  } = options;

  const targetStore = stores.find((s) => s.id === storeFilterId);
  const storeName = targetStore ? targetStore.name : 'Semua Cabang Toko';
  const periodLabel =
    timeRange === '7days' ? '7 Hari Terakhir' : timeRange === '30days' ? '30 Hari Terakhir' : 'Semua Data';
  const exportDate = new Date().toLocaleString('id-ID');

  const workbook = XLSX.utils.book_new();

  // --- SHEET 1: RINGKASAN KEUANGAN (EXECUTIVE SUMMARY) ---
  const summaryRows = [
    ['LAPORAN KEUANGAN & ANALISIS PENJUALAN'],
    ['Nama Usaha', settings.name],
    ['Cabang', storeName],
    ['Periode Data', periodLabel],
    ['Tanggal Ekspor', exportDate],
    ['Diekspor Oleh', currentUser ? `${currentUser.name} (${currentUser.role})` : 'Administrator'],
    [],
    ['INDIKATOR KEUANGAN UTAMA (KPI)', 'NILAI'],
    ['Total Pendapatan (Omset Bersih)', totalRevenue],
    ['Total Beban Pokok Penjualan (HPP)', totalCost],
    ['Estimasi Laba Kotor', grossProfit],
    ['Margin Laba Bersih', `${profitMargin}%`],
    ['Total Transaksi Selesai', totalTransactions],
    ['Rata-rata Nilai Transaksi (AOV)', avgOrderValue],
    ['Total Unit Barang Terjual', totalItemsSold],
    [],
    ['RINGKASAN METODE PEMBAYARAN'],
    ['Metode Pembayaran', 'Jumlah Transaksi', 'Total Nominal (Rp)', 'Kontribusi (%)'],
    ...paymentData.map((p) => [
      p.name,
      p.count,
      p.value,
      totalRevenue > 0 ? `${((p.value / totalRevenue) * 100).toFixed(1)}%` : '0%',
    ]),
    [],
    ['RINGKASAN PENJUALAN PER KATEGORI'],
    ['Kategori Produk', 'Total Unit Terjual', 'Total Omset (Rp)', 'Kontribusi (%)'],
    ...categoryData.map((c) => [
      c.name,
      c.units,
      c.revenue,
      totalRevenue > 0 ? `${((c.revenue / totalRevenue) * 100).toFixed(1)}%` : '0%',
    ]),
  ];

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
  summarySheet['!cols'] = [{ wch: 35 }, { wch: 25 }, { wch: 20 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Ringkasan Keuangan');

  // --- SHEET 2: RINCIAN TRANSAKSI (TRANSACTIONS DETAIL) ---
  const transactionHeaders = [
    'No. Nota / Faktur',
    'Tanggal & Waktu',
    'ID Cabang',
    'Nama Kasir',
    'Nama Pelanggan',
    'Metode Pembayaran',
    'Ref / Kode Gateway',
    'Subtotal (Rp)',
    'Diskon (Rp)',
    'Poin Ditukar',
    'Diskon Poin (Rp)',
    'Pajak PPN (Rp)',
    'Total Akhir (Rp)',
    'Jumlah Bayar (Rp)',
    'Kembalian (Rp)',
    'Status Transaksi',
    'Catatan',
  ];

  const transactionDataRows = sales.map((s) => {
    return [
      s.invoiceNumber,
      formatIndonesianDate(s.date),
      s.storeId,
      s.cashierName,
      s.customerName || 'Pelanggan Umum',
      getPaymentMethodLabel(s.paymentMethod),
      s.paymentGatewayRef || '-',
      s.subtotal,
      s.discount,
      s.pointsRedeemed || 0,
      s.pointsDiscount || 0,
      s.tax,
      s.totalAmount,
      s.paidAmount,
      s.changeAmount,
      s.status.toUpperCase(),
      s.notes || '',
    ];
  });

  const transactionsSheet = XLSX.utils.aoa_to_sheet([transactionHeaders, ...transactionDataRows]);
  transactionsSheet['!cols'] = [
    { wch: 22 },
    { wch: 22 },
    { wch: 12 },
    { wch: 18 },
    { wch: 22 },
    { wch: 18 },
    { wch: 20 },
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 15 },
    { wch: 14 },
    { wch: 16 },
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 25 },
  ];
  XLSX.utils.book_append_sheet(workbook, transactionsSheet, 'Rincian Transaksi');

  // --- SHEET 3: PRODUK TERLARIS (TOP PRODUCTS) ---
  const topProductHeaders = ['SKU Produk', 'Nama Produk', 'Jumlah Terjual (Unit)', 'Total Omset (Rp)'];
  const topProductRows = topProducts.map((tp) => [tp.sku, tp.name, tp.quantity, tp.revenue]);
  const topProductsSheet = XLSX.utils.aoa_to_sheet([topProductHeaders, ...topProductRows]);
  topProductsSheet['!cols'] = [{ wch: 16 }, { wch: 35 }, { wch: 22 }, { wch: 20 }];
  XLSX.utils.book_append_sheet(workbook, topProductsSheet, 'Produk Terlaris');

  // Generate and Download
  const cleanStoreName = storeName.replace(/\s+/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `Laporan_Keuangan_${cleanStoreName}_${timeRange}_${dateStr}.xlsx`);
}

/**
 * Exports financial report to a formatted, professional PDF document
 */
export function exportFinancialReportToPDF(options: FinancialReportExportOptions): void {
  const {
    sales,
    stores,
    settings,
    currentUser,
    timeRange,
    storeFilterId,
    totalRevenue,
    totalCost,
    grossProfit,
    profitMargin,
    totalTransactions,
    avgOrderValue,
    totalItemsSold,
    paymentData,
    topProducts,
  } = options;

  const targetStore = stores.find((s) => s.id === storeFilterId);
  const storeName = targetStore ? targetStore.name : 'Semua Cabang Toko';
  const periodLabel =
    timeRange === '7days' ? '7 Hari Terakhir' : timeRange === '30days' ? '30 Hari Terakhir' : 'Semua Data Penjualan';
  const exportDate = new Date().toLocaleString('id-ID');

  // Initialize jsPDF in portrait orientation
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Primary Colors
  const primaryColor: [number, number, number] = [79, 70, 229]; // Indigo 600
  const darkColor: [number, number, number] = [15, 23, 42]; // Slate 900
  const grayColor: [number, number, number] = [100, 116, 139]; // Slate 500

  // 1. Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(settings.name.toUpperCase(), 14, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`${settings.tagline} • ${settings.phone}`, 14, 17);
  doc.text(settings.address, 14, 22);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('LAPORAN KEUANGAN RESMI', pageWidth - 14, 12, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Periode: ${periodLabel}`, pageWidth - 14, 17, { align: 'right' });
  doc.text(`Cabang: ${storeName}`, pageWidth - 14, 22, { align: 'right' });

  // 2. Metadata bar
  let currentY = 35;
  doc.setTextColor(...darkColor);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`Dicetak pada: ${exportDate} | Operator: ${currentUser ? currentUser.name : 'Admin Toko'}`, 14, currentY);

  // 3. Executive KPI Summary Cards (Table Grid)
  currentY += 4;
  autoTable(doc, {
    startY: currentY,
    head: [['TOTAL PENDAPATAN', 'ESTIMASI LABA KOTOR', 'TOTAL TRANSAKSI', 'RATA-RATA ORDER (AOV)', 'PRODUK TERJUAL']],
    body: [
      [
        formatRupiah(totalRevenue),
        `${formatRupiah(grossProfit)}\n(Margin: ${profitMargin}%)`,
        `${totalTransactions} Transaksi`,
        formatRupiah(avgOrderValue),
        `${totalItemsSold} Unit`,
      ],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: [241, 245, 249],
      textColor: [51, 65, 85],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    bodyStyles: {
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 9,
      halign: 'center',
      valign: 'middle',
    },
    styles: {
      cellPadding: 3.5,
    },
  });

  // Get position after KPI table
  currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 7;

  // 4. Section: Distribusi Metode Pembayaran & Produk Terlaris (Side by Side or stacked)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...darkColor);
  doc.text('1. Distribusi Metode Pembayaran & Gateway', 14, currentY);

  currentY += 2;
  const paymentTableRows = paymentData.map((p) => [
    p.name,
    `${p.count} kali`,
    formatRupiah(p.value),
    totalRevenue > 0 ? `${((p.value / totalRevenue) * 100).toFixed(1)}%` : '0%',
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['Metode Pembayaran', 'Frekuensi', 'Total Nominal', 'Porsi Omset']],
    body: paymentTableRows,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    styles: {
      cellPadding: 2.5,
    },
  });

  currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 7;

  // 5. Section: Produk Terlaris
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...darkColor);
  doc.text('2. Lima Produk Terlaris (Top Selling Products)', 14, currentY);

  currentY += 2;
  const topProductTableRows = topProducts.map((tp, idx) => [
    `#${idx + 1}`,
    tp.sku,
    tp.name,
    `${tp.quantity} unit`,
    formatRupiah(tp.revenue),
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['No', 'SKU', 'Nama Produk', 'Jumlah Terjual', 'Total Omset']],
    body: topProductTableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
    },
    styles: {
      cellPadding: 2.5,
    },
  });

  currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 7;

  // 6. Section: Rincian Transaksi Terbaru
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...darkColor);
  doc.text('3. Rincian Riwayat Transaksi', 14, currentY);

  currentY += 2;
  const salesTableRows = sales.slice(0, 30).map((s) => [
    s.invoiceNumber,
    formatIndonesianDate(s.date).slice(0, 16),
    s.customerName || 'Umum',
    s.cashierName,
    getPaymentMethodLabel(s.paymentMethod),
    formatRupiah(s.totalAmount),
    s.status.toUpperCase(),
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['No. Nota', 'Tanggal', 'Pelanggan', 'Kasir', 'Metode', 'Total', 'Status']],
    body: salesTableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [71, 85, 105],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 41, 59],
    },
    styles: {
      cellPadding: 2,
    },
  });

  currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;

  // Check if signature fits on current page, else add new page
  if (currentY > 250) {
    doc.addPage();
    currentY = 25;
  }

  // 7. Signature / Authorization Block
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...grayColor);

  const leftSignX = 25;
  const rightSignX = pageWidth - 60;

  doc.text('Dibuat & Diverifikasi Oleh,', leftSignX, currentY);
  doc.text('Disetujui Oleh (Owner / Manager),', rightSignX, currentY);

  currentY += 20;
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...darkColor);
  doc.text(currentUser ? currentUser.name : 'Kasir / Admin', leftSignX, currentY);
  doc.text('Pemilik Usaha', rightSignX, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...grayColor);
  doc.text(`Jabatan: ${currentUser?.role || 'Staff POS'}`, leftSignX, currentY + 4);
  doc.text('Manajemen Pusat', rightSignX, currentY + 4);

  // Footer Note
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(7);
  doc.text(
    `Dokumen laporan ini dibuat secara otomatis oleh ${settings.name} POS Pro System pada ${exportDate}.`,
    pageWidth / 2,
    pageHeight - 8,
    { align: 'center' }
  );

  // Download PDF
  const cleanStoreName = storeName.replace(/\s+/g, '_');
  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`Laporan_Keuangan_${cleanStoreName}_${timeRange}_${dateStr}.pdf`);
}

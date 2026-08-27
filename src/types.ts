export type PaymentMethod =
  | 'cash'
  | 'qris'
  | 'gopay'
  | 'ovo'
  | 'dana'
  | 'shopeepay'
  | 'debit'
  | 'transfer';

export type PaymentStatus = 'pending' | 'verifying' | 'completed' | 'failed' | 'expired';

export type CustomerTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum';

export type TabType = 'pos' | 'cash-drawer' | 'inventory' | 'history' | 'reports' | 'settings';

export type UserRole = 'super_admin' | 'admin' | 'kasir';

export type ExpenseCategory =
  | 'restock_daily' // Belanja stok/kulakan harian
  | 'supplies' // Perlengkapan toko (plastik, kertas struk, lakban, ATK)
  | 'utilities' // Listrik, PDAM, internet, pulsa, gas
  | 'transport' // Bensin, kurir, biaya parkir, ongkir
  | 'meal' // Uang makan kasir / karyawan
  | 'maintenance' // Perbaikan alat, kebersihan
  | 'other'; // Pengeluaran operasional lain-lain

export type ExpensePaymentMethod = 'cash' | 'transfer';

export interface CashExpense {
  id: string;
  storeId: string; // toko_id
  date: string; // ISO string
  amount: number;
  category: ExpenseCategory;
  description: string;
  paymentMethod: ExpensePaymentMethod;
  recordedBy: string; // nama kasir/petugas
  recordedById?: string;
  receiptNumber?: string;
  notes?: string;
}

export type ShiftStatus = 'open' | 'closed';

export interface CashShift {
  id: string;
  storeId: string; // toko_id
  date: string; // YYYY-MM-DD
  startTime: string; // ISO string
  endTime?: string; // ISO string
  cashierId: string;
  cashierName: string;
  openingFloat: number; // Modal awal kasir (uang kembalian)
  
  // Realtime & Closing calculations
  cashSales: number; // Pemasukan penjualan tunai
  nonCashSales: number; // Pemasukan non-tunai (QRIS, EDC, transfer)
  cashExpenses: number; // Pengeluaran dari uang kas tunai
  expectedCash: number; // openingFloat + cashSales - cashExpenses
  actualCash?: number; // Uang fisik di laci saat dihitung tutup kasir
  cashDifference?: number; // actualCash - expectedCash (0 = Pas, >0 = Lebih, <0 = Kurang)
  
  status: ShiftStatus;
  notes?: string;
  closedBy?: string;
  closedAt?: string;
}

export interface DailyCashSummary {
  date: string; // YYYY-MM-DD
  storeId: string;
  openingFloat: number; // Modal Awal
  grossSales: number; // Total Seluruh Transaksi Penjualan
  cashSales: number; // Penjualan Tunai
  digitalSales: number; // Penjualan Non-Tunai (QRIS, Transfer, EDC, dll)
  totalExpenses: number; // Total Pengeluaran Operasional
  cashExpenses: number; // Pengeluaran Kas Tunai
  nonCashExpenses: number; // Pengeluaran Transfer/Bank
  expectedCashInDrawer: number; // Modal Awal + Penjualan Tunai - Pengeluaran Tunai
  actualCashInDrawer?: number; // Jika sudah dihitung tutup kasir
  cashDifference?: number;
  netCashFlow: number; // grossSales - totalExpenses (Pemasukan Bersih Kas)
  grossProfit: number; // Omset - HPP
  netOperatingProfit: number; // Laba Kotor - Pengeluaran Operasional
  salesCount: number;
  expensesCount: number;
}

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string;
  avatar?: string;
  storeId?: string; // assigned store or undefined for super admin (all stores)
  active: boolean;
  createdAt: string;
  lastLogin?: string;
}

export interface OvoGatewaySettings {
  enabled: boolean;
  merchantId: string;
  appId: string;
  sharedKey: string;
  webhookUrl: string;
  autoPrompt: boolean;
  sandbox: boolean;
}

export interface GoPayGatewaySettings {
  enabled: boolean;
  merchantId: string;
  clientKey: string;
  serverKey: string;
  webhookUrl: string;
  autoVerifyWebhook: boolean;
  sandbox: boolean;
}

export interface BankTransferGatewaySettings {
  enabled: boolean;
  provider: 'midtrans' | 'duitku' | 'manual';
  bcaAccount: string;
  bcaName: string;
  mandiriAccount: string;
  mandiriName: string;
  briAccount: string;
  briName: string;
  bniAccount: string;
  bniName: string;
  autoVerify: boolean;
}

export interface QrisGatewaySettings {
  enabled: boolean;
  merchantName: string;
  nmid: string;
  terminalCode: string;
  acquirerId: string;
  acquirerName: string;
  city: string;
  postalCode: string;
  mcc: string;
  staticBaseString?: string;
  dynamicMode: boolean; // Dynamic QRIS with auto nominal
  feeType?: 'none' | 'fixed' | 'percentage';
  feeValue?: number;
}

export interface PaymentGatewayConfig {
  qris: QrisGatewaySettings;
  ovo: OvoGatewaySettings;
  gopay: GoPayGatewaySettings;
  bankTransfer: BankTransferGatewaySettings;
}

export interface PrinterConfig {
  enabled: boolean;
  type: 'thermal58' | 'thermal80' | 'dotmatrix' | 'bluetooth' | 'system';
  paperWidth: '58mm' | '80mm';
  autoPrintOnCheckout: boolean;
  printStoreLogo: boolean;
  printCashierName: boolean;
  printBarcode: boolean;
  printCustomerPoints: boolean;
  bluetoothDeviceName?: string;
  customHeader?: string;
  customFooter?: string;
}

export interface Store {
  id: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  isMain?: boolean;
  createdAt?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address?: string;
  points: number;
  tier: CustomerTier;
  totalSpent: number;
  totalOrders: number;
  createdAt: string;
  notes?: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  color?: string;
  icon?: string;
}

export interface Product {
  id: string;
  storeId: string; // toko_id
  sku: string;
  name: string;
  categoryId: string;
  price: number;
  costPrice: number;
  stock: number;
  minStockAlert: number;
  image: string;
  unit: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  id: string;
  saleId: string;
  productId: string;
  productName: string;
  sku: string;
  price: number;
  costPrice: number;
  quantity: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  storeId: string; // toko_id
  invoiceNumber: string;
  date: string; // ISO string
  cashierName: string;
  cashierId?: string;
  customerId?: string;
  customerName?: string;
  paymentMethod: PaymentMethod;
  paymentStatus?: PaymentStatus;
  paymentGatewayRef?: string;
  subtotal: number;
  discount: number;
  pointsDiscount?: number;
  pointsEarned?: number;
  pointsRedeemed?: number;
  tax: number;
  totalAmount: number;
  paidAmount: number;
  changeAmount: number;
  items: SaleItem[];
  notes?: string;
  status: 'completed' | 'refunded';
}

export interface StockLog {
  id: string;
  storeId: string; // toko_id
  productId: string;
  productName: string;
  sku: string;
  type: 'sale' | 'restock' | 'adjustment' | 'initial' | 'transfer';
  quantityChange: number;
  previousStock: number;
  newStock: number;
  date: string;
  note: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discountPerItem?: number;
}

export interface WhatsAppGatewaySettings {
  enabled: boolean;
  provider: 'official' | 'fonnte' | 'wagateway' | 'ultramsg' | 'direct';
  apiKey: string;
  senderPhone: string;
  autoSendOnSuccess: boolean;
  customMessageTemplate?: string;
}

export interface AudioNotificationSettings {
  enabled: boolean; // Suara notifikasi aktif
  soundEffect: boolean; // Chime / Nada bel kasir
  voiceAnnouncer: boolean; // Suara asisten kasir (Voice TTS Bahasa Indonesia)
  volume: number; // 0 - 100
  announcePaymentMethod: boolean;
  autoTriggerReceipt: boolean;
  autoDetectSimulation: boolean; // Simulasi deteksi webhook otomatis setelah beberapa detik
  autoDetectDelaySeconds: number; // Durasi detik sebelum pembayaran otomatis terdeteksi (misal 6-12s)
}

export interface EnabledPaymentMethods {
  cash: boolean;
  qris: boolean;
  transfer: boolean;
  debit: boolean;
  gopay?: boolean;
  ovo?: boolean;
  dana?: boolean;
}

export interface StoreSettings {
  name: string;
  tagline: string;
  address: string;
  phone: string;
  receiptFooter: string;
  taxRate: number; // percentage, e.g. 11 for PPN
  enableTax: boolean;
  currency: string;
  pointsRewardRatio: number; // Rp spent for 1 point, default: 10000
  pointsRedeemValue: number; // Rp value per 1 point, default: 100
  enabledPaymentMethods?: EnabledPaymentMethods;
  gateways: PaymentGatewayConfig;
  printer: PrinterConfig;
  whatsapp: WhatsAppGatewaySettings;
  audioNotification?: AudioNotificationSettings;
}

import { CustomerTier, PaymentMethod } from '../types';

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('id-ID').format(num);
}

export function formatIndonesianDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function formatShortDate(dateString: string): string {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
  }).format(date);
}

export function generateInvoiceNumber(): string {
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const day = now.getDate().toString().padStart(2, '0');
  const random = Math.floor(1000 + Math.random() * 9000);
  return `TRX-${year}${month}${day}-${random}`;
}

export function getPaymentMethodLabel(method: PaymentMethod): string {
  switch (method) {
    case 'cash':
      return 'Tunai (Cash)';
    case 'qris':
      return 'QRIS';
    case 'gopay':
      return 'GoPay';
    case 'ovo':
      return 'OVO';
    case 'dana':
      return 'DANA';
    case 'shopeepay':
      return 'ShopeePay';
    case 'debit':
      return 'Kartu Debit / EDC';
    case 'transfer':
      return 'Transfer Bank / VA';
    default:
      return method;
  }
}

export function getPaymentMethodColor(method: PaymentMethod): {
  bg: string;
  text: string;
  border: string;
} {
  switch (method) {
    case 'cash':
      return { bg: 'bg-emerald-50 text-emerald-700', text: 'text-emerald-700', border: 'border-emerald-200' };
    case 'qris':
      return { bg: 'bg-rose-50 text-rose-700', text: 'text-rose-700', border: 'border-rose-200' };
    case 'gopay':
      return { bg: 'bg-sky-50 text-sky-700', text: 'text-sky-700', border: 'border-sky-200' };
    case 'ovo':
      return { bg: 'bg-purple-50 text-purple-700', text: 'text-purple-700', border: 'border-purple-200' };
    case 'dana':
      return { bg: 'bg-blue-50 text-blue-700', text: 'text-blue-700', border: 'border-blue-200' };
    case 'shopeepay':
      return { bg: 'bg-orange-50 text-orange-700', text: 'text-orange-700', border: 'border-orange-200' };
    case 'debit':
      return { bg: 'bg-indigo-50 text-indigo-700', text: 'text-indigo-700', border: 'border-indigo-200' };
    case 'transfer':
      return { bg: 'bg-amber-50 text-amber-700', text: 'text-amber-700', border: 'border-amber-200' };
    default:
      return { bg: 'bg-gray-50 text-gray-700', text: 'text-gray-700', border: 'border-gray-200' };
  }
}

export function getTierBadge(tier: CustomerTier): {
  bg: string;
  text: string;
  border: string;
} {
  switch (tier) {
    case 'Platinum':
      return { bg: 'bg-slate-900 text-purple-300', text: 'text-purple-300', border: 'border-purple-500/40' };
    case 'Gold':
      return { bg: 'bg-amber-100 text-amber-800', text: 'text-amber-800', border: 'border-amber-300' };
    case 'Silver':
      return { bg: 'bg-slate-200 text-slate-700', text: 'text-slate-700', border: 'border-slate-300' };
    case 'Bronze':
    default:
      return { bg: 'bg-orange-50 text-orange-800', text: 'text-orange-800', border: 'border-orange-200' };
  }
}

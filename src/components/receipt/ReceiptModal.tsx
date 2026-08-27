import React, { useRef, useState, useEffect } from 'react';
import { Sale, StoreSettings } from '../../types';
import { formatRupiah, formatIndonesianDate, getPaymentMethodLabel } from '../../utils/formatters';
import {
  Printer,
  Download,
  X,
  CheckCircle2,
  MessageSquare,
  Send,
  Check,
  ArrowRight,
  Image as ImageIcon,
  FileText,
} from 'lucide-react';
import { sendWhatsAppReceiptAPI } from '../../utils/whatsapp';
import { toPng } from 'html-to-image';

interface ReceiptModalProps {
  sale: Sale | null;
  settings: StoreSettings;
  isOpen: boolean;
  onClose: () => void;
  isNewTransaction?: boolean;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  sale,
  settings,
  isOpen,
  onClose,
  isNewTransaction = false,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [waPhone, setWaPhone] = useState('');
  const [isSendingWA, setIsSendingWA] = useState(false);
  const [isDownloadingImage, setIsDownloadingImage] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [waSuccessMessage, setWaSuccessMessage] = useState<string | null>(null);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = async () => {
    if (!sale) return;
    const phone = waPhone.trim();
    if (!phone) {
      alert('Masukkan nomor WhatsApp pelanggan terlebih dahulu.');
      return;
    }

    setIsSendingWA(true);
    try {
      const res = await sendWhatsAppReceiptAPI(sale, settings, phone);
      if (res.success) {
        setWaSuccessMessage('Struk berhasil dikirim ke WhatsApp!');
        if (res.directLink && !settings.whatsapp?.apiKey) {
          window.open(res.directLink, '_blank', 'noopener,noreferrer');
        }
      } else {
        setWaSuccessMessage('Gagal mengirim WhatsApp: ' + res.message);
      }
    } catch {
      setWaSuccessMessage('Gagal mengirim WhatsApp.');
    } finally {
      setIsSendingWA(false);
      setTimeout(() => setWaSuccessMessage(null), 4000);
    }
  };

  const handleDownloadText = () => {
    if (!sale) return;
    const divider = '========================================';
    const lines = [
      settings.name.toUpperCase(),
      settings.tagline,
      settings.address,
      `Telp: ${settings.phone}`,
      divider,
      `No. Struk : ${sale.invoiceNumber}`,
      `Tanggal   : ${formatIndonesianDate(sale.date)}`,
      `Kasir     : ${sale.cashierName}`,
      `Pelanggan : ${sale.customerName || 'Umum'}`,
      divider,
      ...sale.items.map(
        (item) =>
          `${item.productName}\n  ${item.quantity} x ${formatRupiah(item.price)} = ${formatRupiah(item.subtotal)}`
      ),
      divider,
      `Subtotal        : ${formatRupiah(sale.subtotal)}`,
      sale.discount > 0 ? `Diskon          : -${formatRupiah(sale.discount)}` : '',
      sale.tax > 0 ? `Pajak (PPN)     : +${formatRupiah(sale.tax)}` : '',
      `TOTAL AKHIR     : ${formatRupiah(sale.totalAmount)}`,
      `Metode Bayar    : ${getPaymentMethodLabel(sale.paymentMethod)}`,
      `Bayar (Tunai)   : ${formatRupiah(sale.paidAmount)}`,
      `Kembalian       : ${formatRupiah(sale.changeAmount)}`,
      divider,
      settings.receiptFooter,
      '*** TERIMA KASIH ***',
    ].filter(Boolean);

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Struk-${sale.invoiceNumber}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadImage = async () => {
    if (!receiptRef.current || !sale) return;
    setIsDownloadingImage(true);
    try {
      // Capture thermal receipt container with crystal clear quality
      const dataUrl = await toPng(receiptRef.current, {
        quality: 1,
        pixelRatio: 3, // HD 3x resolution
        backgroundColor: '#ffffff',
        cacheBust: true,
        style: {
          borderRadius: '0px',
          boxShadow: 'none',
          margin: '0 auto',
          transform: 'none',
        },
      });

      const link = document.createElement('a');
      link.download = `Nota_${sale.invoiceNumber}.png`;
      link.href = dataUrl;
      link.click();
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Gagal mengunduh gambar nota:', err);
      alert('Gagal membuat file gambar nota. Silakan coba kembali atau gunakan Cetak Struk.');
    } finally {
      setIsDownloadingImage(false);
    }
  };

  return (
    <div
      id="receipt-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="receipt-modal-container"
        className="relative bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header Action Bar */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between no-print shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-bold text-sm truncate">
              {isNewTransaction ? 'Transaksi Berhasil Disimpan' : 'Struk Pembayaran'}
            </span>
          </div>
          <button
            id="close-receipt-modal-btn"
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-white p-2 -mr-1.5 rounded-xl hover:bg-slate-800 transition active:scale-95 cursor-pointer flex items-center gap-1 text-xs font-semibold"
            aria-label="Tutup Struk"
          >
            <span>Tutup</span>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Thermal Receipt Container */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-slate-50 flex-1">
          <div
            ref={receiptRef}
            id="printable-thermal-receipt"
            className="bg-white p-5 sm:p-6 rounded-2xl shadow-xs border border-slate-200 font-mono text-xs text-slate-800 space-y-3"
            style={{ width: '100%', maxWidth: '340px', margin: '0 auto' }}
          >
            {/* Store Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <h2 className="font-bold text-sm tracking-tight text-slate-900">{settings.name}</h2>
              <p className="text-[10px] text-slate-500">{settings.tagline}</p>
              <p className="text-[10px] text-slate-500">{settings.address}</p>
              <p className="text-[10px] text-slate-500">Telp: {settings.phone}</p>
            </div>

            {/* Transaction Metadata */}
            <div className="space-y-1 text-[11px] pb-3 border-b border-dashed border-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">No. Nota</span>
                <span className="font-semibold text-slate-900">{sale.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Waktu</span>
                <span>{formatIndonesianDate(sale.date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kasir</span>
                <span>{sale.cashierName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pelanggan</span>
                <span>{sale.customerName || 'Umum'}</span>
              </div>
            </div>

            {/* Items List */}
            <div className="space-y-2 pb-3 border-b border-dashed border-slate-300">
              <div className="flex justify-between font-semibold text-[10px] text-slate-400 uppercase">
                <span>Item</span>
                <span>Total</span>
              </div>
              {sale.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="font-medium text-slate-900 truncate">{item.productName}</div>
                  <div className="flex justify-between text-slate-600">
                    <span>
                      {item.quantity} &times; {formatRupiah(item.price)}
                    </span>
                    <span>{formatRupiah(item.subtotal)}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Calculations & Totals */}
            <div className="space-y-1.5 pb-3 border-b border-dashed border-slate-300 text-[11px]">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span>{formatRupiah(sale.subtotal)}</span>
              </div>
              {sale.discount > 0 && (
                <div className="flex justify-between text-indigo-700">
                  <span>Diskon</span>
                  <span>-{formatRupiah(sale.discount)}</span>
                </div>
              )}
              {sale.tax > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>Pajak (PPN)</span>
                  <span>+{formatRupiah(sale.tax)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm text-slate-900 pt-1 border-t border-slate-200">
                <span>TOTAL</span>
                <span className="text-indigo-700">{formatRupiah(sale.totalAmount)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="space-y-1 text-[11px] pb-3 border-b border-dashed border-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Metode</span>
                <span className="font-medium">{getPaymentMethodLabel(sale.paymentMethod)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Bayar</span>
                <span>{formatRupiah(sale.paidAmount)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-slate-500">Kembalian</span>
                <span className="text-slate-900">{formatRupiah(sale.changeAmount)}</span>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center pt-2 space-y-1 text-[10px] text-slate-500">
              <p>{settings.receiptFooter}</p>
              <p className="font-bold tracking-widest text-slate-700 pt-1">*** LUNAS ***</p>
            </div>
          </div>
        </div>

        {/* WhatsApp Sharing Bar */}
        <div className="px-4 sm:px-5 py-2.5 bg-emerald-50/80 border-t border-emerald-200/80 no-print space-y-2 shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              Kirim Struk WhatsApp
            </span>
            {waSuccessMessage && (
              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600" />
                {waSuccessMessage}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="tel"
              value={waPhone}
              onChange={(e) => setWaPhone(e.target.value)}
              placeholder="Nomor WA (contoh: 08123456789)..."
              className="flex-1 px-3 py-1.5 text-xs bg-white rounded-xl border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
            />
            <button
              type="button"
              id="send-receipt-whatsapp-btn"
              onClick={handleSendWhatsApp}
              disabled={isSendingWA}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {isSendingWA ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>Kirim</span>
            </button>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-3.5 sm:p-4 bg-white border-t border-slate-200 space-y-2 no-print shrink-0">
          <div className="grid grid-cols-3 gap-2">
            <button
              id="download-receipt-image-btn"
              type="button"
              onClick={handleDownloadImage}
              disabled={isDownloadingImage}
              className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer disabled:opacity-50"
              title="Unduh struk dalam bentuk file gambar PNG resolusi tinggi"
            >
              {isDownloadingImage ? (
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : downloadSuccess ? (
                <Check className="w-4 h-4 text-emerald-200" />
              ) : (
                <ImageIcon className="w-4 h-4" />
              )}
              <span>{isDownloadingImage ? 'Memproses...' : downloadSuccess ? 'Tersimpan!' : 'Unduh Gambar'}</span>
            </button>

            <button
              id="print-receipt-btn"
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Struk</span>
            </button>

            <button
              id="download-receipt-txt-btn"
              type="button"
              onClick={handleDownloadText}
              className="inline-flex items-center justify-center gap-1.5 px-2.5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold text-xs transition cursor-pointer"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              <span>File Teks</span>
            </button>
          </div>

          {/* Primary Done / Return to POS Button */}
          <button
            id="finish-and-close-receipt-btn"
            type="button"
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-2 transition active:scale-98 cursor-pointer shadow-xs"
          >
            <span>Selesai &amp; Transaksi Baru</span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>
      </div>
    </div>
  );
};

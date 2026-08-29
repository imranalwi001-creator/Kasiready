import React, { useRef } from 'react';
import { DigitalTransaction, StoreSettings } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { Printer, X, Share2, Copy, Check, MessageSquare } from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';

interface DigitalReceiptModalProps {
  transaction: DigitalTransaction | null;
  settings: StoreSettings;
  isOpen: boolean;
  onClose: () => void;
}

export const DigitalReceiptModal: React.FC<DigitalReceiptModalProps> = ({
  transaction,
  settings,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopySN = () => {
    if (transaction.serialNumber) {
      navigator.clipboard.writeText(transaction.serialNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendWhatsApp = () => {
    const phone = transaction.targetNumber.replace(/^0/, '62').replace(/\D/g, '');
    let text = `*STRUK PEMBELIAN PRODUK DIGITAL*\n`;
    text += `*${settings.name || 'AVERION POS'}*\n`;
    text += `${settings.address || ''}\n`;
    text += `--------------------------------\n`;
    text += `No. Trx: ${transaction.invoiceNumber}\n`;
    text += `Tanggal: ${new Date(transaction.createdAt).toLocaleString('id-ID')}\n`;
    text += `Produk: ${transaction.productName}\n`;
    text += `No. Tujuan: ${transaction.targetNumber}\n`;
    if (transaction.customerName) {
      text += `Nama: ${transaction.customerName}\n`;
    }
    if (transaction.inquiryData?.tariffPower) {
      text += `Daya: ${transaction.inquiryData.tariffPower}\n`;
    }
    text += `--------------------------------\n`;
    if (transaction.category === 'pln') {
      text += `*KODE TOKEN PLN (20 DIGIT):*\n`;
      text += `*${transaction.serialNumber}*\n`;
      if (transaction.inquiryData?.kwhEstimate) {
        text += `Estimasi: ${transaction.inquiryData.kwhEstimate}\n`;
      }
    } else {
      text += `*NO. SERI (SN):*\n`;
      text += `*${transaction.serialNumber}*\n`;
    }
    text += `--------------------------------\n`;
    text += `Total Bayar: ${formatRupiah(transaction.totalPaid)}\n`;
    text += `Metode: ${transaction.paymentMethod.toUpperCase()}\n`;
    text += `Status: BERHASIL / SUKSES\n\n`;
    text += `_Terima kasih telah bertransaksi di ${settings.name || 'Toko Kami'}_`;

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-[#00A876]" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
              Struk Transaksi Digital
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Receipt Paper Container */}
        <div className="p-4 overflow-y-auto flex-1 bg-slate-100 dark:bg-slate-950 flex justify-center">
          <div
            ref={printRef}
            className="w-full bg-white text-slate-900 p-5 rounded-2xl shadow-sm border border-slate-200 text-xs font-mono select-text"
            id="digital-thermal-receipt"
          >
            {/* Store Header */}
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <div className="flex justify-center mb-1">
                <BrandLogo
                  logoType={settings.logoType}
                  logoPreset={settings.logoPreset}
                  logoUrl={settings.logoUrl}
                  storeName={settings.name}
                  size="sm"
                />
              </div>
              <p className="font-bold text-sm text-slate-900 uppercase tracking-wide">
                {settings.name || 'AVERION POS'}
              </p>
              {settings.address && (
                <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{settings.address}</p>
              )}
              {settings.phone && (
                <p className="text-[10px] text-slate-500 font-mono">Telp: {settings.phone}</p>
              )}
            </div>

            {/* Transaction Meta */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-500">No. Trx:</span>
                <span className="font-bold">{transaction.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Tanggal:</span>
                <span>{new Date(transaction.createdAt).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kasir:</span>
                <span>{transaction.cashierName}</span>
              </div>
            </div>

            {/* Target & Product Detail */}
            <div className="py-3 border-b border-dashed border-slate-300 space-y-1.5 text-[11px]">
              <div className="flex justify-between font-bold text-slate-900">
                <span>{transaction.productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">No. Tujuan:</span>
                <span className="font-bold text-slate-900">{transaction.targetNumber}</span>
              </div>
              {transaction.customerName && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Nama Pelanggan:</span>
                  <span className="font-semibold">{transaction.customerName}</span>
                </div>
              )}
              {transaction.inquiryData?.tariffPower && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Tarif/Daya:</span>
                  <span>{transaction.inquiryData.tariffPower}</span>
                </div>
              )}
            </div>

            {/* SN / TOKEN SPECIAL BOX */}
            <div className="my-3 p-3 bg-slate-50 rounded-xl border-2 border-dashed border-slate-300 text-center">
              <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                {transaction.category === 'pln' ? 'KODE TOKEN PLN (20 DIGIT)' : 'NOMOR SERI (SN)'}
              </span>
              <div className="font-mono font-black text-sm tracking-wider text-[#00A876] break-all select-all">
                {transaction.serialNumber}
              </div>
              {transaction.inquiryData?.kwhEstimate && (
                <span className="text-[10px] text-slate-600 block mt-1">
                  Estimasi Daya: {transaction.inquiryData.kwhEstimate}
                </span>
              )}
            </div>

            {/* Payment Summary */}
            <div className="py-2.5 border-b border-dashed border-slate-300 space-y-1 text-[11px]">
              <div className="flex justify-between font-bold text-slate-900 text-xs">
                <span>TOTAL BAYAR:</span>
                <span>{formatRupiah(transaction.totalPaid)}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Metode Bayar:</span>
                <span className="uppercase font-semibold text-slate-700">
                  {transaction.paymentMethod}
                </span>
              </div>
              <div className="flex justify-between text-emerald-700 font-bold">
                <span>Status:</span>
                <span>SUKSES / LUNAS</span>
              </div>
            </div>

            {/* Footer Notice */}
            <div className="pt-3 text-center text-[10px] text-slate-400 space-y-1">
              <p>{settings.receiptFooter || 'Terima kasih atas kunjungan Anda'}</p>
              <p className="text-[9px] text-slate-400">Simpan struk ini sebagai bukti sah pembelian.</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCopySN}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#00A876]" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'SN Tersalin!' : 'Salin SN'}</span>
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition cursor-pointer shadow-sm"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Kirim WA</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handlePrint}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#00A876] hover:bg-[#009267] text-white text-xs font-black shadow-lg shadow-[#00A876]/25 transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Struk Thermal</span>
          </button>
        </div>
      </div>
    </div>
  );
};

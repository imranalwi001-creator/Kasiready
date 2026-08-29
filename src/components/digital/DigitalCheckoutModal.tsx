import React, { useState, useEffect } from 'react';
import { DigitalProduct, DigitalTransaction, DigitalInquiryData, PaymentMethod, StoreSettings } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { useToast } from '../../context/ToastContext';
import {
  X,
  Check,
  Zap,
  Printer,
  MessageSquare,
  Copy,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  QrCode,
  Banknote,
  Smartphone,
  RefreshCw,
  Clock,
  Sparkles,
} from 'lucide-react';

interface DigitalCheckoutModalProps {
  product: DigitalProduct | null;
  targetNumber: string;
  customerName?: string;
  inquiryData?: DigitalInquiryData;
  settings: StoreSettings;
  isOpen: boolean;
  onClose: () => void;
  onConfirmPayment: (payload: {
    productId: string;
    targetNumber: string;
    customerName?: string;
    paymentMethod: PaymentMethod;
    customSellingPrice?: number;
    inquiryData?: DigitalInquiryData;
    manualSN?: string;
    forceManualFallback?: boolean;
    notes?: string;
  }) => Promise<DigitalTransaction>;
  onOpenReceipt: (tx: DigitalTransaction) => void;
}

export const DigitalCheckoutModal: React.FC<DigitalCheckoutModalProps> = ({
  product,
  targetNumber,
  customerName,
  inquiryData,
  settings,
  isOpen,
  onClose,
  onConfirmPayment,
  onOpenReceipt,
}) => {
  const { toast } = useToast();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [cashGivenStr, setCashGivenStr] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<string>('Menghubungkan ke Server Operator...');
  const [completedTx, setCompletedTx] = useState<DigitalTransaction | null>(null);
  const [copiedSN, setCopiedSN] = useState<boolean>(false);

  // Dual Mode / Manual Input State
  const defaultMode = settings.ppobGateway?.mode || 'auto_api';
  const [isManualOverride, setIsManualOverride] = useState<boolean>(defaultMode === 'manual');
  const [manualSNInput, setManualSNInput] = useState<string>('');

  const sellingPrice = product
    ? product.sellingPrice > 0
      ? product.sellingPrice
      : ((inquiryData?.totalBill || 0) + (product.adminFee || 2500))
    : 0;

  useEffect(() => {
    if (isOpen && product) {
      setCompletedTx(null);
      setIsProcessing(false);
      setPaymentMethod('cash');
      setCashGiven(sellingPrice);
      setCashGivenStr(sellingPrice.toString());
      setCopiedSN(false);
      setIsManualOverride(settings.ppobGateway?.mode === 'manual');
      setManualSNInput('');
    }
  }, [isOpen, product, sellingPrice, settings.ppobGateway?.mode]);

  if (!isOpen || !product) return null;

  const changeDue = Math.max(0, cashGiven - sellingPrice);

  const handleCashGivenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '');
    const num = Number(raw) || 0;
    setCashGiven(num);
    setCashGivenStr(raw);
  };

  const handleQuickCash = (val: number) => {
    setCashGiven(val);
    setCashGivenStr(val.toString());
  };

  const handleGenerateSampleSN = () => {
    if (product.category === 'pln') {
      const g = () => Math.floor(1000 + Math.random() * 9000).toString();
      setManualSNInput(`${g()}-${g()}-${g()}-${g()}-${g()}`);
    } else {
      setManualSNInput(`SN${Date.now().toString().slice(-8)}${Math.floor(1000 + Math.random() * 9000)}`);
    }
  };

  const handleExecutePayment = async () => {
    if (paymentMethod === 'cash' && cashGiven < sellingPrice) {
      toast.warning('Nominal Bayar Kurang', 'Uang tunai yang diterima kurang dari total harga tagihan.');
      return;
    }

    setIsProcessing(true);

    try {
      if (isManualOverride) {
        setProcessingStep('Menyimpan Transaksi Manual Kasir & Mencatat Saldo...');
        await new Promise((r) => setTimeout(r, 400));
      } else {
        setProcessingStep('Mengirim Permintaan ke Switcher Server PPOB...');
        await new Promise((r) => setTimeout(r, 600));
        setProcessingStep('Memvalidasi Nomor Tujuan & Mengalokasikan Saldo...');
        await new Promise((r) => setTimeout(r, 600));
        setProcessingStep('Menerbitkan Nomor Seri (SN) / Token...');
        await new Promise((r) => setTimeout(r, 400));
      }

      const tx = await onConfirmPayment({
        productId: product.id,
        targetNumber,
        customerName,
        paymentMethod,
        customSellingPrice: sellingPrice,
        inquiryData,
        manualSN: isManualOverride ? manualSNInput.trim() : undefined,
        forceManualFallback: isManualOverride,
        notes: isManualOverride
          ? `Transaksi manual kasir (${product.name} ke ${targetNumber})`
          : `Transaksi API ${product.name} ke ${targetNumber}`,
      });

      setCompletedTx(tx);
      toast.success('Transaksi Berhasil!', `${product.name} ke ${targetNumber} sukses diproses.`);
    } catch (err: any) {
      toast.error('Transaksi Gagal Diproses', err.message || 'Terjadi gangguan saat memproses transaksi ke server.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopySN = () => {
    if (completedTx?.serialNumber) {
      navigator.clipboard.writeText(completedTx.serialNumber);
      setCopiedSN(true);
      setTimeout(() => setCopiedSN(false), 2000);
    }
  };

  const handleSendWhatsApp = () => {
    if (!completedTx) return;
    const phone = completedTx.targetNumber.replace(/^0/, '62').replace(/\D/g, '');
    let text = `*STRUK DIGITAL ${settings.name || 'AVERION POS'}*\n`;
    text += `Terima kasih! Pembelian *${completedTx.productName}* BERHASIL.\n`;
    text += `No. Tujuan: ${completedTx.targetNumber}\n`;
    if (completedTx.customerName) text += `Nama: ${completedTx.customerName}\n`;
    text += `--------------------------------\n`;
    if (completedTx.category === 'pln') {
      text += `*TOKEN PLN (20 DIGIT):*\n`;
      text += `*${completedTx.serialNumber}*\n`;
    } else {
      text += `*KODE SN:* ${completedTx.serialNumber}\n`;
    }
    text += `--------------------------------\n`;
    text += `Total Bayar: ${formatRupiah(completedTx.totalPaid)}\n`;
    text += `Status: SUKSES / LUNAS\n`;

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
  };

  // Generate quick cash buttons based on selling price
  const quickCashOptions = [
    sellingPrice,
    Math.ceil(sellingPrice / 5000) * 5000,
    Math.ceil(sellingPrice / 10000) * 10000,
    Math.ceil(sellingPrice / 20000) * 20000,
    50000,
    100000,
  ].filter((v, idx, arr) => v >= sellingPrice && arr.indexOf(v) === idx).slice(0, 4);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-[#00A876]">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                {completedTx ? 'Transaksi Berhasil' : 'Konfirmasi Pembayaran Digital'}
              </h3>
              <p className="text-[11px] text-slate-500 font-mono">
                {product.provider.toUpperCase()} • {product.category.toUpperCase()}
              </p>
            </div>
          </div>
          {!isProcessing && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* SUCCESS SCREEN */}
          {completedTx ? (
            <div className="space-y-5 animate-in zoom-in-95 duration-200">
              <div className="text-center space-y-1.5">
                <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-[#00A876] flex items-center justify-center shadow-lg shadow-[#00A876]/20">
                  <Check className="w-9 h-9 stroke-[3]" />
                </div>
                <h4 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  Transaksi Sukses!
                </h4>
                <p className="text-xs text-slate-500">
                  Pulsa / Kuota / Token telah berhasil diterbitkan oleh operator.
                </p>
              </div>

              {/* Monospace SN / Token High-Contrast Box */}
              <div className="p-4 rounded-2xl bg-slate-900 text-white border-2 border-emerald-500 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] uppercase font-bold text-emerald-400 tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    {completedTx.category === 'pln' ? 'KODE TOKEN LISTRIK (20 DIGIT)' : 'NOMOR SERI OPERATOR (SN)'}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySN}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition cursor-pointer"
                  >
                    {copiedSN ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSN ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>

                <div className="font-mono text-xl sm:text-2xl font-black text-center tracking-wider py-2 text-emerald-400 select-all break-all">
                  {completedTx.serialNumber}
                </div>

                {completedTx.inquiryData?.kwhEstimate && (
                  <div className="text-center text-xs text-slate-300 border-t border-slate-800 pt-2 mt-1">
                    Estimasi Listrik: <span className="font-bold text-white">{completedTx.inquiryData.kwhEstimate}</span>
                  </div>
                )}
              </div>

              {/* Transaction Recap Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Mode Eksekusi:</span>
                  <span className="font-bold px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950/80 text-[#00A876] border border-emerald-300 dark:border-emerald-800">
                    {completedTx.processingMode === 'auto_api' ? '⚡ Auto-API (DigiFlazz)' : '📝 Input Manual (Agen/EDC)'}
                  </span>
                </div>
                {completedTx.apiRefId && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">API Ref ID:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">{completedTx.apiRefId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">No. Invoice:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{completedTx.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Produk:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">{completedTx.productName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">No. Tujuan:</span>
                  <span className="font-mono font-bold text-[#00A876]">{completedTx.targetNumber}</span>
                </div>
                {completedTx.customerName && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Nama Pelanggan:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{completedTx.customerName}</span>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-2">
                  <span className="text-slate-500 font-bold">Total Pembayaran:</span>
                  <span className="font-black text-sm text-slate-900 dark:text-slate-100">
                    {formatRupiah(completedTx.totalPaid)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Keuntungan Toko:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    +{formatRupiah(completedTx.profit)}
                  </span>
                </div>
              </div>
            </div>
          ) : isProcessing ? (
            /* PROCESSING LOADER */
            <div className="py-12 text-center space-y-4 animate-pulse">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-[#00A876] flex items-center justify-center">
                <RefreshCw className="w-8 h-8 animate-spin" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-black text-slate-900 dark:text-slate-100">
                  Memproses Transaksi...
                </h4>
                <p className="text-xs text-slate-500">{processingStep}</p>
              </div>
            </div>
          ) : (
            /* CHECKOUT FORM */
            <div className="space-y-4">
              {/* Mode Banner & Fallback Toggle */}
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    isManualOverride ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300' : 'bg-emerald-100 text-[#00A876] dark:bg-emerald-900/60'
                  }`}>
                    {isManualOverride ? <Smartphone className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Mode Pemrosesan
                    </span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {isManualOverride ? 'Mode Manual (Aplikasi HP/EDC)' : '⚡ Auto-API (DigiFlazz)'}
                    </span>
                  </div>
                </div>

                {settings.ppobGateway?.allowManualFallback && (
                  <button
                    type="button"
                    onClick={() => setIsManualOverride(!isManualOverride)}
                    className="text-[11px] font-bold text-[#00A876] hover:underline cursor-pointer"
                  >
                    {isManualOverride ? 'Ganti ke Auto-API' : 'Beralih ke Input Manual'}
                  </button>
                )}
              </div>

              {/* Manual SN Input Field if Manual Mode */}
              {isManualOverride && (
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
                      {product.category === 'pln' ? 'Input Kode Token PLN (20 Digit)' : 'Input Nomor Seri SN dari Agen HP'}
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateSampleSN}
                      className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                    >
                      + Isi Otomatis
                    </button>
                  </div>
                  <input
                    type="text"
                    value={manualSNInput}
                    onChange={(e) => setManualSNInput(e.target.value)}
                    placeholder={product.category === 'pln' ? 'contoh: 1234-5678-9012-3456-7890' : 'contoh: SN202688889999'}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    SN / Token ini akan langsung dicetak pada struk thermal untuk pelanggan.
                  </p>
                </div>
              )}

              {/* Product Summary Card */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#00A876] block mb-0.5">
                    {product.provider} • {product.category.toUpperCase()}
                  </span>
                  <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                    {product.name}
                  </h4>
                  <p className="text-xs font-mono font-bold text-slate-600 dark:text-slate-400 mt-0.5">
                    Tujuan: <span className="text-slate-900 dark:text-white">{targetNumber}</span>
                    {customerName ? ` (${customerName})` : ''}
                  </p>
                  {inquiryData?.tariffPower && (
                    <p className="text-[11px] text-slate-500">Daya: {inquiryData.tariffPower}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Tagihan</span>
                  <span className="text-lg font-black text-slate-900 dark:text-slate-100">
                    {formatRupiah(sellingPrice)}
                  </span>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5 block">
                  Pilih Metode Pembayaran
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'cash', label: 'Tunai', icon: Banknote },
                    { id: 'qris', label: 'QRIS', icon: QrCode },
                    { id: 'transfer', label: 'Transfer', icon: CreditCard },
                    { id: 'dana', label: 'DANA', icon: Smartphone },
                    { id: 'gopay', label: 'GoPay', icon: Smartphone },
                    { id: 'ovo', label: 'OVO', icon: Smartphone },
                  ].map((m) => {
                    const Icon = m.icon;
                    const isSelected = paymentMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setPaymentMethod(m.id as PaymentMethod)}
                        className={`py-3 px-2 rounded-2xl flex flex-col items-center gap-1.5 transition cursor-pointer border ${
                          isSelected
                            ? 'bg-[#00A876] text-white border-[#00A876] shadow-sm shadow-[#00A876]/25'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-xs font-bold">{m.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Cash Calculation If Method is Cash */}
              {paymentMethod === 'cash' && (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 block">
                      Uang Diterima dari Pelanggan (Rp)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                        Rp
                      </span>
                      <input
                        type="text"
                        value={cashGivenStr ? Number(cashGivenStr).toLocaleString('id-ID') : ''}
                        onChange={handleCashGivenChange}
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 text-base font-bold focus:outline-hidden focus:ring-2 focus:ring-[#00A876]"
                      />
                    </div>
                  </div>

                  {/* Quick Cash Buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    {quickCashOptions.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => handleQuickCash(amt)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          cashGiven === amt
                            ? 'bg-[#00A876] text-white'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {amt === sellingPrice ? 'Uang Pas' : formatRupiah(amt)}
                      </button>
                    ))}
                  </div>

                  {/* Kembalian Box */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-bold text-slate-500 uppercase">Kembalian:</span>
                    <span
                      className={`text-base font-black ${
                        changeDue > 0 ? 'text-[#00A876]' : 'text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {formatRupiah(changeDue)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          {completedTx ? (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => onOpenReceipt(completedTx)}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-bold transition cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-[#00A876]" />
                  <span>Lihat Struk Thermal</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition cursor-pointer shadow-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Kirim WhatsApp</span>
                </button>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 rounded-2xl bg-[#00A876] hover:bg-[#009267] text-white text-xs font-black shadow-lg shadow-[#00A876]/25 transition cursor-pointer"
              >
                + Selesai & Transaksi Baru
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isProcessing}
                className="w-1/3 py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleExecutePayment}
                disabled={isProcessing || (paymentMethod === 'cash' && cashGiven < sellingPrice)}
                className="w-2/3 py-3 rounded-2xl bg-[#00A876] hover:bg-[#009267] disabled:opacity-50 text-white text-xs font-black shadow-lg shadow-[#00A876]/25 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Bayar & Proses Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

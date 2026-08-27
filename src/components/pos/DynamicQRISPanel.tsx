import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { formatRupiah } from '../../utils/formatters';
import {
  createDynamicQRISData,
  DynamicQRISResult,
  DEFAULT_DANA_QRIS,
} from '../../utils/qris';
import {
  triggerPaymentSuccessNotification,
} from '../../utils/soundNotifications';
import {
  CheckCircle2,
  Copy,
  Download,
  Printer,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DynamicQRISPanelProps {
  amount: number;
  invoiceNumber?: string;
  onSuccess: (refId: string) => void;
  preferredWallet?: 'dana' | 'qris' | 'gopay' | 'ovo';
}

export const DynamicQRISPanel: React.FC<DynamicQRISPanelProps> = ({
  amount,
  invoiceNumber,
  onSuccess,
}) => {
  const { settings, activeStore } = useStore();
  const [qrisResult, setQrisResult] = useState<DynamicQRISResult | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const [copiedAmount, setCopiedAmount] = useState<boolean>(false);
  const [isDynamicMode] = useState<boolean>(
    settings.gateways?.qris?.dynamicMode ?? true
  );

  const [status, setStatus] = useState<
    'waiting' | 'verifying' | 'success' | 'expired'
  >('waiting');

  const qrisConfig = {
    ...DEFAULT_DANA_QRIS,
    ...(settings.gateways?.qris || {}),
    merchantName: settings.gateways?.qris?.merchantName || activeStore?.name || 'Toko Berkah Sejahtera',
  };

  const generateQR = async () => {
    setIsGenerating(true);
    setStatus('waiting');

    try {
      const generated = await createDynamicQRISData(
        amount,
        qrisConfig,
        invoiceNumber || `TRX-${Date.now().toString().slice(-6)}`,
        isDynamicMode
      );
      setQrisResult(generated);
    } catch (err) {
      console.error('Failed to build dynamic QRIS:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    generateQR();
  }, [amount, isDynamicMode, settings.gateways?.qris]);

  const handleConfirmPayment = () => {
    setStatus('verifying');

    setTimeout(() => {
      setStatus('success');

      // 1. Confetti Animation
      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {
        // Safe catch
      }

      // 2. Sound notification
      if (settings.audioNotification?.enabled ?? true) {
        triggerPaymentSuccessNotification(
          amount,
          'QRIS',
          undefined,
          settings.audioNotification
        );
      }

      // 3. Complete payment transaction
      const refNumber = `QRIS-${Date.now().toString().slice(-8)}`;
      setTimeout(() => {
        onSuccess(refNumber);
      }, 1000);
    }, 600);
  };

  const handleCopyAmount = () => {
    navigator.clipboard.writeText(amount.toString());
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  const handleDownloadQR = () => {
    if (!qrisResult?.qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrisResult.qrDataUrl;
    a.download = `QRIS_${qrisConfig.merchantName}_Rp${amount}.png`;
    a.click();
  };

  const handlePrintQR = () => {
    if (!qrisResult?.qrDataUrl) return;
    const printWindow = window.open('', '_blank', 'width=380,height=520');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cetak QRIS - ${qrisConfig.merchantName}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; text-align: center; padding: 20px; color: #0f172a; }
            .header { border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; margin-bottom: 12px; }
            .qris-logo { font-size: 20px; font-weight: 900; color: #e11d48; letter-spacing: -1px; }
            .merchant-name { font-size: 15px; font-weight: 700; margin: 4px 0 2px; }
            .nmid { font-size: 11px; color: #64748b; font-family: monospace; }
            .amount-box { background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 8px; margin: 12px 0; }
            .amount-label { font-size: 11px; color: #475569; }
            .amount-value { font-size: 20px; font-weight: 800; color: #0284c7; }
            .qr-img { width: 220px; height: 220px; margin: 8px auto; display: block; }
            .footer { font-size: 10px; color: #94a3b8; margin-top: 14px; border-top: 1px dashed #cbd5e1; padding-top: 8px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="qris-logo">QRIS <span style="font-size: 12px; color: #334155; font-weight: bold; border-left: 1px solid #cbd5e1; padding-left: 6px;">GPN</span></div>
            <div class="merchant-name">${qrisConfig.merchantName}</div>
            <div class="nmid">NMID: ${qrisConfig.nmid}</div>
          </div>
          <div class="amount-box">
            <div class="amount-label">TOTAL TAGIHAN</div>
            <div class="amount-value">${formatRupiah(amount)}</div>
          </div>
          <img class="qr-img" src="${qrisResult.qrDataUrl}" alt="QRIS Code" />
          <div class="footer">
            Dapat discan dengan BCA, Mandiri, BRI, BNI, DANA, GoPay, OVO, ShopeePay & Semua m-Banking.
          </div>
          <script>
            window.onload = () => { window.print(); window.close(); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 sm:p-6 shadow-xl max-w-md mx-auto text-center space-y-4">
      {/* Official QRIS Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs flex items-center gap-1.5">
            <span className="font-black text-rose-600 text-sm tracking-tight">QRIS</span>
            <span className="text-[10px] font-bold text-slate-700 border-l border-slate-300 pl-1.5">GPN</span>
          </div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Standar Nasional
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Nominal Terkunci</span>
        </div>
      </div>

      {/* Merchant Details */}
      <div className="space-y-0.5">
        <h3 className="text-base font-extrabold text-slate-900 truncate">
          {qrisConfig.merchantName}
        </h3>
        <p className="text-[11px] font-mono text-slate-400">
          NMID: {qrisConfig.nmid}
        </p>
      </div>

      {/* Center QRIS Display Card (Large, Focused & Clear) */}
      <div className="relative w-64 h-64 sm:w-72 sm:h-72 mx-auto bg-white p-3.5 rounded-2xl border-2 border-slate-200 shadow-md flex items-center justify-center">
        {isGenerating ? (
          <div className="flex flex-col items-center gap-2 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-rose-500" />
            <span className="text-xs font-semibold">Menyiapkan QR Code...</span>
          </div>
        ) : qrisResult?.qrDataUrl ? (
          <>
            <img
              src={qrisResult.qrDataUrl}
              alt={`QRIS ${qrisConfig.merchantName}`}
              className="w-full h-full object-contain rounded-xl select-none"
            />
            {status === 'verifying' && (
              <div className="absolute inset-0 bg-white/95 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center p-4 text-center animate-in fade-in">
                <div className="w-9 h-9 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-2" />
                <p className="text-xs font-bold text-slate-900">Memproses Pembayaran...</p>
              </div>
            )}
            {status === 'success' && (
              <div className="absolute inset-0 bg-emerald-600/95 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center p-4 text-center text-white animate-in zoom-in-95">
                <CheckCircle2 className="w-14 h-14 mb-1.5 animate-bounce" />
                <p className="text-lg font-black tracking-tight">LUNAS!</p>
                <p className="text-xs text-emerald-100 font-semibold">Pembayaran QRIS Diterima</p>
              </div>
            )}
            {status === 'expired' && (
              <div className="absolute inset-0 bg-rose-900/90 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center p-4 text-center text-white">
                <AlertCircle className="w-10 h-10 text-rose-300 mb-1" />
                <p className="text-xs font-bold">QR Telah Kedaluwarsa</p>
                <button
                  type="button"
                  onClick={generateQR}
                  className="mt-2 px-3 py-1.5 bg-white text-rose-900 rounded-xl text-xs font-bold shadow-xs hover:bg-rose-50 cursor-pointer"
                >
                  Perbarui QR
                </button>
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* Bill Amount Highlight */}
      <div className="bg-slate-900 text-white p-3 rounded-2xl flex items-center justify-between shadow-inner">
        <div className="text-left">
          <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
            Total Tagihan
          </span>
          <span className="text-xl sm:text-2xl font-black font-mono tracking-tight text-amber-300">
            {formatRupiah(amount)}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopyAmount}
          className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer border border-slate-700"
          title="Salin Nominal Tagihan"
        >
          {copiedAmount ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copiedAmount ? 'Tersalin' : 'Salin'}</span>
        </button>
      </div>

      {/* Universal Support Indicators */}
      <div className="space-y-1.5 pt-1">
        <p className="text-[11px] text-slate-500 font-medium">
          Dapat discan dengan seluruh aplikasi m-Banking &amp; e-Wallet:
        </p>
        <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px] font-bold text-slate-600">
          <span className="px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200">BCA</span>
          <span className="px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200">Mandiri</span>
          <span className="px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200">BRI</span>
          <span className="px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200">BNI</span>
          <span className="px-2 py-0.5 bg-sky-50 text-sky-700 rounded-md border border-sky-200">DANA</span>
          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md border border-emerald-200">GoPay</span>
          <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md border border-purple-200">OVO</span>
          <span className="px-2 py-0.5 bg-orange-50 text-orange-700 rounded-md border border-orange-200">ShopeePay</span>
        </div>
      </div>

      {/* Primary Kasir Confirmation Button */}
      <div className="pt-2 space-y-2">
        <button
          type="button"
          id="btn-confirm-qris-paid"
          onClick={handleConfirmPayment}
          disabled={status !== 'waiting'}
          className="w-full py-3.5 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-bold text-sm shadow-md hover:shadow-lg transition active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-200" />
          <span>Pelanggan Sudah Bayar (Konfirmasi Lunas)</span>
        </button>

        {/* Secondary Auxiliary Buttons */}
        <div className="flex items-center justify-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleDownloadQR}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Unduh QR</span>
          </button>
          <button
            type="button"
            onClick={handlePrintQR}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span>Cetak QR</span>
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { Sale } from '../../types';
import { formatRupiah, getPaymentMethodLabel } from '../../utils/formatters';
import { CheckCircle2, Volume2, Sparkles, X, Printer, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PaymentSuccessBannerProps {
  sale: Sale | null;
  onClose: () => void;
  onPrint?: () => void;
  autoHideDuration?: number; // ms
}

export const PaymentSuccessBanner: React.FC<PaymentSuccessBannerProps> = ({
  sale,
  onClose,
  onPrint,
  autoHideDuration = 7000,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (sale) {
      setIsVisible(true);
      if (autoHideDuration > 0) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }, autoHideDuration);
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [sale, autoHideDuration, onClose]);

  if (!sale || !isVisible) return null;

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-30 max-w-sm w-full px-2 pointer-events-auto">
      <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl border border-emerald-500/40 animate-in slide-in-from-bottom-4 duration-200">
        <div className="flex items-start justify-between gap-2.5">
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                  Pembayaran Sukses
                </span>
                <span className="text-[10px] text-slate-400">&bull;</span>
                <span className="text-[10px] text-slate-300 font-medium">
                  {getPaymentMethodLabel(sale.paymentMethod)}
                </span>
              </div>
              <h4 className="text-sm font-bold text-white mt-0.5 font-mono">
                {formatRupiah(sale.totalAmount)}
              </h4>
              {sale.customerName && sale.customerName !== 'Pelanggan Umum' && (
                <p className="text-[11px] text-slate-400">
                  Pelanggan: {sale.customerName}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsVisible(false);
              setTimeout(onClose, 200);
            }}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action button in toast */}
        {onPrint && (
          <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-end">
            <button
              type="button"
              onClick={onPrint}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-semibold transition cursor-pointer flex items-center gap-1"
            >
              <Printer className="w-3 h-3" />
              <span>Lihat Struk</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

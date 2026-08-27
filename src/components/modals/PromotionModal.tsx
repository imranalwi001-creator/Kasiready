import React, { useState } from 'react';
import {
  Tag,
  X,
  Plus,
  Sparkles,
  Percent,
  Gift,
  CheckCircle2,
  Calendar,
  Layers,
} from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';

interface PromotionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PromotionModal: React.FC<PromotionModalProps> = ({ isOpen, onClose }) => {
  const [promos, setPromos] = useState([
    {
      id: 'p-1',
      code: 'HEMATMERDEKA',
      title: 'Diskon Belanja Sembako Merdeka',
      discount: '10% (Maks. Rp 15.000)',
      minSpend: 100000,
      status: 'Aktif',
      expiry: '31 Agu 2026',
    },
    {
      id: 'p-2',
      code: 'MEMBERVIP',
      title: 'Cashback Poin Member Platinum & Gold',
      discount: '5.000 Poin Tambahan',
      minSpend: 50000,
      status: 'Aktif',
      expiry: '31 Des 2026',
    },
    {
      id: 'p-3',
      code: 'GROSIR5L',
      title: 'Promo Minyak Goreng & Beras Hemat',
      discount: 'Potongan Rp 5.000 / 2 item',
      minSpend: 75000,
      status: 'Aktif',
      expiry: '15 Sep 2026',
    },
  ]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#00A876] flex items-center justify-center text-white font-bold">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold">Promosi & Diskon Toko</h2>
              <p className="text-[11px] text-slate-400">Kelola kupon diskon dan promosi pelanggan</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Promos List */}
        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          {promos.map((promo) => (
            <div
              key={promo.id}
              className="p-4 rounded-xl border border-slate-200 bg-white hover:border-[#00A876] transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <code className="px-2.5 py-1 rounded-md bg-teal-50 border border-teal-200 text-[#00A876] font-bold text-xs">
                    {promo.code}
                  </code>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {promo.status}
                  </span>
                </div>
                <h4 className="font-bold text-xs text-slate-900 mt-1.5">{promo.title}</h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Min. Belanja: {formatRupiah(promo.minSpend)} &bull; Berlaku s/d {promo.expiry}
                </p>
              </div>
              <div className="text-right">
                <span className="font-extrabold text-sm text-[#00A876] block">
                  {promo.discount}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Diterapkan secara otomatis di kasir saat checkout</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

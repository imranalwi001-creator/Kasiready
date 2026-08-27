import React from 'react';
import {
  ShieldCheck,
  X,
  CheckCircle2,
  Lock,
  Cpu,
  KeyRound,
  Calendar,
  Sparkles,
  Server,
  Award,
} from 'lucide-react';
import { useStore } from '../../context/StoreContext';

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LicenseModal: React.FC<LicenseModalProps> = ({ isOpen, onClose }) => {
  const { settings } = useStore();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 bg-[#00A876] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/20 shadow-xs">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold">Lisensi & Keaslian Sistem</h2>
              <p className="text-xs text-white/85">Averion POS Pro Enterprise</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 text-xs text-slate-700">
          <div className="p-4 rounded-xl bg-teal-50/70 border border-[#b2e5d6] flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-800">
                STATUS LISENSI
              </span>
              <p className="text-base font-extrabold text-[#00A876] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Aktif & Terverifikasi (Lifetime)
              </p>
            </div>
            <span className="px-3 py-1 bg-[#00A876] text-white font-bold text-[10px] rounded-full shadow-xs">
              PRO ENTERPRISE
            </span>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Nama Aplikasi / Toko</span>
              <strong className="text-slate-900">{settings.name || 'Toko Retail POS Pro'}</strong>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Nomor Serial Lisensi</span>
              <code className="font-mono text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                AVR-POS-2026-X892-PRO
              </code>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Tipe Lisensi</span>
              <strong className="text-slate-900">Perpetual Multi-Store Unlimited</strong>
            </div>

            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Enkripsi Data</span>
              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                <Lock className="w-3 h-3" /> AES-256 Offline-First
              </span>
            </div>

            <div className="flex justify-between py-2">
              <span className="text-slate-500">Pembaruan Sistem</span>
              <strong className="text-slate-900">Otomatis / v3.0 (Terbaru)</strong>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

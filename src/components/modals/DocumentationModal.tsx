import React, { useState } from 'react';
import {
  BookOpen,
  X,
  CheckCircle2,
  ShoppingCart,
  Package,
  Receipt,
  Printer,
  QrCode,
  Users,
  ShieldCheck,
  Search,
  ExternalLink,
  ChevronRight,
  Layers,
  Sparkles,
} from 'lucide-react';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocumentationModal: React.FC<DocumentationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedTopic, setSelectedTopic] = useState<string>('intro');
  const [searchQuery, setSearchQuery] = useState<string>('');

  if (!isOpen) return null;

  const topics = [
    {
      id: 'intro',
      title: 'Pengantar Sistem & Gambaran Umum',
      icon: Sparkles,
      content: (
        <div className="space-y-4 text-slate-700 text-sm">
          <h3 className="text-lg font-bold text-slate-900">Selamat Datang di Sistem POS & Manajemen Toko Pro</h3>
          <p>
            Aplikasi ini dirancang khusus untuk memenuhi standar operasional toko retail, minimarket, dan toko kelontong modern dengan kecepatan transaksi tinggi, pencatatan stok multi-cabang yang presisi, serta laporan keuangan otomatis.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-teal-50 border border-teal-100">
              <h4 className="font-bold text-xs text-[#00A876] uppercase tracking-wider mb-1">Fitur Utama</h4>
              <ul className="text-xs space-y-1 list-disc list-inside text-slate-700">
                <li>Kasir Cepat & Pemindai Barcode Kamera/Scanner</li>
                <li>Manajemen Stok Real-Time & Peringatan Habis</li>
                <li>Dukungan Multi-Cabang & Transfer Antar Toko</li>
                <li>QRIS Statis/Dinamis & E-Wallet Nasional</li>
              </ul>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <h4 className="font-bold text-xs text-slate-700 uppercase tracking-wider mb-1">Keamanan & Peran</h4>
              <ul className="text-xs space-y-1 list-disc list-inside text-slate-600">
                <li>Super Admin (Akses Penuh & Konfigurasi)</li>
                <li>Admin Toko (Manajemen Stok & Laporan)</li>
                <li>Kasir (Transaksi & Shift Buka/Tutup Kas)</li>
              </ul>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'pos_guide',
      title: 'Panduan Kasir & Pembayaran QRIS',
      icon: ShoppingCart,
      content: (
        <div className="space-y-4 text-slate-700 text-sm">
          <h3 className="text-lg font-bold text-slate-900">Langkah Operasional Kasir (POS)</h3>
          <ol className="space-y-2.5 list-decimal list-inside text-xs leading-relaxed">
            <li>
              <strong>Pilih / Scan Produk:</strong> Gunakan barcode scanner (USB/Bluetooth), kamera perangkat, atau cari nama produk/SKU di kolom pencarian.
            </li>
            <li>
              <strong>Atur Kuantitas & Diskon:</strong> Klik tombol (+) / (-) pada keranjang atau pilih pelanggan untuk menerapkan poin reward/diskon tier member.
            </li>
            <li>
              <strong>Klik Tombol Bayar / Checkout:</strong> Pilih metode pembayaran yang diinginkan pelanggan: Tunai, QRIS, GoPay, OVO, Dana, ShopeePay, atau Debit.
            </li>
            <li>
              <strong>Cetak Struk:</strong> Sistem akan otomatis mencetak struk kasir melalui printer thermal (58mm / 80mm) atau unduh struk digital / kirim via WhatsApp.
            </li>
          </ol>
        </div>
      ),
    },
    {
      id: 'inventory_guide',
      title: 'Manajemen Stok & Peringatan Restock',
      icon: Package,
      content: (
        <div className="space-y-4 text-slate-700 text-sm">
          <h3 className="text-lg font-bold text-slate-900">Manajemen Inventaris Barang</h3>
          <p className="text-xs">
            Stok produk akan berkurang secara otomatis setiap transaksi selesai dan bertambah kembali secara akurat jika dilakukan pembatalan/refund.
          </p>
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
            <strong>Peringatan Stok Menipis:</strong>
            <p>
              Produk dengan sisa unit di bawah batas minimum (default: 10 unit) akan otomatis memunculkan tanda lonceng merah di header dan daftar aksi restock cepat.
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'printer_guide',
      title: 'Pengaturan Printer Thermal & Struk',
      icon: Printer,
      content: (
        <div className="space-y-4 text-slate-700 text-sm">
          <h3 className="text-lg font-bold text-slate-900">Integrasi Printer Struk Thermal</h3>
          <p className="text-xs">
            Dukung printer thermal ESC/POS Bluetooth, USB, maupun Network. Masuk ke menu <strong>Pengaturan &gt; Printer Struk</strong> untuk menguji cetak test struk, mengatur lebar kertas (58mm/80mm), serta header/footer nota.
          </p>
        </div>
      ),
    },
    {
      id: 'license_guide',
      title: 'Lisensi & Pembaruan Sistem',
      icon: ShieldCheck,
      content: (
        <div className="space-y-4 text-slate-700 text-sm">
          <h3 className="text-lg font-bold text-slate-900">Status Lisensi Enterprise Averion POS</h3>
          <p className="text-xs">
            Sistem ini terlisensi secara penuh dengan garansi keamanan data offline-first, auto-backup, dan pembaruan berkala.
          </p>
        </div>
      ),
    },
  ];

  const filteredTopics = topics.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeTopicObj = topics.find((t) => t.id === selectedTopic) || topics[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#00A876] flex items-center justify-center text-white font-bold">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold">Pusat Dokumentasi & Bantuan</h2>
              <p className="text-[11px] text-slate-400">Petunjuk teknis dan panduan operasional POS Pro</p>
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

        {/* Modal Body: Left Topics Sidebar + Right Content */}
        <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
          {/* Topics List */}
          <div className="w-full md:w-72 border-r border-slate-200 bg-slate-50/70 p-3 space-y-3 shrink-0 overflow-y-auto">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari topik..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-[#00A876]"
              />
            </div>

            <div className="space-y-1">
              {filteredTopics.map((topic) => {
                const Icon = topic.icon;
                const isSelected = selectedTopic === topic.id;
                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => setSelectedTopic(topic.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#00A876] text-white shadow-xs'
                        : 'text-slate-700 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{topic.title}</span>
                    </div>
                    <ChevronRight className="w-3 h-3 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Topic Detail View */}
          <div className="flex-1 p-6 overflow-y-auto bg-white">
            {activeTopicObj.content}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Versi Dokumentasi 3.0 &bull; Offline Ready</span>
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

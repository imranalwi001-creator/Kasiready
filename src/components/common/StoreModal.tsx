import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { useToast } from '../../context/ToastContext';
import { Store } from '../../types';
import {
  X,
  Building2,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  MapPin,
  Phone,
  Store as StoreIcon,
  Layers,
} from 'lucide-react';

interface StoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StoreModal: React.FC<StoreModalProps> = ({ isOpen, onClose }) => {
  const {
    stores,
    activeStoreId,
    setActiveStoreId,
    addStore,
    updateStore,
    deleteStore,
    products,
    sales,
  } = useStore();
  const { toast, confirm: confirmModal } = useToast();

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);

  const [code, setCode] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [isMain, setIsMain] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleOpenAdd = () => {
    setIsEditing(true);
    setEditingStoreId(null);
    setCode(`CBG-0${stores.length + 1}`);
    setName('');
    setAddress('');
    setPhone('');
    setIsMain(false);
  };

  const handleOpenEdit = (store: Store) => {
    setIsEditing(true);
    setEditingStoreId(store.id);
    setCode(store.code || '');
    setName(store.name);
    setAddress(store.address);
    setPhone(store.phone);
    setIsMain(!!store.isMain);
  };

  const handleCancelForm = () => {
    setIsEditing(false);
    setEditingStoreId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingStoreId) {
      updateStore(editingStoreId, {
        code: code.trim().toUpperCase(),
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim(),
        isMain,
      });
    } else {
      addStore({
        code: code.trim().toUpperCase() || `CBG-${Date.now().toString().slice(-4)}`,
        name: name.trim(),
        address: address.trim(),
        phone: phone.trim(),
        isMain,
      });
    }

    setIsEditing(false);
    setEditingStoreId(null);
  };

  const handleDelete = async (store: Store) => {
    if (stores.length <= 1) {
      toast.warning('Operasi Ditolak', 'Satu-satunya cabang/toko tidak boleh dihapus.');
      return;
    }
    const storeProducts = products.filter((p) => p.storeId === store.id);
    const storeSales = sales.filter((s) => s.storeId === store.id);
    
    const confirmed = await confirmModal({
      title: `Hapus Cabang "${store.name}"?`,
      message: `Cabang ini memiliki ${storeProducts.length} produk dan ${storeSales.length} riwayat transaksi. Data akan dihapus permanen.`,
      confirmText: 'Ya, Hapus Cabang',
      type: 'danger',
    });

    if (confirmed) {
      deleteStore(store.id);
      toast.success('Cabang Dihapus', `Cabang "${store.name}" telah dihapus.`);
    }
  };

  return (
    <div
      id="store-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="store-modal-card"
        className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-bold text-base">Kelola Cabang &amp; Multi-Toko</h3>
              <p className="text-xs text-slate-400">
                Pilih toko aktif, tambah cabang baru, atau kelola lokasi operasional
              </p>
            </div>
          </div>
          <button
            id="close-store-modal-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          {/* Action Bar */}
          {!isEditing && (
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Daftar Toko &amp; Cabang ({stores.length})
              </span>
              <button
                type="button"
                id="add-store-btn"
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Toko / Cabang</span>
              </button>
            </div>
          )}

          {/* Edit / Add Form */}
          {isEditing ? (
            <form onSubmit={handleSubmit} className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="text-sm font-bold text-slate-900">
                  {editingStoreId ? 'Edit Informasi Cabang' : 'Pendaftaran Toko/Cabang Baru'}
                </h4>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                >
                  Batal
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Kode Toko / Cabang
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Misal: JKT-01"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Toko / Nama Cabang
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Misal: Toko Berkah Cabang Tebet"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor Telepon / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0812-xxxx-xxxx"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={isMain}
                      onChange={(e) => setIsMain(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span>Tandai sebagai Toko Pusat (Headquarters)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alamat Lengkap Cabang
                </label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Jl. Nama Jalan No. XX, Kelurahan, Kecamatan, Kota"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  {editingStoreId ? 'Simpan Perubahan' : 'Daftarkan Cabang'}
                </button>
              </div>
            </form>
          ) : (
            /* Stores Cards List */
            <div className="space-y-3">
              {stores.map((store) => {
                const isActive = store.id === activeStoreId;
                const storeProds = products.filter((p) => p.storeId === store.id);
                const storeSalesList = sales.filter((s) => s.storeId === store.id);
                const totalStoreRevenue = storeSalesList.reduce(
                  (sum, s) => (s.status === 'completed' ? sum + s.totalAmount : sum),
                  0
                );

                return (
                  <div
                    key={store.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isActive
                        ? 'border-2 border-indigo-600 bg-indigo-50/50 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2 py-0.5 rounded bg-slate-900 text-white font-mono text-[10px] font-bold">
                            {store.code || 'CBG'}
                          </span>
                          <h4 className="font-bold text-sm text-slate-900">{store.name}</h4>
                          {store.isMain && (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              Pusat
                            </span>
                          )}
                          {isActive && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold shadow-xs">
                              <CheckCircle2 className="w-3 h-3" />
                              Toko Aktif (POS)
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 pt-0.5">
                          {store.address && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="line-clamp-1">{store.address}</span>
                            </span>
                          )}
                          {store.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              {store.phone}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-600 font-medium">
                          <span className="flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5 text-slate-400" />
                            {storeProds.length} Produk Terdaftar
                          </span>
                          <span>•</span>
                          <span>{storeSalesList.length} Transaksi Selesai</span>
                        </div>
                      </div>

                      {/* Store Controls */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                        {!isActive && (
                          <button
                            type="button"
                            onClick={() => setActiveStoreId(store.id)}
                            className="px-3 py-1.5 rounded-xl bg-white border border-indigo-300 text-indigo-700 hover:bg-indigo-600 hover:text-white text-xs font-bold transition shadow-xs cursor-pointer"
                          >
                            Pilih Sebagai Toko Aktif
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(store)}
                          className="p-1.5 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                          title="Edit Toko"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {stores.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDelete(store)}
                            className="p-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Hapus Toko"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Setiap transaksi POS &amp; stok akan otomatis tercatat berdasarkan Toko Aktif terpilih.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

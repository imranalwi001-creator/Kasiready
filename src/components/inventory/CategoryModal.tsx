import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Category } from '../../types';
import { X, Plus, Edit2, Trash2, Layers, Check, Sparkles } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CategoryModal: React.FC<CategoryModalProps> = ({ isOpen, onClose }) => {
  const { categories, products, addCategory, updateCategory, deleteCategory } = useStore();

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#4f46e5');

  if (!isOpen) return null;

  const handleStartEdit = (cat: Category) => {
    setEditingCategory(cat);
    setName(cat.name);
    setDescription(cat.description || '');
    setColor(cat.color || '#4f46e5');
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setColor('#4f46e5');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingCategory) {
      updateCategory(editingCategory.id, {
        name: name.trim(),
        description: description.trim(),
        color,
      });
      handleCancelEdit();
    } else {
      addCategory({
        name: name.trim(),
        description: description.trim(),
        color,
      });
      setName('');
      setDescription('');
    }
  };

  const handleDelete = (catId: string) => {
    const attachedCount = products.filter((p) => p.categoryId === catId).length;
    if (attachedCount > 0) {
      alert(`Tidak dapat menghapus kategori ini karena masih digunakan oleh ${attachedCount} produk.`);
      return;
    }
    if (confirm('Hapus kategori ini?')) {
      deleteCategory(catId);
    }
  };

  const colorOptions = [
    '#4f46e5', // indigo
    '#059669', // emerald
    '#0284c7', // sky
    '#d97706', // amber
    '#7c3aed', // violet
    '#db2777', // pink
    '#dc2626', // red
    '#4b5563', // gray
  ];

  return (
    <div
      id="category-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="category-modal-card"
        className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            <h3 className="font-bold text-base">Kelola Kategori Produk</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Add / Edit Form */}
          <form
            onSubmit={handleSubmit}
            className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3"
          >
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              {editingCategory ? `Edit: ${editingCategory.name}` : 'Tambah Kategori Baru'}
            </h4>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nama Kategori *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Makanan & Minuman"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Keterangan singkat..."
                className="w-full px-3 py-1.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Warna Label / Badge
              </label>
              <div className="flex items-center gap-2">
                {colorOptions.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition cursor-pointer ${
                      color === c ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : ''
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {color === c && <Check className="w-3.5 h-3.5 text-white" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              {editingCategory && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Batal
                </button>
              )}
              <button
                type="submit"
                className="inline-flex items-center gap-1 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{editingCategory ? 'Simpan Perubahan' : 'Tambah Kategori'}</span>
              </button>
            </div>
          </form>

          {/* List of Categories */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Daftar Kategori ({categories.length})
            </h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
              {categories.map((cat) => {
                const count = products.filter((p) => p.categoryId === cat.id).length;

                return (
                  <div
                    key={cat.id}
                    className="p-3 flex items-center justify-between hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.color || '#4f46e5' }}
                      />
                      <div>
                        <p className="font-bold text-slate-900">{cat.name}</p>
                        <p className="text-slate-400 text-[11px]">
                          {count} produk terdaftar {cat.description && `• ${cat.description}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleStartEdit(cat)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 transition cursor-pointer"
                        title="Edit Kategori"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                        title="Hapus Kategori"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';
import {
  X,
  Save,
  Sparkles,
  Image as ImageIcon,
  Tag,
  Barcode,
  Building2,
  Upload,
  Trash2,
  Check,
  Layers,
} from 'lucide-react';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

// Curated Indonesian supermarket preset product images for quick selection
const PRESET_PRODUCT_IMAGES = [
  {
    name: 'Beras Ramos 5kg',
    url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80',
    category: 'Sembako',
  },
  {
    name: 'Minyak Goreng 2L',
    url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80',
    category: 'Minyak & Bumbu',
  },
  {
    name: 'Air Mineral Botol',
    url: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=400&q=80',
    category: 'Minuman',
  },
  {
    name: 'Kopi & Teh Kemasan',
    url: 'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=400&q=80',
    category: 'Minuman',
  },
  {
    name: 'Snack & Keripik',
    url: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281226?auto=format&fit=crop&w=400&q=80',
    category: 'Makanan',
  },
  {
    name: 'Biskuit & Roti',
    url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&q=80',
    category: 'Makanan',
  },
  {
    name: 'Sabun Mandi & Shampoo',
    url: 'https://images.unsplash.com/photo-1608248597359-25f0963d3a04?auto=format&fit=crop&w=400&q=80',
    category: 'Perawatan Tubuh',
  },
  {
    name: 'Deterjen & Pembersih',
    url: 'https://images.unsplash.com/photo-1585670210693-e7fdd16b142e?auto=format&fit=crop&w=400&q=80',
    category: 'Rumah Tangga',
  },
  {
    name: 'Alat Tulis & Kantor',
    url: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=400&q=80',
    category: 'ATK',
  },
];

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
}) => {
  const { categories, addProduct, updateProduct, stores, activeStoreId } = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [storeId, setStoreId] = useState<string>(activeStoreId);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [price, setPrice] = useState<number>(0);
  const [costPrice, setCostPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [minStockAlert, setMinStockAlert] = useState<number>(10);
  const [unit, setUnit] = useState('pcs');
  const [image, setImage] = useState('');
  const [description, setDescription] = useState('');

  // Image Upload States
  const [imageTab, setImageTab] = useState<'upload' | 'preset' | 'url'>('upload');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (productToEdit) {
        setStoreId(productToEdit.storeId || activeStoreId);
        setName(productToEdit.name);
        setSku(productToEdit.sku);
        setCategoryId(productToEdit.categoryId);
        setPrice(productToEdit.price);
        setCostPrice(productToEdit.costPrice || 0);
        setStock(productToEdit.stock);
        setMinStockAlert(productToEdit.minStockAlert ?? 10);
        setUnit(productToEdit.unit || 'pcs');
        setImage(productToEdit.image);
        setUploadPreview(productToEdit.image);
        setDescription(productToEdit.description || '');
      } else {
        setStoreId(activeStoreId);
        setName('');
        setSku(`PRD-${Math.floor(100 + Math.random() * 900)}`);
        setCategoryId(categories[0]?.id || '');
        setPrice(10000);
        setCostPrice(8000);
        setStock(20);
        setMinStockAlert(10);
        setUnit('pcs');
        const defaultImg = PRESET_PRODUCT_IMAGES[0].url;
        setImage(defaultImg);
        setUploadPreview(defaultImg);
        setDescription('');
      }
    }
  }, [isOpen, productToEdit, categories, activeStoreId]);

  if (!isOpen) return null;

  const handleGenerateSku = () => {
    const prefix = name
      ? name.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, 'PRD')
      : 'PRD';
    const rand = Math.floor(100 + Math.random() * 900);
    setSku(`${prefix}-${rand}`);
  };

  // Image file handler
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Hanya file gambar (JPG, PNG, WebP) yang diperbolehkan.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setImage(base64);
      setUploadPreview(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setImage('');
    setUploadPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sku.trim()) return;

    const finalImage =
      image.trim() ||
      uploadPreview ||
      'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=400&q=80';

    if (productToEdit) {
      updateProduct(productToEdit.id, {
        storeId,
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        categoryId,
        price: Number(price),
        costPrice: Number(costPrice),
        stock: Number(stock),
        minStockAlert: Number(minStockAlert),
        unit: unit.trim() || 'pcs',
        image: finalImage,
        description: description.trim(),
      });
    } else {
      addProduct({
        storeId,
        name: name.trim(),
        sku: sku.trim().toUpperCase(),
        categoryId,
        price: Number(price),
        costPrice: Number(costPrice),
        stock: Number(stock),
        minStockAlert: Number(minStockAlert),
        unit: unit.trim() || 'pcs',
        image: finalImage,
        description: description.trim(),
      });
    }

    onClose();
  };

  return (
    <div
      id="product-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="product-modal-card"
        className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-6"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                {productToEdit ? 'Edit Data Produk' : 'Tambah Produk Baru'}
              </h3>
              <p className="text-[11px] text-slate-400">Kelola informasi barang, foto, barcode &amp; stok toko</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Store Branch Assignment */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-indigo-600" />
              Lokasi Toko / Cabang Produk *
            </label>
            <select
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              required
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code}) {s.isMain ? '- Pusat' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Product Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nama Produk *
            </label>
            <input
              type="text"
              id="product-name-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Minyak Goreng Bimoli 2L"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
              required
            />
          </div>

          {/* SKU and Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Kode SKU / Barcode *
                </label>
                <button
                  type="button"
                  onClick={handleGenerateSku}
                  className="text-[10px] text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-0.5 cursor-pointer"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  Auto SKU
                </button>
              </div>
              <div className="relative">
                <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  id="product-sku-input"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="MIN-001"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kategori Produk *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Pricing: Price and Cost Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Harga Jual Kasir (Rp) *
              </label>
              <input
                type="number"
                min="0"
                step="100"
                id="product-price-input"
                value={price || ''}
                onChange={(e) => setPrice(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Harga Modal / Beli (Rp)
              </label>
              <input
                type="number"
                min="0"
                step="100"
                id="product-cost-input"
                value={costPrice || ''}
                onChange={(e) => setCostPrice(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Stock, Minimum Alert & Unit */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jumlah Stok *
              </label>
              <input
                type="number"
                min="0"
                id="product-stock-input"
                value={stock}
                onChange={(e) => setStock(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Min. Stok Alert (&le;)
              </label>
              <input
                type="number"
                min="0"
                id="product-min-stock-input"
                value={minStockAlert}
                onChange={(e) => setMinStockAlert(Number(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Satuan</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="pcs, botol, kg"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Photo Upload & Gallery Section */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                Foto Produk
              </label>
              <div className="flex rounded-lg bg-slate-100 p-0.5 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setImageTab('upload')}
                  className={`px-2 py-1 rounded-md transition cursor-pointer ${
                    imageTab === 'upload' ? 'bg-white shadow-xs text-indigo-700' : 'text-slate-500'
                  }`}
                >
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setImageTab('preset')}
                  className={`px-2 py-1 rounded-md transition cursor-pointer ${
                    imageTab === 'preset' ? 'bg-white shadow-xs text-indigo-700' : 'text-slate-500'
                  }`}
                >
                  Galeri Preset
                </button>
                <button
                  type="button"
                  onClick={() => setImageTab('url')}
                  className={`px-2 py-1 rounded-md transition cursor-pointer ${
                    imageTab === 'url' ? 'bg-white shadow-xs text-indigo-700' : 'text-slate-500'
                  }`}
                >
                  URL Link
                </button>
              </div>
            </div>

            {/* Sub-tab 1: Upload File & Drag and Drop */}
            {imageTab === 'upload' && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                  isDragging
                    ? 'border-indigo-600 bg-indigo-50/70 scale-[0.99]'
                    : 'border-slate-300 bg-slate-50/70 hover:bg-slate-100/70 hover:border-slate-400'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {uploadPreview ? (
                  <div className="flex items-center gap-4 text-left w-full">
                    <img
                      src={uploadPreview}
                      alt="Preview"
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 shadow-xs bg-white shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800">Foto Berhasil Dimuat</p>
                      <p className="text-[11px] text-slate-500 truncate">Klik untuk mengganti foto lain dari perangkat</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage();
                      }}
                      className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Hapus foto"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        Klik atau Drag &amp; Drop Foto Produk ke Sini
                      </p>
                      <p className="text-[11px] text-slate-500">Mendukung format PNG, JPG, JPEG, atau WebP</p>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Sub-tab 2: Curated Supermarket Image Presets */}
            {imageTab === 'preset' && (
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <p className="text-[11px] font-semibold text-slate-600">
                  Pilih foto standar produk retail/supermarket:
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-40 overflow-y-auto pr-1">
                  {PRESET_PRODUCT_IMAGES.map((preset, idx) => {
                    const isSelected = image === preset.url;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setImage(preset.url);
                          setUploadPreview(preset.url);
                        }}
                        className={`relative rounded-xl overflow-hidden border p-1 text-left transition cursor-pointer ${
                          isSelected
                            ? 'border-indigo-600 ring-2 ring-indigo-500 bg-indigo-50'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-full h-12 rounded-lg object-cover"
                        />
                        <span className="block text-[10px] font-bold text-slate-800 truncate mt-1">
                          {preset.name}
                        </span>
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-4 h-4 bg-indigo-600 text-white rounded-full flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Sub-tab 3: URL Direct Link */}
            {imageTab === 'url' && (
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    value={image}
                    onChange={(e) => {
                      setImage(e.target.value);
                      setUploadPreview(e.target.value);
                    }}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
                {image && (
                  <img
                    src={image}
                    alt="Preview"
                    className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0 bg-slate-100"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                )}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Deskripsi Produk</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Keterangan tambahan produk..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              id="save-product-btn"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{productToEdit ? 'Perbarui Produk' : 'Simpan Produk'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


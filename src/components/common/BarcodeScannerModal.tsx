import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import {
  X,
  Camera,
  QrCode,
  Sparkles,
  Zap,
  Volume2,
  VolumeX,
  FlipHorizontal,
  CheckCircle2,
  AlertCircle,
  Search,
  Printer,
  Barcode as BarcodeIcon,
} from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (skuOrCode: string) => void;
}

// Synthesize pleasant scan beep using Web Audio API
const playScanBeep = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(2400, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch {
    // Audio safe fallback
  }
};

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
}) => {
  const { products, activeStoreId } = useStore();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [activeTab, setActiveTab] = useState<'camera' | 'manual' | 'print'>('camera');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [manualCode, setManualCode] = useState<string>('');
  const [lastDetectedCode, setLastDetectedCode] = useState<string | null>(null);
  const [selectedProductForPrint, setSelectedProductForPrint] = useState<Product | null>(null);

  const storeProducts = products.filter((p) => p.storeId === activeStoreId);

  // Initialize camera stream
  useEffect(() => {
    if (!isOpen || activeTab !== 'camera') {
      stopCamera();
      return;
    }

    let isMounted = true;

    const startCamera = async () => {
      setCameraError(null);
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Browser tidak mendukung akses kamera langsung.');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (!isMounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
        setIsCameraActive(true);
      } catch (err: unknown) {
        if (isMounted) {
          setIsCameraActive(false);
          const msg = err instanceof Error ? err.message : 'Kamera tidak dapat diakses atau izin ditolak.';
          setCameraError(msg);
        }
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      stopCamera();
    };
  }, [isOpen, activeTab, facingMode]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const handleScanFound = (code: string) => {
    setLastDetectedCode(code);
    if (soundEnabled) {
      playScanBeep();
    }

    setTimeout(() => {
      onScanSuccess(code);
      onClose();
    }, 400);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleScanFound(manualCode.trim());
  };

  const handleFlipCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  if (!isOpen) return null;

  return (
    <div
      id="barcode-scanner-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="barcode-scanner-modal-card"
        className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-6"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
              <BarcodeIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">Scanner &amp; Deteksi Barcode</h3>
              <p className="text-[11px] text-slate-400">Pindai Kode Barcode Produk / SKU Kasir</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'camera'
                ? 'border-indigo-600 text-indigo-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Kamera Live</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'manual'
                ? 'border-indigo-600 text-indigo-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Input / Pilih Cepat</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('print');
              if (!selectedProductForPrint && storeProducts.length > 0) {
                setSelectedProductForPrint(storeProducts[0]);
              }
            }}
            className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'print'
                ? 'border-indigo-600 text-indigo-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Label Barcode</span>
          </button>
        </div>

        {/* Tab 1: Live Camera Scanner */}
        {activeTab === 'camera' && (
          <div className="p-5 space-y-4">
            <div className="relative aspect-4/3 w-full bg-slate-950 rounded-2xl overflow-hidden shadow-inner flex items-center justify-center border border-slate-800">
              {/* Video Element */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${!isCameraActive ? 'hidden' : ''}`}
              />

              {/* Laser Viewfinder Overlay */}
              {isCameraActive && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                  <div className="relative w-64 h-40 border-2 border-indigo-400/80 rounded-2xl bg-indigo-500/5 shadow-2xl flex items-center justify-center">
                    {/* Corner Reticles */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-indigo-400 -mt-1 -ml-1 rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-indigo-400 -mt-1 -mr-1 rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-indigo-400 -mb-1 -ml-1 rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-indigo-400 -mb-1 -mr-1 rounded-br-lg" />

                    {/* Animated Scanning Laser Line */}
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_12px_#f43f5e] animate-bounce duration-1000" />
                  </div>
                </div>
              )}

              {/* Camera Error or Fallback View */}
              {cameraError && (
                <div className="p-6 text-center text-slate-300 space-y-3 max-w-sm">
                  <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-amber-400">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white mb-1">Akses Kamera Preview</h4>
                    <p className="text-[11px] text-slate-400">{cameraError}</p>
                  </div>
                  <p className="text-[10px] text-indigo-300 bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                    Tip: Anda dapat menggunakan tombol scan cepat produk di bawah atau input manual untuk mendeteksi barcode.
                  </p>
                </div>
              )}

              {/* Detection Notification Banner */}
              {lastDetectedCode && (
                <div className="absolute bottom-3 inset-x-3 bg-emerald-600 text-white p-2.5 rounded-xl text-center text-xs font-bold shadow-lg animate-in slide-in-from-bottom-2 duration-150 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Barcode Terdeteksi: {lastDetectedCode}</span>
                </div>
              )}
            </div>

            {/* Camera Controls Toolbar */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFlipCamera}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <FlipHorizontal className="w-3.5 h-3.5 text-slate-500" />
                  <span>Putar Kamera</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`px-3 py-1.5 rounded-xl border font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    soundEnabled
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-800'
                      : 'border-slate-200 bg-slate-50 text-slate-500'
                  }`}
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  <span>{soundEnabled ? 'Suara Beep: Aktif' : 'Senyap'}</span>
                </button>
              </div>

              <span className="text-[11px] text-slate-400 font-mono">
                {isCameraActive ? 'Kamera Online' : 'Mode Siap'}
              </span>
            </div>

            {/* Quick Test Barcodes Chips */}
            <div className="space-y-1.5 pt-1">
              <p className="text-[11px] font-bold text-slate-600 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                Simulasi Scan Cepat Produk Toko:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {storeProducts.slice(0, 6).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleScanFound(p.sku)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:border-indigo-300 border border-slate-200 text-xs font-semibold text-slate-700 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="font-mono text-indigo-700 font-bold">{p.sku}</span>
                    <span className="text-slate-500 truncate max-w-[110px]">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Manual Input Search */}
        {activeTab === 'manual' && (
          <div className="p-5 space-y-4">
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Ketik Kode Barcode / SKU Produk
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value)}
                    placeholder="Contoh: MIN-001 / BEV-001..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-xs cursor-pointer"
                  >
                    Cari &amp; Masukkan
                  </button>
                </div>
              </div>
            </form>

            <div className="space-y-2 pt-2 border-t border-slate-200">
              <label className="block text-xs font-bold text-slate-600">
                Pilih dari Daftar Barcode Produk Toko:
              </label>
              <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1">
                {storeProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleScanFound(p.sku)}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition cursor-pointer flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-9 h-9 rounded-lg object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-900 truncate">{p.name}</p>
                        <p className="text-[11px] font-mono text-indigo-700 font-semibold">{p.sku}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-xs text-slate-900">{formatRupiah(p.price)}</p>
                      <span className="text-[10px] text-slate-500">Stok: {p.stock}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Barcode Generator & Print Labels */}
        {activeTab === 'print' && (
          <div className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Pilih Produk untuk Dibuat Label Barcode
              </label>
              <select
                value={selectedProductForPrint?.id || ''}
                onChange={(e) => {
                  const prod = storeProducts.find((p) => p.id === e.target.value);
                  setSelectedProductForPrint(prod || null);
                }}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {storeProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.sku} - {p.name} ({formatRupiah(p.price)})
                  </option>
                ))}
              </select>
            </div>

            {selectedProductForPrint && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-3">
                <div
                  id="printable-barcode-tag"
                  className="bg-white p-4 rounded-xl border border-slate-300 shadow-xs max-w-xs mx-auto space-y-1.5 font-sans"
                >
                  <p className="font-bold text-xs text-slate-900 truncate">
                    {selectedProductForPrint.name}
                  </p>
                  <p className="text-sm font-black text-indigo-700">
                    {formatRupiah(selectedProductForPrint.price)}
                  </p>

                  {/* Render High-Contrast SVG Barcode Visualization */}
                  <div className="py-2 flex flex-col items-center justify-center">
                    <svg className="w-48 h-12" viewBox="0 0 200 50">
                      {/* Fake Code 128 dynamic bars */}
                      {Array.from({ length: 38 }).map((_, i) => {
                        const isThick = (i * 7) % 3 === 0;
                        const width = isThick ? 4 : 2;
                        const x = i * 5 + 6;
                        return (
                          <rect
                            key={i}
                            x={x}
                            y="2"
                            width={width}
                            height="42"
                            fill="#0f172a"
                          />
                        );
                      })}
                    </svg>
                    <span className="font-mono text-xs font-black tracking-widest text-slate-800 mt-0.5">
                      *{selectedProductForPrint.sku}*
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 border-t border-dashed border-slate-200 pt-1">
                    KASIRPRO POS &bull; RAK DISPLAY
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Label Barcode Harga</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useStore } from '../../context/StoreContext';
import { Product } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { playScanBeep } from '../../utils/soundNotifications';
import {
  X,
  Camera,
  Search,
  Printer,
  Flashlight,
  FlipHorizontal,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Layers,
  ShoppingBag,
  RefreshCw,
  Smartphone,
  Info,
} from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan?: (skuOrCode: string) => void;
  onScanSuccess?: (skuOrCode: string) => void;
  initialMode?: 'continuous' | 'single';
  modalTitle?: string;
  modalSubtitle?: string;
}

// Trigger device haptic vibration on mobile
const triggerHaptic = (pattern: number | number[] = 60) => {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore vibration error
    }
  }
};

const SUPPORTED_BARCODE_FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.CODE_93,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.UPC_EAN_EXTENSION,
  Html5QrcodeSupportedFormats.QR_CODE,
  Html5QrcodeSupportedFormats.DATA_MATRIX,
  Html5QrcodeSupportedFormats.ITF,
  Html5QrcodeSupportedFormats.CODABAR,
];

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScan,
  onScanSuccess,
  initialMode = 'continuous',
  modalTitle = 'Pindai Barcode Produk',
  modalSubtitle = 'Arahkan kamera HP ke barcode kemasan barang / rokok / snack',
}) => {
  const { products, activeStoreId, settings } = useStore();

  const [activeTab, setActiveTab] = useState<'camera' | 'manual' | 'print'>('camera');
  const [scannerMode, setScannerMode] = useState<'continuous' | 'single'>(initialMode);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraStarting, setIsCameraStarting] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [hapticEnabled, setHapticEnabled] = useState<boolean>(true);
  const [torchEnabled, setTorchEnabled] = useState<boolean>(false);
  const [hasTorchSupport, setHasTorchSupport] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraDevices, setCameraDevices] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  const [manualCode, setManualCode] = useState<string>('');
  const [lastDetectedCode, setLastDetectedCode] = useState<string | null>(null);
  const [lastScannedProduct, setLastScannedProduct] = useState<Product | null>(null);
  const [sessionScanCount, setSessionScanCount] = useState<number>(0);
  const [recentScans, setRecentScans] = useState<Array<{ code: string; name?: string; time: string }>>([]);
  const [scanSuccessPulse, setScanSuccessPulse] = useState<boolean>(false);

  const [selectedProductForPrint, setSelectedProductForPrint] = useState<Product | null>(null);

  // References for Html5Qrcode Scanner Engine
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isStartingRef = useRef<boolean>(false);
  const lastScannedCodeRef = useRef<string>('');
  const lastScannedTimeRef = useRef<number>(0);
  const containerId = 'pos-html5qr-scanner-box';

  const storeProducts = products.filter((p) => !activeStoreId || p.storeId === activeStoreId);

  // Dispatch callback to parent
  const emitScan = useCallback(
    (code: string) => {
      if (onScan) onScan(code);
      if (onScanSuccess) onScanSuccess(code);
    },
    [onScan, onScanSuccess]
  );

  // Handle successful barcode reading
  const handleBarcodeDetected = useCallback(
    (decodedText: string) => {
      const cleanCode = decodedText.trim();
      if (!cleanCode) return;

      // Debounce duplicate scans within 1.2s if identical
      const now = Date.now();
      if (cleanCode === lastScannedCodeRef.current && now - lastScannedTimeRef.current < 1200) {
        return;
      }
      lastScannedCodeRef.current = cleanCode;
      lastScannedTimeRef.current = now;

      // Visual pulse & audio haptic
      setLastDetectedCode(cleanCode);
      setScanSuccessPulse(true);
      setTimeout(() => setScanSuccessPulse(false), 900);

      if (soundEnabled) {
        playScanBeep(settings.audioNotification?.volume || 85);
      }
      if (hapticEnabled) {
        triggerHaptic([70, 40, 70]);
      }

      // Match product in catalog
      const matched = storeProducts.find(
        (p) =>
          p.sku.toLowerCase() === cleanCode.toLowerCase() ||
          p.name.toLowerCase() === cleanCode.toLowerCase()
      );
      setLastScannedProduct(matched || null);
      setSessionScanCount((prev) => prev + 1);

      setRecentScans((prev) => [
        {
          code: cleanCode,
          name: matched ? matched.name : undefined,
          time: new Date().toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          }),
        },
        ...prev.slice(0, 7),
      ]);

      emitScan(cleanCode);

      if (scannerMode === 'single') {
        setTimeout(() => {
          onClose();
        }, 550);
      }
    },
    [soundEnabled, hapticEnabled, settings.audioNotification?.volume, storeProducts, scannerMode, emitScan, onClose]
  );

  // Stop camera helper
  const stopCamera = useCallback(async () => {
    isStartingRef.current = false;
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (e) {
        console.warn('HTML5 Scanner stop error:', e);
      }
      html5QrCodeRef.current = null;
    }
    setIsCameraActive(false);
    setIsCameraStarting(false);
    setTorchEnabled(false);
  }, []);

  // Initialize and start camera
  const startCamera = useCallback(async () => {
    if (!isOpen || activeTab !== 'camera') return;
    if (isStartingRef.current) return;

    isStartingRef.current = true;
    setIsCameraStarting(true);
    setCameraError(null);

    // Stop existing instance first
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch {
        // ignore
      }
      html5QrCodeRef.current = null;
    }

    try {
      // Enumerate camera devices
      const devices = await Html5Qrcode.getCameras().catch(() => []);
      if (devices && devices.length > 0) {
        setCameraDevices(devices.map((d) => ({ id: d.id, label: d.label })));
      }

      // Check if target container exists in DOM
      const targetElement = document.getElementById(containerId);
      if (!targetElement) {
        isStartingRef.current = false;
        setIsCameraStarting(false);
        return;
      }

      const qrScanner = new Html5Qrcode(containerId, {
        formatsToSupport: SUPPORTED_BARCODE_FORMATS,
        verbose: false,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true,
        },
      });

      html5QrCodeRef.current = qrScanner;

      const cameraSelection = selectedDeviceId
        ? { deviceId: { exact: selectedDeviceId } }
        : { facingMode: facingMode };

      const scanConfig = {
        fps: 20,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const w = Math.floor(viewfinderWidth * 0.88);
          const h = Math.floor(viewfinderHeight * 0.65);
          return { width: Math.max(260, w), height: Math.max(160, h) };
        },
        aspectRatio: 1.333333,
        videoConstraints: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
        },
      };

      await qrScanner.start(
        cameraSelection,
        scanConfig,
        (decodedText) => {
          handleBarcodeDetected(decodedText);
        },
        () => {
          // Ignore periodic frame decode misses
        }
      );

      // Check torch support on the video track
      try {
        const stream = (targetElement.querySelector('video') as HTMLVideoElement)?.srcObject as MediaStream;
        if (stream) {
          const track = stream.getVideoTracks()[0];
          if (track) {
            const capabilities = track.getCapabilities ? (track.getCapabilities() as any) : null;
            if (capabilities && capabilities.torch) {
              setHasTorchSupport(true);
            }
          }
        }
      } catch {
        // ignore
      }

      setIsCameraActive(true);
      setIsCameraStarting(false);
      isStartingRef.current = false;
    } catch (err: any) {
      console.error('Camera start error:', err);
      setIsCameraStarting(false);
      setIsCameraActive(false);
      isStartingRef.current = false;

      let msg = 'Kamera tidak dapat diakses atau izin ditolak browser.';
      if (err?.name === 'NotAllowedError' || err?.message?.includes('Permission')) {
        msg = 'Izin kamera ditolak. Silakan izinkan akses kamera di pengaturan browser.';
      } else if (err?.name === 'NotFoundError') {
        msg = 'Tidak ada perangkat kamera yang terdeteksi di smartphone.';
      }
      setCameraError(msg);
    }
  }, [isOpen, activeTab, selectedDeviceId, facingMode, handleBarcodeDetected]);

  // Lifecycle effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen && activeTab === 'camera') {
      timer = setTimeout(() => {
        startCamera();
      }, 150);
    } else {
      stopCamera();
    }

    return () => {
      clearTimeout(timer);
      stopCamera();
    };
  }, [isOpen, activeTab, selectedDeviceId, facingMode]);

  // Toggle Torch / Lampu Senter HP
  const toggleTorch = async () => {
    const targetElement = document.getElementById(containerId);
    if (!targetElement) return;

    try {
      const stream = (targetElement.querySelector('video') as HTMLVideoElement)?.srcObject as MediaStream;
      if (!stream) return;
      const track = stream.getVideoTracks()[0];
      if (!track) return;

      const nextTorch = !torchEnabled;
      await (track as any).applyConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setTorchEnabled(nextTorch);
      if (hapticEnabled) triggerHaptic(40);
    } catch (e) {
      console.warn('Torch toggle failed:', e);
      setHasTorchSupport(false);
    }
  };

  // Flip Camera (Front / Back)
  const handleFlipCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
    setSelectedDeviceId('');
    if (hapticEnabled) triggerHaptic(40);
  };

  // Manual code submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleBarcodeDetected(manualCode.trim());
    setManualCode('');
  };

  if (!isOpen) return null;

  return (
    <div
      id="mobile-barcode-scanner-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="mobile-barcode-scanner-card"
        className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto flex flex-col max-h-[96vh]"
      >
        {/* Header with High-Contrast Mobile Status */}
        <div className="bg-slate-900 text-white px-4 sm:px-5 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base truncate">{modalTitle}</h3>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                  HD 1D/2D
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate">{modalSubtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            id="btn-close-barcode-modal"
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer shrink-0"
            title="Tutup Scanner"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation & Mode Switcher */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 sm:px-4 pt-2 gap-2 text-xs font-bold shrink-0">
          <div className="flex gap-1">
            <button
              type="button"
              id="tab-camera-scan"
              onClick={() => setActiveTab('camera')}
              className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'camera'
                  ? 'border-indigo-600 text-indigo-700 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Kamera HP</span>
            </button>
            <button
              type="button"
              id="tab-manual-search"
              onClick={() => setActiveTab('manual')}
              className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'manual'
                  ? 'border-indigo-600 text-indigo-700 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Ketik / Pilih</span>
            </button>
            <button
              type="button"
              id="tab-print-labels"
              onClick={() => {
                setActiveTab('print');
                if (!selectedProductForPrint && storeProducts.length > 0) {
                  setSelectedProductForPrint(storeProducts[0]);
                }
              }}
              className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'print'
                  ? 'border-indigo-600 text-indigo-700 font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Label Rak</span>
              <span className="sm:hidden">Label</span>
            </button>
          </div>

          {/* Continuous / Single Mode Pill */}
          {activeTab === 'camera' && (
            <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-xl text-[11px] mb-2">
              <button
                type="button"
                id="mode-continuous-btn"
                onClick={() => setScannerMode('continuous')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer flex items-center gap-1 ${
                  scannerMode === 'continuous'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Mode Beruntun: Tetap buka kamera untuk scan banyak barang berturut-turut"
              >
                <Layers className="w-3 h-3" />
                <span>Beruntun</span>
              </button>
              <button
                type="button"
                id="mode-single-btn"
                onClick={() => setScannerMode('single')}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  scannerMode === 'single'
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Mode Sekali: Otomatis tutup setelah 1 barang terdeteksi"
              >
                <span>1x Scan</span>
              </button>
            </div>
          )}
        </div>

        {/* Tab 1: Live Mobile Camera Viewport */}
        {activeTab === 'camera' && (
          <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1">
            {/* Viewfinder Frame */}
            <div
              className={`relative aspect-4/3 w-full bg-slate-950 rounded-2xl overflow-hidden shadow-inner border-2 transition-all ${
                scanSuccessPulse ? 'border-emerald-400 ring-4 ring-emerald-400/40' : 'border-slate-800'
              }`}
            >
              {/* HTML5 QR Code Mount Container */}
              <div id={containerId} className="w-full h-full [&>video]:w-full [&>video]:h-full [&>video]:object-cover" />

              {/* Loading / Starting Indicator */}
              {isCameraStarting && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2.5 z-20">
                  <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                  <p className="text-xs font-bold text-slate-200">Mengaktifkan Sensor Kamera HP...</p>
                  <span className="text-[10px] text-slate-400">Pastikan izin akses kamera diberikan</span>
                </div>
              )}

              {/* Laser Target Box Overlay */}
              {isCameraActive && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4 z-10">
                  <div
                    className={`relative w-64 sm:w-72 h-32 sm:h-36 border-2 rounded-2xl flex items-center justify-center transition-all ${
                      scanSuccessPulse
                        ? 'border-emerald-400 bg-emerald-500/20 shadow-[0_0_30px_rgba(52,211,153,0.6)]'
                        : 'border-indigo-400/90 bg-indigo-500/5 shadow-2xl'
                    }`}
                  >
                    {/* Corner Reticles */}
                    <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-indigo-400 -mt-1 -ml-1 rounded-tl-xl" />
                    <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-indigo-400 -mt-1 -mr-1 rounded-tr-xl" />
                    <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-indigo-400 -mb-1 -ml-1 rounded-bl-xl" />
                    <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-indigo-400 -mb-1 -mr-1 rounded-br-lg" />

                    {/* Animated Scanning Laser Line */}
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_14px_#f43f5e] animate-bounce duration-1000" />
                  </div>

                  <p className="mt-3 text-[11px] font-bold text-white/90 bg-slate-900/85 px-3 py-1 rounded-full border border-slate-700/80 shadow-md">
                    Posisikan garis laser merah tepat di atas barcode barang
                  </p>
                </div>
              )}

              {/* Camera Error Message */}
              {cameraError && !isCameraStarting && (
                <div className="absolute inset-0 bg-slate-900/95 p-6 text-center text-slate-300 space-y-3 z-30 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400 shadow-lg">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-white mb-1">
                      Akses Kamera Smartphone Ditolak / Dibatasi
                    </h4>
                    <p className="text-[11px] text-slate-400 max-w-xs">{cameraError}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 text-left text-[11px] text-slate-300 space-y-1 max-w-xs">
                    <p className="font-bold text-amber-300 flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 shrink-0" />
                      Solusi:
                    </p>
                    <p>1. Izinkan akses kamera pada browser HP.</p>
                    <p>2. Gunakan tombol <strong>Ketik / Pilih</strong> di tab atas.</p>
                    <p>3. Atau klik produk contoh di bawah.</p>
                  </div>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Coba Hubungkan Ulang</span>
                  </button>
                </div>
              )}

              {/* Detection Notification Banner */}
              {lastDetectedCode && (
                <div
                  className={`absolute top-3 inset-x-3 p-3 rounded-2xl text-xs font-bold shadow-xl animate-in slide-in-from-top-2 duration-150 flex items-center justify-between gap-2 z-20 ${
                    lastScannedProduct ? 'bg-emerald-600 text-white' : 'bg-indigo-700 text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-emerald-200">{lastDetectedCode}</span>
                        {lastScannedProduct && (
                          <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded font-extrabold">
                            {formatRupiah(lastScannedProduct.price)}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] truncate font-semibold">
                        {lastScannedProduct ? lastScannedProduct.name : 'Kode terdeteksi & dimasukkan'}
                      </p>
                    </div>
                  </div>
                  {scannerMode === 'continuous' && (
                    <span className="text-[10px] font-black bg-black/30 px-2 py-1 rounded-lg shrink-0">
                      #{sessionScanCount} Scan
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Smart Hardware Controls (Torch / Flip / Sound / Lens) */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Torch / Flashlight Button */}
                {hasTorchSupport && (
                  <button
                    type="button"
                    id="btn-toggle-torch"
                    onClick={toggleTorch}
                    className={`px-3 py-1.5 rounded-xl border font-bold flex items-center gap-1.5 transition cursor-pointer ${
                      torchEnabled
                        ? 'bg-amber-400 border-amber-500 text-slate-950 shadow-md shadow-amber-200'
                        : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                    }`}
                    title="Nyalakan Lampu Flash / Senter HP"
                  >
                    <Flashlight className="w-3.5 h-3.5" />
                    <span>{torchEnabled ? 'Senter: ON' : 'Senter HP'}</span>
                  </button>
                )}

                {/* Flip Camera */}
                <button
                  type="button"
                  id="btn-flip-camera"
                  onClick={handleFlipCamera}
                  className="px-3 py-1.5 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1.5 transition cursor-pointer"
                  title="Ganti Kamera Depan / Belakang"
                >
                  <FlipHorizontal className="w-3.5 h-3.5 text-slate-600" />
                  <span>Putar Kamera</span>
                </button>

                {/* Sound Toggle */}
                <button
                  type="button"
                  id="btn-toggle-sound"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`px-3 py-1.5 rounded-xl border font-bold flex items-center gap-1.5 transition cursor-pointer ${
                    soundEnabled
                      ? 'border-indigo-200 bg-indigo-50 text-indigo-800'
                      : 'border-slate-200 bg-slate-100 text-slate-500'
                  }`}
                  title="Bunyi Beep Scanner"
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                  <span>{soundEnabled ? 'Beep' : 'Mute'}</span>
                </button>
              </div>

              {/* Multiple Camera Device Selector */}
              {cameraDevices.length > 1 && (
                <div className="flex items-center gap-1">
                  <select
                    value={selectedDeviceId}
                    onChange={(e) => setSelectedDeviceId(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-100 border border-slate-300 rounded-xl text-[11px] font-bold text-slate-700 outline-none cursor-pointer max-w-[140px] truncate"
                  >
                    {cameraDevices.map((d, i) => (
                      <option key={d.id} value={d.id}>
                        {d.label || `Lensa Kamera #${i + 1}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Quick Test Barcodes Chips for Instant Fallback */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-extrabold text-slate-700 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  Pindai Cepat Produk Contoh (1-Klik):
                </p>
                <span className="text-[10px] text-slate-400 font-mono">
                  {storeProducts.length} Produk
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {storeProducts.slice(0, 8).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleBarcodeDetected(p.sku)}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 hover:border-indigo-300 border border-slate-200 text-xs font-semibold text-slate-700 transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                  >
                    <span className="font-mono text-indigo-700 font-bold">{p.sku}</span>
                    <span className="text-slate-500 truncate max-w-[100px]">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Recent Scans Strip in Continuous Mode */}
            {recentScans.length > 0 && scannerMode === 'continuous' && (
              <div className="space-y-1 border-t border-slate-100 pt-2">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                  Riwayat Scan Sesi Ini ({recentScans.length}):
                </p>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  {recentScans.map((scan, idx) => (
                    <div
                      key={idx}
                      className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 rounded-lg text-[11px] shrink-0 font-medium text-indigo-900 flex items-center gap-1"
                    >
                      <span className="font-mono font-bold">{scan.code}</span>
                      {scan.name && <span className="text-slate-600 truncate max-w-[90px]">({scan.name})</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Manual Search & Catalog Selection */}
        {activeTab === 'manual' && (
          <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
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
                    Masukkan
                  </button>
                </div>
              </div>
            </form>

            <div className="space-y-2 pt-2 border-t border-slate-200">
              <label className="block text-xs font-bold text-slate-600">
                Pilih Langsung dari Katalog Produk Toko:
              </label>
              <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                {storeProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => handleBarcodeDetected(p.sku)}
                    className="p-2.5 rounded-2xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 transition cursor-pointer flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-900 truncate">{p.name}</p>
                        <p className="text-[11px] font-mono text-indigo-700 font-bold">{p.sku}</p>
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

        {/* Tab 3: Shelf Barcode Generator & Label Printing */}
        {activeTab === 'print' && (
          <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Pilih Produk untuk Dibuat Label Barcode Rak
              </label>
              <select
                value={selectedProductForPrint?.id || ''}
                onChange={(e) => {
                  const prod = storeProducts.find((p) => p.id === e.target.value);
                  setSelectedProductForPrint(prod || null);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white cursor-pointer"
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
                  id="printable-shelf-barcode-tag"
                  className="bg-white p-4 rounded-2xl border border-slate-300 shadow-xs max-w-xs mx-auto space-y-1.5 font-sans"
                >
                  <p className="font-bold text-xs text-slate-900 truncate">
                    {selectedProductForPrint.name}
                  </p>
                  <p className="text-base font-black text-indigo-700">
                    {formatRupiah(selectedProductForPrint.price)}
                  </p>

                  {/* High-Contrast SVG Barcode Visualization */}
                  <div className="py-2 flex flex-col items-center justify-center">
                    <svg className="w-52 h-14" viewBox="0 0 220 54">
                      {Array.from({ length: 42 }).map((_, i) => {
                        const isThick =
                          (i * 7 +
                            (selectedProductForPrint.sku.charCodeAt(
                              i % selectedProductForPrint.sku.length
                            ) || 0)) %
                            3 ===
                          0;
                        const width = isThick ? 4 : 2;
                        const x = i * 5 + 6;
                        return (
                          <rect
                            key={i}
                            x={x}
                            y="2"
                            width={width}
                            height="46"
                            fill="#0f172a"
                          />
                        );
                      })}
                    </svg>
                    <span className="font-mono text-xs font-black tracking-widest text-slate-900 mt-1 select-all">
                      *{selectedProductForPrint.sku}*
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 border-t border-dashed border-slate-200 pt-1 uppercase font-bold">
                    {settings.name || 'Sistem Kasir POS'} &bull; RAK DISPLAY
                  </p>
                </div>

                <div className="flex items-center justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Cetak Label Barcode Harga</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBarcodeDetected(selectedProductForPrint.sku)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-bold transition cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Tambah ke Kasir</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer info bar */}
        <div className="bg-slate-50 border-t border-slate-200 px-4 py-2.5 text-[11px] text-slate-500 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 font-medium">
            <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
            <span>Optimal untuk browser HP (Chrome, Safari, Firefox, Edge)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-bold text-slate-700 hover:text-slate-900 cursor-pointer"
          >
            Selesai
          </button>
        </div>
      </div>
    </div>
  );
};

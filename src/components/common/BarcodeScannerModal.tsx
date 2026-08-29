import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useStore } from '../../context/StoreContext';
import { Product, CartItem } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { playScanBeep } from '../../utils/soundNotifications';
import {
  X,
  Camera,
  Flashlight,
  FlipHorizontal,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  Plus,
  Minus,
  Trash2,
  ArrowRight,
  RefreshCw,
  Barcode,
  ShoppingBag,
  PlusCircle,
  Keyboard,
  Check,
  BookmarkCheck,
} from 'lucide-react';

export type ScannerUsageMode = 'pos' | 'product-input';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan?: (skuOrCode: string) => void;
  onScanSuccess?: (skuOrCode: string) => void;
  onProceedToCheckout?: () => void;
  onHoldTransaction?: () => void;
  onAddNewProductWithBarcode?: (barcode: string) => void;
  mode?: ScannerUsageMode;
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
  onProceedToCheckout,
  onHoldTransaction,
  onAddNewProductWithBarcode,
  mode = 'pos',
  modalTitle,
  modalSubtitle,
}) => {
  const {
    products,
    activeStoreId,
    settings,
    cart,
    cartTotals,
    addToCart,
    updateCartQty,
    removeFromCart,
    clearCart,
  } = useStore();

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraStarting, setIsCameraStarting] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [hapticEnabled, setHapticEnabled] = useState<boolean>(true);
  const [torchEnabled, setTorchEnabled] = useState<boolean>(false);
  const [hasTorchSupport, setHasTorchSupport] = useState<boolean>(false);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Manual fallback toggle & input
  const [showManualInput, setShowManualInput] = useState<boolean>(false);
  const [manualBarcode, setManualBarcode] = useState<string>('');

  // Last scanned item feedback
  const [lastDetectedCode, setLastDetectedCode] = useState<string | null>(null);
  const [lastMatchedProduct, setLastMatchedProduct] = useState<Product | null>(null);
  const [isNotFoundWarning, setIsNotFoundWarning] = useState<boolean>(false);
  const [scanSuccessPulse, setScanSuccessPulse] = useState<boolean>(false);

  // References for Html5Qrcode Scanner Engine
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const isStartingRef = useRef<boolean>(false);
  const lastScannedCodeRef = useRef<string>('');
  const lastScannedTimeRef = useRef<number>(0);
  const containerId = 'pos-pro-scanner-box';

  const branchProducts = products.filter(
    (p) => !activeStoreId || p.storeId === activeStoreId
  );

  // Find item in cart for the last matched product
  const lastCartItem = lastMatchedProduct
    ? cart.find((item) => item.product.id === lastMatchedProduct.id)
    : null;

  // Handle successful barcode reading
  const handleBarcodeDetected = useCallback(
    (decodedText: string) => {
      const cleanCode = decodedText.trim();
      if (!cleanCode) return;

      // Debounce duplicate scans within 1.0s if identical
      const now = Date.now();
      if (
        cleanCode === lastScannedCodeRef.current &&
        now - lastScannedTimeRef.current < 1000
      ) {
        return;
      }
      lastScannedCodeRef.current = cleanCode;
      lastScannedTimeRef.current = now;

      // Haptic & Audio
      if (soundEnabled) {
        playScanBeep(settings.audioNotification?.volume || 85);
      }
      if (hapticEnabled) {
        triggerHaptic([60, 30, 60]);
      }

      setLastDetectedCode(cleanCode);
      setScanSuccessPulse(true);
      setTimeout(() => setScanSuccessPulse(false), 800);

      // Match product in catalog
      const matched = branchProducts.find(
        (p) =>
          p.sku.toLowerCase() === cleanCode.toLowerCase() ||
          p.name.toLowerCase() === cleanCode.toLowerCase()
      );

      if (mode === 'pos') {
        if (matched) {
          setLastMatchedProduct(matched);
          setIsNotFoundWarning(false);

          if (matched.stock > 0) {
            addToCart(matched);
          }
        } else {
          setLastMatchedProduct(null);
          setIsNotFoundWarning(true);
        }

        if (onScan) onScan(cleanCode);
        if (onScanSuccess) onScanSuccess(cleanCode);
      } else {
        // Product Input mode (Adding or editing product)
        setLastMatchedProduct(matched || null);
        setIsNotFoundWarning(!matched);

        if (onScan) onScan(cleanCode);
        if (onScanSuccess) onScanSuccess(cleanCode);
      }
    },
    [
      soundEnabled,
      hapticEnabled,
      settings.audioNotification?.volume,
      branchProducts,
      mode,
      addToCart,
      onScan,
      onScanSuccess,
    ]
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
    if (!isOpen) return;
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

      const scanConfig = {
        fps: 22,
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const w = Math.floor(viewfinderWidth * 0.9);
          const h = Math.floor(viewfinderHeight * 0.62);
          return { width: Math.max(260, w), height: Math.max(150, h) };
        },
        aspectRatio: 1.333333,
        videoConstraints: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
        },
      };

      await qrScanner.start(
        { facingMode },
        scanConfig,
        (decodedText) => {
          handleBarcodeDetected(decodedText);
        },
        () => {
          // ignore periodic frame decode misses
        }
      );

      // Check torch support
      try {
        const stream = (targetElement.querySelector('video') as HTMLVideoElement)
          ?.srcObject as MediaStream;
        if (stream) {
          const track = stream.getVideoTracks()[0];
          if (track) {
            const capabilities = track.getCapabilities
              ? (track.getCapabilities() as any)
              : null;
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

      let msg = 'Kamera tidak dapat diakses atau izin ditolak.';
      if (err?.name === 'NotAllowedError' || err?.message?.includes('Permission')) {
        msg = 'Izin kamera ditolak browser. Berikan izin kamera di pengaturan browser.';
      } else if (err?.name === 'NotFoundError') {
        msg = 'Tidak ada perangkat kamera yang terdeteksi.';
      }
      setCameraError(msg);
    }
  }, [isOpen, facingMode, handleBarcodeDetected]);

  // Lifecycle
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOpen) {
      timer = setTimeout(() => {
        startCamera();
      }, 150);
    } else {
      stopCamera();
      setLastDetectedCode(null);
      setLastMatchedProduct(null);
      setIsNotFoundWarning(false);
      setShowManualInput(false);
      setManualBarcode('');
    }

    return () => {
      clearTimeout(timer);
      stopCamera();
    };
  }, [isOpen, facingMode]);

  // Toggle Flashlight / Torch
  const toggleTorch = async () => {
    const targetElement = document.getElementById(containerId);
    if (!targetElement) return;

    try {
      const stream = (targetElement.querySelector('video') as HTMLVideoElement)
        ?.srcObject as MediaStream;
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

  // Flip Camera
  const handleFlipCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
    if (hapticEnabled) triggerHaptic(40);
  };

  // Submit manual barcode
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBarcode.trim()) return;
    handleBarcodeDetected(manualBarcode.trim());
    setManualBarcode('');
  };

  // Quantity controls for last matched item
  const handleIncreaseQty = () => {
    if (!lastMatchedProduct) return;
    const currentQty = lastCartItem ? lastCartItem.quantity : 0;
    if (currentQty < lastMatchedProduct.stock) {
      if (lastCartItem) {
        updateCartQty(lastMatchedProduct.id, currentQty + 1);
      } else {
        addToCart(lastMatchedProduct, 1);
      }
      if (soundEnabled) playScanBeep(settings.audioNotification?.volume || 85);
      if (hapticEnabled) triggerHaptic(40);
    }
  };

  const handleDecreaseQty = () => {
    if (!lastMatchedProduct || !lastCartItem) return;
    if (lastCartItem.quantity > 1) {
      updateCartQty(lastMatchedProduct.id, lastCartItem.quantity - 1);
    } else {
      removeFromCart(lastMatchedProduct.id);
    }
    if (hapticEnabled) triggerHaptic(40);
  };

  // Direct checkout action
  const handleProceedToPayment = () => {
    if (cartTotals.itemCount === 0) return;
    onClose();
    if (onProceedToCheckout) {
      onProceedToCheckout();
    }
  };

  // Cancel / Clear Cart
  const handleCancelCart = () => {
    if (cart.length > 0) {
      if (window.confirm('Batalkan transaksi saat ini dan kosongkan keranjang?')) {
        clearCart();
        onClose();
      }
    } else {
      onClose();
    }
  };

  // Simpan / Park Transaksi
  const handleHold = () => {
    if (onHoldTransaction) {
      onHoldTransaction();
      onClose();
    }
  };

  if (!isOpen) return null;

  const defaultTitle =
    mode === 'pos' ? 'Pindai Barcode Kasir' : 'Pindai Barcode Produk';
  const headerTitle = modalTitle || defaultTitle;

  return (
    <div
      id="pro-barcode-scanner-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-2 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="pro-barcode-scanner-card"
        className="relative bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto flex flex-col max-h-[96vh]"
      >
        {/* Top Header: Clean, High-Contrast POS Header */}
        <div className="bg-slate-900 text-white px-4 sm:px-5 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#00A876] flex items-center justify-center text-white shrink-0 shadow-xs">
              {mode === 'pos' ? (
                <ShoppingBag className="w-4 h-4" />
              ) : (
                <Barcode className="w-4 h-4" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm truncate">
                  {headerTitle}
                </h3>
                {mode === 'pos' && cartTotals.itemCount > 0 && (
                  <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-[#00A876] text-white shrink-0">
                    {cartTotals.totalUnits} Unit • {formatRupiah(cartTotals.subtotal)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Controls: Torch, Flip, Sound, Close */}
          <div className="flex items-center gap-1.5 shrink-0">
            {hasTorchSupport && (
              <button
                type="button"
                onClick={toggleTorch}
                className={`p-2 rounded-xl border transition cursor-pointer ${
                  torchEnabled
                    ? 'bg-amber-400 border-amber-500 text-slate-950 shadow-md shadow-amber-200'
                    : 'border-slate-700 bg-slate-800 text-slate-300 hover:text-white'
                }`}
                title="Senter"
              >
                <Flashlight className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={handleFlipCamera}
              className="p-2 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
              title="Putar Kamera"
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border transition cursor-pointer ${
                soundEnabled
                  ? 'border-emerald-600 bg-emerald-600 text-white'
                  : 'border-slate-700 bg-slate-800 text-slate-400'
              }`}
              title="Suara Beep"
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>

            <button
              onClick={onClose}
              id="btn-close-scanner-modal"
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewfinder Frame Container */}
        <div className="relative aspect-4/3 w-full bg-slate-950 overflow-hidden shrink-0">
          {/* HTML5 QR Code Mount Container */}
          <div
            id={containerId}
            className="w-full h-full [&>video]:w-full [&>video]:h-full [&>video]:object-cover"
          />

          {/* Loading Camera */}
          {isCameraStarting && (
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-xs flex flex-col items-center justify-center text-white gap-2.5 z-20">
              <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
              <p className="text-xs font-bold text-slate-200">
                Mengaktifkan Pemindai Barcode...
              </p>
            </div>
          )}

          {/* Red Laser Viewfinder Overlay */}
          {isCameraActive && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-3 z-10">
              <div
                className={`relative w-64 sm:w-72 h-32 sm:h-36 border-2 rounded-2xl flex items-center justify-center transition-all ${
                  scanSuccessPulse
                    ? 'border-emerald-400 bg-emerald-500/20 shadow-[0_0_35px_rgba(52,211,153,0.7)]'
                    : 'border-emerald-400/90 bg-emerald-500/5 shadow-2xl'
                }`}
              >
                {/* Corner Marks */}
                <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-emerald-400 -mt-1 -ml-1 rounded-tl-xl" />
                <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-emerald-400 -mt-1 -mr-1 rounded-tr-xl" />
                <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-emerald-400 -mb-1 -ml-1 rounded-bl-xl" />
                <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-emerald-400 -mb-1 -mr-1 rounded-br-lg" />

                {/* Laser Line */}
                <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_14px_#f43f5e] animate-pulse" />
              </div>
            </div>
          )}

          {/* Floating Top Banner on Scan */}
          {lastDetectedCode && (
            <div
              className={`absolute top-2 inset-x-3 p-2.5 rounded-2xl text-xs font-bold shadow-xl animate-in slide-in-from-top-2 duration-150 flex items-center justify-between gap-2 z-20 ${
                lastMatchedProduct
                  ? 'bg-[#00A876] text-white'
                  : isNotFoundWarning
                  ? 'bg-amber-600 text-white'
                  : 'bg-slate-900 text-white'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                {lastMatchedProduct ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-200 shrink-0" />
                )}
                <div className="min-w-0">
                  <span className="font-mono text-xs opacity-90 block">
                    {lastDetectedCode}
                  </span>
                  <p className="text-[11px] truncate font-semibold">
                    {lastMatchedProduct
                      ? `${lastMatchedProduct.name} (${formatRupiah(lastMatchedProduct.price)})`
                      : 'Barcode belum terdaftar di cabang ini'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Camera Error Message */}
          {cameraError && !isCameraStarting && (
            <div className="absolute inset-0 bg-slate-900/95 p-5 text-center text-slate-300 space-y-3 z-30 flex flex-col items-center justify-center">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-extrabold text-white mb-1">
                  Kamera Tidak Dapat Diakses
                </h4>
                <p className="text-[11px] text-slate-400 max-w-xs">{cameraError}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Coba Lagi</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualInput(true)}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Keyboard className="w-3.5 h-3.5" />
                  <span>Ketik Manual</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Collapsible Manual Barcode Input */}
        {showManualInput && (
          <form
            onSubmit={handleManualSubmit}
            className="p-3 bg-slate-100 border-b border-slate-200 flex gap-2 animate-in slide-in-from-top-1"
          >
            <input
              type="text"
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              placeholder="Ketik barcode / SKU barang..."
              className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
              autoFocus
            />
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Cari
            </button>
            <button
              type="button"
              onClick={() => setShowManualInput(false)}
              className="p-2 text-slate-500 hover:text-slate-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* ========================================================================= */}
        {/* POS MODE: High-Contrast Task-Oriented Actions: Bayar, Simpan, Batal       */}
        {/* ========================================================================= */}
        {mode === 'pos' && (
          <div className="p-3 sm:p-4 space-y-3 bg-white flex-1 overflow-y-auto">
            {/* Scanned Item Details with Stepper */}
            {lastMatchedProduct ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-2.5 animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={lastMatchedProduct.image}
                    alt={lastMatchedProduct.name}
                    className="w-12 h-12 rounded-xl object-cover border border-emerald-300 bg-white shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                      {lastMatchedProduct.name}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-600">
                      <span className="font-mono text-emerald-800 font-bold">
                        {formatRupiah(lastMatchedProduct.price)}
                      </span>
                      <span>&bull;</span>
                      <span className="text-slate-500">
                        Stok: {lastMatchedProduct.stock}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quantity Stepper for Scanned Item */}
                <div className="flex items-center gap-1.5 shrink-0 bg-white p-1 rounded-xl border border-emerald-200 shadow-2xs">
                  <button
                    type="button"
                    onClick={handleDecreaseQty}
                    className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold transition cursor-pointer active:scale-95"
                    title="Kurangi Qty"
                  >
                    {lastCartItem && lastCartItem.quantity > 1 ? (
                      <Minus className="w-3.5 h-3.5" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                    )}
                  </button>
                  <span className="w-8 text-center font-mono font-black text-xs sm:text-sm text-slate-900">
                    {lastCartItem ? lastCartItem.quantity : 1}
                  </span>
                  <button
                    type="button"
                    onClick={handleIncreaseQty}
                    disabled={
                      lastCartItem
                        ? lastCartItem.quantity >= lastMatchedProduct.stock
                        : lastMatchedProduct.stock <= 1
                    }
                    className="w-7 h-7 rounded-lg bg-[#00A876] hover:bg-[#009267] disabled:opacity-40 text-white flex items-center justify-center font-bold transition cursor-pointer active:scale-95 shadow-2xs"
                    title="Tambah Qty"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : isNotFoundWarning ? (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center justify-between gap-2 animate-in fade-in">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  <div className="min-w-0 text-xs">
                    <p className="font-bold text-amber-900">
                      Barcode Belum Terdaftar
                    </p>
                    <p className="text-amber-700 text-[11px] truncate font-mono">
                      {lastDetectedCode}
                    </p>
                  </div>
                </div>
                {onAddNewProductWithBarcode && lastDetectedCode && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onAddNewProductWithBarcode(lastDetectedCode);
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shrink-0 flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Input Barang</span>
                  </button>
                )}
              </div>
            ) : null}

            {/* Total Summary Row */}
            <div className="flex items-center justify-between bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  Total Belanja
                </span>
                <p className="text-base sm:text-lg font-black text-emerald-400">
                  {formatRupiah(cartTotals.subtotal)}
                </p>
              </div>
              <span className="text-xs font-extrabold text-white bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-700">
                {cartTotals.itemCount} Jenis ({cartTotals.totalUnits} unit)
              </span>
            </div>

            {/* Task-Oriented High-Contrast Workflow Buttons: Bayar, Simpan Transaksi, Batal */}
            <div className="space-y-2 pt-1">
              {/* Primary Prominent Bayar Button */}
              <button
                type="button"
                id="btn-scanner-pay-now"
                disabled={cartTotals.itemCount === 0}
                onClick={handleProceedToPayment}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#00A876] hover:bg-[#009267] disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#00A876]/30 transition cursor-pointer active:scale-98"
              >
                <CreditCard className="w-5 h-5" />
                <span>Bayar Sekarang ({formatRupiah(cartTotals.subtotal)})</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Secondary Actions: Simpan Transaksi & Batal */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  id="btn-scanner-hold"
                  disabled={cartTotals.itemCount === 0}
                  onClick={handleHold}
                  className="py-2.5 px-3 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-40"
                >
                  <BookmarkCheck className="w-4 h-4 text-indigo-600" />
                  <span>Simpan Transaksi</span>
                </button>

                <button
                  type="button"
                  id="btn-scanner-cancel"
                  onClick={handleCancelCart}
                  className="py-2.5 px-3 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-rose-500" />
                  <span>{cart.length > 0 ? 'Batal (Reset)' : 'Tutup'}</span>
                </button>
              </div>
            </div>

            {/* Quick manual keyboard fallback */}
            {!showManualInput && (
              <button
                type="button"
                onClick={() => setShowManualInput(true)}
                className="text-[11px] text-slate-400 hover:text-slate-700 font-semibold text-center flex items-center justify-center gap-1 cursor-pointer pt-1 mx-auto"
              >
                <Keyboard className="w-3.5 h-3.5" />
                <span>Ketik barcode manual</span>
              </button>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* PRODUCT INPUT MODE: Focused Barcode Capture with Confirm & Use Button     */}
        {/* ========================================================================= */}
        {mode === 'product-input' && (
          <div className="p-4 space-y-3 bg-white flex-1 overflow-y-auto">
            {lastDetectedCode ? (
              <div className="p-4 bg-emerald-50 border-2 border-emerald-200 rounded-2xl space-y-3 text-center animate-in zoom-in-95">
                <div className="w-10 h-10 rounded-full bg-[#00A876] text-white flex items-center justify-center mx-auto shadow-md">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Barcode Terdeteksi
                  </span>
                  <p className="text-xl sm:text-2xl font-mono font-black text-slate-900 tracking-wider">
                    {lastDetectedCode}
                  </p>
                </div>

                {lastMatchedProduct && (
                  <p className="text-xs text-amber-800 bg-amber-100 px-3 py-1.5 rounded-xl font-semibold inline-block">
                    Sudah terdaftar: <strong>{lastMatchedProduct.name}</strong>
                  </p>
                )}

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setLastDetectedCode(null);
                      setLastMatchedProduct(null);
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition cursor-pointer"
                  >
                    Scan Ulang
                  </button>
                  <button
                    type="button"
                    id="btn-use-scanned-barcode"
                    onClick={() => {
                      if (onScan) onScan(lastDetectedCode);
                      onClose();
                    }}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-[#00A876] hover:bg-[#009267] text-white font-extrabold text-xs shadow-md shadow-[#00A876]/20 transition cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Gunakan Barcode Ini</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2">
                <Barcode className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-bold text-slate-700">
                  Arahkan kamera ke barcode kemasan barang
                </p>

                {!showManualInput && (
                  <button
                    type="button"
                    onClick={() => setShowManualInput(true)}
                    className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-[#00A876] hover:underline cursor-pointer"
                  >
                    <Keyboard className="w-3.5 h-3.5" />
                    <span>Ketik Barcode Manual</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};


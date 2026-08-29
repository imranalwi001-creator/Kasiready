import React, { useState, useEffect } from 'react';
import { useStore } from '../../context/StoreContext';
import { PaymentMethod, Sale, Customer } from '../../types';
import {
  formatRupiah,
  getPaymentMethodLabel,
  getTierBadge,
} from '../../utils/formatters';
import {
  X,
  Banknote,
  QrCode,
  CreditCard,
  Building2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Receipt,
  User,
  FileText,
  Tag,
  Award,
  Smartphone,
  Sparkles,
  Zap,
  Clock,
  ShieldCheck,
  Send,
  MessageSquare,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { sendWhatsAppReceiptAPI } from '../../utils/whatsapp';
import { DynamicQRISPanel } from './DynamicQRISPanel';
import { triggerPaymentSuccessNotification } from '../../utils/soundNotifications';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (sale: Sale) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const {
    cartTotals,
    processCheckout,
    activeCashier,
    settings,
    customers,
    activeStore,
  } = useStore();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [guestName, setGuestName] = useState<string>('');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [cashInput, setCashInput] = useState<string>('');
  const [selectedBank, setSelectedBank] = useState<string>('BCA');
  const [edcApprovalCode, setEdcApprovalCode] = useState<string>('');
  const [ovoPhone, setOvoPhone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [copiedVA, setCopiedVA] = useState(false);

  // WhatsApp Digital Receipt Automation
  const [autoSendWhatsApp, setAutoSendWhatsApp] = useState<boolean>(true);
  const [customerWhatsappPhone, setCustomerWhatsappPhone] = useState<string>('');
  const [whatsappDeliveryStatus, setWhatsappDeliveryStatus] = useState<'idle' | 'sending' | 'sent' | 'fallback_ready'>('idle');

  // Loyalty points redemption
  const [usePoints, setUsePoints] = useState<boolean>(false);
  const [pointsToRedeem, setPointsToRedeem] = useState<number>(0);

  // Digital Gateway Simulation States
  const [gatewayStatus, setGatewayStatus] = useState<
    'idle' | 'waiting_user' | 'verifying' | 'success'
  >('idle');
  const [gatewayTimer, setGatewayTimer] = useState<number>(45);

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  // Max points eligible to redeem
  const pointRate = settings.pointsRedeemValue || 100;
  const rawSubtotal = cartTotals.subtotal;
  const directDiscount = Math.min(rawSubtotal, Math.max(0, discountAmount || 0));

  const maxPointsPossible = selectedCustomer
    ? Math.min(
        selectedCustomer.points,
        Math.floor((rawSubtotal - directDiscount) / pointRate)
      )
    : 0;

  const pointsDiscount = usePoints ? pointsToRedeem * pointRate : 0;
  const totalDiscount = Math.min(rawSubtotal, directDiscount + pointsDiscount);
  const taxableAmount = Math.max(0, rawSubtotal - totalDiscount);
  const taxAmount = settings.enableTax
    ? Math.round(taxableAmount * (settings.taxRate / 100))
    : 0;
  const finalTotal = taxableAmount + taxAmount;

  const numericCash = Number(cashInput.replace(/\D/g, '')) || 0;
  const changeAmount = Math.max(0, numericCash - finalTotal);
  const isCashInsufficient = paymentMethod === 'cash' && numericCash < finalTotal;

  // Projected points to earn
  const projectedEarnedPoints = selectedCustomer
    ? Math.floor(finalTotal / (settings.pointsRewardRatio || 10000))
    : 0;

  const enabledMethods = settings.enabledPaymentMethods || {
    cash: true,
    qris: true,
    transfer: true,
    debit: false,
    gopay: false,
    ovo: false,
    dana: false,
  };

  useEffect(() => {
    if (isOpen) {
      // Determine initial payment method based on enabled settings
      if (enabledMethods.cash) {
        setPaymentMethod('cash');
      } else if (enabledMethods.qris) {
        setPaymentMethod('qris');
      } else if (enabledMethods.transfer) {
        setPaymentMethod('transfer');
      } else if (enabledMethods.debit) {
        setPaymentMethod('debit');
      } else if (enabledMethods.gopay) {
        setPaymentMethod('gopay');
      } else if (enabledMethods.ovo) {
        setPaymentMethod('ovo');
      }

      setDiscountAmount(0);
      setSelectedCustomerId('');
      setGuestName('');
      setNotes('');
      setUsePoints(false);
      setPointsToRedeem(0);
      setCashInput(finalTotal.toString());
      setEdcApprovalCode(Math.floor(100000 + Math.random() * 900000).toString());
      setGatewayStatus('idle');
      setGatewayTimer(45);
      setAutoSendWhatsApp(settings.whatsapp?.autoSendOnSuccess ?? true);
      setCustomerWhatsappPhone('');
      setWhatsappDeliveryStatus('idle');
    }
  }, [isOpen]);

  useEffect(() => {
    if (paymentMethod === 'cash') {
      setCashInput(finalTotal.toString());
    }
  }, [finalTotal, paymentMethod]);

  // When customer changes, autofill phone for OVO/GoPay and WhatsApp if applicable
  useEffect(() => {
    if (selectedCustomer) {
      setOvoPhone(selectedCustomer.phone);
      setCustomerWhatsappPhone(selectedCustomer.phone);
      setPointsToRedeem(maxPointsPossible);
    } else {
      setUsePoints(false);
      setPointsToRedeem(0);
    }
  }, [selectedCustomerId, maxPointsPossible]);

  // Digital Gateway Polling Simulation Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (gatewayStatus === 'waiting_user' && gatewayTimer > 0) {
      interval = setInterval(() => {
        setGatewayTimer((prev) => {
          if (prev <= 1) {
            setGatewayStatus('verifying');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (gatewayStatus === 'verifying') {
      const timeout = setTimeout(() => {
        setGatewayStatus('success');
      }, 1200);
      return () => clearTimeout(timeout);
    }
    return () => clearInterval(interval);
  }, [gatewayStatus, gatewayTimer]);

  if (!isOpen) return null;

  const handleQuickCash = (amount: number) => {
    setCashInput(amount.toString());
  };

  const handleExactCash = () => {
    setCashInput(finalTotal.toString());
  };

  const handleAddCash = (amountToAdd: number) => {
    const current = Number(cashInput.replace(/\D/g, '')) || 0;
    setCashInput((current + amountToAdd).toString());
  };

  const handleStartDigitalGateway = () => {
    setGatewayStatus('waiting_user');
    setGatewayTimer(30);
  };

  const handleSimulatePaymentSuccess = () => {
    setGatewayStatus('verifying');
    setTimeout(() => {
      setGatewayStatus('success');
    }, 600);
  };

  const completeCheckoutFlow = () => {
    setIsProcessing(true);

    setTimeout(() => {
      let paid = finalTotal;
      if (paymentMethod === 'cash') {
        paid = numericCash;
      }

      let extraNote = notes.trim();
      let gatewayRef = undefined;

      if (paymentMethod === 'gopay') {
        gatewayRef = `GOPAY-${Date.now().toString().slice(-7)}`;
        extraNote = `GoPay Gateway (${gatewayRef})${extraNote ? ` - ${extraNote}` : ''}`;
      } else if (paymentMethod === 'ovo') {
        gatewayRef = `OVO-${ovoPhone || Date.now().toString().slice(-6)}`;
        extraNote = `OVO Push Pay ${ovoPhone} (${gatewayRef})${extraNote ? ` - ${extraNote}` : ''}`;
      } else if (paymentMethod === 'dana') {
        gatewayRef = `DANA-${Date.now().toString().slice(-7)}`;
        extraNote = `DANA Wallet (${gatewayRef})${extraNote ? ` - ${extraNote}` : ''}`;
      } else if (paymentMethod === 'debit') {
        extraNote = `EDC ${selectedBank} (Appr: ${edcApprovalCode})${extraNote ? ` - ${extraNote}` : ''}`;
      } else if (paymentMethod === 'transfer') {
        gatewayRef = `VA-${selectedBank}-${Math.floor(10000000 + Math.random() * 90000000)}`;
        extraNote = `VA ${selectedBank} (${gatewayRef})${extraNote ? ` - ${extraNote}` : ''}`;
      }

      const completedSale = processCheckout({
        storeId: activeStore.id,
        paymentMethod,
        paymentStatus: 'completed',
        paymentGatewayRef: gatewayRef,
        customerId: selectedCustomer ? selectedCustomer.id : undefined,
        customerName: selectedCustomer ? selectedCustomer.name : guestName.trim() || 'Pelanggan Umum',
        cashierName: activeCashier,
        discount: directDiscount,
        pointsRedeemed: usePoints ? pointsToRedeem : 0,
        pointsDiscount: pointsDiscount,
        paidAmount: paid,
        notes: extraNote,
      });

      // Automated WhatsApp Receipt dispatch
      const targetPhone = customerWhatsappPhone.trim() || selectedCustomer?.phone || '';
      if (autoSendWhatsApp && targetPhone) {
        try {
          sendWhatsAppReceiptAPI(completedSale, settings, targetPhone).then((res) => {
            if (res.directLink && !settings.whatsapp?.apiKey) {
              // Open web whatsapp link if direct URL fallback
              window.open(res.directLink, '_blank', 'noopener,noreferrer');
            }
          });
        } catch {
          // ignore background sending errors
        }
      }

      // Confetti effect
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Safe catch
      }

      // Audio notification & Voice Announcer (if payment method is not DANA/QRIS which triggers in DynamicQRISPanel)
      if (paymentMethod !== 'dana' && paymentMethod !== 'qris') {
        triggerPaymentSuccessNotification(
          completedSale.totalAmount,
          getPaymentMethodLabel(paymentMethod),
          selectedCustomer?.name,
          settings.audioNotification
        );
      }

      setIsProcessing(false);
      onSuccess(completedSale);
    }, 350);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCashInsufficient) return;
    completeCheckoutFlow();
  };

  const virtualAccountNum = `8808${Math.floor(10000000 + Math.random() * 90000000)}`;

  const handleCopyVA = () => {
    navigator.clipboard.writeText(virtualAccountNum);
    setCopiedVA(true);
    setTimeout(() => setCopiedVA(false), 2000);
  };

  return (
    <div
      id="checkout-modal-backdrop"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isProcessing) onClose();
      }}
    >
      <div
        id="checkout-modal-card"
        className="relative bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl max-w-2xl w-full h-[92vh] sm:h-auto sm:max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-in fade-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200"
      >
        {/* Mobile Drag Indicator Bar */}
        <div className="sm:hidden w-12 h-1 bg-slate-300 rounded-full mx-auto mt-2.5 mb-1" />

        {/* Header */}
        <div className="bg-[#0B1320] text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#00A876]" />
            <div>
              <h3 className="font-bold text-sm sm:text-base">Pembayaran &amp; Selesai Transaksi</h3>
              <p className="text-[11px] text-slate-400">
                Toko: <span className="text-white font-semibold">{activeStore.name}</span>
              </p>
            </div>
          </div>
          <button
            id="close-checkout-modal-btn"
            onClick={onClose}
            disabled={isProcessing}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition disabled:opacity-50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto">
          {/* Summary Banner */}
          <div className="bg-[#0B1320] rounded-2xl p-4 sm:p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md border border-slate-800">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">
                Total Tagihan Pembayaran
              </p>
              <p className="text-2xl sm:text-3xl font-black text-[#00A876] tracking-tight mt-0.5">
                {formatRupiah(finalTotal)}
              </p>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                <span>{cartTotals.itemCount} item ({cartTotals.totalUnits} unit)</span>
                {totalDiscount > 0 && (
                  <span className="text-amber-400 font-medium">
                    (Hemat {formatRupiah(totalDiscount)})
                  </span>
                )}
              </div>
            </div>
            <div className="bg-slate-900 px-3.5 py-2 rounded-xl text-right text-xs self-start sm:self-center border border-slate-800">
              <span className="text-slate-400 block text-[11px]">Kasir Bertugas</span>
              <span className="font-bold text-white text-sm">{activeCashier}</span>
            </div>
          </div>

          {/* Customer Selection & Loyalty Points */}
          <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <User className="w-4 h-4 text-[#00A876]" />
                Pilih Pelanggan / Member (Loyalitas)
              </label>
              {selectedCustomer && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getTierBadge(selectedCustomer.tier).bg} ${getTierBadge(selectedCustomer.tier).text} ${getTierBadge(selectedCustomer.tier).border}`}>
                  {selectedCustomer.tier} Member
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#00A876] bg-white"
                >
                  <option value="">-- Pelanggan Umum (Tanpa Member) --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone}) - {c.points} Pts [{c.tier}]
                    </option>
                  ))}
                </select>
              </div>

              {!selectedCustomer ? (
                <div>
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="Nama Tamu (Opsional)"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#00A876] bg-white"
                  />
                </div>
              ) : (
                <div className="bg-white p-2.5 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Saldo Poin Member:</span>
                    <span className="font-black text-amber-600 text-sm flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-500" />
                      {selectedCustomer.points} Pts
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-500 block text-[10px]">Poin Didapat:</span>
                    <span className="font-bold text-emerald-600">
                      +{projectedEarnedPoints} Pts
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Loyalty Points Redemption Toggle */}
            {selectedCustomer && selectedCustomer.points > 0 && (
              <div className="pt-2 border-t border-emerald-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={usePoints}
                    onChange={(e) => setUsePoints(e.target.checked)}
                    className="rounded text-[#00A876] focus:ring-[#00A876] w-4 h-4"
                  />
                  <span>Tukarkan Poin Loyalitas untuk Diskon Belanja</span>
                </label>

                {usePoints && (
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <input
                      type="number"
                      min="1"
                      max={maxPointsPossible}
                      value={pointsToRedeem}
                      onChange={(e) =>
                        setPointsToRedeem(
                          Math.min(maxPointsPossible, Math.max(1, Number(e.target.value) || 0))
                        )
                      }
                      className="w-20 px-2 py-1 rounded-lg border border-indigo-300 text-xs font-bold text-center bg-white"
                    />
                    <span className="text-xs font-bold text-amber-700">
                      = Hemat {formatRupiah(pointsDiscount)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* WhatsApp Digital Receipt Automatic Notification */}
          <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200/80 space-y-2.5">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-emerald-950">
                <input
                  type="checkbox"
                  id="checkout-send-whatsapp-checkbox"
                  checked={autoSendWhatsApp}
                  onChange={(e) => setAutoSendWhatsApp(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  Kirim Struk Pembayaran via WhatsApp Otomatis
                </span>
              </label>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full border border-emerald-200">
                {settings.whatsapp?.provider ? `${settings.whatsapp.provider.toUpperCase()} Gateway` : 'Direct WhatsApp Web'}
              </span>
            </div>

            {autoSendWhatsApp && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 pt-1">
                <div className="relative flex-1">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    id="checkout-customer-whatsapp-input"
                    value={customerWhatsappPhone}
                    onChange={(e) => setCustomerWhatsappPhone(e.target.value)}
                    placeholder="Nomor WhatsApp Pelanggan (contoh: 08123456789)..."
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-emerald-300 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
                <p className="text-[10px] text-emerald-800 leading-tight">
                  Struk dan rincian belanja dikirim langsung ke WhatsApp pelanggan setelah transaksi berhasil.
                </p>
              </div>
            )}
          </div>

          {/* Payment Method Selector Grid */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
              Pilih Metode Pembayaran
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {enabledMethods.cash && (
                <button
                  type="button"
                  id="pay-method-cash"
                  onClick={() => {
                    setPaymentMethod('cash');
                    setGatewayStatus('idle');
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'cash'
                      ? 'border-2 border-[#00A876] bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Banknote
                    className={`w-5 h-5 mb-1 ${
                      paymentMethod === 'cash' ? 'text-[#00A876]' : 'text-slate-500'
                    }`}
                  />
                  <span className="text-xs">Tunai (Cash)</span>
                </button>
              )}

              {enabledMethods.qris && (
                <button
                  type="button"
                  id="pay-method-qris"
                  onClick={() => {
                    setPaymentMethod('qris');
                    setGatewayStatus('idle');
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'qris' || paymentMethod === 'dana'
                      ? 'border-2 border-rose-600 bg-rose-50 text-rose-950 font-bold shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <QrCode
                    className={`w-5 h-5 mb-1 ${
                      paymentMethod === 'qris' || paymentMethod === 'dana' ? 'text-rose-600' : 'text-slate-500'
                    }`}
                  />
                  <span className="text-xs">QRIS Universal</span>
                </button>
              )}

              {enabledMethods.transfer && (
                <button
                  type="button"
                  id="pay-method-transfer"
                  onClick={() => {
                    setPaymentMethod('transfer');
                    setGatewayStatus('idle');
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'transfer'
                      ? 'border-2 border-amber-600 bg-amber-50 text-amber-950 font-bold shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Building2
                    className={`w-5 h-5 mb-1 ${
                      paymentMethod === 'transfer' ? 'text-amber-600' : 'text-slate-500'
                    }`}
                  />
                  <span className="text-xs">Transfer Bank / VA</span>
                </button>
              )}

              {enabledMethods.debit && (
                <button
                  type="button"
                  id="pay-method-debit"
                  onClick={() => {
                    setPaymentMethod('debit');
                    setGatewayStatus('idle');
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'debit'
                      ? 'border-2 border-indigo-600 bg-indigo-50 text-indigo-950 font-bold shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <CreditCard
                    className={`w-5 h-5 mb-1 ${
                      paymentMethod === 'debit' ? 'text-indigo-600' : 'text-slate-500'
                    }`}
                  />
                  <span className="text-xs">Kartu Debit / EDC</span>
                </button>
              )}

              {enabledMethods.gopay && (
                <button
                  type="button"
                  id="pay-method-gopay"
                  onClick={() => {
                    setPaymentMethod('gopay');
                    setGatewayStatus('idle');
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'gopay'
                      ? 'border-2 border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Smartphone
                    className={`w-5 h-5 mb-1 ${
                      paymentMethod === 'gopay' ? 'text-emerald-600' : 'text-slate-500'
                    }`}
                  />
                  <span className="text-xs">GoPay Digital</span>
                </button>
              )}

              {enabledMethods.ovo && (
                <button
                  type="button"
                  id="pay-method-ovo"
                  onClick={() => {
                    setPaymentMethod('ovo');
                    setGatewayStatus('idle');
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentMethod === 'ovo'
                      ? 'border-2 border-purple-600 bg-purple-50 text-purple-950 font-bold shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Zap
                    className={`w-5 h-5 mb-1 ${
                      paymentMethod === 'ovo' ? 'text-purple-600' : 'text-slate-500'
                    }`}
                  />
                  <span className="text-xs">OVO Push Pay</span>
                </button>
              )}
            </div>
          </div>

          {/* Dynamic Content by Payment Method */}
          {paymentMethod === 'cash' && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nominal Uang Tunai Diterima (Rp)
                </label>
                <input
                  type="text"
                  id="cash-input-field"
                  value={cashInput}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '');
                    setCashInput(clean);
                  }}
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 text-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#00A876] bg-white"
                  placeholder="0"
                  autoFocus
                />
              </div>

              {/* Quick Cash Buttons */}
              <div className="space-y-1.5">
                <p className="text-[11px] font-semibold text-slate-500">Pilihan Uang Pas &amp; Pecahan:</p>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={handleExactCash}
                    className="px-3 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-xs font-bold transition cursor-pointer"
                  >
                    Uang Pas ({formatRupiah(finalTotal)})
                  </button>
                  {[20000, 50000, 100000, 200000, 500000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => handleQuickCash(amt)}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-[#00A876] hover:bg-emerald-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
                    >
                      {formatRupiah(amt)}
                    </button>
                  ))}
                  {[10000, 20000, 50000].map((addAmt) => (
                    <button
                      key={`add-${addAmt}`}
                      type="button"
                      onClick={() => handleAddCash(addAmt)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-medium transition cursor-pointer"
                    >
                      +{formatRupiah(addAmt)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Kembalian */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">Kembalian Pelanggan</span>
                  <span
                    className={`text-lg font-black ${
                      isCashInsufficient ? 'text-red-600' : 'text-emerald-700'
                    }`}
                  >
                    {isCashInsufficient ? 'Uang Masih Kurang' : formatRupiah(changeAmount)}
                  </span>
                </div>
                {isCashInsufficient && (
                  <span className="text-xs text-red-600 font-medium flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Kurang {formatRupiah(finalTotal - numericCash)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* GoPay Gateway Integration Panel */}
          {paymentMethod === 'gopay' && (
            <div className="p-4 bg-sky-50/60 rounded-2xl border border-sky-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    G
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-sky-950">Gateway GoPay Digital</h4>
                    <p className="text-[11px] text-sky-700">QR Dinamis &amp; Notifikasi Instan</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 text-[10px] font-bold">
                  Auto Webhook Ready
                </span>
              </div>

              <div className="bg-white p-4 rounded-xl border border-sky-200 text-center space-y-2.5">
                <div className="w-36 h-36 mx-auto bg-slate-50 p-2 rounded-xl border border-slate-200 shadow-xs flex items-center justify-center">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=GOPAY-PAY-${finalTotal}-${Date.now()}`}
                    alt="GoPay Dynamic QR"
                    className="w-full h-full object-contain"
                  />
                </div>
                <p className="text-xs font-bold text-slate-800">
                  Total Tagihan GoPay: {formatRupiah(finalTotal)}
                </p>
                <p className="text-[11px] text-slate-500">
                  Scan QR via aplikasi GoPay atau Tokopedia. Status pesanan akan terverifikasi secara otomatis.
                </p>

                {gatewayStatus === 'idle' && (
                  <button
                    type="button"
                    onClick={handleSimulatePaymentSuccess}
                    className="w-full mt-2 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Simulasi Konfirmasi Pembayaran GoPay</span>
                  </button>
                )}

                {gatewayStatus === 'verifying' && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center justify-center gap-2 animate-pulse">
                    <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                    <span>Memverifikasi callback webhook GoPay...</span>
                  </div>
                )}

                {gatewayStatus === 'success' && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Pembayaran GoPay Sukses Terverifikasi (LUNAS)</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* OVO Push Notification Gateway Integration */}
          {paymentMethod === 'ovo' && (
            <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    OVO
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-purple-950">Gateway OVO Push Payment</h4>
                    <p className="text-[11px] text-purple-700">Kirim tagihan langsung ke aplikasi ponsel pelanggan</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-purple-200 space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor Ponsel Akun OVO Pelanggan *
                  </label>
                  <input
                    type="tel"
                    required
                    value={ovoPhone}
                    onChange={(e) => setOvoPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                  />
                </div>

                {gatewayStatus === 'idle' && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleStartDigitalGateway}
                      disabled={!ovoPhone}
                      className="flex-1 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Kirim Push Notification ke OVO ({formatRupiah(finalTotal)})</span>
                    </button>
                  </div>
                )}

                {gatewayStatus === 'waiting_user' && (
                  <div className="p-3.5 rounded-xl bg-purple-50 border border-purple-200 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-purple-900">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-purple-600 animate-spin" />
                        Menunggu persetujuan pelanggan di aplikasi OVO...
                      </span>
                      <span className="font-mono text-purple-700">{gatewayTimer}s</span>
                    </div>
                    <p className="text-[11px] text-purple-700">
                      Notifikasi tagihan telah dikirim ke nomor {ovoPhone}. Pelanggan diminta membuka aplikasi OVO untuk konfirmasi.
                    </p>
                    <button
                      type="button"
                      onClick={handleSimulatePaymentSuccess}
                      className="w-full py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition cursor-pointer"
                    >
                      Simulasi: Pelanggan Menekan &quot;Bayar&quot; di OVO
                    </button>
                  </div>
                )}

                {gatewayStatus === 'verifying' && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center justify-center gap-2 animate-pulse">
                    <div className="w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
                    <span>Sinkronisasi status pembayaran OVO...</span>
                  </div>
                )}

                {gatewayStatus === 'success' && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Pembayaran OVO Berhasil Dikonfirmasi!</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* QRIS & DANA Dynamic QR Section */}
          {(paymentMethod === 'qris' || paymentMethod === 'dana') && (
            <DynamicQRISPanel
              amount={finalTotal}
              invoiceNumber={`TRX-${Date.now().toString().slice(-6)}`}
              preferredWallet={paymentMethod}
              onSuccess={(refId) => {
                completeCheckoutFlow();
              }}
            />
          )}

          {/* Transfer Bank / VA */}
          {paymentMethod === 'transfer' && (
            <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Pilih Bank Virtual Account
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {['BCA', 'Mandiri', 'BRI', 'BNI'].map((bank) => (
                    <button
                      key={bank}
                      type="button"
                      onClick={() => setSelectedBank(bank)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        selectedBank === bank
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {bank}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Nomor Virtual Account {selectedBank}</p>
                    <p className="text-[11px] text-slate-500">Otomatis Terverifikasi via Payment Gateway</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyVA}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-300 text-amber-800 text-xs font-semibold hover:bg-amber-100 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedVA ? 'Tersalin!' : 'Salin Nomor'}</span>
                  </button>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 font-mono text-center text-sm font-bold text-slate-900 tracking-wider">
                  {virtualAccountNum}
                </div>
                <p className="text-[11px] text-slate-500 text-center">
                  Atas Nama: {activeStore.name} • Nominal Transfer: {formatRupiah(finalTotal)}
                </p>
              </div>
            </div>
          )}

          {/* Debit / EDC */}
          {paymentMethod === 'debit' && (
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Pilih Mesin EDC / Bank Penerbit
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['BCA', 'Mandiri', 'BRI', 'BNI', 'CIMB', 'Lainnya'].map((bank) => (
                    <button
                      key={bank}
                      type="button"
                      onClick={() => setSelectedBank(bank)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${
                        selectedBank === bank
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {bank}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nomor Approval / Kode Transaksi EDC
                </label>
                <input
                  type="text"
                  value={edcApprovalCode}
                  onChange={(e) => setEdcApprovalCode(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  placeholder="Contoh: 829104"
                />
              </div>
            </div>
          )}

          {/* Manual Discount and Transaction Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                Potongan Diskon Tambahan (Rp)
              </label>
              <input
                type="number"
                min="0"
                max={rawSubtotal}
                value={discountAmount || ''}
                onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                Catatan Transaksi
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Tambahkan catatan khusus..."
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          </div>

          {/* Action Buttons - Sticky at Bottom on Mobile */}
          <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between sm:justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              id="confirm-payment-btn"
              disabled={isProcessing || isCashInsufficient}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#00A876] hover:bg-[#009267] text-white text-xs sm:text-sm font-black shadow-lg shadow-[#00A876]/30 transition disabled:opacity-50 active:scale-95 cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Memproses Pembayaran...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Bayar Sekarang ({formatRupiah(finalTotal)})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

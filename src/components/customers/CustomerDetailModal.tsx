import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { Customer } from '../../types';
import {
  formatRupiah,
  formatIndonesianDate,
  getTierBadge,
  getPaymentMethodLabel,
} from '../../utils/formatters';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Award,
  ShoppingBag,
  Clock,
  TrendingUp,
  Receipt,
  PlusCircle,
  MinusCircle,
  FileText,
  CreditCard,
  QrCode,
} from 'lucide-react';

interface CustomerDetailModalProps {
  customer: Customer | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectReceipt?: (saleId: string) => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  customer,
  isOpen,
  onClose,
  onSelectReceipt,
}) => {
  const { sales, adjustCustomerPoints, settings, stores } = useStore();
  const [pointAdjustment, setPointAdjustment] = useState<string>('');
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [showAdjustPoints, setShowAdjustPoints] = useState<boolean>(false);

  if (!isOpen || !customer) return null;

  // Filter sales for this customer
  const customerSales = sales.filter(
    (s) => s.customerId === customer.id || (s.customerName && s.customerName.toLowerCase() === customer.name.toLowerCase())
  );

  const tierBadge = getTierBadge(customer.tier);

  const handleApplyPointAdj = (isPositive: boolean) => {
    const pts = Number(pointAdjustment);
    if (!pts || pts <= 0) return;
    const diff = isPositive ? pts : -pts;
    adjustCustomerPoints(customer.id, diff, adjustReason.trim() || (isPositive ? 'Bonus Manual' : 'Koreksi Manual'));
    setPointAdjustment('');
    setAdjustReason('');
    setShowAdjustPoints(false);
  };

  return (
    <div
      id="customer-detail-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="customer-detail-modal-card"
        className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-8"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-bold text-base">Profil &amp; Riwayat Belanja Pelanggan</h3>
              <p className="text-xs text-slate-400">ID: {customer.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
          {/* Member Card & Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Virtual Membership Badge */}
            <div className="md:col-span-1 bg-linear-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-5 text-white flex flex-col justify-between shadow-lg relative overflow-hidden border border-indigo-500/30">
              <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 rounded-full bg-indigo-500/10 blur-xl pointer-events-none" />

              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-300">
                    Kartu Loyalitas Member
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${tierBadge.bg} ${tierBadge.text} ${tierBadge.border}`}>
                    Tier {customer.tier}
                  </span>
                </div>
                <h4 className="text-base font-black tracking-tight">{customer.name}</h4>
                <p className="text-xs text-slate-300 font-mono mt-0.5">{customer.phone}</p>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-700/60 flex items-end justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block">Saldo Poin Loyalitas</span>
                  <span className="text-2xl font-black text-amber-400 flex items-center gap-1">
                    <Award className="w-5 h-5 text-amber-400 inline" />
                    {customer.points} <span className="text-xs font-semibold text-slate-300">Pts</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    ≈ {formatRupiah(customer.points * (settings.pointsRedeemValue || 100))}
                  </span>
                </div>
                <div className="p-1.5 bg-white rounded-lg">
                  <QrCode className="w-7 h-7 text-slate-900" />
                </div>
              </div>
            </div>

            {/* Profile Statistics Summary */}
            <div className="md:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-xs font-bold">Total Transaksi</span>
                  <ShoppingBag className="w-4 h-4 text-indigo-500" />
                </div>
                <p className="text-xl font-black text-slate-900">{customerSales.length}x</p>
                <p className="text-[10px] text-slate-500 mt-1">Kali berbelanja</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-xs font-bold">Total Belanja</span>
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-lg sm:text-xl font-black text-emerald-700">
                  {formatRupiah(customer.totalSpent)}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">Akumulasi pengeluaran</p>
              </div>

              <div className="col-span-2 sm:col-span-1 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 mb-1">
                  <span className="text-xs font-bold">Terdaftar Sejak</span>
                  <Clock className="w-4 h-4 text-amber-500" />
                </div>
                <p className="text-xs font-bold text-slate-800">
                  {formatIndonesianDate(customer.createdAt)}
                </p>
                <p className="text-[10px] text-slate-500 mt-1">Member aktif</p>
              </div>

              {/* Contact and address */}
              <div className="col-span-2 sm:col-span-3 p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                {customer.email && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{customer.email}</span>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{customer.address}</span>
                  </div>
                )}
                {customer.notes && (
                  <div className="flex items-center gap-2 text-indigo-700 font-medium pt-1">
                    <FileText className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>Catatan: {customer.notes}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Points Adjustment Tool */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-500" />
                  Manajemen &amp; Penyesuaian Poin Loyalitas
                </h4>
                <p className="text-[11px] text-slate-500">
                  Setiap Rp {settings.pointsRewardRatio?.toLocaleString('id-ID')} belanja menghasilkan 1 Poin (1 Poin = Rp {settings.pointsRedeemValue})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAdjustPoints(!showAdjustPoints)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 transition cursor-pointer"
              >
                {showAdjustPoints ? 'Tutup Form' : 'Sesuaikan Poin'}
              </button>
            </div>

            {showAdjustPoints && (
              <div className="mt-4 pt-3 border-t border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Jumlah Poin
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={pointAdjustment}
                      onChange={(e) => setPointAdjustment(e.target.value)}
                      placeholder="Misal: 50"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Alasan / Keterangan Penyesuaian
                    </label>
                    <input
                      type="text"
                      value={adjustReason}
                      onChange={(e) => setAdjustReason(e.target.value)}
                      placeholder="Misal: Hadiah ulang tahun / Promo"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleApplyPointAdj(false)}
                    disabled={!pointAdjustment}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                  >
                    <MinusCircle className="w-3.5 h-3.5" />
                    Kurangi Poin (-{pointAdjustment || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyPointAdj(true)}
                    disabled={!pointAdjustment}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Tambah Poin (+{pointAdjustment || 0})
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Purchase History */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-indigo-500" />
                Riwayat Transaksi Pelanggan ({customerSales.length})
              </h4>
            </div>

            {customerSales.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-slate-500 text-xs">
                Belum ada catatan transaksi belanja atas nama pelanggan ini.
              </div>
            ) : (
              <div className="space-y-2.5">
                {customerSales.map((sale) => {
                  const storeInfo = stores.find((s) => s.id === sale.storeId);
                  return (
                    <div
                      key={sale.id}
                      className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white transition space-y-2"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {sale.invoiceNumber}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                            {storeInfo?.name || 'Cabang'}
                          </span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 font-semibold">
                            {getPaymentMethodLabel(sale.paymentMethod)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500">
                            {formatIndonesianDate(sale.date)}
                          </span>
                          {onSelectReceipt && (
                            <button
                              type="button"
                              onClick={() => onSelectReceipt(sale.id)}
                              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer"
                            >
                              Lihat Struk
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Items */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs text-slate-600">
                        {sale.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center py-0.5">
                            <span className="line-clamp-1">
                              {item.quantity}x {item.productName}
                            </span>
                            <span className="font-medium text-slate-800 ml-2">
                              {formatRupiah(item.subtotal)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Summary */}
                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <div className="flex items-center gap-3 text-[11px] text-slate-500">
                          {sale.pointsEarned ? (
                            <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                              <Award className="w-3 h-3" />
                              +{sale.pointsEarned} Poin
                            </span>
                          ) : null}
                          {sale.pointsRedeemed ? (
                            <span className="text-amber-700 font-semibold">
                              Hemat {formatRupiah(sale.pointsDiscount || 0)} ({sale.pointsRedeemed} Poin)
                            </span>
                          ) : null}
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-slate-500 mr-1">Total:</span>
                          <span className="font-black text-slate-900 text-sm">
                            {formatRupiah(sale.totalAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { useStore } from '../../context/StoreContext';
import { Customer, CustomerTier } from '../../types';
import {
  formatRupiah,
  formatIndonesianDate,
  getTierBadge,
} from '../../utils/formatters';
import { CustomerModal } from './CustomerModal';
import { CustomerDetailModal } from './CustomerDetailModal';
import {
  User,
  Plus,
  Search,
  Award,
  Phone,
  Mail,
  ShoppingBag,
  TrendingUp,
  Edit2,
  Trash2,
  Eye,
  Crown,
  Sparkles,
  Users,
  Filter,
} from 'lucide-react';

interface CustomersPageProps {
  onSelectReceipt?: (saleId: string) => void;
}

export const CustomersPage: React.FC<CustomersPageProps> = ({ onSelectReceipt }) => {
  const { customers, deleteCustomer, settings } = useStore();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTier, setSelectedTier] = useState<CustomerTier | 'ALL'>('ALL');

  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);

  // Statistics
  const totalPoints = useMemo(
    () => customers.reduce((sum, c) => sum + (c.points || 0), 0),
    [customers]
  );
  const totalCustomerSpent = useMemo(
    () => customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0),
    [customers]
  );
  const vipCount = useMemo(
    () => customers.filter((c) => c.tier === 'Platinum' || c.tier === 'Gold').length,
    [customers]
  );

  // Filtered List
  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) => {
      const matchSearch =
        customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customer.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (customer.email && customer.email.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchTier = selectedTier === 'ALL' || customer.tier === selectedTier;

      return matchSearch && matchTier;
    });
  }, [customers, searchQuery, selectedTier]);

  const handleDelete = (customer: Customer) => {
    if (
      window.confirm(
        `Hapus data pelanggan "${customer.name}"? Poin loyalitas dan riwayat tautan akan direset.`
      )
    ) {
      deleteCustomer(customer.id);
    }
  };

  return (
    <div id="customers-page" className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            Database Pelanggan &amp; Poin Loyalitas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola data member, tier loyalitas, riwayat belanja, dan reward diskon kasir
          </p>
        </div>

        <button
          type="button"
          id="open-add-customer-btn"
          onClick={() => {
            setEditingCustomer(null);
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-200 transition active:scale-95 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Pelanggan Baru</span>
        </button>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Member</p>
            <p className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              {customers.length} <span className="text-xs font-medium text-slate-400">orang</span>
            </p>
          </div>
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Poin Beredar</p>
            <p className="text-xl sm:text-2xl font-black text-amber-500 mt-1">
              {totalPoints.toLocaleString('id-ID')}{' '}
              <span className="text-xs font-medium text-slate-400">Pts</span>
            </p>
          </div>
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
            <Award className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Member VIP (Gold/Plat)</p>
            <p className="text-xl sm:text-2xl font-black text-purple-600 mt-1">
              {vipCount} <span className="text-xs font-medium text-slate-400">member</span>
            </p>
          </div>
          <div className="p-3 rounded-xl bg-purple-50 text-purple-600">
            <Crown className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500">Total Belanja Member</p>
            <p className="text-lg sm:text-xl font-black text-emerald-600 mt-1">
              {formatRupiah(totalCustomerSpent)}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari berdasarkan nama pelanggan, no telepon, atau email..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white transition"
            />
          </div>

          {/* Tier Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1 shrink-0 mr-1">
              <Filter className="w-3.5 h-3.5" />
              Tier:
            </span>
            {(['ALL', 'Bronze', 'Silver', 'Gold', 'Platinum'] as const).map((tier) => (
              <button
                key={tier}
                type="button"
                onClick={() => setSelectedTier(tier)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  selectedTier === tier
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tier === 'ALL' ? 'Semua Tier' : tier}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Customer Table / Card List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900">
            Daftar Pelanggan ({filteredCustomers.length})
          </h3>
          <span className="text-xs text-slate-500">
            1 Poin didapat per belanja {formatRupiah(settings.pointsRewardRatio || 10000)}
          </span>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-3">
            <User className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700">Tidak ada pelanggan ditemukan</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              {searchQuery
                ? `Tidak ada hasil pencarian yang cocok dengan "${searchQuery}". Coba kata kunci lain.`
                : 'Mulai daftarkan pelanggan baru untuk mengumpulkan poin loyalitas dan mencatat riwayat transaksi.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                  <th className="py-3 px-4">Pelanggan</th>
                  <th className="py-3 px-4">Kontak &amp; Alamat</th>
                  <th className="py-3 px-4 text-center">Tier Member</th>
                  <th className="py-3 px-4 text-right">Saldo Poin</th>
                  <th className="py-3 px-4 text-right">Total Belanja</th>
                  <th className="py-3 px-4 text-center">Order</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((cust) => {
                  const badge = getTierBadge(cust.tier);
                  return (
                    <tr
                      key={cust.id}
                      className="hover:bg-indigo-50/30 transition group"
                    >
                      {/* Name & ID */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
                            {cust.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition">
                              {cust.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">{cust.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3 px-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{cust.phone}</span>
                          </div>
                          {cust.email && (
                            <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                              <Mail className="w-3 h-3 text-slate-400" />
                              <span>{cust.email}</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Tier Badge */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          {cust.tier}
                        </span>
                      </td>

                      {/* Points */}
                      <td className="py-3 px-4 text-right">
                        <span className="font-black text-amber-600 text-sm flex items-center justify-end gap-1">
                          <Award className="w-4 h-4 text-amber-500 inline" />
                          {cust.points}{' '}
                          <span className="text-[10px] font-normal text-slate-500">Pts</span>
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          ≈ {formatRupiah(cust.points * (settings.pointsRedeemValue || 100))}
                        </span>
                      </td>

                      {/* Total Spent */}
                      <td className="py-3 px-4 text-right font-bold text-slate-900">
                        {formatRupiah(cust.totalSpent)}
                      </td>

                      {/* Total Orders */}
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px]">
                          {cust.totalOrders}x
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setDetailCustomer(cust)}
                            className="p-1.5 rounded-lg border border-slate-200 text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                            title="Lihat Profil & Riwayat Transaksi"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCustomer(cust);
                              setIsAddModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                            title="Edit Data Pelanggan"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(cust)}
                            className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Hapus Pelanggan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      <CustomerModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingCustomer(null);
        }}
        customerToEdit={editingCustomer}
      />

      <CustomerDetailModal
        customer={detailCustomer}
        isOpen={!!detailCustomer}
        onClose={() => setDetailCustomer(null)}
        onSelectReceipt={onSelectReceipt}
      />
    </div>
  );
};

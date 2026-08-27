import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { User, UserRole } from '../../types';
import {
  X,
  Save,
  RotateCcw,
  Download,
  Upload,
  CheckCircle2,
  Store as StoreIcon,
  CreditCard,
  Printer,
  Users,
  Sliders,
  Database,
  Building2,
  Plus,
  Trash2,
  Edit2,
  Key,
  ShieldCheck,
  Smartphone,
  Check,
  AlertTriangle,
  RefreshCw,
  MessageSquare,
  Send,
  Volume2,
  Bell,
  Radio,
  Banknote,
  QrCode,
  Zap,
} from 'lucide-react';
import { triggerPaymentSuccessNotification } from '../../utils/soundNotifications';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const {
    settings,
    setSettings,
    activeCashier,
    setActiveCashier,
    resetToDefault,
    exportDatabaseJSON,
    importDatabaseJSON,
    users,
    addUser,
    updateUser,
    deleteUser,
    currentUser,
    stores,
    hasRole,
  } = useStore();

  const [activeTab, setActiveTab] = useState<
    'gateway' | 'audio' | 'whatsapp' | 'printer' | 'users' | 'store' | 'general' | 'database'
  >('gateway');

  // Form State initialized with settings
  const [formData, setFormData] = useState({ ...settings });
  const [cashierInput, setCashierInput] = useState(activeCashier);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // Gateway Simulation Test State
  const [testGatewayStatus, setTestGatewayStatus] = useState<{
    provider: string;
    status: 'testing' | 'success' | 'error';
    message: string;
  } | null>(null);

  // Printer Test State
  const [testPrinterSuccess, setTestPrinterSuccess] = useState(false);

  // WhatsApp Test State
  const [testWhatsAppStatus, setTestWhatsAppStatus] = useState<{
    status: 'testing' | 'success' | 'error';
    message: string;
  } | null>(null);

  // User Management State (for Super Admin)
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState<{
    username: string;
    name: string;
    email: string;
    password: string;
    role: UserRole;
    storeId: string;
  }>({
    username: '',
    name: '',
    email: '',
    password: 'user123',
    role: 'kasir',
    storeId: stores[0]?.id || 'store-1',
  });

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSettings(formData);
    setActiveCashier(cashierInput.trim() || 'Kasir 1');
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 800);
  };

  const handleTestGateway = (provider: 'qris' | 'ovo' | 'gopay' | 'bank') => {
    setTestGatewayStatus({
      provider,
      status: 'testing',
      message: `Menguji generator QRIS Dinamis & koneksi gateway ${provider.toUpperCase()}...`,
    });

    setTimeout(() => {
      setTestGatewayStatus({
        provider,
        status: 'success',
        message:
          provider === 'qris'
            ? `QRIS Dinamis DANA Berhasil Divalidasi! (NMID: ${formData.gateways?.qris?.nmid || 'ID1025371471182'}, Terminal: ${formData.gateways?.qris?.terminalCode || 'A01'}, CRC16 Checksum Valid)`
            : `Koneksi API ${provider.toUpperCase()} Berhasil Terhubung (Status: Online 200 OK)`,
      });
      setTimeout(() => setTestGatewayStatus(null), 5000);
    }, 900);
  };

  const handleTestPrint = () => {
    setTestPrinterSuccess(true);
    setTimeout(() => setTestPrinterSuccess(false), 3000);
  };

  const handleExport = () => {
    const json = exportDatabaseJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_pos_database_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const ok = importDatabaseJSON(content);
      if (ok) {
        setImportStatus('Berhasil memuat database dari file backup!');
        setTimeout(() => setImportStatus(null), 3000);
      } else {
        setImportStatus('Gagal: Format file JSON tidak valid.');
        setTimeout(() => setImportStatus(null), 3000);
      }
    };
    reader.readAsText(file);
  };

  const handleResetConfirm = () => {
    if (
      window.confirm(
        'Apakah Anda yakin ingin mengatur ulang data ke data bawaan awal? Semua produk, transaksi, dan pengaturan akan dikembalikan.'
      )
    ) {
      resetToDefault();
      onClose();
    }
  };

  // User Management Handlers
  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormData.username.trim() || !userFormData.name.trim()) return;

    if (editingUser) {
      // Update existing user
      updateUser(editingUser.id, {
        username: userFormData.username.trim().toLowerCase(),
        name: userFormData.name.trim(),
        email: userFormData.email.trim(),
        role: userFormData.role,
        storeId: userFormData.storeId,
        password: userFormData.password || editingUser.password,
      });
    } else {
      // Create new user
      addUser({
        username: userFormData.username.trim().toLowerCase(),
        name: userFormData.name.trim(),
        email: userFormData.email.trim(),
        password: userFormData.password || 'kasir123',
        role: userFormData.role,
        storeId: userFormData.storeId,
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
        active: true,
      });
    }

    setShowAddUserModal(false);
    setEditingUser(null);
    setUserFormData({
      username: '',
      name: '',
      email: '',
      password: 'user123',
      role: 'kasir',
      storeId: stores[0]?.id || 'store-1',
    });
  };

  const handleDeleteUser = (userId: string) => {
    if (userId === currentUser?.id) {
      alert('Anda tidak dapat menghapus akun yang sedang Anda gunakan.');
      return;
    }
    deleteUser(userId);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return { label: 'Super Admin', bg: 'bg-purple-100 text-purple-800' };
      case 'admin':
        return { label: 'Admin Toko', bg: 'bg-indigo-100 text-indigo-800' };
      case 'kasir':
        return { label: 'Kasir', bg: 'bg-emerald-100 text-emerald-800' };
    }
  };

  return (
    <div
      id="settings-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="settings-modal-card"
        className="relative bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-4"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <div>
              <h3 className="font-bold text-sm sm:text-base">Pusat Pengaturan Sistem POS</h3>
              <p className="text-[11px] text-slate-400">Gateway Pembayaran &bull; Printer Struk &bull; Hak Akses &bull; Multi-Toko</p>
            </div>
          </div>
          <button
            id="close-settings-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 pt-2 gap-1 overflow-x-auto text-xs font-bold scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('gateway')}
            className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'gateway'
                ? 'border-indigo-600 text-indigo-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Gateway Pembayaran</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audio')}
            className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'audio'
                ? 'border-sky-600 text-sky-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Suara &amp; Soundbox</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('printer')}
            className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'printer'
                ? 'border-indigo-600 text-indigo-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Koneksi Printer</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('whatsapp')}
            className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'whatsapp'
                ? 'border-emerald-600 text-emerald-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Gateway WhatsApp</span>
          </button>

          {hasRole(['super_admin', 'admin']) && (
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                activeTab === 'users'
                  ? 'border-indigo-600 text-indigo-700 font-black'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Pengguna &amp; Role</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('store')}
            className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'store'
                ? 'border-indigo-600 text-indigo-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <StoreIcon className="w-3.5 h-3.5" />
            <span>Profil Toko</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'general'
                ? 'border-indigo-600 text-indigo-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Pajak &amp; Poin</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('database')}
            className={`pb-2.5 px-3 border-b-2 transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'database'
                ? 'border-indigo-600 text-indigo-700 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Backup Data</span>
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-5 max-h-[72vh] overflow-y-auto">
          {saveSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Pengaturan berhasil disimpan ke sistem!</span>
            </div>
          )}

          {/* TAB 1: Digital Payment Gateway Configuration */}
          {activeTab === 'gateway' && (
            <div className="space-y-5">
              <div className="flex items-center justify-between bg-indigo-50 p-3.5 rounded-2xl border border-indigo-100">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-indigo-600" />
                    Pengaturan &amp; Integrasi Metode Pembayaran
                  </h4>
                  <p className="text-[11px] text-indigo-800">
                    Aktifkan atau nonaktifkan metode pembayaran kasir, serta konfigurasi QRIS Universal &amp; Transfer Bank
                  </p>
                </div>
              </div>

              {testGatewayStatus && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    testGatewayStatus.status === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
                  }`}
                >
                  <RefreshCw
                    className={`w-4 h-4 shrink-0 ${
                      testGatewayStatus.status === 'testing' ? 'animate-spin' : ''
                    }`}
                  />
                  <span>{testGatewayStatus.message}</span>
                </div>
              )}

              {/* Master Toggle: Payment Methods Availability for POS Cashier */}
              <div className="p-4 bg-white rounded-2xl border-2 border-indigo-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-indigo-600" />
                      Aktivasi Metode Pembayaran di Kasir (POS)
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      Metode yang diaktifkan akan langsung muncul sebagai pilihan saat kasir menekan tombol Checkout
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  {/* Cash */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Banknote className="w-4 h-4 text-indigo-600" />
                      <div>
                        <span className="font-bold text-xs text-slate-800 block">Tunai (Cash)</span>
                        <span className="text-[10px] text-slate-400">Pembayaran tunai kasir</span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.enabledPaymentMethods?.cash ?? true}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            enabledPaymentMethods: {
                              ...(formData.enabledPaymentMethods || {
                                cash: true,
                                qris: true,
                                transfer: true,
                                debit: false,
                                gopay: false,
                                ovo: false,
                              }),
                              cash: e.target.checked,
                            },
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {/* QRIS Universal */}
                  <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <QrCode className="w-4 h-4 text-rose-600" />
                      <div>
                        <span className="font-bold text-xs text-slate-800 block">QRIS Universal</span>
                        <span className="text-[10px] text-slate-400">Semua Bank &amp; E-Wallet</span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.enabledPaymentMethods?.qris ?? true}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            enabledPaymentMethods: {
                              ...(formData.enabledPaymentMethods || {
                                cash: true,
                                qris: true,
                                transfer: true,
                                debit: false,
                                gopay: false,
                                ovo: false,
                              }),
                              qris: e.target.checked,
                            },
                            gateways: {
                              ...formData.gateways,
                              qris: {
                                ...(formData.gateways?.qris || {
                                  enabled: true,
                                  merchantName: 'Anugerah Store',
                                  nmid: 'ID1025371471182',
                                  terminalCode: 'A01',
                                  acquirerId: '93600915',
                                  acquirerName: 'DANA (PT Espay Debit Indonesia Koe)',
                                  city: 'JAKARTA',
                                  postalCode: '12340',
                                  mcc: '5411',
                                  dynamicMode: true,
                                }),
                                enabled: e.target.checked,
                              },
                            },
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                    </label>
                  </div>

                  {/* Transfer Bank / VA */}
                  <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-amber-600" />
                      <div>
                        <span className="font-bold text-xs text-slate-800 block">Transfer Bank</span>
                        <span className="text-[10px] text-slate-400">BCA, Mandiri, BRI, BNI</span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.enabledPaymentMethods?.transfer ?? true}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            enabledPaymentMethods: {
                              ...(formData.enabledPaymentMethods || {
                                cash: true,
                                qris: true,
                                transfer: true,
                                debit: false,
                                gopay: false,
                                ovo: false,
                              }),
                              transfer: e.target.checked,
                            },
                            gateways: {
                              ...formData.gateways,
                              bankTransfer: {
                                ...(formData.gateways?.bankTransfer || {
                                  enabled: true,
                                  provider: 'manual',
                                  bcaAccount: '1234567890',
                                  bcaName: 'PT ANUGERAH STORE',
                                  mandiriAccount: '9876543210',
                                  mandiriName: 'PT ANUGERAH STORE',
                                  briAccount: '555544443333',
                                  briName: 'PT ANUGERAH STORE',
                                  bniAccount: '8888777766',
                                  bniName: 'PT ANUGERAH STORE',
                                  autoVerify: true,
                                }),
                                enabled: e.target.checked,
                              },
                            },
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                    </label>
                  </div>

                  {/* Debit / EDC */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-indigo-600" />
                      <div>
                        <span className="font-bold text-xs text-slate-800 block">Kartu Debit / EDC</span>
                        <span className="text-[10px] text-slate-400">Mesin EDC Kartu</span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.enabledPaymentMethods?.debit ?? false}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            enabledPaymentMethods: {
                              ...(formData.enabledPaymentMethods || {
                                cash: true,
                                qris: true,
                                transfer: true,
                                debit: false,
                                gopay: false,
                                ovo: false,
                              }),
                              debit: e.target.checked,
                            },
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  {/* GoPay Direct */}
                  <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-emerald-600" />
                      <div>
                        <span className="font-bold text-xs text-slate-800 block">GoPay Direct</span>
                        <span className="text-[10px] text-slate-400">Integrasi GoPay API</span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.enabledPaymentMethods?.gopay ?? false}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            enabledPaymentMethods: {
                              ...(formData.enabledPaymentMethods || {
                                cash: true,
                                qris: true,
                                transfer: true,
                                debit: false,
                                gopay: false,
                                ovo: false,
                              }),
                              gopay: e.target.checked,
                            },
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {/* OVO Direct */}
                  <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-purple-600" />
                      <div>
                        <span className="font-bold text-xs text-slate-800 block">OVO Push Pay</span>
                        <span className="text-[10px] text-slate-400">Push Tagihan OVO</span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.enabledPaymentMethods?.ovo ?? false}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            enabledPaymentMethods: {
                              ...(formData.enabledPaymentMethods || {
                                cash: true,
                                qris: true,
                                transfer: true,
                                debit: false,
                                gopay: false,
                                ovo: false,
                              }),
                              ovo: e.target.checked,
                            },
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* DANA & QRIS Dinamis Gateway Settings */}
              <div className="p-4 rounded-2xl border border-sky-200 bg-sky-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-gradient-to-tr from-sky-600 to-blue-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                      QR
                    </span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-sky-950">
                          QRIS Dinamis &bull; Acquirer DANA (Espay)
                        </span>
                        <span className="text-[9px] font-black bg-rose-500 text-white px-1.5 py-0.2 rounded-full">
                          ASPI / BI
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Nominal transaksi otomatis tersemat di QR code saat checkout (Anti Salah Ketik)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleTestGateway('qris')}
                      className="px-2.5 py-1 text-[11px] font-bold text-sky-700 bg-sky-100 hover:bg-sky-200 rounded-lg transition cursor-pointer"
                    >
                      Uji Generator QRIS
                    </button>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.gateways?.qris?.enabled ?? true}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            gateways: {
                              ...formData.gateways,
                              qris: {
                                ...(formData.gateways?.qris || {
                                  enabled: true,
                                  merchantName: 'Anugerah Store',
                                  nmid: 'ID1025371471182',
                                  terminalCode: 'A01',
                                  acquirerId: '93600915',
                                  acquirerName: 'DANA (PT Espay Debit Indonesia Koe)',
                                  city: 'JAKARTA',
                                  postalCode: '12340',
                                  mcc: '5411',
                                  dynamicMode: true,
                                  feeType: 'none',
                                  feeValue: 0,
                                }),
                                enabled: e.target.checked,
                              },
                            },
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-sky-600"></div>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nama Merchant QRIS</label>
                    <input
                      type="text"
                      value={formData.gateways?.qris?.merchantName || 'Anugerah Store'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          gateways: {
                            ...formData.gateways,
                            qris: {
                              ...(formData.gateways?.qris || {
                                enabled: true,
                                nmid: 'ID1025371471182',
                                terminalCode: 'A01',
                                acquirerId: '93600915',
                                acquirerName: 'DANA (PT Espay Debit Indonesia Koe)',
                                city: 'JAKARTA',
                                postalCode: '12340',
                                mcc: '5411',
                                dynamicMode: true,
                              }),
                              merchantName: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-sky-500 bg-white font-semibold"
                      placeholder="Anugerah Store"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">NMID (National Merchant ID)</label>
                    <input
                      type="text"
                      value={formData.gateways?.qris?.nmid || 'ID1025371471182'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          gateways: {
                            ...formData.gateways,
                            qris: {
                              ...(formData.gateways?.qris || {
                                enabled: true,
                                merchantName: 'Anugerah Store',
                                terminalCode: 'A01',
                                acquirerId: '93600915',
                                acquirerName: 'DANA (PT Espay Debit Indonesia Koe)',
                                city: 'JAKARTA',
                                postalCode: '12340',
                                mcc: '5411',
                                dynamicMode: true,
                              }),
                              nmid: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-sky-500 bg-white"
                      placeholder="ID1025371471182"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Kode Terminal / Kasir</label>
                    <input
                      type="text"
                      value={formData.gateways?.qris?.terminalCode || 'A01'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          gateways: {
                            ...formData.gateways,
                            qris: {
                              ...(formData.gateways?.qris || {
                                enabled: true,
                                merchantName: 'Anugerah Store',
                                nmid: 'ID1025371471182',
                                acquirerId: '93600915',
                                acquirerName: 'DANA (PT Espay Debit Indonesia Koe)',
                                city: 'JAKARTA',
                                postalCode: '12340',
                                mcc: '5411',
                                dynamicMode: true,
                              }),
                              terminalCode: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-sky-500 bg-white"
                      placeholder="A01"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-sky-100/60 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-600">
                      Acquirer: <strong className="text-sky-950">DANA (93600915 - PT Espay Debit Indonesia Koe)</strong>
                    </span>
                  </div>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={formData.gateways?.qris?.dynamicMode ?? true}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          gateways: {
                            ...formData.gateways,
                            qris: {
                              ...(formData.gateways?.qris || {
                                enabled: true,
                                merchantName: 'Anugerah Store',
                                nmid: 'ID1025371471182',
                                terminalCode: 'A01',
                                acquirerId: '93600915',
                                acquirerName: 'DANA (PT Espay Debit Indonesia Koe)',
                                city: 'JAKARTA',
                                postalCode: '12340',
                                mcc: '5411',
                              }),
                              dynamicMode: e.target.checked,
                            },
                          },
                        })
                      }
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span>Kunci Nominal Otomatis (QRIS Dinamis)</span>
                  </label>
                </div>
              </div>

              {/* OVO Gateway Settings */}
              <div className="p-4 rounded-2xl border border-purple-200 bg-purple-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-purple-600 text-white font-black text-xs flex items-center justify-center">
                      OVO
                    </span>
                    <div>
                      <span className="font-bold text-xs text-purple-950">OVO Merchant Gateway</span>
                      <p className="text-[11px] text-slate-500">API Push Notification ke Nomor HP Pelanggan</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleTestGateway('ovo')}
                      className="px-2.5 py-1 text-[11px] font-bold text-purple-700 bg-purple-100 hover:bg-purple-200 rounded-lg transition cursor-pointer"
                    >
                      Uji Koneksi API
                    </button>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.gateways?.ovo?.enabled ?? true}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            gateways: {
                              ...formData.gateways,
                              ovo: {
                                ...(formData.gateways?.ovo || {
                                  enabled: true,
                                  merchantId: 'OVO-MCH-88291',
                                  appId: 'APP-OVO-POS',
                                  isSandbox: false,
                                }),
                                enabled: e.target.checked,
                              },
                            },
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">OVO Merchant ID</label>
                    <input
                      type="text"
                      value={formData.gateways?.ovo?.merchantId || 'OVO-MCH-88291'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          gateways: {
                            ...formData.gateways,
                            ovo: {
                              ...(formData.gateways?.ovo || {
                                enabled: true,
                                appId: 'APP-OVO-POS',
                                isSandbox: false,
                              }),
                              merchantId: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-purple-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Application ID</label>
                    <input
                      type="text"
                      value={formData.gateways?.ovo?.appId || 'APP-OVO-POS'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          gateways: {
                            ...formData.gateways,
                            ovo: {
                              ...(formData.gateways?.ovo || {
                                enabled: true,
                                merchantId: 'OVO-MCH-88291',
                                isSandbox: false,
                              }),
                              appId: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-purple-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* GoPay Gateway Settings */}
              <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-black text-xs flex items-center justify-center">
                      GP
                    </span>
                    <div>
                      <span className="font-bold text-xs text-emerald-950">GoPay / Midtrans Gateway</span>
                      <p className="text-[11px] text-slate-500">QRIS Dinamis &amp; Callback Webhook Otomatis</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleTestGateway('gopay')}
                      className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition cursor-pointer"
                    >
                      Uji Koneksi API
                    </button>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.gateways?.gopay?.enabled ?? true}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            gateways: {
                              ...formData.gateways,
                              gopay: {
                                ...(formData.gateways?.gopay || {
                                  enabled: true,
                                  merchantId: 'GOPAY-MCH-9921',
                                  clientKey: 'SB-Mid-client-882x1',
                                  isSandbox: false,
                                }),
                                enabled: e.target.checked,
                              },
                            },
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">GoPay Merchant ID</label>
                    <input
                      type="text"
                      value={formData.gateways?.gopay?.merchantId || 'GOPAY-MCH-9921'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          gateways: {
                            ...formData.gateways,
                            gopay: {
                              ...(formData.gateways?.gopay || {
                                enabled: true,
                                clientKey: 'SB-Mid-client-882x1',
                                isSandbox: false,
                              }),
                              merchantId: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Client Key / Public Key</label>
                    <input
                      type="password"
                      value={formData.gateways?.gopay?.clientKey || 'SB-Mid-client-882x1'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          gateways: {
                            ...formData.gateways,
                            gopay: {
                              ...(formData.gateways?.gopay || {
                                enabled: true,
                                merchantId: 'GOPAY-MCH-9921',
                                isSandbox: false,
                              }),
                              clientKey: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Transfer Bank & Virtual Account */}
              <div className="p-4 rounded-2xl border border-blue-200 bg-blue-50/40 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                      VA
                    </span>
                    <div>
                      <span className="font-bold text-xs text-blue-950">Transfer Bank &amp; Virtual Account</span>
                      <p className="text-[11px] text-slate-500">BCA, Mandiri, BRI, BNI Virtual Account</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTestGateway('bank')}
                    className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-lg transition cursor-pointer"
                  >
                    Uji Koneksi VA
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Rekening Kas Toko Utama</label>
                    <input
                      type="text"
                      value={formData.gateways?.bankTransfer?.accountNumber || '8820-1928-3921 (BCA)'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          gateways: {
                            ...formData.gateways,
                            bankTransfer: {
                              ...(formData.gateways?.bankTransfer || {
                                enabled: true,
                                accountHolder: 'PT KASIRPRO RETAIL INDONESIA',
                              }),
                              accountNumber: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 bg-white font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Atas Nama Pemilik Rekening</label>
                    <input
                      type="text"
                      value={formData.gateways?.bankTransfer?.accountHolder || 'PT KASIRPRO RETAIL INDONESIA'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          gateways: {
                            ...formData.gateways,
                            bankTransfer: {
                              ...(formData.gateways?.bankTransfer || {
                                enabled: true,
                                accountNumber: '8820-1928-3921 (BCA)',
                              }),
                              accountHolder: e.target.value,
                            },
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500 bg-white font-semibold"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Suara & Soundbox Notification Settings */}
          {activeTab === 'audio' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-sky-50 p-4 rounded-2xl border border-sky-200">
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-sky-950 flex items-center gap-1.5">
                    <Volume2 className="w-4 h-4 text-sky-600" />
                    Pengaturan Suara Notifikasi &amp; Soundbox Pembayaran
                  </h4>
                  <p className="text-[11px] text-sky-800 leading-relaxed">
                    Memberikan umpan balik suara instan (bel kasir &amp; asisten suara bahasa Indonesia) kepada kasir saat pembayaran QRIS/DANA sukses.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    triggerPaymentSuccessNotification(
                      85000,
                      'DANA',
                      'Budi Santoso',
                      formData.audioNotification || {
                        enabled: true,
                        soundEffect: true,
                        voiceAnnouncer: true,
                        volume: 90,
                      }
                    );
                  }}
                  className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
                >
                  <Bell className="w-3.5 h-3.5 text-amber-300" />
                  <span>Uji Suara Kasir</span>
                </button>
              </div>

              {/* Sound Settings Form */}
              <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200">
                {/* Master Audio Toggle */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Aktifkan Notifikasi Audio Pembayaran</p>
                    <p className="text-[11px] text-slate-500">Bunyikan nada saat transaksi berhasil diselesaikan</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.audioNotification?.enabled ?? true}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        audioNotification: {
                          ...(formData.audioNotification || {
                            enabled: true,
                            soundEffect: true,
                            voiceAnnouncer: true,
                            volume: 90,
                          }),
                          enabled: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 text-sky-600 rounded-sm focus:ring-sky-500 cursor-pointer"
                  />
                </div>

                {/* Sound Chime Toggle */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Efek Nada Bel Kasir (POS Register Chime)</p>
                    <p className="text-[11px] text-slate-500">Nada ganda (C6-E6-G6-C7) yang jernih dan tegas</p>
                  </div>
                  <input
                    type="checkbox"
                    disabled={!(formData.audioNotification?.enabled ?? true)}
                    checked={formData.audioNotification?.soundEffect ?? true}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        audioNotification: {
                          ...(formData.audioNotification || {
                            enabled: true,
                            soundEffect: true,
                            voiceAnnouncer: true,
                            volume: 90,
                          }),
                          soundEffect: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 text-sky-600 rounded-sm focus:ring-sky-500 cursor-pointer disabled:opacity-40"
                  />
                </div>

                {/* Indonesian Voice Announcer */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Asisten Suara Pembayaran Bahasa Indonesia</p>
                    <p className="text-[11px] text-slate-500">
                      Contoh: &quot;Pembayaran DANA sebesar Delapan Puluh Lima Ribu Rupiah berhasil diterima&quot;
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    disabled={!(formData.audioNotification?.enabled ?? true)}
                    checked={formData.audioNotification?.voiceAnnouncer ?? true}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        audioNotification: {
                          ...(formData.audioNotification || {
                            enabled: true,
                            soundEffect: true,
                            voiceAnnouncer: true,
                            volume: 90,
                          }),
                          voiceAnnouncer: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 text-sky-600 rounded-sm focus:ring-sky-500 cursor-pointer disabled:opacity-40"
                  />
                </div>

                {/* Volume Slider */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">Volume Suara Speaker POS</span>
                    <span className="font-mono font-bold text-sky-700">
                      {formData.audioNotification?.volume ?? 90}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    disabled={!(formData.audioNotification?.enabled ?? true)}
                    value={formData.audioNotification?.volume ?? 90}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        audioNotification: {
                          ...(formData.audioNotification || {
                            enabled: true,
                            soundEffect: true,
                            voiceAnnouncer: true,
                            volume: 90,
                          }),
                          volume: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full accent-sky-600 cursor-pointer disabled:opacity-40"
                  />
                </div>

                {/* Auto Webhook Simulation Mode */}
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Simulasi Deteksi Otomatis Webhook DANA</p>
                    <p className="text-[11px] text-slate-500">
                      Otomatis mendeteksi transfer masuk tanpa perlu klik tombol manual
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="4"
                      max="30"
                      value={formData.audioNotification?.autoDetectDelaySeconds ?? 8}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          audioNotification: {
                            ...(formData.audioNotification || {
                              enabled: true,
                              soundEffect: true,
                              voiceAnnouncer: true,
                              volume: 90,
                            }),
                            autoDetectDelaySeconds: Number(e.target.value) || 8,
                          },
                        })
                      }
                      className="w-14 px-2 py-1 text-xs text-center border border-slate-300 rounded-lg font-bold bg-white"
                    />
                    <span className="text-xs text-slate-500">detik</span>
                    <input
                      type="checkbox"
                      checked={formData.audioNotification?.autoDetectSimulation ?? true}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          audioNotification: {
                            ...(formData.audioNotification || {
                              enabled: true,
                              soundEffect: true,
                              voiceAnnouncer: true,
                              volume: 90,
                            }),
                            autoDetectSimulation: e.target.checked,
                          },
                        })
                      }
                      className="w-4 h-4 text-sky-600 rounded-sm focus:ring-sky-500 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Printer Settings */}
          {activeTab === 'printer' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-100 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <Printer className="w-4 h-4 text-indigo-600" />
                    Konfigurasi Printer Struk Thermal
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Atur koneksi hardware printer (Bluetooth, USB, Network ESC/POS)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleTestPrint}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Test Cetak Struk</span>
                </button>
              </div>

              {testPrinterSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Perintah cetak test berhasil dikirim ke printer POS!</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Jenis Koneksi Printer
                  </label>
                  <select
                    value={formData.printer?.type || 'thermal_58'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        printer: {
                          ...(formData.printer || { paperWidth: '58mm', autoPrint: true }),
                          type: e.target.value as 'thermal_58' | 'thermal_80' | 'bluetooth' | 'system',
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="thermal_58">Thermal 58mm (Kecil - Portabel / USB)</option>
                    <option value="thermal_80">Thermal 80mm (Standar Kasir Swalayan)</option>
                    <option value="bluetooth">Bluetooth POS Printer (Mobile Handheld)</option>
                    <option value="system">Printer Sistem OS (Dialog Browser Default)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Lebar Kertas Struk
                  </label>
                  <select
                    value={formData.printer?.paperWidth || '58mm'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        printer: {
                          ...(formData.printer || { type: 'thermal_58', autoPrint: true }),
                          paperWidth: e.target.value as '58mm' | '80mm',
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="58mm">58mm (Karakter Padat / Struk Standar)</option>
                    <option value="80mm">80mm (Karakter Luas / Struk Resto &amp; Swalayan)</option>
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Cetak Otomatis Setelah Pembayaran</p>
                    <p className="text-[11px] text-slate-500">Buka dialog cetak langsung saat checkout selesai</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.printer?.autoPrint ?? true}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        printer: {
                          ...(formData.printer || { type: 'thermal_58', paperWidth: '58mm' }),
                          autoPrint: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 text-indigo-600 rounded-sm focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Cetak Logo Toko pada Header</p>
                    <p className="text-[11px] text-slate-500">Tampilkan logo grafis di bagian atas kertas struk</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.printer?.printLogo ?? true}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        printer: {
                          ...(formData.printer || { type: 'thermal_58', paperWidth: '58mm' }),
                          printLogo: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 text-indigo-600 rounded-sm focus:ring-indigo-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Cetak Kode Barcode / QR Nota</p>
                    <p className="text-[11px] text-slate-500">Memudahkan retur &amp; pencarian transaksi</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.printer?.printBarcode ?? true}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        printer: {
                          ...(formData.printer || { type: 'thermal_58', paperWidth: '58mm' }),
                          printBarcode: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 text-indigo-600 rounded-sm focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pesan Catatan Kaki Struk (Footer)
                </label>
                <input
                  type="text"
                  value={formData.printer?.footerText || formData.receiptFooter}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      receiptFooter: e.target.value,
                      printer: {
                        ...(formData.printer || { type: 'thermal_58', paperWidth: '58mm' }),
                        footerText: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
            </div>
          )}

          {/* TAB: WhatsApp Gateway Integration */}
          {activeTab === 'whatsapp' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-emerald-50 p-3.5 rounded-2xl border border-emerald-100">
                <div>
                  <h4 className="text-xs font-black text-emerald-950 flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    Integrasi WhatsApp Gateway &amp; Struk Digital
                  </h4>
                  <p className="text-[11px] text-emerald-800">
                    Kirim struk belanja otomatis via API WhatsApp (Fonnte, Wablas, Whacenter, atau Web Link)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setTestWhatsAppStatus({
                      status: 'testing',
                      message: 'Menguji koneksi API WhatsApp gateway...',
                    });
                    setTimeout(() => {
                      setTestWhatsAppStatus({
                        status: 'success',
                        message: 'API WhatsApp Siap & Terhubung! Nomor Sender: ' + (formData.whatsapp?.senderNumber || '628xxx (Aktif)'),
                      });
                      setTimeout(() => setTestWhatsAppStatus(null), 4500);
                    }, 900);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Tes API WhatsApp</span>
                </button>
              </div>

              {testWhatsAppStatus && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    testWhatsAppStatus.status === 'success'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : testWhatsAppStatus.status === 'error'
                      ? 'bg-rose-50 border-rose-300 text-rose-800'
                      : 'bg-indigo-50 border-indigo-300 text-indigo-800'
                  }`}
                >
                  {testWhatsAppStatus.status === 'testing' ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                  <span>{testWhatsAppStatus.message}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Penyedia Gateway WhatsApp (Provider)
                  </label>
                  <select
                    value={formData.whatsapp?.provider || 'fonnte'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        whatsapp: {
                          ...(formData.whatsapp || {
                            apiKey: '',
                            senderNumber: '',
                            autoSendOnSuccess: true,
                          }),
                          provider: e.target.value as 'fonnte' | 'wablas' | 'whacenter' | 'custom',
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="fonnte">Fonnte (Indonesia Official API)</option>
                    <option value="wablas">Wablas Gateway</option>
                    <option value="whacenter">WhaCenter API</option>
                    <option value="custom">Custom Webhook / WhatsApp Web Direct</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor Pengirim Toko (Sender / Server Device)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 08123456789 atau 628123456789"
                    value={formData.whatsapp?.senderNumber || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        whatsapp: {
                          ...(formData.whatsapp || {
                            provider: 'fonnte',
                            apiKey: '',
                            autoSendOnSuccess: true,
                          }),
                          senderNumber: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  API Token / Secret Key WhatsApp Gateway
                </label>
                <div className="relative">
                  <Key className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="password"
                    placeholder="Masukkan API Token dari Dashboard Provider Anda (misal: token Fonnte)..."
                    value={formData.whatsapp?.apiKey || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        whatsapp: {
                          ...(formData.whatsapp || {
                            provider: 'fonnte',
                            senderNumber: '',
                            autoSendOnSuccess: true,
                          }),
                          apiKey: e.target.value,
                        },
                      })
                    }
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 bg-white font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  *Jika dikosongkan, sistem secara otomatis menyediakan tautan langsung (WhatsApp Web / App) ke nomor pelanggan.
                </p>
              </div>

              {/* Toggles */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Kirim Otomatis Saat Selesai Bayar</p>
                    <p className="text-[11px] text-slate-500">
                      Langsung kirim struk ke nomor pelanggan jika nomor terisi di checkout
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.whatsapp?.autoSendOnSuccess ?? true}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        whatsapp: {
                          ...(formData.whatsapp || {
                            provider: 'fonnte',
                            apiKey: '',
                            senderNumber: '',
                          }),
                          autoSendOnSuccess: e.target.checked,
                        },
                      })
                    }
                    className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Pesan Pembuka / Penutup Khusus Struk WA
                </label>
                <textarea
                  rows={2}
                  placeholder="Terima kasih telah berbelanja! Simpan struk digital ini sebagai bukti garansi & pembelian resmi."
                  value={formData.whatsapp?.receiptMessageTemplate || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      whatsapp: {
                        ...(formData.whatsapp || {
                          provider: 'fonnte',
                          apiKey: '',
                          senderNumber: '',
                          autoSendOnSuccess: true,
                        }),
                        receiptMessageTemplate: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-emerald-500 bg-white resize-none"
                />
              </div>
            </div>
          )}

          {/* TAB 3: User & Role Management */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-purple-50 p-3.5 rounded-2xl border border-purple-100">
                <div>
                  <h4 className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    Manajemen Pengguna &amp; Hak Akses (RBAC)
                  </h4>
                  <p className="text-[11px] text-purple-800">
                    Role terdiri dari Super Admin, Admin Toko, dan Kasir POS
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingUser(null);
                    setUserFormData({
                      username: '',
                      name: '',
                      email: '',
                      password: 'user123',
                      role: 'kasir',
                      storeId: stores[0]?.id || 'store-1',
                    });
                    setShowAddUserModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Pengguna</span>
                </button>
              </div>

              {/* User List Table */}
              <div className="space-y-2">
                {users.map((u) => {
                  const badge = getRoleBadge(u.role);
                  const storeName = stores.find((s) => s.id === u.storeId)?.name || 'Semua Cabang';
                  const isCurrent = currentUser?.id === u.id;

                  return (
                    <div
                      key={u.id}
                      className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center justify-between gap-3 hover:border-slate-300 transition"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                          alt={u.name}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-slate-900">{u.name}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${badge.bg}`}>
                              {badge.label}
                            </span>
                            {isCurrent && (
                              <span className="text-[10px] bg-slate-900 text-white px-1.5 py-0.2 rounded-md font-semibold">
                                Akun Anda
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">
                            <span className="font-mono font-semibold">@{u.username}</span> &bull; {u.email} &bull;{' '}
                            <span className="text-indigo-600 font-semibold">{storeName}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingUser(u);
                            setUserFormData({
                              username: u.username,
                              name: u.name,
                              email: u.email,
                              password: u.password || 'admin123',
                              role: u.role,
                              storeId: u.storeId || stores[0]?.id || 'store-1',
                            });
                            setShowAddUserModal(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition cursor-pointer"
                          title="Edit Pengguna"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {!isCurrent && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                            title="Hapus Pengguna"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Quick Add/Edit User Sub-Form */}
              {showAddUserModal && (
                <div className="p-4 bg-slate-50 rounded-2xl border-2 border-purple-200 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <h5 className="text-xs font-bold text-slate-900">
                      {editingUser ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}
                    </h5>
                    <button
                      type="button"
                      onClick={() => setShowAddUserModal(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Nama Lengkap *</label>
                      <input
                        type="text"
                        required
                        value={userFormData.name}
                        onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                        placeholder="Contoh: Rina Kusuma"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Username Login *</label>
                      <input
                        type="text"
                        required
                        value={userFormData.username}
                        onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                        placeholder="rina"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono focus:ring-2 focus:ring-purple-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={userFormData.email}
                        onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                        placeholder="rina@toko.com"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Kata Sandi</label>
                      <input
                        type="password"
                        value={userFormData.password}
                        onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                        placeholder="Kata sandi..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:ring-2 focus:ring-purple-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Peran / Role *</label>
                      <select
                        value={userFormData.role}
                        onChange={(e) =>
                          setUserFormData({ ...userFormData, role: e.target.value as UserRole })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold focus:ring-2 focus:ring-purple-500 bg-white"
                      >
                        <option value="kasir">Kasir (Hanya POS &amp; Transaksi)</option>
                        <option value="admin">Admin Toko (Kelola Produk &amp; Stok Toko)</option>
                        <option value="super_admin">Super Admin (Akses Penuh Semua Cabang)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Penempatan Cabang *</label>
                      <select
                        value={userFormData.storeId}
                        onChange={(e) => setUserFormData({ ...userFormData, storeId: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-purple-500 bg-white"
                      >
                        {stores.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddUserModal(false)}
                      className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveUser}
                      className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg shadow-xs"
                    >
                      {editingUser ? 'Perbarui User' : 'Simpan User'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Store Profile */}
          {activeTab === 'store' && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Profil &amp; Identitas Toko
              </h4>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Toko Utama</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-indigo-500 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Slogan / Tagline</label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nomor Telepon Toko</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kasir Aktif Shift</label>
                  <input
                    type="text"
                    value={cashierInput}
                    onChange={(e) => setCashierInput(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 bg-white font-semibold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Toko</label>
                <textarea
                  rows={2}
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 bg-white"
                />
              </div>
            </div>
          )}

          {/* TAB 5: General & Loyalty Points */}
          {activeTab === 'general' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">Aktifkan Pajak (PPN)</p>
                  <p className="text-[11px] text-slate-500">Hitung pajak otomatis pada total transaksi</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.taxRate}
                    onChange={(e) =>
                      setFormData({ ...formData, taxRate: Number(e.target.value) || 0 })
                    }
                    className="w-14 px-2 py-1 text-xs text-center border border-slate-300 rounded-lg font-bold bg-white"
                    disabled={!formData.enableTax}
                  />
                  <span className="text-xs font-semibold text-slate-500">%</span>
                  <input
                    type="checkbox"
                    checked={formData.enableTax}
                    onChange={(e) => setFormData({ ...formData, enableTax: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded-sm focus:ring-indigo-500 ml-2"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800">Rasio Poin Loyalitas Pelanggan</p>
                  <p className="text-[11px] text-slate-500">1 Poin didapatkan untuk setiap kelipatan belanja</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Rp</span>
                  <input
                    type="number"
                    min="1000"
                    step="1000"
                    value={formData.loyaltyPointsPerRupiah || 10000}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        loyaltyPointsPerRupiah: Number(e.target.value) || 10000,
                      })
                    }
                    className="w-24 px-2 py-1 text-xs font-bold text-center border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: Database & Backup */}
          {activeTab === 'database' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900">
                  <span className="font-bold block mb-0.5">Cadangkan Data Rutin</span>
                  Simpan cadangan database JSON secara berkala untuk menjaga seluruh riwayat transaksi, katalog produk, data member pelanggan, dan konfigurasi multi-toko Anda.
                </div>
              </div>

              {importStatus && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                    importStatus.startsWith('Berhasil')
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-800'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{importStatus}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  id="export-db-btn"
                  onClick={handleExport}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Download className="w-4 h-4 text-indigo-600" />
                  <span>Download Backup JSON</span>
                </button>

                <label
                  id="import-db-label"
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold cursor-pointer transition shadow-xs"
                >
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>Pulihkan dari File Backup</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <button
                  type="button"
                  id="reset-db-btn"
                  onClick={handleResetConfirm}
                  className="text-xs text-rose-600 hover:text-rose-700 font-bold inline-flex items-center gap-1.5 cursor-pointer hover:underline"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset ke Data Bawaan Toko</span>
                </button>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="submit"
              id="save-settings-btn"
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

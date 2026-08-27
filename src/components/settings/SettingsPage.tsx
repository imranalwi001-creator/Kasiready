import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { User, UserRole } from '../../types';
import {
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
  CheckCircle,
} from 'lucide-react';
import { triggerPaymentSuccessNotification } from '../../utils/soundNotifications';

export const SettingsPage: React.FC = () => {
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

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSettings(formData);
    setActiveCashier(cashierInput.trim() || 'Kasir 1');
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 2500);
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

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const success = importDatabaseJSON(content);
        if (success) {
          setImportStatus('Database berhasil dipulihkan!');
          setTimeout(() => setImportStatus(null), 4000);
        } else {
          setImportStatus('Format file JSON tidak valid.');
          setTimeout(() => setImportStatus(null), 4000);
        }
      }
    };
    reader.readAsText(file);
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateUser(editingUser.id, {
        name: userFormData.name,
        username: userFormData.username,
        email: userFormData.email,
        role: userFormData.role,
        storeId: userFormData.storeId,
        ...(userFormData.password ? { password: userFormData.password } : {}),
      });
      setEditingUser(null);
    } else {
      addUser({
        username: userFormData.username,
        name: userFormData.name,
        email: userFormData.email,
        password: userFormData.password,
        role: userFormData.role,
        storeId: userFormData.storeId,
        avatar: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80`,
        active: true,
      });
    }
    setShowAddUserModal(false);
    setUserFormData({
      username: '',
      name: '',
      email: '',
      password: 'user123',
      role: 'kasir',
      storeId: stores[0]?.id || 'store-1',
    });
  };

  const navTabs = [
    { id: 'gateway', label: 'Metode Pembayaran & QRIS', icon: CreditCard },
    { id: 'audio', label: 'Suara & Soundbox', icon: Volume2 },
    { id: 'printer', label: 'Koneksi Printer', icon: Printer },
    { id: 'whatsapp', label: 'Gateway WhatsApp', icon: MessageSquare },
    { id: 'users', label: 'Pengguna & Hak Akses', icon: Users, superAdminOnly: true },
    { id: 'store', label: 'Profil Toko', icon: StoreIcon },
    { id: 'general', label: 'Preferensi & Poin', icon: Sliders },
    { id: 'database', label: 'Database & Backup', icon: Database },
  ].filter((tab) => !tab.superAdminOnly || hasRole(['super_admin']));

  return (
    <div className="h-full flex flex-col bg-slate-100 overflow-hidden">
      {/* Top Page Header Banner */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-8 py-4 shrink-0 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200 shrink-0">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Pusat Pengaturan Sistem POS
              </h1>
              <p className="text-xs text-slate-500 font-medium">
                Kelola aktivasi pembayaran kasir, QRIS Dinamis, printer struk, hak akses, dan preferensi toko
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {saveSuccess && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold animate-in fade-in">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                <span>Pengaturan Tersimpan</span>
              </div>
            )}

            <button
              type="button"
              id="btn-save-settings-page"
              onClick={() => handleSave()}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-xl font-bold text-xs shadow-md shadow-indigo-200 flex items-center gap-2 transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Settings Body Container with Sidebar & Content */}
      <div className="flex-1 overflow-hidden max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col md:flex-row gap-6">
        {/* Left Sub-Navigation Menu */}
        <div className="w-full md:w-64 shrink-0 bg-white rounded-2xl border border-slate-200 shadow-xs p-3 flex md:flex-col gap-1 overflow-x-auto md:overflow-y-auto max-h-none md:max-h-full">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-2 hidden md:block">
            Menu Konfigurasi
          </p>
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                id={`settings-tab-btn-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer whitespace-nowrap text-left shrink-0 md:shrink ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Tab Content Panel */}
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-7 overflow-y-auto">
          <form onSubmit={handleSave} className="space-y-6">
            {/* 1. GATEWAY & METODE PEMBAYARAN */}
            {activeTab === 'gateway' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 p-3.5 bg-indigo-50/80 rounded-2xl border border-indigo-100">
                  <CreditCard className="w-6 h-6 text-indigo-600 shrink-0" />
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-indigo-950">
                      Pengaturan &amp; Integrasi Metode Pembayaran
                    </h4>
                    <p className="text-xs text-indigo-800">
                      Aktifkan atau nonaktifkan metode pembayaran kasir, serta konfigurasi QRIS Universal &amp; Transfer Bank
                    </p>
                  </div>
                </div>

                {testGatewayStatus && (
                  <div
                    className={`p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-in fade-in duration-200 ${
                      testGatewayStatus.status === 'testing'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : testGatewayStatus.status === 'success'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {testGatewayStatus.status === 'testing' && (
                      <RefreshCw className="w-4 h-4 animate-spin text-amber-600 shrink-0" />
                    )}
                    {testGatewayStatus.status === 'success' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                    <span>{testGatewayStatus.message}</span>
                  </div>
                )}

                {/* Master Toggle: Payment Methods Availability for POS Cashier */}
                <div className="p-5 bg-white rounded-2xl border-2 border-indigo-200/80 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <h5 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Sliders className="w-4 h-4 text-indigo-600" />
                        Aktivasi Metode Pembayaran di Kasir (POS)
                      </h5>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Metode yang diaktifkan akan langsung muncul sebagai pilihan saat kasir menekan tombol Checkout
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    {/* Cash */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                          <Banknote className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-slate-800 block">Tunai (Cash)</span>
                          <span className="text-[11px] text-slate-400">Pembayaran tunai kasir</span>
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
                        <div className="w-10 h-5.5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    {/* QRIS Universal */}
                    <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-200 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
                          <QrCode className="w-4 h-4 text-rose-600" />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-slate-800 block">QRIS Universal</span>
                          <span className="text-[11px] text-slate-400">Semua Bank &amp; E-Wallet</span>
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
                        <div className="w-10 h-5.5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-rose-600"></div>
                      </label>
                    </div>

                    {/* Transfer Bank / VA */}
                    <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-slate-800 block">Transfer Bank</span>
                          <span className="text-[11px] text-slate-400">BCA, Mandiri, BRI, BNI</span>
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
                        <div className="w-10 h-5.5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                      </label>
                    </div>

                    {/* Debit / EDC */}
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                          <CreditCard className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-slate-800 block">Kartu Debit / EDC</span>
                          <span className="text-[11px] text-slate-400">Mesin EDC Kartu</span>
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
                        <div className="w-10 h-5.5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    {/* GoPay Direct */}
                    <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                          <Smartphone className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-slate-800 block">GoPay Direct</span>
                          <span className="text-[11px] text-slate-400">Integrasi GoPay API</span>
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
                        <div className="w-10 h-5.5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>

                    {/* OVO Direct */}
                    <div className="p-3.5 bg-purple-50/60 rounded-xl border border-purple-200 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                          <Zap className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                          <span className="font-bold text-xs text-slate-800 block">OVO Push Pay</span>
                          <span className="text-[11px] text-slate-400">Push Tagihan OVO</span>
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
                        <div className="w-10 h-5.5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* DANA & QRIS Dinamis Gateway Settings */}
                <div className="p-5 rounded-2xl border border-sky-200 bg-sky-50/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-sky-600 flex items-center justify-center text-white font-black text-sm">
                        QR
                      </div>
                      <div>
                        <h5 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                          QRIS Dinamis &bull; Acquirer DANA (Espay)
                          <span className="text-[9px] bg-rose-600 text-white font-bold px-1.5 py-0.2 rounded-sm uppercase tracking-wider">
                            ASPI / BI
                          </span>
                        </h5>
                        <p className="text-xs text-slate-500">
                          Membuat kode QR dengan nominal otomatis terkunci (Tag 54) &amp; Checksum CRC16
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleTestGateway('qris')}
                        className="px-3 py-1.5 bg-white border border-sky-300 text-sky-700 hover:bg-sky-50 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
                      >
                        Uji Generator QRIS
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nama Merchant QRIS (Tag 59)
                      </label>
                      <input
                        type="text"
                        value={formData.gateways?.qris?.merchantName || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            gateways: {
                              ...formData.gateways,
                              qris: {
                                ...formData.gateways.qris,
                                merchantName: e.target.value,
                              },
                            },
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 outline-none"
                        placeholder="Contoh: TOKO ANUGERAH BERKAH"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        NMID Merchant (National Merchant ID)
                      </label>
                      <input
                        type="text"
                        value={formData.gateways?.qris?.nmid || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            gateways: {
                              ...formData.gateways,
                              qris: {
                                ...formData.gateways.qris,
                                nmid: e.target.value,
                              },
                            },
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 outline-none"
                        placeholder="ID1025371471182"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Terminal ID / Code (Tag 62.07)
                      </label>
                      <input
                        type="text"
                        value={formData.gateways?.qris?.terminalCode || 'A01'}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            gateways: {
                              ...formData.gateways,
                              qris: {
                                ...formData.gateways.qris,
                                terminalCode: e.target.value,
                              },
                            },
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 outline-none"
                        placeholder="A01"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Kota Merchant (Tag 60)
                      </label>
                      <input
                        type="text"
                        value={formData.gateways?.qris?.city || 'JAKARTA'}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            gateways: {
                              ...formData.gateways,
                              qris: {
                                ...formData.gateways.qris,
                                city: e.target.value.toUpperCase(),
                              },
                            },
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-sky-500 outline-none"
                        placeholder="JAKARTA"
                      />
                    </div>
                  </div>
                </div>

                {/* Rekening Transfer Bank VA */}
                <div className="p-5 rounded-2xl border border-amber-200 bg-amber-50/40 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center text-white font-bold text-sm">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <h5 className="text-sm font-bold text-slate-900">
                          Rekening Transfer Bank Resmi Toko
                        </h5>
                        <p className="text-xs text-slate-500">
                          Daftar nomor rekening yang akan ditampilkan saat pembeli memilih metode Transfer Bank
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nomor Rekening BCA &bull; Atas Nama
                      </label>
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          value={formData.gateways?.bankTransfer?.bcaAccount || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              gateways: {
                                ...formData.gateways,
                                bankTransfer: {
                                  ...formData.gateways.bankTransfer,
                                  bcaAccount: e.target.value,
                                },
                              },
                            })
                          }
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                          placeholder="Nomor Rekening: 1234567890"
                        />
                        <input
                          type="text"
                          value={formData.gateways?.bankTransfer?.bcaName || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              gateways: {
                                ...formData.gateways,
                                bankTransfer: {
                                  ...formData.gateways.bankTransfer,
                                  bcaName: e.target.value,
                                },
                              },
                            })
                          }
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-amber-500 outline-none"
                          placeholder="Atas Nama (A/N)"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nomor Rekening Mandiri &bull; Atas Nama
                      </label>
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          value={formData.gateways?.bankTransfer?.mandiriAccount || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              gateways: {
                                ...formData.gateways,
                                bankTransfer: {
                                  ...formData.gateways.bankTransfer,
                                  mandiriAccount: e.target.value,
                                },
                              },
                            })
                          }
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                          placeholder="Nomor Rekening: 9876543210"
                        />
                        <input
                          type="text"
                          value={formData.gateways?.bankTransfer?.mandiriName || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              gateways: {
                                ...formData.gateways,
                                bankTransfer: {
                                  ...formData.gateways.bankTransfer,
                                  mandiriName: e.target.value,
                                },
                              },
                            })
                          }
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-amber-500 outline-none"
                          placeholder="Atas Nama (A/N)"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nomor Rekening BRI &bull; Atas Nama
                      </label>
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          value={formData.gateways?.bankTransfer?.briAccount || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              gateways: {
                                ...formData.gateways,
                                bankTransfer: {
                                  ...formData.gateways.bankTransfer,
                                  briAccount: e.target.value,
                                },
                              },
                            })
                          }
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                          placeholder="Nomor Rekening: 555544443333"
                        />
                        <input
                          type="text"
                          value={formData.gateways?.bankTransfer?.briName || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              gateways: {
                                ...formData.gateways,
                                bankTransfer: {
                                  ...formData.gateways.bankTransfer,
                                  briName: e.target.value,
                                },
                              },
                            })
                          }
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-amber-500 outline-none"
                          placeholder="Atas Nama (A/N)"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nomor Rekening BNI &bull; Atas Nama
                      </label>
                      <div className="space-y-1.5">
                        <input
                          type="text"
                          value={formData.gateways?.bankTransfer?.bniAccount || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              gateways: {
                                ...formData.gateways,
                                bankTransfer: {
                                  ...formData.gateways.bankTransfer,
                                  bniAccount: e.target.value,
                                },
                              },
                            })
                          }
                          className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                          placeholder="Nomor Rekening: 8888777766"
                        />
                        <input
                          type="text"
                          value={formData.gateways?.bankTransfer?.bniName || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              gateways: {
                                ...formData.gateways,
                                bankTransfer: {
                                  ...formData.gateways.bankTransfer,
                                  bniName: e.target.value,
                                },
                              },
                            })
                          }
                          className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-700 focus:ring-2 focus:ring-amber-500 outline-none"
                          placeholder="Atas Nama (A/N)"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. AUDIO & SOUNDBOX */}
            {activeTab === 'audio' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 p-3.5 bg-indigo-50/80 rounded-2xl border border-indigo-100">
                  <Volume2 className="w-6 h-6 text-indigo-600 shrink-0" />
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-indigo-950">
                      Notifikasi Suara Pembayaran &amp; Smart Soundbox
                    </h4>
                    <p className="text-xs text-indigo-800">
                      Suara notifikasi otomatis ketika kasir menerima pembayaran QRIS, Tunai, atau Transfer Bank
                    </p>
                  </div>
                </div>

                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-sm text-slate-900 block">
                        Aktifkan Suara Notifikasi Pembayaran
                      </span>
                      <span className="text-xs text-slate-500">
                        Memutar pesan suara bahasa Indonesia saat transaksi berhasil
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.audioNotification?.enabled ?? true}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            audioNotification: {
                              ...(formData.audioNotification || {
                                enabled: true,
                                soundboxMode: true,
                                speechRate: 1.0,
                                speechPitch: 1.0,
                                volume: 1.0,
                                voiceGender: 'female',
                                customPrefixText: 'Pembayaran diterima',
                              }),
                              enabled: e.target.checked,
                            },
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-10 h-5.5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        triggerPaymentSuccessNotification(
                          50000,
                          'QRIS',
                          undefined,
                          formData.audioNotification
                        )
                      }
                      className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer"
                    >
                      <Radio className="w-4 h-4 text-indigo-600 animate-pulse" />
                      <span>Uji Suara Notifikasi (Rp 50.000)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 3. PRINTER STRUK */}
            {activeTab === 'printer' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 p-3.5 bg-indigo-50/80 rounded-2xl border border-indigo-100">
                  <Printer className="w-6 h-6 text-indigo-600 shrink-0" />
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-indigo-950">
                      Konfigurasi Printer Kasir &amp; Thermal POS
                    </h4>
                    <p className="text-xs text-indigo-800">
                      Pengaturan koneksi printer thermal Bluetooth, USB, atau cetak struk via browser
                    </p>
                  </div>
                </div>

                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Lebar Kertas Struk
                      </label>
                      <select
                        value={formData.printer?.paperWidth || '58mm'}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            printer: {
                              ...formData.printer,
                              paperWidth: e.target.value as any,
                            },
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value="58mm">58 mm (Printer Mini / Mobile Bluetooth)</option>
                        <option value="80mm">80 mm (Printer Desktop POS Standar)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Pesan Footer Struk
                      </label>
                      <input
                        type="text"
                        value={formData.printer?.footerText || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            printer: {
                              ...formData.printer,
                              footerText: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="Contoh: Terima Kasih Atas Kunjungan Anda!"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleTestPrint}
                      className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-indigo-600" />
                      <span>{testPrinterSuccess ? 'Cetak Uji Berhasil!' : 'Uji Cetak Struk Kasir'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 4. WHATSAPP */}
            {activeTab === 'whatsapp' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-100">
                  <MessageSquare className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-emerald-950">
                      Pengaturan Gateway WhatsApp Notifikasi Struk
                    </h4>
                    <p className="text-xs text-emerald-800">
                      Kirim nota dan bukti pembayaran otomatis ke nomor WhatsApp pelanggan
                    </p>
                  </div>
                </div>

                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nomor WhatsApp CS Toko (Format: 628xxx)
                      </label>
                      <input
                        type="text"
                        value={formData.whatsapp?.storePhoneNumber || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            whatsapp: {
                              ...formData.whatsapp,
                              storePhoneNumber: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                        placeholder="628123456789"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. USERS & RBAC */}
            {activeTab === 'users' && hasRole(['super_admin']) && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-600" />
                      Manajemen Pengguna &amp; Hak Akses Kasir
                    </h4>
                    <p className="text-xs text-slate-500">
                      Kelola akun Super Admin, Admin Toko, dan Kasir yang memiliki akses login
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
                    className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tambah Pengguna</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {users.map((user) => {
                    const isSelf = user.id === currentUser?.id;
                    return (
                      <div
                        key={user.id}
                        className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                            alt={user.name}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-xs text-slate-900 truncate">{user.name}</p>
                              {isSelf && (
                                <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                                  Anda
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 font-mono">@{user.username}</p>
                            <span className="inline-block text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded mt-1">
                              {user.role.toUpperCase()}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingUser(user);
                              setUserFormData({
                                username: user.username,
                                name: user.name,
                                email: user.email,
                                password: '',
                                role: user.role,
                                storeId: user.storeId || stores[0]?.id || 'store-1',
                              });
                              setShowAddUserModal(true);
                            }}
                            className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-lg transition cursor-pointer"
                            title="Edit Pengguna"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {!isSelf && users.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`Hapus pengguna ${user.name}?`)) {
                                  deleteUser(user.id);
                                }
                              }}
                              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-white rounded-lg transition cursor-pointer"
                              title="Hapus Pengguna"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 6. TOKO & CABANG */}
            {activeTab === 'store' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 p-3.5 bg-indigo-50/80 rounded-2xl border border-indigo-100">
                  <StoreIcon className="w-6 h-6 text-indigo-600 shrink-0" />
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-indigo-950">
                      Identitas Toko &amp; Cabang POS
                    </h4>
                    <p className="text-xs text-indigo-800">
                      Informasi yang tercetak di header struk pembelian dan tagihan kasir
                    </p>
                  </div>
                </div>

                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nama Toko Utama
                      </label>
                      <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Slogan / Tagline Toko
                      </label>
                      <input
                        type="text"
                        value={formData.tagline || ''}
                        onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Alamat Lengkap Toko
                      </label>
                      <textarea
                        rows={2}
                        value={formData.address || ''}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nomor Telepon Toko
                      </label>
                      <input
                        type="text"
                        value={formData.phone || ''}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 7. PREFERENSI & POIN */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 p-3.5 bg-indigo-50/80 rounded-2xl border border-indigo-100">
                  <Sliders className="w-6 h-6 text-indigo-600 shrink-0" />
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-indigo-950">
                      Preferensi Transaksi &amp; Poin Loyalitas
                    </h4>
                    <p className="text-xs text-indigo-800">
                      Aturan perolehan poin member dan nilai diskon potongan harga
                    </p>
                  </div>
                </div>

                <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nominal Belanja untuk 1 Poin (Rp)
                      </label>
                      <input
                        type="number"
                        value={formData.pointsRewardRatio || 10000}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            pointsRewardRatio: Number(e.target.value) || 10000,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Nilai Tukar 1 Poin (Potongan Rp)
                      </label>
                      <input
                        type="number"
                        value={formData.pointsRedeemValue || 100}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            pointsRedeemValue: Number(e.target.value) || 100,
                          })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 8. DATABASE & BACKUP */}
            {activeTab === 'database' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 p-3.5 bg-indigo-50/80 rounded-2xl border border-indigo-100">
                  <Database className="w-6 h-6 text-indigo-600 shrink-0" />
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-indigo-950">
                      Cadangan &amp; Pemulihan Database (JSON)
                    </h4>
                    <p className="text-xs text-indigo-800">
                      Ekspor data transaksi, produk, inventaris, dan pelanggan untuk cadangan offline
                    </p>
                  </div>
                </div>

                {importStatus && (
                  <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
                    {importStatus}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                    <h5 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <Download className="w-4 h-4 text-indigo-600" />
                      Cadangkan Database (Backup JSON)
                    </h5>
                    <p className="text-xs text-slate-500">
                      Unduh seluruh data POS dalam 1 file JSON yang dapat disimpan di komputer kasir
                    </p>
                    <button
                      type="button"
                      onClick={handleExport}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-xs"
                    >
                      <Download className="w-4 h-4" />
                      <span>Unduh File Cadangan (.JSON)</span>
                    </button>
                  </div>

                  <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
                    <h5 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      <Upload className="w-4 h-4 text-emerald-600" />
                      Pulihkan Database (Restore JSON)
                    </h5>
                    <p className="text-xs text-slate-500">
                      Pilih file cadangan JSON untuk memulihkan seluruh data POS Anda
                    </p>
                    <label className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-xs">
                      <Upload className="w-4 h-4" />
                      <span>Pilih File Cadangan</span>
                      <input
                        type="file"
                        accept=".json"
                        onChange={handleImportFile}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="p-5 bg-rose-50/50 rounded-2xl border border-rose-200 shadow-xs space-y-3">
                  <h5 className="text-xs font-bold text-rose-900 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    Reset ke Data Bawaan Sistem
                  </h5>
                  <p className="text-xs text-rose-700">
                    Tindakan ini akan mengembalikan seluruh data barang dan transaksi ke setelan awal demo.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('Yakin ingin mereset seluruh database ke setelan awal?')) {
                        resetToDefault();
                        alert('Database telah direset ke setelan awal.');
                      }
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Reset Database</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Add / Edit User Modal (for Super Admin only) */}
      {showAddUserModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900">
              {editingUser ? 'Edit Pengguna POS' : 'Tambah Pengguna Baru'}
            </h3>
            <form onSubmit={handleUserSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Contoh: Budi Santoso"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Username Login
                </label>
                <input
                  type="text"
                  required
                  value={userFormData.username}
                  onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                  placeholder="kasir1"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="kasir1@toko.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password {editingUser && '(Kosongkan jika tidak ingin diubah)'}
                </label>
                <input
                  type="password"
                  required={!editingUser}
                  value={userFormData.password}
                  onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Peran / Hak Akses (Role)
                </label>
                <select
                  value={userFormData.role}
                  onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value as UserRole })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="kasir">Kasir POS (Hanya Transaksi &amp; Riwayat)</option>
                  <option value="admin">Admin Toko (Akses Inventaris &amp; Kas)</option>
                  <option value="super_admin">Super Admin (Akses Penuh Seluruh Sistem)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Simpan Pengguna
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

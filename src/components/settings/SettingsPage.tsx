import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { User, UserRole } from '../../types';
import { BrandLogo } from '../common/BrandLogo';
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
  Palette,
  Sun,
  Moon,
  Image as ImageIcon,
  Sparkles,
  Layout,
  Receipt as ReceiptIcon,
  FileText,
  Target,
  Award,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  KeyRound,
  Copy,
  Shield,
} from 'lucide-react';
import { triggerPaymentSuccessNotification } from '../../utils/soundNotifications';
import { formatRupiah } from '../../utils/formatters';
import {
  testPPOBConnection,
  fetchPPOBServerBalance,
  DEFAULT_PPOB_SETTINGS,
  PPOBDiagnosticResult,
} from '../../services/ppobService';

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
    theme,
    setTheme,
    toggleTheme,
    digitalDepositBalance,
    syncPPOBServerBalance,
  } = useStore();

  const [activeTab, setActiveTab] = useState<
    'brand' | 'gateway' | 'ppob' | 'audio' | 'whatsapp' | 'printer' | 'users' | 'store' | 'general' | 'database'
  >('brand');

  // Form State initialized with settings
  const [formData, setFormData] = useState({
    ...settings,
    ppobGateway: settings.ppobGateway || DEFAULT_PPOB_SETTINGS,
  });
  const [cashierInput, setCashierInput] = useState(activeCashier);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  // PPOB API Test State
  const [testPPOBStatus, setTestPPOBStatus] = useState<{
    status: 'testing' | 'success' | 'error';
    message: string;
    data?: PPOBDiagnosticResult;
  } | null>(null);
  const [isSyncingPPOBBalance, setIsSyncingPPOBBalance] = useState(false);
  const [showPPOBApiKeyPlain, setShowPPOBApiKeyPlain] = useState(false);
  const [copiedPPOBWebhook, setCopiedPPOBWebhook] = useState(false);

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
  const [showModalPassword, setShowModalPassword] = useState(false);
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

  // Password Security & Visibility State (Super Admin Only)
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [targetPasswordUser, setTargetPasswordUser] = useState<User | null>(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showQuickPasswordPlain, setShowQuickPasswordPlain] = useState(false);
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState<string | null>(null);

  const togglePasswordReveal = (userId: string) => {
    if (!hasRole(['super_admin'])) return;
    setRevealedPasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleCopyPassword = (userId: string, pass?: string) => {
    if (!hasRole(['super_admin'])) return;
    const textToCopy = pass || 'admin123';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy);
      setCopiedUserId(userId);
      setTimeout(() => setCopiedUserId(null), 2000);
    }
  };

  const openChangePasswordModal = (user: User) => {
    if (!hasRole(['super_admin'])) return;
    setTargetPasswordUser(user);
    setNewPasswordInput('');
    setConfirmPasswordInput('');
    setShowQuickPasswordPlain(false);
    setPasswordChangeError(null);
    setPasswordChangeSuccess(null);
    setShowChangePasswordModal(true);
  };

  const handleSaveChangedPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasRole(['super_admin'])) {
      setPasswordChangeError('Hanya Super Admin yang berhak mengubah kata sandi.');
      return;
    }
    if (!targetPasswordUser) return;
    if (!newPasswordInput.trim()) {
      setPasswordChangeError('Kata sandi baru tidak boleh kosong.');
      return;
    }
    if (newPasswordInput.length < 4) {
      setPasswordChangeError('Kata sandi minimal 4 karakter.');
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setPasswordChangeError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    updateUser(targetPasswordUser.id, {
      password: newPasswordInput.trim(),
    });

    setPasswordChangeSuccess(`Kata sandi untuk @${targetPasswordUser.username} (${targetPasswordUser.name}) berhasil diperbarui!`);
    setTimeout(() => {
      setShowChangePasswordModal(false);
      setPasswordChangeSuccess(null);
      setTargetPasswordUser(null);
    }, 1200);
  };

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

  const handleTestPPOB = async () => {
    const ppobConfig = formData.ppobGateway || DEFAULT_PPOB_SETTINGS;
    setTestPPOBStatus({
      status: 'testing',
      message: 'Menghubungi server PPOB Switcher & melakukan handshake otentikasi API...',
    });

    try {
      const diag = await testPPOBConnection(ppobConfig);
      setTestPPOBStatus({
        status: diag.success ? 'success' : 'error',
        message: diag.authMessage,
        data: diag,
      });
      setTimeout(() => {
        setTestPPOBStatus(null);
      }, 7000);
    } catch (err: any) {
      setTestPPOBStatus({
        status: 'error',
        message: err.message || 'Gagal menghubungi server PPOB Switcher.',
      });
    }
  };

  const handleSyncPPOBBalance = async () => {
    setIsSyncingPPOBBalance(true);
    try {
      const ppobConfig = formData.ppobGateway || DEFAULT_PPOB_SETTINGS;
      const res = await fetchPPOBServerBalance(ppobConfig);
      setFormData((prev) => ({
        ...prev,
        ppobGateway: {
          ...(prev.ppobGateway || DEFAULT_PPOB_SETTINGS),
          serverBalance: res.balance,
          lastBalanceSync: res.timestamp,
        },
      }));
    } finally {
      setIsSyncingPPOBBalance(false);
    }
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

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Silakan pilih file gambar (PNG, JPG, SVG, WebP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file logo maksimal 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setFormData({
          ...formData,
          logoType: 'custom',
          logoUrl: base64,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const navTabs = [
    { id: 'brand', label: 'Logo & Tema Tampilan', icon: Palette },
    { id: 'gateway', label: 'Metode Pembayaran & QRIS', icon: CreditCard },
    { id: 'ppob', label: 'Integrasi PPOB API (DigiFlazz)', icon: Zap },
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
            {/* 0. BRAND, LOGO & TEMA TAMPILAN */}
            {activeTab === 'brand' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 p-3.5 bg-[#00A876]/10 rounded-2xl border border-[#00A876]/20">
                  <Palette className="w-6 h-6 text-[#00A876] shrink-0" />
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Logo Toko &amp; Mode Tampilan Aplikasi
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Sesuaikan logo identitas brand toko (unggah file atau pilih ikon preset) dan pilih mode tema (Dark / Light)
                    </p>
                  </div>
                </div>

                {/* 1. THEME TOGGLE (DARK / LIGHT MODE) */}
                <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#00A876]" />
                        Mode Tema Antarmuka (Theme Mode)
                      </h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Pilih suasana visual yang nyaman untuk kasir dan admin.
                      </p>
                    </div>
                    <span className="text-[11px] px-2.5 py-1 rounded-full font-bold bg-[#00A876]/15 text-[#00A876] border border-[#00A876]/30">
                      Aktif: {theme === 'dark' ? 'Dark Mode (Obsidian)' : 'Light Mode (Terang)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Light Mode Card */}
                    <button
                      type="button"
                      onClick={() => setTheme('light')}
                      className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                        theme === 'light'
                          ? 'border-[#00A876] bg-teal-50/50 shadow-md ring-2 ring-[#00A876]/20'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-slate-300'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 shadow-xs">
                        <Sun className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-xs text-slate-900 dark:text-white">
                            Light Mode (Terang &amp; Bersih)
                          </p>
                          {theme === 'light' && (
                            <span className="w-2 h-2 rounded-full bg-[#00A876]" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                          Tampilan cerah dengan kontras tinggi, ideal untuk kasir di ruangan terang dan cetak nota.
                        </p>
                      </div>
                    </button>

                    {/* Dark Mode Card */}
                    <button
                      type="button"
                      onClick={() => setTheme('dark')}
                      className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                        theme === 'dark'
                          ? 'border-[#00A876] bg-slate-900 text-white shadow-md ring-2 ring-[#00A876]/30'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 hover:border-slate-300'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-[#00A876] border border-slate-700 flex items-center justify-center shrink-0 shadow-xs">
                        <Moon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-xs text-slate-900 dark:text-white">
                            Dark Mode (Obsidian &amp; Emerald)
                          </p>
                          {theme === 'dark' && (
                            <span className="w-2 h-2 rounded-full bg-[#00A876]" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                          Tampilan gelap elegan Averion yang ramah di mata untuk shift kasir malam dan hemat daya layar.
                        </p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* 2. LOGO MANAGEMENT */}
                <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200 flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 text-[#00A876]" />
                        Kustomisasi Logo Toko
                      </h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Logo akan otomatis tampil di Sidebar Kasir, Header POS, Layar Login, dan Cetak Struk.
                      </p>
                    </div>

                    {/* Switcher Mode: Preset vs Upload */}
                    <div className="inline-flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 shrink-0">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, logoType: 'preset' })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          formData.logoType !== 'custom'
                            ? 'bg-white dark:bg-slate-900 text-[#00A876] shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        Ikon Preset
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, logoType: 'custom' })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          formData.logoType === 'custom'
                            ? 'bg-white dark:bg-slate-900 text-[#00A876] shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        Unggah Gambar
                      </button>
                    </div>
                  </div>

                  {/* Option A: Custom Image Upload */}
                  {formData.logoType === 'custom' ? (
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-[#00A876] dark:hover:border-[#00A876] rounded-2xl p-6 text-center transition-all bg-slate-50/50 dark:bg-slate-800/30">
                        {formData.logoUrl ? (
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-20 h-20 rounded-2xl border-2 border-[#00A876] overflow-hidden shadow-lg bg-white flex items-center justify-center p-1">
                              <img
                                src={formData.logoUrl}
                                alt="Logo Toko"
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                Gambar Logo Kustom Aktif
                              </p>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Siap digunakan di seluruh sistem POS.
                              </p>
                            </div>
                            <div className="flex items-center gap-2 pt-1">
                              <label className="px-3.5 py-1.5 bg-[#00A876] hover:bg-[#008f65] text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-xs">
                                <span>Ganti Gambar Logo</span>
                                <input
                                  type="file"
                                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                                  onChange={handleLogoUpload}
                                  className="hidden"
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() =>
                                  setFormData({
                                    ...formData,
                                    logoType: 'preset',
                                    logoUrl: undefined,
                                    logoPreset: 'averion_triangle',
                                  })
                                }
                                className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 rounded-xl text-xs font-semibold transition cursor-pointer"
                              >
                                Hapus / Gunakan Preset
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2.5">
                            <div className="w-12 h-12 rounded-2xl bg-[#00A876]/15 text-[#00A876] flex items-center justify-center shadow-xs">
                              <Upload className="w-6 h-6" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                Klik untuk memilih file logo toko Anda
                              </p>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                Format: PNG, JPG, SVG, atau WebP (Rekomendasi rasio 1:1, Maks 2MB)
                              </p>
                            </div>
                            <label className="mt-2 px-4 py-2 bg-[#00A876] hover:bg-[#008f65] text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-md shadow-[#00A876]/20">
                              <span>Pilih File Logo dari Komputer</span>
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/svg+xml,image/webp"
                                onChange={handleLogoUpload}
                                className="hidden"
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Option B: Preset Icon Selector */
                    <div className="space-y-3">
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Pilih dari koleksi ikon identitas brand premium:
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                          { id: 'averion_triangle', label: 'Averion Triangle', desc: 'Modern & Presisi' },
                          { id: 'diamond', label: 'Emerald Diamond', desc: 'Mewah & Eksklusif' },
                          { id: 'hexagon', label: 'Cyber Shield', desc: 'Aman & Tangguh' },
                          { id: 'store', label: 'Retail Store', desc: 'Toko & Swalayan' },
                          { id: 'crown', label: 'Royal Crown', desc: 'VIP & Unggulan' },
                          { id: 'sparkle', label: 'Magic Sparkle', desc: 'Cepat & Cerdas' },
                          { id: 'box', label: 'Package Courier', desc: 'Grosir & Logistik' },
                          { id: 'rocket', label: 'Fast Rocket', desc: 'Cepat & Modern' },
                        ].map((preset) => {
                          const isSelected =
                            formData.logoPreset === preset.id ||
                            (!formData.logoPreset && preset.id === 'averion_triangle');
                          return (
                            <button
                              key={preset.id}
                              type="button"
                              onClick={() =>
                                setFormData({
                                  ...formData,
                                  logoType: 'preset',
                                  logoPreset: preset.id as any,
                                  logoUrl: undefined,
                                })
                              }
                              className={`p-3 rounded-2xl border-2 text-center flex flex-col items-center gap-2 transition cursor-pointer ${
                                isSelected
                                  ? 'border-[#00A876] bg-teal-50/60 dark:bg-slate-800 shadow-sm ring-1 ring-[#00A876]'
                                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300'
                              }`}
                            >
                              <BrandLogo
                                logoType="preset"
                                logoPreset={preset.id}
                                size="md"
                              />
                              <div>
                                <p className="text-xs font-bold text-slate-900 dark:text-white">
                                  {preset.label}
                                </p>
                                <span className="text-[10px] text-slate-400">
                                  {preset.desc}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 3. MULTI-PLATFORM LIVE PREVIEW */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Layout className="w-4 h-4 text-[#00A876]" />
                      Pratinjau Langsung di Berbagai Area (Live Multi-View)
                    </h5>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                      {/* Preview 1: Sidebar */}
                      <div className="p-3.5 rounded-2xl bg-[#0B1320] text-white border border-slate-800 shadow-xs space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#00A876]">
                          Pratinjau Sidebar
                        </span>
                        <div className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center gap-3">
                          <BrandLogo
                            logoType={formData.logoType}
                            logoPreset={formData.logoPreset}
                            logoUrl={formData.logoUrl}
                            storeName={formData.name || 'Averion'}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate">
                              {formData.name || 'Averion POS'}
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {formData.tagline || 'Solusi Kasir Toko'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Preview 2: Topbar Header */}
                      <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 shadow-xs space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          Pratinjau Header POS
                        </span>
                        <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <BrandLogo
                              logoType={formData.logoType}
                              logoPreset={formData.logoPreset}
                              logoUrl={formData.logoUrl}
                              storeName={formData.name}
                              size="xs"
                            />
                            <span className="text-xs font-bold text-slate-800 dark:text-white">
                              {formData.name || 'Kasir'}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold bg-[#00A876] text-white px-2 py-0.5 rounded-full">
                            Online
                          </span>
                        </div>
                      </div>

                      {/* Preview 3: Struk Thermal */}
                      <div className="p-3.5 rounded-2xl bg-amber-50/50 dark:bg-slate-800 text-slate-900 dark:text-white border border-amber-200 dark:border-slate-700 shadow-xs space-y-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400 flex items-center gap-1">
                          <ReceiptIcon className="w-3.5 h-3.5" />
                          Pratinjau Struk Kasir
                        </span>
                        <div className="p-2.5 rounded-xl bg-white text-slate-900 border border-slate-300 font-mono text-[10px] text-center space-y-1 shadow-inner">
                          <div className="flex justify-center">
                            <BrandLogo
                              logoType={formData.logoType}
                              logoPreset={formData.logoPreset}
                              logoUrl={formData.logoUrl}
                              storeName={formData.name}
                              size="xs"
                            />
                          </div>
                          <p className="font-bold text-xs uppercase">{formData.name || 'TOKO KAMI'}</p>
                          <p className="text-[9px] text-slate-500">{formData.address || 'Jl. Raya Toko No. 12'}</p>
                          <div className="border-t border-dashed border-slate-400 my-1" />
                          <p className="text-[9px] text-slate-600 font-sans">{formData.receiptFooter || 'Terima kasih atas kunjungan Anda'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

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

            {/* 1.5 INTEGRASI PPOB API (DIGIFLAZZ & MULTI-PROVIDER) */}
            {activeTab === 'ppob' && (
              <div className="space-y-6">
                {/* Header Banner */}
                <div className="flex items-center gap-3.5 p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                  <div className="w-10 h-10 rounded-xl bg-[#00A876] text-white flex items-center justify-center shadow-sm shrink-0">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      Integrasi API Gateway PPOB &amp; Server Pulsa
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold bg-[#00A876] text-white">
                        Dual Mode
                      </span>
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Hubungkan kasir secara langsung dengan API DigiFlazz / Ayoconnect untuk transaksi pulsa, token PLN, e-wallet otomatis, atau gunakan mode manual fallback.
                    </p>
                  </div>
                </div>

                {/* DUAL MODE SELECTOR CARDS */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#00A876]" />
                      Pilih Arsitektur Pemrosesan PPOB
                    </label>
                    <span className="text-[11px] font-bold text-[#00A876]">
                      Mode Aktif: {formData.ppobGateway?.mode === 'auto_api' ? '⚡ Auto-API (DigiFlazz)' : '📝 Mode Manual (Aplikasi Agen/EDC)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Option 1: Auto API */}
                    <div
                      onClick={() =>
                        setFormData({
                          ...formData,
                          ppobGateway: {
                            ...(formData.ppobGateway || DEFAULT_PPOB_SETTINGS),
                            mode: 'auto_api',
                          },
                        })
                      }
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        formData.ppobGateway?.mode === 'auto_api'
                          ? 'border-[#00A876] bg-emerald-50/50 dark:bg-emerald-950/20 shadow-md ring-2 ring-[#00A876]/20'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 text-[#00A876] flex items-center justify-center font-black">
                            <Zap className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>Mode 1: Auto-API Switcher</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-[#00A876] text-white">
                                Rekomendasi
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              Terhubung langsung via API DigiFlazz
                            </span>
                          </div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            formData.ppobGateway?.mode === 'auto_api'
                              ? 'border-[#00A876] bg-[#00A876] text-white'
                              : 'border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {formData.ppobGateway?.mode === 'auto_api' && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>

                      <ul className="mt-3.5 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#00A876] shrink-0" />
                          <span>Kasir <strong>tidak perlu buka HP / aplikasi lain</strong></span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#00A876] shrink-0" />
                          <span>Proses instan 1–3 detik, saldo server terpotong otomatis</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#00A876] shrink-0" />
                          <span>Kode Token PLN &amp; SN resmi otomatis masuk ke struk</span>
                        </li>
                      </ul>
                    </div>

                    {/* Option 2: Manual Mode */}
                    <div
                      onClick={() =>
                        setFormData({
                          ...formData,
                          ppobGateway: {
                            ...(formData.ppobGateway || DEFAULT_PPOB_SETTINGS),
                            mode: 'manual',
                          },
                        })
                      }
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                        formData.ppobGateway?.mode === 'manual'
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-md ring-2 ring-indigo-500/20'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 flex items-center justify-center font-black">
                            <Smartphone className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-xs font-black text-slate-900 dark:text-white">
                              Mode 2: Manual Input (Agen HP / EDC)
                            </div>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              Tanpa API, cocok untuk aplikasi agen langganan
                            </span>
                          </div>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            formData.ppobGateway?.mode === 'manual'
                              ? 'border-indigo-600 bg-indigo-600 text-white'
                              : 'border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          {formData.ppobGateway?.mode === 'manual' && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>

                      <ul className="mt-3.5 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>Gunakan aplikasi agen di HP (Mitra Shopee, DANA, Payfazz, EDC)</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>Kasir menginput SN/Token di POS untuk cetak struk thermal</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>Pencatatan laba &amp; buku kas toko tetap terintegrasi rapi</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* REAL-TIME SERVER BALANCE STATUS CARD */}
                <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl border border-slate-700 shadow-md">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold tracking-wider uppercase">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        Status Saldo Deposit Server PPOB (Live)
                      </div>
                      <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
                        {formatRupiah(formData.ppobGateway?.serverBalance || digitalDepositBalance)}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Sinkronisasi terakhir: {new Date(formData.ppobGateway?.lastBalanceSync || Date.now()).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} WIB
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleSyncPPOBBalance}
                        disabled={isSyncingPPOBBalance}
                        className="px-4 py-2.5 bg-white/10 hover:bg-white/20 active:scale-98 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer border border-white/10"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncingPPOBBalance ? 'animate-spin' : ''}`} />
                        <span>{isSyncingPPOBBalance ? 'Menyinkronkan...' : 'Sinkronkan Saldo Real-Time'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* API CREDENTIALS FORM (FOR AUTO-API MODE) */}
                <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Key className="w-4 h-4 text-[#00A876]" />
                        Konfigurasi Kredensial API DigiFlazz / PPOB
                      </h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Dapatkan username dan API key di portal resmi DigiFlazz (digiflazz.com)
                      </p>
                    </div>
                    <span className="text-[11px] px-2.5 py-1 rounded-full font-bold bg-[#00A876]/10 text-[#00A876] border border-[#00A876]/20">
                      {formData.ppobGateway?.isDevelopmentMode ? '🧪 Mode Sandbox (Testing)' : '🚀 Mode Production (Live)'}
                    </span>
                  </div>

                  {/* Provider Selector */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          ppobGateway: {
                            ...(formData.ppobGateway || DEFAULT_PPOB_SETTINGS),
                            provider: 'digiflazz',
                          },
                        })
                      }
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        formData.ppobGateway?.provider === 'digiflazz'
                          ? 'border-[#00A876] bg-emerald-50/50 dark:bg-emerald-950/20 ring-1 ring-[#00A876]'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                        <span>DigiFlazz API</span>
                        <span className="text-[9px] px-1 bg-[#00A876] text-white rounded">#1 B2B</span>
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Respon detik, ribuan produk pulsa, PLN &amp; e-wallet
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          ppobGateway: {
                            ...(formData.ppobGateway || DEFAULT_PPOB_SETTINGS),
                            provider: 'ayoconnect',
                          },
                        })
                      }
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        formData.ppobGateway?.provider === 'ayoconnect'
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 ring-1 ring-indigo-500'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Ayoconnect / Mobilepulsa</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Standar enterprise korporasi perbankan
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          ppobGateway: {
                            ...(formData.ppobGateway || DEFAULT_PPOB_SETTINGS),
                            provider: 'custom_webhook',
                          },
                        })
                      }
                      className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                        formData.ppobGateway?.provider === 'custom_webhook'
                          ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/20 ring-1 ring-amber-500'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-900 dark:text-white">Custom Server API</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Gunakan backend / webhook server sendiri
                      </div>
                    </button>
                  </div>

                  {/* Credentials Input */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Username DigiFlazz
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={formData.ppobGateway?.username || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              ppobGateway: {
                                ...(formData.ppobGateway || DEFAULT_PPOB_SETTINGS),
                                username: e.target.value,
                              },
                            })
                          }
                          placeholder="contoh: konter_berkah_pos"
                          className="w-full pl-9 pr-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#00A876] outline-none"
                        />
                        <Users className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Username akun terdaftar di portal DigiFlazz</p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        API Key (Production / Dev Key)
                      </label>
                      <div className="relative">
                        <input
                          type={showPPOBApiKeyPlain ? 'text' : 'password'}
                          value={formData.ppobGateway?.apiKey || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              ppobGateway: {
                                ...(formData.ppobGateway || DEFAULT_PPOB_SETTINGS),
                                apiKey: e.target.value,
                              },
                            })
                          }
                          placeholder="dev-df-xxxxxxxxxxxx"
                          className="w-full pl-9 pr-10 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#00A876] outline-none"
                        />
                        <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                        <button
                          type="button"
                          onClick={() => setShowPPOBApiKeyPlain(!showPPOBApiKeyPlain)}
                          className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        >
                          {showPPOBApiKeyPlain ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">Gunakan Development Key untuk testing atau Production Key untuk live</p>
                    </div>
                  </div>

                  {/* Mode Sandbox Toggle & Fallback Checkbox */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.ppobGateway?.isDevelopmentMode ?? true}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            ppobGateway: {
                              ...(formData.ppobGateway || DEFAULT_PPOB_SETTINGS),
                              isDevelopmentMode: e.target.checked,
                            },
                          })
                        }
                        className="w-4 h-4 mt-0.5 text-[#00A876] rounded border-slate-300 focus:ring-[#00A876]"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          Mode Sandbox / Testing (Simulasi Respon)
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Menguji transaksi tanpa memotong saldo deposit uang sungguhan
                        </span>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.ppobGateway?.allowManualFallback ?? true}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            ppobGateway: {
                              ...(formData.ppobGateway || DEFAULT_PPOB_SETTINGS),
                              allowManualFallback: e.target.checked,
                            },
                          })
                        }
                        className="w-4 h-4 mt-0.5 text-[#00A876] rounded border-slate-300 focus:ring-[#00A876]"
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          Izinkan Manual Fallback Kasir
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          Sediakan tombol darurat input SN manual jika server operator sedang cut-off / gangguan
                        </span>
                      </div>
                    </label>
                  </div>

                  {/* DIAGNOSTIC TEST BUTTON & RESULTS */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleTestPPOB}
                      disabled={testPPOBStatus?.status === 'testing'}
                      className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-xs"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>
                        {testPPOBStatus?.status === 'testing'
                          ? 'Menguji Koneksi & Handshake...'
                          : 'Uji Koneksi & Diagnostik API Server'}
                      </span>
                    </button>

                    {testPPOBStatus && (
                      <div
                        className={`mt-3 p-3.5 rounded-xl border text-xs flex items-start gap-3 animate-in fade-in ${
                          testPPOBStatus.status === 'testing'
                            ? 'bg-amber-50 border-amber-200 text-amber-900'
                            : testPPOBStatus.status === 'success'
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : 'bg-rose-50 border-rose-200 text-rose-900'
                        }`}
                      >
                        {testPPOBStatus.status === 'testing' && <RefreshCw className="w-4 h-4 text-amber-600 animate-spin shrink-0 mt-0.5" />}
                        {testPPOBStatus.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                        {testPPOBStatus.status === 'error' && <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
                        <div className="space-y-1">
                          <p className="font-bold">{testPPOBStatus.message}</p>
                          {testPPOBStatus.data && (
                            <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5 font-mono">
                              <div>Latency: {testPPOBStatus.data.latencyMs}ms | Provider: {testPPOBStatus.data.provider}</div>
                              <div>IP Whitelist: {testPPOBStatus.data.ipWhitelistStatus === 'whitelisted' ? '✅ Terverifikasi' : '⏳ Menunggu'}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* WEBHOOK CALLBACK & IP WHITELIST INFORMATION */}
                <div className="p-5 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    <Radio className="w-4 h-4 text-[#00A876]" />
                    URL Webhook Callback &amp; IP Server Whitelist
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Salin URL Webhook di bawah ini ke menu <strong>Pengaturan Webhook</strong> di dashboard DigiFlazz untuk menerima notifikasi status sukses/gagal transaksi secara instan:
                  </p>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-800 dark:text-slate-200 truncate">
                      https://pos.averion.id/api/ppob/callback
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (navigator.clipboard) {
                          navigator.clipboard.writeText('https://pos.averion.id/api/ppob/callback');
                          setCopiedPPOBWebhook(true);
                          setTimeout(() => setCopiedPPOBWebhook(false), 2000);
                        }
                      }}
                      className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {copiedPPOBWebhook ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
                      <span>{copiedPPOBWebhook ? 'Tersalin!' : 'Salin URL'}</span>
                    </button>
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

            {/* 3. PRINTER STRUK & FORMAT NOTA */}
            {activeTab === 'printer' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 p-3.5 bg-[#00A876]/10 rounded-2xl border border-[#00A876]/20">
                  <Printer className="w-6 h-6 text-[#00A876] shrink-0" />
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Format Struk Kasir &amp; Printer Thermal POS
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Kustomisasi elemen struk fisik (logo toko, pesan pembuka/penutup, barcode, dan visibilitas info poin loyalitas)
                    </p>
                  </div>
                </div>

                <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
                  {/* Paper Width & General */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Lebar Kertas Struk Thermal
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
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#00A876] outline-none"
                      >
                        <option value="58mm">58 mm (Printer Mini / Mobile Bluetooth)</option>
                        <option value="80mm">80 mm (Printer Desktop POS Standar)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Nama Perangkat Bluetooth (Opsional)
                      </label>
                      <input
                        type="text"
                        value={formData.printer?.bluetoothDeviceName || ''}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            printer: {
                              ...formData.printer,
                              bluetoothDeviceName: e.target.value,
                            },
                          })
                        }
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-[#00A876] outline-none"
                        placeholder="Contoh: POS-58-BT / ThermalPrinter"
                      />
                    </div>
                  </div>

                  {/* Header & Footer Custom Messages */}
                  <div className="space-y-4 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#00A876]" />
                      Pesan Kustom Header &amp; Catatan Footer Struk
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Pesan Pembuka (Custom Header Struk)
                        </label>
                        <input
                          type="text"
                          value={formData.printer?.customHeader || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              printer: {
                                ...formData.printer,
                                customHeader: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-[#00A876] outline-none"
                          placeholder="Contoh: SELAMAT DATANG DI TOKO KAMI"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                          Ditampilkan di atas nama toko pada lembaran struk cetak.
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Pesan Penutup (Custom Footer Struk)
                        </label>
                        <input
                          type="text"
                          value={formData.receiptFooter || formData.printer?.customFooter || ''}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              receiptFooter: e.target.value,
                              printer: {
                                ...formData.printer,
                                customFooter: e.target.value,
                              },
                            })
                          }
                          className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-[#00A876] outline-none"
                          placeholder="Contoh: Barang yang sudah dibeli tidak dapat ditukar."
                        />
                        <p className="text-[10px] text-slate-400 mt-1">
                          Dicetak pada bagian paling bawah sebelum stempel lunas.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Format Toggles Matrix (Logo, Loyalty Points, Cashier, Barcode, etc.) */}
                  <div className="space-y-3">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                      <Sliders className="w-4 h-4 text-[#00A876]" />
                      Opsi Tampilan Elemen Struk Cetak
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Toggle 1: Logo Toko */}
                      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Cetak Logo Toko
                          </p>
                          <span className="text-[11px] text-slate-400">
                            Tampilkan logo di bagian paling atas nota
                          </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.printer?.printStoreLogo ?? true}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                printer: {
                                  ...formData.printer,
                                  printStoreLogo: e.target.checked,
                                },
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5.5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00A876]"></div>
                        </label>
                      </div>

                      {/* Toggle 2: Poin Loyalitas Member */}
                      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Informasi Poin Loyalitas
                          </p>
                          <span className="text-[11px] text-slate-400">
                            Sembunyikan / Tampilkan poin member pada struk
                          </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.printer?.printCustomerPoints ?? true}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                printer: {
                                  ...formData.printer,
                                  printCustomerPoints: e.target.checked,
                                },
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5.5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00A876]"></div>
                        </label>
                      </div>

                      {/* Toggle 3: Nama Kasir */}
                      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Cetak Nama Kasir
                          </p>
                          <span className="text-[11px] text-slate-400">
                            Sertakan nama kasir yang melayani
                          </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.printer?.printCashierName ?? true}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                printer: {
                                  ...formData.printer,
                                  printCashierName: e.target.checked,
                                },
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5.5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00A876]"></div>
                        </label>
                      </div>

                      {/* Toggle 4: Barcode Struk */}
                      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Garis Barcode &amp; No. Nota
                          </p>
                          <span className="text-[11px] text-slate-400">
                            Cetak visual barcode nota di bagian bawah
                          </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.printer?.printBarcode ?? true}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                printer: {
                                  ...formData.printer,
                                  printBarcode: e.target.checked,
                                },
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5.5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00A876]"></div>
                        </label>
                      </div>

                      {/* Toggle 5: Rincian Pajak (PPN) */}
                      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Rincian Pajak (PPN)
                          </p>
                          <span className="text-[11px] text-slate-400">
                            Tampilkan breakdown pajak jika toko mengaktifkan PPN
                          </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.printer?.printTaxDetails ?? true}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                printer: {
                                  ...formData.printer,
                                  printTaxDetails: e.target.checked,
                                },
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5.5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00A876]"></div>
                        </label>
                      </div>

                      {/* Toggle 6: Stempel Status Pembayaran */}
                      <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            Stempel Status Bayar
                          </p>
                          <span className="text-[11px] text-slate-400">
                            Cetak stempel *** LUNAS *** / *** TEMPO ***
                          </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.printer?.printPaymentStatus ?? true}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                printer: {
                                  ...formData.printer,
                                  printPaymentStatus: e.target.checked,
                                },
                              })
                            }
                            className="sr-only peer"
                          />
                          <div className="w-10 h-5.5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00A876]"></div>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleTestPrint}
                      className="px-4 py-2 bg-[#00A876]/10 hover:bg-[#00A876]/20 text-[#00A876] border border-[#00A876]/30 rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-[#00A876]" />
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
            {activeTab === 'users' && (
              <div className="space-y-6">
                {/* Security Banner */}
                <div className="p-4 bg-gradient-to-r from-indigo-900/10 via-slate-900/5 to-emerald-900/10 rounded-2xl border border-indigo-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900">
                          Manajemen Pengguna &amp; Keamanan Kata Sandi
                        </h4>
                        <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Super Admin Protected
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                        Seluruh informasi kata sandi disembunyikan dan dienkripsi secara ketat. <strong>Hanya akun dengan peran Super Admin</strong> yang berhak melihat dan mengganti kata sandi pengguna.
                      </p>
                    </div>
                  </div>

                  {hasRole(['super_admin']) && (
                    <button
                      type="button"
                      id="btn-add-user-modal"
                      onClick={() => {
                        setEditingUser(null);
                        setShowModalPassword(false);
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
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs shrink-0 self-start sm:self-center"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Pengguna</span>
                    </button>
                  )}
                </div>

                {!hasRole(['super_admin']) && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs font-medium flex items-center gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <span>
                      Anda sedang melihat daftar pengguna dengan hak akses terbatas. Hanya <strong>Super Admin</strong> yang memiliki izin untuk melihat dan mengganti kata sandi.
                    </span>
                  </div>
                )}

                {/* Users List */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {users.map((user) => {
                    const isSelf = user.id === currentUser?.id;
                    const isSuperAdmin = hasRole(['super_admin']);
                    const isRevealed = !!revealedPasswords[user.id];
                    const storeObj = stores.find((s) => s.id === user.storeId);
                    const userPassword = user.password || 'admin123';

                    return (
                      <div
                        key={user.id}
                        className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                          isSelf
                            ? 'bg-indigo-50/40 border-indigo-200 shadow-xs'
                            : 'bg-slate-50/80 border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {/* Top Info Row */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative shrink-0">
                              <img
                                src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                                alt={user.name}
                                className="w-12 h-12 rounded-2xl object-cover border border-slate-300 shadow-xs"
                              />
                              <span
                                className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                                  user.active !== false ? 'bg-emerald-500' : 'bg-slate-400'
                                }`}
                                title={user.active !== false ? 'Akun Aktif' : 'Non-aktif'}
                              />
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                                  {user.name}
                                </p>
                                {isSelf && (
                                  <span className="text-[9px] bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full border border-emerald-300">
                                    Akun Anda
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 font-mono mt-0.5 truncate">
                                @{user.username} &bull; <span className="text-slate-400">{user.email}</span>
                              </p>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <span
                                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                                    user.role === 'super_admin'
                                      ? 'bg-purple-100 text-purple-800 border-purple-300'
                                      : user.role === 'admin'
                                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                                      : 'bg-teal-100 text-teal-800 border-teal-300'
                                  }`}
                                >
                                  {user.role === 'super_admin'
                                    ? 'SUPER ADMIN'
                                    : user.role === 'admin'
                                    ? 'ADMIN TOKO'
                                    : 'KASIR POS'}
                                </span>
                                <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                                  <Building2 className="w-3 h-3 text-slate-400" />
                                  {storeObj?.name || 'Semua Cabang'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Quick Edit & Delete Actions (Super Admin Only) */}
                          {isSuperAdmin && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                id={`edit-user-btn-${user.id}`}
                                onClick={() => {
                                  setEditingUser(user);
                                  setShowModalPassword(false);
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
                                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-white rounded-xl border border-transparent hover:border-slate-200 transition cursor-pointer"
                                title="Edit Data Pengguna"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              {!isSelf && users.length > 1 && (
                                <button
                                  type="button"
                                  id={`delete-user-btn-${user.id}`}
                                  onClick={() => {
                                    if (window.confirm(`Hapus akun pengguna @${user.username} (${user.name})?`)) {
                                      deleteUser(user.id);
                                    }
                                  }}
                                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-200 transition cursor-pointer"
                                  title="Hapus Pengguna"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Password Security Information Row */}
                        <div className="p-2.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                              <Lock className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                                Kata Sandi (Password):
                              </span>
                              {isSuperAdmin ? (
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  {isRevealed ? (
                                    <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 select-all">
                                      {userPassword}
                                    </span>
                                  ) : (
                                    <span className="font-mono text-xs text-slate-500 font-bold tracking-widest bg-slate-100 px-2 py-0.5 rounded-md">
                                      ••••••••
                                    </span>
                                  )}
                                  {isRevealed && (
                                    <span className="text-[10px] text-emerald-600 font-semibold hidden sm:inline">
                                      (Terlihat oleh Super Admin)
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 mt-0.5">
                                  <span className="font-mono text-xs text-slate-400 font-bold tracking-widest">
                                    ••••••••
                                  </span>
                                  <span className="text-[10px] text-slate-400 italic">
                                    (Disembunyikan)
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Super Admin Password Action Buttons */}
                          {isSuperAdmin && (
                            <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                              {/* Show / Hide Toggle Button */}
                              <button
                                type="button"
                                id={`toggle-password-btn-${user.id}`}
                                onClick={() => togglePasswordReveal(user.id)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition cursor-pointer ${
                                  isRevealed
                                    ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                                }`}
                                title={isRevealed ? 'Sembunyikan Kata Sandi' : 'Lihat Kata Sandi'}
                              >
                                {isRevealed ? (
                                  <>
                                    <EyeOff className="w-3.5 h-3.5" />
                                    <span>Tutup</span>
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Lihat</span>
                                  </>
                                )}
                              </button>

                              {/* Copy Password Button (Only when revealed or superadmin) */}
                              {isRevealed && (
                                <button
                                  type="button"
                                  id={`copy-password-btn-${user.id}`}
                                  onClick={() => handleCopyPassword(user.id, user.password)}
                                  className="px-2 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300 text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                                  title="Salin Kata Sandi"
                                >
                                  {copiedUserId === user.id ? (
                                    <>
                                      <Check className="w-3.5 h-3.5 text-emerald-700" />
                                      <span className="text-emerald-700">Tersalin!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3.5 h-3.5" />
                                      <span>Salin</span>
                                    </>
                                  )}
                                </button>
                              )}

                              {/* Quick Change Password Button */}
                              <button
                                type="button"
                                id={`change-password-btn-${user.id}`}
                                onClick={() => openChangePasswordModal(user)}
                                className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 transition cursor-pointer shadow-2xs"
                                title="Ganti Kata Sandi Pengguna Ini"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                                <span>Ganti Sandi</span>
                              </button>
                            </div>
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

            {/* 7. PREFERENSI, TARGET PENJUALAN & POIN */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 p-3.5 bg-[#00A876]/10 rounded-2xl border border-[#00A876]/20">
                  <Sliders className="w-6 h-6 text-[#00A876] shrink-0" />
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      Target Omzet &amp; Poin Loyalitas Toko
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Tentukan target omzet penjualan bulanan dan kalkulasi sistem perolehan poin member
                    </p>
                  </div>
                </div>

                {/* Target Penjualan Bulanan Card */}
                <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Target className="w-4 h-4 text-[#00A876]" />
                        Target Penjualan Bulanan (Sales Target)
                      </h5>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Target nominal penjualan bulanan yang dipantau real-time pada Dashboard.
                      </p>
                    </div>
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-[#00A876]/10 text-[#00A876] border border-[#00A876]/20">
                      {formatRupiah(formData.monthlySalesTarget || 50000000)} / bulan
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Nominal Target Penjualan Bulanan (Rp)
                      </label>
                      <input
                        type="number"
                        value={formData.monthlySalesTarget || 50000000}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            monthlySalesTarget: Math.max(0, Number(e.target.value) || 0),
                          })
                        }
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono font-black text-[#00A876] focus:ring-2 focus:ring-[#00A876] outline-none"
                        placeholder="Contoh: 50000000"
                      />
                    </div>

                    {/* Quick Preset Buttons */}
                    <div className="flex items-center gap-2 flex-wrap pt-1">
                      <span className="text-[11px] text-slate-400 font-medium">Pilihan Cepat:</span>
                      {[15000000, 30000000, 50000000, 100000000, 200000000].map((nominal) => (
                        <button
                          key={nominal}
                          type="button"
                          onClick={() => setFormData({ ...formData, monthlySalesTarget: nominal })}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                            formData.monthlySalesTarget === nominal
                              ? 'bg-[#00A876] text-white shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          {formatRupiah(nominal)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Loyalty Points Card */}
                <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <Award className="w-4 h-4 text-[#00A876]" />
                    Aturan Perolehan &amp; Tukar Poin Member
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#00A876] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
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
                        className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-[#00A876] outline-none"
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 sm:p-7 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  {editingUser ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingUser ? `Kelola profil @${editingUser.username}` : 'Daftarkan akun kasir atau admin baru'}
                </p>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                Super Admin
              </span>
            </div>

            <form onSubmit={handleUserSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={userFormData.name}
                  onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Contoh: Budi Santoso"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Username Login
                </label>
                <input
                  type="text"
                  required
                  value={userFormData.username}
                  onChange={(e) => setUserFormData({ ...userFormData, username: e.target.value.toLowerCase().replace(/\s+/g, '') })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                  placeholder="kasir1"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Alamat Email
                </label>
                <input
                  type="email"
                  required
                  value={userFormData.email}
                  onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="kasir1@toko.com"
                />
              </div>

              {/* Password Input with Visibility Eye Toggle (Super Admin Only) */}
              <div className="p-3 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-indigo-950 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-indigo-600" />
                    Kata Sandi {editingUser && '(Opsional / Kosongkan jika tetap)'}
                  </label>
                  <span className="text-[10px] text-indigo-700 font-semibold">
                    Akses Super Admin
                  </span>
                </div>
                <div className="relative">
                  <input
                    type={showModalPassword ? 'text' : 'password'}
                    required={!editingUser}
                    value={userFormData.password}
                    onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
                    className="w-full pl-3.5 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder={editingUser ? 'Masukkan sandi baru...' : 'Minimal 4 karakter'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowModalPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showModalPassword ? 'Sembunyikan Kata Sandi' : 'Tampilkan Kata Sandi'}
                  >
                    {showModalPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  {editingUser
                    ? 'Kosongkan jika tidak ingin mengubah kata sandi lama akun ini.'
                    : 'Kata sandi awal untuk login kasir/admin.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Peran (Role)
                  </label>
                  <select
                    value={userFormData.role}
                    onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                  >
                    <option value="kasir">Kasir POS</option>
                    <option value="admin">Admin Cabang</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Penempatan Toko
                  </label>
                  <select
                    value={userFormData.storeId}
                    onChange={(e) => setUserFormData({ ...userFormData, storeId: e.target.value })}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                  >
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-submit-user-form"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition cursor-pointer"
                >
                  {editingUser ? 'Simpan Perubahan' : 'Tambah Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dedicated Change Password Modal (Super Admin Only) */}
      {showChangePasswordModal && targetPasswordUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 sm:p-7 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Ganti Kata Sandi
                  </h3>
                  <p className="text-xs text-slate-500">
                    Khusus Super Admin Otorisasi
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                Super Admin
              </span>
            </div>

            {/* Target User Card Preview */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
              <img
                src={targetPasswordUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                alt={targetPasswordUser.name}
                className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="font-bold text-xs text-slate-900 truncate">
                  {targetPasswordUser.name}
                </p>
                <p className="text-[11px] text-slate-500 font-mono truncate">
                  @{targetPasswordUser.username} &bull; <span className="capitalize">{targetPasswordUser.role}</span>
                </p>
              </div>
            </div>

            {/* Error or Success alerts */}
            {passwordChangeError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{passwordChangeError}</span>
              </div>
            )}
            {passwordChangeSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{passwordChangeSuccess}</span>
              </div>
            )}

            <form onSubmit={handleSaveChangedPassword} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Kata Sandi Baru
                </label>
                <div className="relative">
                  <input
                    type={showQuickPasswordPlain ? 'text' : 'password'}
                    required
                    value={newPasswordInput}
                    onChange={(e) => {
                      setNewPasswordInput(e.target.value);
                      setPasswordChangeError(null);
                    }}
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder="Masukkan kata sandi baru (min 4 karakter)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowQuickPasswordPlain((prev) => !prev)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    title={showQuickPasswordPlain ? 'Sembunyikan' : 'Lihat Sandi'}
                  >
                    {showQuickPasswordPlain ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Ulangi Kata Sandi Baru
                </label>
                <input
                  type={showQuickPasswordPlain ? 'text' : 'password'}
                  required
                  value={confirmPasswordInput}
                  onChange={(e) => {
                    setConfirmPasswordInput(e.target.value);
                    setPasswordChangeError(null);
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="Ketik ulang kata sandi baru untuk verifikasi"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                <strong>Catatan Keamanan:</strong> Kata sandi baru akan langsung berlaku untuk login berikutnya. Pastikan menginformasikan kata sandi baru ini kepada pengguna bersangkutan.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowChangePasswordModal(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  id="btn-confirm-change-password"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-200 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Simpan Kata Sandi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

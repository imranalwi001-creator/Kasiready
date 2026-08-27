import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { UserRole } from '../../types';
import {
  Store as StoreIcon,
  ShieldCheck,
  UserCheck,
  ShoppingCart,
  Lock,
  Mail,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
  HelpCircle,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, users, stores } = useStore();

  const [identifier, setIdentifier] = useState<string>('superadmin');
  const [password, setPassword] = useState<string>('admin123');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setErrorMessage('Silakan masukkan nama pengguna atau email.');
      return;
    }
    setErrorMessage('');
    setIsLoading(true);

    try {
      const result = await login(identifier, password);
      if (!result.success) {
        setErrorMessage(result.message || 'Login gagal. Periksa data Anda.');
      }
    } catch {
      setErrorMessage('Terjadi kesalahan saat memproses login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = (demoIdentifier: string, demoPass: string) => {
    setIdentifier(demoIdentifier);
    setPassword(demoPass);
    setErrorMessage('');
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return {
          label: 'Super Admin',
          bg: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: ShieldCheck,
        };
      case 'admin':
        return {
          label: 'Admin Toko',
          bg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          icon: UserCheck,
        };
      case 'kasir':
        return {
          label: 'Kasir',
          bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: ShoppingCart,
        };
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Subtle Background Glow Elements */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
        {/* Left Side: Brand Overview & Role Hierarchy */}
        <div className="lg:col-span-6 space-y-6 text-left">
          <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-indigo-400 text-xs font-semibold backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Sistem Kasir &amp; Manajemen Toko Terintegrasi</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
                <StoreIcon className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  KASIRPRO POS
                </h1>
                <p className="text-xs text-slate-400">Multi-Cabang &bull; Payment Gateway &bull; Barcode &bull; Role RBAC</p>
              </div>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed pt-2">
              Masuk ke akun Anda untuk mengelola transaksi kasir, pemindaian barcode produk, inventaris multi-cabang, konfigurasi gateway digital (OVO, GoPay, Transfer Bank), dan cetak struk thermal.
            </p>
          </div>

          {/* Quick Demo Accounts Selection */}
          <div className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/80 backdrop-blur-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                Pilih Akun Demo Cepat (1-Klik Isi):
              </span>
              <span className="text-[11px] text-slate-400">Sandi: admin123 / kasir123</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {users.map((u) => {
                const badge = getRoleBadge(u.role);
                const BadgeIcon = badge.icon;
                const storeName = stores.find((s) => s.id === u.storeId)?.name || 'Semua Cabang';
                const isSelected = identifier === u.username || identifier === u.email;

                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickLogin(u.username, u.password || 'admin123')}
                    className={`text-left p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                      isSelected
                        ? 'bg-indigo-950/70 border-indigo-500 shadow-xs ring-1 ring-indigo-500'
                        : 'bg-slate-900/60 border-slate-700/70 hover:bg-slate-700/50 text-slate-300'
                    }`}
                  >
                    <img
                      src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                      alt={u.name}
                      className="w-9 h-9 rounded-xl object-cover border border-slate-600 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-white truncate">{u.name.split('(')[0]}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-md font-semibold border ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">
                        {u.username} &bull; <span className="text-slate-500">{storeName}</span>
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Role Privileges Reference */}
          <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-400">
            <div className="p-2 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <span className="font-bold text-purple-300 block mb-0.5">Super Admin</span>
              <span>Akses penuh seluruh cabang, gateway, printer &amp; user</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <span className="font-bold text-indigo-300 block mb-0.5">Admin Toko</span>
              <span>Kelola inventaris toko, transfer stok, laporan &amp; kasir</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-800/40 border border-slate-700/50">
              <span className="font-bold text-emerald-300 block mb-0.5">Kasir POS</span>
              <span>Akses cepat checkout, barcode scan &amp; struk bayar</span>
            </div>
          </div>
        </div>

        {/* Right Side: Login Card */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="w-full max-w-md bg-white text-slate-900 rounded-2xl shadow-2xl p-6 sm:p-8 border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="mb-6">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Masuk ke Aplikasi
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Silakan masukkan kredensial akun kasir atau administrator Anda.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Nama Pengguna / Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    id="login-identifier-input"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="superadmin / admin / kasir"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Kata Sandi
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Default: <code className="text-indigo-600 font-bold">admin123</code>
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="login-password-input"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi..."
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="inline-flex items-center gap-2 text-slate-600 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                  />
                  <span>Ingat sesi login saya</span>
                </label>
              </div>

              <button
                type="submit"
                id="login-submit-btn"
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Memverifikasi Akun...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk ke Kasir</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                POS v3.0 Multi-Store
              </span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Sistem Aktif &amp; Terlindungi
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

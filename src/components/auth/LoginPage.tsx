import React, { useState } from 'react';
import { useStore } from '../../context/StoreContext';
import { UserRole } from '../../types';
import { BrandLogo } from '../common/BrandLogo';
import {
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
  Sun,
  Moon,
  QrCode,
  Volume2,
  Printer,
  Zap,
  TrendingUp,
  BarChart3,
  Layers,
  ChevronRight,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, users, stores, settings, theme, toggleTheme } = useStore();

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
          bg: 'bg-emerald-500/15 text-[#00C896] border-emerald-500/30',
          icon: ShieldCheck,
        };
      case 'admin':
        return {
          label: 'Admin Cabang',
          bg: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
          icon: UserCheck,
        };
      case 'kasir':
        return {
          label: 'Kasir POS',
          bg: 'bg-emerald-400/15 text-emerald-300 border-emerald-400/30',
          icon: ShoppingCart,
        };
    }
  };

  return (
    <div className="min-h-screen bg-[#070D18] text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-10 relative overflow-x-hidden selection:bg-[#00A876] selection:text-white">
      {/* Dynamic Background Mesh Gradients */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#00A876]/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-teal-600/10 rounded-full blur-3xl pointer-events-none translate-y-1/3" />
      <div className="absolute inset-0 bg-[radial-gradient(#00A876_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.04] pointer-events-none" />

      {/* Top Header Bar */}
      <header className="w-full max-w-7xl mx-auto flex items-center justify-between relative z-20 py-2">
        <div className="flex items-center gap-3">
          <BrandLogo
            logoType={settings.logoType}
            logoPreset={settings.logoPreset}
            logoUrl={settings.logoUrl}
            storeName={settings.name}
            size="md"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">
                {settings.name || 'AVERION'}
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-[#00A876]/20 text-[#00C896] border border-[#00A876]/40">
                POS Enterprise
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              {settings.tagline || 'Point of Sale & Multi-Branch Management System'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            title="Ganti Mode Tampilan (Dark/Light)"
            className="p-2.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white transition cursor-pointer flex items-center gap-2 text-xs font-semibold backdrop-blur-md shadow-xs"
          >
            {theme === 'dark' ? (
              <>
                <Moon className="w-4 h-4 text-[#00C896]" />
                <span className="hidden sm:inline">Dark</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Light</span>
              </>
            )}
          </button>

          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/30 text-[#00C896] text-xs font-bold shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#00C896] animate-ping" />
            <span>Server Aktif &bull; Online</span>
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center my-auto py-8 relative z-10">
        {/* Left Side: Brand Value Proposition, Capabilities & Demo Profiles */}
        <div className="lg:col-span-7 space-y-6 text-left">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00A876]/15 border border-[#00A876]/30 text-[#00C896] text-xs font-bold tracking-wide backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-[#00C896]" />
              <span>Sistem Kasir Pintar &amp; Manajemen Toko Terpadu</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              Kelola Toko &amp; Kasir <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00C896] via-teal-300 to-emerald-400">
                Lebih Cepat &amp; Akurat
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              Platform kasir modern all-in-one dengan pemindaian barcode, integrasi QRIS universal, soundbox notifikasi suara, pengelolaan stok multi-cabang, dan cetak struk thermal Bluetooth &amp; USB.
            </p>
          </div>

          {/* Core Feature Badges Bento */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            {[
              { title: 'Multi-Cabang', desc: 'Kelola banyak toko', icon: Building2 },
              { title: 'QRIS Universal', desc: 'Dukungan soundbox', icon: QrCode },
              { title: 'Barcode Scan', desc: 'Kamera & scanner', icon: Zap },
              { title: 'Struk WhatsApp', desc: 'Nota digital instan', icon: Printer },
            ].map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="p-3.5 rounded-2xl bg-slate-800/50 border border-slate-700/60 backdrop-blur-md flex flex-col gap-1.5 hover:border-[#00A876]/40 transition"
                >
                  <div className="w-8 h-8 rounded-xl bg-[#00A876]/15 text-[#00C896] flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <p className="font-bold text-xs text-white">{f.title}</p>
                  <span className="text-[11px] text-slate-400">{f.desc}</span>
                </div>
              );
            })}
          </div>

          {/* Quick Demo Accounts Selection */}
          <div className="p-5 rounded-3xl bg-[#0B1320]/80 border border-slate-800 backdrop-blur-md space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#00C896]" />
                Pilih Akun Demo Instan (1-Klik):
              </span>
              <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                <Lock className="w-3 h-3 text-[#00C896]" />
                Sandi Terlindungi
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {users.map((u) => {
                const badge = getRoleBadge(u.role);
                const storeName = stores.find((s) => s.id === u.storeId)?.name || 'Semua Cabang';
                const isSelected = identifier === u.username || identifier === u.email;

                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickLogin(u.username, u.password || 'admin123')}
                    className={`text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3.5 ${
                      isSelected
                        ? 'bg-emerald-950/50 border-[#00A876] shadow-md ring-1 ring-[#00A876]'
                        : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60 text-slate-300'
                    }`}
                  >
                    <img
                      src={u.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80'}
                      alt={u.name}
                      className="w-10 h-10 rounded-xl object-cover border border-slate-700 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-white truncate">{u.name.split('(')[0]}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">
                        @{u.username} &bull; <span className="text-slate-400">{storeName}</span>
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Side: High-End Glassmorphism Login Card */}
        <div className="lg:col-span-5 flex justify-center">
          <div className="w-full max-w-md bg-[#0D1829]/95 text-slate-100 rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-700/80 backdrop-blur-xl relative overflow-hidden">
            {/* Top Accent Line */}
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#00A876] via-teal-400 to-emerald-500" />

            <div className="mb-6 space-y-1">
              <h2 className="text-2xl font-black text-white tracking-tight">
                Masuk ke Aplikasi
              </h2>
              <p className="text-xs text-slate-400">
                Silakan masukkan nama pengguna atau email dan kata sandi Anda.
              </p>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
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
                    className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-700 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#00A876] bg-slate-900/90 placeholder-slate-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Kata Sandi
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Aman &amp; Terenkripsi
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
                    className="w-full pl-10 pr-11 py-3 rounded-2xl border border-slate-700 text-sm font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#00A876] bg-slate-900/90 placeholder-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="inline-flex items-center gap-2 text-slate-400 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="rounded text-[#00A876] focus:ring-[#00A876] w-4 h-4 bg-slate-900 border-slate-700"
                  />
                  <span>Ingat sesi login saya</span>
                </label>
              </div>

              <button
                type="submit"
                id="login-submit-btn"
                disabled={isLoading}
                className="w-full mt-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#00A876] to-[#008f65] hover:from-[#00C896] hover:to-[#00A876] text-white font-extrabold text-sm shadow-lg shadow-[#00A876]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Memverifikasi Akun...</span>
                  </>
                ) : (
                  <>
                    <span>Buka Sistem POS</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#00C896]" />
                {stores.length} Cabang Terhubung
              </span>
              <span className="text-[#00C896] font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Enkripsi TLS 1.3
              </span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto text-center relative z-10 text-xs text-slate-500 py-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p>&copy; {new Date().getFullYear()} {settings.name || 'Averion POS'} Enterprise. Hak cipta dilindungi undang-undang.</p>
        <p className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
          <span>Versi 3.5.0</span>
          <span>&bull;</span>
          <span>Database Lokal &amp; Cloud Ready</span>
        </p>
      </footer>
    </div>
  );
};


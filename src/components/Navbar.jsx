import React from 'react';
import {
  Home,
  BookOpen,
  Landmark,
  Users,
  ShieldCheck,
  LogIn,
  LogOut,
  WifiOff,
  Type,
  Languages,
} from 'lucide-react';
import { t } from '../utils/i18n';

export default function Navbar({
  activeTab,
  setActiveTab,
  lang,
  setLang,
  fontScale,
  setFontScale,
  currentUser,
  onOpenAuth,
  onLogout,
  pendingCount,
  isOffline,
}) {
  const navItems = [
    {
      id: 'feed',
      icon: Home,
      hi: 'चौपाल',
      hiFull: 'सामाजिक चौपाल',
      en: 'Feed',
    },
    {
      id: 'sahitya',
      icon: BookOpen,
      hi: 'भजन-आरती',
      hiFull: 'साहित्य एवं भजन',
      en: 'Bhajan & Aarti',
    },
    {
      id: 'itihas',
      icon: Landmark,
      hi: 'इतिहास',
      hiFull: 'इतिहास एवं गौरव',
      en: 'Heritage',
    },
    {
      id: 'directory',
      icon: Users,
      hi: 'निर्देशिका',
      hiFull: 'पदाधिकारी एवं कार्यक्रम',
      en: 'Directory',
    },
  ];

  const isAdmin = currentUser?.role === 'super_admin';

  const cycleFontScale = (dir) => {
    const steps = [0.95, 1, 1.12, 1.25];
    const idx = steps.indexOf(fontScale);
    const currentIdx = idx === -1 ? 1 : idx;
    const nextIdx = Math.max(0, Math.min(steps.length - 1, currentIdx + dir));
    setFontScale(steps[nextIdx]);
  };

  return (
    <>
      {/* Top Sticky Header (Mobile + Desktop) */}
      <header className="sticky top-0 z-40 bg-maroon-700/95 backdrop-blur-md text-cream-100 border-b-2 border-gold-500/70 shadow-lg">
        {isOffline && (
          <div className="bg-saffron-600 text-white text-xs py-1 px-3 flex items-center justify-center gap-1.5 font-medium">
            <WifiOff className="w-3.5 h-3.5" />
            {t(
              lang,
              'ऑफ़लाइन मोड सक्रिय — सहेजा गया डेटा उपलब्ध है',
              'Offline Mode Active — Cached content available'
            )}
          </div>
        )}

        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2">
          {/* Brand */}
          <button
            onClick={() => setActiveTab('feed')}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="w-10 h-10 rounded-full gold-border-gradient p-0.5 shadow-md shrink-0 group-hover:scale-105 transition-transform">
              <img
                src="/icons/icon-192.svg"
                alt="साहू समाज प्रतीक"
                className="w-full h-full rounded-full object-cover"
              />
            </div>
            <div className="leading-tight">
              <div className="font-bold text-base sm:text-lg tracking-wide text-gold-100 flex items-center gap-1.5">
                {t(lang, 'साहू समाज छत्तीसगढ़', 'Sahu Samaj Chhattisgarh')}
              </div>
              <div className="text-[11px] sm:text-xs text-gold-300/90 font-medium hidden xs:block">
                {t(lang, 'जय भक्त माता कर्मा • एकता, शिक्षा, सेवा', 'Jai Bhakt Maa Karma • Unity, Education, Service')}
              </div>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1" aria-label="Primary Navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                    active
                      ? 'bg-saffron-500 text-white shadow-md shadow-black/20'
                      : 'text-gold-100 hover:bg-maroon-800/80 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{t(lang, item.hiFull, item.en)}</span>
                </button>
              );
            })}
            {isAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === 'admin'
                    ? 'bg-gold-500 text-maroon-900 shadow-md'
                    : 'bg-maroon-800/70 text-gold-200 hover:bg-maroon-800 border border-gold-500/40'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{t(lang, 'एडमिन पैनल', 'Admin Panel')}</span>
                {pendingCount > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-saffron-500 text-white">
                    {pendingCount}
                  </span>
                )}
              </button>
            )}
          </nav>

          {/* Utility Controls: Font Scaling (for elderly readers), Language Toggle, Auth */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Elderly Font Scaling Control */}
            <div
              className="flex items-center bg-maroon-800/90 border border-gold-500/40 rounded-lg overflow-hidden"
              title={t(lang, 'अक्षर का आकार बदलें (वरिष्ठ पाठकों हेतु)', 'Adjust text size (for elderly readers)')}
            >
              <button
                onClick={() => cycleFontScale(-1)}
                disabled={fontScale <= 0.95}
                className="px-2 py-1.5 text-xs font-bold text-gold-100 hover:bg-maroon-900 disabled:opacity-40 transition-colors"
                aria-label="Decrease font size"
              >
                A-
              </button>
              <span className="px-1 text-[11px] text-gold-300 hidden sm:inline">
                <Type className="w-3.5 h-3.5 inline" />
              </span>
              <button
                onClick={() => cycleFontScale(1)}
                disabled={fontScale >= 1.25}
                className="px-2 py-1.5 text-xs font-bold text-gold-100 hover:bg-maroon-900 disabled:opacity-40 transition-colors"
                aria-label="Increase font size"
              >
                A+
              </button>
            </div>

            {/* Bilingual Toggle */}
            <button
              onClick={() => setLang(lang === 'hi' ? 'en' : 'hi')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-maroon-800/90 border border-gold-500/40 text-xs font-bold text-gold-100 hover:bg-saffron-600 hover:border-saffron-400 transition-colors"
              title={t(lang, 'भाषा बदलें (हिंदी / English)', 'Switch Language (Hindi / English)')}
            >
              <Languages className="w-3.5 h-3.5 text-gold-300" />
              <span>{lang === 'hi' ? 'EN' : 'हिंदी'}</span>
            </button>

            {/* User / Auth Button */}
            {currentUser ? (
              <div className="flex items-center gap-1.5">
                {isAdmin && (
                  <button
                    onClick={() => setActiveTab('admin')}
                    className="lg:hidden relative p-2 rounded-lg bg-gold-500 text-maroon-900 font-bold"
                    title={t(lang, 'एडमिन पैनल', 'Admin Panel')}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {pendingCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 text-[10px] rounded-full bg-saffron-600 text-white flex items-center justify-center">
                        {pendingCount}
                      </span>
                    )}
                  </button>
                )}
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gold-500/20 border border-gold-400/50 text-xs font-semibold text-gold-100 hover:bg-maroon-900 transition-colors"
                  title={t(lang, 'लॉग आउट करें', 'Sign Out')}
                >
                  <span className="hidden sm:inline max-w-[110px] truncate">
                    {lang === 'hi' ? currentUser.nameHi || currentUser.name : currentUser.name}
                  </span>
                  <LogOut className="w-3.5 h-3.5 text-gold-300" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-saffron-500 to-saffron-600 text-white text-xs sm:text-sm font-bold shadow hover:from-saffron-400 hover:to-saffron-500 transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{t(lang, 'जुड़ें', 'Join')}</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t-2 border-gold-400/70 shadow-[0_-4px_20px_rgba(128,0,0,0.12)] pb-[env(safe-area-inset-bottom)]"
        aria-label="Mobile Navigation"
      >
        <div className="grid grid-cols-5 h-16 max-w-lg mx-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors ${
                  active ? 'text-saffron-600' : 'text-stone-600 hover:text-maroon-700'
                }`}
              >
                <div
                  className={`p-1.5 rounded-xl transition-all ${
                    active ? 'bg-saffron-100 text-saffron-600 scale-105' : ''
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="truncate max-w-full px-1">{t(lang, item.hi, item.en)}</span>
              </button>
            );
          })}

          {/* 5th Tab: Admin Panel if Super Admin, else Member Login / Profile */}
          <button
            onClick={() => (isAdmin ? setActiveTab('admin') : onOpenAuth())}
            className={`relative flex flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors ${
              activeTab === 'admin' ? 'text-maroon-700' : 'text-stone-600 hover:text-maroon-700'
            }`}
          >
            <div
              className={`p-1.5 rounded-xl transition-all ${
                activeTab === 'admin'
                  ? 'bg-gold-200 text-maroon-800 scale-105'
                  : isAdmin
                  ? 'bg-gold-100/70 text-maroon-700'
                  : ''
              }`}
            >
              {isAdmin ? <ShieldCheck className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
            </div>
            <span className="truncate max-w-full px-1">
              {isAdmin
                ? t(lang, 'एडमिन', 'Admin')
                : currentUser
                ? t(lang, 'प्रोफ़ाइल', 'Profile')
                : t(lang, 'लॉगिन', 'Login')}
            </span>
            {isAdmin && pendingCount > 0 && (
              <span className="absolute top-1.5 right-3 min-w-[16px] h-4 px-1 rounded-full bg-saffron-600 text-white text-[10px] font-bold flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
        </div>
      </nav>
    </>
  );
}

import React, { useState } from 'react';
import {
  X,
  Mail,
  User,
  Phone,
  LogOut,
  ArrowRight,
  ShieldCheck,
  Send,
  Sparkles,
  CheckCircle2,
  Lock,
  UserCheck,
} from 'lucide-react';
import { useEthiopianSteel } from '../context/EthiopianSteelContext';

export const CustomerAuthModal: React.FC = () => {
  const {
    customer,
    loginWithTelegram,
    loginWithPhoneOrTelegram,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    logoutCustomer,
    isAuthModalOpen,
    setIsAuthModalOpen,
    lang,
    hapticFeedback,
    telegramUser,
    isTelegramNative,
    isAdmin,
    isStaffMode,
    setIsStaffMode,
    setActiveTab,
  } = useEthiopianSteel();

  // Tab mode for authentication: 'telegram' (1-tap/phone) | 'google' | 'email'
  const [activeLoginTab, setActiveLoginTab] = useState<'quick' | 'google' | 'email'>('quick');

  // Quick inputs
  const [quickInput, setQuickInput] = useState('');
  const [quickName, setQuickName] = useState('');

  // Email inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  // 1-Tap Telegram Login (uses native Telegram SDK or detected telegram user)
  const handleNativeTelegramLogin = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await loginWithTelegram();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Telegram login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Quick Login using Phone Number or Telegram Username
  const handleQuickSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickInput.trim()) {
      setErrorMessage(
        lang === 'am'
          ? 'እባክዎ ስልክ ቁጥር ወይም የቴሌግራም መለያ ያስገቡ'
          : 'Please enter your phone number or Telegram @username'
      );
      hapticFeedback('error');
      return;
    }
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const ok = await loginWithPhoneOrTelegram(quickInput, quickName);
      if (!ok) {
        setErrorMessage(lang === 'am' ? 'መግባት አልተሳካም' : 'Sign in failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Google Account 1-Tap Login
  const handleGoogleSignIn = async (chosenAccount?: { name: string; email: string; photo?: string }) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      if (chosenAccount) {
        await loginWithGoogle({
          name: chosenAccount.name,
          email: chosenAccount.email,
          photoUrl: chosenAccount.photo,
        });
      } else {
        await loginWithGoogle({
          name: quickName || name || 'Google Customer',
          email: email && email.includes('@') ? email : 'customer.ethiopiansteel@gmail.com',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Email/Password login
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!email || !email.includes('@')) {
      setErrorMessage(lang === 'am' ? 'እባክዎ ትክክለኛ ኢሜይል ያስገቡ' : 'Please enter a valid email address');
      hapticFeedback('error');
      return;
    }
    if (password.length < 6) {
      setErrorMessage(lang === 'am' ? 'የይለፍ ቃል ቢያንስ 6 ፊደላት መሆን አለበት' : 'Password must be at least 6 characters');
      hapticFeedback('error');
      return;
    }

    setIsSubmitting(true);
    try {
      if (authMode === 'login') {
        const ok = await loginWithEmail(email, password, name, phone);
        if (!ok) setErrorMessage(lang === 'am' ? 'መግባት አልተሳካም' : 'Sign in failed');
      } else {
        const ok = await registerWithEmail(email, password, name, phone);
        if (!ok) setErrorMessage(lang === 'am' ? 'መመዝገብ አልተሳካም' : 'Registration failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="customer-auth-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        className="w-full max-w-md bg-[#101e2f] border border-[#4a8ac7]/40 rounded-3xl p-5 shadow-2xl text-white relative max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={() => {
            hapticFeedback('light');
            setIsAuthModalOpen(false);
          }}
          className="absolute top-4 right-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {customer.isLoggedIn ? (
          /* Logged-In Profile View */
          <div className="flex flex-col gap-4 py-1">
            <div className="flex items-center gap-3">
              <div className="w-13 h-13 rounded-2xl bg-gradient-to-br from-[#4a8ac7] to-[#17304a] flex items-center justify-center text-xl font-black border-2 border-[#fdc672] shadow-md text-[#fdc672]">
                {customer.photoUrl ? (
                  <img
                    src={customer.photoUrl}
                    alt={customer.name}
                    className="w-full h-full rounded-2xl object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : customer.authProvider === 'telegram' ? (
                  <Send className="w-6 h-6 text-white" />
                ) : (
                  (customer.name || customer.email || 'U')[0].toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-base font-bold text-white truncate">
                    {customer.name || 'Valued Customer'}
                  </h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#fdc672]/20 text-[#fdc672] border border-[#fdc672]/40 font-bold uppercase">
                    {customer.authProvider}
                  </span>
                </div>
                {customer.telegramUsername && (
                  <p className="text-xs text-[#fdc672] font-mono font-semibold">{customer.telegramUsername}</p>
                )}
                {customer.phone && <p className="text-xs text-white/70 font-mono">{customer.phone}</p>}
                {customer.email && !customer.email.includes('@telegram.org') && (
                  <p className="text-xs text-white/50 truncate">{customer.email}</p>
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0f1d2e] border border-[#4a8ac7]/30 flex items-start gap-2.5 text-xs text-white/90">
              <ShieldCheck className="w-4 h-4 text-[#fdc672] flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#fdc672] block mb-0.5">
                  {lang === 'am' ? 'የትዕዛዝ መረጃዎች ተያይዘዋል' : 'Order Ingredients Connected'}
                </span>
                <span className="text-[11px] text-white/70">
                  {lang === 'am'
                    ? 'አዲሶቹ ትዕዛዞችዎ እና የስሌት ውጤቶችዎ በቀጥታ በስምዎ፣ በቴሌግራምዎ እና በስልክዎ ይዘጋጃሉ።'
                    : 'Your name, Telegram handle, and phone are automatically injected into the Order Builder and Roof Calculator.'}
                </span>
              </div>
            </div>

            {/* Admin / Staff Controls (Only visible to verified Admins) */}
            {isAdmin && (
              <div className="p-3 rounded-2xl bg-[#fdc672]/10 border border-[#fdc672]/40 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-black text-[#fdc672]">
                    <UserCheck className="w-4 h-4" />
                    <span>{lang === 'am' ? 'የአስተዳዳሪ ሁኔታ (Admin Privileges)' : 'Admin Privileges Active'}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#fdc672] text-[#0f1d2e] font-black uppercase">
                    Admin
                  </span>
                </div>
                <p className="text-[11px] text-white/70">
                  {lang === 'am'
                    ? 'ትዕዛዞችን ለመከታተል፣ ዋጋ በብር ለመስጠት እና የመጋዘን ክምችት ለማስተካከል የሰራተኛ ዳሽቦርድን ይክፈቱ።'
                    : 'Access the factory dashboard to manage orders, quote prices in ETB, and update warehouse stock.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    hapticFeedback('medium');
                    setIsStaffMode(!isStaffMode);
                    if (!isStaffMode) {
                      setActiveTab('staff');
                    }
                    setIsAuthModalOpen(false);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-[#fdc672] text-[#0f1d2e] font-black text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>
                    {isStaffMode
                      ? lang === 'am' ? 'የሰራተኛ ዳሽቦርድ ዝጋ' : 'Deactivate Staff Mode'
                      : lang === 'am' ? 'የሰራተኛ ዳሽቦርድ ክፈት' : 'Open Staff Orders & Quotes'}
                  </span>
                </button>
              </div>
            )}

            <button
              onClick={() => {
                logoutCustomer();
                setIsAuthModalOpen(false);
              }}
              className="mt-2 w-full py-2.5 px-4 rounded-xl bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <LogOut className="w-4 h-4" />
              <span>{lang === 'am' ? 'ከአካውንት ይውጡ' : 'Sign Out'}</span>
            </button>
          </div>
        ) : (
          /* Zero-Friction Authentication View */
          <div className="flex flex-col gap-4">
            {/* Header */}
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#4a8ac7]/20 text-[#fdc672] border border-[#4a8ac7]/40">
                  {lang === 'am' ? 'ፈጣን መግቢያ' : 'Zero-Friction Login'}
                </span>
              </div>
              <h3 className="text-lg font-black text-white mt-1">
                {lang === 'am' ? 'የደንበኛ መግቢያ (Customer Login)' : 'Customer Sign In'}
              </h3>
              <p className="text-xs text-white/70 mt-0.5">
                {lang === 'am'
                  ? 'ያለ የይለፍ ቃል (Password) በቴሌግራም፣ በስልክ ቁጥር ወይም በGoogle በቀላሉ ይግቡ።'
                  : 'Sign in effortlessly via Telegram, Phone Number, or Google with no password needed.'}
              </p>
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-semibold">
                {errorMessage}
              </div>
            )}

            {/* Login Method Tabs */}
            <div className="grid grid-cols-3 gap-1 p-1 bg-[#0f1d2e] rounded-2xl border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => {
                  hapticFeedback('light');
                  setActiveLoginTab('quick');
                  setErrorMessage(null);
                }}
                className={`py-2 px-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all ${
                  activeLoginTab === 'quick'
                    ? 'bg-[#4a8ac7] text-white shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>{lang === 'am' ? 'ቴሌግራም / ስልክ' : 'Telegram / Phone'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  hapticFeedback('light');
                  setActiveLoginTab('google');
                  setErrorMessage(null);
                }}
                className={`py-2 px-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all ${
                  activeLoginTab === 'google'
                    ? 'bg-[#4a8ac7] text-white shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  hapticFeedback('light');
                  setActiveLoginTab('email');
                  setErrorMessage(null);
                }}
                className={`py-2 px-2 rounded-xl font-bold flex items-center justify-center gap-1 transition-all ${
                  activeLoginTab === 'email'
                    ? 'bg-[#4a8ac7] text-white shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{lang === 'am' ? 'ኢሜይል' : 'Email'}</span>
              </button>
            </div>

            {/* TAB 1: TELEGRAM & PHONE QUICK LOGIN */}
            {activeLoginTab === 'quick' && (
              <div className="flex flex-col gap-3">
                {/* 1-Tap Continue with Telegram Button */}
                <button
                  type="button"
                  id="telegram-quick-login-btn"
                  onClick={handleNativeTelegramLogin}
                  disabled={isSubmitting}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#4a8ac7] to-[#3a72a8] hover:from-[#3a72a8] hover:to-[#2a5b8a] active:scale-[0.98] transition-all text-white font-bold text-xs flex items-center justify-between shadow-lg shadow-[#4a8ac7]/20 border border-white/20"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center">
                      <Send className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <span className="block font-bold">
                        {telegramUser?.username
                          ? lang === 'am'
                            ? `እንደ @${telegramUser.username.replace('@', '')} ይቀጥሉ`
                            : `Continue as @${telegramUser.username.replace('@', '')}`
                          : lang === 'am'
                          ? 'በቴሌግራም አካውንት በ1-ክሊክ ይግቡ'
                          : '1-Tap Telegram Instant Login'}
                      </span>
                      <span className="text-[10px] text-white/70 block">
                        {lang === 'am' ? 'ምንም የይለፍ ቃል አያስፈልግም' : 'Auto-syncs order contact & username'}
                      </span>
                    </div>
                  </div>
                  <Sparkles className="w-4 h-4 text-[#fdc672] animate-pulse" />
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 my-0.5">
                  <div className="h-px bg-white/10 flex-1" />
                  <span className="text-[10px] uppercase tracking-wider text-white/40 font-bold">
                    {lang === 'am' ? 'ወይም በስልክ ቁጥር / መለያ' : 'Or Type Phone / @Username'}
                  </span>
                  <div className="h-px bg-white/10 flex-1" />
                </div>

                {/* Direct Phone or @username login form */}
                <form onSubmit={handleQuickSubmit} className="flex flex-col gap-2.5">
                  <div>
                    <label className="text-[11px] font-bold text-white/70">
                      {lang === 'am' ? 'ስልክ ቁጥር ወይም ቴሌግራም (@username):' : 'Phone Number or Telegram Handle:'}
                    </label>
                    <div className="relative mt-1">
                      <Phone className="w-4 h-4 text-[#fdc672] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="quick-phone-tg-input"
                        type="text"
                        required
                        value={quickInput}
                        onChange={e => setQuickInput(e.target.value)}
                        placeholder="e.g. 0911223344 or @durov"
                        className="w-full pl-9 pr-3 py-2.5 bg-[#0f1d2e] border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:border-[#4a8ac7] focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-white/70">
                      {lang === 'am' ? 'ስምዎ (አማራጭ):' : 'Your Name (Optional):'}
                    </label>
                    <div className="relative mt-1">
                      <User className="w-4 h-4 text-[#fdc672] absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        id="quick-name-input"
                        type="text"
                        value={quickName}
                        onChange={e => setQuickName(e.target.value)}
                        placeholder="e.g. Abebe Kebede"
                        className="w-full pl-9 pr-3 py-2.5 bg-[#0f1d2e] border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:border-[#4a8ac7] focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#fdc672] hover:bg-[#e5b05a] active:scale-[0.98] transition-all text-[#0b1522] text-xs font-black flex items-center justify-center gap-1.5 shadow-md mt-1"
                  >
                    <span>{lang === 'am' ? 'ቀጥታ ይግቡ (Sign In)' : 'Continue to Orders'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}

            {/* TAB 2: GOOGLE 1-TAP ACCOUNT PICKER */}
            {activeLoginTab === 'google' && (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-white/70">
                  {lang === 'am'
                    ? 'ከታች ካሉት የተከፈቱ የGoogle አካውንቶች አንዱን በመምረጥ ወዲያውኑ ይግቡ፡'
                    : 'Select your active Google account to sign in with 1 click:'}
                </p>

                {/* Ready Google Account Cards */}
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleGoogleSignIn({
                        name: 'Abebe Kebede',
                        email: 'abebe.kebede@gmail.com',
                        photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
                      })
                    }
                    className="p-3 rounded-2xl bg-[#0f1d2e] hover:bg-[#15273d] border border-white/10 hover:border-[#4a8ac7]/60 transition-all flex items-center justify-between text-left group active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#4a8ac7]/20 border border-[#4a8ac7]/50 flex items-center justify-center text-sm font-bold text-[#fdc672]">
                        A
                      </div>
                      <div>
                        <span className="text-xs font-bold text-white block">Abebe Kebede</span>
                        <span className="text-[11px] text-white/50 block">abebe.kebede@gmail.com</span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-white/5 text-[#fdc672] group-hover:bg-[#fdc672] group-hover:text-[#0b1522] transition-all">
                      {lang === 'am' ? 'ምረጥ' : 'Select'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleGoogleSignIn()}
                    className="w-full py-3 px-4 rounded-2xl bg-white text-zinc-900 hover:bg-zinc-100 active:scale-[0.98] transition-all font-bold text-xs flex items-center justify-center gap-2.5 shadow-md border border-zinc-200 mt-1"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.26 21.36 7.33 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.99 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span>{lang === 'am' ? 'በሌላ የGoogle አካውንት ይቀጥሉ' : 'Continue with another Google Account'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: TRADITIONAL EMAIL / PASSWORD */}
            {activeLoginTab === 'email' && (
              <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3">
                {authMode === 'register' && (
                  <>
                    <div>
                      <label className="text-[11px] font-bold text-white/70 uppercase">
                        {lang === 'am' ? 'ሙሉ ስም' : 'Full Name'}
                      </label>
                      <div className="relative mt-1">
                        <User className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="e.g. Abebe Kebede"
                          value={name}
                          onChange={e => setName(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-[#0f1d2e] border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:border-[#4a8ac7] focus:outline-hidden"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-white/70 uppercase">
                        {lang === 'am' ? 'ስልክ ቁጥር' : 'Phone Number'}
                      </label>
                      <div className="relative mt-1">
                        <Phone className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="tel"
                          placeholder="09... / 07..."
                          value={phone}
                          onChange={e => setPhone(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-[#0f1d2e] border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:border-[#4a8ac7] focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="text-[11px] font-bold text-white/70 uppercase">
                    {lang === 'am' ? 'የኢሜይል አድራሻ' : 'Email Address'}
                  </label>
                  <div className="relative mt-1">
                    <Mail className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      placeholder="customer@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[#0f1d2e] border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:border-[#4a8ac7] focus:outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-white/70 uppercase">
                    {lang === 'am' ? 'የይለፍ ቃል (Password)' : 'Password'}
                  </label>
                  <div className="relative mt-1">
                    <Lock className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-[#0f1d2e] border border-white/10 rounded-xl text-xs text-white placeholder-white/30 focus:border-[#4a8ac7] focus:outline-hidden"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-1 w-full py-2.5 px-4 rounded-xl bg-[#4a8ac7] hover:bg-[#3a72a8] active:scale-[0.98] transition-all text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md"
                >
                  <span>
                    {authMode === 'login'
                      ? lang === 'am'
                        ? 'በኢሜይል ይግቡ'
                        : 'Sign In with Email'
                      : lang === 'am'
                      ? 'አካውንት ይፍጠሩ'
                      : 'Register Account'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#fdc672]" />
                </button>

                <div className="text-center pt-1 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      hapticFeedback('light');
                      setAuthMode(authMode === 'login' ? 'register' : 'login');
                      setErrorMessage(null);
                    }}
                    className="text-xs text-[#fdc672] hover:underline font-semibold"
                  >
                    {authMode === 'login'
                      ? lang === 'am'
                        ? 'አዲስ ደንበኛ ኖት? እዚህ ተመዝገቡ'
                        : "Don't have an account? Create one"
                      : lang === 'am'
                      ? 'አካውንት አለዎት? እዚህ ይግቡ'
                      : 'Already have an account? Sign In'}
                  </button>
                </div>
              </form>
            )}

            {/* Security Guarantee */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/5 text-[11px] text-white/50">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>
                {lang === 'am'
                  ? 'የእርስዎ ስልክ እና የቴሌግራም መረጃ ለትዕዛዝ ማረጋገጫ ብቻ ያገለግላል።'
                  : 'Your contact data is strictly used for order validation and factory dispatch.'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

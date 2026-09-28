import React from 'react';
import { Phone, Globe, User, LogIn, UserCheck } from 'lucide-react';
import { useEthiopianSteel } from '../context/EthiopianSteelContext';

export const EthiopianSteelHeader: React.FC = () => {
  const { lang, toggleLang, isStaffMode, setIsStaffMode, isAdmin, customer, setIsAuthModalOpen, hapticFeedback } =
    useEthiopianSteel();

  return (
    <header
      id="ethiopian-steel-header"
      className="sticky top-0 z-30 flex items-center justify-between px-3.5 py-2.5 bg-[#0f1d2e]/95 backdrop-blur-md border-b border-[#4a8ac7]/20 text-white select-none shadow-md"
    >
      {/* Brand & Factory Emblem */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="relative flex-shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#fdc672] via-[#e5b05a] to-[#b37a1f] flex items-center justify-center font-bold text-lg shadow-md ring-2 ring-[#fdc672]/60">
            🦁
          </div>
          <span
            className="absolute -bottom-1 -right-1 px-1 py-0.5 bg-[#4a8ac7] text-white text-[8px] font-black rounded-full ring-1 ring-[#0f1d2e] shadow-xs"
            title="28 Years Quality"
          >
            28y
          </span>
        </div>

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <h1 className="text-xs font-black tracking-tight text-white truncate">
              {lang === 'am' ? 'ኢትዮጵያን ስቲል' : 'Ethiopian Steel'}
            </h1>
            <span className="text-[9px] bg-[#fdc672]/20 text-[#fdc672] border border-[#fdc672]/30 px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
              {lang === 'am' ? 'መደበኛ ቆርቆሮ' : 'Normal Corrugated'}
            </span>
          </div>
          <span className="text-[10px] text-white/70 truncate flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#fdc672] inline-block" />
            {lang === 'am' ? 'ከፋብሪካው በቀጥታ' : 'Direct from Factory'}
          </span>
        </div>
      </div>

      {/* Right Action Controls: Customer Account Login, Call, Staff toggle, Language */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Customer Login / Account Button */}
        <button
          type="button"
          id="header-customer-auth-btn"
          onClick={() => {
            hapticFeedback('medium');
            setIsAuthModalOpen(true);
          }}
          className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all ${
            customer.isLoggedIn
              ? 'bg-[#fdc672]/20 border-[#fdc672]/40 text-[#fdc672]'
              : 'bg-[#4a8ac7]/20 border-[#4a8ac7]/50 text-white hover:bg-[#4a8ac7]/30'
          }`}
          title={customer.isLoggedIn ? customer.email || customer.name : 'Sign In'}
        >
          {customer.isLoggedIn ? (
            <>
              <div className="w-4 h-4 rounded-full bg-[#fdc672] text-[#0f1d2e] font-black text-[9px] flex items-center justify-center">
                {(customer.name || customer.email || 'U')[0].toUpperCase()}
              </div>
              <span className="max-w-[65px] truncate font-medium">
                {customer.name?.split(' ')[0] || 'Account'}
              </span>
            </>
          ) : (
            <>
              <User className="w-3.5 h-3.5 text-[#fdc672]" />
              <span>{lang === 'am' ? 'ግባ' : 'Login'}</span>
            </>
          )}
        </button>

        {/* Direct Call to Factory */}
        <a
          href="tel:+251114342200"
          onClick={() => hapticFeedback('light')}
          className="p-1.5 rounded-xl bg-[#4a8ac7]/20 text-[#fdc672] hover:bg-[#4a8ac7]/35 active:scale-95 transition-all flex items-center justify-center border border-[#4a8ac7]/40"
          title={lang === 'am' ? 'ወደ ፋብሪካው ይደውሉ' : 'Call Factory'}
        >
          <Phone className="w-4 h-4 text-white" />
        </a>

        {/* Staff Mode Toggle (Authorized Admins / Bot Owners Only) */}
        {isAdmin && (
          <button
            onClick={() => {
              hapticFeedback('medium');
              setIsStaffMode(!isStaffMode);
            }}
            className={`p-1.5 rounded-xl text-xs font-medium border transition-all flex items-center gap-1 ${
              isStaffMode
                ? 'bg-[#fdc672] text-[#0f1d2e] border-[#fdc672] font-black shadow-sm'
                : 'bg-white/5 border-white/10 text-white/60 hover:text-white'
            }`}
            title="Toggle Staff Orders Dashboard"
          >
            <UserCheck className="w-4 h-4" />
          </button>
        )}

        {/* Bilingual Language Switcher (Amharic / English) */}
        <button
          id="lang-toggle-btn"
          onClick={toggleLang}
          className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#4a8ac7] hover:bg-[#3a72a8] border border-white/20 text-white text-xs font-black active:scale-95 transition-all shadow-sm"
          title="Switch Language"
        >
          <Globe className="w-3.5 h-3.5 text-[#fdc672]" />
          <span>{lang === 'am' ? 'EN' : 'አማ'}</span>
        </button>
      </div>
    </header>
  );
};


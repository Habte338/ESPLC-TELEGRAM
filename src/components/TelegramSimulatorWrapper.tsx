import React, { useState } from 'react';
import {
  Smartphone,
  Monitor,
  ShieldCheck,
  MoreVertical,
  Wifi,
  Battery,
  SlidersHorizontal,
  X,
  Copy,
  Check,
} from 'lucide-react';
import { useEthiopianSteel } from '../context/EthiopianSteelContext';

interface TelegramSimulatorWrapperProps {
  children: React.ReactNode;
}

export const TelegramSimulatorWrapper: React.FC<TelegramSimulatorWrapperProps> = ({ children }) => {
  const { isTelegramNative, simulatorFrame, toggleSimulatorFrame, lang, hapticFeedback } =
    useEthiopianSteel();
  const [showBotFatherModal, setShowBotFatherModal] = useState(false);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);

  const copyCommand = (cmd: string) => {
    hapticFeedback('medium');
    navigator.clipboard?.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  // If running inside real Telegram client or user disabled simulator frame:
  if (isTelegramNative || !simulatorFrame) {
    return (
      <div className="min-h-screen w-full bg-[#17212b] text-white flex flex-col justify-between">
        {!isTelegramNative && (
          <div className="fixed bottom-20 right-3 z-50">
            <button
              onClick={toggleSimulatorFrame}
              className="px-3 py-1.5 rounded-full bg-[#2481cc] text-white text-xs font-semibold shadow-lg hover:bg-[#2481cc]/90 flex items-center gap-1.5 backdrop-blur-md opacity-90 hover:opacity-100 transition-opacity active:scale-95"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{lang === 'am' ? 'የስልክ እይታ' : 'Phone Simulator'}</span>
            </button>
          </div>
        )}
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0e1621] flex flex-col items-center justify-center p-2 sm:p-4 text-white select-none">
      {/* Top Desktop Controls Bar */}
      <div className="w-full max-w-md flex items-center justify-between px-2 pb-2.5 text-xs text-white/60">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-white/80">
            <Smartphone className="w-3.5 h-3.5 text-[#2481cc]" />
            <span>Telegram WebApp Simulator</span>
          </span>
          <span className="text-[10px] bg-emerald-500/15 text-emerald-300 font-bold px-1.5 py-0.5 rounded">
            v7.10 Ready
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleSimulatorFrame}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-all flex items-center gap-1 text-[11px]"
            title="Expand to Fullscreen View"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{lang === 'am' ? 'ሙሉ ስክሪን' : 'Fullscreen'}</span>
          </button>

          <button
            onClick={() => setShowBotFatherModal(true)}
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-all flex items-center gap-1 text-[11px]"
            title="BotFather Integration Guide"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">BotFather</span>
          </button>
        </div>
      </div>

      {/* Simulated Phone Shell */}
      <div className="relative w-full max-w-[400px] h-[830px] max-h-[92vh] bg-[#17212b] rounded-[44px] ring-1 ring-white/15 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden border-[8px] border-[#242f3d]">
        {/* Dynamic Island Notch */}
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-40 flex items-center justify-center pointer-events-none">
          <div className="w-24 h-4 bg-black rounded-full flex items-center justify-end px-2 gap-1.5">
            <span className="w-2 h-2 rounded-full bg-zinc-800" />
            <span className="w-1.5 h-1.5 rounded-full bg-blue-900/60" />
          </div>
        </div>

        {/* Telegram Header */}
        <div className="relative z-30 pt-2 px-5 pb-1 bg-[#17212b] border-b border-white/5 flex flex-col select-none">
          {/* Status Bar */}
          <div className="flex items-center justify-between text-[11px] font-semibold text-white/90 pt-1 pb-1">
            <span>9:41</span>
            <div className="flex items-center gap-1.5 text-white/80">
              <Wifi className="w-3 h-3" />
              <span className="text-[10px]">5G</span>
              <Battery className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Telegram In-App Header */}
          <div className="flex items-center justify-between py-1.5">
            <button
              onClick={() => hapticFeedback('light')}
              className="text-[#6ab3f3] text-xs font-semibold hover:underline"
            >
              Close
            </button>

            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1">
                <span className="text-xs font-bold tracking-tight">Ethiopian Steel PLC</span>
                <ShieldCheck className="w-3 h-3 text-[#6ab3f3]" />
              </div>
              <span className="text-[9px] text-white/40">bot</span>
            </div>

            <button
              onClick={() => setShowBotFatherModal(true)}
              className="text-white/60 hover:text-white p-1"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mini App Content Viewport */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col justify-between bg-[#17212b]">
          {children}
        </div>

        {/* iOS Home Indicator */}
        <div className="h-4 bg-[#17212b] flex items-center justify-center pb-1 select-none">
          <div className="w-28 h-1 bg-white/30 rounded-full" />
        </div>
      </div>

      {/* BotFather Integration Modal */}
      {showBotFatherModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#17212b] border border-white/10 rounded-2xl max-w-sm w-full p-4 flex flex-col gap-3 text-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h3 className="font-bold text-sm">BotFather Mini App Setup</h3>
              <button
                onClick={() => setShowBotFatherModal(false)}
                className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-white/70 leading-relaxed">
              To attach this Mini App to your Telegram Bot (like the Ethiopian Steel bot), configure BotFather:
            </p>

            <div className="flex flex-col gap-2 text-xs">
              <div className="bg-[#0e1621] p-2.5 rounded-xl border border-white/5 flex flex-col gap-1">
                <span className="text-[10px] text-white/50">1. Set Menu Button in @BotFather</span>
                <div className="flex items-center justify-between font-mono text-[#6ab3f3]">
                  <span>/setmenubutton</span>
                  <button
                    onClick={() => copyCommand('/setmenubutton')}
                    className="p-1 hover:text-white"
                  >
                    {copiedCmd === '/setmenubutton' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="bg-[#0e1621] p-2.5 rounded-xl border border-white/5 flex flex-col gap-1">
                <span className="text-[10px] text-white/50">2. Set WebApp URL</span>
                <div className="flex items-center justify-between font-mono text-[11px] text-amber-300">
                  <span className="truncate">Enter this app preview URL</span>
                  <button
                    onClick={() => copyCommand(window.location.origin)}
                    className="p-1 hover:text-white flex-shrink-0"
                  >
                    {copiedCmd === window.location.origin ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowBotFatherModal(false)}
              className="w-full py-2 rounded-xl bg-[#2481cc] text-white font-bold text-xs"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { useEthiopianSteel } from '../context/EthiopianSteelContext';
import { Sparkles, Layers } from 'lucide-react';

export const RoofVisualizer: React.FC = () => {
  const { currentProduct, currentGauge, currentColor, lang } = useEthiopianSteel();

  return (
    <div
      id="roof-visualizer"
      className="relative overflow-hidden rounded-2xl bg-[#0f1d2e] border border-[#4a8ac7]/30 p-3.5 shadow-md flex flex-col gap-2.5 select-none"
    >
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-[#fdc672]" />
          <span className="text-[11px] font-bold tracking-wider text-white uppercase">
            {lang === 'am' ? 'የጣራው ቅድመ-ዕይታ' : 'Roof Profile Preview'}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/15">
            {currentGauge.label}
          </span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#fdc672] text-[#0b1522] border border-[#fdc672]">
            {lang === 'am' ? currentColor.nameAm.split(' ')[1] : currentColor.nameEn}
          </span>
        </div>
      </div>

      {/* Visual Canvas of the Roofing Profile */}
      <div
        className="relative w-full h-28 rounded-xl overflow-hidden shadow-inner border border-black/30 flex items-center justify-center"
        style={{
          backgroundColor: currentColor.hex,
          backgroundImage:
            currentProduct.patternType === 'tile'
              ? `repeating-linear-gradient(90deg, transparent, transparent 28px, rgba(0,0,0,0.22) 28px, rgba(0,0,0,0.22) 30px),
                 repeating-linear-gradient(0deg, rgba(255,255,255,0.18) 0px, transparent 10px, rgba(0,0,0,0.3) 24px)`
              : currentProduct.patternType === 'ribbed'
              ? `repeating-linear-gradient(90deg, rgba(0,0,0,0.3) 0px, rgba(0,0,0,0.05) 12px, rgba(255,255,255,0.25) 20px, rgba(0,0,0,0.35) 28px)`
              : currentProduct.patternType === 'corrugated'
              ? `repeating-linear-gradient(90deg, rgba(0,0,0,0.3) 0px, rgba(255,255,255,0.15) 8px, rgba(0,0,0,0.35) 16px)`
              : `repeating-linear-gradient(90deg, rgba(0,0,0,0.2) 0px, rgba(255,255,255,0.2) 16px, rgba(0,0,0,0.25) 32px)`,
        }}
      >
        {/* Soft lighting gloss reflection */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-white/25 pointer-events-none" />

        {/* Center Emblem/Title Watermark */}
        <div className="relative z-10 flex flex-col items-center justify-center p-2 rounded-xl bg-black/40 backdrop-blur-xs border border-white/20 text-center shadow-lg max-w-[85%]">
          <div className="flex items-center gap-1.5">
            <span className="text-base">{currentProduct.icon}</span>
            <span className="text-xs font-black text-white tracking-wide">
              {lang === 'am' ? currentProduct.nameAm : currentProduct.nameEn}
            </span>
          </div>
          <span className="text-[10px] text-white/80 font-medium">
            {lang === 'am' ? currentProduct.taglineAm : currentProduct.taglineEn}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-white/60 px-1">
        <span>{lang === 'am' ? 'ምርጥ ምርጫ:' : 'Best for:'}</span>
        <span className="font-semibold text-white/90">
          {lang === 'am' ? currentProduct.idealForAm : currentProduct.idealForEn}
        </span>
      </div>
    </div>
  );
};

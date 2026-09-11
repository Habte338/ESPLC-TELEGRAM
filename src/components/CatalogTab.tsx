import React from 'react';
import { Layers, CheckCircle2, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import { useEthiopianSteel } from '../context/EthiopianSteelContext';
import { STEEL_PRODUCTS } from '../data/ethiopianSteelData';
import { RoofingProduct } from '../types/ethiopianSteel';

export const CatalogTab: React.FC = () => {
  const { lang, setSelectedProductId, setActiveTab, hapticFeedback } = useEthiopianSteel();

  const handleSelectProduct = (product: RoofingProduct) => {
    hapticFeedback('medium');
    setSelectedProductId(product.id);
    setActiveTab('order');
  };

  return (
    <div id="tg-catalog-tab" className="flex flex-col gap-4 p-3.5 pb-24 text-white">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-black text-white flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-[#fdc672]" />
          <span>{lang === 'am' ? 'የጣራ ምርቶች ካታሎግ' : 'Roofing Products Catalog'}</span>
        </h2>
        <p className="text-xs text-white/70">
          {lang === 'am'
            ? 'የ28 ዓመታት የታመነ ጥራት - በቀጥታ ከፋብሪካው ለቪላ፣ ለመኖሪያ፣ ለኢንዱስትሪና ለመጋዘን'
            : '28 Years of Trusted Quality - Direct from factory for villas, residences, industries and warehouses'}
        </p>
      </div>

      <div className="flex flex-col gap-3.5">
        {STEEL_PRODUCTS.map(product => (
          <div
            key={product.id}
            id={`catalog-item-${product.id}`}
            className="rounded-2xl bg-[#0f1d2e] border border-[#4a8ac7]/30 overflow-hidden shadow-md hover:border-[#fdc672] transition-all flex flex-col"
          >
            {/* Header pattern banner */}
            <div className="bg-gradient-to-r from-[#17304a] to-[#0f1d2e] p-3.5 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <span className="text-3xl">{product.icon}</span>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    {lang === 'am' ? product.nameAm : product.nameEn}
                  </h3>
                  <span className="text-[10px] text-[#fdc672] font-semibold">
                    {lang === 'am' ? product.taglineAm : product.taglineEn}
                  </span>
                </div>
              </div>

              <span className="text-[10px] bg-white/10 border border-white/10 px-2 py-0.5 rounded-full font-mono text-white/80">
                {product.recommendedGauge}
              </span>
            </div>

            {/* Body */}
            <div className="p-3.5 flex flex-col gap-3">
              <p className="text-xs text-white/80 leading-relaxed">
                {lang === 'am' ? product.descriptionAm : product.descriptionEn}
              </p>

              <div className="p-2.5 rounded-xl bg-[#0b1624] border border-white/5 flex items-center justify-between text-xs">
                <span className="text-[11px] text-white/50">{lang === 'am' ? 'ተስማሚ ነው ለ:' : 'Ideal for:'}</span>
                <span className="font-bold text-[#fdc672] text-right text-[11px]">
                  {lang === 'am' ? product.idealForAm : product.idealForEn}
                </span>
              </div>

              <button
                id={`choose-catalog-${product.id}`}
                onClick={() => handleSelectProduct(product)}
                className="w-full py-2.5 px-3 rounded-xl bg-[#4a8ac7] hover:bg-[#3a72a8] border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm"
              >
                <span>{lang === 'am' ? 'ይህንን ምርት ይዘዙ' : 'Order this Profile'}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#fdc672]" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

import React from 'react';
import { MapPin, Phone, Clock, ExternalLink, Globe, Factory, Building2 } from 'lucide-react';
import { useEthiopianSteel } from '../context/EthiopianSteelContext';
import { SHOWROOMS, COMPANY_INFO } from '../data/ethiopianSteelData';

export const LocationsTab: React.FC = () => {
  const { lang, hapticFeedback } = useEthiopianSteel();

  return (
    <div id="tg-locations-tab" className="flex flex-col gap-4 p-3.5 pb-24 text-white">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-black text-white flex items-center gap-1.5">
          <MapPin className="w-4 h-4 text-[#fdc672]" />
          <span>{lang === 'am' ? 'ፋብሪካ እና ሾውሩሞች' : 'Factory & Showrooms'}</span>
        </h2>
        <p className="text-xs text-white/70">
          {lang === 'am'
            ? 'በአካል በመገኘት ማዘዝ ወይም ናሙናዎችን መመልከት ይችላሉ'
            : 'Visit in person for sample viewings or direct factory pickup'}
        </p>
      </div>

      {/* Locations List */}
      <div className="flex flex-col gap-3">
        {SHOWROOMS.map(item => (
          <div
            key={item.id}
            className="rounded-2xl bg-[#0f1d2e] border border-[#4a8ac7]/30 p-4 shadow-md flex flex-col gap-3 hover:border-[#fdc672] transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#4a8ac7]/20 border border-[#4a8ac7]/40 text-[#fdc672] flex items-center justify-center font-bold">
                  {item.type === 'factory' ? <Factory className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-bold text-xs text-white">
                    {lang === 'am' ? item.titleAm : item.titleEn}
                  </h3>
                  <span className="text-[10px] text-white/60">
                    {lang === 'am' ? item.addressAm : item.addressEn}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-[#0b1624] border border-white/5 flex flex-col gap-1.5 text-xs">
              <div className="flex items-start gap-1.5 text-white/80">
                <MapPin className="w-3.5 h-3.5 text-[#fdc672] flex-shrink-0 mt-0.5" />
                <span className="text-[11px] leading-relaxed">
                  {lang === 'am' ? item.landmarkAm : item.landmarkEn}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <a
                href={`tel:${item.phone.replace(/\s/g, '')}`}
                onClick={() => hapticFeedback('light')}
                className="flex-1 py-2 px-3 rounded-xl bg-[#4a8ac7] hover:bg-[#3a72a8] border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-sm"
              >
                <Phone className="w-3.5 h-3.5 text-[#fdc672]" />
                <span>{item.phone}</span>
              </a>

              <a
                href={item.mapsUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => hapticFeedback('light')}
                className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/80 hover:text-white text-xs flex items-center justify-center gap-1 active:scale-95 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5 text-[#fdc672]" />
                <span>Maps</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Business Hours & Web link */}
      <div className="rounded-2xl bg-gradient-to-br from-[#17304a] to-[#0f1d2e] border border-[#4a8ac7]/40 p-3.5 flex flex-col gap-2.5 text-xs">
        <div className="flex items-center gap-2 text-[#fdc672] font-bold">
          <Clock className="w-4 h-4" />
          <span>{lang === 'am' ? 'የስራ ሰዓት' : 'Business Hours'}</span>
        </div>
        <p className="text-white/85 text-[11px] leading-relaxed">
          {lang === 'am' ? COMPANY_INFO.workingHoursAm : COMPANY_INFO.workingHoursEn}
        </p>

        <a
          href={COMPANY_INFO.website}
          target="_blank"
          rel="noreferrer"
          className="mt-1 pt-2 border-t border-white/10 flex items-center justify-between text-xs text-[#fdc672] hover:underline"
        >
          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-[#4a8ac7]" />
            <span className="text-white font-medium">ethiopiansteelplc.com</span>
          </div>
          <ExternalLink className="w-3 h-3 text-[#fdc672]" />
        </a>
      </div>
    </div>
  );
};

import React from 'react';
import { Layers, MapPin, Search, Bot, Send, UserCheck, Calculator } from 'lucide-react';
import { useEthiopianSteel } from '../context/EthiopianSteelContext';
import { SteelTabType } from '../types/ethiopianSteel';

export const BottomNavBar: React.FC = () => {
  const { activeTab, setActiveTab, lang, isStaffMode, isAdmin, hapticFeedback } = useEthiopianSteel();

  const navItems: Array<{ id: SteelTabType; labelAm: string; labelEn: string; icon: React.ReactNode }> = [
    {
      id: 'order',
      labelAm: 'ይዘዙ',
      labelEn: 'Order',
      icon: <Send className="w-4 h-4" />,
    },
    {
      id: 'calc',
      labelAm: 'ካልኩሌተር',
      labelEn: 'Calculator',
      icon: <Calculator className="w-4 h-4" />,
    },
    {
      id: 'catalog',
      labelAm: 'ምርቶች',
      labelEn: 'Catalog',
      icon: <Layers className="w-4 h-4" />,
    },
    {
      id: 'track',
      labelAm: 'መከታተያ',
      labelEn: 'Track',
      icon: <Search className="w-4 h-4" />,
    },
    {
      id: 'ai',
      labelAm: 'AI ረዳት',
      labelEn: 'AI Advisor',
      icon: <Bot className="w-4 h-4" />,
    },
    {
      id: 'locations',
      labelAm: 'አድራሻ',
      labelEn: 'Showrooms',
      icon: <MapPin className="w-4 h-4" />,
    },
  ];

  if (isAdmin && isStaffMode) {
    navItems.push({
      id: 'staff',
      labelAm: 'ሰራተኛ',
      labelEn: 'Staff',
      icon: <UserCheck className="w-4 h-4" />,
    });
  }

  return (
    <nav
      id="tg-bottom-nav"
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#0f1d2e]/95 backdrop-blur-md border-t border-[#4a8ac7]/20 px-2 py-1.5 flex items-center justify-around select-none shadow-2xl"
    >
      {navItems.map(item => {
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            id={`nav-tab-${item.id}`}
            onClick={() => {
              hapticFeedback('light');
              setActiveTab(item.id);
            }}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative ${
              isActive
                ? 'text-[#fdc672] scale-105 font-bold'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <div className="relative">
              {item.icon}
              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#fdc672] shadow-xs shadow-[#fdc672]" />
              )}
            </div>
            <span className="text-[10px] font-semibold mt-1 tracking-tight">
              {lang === 'am' ? item.labelAm : item.labelEn}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

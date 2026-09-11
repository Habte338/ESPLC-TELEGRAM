/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { EthiopianSteelProvider, useEthiopianSteel } from './context/EthiopianSteelContext';
import { EthiopianSteelHeader } from './components/EthiopianSteelHeader';
import { BottomNavBar } from './components/BottomNavBar';
import { OrderBuilderTab } from './components/OrderBuilderTab';
import { RoofCalculatorTab } from './components/RoofCalculatorTab';
import { CatalogTab } from './components/CatalogTab';
import { OrderTrackingTab } from './components/OrderTrackingTab';
import { AiChatTab } from './components/AiChatTab';
import { LocationsTab } from './components/LocationsTab';
import { StaffAdminTab } from './components/StaffAdminTab';
import { CustomerAuthModal } from './components/CustomerAuthModal';

const AppContent: React.FC = () => {
  const { activeTab, toastMessage } = useEthiopianSteel();

  return (
    <div className="min-h-screen bg-[#0b1522] text-white flex justify-center selection:bg-[#fdc672] selection:text-[#0b1522]">
      <div className="flex flex-col min-h-screen w-full max-w-2xl relative bg-[#101e2f] shadow-2xl border-x border-[#4a8ac7]/20">
        {/* Ethiopian Steel Header with Logo, Phone, Staff toggle & Language */}
        <EthiopianSteelHeader />

        {/* Tab View Container */}
        <main className="flex-1 overflow-y-auto">
          {activeTab === 'order' && <OrderBuilderTab />}
          {activeTab === 'calc' && <RoofCalculatorTab />}
          {activeTab === 'catalog' && <CatalogTab />}
          {activeTab === 'track' && <OrderTrackingTab />}
          {activeTab === 'ai' && <AiChatTab />}
          {activeTab === 'locations' && <LocationsTab />}
          {activeTab === 'staff' && <StaffAdminTab />}
        </main>

        {/* Bottom Navigation Bar */}
        <BottomNavBar />

        {/* Customer Email & Google Login Modal */}
        <CustomerAuthModal />

        {/* In-App Toast Notification */}
        {toastMessage && (
          <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-[#0f1d2e]/95 text-white border border-[#fdc672]/40 shadow-2xl text-xs font-bold backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-200 text-center max-w-[90%] flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#fdc672] animate-ping" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <EthiopianSteelProvider>
      <AppContent />
    </EthiopianSteelProvider>
  );
}

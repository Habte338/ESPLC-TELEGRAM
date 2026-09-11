import React, { useState } from 'react';
import {
  Check,
  ShieldCheck,
  Send,
  MapPin,
  Phone,
  Layers,
  Ruler,
  Palette,
  Sparkles,
  ArrowRight,
  Info,
  Calculator,
  User,
} from 'lucide-react';
import { useEthiopianSteel } from '../context/EthiopianSteelContext';
import { RoofVisualizer } from './RoofVisualizer';
import { STEEL_PRODUCTS, GAUGE_OPTIONS, COLOR_OPTIONS, COMPANY_INFO } from '../data/ethiopianSteelData';

export const OrderBuilderTab: React.FC = () => {
  const {
    lang,
    selectedProductId,
    setSelectedProductId,
    selectedEgaVariant,
    setSelectedEgaVariant,
    selectedGaugeId,
    setSelectedGaugeId,
    selectedColorId,
    setSelectedColorId,
    quantityMeters,
    setQuantityMeters,
    deliveryAddress,
    setDeliveryAddress,
    customerPhone,
    setCustomerPhone,
    customerName,
    setCustomerName,
    customerTelegramId,
    setCustomerTelegramId,
    checkStockAvailability,
    currentProduct,
    currentGauge,
    currentColor,
    submitOrder,
    setActiveTab,
    customer,
    setIsAuthModalOpen,
    hapticFeedback,
  } = useEthiopianSteel();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const quickMeters = [25, 50, 100, 200, 500];

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await submitOrder();
    } finally {
      setIsSubmitting(false);
    }
  };

  // Validate phone
  const cleanPhone = customerPhone.replace(/\D/g, '');
  const isPhoneValid =
    (cleanPhone.startsWith('251') && (cleanPhone.length === 11 || cleanPhone.length === 12)) ||
    (cleanPhone.startsWith('0') && cleanPhone.length === 10 && ['1', '7', '9'].includes(cleanPhone[1])) ||
    (cleanPhone.length === 9 && ['1', '7', '9'].includes(cleanPhone[0]));

  return (
    <div id="tg-order-builder-tab" className="flex flex-col gap-4 p-3.5 pb-24 text-white">
      {/* Quick Roof Calculator Shortcut Banner */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-[#17304a] to-[#0f1d2e] border border-[#4a8ac7]/30 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#4a8ac7]/20 border border-[#4a8ac7]/40 flex items-center justify-center text-[#fdc672]">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-bold text-white">
              {lang === 'am' ? 'የጣራ ስሌት ካልኩሌተር' : 'Roof Materials Calculator'}
            </div>
            <div className="text-[10px] text-white/70">
              {lang === 'am' ? 'የወረቀት ብዛትና ግምታዊ ክብደት ያሰሉ' : 'Coverage sheets, weight (kg) & ETB estimate'}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            hapticFeedback('light');
            setActiveTab('calc');
          }}
          className="py-1.5 px-3 rounded-xl bg-[#4a8ac7] hover:bg-[#3a72a8] active:scale-95 text-white text-[11px] font-bold flex items-center gap-1 transition-all shadow-sm"
        >
          <span>{lang === 'am' ? 'ክፈት' : 'Open Calc'}</span>
          <ArrowRight className="w-3 h-3 text-[#fdc672]" />
        </button>
      </div>

      {/* Customer Login & Auto-Fill Status Banner */}
      {!customer.isLoggedIn ? (
        <div className="flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-[#17304a]/70 to-[#0f1d2e] border border-[#4a8ac7]/40 text-xs text-white shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#4a8ac7]/25 border border-[#4a8ac7]/40 flex items-center justify-center text-[#fdc672]">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">
                {lang === 'am' ? 'በቴሌግራም ወይም በGoogle ይግቡ' : '1-Tap Sign In with Telegram or Google'}
              </div>
              <div className="text-[10px] text-white/70">
                {lang === 'am'
                  ? 'ስምዎ፣ ስልክዎ እና የቴሌግራም መለያዎ በቀጥታ ይሞላሉ'
                  : 'Auto-fills your name, phone & Telegram handle into the order'}
              </div>
            </div>
          </div>
          <button
            type="button"
            id="builder-quick-auth-btn"
            onClick={() => {
              hapticFeedback('light');
              setIsAuthModalOpen(true);
            }}
            className="py-1.5 px-3.5 rounded-xl bg-[#fdc672] hover:bg-[#e5b05a] text-[#0b1522] text-[11px] font-black shadow-md active:scale-95 transition-all flex-shrink-0"
          >
            {lang === 'am' ? 'ግባ / Log In' : 'Sign In'}
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#17304a]/50 border border-[#fdc672]/30 text-xs text-white">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#fdc672] text-[#0b1522] flex items-center justify-center text-xs font-black">
              ✓
            </div>
            <div className="text-[11px]">
              <span className="font-bold text-white">{customer.name}</span>
              <span className="text-[#fdc672] ml-1.5 font-mono">
                ({customer.telegramUsername || customer.phone || customer.email})
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              hapticFeedback('light');
              setIsAuthModalOpen(true);
            }}
            className="text-[10px] text-[#fdc672] font-bold underline hover:text-[#fed899]"
          >
            {lang === 'am' ? 'መለያ ቀይር' : 'Change'}
          </button>
        </div>
      )}

      {/* Interactive Roof Visualizer */}
      <RoofVisualizer />

      {/* STEP 1: Select Product */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-[#4a8ac7] text-white flex items-center justify-center text-[10px] font-black">
              1
            </span>
            <span>{lang === 'am' ? 'የምርት ዓይነት ይምረጡ' : 'Select Product Profile'}</span>
          </label>
          <span className="text-[10px] text-[#fdc672] font-semibold">4 {lang === 'am' ? 'ምርቶች' : 'Profiles'}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {STEEL_PRODUCTS.map(product => {
            const isSelected = selectedProductId === product.id;
            const stock = checkStockAvailability(product.id);

            return (
              <button
                key={product.id}
                id={`product-opt-${product.id}`}
                onClick={() => {
                  hapticFeedback('medium');
                  setSelectedProductId(product.id);
                }}
                className={`p-3 rounded-2xl text-left border flex flex-col justify-between transition-all duration-150 relative ${
                  isSelected
                    ? 'bg-[#17304a] border-[#fdc672] shadow-md ring-2 ring-[#fdc672]/50'
                    : 'bg-[#0f1d2e] border-white/10 hover:border-[#4a8ac7]/40'
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-2xl">{product.icon}</span>
                  <div className="flex items-center gap-1">
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                        stock.inStock
                          ? 'bg-[#4a8ac7]/25 text-white border border-[#4a8ac7]/40'
                          : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {stock.inStock ? (lang === 'am' ? 'አለ' : 'Stock') : (lang === 'am' ? 'ያለቀ' : 'Out')}
                    </span>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-[#fdc672] text-[#0b1522] flex items-center justify-center text-[10px] font-black">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-2">
                  <h4 className="font-bold text-xs text-white leading-tight">
                    {lang === 'am' ? product.nameAm : product.nameEn}
                  </h4>
                  <p className="text-[10px] text-white/60 mt-0.5 line-clamp-1">
                    {lang === 'am' ? product.taglineAm : product.taglineEn}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* EGA Specific Profile Selector (300, 400, 500, 600 exceptionally) */}
        {selectedProductId === 'ega' && (
          <div className="mt-2 p-3 rounded-2xl bg-[#0f1d2e] border border-[#fdc672]/40 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#fdc672] flex items-center gap-1.5">
                <span>🏭</span>
                <span>{lang === 'am' ? 'የEGA ዓይነቶች (300, 400, 500, 600)' : 'EGA Profiles (300, 400, 500, 600)'}</span>
              </span>
              <span className="text-[9px] bg-[#fdc672]/20 text-[#fdc672] font-bold px-1.5 py-0.5 rounded border border-[#fdc672]/30">
                600 {lang === 'am' ? 'በልዩ ሁኔታ' : 'Exceptionally Wide'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: 'ega-300', label: 'EGA 300', sub: '1000mm coil · 0.81m eff.' },
                { id: 'ega-400', label: 'EGA 400', sub: '1000mm coil · 0.78m eff.' },
                { id: 'ega-500', label: 'EGA 500', sub: '1000mm coil · 0.83m eff.' },
                { id: 'ega-600', label: 'EGA 600 ★', sub: '1220mm coil · 1.045m eff.' },
              ].map(ega => {
                const isActive = selectedEgaVariant === ega.id;
                const variantStock = checkStockAvailability('ega', ega.id);

                return (
                  <button
                    key={ega.id}
                    type="button"
                    onClick={() => {
                      hapticFeedback('light');
                      setSelectedEgaVariant(ega.id);
                    }}
                    className={`p-2 rounded-xl text-left border transition-all relative ${
                      isActive
                        ? 'bg-[#17304a] border-[#fdc672] text-white font-bold ring-1 ring-[#fdc672]/50'
                        : 'bg-white/5 border-white/10 text-white/70 hover:border-[#4a8ac7]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{ega.label}</span>
                      <span
                        className={`text-[8px] font-bold px-1 rounded ${
                          variantStock.inStock
                            ? 'bg-[#4a8ac7]/20 text-white'
                            : 'bg-red-500/20 text-red-300'
                        }`}
                      >
                        {variantStock.inStock ? '✓ Stock' : 'Out'}
                      </span>
                    </div>
                    <div className="text-[9px] text-white/50 mt-0.5">{ega.sub}</div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* STEP 2: Select Gauge */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-[#4a8ac7] text-white flex items-center justify-center text-[10px] font-black">
              2
            </span>
            <span>{lang === 'am' ? 'ጋጅ (Gauge) ይምረጡ' : 'Select Sheet Gauge'}</span>
          </label>
          <span className="text-[10px] text-[#fdc672] font-mono font-bold">
            {currentGauge.thickness}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {GAUGE_OPTIONS.map(gauge => {
            const isSelected = selectedGaugeId === gauge.id;
            return (
              <button
                key={gauge.id}
                id={`gauge-opt-${gauge.id}`}
                onClick={() => {
                  hapticFeedback('light');
                  setSelectedGaugeId(gauge.id);
                }}
                className={`p-2.5 rounded-2xl text-left border flex flex-col justify-between transition-all ${
                  isSelected
                    ? 'bg-[#17304a] border-[#fdc672] ring-2 ring-[#fdc672]/50'
                    : 'bg-[#0f1d2e] border-white/10 hover:border-[#4a8ac7]/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">{gauge.label}</span>
                  {gauge.isPopular && (
                    <span className="text-[9px] bg-[#fdc672] text-[#0b1522] font-black px-1.5 py-0.5 rounded">
                      {lang === 'am' ? 'ተመራጭ' : 'Popular'}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-white/60 mt-1 line-clamp-1">
                  {lang === 'am' ? gauge.descriptionAm : gauge.descriptionEn}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 3: Select Color */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-[#4a8ac7] text-white flex items-center justify-center text-[10px] font-black">
              3
            </span>
            <span>{lang === 'am' ? 'ቀለም ይምረጡ' : 'Select Color'}</span>
          </label>
          <span className="text-[10px] text-[#fdc672] font-bold">
            {lang === 'am' ? currentColor.nameAm : currentColor.nameEn}
          </span>
        </div>

        <div className="grid grid-cols-5 gap-1.5">
          {COLOR_OPTIONS.map(color => {
            const isSelected = selectedColorId === color.id;
            return (
              <button
                key={color.id}
                id={`color-opt-${color.id}`}
                onClick={() => {
                  hapticFeedback('medium');
                  setSelectedColorId(color.id);
                }}
                className={`h-12 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all duration-150 relative ${
                  isSelected
                    ? 'ring-2 ring-[#fdc672] ring-offset-2 ring-offset-[#101e2f] scale-105 shadow-md'
                    : 'border-white/10 opacity-75 hover:opacity-100'
                }`}
                style={{ backgroundColor: color.hex }}
                title={color.nameEn}
              >
                {isSelected && <Check className="w-4 h-4 text-white drop-shadow-md" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 4: Quantity in Meters */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-[#4a8ac7] text-white flex items-center justify-center text-[10px] font-black">
              4
            </span>
            <span>{lang === 'am' ? 'ብዛት በሜትር' : 'Quantity in Meters'}</span>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <input
              id="quantity-meters-input"
              type="number"
              min="1"
              value={quantityMeters}
              onChange={e => setQuantityMeters(e.target.value)}
              placeholder="e.g. 50"
              className="w-full bg-[#0f1d2e] border border-white/10 rounded-xl px-3 py-2.5 text-sm font-bold text-white focus:outline-none focus:border-[#4a8ac7]"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#fdc672] font-bold">
              {lang === 'am' ? 'ሜትር (m)' : 'Meters'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {quickMeters.slice(0, 3).map(m => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  hapticFeedback('light');
                  setQuantityMeters(String(m));
                }}
                className="px-2.5 py-2 rounded-xl bg-white/5 hover:bg-[#4a8ac7]/20 border border-white/10 hover:border-[#4a8ac7]/40 text-xs font-bold text-white active:scale-95 transition-all"
              >
                +{m}m
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* STEP 5: Customer Delivery Details */}
      <div className="flex flex-col gap-2.5 p-3.5 rounded-2xl bg-[#101e2f] border border-[#4a8ac7]/25">
        <label className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-full bg-[#4a8ac7] text-white flex items-center justify-center text-[10px] font-black">
            5
          </span>
          <span>{lang === 'am' ? 'የመላኪያ አድራሻ እና ስልክ' : 'Delivery & Contact'}</span>
        </label>

        {/* Address */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-white/70">
            {lang === 'am' ? 'ሙሉ የመላኪያ አድራሻ (ከተማ/ክፍለ ከተማ):' : 'Delivery Address & City:'}
          </span>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#fdc672]" />
            <input
              id="delivery-address-input"
              type="text"
              value={deliveryAddress}
              onChange={e => setDeliveryAddress(e.target.value)}
              placeholder="e.g. Addis Ababa, Bole Bulbula"
              className="w-full bg-[#0f1d2e] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#4a8ac7]"
            />
          </div>
        </div>

        {/* Phone */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/70">
              {lang === 'am' ? 'የኢትዮጵያ ስልክ ቁጥር:' : 'Ethiopian Phone Number:'}
            </span>
            {isPhoneValid ? (
              <span className="text-[9px] text-[#fdc672] font-bold">✓ {lang === 'am' ? 'ትክክለኛ' : 'Valid'}</span>
            ) : (
              <span className="text-[9px] text-amber-300 font-semibold">09... / 07...</span>
            )}
          </div>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#fdc672]" />
            <input
              id="customer-phone-input"
              type="tel"
              value={customerPhone}
              onChange={e => setCustomerPhone(e.target.value)}
              placeholder="0911223344"
              className="w-full bg-[#0f1d2e] border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#4a8ac7]"
            />
          </div>
        </div>

        {/* Customer Name */}
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-white/70">
            {lang === 'am' ? 'የደንበኛ ስም:' : 'Customer Name:'}
          </span>
          <input
            id="customer-name-input"
            type="text"
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            placeholder="Full Name"
            className="w-full bg-[#0f1d2e] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#4a8ac7]"
          />
        </div>

        {/* Telegram Username */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-white/70">
              {lang === 'am' ? 'የቴሌግራም መለያ (@username):' : 'Telegram Username (@handle):'}
            </span>
            <span className="text-[9px] text-[#fdc672] font-bold">
              {lang === 'am' ? 'የዋጋ ዝርዝር የሚላክበት' : 'For Bot Quotations'}
            </span>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-[#fdc672]">@</span>
            <input
              id="customer-telegram-input"
              type="text"
              value={customerTelegramId.replace(/^@+/, '')}
              onChange={e => {
                const val = e.target.value.replace(/^@+/, '').trim();
                setCustomerTelegramId(val ? `@${val}` : '');
              }}
              placeholder="username"
              className="w-full bg-[#0f1d2e] border border-white/10 rounded-xl pl-8 pr-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#4a8ac7]"
            />
          </div>
        </div>
      </div>

      {/* Order Summary & Submit Bar */}
      <div className="rounded-2xl bg-gradient-to-br from-[#17304a] to-[#0f1d2e] p-4 border border-[#4a8ac7]/40 flex flex-col gap-3 shadow-xl">
        <div className="flex items-center justify-between">
          <span className="text-xs font-black uppercase tracking-wider text-white">
            {lang === 'am' ? 'የትዕዛዝ ማጠቃለያ' : 'Order Summary'}
          </span>
          <span className="text-[10px] text-[#0b1522] font-black bg-[#fdc672] px-2 py-0.5 rounded-md shadow-xs">
            {COMPANY_INFO.brandName}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs bg-[#0b1522]/60 p-3 rounded-xl border border-white/10">
          <div>
            <span className="text-[10px] text-white/50 block">{lang === 'am' ? 'ምርት:' : 'Product:'}</span>
            <span className="font-bold text-white truncate block">
              {lang === 'am' ? currentProduct.nameAm : currentProduct.nameEn}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-white/50 block">{lang === 'am' ? 'ጋጅ:' : 'Gauge:'}</span>
            <span className="font-bold text-white">{currentGauge.label}</span>
          </div>
          <div>
            <span className="text-[10px] text-white/50 block">{lang === 'am' ? 'ቀለም:' : 'Color:'}</span>
            <span className="font-bold text-white">
              {lang === 'am' ? currentColor.nameAm : currentColor.nameEn}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-white/50 block">{lang === 'am' ? 'ብዛት:' : 'Quantity:'}</span>
            <span className="font-black text-[#fdc672]">{quantityMeters || 0} ሜትር (m)</span>
          </div>
          <div className="col-span-2 pt-1.5 border-t border-white/10 flex items-center justify-between">
            <span className="text-[10px] text-white/60">{lang === 'am' ? 'የክምችት ሁኔታ:' : 'Stock Status:'}</span>
            {(() => {
              const st = checkStockAvailability(selectedProductId, selectedProductId === 'ega' ? selectedEgaVariant : undefined);
              return (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  st.inStock ? 'bg-[#4a8ac7]/20 text-white border border-[#4a8ac7]/40' : 'bg-red-500/20 text-red-300'
                }`}>
                  {st.inStock
                    ? (lang === 'am' ? `✓ በመጋዘን አለ (${st.stockMeters}m)` : `✓ In Stock (${st.stockMeters}m)`)
                    : (lang === 'am' ? '✕ አልቋል (ልዩ ትዕዛዝ)' : '✕ Out of Stock (Custom Batch)')}
                </span>
              );
            })()}
          </div>
        </div>

        {/* Telegram Price Quotation Notice */}
        <div className="p-2.5 rounded-xl bg-[#4a8ac7]/15 border border-[#4a8ac7]/30 text-xs text-white/90 flex items-start gap-2">
          <Send className="w-3.5 h-3.5 text-[#fdc672] flex-shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            {lang === 'am'
              ? 'ትዕዛዝዎን እንዳስገቡ የፋብሪካው አስተዳዳሪ (Bot Owner) ትክክለኛውን የዋጋ ዝርዝር (Quotation in ETB) በቀጥታ ወደ ቴሌግራም መለያዎ ይልካል!'
              : 'Once submitted, the factory bot owner reviews your order and quotes the exact total price (in ETB) sent to your Telegram handle!'}
          </p>
        </div>

        <button
          id="submit-steel-order-btn"
          disabled={isSubmitting}
          onClick={handleSubmit}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-[#4a8ac7] to-[#3a72a8] hover:from-[#3a72a8] hover:to-[#2a5b8a] text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all border border-white/20"
        >
          <Send className="w-4 h-4 text-[#fdc672]" />
          <span>{lang === 'am' ? 'ትዕዛዝ አረጋግጥና አስገባ' : 'Confirm & Submit Order'}</span>
        </button>

        <p className="text-[10px] text-white/50 text-center">
          {lang === 'am'
            ? 'ትዕዛዝዎ እንደደረሰን የፋብሪካው የሽያጭ ክፍል በስልክ ወይም በቴሌግራም ያነጋግርዎታል!'
            : 'Our factory sales team will immediately contact your Telegram or phone with your quote!'}
        </p>
      </div>
    </div>
  );
};

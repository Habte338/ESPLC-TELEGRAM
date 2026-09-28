import React, { useState, useMemo } from 'react';
import {
  Search,
  PackageCheck,
  Clock,
  CheckCircle2,
  Truck,
  Phone,
  MapPin,
  Layers,
  RefreshCw,
  Sparkles,
  MessageSquare,
  History,
  RotateCcw,
  ArrowRight,
  Filter,
  Check,
  ExternalLink,
} from 'lucide-react';
import { useEthiopianSteel } from '../context/EthiopianSteelContext';
import { OrderSubmission } from '../types/ethiopianSteel';

export const OrderTrackingTab: React.FC = () => {
  const {
    lang,
    submittedOrders,
    activeOrderToTrack,
    trackOrderById,
    searchOrderQuery,
    setSearchOrderQuery,
    reorderPastOrder,
    customer,
    hapticFeedback,
    showToast,
    refreshOrders,
    isRefreshingOrders,
  } = useEthiopianSteel();

  const [localSearch, setLocalSearch] = useState(searchOrderQuery || '');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'completed'>('all');
  const [historySearch, setHistorySearch] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    hapticFeedback('medium');
    if (!localSearch.trim()) {
      showToast(lang === 'am' ? 'እባክዎ የትዕዛዝ ቁጥር ያስገቡ' : 'Please enter an Order ID');
      return;
    }
    const found = trackOrderById(localSearch);
    if (!found) {
      showToast(lang === 'am' ? 'ትዕዛዙ አልተገኘም' : 'Order ID not found');
    }
  };

  const order = activeOrderToTrack || submittedOrders[0] || null;

  const getStatusStep = (status: string) => {
    if (status === 'delivered') return 4;
    if (status === 'shipped') return 3;
    if (status === 'completed') return 3;
    if (status === 'processing') return 2;
    return 1;
  };

  // Filtered order history
  const filteredHistory = useMemo(() => {
    return submittedOrders.filter(o => {
      const matchesFilter = historyFilter === 'all' || o.status === historyFilter;
      const q = historySearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        o.order_id.toLowerCase().includes(q) ||
        o.product.toLowerCase().includes(q) ||
        (o.gauge && o.gauge.toLowerCase().includes(q)) ||
        (o.color && o.color.toLowerCase().includes(q)) ||
        (o.phone && o.phone.includes(q)) ||
        (o.address && o.address.toLowerCase().includes(q));
      return matchesFilter && matchesSearch;
    });
  }, [submittedOrders, historyFilter, historySearch]);

  const handleReorderClick = (o: OrderSubmission) => {
    reorderPastOrder(o);
  };

  return (
    <div id="tg-tracking-tab" className="flex flex-col gap-4 p-3.5 pb-24 text-white">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="relative flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            id="tracking-search-input"
            type="text"
            value={localSearch}
            onChange={e => setLocalSearch(e.target.value)}
            placeholder="e.g. ORD-20260904-B4A1"
            className="w-full bg-[#0f1d2e] border border-[#4a8ac7]/30 rounded-xl pl-9 pr-3 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#fdc672]"
          />
        </div>
        <button
          type="submit"
          className="px-3 py-2.5 bg-[#4a8ac7] hover:bg-[#3a72a8] text-white font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all border border-white/20"
        >
          {lang === 'am' ? 'ፈልግ' : 'Track'}
        </button>
        <button
          type="button"
          onClick={async () => {
            hapticFeedback('light');
            await refreshOrders();
            showToast(lang === 'am' ? 'የትዕዛዝ መረጃ ታድሷል' : 'Orders refreshed');
          }}
          disabled={isRefreshingOrders}
          title={lang === 'am' ? 'አድስ' : 'Refresh'}
          className="p-2.5 bg-[#0f1d2e] border border-white/10 hover:border-[#4a8ac7]/40 text-white/70 hover:text-white rounded-xl active:scale-95 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshingOrders ? 'animate-spin text-[#fdc672]' : ''}`} />
        </button>
      </form>

      {/* Active Order Card */}
      {order ? (
        <div className="rounded-2xl bg-[#0f1d2e] border border-[#4a8ac7]/30 p-4 shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div>
              <span className="text-[10px] text-white/50 block font-mono">ORDER ID</span>
              <h3 className="font-mono text-sm font-black text-[#fdc672]">{order.order_id}</h3>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`text-xs font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${
                  order.status === 'delivered'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : order.status === 'shipped'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                    : order.status === 'completed'
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                    : order.status === 'processing'
                    ? 'bg-[#4a8ac7]/20 text-[#fdc672] border-[#4a8ac7]/40 animate-pulse'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                }`}
              >
                {order.status === 'delivered' ? (
                  <>
                    <PackageCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{lang === 'am' ? 'ደርሷል (Delivered)' : 'Delivered'}</span>
                  </>
                ) : order.status === 'shipped' ? (
                  <>
                    <Truck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{lang === 'am' ? 'በመጓጓዝ ላይ (Shipped)' : 'Shipped'}</span>
                  </>
                ) : order.status === 'completed' ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
                    <span>{lang === 'am' ? 'ተጠናቋል (Ready)' : 'Ready for Dispatch'}</span>
                  </>
                ) : order.status === 'processing' ? (
                  <>
                    <Clock className="w-3.5 h-3.5 text-[#fdc672]" />
                    <span>{lang === 'am' ? 'በማምረት ላይ (Processing)' : 'In Production'}</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{lang === 'am' ? 'በመጠባበቅ ላይ (Pending)' : 'Pending'}</span>
                  </>
                )}
              </span>

              <button
                type="button"
                onClick={() => handleReorderClick(order)}
                title={lang === 'am' ? 'እንደገና እዘዝ' : 'Reorder Item'}
                className="p-1.5 rounded-lg bg-[#fdc672] hover:bg-[#e5b05a] text-[#0b1522] text-xs font-bold flex items-center gap-1 active:scale-95 transition-all shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="text-[11px] font-black">{lang === 'am' ? 'ድገም' : 'Reorder'}</span>
              </button>
            </div>
          </div>

          {/* OFFICIAL QUOTE CARD */}
          {order.quotedPriceETB ? (
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#17304a] via-[#0f1d2e] to-[#0b1624] border border-[#fdc672]/50 shadow-lg flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#fdc672]" />
                  <span className="text-xs font-bold text-[#fdc672] uppercase tracking-wide">
                    {lang === 'am' ? 'ኦፊሴላዊ የፋብሪካ ዋጋ (Official Factory Quote)' : 'Official Quoted Price'}
                  </span>
                </div>
                <span className="text-[9px] bg-[#fdc672]/20 text-[#fdc672] font-bold px-2 py-0.5 rounded-full border border-[#fdc672]/40">
                  {lang === 'am' ? 'የተረጋገጠ' : 'Confirmed'}
                </span>
              </div>

              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-2xl font-black text-white font-mono tracking-tight">
                    {order.quotedPriceETB.toLocaleString()}
                  </span>
                  <span className="ml-1.5 text-xs font-black text-[#fdc672]">ETB (ብር)</span>
                </div>
                {order.quotedAt && (
                  <span className="text-[10px] text-white/50">
                    {order.quotedAt.split(' ')[0]}
                  </span>
                )}
              </div>

              {order.quoteNotes && (
                <div className="p-2 rounded-xl bg-black/30 border border-white/10 text-[11px] text-white/80 italic">
                  💬 "{order.quoteNotes}"
                </div>
              )}

              {/* Telegram Contact & Action */}
              <div className="flex items-center gap-2 pt-1">
                {order.username && (
                  <a
                    href={`https://t.me/${order.username.replace('@', '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 px-3 rounded-xl bg-[#4a8ac7] hover:bg-[#3a72a8] active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md border border-white/15"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-[#fdc672]" />
                    <span>{lang === 'am' ? 'በቴሌግራም መልስ ስጥ' : 'Chat on Telegram'}</span>
                  </a>
                )}
                <a
                  href={`tel:${order.phone}`}
                  className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white text-xs font-bold flex items-center justify-center gap-1 transition-all"
                >
                  <Phone className="w-3.5 h-3.5 text-[#fdc672]" />
                  <span>Call</span>
                </a>
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-2xl bg-[#fdc672]/10 border border-[#fdc672]/30 flex items-start gap-2.5 text-xs">
              <Clock className="w-4 h-4 text-[#fdc672] flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-[#fdc672]">
                  {lang === 'am' ? 'የዋጋ ዝርዝር በመዘጋጀት ላይ ነው' : 'Quotation Under Review by Bot Owner'}
                </span>
                <p className="text-[11px] text-white/80 mt-0.5 leading-relaxed">
                  {lang === 'am'
                    ? 'ትዕዛዝዎ ደርሶናል! የፋብሪካው አስተዳዳሪ የቁሳቁሱን ዝርዝር አይቶ ትክክለኛውን ዋጋ በዚህ ገጽ እና በቀጥታ ወደ ቴሌግራም መለያዎ ይልካል (15-30 ደቂቃ)።'
                    : 'We have received your specifications! The factory bot owner is calculating your official price quotation and will notify you here and on Telegram.'}
                </p>
              </div>
            </div>
          )}

          {/* Progress Timeline (4-Stage: Received -> Production -> Shipped -> Delivered) */}
          <div className="flex items-center justify-between relative px-2 py-2">
            <div className="absolute top-1/2 left-6 right-6 h-0.5 bg-white/10 -translate-y-1/2 z-0" />
            <div
              className="absolute top-1/2 left-6 h-0.5 bg-[#4a8ac7] -translate-y-1/2 z-0 transition-all duration-500"
              style={{
                width:
                  getStatusStep(order.status) === 4
                    ? 'calc(100% - 48px)'
                    : getStatusStep(order.status) === 3
                    ? 'calc(66% - 24px)'
                    : getStatusStep(order.status) === 2
                    ? '33%'
                    : '0%',
              }}
            />

            {/* Step 1: Received */}
            <div className="relative z-10 flex flex-col items-center gap-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  getStatusStep(order.status) >= 1
                    ? 'bg-[#4a8ac7] text-white ring-4 ring-[#0f1d2e]'
                    : 'bg-white/10 text-white/40'
                }`}
              >
                1
              </div>
              <span className="text-[10px] text-white/70 whitespace-nowrap">
                {lang === 'am' ? 'ደርሷል' : 'Received'}
              </span>
            </div>

            {/* Step 2: Processing */}
            <div className="relative z-10 flex flex-col items-center gap-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  getStatusStep(order.status) >= 2
                    ? 'bg-[#fdc672] text-[#0b1522] ring-4 ring-[#0f1d2e]'
                    : 'bg-[#0b1624] text-white/40 border border-white/10'
                }`}
              >
                2
              </div>
              <span className="text-[10px] text-white/70 whitespace-nowrap">
                {lang === 'am' ? 'በማምረት ላይ' : 'Production'}
              </span>
            </div>

            {/* Step 3: Shipped / Dispatched */}
            <div className="relative z-10 flex flex-col items-center gap-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  getStatusStep(order.status) >= 3
                    ? 'bg-cyan-500 text-black ring-4 ring-[#0f1d2e]'
                    : 'bg-[#0b1624] text-white/40 border border-white/10'
                }`}
              >
                3
              </div>
              <span className="text-[10px] text-white/70 whitespace-nowrap">
                {lang === 'am' ? 'በመጓጓዝ ላይ' : 'Shipped'}
              </span>
            </div>

            {/* Step 4: Delivered */}
            <div className="relative z-10 flex flex-col items-center gap-1">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  getStatusStep(order.status) >= 4
                    ? 'bg-emerald-500 text-black ring-4 ring-[#0f1d2e]'
                    : 'bg-[#0b1624] text-white/40 border border-white/10'
                }`}
              >
                4
              </div>
              <span className="text-[10px] text-white/70 whitespace-nowrap">
                {lang === 'am' ? 'ተረክቧል' : 'Delivered'}
              </span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-2 bg-[#0b1624] p-3 rounded-xl border border-white/5 text-xs">
            <div>
              <span className="text-[10px] text-white/40 block">{lang === 'am' ? 'ደንበኛ:' : 'Customer:'}</span>
              <span className="font-semibold text-white truncate block">{order.first_name || 'Customer'}</span>
            </div>
            <div>
              <span className="text-[10px] text-white/40 block">Telegram ID:</span>
              <span className="font-mono font-bold text-[#fdc672] truncate block">
                {order.username ? (order.username.startsWith('@') ? order.username : `@${order.username}`) : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-white/40 block">{lang === 'am' ? 'ምርት:' : 'Product:'}</span>
              <span className="font-semibold text-white">{order.product}</span>
            </div>
            <div>
              <span className="text-[10px] text-white/40 block">{lang === 'am' ? 'ጋጅ:' : 'Gauge:'}</span>
              <span className="font-semibold text-white">{order.gauge}</span>
            </div>
            <div>
              <span className="text-[10px] text-white/40 block">{lang === 'am' ? 'ቀለም:' : 'Color:'}</span>
              <span className="font-semibold text-white">{order.color}</span>
            </div>
            <div>
              <span className="text-[10px] text-white/40 block">{lang === 'am' ? 'ብዛት:' : 'Quantity:'}</span>
              <span className="font-black text-[#fdc672]">{order.quantity} ሜትር (m)</span>
            </div>
            <div className="col-span-2 pt-1 border-t border-white/5">
              <span className="text-[10px] text-white/40 block">{lang === 'am' ? 'የመላኪያ አድራሻ:' : 'Delivery Address:'}</span>
              <span className="text-white text-xs">{order.address}</span>
            </div>
            <div className="col-span-2">
              <span className="text-[10px] text-white/40 block">{lang === 'am' ? 'ስልክ ቁጥር:' : 'Phone:'}</span>
              <span className="text-[#4a8ac7] font-mono font-bold text-xs">{order.phone}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-white/50 text-xs">
          {lang === 'am' ? 'ምንም የገቡ ትዕዛዞች የሉም' : 'No submitted orders found'}
        </div>
      )}

      {/* DEDICATED ORDER HISTORY SECTION */}
      <div id="order-history-section" className="flex flex-col gap-3 pt-3 border-t border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#4a8ac7]/20 border border-[#4a8ac7]/40 flex items-center justify-center text-[#fdc672]">
              <History className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                {lang === 'am' ? 'የትዕዛዝ ታሪክ (Order History)' : 'Order History & Updates'}
              </h3>
              <span className="text-[10px] text-white/50">
                {submittedOrders.length} {lang === 'am' ? 'ትዕዛዞች ተመዝግበዋል' : 'total orders recorded'}
              </span>
            </div>
          </div>

          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#fdc672]/15 text-[#fdc672] font-semibold border border-[#fdc672]/30">
            {lang === 'am' ? 'ቀጥታ ድጋሚ ማዘዝ' : '1-Click Reorder'}
          </span>
        </div>

        {/* Filter and Search Bar for History */}
        <div className="flex flex-col gap-2">
          {/* Status filter pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {(
              [
                { id: 'all', labelAm: 'ሁሉም', labelEn: 'All' },
                { id: 'pending', labelAm: 'በመጠባበቅ ላይ', labelEn: 'Pending' },
                { id: 'processing', labelAm: 'በሂደት ላይ', labelEn: 'Processing' },
                { id: 'shipped', labelAm: '🚚 በመጓጓዝ ላይ', labelEn: 'Shipped' },
                { id: 'delivered', labelAm: '📦 የደረሱ', labelEn: 'Delivered' },
                { id: 'completed', labelAm: 'የተጠናቀቁ', labelEn: 'Completed' },
              ] as const
            ).map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  hapticFeedback('light');
                  setHistoryFilter(f.id);
                }}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap ${
                  historyFilter === f.id
                    ? 'bg-[#4a8ac7] text-white shadow-sm border border-white/20'
                    : 'bg-[#0f1d2e] text-white/60 hover:text-white border border-white/5'
                }`}
              >
                {lang === 'am' ? f.labelAm : f.labelEn}
              </button>
            ))}
          </div>

          {/* Quick text filter within history */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={historySearch}
              onChange={e => setHistorySearch(e.target.value)}
              placeholder={
                lang === 'am'
                  ? 'በትዕዛዝ ታሪክ ውስጥ ፈልግ (ቁጥር፣ ምርት፣ ቀለም)...'
                  : 'Filter past orders by ID, product, color...'
              }
              className="w-full bg-[#0b1624] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-[11px] text-white placeholder-white/30 focus:outline-none focus:border-[#4a8ac7]"
            />
          </div>
        </div>

        {/* Orders List Cards */}
        <div className="flex flex-col gap-2.5">
          {filteredHistory.map(item => {
            const isSelected = order?.order_id === item.order_id;
            const hasQuote = Boolean(item.quotedPriceETB);

            return (
              <div
                key={item.order_id}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col gap-2.5 shadow-sm ${
                  isSelected
                    ? 'bg-[#17304a]/70 border-[#fdc672] shadow-md shadow-[#4a8ac7]/10'
                    : 'bg-[#0f1d2e] border-white/10 hover:border-[#4a8ac7]/40'
                }`}
              >
                {/* Header: ID, date, status */}
                <div className="flex items-start justify-between">
                  <div
                    onClick={() => {
                      hapticFeedback('light');
                      trackOrderById(item.order_id);
                      setLocalSearch(item.order_id);
                    }}
                    className="cursor-pointer"
                  >
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-black text-[#fdc672] hover:underline">
                        {item.order_id}
                      </span>
                      {isSelected && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#fdc672] text-[#0b1522] font-black uppercase">
                          {lang === 'am' ? 'ንቁ' : 'Viewing'}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-white/50 block mt-0.5">
                      {item.timestamp || 'Recent'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {hasQuote && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {item.quotedPriceETB?.toLocaleString()} ETB
                      </span>
                    )}

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                        item.status === 'delivered'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : item.status === 'shipped'
                          ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          : item.status === 'completed'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : item.status === 'processing'
                          ? 'bg-[#4a8ac7]/20 text-[#fdc672] border border-[#4a8ac7]/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {item.status === 'shipped' ? '🚚 Shipped' : item.status === 'delivered' ? '📦 Delivered' : item.status}
                    </span>
                  </div>
                </div>

                {/* Product & Spec Details */}
                <div className="grid grid-cols-2 gap-1.5 p-2 rounded-xl bg-[#0b1624] border border-white/5 text-[11px]">
                  <div>
                    <span className="text-[10px] text-white/40 block">{lang === 'am' ? 'ምርት:' : 'Product:'}</span>
                    <span className="font-semibold text-white">{item.product}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40 block">{lang === 'am' ? 'ብዛት:' : 'Quantity:'}</span>
                    <span className="font-bold text-[#fdc672]">{item.quantity}m</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40 block">{lang === 'am' ? 'ጋጅ & ቀለም:' : 'Gauge & Color:'}</span>
                    <span className="text-white/80">
                      {item.gauge} · {item.color}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-white/40 block">{lang === 'am' ? 'አድራሻ:' : 'Address:'}</span>
                    <span className="text-white/80 truncate block">{item.address}</span>
                  </div>
                </div>

                {/* Quote note if any */}
                {item.quoteNotes && (
                  <div className="p-2 rounded-lg bg-black/20 text-[10px] text-white/70 italic">
                    💬 "{item.quoteNotes}"
                  </div>
                )}

                {/* Card Action Footer: Track Details button & 1-Click Reorder button */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      hapticFeedback('light');
                      trackOrderById(item.order_id);
                      setLocalSearch(item.order_id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="py-1.5 px-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-all"
                  >
                    <Search className="w-3 h-3 text-[#4a8ac7]" />
                    <span>{lang === 'am' ? 'ዝርዝር ሁኔታ ተመልከት' : 'View Timeline'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleReorderClick(item)}
                    className="py-1.5 px-3 rounded-xl bg-[#fdc672] hover:bg-[#e5b05a] active:scale-95 text-[#0b1522] text-xs font-black flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{lang === 'am' ? 'እንደገና እዘዝ' : 'Reorder'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredHistory.length === 0 && (
            <div className="py-8 text-center text-white/40 text-xs bg-[#0f1d2e] rounded-2xl border border-white/5 p-4">
              {lang === 'am'
                ? 'በተመረጠው መስፈርት የተገኘ የትዕዛዝ ታሪክ የለም'
                : 'No orders found matching the filter criteria'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


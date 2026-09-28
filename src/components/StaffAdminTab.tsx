import React, { useState, useEffect } from 'react';
import {
  Download,
  Phone,
  CheckCircle2,
  Clock,
  RotateCw,
  Search,
  UserCheck,
  Shield,
  FileSpreadsheet,
  Send,
  Boxes,
  ClipboardCheck,
  DollarSign,
  AlertCircle,
  ExternalLink,
  MessageSquare,
  Truck,
  PackageCheck,
  Server,
  Globe,
  ChevronDown,
  ChevronUp,
  Zap,
  Radio,
  Copy,
  Check,
} from 'lucide-react';
import { useEthiopianSteel } from '../context/EthiopianSteelContext';

export const StaffAdminTab: React.FC = () => {
  const {
    lang,
    submittedOrders,
    updateOrderStatus,
    quoteOrderPrice,
    stockInventory,
    updateStockItem,
    hapticFeedback,
    showToast,
    refreshOrders,
    isRefreshingOrders,
    refreshStock,
  } = useEthiopianSteel();

  const [activeAdminSubtab, setActiveAdminSubtab] = useState<'orders' | 'stock'>('orders');
  const [filter, setFilter] = useState<'all' | 'unquoted' | 'quoted' | 'pending' | 'processing' | 'shipped' | 'delivered' | 'completed'>('all');
  const [search, setSearch] = useState('');

  // Local quote inputs per order ID (supports both unit price and total price)
  const [quoteInputs, setQuoteInputs] = useState<Record<string, { price: string; unitPrice: string; notes: string; isOpen: boolean }>>({});

  // Local stock edit state per stock item ID
  const [stockEditState, setStockEditState] = useState<Record<string, { meters: string; inStock: boolean; noteAm: string; noteEn: string }>>({});

  // 24/7 Hosting & Webhook status
  const [is247Open, setIs247Open] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [webhookInputUrl, setWebhookInputUrl] = useState('');
  const [tgBotStatus, setTgBotStatus] = useState<any>(null);
  const [isUpdatingWebhook, setIsUpdatingWebhook] = useState(false);

  const fetchTelegramStatus = async () => {
    try {
      const res = await fetch('/api/telegram/status');
      const data = await res.json();
      setTgBotStatus(data);
      if (data?.webhookInfo?.result?.url) {
        setWebhookInputUrl(data.webhookInfo.result.url);
      }
    } catch {}
  };

  useEffect(() => {
    fetchTelegramStatus();
  }, []);

  const handleSetWebhook = async () => {
    if (!webhookInputUrl.trim().startsWith('https://')) {
      showToast(lang === 'am' ? 'እባክዎ ትክክለኛ HTTPS URL ያስገቡ' : 'Please provide a valid HTTPS URL');
      return;
    }
    setIsUpdatingWebhook(true);
    try {
      const res = await fetch('/api/telegram/register-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: webhookInputUrl.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(lang === 'am' ? '✅ ዌብሁክ ተመዝግቧል! ቦቱ 24/7 ይሰራል' : '✅ Webhook registered! Bot is live 24/7');
        fetchTelegramStatus();
      } else {
        showToast(`Error: ${data.error || 'Failed'}`);
      }
    } catch {
      showToast('Network error setting webhook');
    } finally {
      setIsUpdatingWebhook(false);
    }
  };

  const handleClearWebhook = async () => {
    setIsUpdatingWebhook(true);
    try {
      const res = await fetch('/api/telegram/clear-webhook', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(lang === 'am' ? 'ሎንግ ፖሊንግ በርቷል' : 'Long-polling restored');
        fetchTelegramStatus();
      }
    } catch {
      showToast('Failed to clear webhook');
    } finally {
      setIsUpdatingWebhook(false);
    }
  };

  const filtered = submittedOrders.filter(o => {
    const matchesSearch =
      o.order_id.toLowerCase().includes(search.toLowerCase()) ||
      o.first_name.toLowerCase().includes(search.toLowerCase()) ||
      (o.username && o.username.toLowerCase().includes(search.toLowerCase())) ||
      o.phone.includes(search);

    let matchesStatus = true;
    if (filter === 'all') matchesStatus = true;
    else if (filter === 'unquoted') matchesStatus = !o.quotedPriceETB;
    else if (filter === 'quoted') matchesStatus = Boolean(o.quotedPriceETB);
    else matchesStatus = o.status === filter;

    return matchesStatus && matchesSearch;
  });

  const handleDownloadCsv = () => {
    hapticFeedback('medium');
    const a = document.createElement('a');
    a.href = '/api/orders/export';
    a.setAttribute('download', 'ethiopian_steel_orders.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleRefreshAll = async () => {
    hapticFeedback('light');
    await Promise.all([refreshOrders(), refreshStock()]);
    showToast(lang === 'am' ? 'ዳታው ታድሷል' : 'Orders & stock refreshed');
  };

  const toggleQuoteBox = (orderId: string, currentPrice?: number, currentNotes?: string, currentUnitPrice?: number) => {
    hapticFeedback('light');
    const order = submittedOrders.find(o => o.order_id === orderId);
    const qty = order ? parseFloat(order.quantity) || 1 : 1;
    const initialPrice = currentPrice ? String(currentPrice) : '';
    const initialUnit = currentUnitPrice
      ? String(currentUnitPrice)
      : currentPrice
      ? String(Math.round(currentPrice / qty))
      : '';

    setQuoteInputs(prev => ({
      ...prev,
      [orderId]: {
        price: prev[orderId]?.price || initialPrice,
        unitPrice: prev[orderId]?.unitPrice || initialUnit,
        notes: prev[orderId]?.notes || currentNotes || '',
        isOpen: !prev[orderId]?.isOpen,
      },
    }));
  };

  const handleSaveQuote = async (orderId: string) => {
    const data = quoteInputs[orderId];
    const order = submittedOrders.find(o => o.order_id === orderId);
    const qty = order ? parseFloat(order.quantity) || 1 : 1;

    let priceNum = data?.price ? Number(data.price) : 0;
    let unitPriceNum = data?.unitPrice ? Number(data.unitPrice) : 0;

    // If unit price entered but total not entered
    if ((!priceNum || priceNum <= 0) && unitPriceNum > 0) {
      priceNum = Math.round(unitPriceNum * qty);
    }
    // If total price entered but unit price not entered
    if ((!unitPriceNum || unitPriceNum <= 0) && priceNum > 0) {
      unitPriceNum = Math.round((priceNum / qty) * 100) / 100;
    }

    if (!priceNum || isNaN(priceNum) || priceNum <= 0) {
      hapticFeedback('error');
      showToast(lang === 'am' ? 'እባክዎ ትክክለኛ ዋጋ በብር ያስገቡ' : 'Please enter a valid price in ETB');
      return;
    }

    await quoteOrderPrice(orderId, priceNum, data?.notes, unitPriceNum);
    setQuoteInputs(prev => ({
      ...prev,
      [orderId]: { ...prev[orderId], isOpen: false },
    }));
  };

  const handleSaveStock = async (itemId: string) => {
    const edit = stockEditState[itemId];
    const currentItem = stockInventory.find(s => s.id === itemId);
    if (!currentItem) return;

    const inStock = edit ? edit.inStock : currentItem.inStock;
    const meters = edit && edit.meters !== undefined ? Number(edit.meters) : currentItem.stockMeters;
    const noteAm = edit?.noteAm !== undefined ? edit.noteAm : currentItem.noteAm;
    const noteEn = edit?.noteEn !== undefined ? edit.noteEn : currentItem.noteEn;

    await updateStockItem(itemId, inStock, meters, noteAm, noteEn);
  };

  return (
    <div id="tg-staff-tab" className="flex flex-col gap-4 p-3.5 pb-24 text-white">
      {/* Staff Header */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#4a8ac7]/20 border border-[#4a8ac7]/40 text-[#fdc672] flex items-center justify-center font-bold">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">
              {lang === 'am' ? 'የፋብሪካ አስተዳዳሪ & ዋጋ ሰጪ' : 'Factory Admin & Quotations'}
            </h2>
            <span className="text-[10px] text-white/60">
              {submittedOrders.length} {lang === 'am' ? 'ጠቅላላ ትዕዛዞች' : 'Total Orders'} · {stockInventory.length} {lang === 'am' ? 'የምርት ክምችቶች' : 'Stock Items'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefreshAll}
            disabled={isRefreshingOrders}
            title={lang === 'am' ? 'አድስ' : 'Refresh'}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white text-xs flex items-center justify-center active:scale-95 transition-all disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshingOrders ? 'animate-spin text-[#fdc672]' : ''}`} />
          </button>
          <button
            onClick={handleDownloadCsv}
            className="px-2.5 py-1.5 rounded-xl bg-[#4a8ac7] hover:bg-[#3a72a8] border border-white/20 text-white text-xs font-bold flex items-center gap-1 active:scale-95 transition-all shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#fdc672]" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Main Admin Sub-Tabs */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#0b1624] rounded-2xl border border-white/10">
        <button
          type="button"
          onClick={() => {
            hapticFeedback('light');
            setActiveAdminSubtab('orders');
          }}
          className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeAdminSubtab === 'orders'
              ? 'bg-[#4a8ac7] text-white shadow-md'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <ClipboardCheck className="w-3.5 h-3.5 text-[#fdc672]" />
          <span>{lang === 'am' ? 'ትዕዛዞች እና ዋጋ' : 'Orders & Quotes'}</span>
          {submittedOrders.some(o => !o.quotedPriceETB) && (
            <span className="w-2 h-2 rounded-full bg-[#fdc672] animate-pulse" />
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            hapticFeedback('light');
            setActiveAdminSubtab('stock');
          }}
          className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
            activeAdminSubtab === 'stock'
              ? 'bg-[#4a8ac7] text-white shadow-md'
              : 'text-white/60 hover:text-white'
          }`}
        >
          <Boxes className="w-3.5 h-3.5 text-[#fdc672]" />
          <span>{lang === 'am' ? 'የመጋዘን ክምችት' : 'Factory Stock'}</span>
        </button>
      </div>

      {/* Telegram Bot Live Dispatch Status Card */}
      <div className="p-3 rounded-2xl bg-gradient-to-r from-[#17304a] to-[#0f1d2e] border border-[#4a8ac7]/40 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-[#4a8ac7]/20 text-[#fdc672] flex items-center justify-center font-bold">
            <Send className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white">Telegram Push: Active</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <span className="text-[10px] text-white/60">
              Chat ID: <code className="text-[#fdc672] font-mono">6184751487</code>
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={async () => {
            hapticFeedback('medium');
            try {
              const res = await fetch('/api/telegram/test', { method: 'POST' });
              const data = await res.json();
              if (data.success) {
                showToast(lang === 'am' ? 'የሙከራ መልዕክት ወደ ቴሌግራም ተልኳል!' : 'Test message sent to Telegram!');
              } else {
                showToast(lang === 'am' ? `ስህተት፡ ${data.error}` : `Error: ${data.error}`);
              }
            } catch (err: any) {
              showToast('Failed to contact server');
            }
          }}
          className="px-2.5 py-1.5 rounded-xl bg-[#4a8ac7]/20 hover:bg-[#4a8ac7]/30 border border-[#4a8ac7]/40 text-[#fdc672] text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-all"
        >
          <span>{lang === 'am' ? 'ቴሌግራም ሞክር' : 'Test Ping'}</span>
        </button>
      </div>

      {/* Telegram Bot Commands Live Reference */}
      <div className="p-3 rounded-2xl bg-[#0f1d2e] border border-white/10 flex flex-col gap-2 text-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-bold text-white">
            <span className="text-[#fdc672]">🤖 Telegram Bot Commands</span>
            <span className="text-[10px] text-white/50 font-mono">@esplc_bot</span>
          </div>
          <a
            href="https://t.me/esplc_bot"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-[#fdc672] hover:underline flex items-center gap-1"
          >
            <span>Open in Telegram</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono">
          <div className="p-1.5 rounded-lg bg-white/5 border border-white/5">
            <span className="text-[#fdc672] font-bold">/start</span>
            <span className="text-white/60 block text-[10px] font-sans">Main Menu & Buttons</span>
          </div>
          <div className="p-1.5 rounded-lg bg-white/5 border border-white/5">
            <span className="text-[#fdc672] font-bold">/products</span>
            <span className="text-white/60 block text-[10px] font-sans">Profiles & Gauges</span>
          </div>
          <div className="p-1.5 rounded-lg bg-white/5 border border-white/5">
            <span className="text-[#fdc672] font-bold">/status [id]</span>
            <span className="text-white/60 block text-[10px] font-sans">Order tracking</span>
          </div>
          <div className="p-1.5 rounded-lg bg-white/5 border border-white/5">
            <span className="text-[#fdc672] font-bold">/calc 10 12</span>
            <span className="text-white/60 block text-[10px] font-sans">Roof sheet estimator</span>
          </div>
          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <span className="text-amber-300 font-bold">/orders</span>
            <span className="text-white/60 block text-[10px] font-sans">Admin recent orders</span>
          </div>
          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <span className="text-amber-300 font-bold">/quote [id] [etb]</span>
            <span className="text-white/60 block text-[10px] font-sans">Direct Telegram quote</span>
          </div>
        </div>
      </div>

      {/* 24/7 Hosting & Bot Webhook Controller */}
      <div className="p-3 rounded-2xl bg-[#0b1624] border border-[#4a8ac7]/30 flex flex-col gap-2.5 text-xs">
        <div
          onClick={() => setIs247Open(!is247Open)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-bold text-white flex items-center gap-1.5">
                <span>{lang === 'am' ? '24/7 ቋሚ ማስተናገጃ እና ዌብሁክ' : '24/7 Hosting & Webhook'}</span>
                {tgBotStatus?.webhookInfo?.result?.url ? (
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                    Webhook 24/7 Live
                  </span>
                ) : (
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-blue-500/20 text-blue-300 border border-blue-500/30 font-mono">
                    Studio Polling Active
                  </span>
                )}
              </div>
              <p className="text-[10px] text-white/50">
                {lang === 'am'
                  ? 'ያለ ጉግል ስቱዲዮ ቦቱን 24/7 እንዴት ክፍት ማድረግ እንደሚቻል'
                  : 'How to keep Bot & Mini App active 24/7 without Google Studio'}
              </p>
            </div>
          </div>
          <button className="text-white/60 hover:text-white p-1">
            {is247Open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {is247Open && (
          <div className="mt-1 pt-2.5 border-t border-white/10 flex flex-col gap-3">
            {/* Direct Answer Alert */}
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] leading-relaxed text-amber-200/90 flex flex-col gap-1.5">
              <span className="font-bold text-amber-300 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {lang === 'am' ? 'ጥያቄ: በ Google Studio ሁልጊዜ ክፍት መሆን ያስፈልጋል?' : 'Do I need to be live on Google Studio 24/7?'}
              </span>
              <p>
                {lang === 'am'
                  ? '❌ አይ! በ Google Studio ውስጥ የዴቭ ሰርቨሩ የሚሰራው የስቱዲዮው ገጽ ክፍት እስካለ ድረስ ብቻ ነው። ለ 24/7 ቋሚ አገልግሎት ይህንን አፕሊኬሽን ወደ ቋሚ ክላውድ (እንደ Render, Railway, ወይም Google Cloud Run) ማስቀመጥ ይቻላል።'
                  : '❌ No! Google Studio is a development environment that sleeps when closed. For true 24/7 uptime without keeping Studio open, deploy the code to a persistent host (e.g. Render, Railway, Fly.io, or Cloud Run).'}
              </p>
            </div>

            {/* Current Bot Connection Status */}
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-1.5 font-mono text-[10px]">
              <div className="flex items-center justify-between text-white/80">
                <span>Bot:</span>
                <span className="text-[#fdc672]">@{tgBotStatus?.botInfo?.result?.username || 'esplc_bot'}</span>
              </div>
              <div className="flex items-center justify-between text-white/80">
                <span>Target Chat ID:</span>
                <span className="text-white">{tgBotStatus?.targetChatId || '6184751487'}</span>
              </div>
              <div className="flex items-center justify-between text-white/80">
                <span>Active Mode:</span>
                <span className={tgBotStatus?.webhookInfo?.result?.url ? 'text-emerald-400 font-bold' : 'text-blue-300 font-bold'}>
                  {tgBotStatus?.webhookInfo?.result?.url ? 'Webhook (24/7 Event-Driven)' : 'Long Polling (Dev Session)'}
                </span>
              </div>
              {tgBotStatus?.webhookInfo?.result?.url && (
                <div className="text-[9px] text-white/50 truncate">
                  URL: {tgBotStatus.webhookInfo.result.url}
                </div>
              )}
            </div>

            {/* Set Webhook Section */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-white/80">
                {lang === 'am' ? 'የቋሚ ሰርቨር ዌብሁክ ዩአርኤል (Production URL):' : 'Production Webhook HTTPS URL:'}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={webhookInputUrl}
                  onChange={e => setWebhookInputUrl(e.target.value)}
                  placeholder="https://your-production-app.onrender.com"
                  className="flex-1 bg-black/40 border border-white/20 rounded-xl px-2.5 py-1.5 text-[11px] text-white placeholder-white/30 focus:outline-none focus:border-[#fdc672]"
                />
                <button
                  onClick={handleSetWebhook}
                  disabled={isUpdatingWebhook}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-[11px] font-bold flex items-center gap-1 active:scale-95 transition-all whitespace-nowrap disabled:opacity-50"
                >
                  <Globe className="w-3 h-3" />
                  <span>{lang === 'am' ? 'ዌብሁክ አስቀምጥ' : 'Set Webhook'}</span>
                </button>
              </div>
              {tgBotStatus?.webhookInfo?.result?.url && (
                <button
                  onClick={handleClearWebhook}
                  disabled={isUpdatingWebhook}
                  className="self-start text-[10px] text-red-400 hover:underline pt-0.5"
                >
                  {lang === 'am' ? 'ወደ ስቱዲዮ ሎንግ ፖሊንግ መልስ (Clear Webhook)' : 'Switch back to Studio polling'}
                </button>
              )}
            </div>

            {/* 3 Step Deployment Summary */}
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-[11px]">
                  {lang === 'am' ? '🚀 በ 3 እርምጃዎች 24/7 ማስተናገድ:' : '🚀 3 Steps for 24/7 Free Cloud Hosting:'}
                </span>
                <button
                  onClick={() => {
                    hapticFeedback('light');
                    navigator.clipboard.writeText(
                      `TELEGRAM_BOT_TOKEN=7348905759:AAFHswUaBBjyX8PNJrvk3f_j8D3WFczWmWw\nTELEGRAM_TARGET_CHAT_ID=6184751487\nPORT=3000`
                    );
                    setCopiedEnv(true);
                    setTimeout(() => setCopiedEnv(false), 2000);
                  }}
                  className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-[10px] text-[#fdc672] flex items-center gap-1"
                >
                  {copiedEnv ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedEnv ? 'Copied Env' : 'Copy Env Vars'}</span>
                </button>
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[10px] text-white/70 leading-normal">
                <li>
                  <strong className="text-white">Push to GitHub:</strong> Export or commit this repository to your GitHub account.
                </li>
                <li>
                  <strong className="text-white">Deploy on Render / Railway:</strong> Create a new Web Service from your repo, set Build Command to <code className="text-[#fdc672]">npm run build</code> and Start Command to <code className="text-[#fdc672]">npm start</code>.
                </li>
                <li>
                  <strong className="text-white">Add Environment Variables:</strong> Add <code className="text-emerald-400">TELEGRAM_BOT_TOKEN</code> & <code className="text-emerald-400">TELEGRAM_TARGET_CHAT_ID</code>.
                </li>
              </ol>
            </div>
          </div>
        )}
      </div>


      {/* VIEW 1: ORDERS & QUOTATIONS */}
      {activeAdminSubtab === 'orders' && (
        <div className="flex flex-col gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={lang === 'am' ? 'በትዕዛዝ ቁጥር፣ በስም፣ በቴሌግራም ወይም በስልክ ፈልግ...' : 'Search by ID, Name, Telegram or Phone...'}
              className="w-full bg-[#0f1d2e] border border-[#4a8ac7]/30 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#fdc672]"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            {(
              [
                { id: 'all', labelAm: 'ሁሉም', labelEn: 'All' },
                { id: 'unquoted', labelAm: 'ዋጋ ያልተሰጣቸው', labelEn: 'Needs Quote' },
                { id: 'quoted', labelAm: 'ዋጋ የተሰጣቸው', labelEn: 'Quoted' },
                { id: 'pending', labelAm: 'በመጠባበቅ ላይ', labelEn: 'Pending' },
                { id: 'processing', labelAm: 'በሂደት ላይ', labelEn: 'Processing' },
                { id: 'shipped', labelAm: '🚚 ተልኳል', labelEn: 'Shipped' },
                { id: 'delivered', labelAm: '📦 ደርሷል', labelEn: 'Delivered' },
                { id: 'completed', labelAm: 'የተጠናቀቁ', labelEn: 'Completed' },
              ] as const
            ).map(f => (
              <button
                key={f.id}
                onClick={() => {
                  hapticFeedback('light');
                  setFilter(f.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  filter === f.id
                    ? 'bg-[#4a8ac7] text-white shadow-sm border border-white/20'
                    : 'bg-[#0f1d2e] text-white/60 hover:text-white border border-white/5'
                }`}
              >
                {lang === 'am' ? f.labelAm : f.labelEn}
              </button>
            ))}
          </div>

          {/* Orders List */}
          <div className="flex flex-col gap-3">
            {filtered.map(order => {
              const quoteBox = quoteInputs[order.order_id];
              const isBoxOpen = quoteBox?.isOpen;
              const hasQuote = Boolean(order.quotedPriceETB);

              return (
                <div
                  key={order.order_id}
                  className="rounded-2xl bg-[#0f1d2e] border border-[#4a8ac7]/30 p-3.5 flex flex-col gap-2.5 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-[#fdc672]">{order.order_id}</span>
                      <span className="text-[10px] text-white/50 block mt-0.5">{order.timestamp}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {hasQuote ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>{order.quotedPriceETB?.toLocaleString()} ETB</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#fdc672]/20 text-[#fdc672] border border-[#fdc672]/30 flex items-center gap-1">
                          <AlertCircle className="w-2.5 h-2.5" />
                          <span>{lang === 'am' ? 'ዋጋ ያስፈልገዋል' : 'Needs Quote'}</span>
                        </span>
                      )}

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                          order.status === 'delivered'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : order.status === 'shipped'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : order.status === 'completed'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : order.status === 'processing'
                            ? 'bg-[#4a8ac7]/20 text-[#fdc672] border border-[#4a8ac7]/30'
                            : 'bg-white/10 text-white/70 border border-white/10'
                        }`}
                      >
                        {order.status === 'shipped'
                          ? '🚚 Shipped'
                          : order.status === 'delivered'
                          ? '📦 Delivered'
                          : order.status}
                      </span>
                    </div>
                  </div>

                  {/* Customer & Product Spec */}
                  <div className="bg-[#0b1624] p-2.5 rounded-xl border border-white/5 text-xs grid grid-cols-2 gap-1.5">
                    <div>
                      <span className="text-[10px] text-white/40 block">{lang === 'am' ? 'ደንበኛ:' : 'Customer:'}</span>
                      <span className="font-semibold text-white">{order.first_name}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-white/40 block">Telegram:</span>
                      <span className="font-mono font-bold text-[#fdc672]">
                        {order.username ? (order.username.startsWith('@') ? order.username : `@${order.username}`) : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-white/40 block">{lang === 'am' ? 'ምርት:' : 'Product:'}</span>
                      <span className="font-semibold text-white">{order.product}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-white/40 block">{lang === 'am' ? 'ብዛት:' : 'Quantity:'}</span>
                      <span className="font-black text-[#fdc672]">{order.quantity}m</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-white/40 block">{lang === 'am' ? 'ጋጅ & ቀለም:' : 'Gauge & Color:'}</span>
                      <span className="text-white text-[11px]">
                        {order.gauge} • {order.color}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-white/40 block">{lang === 'am' ? 'ስልክ:' : 'Phone:'}</span>
                      <a href={`tel:${order.phone}`} className="text-[#4a8ac7] font-mono text-[11px] underline">
                        {order.phone}
                      </a>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-white/40 block">{lang === 'am' ? 'አድራሻ:' : 'Address:'}</span>
                      <span className="text-white text-[11px]">{order.address}</span>
                    </div>
                  </div>

                  {/* Quoted Price Display or Form */}
                  {hasQuote && !isBoxOpen && (
                    <div className="p-2.5 rounded-xl bg-gradient-to-r from-[#17304a] to-[#0b1624] border border-[#fdc672]/30 flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-[#fdc672] font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{lang === 'am' ? 'የተሰጠው ዋጋ (Quoted to Telegram):' : 'Quoted Price to Telegram:'}</span>
                        </div>
                        <div className="text-sm font-black text-white font-mono mt-0.5">
                          {order.quotedPriceETB?.toLocaleString()} ETB
                        </div>
                        {order.unitPriceETB && (
                          <div className="text-[11px] text-[#fdc672] font-mono mt-0.5">
                            {order.quantity}m × {order.unitPriceETB?.toLocaleString()} ETB/m
                          </div>
                        )}
                        {order.quoteNotes && (
                          <div className="text-[10px] text-white/70 mt-0.5 italic">"{order.quoteNotes}"</div>
                        )}
                        {order.quotedAt && (
                          <div className="text-[9px] text-white/40 mt-0.5">Quoted: {order.quotedAt}</div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleQuoteBox(order.order_id, order.quotedPriceETB, order.quoteNotes, order.unitPriceETB)}
                        className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-bold text-white transition-all"
                      >
                        {lang === 'am' ? 'ዋጋ ቀይር' : 'Adjust Quote'}
                      </button>
                    </div>
                  )}

                  {/* Quote Input Box (Open or unquoted) */}
                  {(isBoxOpen || (!hasQuote && order.status !== 'completed')) && (
                    <div className="p-3 rounded-xl bg-[#0b1624] border border-[#4a8ac7]/40 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#fdc672] flex items-center gap-1">
                          <DollarSign className="w-3.5 h-3.5" />
                          <span>{lang === 'am' ? 'የዋጋ ስሌት (Quotation Calculator):' : 'Quotation & Unit Price (ETB):'}</span>
                        </span>
                        {isBoxOpen && hasQuote && (
                          <button
                            type="button"
                            onClick={() => toggleQuoteBox(order.order_id)}
                            className="text-[10px] text-white/50 hover:text-white"
                          >
                            Cancel
                          </button>
                        )}
                      </div>

                      {/* Quantity Context Banner */}
                      <div className="text-[11px] px-2.5 py-1 rounded-lg bg-[#4a8ac7]/10 border border-[#4a8ac7]/30 text-white/80 flex items-center justify-between">
                        <span>{lang === 'am' ? 'የትዕዛዝ መጠን (Qty):' : 'Order Qty:'} <strong className="text-white font-mono">{order.quantity} m</strong></span>
                        <span className="text-[#fdc672] font-mono text-[10px]">{order.gauge} • {order.product}</span>
                      </div>

                      {/* Dual Input: Unit Price & Total Price */}
                      <div className="grid grid-cols-2 gap-2">
                        {/* Unit Price Input */}
                        <div>
                          <label className="text-[10px] text-white/60 font-semibold block mb-1">
                            {lang === 'am' ? 'የአንዱ ሜትር ዋጋ (Unit Price):' : 'Unit Price (ETB/m):'}
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              step="10"
                              value={quoteBox?.unitPrice ?? (order.unitPriceETB ? String(order.unitPriceETB) : '')}
                              onChange={e => {
                                const unitVal = e.target.value;
                                const qty = parseFloat(order.quantity) || 1;
                                const totalCalc = unitVal && !isNaN(Number(unitVal)) ? String(Math.round(Number(unitVal) * qty)) : '';
                                setQuoteInputs(prev => ({
                                  ...prev,
                                  [order.order_id]: {
                                    unitPrice: unitVal,
                                    price: totalCalc || prev[order.order_id]?.price || '',
                                    notes: prev[order.order_id]?.notes ?? order.quoteNotes ?? '',
                                    isOpen: true,
                                  },
                                }));
                              }}
                              placeholder="e.g. 1050"
                              className="w-full bg-[#0f1d2e] border border-white/15 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white placeholder-white/30 focus:outline-none focus:border-[#fdc672]"
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#fdc672] font-bold">
                              /m
                            </span>
                          </div>
                        </div>

                        {/* Total Quoted Price Input */}
                        <div>
                          <label className="text-[10px] text-white/60 font-semibold block mb-1">
                            {lang === 'am' ? 'ጠቅላላ ዋጋ (Total Price):' : 'Total Price (ETB):'}
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              min="0"
                              step="100"
                              value={quoteBox?.price ?? (order.quotedPriceETB ? String(order.quotedPriceETB) : '')}
                              onChange={e => {
                                const totalVal = e.target.value;
                                const qty = parseFloat(order.quantity) || 1;
                                const unitCalc = totalVal && !isNaN(Number(totalVal)) ? String(Math.round((Number(totalVal) / qty) * 100) / 100) : '';
                                setQuoteInputs(prev => ({
                                  ...prev,
                                  [order.order_id]: {
                                    price: totalVal,
                                    unitPrice: unitCalc || prev[order.order_id]?.unitPrice || '',
                                    notes: prev[order.order_id]?.notes ?? order.quoteNotes ?? '',
                                    isOpen: true,
                                  },
                                }));
                              }}
                              placeholder="e.g. 105000"
                              className="w-full bg-[#0f1d2e] border border-white/15 rounded-xl px-2.5 py-1.5 text-xs font-bold text-white placeholder-white/30 focus:outline-none focus:border-[#fdc672]"
                            />
                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-[#fdc672] font-bold">
                              ETB
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Optional Notes Input */}
                      <input
                        type="text"
                        value={quoteBox?.notes ?? (order.quoteNotes || '')}
                        onChange={e =>
                          setQuoteInputs(prev => ({
                            ...prev,
                            [order.order_id]: {
                              price: prev[order.order_id]?.price ?? (order.quotedPriceETB ? String(order.quotedPriceETB) : ''),
                              unitPrice: prev[order.order_id]?.unitPrice ?? (order.unitPriceETB ? String(order.unitPriceETB) : ''),
                              notes: e.target.value,
                              isOpen: true,
                            },
                          }))
                        }
                        placeholder={lang === 'am' ? 'ማስታወሻ (ምሳሌ፡ 5% ቅናሽ እና መጓጓዣ ያካትታል)...' : 'Notes (e.g. Includes 5% discount & Kaliti delivery)...'}
                        className="w-full bg-[#0f1d2e] border border-white/10 rounded-xl px-3 py-1.5 text-[11px] text-white placeholder-white/30 focus:outline-none focus:border-[#fdc672]"
                      />

                      {/* Send Button */}
                      <button
                        type="button"
                        onClick={() => handleSaveQuote(order.order_id)}
                        className="w-full py-2 rounded-xl bg-[#4a8ac7] hover:bg-[#3a72a8] active:scale-98 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md border border-white/20"
                      >
                        <Send className="w-3.5 h-3.5 text-[#fdc672]" />
                        <span>{lang === 'am' ? 'ዋጋውን ወደ ቴሌግራም ላክ' : 'Send Quotation to Telegram'}</span>
                      </button>
                    </div>
                  )}

                  {/* Quick Telegram and Status buttons */}
                  <div className="flex items-center gap-2 pt-1 border-t border-white/10">
                    {order.username && (
                      <a
                        href={`https://t.me/${order.username.replace('@', '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="py-1.5 px-3 rounded-lg bg-[#4a8ac7]/20 hover:bg-[#4a8ac7]/30 border border-[#4a8ac7]/40 text-xs font-bold text-[#fdc672] flex items-center gap-1 active:scale-95"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Telegram</span>
                      </a>
                    )}

                    <a
                      href={`tel:${order.phone}`}
                      className="py-1.5 px-3 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white/80 flex items-center gap-1 active:scale-95"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{order.phone}</span>
                    </a>

                    <div className="flex-1 flex flex-wrap justify-end gap-1.5">
                      {order.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateOrderStatus(order.order_id, 'processing')}
                            title="Set to In Production"
                            className="px-2.5 py-1.5 rounded-lg bg-[#4a8ac7]/20 hover:bg-[#4a8ac7]/30 text-[#fdc672] border border-[#4a8ac7]/30 text-[11px] font-bold active:scale-95 transition-all"
                          >
                            {lang === 'am' ? 'ማምረት ጀምር' : 'Process'}
                          </button>
                          <button
                            onClick={() => updateOrderStatus(order.order_id, 'shipped')}
                            title="Send Telegram notification: Shipped"
                            className="px-2.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold active:scale-95 flex items-center gap-1 transition-all"
                          >
                            <Truck className="w-3 h-3" />
                            <span>{lang === 'am' ? 'ላክ (Shipped)' : 'Ship'}</span>
                          </button>
                          <button
                            onClick={() => updateOrderStatus(order.order_id, 'delivered')}
                            title="Send Telegram notification: Delivered"
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold active:scale-95 flex items-center gap-1 transition-all"
                          >
                            <PackageCheck className="w-3 h-3" />
                            <span>{lang === 'am' ? 'ደርሷል (Delivered)' : 'Deliver'}</span>
                          </button>
                        </>
                      )}

                      {order.status === 'processing' && (
                        <>
                          <button
                            onClick={() => updateOrderStatus(order.order_id, 'shipped')}
                            title="Send Telegram notification: Shipped"
                            className="px-2.5 py-1.5 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[11px] font-bold active:scale-95 flex items-center gap-1 transition-all"
                          >
                            <Truck className="w-3 h-3" />
                            <span>{lang === 'am' ? 'ላክ (Ship)' : 'Ship'}</span>
                          </button>
                          <button
                            onClick={() => updateOrderStatus(order.order_id, 'completed')}
                            className="px-2.5 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-[11px] font-bold active:scale-95 transition-all"
                          >
                            {lang === 'am' ? 'ተጠናቋል' : 'Complete'}
                          </button>
                        </>
                      )}

                      {order.status === 'shipped' && (
                        <button
                          onClick={() => updateOrderStatus(order.order_id, 'delivered')}
                          title="Send Telegram notification: Delivered"
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold active:scale-95 flex items-center gap-1 transition-all"
                        >
                          <PackageCheck className="w-3 h-3" />
                          <span>{lang === 'am' ? 'ደርሷል (Mark Delivered)' : 'Mark Delivered'}</span>
                        </button>
                      )}

                      {order.status === 'delivered' && (
                        <span className="text-[10px] text-emerald-400 font-bold px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{lang === 'am' ? 'ተረክቧል ✈️ ቴሌግራም ደርሷል' : 'Delivered & Customer Notified'}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filtered.length === 0 && (
              <div className="py-12 text-center text-white/40 text-xs">
                {lang === 'am' ? 'ምንም ትዕዛዝ አልተገኘም' : 'No orders found matching criteria'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: FACTORY STOCK INVENTORY MANAGEMENT */}
      {activeAdminSubtab === 'stock' && (
        <div className="flex flex-col gap-3">
          <div className="p-3 rounded-xl bg-[#0b1624] border border-white/10 text-xs text-white/80">
            <span className="font-bold text-[#fdc672] block mb-1">
              {lang === 'am' ? 'የፋብሪካ ክምችት መቆጣጠሪያ' : 'Real-time Stock Management'}
            </span>
            <p className="text-[11px] text-white/70">
              {lang === 'am'
                ? 'እዚህ የሚቀይሩት የክምችት ሁኔታ (በመጋዘን ያለ / ያለቀ) በደንበኞች የትዕዛዝ ቅጽ እና ካልኩሌተር ላይ በቀጥታ ይታያል።'
                : 'Stock availability toggles (In Stock / Out of Stock) update immediately in the Order Builder and Roof Calculator.'}
            </p>
          </div>

          <div className="flex flex-col gap-2.5">
            {stockInventory.map(item => {
              const edit = stockEditState[item.id];
              const inStock = edit !== undefined ? edit.inStock : item.inStock;
              const meters = edit?.meters !== undefined ? edit.meters : String(item.stockMeters);

              return (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-[#0f1d2e] border border-[#4a8ac7]/30 flex flex-col gap-2.5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-xs text-white">{item.name}</h4>
                      <span className="text-[10px] text-white/50 font-mono">ID: {item.id}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        hapticFeedback('light');
                        setStockEditState(prev => ({
                          ...prev,
                          [item.id]: {
                            inStock: !inStock,
                            meters: prev[item.id]?.meters ?? String(item.stockMeters),
                            noteAm: prev[item.id]?.noteAm ?? item.noteAm ?? '',
                            noteEn: prev[item.id]?.noteEn ?? item.noteEn ?? '',
                          },
                        }));
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-bold border transition-all ${
                        inStock
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-red-500/20 text-red-300 border-red-500/40'
                      }`}
                    >
                      {inStock ? (lang === 'am' ? '✓ በመጋዘን አለ' : '✓ In Stock') : (lang === 'am' ? '✕ አልቋል' : '✕ Out of Stock')}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-white/50 block mb-1">
                        {lang === 'am' ? 'የክምችት መጠን (ሜትር):' : 'Stock Length (Meters):'}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={meters}
                        onChange={e =>
                          setStockEditState(prev => ({
                            ...prev,
                            [item.id]: {
                              inStock: prev[item.id]?.inStock ?? item.inStock,
                              meters: e.target.value,
                              noteAm: prev[item.id]?.noteAm ?? item.noteAm ?? '',
                              noteEn: prev[item.id]?.noteEn ?? item.noteEn ?? '',
                            },
                          }))
                        }
                        className="w-full bg-[#0b1624] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#fdc672]"
                      />
                    </div>

                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => handleSaveStock(item.id)}
                        className="w-full py-1.5 rounded-xl bg-[#4a8ac7] hover:bg-[#3a72a8] active:scale-95 text-white text-xs font-bold transition-all border border-white/15 shadow-sm"
                      >
                        {lang === 'am' ? 'አዘምን' : 'Save Update'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};


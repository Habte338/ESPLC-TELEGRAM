import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  AppLanguage,
  ColorOption,
  GaugeOption,
  OrderSubmission,
  RoofingProduct,
  SteelTabType,
  CustomerUser,
} from '../types/ethiopianSteel';
import {
  COLOR_OPTIONS,
  COMPANY_INFO,
  GAUGE_OPTIONS,
  STEEL_PRODUCTS,
  INITIAL_STOCK_INVENTORY,
  StockItemRecord,
} from '../data/ethiopianSteelData';
import { soundEngine } from '../utils/audioHaptics';

interface EthiopianSteelContextType {
  lang: AppLanguage;
  toggleLang: () => void;
  activeTab: SteelTabType;
  setActiveTab: (tab: SteelTabType) => void;
  // Customer Auth
  customer: CustomerUser;
  loginWithTelegram: (userOverride?: { id?: number | string; first_name?: string; username?: string; phone?: string }) => Promise<boolean>;
  loginWithPhoneOrTelegram: (identifier: string, name?: string) => Promise<boolean>;
  loginWithEmail: (email: string, password?: string, name?: string, phone?: string) => Promise<boolean>;
  registerWithEmail: (email: string, password?: string, name?: string, phone?: string) => Promise<boolean>;
  loginWithGoogle: (userData?: Partial<CustomerUser>) => Promise<boolean>;
  logoutCustomer: () => void;
  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (val: boolean) => void;
  // Order Builder Form
  selectedProductId: RoofingProduct['id'];
  setSelectedProductId: (id: RoofingProduct['id']) => void;
  selectedEgaVariant: string;
  setSelectedEgaVariant: (v: string) => void;
  selectedGaugeId: GaugeOption['id'];
  setSelectedGaugeId: (id: GaugeOption['id']) => void;
  selectedColorId: ColorOption['id'];
  setSelectedColorId: (id: ColorOption['id']) => void;
  quantityMeters: string;
  setQuantityMeters: (val: string) => void;
  deliveryAddress: string;
  setDeliveryAddress: (val: string) => void;
  customerPhone: string;
  setCustomerPhone: (val: string) => void;
  customerName: string;
  setCustomerName: (val: string) => void;
  customerTelegramId: string;
  setCustomerTelegramId: (val: string) => void;
  orderNotes: string;
  setOrderNotes: (val: string) => void;
  applyCalculatorResultToOrder: (params: {
    productId?: string;
    productName: string;
    gaugeLabel: string;
    colorName?: string;
    lengthMeters: number;
    sheets?: number;
    sheetLength?: number;
    spanLength?: number;
    slopes?: number;
    weightKg?: number;
    totalETB?: number;
  }) => void;
  // Active selected entities
  currentProduct: RoofingProduct;
  currentGauge: GaugeOption;
  currentColor: ColorOption;
  // Stock Inventory state & check
  stockInventory: StockItemRecord[];
  updateStockItem: (id: string, inStock: boolean, stockMeters?: number, noteAm?: string, noteEn?: string) => Promise<void>;
  checkStockAvailability: (productId: string, variantId?: string) => { inStock: boolean; stockMeters: number; noteAm?: string; noteEn?: string };
  // Order Submissions & Tracking
  submittedOrders: OrderSubmission[];
  activeOrderToTrack: OrderSubmission | null;
  searchOrderQuery: string;
  setSearchOrderQuery: (id: string) => void;
  trackOrderById: (id: string) => OrderSubmission | null;
  submitOrder: () => Promise<OrderSubmission | null>;
  resetOrderForm: () => void;
  refreshOrders: () => Promise<void>;
  isRefreshingOrders: boolean;
  refreshStock: () => Promise<void>;
  // Staff Mode & Admin Quotation
  isStaffMode: boolean;
  setIsStaffMode: (val: boolean) => void;
  updateOrderStatus: (orderId: string, status: 'pending' | 'processing' | 'completed') => void;
  quoteOrderPrice: (orderId: string, priceETB: number, quoteNotes?: string) => Promise<boolean>;
  // Telegram Environment
  isTelegramNative: boolean;
  simulatorFrame: boolean;
  toggleSimulatorFrame: () => void;
  telegramUser: { id?: number; first_name?: string; username?: string };
  // Toast & Haptics
  toastMessage: string | null;
  showToast: (msg: string) => void;
  hapticFeedback: (type?: 'light' | 'medium' | 'heavy' | 'success' | 'error') => void;
  // AI Chat
  aiMessages: Array<{ role: 'user' | 'model'; text: string }>;
  isAiLoading: boolean;
  sendAiMessage: (text: string) => Promise<void>;
  clearAiChat: () => void;
}

const EthiopianSteelContext = createContext<EthiopianSteelContextType | null>(null);

export const EthiopianSteelProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLang] = useState<AppLanguage>('am');
  const [activeTab, setActiveTab] = useState<SteelTabType>('order');
  const [simulatorFrame, setSimulatorFrame] = useState(false);
  const [isTelegramNative, setIsTelegramNative] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Customer Account State (Email / Google / Telegram)
  const [customer, setCustomer] = useState<CustomerUser>(() => {
    try {
      const saved = localStorage.getItem('esplc_customer');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      id: 'cust-' + Math.random().toString(36).substring(2, 7),
      name: '',
      email: '',
      authProvider: 'guest',
      isLoggedIn: false,
    };
  });

  const [isRefreshingOrders, setIsRefreshingOrders] = useState(false);

  // User details
  const [telegramUser, setTelegramUser] = useState<{ id?: number; first_name?: string; username?: string }>({
    id: 99887766,
    first_name: 'Pavel',
    username: 'durov',
  });

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => (prev === msg ? null : prev));
    }, 3000);
  }, []);

  const hapticFeedback = useCallback((type: 'light' | 'medium' | 'heavy' | 'success' | 'error' = 'light') => {
    const tg = window.Telegram?.WebApp;
    if (tg?.HapticFeedback) {
      try {
        if (type === 'success' || type === 'error') {
          tg.HapticFeedback.notificationOccurred(type === 'error' ? 'error' : 'success');
        } else {
          tg.HapticFeedback.impactOccurred(type);
        }
      } catch {}
    }
    if (type === 'success' || type === 'error') {
      soundEngine.playNotification(type);
    } else {
      soundEngine.playImpact(type);
    }
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(type === 'heavy' ? 30 : 15);
      } catch {}
    }
  }, []);

  // Order Builder Form
  const [selectedProductId, setSelectedProductId] = useState<RoofingProduct['id']>('versatile');
  const [selectedEgaVariant, setSelectedEgaVariant] = useState<string>('ega-300');
  const [selectedGaugeId, setSelectedGaugeId] = useState<GaugeOption['id']>('g28');
  const [selectedColorId, setSelectedColorId] = useState<ColorOption['id']>('red');
  const [quantityMeters, setQuantityMeters] = useState('100');
  const [deliveryAddress, setDeliveryAddress] = useState('Addis Ababa, Bole Sub-City');
  const [customerPhone, setCustomerPhone] = useState('0911223344');
  const [customerName, setCustomerName] = useState('Pavel Durov');
  const [customerTelegramId, setCustomerTelegramId] = useState('@durov');
  const [orderNotes, setOrderNotes] = useState('');

  // Stock Inventory State
  const [stockInventory, setStockInventory] = useState<StockItemRecord[]>(() => {
    try {
      const saved = localStorage.getItem('ethiopian_steel_stock');
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_STOCK_INVENTORY;
  });

  // Fetch initial stock from server if available
  useEffect(() => {
    fetch('/api/stock')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.stock) && data.stock.length > 0) {
          setStockInventory(data.stock);
          try {
            localStorage.setItem('ethiopian_steel_stock', JSON.stringify(data.stock));
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  const updateStockItem = useCallback(
    async (id: string, inStock: boolean, stockMeters?: number, noteAm?: string, noteEn?: string) => {
      hapticFeedback('medium');
      setStockInventory(prev => {
        const existing = prev.find(s => s.id === id);
        let updated: StockItemRecord[];
        if (existing) {
          updated = prev.map(s =>
            s.id === id
              ? {
                  ...s,
                  inStock,
                  stockMeters: typeof stockMeters === 'number' ? stockMeters : s.stockMeters,
                  noteAm: noteAm !== undefined ? noteAm : s.noteAm,
                  noteEn: noteEn !== undefined ? noteEn : s.noteEn,
                }
              : s
          );
        } else {
          updated = [
            ...prev,
            {
              id,
              name: id,
              inStock,
              stockMeters: stockMeters || 0,
              noteAm,
              noteEn,
            },
          ];
        }
        try {
          localStorage.setItem('ethiopian_steel_stock', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      try {
        await fetch(`/api/stock/${id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ inStock, stockMeters, noteAm, noteEn }),
        });
      } catch {}

      showToast(
        lang === 'am'
          ? `የክምችት ሁኔታ ተቀይሯል: ${inStock ? 'አለ' : 'አልቋል'}`
          : `Stock updated: ${inStock ? 'In Stock' : 'Out of Stock'}`
      );
    },
    [lang, hapticFeedback, showToast]
  );

  const checkStockAvailability = useCallback(
    (productId: string, variantId?: string) => {
      // Check variant first if specified (e.g. ega-600)
      if (variantId) {
        const foundVariant = stockInventory.find(s => s.id === variantId);
        if (foundVariant) {
          return {
            inStock: foundVariant.inStock,
            stockMeters: foundVariant.stockMeters,
            noteAm: foundVariant.noteAm,
            noteEn: foundVariant.noteEn,
          };
        }
      }
      const foundProduct = stockInventory.find(s => s.id === productId);
      if (foundProduct) {
        return {
          inStock: foundProduct.inStock,
          stockMeters: foundProduct.stockMeters,
          noteAm: foundProduct.noteAm,
          noteEn: foundProduct.noteEn,
        };
      }
      return { inStock: true, stockMeters: 5000, noteAm: 'በመጋዘን አለ', noteEn: 'In Stock' };
    },
    [stockInventory]
  );

  // Orders list
  const [submittedOrders, setSubmittedOrders] = useState<OrderSubmission[]>([
    {
      order_id: 'ORD-20260904-B4A1',
      user_id: '99887766',
      username: 'durov',
      first_name: 'Pavel',
      product: 'ቨርሳታይል (Versatile)',
      product_id: 'versatile',
      gauge: 'G28',
      gauge_id: 'g28',
      color: '🔴 ቀይ (Red)',
      color_id: 'red',
      quantity: '120',
      address: 'Bole Bulbula, Addis Ababa',
      phone: '0911223344',
      timestamp: '2026-09-04 14:32:10',
      status: 'processing',
      quotedPriceETB: 118800,
      quotedByStaff: true,
      quotedAt: '2026-09-04 15:10:00',
      quoteNotes: 'Discounted 5% factory tier. Sent to Telegram @durov',
    },
    {
      order_id: 'ORD-20260902-E9C2',
      user_id: '44332211',
      username: 'alexv',
      first_name: 'Alex',
      product: 'ኢ.ጂ.ኤ (EGA)',
      product_id: 'ega',
      gauge: 'G30',
      gauge_id: 'g30',
      color: '🔘 ቻርኮል (Charcoal)',
      color_id: 'charcoal',
      quantity: '350',
      address: 'Kaliti Industrial Zone, Addis Ababa',
      phone: '0922334455',
      timestamp: '2026-09-02 09:15:00',
      status: 'completed',
      quotedPriceETB: 346500,
      quotedByStaff: true,
      quotedAt: '2026-09-02 10:00:00',
      quoteNotes: 'Approved warehouse bulk rate. Delivered to Kaliti.',
    },
  ]);

  const [activeOrderToTrack, setActiveOrderToTrack] = useState<OrderSubmission | null>(null);
  const [searchOrderQuery, setSearchOrderQuery] = useState('');
  const [isStaffMode, setIsStaffMode] = useState(false);

  // AI Chat state
  const [aiMessages, setAiMessages] = useState<Array<{ role: 'user' | 'model'; text: string }>>([
    {
      role: 'model',
      text: 'ጤና ይስጥልኝ! እንኳን ወደ ኢትዮጵያን ስቲል ፒ.ኤል.ሲ (አንበሳ ቆርቆሮ) በደህና መጡ! 🇪🇹 የ28 ዓመታት የታመነ አገልግሎት። ስለ ምርቶቻችን (ቨርሳታይል፣ ኤሌጋንታይል፣ EGA፣ አንበሳ ቆርቆሮ)፣ ጋጅ ወይም ፋብሪካችን አድራሻ ማንኛውንም ጥያቄ ይጠይቁኝ።',
    },
  ]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Resolve selected entities
  const currentProduct = useMemo(
    () => STEEL_PRODUCTS.find(p => p.id === selectedProductId) || STEEL_PRODUCTS[0],
    [selectedProductId]
  );
  const currentGauge = useMemo(
    () => GAUGE_OPTIONS.find(g => g.id === selectedGaugeId) || GAUGE_OPTIONS[0],
    [selectedGaugeId]
  );
  const currentColor = useMemo(
    () => COLOR_OPTIONS.find(c => c.id === selectedColorId) || COLOR_OPTIONS[0],
    [selectedColorId]
  );

  // Synchronize orders with backend
  const refreshOrders = useCallback(async () => {
    setIsRefreshingOrders(true);
    try {
      const res = await fetch('/api/orders');
      if (res.ok) {
        const data = await res.json();
        const serverOrders: OrderSubmission[] = Array.isArray(data) ? data : (data.orders || []);
        if (Array.isArray(serverOrders) && serverOrders.length > 0) {
          setSubmittedOrders(prev => {
            const map = new Map<string, OrderSubmission>();
            serverOrders.forEach(o => map.set(o.order_id, o));
            prev.forEach(o => {
              if (!map.has(o.order_id)) map.set(o.order_id, o);
            });
            const merged = Array.from(map.values());
            merged.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
            try {
              localStorage.setItem('ethiopian_steel_orders', JSON.stringify(merged));
            } catch {}
            return merged;
          });
        }
      }
    } catch (err) {
      console.warn('Orders fetch error:', err);
    } finally {
      setIsRefreshingOrders(false);
    }
  }, []);

  // Synchronize factory stock inventory with backend
  const refreshStock = useCallback(async () => {
    try {
      const res = await fetch('/api/stock');
      if (res.ok) {
        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.stock || []);
        if (Array.isArray(items) && items.length > 0) {
          setStockInventory(items);
          try {
            localStorage.setItem('ethiopian_steel_stock', JSON.stringify(items));
          } catch {}
        }
      }
    } catch (err) {
      console.warn('Stock fetch error:', err);
    }
  }, []);

  // Check Telegram Native SDK on mount and sync data
  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg) {
      try {
        tg.ready();
        tg.expand();
        if ((tg.initData && tg.initData.length > 0) || tg.platform !== 'unknown') {
          setIsTelegramNative(true);
          setSimulatorFrame(false);
          if (tg.initDataUnsafe?.user) {
            setTelegramUser({
              id: tg.initDataUnsafe.user.id,
              first_name: tg.initDataUnsafe.user.first_name,
              username: tg.initDataUnsafe.user.username,
            });
            if (tg.initDataUnsafe.user.first_name) {
              setCustomerName(
                `${tg.initDataUnsafe.user.first_name} ${tg.initDataUnsafe.user.last_name || ''}`.trim()
              );
            }
          }
        }
      } catch (err) {
        console.warn('Telegram SDK detection error:', err);
      }
    }

    // Load persisted local orders if any
    try {
      const savedOrders = localStorage.getItem('ethiopian_steel_orders');
      if (savedOrders) {
        const parsed = JSON.parse(savedOrders);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSubmittedOrders(parsed);
        }
      }
    } catch {}

    // Pull real-time orders and stock from the server
    refreshOrders();
    refreshStock();
  }, [refreshOrders, refreshStock]);

  const toggleLang = useCallback(() => {
    hapticFeedback('light');
    setLang(prev => (prev === 'am' ? 'en' : 'am'));
  }, [hapticFeedback]);

  const toggleSimulatorFrame = useCallback(() => {
    hapticFeedback('light');
    setSimulatorFrame(prev => !prev);
  }, [hapticFeedback]);

  // Customer Authentication methods
  const loginWithTelegram = useCallback(
    async (userOverride?: { id?: number | string; first_name?: string; username?: string; phone?: string }): Promise<boolean> => {
      hapticFeedback('medium');
      const tgUser = userOverride || telegramUser;
      const tgId = tgUser?.id ? String(tgUser.id) : String(Math.floor(10000000 + Math.random() * 90000000));
      const tgName = tgUser?.first_name || 'Telegram Customer';
      const tgUsername = tgUser?.username ? (tgUser.username.startsWith('@') ? tgUser.username : `@${tgUser.username}`) : '@customer';
      const phoneVal = userOverride?.phone || customerPhone;

      const newCustomer: CustomerUser = {
        id: `tg-${tgId}`,
        name: tgName,
        email: `${tgUsername.replace('@', '')}@telegram.org`,
        phone: phoneVal,
        telegramUsername: tgUsername,
        telegramId: tgId,
        authProvider: 'telegram',
        isLoggedIn: true,
      };

      setCustomer(newCustomer);
      if (tgName) setCustomerName(tgName);
      if (tgUsername) setCustomerTelegramId(tgUsername);
      if (phoneVal) setCustomerPhone(phoneVal);

      try {
        localStorage.setItem('esplc_customer', JSON.stringify(newCustomer));
      } catch {}

      hapticFeedback('success');
      showToast(
        lang === 'am'
          ? `በቴሌግራም መለያ ገብተዋል (${tgUsername})`
          : `Signed in via Telegram (${tgUsername})`
      );
      setIsAuthModalOpen(false);
      return true;
    },
    [telegramUser, customerPhone, lang, hapticFeedback, showToast]
  );

  const loginWithPhoneOrTelegram = useCallback(
    async (identifier: string, nameInput?: string): Promise<boolean> => {
      const clean = identifier.trim();
      if (!clean) {
        showToast(lang === 'am' ? 'እባክዎ ስልክ ቁጥር ወይም የቴሌግራም መለያ ያስገቡ' : 'Please enter your phone number or Telegram @username');
        hapticFeedback('error');
        return false;
      }

      hapticFeedback('medium');
      const isTg = clean.startsWith('@') || /^[a-zA-Z][a-zA-Z0-9_]{3,31}$/.test(clean);
      const isPhone = /^(09|07|\+2519|\+2517|\d{9,12})/.test(clean.replace(/\s+/g, ''));

      const formattedTg = isTg ? (clean.startsWith('@') ? clean : `@${clean}`) : (customerTelegramId || '@customer');
      const formattedPhone = isPhone ? clean : customerPhone;
      const displayName = nameInput?.trim() || (isTg ? clean.replace('@', '') : `Customer ${clean.slice(-4)}`);

      const newCustomer: CustomerUser = {
        id: isPhone ? `phone-${clean.replace(/\D/g, '')}` : `tg-${clean.replace('@', '')}`,
        name: displayName,
        email: isTg ? `${formattedTg.replace('@', '')}@telegram.org` : `${clean.replace(/\D/g, '')}@esplc.et`,
        phone: formattedPhone,
        telegramUsername: formattedTg,
        telegramId: isTg ? formattedTg : undefined,
        authProvider: isPhone ? 'phone' : 'telegram',
        isLoggedIn: true,
      };

      setCustomer(newCustomer);
      if (displayName) setCustomerName(displayName);
      if (formattedTg) setCustomerTelegramId(formattedTg);
      if (formattedPhone) setCustomerPhone(formattedPhone);

      try {
        localStorage.setItem('esplc_customer', JSON.stringify(newCustomer));
      } catch {}

      hapticFeedback('success');
      showToast(
        lang === 'am'
          ? `እንኳን ደህና መጡ ${displayName}! ገብተዋል`
          : `Welcome ${displayName}! Successfully signed in.`
      );
      setIsAuthModalOpen(false);
      return true;
    },
    [customerPhone, customerTelegramId, lang, hapticFeedback, showToast]
  );

  const loginWithEmail = useCallback(
    async (email: string, password?: string, name?: string, phone?: string): Promise<boolean> => {
      const cleanEmail = email.trim().toLowerCase();
      if (!cleanEmail || !cleanEmail.includes('@')) {
        showToast(lang === 'am' ? 'እባክዎ ትክክለኛ ኢሜይል ያስገቡ' : 'Please enter a valid email address');
        hapticFeedback('error');
        return false;
      }
      const userName = name?.trim() || cleanEmail.split('@')[0];
      const newCustomer: CustomerUser = {
        id: 'user-' + Math.random().toString(36).substring(2, 8),
        name: userName,
        email: cleanEmail,
        phone: phone || customerPhone,
        authProvider: 'email',
        isLoggedIn: true,
      };
      setCustomer(newCustomer);
      if (userName) setCustomerName(userName);
      if (phone) setCustomerPhone(phone);
      try {
        localStorage.setItem('esplc_customer', JSON.stringify(newCustomer));
      } catch {}
      hapticFeedback('success');
      showToast(lang === 'am' ? `እንኳን ደህና መጡ ${userName}! በኢሜይል ገብተዋል` : `Welcome back ${userName}! Signed in with Email.`);
      setIsAuthModalOpen(false);
      return true;
    },
    [lang, customerPhone, showToast, hapticFeedback]
  );

  const registerWithEmail = useCallback(
    async (email: string, password?: string, name?: string, phone?: string): Promise<boolean> => {
      return loginWithEmail(email, password, name, phone);
    },
    [loginWithEmail]
  );

  const loginWithGoogle = useCallback(
    async (userData?: Partial<CustomerUser>): Promise<boolean> => {
      hapticFeedback('medium');
      const googleName = userData?.name || 'Google Customer';
      const googleEmail = userData?.email || 'customer@gmail.com';
      const newCustomer: CustomerUser = {
        id: 'goog-' + Math.random().toString(36).substring(2, 8),
        name: googleName,
        email: googleEmail,
        phone: userData?.phone || customerPhone,
        photoUrl: userData?.photoUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
        authProvider: 'google',
        isLoggedIn: true,
      };
      setCustomer(newCustomer);
      if (googleName) setCustomerName(googleName);
      if (newCustomer.phone) setCustomerPhone(newCustomer.phone);
      try {
        localStorage.setItem('esplc_customer', JSON.stringify(newCustomer));
      } catch {}
      hapticFeedback('success');
      showToast(lang === 'am' ? `በGoogle አካውንት በተሳካ ሁኔታ ገብተዋል (${googleEmail})` : `Signed in with Google (${googleEmail})`);
      setIsAuthModalOpen(false);
      return true;
    },
    [lang, customerPhone, showToast, hapticFeedback]
  );

  const logoutCustomer = useCallback(() => {
    hapticFeedback('light');
    const guestCustomer: CustomerUser = {
      id: 'cust-' + Math.random().toString(36).substring(2, 7),
      name: '',
      email: '',
      authProvider: 'guest',
      isLoggedIn: false,
    };
    setCustomer(guestCustomer);
    try {
      localStorage.removeItem('esplc_customer');
    } catch {}
    showToast(lang === 'am' ? 'ከአካውንት ወጥተዋል' : 'Signed out');
  }, [lang, showToast, hapticFeedback]);

  // Transfer from Roof Calculator directly to Order Builder
  const applyCalculatorResultToOrder = useCallback(
    (params: {
      productId?: string;
      productName: string;
      gaugeLabel: string;
      colorName?: string;
      lengthMeters: number;
      sheets?: number;
      sheetLength?: number;
      spanLength?: number;
      slopes?: number;
      weightKg?: number;
      totalETB?: number;
    }) => {
      hapticFeedback('success');
      // Set quantity
      setQuantityMeters(String(params.lengthMeters));

      // Match product
      if (params.productId?.includes('ega')) {
        setSelectedProductId('ega');
        if (params.productId.includes('600')) setSelectedEgaVariant('ega-600');
        else if (params.productId.includes('500')) setSelectedEgaVariant('ega-500');
        else if (params.productId.includes('400')) setSelectedEgaVariant('ega-400');
        else setSelectedEgaVariant('ega-300');
      } else if (params.productId?.includes('nc') || params.productName.toLowerCase().includes('corrugat')) {
        setSelectedProductId('corrugated');
      } else if (params.productId?.includes('elegan')) {
        setSelectedProductId('elegantile');
      } else if (params.productId?.includes('versatile') || params.productId?.includes('tile')) {
        setSelectedProductId('versatile');
      }

      // Match gauge
      if (params.gaugeLabel.includes('0.4')) setSelectedGaugeId('g28');
      else if (params.gaugeLabel.includes('0.32')) setSelectedGaugeId('g28');
      else if (params.gaugeLabel.includes('0.25')) setSelectedGaugeId('g30');

      // Match color if provided
      if (params.colorName) {
        const cLower = params.colorName.toLowerCase();
        if (cLower.includes('red') || cLower.includes('ቀይ')) setSelectedColorId('red');
        else if (cLower.includes('blue') || cLower.includes('ሰማያዊ')) setSelectedColorId('blue');
        else if (cLower.includes('green') || cLower.includes('አረንጓዴ')) setSelectedColorId('green');
        else if (cLower.includes('charcoal') || cLower.includes('ድንጋይ')) setSelectedColorId('charcoal');
        else if (cLower.includes('silver') || cLower.includes('ash') || cLower.includes('ሲልቨር')) setSelectedColorId('silver');
      }

      // Notes with full breakdown
      let note = `Calculated in Roof Calc: ${params.productName} (${params.gaugeLabel})`;
      if (params.sheets && params.sheetLength) {
        note += ` · ${params.sheets} sheets (${params.sheetLength}m each)`;
      } else if (params.sheets) {
        note += ` · ~${params.sheets} sheets`;
      }
      if (params.spanLength) {
        note += ` for ${params.spanLength}m span${params.slopes === 2 ? ' (2 slopes)' : ''}`;
      }
      note += ` · Total: ${params.lengthMeters} LM`;
      if (params.weightKg) note += ` · ~${params.weightKg.toFixed(1)} kg`;
      if (params.totalETB) note += ` · Est: ${params.totalETB.toLocaleString()} ETB`;
      setOrderNotes(note);

      // Navigate to order tab
      setActiveTab('order');
      showToast(lang === 'am' ? 'የስሌቱ ውጤት ወደ ማዘዣው ቅጽ ተላልፏል!' : 'Calculation transferred to Order Builder!');
    },
    [lang, hapticFeedback, showToast]
  );

  const resetOrderForm = useCallback(() => {
    setSelectedProductId('versatile');
    setSelectedGaugeId('g28');
    setSelectedColorId('red');
    setQuantityMeters('50');
    setOrderNotes('');
  }, []);

  const trackOrderById = useCallback(
    (id: string): OrderSubmission | null => {
      const trimmed = id.trim().toUpperCase();
      const match = submittedOrders.find(
        o => o.order_id.toUpperCase() === trimmed || o.order_id.toUpperCase().includes(trimmed)
      );
      if (match) {
        setActiveOrderToTrack(match);
        return match;
      }
      return null;
    },
    [submittedOrders]
  );

  // Submit Order logic (validates, sends to API, and triggers Telegram.WebApp.sendData if in Telegram)
  const submitOrder = useCallback(async (): Promise<OrderSubmission | null> => {
    hapticFeedback('heavy');

    // Validation
    const cleanQty = Number(quantityMeters);
    if (isNaN(cleanQty) || cleanQty <= 0) {
      hapticFeedback('error');
      showToast(lang === 'am' ? 'እባክዎ ትክክለኛ የሜትር ብዛት ያስገቡ!' : 'Please enter valid meters quantity!');
      return null;
    }

    if (deliveryAddress.trim().length < 4) {
      hapticFeedback('error');
      showToast(lang === 'am' ? 'እባክዎ ሙሉ የመላኪያ አድራሻ ይጻፉ!' : 'Please provide complete delivery address!');
      return null;
    }

    const digits = customerPhone.replace(/\D/g, '');
    const isValidPhone =
      (digits.startsWith('251') && (digits.length === 11 || digits.length === 12)) ||
      (digits.startsWith('0') && digits.length === 10 && ['1', '7', '9'].includes(digits[1])) ||
      (digits.length === 9 && ['1', '7', '9'].includes(digits[0]));

    if (!isValidPhone) {
      hapticFeedback('error');
      showToast(
        lang === 'am'
          ? 'እባክዎ ትክክለኛ የኢትዮጵያ ስልክ ቁጥር ይጻፉ (09... / 07... / 011...)'
          : 'Please enter valid Ethiopian phone (09... / 07... / 011...)'
      );
      return null;
    }

    const orderId = `ORD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random()
      .toString(36)
      .substring(2, 6)
      .toUpperCase()}`;

    const rawTg = customerTelegramId.replace(/^@+/, '').trim();
    const cleanUsername = rawTg
      ? `@${rawTg}`
      : telegramUser.username
      ? `@${telegramUser.username.replace(/^@+/, '')}`
      : customer.email || 'N/A';

    const newOrder: OrderSubmission = {
      order_id: orderId,
      user_id: String(telegramUser.id || customer.id || 'anonymous'),
      username: cleanUsername,
      first_name: customerName || customer.name || telegramUser.first_name || 'Customer',
      product: selectedProductId === 'ega' ? `ኢ.ጂ.ኤ (${selectedEgaVariant.toUpperCase()})` : currentProduct.nameAm,
      product_id: currentProduct.id,
      gauge: currentGauge.label,
      gauge_id: currentGauge.id,
      color: currentColor.nameAm,
      color_id: currentColor.id,
      quantity: String(cleanQty),
      address: deliveryAddress.trim(),
      phone: customerPhone.trim(),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'pending',
      customer_email: customer.email || undefined,
      auth_provider: customer.authProvider,
      ega_material: selectedProductId === 'ega' ? selectedEgaVariant : undefined,
      notes: orderNotes.trim() || undefined,
    };

    // 1. Send data to server endpoint
    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newOrder,
          telegram_id: cleanUsername,
        }),
      });
    } catch {
      // Server error fallback
    }

    // 2. If running inside real Telegram client, call Telegram.WebApp.sendData
    const tg = window.Telegram?.WebApp;
    if (tg && isTelegramNative) {
      try {
        tg.sendData(
          JSON.stringify({
            action: 'new_order',
            order_id: orderId,
            product: newOrder.product,
            gauge: newOrder.gauge,
            color: newOrder.color,
            quantity: newOrder.quantity,
            address: newOrder.address,
            phone: newOrder.phone,
            telegram_id: cleanUsername,
          })
        );
      } catch (e) {
        console.log('sendData not supported in some telegram contexts:', e);
      }
    }

    // 3. Update local state & storage
    setSubmittedOrders(prev => {
      const updated = [newOrder, ...prev];
      try {
        localStorage.setItem('ethiopian_steel_orders', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    setActiveOrderToTrack(newOrder);

    // 4. Celebration feedback
    hapticFeedback('success');
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#1d4ed8', '#b91c1c', '#15803d', '#f59e0b'],
    });

    showToast(
      lang === 'am'
        ? `ትዕዛዝዎ በተሳካ ሁኔታ ገብቷል! ቁጥር: ${orderId}`
        : `Order submitted successfully! ID: ${orderId}`
    );

    setActiveTab('track');
    return newOrder;
  }, [
    quantityMeters,
    deliveryAddress,
    customerPhone,
    customerName,
    customerTelegramId,
    telegramUser,
    customer,
    selectedProductId,
    selectedEgaVariant,
    currentProduct,
    currentGauge,
    currentColor,
    orderNotes,
    isTelegramNative,
    lang,
    hapticFeedback,
    showToast,
  ]);

  const updateOrderStatus = useCallback(
    async (orderId: string, status: 'pending' | 'processing' | 'completed') => {
      hapticFeedback('medium');
      setSubmittedOrders(prev => {
        const updated = prev.map(o => (o.order_id === orderId ? { ...o, status } : o));
        try {
          localStorage.setItem('ethiopian_steel_orders', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      if (activeOrderToTrack?.order_id === orderId) {
        setActiveOrderToTrack(prev => (prev ? { ...prev, status } : null));
      }

      try {
        await fetch(`/api/orders/${orderId}/status`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });
      } catch {}

      showToast(lang === 'am' ? `የትዕዛዝ ሁኔታ ተቀይሯል: ${status}` : `Order status updated to: ${status}`);
    },
    [activeOrderToTrack, lang, hapticFeedback, showToast]
  );

  // Admin / Bot Owner Quote Price & Notes
  const quoteOrderPrice = useCallback(
    async (orderId: string, priceETB: number, quoteNotes?: string): Promise<boolean> => {
      hapticFeedback('success');
      const quotedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);

      setSubmittedOrders(prev => {
        const updated = prev.map(o =>
          o.order_id === orderId
            ? {
                ...o,
                quotedPriceETB: priceETB,
                quotedByStaff: true,
                quotedAt,
                quoteNotes: quoteNotes || o.quoteNotes,
              }
            : o
        );
        try {
          localStorage.setItem('ethiopian_steel_orders', JSON.stringify(updated));
        } catch {}
        return updated;
      });

      if (activeOrderToTrack?.order_id === orderId) {
        setActiveOrderToTrack(prev =>
          prev
            ? {
                ...prev,
                quotedPriceETB: priceETB,
                quotedByStaff: true,
                quotedAt,
                quoteNotes: quoteNotes || prev.quoteNotes,
              }
            : null
        );
      }

      try {
        await fetch(`/api/orders/${orderId}/quote`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quotedPriceETB: priceETB, quoteNotes }),
        });
      } catch {}

      showToast(
        lang === 'am'
          ? `ዋጋ ተሰጥቷል: ${priceETB.toLocaleString()} ETB (ወደ ደንበኛ ቴሌግራም ይላካል)`
          : `Price quoted: ${priceETB.toLocaleString()} ETB (notified to customer Telegram)`
      );
      return true;
    },
    [activeOrderToTrack, lang, hapticFeedback, showToast]
  );

  // Send Gemini AI Chat Message
  const sendAiMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isAiLoading) return;
      hapticFeedback('light');

      const userMsg = { role: 'user' as const, text: text.trim() };
      setAiMessages(prev => [...prev, userMsg]);
      setIsAiLoading(true);

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text.trim(),
            history: aiMessages.slice(-8),
          }),
        });
        const data = await response.json();
        const replyText = data.reply || (lang === 'am' ? 'ምንም መልስ አልተገኘም።' : 'No response received.');
        setAiMessages(prev => [...prev, { role: 'model', text: replyText }]);
        hapticFeedback('success');
      } catch (err) {
        setAiMessages(prev => [
          ...prev,
          {
            role: 'model',
            text:
              lang === 'am'
                ? 'ይቅርታ፣ ኔትወርክ አጋጥሟል። እባክዎ በቀጥታ ትዕዛዝዎን ያስገቡ ወይም በ +251 11 434 2200 ይደውሉ።'
                : 'Connection issue. Please proceed to place an order or call +251 11 434 2200.',
          },
        ]);
      } finally {
        setIsAiLoading(false);
      }
    },
    [aiMessages, isAiLoading, lang, hapticFeedback]
  );

  const clearAiChat = useCallback(() => {
    hapticFeedback('light');
    setAiMessages([
      {
        role: 'model',
        text:
          lang === 'am'
            ? 'ውይይቱ ተጠርጓል። ስለ ኢትዮጵያን ስቲል ጣራ ምርቶች፣ ጋጅ ወይም አድራሻ ምን ማወቅ ይፈልጋሉ?'
            : 'Chat cleared. How can I assist you with Ethiopian Steel roofing products today?',
      },
    ]);
    showToast(lang === 'am' ? 'ውይይቱ ተጠርጓል' : 'Chat cleared');
  }, [lang, hapticFeedback, showToast]);

  return (
    <EthiopianSteelContext.Provider
      value={{
        lang,
        toggleLang,
        activeTab,
        setActiveTab,
        customer,
        loginWithTelegram,
        loginWithPhoneOrTelegram,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logoutCustomer,
        isAuthModalOpen,
        setIsAuthModalOpen,
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
        orderNotes,
        setOrderNotes,
        applyCalculatorResultToOrder,
        currentProduct,
        currentGauge,
        currentColor,
        stockInventory,
        updateStockItem,
        checkStockAvailability,
        submittedOrders,
        activeOrderToTrack,
        searchOrderQuery,
        setSearchOrderQuery,
        trackOrderById,
        submitOrder,
        resetOrderForm,
        refreshOrders,
        isRefreshingOrders,
        refreshStock,
        isStaffMode,
        setIsStaffMode,
        updateOrderStatus,
        quoteOrderPrice,
        isTelegramNative,
        simulatorFrame,
        toggleSimulatorFrame,
        telegramUser,
        toastMessage,
        showToast,
        hapticFeedback,
        aiMessages,
        isAiLoading,
        sendAiMessage,
        clearAiChat,
      }}
    >
      {children}
    </EthiopianSteelContext.Provider>
  );
};

export const useEthiopianSteel = () => {
  const context = useContext(EthiopianSteelContext);
  if (!context) {
    throw new Error('useEthiopianSteel must be used within EthiopianSteelProvider');
  }
  return context;
};

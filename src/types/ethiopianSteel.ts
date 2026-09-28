export interface RoofingProduct {
  id: 'versatile' | 'elegantile' | 'ega' | 'corrugated' | string;
  nameAm: string;
  nameEn: string;
  taglineAm: string;
  taglineEn: string;
  descriptionAm: string;
  descriptionEn: string;
  idealForAm: string;
  idealForEn: string;
  icon: string;
  recommendedGauge: string;
  patternType: 'tile' | 'wave' | 'ribbed' | 'corrugated' | string;
  egaVariants?: Array<{ id: string; name: string; coilWidth: number; effectiveWidth: number }>;
}

export interface GaugeOption {
  id: 'g28' | 'g30' | 'g32' | 'standard' | string;
  label: string;
  thickness: string;
  descriptionAm: string;
  descriptionEn: string;
  isPopular?: boolean;
}

export interface ColorOption {
  id: 'blue' | 'red' | 'green' | 'charcoal' | 'silver' | string;
  nameAm: string;
  nameEn: string;
  hex: string;
  tailwindBg: string;
  chipColor: string;
}

export interface CustomerUser {
  id: string;
  name: string;
  email: string;
  phone?: string;
  telegramUsername?: string;
  telegramId?: string | number;
  photoUrl?: string;
  authProvider: 'email' | 'google' | 'telegram' | 'phone' | 'guest';
  isLoggedIn: boolean;
  isAdmin?: boolean;
}


export interface CalcMaterialItem {
  id: string;
  category: string;
  name: string;
  coilWidth: number | null;
  overallWidth: number | null;
  effectiveWidth: number | null;
  unit: 'LM' | 'KG';
  calculable: boolean;
  basePriceETB: number;
}

export interface OrderSubmission {
  order_id: string;
  user_id: string;
  username: string;
  first_name: string;
  product: string;
  product_id: string;
  gauge: string;
  gauge_id: string;
  color: string;
  color_id: string;
  quantity: string;
  address: string;
  phone: string;
  timestamp: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'completed';
  customer_email?: string;
  auth_provider?: string;
  ega_material?: string;
  notes?: string;
  // Bot Owner / Admin Quoted Price & Breakdown
  quotedPriceETB?: number;
  unitPriceETB?: number;
  quotedByStaff?: boolean;
  quotedAt?: string;
  quoteNotes?: string;
  calcBreakdown?: {
    sheetsCount?: number;
    estimatedWeightKg?: number;
    linearMeters?: number;
    effectiveWidth?: number;
  };
}

export interface StockItemStatus {
  productId: string;
  inStock: boolean;
  stockQuantityMeters?: number;
  stockNoteAm?: string;
  stockNoteEn?: string;
}

export interface ShowroomLocation {
  id: string;
  titleAm: string;
  titleEn: string;
  type: 'factory' | 'showroom';
  addressAm: string;
  addressEn: string;
  landmarkAm: string;
  landmarkEn: string;
  phone: string;
  mapsUrl: string;
}

export type SteelTabType = 'order' | 'calc' | 'catalog' | 'track' | 'ai' | 'locations' | 'staff';
export type AppLanguage = 'am' | 'en';

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
          };
          query_id?: string;
          auth_date?: string;
          hash?: string;
        };
        version: string;
        platform: string;
        colorScheme: 'light' | 'dark';
        themeParams: Record<string, string>;
        isExpanded: boolean;
        viewportHeight: number;
        viewportStableHeight: number;
        headerColor: string;
        backgroundColor: string;
        isClosingConfirmationEnabled: boolean;
        BackButton: {
          isVisible: boolean;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
        };
        MainButton: {
          text: string;
          color: string;
          textColor: string;
          isVisible: boolean;
          isActive: boolean;
          isProgressVisible: boolean;
          setText: (text: string) => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
          show: () => void;
          hide: () => void;
          enable: () => void;
          disable: () => void;
          showProgress: (leaveActive?: boolean) => void;
          hideProgress: () => void;
          setParams: (params: {
            text?: string;
            color?: string;
            text_color?: string;
            is_active?: boolean;
            is_visible?: boolean;
          }) => void;
        };
        HapticFeedback: {
          impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
          notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
          selectionChanged: () => void;
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        sendData: (data: string) => void;
        openLink: (url: string) => void;
        openTelegramLink: (url: string) => void;
        showAlert: (message: string, callback?: () => void) => void;
        showConfirm: (message: string, callback?: (confirmed: boolean) => void) => void;
      };
    };
  }
}

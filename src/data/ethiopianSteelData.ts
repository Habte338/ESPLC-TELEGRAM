import { RoofingProduct, GaugeOption, ColorOption, ShowroomLocation } from '../types/ethiopianSteel';

export const STEEL_PRODUCTS: RoofingProduct[] = [
  {
    id: 'versatile',
    nameAm: 'ቨርሳታይል (Versatile)',
    nameEn: 'Versatile Roofing Sheet',
    taglineAm: 'የዘመናዊ የሸክላ ጣራ መልክ',
    taglineEn: 'Modern Clay-Tile Roof Appearance',
    descriptionAm: 'ለዘመናዊ ቪላዎች፣ ለመኖሪያ ቤቶች እና ለቅንጡ ህንፃዎች ውበት የሚሰጥ ክላሲክ የሸክላ ቅርጽ ያለው ጥራት ያለው የጣራ ቆርቆሮ።',
    descriptionEn: 'Classic clay-tile profile giving exceptional beauty, weather resistance and prestige to modern residential homes and luxury villas.',
    idealForAm: 'ለዘመናዊ ቪላዎች እና ለመኖሪያ ቤቶች',
    idealForEn: 'Modern villas, high-end residential homes',
    icon: '🏛️',
    recommendedGauge: 'G28 / G30',
    patternType: 'tile',
  },
  {
    id: 'elegantile',
    nameAm: 'ኤሌጋንታይል (Elegantile)',
    nameEn: 'Elegantile Premium Sheet',
    taglineAm: 'ውብ እና ፅዱ ዲዛይን',
    taglineEn: 'Clean, Sleek & Elegant Profile',
    descriptionAm: 'የተለየ ውብ ዲዛይን ያለው፤ የከተማ ቤቶች እና የንግድ ህንፃዎችን ውበት የሚያጎላ ፅዱ የጣራ መፍትሄ።',
    descriptionEn: 'Sleek architectural design engineered for aesthetic distinction in contemporary city residences and commercial buildings.',
    idealForAm: 'ለንግድ ሕንፃዎች እና ለከተማ መኖሪያዎች',
    idealForEn: 'Contemporary townhouses, urban commercial offices',
    icon: '✨',
    recommendedGauge: 'G28 / G30',
    patternType: 'wave',
  },
  {
    id: 'ega',
    nameAm: 'ኢ.ጂ.ኤ (EGA)',
    nameEn: 'EGA Industrial Profile (300, 400, 500, 600)',
    taglineAm: 'ለኢንዱስትሪ እና መጋዘን (300፣ 400፣ 500 እና 600)',
    taglineEn: 'Heavy-Duty Industrial (300, 400, 500 & 600 Exceptionally)',
    descriptionAm: 'የተለያዩ የEGA ዓይነቶች: 300፣ 400፣ 500 እና በልዩ ሁኔታ 600 (1220mm ኮይል)! ሰፊ ስፋት (span) መሸከም የሚችል፣ ለፋብሪካዎችና ለመጋዘኖች ተስማሚ ከፍተኛ ጥንካሬ ያለው።',
    descriptionEn: 'Engineered with distinct profiles: EGA 300, 400, 500, and exceptionally EGA 600 (1220mm wide coil). Maximum strength for factories and industrial spans.',
    idealForAm: 'ለፋብሪካዎች፣ ለመጋዘኖች እና ለትላልቅ አዳራሾች',
    idealForEn: 'Factories, warehouses, logistics sheds, industrial structures',
    icon: '🏭',
    recommendedGauge: 'G28 / G30',
    patternType: 'ribbed',
    egaVariants: [
      { id: 'ega-300', name: 'EGA 300', coilWidth: 1000, effectiveWidth: 0.81 },
      { id: 'ega-400', name: 'EGA 400', coilWidth: 1000, effectiveWidth: 0.78 },
      { id: 'ega-500', name: 'EGA 500', coilWidth: 1000, effectiveWidth: 0.83 },
      { id: 'ega-600', name: 'EGA 600 (Exceptional Wide 1220mm)', coilWidth: 1220, effectiveWidth: 1.045 },
    ],
  },
  {
    id: 'corrugated',
    nameAm: 'መደበኛ ቆርቆሮ (Normal Corrugated)',
    nameEn: 'Normal Corrugated (NC)',
    taglineAm: 'ጠንካራ እና ረጅም እድሜ - የ28 ዓመታት የታመነ',
    taglineEn: '28-Year Trusted Standard Normal Corrugated',
    descriptionAm: 'የ28 ዓመታት የታመነ የጥራት አሻራ! መደበኛ ቆርቆሮ (Normal Corrugated) - ዝናብና ፀሐይን የሚቋቋም፤ ለሁሉም ዓይነት ግንባታዎች ተወዳጅና ዘላቂ መፍትሔ።',
    descriptionEn: '28 years of proven excellence in Ethiopia! Normal Corrugated (NC) delivers high tensile strength, withstanding heavy rain and extreme weather.',
    idealForAm: 'ለሁሉም ዓይነት ግንባታዎችና መኖሪያዎች',
    idealForEn: 'Universal residential, agricultural, and commercial roofing',
    icon: '🦁',
    recommendedGauge: 'G28 / G30 / G32',
    patternType: 'corrugated',
  },
];

export const GAUGE_OPTIONS: GaugeOption[] = [
  {
    id: 'g28',
    label: 'G28',
    thickness: '0.32 mm (ከባድ ውፍረት)',
    descriptionAm: 'ፕሪሚየም ጥንካሬ - ለረጅም አመታት ለሚቆዩ ግንባታዎች',
    descriptionEn: 'Maximum thickness & durability for high-end longevity',
    isPopular: true,
  },
  {
    id: 'g30',
    label: 'G30',
    thickness: '0.25 mm (መካከለኛ ውፍረት)',
    descriptionAm: 'ተመራጭ እና የተመጣጠነ የውፍረት ምርጫ',
    descriptionEn: 'Standard popular choice balancing weight and strength',
  },
  {
    id: 'g32',
    label: 'G32',
    thickness: '0.20 mm (ቀላል ውፍረት)',
    descriptionAm: 'ቀላል እና ኢኮኖሚያዊ ምርጫ',
    descriptionEn: 'Economical lightweight profile for secondary structures',
  },
  {
    id: 'standard',
    label: 'መደበኛ (Standard)',
    thickness: 'ፋብሪካ ስታንዳርድ',
    descriptionAm: 'የኢትዮጵያን ስቲል ፋብሪካ መደበኛ ውፍረት',
    descriptionEn: 'Standard factory baseline gauge profile',
  },
];

export const COLOR_OPTIONS: ColorOption[] = [
  {
    id: 'blue',
    nameAm: '🔵 ሰማያዊ (ESPLC Blue)',
    nameEn: 'ESPLC Sky Blue',
    hex: '#4a8ac7',
    tailwindBg: 'bg-[#4a8ac7]',
    chipColor: '#4a8ac7',
  },
  {
    id: 'red',
    nameAm: '🔴 ቀይ (Red)',
    nameEn: 'Crimson Brick Red',
    hex: '#b91c1c',
    tailwindBg: 'bg-red-600',
    chipColor: '#b91c1c',
  },
  {
    id: 'green',
    nameAm: '🟢 አረንጓዴ (Green)',
    nameEn: 'Forest Emerald Green',
    hex: '#15803d',
    tailwindBg: 'bg-emerald-600',
    chipColor: '#15803d',
  },
  {
    id: 'charcoal',
    nameAm: '🔘 ቻርኮል (Charcoal)',
    nameEn: 'Modern Charcoal Grey',
    hex: '#374151',
    tailwindBg: 'bg-zinc-700',
    chipColor: '#374151',
  },
  {
    id: 'silver',
    nameAm: '⚪ ሲልቨር (Silver)',
    nameEn: 'Metallic Galvanized Silver',
    hex: '#9ca3af',
    tailwindBg: 'bg-slate-400',
    chipColor: '#9ca3af',
  },
];

export const SHOWROOMS: ShowroomLocation[] = [
  {
    id: 'kaliti-factory',
    titleAm: '🏭 ዋና ፋብሪካ (Main Factory)',
    titleEn: 'Main Factory & Direct Sales',
    type: 'factory',
    addressAm: 'አዲስ አበባ፣ ቃሊቲ',
    addressEn: 'Kaliti, Addis Ababa',
    landmarkAm: 'ከUNISA ክሊኒክ አጠገብ፣ ቅዱስ ሚካኤል ቤተክርስቲያን ፊትለፊት',
    landmarkEn: 'Near UNISA Clinic, opposite St. Michael Church',
    phone: '+251 11 434 2200',
    mapsUrl: 'https://maps.google.com/?q=Ethiopian+Steel+PLC+Kaliti',
  },
  {
    id: 'lebu-showroom',
    titleAm: '🏢 ሌቡ ሾውሩም (Lebu Showroom)',
    titleEn: 'Lebu Showroom & Sales Office',
    type: 'showroom',
    addressAm: 'ሌቡ ሳሙኤል ሕንፃ፣ 2ኛ ፎቅ',
    addressEn: 'Lebu Samuel Building, 2nd Floor, Addis Ababa',
    landmarkAm: 'ሌቡ አደባባይ አጠገብ',
    landmarkEn: 'Near Lebu Roundabout',
    phone: '+251 91 123 4567',
    mapsUrl: 'https://maps.google.com/?q=Lebu+Samuel+Building+Addis+Ababa',
  },
  {
    id: 'summit-showroom',
    titleAm: '🏢 ሱሚት ሾውሩም (Summit Showroom)',
    titleEn: 'Summit 72 Showroom',
    type: 'showroom',
    addressAm: 'ሱሚት 72፣ አዲስ አበባ',
    addressEn: 'Summit 72, Addis Ababa',
    landmarkAm: 'ሱሚት ኮንዶሚኒየም መግቢያ አጠገብ',
    landmarkEn: 'Near Summit Condominium Main Gate',
    phone: '+251 92 233 4455',
    mapsUrl: 'https://maps.google.com/?q=Summit+72+Addis+Ababa',
  },
];

export const COMPANY_INFO = {
  nameAm: 'ኢትዮጵያን ስቲል ፒ.ኤል.ሲ',
  nameEn: 'Ethiopian Steel PLC',
  brandName: 'አንበሳ ቆርቆሮ (Anbesa Corrugated)',
  sloganAm: 'ጠንካራ ጣራዎች፤ የበለጠ ጠንካራ ኢትዮጵያ! 🇪🇹',
  sloganEn: 'Stronger Roofs, Stronger Ethiopia! 🇪🇹',
  experienceYears: 28,
  website: 'https://ethiopiansteelplc.com/',
  workingHoursAm: 'ሰኞ - ቅዳሜ: 8:00 AM - 6:00 PM (እሁድ: ዝግ ነው / በትዕዛዝ)',
  workingHoursEn: 'Mon - Sat: 8:00 AM - 6:00 PM (Sunday: Closed / By Appointment)',
};

export interface CalculatorGaugeDef {
  id: string;
  label: string;
  group: 'GI' | 'AZ' | 'COLOR' | 'KG';
  thicknessMm: number | null;
  defaultPriceETB: number;
}

export const CALCULATOR_GAUGES: CalculatorGaugeDef[] = [
  { id: 'gi032', label: 'GI 0.32mm', group: 'GI', thicknessMm: 0.32, defaultPriceETB: 780 },
  { id: 'gi04', label: 'GI 0.4mm', group: 'GI', thicknessMm: 0.40, defaultPriceETB: 940 },
  { id: 'az', label: 'AZ 0.25/0.26mm', group: 'AZ', thicknessMm: 0.255, defaultPriceETB: 690 },
  { id: 'color025', label: 'Color 0.25mm', group: 'COLOR', thicknessMm: 0.25, defaultPriceETB: 850 },
  { id: 'color032', label: 'Color 0.32mm', group: 'COLOR', thicknessMm: 0.32, defaultPriceETB: 990 },
  { id: 'color04', label: 'Color 0.4mm', group: 'COLOR', thicknessMm: 0.40, defaultPriceETB: 1180 },
];

export interface CalculatorColorDef {
  id: string;
  name: string;
  hex: string;
}

export const CALCULATOR_COLORS: CalculatorColorDef[] = [
  { id: 'ash-grey', name: 'Ash Grey', hex: '#8C97A0' },
  { id: 'brick-red', name: 'Brick Red', hex: '#B23A2E' },
  { id: 'forest-green', name: 'Forest Green', hex: '#3F7D52' },
  { id: 'royal-blue', name: 'Royal Blue', hex: '#1B4B73' },
  { id: 'coffee-brown', name: 'Coffee Brown', hex: '#5C4033' },
  { id: 'off-white', name: 'Off White', hex: '#E4E1D8' },
  { id: 'charcoal', name: 'Charcoal', hex: '#374151' },
];

export interface CalculatorMaterialDef {
  id: string;
  category: string;
  name: string;
  coilWidth: number | null;
  overallWidth: number | null;
  effectiveWidth: number | null;
  unit: 'LM' | 'KG';
  calculable: boolean;
}

export const CALCULATOR_MATERIALS_SEED: CalculatorMaterialDef[] = [
  { id: 'nc', category: 'Normal Corrugation', name: 'Normal Corrugation (NC) / መደበኛ ቆርቆሮ', coilWidth: 1000, overallWidth: 0.89, effectiveWidth: 0.83, unit: 'LM', calculable: true },

  { id: 'ega300-smooth', category: 'EGA', name: 'EGA 300 (Smooth)', coilWidth: 1000, overallWidth: 0.84, effectiveWidth: 0.81, unit: 'LM', calculable: true },
  { id: 'ega400-smooth', category: 'EGA', name: 'EGA 400 (Smooth)', coilWidth: 1000, overallWidth: 0.82, effectiveWidth: 0.78, unit: 'LM', calculable: true },
  { id: 'ega500-smooth', category: 'EGA', name: 'EGA 500 (Smooth)', coilWidth: 1000, overallWidth: 0.90, effectiveWidth: 0.83, unit: 'LM', calculable: true },
  { id: 'ega300-royal', category: 'EGA', name: 'EGA 300 (Royal)', coilWidth: 1000, overallWidth: 0.84, effectiveWidth: 0.81, unit: 'LM', calculable: true },
  { id: 'ega400-royal', category: 'EGA', name: 'EGA 400 (Royal)', coilWidth: 1000, overallWidth: 0.82, effectiveWidth: 0.78, unit: 'LM', calculable: true },
  { id: 'ega500-royal', category: 'EGA', name: 'EGA 500 (Royal)', coilWidth: 1000, overallWidth: 0.90, effectiveWidth: 0.83, unit: 'LM', calculable: true },

  { id: 'ega600-smooth', category: 'EGA 600', name: 'EGA 600 Smooth (Wide 1220mm)', coilWidth: 1220, overallWidth: 1.114, effectiveWidth: 1.045, unit: 'LM', calculable: true },
  { id: 'ega600-royal', category: 'EGA 600', name: 'EGA 600 Royal / Wrinkled (Wide 1220mm)', coilWidth: 1220, overallWidth: 1.114, effectiveWidth: 1.045, unit: 'LM', calculable: true },

  { id: 'tiles1220-smooth', category: 'Tiles 1220 (Elegantile)', name: 'Tiles 1220 Smooth (Elegantile)', coilWidth: 1220, overallWidth: 1.12, effectiveWidth: 1.02, unit: 'LM', calculable: true },
  { id: 'tiles1220-royal', category: 'Tiles 1220 (Elegantile)', name: 'Tiles 1220 Royal (Elegantile)', coilWidth: 1220, overallWidth: 1.12, effectiveWidth: 1.02, unit: 'LM', calculable: true },

  { id: 'versatile-smooth', category: 'Tiles 1000 (Versatile)', name: 'Versatile Smooth (Tiles 1000)', coilWidth: 1000, overallWidth: 0.90, effectiveWidth: 0.82, unit: 'LM', calculable: true },
  { id: 'versatile-royal', category: 'Tiles 1000 (Versatile)', name: 'Versatile Royal / Wrinkle (Tiles 1000)', coilWidth: 1000, overallWidth: 0.90, effectiveWidth: 0.82, unit: 'LM', calculable: true },

  { id: 'plain-1000', category: 'Plain Sheet', name: 'Plain Sheet / 1000', coilWidth: 1000, overallWidth: 1.0, effectiveWidth: 1.0, unit: 'LM', calculable: true },
  { id: 'plain-smooth-1220', category: 'Plain Sheet', name: 'Smooth Plain Sheet / 1220', coilWidth: 1220, overallWidth: 1.22, effectiveWidth: 1.22, unit: 'LM', calculable: true },
];

export const STEEL_DENSITY_KG_PER_M3 = 7850;

export interface StockItemRecord {
  id: string; // matches product id or material id (e.g. 'versatile', 'ega', 'corrugated', 'ega-300', etc.)
  name: string;
  inStock: boolean;
  stockMeters: number;
  noteAm?: string;
  noteEn?: string;
}

export const INITIAL_STOCK_INVENTORY: StockItemRecord[] = [
  { id: 'versatile', name: 'Versatile Roofing Sheet (ቨርሳታይል)', inStock: true, stockMeters: 4500, noteAm: 'በመጋዘን አለ', noteEn: 'In Factory Stock' },
  { id: 'elegantile', name: 'Elegantile Premium (ኤሌጋንታይል)', inStock: true, stockMeters: 2800, noteAm: 'በመጋዘን አለ', noteEn: 'In Factory Stock' },
  { id: 'ega', name: 'EGA Industrial Profile (ኢ.ጂ.ኤ)', inStock: true, stockMeters: 6200, noteAm: 'በመጋዘን አለ', noteEn: 'In Factory Stock' },
  { id: 'ega-300', name: 'EGA 300', inStock: true, stockMeters: 2000, noteAm: 'በመጋዘን አለ', noteEn: 'In Factory Stock' },
  { id: 'ega-400', name: 'EGA 400', inStock: true, stockMeters: 1800, noteAm: 'በመጋዘን አለ', noteEn: 'In Factory Stock' },
  { id: 'ega-500', name: 'EGA 500', inStock: true, stockMeters: 1400, noteAm: 'በመጋዘን አለ', noteEn: 'In Factory Stock' },
  { id: 'ega-600', name: 'EGA 600 (Wide 1220mm)', inStock: false, stockMeters: 0, noteAm: 'አልቋል / በቅርቡ ይመረታል', noteEn: 'Out of Stock - Custom batch required' },
  { id: 'corrugated', name: 'Normal Corrugated (መደበኛ ቆርቆሮ)', inStock: true, stockMeters: 8000, noteAm: 'በመጋዘን አለ', noteEn: 'In Factory Stock' },
];

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

// Telegram Bot Configuration for Instant Order Dispatch
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '7348905759:AAFHswUaBBjyX8PNJrvk3f_j8D3WFczWmWw';
const TELEGRAM_TARGET_CHAT_ID = process.env.TELEGRAM_TARGET_CHAT_ID || '6184751487';

/**
 * Send order notification directly to the target Telegram Chat ID via Telegram Bot API
 */
async function sendTelegramOrderNotification(order: OrderRecord): Promise<{ success: boolean; error?: string }> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_TARGET_CHAT_ID) {
    console.warn('Telegram Bot Token or Target Chat ID not configured');
    return { success: false, error: 'Telegram credentials missing' };
  }

  const rawTg = (order.username || order.telegram_id || '').replace(/^@+/, '');
  const tgDisplay = rawTg ? `@${rawTg}` : 'Not provided';
  const priceDisplay = order.quotedPriceETB ? `${order.quotedPriceETB.toLocaleString()} ETB` : 'Pending factory quote';

  const messageText = `
🏢 *አዲስ የጣራ ቆርቆሮ ትዕዛዝ ደርሷል! (New Roof Order)*
━━━━━━━━━━━━━━━━━━━━━
📋 *የትዕዛዝ ቁጥር:* \`${order.order_id}\`
📅 *ቀን:* ${order.timestamp}

👤 *የደንበኛ መረጃ:*
• ስም: *${order.first_name}*
• ቴሌግራም: *${tgDisplay}* (ID: \`${order.user_id || order.telegram_id || 'N/A'}\`)
• ስልክ: \`${order.phone}\`
• አድራሻ: ${order.address}

📦 *የትዕዛዝ ዝርዝር:*
• ምርት: *${order.product}*
• ውፍረት (Gauge): *${order.gauge}*
• ቀለም: *${order.color}*
• የተጠየቀው መጠን: *${order.quantity} LM (Linear Meters)*
• ሁኔታ: *Pending (በመጠባበቅ ላይ)*
${order.notes ? `• ማስታወሻ: _${order.notes}_\n` : ''}━━━━━━━━━━━━━━━━━━━━━
🏭 *Ethiopian Steel PLC Sales Engine*
  `.trim();

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_TARGET_CHAT_ID,
        text: messageText,
        parse_mode: 'Markdown',
      }),
    });

    const result = (await response.json()) as any;
    if (result.ok) {
      console.log(`[Telegram Bot] Order ${order.order_id} successfully dispatched to chat ${TELEGRAM_TARGET_CHAT_ID}`);
      return { success: true };
    } else {
      console.error(`[Telegram Bot] Failed to send order message:`, result);
      return { success: false, error: result.description };
    }
  } catch (err: any) {
    console.error(`[Telegram Bot] Error contacting Telegram API:`, err?.message || err);
    return { success: false, error: err?.message || 'Network error' };
  }
}

/**
 * Dispatch Telegram notification either to customer's chat_id or fallback to target admin
 */
async function sendTelegramUpdateToCustomer(
  chatIdOrUsername: string,
  order: OrderRecord,
  type: 'status_update' | 'quote_ready'
): Promise<{ success: boolean; error?: string }> {
  if (!TELEGRAM_BOT_TOKEN) return { success: false, error: 'No bot token' };

  let targetChatId = chatIdOrUsername;

  // If chatId is not a valid numeric Telegram user ID, we send to the factory sales admin with an instruction
  const isNumericChatId = /^-?\d+$/.test(targetChatId);
  if (!isNumericChatId) {
    targetChatId = TELEGRAM_TARGET_CHAT_ID;
  }

  let messageText = '';
  if (type === 'status_update') {
    const statusLabelAm =
      order.status === 'completed'
        ? '✅ ተጠናቋል / ለመላክ ተዘጋጅቷል (Ready for Dispatch / Completed)'
        : order.status === 'processing'
        ? '🔄 በማምረት ሂደት ላይ ነው (In Production)'
        : '⏳ በመጠባበቅ ላይ (Pending Review)';

    messageText = `
🔔 *የትዕዛዝ ሁኔታ ማሻሻያ (Order Status Update)*
━━━━━━━━━━━━━━━━━━━━━
ሰላም *${order.first_name}*! የጣራ ቆርቆሮ ትዕዛዝዎ ሁኔታ ተሻሽሏል፡

📋 *የትዕዛዝ ቁጥር:* \`${order.order_id}\`
📦 *ምርት:* ${order.product} (${order.gauge} · ${order.color})
📏 *መጠን:* ${order.quantity} LM

⚡ *የአሁኑ ሁኔታ:*
*${statusLabelAm}*

${order.status === 'completed' ? '🎉 ምርትዎ ተመርቶ ተጠናቋል! ከፋብሪካው መረከብ ወይም ወደ አድራሻዎ መላክ ይቻላል።' : '👷 የፋብሪካው ቡድን ምርትዎን እያዘጋጀ ነው።'}

📞 ጥያቄ ካለዎት: \`+251 11 434 2200\`
🏭 *Ethiopian Steel PLC*
    `.trim();
  } else if (type === 'quote_ready') {
    messageText = `
💰 *ኦፊሴላዊ የዋጋ ዝርዝር ተዘጋጅቷል! (Official Factory Quote)*
━━━━━━━━━━━━━━━━━━━━━
ሰላም *${order.first_name}*! ለጠየቁት የጣራ ቆርቆሮ ትዕዛዝ የዋጋ ስሌት ተጠናቋል፡

📋 *የትዕዛዝ ቁጥር:* \`${order.order_id}\`
📦 *ምርት:* ${order.product} (${order.gauge} · ${order.color})
📏 *መጠን:* ${order.quantity} LM

💵 *የተሰላው ጠቅላላ ዋጋ:*
*${order.quotedPriceETB?.toLocaleString()} ETB (ብር)*

${order.quoteNotes ? `💬 *የሽያጭ ማስታወሻ:* _${order.quoteNotes}_\n` : ''}
📍 *የፋብሪካ አድራሻ:* ቃሊቲ (Kaliti), አዲስ አበባ
📞 *የሽያጭ ክፍል ስልክ:* \`+251 11 434 2200\`
━━━━━━━━━━━━━━━━━━━━━
🏭 *Ethiopian Steel PLC*
    `.trim();
  }

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: targetChatId,
        text: messageText,
        parse_mode: 'Markdown',
      }),
    });

    const result = (await response.json()) as any;
    return { success: result.ok, error: result.description };
  } catch (err: any) {
    return { success: false, error: err?.message };
  }
}

// Safely resolve dirname across ESM and CJS bundle
const getAppDir = () => {
  try {
    if (typeof __dirname !== 'undefined') {
      return __dirname;
    }
    if (typeof import.meta !== 'undefined' && import.meta.url) {
      return path.dirname(fileURLToPath(import.meta.url));
    }
  } catch {}
  return process.cwd();
};
const appDir = getAppDir();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory order store initialized with realistic orders
export interface OrderRecord {
  order_id: string;
  user_id: string;
  username: string;
  first_name: string;
  product: string;
  product_id?: string;
  gauge: string;
  color: string;
  quantity: string;
  address: string;
  phone: string;
  timestamp: string;
  status: 'pending' | 'processing' | 'completed';
  customer_email?: string;
  telegram_id?: string;
  notes?: string;
  quotedPriceETB?: number;
  quotedByStaff?: boolean;
  quotedAt?: string;
  quoteNotes?: string;
}

export interface StockRecord {
  id: string;
  name: string;
  inStock: boolean;
  stockMeters: number;
  noteAm?: string;
  noteEn?: string;
}

const stockInventory: StockRecord[] = [
  { id: 'versatile', name: 'Versatile Roofing Sheet (ቨርሳታይል)', inStock: true, stockMeters: 4500, noteAm: 'በመጋዘን አለ', noteEn: 'In Stock' },
  { id: 'elegantile', name: 'Elegantile Premium (ኤሌጋንታይል)', inStock: true, stockMeters: 2800, noteAm: 'በመጋዘን አለ', noteEn: 'In Stock' },
  { id: 'ega', name: 'EGA Industrial Profile (ኢ.ጂ.ኤ)', inStock: true, stockMeters: 6200, noteAm: 'በመጋዘን አለ', noteEn: 'In Stock' },
  { id: 'ega-300', name: 'EGA 300', inStock: true, stockMeters: 2000, noteAm: 'በመጋዘን አለ', noteEn: 'In Stock' },
  { id: 'ega-400', name: 'EGA 400', inStock: true, stockMeters: 1800, noteAm: 'በመጋዘን አለ', noteEn: 'In Stock' },
  { id: 'ega-500', name: 'EGA 500', inStock: true, stockMeters: 1400, noteAm: 'በመጋዘን አለ', noteEn: 'In Stock' },
  { id: 'ega-600', name: 'EGA 600 (Wide 1220mm)', inStock: false, stockMeters: 0, noteAm: 'አልቋል / በቅርቡ ይመረታል', noteEn: 'Out of Stock - Custom batch required' },
  { id: 'corrugated', name: 'Normal Corrugated (መደበኛ ቆርቆሮ)', inStock: true, stockMeters: 8000, noteAm: 'በመጋዘን አለ', noteEn: 'In Stock' },
];

const orders: OrderRecord[] = [
  {
    order_id: 'ORD-20260904-B4A1',
    user_id: '99887766',
    username: 'durov',
    first_name: 'Pavel',
    product: 'ቨርሳታይል (Versatile)',
    product_id: 'versatile',
    gauge: 'G28',
    color: '🔴 ቀይ (Red)',
    quantity: '120',
    address: 'Bole Bulbula, Addis Ababa',
    phone: '0911223344',
    timestamp: '2026-09-04 14:32:10',
    status: 'processing',
    quotedPriceETB: 118800,
    quotedByStaff: true,
    quotedAt: '2026-09-04 15:10:00',
    quoteNotes: 'Discounted 5% factory tier. Delivery included.',
  },
  {
    order_id: 'ORD-20260902-E9C2',
    user_id: '44332211',
    username: 'alexv',
    first_name: 'Alex',
    product: 'ኢ.ጂ.ኤ (EGA)',
    product_id: 'ega',
    gauge: 'G30',
    color: '🔘 ቻርኮል (Charcoal)',
    quantity: '350',
    address: 'Kaliti Industrial Zone, Addis Ababa',
    phone: '0922334455',
    timestamp: '2026-09-02 09:15:00',
    status: 'completed',
    quotedPriceETB: 346500,
    quotedByStaff: true,
    quotedAt: '2026-09-02 10:00:00',
    quoteNotes: 'Special warehouse quotation approved by sales manager.',
  },
];

const AI_PRODUCT_KNOWLEDGE = `
Company: Ethiopian Steel PLC, also known to customers as Anbesa Corrugated (አንበሳ ቆርቆሮ).
The company has 28 years of trusted quality and excellence, sells directly from the factory, and serves residential houses, commercial buildings, factories, and warehouses.
Factory Location: Kaliti, Addis Ababa, near UNISA Clinic and opposite St. Michael Church.
Showrooms:
- Lebu Showroom: Lebu Samuel Building, 2nd floor.
- Summit Showroom: Summit 72.
Business hours: Monday-Saturday 8:00 AM-6:00 PM; Sunday is closed except for order-based service.
Website: https://ethiopiansteelplc.com/

Products:
1. ቨርሳታይል (Versatile): የዘመናዊ የሸክላ ጣራ መልክ (Modern clay-tile roof appearance) - Great for luxury villas and residential homes.
2. ኤሌጋንታይል (Elegantile): ውብ እና ፅዱ ዲዛይን (Elegant, clean design) - Great for modern architectural residences and offices.
3. ኢ.ጂ.ኤ (EGA): ለኢንዱስትሪ እና መጋዘን (Industrial and warehouse) - High strength, wide span, perfect for factories, sheds, and commercial structures.
4. አንበሳ ቆርቆሮ (Corrugated): ጠንካራ እና ረጅም እድሜ (Strong and long-lasting traditional corrugated) - Proven classic reliability for all constructions.

Available Gauges:
- G28 (Thickest, premium durability)
- G30 (Popular standard balance)
- G32 (Economical, lightweight)
- መደበኛ (Standard)

Available Colors:
- 🔵 ሰማያዊ (Blue)
- 🔴 ቀይ (Red)
- 🟢 አረንጓዴ (Green)
- 🔘 ቻርኮል (Charcoal)
- ⚪ ሲልቨር (Silver)

Ordering Process:
Customers can select their product, gauge, color, length in meters, delivery address, and Ethiopian phone number directly in this Telegram Mini App.
The exact price quote is confirmed directly with factory sales representatives.
`;

const AI_SYSTEM_INSTRUCTION = `
You are the customer service and roofing expert assistant for Ethiopian Steel PLC (አንበሳ ቆርቆሮ) on Telegram.
You are helpful, polite, and fluent in both Amharic (አማርኛ) and English.
Reply in the language used by the customer. If they write in Amharic, reply in warm, clear Amharic. If they write in English, reply in English.
Explain Ethiopian Steel PLC roofing products, gauges, colors, factory locations in Kaliti, showrooms at Lebu and Summit, and business hours.
Guide customers on which roofing profile suits their project (e.g. Versatile or Elegantile for villas, EGA for warehouses/factories, Corrugated for versatile durability).
Encourage them to place an order or customize their roof right here in the Mini App Order tab.
Never invent specific prices or delivery costs - state that the factory sales team will confirm the final quotation.

Factsheet:
${AI_PRODUCT_KNOWLEDGE}
`;

// Lazy Gemini client getter
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && process.env.GEMINI_API_KEY) {
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return geminiClient;
}

// Multi-model candidate list for high availability
const CANDIDATE_MODELS = ['gemini-3.8-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'];

// Intelligent Ethiopian Steel Factsheet & Domain Knowledge Engine
function generateSmartFactsheetReply(message: string, isAmharic: boolean): string {
  const query = message.toLowerCase();

  // Location / Address queries
  if (
    query.includes('አድራሻ') ||
    query.includes('ቦታ') ||
    query.includes('location') ||
    query.includes('where') ||
    query.includes('address') ||
    query.includes('factory') ||
    query.includes('ፋብሪካ') ||
    query.includes('showroom') ||
    query.includes('ሾውሩም')
  ) {
    if (isAmharic) {
      return (
        '🏭 የኢትዮጵያን ስቲል (አንበሳ ቆርቆሮ) አድራሻዎች:\n\n' +
        '1. ዋና ፋብሪካ: አዲስ አበባ ቃሊቲ (ከUNISA ክሊኒክ አጠገብ፣ ቅዱስ ሚካኤል ቤተክርስቲያን ፊትለፊት)\n' +
        '2. ሌቡ ሾውሩም: ሌቡ ሳሙኤል ሕንፃ 2ኛ ፎቅ\n' +
        '3. ሱሚት ሾውሩም: ሱሚት 72\n\n' +
        '🕐 የስራ ሰዓት: ሰኞ - ቅዳሜ ከጠዋቱ 8:00 እስከ ምሽቱ 12:00\n' +
        '📞 ስልክ: +251 11 434 2200 / +251 11 434 2201'
      );
    }
    return (
      '🏭 Ethiopian Steel PLC (Anbesa Corrugated) Locations:\n\n' +
      '1. Main Factory: Kaliti, Addis Ababa (Near UNISA Clinic, opposite St. Michael Church)\n' +
      '2. Lebu Showroom: Lebu Samuel Building, 2nd floor\n' +
      '3. Summit Showroom: Summit 72\n\n' +
      '🕐 Working Hours: Monday - Saturday, 8:00 AM - 6:00 PM\n' +
      '📞 Phone: +251 11 434 2200 / +251 11 434 2201'
    );
  }

  // Villa / Residential recommendation
  if (query.includes('ቪላ') || query.includes('villa') || query.includes('መኖሪያ') || query.includes('residential') || query.includes('ቤት')) {
    if (isAmharic) {
      return (
        '🏡 ለቪላ እና ዘመናዊ መኖሪያ ቤቶች ምርጥ ምርጫዎች:\n\n' +
        '1. ቨርሳታይል (Versatile): የዘመናዊ የሸክላ ጣራ ውበት ያለው፣ እጅግ ማራኪ እና ለቪላ ቤቶች ቀዳሚ ምርጫ ነው።\n' +
        '2. ኤሌጋንታይል (Elegantile): ፅዱ እና ዘመናዊ ቅርጽ ያለው ምርት።\n\n' +
        '💡 ምክረ-ሀሳብ: ለቪላ ቤቶች G28 (0.32 ሚ.ሜ) ወይም G30 (0.25 ሚ.ሜ) ጋጅ ከቀይ (Red) ወይም ቻርኮል (Charcoal) ቀለም ጋር እጅግ ተስማሚ ነው።\n' +
        'አሁኑኑ በMini App "ትዕዛዝ" ገጽ ላይ የእርስዎን ጣራ ዲዛይን ማድረግ ይችላሉ!'
      );
    }
    return (
      '🏡 Recommended profiles for residential villas:\n\n' +
      '1. Versatile (ቨርሳታይል): Premium clay-tile appearance, outstanding aesthetic value and our top seller for modern villas.\n' +
      '2. Elegantile (ኤሌጋንታይል): Sleek, contemporary finish for architectural homes.\n\n' +
      '💡 Pro Tip: Pair with G28 (0.32mm) or G30 (0.25mm) gauge in Red or Charcoal for long-lasting prestige.\n' +
      'You can customize your roof right here in the "Order" tab!'
    );
  }

  // Warehouse / Industrial / EGA
  if (query.includes('መጋዘን') || query.includes('ፋብሪካ') || query.includes('warehouse') || query.includes('factory') || query.includes('industrial') || query.includes('ኢ.ጂ.ኤ') || query.includes('ega')) {
    if (isAmharic) {
      return (
        '🏭 ለመጋዘን፣ ለፋብሪካ እና ለንግድ ህንፃዎች:\n\n' +
        'ኢ.ጂ.ኤ (EGA - Industrial Profile) ምርጥ ምርጫ ነው!\n' +
        '• ከፍተኛ ጥንካሬ ያለው እና ረጅም ስፋትን የሚሸፍን\n' +
        '• ለኢንዱስትሪ ጣራ እና ግድግዳ መሸፈኛ እጅግ ተስማሚ\n' +
        '• በጋጅ G28 እና G30 በሰማያዊ፣ ቻርኮል፣ ሲልቨር እና ሌሎች ቀለሞች ይገኛል።\n\n' +
        'ለትዕዛዝ የሚፈልጉትን ርዝመት በሜትር በማስገባት በMini App በቀጥታ ይዘዙ!'
      );
    }
    return (
      '🏭 For warehouses, industrial buildings, and commercial sheds:\n\n' +
      'EGA (ኢ.ጂ.ኤ) is specifically engineered for high structural strength and wide spans:\n' +
      '• Heavy-duty ribbed design for industrial roofs and wall cladding.\n' +
      '• Highly recommended in G28 (0.32mm) or G30 (0.25mm).\n' +
      '• Available in Blue, Charcoal, Silver, Red, and Green.\n\n' +
      'You can select EGA and input your required meters in the Order tab!'
    );
  }

  // Gauge comparison (G28 vs G30 vs G32)
  if (query.includes('ጋጅ') || query.includes('gauge') || query.includes('g28') || query.includes('g30') || query.includes('g32') || query.includes('ውፍረት') || query.includes('thickness')) {
    if (isAmharic) {
      return (
        '📏 የኢትዮጵያን ስቲል የጋጅ (Gauge) አማራጮች:\n\n' +
        '• G28 (0.32 ሚ.ሜ): በጣም ጠንካራ እና ወፍራም። ለከፍተኛ የአየር ጸባይ፣ ለቪላዎችና ረጅም እድሜ ለሚፈልጉ ህንፃዎች።\n' +
        '• G30 (0.25 ሚ.ሜ): መደበኛ እና በብዛት ተመራጭ። ጥንካሬንና ኢኮኖሚያዊ ዋጋን ሚዛናዊ ያደረገ።\n' +
        '• G32 (0.20 ሚ.ሜ): ቀላል እና ኢኮኖሚያዊ ውፍረት።\n' +
        '• መደበኛ (Factory Standard)\n\n' +
        'ጥያቄ ካለዎት የፋብሪካው የሽያጭ ባለሙያዎች በ +251 11 434 2200 በዝርዝር ያማክሩዎታል!'
      );
    }
    return (
      '📏 Gauge thickness guide at Ethiopian Steel PLC:\n\n' +
      '• G28 (~0.32mm): Heavy-duty, maximum durability, best for luxury villas and extreme weather resilience.\n' +
      '• G30 (~0.25mm): The popular standard with an optimal balance of strength and economy.\n' +
      '• G32 (~0.20mm): Lightweight and cost-efficient option.\n' +
      '• Factory Standard: General reliable profile.\n\n' +
      'Feel free to choose any gauge in the Order tab or call +251 11 434 2200 for technical advice!'
    );
  }

  // Price / Cost queries
  if (query.includes('ዋጋ') || query.includes('ስንት') || query.includes('price') || query.includes('cost') || query.includes('birr') || query.includes('ብር')) {
    if (isAmharic) {
      return (
        '💰 ስለ ዋጋ እና ጥቅስ (Quotation):\n\n' +
        'የኢትዮጵያን ስቲል (አንበሳ ቆርቆሮ) ምርቶች በቀጥታ ከፋብሪካ የሚሸጡ ሲሆን ዋጋው እንደመረጡት የምርት ዓይነት (ቨርሳታይል፣ ኤሌጋንታይል፣ EGA፣ አንበሳ ቆርቆሮ)፣ ጋጅ (G28, G30) እና የትዕዛዝ መጠን ይወሰናል።\n\n' +
        '📌 ትክክለኛውን ዋጋ ለማወቅ:\n' +
        '1. በMini App "ትዕዛዝ" ገጽ ላይ መርጠው ትዕዛዝዎን ያስገቡ - የሽያጭ ክፍላችን ወዲያውኑ ይደውልልዎታል\n' +
        '2. ወይም በቀጥታ በ +251 11 434 2200 / +251 11 434 2201 ይደውሉ!'
      );
    }
    return (
      '💰 Pricing & Quotations:\n\n' +
      'Ethiopian Steel PLC sells directly from the factory. Prices depend on the profile selected (Versatile, Elegantile, EGA, Corrugated), gauge thickness (G28, G30), and meter volume.\n\n' +
      '📌 To receive your exact official quote:\n' +
      '1. Submit your specifications via the Mini App "Order" tab and our sales team will contact you promptly.\n' +
      '2. Or call our sales hotline directly at +251 11 434 2200 / +251 11 434 2201.'
    );
  }

  // General Products overview
  if (query.includes('ምርት') || query.includes('product') || query.includes('ቆርቆሮ') || query.includes('አንበሳ') || query.includes('corrugated') || query.includes('color') || query.includes('ቀለም')) {
    if (isAmharic) {
      return (
        '🏗️ የኢትዮጵያን ስቲል (አንበሳ ቆርቆሮ) 4ቱ ዋና የጣራ ምርቶች:\n\n' +
        '1. ቨርሳታይል (Versatile): የዘመናዊ የሸክላ ጣራ ውበት ያለው (ለቪላ)\n' +
        '2. ኤሌጋንታይል (Elegantile): ውብ እና ፅዱ ዲዛይን\n' +
        '3. ኢ.ጂ.ኤ (EGA): ለኢንዱስትሪ፣ ፋብሪካ እና መጋዘን\n' +
        '4. አንበሳ ቆርቆሮ (Corrugated): ጠንካራ፣ የታመነ እና የ28 ዓመታት ተወዳጅ\n\n' +
        '🎨 ቀለሞች: 🔵 ሰማያዊ | 🔴 ቀይ | 🟢 አረንጓዴ | 🔘 ቻርኮል | ⚪ ሲልቨር\n' +
        'የፈለጉትን ቀለም በ 3D ጣራ እይታ መመልከት ይችላሉ!'
      );
    }
    return (
      '🏗️ Ethiopian Steel PLC 4 Signature Roofing Profiles:\n\n' +
      '1. Versatile (ቨርሳታይል): Clay-tile aesthetic for residential homes & villas\n' +
      '2. Elegantile (ኤሌጋንታይል): Sleek modern architectural profile\n' +
      '3. EGA (ኢ.ጂ.ኤ): High-strength industrial profile for warehouses & factories\n' +
      '4. Anbesa Corrugated (አንበሳ ቆርቆሮ): Classic, trusted 28-year durability\n\n' +
      '🎨 Colors: Blue, Red, Green, Charcoal, Silver\n' +
      'Explore live 3D simulations under the "Order" tab!'
    );
  }

  // Default friendly greeting
  if (isAmharic) {
    return (
      'እንኳን ወደ ኢትዮጵያን ስቲል ፒ.ኤል.ሲ (አንበሳ ቆርቆሮ) በደህና መጡ! 🇪🇹 የ28 ዓመታት የታመነ አገልግሎት።\n\n' +
      'ስለ ምርቶቻችን (ቨርሳታይል፣ ኤሌጋንታይል፣ EGA፣ አንበሳ ቆርቆሮ)፣ ጋጆች (G28, G30, G32)፣ ቀለሞች ወይም የቃሊቲ ፋብሪካ እና ሾውሩሞች አድራሻ ማንኛውንም ጥያቄ መጠየቅ ይችላሉ። እንዲሁም በቀጥታ በMini App ትዕዛዝዎን ማስገባት ይችላሉ!'
    );
  }
  return (
    'Welcome to Ethiopian Steel PLC (Anbesa Corrugated)! 🇪🇹 28 years of trusted roofing quality direct from the factory.\n\n' +
    'Ask me about our profiles (Versatile, Elegantile, EGA, Corrugated), gauge thicknesses (G28, G30), color choices, or Kaliti factory and showroom locations. You can also place an order directly in this Mini App!'
  );
}

// Helper function to call Gemini with multi-model fallback and error recovery
async function queryGeminiWithFallback(
  ai: GoogleGenAI,
  contents: any[],
  systemInstruction: string
): Promise<string> {
  let lastError: any = null;

  for (const model of CANDIDATE_MODELS) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction,
          temperature: 0.3,
        },
      });

      if (res && res.text && res.text.trim()) {
        return res.text.trim();
      }
    } catch (err: any) {
      lastError = err;
      const isUnavailable =
        err?.status === 503 ||
        err?.code === 503 ||
        err?.status === 429 ||
        err?.code === 429 ||
        (typeof err?.message === 'string' && (err.message.includes('high demand') || err.message.includes('UNAVAILABLE')));

      console.warn(`Gemini model ${model} temporarily unavailable or failed (${isUnavailable ? 'high demand' : err?.message}). Trying next candidate...`);
    }
  }

  throw lastError || new Error('All candidate Gemini models temporarily unavailable');
}

// 1. Gemini AI Chat API
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const isAmharic = /[\u1200-\u137F]/.test(message);
    const ai = getGeminiClient();

    if (ai) {
      try {
        const formattedContents = [];
        for (const h of history) {
          if (h && (h.role === 'user' || h.role === 'model') && typeof h.text === 'string') {
            formattedContents.push({
              role: h.role,
              parts: [{ text: h.text }],
            });
          }
        }
        formattedContents.push({
          role: 'user',
          parts: [{ text: message }],
        });

        const reply = await queryGeminiWithFallback(ai, formattedContents, AI_SYSTEM_INSTRUCTION);
        res.json({ reply, source: 'gemini' });
        return;
      } catch (geminiErr: any) {
        console.warn('Gemini cloud API is experiencing high demand (503). Serving via factory knowledge engine:', geminiErr?.message || geminiErr);
      }
    }

    // High availability fallback using factsheet engine
    const reply = generateSmartFactsheetReply(message, isAmharic);
    res.json({ reply, source: 'factory-kb' });
  } catch (err: unknown) {
    console.error('Chat endpoint error:', err);
    res.json({
      reply:
        'ጤና ይስጥልኝ! እንኳን ወደ ኢትዮጵያን ስቲል (አንበሳ ቆርቆሮ) በደህና መጡ። ለትዕዛዝ ወይም ለዋጋ ማረጋገጫ በቀጥታ በ +251 11 434 2200 ይደውሉ ወይም በ Mini App ትዕዛዝዎን ያስገቡ።',
      source: 'default',
    });
  }
});

// 2. Orders Endpoints
app.get('/api/orders', (req, res) => {
  res.json({ orders, success: true });
});

app.post('/api/orders', async (req, res) => {
  const newOrder: OrderRecord = {
    order_id: req.body.order_id || `ORD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
    user_id: req.body.user_id || 'anonymous',
    username: req.body.username || 'N/A',
    first_name: req.body.first_name || 'Customer',
    product: req.body.product,
    product_id: req.body.product_id,
    gauge: req.body.gauge,
    color: req.body.color,
    quantity: req.body.quantity,
    address: req.body.address,
    phone: req.body.phone,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    status: 'pending',
    customer_email: req.body.customer_email,
    telegram_id: req.body.telegram_id || req.body.username,
    notes: req.body.notes,
  };

  orders.unshift(newOrder);

  // Send instant Telegram notification to your Target Chat ID
  let telegramDispatched = false;
  let telegramError: string | undefined;
  try {
    const tgResult = await sendTelegramOrderNotification(newOrder);
    telegramDispatched = tgResult.success;
    telegramError = tgResult.error;
  } catch (err: any) {
    console.error('Error dispatching telegram order notification:', err);
    telegramError = err?.message;
  }

  res.status(201).json({ 
    success: true, 
    order: newOrder, 
    telegramDispatched,
    telegramTargetChatId: TELEGRAM_TARGET_CHAT_ID,
    telegramError 
  });
});

// Test endpoint to verify Telegram Bot integration directly
app.post('/api/telegram/test', async (req, res) => {
  const testMessage = `
🔔 *Ethiopian Steel PLC Telegram Bot Test*
━━━━━━━━━━━━━━━━━━━━━
✅ *Connection Successful!*
Bot Token and Target Chat ID (\`${TELEGRAM_TARGET_CHAT_ID}\`) are properly configured.
When any customer submits an order, it will appear here immediately.
  `.trim();

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_TARGET_CHAT_ID,
        text: testMessage,
        parse_mode: 'Markdown',
      }),
    });

    const result = (await response.json()) as any;
    if (result.ok) {
      res.json({ success: true, message: 'Telegram test message sent successfully!', result });
    } else {
      res.status(500).json({ success: false, error: result.description, details: result });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to send test message' });
  }
});


app.patch('/api/orders/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const order = orders.find(o => o.order_id === id);
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }
  if (status && ['pending', 'processing', 'completed'].includes(status)) {
    order.status = status;

    // Send Telegram update to customer (or sales chat)
    const targetChat = order.user_id && order.user_id !== 'anonymous' ? order.user_id : TELEGRAM_TARGET_CHAT_ID;
    sendTelegramUpdateToCustomer(targetChat, order, 'status_update').catch(err => {
      console.warn('Failed to send status update on telegram:', err);
    });

    res.json({ success: true, order });
    return;
  }
  res.status(400).json({ error: 'Invalid status' });
});

// Admin Quote Pricing endpoint
app.post('/api/orders/:id/quote', async (req, res) => {
  const { id } = req.params;
  const { quotedPriceETB, quoteNotes } = req.body;
  const order = orders.find(o => o.order_id === id);
  if (!order) {
    res.status(404).json({ error: 'Order not found' });
    return;
  }

  const priceNum = Number(quotedPriceETB);
  if (isNaN(priceNum) || priceNum < 0) {
    res.status(400).json({ error: 'Valid price in ETB is required' });
    return;
  }

  order.quotedPriceETB = priceNum;
  order.quotedByStaff = true;
  order.quotedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
  if (quoteNotes !== undefined) {
    order.quoteNotes = quoteNotes;
  }

  // Automatically push price quote alert to the customer's Telegram
  const targetChat = order.user_id && order.user_id !== 'anonymous' ? order.user_id : TELEGRAM_TARGET_CHAT_ID;
  sendTelegramUpdateToCustomer(targetChat, order, 'quote_ready').catch(err => {
    console.warn('Failed to send quote notification on telegram:', err);
  });

  res.json({ success: true, order });
});


// 3. Stock Inventory Endpoints
app.get('/api/stock', (req, res) => {
  res.json({ stock: stockInventory });
});

app.post('/api/stock/:id', (req, res) => {
  const { id } = req.params;
  const { inStock, stockMeters, noteAm, noteEn } = req.body;
  let item = stockInventory.find(s => s.id === id);
  if (!item) {
    item = {
      id,
      name: req.body.name || id,
      inStock: inStock !== undefined ? Boolean(inStock) : true,
      stockMeters: typeof stockMeters === 'number' ? stockMeters : 0,
      noteAm,
      noteEn,
    };
    stockInventory.push(item);
  } else {
    if (inStock !== undefined) item.inStock = Boolean(inStock);
    if (typeof stockMeters === 'number') item.stockMeters = stockMeters;
    if (noteAm !== undefined) item.noteAm = noteAm;
    if (noteEn !== undefined) item.noteEn = noteEn;
  }
  res.json({ success: true, item });
});

app.get('/api/orders/export', (req, res) => {
  let csv = 'Order ID,Date,Customer,Telegram,Product,Gauge,Color,Quantity,Address,Phone,Quoted ETB,Status\n';
  orders.forEach(o => {
    const rawTg = (o.username || o.telegram_id || 'N/A').replace(/^@+/, '');
    const tgDisplay = rawTg === 'N/A' || !rawTg ? 'N/A' : `@${rawTg}`;
    csv += `"${o.order_id}","${o.timestamp}","${o.first_name}","${tgDisplay}","${o.product}","${o.gauge}","${o.color}","${o.quantity}m","${o.address}","${o.phone}","${o.quotedPriceETB ? o.quotedPriceETB + ' ETB' : 'Pending Quote'}","${o.status}"\n`;
  });
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="ethiopian_steel_orders.csv"');
  res.send('\uFEFF' + csv);
});

// Vite Middleware for development & Static hosting for production
async function startServer() {
  const publicPath = path.join(process.cwd(), 'public');
  app.use(express.static(publicPath));

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Ethiopian Steel PLC Telegram Mini App server running on port ${PORT}`);
  });
}

startServer();

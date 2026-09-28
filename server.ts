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
    let statusEmoji = '📦';
    let statusLabel = 'Pending';
    if (order.status === 'shipped') {
      statusEmoji = '🚚';
      statusLabel = 'Shipped / በመጓጓዝ ላይ';
    } else if (order.status === 'delivered') {
      statusEmoji = '🎉';
      statusLabel = 'Delivered / ደርሷል';
    } else if (order.status === 'completed') {
      statusEmoji = '✅';
      statusLabel = 'Ready / ተጠናቋል';
    } else if (order.status === 'processing') {
      statusEmoji = '⚙️';
      statusLabel = 'In Production / በማምረት ላይ';
    }

    messageText = `
${statusEmoji} *Order Update: ${statusLabel}*
📋 \`${order.order_id}\`
📦 ${order.product} (${order.gauge} · ${order.color})
📏 ${order.quantity} LM
📍 ${order.address || 'N/A'}
📱 \`${order.phone}\`

${order.status === 'shipped' ? '🚚 Your roofing order has shipped and is on the way!' : order.status === 'delivered' ? '✅ Your roofing order has been delivered successfully. Thank you for choosing Ethiopian Steel!' : ''}
📞 +251 11 434 2200 · Ethiopian Steel
    `.trim();
  } else if (type === 'quote_ready') {
    const qtyNum = parseFloat(String(order.quantity || '0')) || 0;
    const totalETB = Number(order.quotedPriceETB) || 0;
    const unitPrice = order.unitPriceETB || (qtyNum > 0 ? Math.round((totalETB / qtyNum) * 100) / 100 : 0);

    messageText = `
💰 *Official Factory Price Quote*
📋 \`${order.order_id}\`
📦 ${order.product} (${order.gauge} · ${order.color})
📏 Qty: *${order.quantity} LM*

💵 *Unit Price:* ${unitPrice.toLocaleString()} ETB/LM
🧾 *Total:* *${order.quantity} LM × ${unitPrice.toLocaleString()} ETB = ${totalETB.toLocaleString()} ETB*
${order.quoteNotes ? `💬 _${order.quoteNotes}_\n` : ''}
📍 Kaliti Factory · 📞 +251 11 434 2200
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
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'completed';
  customer_email?: string;
  telegram_id?: string;
  notes?: string;
  quotedPriceETB?: number;
  unitPriceETB?: number;
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

// Multi-model candidate list for ultra-fast generation with high availability
const CANDIDATE_MODELS = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];

// Helper to race promise with timeout
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error(errorMessage)), timeoutMs)),
  ]);
}

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
      // 5-second timeout per candidate model for snappy responsiveness
      const res = await withTimeout(
        ai.models.generateContent({
          model,
          contents,
          config: {
            systemInstruction,
            temperature: 0.3,
          },
        }),
        5000,
        `Gemini model ${model} response timed out`
      );

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
        (typeof err?.message === 'string' && (err.message.includes('high demand') || err.message.includes('UNAVAILABLE') || err.message.includes('timed out')));

      console.warn(`Gemini model ${model} temporarily unavailable or timed out (${isUnavailable ? 'high demand / timeout' : err?.message}). Trying next candidate...`);
    }
  }

  throw lastError || new Error('All candidate Gemini models temporarily unavailable');
}

// 1. Gemini AI Chat API (and slash command runner)
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [], userId, username, customerName } = req.body;
    if (!message || typeof message !== 'string') {
      res.status(400).json({ error: 'Message is required' });
      return;
    }

    const isAmharic = /[\u1200-\u137F]/.test(message);
    const trimmed = message.trim();

    // Direct command execution (/start, /products, /status, /calc, /showroom, /help, /orders, /quote)
    if (trimmed.startsWith('/')) {
      const cmdResult = processTelegramCommand(
        trimmed,
        {
          id: userId || 'web-user',
          username: username || 'web_user',
          first_name: customerName || 'Customer',
        },
        isAmharic
      );
      res.json({ reply: cmdResult.text, source: 'command' });
      return;
    }
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

// Unified Telegram Bot Command Engine (Handles /start, /products, /status, /calc, /showroom, /help, /orders, /quote)
interface CommandResult {
  text: string;
  replyMarkup?: any;
}

function processTelegramCommand(
  rawText: string,
  fromUser: { id?: string | number; username?: string; first_name?: string } = {},
  isAmharicHint?: boolean
): CommandResult {
  const text = rawText.trim();
  const tokens = text.split(/\s+/);
  const command = tokens[0].toLowerCase().split('@')[0]; // Remove @botname if in group
  const isAmharic = isAmharicHint !== undefined ? isAmharicHint : /[\u1200-\u137F]/.test(text);

  const userIdStr = String(fromUser.id || '');
  const usernameStr = (fromUser.username || '').replace(/^@+/, '').toLowerCase();
  const isAdmin =
    userIdStr === TELEGRAM_TARGET_CHAT_ID ||
    userIdStr === '6184751487' ||
    usernameStr === 'esplc_f' ||
    usernameStr.includes('admin');

  // Base Inline Keyboard for quick 1-tap navigation in Telegram
  const standardKeyboard = {
    inline_keyboard: [
      [
        { text: '📦 የጣራ ምርቶች (Products)', callback_data: 'cmd_products' },
        { text: '🔍 ትዕዛዝ ሁኔታ (Status)', callback_data: 'cmd_status' },
      ],
      [
        { text: '🏢 አድራሻና ሾውሩም (Showroom)', callback_data: 'cmd_showroom' },
        { text: '🧮 የጣራ ስሌት (Roof Calc)', callback_data: 'cmd_calc' },
      ],
      [
        { text: '📞 እርዳታ እና ስልክ (Help)', callback_data: 'cmd_help' },
      ],
      ...(isAdmin
        ? [[{ text: '📋 የቅርብ ጊዜ ትዕዛዞች (Admin Orders)', callback_data: 'cmd_orders' }]]
        : []),
    ],
  };

  // 1. /start or /menu
  if (command === '/start' || command === '/menu') {
    const welcome = `
🦁 *እንኳን ወደ ኢትዮጵያን ስቲል ፒ.ኤል.ሲ (አንበሳ ቆርቆሮ) በደህና መጡ!* 🇪🇹
_የ28 ዓመታት የታመነ የጣራ ቆርቆሮ ጥራት እና አስተማማኝነት_

📌 *ዋና ዋና የትዕዛዝ ማዘዣዎች (Commands):*
• /products - የጣራ ቆርቆሮ አይነቶች (Versatile, EGA, Elegantile, Corrugated)
• /status <የትዕዛዝ_ቁጥር> - የትዕዛዝዎን ሁኔታ መከታተያ
• /calc <ርዝመት> <ስፋት> - የጣራ ቆርቆሮ መጠን ስሌት (ምሳሌ፡ \`/calc 10 12\`)
• /showroom - የፋብሪካ እና የሾውሩም አድራሻዎች
• /help - የሽያጭ ክፍል ስልክ እና እርዳታ

${isAdmin ? '👑 *የአስተዳዳሪ ትዕዛዞች (Admin Commands):*\n• /orders - የቅርብ ጊዜ ትዕዛዞችን ማየት\n• /quote <order_id> <price> [notes] - ዋጋ መስጠት\n• /status_update <order_id> <status> - ሁኔታ መቀየር\n' : ''}💬 እንዲሁም ማንኛውንም ጥያቄ (ስለ ጋጅ፣ ውፍረት፣ ቀለም ወይም ዋጋ) በቀጥታ በዚህ ቦት መጠየቅ ይችላሉ!
    `.trim();

    return { text: welcome, replyMarkup: standardKeyboard };
  }

  // 2. /products
  if (command === '/products') {
    const products = `
🏭 *የኢትዮጵያን ስቲል ዋና ዋና የጣራ ምርቶች (Roofing Profiles):*
━━━━━━━━━━━━━━━━━━━━━
1️⃣ *ቨርሳታይል (Versatile Tile Profile):*
• ውብ የሰድር ቅርፅ፣ ለቪላ እና ለዘመናዊ መኖሪያ ቤቶች ተመራጭ።
• ውፍረት: G28 (0.32mm) እና G30 (0.25mm)
• ቀለሞች: ቀይ (Brick Red)፣ አረንጓዴ (Emerald)፣ ቻርኮል (Grey)

2️⃣ *ኤሌጋንታይል (Elegantile Classic):*
• ፕሪሚየም ክላሲክ ሰድር ዲዛይን፣ ለቅንጡ ቤቶችና ሪዞርቶች።
• ውፍረት: G28 (0.32mm)

3️⃣ *ኢ.ጂ.ኤ (EGA 300, 400, 500, 600):*
• ዘመናዊ የትራፔዞይዳል ቅርፅ፣ ለኢንዱስትሪ፣ ለመጋዘንና ለዘመናዊ ህንፃዎች።
• ከፍተኛ ጥንካሬ እና ፈጣን የውሃ ፍሳሽ ማስተላለፍ።

4️⃣ *መደበኛ አንበሳ ቆርቆሮ (Normal Corrugated):*
• የ28 ዓመታት የታወቀው አንበሳ ብራንድ፣ አስተማማኝና ዘላቂ።
• ውፍረት: G28, G30, G32 (0.20mm)

🎨 *ቀለሞች:* ቀይ • አረንጓዴ • ቻርኮል • ሲልቨር (Galvanized)
📞 *ለትዕዛዝ ወይም ለዋጋ:* +251 11 434 2200 / +251 91 122 3344
    `.trim();

    return {
      text: products,
      replyMarkup: {
        inline_keyboard: [
          [
            { text: '🧮 የጣራ ስሌት (Calculate)', callback_data: 'cmd_calc' },
            { text: '🔍 ትዕዛዝ ሁኔታ (Track)', callback_data: 'cmd_status' },
          ],
        ],
      },
    };
  }

  // 3. /status or /status <order_id>
  if (command === '/status') {
    const orderIdArg = tokens[1]?.trim();

    if (orderIdArg) {
      const match = orders.find(
        o =>
          o.order_id.toLowerCase() === orderIdArg.toLowerCase() ||
          o.order_id.toLowerCase().includes(orderIdArg.toLowerCase())
      );

      if (!match) {
        return {
          text: `❌ የትዕዛዝ ቁጥር \`${orderIdArg}\` አልተገኘም። እባክዎ ቁጥሩን ያረጋግጡ ወይም በ +251 11 434 2200 ይደውሉ።`,
        };
      }

      const statusAm: Record<string, string> = {
        pending: 'በመጠባበቅ ላይ (Pending Quote)',
        processing: 'በማምረት ላይ (In Production)',
        shipped: 'ተልኳል / በመጓጓዝ ላይ (Shipped)',
        delivered: 'ደርሷል (Delivered)',
        completed: 'ተጠናቋል (Completed)',
      };

      const info = `
📋 *የትዕዛዝ መረጃ:* \`${match.order_id}\`
━━━━━━━━━━━━━━━━━━━━━
• ሁኔታ: *${statusAm[match.status] || match.status}*
• ደንበኛ: *${match.first_name}*
• ስልክ: \`${match.phone}\`
• ምርት: *${match.product} (${match.gauge})*
• ቀለም: *${match.color}*
• መጠን: *${match.quantity} Linear Meters*
• አድራሻ: *${match.address}*
• ቀን: *${match.timestamp}*
${match.quotedPriceETB ? `• የተሰጠው ዋጋ: *${match.quotedPriceETB.toLocaleString()} ETB*` : '• ዋጋ: *በፋብሪካው በመሰላት ላይ*'}
${match.unitPriceETB ? `• የአንዱ ሜትር ዋጋ: *${match.unitPriceETB.toLocaleString()} ETB/m*` : ''}
${match.quoteNotes ? `• ማስታወሻ: _"${match.quoteNotes}"_` : ''}
      `.trim();

      return { text: info };
    }

    // No order ID provided: Look up orders by this Telegram user
    const userOrders = orders.filter(o => {
      const tgId = o.user_id || o.telegram_id || '';
      const uname = (o.username || '').replace(/^@+/, '').toLowerCase();
      return (
        (userIdStr && tgId === userIdStr) ||
        (usernameStr && uname === usernameStr)
      );
    });

    if (userOrders.length > 0) {
      let resp = `📋 *የእርስዎ የቅርብ ጊዜ ትዕዛዞች (${userOrders.length}):*\n━━━━━━━━━━━━━━━━━━━━━\n`;
      userOrders.slice(-4).reverse().forEach((ord, i) => {
        resp += `\n${i + 1}️⃣ *ቁጥር:* \`${ord.order_id}\`\n• ምርት: ${ord.product} (${ord.quantity}m)\n• ሁኔታ: *${ord.status}*\n• ዋጋ: ${ord.quotedPriceETB ? ord.quotedPriceETB.toLocaleString() + ' ETB' : 'በስሌት ላይ'}\n`;
      });
      resp += `\nዝርዝሩን ለማየት: \`/status <የትዕዛዝ_ቁጥር>\` ብለው ይላኩ።`;
      return { text: resp };
    }

    return {
      text: `
ℹ️ *የትዕዛዝ መከታተያ (Order Tracking):*
እባክዎ የትዕዛዝ ቁጥርዎን አያይዘው ይጻፉ።
ምሳሌ፡ \`/status ORD-20260904-B4A1\`

የትዕዛዝ ቁጥርዎን ካላወቁ ወይም አዲስ ለማዘዝ በ +251 11 434 2200 ይደውሉ።
      `.trim(),
    };
  }

  // 4. /calc or /calc <length> <width>
  if (command === '/calc' || command === '/calculate') {
    const len = parseFloat(tokens[1]);
    const wid = parseFloat(tokens[2]);

    if (!isNaN(len) && !isNaN(wid) && len > 0 && wid > 0) {
      const groundArea = len * wid;
      const pitchedArea = Math.round(groundArea * 1.15); // Standard 15% roof pitch slope
      const sheetCount = Math.ceil(wid / 0.85); // standard effective cover ~850mm
      const halfSpan = len / 2;
      const slopeLength = Math.round((halfSpan * 1.15 + 0.3) * 10) / 10;
      const totalLM = Math.round(sheetCount * 2 * slopeLength);
      const estWeightKg = Math.round(pitchedArea * 3.8); // avg weight ~3.8kg/m2 for G28

      const calcResult = `
🧮 *የጣራ ስሌት ውጤት (${len}m × ${wid}m):*
━━━━━━━━━━━━━━━━━━━━━
• የመሬት ስፋት: *${groundArea} ካሬ ሜትር (m²)*
• የጣራው ጠቅላላ ስፋት (Pitch ~15%): *${pitchedArea} m²*
• የሚፈጀው ጠቅላላ ሜትር: *~${totalLM} Linear Meters (LM)*
• የሚያስፈልገው የቆርቆሮ ብዛት (Dual Slope): *~${sheetCount * 2} ፍሬ* (እያንዳንዳቸው ~${slopeLength}m)
• ግምታዊ ክብደት (G28): *~${estWeightKg} kg*

💡 *ማሳሰቢያ:* ይህ ግምታዊ ስሌት ነው። ትክክለኛውን ለማረጋገጥና ለማዘዝ በ +251 11 434 2200 ይደውሉ።
      `.trim();

      return { text: calcResult };
    }

    return {
      text: `
🧮 *የጣራ ቆርቆሮ ስሌት ማሽን (Roof Estimator):*
የጣራዎን ርዝመት እና ስፋት በሜትር አስገብተው ይጻፉ።

👉 ምሳሌ፡ \`/calc 10 12\`
(ርዝመት: 10 ሜትር፣ ስፋት: 12 ሜትር)
      `.trim(),
    };
  }

  // 5. /showroom or /location
  if (command === '/showroom' || command === '/location') {
    const showroom = `
🏢 *የኢትዮጵያን ስቲል ፒ.ኤል.ሲ አድራሻዎች (Locations):*
━━━━━━━━━━━━━━━━━━━━━
📍 *ዋና ፋብሪካ (Kaliti Main Factory):*
ቃሊቲ፣ ከቶታል ማደያ አጠገብ፣ አዲስ አበባ
📞 ስልክ: +251 11 434 2200 / +251 91 122 3344

📍 *ሱሚት ሾውሩም (Summit Showroom):*
ሱሚት 72፣ ከኮንዶሚኒየም መግቢያ አጠገብ
📞 ስልክ: +251 92 233 4455

⏰ *የስራ ሰዓት:* ሰኞ - ቅዳሜ: 8:00 AM - 6:00 PM (ከሰኞ እስከ ቅዳሜ)
🌐 ድረ-ገጽ: https://ethiopiansteelplc.com
    `.trim();

    return { text: showroom };
  }

  // 6. /help
  if (command === '/help' || command === '/support') {
    const help = `
ℹ️ *የኢትዮጵያን ስቲል የእርዳታ ማዕከል (Support):*
━━━━━━━━━━━━━━━━━━━━━
📞 *የሽያጭና ትዕዛዝ ክፍል:* +251 11 434 2200
📱 *ተንቀሳቃሽ ስልክ:* +251 91 122 3344 / +251 92 233 4455
💬 *ቴሌግራም ረዳት:* @Esplc_f
🌐 *ድረ-ገጽ:* https://ethiopiansteelplc.com

📍 *ዋና ፋብሪካ:* ቃሊቲ፣ አዲስ አበባ
⏰ *የስራ ሰዓት:* 8:00 AM - 6:00 PM
    `.trim();

    return { text: help };
  }

  // 7. ADMIN COMMAND: /orders
  if (command === '/orders') {
    if (!isAdmin) {
      return { text: '⛔ ይህ ትዕዛዝ ለፋብሪካው አስተዳዳሪዎች ብቻ የተፈቀደ ነው (Admin Access Only).' };
    }

    const recent = orders.slice(-6).reverse();
    let resp = `📋 *የቅርብ ጊዜ የደንበኛ ትዕዛዞች (${orders.length} ጠቅላላ):*\n━━━━━━━━━━━━━━━━━━━━━\n`;

    recent.forEach((ord, i) => {
      const qStatus = ord.quotedPriceETB
        ? `💰 ${ord.quotedPriceETB.toLocaleString()} ETB`
        : '⏳ ዋጋ አልተሰጠም (Pending)';
      resp += `\n${i + 1}️⃣ \`${ord.order_id}\` [${ord.status.toUpperCase()}]\n👤 *${ord.first_name}* (📞 \`${ord.phone}\`)\n📦 ${ord.quantity}m ${ord.product} (${ord.gauge})\n${qStatus}\n`;
    });

    resp += `\n━━━━━━━━━━━━━━━━━━━━━\n👉 *ዋጋ ለመስጠት:* \`/quote <order_id> <price_etb> [notes]\`\n👉 *ሁኔታ ለመቀየር:* \`/status_update <order_id> <status>\``;
    return { text: resp };
  }

  // 8. ADMIN COMMAND: /quote <order_id> <price> [notes]
  if (command === '/quote') {
    if (!isAdmin) {
      return { text: '⛔ ይህ ትዕዛዝ ለፋብሪካው አስተዳዳሪዎች ብቻ የተፈቀደ ነው (Admin Access Only).' };
    }

    const orderIdArg = tokens[1]?.trim();
    const priceArg = tokens[2]?.trim();
    const notesArg = tokens.slice(3).join(' ').trim();

    if (!orderIdArg || !priceArg) {
      return {
        text: `
ℹ️ *የዋጋ መስጫ መመሪያ (Quote Syntax):*
\`/quote <order_id> <price_in_ETB> [notes]\`

👉 ምሳሌዎች:
• \`/quote ORD-20260904-B4A1 125000 5% discount applied\`
• \`/quote ORD-20260904-B4A1 1050/m\`
        `.trim(),
      };
    }

    const order = orders.find(
      o =>
        o.order_id.toLowerCase() === orderIdArg.toLowerCase() ||
        o.order_id.toLowerCase().includes(orderIdArg.toLowerCase())
    );

    if (!order) {
      return { text: `❌ ትዕዛዝ \`${orderIdArg}\` አልተገኘም። እባክዎ /orders ብለው ቁጥሩን ያረጋግጡ።` };
    }

    const qty = parseFloat(order.quantity) || 1;
    let totalPrice = 0;
    let unitPrice = 0;

    if (priceArg.toLowerCase().includes('/m') || priceArg.toLowerCase().includes('m')) {
      unitPrice = parseFloat(priceArg.replace(/[^0-9.]/g, ''));
      totalPrice = Math.round(unitPrice * qty);
    } else {
      totalPrice = parseFloat(priceArg.replace(/[^0-9.]/g, ''));
      unitPrice = Math.round((totalPrice / qty) * 100) / 100;
    }

    if (isNaN(totalPrice) || totalPrice <= 0) {
      return { text: '❌ እባክዎ ትክክለኛ የዋጋ መጠን በብር ያስገቡ። ምሳሌ፡ `/quote ORD-xxx 125000`' };
    }

    // Update order record
    order.quotedPriceETB = totalPrice;
    order.unitPriceETB = unitPrice;
    order.quotedByStaff = true;
    order.quotedAt = new Date().toISOString().replace('T', ' ').substring(0, 19);
    if (notesArg) order.quoteNotes = notesArg;
    if (order.status === 'pending') order.status = 'processing';

    // Dispatch update to customer Telegram chat if known
    if (order.user_id && order.user_id !== 'anonymous' && !isNaN(Number(order.user_id))) {
      sendTelegramMessageWithKeyboard(
        order.user_id,
        `
🎉 *በትዕዛዝዎ ላይ የዋጋ ስሌት ደርሷል!*
━━━━━━━━━━━━━━━━━━━━━
📋 *የትዕዛዝ ቁጥር:* \`${order.order_id}\`
📦 *ምርት:* ${order.product} (${order.gauge}) - ${order.quantity}m
💰 *ጠቅላላ ዋጋ:* *${totalPrice.toLocaleString()} ETB*
💵 *የአንዱ ሜትር ዋጋ:* *${unitPrice.toLocaleString()} ETB/m*
${notesArg ? `📝 *ማስታወሻ:* "${notesArg}"` : ''}

ለክፍያ እና ማረጋገጫ በ +251 11 434 2200 ይደውሉ።
        `.trim()
      ).catch(() => {});
    }

    return {
      text: `
✅ *በትዕዛዝ \`${order.order_id}\` ላይ ዋጋ በተሳካ ሁኔታ ተሰጥቷል!*
━━━━━━━━━━━━━━━━━━━━━
👤 ደንበኛ: *${order.first_name}* (📞 \`${order.phone}\`)
📦 መጠን: *${order.quantity}m* (${order.product})
💰 ጠቅላላ ዋጋ: *${totalPrice.toLocaleString()} ETB*
💵 የአንዱ ሜትር ዋጋ: *${unitPrice.toLocaleString()} ETB/m*
${notesArg ? `📝 ማስታወሻ: _"${notesArg}"_` : ''}
      `.trim(),
    };
  }

  // 9. ADMIN COMMAND: /status_update <order_id> <status>
  if (command === '/status_update') {
    if (!isAdmin) {
      return { text: '⛔ ይህ ትዕዛዝ ለፋብሪካው አስተዳዳሪዎች ብቻ የተፈቀደ ነው (Admin Access Only).' };
    }

    const orderIdArg = tokens[1]?.trim();
    const newStatus = tokens[2]?.trim().toLowerCase() as OrderRecord['status'];
    const validStatuses: OrderRecord['status'][] = ['pending', 'processing', 'shipped', 'delivered', 'completed'];

    if (!orderIdArg || !newStatus || !validStatuses.includes(newStatus)) {
      return {
        text: `
ℹ️ *የትዕዛዝ ሁኔታ መቀየሪያ መመሪያ:*
\`/status_update <order_id> <pending|processing|shipped|delivered|completed>\`

👉 ምሳሌ: \`/status_update ORD-20260904-B4A1 shipped\`
        `.trim(),
      };
    }

    const order = orders.find(
      o =>
        o.order_id.toLowerCase() === orderIdArg.toLowerCase() ||
        o.order_id.toLowerCase().includes(orderIdArg.toLowerCase())
    );

    if (!order) {
      return { text: `❌ ትዕዛዝ \`${orderIdArg}\` አልተገኘም።` };
    }

    order.status = newStatus;

    return {
      text: `✅ የትዕዛዝ \`${order.order_id}\` ሁኔታ ወደ *${newStatus.toUpperCase()}* ተቀይሯል።`,
    };
  }

  // Default fallback if unknown command starting with /
  if (command.startsWith('/')) {
    return {
      text: `
❓ ያልታወቀ ትዕዛዝ: \`${command}\`

የሚገኙ ትዕዛዞች:
• /start - ዋና ማውጫ
• /products - የጣራ ምርቶች
• /status - የትዕዛዝ ሁኔታ
• /calc - የጣራ ስሌት
• /showroom - አድራሻዎች
• /help - እርዳታ
      `.trim(),
      replyMarkup: standardKeyboard,
    };
  }

  // General questions answered via factsheet knowledge engine
  const reply = generateSmartFactsheetReply(text, isAmharic);
  return { text: reply };
}

// Helper: Send Telegram Message with optional Markdown & Keyboard
async function sendTelegramMessageWithKeyboard(
  chatId: string | number,
  text: string,
  replyMarkup?: any
): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !chatId) return false;

  try {
    const payload: any = {
      chat_id: chatId,
      text,
      parse_mode: 'Markdown',
    };
    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }

    const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json() as any;
    return Boolean(data.ok);
  } catch (err) {
    console.error('[Telegram send error]:', err);
    return false;
  }
}

// Handler for all incoming Telegram updates (messages, slash commands, inline buttons)
async function handleTelegramUpdate(update: any) {
  if (!update) return;

  // 1. Handle Inline Button Clicks (callback_query)
  if (update.callback_query) {
    const cb = update.callback_query;
    const chatId = cb.message?.chat?.id;
    const data = cb.data || '';
    const fromUser = cb.from;

    // Acknowledge the callback query so Telegram dismisses the progress spinner
    try {
      await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: cb.id }),
      });
    } catch {}

    if (chatId && data) {
      const mappedCommand = data.startsWith('cmd_') ? '/' + data.replace('cmd_', '') : data;
      const cmdResult = processTelegramCommand(mappedCommand, fromUser);
      await sendTelegramMessageWithKeyboard(chatId, cmdResult.text, cmdResult.replyMarkup);
    }
    return;
  }

  // 2. Handle Text Messages and Commands
  if (update.message) {
    const msg = update.message;
    const chatId = msg.chat?.id;
    const text = (msg.text || '').trim();
    const fromUser = msg.from;

    if (!chatId || !text) return;

    const cmdResult = processTelegramCommand(text, fromUser);
    await sendTelegramMessageWithKeyboard(chatId, cmdResult.text, cmdResult.replyMarkup);
  }
}

// Telegram Long Polling Runner: Polls Telegram Bot API continuously so commands work 100% of the time
let isPollingActive = false;
let telegramPollingOffset = 0;

async function startTelegramPolling() {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('[Telegram Polling] Bot token not provided. Polling skipped.');
    return;
  }

  // 1. Clear any webhook to enable getUpdates long-polling
  try {
    const delRes = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook?drop_pending_updates=false`
    );
    const delData = await delRes.json() as any;
    console.log('[Telegram Bot] Webhook cleared for active long-polling:', delData.ok ? 'SUCCESS' : delData.description);
  } catch (err: any) {
    console.warn('[Telegram Bot] deleteWebhook notice:', err?.message);
  }

  // 2. Register bot commands with Telegram so the command menu pops up automatically
  try {
    await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setMyCommands`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        commands: [
          { command: 'start', description: 'Main menu & Welcome / ዋና ማውጫ' },
          { command: 'products', description: 'Roofing profiles & Gauges / ምርቶች' },
          { command: 'status', description: 'Check order status / የትዕዛዝ ሁኔታ' },
          { command: 'calc', description: 'Roof sheets calculator / የስሌት ማሽን' },
          { command: 'showroom', description: 'Factory & Showrooms / አድራሻዎች' },
          { command: 'orders', description: 'Recent factory orders (Admin) / ትዕዛዞች' },
          { command: 'quote', description: 'Quote order price in ETB (Admin) / ዋጋ መስጫ' },
          { command: 'help', description: 'Phone numbers & Support / እርዳታ' },
        ],
      }),
    });
    console.log('[Telegram Bot] Official command menu registered with Telegram API');
  } catch (err: any) {
    console.warn('[Telegram Bot] setMyCommands notice:', err?.message);
  }

  // 3. Start polling loop
  if (isPollingActive) return;
  isPollingActive = true;
  console.log('[Telegram Bot] Long-polling engine started listening for commands...');

  (async () => {
    while (isPollingActive) {
      try {
        const pollUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates?offset=${telegramPollingOffset}&timeout=20`;
        const res = await fetch(pollUrl);
        const data = await res.json() as any;

        if (data && data.ok && Array.isArray(data.result)) {
          for (const update of data.result) {
            telegramPollingOffset = update.update_id + 1;
            await handleTelegramUpdate(update);
          }
        } else {
          await new Promise(r => setTimeout(r, 2000));
        }
      } catch (err: any) {
        // Network retry pause
        await new Promise(r => setTimeout(r, 3000));
      }
    }
  })();
}

// Telegram Webhook Endpoint (also supported alongside polling)
app.post('/api/telegram/webhook', async (req, res) => {
  res.sendStatus(200);
  try {
    await handleTelegramUpdate(req.body);
  } catch (err) {
    console.error('Error handling webhook update:', err);
  }
});

// Diagnostic endpoint to check bot status
app.get('/api/telegram/status', async (req, res) => {
  let botInfo: any = null;
  let webhookInfo: any = null;
  try {
    const [meRes, hookRes] = await Promise.all([
      fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getMe`),
      fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getWebhookInfo`),
    ]);
    botInfo = await meRes.json();
    webhookInfo = await hookRes.json();
  } catch {}

  res.json({
    pollingActive: isPollingActive,
    pollingOffset: telegramPollingOffset,
    targetChatId: TELEGRAM_TARGET_CHAT_ID,
    botInfo,
    webhookInfo,
  });
});

// Register Webhook endpoint for 24/7 standalone production deployment
app.post('/api/telegram/register-webhook', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string' || !url.startsWith('https://')) {
      res.status(400).json({ success: false, error: 'Valid HTTPS URL is required' });
      return;
    }

    // Stop polling loop if active to avoid conflicting updates
    isPollingActive = false;

    const hookUrl = `${url.replace(/\/$/, '')}/api/telegram/webhook`;
    const tgRes = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=${encodeURIComponent(hookUrl)}&drop_pending_updates=false`
    );
    const tgData = (await tgRes.json()) as any;

    res.json({
      success: Boolean(tgData.ok),
      webhookUrl: hookUrl,
      result: tgData,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to register webhook' });
  }
});

// Clear Webhook and restore long polling
app.post('/api/telegram/clear-webhook', async (req, res) => {
  try {
    const tgRes = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteWebhook?drop_pending_updates=false`
    );
    const tgData = (await tgRes.json()) as any;

    // Resume polling
    startTelegramPolling();

    res.json({
      success: Boolean(tgData.ok),
      message: 'Webhook cleared. Long-polling restarted.',
      result: tgData,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Failed to clear webhook' });
  }
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
  const allowedStatuses = ['pending', 'processing', 'shipped', 'delivered', 'completed'];
  if (status && allowedStatuses.includes(status)) {
    const previousStatus = order.status;
    order.status = status;

    // Send Telegram update to customer (or sales chat)
    const targetChat = order.user_id && order.user_id !== 'anonymous' ? order.user_id : TELEGRAM_TARGET_CHAT_ID;
    let telegramDispatched = false;
    let telegramError: string | undefined;

    try {
      const tgRes = await sendTelegramUpdateToCustomer(targetChat, order, 'status_update');
      telegramDispatched = tgRes.success;
      telegramError = tgRes.error;
    } catch (err: any) {
      console.warn('Failed to send status update on telegram:', err);
      telegramError = err?.message;
    }

    res.json({
      success: true,
      order,
      previousStatus,
      newStatus: status,
      telegramDispatched,
      telegramTarget: targetChat,
      telegramError,
    });
    return;
  }
  res.status(400).json({ error: 'Invalid status' });
});

// Admin Quote Pricing endpoint
app.post('/api/orders/:id/quote', async (req, res) => {
  const { id } = req.params;
  const { quotedPriceETB, unitPriceETB, quoteNotes } = req.body;
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

  const qty = parseFloat(String(order.quantity || '0')) || 0;
  const unitNum = unitPriceETB !== undefined && !isNaN(Number(unitPriceETB))
    ? Number(unitPriceETB)
    : qty > 0 ? Math.round((priceNum / qty) * 100) / 100 : 0;

  order.quotedPriceETB = priceNum;
  order.unitPriceETB = unitNum;
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
    // Start active Telegram Bot background long-polling
    startTelegramPolling();
  });
}

startServer();

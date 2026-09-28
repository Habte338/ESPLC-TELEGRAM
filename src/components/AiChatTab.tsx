import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, Loader2, Sparkles } from 'lucide-react';
import { useEthiopianSteel } from '../context/EthiopianSteelContext';

// Ultra-lightweight inline Gemini Sparkle Star Logo (instant 0ms render, zero network requests)
const GeminiLogoIcon: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="geminiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#4a8ac7" />
        <stop offset="50%" stopColor="#8ab4f8" />
        <stop offset="100%" stopColor="#fdc672" />
      </linearGradient>
    </defs>
    <path
      d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z"
      fill="url(#geminiGrad)"
    />
  </svg>
);

export const AiChatTab: React.FC = () => {
  const {
    lang,
    aiMessages,
    isAiLoading,
    sendAiMessage,
    clearAiChat,
    isAdmin,
    hapticFeedback,
  } = useEthiopianSteel();

  const [inputVal, setInputVal] = useState('');
  const [showCommands, setShowCommands] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const commandButtons = [
    { cmd: '/start', label: '⚡ /start', descAm: 'ዋና ማውጫ', descEn: 'Main Menu' },
    { cmd: '/products', label: '📦 /products', descAm: 'የጣራ ምርቶች', descEn: 'Profiles' },
    { cmd: '/status', label: '🔍 /status', descAm: 'የትዕዛዝ ሁኔታ', descEn: 'Track Order' },
    { cmd: '/calc 10 12', label: '🧮 /calc', descAm: 'የጣራ ስሌት', descEn: 'Calculator' },
    { cmd: '/showroom', label: '🏢 /showroom', descAm: 'አድራሻዎች', descEn: 'Showroom' },
    { cmd: '/help', label: '📞 /help', descAm: 'እርዳታ', descEn: 'Support' },
    ...(isAdmin
      ? [{ cmd: '/orders', label: '👑 /orders', descAm: 'ትዕዛዞች', descEn: 'Admin Orders' }]
      : []),
  ];

  const quickQuestions =
    lang === 'am'
      ? [
          'የትኛው ጣራ ለቪላ ቤት ይመረጣል?',
          'የG28 እና G30 ጋጅ ልዩነት ምንድነው?',
          'የፋብሪካውና የሾውሩም አድራሻዎች የት ናቸው?',
          'የኢ.ጂ.ኤ (EGA) ጣራ ጥቅሙ ምንድነው?',
        ]
      : [
          'Which roof profile is best for residential villas?',
          'What is the difference between G28 and G30 gauges?',
          'Where are your factory and showrooms located?',
          'What are the advantages of EGA profile for warehouses?',
        ];

  const handleSend = (textToSend?: string) => {
    const text = textToSend || inputVal;
    if (!text.trim() || isAiLoading) return;
    sendAiMessage(text);
    setInputVal('');
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, isAiLoading]);

  return (
    <div id="tg-ai-chat-tab" className="flex flex-col h-[calc(100vh-140px)] p-3.5 pb-20 text-white select-none">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-2.5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#4a8ac7] flex items-center justify-center text-white shadow-md border border-white/20">
            <Bot className="w-4 h-4 text-[#fdc672]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-white">
                {lang === 'am' ? 'የኢትዮጵያን ስቲል AI ረዳት' : 'Ethiopian Steel AI Expert'}
              </h3>
              <span className="text-[10px] bg-gradient-to-r from-[#4a8ac7]/20 to-[#fdc672]/20 text-[#fdc672] px-2 py-0.5 rounded-full font-bold border border-[#fdc672]/40 flex items-center gap-1 shadow-xs">
                <GeminiLogoIcon className="w-3 h-3" />
                <span>Gemini Flash</span>
              </span>
            </div>
            <span className="text-[10px] text-white/60">
              {lang === 'am' ? 'ስለ ጣራ ምርቶች፣ ጋጅና አድራሻ ይጠይቁ' : 'Ask about roofing, gauges & locations'}
            </span>
          </div>
        </div>

        <button
          onClick={clearAiChat}
          className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all"
          title="Clear chat"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
        {aiMessages.map((msg, idx) => {
          const isModel = msg.role === 'model';
          return (
            <div
              key={idx}
              className={`flex items-start gap-2 ${isModel ? 'justify-start' : 'justify-end'}`}
            >
              {isModel && (
                <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-[#17304a] to-[#0f1d2e] border border-[#4a8ac7]/40 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                  <GeminiLogoIcon className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                  isModel
                    ? 'bg-[#0f1d2e] border border-[#4a8ac7]/30 text-white rounded-tl-sm shadow-md'
                    : 'bg-[#4a8ac7] text-white font-medium rounded-tr-sm shadow-md border border-white/15'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>
              </div>

              {!isModel && (
                <div className="w-6 h-6 rounded-lg bg-[#fdc672] text-[#0b1522] flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5 font-bold shadow">
                  <User className="w-3.5 h-3.5" />
                </div>
              )}
            </div>
          );
        })}

        {isAiLoading && (
          <div className="flex items-center gap-2.5 text-white/70 text-xs py-1">
            <div className="w-7 h-7 rounded-xl bg-[#0f1d2e] border border-[#fdc672]/50 flex items-center justify-center shadow-sm">
              <GeminiLogoIcon className="w-4 h-4 animate-spin" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-medium text-[#fdc672]">
                {lang === 'am' ? 'Gemini እያሰበ ነው...' : 'Gemini is replying...'}
              </span>
              <span className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#fdc672] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#8ab4f8] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#4a8ac7] animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Slash Commands Quick Bar */}
      <div className="pb-1.5 flex flex-col gap-1.5">
        <div className="flex items-center justify-between px-0.5">
          <span className="text-[10px] uppercase tracking-wider text-[#fdc672] font-black flex items-center gap-1">
            <span>⚡ Bot Commands / ትዕዛዞች</span>
          </span>
          <span className="text-[9px] text-white/50">
            {lang === 'am' ? 'ለመሞከር አንዱን ይጫኑ' : 'Tap to run'}
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {commandButtons.map((btn, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                hapticFeedback('medium');
                handleSend(btn.cmd);
              }}
              className="px-2.5 py-1 rounded-lg bg-[#4a8ac7]/20 hover:bg-[#4a8ac7]/40 border border-[#4a8ac7]/40 text-xs font-mono font-bold text-[#fdc672] hover:text-white whitespace-nowrap transition-all shadow-xs active:scale-95 flex items-center gap-1"
            >
              <span>{btn.label}</span>
              <span className="text-[9px] text-white/60 font-sans">({lang === 'am' ? btn.descAm : btn.descEn})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar">
        {quickQuestions.map((q, i) => (
          <button
            key={i}
            onClick={() => {
              hapticFeedback('light');
              handleSend(q);
            }}
            className="px-2.5 py-1 rounded-full bg-[#0f1d2e] hover:bg-[#17304a] border border-white/10 text-[11px] text-white/70 hover:text-white whitespace-nowrap transition-all"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 pt-1 border-t border-white/10"
      >
        <input
          id="ai-chat-input"
          type="text"
          value={inputVal}
          onChange={e => setInputVal(e.target.value)}
          placeholder={
            lang === 'am' ? 'ጥያቄዎን እዚህ ይጻፉ (በአማርኛ ወይም English)...' : 'Type your message in Amharic or English...'
          }
          className="flex-1 bg-[#0f1d2e] border border-[#4a8ac7]/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#fdc672]"
        />
        <button
          type="submit"
          disabled={!inputVal.trim() || isAiLoading}
          className="w-10 h-10 rounded-xl bg-[#4a8ac7] hover:bg-[#3a72a8] disabled:opacity-40 text-white flex items-center justify-center transition-all shadow-md active:scale-95 border border-white/20"
        >
          <Send className="w-4 h-4 text-[#fdc672]" />
        </button>
      </form>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Trash2, Loader2 } from 'lucide-react';
import { useEthiopianSteel } from '../context/EthiopianSteelContext';

export const AiChatTab: React.FC = () => {
  const {
    lang,
    aiMessages,
    isAiLoading,
    sendAiMessage,
    clearAiChat,
    hapticFeedback,
  } = useEthiopianSteel();

  const [inputVal, setInputVal] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

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
              <span className="text-[9px] bg-[#fdc672]/20 text-[#fdc672] px-1 rounded font-bold border border-[#fdc672]/30">
                Gemini
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
                <div className="w-6 h-6 rounded-lg bg-[#4a8ac7] text-white flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5 border border-white/20">
                  🦁
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
          <div className="flex items-center gap-2 text-white/50 text-xs">
            <div className="w-6 h-6 rounded-lg bg-[#4a8ac7] text-white flex items-center justify-center text-[10px]">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#fdc672]" />
            </div>
            <span className="italic text-white/70">
              {lang === 'am' ? 'እያሰበ ነው...' : 'Ethiopian Steel AI is thinking...'}
            </span>
          </div>
        )}
        <div ref={messagesEndRef} />
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
            className="px-2.5 py-1 rounded-full bg-[#0f1d2e] hover:bg-[#17304a] border border-[#4a8ac7]/30 text-[11px] text-white/80 hover:text-[#fdc672] whitespace-nowrap transition-all"
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

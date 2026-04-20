import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Loader2, X, Sparkles, Database, ChevronRight } from 'lucide-react';
import GenerativeResponse from './GenerativeResponse';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  chartData?: any;
  isStreaming?: boolean;
}

interface OmniSearchProps {
  context?: Record<string, any>;
}

const TOOL_LABELS: Record<string, string> = {
  getEmissionStats: '배출량 데이터 조회 중...',
  updateEmission: '데이터 업데이트 중...',
  getReports: '보고서 목록 조회 중...',
};

const SUGGESTIONS = [
  '지난 3개월 Scope 2 배출량 추이를 분석해줘',
  '5월 가스 배출량을 120으로 수정해줘',
  '우리 회사 탄소세 리스크를 평가해줘',
  '저장된 보고서 목록 보여줘',
  'RE100 달성을 위한 우선순위 액션을 알려줘',
];

export default function OmniSearch({ context }: OmniSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [toolCallInfo, setToolCallInfo] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSearch = async (searchQuery: string = query) => {
    const trimmed = searchQuery.trim();
    if (!trimmed || isLoading) return;

    setQuery('');
    setIsOpen(true);
    setIsLoading(true);
    setToolCallInfo(null);

    setMessages((prev) => [
      ...prev,
      { role: 'user', text: trimmed },
      { role: 'assistant', text: '', isStreaming: true },
    ]);

    try {
      const response = await fetch('/api/ai/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'omni', message: trimmed, context }),
      });

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));

            if (event.type === 'text') {
              setMessages((prev) => {
                const arr = [...prev];
                const last = arr[arr.length - 1];
                if (last?.role === 'assistant') last.text += event.content;
                return arr;
              });
              setToolCallInfo(null);
            } else if (event.type === 'tool_call') {
              setToolCallInfo(TOOL_LABELS[event.toolName] ?? `${event.toolName} 실행 중...`);
            } else if (event.type === 'chart') {
              setMessages((prev) => {
                const arr = [...prev];
                const last = arr[arr.length - 1];
                if (last?.role === 'assistant') last.chartData = event.data;
                return arr;
              });
            } else if (event.type === 'done') {
              setMessages((prev) => {
                const arr = [...prev];
                const last = arr[arr.length - 1];
                if (last?.role === 'assistant') last.isStreaming = false;
                return arr;
              });
            }
          } catch {}
        }
      }
    } catch {
      setMessages((prev) => {
        const arr = [...prev];
        const last = arr[arr.length - 1];
        if (last?.role === 'assistant') {
          last.text = '오류가 발생했습니다. 다시 시도해 주세요.';
          last.isStreaming = false;
        }
        return arr;
      });
    } finally {
      setIsLoading(false);
      setToolCallInfo(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
    if (e.key === 'Escape') setIsOpen(false);
  };

  const handleReset = () => {
    setMessages([]);
    setQuery('');
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Search bar */}
      <div
        className={`flex items-center gap-3 bg-white/5 border rounded-2xl px-4 py-3 transition-all duration-200 ${
          isOpen ? 'border-[#2aff6e]/40 shadow-[0_0_20px_rgba(42,255,110,0.06)]' : 'border-white/10'
        }`}
      >
        <Search size={15} className="text-gray-500 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          placeholder='AI 명령 센터 — "지난 3분기 에너지 추이 분석해줘" 또는 "5월 가스 120으로 수정해줘"'
          className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-600"
        />
        {isLoading ? (
          <Loader2 size={15} className="text-[#2aff6e] animate-spin shrink-0" />
        ) : query ? (
          <button onClick={() => setQuery('')} className="text-gray-600 hover:text-gray-300 shrink-0 transition-colors">
            <X size={14} />
          </button>
        ) : null}
        <button
          onClick={() => handleSearch()}
          disabled={isLoading || !query.trim()}
          className="shrink-0 bg-[#2aff6e]/10 text-[#2aff6e] border border-[#2aff6e]/30 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-[#2aff6e] hover:text-black transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          실행
        </button>
      </div>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-2 bg-[#0d0d0d] border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[65vh]"
          >
            {/* Conversation or suggestions */}
            <div className="overflow-y-auto flex-1 p-4 space-y-4">
              {messages.length === 0 ? (
                <>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold flex items-center gap-2">
                    <Sparkles size={11} className="text-[#2aff6e]" /> 추천 명령어
                  </p>
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSearch(s)}
                      className="w-full text-left flex items-center gap-3 p-3 rounded-xl text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-all group"
                    >
                      <ChevronRight size={13} className="text-[#2aff6e] shrink-0 group-hover:translate-x-0.5 transition-transform" />
                      {s}
                    </button>
                  ))}
                </>
              ) : (
                messages.map((msg, i) => (
                  <div key={i}>
                    {msg.role === 'user' ? (
                      <div className="flex justify-end">
                        <div className="bg-[#2aff6e] text-black text-sm px-4 py-2.5 rounded-2xl rounded-tr-sm font-semibold max-w-[80%] leading-relaxed">
                          {msg.text}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {toolCallInfo && msg.isStreaming && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="flex items-center gap-2 text-xs text-[#2aff6e]/70 font-mono"
                          >
                            <Database size={11} className="animate-pulse" />
                            <span>{toolCallInfo}</span>
                          </motion.div>
                        )}
                        {msg.text && (
                          <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
                            {msg.text}
                            {msg.isStreaming && (
                              <span className="inline-block w-0.5 h-4 bg-[#2aff6e] ml-1 animate-pulse align-middle" />
                            )}
                          </div>
                        )}
                        {msg.chartData && <GenerativeResponse chartData={msg.chartData} />}
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Bottom bar */}
            <div className="border-t border-white/5 px-4 py-3 flex items-center gap-3 bg-black/30">
              {messages.length > 0 && (
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="추가 질문..."
                  className="flex-1 bg-transparent text-white text-xs outline-none placeholder-gray-600"
                  autoFocus
                />
              )}
              <div className="flex items-center gap-2 ml-auto shrink-0">
                {messages.length > 0 && (
                  <button onClick={handleReset} className="text-gray-600 hover:text-gray-400 text-xs transition-colors">
                    초기화
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} className="text-gray-600 hover:text-gray-400 transition-colors">
                  <X size={13} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

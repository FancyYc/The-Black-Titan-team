import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { X, Download, FileText, Loader2, Printer } from 'lucide-react';
import MarkdownDisplay from './MarkdownDisplay';

export interface ReportItem {
  title: string;
  date: string;
  status: string;
  category?: string;
  content?: string;
  id?: string;
}

interface Props {
  report: ReportItem;
  context: Record<string, any>;
  onClose: () => void;
}

function markdownToHTML(md: string): string {
  const lines = md.split('\n');
  const out: string[] = [];
  let inUl = false;
  let inOl = false;

  for (const raw of lines) {
    const line = raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    if (line.startsWith('# ')) {
      if (inUl) { out.push('</ul>'); inUl = false; }
      if (inOl) { out.push('</ol>'); inOl = false; }
      out.push(`<h1>${line.slice(2)}</h1>`);
    } else if (line.startsWith('## ')) {
      if (inUl) { out.push('</ul>'); inUl = false; }
      if (inOl) { out.push('</ol>'); inOl = false; }
      out.push(`<h2>${line.slice(3)}</h2>`);
    } else if (line.startsWith('### ')) {
      if (inUl) { out.push('</ul>'); inUl = false; }
      if (inOl) { out.push('</ol>'); inOl = false; }
      out.push(`<h3>${line.slice(4)}</h3>`);
    } else if (line.startsWith('#### ')) {
      out.push(`<h4>${line.slice(5)}</h4>`);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      if (inOl) { out.push('</ol>'); inOl = false; }
      if (!inUl) { out.push('<ul>'); inUl = true; }
      out.push(`<li>${line.slice(2)}</li>`);
    } else if (/^\d+\.\s/.test(line)) {
      if (inUl) { out.push('</ul>'); inUl = false; }
      if (!inOl) { out.push('<ol>'); inOl = true; }
      out.push(`<li>${line.replace(/^\d+\.\s/, '')}</li>`);
    } else if (line === '---') {
      if (inUl) { out.push('</ul>'); inUl = false; }
      if (inOl) { out.push('</ol>'); inOl = false; }
      out.push('<hr>');
    } else if (line === '') {
      if (inUl) { out.push('</ul>'); inUl = false; }
      if (inOl) { out.push('</ol>'); inOl = false; }
    } else {
      if (inUl) { out.push('</ul>'); inUl = false; }
      if (inOl) { out.push('</ol>'); inOl = false; }
      out.push(`<p>${line}</p>`);
    }
  }
  if (inUl) out.push('</ul>');
  if (inOl) out.push('</ol>');
  return out.join('\n');
}

export default function ReportDraftModal({ report, context: _context, onClose }: Props) {
  const [content] = useState(report.content ?? '');
  const isGenerating = false;
  const scrollRef = useRef<HTMLDivElement>(null);

  const downloadMarkdown = () => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.title.replace(/[/\\:*?"<>|]/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printAsPDF = () => {
    const html = markdownToHTML(content);

    const htmlDoc = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <title>${report.title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap" rel="stylesheet">
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Noto Sans KR','Apple SD Gothic Neo',sans-serif;font-size:10.5pt;line-height:1.75;color:#1a1a1a;padding:2.8cm 3.2cm}
    h1{font-size:17pt;color:#0a5c2a;border-bottom:3px solid #22c55e;padding-bottom:10px;margin:0 0 20px}
    h2{font-size:13pt;color:#0f2d1a;border-left:5px solid #22c55e;padding-left:12px;margin:28px 0 10px}
    h3{font-size:11.5pt;color:#1f3a2a;margin:18px 0 8px}
    h4{font-size:10.5pt;color:#333;text-transform:uppercase;letter-spacing:.05em;margin:14px 0 6px}
    p{margin:6px 0;color:#333}
    ul,ol{margin:8px 0;padding-left:22px}
    li{margin:4px 0;color:#333}
    strong{font-weight:700;color:#0a5c2a}
    hr{border:none;border-top:1px solid #ddd;margin:16px 0}
    blockquote{border-left:3px solid #22c55e;padding-left:12px;color:#555;font-style:italic;margin:10px 0}
    .meta{font-size:8.5pt;color:#888;border-bottom:1px solid #eee;padding-bottom:10px;margin-bottom:22px;display:flex;justify-content:space-between}
    @page{margin:2cm 2.5cm;size:A4}
    @media print{body{padding:0}}
  </style>
</head>
<body>
  <div class="meta">
    <span>re100port Enterprise ESG Portal</span>
    <span>생성일: ${new Date().toLocaleDateString('ko-KR')} | 상태: ${report.status}</span>
  </div>
  ${html}
  <script>window.onload=()=>{setTimeout(()=>window.print(),400)}<\/script>
</body>
</html>`;
    const blob = new Blob([htmlDoc], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const win = window.open(blobUrl, '_blank');
    if (!win) { alert('팝업이 차단되었습니다. 허용 후 다시 시도하세요.'); }
    setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-white/10 shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#2aff6e]/10 border border-[#2aff6e]/30 flex items-center justify-center shrink-0">
              <FileText size={18} className="text-[#2aff6e]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-snug">{report.title}</h2>
              <p className="text-[11px] text-gray-500 font-mono mt-0.5">{report.date} · AI 자동 초안 생성</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1">
              <X size={18} />
            </button>
          </div>
        </div>


        {/* Content area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-6 min-h-0">
          {content ? (
            <MarkdownDisplay content={content} isStreaming={isGenerating} />
          ) : (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-gray-600 py-16">
              <Loader2 size={36} className="animate-spin text-[#2aff6e]" />
              <p className="text-sm font-mono">배출량 데이터 조회 및 초안 생성 중...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between shrink-0 bg-black/30">
          <p className="text-[11px] text-gray-600 font-mono">
            {isGenerating ? '생성 중...' : `${content.length.toLocaleString()}자 · Markdown`}
          </p>
          <div className="flex gap-2.5">
            <button
              onClick={downloadMarkdown}
              disabled={isGenerating || !content}
              className="flex items-center gap-2 bg-white/5 border border-white/10 text-gray-300 px-4 py-2 rounded-xl text-xs font-bold hover:bg-white/10 transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Download size={13} /> .md 다운로드
            </button>
            <button
              onClick={printAsPDF}
              disabled={isGenerating || !content}
              className="flex items-center gap-2 bg-[#2aff6e] text-black px-4 py-2 rounded-xl text-xs font-bold hover:bg-white transition disabled:opacity-30 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(42,255,110,0.3)]"
            >
              <Printer size={13} /> PDF 저장
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

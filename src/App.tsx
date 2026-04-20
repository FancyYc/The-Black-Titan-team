import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useSpring, useMotionValue, useTransform } from 'motion/react';
import {
  LayoutDashboard, BarChart3, FileText, Settings,
  Printer, MessageSquare, Zap, AlertCircle,
  TrendingUp, Activity, ShieldCheck, X, ArrowRight, Sparkles,
  Download, User, Shield, Key, Send, FileCheck, Loader2, Map,
  PieChart as PieChartIcon, Copy, Plus, Bell, Upload,
  ListChecks, CheckCircle2, Circle,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ReferenceLine,
} from 'recharts';
import OmniSearch from './components/OmniSearch';
import ReportDraftModal, { type ReportItem } from './components/ReportDraftModal';
import MarkdownDisplay from './components/MarkdownDisplay';
import { supabaseClient, isSupabaseConfigured } from './lib/supabase';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const TEAM_LOGO = 'https://picsum.photos/seed/black-titan/200/200';

export interface CompanyProfile {
  companyName: string;
  businessNumber: string;
  industry: string;
  size: string;
  goals: string[];
  employeeCount: string;
  requiredReports: string[];
}

const DEFAULT_PROFILE: CompanyProfile = {
  companyName: '(주)코코네스쿨',
  businessNumber: '',
  industry: '교육서비스',
  size: 'SME',
  goals: ['K-ESG', '탄소중립'],
  employeeCount: '',
  requiredReports: [],
};

export const PRESET_REPORT_TYPES: { name: string; freq: string; category: string }[] = [
  { name: 'GHG Protocol Scope 1·2 정기 보고서', freq: '분기별', category: '정기 보고서' },
  { name: '환경부 온실가스 배출량 인벤토리', freq: '연간', category: '정기 보고서' },
  { name: 'K-ESG 가이드라인 자가진단 보고서', freq: '연간', category: '정기 보고서' },
  { name: '탄소중립 로드맵 연간 보고서', freq: '연간', category: '정기 보고서' },
  { name: 'RE100 이행 현황 보고서', freq: '연간', category: '정기 보고서' },
  { name: 'CDP 탄소정보공개 보고서', freq: '연간', category: '대외 공시' },
  { name: 'EU CBAM 대응 보고서', freq: '분기별', category: '대외 공시' },
  { name: 'GRI 지속가능경영 보고서', freq: '연간', category: '대외 공시' },
  { name: 'TCFD 기후 위험 공시 보고서', freq: '연간', category: '대외 공시' },
  { name: 'ESG 경영 현황 공시', freq: '연간', category: '대외 공시' },
  { name: '협력사 공급망 ESG 실사 대응 보고서', freq: '필요시', category: '공급망 대응' },
  { name: '공급망 탄소발자국 측정 보고서', freq: '연간', category: '공급망 대응' },
  { name: 'ISO 14001 환경경영시스템 보고서', freq: '연간', category: '정기 보고서' },
];

const GOOGLE_LOGO = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTIyLjU2IDEyLjI1Yy0uMDktLjc4LS4xNS0xLjU4LS4xNS0yLjM4SDEydjQuNjhoNS45MmMtLjI1IDEuMzYtMS4wMSAyLjUyLTIuMTUgMy4yOXYyLjc0aDMuNDhDMjEuMTQgMTguNTQgMjIuNTYgMTUuNjIgMjIuNTYgMTIuMjV6IiBmaWxsPSIjNDI4NUY0Ii8+PHBhdGggZD0iTTEyIDIzYzIuOTcgMCA1LjQ2LS45OCA3LjI4LTIuNjZsLTMuNDgtMi43NGMtLjk4LjY2LTIuMjMgMS4wNi0zLjggMS4wNi0yLjkyIDAtNS4zOC0xLjk3LTYuMjYtNC42Mkg1SDIuMTh2Mi44NEE5Ljk5IDkuOTkgMCAwMCAxMiAyM3oiIGZpbGw9IiMzNEE4NTMiLz48cGF0aCBkPSJNNS43NiAxNC42NkE2LjAyIDYuMDIgMCAwMTUuNDUgMTJjMC0uOTMuMTYtMS44My40NC0yLjY3di0yLjhIMi4xOEE5LjkgOS45IDAgMDAxIDEyYzAgMS41OS4zNyAzLjA5IDEuMTggNC40M2wyLjU4LTEuNzd6IiBmaWxsPSIjRkJCQzA0Ii8+PHBhdGggZD0iTTEyIDUuMzhjMS42MiAwIDMuMDYuNTYgNC4yMSAxLjY0bDMuMTUtMy4xNUMxNy40NSAyLjA5IDE0Ljk3IDEgMTIgMSA3LjcgMSA0LjA0IDMuMjggMi4xOCA2LjY4bDMuNTggMi44QzcuNjIgNy4zNSAxMC4wOCA1LjM4IDEyIDUuMzh6IiBmaWxsPSIjRUE0MzM1Ii8+PC9zdmc+';

const ACCENT = {
  coral: '#FF7272',
  blue: '#489CC1',
  jade: '#21A87D',
  plum: '#8B7FC9',
  ink: '#2B3138',
  ink2: '#4A525C',
  slate: '#6B7380',
  muted: '#9AA3B0',
};

const initialHistoricalData = [
  { month: '12월', scope1: 3.20, scope2: 8.55 },
  { month: '1월',  scope1: 3.10, scope2: 9.49 },
  { month: '2월',  scope1: 3.05, scope2: 11.39 },
  { month: '3월',  scope1: 2.62, scope2: 9.02 },
  { month: '4월(현재)', scope1: 3.27, scope2: 9.97 },
];

const initialReportList = [
  { title: '2026년 4월 Scope 1·2 정기 보고서', date: '2026-04-17', status: '완료', category: '정기 보고서' },
  { title: '현대자동차 공급망 ESG 제출용 요약본', date: '2026-04-10', status: '완료', category: '공급망 대응' },
  { title: 'CDP (탄소정보공개프로젝트) 대응 초안', date: '2026-03-28', status: '검토중', category: '대외 공시' },
  { title: '2026년 5월 Scope 1·2 예측 보고서', date: '2026-04-20', status: 'AI생성', category: 'AI 예측' },
];


function PercentInput({ value, min, max, onChange, className = 'text-base w-12' }: {
  value: number; min: number; max: number;
  onChange: (v: number) => void; className?: string;
}) {
  const [local, setLocal] = useState(String(value));
  useEffect(() => { setLocal(String(value)); }, [value]);
  const commit = (raw: string) => {
    const n = Math.min(max, Math.max(min, Number(raw) || min));
    setLocal(String(n));
    onChange(n);
  };
  return (
    <input
      type="number" min={min} max={max} value={local}
      onChange={(e) => setLocal(e.target.value)}
      onBlur={(e) => commit(e.target.value)}
      onKeyDown={(e) => e.key === 'Enter' && commit((e.target as HTMLInputElement).value)}
      className={`font-mono font-extrabold bg-transparent outline-none text-right ${className}`}
      style={{ color: ACCENT.jade }}
    />
  );
}

function SmoothSlider({ value, min, max, step = 1, onChange, color }: {
  value: number; min: number; max: number; step?: number;
  onChange: (v: number) => void; color: string;
}) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="relative h-6 flex items-center select-none">
      <div className="absolute w-full h-2 rounded-full" style={{ background: 'var(--neu-shadow-dark)', boxShadow: 'inset 2px 2px 5px #B8BEC5, inset -2px -2px 5px #fff' }} />
      <div className="absolute h-2 rounded-full pointer-events-none" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 10px ${color}55` }} />
      <div className="absolute w-5 h-5 rounded-full pointer-events-none" style={{ left: `calc(${pct}% - 10px)`, background: 'var(--color-neu-base)', boxShadow: `3px 3px 8px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light), 0 0 0 2px ${color}` }} />
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="absolute w-full cursor-pointer" style={{ opacity: 0, height: '100%', zIndex: 10 }} />
    </div>
  );
}

async function streamFromServer(
  type: string,
  message: string,
  context: Record<string, any>,
  onChunk: (text: string) => void,
): Promise<string> {
  const response = await fetch('/api/ai/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, message, context }),
  });
  if (!response.body) throw new Error('No response body');

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

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
          fullText += event.content;
          onChunk(event.content);
        } else if (event.type === 'error') {
          throw new Error(event.message);
        }
      } catch (e) { if (e instanceof Error && e.message !== '') throw e; }
    }
  }
  return fullText;
}

// ==========================================
// 1. 랜딩 페이지 (Neumorphism)
// ==========================================
function LandingPage({ onNext, onGoogleLogin, user }: {
  onNext: () => void;
  onGoogleLogin: () => void;
  user: SupabaseUser | null;
}) {
  return (
    <div className="min-h-screen flex flex-col font-sans relative overflow-hidden" style={{ background: 'var(--color-neu-base)', color: ACCENT.ink }}>
      {/* subtle accent orbs */}
      <div className="absolute top-[-10%] left-[15%] w-[50%] h-[50%] rounded-full pointer-events-none" style={{ background: 'radial-gradient(closest-side, rgba(72,156,193,0.18), transparent 70%)', filter: 'blur(60px)' }} />
      <div className="absolute bottom-[-15%] right-[5%] w-[45%] h-[45%] rounded-full pointer-events-none" style={{ background: 'radial-gradient(closest-side, rgba(255,114,114,0.14), transparent 70%)', filter: 'blur(70px)' }} />

      <nav className="flex items-center justify-between px-10 py-6 max-w-7xl mx-auto w-full z-10">
        <div className="flex items-center gap-3">
          <div className="neu-raised-sm w-11 h-11 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full" style={{ background: ACCENT.jade, boxShadow: '0 0 0 3px rgba(33,168,125,0.15)' }} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight leading-none">re100<span style={{ color: ACCENT.jade }}>port</span><span style={{ color: ACCENT.ink }}>.</span></h1>
            <p className="uppercase-mini mt-1">Enterprise Portal</p>
          </div>
        </div>
        {user ? (
          <div className="neu-inset-sm flex items-center gap-3 px-4 py-2">
            {user.user_metadata?.avatar_url && (
              <img src={user.user_metadata.avatar_url} alt="avatar" className="w-7 h-7 rounded-full" referrerPolicy="no-referrer" />
            )}
            <span className="text-sm font-medium" style={{ color: ACCENT.ink2 }}>{user.user_metadata?.full_name ?? user.email}</span>
          </div>
        ) : (
          <button onClick={onGoogleLogin} className="neu-btn flex items-center gap-2 px-5 py-2.5 text-sm font-bold" style={{ color: ACCENT.ink }}>
            <img src={GOOGLE_LOGO} alt="Google" className="w-4 h-4" />구글로 로그인
          </button>
        )}
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 z-10 mt-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="neu-inset-sm flex items-center gap-2 px-4 py-1.5 mb-8">
          <ShieldCheck size={14} style={{ color: ACCENT.jade }} />
          <span className="text-xs font-semibold" style={{ color: ACCENT.ink2 }}>계약 기업 전용 보안 워크스페이스</span>
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6 mt-4" style={{ color: ACCENT.ink }}>
          <span style={{ color: ACCENT.jade }}>미래를 예측하는</span><br />ESG 경영의 시작<span style={{ color: ACCENT.coral }}>.</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-lg md:text-xl mb-10 max-w-2xl leading-relaxed" style={{ color: ACCENT.slate }}>
          단순한 과거 데이터 기록을 넘어, 익월 배출량을 예측합니다.<br />AI 기반 시뮬레이션으로 탄소세 리스크를 선제적으로 방어하세요.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row gap-4 items-center">
          {user ? (
            <button onClick={onNext} className="neu-btn px-8 py-4 font-bold text-base flex items-center justify-center gap-2" style={{ color: ACCENT.ink }}>
              워크스페이스 입장 <ArrowRight size={18} style={{ color: ACCENT.jade }} />
            </button>
          ) : (
            <>
              <button onClick={onGoogleLogin} className="neu-btn px-8 py-4 font-bold text-base flex items-center justify-center gap-3" style={{ color: ACCENT.ink }}>
                <img src={GOOGLE_LOGO} alt="Google" className="w-5 h-5" />구글 계정으로 시작하기
              </button>
              <button onClick={onNext} className="flex items-center gap-2 px-6 py-4 font-semibold text-sm" style={{ color: ACCENT.slate }}>
                <Key size={14} /> (주)코코네스쿨 체험 모드 →
              </button>
            </>
          )}
        </motion.div>

        {!user && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-xs mt-6" style={{ color: ACCENT.muted }}>
            구글 로그인 시 기업 맞춤형 ESG 분석이 제공됩니다
          </motion.p>
        )}

        {/* Feature trio */}
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-16 max-w-4xl w-full">
          {[
            { icon: Activity, color: ACCENT.blue, label: '예측 모델', desc: '익월 Scope 1·2 배출량을 실측처럼 추정' },
            { icon: Zap, color: ACCENT.coral, label: '방어 시뮬레이터', desc: '재생에너지 전환율 조정으로 탄소세 절감' },
            { icon: FileCheck, color: ACCENT.jade, label: 'AI 보고서', desc: 'GHG Protocol·공급망·CDP 자동 작성' },
          ].map((f, i) => (
            <div key={i} className="neu-raised p-6 text-left">
              <div className="neu-inset-sm w-10 h-10 flex items-center justify-center mb-4">
                <f.icon size={18} style={{ color: f.color }} />
              </div>
              <h3 className="font-bold text-sm mb-1" style={{ color: ACCENT.ink }}>{f.label}</h3>
              <p className="text-xs leading-relaxed" style={{ color: ACCENT.slate }}>{f.desc}</p>
            </div>
          ))}
        </motion.div>
      </main>
    </div>
  );
}

// ==========================================
// 3. 통합 대시보드 (Neumorphism)
// ==========================================
const INDUSTRY_OPTIONS = ['제조', 'IT/소프트웨어', '물류/운송', '건설', '금융/보험', '교육서비스', '유통/소매', '기타'];
const SIZE_OPTIONS = ['SME', '중견기업', '대기업'];
const GOAL_OPTIONS = ['RE100', 'K-ESG', 'GHG Protocol', 'EU CBAM', '탄소중립', '공급망 실사', 'CDP 대응'];

function SettingsView({ companyProfile, onProfileUpdate }: {
  companyProfile: CompanyProfile;
  onProfileUpdate: (p: CompanyProfile) => void;
}) {
  const [profileDraft, setProfileDraft] = useState(companyProfile);
  const [profileSaved, setProfileSaved] = useState(false);

  const handleGoalToggle = (g: string) => {
    setProfileDraft((p) => ({ ...p, goals: p.goals.includes(g) ? p.goals.filter((x) => x !== g) : [...p.goals, g] }));
  };
  const handleSaveProfile = () => {
    onProfileUpdate(profileDraft);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl space-y-6">
      <div className="neu-raised p-7">
        <h3 className="uppercase-mini mb-6 flex items-center gap-2"><User size={12} /> 기업 프로필 / Company Profile</h3>
        <div className="grid grid-cols-2 gap-5 mb-5">
          <div>
            <label className="uppercase-mini block mb-2">회사명</label>
            <div className="neu-inset px-3 py-2.5">
              <input value={profileDraft.companyName} onChange={(e) => setProfileDraft((p) => ({ ...p, companyName: e.target.value }))} className="w-full bg-transparent text-sm font-bold font-mono outline-none" style={{ color: ACCENT.jade }} />
            </div>
          </div>
          <div>
            <label className="uppercase-mini block mb-2">사업자 번호</label>
            <div className="neu-inset px-3 py-2.5">
              <input value={profileDraft.businessNumber} onChange={(e) => setProfileDraft((p) => ({ ...p, businessNumber: e.target.value }))} placeholder="000-00-00000" className="w-full bg-transparent text-sm font-mono outline-none" style={{ color: ACCENT.ink2 }} />
            </div>
          </div>
          <div>
            <label className="uppercase-mini block mb-2">임직원 수</label>
            <div className="neu-inset px-3 py-2.5">
              <input value={profileDraft.employeeCount} onChange={(e) => setProfileDraft((p) => ({ ...p, employeeCount: e.target.value }))} placeholder="예: 250명" className="w-full bg-transparent text-sm font-mono outline-none" style={{ color: ACCENT.ink2 }} />
            </div>
          </div>
        </div>
        <div className="mb-5">
          <label className="uppercase-mini block mb-2">업종</label>
          <div className="flex flex-wrap gap-2">
            {INDUSTRY_OPTIONS.map((opt) => (
              <button key={opt} onClick={() => setProfileDraft((p) => ({ ...p, industry: opt }))} className={`neu-btn px-3 py-1.5 text-xs font-bold ${profileDraft.industry === opt ? 'active' : ''}`} style={{ color: profileDraft.industry === opt ? ACCENT.jade : ACCENT.slate }}>{opt}</button>
            ))}
          </div>
        </div>
        <div className="mb-5">
          <label className="uppercase-mini block mb-2">기업 규모</label>
          <div className="flex gap-2">
            {SIZE_OPTIONS.map((opt) => (
              <button key={opt} onClick={() => setProfileDraft((p) => ({ ...p, size: opt }))} className={`neu-btn px-4 py-2 text-xs font-bold ${profileDraft.size === opt ? 'active' : ''}`} style={{ color: profileDraft.size === opt ? ACCENT.jade : ACCENT.slate }}>{opt}</button>
            ))}
          </div>
        </div>
        <div className="mb-6">
          <label className="uppercase-mini block mb-2">주요 관심사 (복수 선택)</label>
          <div className="flex flex-wrap gap-2">
            {GOAL_OPTIONS.map((opt) => (
              <button key={opt} onClick={() => handleGoalToggle(opt)} className={`neu-btn px-3 py-1.5 text-xs font-bold ${profileDraft.goals.includes(opt) ? 'active' : ''}`} style={{ color: profileDraft.goals.includes(opt) ? ACCENT.plum : ACCENT.slate }}>{opt}</button>
            ))}
          </div>
        </div>
        <button onClick={handleSaveProfile} className="neu-btn w-full py-3 font-bold flex items-center justify-center gap-2 cursor-pointer" style={{ color: ACCENT.jade }}>
          {profileSaved ? '✓ 저장됨' : <><ShieldCheck size={14} /> 기업 프로필 저장</>}
        </button>
      </div>
    </motion.div>
  );
}

function UsageInputView({ usageInput, onUpdate }: {
  usageInput: { elec: number; gas: number; diesel: number };
  onUpdate: (v: { elec: number; gas: number; diesel: number }) => void;
}) {
  const [localElec, setLocalElec] = useState(usageInput.elec);
  const [localGas, setLocalGas] = useState(usageInput.gas);
  const [localDiesel, setLocalDiesel] = useState(usageInput.diesel);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [billPreview, setBillPreview] = useState<string | null>(null);
  const [extractMsg, setExtractMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setSaving(true);
    await fetch('/api/emissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year: 2026, month: 5, month_label: '5월(예상)', electricity_kwh: localElec, gas_m3: localGas, diesel_l: localDiesel, is_prediction: 1 }),
    }).catch(() => {});
    onUpdate({ elec: localElec, gas: localGas, diesel: localDiesel });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleBillUpload = async (file: File) => {
    setExtracting(true);
    setExtractMsg('');
    setBillPreview(URL.createObjectURL(file));

    const base64 = await new Promise<string>((resolve) => {
      const r = new FileReader();
      r.onload = (e) => resolve((e.target?.result as string).split(',')[1]);
      r.readAsDataURL(file);
    });

    try {
      const res = await fetch('/api/ai/extract-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType: file.type }),
      });
      const { data, error } = await res.json();
      if (error) throw new Error(error);
      let filled = 0;
      if (data.electricity_kwh != null) { setLocalElec(data.electricity_kwh); filled++; }
      if (data.gas_m3 != null) { setLocalGas(data.gas_m3); filled++; }
      if (data.diesel_l != null) { setLocalDiesel(data.diesel_l); filled++; }
      setExtractMsg(filled > 0 ? `✓ ${filled}개 항목 자동 입력됨` : '인식된 사용량 데이터가 없습니다.');
    } catch (e: any) {
      setExtractMsg('인식 실패: ' + (e.message ?? '다시 시도해주세요.'));
    } finally {
      setExtracting(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.type.startsWith('image/')) handleBillUpload(file);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 gap-6">
      {/* 고지서 업로드 */}
      <div className="neu-raised p-7">
        <h3 className="uppercase-mini mb-4 flex items-center gap-2" style={{ color: ACCENT.coral }}><Upload size={12} /> 고지서 자동 인식</h3>
        <div
          className="neu-inset flex flex-col items-center justify-center gap-3 cursor-pointer min-h-[130px] p-5"
          style={{ borderRadius: 16 }}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          {billPreview ? (
            <img src={billPreview} alt="고지서" className="max-h-28 object-contain rounded-lg" />
          ) : (
            <>
              <Upload size={22} style={{ color: ACCENT.muted }} />
              <p className="text-xs text-center leading-relaxed" style={{ color: ACCENT.muted }}>
                고지서 사진을 드래그하거나 클릭해서 업로드<br />전기·가스·경유 사용량을 AI가 자동 인식합니다
              </p>
            </>
          )}
          {extracting && (
            <div className="flex items-center gap-2 text-xs font-bold" style={{ color: ACCENT.jade }}>
              <Loader2 size={13} className="animate-spin" /> 고지서 분석 중...
            </div>
          )}
          {extractMsg && !extracting && (
            <p className="text-xs font-bold" style={{ color: extractMsg.startsWith('✓') ? ACCENT.jade : ACCENT.coral }}>{extractMsg}</p>
          )}
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleBillUpload(f); e.target.value = ''; }} />
      </div>

      {/* 수동 입력 */}
      <div className="neu-raised p-7">
        <h3 className="uppercase-mini mb-6 flex items-center gap-2" style={{ color: ACCENT.jade }}><Zap size={12} /> 5월(익월) 예상 사용량 입력</h3>
        <div className="space-y-5">
          {([
            { label: '전기 사용량', unit: 'kWh', color: ACCENT.blue, value: localElec, set: setLocalElec },
            { label: '도시가스', unit: 'm³', color: ACCENT.coral, value: localGas, set: setLocalGas },
            { label: '경유', unit: 'L', color: ACCENT.plum, value: localDiesel, set: setLocalDiesel },
          ] as const).map(({ label, unit, color, value, set }) => (
            <div key={label}>
              <label className="uppercase-mini block mb-2" style={{ color }}>{label} ({unit})</label>
              <div className="neu-inset px-4 py-3">
                <input type="number" value={value} onChange={(e) => set(Number(e.target.value))} className="w-full bg-transparent text-base font-mono outline-none" style={{ color: ACCENT.ink }} />
              </div>
            </div>
          ))}
        </div>
        <button onClick={handleSave} disabled={saving} className="neu-btn mt-6 w-full py-3 font-bold flex items-center justify-center gap-2 cursor-pointer" style={{ color: ACCENT.jade }}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? '✓ 저장됨' : <><Sparkles size={14} /> 예측 모델 업데이트</>}
        </button>
      </div>
    </motion.div>
  );
}

const REPORT_CATEGORIES = ['전체', '정기 보고서', '공급망 대응', '대외 공시', 'AI 예측'];

interface ReportViewProps {
  reportList: ReportItem[];
  requiredReports: string[];
  setRequiredReports: (r: string[]) => void;
  companyProfile: CompanyProfile;
  selectedCategory: string;
  setSelectedCategory: (c: string) => void;
  setSelectedReport: (r: ReportItem) => void;
  onDeleteReport: (item: ReportItem) => void;
  onQuickGenerate: (name: string, category: string) => void;
  reportFormCategory: string;
  setReportFormCategory: (c: string) => void;
  reportFormType: string;
  setReportFormType: (v: string) => void;
  reportFormOrg: string;
  setReportFormOrg: (v: string) => void;
  isGeneratingReport: boolean;
  generatedReportText: string;
  onGenerate: (category: string, type: string, org: string) => void;
  onAddToList: () => void;
}

function ReportView({
  reportList, requiredReports, setRequiredReports, companyProfile,
  selectedCategory, setSelectedCategory, setSelectedReport, onDeleteReport, onQuickGenerate,
  reportFormCategory, setReportFormCategory,
  reportFormType, setReportFormType,
  reportFormOrg, setReportFormOrg,
  isGeneratingReport, generatedReportText,
  onGenerate, onAddToList,
}: ReportViewProps) {
  const [isRecommending, setIsRecommending] = useState(false);
  const [recommendDone, setRecommendDone] = useState(requiredReports.length > 0);

  const filtered = selectedCategory === '전체' ? reportList : reportList.filter((r) => r.category === selectedCategory);
  const countFor = (cat: string) => cat === '전체' ? reportList.length : reportList.filter((r) => r.category === cat).length;

  const toggleReport = (name: string) => {
    setRequiredReports(
      requiredReports.includes(name)
        ? requiredReports.filter((r) => r !== name)
        : [...requiredReports, name]
    );
  };

  const handleAiRecommend = async () => {
    setIsRecommending(true);
    try {
      const prompt = `Respond with ONLY a valid JSON array of strings, no other text.
Company: industry="${companyProfile.industry}", size="${companyProfile.size}", goals="${companyProfile.goals.join(', ')}".
From this list, select the most relevant required ESG report types for this company:
${PRESET_REPORT_TYPES.map((r) => `"${r.name}"`).join(', ')}
Return format: ["name1", "name2", ...]`;

      let fullText = '';
      const res = await fetch('/api/ai/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'report', message: prompt, context: {} }),
      });
      if (res.body) {
        const reader = res.body.getReader();
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
            try { const ev = JSON.parse(line.slice(6)); if (ev.type === 'text') fullText += ev.content; } catch {}
          }
        }
      }
      const match = fullText.match(/\[[\s\S]*?\]/);
      if (match) {
        const names: string[] = JSON.parse(match[0]);
        const valid = names.filter((n) => PRESET_REPORT_TYPES.some((r) => r.name === n));
        setRequiredReports(valid);
      }
      setRecommendDone(true);
    } catch { /* silent */ } finally {
      setIsRecommending(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

      {/* 상단 가로 박스: AI 추천 + 필수 보고서 선택 */}
      <div className="neu-raised px-6 py-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="uppercase-mini flex items-center gap-2"><ListChecks size={12} /> 정기 필수 보고서 현황</h3>
          <div className="flex items-center gap-3">
            {requiredReports.length > 0 && (
              <span className="text-[9px] font-mono font-bold neu-inset-sm px-2 py-1" style={{ color: ACCENT.slate }}>
                완료 {requiredReports.filter((n) => reportList.some((r) => r.title.includes(n))).length} / {requiredReports.length}
              </span>
            )}
            <button
              onClick={handleAiRecommend}
              disabled={isRecommending}
              className="neu-btn px-3 py-1.5 text-[10px] font-bold flex items-center gap-1.5 cursor-pointer"
              style={{ color: ACCENT.plum }}
            >
              {isRecommending ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
              {isRecommending ? 'AI 분석 중...' : 'AI 추천'}
            </button>
          </div>
        </div>

        {!recommendDone && !isRecommending ? (
          <p className="text-xs" style={{ color: ACCENT.muted }}>
            AI 추천 버튼을 누르면 기업 업종·규모에 맞는 필수 보고서를 자동으로 추천해드립니다.
          </p>
        ) : isRecommending ? (
          <div className="flex items-center gap-2 text-xs" style={{ color: ACCENT.slate }}>
            <Loader2 size={13} className="animate-spin" style={{ color: ACCENT.plum }} />
            {companyProfile.industry} · {companyProfile.size} 기업에 맞는 보고서를 분석하고 있습니다...
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {PRESET_REPORT_TYPES.map((preset) => {
              const selected = requiredReports.includes(preset.name);
              const isDone = selected && reportList.some((r) => r.title.includes(preset.name) || r.title.replace(/^\[.*?\]\s*/, '') === preset.name);
              return (
                <button
                  key={preset.name}
                  onClick={() => toggleReport(preset.name)}
                  className={`neu-btn flex items-center gap-1.5 px-3 py-2 text-[11px] font-semibold cursor-pointer transition-all ${selected ? 'active' : ''}`}
                  style={{ color: selected ? (isDone ? ACCENT.jade : ACCENT.coral) : ACCENT.slate }}
                >
                  {selected
                    ? (isDone ? <CheckCircle2 size={11} /> : <Circle size={11} />)
                    : <Plus size={10} style={{ color: ACCENT.muted }} />
                  }
                  {preset.name}
                  {selected && (
                    <span className="text-[9px] font-bold neu-inset-sm px-1.5 py-0.5 ml-0.5">
                      {isDone ? '완료' : '미작성'}
                    </span>
                  )}
                  {selected && !isDone && (
                    <span
                      onClick={(e) => { e.stopPropagation(); onQuickGenerate(preset.name, preset.category); }}
                      className="neu-btn px-1.5 py-0.5 text-[9px] font-bold flex items-center gap-0.5 cursor-pointer ml-0.5"
                      style={{ color: ACCENT.plum }}
                    >
                      <Sparkles size={8} /> 생성
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 하단 큰 박스: 아카이브 + AI 생성 */}
      <div className="neu-raised p-7 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <div className="flex items-center mb-5 pb-5" style={{ borderBottom: '1px solid rgba(200,206,213,0.4)' }}>
          <h3 className="uppercase-mini">리포트 센터 / ARCHIVE</h3>
        </div>

        <div className="neu-inset flex gap-1 p-1.5 mb-5" style={{ borderRadius: 14 }}>
          {REPORT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`relative flex-1 px-2 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${selectedCategory === cat ? 'neu-btn active' : ''}`}
              style={{ color: selectedCategory === cat ? ACCENT.jade : ACCENT.slate }}
            >
              <span className="relative z-10 flex items-center justify-center gap-1">
                {cat}
                <span className="text-[9px] px-1 py-0.5 rounded font-mono" style={{ background: selectedCategory === cat ? 'rgba(33,168,125,0.12)' : 'transparent', color: selectedCategory === cat ? ACCENT.jade : ACCENT.muted }}>
                  {countFor(cat)}
                </span>
              </span>
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={selectedCategory} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }} className="space-y-3">
            {filtered.length === 0 ? (
              <div className="py-12 text-center uppercase-mini">해당 카테고리의 보고서가 없습니다</div>
            ) : filtered.map((item, idx) => (
              <motion.div key={idx} layout onClick={() => setSelectedReport(item)} className="neu-raised-sm p-4 flex items-center justify-between cursor-pointer group hover:-translate-y-0.5 transition-transform">
                <div className="flex items-center gap-3">
                  <div className="neu-inset-sm w-10 h-10 flex items-center justify-center shrink-0">
                    <FileCheck size={16} style={{ color: item.category === 'AI 예측' ? ACCENT.plum : ACCENT.jade }} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm leading-snug" style={{ color: ACCENT.ink }}>{item.title}</h4>
                    <p className="text-[10px] font-mono mt-0.5" style={{ color: ACCENT.muted }}>{item.date} · {item.category}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="neu-inset-sm text-[10px] px-2 py-1 font-bold uppercase tracking-widest" style={{ color: item.status === 'AI생성' ? ACCENT.plum : item.status === '완료' ? ACCENT.jade : ACCENT.coral }}>{item.status}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDeleteReport(item); }}
                    className="neu-btn w-7 h-7 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity"
                    style={{ color: ACCENT.coral }}
                    title="삭제"
                  >
                    <X size={13} />
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex flex-col h-full gap-4">
        <div className="neu-inset p-5 space-y-4">
          <h3 className="uppercase-mini flex items-center gap-2" style={{ color: ACCENT.jade }}><Sparkles size={12} /> AI 보고서 생성</h3>

          <div>
            <label className="uppercase-mini block mb-1.5" style={{ color: ACCENT.slate }}>카테고리</label>
            <div className="neu-inset-sm flex gap-1 p-1">
              {(['정기 보고서', '공급망 대응', '대외 공시', 'AI 예측'] as const).map((cat) => (
                <button key={cat} onClick={() => setReportFormCategory(cat)}
                  className={`flex-1 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-colors cursor-pointer ${reportFormCategory === cat ? 'neu-btn active' : ''}`}
                  style={{ color: reportFormCategory === cat ? ACCENT.jade : ACCENT.slate }}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="uppercase-mini block mb-1.5" style={{ color: ACCENT.slate }}>필요한 보고서 유형 / 내용</label>
            <div className="neu-inset-sm px-3 py-2">
              <textarea
                value={reportFormType}
                onChange={(e) => setReportFormType(e.target.value)}
                placeholder="예: GHG Protocol Scope 1·2 배출량 분석, 온실가스 감축 계획 포함"
                rows={3}
                className="w-full bg-transparent text-sm outline-none resize-none leading-relaxed"
                style={{ color: ACCENT.ink, fontFamily: 'inherit' }}
              />
            </div>
          </div>

          <div>
            <label className="uppercase-mini block mb-1.5" style={{ color: ACCENT.slate }}>제출 기관</label>
            <div className="neu-inset-sm px-3 py-2">
              <input
                type="text"
                value={reportFormOrg}
                onChange={(e) => setReportFormOrg(e.target.value)}
                placeholder="예: 삼성전자 공급망 ESG 실사, CDP, 환경부"
                className="w-full bg-transparent text-sm outline-none"
                style={{ color: ACCENT.ink, fontFamily: 'inherit' }}
              />
            </div>
          </div>

          <button
            onClick={() => onGenerate(reportFormCategory, reportFormType, reportFormOrg)}
            disabled={isGeneratingReport}
            className="neu-btn w-full py-2.5 text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer"
            style={{ color: ACCENT.jade }}
          >
            {isGeneratingReport ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {isGeneratingReport ? 'AI 생성 중...' : 'AI 보고서 생성'}
          </button>
        </div>

        <div className="flex-1 flex flex-col neu-inset p-5 min-h-0">
          <h3 className="uppercase-mini mb-3 flex items-center gap-2 shrink-0" style={{ color: ACCENT.ink2 }}>생성된 보고서</h3>
          <div className="flex-1 overflow-y-auto min-h-[120px]">
            {generatedReportText
              ? <MarkdownDisplay content={generatedReportText} isStreaming={isGeneratingReport} variant="light" />
              : <p className="text-sm italic" style={{ color: ACCENT.muted }}>카테고리, 보고서 유형, 제출 기관을 입력하고 AI 보고서 생성을 누르세요.</p>
            }
          </div>
          {generatedReportText && !isGeneratingReport && (
            <div className="flex gap-2 mt-4 shrink-0">
              <button onClick={() => navigator.clipboard.writeText(generatedReportText)} className="neu-btn flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer" style={{ color: ACCENT.ink2 }}>
                <Copy size={13} /> 텍스트 복사
              </button>
              <button onClick={onAddToList} className="neu-btn flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer" style={{ color: ACCENT.jade }}>
                <Plus size={13} /> 파일 추가하기
              </button>
            </div>
          )}
        </div>
      </div>
      </div>
    </motion.div>
  );
}

function EnterpriseDashboard({ onBack, user, onLogout, companyProfile, onProfileUpdate }: {
  onBack: () => void;
  user: SupabaseUser | null;
  onLogout: () => void;
  companyProfile: CompanyProfile;
  onProfileUpdate: (p: CompanyProfile) => void;
}) {
  const [activeTab, setActiveTab] = useState('통합 대시보드');
  const [usageInput, setUsageInput] = useState({ elec: 19500, gas: 1100, diesel: 350 });
  const [renewableRatio, setRenewableRatio] = useState(0);
  const [renewableDraft, setRenewableDraft] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);
  const [historicalData, setHistoricalData] = useState(initialHistoricalData);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const [reportList, setReportList] = useState(initialReportList);
  const [selectedReport, setSelectedReport] = useState<ReportItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [generatedReportText, setGeneratedReportText] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [reportFormCategory, setReportFormCategory] = useState('정기 보고서');
  const [reportFormType, setReportFormType] = useState('');
  const [reportFormOrg, setReportFormOrg] = useState('');

  const [insightText, setInsightText] = useState('');
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);

  const [roadmapTarget, setRoadmapTarget] = useState(20);
  const [roadmapDraft, setRoadmapDraft] = useState(20);
  const [roadmapPlan, setRoadmapPlan] = useState('');
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);

  const renewableMV = useMotionValue(0);
  const renewableSpring = useSpring(renewableMV, { stiffness: 280, damping: 28 });
  const renewablePercent = useTransform(renewableSpring, (v) => `${Math.round(v)}%`);

  const roadmapMV = useMotionValue(20);
  const roadmapSpring = useSpring(roadmapMV, { stiffness: 280, damping: 28 });
  const roadmapPercent = useTransform(roadmapSpring, (v) => `${Math.round(v)}%`);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ sender: 'ai' | 'user'; text: string }[]>([
    { sender: 'ai', text: '안녕하세요. 5월 예측 모델 분석이 완료되었습니다. 이번 달(4월) 대비 5월의 리스크를 확인하시겠습니까?' },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    fetch('/api/emissions')
      .then((r) => r.json())
      .then(({ data }) => {
        if (data?.length) {
          const history = data
            .filter((d: any) => !d.is_prediction)
            .map((d: any) => ({ month: d.month_label, scope1: d.scope1_tco2, scope2: d.scope2_tco2 }));
          if (history.length) setHistoricalData(history);
        }
      })
      .catch(() => {});

    fetch('/api/reports')
      .then((r) => r.json())
      .then(({ data }) => {
        if (data?.length) {
          const inferCategory = (title: string, status: string) => {
            if (status === 'AI생성') return 'AI 예측';
            if (/공급망|협력사|공급사|현대|삼성/.test(title)) return '공급망 대응';
            if (/CDP|공시|TCFD|GRI/.test(title)) return '대외 공시';
            return '정기 보고서';
          };
          setReportList(data.map((d: any) => ({
            id: d.id,
            title: d.title,
            date: d.created_at.slice(0, 10),
            status: d.status,
            category: inferCategory(d.title, d.status),
            content: d.content ?? '',
          })));
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const elecCO2 = (usageInput.elec * 0.4747) / 1000;
    const gasCO2 = (usageInput.gas * 2.176) / 1000;
    const dieselCO2 = (usageInput.diesel * 2.59) / 1000;
    const scope1Total = gasCO2 + dieselCO2;
    const scope2Total = elecCO2;
    const combined = [...historicalData, { month: '5월(예상)', scope1: scope1Total, scope2: scope2Total, isPrediction: true }];
    const final = combined.map((d: any) =>
      d.isPrediction ? { ...d, scope2: Math.max(0, d.scope2 * (1 - renewableRatio / 100)) } : d,
    );
    setChartData(final);
  }, [usageInput, renewableRatio, historicalData]);

  const currentMonthTotal = historicalData[historicalData.length - 1].scope1 + historicalData[historicalData.length - 1].scope2;
  const predictedTotal = chartData.length > 0 ? chartData[chartData.length - 1].scope1 + chartData[chartData.length - 1].scope2 : 0;
  const increaseRate = ((predictedTotal - currentMonthTotal) / currentMonthTotal * 100).toFixed(1);
  const isIncreased = Number(increaseRate) > 0;
  const predictedCarbonTax = Math.floor(predictedTotal * 30000);

  const proactiveAlerts = useMemo(() => {
    if (historicalData.length < 2) return [];
    const alerts: { level: 'warning' | 'info'; message: string }[] = [];
    const last = historicalData[historicalData.length - 1];
    const prev = historicalData[historicalData.length - 2];

    const scope2Change = ((last.scope2 - prev.scope2) / Math.max(prev.scope2, 0.01)) * 100;
    if (scope2Change > 15) {
      alerts.push({
        level: 'warning',
        message: `⚡ 전력 이상 감지: Scope 2 배출량이 전월 대비 ${scope2Change.toFixed(1)}% 급증했습니다. 냉난방 설비 및 전력 계약 점검을 권장합니다.`,
      });
    }
    const avgScope2 = historicalData.reduce((s, d) => s + d.scope2, 0) / historicalData.length;
    if (last.scope2 > avgScope2 * 1.15) {
      alerts.push({
        level: 'info',
        message: `📊 Scope 2 경보: 현재 전력 배출량이 6개월 평균 대비 ${((last.scope2 / avgScope2 - 1) * 100).toFixed(0)}% 높습니다. RE100 목표 달성에 영향을 줄 수 있습니다.`,
      });
    }
    return alerts;
  }, [historicalData]);

  const aiContext = {
    company: companyProfile.companyName,
    industry: companyProfile.industry,
    size: companyProfile.size,
    goals: companyProfile.goals.join(', '),
    currentMonth: '4월',
    predictedMonth: '5월',
    elec: usageInput.elec,
    gas: usageInput.gas,
    diesel: usageInput.diesel,
    predictedTotal: parseFloat(predictedTotal.toFixed(2)),
    predictedCarbonTax,
    renewableRatio,
  };

  const handleDownloadPDF = () => window.print();

  const handleGenerateReport = async (category: string, reportType: string, targetOrg: string) => {
    setIsGeneratingReport(true);
    setGeneratedReportText('');
    try {
      const prompt = `너는 최고 수준의 ESG 컨설턴트야. 반드시 마크다운 형식(##, ###, -, **굵게**)으로 작성해.
현재 (주)코코네스쿨의 5월 입력 데이터: 전기 ${usageInput.elec}kWh, 가스 ${usageInput.gas}m³, 경유 ${usageInput.diesel}L.
예측된 5월 탄소 배출량 총합은 ${predictedTotal.toFixed(2)} tCO2eq이고, 예상 탄소세는 ${predictedCarbonTax.toLocaleString()}원이야.
카테고리: ${category}
보고서 내용/유형: ${reportType || 'GHG Protocol 기반 Scope 1·2 탄소 배출량 보고서'}
제출 기관: ${targetOrg || '미지정'}
위 정보를 바탕으로 제출 기관에 맞는 보고서를 작성해줘.
## 1. 서론, ## 2. 배출량 상세 분석, ## 3. 감축 로드맵 요약 섹션을 포함하고 수치는 **굵게** 표시해.`;

      await streamFromServer('report', prompt, aiContext, (chunk) =>
        setGeneratedReportText((prev) => prev + chunk),
      );
    } catch (e: any) {
      const msg = e?.message ?? '';
      if (msg.includes('429') || msg.includes('rate_limit') || msg.includes('quota')) {
        setGeneratedReportText('⚠️ API 요청 한도 초과\n\n무료 플랜 한도를 초과했습니다. 잠시 후 다시 시도해주세요.\n(Groq 무료 티어: 분당 6,000 토큰 / 일 14,400 요청)');
      } else {
        setGeneratedReportText('오류가 발생했습니다: ' + msg);
      }
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleAddReportToList = async () => {
    const title = reportFormType.trim()
      ? `[${reportFormCategory}] ${reportFormType.trim()}`
      : `${reportFormCategory} - ${reportFormOrg.trim() || '자동생성'}`;
    const today = new Date().toISOString().split('T')[0];
    const newItem = { title, date: today, status: 'AI생성', category: reportFormCategory, content: generatedReportText };
    setReportList((prev) => [newItem, ...prev]);

    fetch('/api/reports', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content: generatedReportText, status: 'AI생성' }),
    }).catch(() => {});

    setGeneratedReportText('');
    setReportFormType('');
    setReportFormOrg('');
  };

  const handleDeleteReport = (item: ReportItem) => {
    setReportList((prev) => prev.filter((r) => r !== item));
    if (item.id) {
      fetch(`/api/reports/${item.id}`, { method: 'DELETE' }).catch(() => {});
    }
  };

  const handleQuickGenerate = (name: string, category: string) => {
    setActiveTab('리포트 센터');
    setReportFormCategory(category);
    setReportFormType(name);
  };

  const handleGenerateInsight = async () => {
    setIsGeneratingInsight(true);
    setInsightText('');
    try {
      const prompt = `과거 월별 배출량 데이터 흐름:
1월(Scope1:${initialHistoricalData[1].scope1}, Scope2:${initialHistoricalData[1].scope2}tCO2eq),
2월(Scope1:${initialHistoricalData[2].scope1}, Scope2:${initialHistoricalData[2].scope2}tCO2eq).
이 데이터를 보고 "2월에 Scope 2가 급증한 이유(난방 등)와 기업의 현실적인 대응책"을 3문장으로 날카롭게 분석해줘.`;
      await streamFromServer('insight', prompt, aiContext, (chunk) =>
        setInsightText((prev) => prev + chunk),
      );
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingInsight(false);
    }
  };

  const handleGenerateRoadmap = async () => {
    setIsGeneratingRoadmap(true);
    setRoadmapPlan('');
    try {
      const prompt = `(주)코코네스쿨이 5월 예상 배출량(${predictedTotal.toFixed(2)}톤) 대비 ${roadmapTarget}%를 감축하려고 해.
반드시 마크다운 형식(##, ###, -, 1. **굵게**)으로 작성해.
## 단기 액션 (1~3개월), ## 중기 액션 (3~12개월), ## 장기 액션 (1~3년) 섹션으로 나눠서 각 단계별 구체적인 실행 항목을 numbered list와 bullet로 작성해줘. 예상 감축량이나 비용은 **굵게** 표시해.`;
      await streamFromServer('roadmap', prompt, aiContext, (chunk) =>
        setRoadmapPlan((prev) => prev + chunk),
      );
    } catch (e: any) {
      const msg = e?.message ?? '';
      if (msg.includes('429') || msg.includes('rate_limit') || msg.includes('quota')) {
        setRoadmapPlan('⚠️ API 요청 한도 초과. 잠시 후 다시 시도해주세요.\n(Groq 무료 티어: 분당 6,000 토큰 / 일 14,400 요청)');
      } else {
        setRoadmapPlan('오류가 발생했습니다: ' + msg);
      }
    } finally {
      setIsGeneratingRoadmap(false);
    }
  };

  const handleSendMessage = async (input: string) => {
    setChatMessages((prev) => [...prev, { sender: 'user', text: input }, { sender: 'ai', text: '' }]);
    setIsTyping(true);
    try {
      const prompt = `너는 블랙 타이탄 팀의 AI ESG 매니저야.
현재 (주)코코네스쿨 데이터 - 전기:${usageInput.elec}kWh, 가스:${usageInput.gas}m³, 경유:${usageInput.diesel}L. 총 예상배출량:${predictedTotal.toFixed(2)}tCO2eq. 예상 탄소세:${predictedCarbonTax}원.
사용자 질문: "${input}"
ESG 전문가처럼 3문장 이내로 짧고 명확하게 답변해.`;
      await streamFromServer('chat', prompt, aiContext, (chunk) => {
        setChatMessages((prev) => {
          const arr = [...prev];
          arr[arr.length - 1].text += chunk;
          return arr;
        });
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsTyping(false);
    }
  };

  // ---------- VIEWS ----------

  const DashboardView = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Proactive Alerts */}
      {proactiveAlerts.length > 0 && (
        <div className="space-y-3">
          {proactiveAlerts.map((alert, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.15, duration: 0.4 }}
              className="neu-raised-sm flex items-start gap-3 p-4 text-sm"
              style={{ color: alert.level === 'warning' ? ACCENT.coral : ACCENT.blue }}
            >
              <div className="neu-inset-sm w-8 h-8 flex items-center justify-center shrink-0">
                <Bell size={14} />
              </div>
              <span className="leading-relaxed" style={{ color: ACCENT.ink2 }}>{alert.message}</span>
            </motion.div>
          ))}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {[
          {
            delay: 0.05, accent: ACCENT.blue, badge: 'Predictive',
            title: '익월(5월) 예상 배출량', icon: Activity,
            body: <div className="flex items-baseline gap-1"><span className="text-3xl font-extrabold font-mono" style={{ color: ACCENT.ink }}>{predictedTotal.toFixed(2)}</span><span className="text-sm" style={{ color: ACCENT.muted }}>t</span></div>,
          },
          {
            delay: 0.1, accent: isIncreased ? ACCENT.coral : ACCENT.jade, badge: null,
            title: '당월 대비 예측 증감', icon: TrendingUp,
            body: (
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-mono font-extrabold" style={{ color: isIncreased ? ACCENT.coral : ACCENT.jade }}>
                  {isIncreased ? '+' : ''}{increaseRate}%
                </span>
                <span className="text-[10px] px-2 py-1 rounded-full font-bold uppercase neu-inset-sm" style={{ color: isIncreased ? ACCENT.coral : ACCENT.jade }}>
                  {isIncreased ? '초과 예상' : '안정권'}
                </span>
              </div>
            ),
          },
          {
            delay: 0.15, accent: ACCENT.coral, badge: 'Risk',
            title: '5월 예상 탄소세', icon: AlertCircle,
            body: <div className="text-3xl font-mono font-extrabold" style={{ color: ACCENT.ink }}>₩{predictedCarbonTax.toLocaleString()}</div>,
          },
          {
            delay: 0.2, accent: ACCENT.jade, badge: null,
            title: '5월 방어 시뮬레이션 점수', icon: Zap,
            body: <div className="text-4xl font-mono font-extrabold" style={{ color: ACCENT.jade }}>82<span className="text-lg" style={{ color: ACCENT.muted }}>/100</span></div>,
          },
        ].map((card, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: card.delay, duration: 0.4 }}
            className="neu-raised p-6 relative overflow-hidden"
          >
            {card.badge && (
              <div className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full neu-inset-sm" style={{ color: card.accent }}>
                {card.badge}
              </div>
            )}
            <div className="flex justify-between items-start mb-5">
              <span className="uppercase-mini">{card.title}</span>
              <div className="neu-inset-sm w-9 h-9 flex items-center justify-center">
                <card.icon size={15} style={{ color: card.accent }} />
              </div>
            </div>
            {card.body}
          </motion.div>
        ))}
      </div>

      {/* Chart + Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25, duration: 0.5 }}
          className="lg:col-span-2 neu-raised p-7"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="uppercase-mini">과거 추이 및 5월 배출량 예측</h3>
            <div className="flex gap-3 text-[10px] font-bold uppercase tracking-widest" style={{ color: ACCENT.slate }}>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: ACCENT.plum }} />Scope 1</span>
              <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: ACCENT.jade }} />Scope 2</span>
            </div>
          </div>
          <div className="neu-inset p-4" style={{ borderRadius: 18 }}>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorScope1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={ACCENT.plum} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={ACCENT.plum} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorScope2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={ACCENT.jade} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={ACCENT.jade} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#C8CED5" vertical={false} />
                  <XAxis dataKey="month" stroke={ACCENT.muted} fontSize={11} tickLine={false} axisLine={false} tick={{ fontFamily: 'JetBrains Mono' }} />
                  <YAxis stroke={ACCENT.muted} fontSize={11} tickLine={false} axisLine={false} tick={{ fontFamily: 'JetBrains Mono' }} />
                  <Tooltip contentStyle={{ backgroundColor: '#FFF', border: '1px solid #E2E6EA', borderRadius: 12, fontSize: '11px', fontFamily: 'JetBrains Mono', boxShadow: '6px 6px 14px #C8CED5' }} />
                  <ReferenceLine x="4월(현재)" stroke={ACCENT.muted} strokeDasharray="3 3" label={{ position: 'top', value: '현재', fill: ACCENT.slate, fontSize: 10, fontWeight: 700 }} />
                  <Area type="monotone" dataKey="scope1" name="Scope 1" stroke={ACCENT.plum} strokeWidth={2.5} fillOpacity={1} fill="url(#colorScope1)" />
                  <Area type="monotone" dataKey="scope2" name="Scope 2" stroke={ACCENT.jade} strokeWidth={2.5} fillOpacity={1} fill="url(#colorScope2)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        <div className="neu-raised p-7 flex flex-col">
          <h3 className="text-lg font-extrabold mb-2 flex items-center gap-2 tracking-tight" style={{ color: ACCENT.ink }}>
            <Zap size={18} style={{ color: ACCENT.coral }} /> 5월 방어 시뮬레이터
          </h3>
          <p className="text-xs mb-8 leading-relaxed" style={{ color: ACCENT.slate }}>재생 에너지 전환율을 설정한 뒤 적용하기를 누르면 방어액이 계산됩니다.</p>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-4">
              <span className="uppercase-mini">재생 에너지 전환</span>
              <div className="neu-inset-sm flex items-center px-2 py-1 gap-0.5">
                <PercentInput value={renewableDraft} min={0} max={100} className="text-base w-12" onChange={(v) => { setRenewableDraft(v); renewableMV.set(v); }} />
                <span className="font-mono font-extrabold text-base" style={{ color: ACCENT.jade }}>%</span>
              </div>
            </div>
            <SmoothSlider min={0} max={100} value={renewableDraft} color={ACCENT.jade} onChange={(v) => { setRenewableDraft(v); renewableMV.set(v); }} />
          </div>
          <button
            onClick={() => setRenewableRatio(renewableDraft)}
            className="neu-btn py-2.5 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer mb-6"
            style={{ color: renewableDraft !== renewableRatio ? ACCENT.jade : ACCENT.slate }}
          >
            <Zap size={13} /> 적용하기
          </button>
          <div className="mt-auto neu-inset p-5">
            <div className="uppercase-mini mb-2" style={{ color: ACCENT.jade }}>5월 탄소세 방어액</div>
            <AnimatePresence mode="wait">
              <motion.div key={renewableRatio} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }}>
                <div className="text-2xl font-mono font-extrabold leading-none" style={{ color: ACCENT.ink }}>
                  ₩{Math.round(renewableRatio * 85000).toLocaleString()}
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="text-[10px] font-semibold mt-1" style={{ color: ACCENT.muted }}>원 세이브</div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const AnalysisView = () => {
    const gasCO2 = (usageInput.gas * 2.176) / 1000;
    const dieselCO2 = (usageInput.diesel * 2.59) / 1000;
    const elecCO2 = (usageInput.elec * 0.4747) / 1000;
    const pieData = [
      { name: '전기 (Scope 2)', value: elecCO2, color: ACCENT.jade },
      { name: '가스 (Scope 1)', value: gasCO2, color: ACCENT.blue },
      { name: '경유 (Scope 1)', value: dieselCO2, color: ACCENT.plum },
    ];
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="neu-raised p-7">
            <h3 className="uppercase-mini mb-6 flex items-center gap-2"><PieChartIcon size={14} /> 5월 에너지원별 기여도</h3>
            <div className="neu-inset h-[260px] flex items-center justify-center p-4" style={{ borderRadius: 18 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={58} outerRadius={92} paddingAngle={6} dataKey="value">
                    {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#FFF', border: '1px solid #E2E6EA', borderRadius: 12, fontSize: '11px' }} formatter={(val) => `${Number(val).toFixed(2)} tCO₂`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-4 mt-4 text-xs font-semibold flex-wrap" style={{ color: ACCENT.slate }}>
              {pieData.map((p) => (
                <span key={p.name} className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ background: p.color }} />{p.name}</span>
              ))}
            </div>
          </div>
          <div className="neu-raised p-7">
            <h3 className="uppercase-mini mb-5 flex items-center gap-2"><TrendingUp size={14} /> 월별 증감률 표</h3>
            <div className="neu-inset overflow-hidden overflow-y-auto max-h-[260px]" style={{ borderRadius: 16 }}>
              <table className="w-full text-xs text-left">
                <thead><tr className="uppercase-mini" style={{ background: 'transparent' }}><th className="p-3">월</th><th className="p-3">Scope 1</th><th className="p-3">Scope 2</th><th className="p-3">전월비(%)</th></tr></thead>
                <tbody>
                  {chartData.map((d, i) => {
                    const total = d.scope1 + d.scope2;
                    let change = 0;
                    if (i > 0) {
                      const prevTotal = chartData[i - 1].scope1 + chartData[i - 1].scope2;
                      change = ((total - prevTotal) / prevTotal) * 100;
                    }
                    return (
                      <tr key={i} className="border-t" style={{ borderColor: 'rgba(200,206,213,0.3)' }}>
                        <td className="p-3 font-mono font-semibold" style={{ color: ACCENT.ink2 }}>{d.month}</td>
                        <td className="p-3 font-mono" style={{ color: ACCENT.slate }}>{d.scope1.toFixed(2)}</td>
                        <td className="p-3 font-mono" style={{ color: ACCENT.slate }}>{d.scope2.toFixed(2)}</td>
                        <td className="p-3 font-bold font-mono" style={{ color: change > 0 ? ACCENT.coral : change < 0 ? ACCENT.jade : ACCENT.muted }}>
                          {i === 0 ? '-' : `${change > 0 ? '+' : ''}${change.toFixed(1)}%`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="neu-raised p-7">
          <button onClick={handleGenerateInsight} disabled={isGeneratingInsight} className="neu-btn mb-4 px-5 py-2.5 text-xs font-bold uppercase tracking-widest flex items-center gap-2 cursor-pointer" style={{ color: ACCENT.jade }}>
            {isGeneratingInsight ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} AI 인사이트 생성
          </button>
          <div className="neu-inset p-5 min-h-[100px]">
            {insightText
              ? <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: ACCENT.ink2 }}>{insightText}</p>
              : <p className="text-sm italic" style={{ color: ACCENT.muted }}>버튼을 클릭하면 차트 데이터를 기반으로 AI 분석이 시작됩니다.</p>}
          </div>
        </div>
      </motion.div>
    );
  };


  const RoadmapView = () => {
    const appliedSavings = predictedCarbonTax * (roadmapTarget / 100);
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="neu-raised p-7 flex flex-col justify-between">
            <div>
              <h3 className="uppercase-mini mb-6 flex items-center gap-2" style={{ color: ACCENT.jade }}><Map size={14} /> 감축 목표 설정</h3>
              <div className="mb-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="uppercase-mini">타겟 감축률</span>
                  <div className="neu-inset-sm flex items-center px-2 py-1 gap-0.5">
                    <PercentInput value={roadmapDraft} min={10} max={50} className="text-xl w-12" onChange={(v) => { setRoadmapDraft(v); roadmapMV.set(v); }} />
                    <span className="font-mono font-extrabold text-xl" style={{ color: ACCENT.jade }}>%</span>
                  </div>
                </div>
                <SmoothSlider min={10} max={50} step={5} value={roadmapDraft} color={ACCENT.jade} onChange={(v) => { setRoadmapDraft(v); roadmapMV.set(v); }} />
              </div>
              <button
                onClick={() => setRoadmapTarget(roadmapDraft)}
                className="neu-btn w-full py-2.5 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer mb-5"
                style={{ color: roadmapDraft !== roadmapTarget ? ACCENT.jade : ACCENT.slate }}
              >
                <Zap size={13} /> 적용하기
              </button>
              <div className="neu-inset p-5 mb-4">
                <p className="uppercase-mini mb-2">월별 예상 절감액</p>
                <AnimatePresence mode="wait">
                  <motion.p key={roadmapTarget} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.25 }} className="text-2xl font-mono font-extrabold" style={{ color: ACCENT.ink }}>
                    ₩{Math.floor(appliedSavings).toLocaleString()}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
            <button onClick={handleGenerateRoadmap} disabled={isGeneratingRoadmap} className="neu-btn w-full py-3.5 font-bold flex justify-center items-center gap-2 cursor-pointer uppercase tracking-widest text-xs" style={{ color: ACCENT.jade }}>
              {isGeneratingRoadmap ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} AI 감축 플랜 생성
            </button>
          </div>
          <div className="lg:col-span-2 neu-raised p-7 flex flex-col">
            <h3 className="uppercase-mini mb-4">단계별 액션 플랜 (로드맵)</h3>
            <div className="flex-1 neu-inset p-6 overflow-y-auto min-h-[280px]">
              {roadmapPlan
                ? <MarkdownDisplay content={roadmapPlan} isStreaming={isGeneratingRoadmap} variant="light" />
                : <div className="h-full flex items-center justify-center text-sm font-mono" style={{ color: ACCENT.muted }}>좌측에서 목표를 설정하고 AI 플랜을 생성하세요.</div>}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  const navItems = [
    { icon: LayoutDashboard, label: '통합 대시보드' },
    { icon: BarChart3, label: '세부 분석' },
    { icon: FileText, label: '리포트 센터' },
    { icon: Map, label: '감축 로드맵' },
    { icon: Activity, label: '사용량 입력' },
    { icon: Settings, label: '환경 설정' },
  ];

  return (
    <div className="min-h-screen flex font-sans relative overflow-hidden" style={{ background: 'var(--color-neu-base)', color: ACCENT.ink }}>
      <div className="absolute top-[-15%] right-[-5%] w-[40%] h-[40%] rounded-full pointer-events-none" style={{ background: 'radial-gradient(closest-side, rgba(72,156,193,0.12), transparent 70%)', filter: 'blur(60px)' }} />

      {/* Sidebar */}
      <aside className="w-64 p-6 flex flex-col z-10 shrink-0" style={{ background: 'var(--color-neu-base)' }}>
        <div onClick={onBack} className="flex items-center gap-3 mb-12 cursor-pointer hover:opacity-80 transition group">
          <div className="neu-raised-sm w-11 h-11 flex items-center justify-center">
            <div className="w-5 h-5 rounded-full" style={{ background: ACCENT.jade }} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight leading-none">re100<span style={{ color: ACCENT.jade }}>port</span><span>.</span></h1>
            <span className="uppercase-mini mt-1 block">Pro System</span>
          </div>
        </div>

        <nav className="space-y-2 flex-1">
          {navItems.map((item, idx) => (
            <button key={idx} onClick={() => setActiveTab(item.label)} className={`w-full flex items-center gap-3 px-4 py-3 font-bold cursor-pointer transition-all ${activeTab === item.label ? 'neu-inset' : 'neu-btn'}`} style={{ color: activeTab === item.label ? ACCENT.jade : ACCENT.slate, borderRadius: 14 }}>
              <item.icon size={16} />
              <span className="text-xs tracking-wider">{item.label}</span>
            </button>
          ))}
        </nav>

        {user && (
          <div className="mb-3 neu-raised-sm p-3 flex items-center gap-2">
            {user.user_metadata?.avatar_url
              ? <img src={user.user_metadata.avatar_url} alt="avatar" className="w-7 h-7 rounded-full shrink-0" referrerPolicy="no-referrer" />
              : <div className="neu-inset-sm w-7 h-7 flex items-center justify-center shrink-0"><User size={12} style={{ color: ACCENT.jade }} /></div>
            }
            <span className="text-[10px] font-semibold truncate flex-1" style={{ color: ACCENT.ink2 }}>{user.user_metadata?.full_name ?? user.email}</span>
            <button onClick={onLogout} className="text-[9px] font-mono uppercase" style={{ color: ACCENT.muted }}>로그아웃</button>
          </div>
        )}

        <div className="neu-inset p-4">
          <div className="flex items-center gap-2 mb-2"><Shield size={12} style={{ color: ACCENT.jade }} /><span className="uppercase-mini">보안 연동망</span></div>
          <p className="text-[9px] leading-tight font-mono uppercase" style={{ color: ACCENT.muted }}>TLS_1.3: ENCRYPTED<br />NODES: ACTIVE_24</p>
        </div>
      </aside>

      {/* Main */}
      <main ref={dashboardRef} className="flex-1 p-10 lg:p-14 overflow-y-auto z-10">
        <header className="flex flex-col gap-6 mb-10 pb-8" style={{ borderBottom: '1px solid rgba(200,206,213,0.4)' }}>
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-4xl font-extrabold tracking-tight mb-2" style={{ color: ACCENT.ink }}>{activeTab}<span style={{ color: ACCENT.coral }}>.</span></h2>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: ACCENT.slate }}>(주)코코네스쿨 · 5월 예측 모델 분석 완료 및 데이터 연동 중</p>
            </div>
            <div className="flex gap-3">
              <button onClick={handleDownloadPDF} className="neu-btn flex items-center gap-2 px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest cursor-pointer" style={{ color: ACCENT.ink2 }}>
                <Printer size={14} /> PRINT_REPORT
              </button>
            </div>
          </div>
          {activeTab !== '리포트 센터' && <OmniSearch context={aiContext} />}
        </header>

        <AnimatePresence mode="wait">
          {activeTab === '통합 대시보드' && <DashboardView key="dashboard" />}
          {activeTab === '세부 분석' && <AnalysisView key="analysis" />}
          {activeTab === '리포트 센터' && (
            <ReportView
              reportList={reportList}
              requiredReports={companyProfile.requiredReports ?? []}
              setRequiredReports={(r) => onProfileUpdate({ ...companyProfile, requiredReports: r })}
              companyProfile={companyProfile}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              setSelectedReport={setSelectedReport}
              onDeleteReport={handleDeleteReport}
              onQuickGenerate={handleQuickGenerate}
              reportFormCategory={reportFormCategory}
              setReportFormCategory={setReportFormCategory}
              reportFormType={reportFormType}
              setReportFormType={setReportFormType}
              reportFormOrg={reportFormOrg}
              setReportFormOrg={setReportFormOrg}
              isGeneratingReport={isGeneratingReport}
              generatedReportText={generatedReportText}
              onGenerate={handleGenerateReport}
              onAddToList={handleAddReportToList}
            />
          )}
          {activeTab === '감축 로드맵' && <RoadmapView key="roadmap" />}
          {activeTab === '사용량 입력' && <UsageInputView key="usage" usageInput={usageInput} onUpdate={(v) => setUsageInput(v)} />}
          {activeTab === '환경 설정' && <SettingsView key="settings" companyProfile={companyProfile} onProfileUpdate={onProfileUpdate} />}
        </AnimatePresence>
      </main>

      {/* Chat Widget */}
      <div className="fixed bottom-8 right-8 z-50">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="absolute bottom-20 right-0 w-80 lg:w-96 neu-raised-lg overflow-hidden flex flex-col">
              <div className="p-4 flex justify-between items-center" style={{ borderBottom: '1px solid rgba(200,206,213,0.4)' }}>
                <div className="flex items-center gap-2">
                  <div className="neu-inset-sm w-8 h-8 flex items-center justify-center"><Zap size={14} style={{ color: ACCENT.jade }} /></div>
                  <span className="uppercase-mini" style={{ color: ACCENT.jade }}>AI 리스크 매니저 · v5.1</span>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="neu-btn w-8 h-8 flex items-center justify-center cursor-pointer" style={{ color: ACCENT.slate }}><X size={14} /></button>
              </div>
              <div className="p-4 h-72 overflow-y-auto space-y-4 text-xs flex flex-col">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex gap-2.5 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}>
                    {msg.sender === 'ai' && (
                      <div className="neu-inset-sm w-7 h-7 flex items-center justify-center shrink-0 mt-0.5">
                        <Zap size={11} style={{ color: ACCENT.jade }} />
                      </div>
                    )}
                    <div className={`p-3 max-w-[85%] leading-relaxed font-medium whitespace-pre-wrap ${msg.sender === 'user' ? 'neu-inset' : 'neu-raised-sm'}`} style={{ color: ACCENT.ink2, borderRadius: 14 }}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex gap-2.5">
                    <div className="neu-inset-sm w-7 h-7 flex items-center justify-center shrink-0 mt-0.5"><Zap size={11} style={{ color: ACCENT.jade }} /></div>
                    <div className="neu-raised-sm p-3 flex gap-1 items-center font-mono" style={{ color: ACCENT.muted }}>
                      PREDICTING<span className="animate-bounce">.</span><span className="animate-bounce delay-75">.</span><span className="animate-bounce delay-150">.</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="p-4" style={{ borderTop: '1px solid rgba(200,206,213,0.4)' }}>
                <div className="flex gap-2">
                  <div className="flex-1 neu-inset px-4 py-2.5">
                    <input
                      type="text"
                      placeholder="ENTER_QUERY..."
                      className="w-full bg-transparent text-xs outline-none"
                      style={{ color: ACCENT.ink }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const val = (e.target as HTMLInputElement).value;
                          if (val) { handleSendMessage(val); (e.target as HTMLInputElement).value = ''; }
                        }
                      }}
                    />
                  </div>
                  <button className="neu-btn w-10 flex items-center justify-center cursor-pointer" style={{ color: ACCENT.jade }}><Send size={14} /></button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <button onClick={() => setIsChatOpen(true)} className="neu-raised-lg w-16 h-16 flex items-center justify-center relative cursor-pointer hover:-translate-y-0.5 transition-transform" style={{ borderRadius: '50%' }}>
          <MessageSquare size={22} style={{ color: ACCENT.jade }} />
          <span className="absolute top-2 right-2 w-3 h-3 rounded-full" style={{ background: ACCENT.coral, boxShadow: '0 0 0 3px var(--color-neu-base)' }} />
        </button>
      </div>

      <AnimatePresence>
        {selectedReport && (
          <ReportDraftModal
            report={selectedReport}
            context={aiContext}
            onClose={() => setSelectedReport(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ==========================================
// 4. 최상위 App 컴포넌트
// ==========================================
export default function App() {
  const [currentView, setCurrentView] = useState<'landing' | 'dashboard'>('landing');
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [companyProfile, setCompanyProfile] = useState<CompanyProfile>(() => {
    try { return JSON.parse(localStorage.getItem('esg_company_profile') ?? '') as CompanyProfile; } catch { return DEFAULT_PROFILE; }
  });

  const handleProfileUpdate = (p: CompanyProfile) => {
    setCompanyProfile(p);
    localStorage.setItem('esg_company_profile', JSON.stringify(p));
  };

  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: { subscription } } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user && currentView === 'landing') setCurrentView('dashboard');
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleGoogleLogin = () => {
    if (!isSupabaseConfigured) {
      alert('.env 파일에 VITE_SUPABASE_ANON_KEY를 설정해주세요.\nSupabase 대시보드 → Settings → API → anon public 키');
      return;
    }
    supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
  };

  const handleLogout = async () => {
    await supabaseClient.auth.signOut();
    setUser(null);
    setCurrentView('landing');
  };

  return (
    <AnimatePresence mode="wait">
      {currentView === 'landing' && (
        <motion.div key="landing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
          <LandingPage onNext={() => setCurrentView('dashboard')} onGoogleLogin={handleGoogleLogin} user={user} />
        </motion.div>
      )}
      {currentView === 'dashboard' && (
        <motion.div key="dashboard" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
          <EnterpriseDashboard
            onBack={() => setCurrentView('landing')}
            user={user}
            onLogout={handleLogout}
            companyProfile={companyProfile}
            onProfileUpdate={handleProfileUpdate}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

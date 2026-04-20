# re100port — Enterprise ESG Portal

> AI 기반 탄소 배출량 예측 및 ESG 경영 자동화 플랫폼  
> **Team. Black Titan** | Gachon University

---

## 프로젝트 소개

중소기업(SME)이 복잡한 ESG 규제(K-ESG, GHG Protocol, RE100, EU CBAM)에 대응할 수 있도록 돕는 엔터프라이즈 포털입니다.  
단순한 과거 데이터 기록을 넘어 **익월 배출량 예측**, **탄소세 리스크 시뮬레이션**, **AI 보고서 자동 생성**을 통합 제공합니다.

---

## 핵심 기능

| 기능 | 설명 |
|------|------|
| **배출량 예측 모델** | 전기·가스·경유 사용량 입력 → Scope 1·2 자동 계산 및 익월 예측 |
| **방어 시뮬레이터** | 재생에너지 전환율 조정 → 탄소세 절감액 실시간 계산 |
| **AI 보고서 생성** | GHG Protocol / K-ESG / CDP / 공급망 대응 보고서 자동 작성 |
| **고지서 AI 인식** | 전기·가스 고지서 이미지 업로드 → 사용량 자동 추출 |
| **정기 보고서 관리** | 업종·규모 기반 AI 추천 → 필수 보고서 현황 추적 |
| **AI 채팅** | ESG 전문 AI 매니저와 실시간 대화 |
| **감축 로드맵** | 목표 감축률 설정 → 단기·중기·장기 액션 플랜 AI 생성 |

---

## 기술 스택

```
Frontend   React 19 + TypeScript + Vite 6 + Tailwind CSS 4
Animation  Motion (Framer Motion v12) + Recharts
Backend    Express 4 + TypeScript (tsx)
Database   Supabase (PostgreSQL)
AI         Groq API — llama-3.3-70b-versatile / llama-4-scout-17b
Auth       Supabase Auth (Google OAuth)
UI         Neumorphism 디자인 시스템 + Lucide React
```

---

## 아키텍처

```
┌─────────────────────┐        ┌──────────────────────────┐
│   React Client      │        │   Express Server         │
│   localhost:3000    │──/api──▶│   localhost:3001         │
│                     │◀──SSE──│                          │
└─────────────────────┘        ├──────────────────────────┤
                                │  /api/emissions  (CRUD)  │
                                │  /api/reports    (CRUD)  │
                                │  /api/ai/stream  (SSE)   │
                                │  /api/ai/extract-bill    │
                                └──────────┬───────────────┘
                                           │
                              ┌────────────▼────────────┐
                              │   Supabase (PostgreSQL)  │
                              │   emission_records       │
                              │   reports                │
                              │   company_profiles       │
                              └─────────────────────────┘
```

---

## 배출량 계산식

```
Scope 1 (tCO₂eq) = (가스[m³] × 2.176 + 경유[L] × 2.59) / 1000
Scope 2 (tCO₂eq) = 전기[kWh] × 0.4747 / 1000
탄소세 [원]       = 총배출량[tCO₂eq] × 30,000
```

---

## 시작하기

### 1. 환경변수 설정

```bash
cp .env.example .env
```

`.env` 파일에 아래 키를 입력하세요:

```env
# Groq AI API
GROQ_API_KEY=your_groq_api_key

# Supabase (서버용 — service role key)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Supabase (클라이언트용 — anon key)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 2. DB 마이그레이션

Supabase 대시보드 SQL Editor에서 `supabase_migration.sql` 실행

### 3. 실행

```bash
npm install
npm run dev
```

- 프론트엔드: http://localhost:3000  
- 백엔드 API: http://localhost:3001

---

## 프로젝트 구조

```
enterprise_esg_BT/
├── src/
│   ├── App.tsx                  # 메인 컴포넌트 (대시보드 전체)
│   ├── components/
│   │   ├── OmniSearch.tsx       # AI 통합 검색
│   │   ├── ReportDraftModal.tsx # 보고서 뷰어 모달
│   │   ├── MarkdownDisplay.tsx  # 마크다운 렌더러
│   │   └── GenerativeResponse.tsx
│   └── lib/
│       └── supabase.ts          # Supabase 클라이언트
├── server/
│   ├── index.ts                 # Express 서버 엔트리
│   ├── db.ts                    # Supabase 서버 클라이언트
│   └── routes/
│       ├── ai.ts                # AI 스트리밍 + 도구 호출
│       ├── emissions.ts         # 배출량 CRUD
│       └── reports.ts           # 보고서 CRUD
├── supabase_migration.sql       # DB 스키마 + 시드 데이터
└── .env.example                 # 환경변수 템플릿
```

---

## DB 스키마

### `emission_records`
| 컬럼 | 타입 | 설명 |
|------|------|------|
| year / month | INTEGER | 연월 |
| electricity_kwh / gas_m3 / diesel_l | REAL | 에너지 사용량 |
| scope1_tco2 / scope2_tco2 | REAL | 배출량 (tCO₂eq) |
| is_prediction | BOOLEAN | 예측 데이터 여부 |

### `reports`
| 컬럼 | 타입 | 설명 |
|------|------|------|
| title | TEXT | 보고서 제목 |
| content | TEXT | 마크다운 본문 |
| status | TEXT | 완료 / 검토중 / AI생성 |

---

## 팀

**Black Titan** — Gachon University  

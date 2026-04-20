-- ============================================================
-- ESG 탄소零 - Supabase 마이그레이션
-- 기존 테이블 삭제 후 재생성 + 시드 데이터
-- ============================================================

-- 기존 테이블 삭제
DROP TABLE IF EXISTS reports CASCADE;
DROP TABLE IF EXISTS emission_records CASCADE;

-- 배출량 레코드 테이블
CREATE TABLE emission_records (
  id              BIGSERIAL PRIMARY KEY,
  year            INTEGER   NOT NULL,
  month           INTEGER   NOT NULL,
  month_label     TEXT      NOT NULL,
  electricity_kwh REAL      NOT NULL DEFAULT 0,
  gas_m3          REAL      NOT NULL DEFAULT 0,
  diesel_l        REAL      NOT NULL DEFAULT 0,
  scope1_tco2     REAL      NOT NULL DEFAULT 0,
  scope2_tco2     REAL      NOT NULL DEFAULT 0,
  is_prediction   BOOLEAN   NOT NULL DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (year, month, is_prediction)
);

-- 리포트 테이블
CREATE TABLE reports (
  id         BIGSERIAL PRIMARY KEY,
  title      TEXT NOT NULL,
  content    TEXT DEFAULT '',
  status     TEXT NOT NULL DEFAULT '완료',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 비활성화 (내부 서비스에서 service_role로 접근)
ALTER TABLE emission_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports          DISABLE ROW LEVEL SECURITY;

-- 시드 데이터 - 과거 배출량 (실측)
INSERT INTO emission_records (year, month, month_label, electricity_kwh, gas_m3, diesel_l, scope1_tco2, scope2_tco2, is_prediction) VALUES
  (2025, 12, '12월',       18018, 1050, 320, 3.20,  8.55,  FALSE),
  (2026,  1, '1월',         20009, 1005, 310, 3.10,  9.49,  FALSE),
  (2026,  2, '2월',         24000,  980, 300, 3.05, 11.39,  FALSE),
  (2026,  3, '3월',         19010,  870, 280, 2.62,  9.02,  FALSE),
  (2026,  4, '4월(현재)',   21020, 1100, 350, 3.27,  9.97,  FALSE);

-- 시드 데이터 - 초기 리포트
INSERT INTO reports (title, content, status, created_at) VALUES
  ('2026년 4월 Scope 1·2 정기 보고서',      '', '완료',   '2026-04-17 00:00:00+09'),
  ('현대자동차 공급망 ESG 제출용 요약본',    '', '완료',   '2026-04-10 00:00:00+09'),
  ('CDP (탄소정보공개프로젝트) 대응 초안',   '', '검토중', '2026-03-28 00:00:00+09');

-- 기업 프로필 테이블 (AI 개인화 기반)
DROP TABLE IF EXISTS company_profiles CASCADE;
CREATE TABLE company_profiles (
  id              BIGSERIAL PRIMARY KEY,
  company_name    TEXT NOT NULL,
  business_number TEXT UNIQUE NOT NULL,
  industry        TEXT NOT NULL DEFAULT '교육서비스',
  company_size    TEXT NOT NULL DEFAULT 'SME',
  goals           TEXT[] DEFAULT ARRAY['RE100', '탄소중립'],
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE company_profiles DISABLE ROW LEVEL SECURITY;

INSERT INTO company_profiles (company_name, business_number, industry, company_size, goals) VALUES
  ('(주)코코네스쿨', '123-45-67890', '교육서비스', 'SME', ARRAY['탄소중립 2040', 'RE100', 'K-ESG'])
ON CONFLICT (business_number) DO NOTHING;

---
name: Ohker Works Precision Ledger (OWDS v2.0)
description: 국내 커머스 및 웹 인프라 실무자를 위한 고밀도 무인 운영 디자인 시스템
colors:
  brand-obsidian: "#0B1220"
  brand-obsidian-raised: "#131F35"
  interactive-cobalt: "#1D4ED8"
  interactive-cobalt-hover: "#1E40AF"
  interactive-cobalt-wash: "#EFF6FF"
  interactive-cobalt-border: "#DBEAFE"
  canvas-ground: "#F6F8FB"
  surface-sheet: "#FFFFFF"
  surface-hover: "#F8FAFC"
  surface-recessed: "#F1F5F9"
  ink-primary: "#0F172A"
  ink-secondary: "#334155"
  ink-muted: "#475569"
  ink-on-dark: "#F8FAFC"
  ink-on-dark-muted: "#CBD5E1"
  hairline-strong: "#CBD5E1"
  hairline-default: "#E2E8F0"
  hairline-subtle: "#EDF2F7"
  status-pulse: "#10B981"
  status-ok-fg: "#065F46"
  status-ok-bg: "#ECFDF5"
  status-ok-border: "#A7F3D0"
  status-warn-fg: "#92400E"
  status-warn-bg: "#FFFBEB"
  status-warn-border: "#FDE68A"
  status-crit-fg: "#991B1B"
  status-crit-bg: "#FEF2F2"
  status-crit-border: "#FECACA"
typography:
  display:
    fontFamily: "'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontSize: "clamp(1.875rem, 3vw, 2.5rem)"
    fontWeight: 700
    lineHeight: 1.24
    letterSpacing: "-0.03em"
  price:
    fontFamily: "'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontSize: "clamp(1.35rem, 2vw, 1.625rem)"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.025em"
  title:
    fontFamily: "'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "-0.015em"
  lead:
    fontFamily: "'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "-0.01em"
  body:
    fontFamily: "'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "-0.01em"
  control:
    fontFamily: "'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
  table:
    fontFamily: "'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontSize: "0.84375rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "0.8125rem"
    fontWeight: 500
    lineHeight: 1.45
    letterSpacing: "0em"
  caption:
    fontFamily: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
rounded:
  xs: "6px"
  sm: "8px"
  md: "12px"
  lg: "14px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  xxl: "64px"
components:
  button-primary:
    backgroundColor: "{colors.interactive-cobalt}"
    textColor: "{colors.ink-on-dark}"
    rounded: "{rounded.sm}"
    padding: "12px 22px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.interactive-cobalt-hover}"
  button-secondary:
    backgroundColor: "{colors.surface-sheet}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.sm}"
    padding: "10px 16px"
    height: "40px"
  ledger-panel:
    backgroundColor: "{colors.surface-sheet}"
    textColor: "{colors.ink-primary}"
    rounded: "{rounded.md}"
    padding: "24px"
  telemetry-rail:
    backgroundColor: "{colors.brand-obsidian}"
    textColor: "{colors.ink-on-dark}"
    padding: "8px 24px"
    height: "36px"
---

# Ohker Works Precision Ledger (OWDS v2.0)

## Overview

**Creative North Star: "The Precision Operations Ledger (정밀 운영 원장)"**

오커 웍스(Ohker Works)는 일회성 홍보 랜딩 페이지가 아니라, 국내 이커머스 셀러와 웹 인프라 담당자가 매일 업무 현장에서 열어 쓰는 **고밀도 실무 계측·정규화 워크벤치(Workbench)**다. 시각 언어는 네 가지 검증된 B2B 레퍼런스 시스템을 합성해 설계했다.

| 레퍼런스 시스템 | 채택한 구조적 원칙 | 오커 웍스 적용 방식 |
|---|---|---|
| **Toss Design System (TDS)** | 브랜드 식별색과 단일 인터랙션 블루 분리, 시멘틱 그레이 계층 | 상단 관제 레일은 `brand-obsidian(#0B1220)`, 화면당 핵심 실행 CTA만 `interactive-cobalt(#1D4ED8)` 적용 |
| **Stripe Calm Fintech** | 무그림자 헤어라인(`1px`) 원장 구획, 차분한 오프화이트 캔버스 | `#F6F8FB` 캔버스 위 `#FFFFFF` 시트를 `1px solid #E2E8F0` 단일 경계선으로 구획해 재무·정산급 신뢰감 확보 |
| **Channel.io Bezier** | 3계층 토큰(`Primitive -> Semantic -> Component`), Pretendard 가독성 | 한글 자간(`-0.025em`)과 행간(`1.65`)을 토큰화하고 `design-system.css` 단일 소스로 두 제품 동기화 |
| **Datadog DRUIDS** | 고밀도 운영 텔레메트리 바, 고정폭 숫자(`tnum`), 상태 배지 | 최상단 실시간 스케줄러·보안 상태 바, 검사항목 코드(`CHK-*`) 및 6대 마켓 정규화 매트릭스 테이블 배치 |

## Colors

3계층 토큰 구조(`Primitive -> Semantic -> Component`)로 관리하며 모든 본문 및 보조 텍스트는 WCAG AA 이상(`4.5:1~15.4:1`) 명암비를 강제한다.

- **Brand & Telemetry (`#0B1220` / `#131F35`)**: 최상단 인프라 가동 상태 레일 및 브랜드 모노그램 배경에만 제한적으로 사용해 무게중심을 잡는다.
- **Single Primary Action (`#1D4ED8` -> Hover `#1E40AF`)**: 진단 실행, 통합 엑셀 다운로드, 정기구독 시작 등 뷰포트 내 최우선 행동 1개에만 채움색으로 사용한다.
- **Ledger Surfaces (`#F6F8FB` Ground / `#FFFFFF` Sheet / `#F1F5F9` Recessed)**: 종이 원장과 데이터 시트의 위계를 그림자 대신 명도 차이와 `1px` 헤어라인(`#E2E8F0`)으로 구분한다.
- **Semantic Status (`OK #065F46`, `WARN #92400E`, `CRIT #991B1B`)**: 진단 판정과 컬럼 매핑 검증 상태에만 사용하며 장식용 배지로 남용하지 않는다.

## Typography

- **Primary Sans (`Pretendard Variable`)**: 한글과 영문, 기호가 섞이는 B2B 실무 문맥에서 이질감이 없도록 단일 산세리프 축을 유지한다. 대형 제목은 `-0.03em` 자간과 `text-wrap: balance`로 단정하게 조판한다.
- **Technical Mono (`JetBrains Mono`)**: HTTP 응답코드, 바이트 수(`0 B`), KST 타임스탬프(`08:00 KST`), 검사항목 식별자(`CHK-MAP-01`), 엑셀 헤더 키에만 엄격히 한정한다.
- **Tabular Numerals (`font-variant-numeric: tabular-nums`)**: 요금(`월 4,900원`), 처리 건수, 경과 시간(`0.8ms`), SSL 잔여일(`D-14`) 등 모든 수치 데이터에 전역 강제한다.

## Layout

- **Asymmetric Enterprise Split (`max-width: 1180px`)**: 소비자용 중앙 정렬 단일 컬럼을 배제하고, 데스크톱 기준 **좌측 명세·보증 컬럼(`5fr`) + 우측 실시간 실행 워크벤치(`7fr`)** 비대칭 2단 그리드로 첫 화면에서 즉시 도구의 전문성과 실체감을 증명한다.
- **Specification Matrices over Feature Cards**: 아이콘+제목+설명 3열 카드 나열을 금지하고, **검사항목 명세 원장(Inspection Matrix)**과 **6대 마켓 컬럼 정규화 스키마 표(Normalization Schema Table)**로 대체한다.

## Elevation & Depth

- **Single Elevation Rule**: 모든 원장 패널과 테이블 컨테이너는 그림자 없이 `1px solid #E2E8F0` 헤어라인 테두리만 선언한다(Ghost Card 금지).
- **Focused Control Depth**: 사용자가 직접 누르는 주 실행 버튼과 포커스 링(`2px solid #1D4ED8`, `offset 2px`)에만 명확한 물리적 피드백을 부여한다.

## Shapes

- **Architectural Radii**: 데이터 워크벤치·원장 패널은 `12px`(`md`), 버튼·입력창은 `8px`(`sm`), 인라인 코드·상태 태그는 `6px`(`xs`) 직교 비례를 유지한다. 둥근 알약형(`999px`) 버튼은 사용하지 않는다.
- **Precision Geometric Iconography**: 유니코드 이모지(`✅`, `🔒` 등)를 전면 금지하고, `1.75px` 균일 스트로크의 직교 기하학 SVG 아이콘만 사용한다.

## Components

- **Global Telemetry Rail**: 화면 최상단 `36px` 다크 슬레이트 바에 엔진 가동 상태, `Client-Side Zero-Retention (외부 전송 0B)` 규약, 기술지원 SLA를 상시 노출한다.
- **Workspace Switcher Header**: 오커 웍스 기하학 모노그램과 함께 주력 1순위(`6대 마켓 발주서 통합 엔진`)와 2순위(`카카오 지도 교체 코드 생성기`)를 탭 형태로 즉시 전환한다.
- **Interactive Execution Workbench**: 상단 콘솔 툴바(실행 상태, 샘플 프리셋, 처리 지연 표시) + 입력/드롭존 + 즉시 산출물 미리보기 및 패스 잠금 해제(`PASS-2026-PRO`) 모듈이 결합된 통합 실행기다.
- **Transparent Rate Schedule (`월 4,900원`)**: 일반 통합 ERP·외주 수리 비용 대비 무서버 경량 엔진으로 절감된 원가 근거를 나란히 대조하는 정산 명세표 컴포넌트다.

## Do's and Don'ts

- **Do**: 첫 뷰포트 안에서 사용자가 실제 HTML 소스나 엑셀/CSV 샘플을 즉시 실행해 결과를 눈으로 검증하게 한다.
- **Do**: 브라우저 기본 선택 영역(`::selection`), 스크롤바, 포커스 링, 캐럿 색상을 모두 시스템 팔레트로 테마화한다.
- **Don't**: 제목(`h1`, `h2`, `h3`) 바로 위에 작은 영문/한글 아이브로(Eyebrow/Kicker) 라벨을 올리지 않는다.
- **Don't**: 테두리(`1px border`)와 넓은 그림자(`box-shadow`)를 한 카드에 중복 선언하거나 `3px+` 좌측 색띠(`border-left`) 콜아웃을 쓰지 않는다.
- **Don't**: 첫 달 할인가와 정기결제 청구액을 다르게 적지 않고, 모든 채널에서 `월 4,900원(VAT 포함)` 단일 고정 정가를 유지한다.

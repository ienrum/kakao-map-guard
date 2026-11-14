# 오커 웍스 (Ohker Works) — 무전송(0 Byte) 커머스 발주서 통합 & 웹 인프라 긴급 복구 스위트

고객 개인정보(주문 엑셀)와 서버 시크릿키(PHP·HTML 코드)를 외부 서버로 단 1바이트도 전송하지 않고 **내 PC 브라우저 메모리(RAM) 안에서만 즉시 변환·복구**하는 경량 B2B 웹 유틸리티 3종입니다.

---

## 1. 6대 오픈마켓 주문 엑셀 3초 통합·합포장·택배양식 변환기
- **바로 실행 (회당 5건 무료 체험)**: https://ienrum.github.io/kakao-map-guard/seller-converter/
- **스마트스토어 암호 엑셀 Ctrl+V & CJ 로이스파셀(LOIS Parcel) 변환 가이드**: https://ienrum.github.io/kakao-map-guard/seller-converter/smartstore-lois-parcel/
- **5대 택배사 표준 빈 엑셀(.xlsx) 무료 발급기**: https://ienrum.github.io/kakao-map-guard/seller-converter/courier-excel-format/
- **사방넷·플레이오토 대비 소량 셀러 고정비 절감 비교**: https://ienrum.github.io/kakao-map-guard/seller-converter/sabangnet-alternative/
- **핵심 기능**:
  - **지원 채널 & 암호 엑셀 Ctrl+V 즉시 투입**: 스마트스토어(암호 걸린 엑셀도 재다운로드 없이 `Ctrl+V` 1초 병합 · 1행 안내문 자동 스킵), 쿠팡 윙(0507 안심번호 정렬), 11번가, G마켓·옥션(ESM+), 카페24, 오늘의집, 아임웹, 톡스토어, 롯데온
  - **한글 인코딩 & 번호 훼손 자동 복원**: `CP949 / EUC-KR` 한글 CSV 깨짐 자동 판별, 서울·강원 4자리 우편번호(`6236 → 06236`) 및 휴대폰 앞자리 `0` 누락 복원, 16자리 주문번호 지수 표기 방지, 동일 주문번호 중복 투입 차단
  - **050 안심번호 변경에도 깨지지 않는 합포장**: 주문마다 다른 `050` 안심번호가 발급되어도 동일 수취인 성명+정규화 주소 기준으로 1행 합포장 병합 (건당 택배비 약 3,000원 절감)
  - **7종 출고 프리셋**: CJ대한통운 로이스파셀(LOIS Parcel)·CNPlus, 우체국택배 계약소포, 한진 H-Focus, 롯데 알짜배기, 로젠 i-LOGEN, 도매꾹·오너클랜 위탁발주서, 표준 통합발주서

---

## 2. 호스팅 PHP `exec()` 차단 복구 — 영카트5·그누보드 NHN KCP(`pp_cli`) cURL 어댑터 생성기
- **무료 정적 코드 진단 및 어댑터 생성기**: https://ienrum.github.io/kakao-map-guard/kcp-exec-patch/
- **카페24·가비아 영카트5 KCP 결제 먹통 3분 복구 가이드**: https://ienrum.github.io/kakao-map-guard/kcp-exec-patch/cafe24-youngcart-kcp-error/
- **해결하는 장애**:
  - 웹호스팅 보안 패치(`disable_functions = exec, passthru, shell_exec, proc_open`) 이후 구형 영카트5·그누보드 `pp_cli` 바이너리 호출이 막혀 카드 인증 직후 흰 화면(`Fatal error: Call to undefined function exec()`) 또는 `res_cd` 빈값이 반환되는 긴급 결제 장애
  - FTP 루트 비밀번호나 `g_conf_site_key`를 외부 외주 작업자에게 넘기지 않고 순수 PHP HTTPS `cURL` REST 어댑터 코드로 3분 내 전환

---

## 3. 카카오 지도 구형 `daumcdn.net` / `apis.daum.net` 백지 오류 교체 코드 생성기
- **무료 HTML 진단 및 v2 SDK + 폴백 코드 생성기**: https://ienrum.github.io/kakao-map-guard/
- **홈페이지 오시는길 지도 백지 복구 & 유지보수 수정비 비교**: https://ienrum.github.io/kakao-map-guard/daumcdn-map-error/
- **해결하는 장애**:
  - 구형 다음 지도 스크립트(`apis.daum.net/maps/maps3.js`, 구형 `daumcdn` 약도 로더) 종료 및 SSL 적용 후 `http://` 혼합 콘텐츠 차단으로 병원·학원·기업 홈페이지 오시는길 약도가 회색 빈 칸으로 멈추는 현상
  - 기존 HTML에서 위·경도(`LatLng`) 좌표를 자동 추출하여 최신 `dapi.kakao.com/v2` 비동기 로더 + **4.5초 먹통 감지 시 카카오맵·네이버지도 길찾기 자동 폴백 카드**가 내장된 반응형 완성 코드 즉시 합성

---

## 통합 패스 및 보안·환불 보증
- **3종 통합 무제한 패스**: 월 **4,900원** (VAT 포함 고정 정가 · 약정 없음 · 결제 즉시 `PASS-2026-PRO` 코드 자동 발급)
- **즉시 발급 창구**: https://litt.ly/ohker/sale/1m1jHkV
- **개인정보 무수집(0 Byte) 방침 및 7일 100% 환불 규정**: https://ienrum.github.io/kakao-map-guard/privacy-terms/
- **기술지원 및 환불 접수**: `oker04897@gmail.com` (결제 후 7일 이내 조건 없는 100% 전액 환불 보장)

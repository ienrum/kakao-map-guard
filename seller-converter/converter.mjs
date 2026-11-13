#!/usr/bin/env node
import { fileURLToPath } from "node:url";

/**
 * 6대 오픈마켓(스마트스토어, 쿠팡, 11번가, G마켓, 옥션, 카페24/롯데온) 발주서 무인 통합 변환 엔진
 * - 스마트스토어/오픈마켓 상단 개인정보 안내문 행 자동 건너뛰기
 * - 동일 수취인·연락처·주소 합포장 자동 병합(중복 택배비 방지)
 * - 택배사(CJ대한통운 CNPlus, 우체국택배, 한진·롯데·로젠) 및 도매처 전용 양식 변환
 * 외부 서버 전송 0건 · 브라우저/로컬 즉시 정규화
 */
const FIELD_ALIASES = {
  orderId: ["상품주문번호", "주문번호", "묶음배송번호", "장바구니번호", "주문코드", "order_id"],
  market: ["판매채널", "마켓명", "쇼핑몰", "사이트"],
  receiver: ["수취인명", "수취인이름", "수령인명", "수령인", "받는분", "받는사람"],
  phone: ["수취인연락처1", "수취인전화번호", "수령인휴대폰", "수령인휴대전화", "연락처", "휴대폰번호", "받는분전화번호", "수령인연락처", "안심번호"],
  zipcode: ["우편번호", "배송지우편번호", "수취인우편번호", "새우편번호"],
  address: ["통합배송지", "배송지", "수취인주소", "수령인주소", "주소", "받는분주소", "기본주소"],
  addressDetail: ["상세주소", "수취인상세주소", "배송지상세주소", "나머지주소"],
  productName: ["상품명", "노출상품명", "주문상품명", "품목명"],
  optionName: ["옵션정보", "옵션명", "등록옵션명", "주문옵션", "선택사항", "옵션", "단품명"],
  qty: ["수량", "구매수(수량)", "구매수량", "구매수", "주문수량", "출고수량"],
  memo: ["배송메세지", "배송메시지", "배송요청사항", "배송시요구사항", "요청사항"],
};

export function findHeaderRowIndex(matrixRows) {
  const maxScan = Math.min(matrixRows.length, 12);
  const receiverRe = /수취인|수령인|받는분|받는사람/;
  const orderRe = /상품|품목|주소|배송지|주문번호|묶음배송|장바구니|연락처|전화|휴대/;
  for (let i = 0; i < maxScan; i++) {
    const joined = (matrixRows[i] || []).map((c) => String(c ?? "").replace(/\s+/g, "")).join("|");
    if (receiverRe.test(joined) && orderRe.test(joined)) {
      return i;
    }
  }
  return 0;
}

export function parseDelimited(text) {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter((l) => l.trim().length > 0);
  if (lines.length < 2) return { headers: [], rows: [] };
  const sampleForSep = lines.slice(0, Math.min(lines.length, 5)).join("\n");
  const sep = sampleForSep.includes("\t") ? "\t" : ",";
  const splitLine = (line) => {
    const out = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === sep && !inQuotes) {
        out.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }
    out.push(cur.trim());
    return out;
  };
  const matrix = lines.map((l) => splitLine(l).map((c) => c.replace(/^\uFEFF/, "").trim()));
  const headerIdx = findHeaderRowIndex(matrix);
  const headers = matrix[headerIdx] || [];
  const rows = matrix.slice(headerIdx + 1);
  return { headers, rows, skippedNoticeRows: headerIdx };
}

function detectMarketFromHeaders(headers) {
  const joined = headers.join("|");
  if (joined.includes("상품주문번호") && joined.includes("통합배송지")) return "스마트스토어";
  if (joined.includes("묶음배송번호") || joined.includes("노출상품명")) return "쿠팡";
  if (joined.includes("주문코드") && joined.includes("배송시요구사항")) return "롯데온";
  if (joined.includes("선택사항")) return "11번가";
  if (joined.includes("장바구니번호") || joined.includes("안심번호")) return "G마켓·옥션";
  if (joined.includes("수령인 휴대전화")) return "카페24";
  return "자동감지마켓";
}

export function formatPhone(p) {
  const digits = String(p || "").replace(/[^0-9]/g, "");
  if (digits.length === 11) return digits.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
  if (digits.length === 10) return digits.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
  if (digits.length === 12 && digits.startsWith("050")) return digits.replace(/(\d{4})(\d{4})(\d{4})/, "$1-$2-$3");
  return String(p || "").trim();
}

export function normalizeOrders(rawText, defaultMarket = "") {
  const { headers, rows } = parseDelimited(rawText);
  if (headers.length === 0) return [];
  const marketGuess = defaultMarket || detectMarketFromHeaders(headers);

  const idxOf = (key) => {
    const candidates = FIELD_ALIASES[key] || [];
    for (const alias of candidates) {
      const idx = headers.findIndex((h) => h.replace(/\s+/g, "") === alias.replace(/\s+/g, ""));
      if (idx !== -1) return idx;
    }
    for (const alias of candidates) {
      const idx = headers.findIndex((h) => h.replace(/\s+/g, "").includes(alias.replace(/\s+/g, "")));
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const map = {};
  for (const k of Object.keys(FIELD_ALIASES)) map[k] = idxOf(k);

  return rows
    .map((cols, idx) => {
      const get = (k) => (map[k] >= 0 && cols[map[k]] !== undefined ? cols[map[k]].trim() : "");
      const addrBase = get("address");
      const addrDetail = get("addressDetail");
      const fullAddress = (addrBase + (addrDetail && !addrBase.includes(addrDetail) ? " " + addrDetail : "")).replace(/\s+/g, " ").trim();
      const prod = get("productName");
      const opt = get("optionName");
      const itemLabel = (prod + (opt ? ` [${opt}]` : "")).trim();
      const qty = Number.parseInt(get("qty").replace(/[^0-9]/g, "") || "1", 10) || 1;
      return {
        seq: idx + 1,
        market: get("market") || marketGuess,
        orderId: get("orderId") || `AUTO-${idx + 1}`,
        receiver: get("receiver"),
        phone: formatPhone(get("phone")),
        zipcode: get("zipcode"),
        address: fullAddress,
        item: itemLabel,
        qty,
        memo: get("memo") || "문 앞",
      };
    })
    .filter((r) => (r.receiver || r.item) && !/^(수취인명|수령인|받는분)$/.test(r.receiver));
}

export function consolidateBundles(rows) {
  const map = new Map();
  const out = [];
  let savedWaybills = 0;
  for (const r of rows) {
    const keyPhone = String(r.phone || "").replace(/[^0-9]/g, "");
    const keyAddr = String(r.address || "").replace(/[\s,()\-]/g, "");
    const key = r.receiver && keyAddr
      ? (keyPhone.startsWith("050") || keyAddr.length >= 6 ? `${r.receiver}|${keyAddr}` : `${r.receiver}|${keyPhone}|${keyAddr}`)
      : null;
    if (key && map.has(key)) {
      const existing = map.get(key);
      existing.item = `${existing.item} (x${existing.qty}) + ${r.item} (x${r.qty})`.replace(/\(x1\)\s*\+/g, "+");
      existing.qty += r.qty;
      if (!existing.orderId.includes(r.orderId)) existing.orderId = `${existing.orderId},${r.orderId}`;
      if (!existing.market.includes(r.market)) existing.market = `${existing.market}+${r.market}`;
      savedWaybills += 1;
    } else {
      const clone = { ...r };
      if (key) map.set(key, clone);
      out.push(clone);
    }
  }
  return { rows: out.map((r, i) => ({ ...r, seq: i + 1 })), savedWaybills, savedFeeKrw: savedWaybills * 3000 };
}

export function formatRowsByPreset(rows, preset = "standard") {
  return rows.map((r) => {
    const itemWithQty = r.qty > 1 && !r.item.includes("(x") ? `${r.item} (${r.qty}개)` : r.item;
    if (preset === "cj") {
      return {
        "받는분성명": r.receiver,
        "받는분전화번호": r.phone,
        "받는분기타연락처": "",
        "받는분우편번호": r.zipcode,
        "받는분주소(전체, 분할)": r.address,
        "기본운임": "신용",
        "박스타입": "극소",
        "박스수량": 1,
        "품목명": itemWithQty,
        "배송메세지1": r.memo,
        "고객주문번호": r.orderId,
      };
    }
    if (preset === "epost") {
      return {
        "우편번호": r.zipcode,
        "주소": r.address,
        "상세주소": "",
        "수취인명": r.receiver,
        "전화번호": r.phone,
        "휴대전화": r.phone,
        "중량(kg)": 1,
        "부피(cm)": 60,
        "내용품코드": "025",
        "내용품명": itemWithQty,
        "배송메시지": r.memo,
      };
    }
    if (preset === "hanjin") {
      return {
        "수하인명": r.receiver,
        "수하인전화": r.phone,
        "수하인핸드폰": r.phone,
        "우편번호": r.zipcode,
        "수하인주소": r.address,
        "수량": 1,
        "품목명": itemWithQty,
        "운임구분": "선불",
        "배송메세지": r.memo,
        "주문번호": r.orderId,
      };
    }
    if (preset === "wholesale") {
      return {
        "주문번호": r.orderId,
        "판매마켓": r.market,
        "수령인": r.receiver,
        "수령인연락처": r.phone,
        "우편번호": r.zipcode,
        "배송지주소": r.address,
        "상품명_옵션": r.item,
        "주문수량": r.qty,
        "배송요청사항": r.memo,
      };
    }
    return {
      "순번": r.seq,
      "마켓": r.market,
      "주문번호": r.orderId,
      "받는분성명": r.receiver,
      "받는분전화번호": r.phone,
      "우편번호": r.zipcode,
      "받는분주소": r.address,
      "품목명(옵션포함)": r.item,
      "수량": r.qty,
      "배송메시지": r.memo,
    };
  });
}

export function toCourierCsv(normalizedRows, preset = "standard") {
  const formatted = formatRowsByPreset(normalizedRows, preset);
  if (formatted.length === 0) return "\uFEFF";
  const header = Object.keys(formatted[0]);
  const esc = (v) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [header.join(",")];
  for (const r of formatted) {
    lines.push(header.map((k) => esc(r[k])).join(","));
  }
  return "\uFEFF" + lines.join("\r\n");
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  // 실제 스마트스토어 발주서처럼 1행에 개인정보 보호 안내문이 포함된 케이스 검증
  const sampleSmartstoreWithNotice = [
    "본 문서는 개인정보가 포함되어 있으므로 목적 달성 후 즉시 파기하시기 바랍니다.,,,,,,,,",
    "상품주문번호,수취인명,수취인연락처1,우편번호,통합배송지,상품명,옵션정보,수량,배송메세지",
    "202611120001,김민수,05012345678,06236,서울특별시 강남구 테헤란로 152 3층,무소음 키보드,블랙/적축,2,경비실에 맡겨주세요",
    "202611120002,김민수,050-1234-5678,06236,서울특별시 강남구 테헤란로 152 3층,팜레스트,우드,1,경비실에 맡겨주세요",
  ].join("\n");
  const sampleCoupang = [
    "묶음배송번호\t수령인\t안심번호\t우편번호\t수취인주소\t상세주소\t노출상품명\t등록옵션명\t구매수량\t배송메시지",
    "99887766\t박지연\t05029998888\t13529\t경기도 성남시 분당구 판교역로 166\t402호\tUSB-C 멀티허브\t실버 7포트\t1\t문 앞 부탁드립니다",
  ].join("\n");

  const rawMerged = [...normalizeOrders(sampleSmartstoreWithNotice), ...normalizeOrders(sampleCoupang)].map((r, i) => ({ ...r, seq: i + 1 }));
  const bundled = consolidateBundles(rawMerged);
  const cjRows = formatRowsByPreset(bundled.rows, "cj");
  console.log(
    JSON.stringify(
      {
        selfTest: true,
        rawCount: rawMerged.length,
        bundledCount: bundled.rows.length,
        savedWaybills: bundled.savedWaybills,
        savedFeeKrw: bundled.savedFeeKrw,
        cjFirstRow: cjRows[0],
      },
      null,
      2
    )
  );
}

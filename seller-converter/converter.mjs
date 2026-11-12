#!/usr/bin/env node
import { fileURLToPath } from "node:url";

/**
 * 6대 오픈마켓(스마트스토어, 쿠팡, 11번가, G마켓, 옥션, 롯데온) 발주서 CSV/TSV 무인 통합 변환 엔진
 * 외부 서버 전송 0건 · 브라우저/로컬 즉시 정규화
 */
const FIELD_ALIASES = {
  orderId: ["주문번호", "상품주문번호", "묶음배송번호", "주문코드", "order_id"],
  market: ["판매채널", "마켓명", "쇼핑몰", "사이트"],
  receiver: ["수취인명", "수령인", "받는분", "받는사람", "수취인이름", "수령인명"],
  phone: ["수취인연락처1", "수취인전화번호", "연락처", "휴대폰번호", "받는분전화번호", "수령인연락처", "안심번호"],
  zipcode: ["우편번호", "배송지우편번호", "새우편번호"],
  address: ["배송지", "통합배송지", "주소", "수취인주소", "받는분주소", "기본주소"],
  addressDetail: ["상세주소", "수취인상세주소", "배송지상세주소"],
  productName: ["상품명", "노출상품명", "주문상품명", "품목명"],
  optionName: ["옵션정보", "옵션", "등록옵션명", "선택사항", "단품명"],
  qty: ["수량", "주문수량", "구매수량", "출고수량"],
  memo: ["배송메세지", "배송메시지", "배송요청사항", "배송시요구사항", "요청사항"],
};

export function parseDelimited(text) {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n").filter((l) => l.trim().length > 0);
  if (lines.length < 2) return { headers: [], rows: [] };
  const sep = lines[0].includes("\t") ? "\t" : ",";
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
  const headers = splitLine(lines[0]).map((h) => h.replace(/^\uFEFF/, "").trim());
  const rows = lines.slice(1).map(splitLine);
  return { headers, rows };
}

function detectMarketFromHeaders(headers) {
  const joined = headers.join("|");
  if (joined.includes("상품주문번호") && joined.includes("통합배송지")) return "스마트스토어";
  if (joined.includes("묶음배송번호") || joined.includes("노출상품명")) return "쿠팡";
  if (joined.includes("주문코드") && joined.includes("배송시요구사항")) return "롯데온";
  if (joined.includes("선택사항")) return "11번가";
  if (joined.includes("안심번호")) return "G마켓/옥션";
  return "자동감지마켓";
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

  return rows.map((cols, idx) => {
    const get = (k) => (map[k] >= 0 && cols[map[k]] !== undefined ? cols[map[k]].trim() : "");
    const fullAddress = [get("address"), get("addressDetail")].filter(Boolean).join(" ").trim();
    const itemLabel = [get("productName"), get("optionName")].filter(Boolean).join(" / ");
    return {
      seq: idx + 1,
      market: get("market") || marketGuess,
      orderId: get("orderId") || `AUTO-${idx + 1}`,
      receiver: get("receiver"),
      phone: get("phone"),
      zipcode: get("zipcode"),
      address: fullAddress,
      item: itemLabel,
      qty: Number.parseInt(get("qty") || "1", 10) || 1,
      memo: get("memo") || "부재 시 문 앞",
    };
  }).filter((r) => r.receiver || r.address || r.item);
}

export function toCourierCsv(normalizedRows) {
  const header = ["순번", "마켓", "주문번호", "받는분성명", "받는분전화번호", "우편번호", "받는분주소", "품목명(옵션포함)", "수량", "배송메시지"];
  const esc = (v) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [header.join(",")];
  for (const r of normalizedRows) {
    lines.push([r.seq, r.market, r.orderId, r.receiver, r.phone, r.zipcode, r.address, r.item, r.qty, r.memo].map(esc).join(","));
  }
  return "\uFEFF" + lines.join("\r\n");
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  const sampleSmartstore = [
    "상품주문번호,수취인명,수취인연락처1,우편번호,통합배송지,상품명,옵션정보,수량,배송메세지",
    "202611120001,김민수,050-1234-5678,06236,서울특별시 강남구 테헤란로 152 3층,무소음 키보드,블랙/적축,2,경비실에 맡겨주세요",
  ].join("\n");
  const sampleCoupang = [
    "묶음배송번호\t수령인\t안심번호\t우편번호\t수취인주소\t상세주소\t노출상품명\t등록옵션명\t구매수량\t배송메시지",
    "99887766\t박지연\t0502-999-8888\t13529\t경기도 성남시 분당구 판교역로 166\t402호\tUSB-C 멀티허브\t실버 7포트\t1\t문 앞 부탁드립니다",
  ].join("\n");

  const merged = [...normalizeOrders(sampleSmartstore), ...normalizeOrders(sampleCoupang)].map((r, i) => ({ ...r, seq: i + 1 }));
  console.log(JSON.stringify({ selfTest: true, count: merged.length, rows: merged, csvPreview: toCourierCsv(merged).slice(0, 220) }, null, 2));
}

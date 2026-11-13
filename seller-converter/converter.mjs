#!/usr/bin/env node
import { fileURLToPath } from "node:url";

/**
 * 6대 오픈마켓(스마트스토어, 쿠팡 윙, 11번가, G마켓·옥션 ESM+, 카페24, 롯데온·오늘의집) 발주서 무인 통합 변환 엔진
 * - 스마트스토어/오픈마켓 상단 개인정보 안내문 병합 행(콤마 포함) 뒤 탭 구분자 자동 판별
 * - 단일상품(옵션정보 빈칸, 옵션가격=0) '[0]' 오매칭 차단 및 배송지우편번호/출고지주소 오매칭 차단
 * - 취소완료·반품요청·환불 주문 행 자동 제외(취소철회 정상 주문은 보존)
 * - 050 안심번호가 달라도 성명+정규화 주소 기준 합포장 병합(중복 택배비 방지)
 * 외부 서버 전송 0건 · 브라우저/로컬 즉시 정규화
 */
const FIELD_ALIASES = {
  orderId: ["상품주문번호", "품목별주문번호", "주문번호", "묶음배송번호", "장바구니번호", "주문코드", "고객주문번호", "order_id"],
  market: ["판매채널", "마켓명", "쇼핑몰", "사이트", "주문경로"],
  receiver: ["수취인명", "수취인이름", "수령인명", "수령인", "수령자명", "받는분성명", "받는분", "받는사람", "받으시는분"],
  phone: ["수취인연락처1", "수취인전화번호", "수령인휴대폰", "수령인휴대전화", "휴대폰번호", "안심번호", "수취인연락처2", "받는분전화번호", "수령인연락처", "연락처", "주문자연락처"],
  zipcode: ["우편번호", "수취인우편번호", "배송지우편번호", "받는분우편번호", "새우편번호"],
  address: ["통합배송지", "수취인주소", "수취인기본주소", "수령인주소", "배송지주소", "받는분주소(전체,분할)", "받는분주소", "수하인주소", "배달주소", "기본주소", "배송지", "주소"],
  addressDetail: ["수취인상세주소", "수령인상세주소", "배송지상세주소", "상세주소", "나머지주소"],
  productName: ["상품명", "노출상품명", "주문상품명", "품목명", "물품명", "단품명"],
  optionName: ["옵션정보", "옵션명", "등록옵션명", "주문옵션", "옵션내용", "선택사항", "옵션"],
  qty: ["수량", "구매수(수량)", "구매수량", "주문수량", "출고수량", "결제수량", "구매수"],
  memo: ["배송메세지", "배송메시지", "배송요청사항", "배송시요구사항", "배송메세지1", "요청사항"],
  claimStatus: ["클레임상태", "취소상태", "반품상태"],
  orderStatus: ["주문상태", "주문상세상태", "발주상태", "배송상태"],
};

const FIELD_EXCLUDES = {
  orderId: /우편|전화|연락처|송장|운송장|사업자|주민|통관/,
  receiver: /연락처|전화|휴대|주소|우편|메시지|메세지|은행|계좌|환불|통관/,
  phone: /판매자|출고|반품|발송인|보내는|사업자/,
  zipcode: /출고|반품|판매자/,
  address: /상세|나머지|우편|번호|메시지|메세지|메모|요청|출고|반품|교환|발송지|판매자|구매자|주문자|이메일|메일|도서|산간|운임|구역/,
  addressDetail: /출고|반품|교환|판매자|구매자|주문자|우편|번호/,
  productName: /번호|코드|금액|가격|단가|할인|수수료|배송비|상태|문의|사은품/,
  optionName: /가격|금액|비용|코드|번호|관리|수량|여부|추가상품|상태|종류/,
  qty: /재고|취소|반품|환불|교환|가능|한도|최대|최소|박스|묶음|금액|단가|가격|할인|미출고/,
  memo: /번호|코드/,
  claimStatus: /번호|일시|일자|사유|금액|수량/,
  orderStatus: /번호|일시|일자|사유|금액/,
};

const normHeaderKey = (s) => String(s ?? "").replace(/[\s\r\n\uFEFF]+/g, "").toLowerCase();

export function detectTextDelimiter(cleaned) {
  const sample = String(cleaned ?? "").split(/\r?\n/).slice(0, 15);
  let tabRich = 0;
  let commaRich = 0;
  for (const line of sample) {
    if ((line.match(/\t/g) || []).length >= 2) tabRich += 1;
    if ((line.match(/,/g) || []).length >= 2) commaRich += 1;
  }
  if (tabRich > 0) return "\t";
  if (commaRich > 0) return ",";
  return String(cleaned ?? "").includes("\t") ? "\t" : ",";
}

export function findHeaderRowIndex(matrixRows) {
  const maxScan = Math.min(matrixRows.length, 20);
  const receiverRe = /수취인|수령인|수령자|받는분|받는사람|받으시는분/;
  const orderRe = /상품|품목|단품|주소|배송지|주문번호|묶음배송|장바구니|연락처|전화|휴대/;
  for (let i = 0; i < maxScan; i++) {
    const joined = (matrixRows[i] || []).map((c) => String(c ?? "").replace(/\s+/g, "")).join("|");
    if (receiverRe.test(joined) && orderRe.test(joined)) {
      return i;
    }
  }
  return 0;
}

export function parseDelimitedMatrix(text, delim) {
  const rows = [];
  let row = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQ = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQ = true;
    } else if (ch === delim) {
      row.push(cur.replace(/^\uFEFF/, "").trim());
      cur = "";
    } else if (ch === "\r") {
      if (text[i + 1] === "\n") i++;
      row.push(cur.replace(/^\uFEFF/, "").trim());
      if (row.some((c) => c.length > 0)) rows.push(row);
      row = [];
      cur = "";
    } else if (ch === "\n") {
      row.push(cur.replace(/^\uFEFF/, "").trim());
      if (row.some((c) => c.length > 0)) rows.push(row);
      row = [];
      cur = "";
    } else {
      cur += ch;
    }
  }
  if (cur.length > 0 || row.length > 0) {
    row.push(cur.replace(/^\uFEFF/, "").trim());
    if (row.some((c) => c.length > 0)) rows.push(row);
  }
  return rows;
}

export function parseDelimited(text) {
  const cleaned = String(text ?? "").replace(/^\uFEFF/, "").trim();
  if (!cleaned) return { headers: [], rows: [], skippedNoticeRows: 0 };
  const sep = detectTextDelimiter(cleaned);
  const matrix = parseDelimitedMatrix(cleaned, sep);
  if (matrix.length < 2) return { headers: [], rows: [], skippedNoticeRows: 0 };
  const headerIdx = findHeaderRowIndex(matrix);
  const headers = matrix[headerIdx] || [];
  const rows = matrix.slice(headerIdx + 1);
  return { headers, rows, skippedNoticeRows: headerIdx };
}

function detectMarketFromHeaders(headers) {
  const joined = headers.join("|");
  if (joined.includes("상품주문번호") || joined.includes("스마트스토어")) return "스마트스토어";
  if (joined.includes("묶음배송번호") || joined.includes("노출상품명") || joined.includes("수취인이름")) return "쿠팡";
  if (joined.includes("주문코드") && joined.includes("배송시요구사항")) return "롯데온";
  if (joined.includes("장바구니번호")) return "G마켓·옥션";
  if (joined.includes("수령인 휴대전화") || joined.includes("수령인휴대전화")) return "카페24";
  if (joined.includes("선택사항") || joined.includes("배송지주소")) return "11번가";
  return "자동감지마켓";
}

export function formatPhone(p) {
  let digits = String(p || "").replace(/[^0-9]/g, "");
  if (digits.length === 10 && /^(10|11|16|17|18|19)/.test(digits)) digits = "0" + digits;
  if (digits.length === 11 && digits.startsWith("50")) digits = "0" + digits;
  if (digits.length === 9 && digits.startsWith("2")) digits = "0" + digits;
  if (digits.length === 9 && digits.startsWith("02")) return digits.replace(/(\d{2})(\d{3})(\d{4})/, "$1-$2-$3");
  if (digits.length === 10 && digits.startsWith("02")) return digits.replace(/(\d{2})(\d{4})(\d{4})/, "$1-$2-$3");
  if (digits.length === 11) return digits.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
  if (digits.length === 10) return digits.replace(/(\d{3})(\d{3})(\d{4})/, "$1-$2-$3");
  if (digits.length === 12 && digits.startsWith("050")) return digits.replace(/(\d{4})(\d{4})(\d{4})/, "$1-$2-$3");
  return String(p || "").trim();
}

export function formatZip(z) {
  const digits = String(z || "").replace(/[^0-9]/g, "");
  if (digits.length === 4) return "0" + digits;
  return digits || String(z || "").trim();
}

function pickFromRow(headers, cols, fieldKey) {
  const aliases = FIELD_ALIASES[fieldKey] || [];
  const excludeRe = FIELD_EXCLUDES[fieldKey] || null;
  for (const alias of aliases) {
    const targetExact = normHeaderKey(alias);
    for (let i = 0; i < headers.length; i++) {
      if (normHeaderKey(headers[i]) === targetExact) {
        const val = String(cols[i] ?? "").trim();
        if (val !== "") return val;
      }
    }
  }
  for (const alias of aliases) {
    const target = normHeaderKey(alias);
    for (let i = 0; i < headers.length; i++) {
      const cleanKey = String(headers[i] ?? "").replace(/[\s\r\n\uFEFF]+/g, "");
      if (excludeRe && excludeRe.test(cleanKey)) continue;
      if (cleanKey.toLowerCase().includes(target)) {
        const val = String(cols[i] ?? "").trim();
        if (val !== "") return val;
      }
    }
  }
  return "";
}

export function normalizeOrders(rawText, defaultMarket = "") {
  const { headers, rows } = parseDelimited(rawText);
  if (headers.length === 0) return [];
  const marketGuess = defaultMarket || detectMarketFromHeaders(headers);

  const out = [];
  for (let idx = 0; idx < rows.length; idx++) {
    const cols = rows[idx];
    const get = (k) => pickFromRow(headers, cols, k);
    const receiver = get("receiver");
    const prod = get("productName");
    if ((!receiver && !prod) || /^(수취인명|수취인이름|수령인명|수령인|수령자명|받는분|받는분성명)$/.test(receiver)) continue;

    const statusCombined = `${get("claimStatus")} ${get("orderStatus")}`.trim();
    if (
      statusCombined &&
      !/철회|거부/.test(statusCombined) &&
      /취소완료|취소요청|취소진행|주문취소|결제취소|직권취소|판매취소|반품요청|반품진행|반품완료|반품접수|환불완료|환불진행|환불요청/.test(statusCombined)
    ) {
      continue;
    }

    const addrBase = get("address");
    const addrDetail = get("addressDetail");
    const fullAddress = (addrBase + (addrDetail && !addrBase.includes(addrDetail) ? " " + addrDetail : "")).replace(/\s+/g, " ").trim();
    let opt = get("optionName");
    if (/^(-|없음|단일상품|단품|해당없음|none|null)$/i.test(opt)) opt = "";
    const itemLabel = (prod + (opt ? ` [${opt}]` : "")).trim();
    const qty = Number.parseInt(get("qty").replace(/[^0-9]/g, "") || "1", 10) || 1;

    out.push({
      seq: out.length + 1,
      market: get("market") || marketGuess,
      orderId: get("orderId") || `AUTO-${idx + 1}`,
      receiver,
      phone: formatPhone(get("phone")),
      zipcode: formatZip(get("zipcode")),
      address: fullAddress,
      item: itemLabel,
      qty,
      memo: (get("memo") || "문 앞").replace(/\s+/g, " ").trim(),
    });
  }
  return out;
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

export function summarizePickingList(rows) {
  const map = new Map();
  for (const r of rows) {
    const itemName = String(r.item || r["상품및옵션"] || "").trim();
    if (!itemName) continue;
    const qty = Number.parseInt(String(r.qty || r["수량"] || "1"), 10) || 1;
    const market = String(r.market || r["마켓구분"] || "오픈마켓").trim();
    if (!map.has(itemName)) {
      map.set(itemName, { item: itemName, totalQty: 0, orderCount: 0, markets: new Set() });
    }
    const entry = map.get(itemName);
    entry.totalQty += qty;
    entry.orderCount += 1;
    if (market) entry.markets.add(market);
  }
  return [...map.values()]
    .sort((a, b) => b.totalQty - a.totalQty || a.item.localeCompare(b.item, "ko"))
    .map((e, idx) => ({
      seq: idx + 1,
      item: e.item,
      totalQty: e.totalQty,
      orderCount: e.orderCount,
      markets: [...e.markets].join(", "),
    }));
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

function inferMarketByOrderId(orderId) {
  const id = String(orderId || "").trim();
  if (/^\d{8}-\d{4,10}$/.test(id)) return "카페24";
  if (/^20\d{12,14}$/.test(id)) return "스마트스토어";
  if (/^[1-3]\d{11,12}$/.test(id)) return "쿠팡";
  if (/^11ST/i.test(id)) return "11번가";
  if (/^\d{9,10}$/.test(id)) return "G마켓·옥션";
  return "오픈마켓";
}

export function splitWaybillTracking(rawText, defaultCourier = "CJ대한통운", knownOrders = []) {
  const cleaned = String(rawText ?? "").replace(/^\uFEFF/, "").trim();
  if (!cleaned) return [];
  const sep = detectTextDelimiter(cleaned);
  const matrix = parseDelimitedMatrix(cleaned, sep);
  if (matrix.length < 2) return [];

  let headerIdx = 0;
  for (let i = 0; i < Math.min(matrix.length, 15); i++) {
    const joined = (matrix[i] || []).map((c) => String(c ?? "").replace(/\s+/g, "")).join("|");
    if (/운송장|송장|등기번호|화물추적/.test(joined) && /주문|참조|받는분|수취인|수하인|수령인/.test(joined)) {
      headerIdx = i;
      break;
    }
  }
  const headers = matrix[headerIdx] || [];
  const knownMap = new Map();
  for (const ko of knownOrders) {
    const oid = String(ko.orderId || ko["주문번호"] || "").trim();
    if (oid) knownMap.set(oid, ko);
  }

  const pickTrack = (cols, aliases, excludeRe) => {
    for (const alias of aliases) {
      const target = normHeaderKey(alias);
      for (let i = 0; i < headers.length; i++) {
        if (normHeaderKey(headers[i]) === target) {
          const val = String(cols[i] ?? "").trim();
          if (val !== "") return val;
        }
      }
    }
    for (const alias of aliases) {
      const target = normHeaderKey(alias);
      for (let i = 0; i < headers.length; i++) {
        const cleanKey = String(headers[i] ?? "").replace(/[\s\r\n\uFEFF]+/g, "");
        if (excludeRe && excludeRe.test(cleanKey)) continue;
        if (cleanKey.toLowerCase().includes(target)) {
          const val = String(cols[i] ?? "").trim();
          if (val !== "") return val;
        }
      }
    }
    return "";
  };

  const out = [];
  const seenPair = new Set();
  for (let rIdx = headerIdx + 1; rIdx < matrix.length; rIdx++) {
    const cols = matrix[rIdx] || [];
    const rawOrderIds = pickTrack(
      cols,
      ["고객주문번호", "상품주문번호", "주문번호", "묶음배송번호", "장바구니번호", "주문코드", "참조번호"],
      /우편|전화|연락처|운송장|송장|등기/
    );
    const rawWaybill = pickTrack(cols, ["운송장번호", "송장번호", "등기번호", "화물추적번호", "운송장", "송장"], /상태|일자|일시|출력/);
    const cleanWaybill = rawWaybill.replace(/[^0-9]/g, "");
    if (!rawOrderIds || !cleanWaybill) continue;

    const courier = pickTrack(cols, ["택배사", "택배사명", "배송업체", "운송사"], /번호|코드/) || defaultCourier;
    const receiver = pickTrack(cols, ["받는분성명", "받는분", "수취인명", "수하인명", "수령인", "수취인"], /전화|연락처|주소|우편/);
    const splitIds = rawOrderIds
      .split(/[,/|+;\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const isBundled = splitIds.length > 1;

    for (const oid of splitIds) {
      const dedupeKey = `${oid}|${cleanWaybill}`;
      if (seenPair.has(dedupeKey)) continue;
      seenPair.add(dedupeKey);
      const matched = knownMap.get(oid);
      const market = matched ? (matched.market || matched["마켓구분"]) : inferMarketByOrderId(oid);
      const finalReceiver = receiver || (matched ? (matched.receiver || matched["수취인명"]) : "");
      out.push({
        market,
        orderId: oid,
        receiver: finalReceiver,
        courier,
        waybillNo: cleanWaybill,
        bundled: isBundled,
      });
    }
  }
  return out;
}

export function formatTrackingForMarket(splitRows, target = "all") {
  const filtered =
    target === "smartstore"
      ? splitRows.filter((r) => r.market === "스마트스토어")
      : target === "coupang"
        ? splitRows.filter((r) => r.market === "쿠팡")
        : target === "other"
          ? splitRows.filter((r) => r.market !== "스마트스토어" && r.market !== "쿠팡")
          : splitRows;
  const source = filtered.length > 0 ? filtered : splitRows;

  return source.map((r, idx) => {
    if (target === "smartstore") {
      return {
        "상품주문번호": r.orderId,
        "배송방법": "택배,등기,소포",
        "택배사": r.courier,
        "송장번호": r.waybillNo,
      };
    }
    if (target === "coupang") {
      return {
        "번호": idx + 1,
        "묶음배송번호": r.orderId,
        "택배사": r.courier,
        "운송장번호": r.waybillNo,
        "분리배송 Y/N": "N",
      };
    }
    if (target === "other") {
      return {
        "마켓구분": r.market,
        "주문번호": r.orderId,
        "택배사": r.courier,
        "운송장번호": r.waybillNo,
        "수취인명": r.receiver,
      };
    }
    return {
      "순번": idx + 1,
      "마켓구분": r.market,
      "주문번호": r.orderId,
      "수취인명": r.receiver,
      "택배사": r.courier,
      "운송장번호": r.waybillNo,
      "합포장분리": r.bundled ? "합포장자동분리" : "단건",
    };
  });
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  // 1) 스마트스토어 암호 엑셀 Ctrl+A 복사본: 1행 병합 안내문(콤마 포함, 탭 없음) + 단일상품(옵션정보 빈칸, 옵션가격=0) + 취소완료 행 + 취소철회 행
  const sampleSmartstoreTsv = [
    "본 문서는 개인정보가 포함되어 있으므로, 목적 달성 후 즉시 파기하시기 바랍니다.",
    "상품주문번호\t클레임상태\t수취인명\t수취인연락처1\t배송지우편번호\t통합배송지\t상품명\t옵션정보\t옵션관리코드\t재고수량\t수량\t옵션가격\t배송메세지",
    "202611130001\t\t김민수\t050712345678\t6236\t서울특별시 강남구 테헤란로 152 3층\t무소음 키보드\t\tOPT-01\t999\t2\t0\t\"문 앞\n벨 누르지 마세요\"",
    "202611130002\t취소완료\t홍길동\t01099998888\t04799\t서울 성동구 아차산로 113\t취소된 마우스\t블랙\t\t50\t1\t0\t문 앞",
    "202611130003\t취소철회\t김민수\t050799991111\t06236\t서울특별시 강남구 테헤란로 152, 3층\t전용 팜레스트\t우드\t\t30\t1\t3000\t문 앞",
  ].join("\n");

  // 2) 11번가 셀러오피스: 배송지우편번호가 배송지주소보다 앞에 있고 출고지주소가 먼저 나오는 경우
  const sample11stCsv = [
    "주문번호,주문상태,수령인,휴대폰번호,출고지주소,배송지우편번호,배송지주소,상품명,선택사항,구매수량,배송메시지",
    "11ST-8801,발송대기,박지연,1029486610,경기도 이천시 물류센터로 1,13529,경기도 성남시 분당구 판교역로 166 402호,USB-C 멀티허브,단일상품,1,경비실",
  ].join("\n");

  const parsedNaver = normalizeOrders(sampleSmartstoreTsv);
  const parsed11st = normalizeOrders(sample11stCsv);
  const allParsed = [...parsedNaver, ...parsed11st];
  const bundled = consolidateBundles(allParsed);
  const pickingList = summarizePickingList(allParsed);

  // 3) CJ 로이스파셀 출력 운송장 엑셀(합포장 콤마 병합 주문번호 포함) → 마켓별 발송처리 역변환 검증
  const sampleLoisTrackingTsv = [
    "받는분성명\t운송장번호\t고객주문번호",
    "김민수\t6512-9910-3381\t20261113884120,3100948271055",
    "박지연\t6512-9910-3382\t11ST-8801",
  ].join("\n");
  const splitRows = splitWaybillTracking(sampleLoisTrackingTsv, "CJ대한통운");
  const smartstoreUpload = formatTrackingForMarket(splitRows, "smartstore");
  const coupangUpload = formatTrackingForMarket(splitRows, "coupang");

  const assertions = [
    [parsedNaver.length === 2, "취소완료 1건 제외 및 취소철회 1건 보존"],
    [parsedNaver[0].item === "무소음 키보드", `단일상품 옵션가격 0 오매칭 차단 (실제: ${parsedNaver[0].item})`],
    [parsedNaver[0].qty === 2, `재고수량(999) 오매칭 차단 (실제: ${parsedNaver[0].qty})`],
    [parsedNaver[0].zipcode === "06236", `서울 4자리 우편번호 0 복원 (실제: ${parsedNaver[0].zipcode})`],
    [parsed11st[0].address === "경기도 성남시 분당구 판교역로 166 402호", `배송지우편번호·출고지주소 오매칭 차단 (실제: ${parsed11st[0].address})`],
    [parsed11st[0].phone === "010-2948-6610", `앞자리 0 누락 휴대폰 복원 (실제: ${parsed11st[0].phone})`],
    [parsed11st[0].item === "USB-C 멀티허브", `'단일상품' 옵션 텍스트 제거 (실제: ${parsed11st[0].item})`],
    [bundled.rows.length === 2 && bundled.savedWaybills === 1, "서로 다른 0507 안심번호 동일 주소 합포장 병합"],
    [splitRows.length === 3 && splitRows[0].waybillNo === "651299103381", "합포장 운송장 주문번호 자동 분리 및 숫자 정규화"],
    [smartstoreUpload.length === 1 && smartstoreUpload[0]["상품주문번호"] === "20261113884120", "스마트스토어 발송처리 양식 자동 추출"],
    [coupangUpload.length === 1 && coupangUpload[0]["묶음배송번호"] === "3100948271055", "쿠팡 윙 운송장 등록 양식 자동 추출"],
    [pickingList.length === 3 && pickingList[0].item === "무소음 키보드" && pickingList[0].totalQty === 2, "품목·옵션별 창고 피킹 총량 집계 검증"],
  ];

  const failed = assertions.filter(([ok]) => !ok).map(([, msg]) => msg);
  if (failed.length > 0) {
    console.error("SELF_TEST_FAILED:", failed);
    process.exit(1);
  }
  console.log(
    JSON.stringify(
      {
        selfTest: "PASS",
        checksPassed: assertions.length,
        bundledCount: bundled.rows.length,
        savedWaybills: bundled.savedWaybills,
        rows: bundled.rows,
      },
      null,
      2
    )
  );
}

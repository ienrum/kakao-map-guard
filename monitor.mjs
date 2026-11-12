#!/usr/bin/env node
import https from "node:https";
import http from "node:http";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * 무인 일일 웹사이트 지도 스크립트·SSL·HTTP 생존 점검기
 * 단건 실행: node monitor.mjs https://example.com
 * 배치 실행: node monitor.mjs --batch targets.json
 */
export function scanHtmlForLegacyMap(html) {
  const issues = [];
  const strippedInlineScripts = html.replace(/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/gi, "");
  const scriptSrcs = [...strippedInlineScripts.matchAll(/<script[^>]+src=["']([^"']+)["']/gi)]
    .map((m) => m[1])
    .filter((src) => !/\/postcode\//i.test(src));
  const joinedSrcs = scriptSrcs.join("\n");
  if (/apis\.daum\.net|map\.daum\.net|daumcdn\.net\/(mapjsapi|dmaps\/map_js_init)/i.test(joinedSrcs)) {
    issues.push("LEGACY_DAUMCDN_MAP_SCRIPT");
  }
  if (/^http:\/\/(dapi\.kakao\.com|t1\.daumcdn\.net|ssl\.daumcdn\.net)/im.test(joinedSrcs)) {
    issues.push("INSECURE_HTTP_KAKAO_SDK");
  }
  if (/document\.write\s*\([^)]*(daumcdn\.net|dapi\.kakao\.com|apis\.daum\.net)/i.test(strippedInlineScripts)) {
    issues.push("SYNC_DOCUMENT_WRITE_LOADER");
  }
  return issues;
}

export function checkSite(targetUrl, timeoutMs = 10000, expectSubstring = null) {
  return new Promise((resolve) => {
    let parsed;
    try {
      parsed = new URL(targetUrl);
    } catch {
      resolve({ url: targetUrl, checkedAt: new Date().toISOString(), statusCode: 0, certDaysLeft: null, issues: ["INVALID_URL"], healthy: false });
      return;
    }
    const client = parsed.protocol === "https:" ? https : http;
    const req = client.get(
      targetUrl,
      { timeout: timeoutMs, headers: { "User-Agent": "KakaoMapGuardMonitor/1.1" } },
      (res) => {
        let certDaysLeft = null;
        if (res.socket && typeof res.socket.getPeerCertificate === "function") {
          const cert = res.socket.getPeerCertificate();
          if (cert && cert.valid_to) {
            certDaysLeft = Math.floor((Date.parse(cert.valid_to) - Date.now()) / 86400000);
          }
        }
        let body = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          if (body.length < 250000) body += chunk;
        });
        res.on("end", () => {
          const issues = scanHtmlForLegacyMap(body);
          if (res.statusCode >= 400) issues.push(`HTTP_STATUS_${res.statusCode}`);
          if (certDaysLeft !== null && certDaysLeft < 14) issues.push(`SSL_EXPIRING_${certDaysLeft}D`);
          if (expectSubstring && !body.includes(expectSubstring)) issues.push(`MISSING_SUBSTRING:${expectSubstring}`);
          resolve({
            url: targetUrl,
            checkedAt: new Date().toISOString(),
            statusCode: res.statusCode,
            certDaysLeft,
            issues,
            healthy: issues.length === 0,
          });
        });
      }
    );
    req.on("timeout", () => {
      req.destroy();
      resolve({ url: targetUrl, checkedAt: new Date().toISOString(), statusCode: 0, certDaysLeft: null, issues: ["TIMEOUT"], healthy: false });
    });
    req.on("error", (err) => {
      resolve({ url: targetUrl, checkedAt: new Date().toISOString(), statusCode: 0, certDaysLeft: null, issues: [`ERROR:${err.code || err.message}`], healthy: false });
    });
  });
}

if (fileURLToPath(import.meta.url) === process.argv[1]) {
  const arg1 = process.argv[2];
  if (!arg1) {
    const sample = `<script src="http://dapi.kakao.com/v2/maps/sdk.js"></script><script src="//apis.daum.net/maps/maps3.js"></script>`;
    console.log(JSON.stringify({ selfTest: true, detected: scanHtmlForLegacyMap(sample) }));
    process.exit(0);
  }
  if (arg1 === "--batch") {
    const filePath = process.argv[3] || "targets.json";
    const targets = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const results = [];
    for (const item of targets) {
      const r = await checkSite(item.url, 10000, item.expectSubstring || null);
      results.push({ name: item.name || item.url, notify: item.email || null, ...r });
    }
    const summary = {
      checkedCount: results.length,
      unhealthyCount: results.filter((r) => !r.healthy).length,
      results,
    };
    console.log(JSON.stringify(summary, null, 2));
    process.exit(0);
  }
  const report = await checkSite(arg1);
  console.log(JSON.stringify(report, null, 2));
}

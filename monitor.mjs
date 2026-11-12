#!/usr/bin/env node
import https from "node:https";
import http from "node:http";
import { fileURLToPath } from "node:url";

/**
 * 무인 일일 웹사이트 지도 스크립트·SSL·HTTP 생존 점검기
 * 사용법: node monitor.mjs https://example.com
 */
export function scanHtmlForLegacyMap(html) {
  const issues = [];
  if (/daumcdn\.net\/mapjsapi|map\.daum\.net|apis\.daum\.net/i.test(html)) {
    issues.push("LEGACY_DAUMCDN_MAP_SCRIPT");
  }
  if (/http:\/\/dapi\.kakao\.com/i.test(html)) {
    issues.push("INSECURE_HTTP_KAKAO_SDK");
  }
  return issues;
}

export function checkSite(targetUrl, timeoutMs = 10000) {
  return new Promise((resolve) => {
    const parsed = new URL(targetUrl);
    const client = parsed.protocol === "https:" ? https : http;
    const req = client.get(
      targetUrl,
      { timeout: timeoutMs, headers: { "User-Agent": "PassiveGuardMonitor/1.0" } },
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
  const target = process.argv[2];
  if (!target) {
    const sample = `<script src="http://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"></script><script src="//apis.daum.net/maps/maps3.js"></script>`;
    console.log(JSON.stringify({ selfTest: true, detected: scanHtmlForLegacyMap(sample) }));
    process.exit(0);
  }
  const report = await checkSite(target);
  console.log(JSON.stringify(report, null, 2));
}

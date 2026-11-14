/* 오커 웍스 무료 체험 실행 계측 (개인정보 0 Byte: 붙여넣은 내용은 전송하지 않고 '실행 여부'만 기록) */
(function () {
  var TRIAL_IDS = [
    'btnHeroSampleMap', 'btnSampleHospital', 'btnAddressOnlyMode', 'btnSampleBranches', 'btnSynthesize', 'btnJumpWorkbench', 'btnCopyQuickMap', 'btnDaumQuickGo',
    'btnSampleOrders', 'btnHeroSample', 'btnRunPaste', 'btnTrackSample', 'btnRunTrackSplit', 'btnDownloadXlsx', 'btnDownloadCsv', 'btnDownloadPickingXlsx', 'btnPrintPicking',
    'btnBridgeRun', 'btnJumpWholesale', 'btnDownloadBlankXlsx', 'btnAutoFillCourier', 'btnGoPresetWorkbench', 'btnErpQuickJump',
    'btnHeroSamplePhp', 'btnSampleYoungcart', 'btnRunPhpAudit', 'btnDownloadDiag', 'btnHeroDiagDownload', 'btnQuickPhpJump', 'btnCopyQuickPhp'
  ];
  var scriptEl = document.currentScript || document.querySelector('script[src*="ow-trial-track.js"]');
  var siteBase = '/';
  try {
    if (scriptEl && scriptEl.src) {
      siteBase = scriptEl.src.replace(/assets\/ow-trial-track\.js(?:\?.*)?$/, '');
    }
  } catch (e) {}
  var tool = /seller-converter/.test(location.pathname)
    ? 'seller'
    : (/kcp-exec-patch/.test(location.pathname) ? 'kcp' : 'map');
  function applyUrlPass() {
    var rawPass = '';
    try {
      rawPass = (new URLSearchParams(location.search).get('pass') || '').trim().toUpperCase();
    } catch (e) {}
    if (rawPass !== 'PASS-2026-PRO') return;
    try { localStorage.setItem('ow_pro_pass', 'PASS-2026-PRO'); } catch (e) {}
    try {
      if (typeof gtag === 'function') {
        gtag('event', 'ow_pass_unlock_url', { tool_name: tool, send_to: 'AW-17208942339' });
      }
    } catch (e) {}
    function renderGlobalPassBanner() {
      if (document.querySelector('#mapPassInput, #passInput, #phpPassInput, #passCodeInput, #quickMapPassInput, #quickPhpPassInput')) return;
      if (document.getElementById('owGlobalPassBanner')) return;
      var host = document.querySelector('main') || document.body;
      if (!host) return;
      var wrap = document.createElement('div');
      wrap.className = 'ow-container';
      wrap.id = 'owGlobalPassBanner';
      wrap.style.cssText = 'padding-top:16px;';
      var box = document.createElement('div');
      box.setAttribute('role', 'status');
      box.style.cssText = 'background:#ecfdf5;border:1px solid #6ee7b7;border-radius:10px;padding:14px 18px;color:#065f46;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;';
      var msg = document.createElement('div');
      msg.innerHTML = '<strong style="display:block;font-size:0.95rem;">PASS-2026-PRO 30일 무제한 패스가 이 브라우저에 자동 등록되었습니다</strong><span style="font-size:0.84rem;opacity:0.9;">아래 작업 도구를 열면 무제한 생성·엑셀 다운로드가 즉시 활성화됩니다.</span>';
      var links = document.createElement('div');
      links.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;';
      var targets = [
        { label: '발주서 통합기 열기 →', href: siteBase + 'seller-converter/#workbench' },
        { label: '카카오 지도 복구 열기 →', href: siteBase + '#workbench' },
        { label: '영카트 KCP 복구 열기 →', href: siteBase + 'kcp-exec-patch/#workbench' }
      ];
      targets.forEach(function (item) {
        var a = document.createElement('a');
        a.href = item.href;
        a.textContent = item.label;
        a.className = 'ow-btn ow-btn-primary';
        a.style.cssText = 'min-height:34px;padding:6px 12px;font-size:0.8125rem;text-decoration:none;';
        links.appendChild(a);
      });
      box.appendChild(msg);
      box.appendChild(links);
      wrap.appendChild(box);
      host.insertBefore(wrap, host.firstChild);
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', renderGlobalPassBanner);
    } else {
      renderGlobalPassBanner();
    }
  }
  applyUrlPass();
  function fire(action) {
    var key = 'ow_trial_' + tool + '_' + action;
    try { if (sessionStorage.getItem(key)) return; sessionStorage.setItem(key, '1'); } catch (e) {}
    try {
      if (typeof gtag === 'function') {
        gtag('event', 'ow_free_trial', { tool_name: tool, trial_action: action, send_to: 'AW-17208942339' });
      }
    } catch (e) {}
  }
  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('button, a') : null;
    if (el && el.id && TRIAL_IDS.indexOf(el.id) !== -1) fire(el.id);
  }, true);
  document.addEventListener('paste', function (e) {
    var t = e.target;
    if (t && (t.tagName === 'TEXTAREA' || t.tagName === 'INPUT')) fire('paste');
  }, true);
  document.addEventListener('drop', function () { fire('file_drop'); }, true);
})();

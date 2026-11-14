/* 오커 웍스 무료 체험 실행 계측 (개인정보 0 Byte: 붙여넣은 내용은 전송하지 않고 '실행 여부'만 기록) */
(function () {
  var TRIAL_IDS = [
    'btnHeroSampleMap', 'btnSampleHospital', 'btnSampleBranches', 'btnSynthesize', 'btnJumpWorkbench', 'btnCopyQuickMap',
    'btnSampleOrders', 'btnHeroSample', 'btnRunPaste', 'btnTrackSample', 'btnRunTrackSplit', 'btnDownloadXlsx', 'btnDownloadCsv', 'btnDownloadPickingXlsx', 'btnPrintPicking',
    'btnHeroSamplePhp', 'btnSampleYoungcart', 'btnRunPhpAudit', 'btnDownloadDiag', 'btnHeroDiagDownload', 'btnQuickPhpJump', 'btnCopyQuickPhp'
  ];
  var tool = /seller-converter/.test(location.pathname)
    ? 'seller'
    : (/kcp-exec-patch/.test(location.pathname) ? 'kcp' : 'map');
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

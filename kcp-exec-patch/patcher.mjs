/**
 * Ohker Works — PHP exec() Blocking Auditor & NHN KCP cURL REST Adapter Synthesizer
 * Zero-Upload Client-Side Engine (Node ESM & Browser compatible)
 */

const SHELL_CALL_REGEX = /\b(exec|shell_exec|system|passthru|popen|proc_open)\s*\(/g;
const BINARY_CALL_REGEX = /(pp_cli_x64|pp_cli|ct_cli|pp_ax_hub|lib_payplus)/gi;

export function analyzeLegacyPhp(source) {
  const src = String(source || '');
  const lines = src.split(/\r?\n/);

  const blockedCalls = [];
  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('*')) return;
    let m;
    SHELL_CALL_REGEX.lastIndex = 0;
    while ((m = SHELL_CALL_REGEX.exec(line)) !== null) {
      blockedCalls.push({
        fn: m[1],
        line: idx + 1,
        snippet: trimmed.slice(0, 90)
      });
    }
  });

  const binaries = new Set();
  let bm;
  BINARY_CALL_REGEX.lastIndex = 0;
  while ((bm = BINARY_CALL_REGEX.exec(src)) !== null) {
    binaries.add(bm[1]);
  }

  const siteCdMatch = src.match(/\$g_conf_site_cd\s*=\s*['"]([^'"]+)['"]/i) || src.match(/site_cd['"]?\s*=>\s*['"]([^'"]+)['"]/i);
  const siteCd = siteCdMatch ? siteCdMatch[1].trim() : 'T0000';
  const isTestMode = /testpaygw\.kcp\.co\.kr|^T00/i.test(src) || siteCd.startsWith('T00');
  const charset = /euc-kr|cp949/i.test(src) ? 'EUC-KR' : 'UTF-8';
  const hasCpayPlusClass = /class\s+C_PP_CLI|mf_do_tx/i.test(src);

  return {
    blockedCalls,
    binaries: Array.from(binaries),
    siteCd,
    isTestMode,
    charset,
    hasCpayPlusClass,
    dangerCount: blockedCalls.length + (binaries.size > 0 ? 1 : 0)
  };
}

export function synthesizeCurlAdapter(audit) {
  const endpoint = audit.isTestMode
    ? 'https://stg-spl.kcp.co.kr/gw/enc/v1/payment'
    : 'https://spl.kcp.co.kr/gw/enc/v1/payment';

  const charsetHelper = audit.charset === 'EUC-KR'
    ? "  private function toUtf8($v) { return function_exists('iconv') ? iconv('EUC-KR', 'UTF-8//IGNORE', (string)$v) : (string)$v; }\n  private function fromUtf8($v) { return function_exists('iconv') ? iconv('UTF-8', 'EUC-KR//IGNORE', (string)$v) : (string)$v; }"
    : "  private function toUtf8($v) { return (string)$v; }\n  private function fromUtf8($v) { return (string)$v; }";

  return [
    '<?php',
    '/**',
    ' * [오커 웍스 자동 생성 패치] 호스팅 exec() 차단 대응 KCP 무바이너리 cURL REST 어댑터',
    ' * - 감지된 사이트 코드: ' + audit.siteCd + ' (' + (audit.isTestMode ? '테스트 게이트웨이' : '실결제 게이트웨이') + ')',
    ' * - 감지된 인코딩 규격: ' + audit.charset + ' · 외부 바이너리(pp_cli) 호출 0건',
    ' * - 설치 방법: shop/kcp/ow_kcp_curl_adapter.php 업로드 후 settle_kcp.inc.php 하단에서 include_once 호출',
    ' */',
    "if (!defined('_GNUBOARD_') && !isset($_GET['ow_health'])) { exit; }",
    '',
    "// [무인 상태 점검 엔드포인트] ?ow_health=1 호출 시 cURL·TLS·함수 차단 상태를 JSON으로 즉시 반환",
    "if (isset($_GET['ow_health']) && $_GET['ow_health'] === '1') {",
    "  header('Content-Type: application/json; charset=utf-8');",
    "  $disabled = array_map('trim', explode(',', (string)ini_get('disable_functions')));",
    '  echo json_encode(array(',
    "    'ok' => function_exists('curl_init') && defined('CURL_SSLVERSION_TLSv1_2'),",
    "    'exec_blocked' => in_array('exec', $disabled, true) || !function_exists('exec'),",
    "    'curl_ready' => function_exists('curl_init'),",
    "    'php_version' => PHP_VERSION,",
    "    'adapter' => 'OW-KCP-cURL-2.0'",
    '  ));',
    '  exit;',
    '}',
    '',
    'class OW_KCP_Curl_Adapter {',
    "  private $endpoint = '" + endpoint + "';",
    "  private $siteCd = '" + audit.siteCd + "';",
    '  private $siteKey = "";',
    '  public  $m_res_cd = "9500";',
    '  public  $m_res_msg = "초기화 대기";',
    '  public  $m_res_data = array();',
    '',
    '  public function __construct($siteCd = "", $siteKey = "") {',
    '    if ($siteCd !== "") $this->siteCd = $siteCd;',
    '    $this->siteKey = $siteKey;',
    '  }',
    '',
    charsetHelper,
    '',
    '  /** 구형 C_PP_CLI::mf_do_tx() 대체: exec(pp_cli) 없이 HTTPS cURL JSON 승인/취소 수행 */',
    '  public function requestApproval($encData, $encInfo, $ordrMon, $tranCd = "00100000") {',
    "    if (!function_exists('curl_init')) {",
    '      $this->m_res_cd = "9599";',
    '      $this->m_res_msg = "호스팅 PHP cURL 확장이 비활성화되어 있습니다.";',
    '      return false;',
    '    }',
    '    $payload = json_encode(array(',
    "      'tran_cd'   => (string)$tranCd,",
    "      'site_cd'   => $this->siteCd,",
    "      'kcp_cert_info' => $this->siteKey,",
    "      'enc_data'  => $this->toUtf8($encData),",
    "      'enc_info'  => $this->toUtf8($encInfo),",
    "      'ordr_mony' => (int)$ordrMon",
    '    ));',
    '',
    '    $ch = curl_init($this->endpoint);',
    '    curl_setopt_array($ch, array(',
    '      CURLOPT_POST           => true,',
    '      CURLOPT_RETURNTRANSFER => true,',
    '      CURLOPT_CONNECTTIMEOUT => 5,',
    '      CURLOPT_TIMEOUT        => 20,',
    '      CURLOPT_SSLVERSION     => CURL_SSLVERSION_TLSv1_2,',
    "      CURLOPT_HTTPHEADER     => array('Content-Type: application/json; charset=utf-8'),",
    '      CURLOPT_POSTFIELDS     => $payload',
    '    ));',
    '    $raw = curl_exec($ch);',
    '    $errno = curl_errno($ch);',
    '    $errstr = curl_error($ch);',
    '    curl_close($ch);',
    '',
    '    if ($errno !== 0 || !$raw) {',
    '      $this->m_res_cd = "9598";',
    '      $this->m_res_msg = $this->fromUtf8("PG 통신 타임아웃 또는 TLS 오류: " . $errstr);',
    '      return false;',
    '    }',
    '    $json = json_decode($raw, true);',
    '    if (!is_array($json)) {',
    '      $this->m_res_cd = "9597";',
    '      $this->m_res_msg = $this->fromUtf8("PG 응답 JSON 파싱 실패");',
    '      return false;',
    '    }',
    "    $this->m_res_cd  = isset($json['res_cd']) ? (string)$json['res_cd'] : '9596';",
    "    $this->m_res_msg = $this->fromUtf8(isset($json['res_msg']) ? $json['res_msg'] : '응답 메시지 없음');",
    '    $this->m_res_data = $json;',
    "    return $this->m_res_cd === '0000';",
    '  }',
    '',
    '  public function mf_get_res_data($key) {',
    '    return isset($this->m_res_data[$key]) ? $this->fromUtf8($this->m_res_data[$key]) : "";',
    '  }',
    '}',
    '?>'
  ].join('\n');
}

// CODE128(Code Set B) 바코드를 SVG 로 그린다 — 전자영수증의 거래 바코드용 (2026-09-12).
//
// ── 왜 라이브러리를 안 쓰나 ──────────────────────────────────────────────
//
// 필요한 건 **한 종류, 한 자리**뿐이다(거래 코드 T + 숫자 9자리). 그걸 위해 의존성을 하나
// 더 들이면 쇼핑앱 번들이 커지고, 그 라이브러리가 종이 영수증과 **다른 규칙**으로 찍을
// 여지가 생긴다. 종이 쪽은 srmart-pos/src/utils/escpos.ts 가 같은 Code Set B 로 만든다 —
// 둘이 같은 코드를 같은 심볼로 그려야 스캐너가 폰 화면이든 종이든 같은 값을 읽는다.
//
// ── 왜 SVG 인가 ──────────────────────────────────────────────────────────
//
// 막대는 정수 모듈 폭이라야 스캐너가 읽는다. <canvas> 는 기기 픽셀비에 따라 반올림이
// 생겨 막대 폭이 1px 씩 어긋나는데, SVG 는 viewBox 가 모듈 단위라 화면 크기가 얼마든
// 비율이 정확히 유지된다. 폰 화면을 스캔하는 용도라 이쪽이 안전하다.

/**
 * CODE128 심볼 패턴표(0~106). 각 문자는 6개 요소(막대·공백 번갈아, 막대로 시작)로,
 * 숫자가 그 요소의 모듈 폭이다. 마지막 106(정지 문자)만 7개다.
 */
const PATTERNS = [
  '212222', '222122', '222221', '121223', '121322', '131222', '122213', '122312', '132212', '221213',
  '221312', '231212', '112232', '122132', '122231', '113222', '123122', '123221', '223211', '221132',
  '221231', '213212', '223112', '312131', '311222', '321122', '321221', '312212', '322112', '322211',
  '212123', '212321', '232121', '111323', '131123', '131321', '112313', '132113', '132311', '211313',
  '231113', '231311', '112133', '112331', '132131', '113123', '113321', '133121', '313121', '211331',
  '231131', '213113', '213311', '213131', '311123', '311321', '331121', '312113', '312311', '332111',
  '314111', '221411', '431111', '111224', '111422', '121124', '121421', '141122', '141221', '112214',
  '112412', '122114', '122411', '142112', '142211', '241211', '221114', '413111', '241112', '134111',
  '111242', '121142', '121241', '114212', '124112', '124211', '411212', '421112', '421211', '212141',
  '214121', '412121', '111143', '111341', '131141', '114113', '114311', '411113', '411311', '113141',
  '114131', '311141', '411131', '211412', '211214', '211232', '2331112',
];

const START_B = 104;
const STOP = 106;

/** 코드 문자열 → 모듈 폭 배열(막대/공백 번갈아). 그릴 수 없으면 null. */
function encode(text) {
  const values = [];
  for (const ch of String(text)) {
    const code = ch.charCodeAt(0);
    // Code Set B 는 ASCII 32~126 만 담는다. 거래 코드는 영문 대문자 + 숫자뿐이라 항상 들어간다.
    if (code < 32 || code > 126) return null;
    values.push(code - 32);
  }
  if (!values.length) return null;

  // 체크 문자 — 시작 문자 값 + (자리번호 × 값)의 합을 103 으로 나눈 나머지.
  let sum = START_B;
  values.forEach((v, i) => { sum += v * (i + 1); });
  const check = sum % 103;

  const seq = [START_B, ...values, check, STOP];
  const widths = [];
  for (const v of seq) for (const d of PATTERNS[v]) widths.push(Number(d));
  return widths;
}

/**
 * @param value   바코드에 실을 값(예: "T110000074")
 * @param height  막대 높이(px)
 * @param showText 아래에 사람이 읽는 숫자를 같이 적을지. **기본 켬** — 스캐너가 폰 화면을
 *                 못 읽는 경우가 있어서, 계산원이 손으로 칠 수 있어야 한다.
 * @param dimmed  회색 처리(취소된 거래). 스캔은 되지만 "쓸 수 없는 것" 이 한눈에 보인다.
 */
export default function Code128({ value, height = 90, showText = true, dimmed = false }) {
  const widths = encode(value);
  if (!widths) return null;

  const total = widths.reduce((a, b) => a + b, 0);
  const QUIET = 10;               // 좌우 여백 — 규격상 최소 10모듈. 없으면 스캐너가 시작을 못 찾는다.
  const vbWidth = total + QUIET * 2;

  const bars = [];
  let x = QUIET;
  widths.forEach((w, i) => {
    if (i % 2 === 0) bars.push(<rect key={i} x={x} y="0" width={w} height={height} />);
    x += w;
  });

  return (
    <div style={{ width: '100%', textAlign: 'center' }}>
      <svg
        viewBox={`0 0 ${vbWidth} ${height}`}
        width="100%"
        height={height}
        preserveAspectRatio="none"
        role="img"
        aria-label={`거래 바코드 ${value}`}
        style={{ display: 'block', opacity: dimmed ? 0.35 : 1 }}
      >
        {/* 흰 바탕을 직접 깐다 — 다크 모드에서 배경이 검게 깔리면 스캐너가 반전된 심볼을
            못 읽는다. 바코드는 테마를 따르지 않는다. */}
        <rect x="0" y="0" width={vbWidth} height={height} fill="#fff" />
        <g fill="#000">{bars}</g>
      </svg>
      {showText && (
        <div style={{
          fontFamily: 'ui-monospace, Menlo, Consolas, monospace',
          fontSize: 15, letterSpacing: 3, marginTop: 6,
          color: dimmed ? '#999' : '#222', fontWeight: 700,
        }}>
          {value}
        </div>
      )}
    </div>
  );
}

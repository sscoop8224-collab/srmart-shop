// 🔴 휴대폰 본인확인 — 앱 쪽 연결부 (2026-11-16 밤샘 · 지시 5 — 업체와 무관한 공통 틀 · 시험용 가짜는 기본 꺼짐)
//
// 서버 짝: 백엔드 src/services/identity/(index.js 공통 · mockAdapter 시험용 · vendorAdapter 업체 자리) · src/routes/identity.js
// 설계: docs/SHOP_IDENTITY_VERIFY.md
//
// ── 흐름(업체가 무엇이든 같다) ─────────────────────────────────────────────
//   ① GET  /identity/status                      → { live }  — 꺼져 있으면 여기서 멈춘다(화면은 「준비 중」)
//   ② POST /identity/start   { purpose }          → { tx_id, provider, mode?, url?, form? }   (회원 목적은 /users/me/identity/start)
//   ③ 업체 창을 연다 — openVendor(): url 이면 그 주소 · form 이면 숨은 폼 POST. 업체가 돌아올 주소(서버 IDENTITY_RETURN_URL)의
//      화면이 window.opener.postMessage({ type: 'srm-identity-result', tx_id, result }) 로 결과를 돌려준다(그 화면은 **업체 계약 뒤**
//      백엔드에 만든다 — 업체마다 돌아오는 값의 모양이 달라서). 앱은 그 메시지만 기다린다.
//   ④ POST /identity/complete { tx_id, result }   → { token, name, phone_masked, adult }
//   ⑤ 그 token 을 가입(identityToken) · 아이디 찾기(identity_token) · 회원 본인확인 · 번호 변경에 싣는다.
//
// ── 시험용 가짜(기본 꺼짐) ────────────────────────────────────────────────
//   서버가 mock 이고(IDENTITY_PROVIDER=mock + 시험 서버에서만 IDENTITY_MOCK_LIVE=1) **이 빌드가** REACT_APP_IDENTITY_MOCK=1 일 때만
//   업체 창 대신 넘겨받은 mockInput({ name, birthdate, phone })을 그대로 결과로 쓴다.
//   🔴 둘 중 하나라도 아니면 가짜 길은 열리지 않는다 — 운영 빌드에는 그 값이 없다(.env.production 에 넣지 마라).
//   🔴 서버가 mock 이 아닌데 앱만 가짜를 켜도 쓸모가 없다(서버 업체 어댑터가 결과를 다시 확인한다 — 신뢰 경계는 서버).
//
// 이 파일은 아직 **어느 화면도 부르지 않는다** — 본인확인 화면(S48·P04 2단계·S29·P02)은 목업 승인 · 업체 계약 뒤에 붙인다.
import API from '../api';

export const MOCK_ON = process.env.REACT_APP_IDENTITY_MOCK === '1';
export const PURPOSES = Object.freeze(['signup', 'find_id', 'reset_password', 'phone_change', 'verify_member']);
const MEMBER_PURPOSES = ['phone_change', 'verify_member'];
const RESULT_TYPE = 'srm-identity-result';

export class IdentityError extends Error {
  constructor(message, code) { super(message); this.code = code; }
}

const errOf = (e, fallback) => new IdentityError(
  (e && e.response && e.response.data && e.response.data.error) || fallback,
  (e && e.response && e.response.data && e.response.data.code) || (e && e.code) || 'IDENTITY_ERROR');

export async function identityStatus(api = API) {
  try { const r = await api.get('/identity/status'); return { live: !!(r.data && r.data.live) }; }
  catch (e) { return { live: false }; }   // 못 읽으면 꺼진 것으로 — 화면이 「준비 중」을 보인다(가입을 막지 않는다)
}

export async function startIdentity(purpose, api = API) {
  if (!PURPOSES.includes(purpose)) throw new IdentityError('잘못된 요청이에요.', 'BAD_PURPOSE');
  const url = MEMBER_PURPOSES.includes(purpose) ? '/users/me/identity/start' : '/identity/start';
  try { return (await api.post(url, { purpose })).data; } catch (e) { throw errOf(e, '본인확인을 시작하지 못했어요.'); }
}

export async function completeIdentity(txId, result, api = API) {
  try { return (await api.post('/identity/complete', { tx_id: txId, result })).data; } catch (e) { throw errOf(e, '본인확인을 마치지 못했어요.'); }
}

/**
 * 업체 창을 열고 결과를 기다린다 — 업체와 무관한 부분만.
 * @param {object} begun  start 응답({ tx_id, mode?, url?, form?: { action, method?, fields } })
 * @param {object} env    { win: window(시험에서 바꿔 끼움), timeoutMs, mockInput }
 * @returns {Promise<object>} 업체 결과(그대로 complete 에 싣는다 — 앱은 열어 보지 않는다)
 */
export function openVendor(begun, { win = typeof window !== 'undefined' ? window : null, timeoutMs = 10 * 60 * 1000, mockInput = null } = {}) {
  if (begun && begun.mode === 'mock') {
    if (!MOCK_ON) return Promise.reject(new IdentityError('본인확인이 아직 준비 중이에요.', 'MOCK_OFF'));   // 🔴 가짜 길은 빌드 값이 있어야만
    if (!mockInput) return Promise.reject(new IdentityError('시험 값이 없어요.', 'MOCK_INPUT'));
    return Promise.resolve({ name: mockInput.name, birthdate: mockInput.birthdate, phone: mockInput.phone });
  }
  if (!win) return Promise.reject(new IdentityError('본인확인 창을 열 수 없어요.', 'NO_WINDOW'));
  if (!begun || (!begun.url && !begun.form)) return Promise.reject(new IdentityError('본인확인 업체 정보가 없어요.', 'NO_VENDOR'));
  return new Promise((resolve, reject) => {
    let popup = null;
    let timer = null;
    const done = (fn, v) => { win.removeEventListener('message', onMsg); clearTimeout(timer); try { if (popup && !popup.closed) popup.close(); } catch (_) { /* 이미 닫힘 */ } fn(v); };
    const onMsg = (ev) => {
      const d = ev && ev.data;
      if (!d || d.type !== RESULT_TYPE || d.tx_id !== begun.tx_id) return;   // 다른 메시지·다른 거래는 무시
      if (ev.origin && win.location && ev.origin !== win.location.origin) return;   // 돌아오는 화면은 우리 서버(같은 출처)여야 한다
      done(resolve, d.result);
    };
    win.addEventListener('message', onMsg);
    timer = setTimeout(() => done(reject, new IdentityError('본인확인 시간이 지났어요. 다시 해 주세요.', 'TIMEOUT')), timeoutMs);
    try {
      if (begun.url) popup = win.open(begun.url, 'srm_identity', 'width=480,height=720');
      else {
        popup = win.open('', 'srm_identity', 'width=480,height=720');
        const doc = win.document;
        const f = doc.createElement('form');
        f.method = begun.form.method || 'POST'; f.action = begun.form.action; f.target = 'srm_identity';
        for (const [k, v] of Object.entries(begun.form.fields || {})) { const i = doc.createElement('input'); i.type = 'hidden'; i.name = k; i.value = v; f.appendChild(i); }
        doc.body.appendChild(f); f.submit(); doc.body.removeChild(f);
      }
      if (!popup) done(reject, new IdentityError('팝업이 막혔어요. 팝업을 허용한 뒤 다시 해 주세요.', 'POPUP_BLOCKED'));
    } catch (e) { done(reject, new IdentityError('본인확인 창을 열 수 없어요.', 'OPEN_FAILED')); }
  });
}

/**
 * 한 번에 — 상태 확인 → 시작 → 업체 창 → 완료. 화면은 이것만 부르면 된다.
 * @returns {Promise<{token, name, phone_masked, adult}>}
 */
export async function verifyIdentity(purpose, { api = API, ...env } = {}) {
  const st = await identityStatus(api);
  if (!st.live) throw new IdentityError('본인확인이 아직 준비 중이에요.', 'IDENTITY_OFF');
  const begun = await startIdentity(purpose, api);
  const result = await openVendor(begun, env);
  return completeIdentity(begun.tx_id, result, api);
}

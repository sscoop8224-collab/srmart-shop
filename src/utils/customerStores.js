// 손님에게 보이는 매장 이름 목록 — 개인정보 제공 동의 문구에 쓴다 (2026-11-12 대표님 지시 1).
//
// ── 왜 손으로 적지 않나 ──────────────────────────────────────────────────
//
// 동의 문구에 「검암점·왕길점·신흥점·고촌점·승학점」 이 **손으로** 적혀 있었다. 그런데
// 승학점은 물류 창고라 손님에게 보이지 않게 정해졌고(stores.customer_visible), 그러면
// 손님이 **알지도 못하는 매장에 정보를 넘기는 데** 동의하라는 문장이 된다.
// 매장 노출을 바꿀 때마다 문구를 따로 고쳐야 한다면 또 어긋난다 — 그래서 문구를
// `GET /api/stores?audience=customer` 결과로 만든다. 서버가 보이는 매장을 바꾸면 문구도 따라 바뀐다.
//
// ── 못 불러오면 ──────────────────────────────────────────────────────────
//
// 🔴 **빈 목록·옛 목록으로 떨어지지 않는다.** 목록 없이 「(브랜드) 각 지점」 이라고만 쓴다.
//    옛 목록을 적어 두면 그게 다시 틀린 약속이 되고, 빈 괄호는 문장이 깨져 보인다.
import { useEffect, useState } from 'react';
import { getStores } from '../api';
import { BRAND } from '../brand';

// 매장 이름 앞머리(상호) — 「에스알마트 검암점」 → 「검암점」, 「아람마트 고촌점」 → 「고촌점」. 상호 목록은 brand.js 한 곳.
const BRAND_PREFIX = BRAND.storePrefix;

/** 매장 한 곳의 지점 이름 — 표시 이름(display_name)이 있으면 그것, 앞머리 상호는 뗀다. */
export function branchName(store) {
  const raw = String(store?.display_name || store?.name || '').trim();
  if (!raw) return '';
  let n = raw.replace(BRAND_PREFIX, '').trim();
  // 다른 상호가 붙어 와도 「○○점」 만 남긴다(마지막 낱말이 「점」 으로 끝날 때만).
  const parts = n.split(/\s+/);
  if (parts.length > 1 && /점$/.test(parts[parts.length - 1])) n = parts[parts.length - 1];
  return n || raw;
}

/** 매장 목록 → 「검암점·왕길점·신흥점·고촌점」. 이름이 하나도 없으면 ''. */
export function branchList(stores) {
  if (!Array.isArray(stores)) return '';
  const seen = new Set();
  const names = [];
  for (const s of stores) {
    const n = branchName(s);
    if (n && !seen.has(n)) { seen.add(n); names.push(n); }
  }
  return names.join('·');
}

/** 받침이 있으면 '은', 없으면 '는' — 마지막 글자가 한글이 아니면 '은(는)'. */
export function topicJosa(word) {
  const ch = String(word || '').slice(-1);
  const code = ch.charCodeAt(0) - 0xac00;
  if (!(code >= 0 && code <= 11171)) return '은(는)';
  return code % 28 ? '은' : '는';
}

// 숫자·단위는 읽는 소리로 받침을 정한다 — 상품 이름 뒤에 규격(60g · 1.5L · 500ml)이 붙기 때문이다.
// 숫자: 영·일·삼·육·칠·팔 = 받침 있음 / 이·사·오·구 = 없음. 단위: g·kg(그램) = 있음 / L·ml(리터)·m(미터) = 없음.
const DIGIT_BATCHIM = { 0: true, 1: true, 2: false, 3: true, 4: false, 5: false, 6: true, 7: true, 8: true, 9: false };
const UNIT_BATCHIM = [[/(mg|kg|g)$/i, true], [/(ml|l|cm|mm|m)$/i, false]];

/** 받침이 있으면 '을', 없으면 '를' — 숫자·흔한 단위도 읽는 소리로 판단, 그 밖이면 '을(를)'. */
export function objectJosa(word) {
  const w = String(word || '').trim();
  const ch = w.slice(-1);
  const code = ch.charCodeAt(0) - 0xac00;
  if (code >= 0 && code <= 11171) return code % 28 ? '을' : '를';
  if (/\d/.test(ch)) return DIGIT_BATCHIM[ch] ? '을' : '를';
  for (const [re, has] of UNIT_BATCHIM) if (re.test(w)) return has ? '을' : '를';
  return '을(를)';
}

// 한 번 받은 목록은 세션 동안 다시 쓴다(동의 창과 가입 화면이 같이 부른다).
// 실패는 저장하지 않는다 — 다음에 열 때 다시 시도한다.
let cached = null;
let pending = null;

export function loadCustomerStores() {
  if (cached) return Promise.resolve(cached);
  if (!pending) {
    pending = getStores()
      .then((res) => {
        const rows = Array.isArray(res.data) ? res.data : [];
        if (rows.length) cached = rows;
        return rows;
      })
      .finally(() => { pending = null; });
  }
  return pending;
}

/**
 * 손님에게 보이는 지점 이름 문자열 — 「검암점·왕길점·신흥점·고촌점」.
 * 불러오는 중이거나 실패하면 '' (부르는 쪽은 목록 없는 문장으로 쓴다).
 */
export function useCustomerBranchList() {
  const [list, setList] = useState(() => (cached ? branchList(cached) : ''));
  useEffect(() => {
    let alive = true;
    loadCustomerStores()
      .then((rows) => { if (alive) setList(branchList(rows)); })
      .catch(() => { if (alive) setList(''); });
    return () => { alive = false; };
  }, []);
  return list;
}

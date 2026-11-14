// 🔴 쇼핑앱 브랜드 — 화면에 나오는 브랜드 이름·문구는 **여기 한 곳**에서만 읽는다 (2026-11-14 대표님 지시 10)
//
//   · 어느 브랜드로 찍을지는 **빌드 때** 정한다: REACT_APP_BRAND=aram (없으면 srm 에스알마트).
//     두 브랜드 값을 삼항식 **안에 바로** 적은 까닭 — 빌드가 조건을 상수로 바꾸면 압축기가 쓰지 않는 쪽을 통째로 지운다.
//     그래서 아람마트 번들에는 「에스알마트」·「SR마트」 가 한 글자도 안 남는다(scripts/check-brand-strings.cjs 가 지킨다).
//     🔴 값을 따로 상수로 빼서 고르면(const SRM = {...}) 지워지지 않을 수 있다 — 삼항식 안에 둔다.
//   · 사업자·약관 주체는 두 브랜드 모두 「동신마켓」(결정 d). 약관 속 상호 자리만 브랜드 이름을 따른다.
//   · 서버 쪽 짝: srmart-backend/src/services/brands.js · 앱 패키지는 android/app/build.gradle productFlavors · brands/<id>/brand.json.
//   · 네이티브 앱은 자기 패키지(app_id)를 따로 알린다(pushSetup · appVersion) — 웹 번들과 앱이 어긋나도 서버는 앱 기준으로 브랜드를 정한다.

export const BRAND = process.env.REACT_APP_BRAND === 'aram'
  ? Object.freeze({
    code: 'aram',
    name: '아람마트',
    appId: 'com.dongsin.arammart',
    aiName: '아람마트 AI 상담사',
    // 매장 이름 앞에 붙는 상호 — 「아람마트 고촌점」 → 「고촌점」
    storePrefix: /^(아람마트|동신마켓)\s*/i,
  })
  : Object.freeze({
    code: 'srm',
    name: '에스알마트',
    appId: 'com.dongsin.srmart',
    aiName: '에스알마트 AI 상담사',
    storePrefix: /^(에스알마트|SR\s*마트|에스알|동신마켓)\s*/i,
  });

/** 사업자·약관 주체 — 두 브랜드 같다(결정 d) */
export const COMPANY = '동신마켓';

/** 매장 이름에서 앞머리 상호를 뗀다 — 「에스알마트 왕길점」 → 「왕길점」 */
export const shortStoreName = (n) => String(n || '').replace(BRAND.storePrefix, '').trim();

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
    // 헤더·로그인 가로 로고(2026-11-16 — 예전엔 두 화면이 에스알마트 로고를 바로 import 해 아람 빌드에도 SRM 이 떴다).
    // require 를 삼항식 **안에** 둔다 — 빌드가 조건을 상수로 바꾸면 안 쓰는 브랜드 그림은 번들에 들어가지 않는다.
    // 그림 만들기: node brand/generate-brand-web.cjs aram
    logo: require('./assets/brand/aram/logo_h_ko.png'),
    // 앱 첫 화면(HomePage) 로고 — 에스알마트는 public 의 투명 로고, 아람은 가로 로고(2026-11-17 — 예전엔 두 브랜드 모두
    // public/srm-logo-transparent.png 를 주소로 불러 아람 앱 첫 화면에 SRM 이 떴다)
    landingLogo: require('./assets/brand/aram/logo_h_ko.png'),
    // 매장 이름 앞에 붙는 상호 — 「아람마트 고촌점」 → 「고촌점」
    storePrefix: /^(아람마트|동신마켓)\s*/i,
  })
  : Object.freeze({
    code: 'srm',
    name: '에스알마트',
    appId: 'com.dongsin.srmart',
    aiName: '에스알마트 AI 상담사',
    logo: require('./assets/brand/logo_h_ko.png'),
    landingLogo: `${process.env.PUBLIC_URL}/srm-logo-transparent.png`,
    storePrefix: /^(에스알마트|SR\s*마트|에스알|동신마켓)\s*/i,
  });

/** 사업자·약관 주체 — 두 브랜드 같다(결정 d) */
export const COMPANY = '동신마켓';

/** 매장 이름에서 앞머리 상호를 뗀다 — 「에스알마트 왕길점」 → 「왕길점」 */
export const shortStoreName = (n) => String(n || '').replace(BRAND.storePrefix, '').trim();

/**
 * 비로그인 손님이 고른 매장을 기억하는 자리(localStorage) — 브랜드마다 따로 (2026-11-15 아람 웹 경로)
 *   웹에서는 /srm/ · /aram/ 이 **같은 출처**라 localStorage 를 같이 쓴다. 키가 같으면 에스알마트에서 고른 매장이
 *   아람마트 웹에 그대로 넘어가, 아람 간판 아래 다른 브랜드 매장의 가격·재고가 보인다.
 *   에스알마트는 옛 키(guestStoreId)를 그대로 쓴다 — 바꾸면 지금 손님들이 고른 매장이 사라진다.
 *   지키는 검사: scripts/check-brand-paths.cjs
 */
export const GUEST_STORE_KEY = BRAND.code === 'srm' ? 'guestStoreId' : `guestStoreId:${BRAND.code}`;

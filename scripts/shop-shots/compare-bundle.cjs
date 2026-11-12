#!/usr/bin/env node
/**
 * 묶음 비교 사진 — 「목업 | 앱 | 차이(빨강)」 를 화면마다 세 크기 × 밝게·어둡게로 찍고 픽셀 차이를 잰다.
 * (2026-11-12 밤 지시 5 — 묶음마다 docs/shots/compare/bundleN/ 에 시트로 모은다)
 *
 *   node scripts/shop-shots/compare-bundle.cjs --bundle 1 [--base http://127.0.0.1:5312]
 *
 * - 앱은 serve-static.cjs 로 127.0.0.1 에 띄운 **로컬 빌드**를 본다(운영 build·pm2 는 건드리지 않는다).
 * - 🔴 /api 는 전부 fixtures.cjs 의 가짜 응답이다 — 운영 백엔드를 부르지 않는다(로그인·검색 기록이 안 남는다).
 * - 목업은 file:// 로 ?solo=ID&theme=&state= 를 연다.
 * - 크기: 폰 세로 390×844(배율 2) · 태블릿 세로 820×1180 · 태블릿 가로 1180×820 (SHOP_DESIGN_TOKENS 5절 기본 시트)
 * - 차이: 같은 크기로 맞춘 두 사진에서 R·G·B 중 하나라도 32 넘게 다른 점의 비율(%).
 *   🔴 이 숫자는 「얼마나 같은가」의 대략이다 — 목업에는 기기 액자(상태바 시계·홈 막대)가 있고 앱에는 없어서 0 이 될 수 없다.
 *   그래서 화면 전체 말고 **부품만 잘라 비교하는 칸**(헤더·탭바처럼 selector 를 준 것)을 같이 둔다.
 *
 * 나오는 것:
 *   docs/shots/app/<ID>_<theme>.png · <ID>_tland_<theme>.png · <ID>_tablet_<theme>.png   (앱 사진)
 *   docs/shots/compare/<ID>_<theme>.png · <ID>_tland_<theme>.png                         (목업|앱 두 칸 — check-progress.js 가 본다)
 *   docs/shots/compare/bundleN/<ID>_<size>_<theme>_diff.png                              (빨간 표시)
 *   docs/shots/compare/bundleN/sheet_<theme>.png · report.json · report.md                (시트·숫자)
 */
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');
const sharp = require('sharp');
const { route, customer } = require('./fixtures.cjs');

const ROOT = path.join(__dirname, '../..');
const arg = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : d; };
const BASE = arg('--base', 'http://127.0.0.1:5312');
const BUNDLE = arg('--bundle', '1');
const MOCK = pathToFileURL(arg('--mockup', 'C:/srmart/srmart-shop-mockup/index.html')).href;
const APP_DIR = path.join(ROOT, 'docs/shots/app');
const CMP_DIR = path.join(ROOT, 'docs/shots/compare');
const OUT = path.join(CMP_DIR, `bundle${BUNDLE}`);

const SIZES = [
  { key: 'phone', tag: '', label: '폰 세로', viewport: { width: 390, height: 844 }, dsf: 2 },
  { key: 'tablet', tag: 'tablet_', label: '태블릿 세로', viewport: { width: 820, height: 1180 }, dsf: 1 },
  { key: 'tland', tag: 'tland_', label: '태블릿 가로', viewport: { width: 1180, height: 820 }, dsf: 1 },
];
// 몇 화면만 더 찍는 크기(묶음 2 계획: 「폰 가로·PC 는 P05 만」) — 화면 줄에 extraSizes: true
const EXTRA_SIZES = [
  { key: 'pland', tag: 'pland_', label: '폰 가로', viewport: { width: 844, height: 390 }, dsf: 2 },
  { key: 'pc', tag: 'pc_', label: 'PC', viewport: { width: 1440, height: 900 }, dsf: 1 },
];
const sizesOf = s => (s.extraSizes ? [...SIZES, ...EXTRA_SIZES] : SIZES);
const ANDROID_UA = 'Mozilla/5.0 (Linux; Android 12; SM-A125N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36';
const wait = (p, ms) => p.waitForTimeout(ms);

async function login(p) {
  await p.locator('.app-nav button', { hasText: '로그인' }).click();
  await p.getByPlaceholder(/아이디를 입력해 ?주세요/).fill('guest_demo');
  await p.getByPlaceholder(/비밀번호를 입력해 ?주세요/).fill('x');
  await p.getByRole('button', { name: '로그인', exact: true }).filter({ visible: true }).first().click();
  await wait(p, 900);
}
const pd = async (p, name) => { await p.locator('.pgrid .pc', { hasText: name }).first().locator('img').click(); await wait(p, 1000); };
const cartOf = async p => { await login(p); await p.locator('.pgrid .add').nth(0).click(); await wait(p, 250); await p.locator('.pgrid .add').nth(1).click(); await wait(p, 250); await tab(p, '장바구니').click(); await wait(p, 1200); };
// P03 — 장바구니의 「주문하기」 → 주문서(배송지·할인·결제 금액은 여기)
// 주문내역(P01) — 로그인 → 탭바 「주문내역」 → 맨 위 탭
const ordersOf = async (p, t) => { await login(p); await tab(p, '주문내역').click(); await wait(p, 1200); if (t) { await p.getByRole('tab', { name: t }).click(); await wait(p, 500); } };
// 마이(P02) — (로그인 →) 탭바 「마이」 · 줄 하나 누르기
const myOf = async (p, { guest = false, row = '' } = {}) => { if (!guest) await login(p); await tab(p, '마이').click(); await wait(p, 900); if (row) { await p.locator('.my-v2 button.row', { has: p.locator(`.lbl:text-is("${row}")`) }).first().click(); await wait(p, 700); } };
// 회사 소개(S40) 의 칩(매장안내·고객센터) — 손님으로 마이 → 회사 소개 → 칩
const aboutChip = async (p, chip) => { await myOf(p, { guest: true, row: '회사 소개·사업자 정보' }); await p.locator('.about-chips .chip', { hasText: chip }).click(); await wait(p, 900); };
const orderOf = async p => { await cartOf(p); await p.getByRole('button', { name: '주문하기', exact: true }).click(); await wait(p, 1200); };
const tab = (p, label) => p.locator('.tabbar .tab', { hasText: label }).first();
// 로그인 화면(S27) — 홈 헤더 「로그인」 · 회원가입(P04) — 거기서 「회원가입」
const loginPage = async p => { await p.locator('.app-nav button', { hasText: '로그인' }).click(); await wait(p, 700); };
const fillLogin = async (p, pw = 'password') => { await p.getByPlaceholder(/아이디를 입력해 ?주세요/).fill('guest_demo'); await p.getByPlaceholder(/비밀번호를 입력해 ?주세요/).fill(pw); };
// 주소 찾기(다음 우편번호 창)는 바깥 스크립트라 사진에서는 막혀 있다 — 같은 모양의 답을 바로 돌려주는 가짜로 바꾼다
const fakePostcode = p => p.evaluate(() => { window.daum = { Postcode: function Postcode(o) { this.open = () => o.oncomplete({ roadAddress: '인천 서구 왕길로 123', zonecode: '22689', bname: '왕길동' }); } }; });
const signupStep = async (p, n) => {
  await loginPage(p); await p.getByRole('button', { name: '회원가입', exact: true }).click(); await wait(p, 700);
  await fakePostcode(p);
  await p.getByPlaceholder('이름을 입력해 주세요').fill('김손님');
  await p.getByRole('button', { name: '주소 찾기', exact: true }).click(); await wait(p, 600);
  await p.getByPlaceholder('상세 주소 (동·호수)').fill('101동 1001호');
  if (n < 2) return;
  await p.getByRole('button', { name: '다음', exact: true }).click(); await wait(p, 500);
  await p.getByPlaceholder('아이디를 입력해 주세요').fill('kimson');
  await p.getByPlaceholder('비밀번호를 입력해 주세요').fill('abcd1234');
  await p.getByPlaceholder('이메일을 입력해 주세요').fill('kim@example.com');
  await p.getByPlaceholder('010-0000-0000').fill('010-1234-5678');
  await p.locator('input[type=date]').fill('1990-05-12');
  if (n < 3) return;
  await p.getByRole('button', { name: '다음', exact: true }).click(); await wait(p, 500);
  if (n === 3) { await p.locator('.consent.all').click(); await wait(p, 300); return; }
  if (n === 31) { await p.locator('.consent', { hasText: '개인정보 수집·이용' }).click(); await wait(p, 300); return; }   // 필수만
  await p.locator('.consent.all').click(); await p.getByRole('button', { name: '가입하기', exact: true }).click(); await wait(p, 900);
};

/**
 * 묶음별 화면. state = 목업 상태 이름, go = 앱에서 그 화면까지 손님처럼 누르기,
 * part = 부품만 잘라 비교(목업 selector, 앱 selector), opts = 가짜 API 설정.
 */
const BUNDLES = {
  1: [
    { id: 'S34', name: '확인창 — 안내(로그인이 필요해요)', state: '안내', go: async p => { await tab(p, '장바구니').click(); await wait(p, 500); }, part: ['.alert', '.alert'] },
    { id: 'S35', name: '토스트 — 담김', state: '담김', go: async p => { await login(p); await p.locator('.pgrid .add').first().click(); await wait(p, 300); }, part: ['.toast', '.toast'] },
    { id: 'S36', name: '오프라인', state: '기본', go: async (p, c) => { await c.setOffline(true); await wait(p, 900); } },
    { id: 'S43', name: '불러오는 중(화면 조각을 받는 동안)', go: async (p, c, ctl) => { ctl.holdChunks = true; await tab(p, '검색').click(); await wait(p, 700); } },
    { id: 'P05H', mock: 'P05', name: '홈 헤더(로그인 안 함)', state: '로그인 안 함', go: async () => {}, part: ['.homebar', '.homebar'], partOnly: true },
    { id: 'P05T', mock: 'P05', name: '하단 탭바(홈)', state: '로그인 안 함', go: async () => {}, part: ['.tabbar .in', '.tabbar .in'], partOnly: true },
  ],
  // 묶음 2 — 홈·검색(P05 · S02 · S03 · S06 · S07 · S30). 부품: 첫 상품 카드 · 배송 한 줄 · 쿠폰 띠 · 배너 · 사업자 정보 · 칩
  2: [
    { id: 'P05', name: '홈 — 로그인 안 함', state: '로그인 안 함', extraSizes: true, go: async () => {}, part: ['.grid .pc', '.pgrid .pc'] },
    { id: 'P05L', mock: 'P05', name: '홈 — 로그인함', state: '로그인함', go: async p => { await login(p); }, part: ['.grid .pc', '.pgrid .pc'] },
    { id: 'P05K', mock: 'P05', name: '가입 쿠폰 띠', state: '로그인 안 함', go: async () => {}, part: ['.cpn', '.cpn'], partOnly: true },
    { id: 'P05N', mock: 'P05', name: '배너(토큰 색 — 관리자 색 없이)', state: '로그인 안 함', opts: { bannerTokenBg: true }, go: async () => {}, part: ['.banner', '.banner'], partOnly: true },
    { id: 'P05P', mock: 'P05', name: '배송 한 줄 — 오늘 도착', state: '로그인 안 함', go: async () => {}, part: ['.promise', '.promise'], partOnly: true },
    { id: 'P05D', mock: 'P05', name: '배송 한 줄 — 마감 후', state: '마감 후', opts: { deliv: 'tomorrow' }, go: async () => {}, part: ['.promise', '.promise'], partOnly: true },
    { id: 'P05X', mock: 'P05', name: '배송 한 줄 — 당일배송 불가', state: '당일배송 불가', opts: { deliv: 'closed' }, go: async () => {}, part: ['.promise', '.promise'], partOnly: true },
    { id: 'P05V', mock: 'P05', name: '배송 한 줄 — 배송 휴무', state: '배송 휴무', opts: { deliv: 'holiday' }, go: async () => {}, part: ['.promise', '.promise'], partOnly: true },
    { id: 'P05C', mock: 'P05', name: '홈 — 가입 쿠폰 꺼짐', state: '가입 쿠폰 꺼짐', opts: { noCoupon: true }, go: async () => {} },
    { id: 'P05B', mock: 'P05', name: '사업자 정보 펼침', state: '사업자 정보 펼침', go: async p => { await p.locator('.biz .bh').click(); await wait(p, 300); }, part: ['.biz', '.biz'], partOnly: true },
    { id: 'S02', name: '매장 미리보기(사장님)', opts: { user: { ...customer, role: 'owner', username: 'owner_demo' } }, go: async p => { await login(p); }, part: ['.owner', '.owner'] },
    { id: 'S03', name: '홈 — 오류', state: '오류', opts: { productsFail: true }, go: async () => {} },
    { id: 'S03L', mock: 'S03', name: '홈 — 불러오는 중', state: '불러오는 중', opts: { productsSlow: true }, go: async () => {} },
    { id: 'S03E', mock: 'S03', name: '홈 — 분류에 상품 없음', state: '분류에 상품 없음', opts: { noProducts: true }, go: async () => {} },
    { id: 'S03V', mock: 'S03', name: '홈 — 행사 없음', state: '행사 없음', go: async p => { await p.locator('.chips .chip', { hasText: '행사상품' }).first().click(); await wait(p, 500); } },
    { id: 'S06', name: '검색', opts: { searchLikeMock: true }, go: async p => { await tab(p, '검색').click(); await wait(p, 700); await p.locator('.search input').fill('라면'); await p.keyboard.press('Enter'); await wait(p, 500); await p.locator('[role=switch]').first().click({ timeout: 8000 }); await wait(p, 600); } },
    { id: 'S07', name: '검색 — 자동완성', state: '자동완성', go: async p => { await tab(p, '검색').click(); await wait(p, 700); await p.locator('.search input').fill('콜라'); await wait(p, 800); } },
    { id: 'S07N', mock: 'S07', name: '검색 — 결과 없음', state: '결과 없음', go: async p => { await tab(p, '검색').click(); await wait(p, 700); await p.locator('.search input').fill('없는상품'); await wait(p, 400); await p.keyboard.press('Enter'); await wait(p, 600); } },
    { id: 'S07S', mock: 'S07', name: '검색 — 검색 중', state: '검색 중', opts: { searchSlow: true }, go: async p => { await tab(p, '검색').click(); await wait(p, 700); await p.locator('.search input').fill('콜라'); await wait(p, 400); await p.keyboard.press('Enter'); await wait(p, 400); } },
    { id: 'S30', name: '점포 선택', state: '목록', go: async p => { await p.locator('.store-chip').first().click(); await wait(p, 500); }, part: ['.sheet', '.sheet'] },
  ],
  // 묶음 3 — 상품 상세(S04 · S05). 배송 한 줄 넷 · 재고 셋 · 무게 · 리뷰 셋. 부품: 머리(가격·배송) · 정보 묶음 · 아래 바
  3: [
    { id: 'S04', name: '상세 — 낱개·박스', state: '낱개·박스', go: async p => { await pd(p, '메론킥'); }, part: ['.d-head', '.d-head'] },
    { id: 'S04B', mock: 'S04', name: '상세 — 아래 바', state: '낱개·박스', go: async p => { await pd(p, '메론킥'); }, part: ['.bar', '.v2 .bar'], partOnly: true },
    { id: 'S04L', mock: 'S04', name: '상세 — 재고 적음', state: '재고 적음', opts: { lowStock: true }, go: async p => { await pd(p, '메론킥'); }, part: ['.group', '.v2 .sec .group'] },
    { id: 'S04W', mock: 'S04', name: '상세 — 무게 상품', state: '무게 상품', go: async p => { await pd(p, '한우'); } },
    // 품절 상품은 홈 카드가 안 열린다(누르면 그대로) — 검색 결과 줄로 들어간다
    { id: 'S04S', mock: 'S04', name: '상세 — 품절', state: '품절', go: async p => { await tab(p, '검색').click(); await wait(p, 700); await p.locator('.search input').fill('퐁퐁'); await p.keyboard.press('Enter'); await wait(p, 700); await p.locator('.v2 .row', { hasText: '퐁퐁' }).first().click(); await wait(p, 1000); }, part: ['.bar', '.v2 .bar'] },
    { id: 'S04D', mock: 'S04', name: '상세 — 마감 후', state: '마감 후', opts: { deliv: 'tomorrow' }, go: async p => { await pd(p, '메론킥'); }, part: ['.promise', '.promise'] },
    { id: 'S04X', mock: 'S04', name: '상세 — 당일배송 불가', state: '당일배송 불가', opts: { deliv: 'closed' }, go: async p => { await pd(p, '메론킥'); }, part: ['.promise', '.promise'] },
    { id: 'S04V', mock: 'S04', name: '상세 — 배송 휴무', state: '배송 휴무', opts: { deliv: 'holiday' }, go: async p => { await pd(p, '메론킥'); }, part: ['.promise', '.promise'] },
    { id: 'S05', name: '리뷰 — 쓰기', state: '쓰기', go: async p => { await login(p); await pd(p, '메론킥'); await p.locator('.v2 .link', { hasText: '리뷰 쓰기' }).click(); await wait(p, 400); }, part: ['.bar', '.v2 .bar'] },
    { id: 'S05F', mock: 'S05', name: '리뷰 — 못 불러옴', state: '못 불러옴', opts: { reviewsFail: true }, go: async p => { await pd(p, '메론킥'); await p.locator('.notice.r').scrollIntoViewIfNeeded(); await wait(p, 300); }, part: ['.notice.r', '.notice.r'] },
    { id: 'S05E', mock: 'S05', name: '리뷰 — 첫 리뷰', state: '첫 리뷰', opts: { noReviews: true }, go: async p => { await pd(p, '메론킥'); await p.locator('.ui-empty', { hasText: '리뷰' }).scrollIntoViewIfNeeded(); await wait(p, 300); }, part: ['.empty', '.v2 .ui-empty'] },
    // 장바구니·결제(S08~S12). 목업 장바구니는 박스·2개·300g 세 줄이라 앱(낱개 두 줄)과 금액이 다르다 — 부품은 배송 한 줄·결제 바 모양만
    { id: 'S08', name: '장바구니 — 오늘 도착', state: '오늘 도착', go: async p => { await cartOf(p); }, part: ['.bar', '.v2 .bar'] },
    { id: 'S08D', mock: 'S08', name: '장바구니 — 마감 후', state: '마감 후', opts: { deliv: 'tomorrow' }, go: async p => { await cartOf(p); }, part: ['.promise', '.promise'], partOnly: true },
    { id: 'S08X', mock: 'S08', name: '장바구니 — 당일배송 불가', state: '당일배송 불가', opts: { deliv: 'closed' }, go: async p => { await cartOf(p); }, part: ['.promise', '.promise'], partOnly: true },
    { id: 'S08V', mock: 'S08', name: '장바구니 — 배송 휴무', state: '배송 휴무', opts: { deliv: 'holiday' }, go: async p => { await cartOf(p); }, part: ['.promise', '.promise'], partOnly: true },
    { id: 'S09', name: '장바구니 — 비어 있음', go: async p => { await login(p); await tab(p, '장바구니').click(); await wait(p, 900); }, part: ['.empty', '.v2 .ui-empty'] },
    { id: 'S10', name: '결제 요약 — 포인트 펼침', state: '포인트 펼침', go: async p => { await orderOf(p); await p.locator('.v2 .row.tap', { hasText: '포인트' }).click(); await wait(p, 300); await p.locator('.v2 .kv.total').scrollIntoViewIfNeeded(); }, part: ['.sec:has(.kv)', '.v2 .sec:has(.kv)'] },
    { id: 'S10F', mock: 'S10', name: '결제 요약 — 혜택 못 불러옴', state: '혜택 못 불러옴', opts: { benefitsFail: true }, go: async p => { await orderOf(p); await p.locator('.v2 .notice.r').scrollIntoViewIfNeeded(); }, part: ['.notice.r', '.v2 .notice.r'] },
    { id: 'S10N', mock: 'S10', name: '결제 요약 — 주소 없음', state: '결제 못 함(주소 없음)', opts: { user: { ...customer, address: '', addressDetail: '', zipcode: '', dong_name: '' } }, go: async p => { await orderOf(p); }, part: ['.bar', '.v2 .bar'] },
    { id: 'S11', name: '배송지 시트 — 배송 가능', state: '배송 가능', go: async p => { await orderOf(p); await p.locator('.v2 .row.tap', { hasText: '변경' }).first().click(); await wait(p, 500); }, part: ['.notice.g', '.sheet .notice.g'] },
    { id: 'S11X', mock: 'S11', name: '배송지 시트 — 배송 불가', state: '배송 불가', opts: { noZone: true }, go: async p => { await orderOf(p); await p.locator('.v2 .row.tap', { hasText: '변경' }).first().click(); await wait(p, 500); }, part: ['.notice.r', '.sheet .notice.r'] },
    { id: 'S11N', mock: 'S11', name: '배송지 시트 — 동 정보 없음', state: '동 정보 없음', opts: { user: { ...customer, dong_name: '' } }, go: async p => { await orderOf(p); await p.locator('.v2 .row.tap', { hasText: '변경' }).first().click(); await wait(p, 500); }, part: ['.notice.o', '.sheet .notice.o'] },
    { id: 'P03', name: '주문서 한 장', go: async p => { await orderOf(p); }, part: ['.bar', '.v2 .bar'] },
    // 목업 P03 에는 쿠폰 시트 상태가 없다 — 모양을 보는 사진(화면 전체 %는 시트 때문에 크다 · 부품 비교 없음)
    { id: 'P03C', mock: 'P03', name: '주문서 — 쿠폰 시트(목업에 없는 상태)', go: async p => { await orderOf(p); await p.locator('.v2 .row.tap', { hasText: '쿠폰' }).first().click(); await wait(p, 500); } },
    { id: 'S13', name: '주문 완료(영수증)', go: async p => { await orderOf(p); await p.locator('.pay-bar button').click(); await wait(p, 1500); }, part: ['.bar', '.v2 .bar'] },
    { id: 'S12', name: '바로 주문', state: '기본', go: async p => { await login(p); await pd(p, '메론킥'); await p.getByRole('button', { name: '바로 주문', exact: true }).click(); await wait(p, 1200); }, part: ['.bar', '.v2 .bar'] },
  ],
  // 4 — 주문내역(P01) · 환불·교환(S15) · 매장 영수증(S17) · 온라인 주문 상세(S18)
  4: [
    { id: 'P01', name: '주문내역 — 전체', state: '전체', go: async p => { await ordersOf(p); }, part: ['.ocard', '.v2 .ocard'] },
    { id: 'P01O', mock: 'P01', name: '주문내역 — 온라인', state: '온라인', go: async p => { await ordersOf(p, '온라인'); }, part: ['.ocard', '.v2 .ocard'] },
    { id: 'P01S', mock: 'P01', name: '주문내역 — 매장', state: '매장', go: async p => { await ordersOf(p, '매장'); }, part: ['.ocard', '.v2 .ocard'] },
    { id: 'P01N', mock: 'P01', name: '주문내역 — 매장 · 미동의', state: '매장 · 미동의', opts: { noConsent: true }, go: async p => { await ordersOf(p, '매장'); }, part: ['.notice.g', '.v2 .notice.g'] },
    { id: 'P01E', mock: 'P01', name: '주문내역 — 비어 있음', state: '비어 있음', opts: { noOrders: true }, go: async p => { await ordersOf(p); }, part: ['.empty', '.v2 .ui-empty'] },
    { id: 'S15', name: '환불 요청 시트', go: async p => { await ordersOf(p, '온라인'); await p.getByRole('button', { name: '환불 요청', exact: true }).first().click(); await wait(p, 600); }, part: ['.sheet', '.sheet.v2'] },
    { id: 'S17', name: '매장 영수증 — 정상', state: '정상', go: async p => { await ordersOf(p, '매장'); await p.getByRole('button', { name: '영수증 보기' }).first().click(); await wait(p, 900); }, part: ['.receipt', '.v2 .receipt'] },
    { id: 'S17V', mock: 'S17', name: '매장 영수증 — 취소된 거래', state: '취소된 거래', opts: { voidedReceipt: true }, go: async p => { await ordersOf(p, '매장'); await p.getByRole('button', { name: '영수증 보기' }).first().click(); await wait(p, 900); }, part: ['.receipt', '.v2 .receipt'] },
    { id: 'S18', name: '온라인 주문 상세', go: async p => { await ordersOf(p, '온라인'); await p.locator('.ocard .oh').first().click(); await wait(p, 900); }, part: ['.timeline', '.v2 .timeline'] },
  ],
  // 5 — 마이(P02 · S47) · 찜(S19) · 쿠폰(S23) · 로그인 이력(S24) · 정보 수정(S21) · 비밀번호(S22) · 탈퇴(S25) · 로그아웃(S33) · 회사 소개(S40)
  5: [
    { id: 'P02', name: '마이 — 로그인함', state: '로그인함', go: async p => { await myOf(p); }, part: ['.group', '.v2 .group'] },
    { id: 'S47', mock: 'P02', name: '마이 — 로그인 안 함', state: '로그인 안 함', go: async p => { await myOf(p, { guest: true }); }, part: ['.group', '.v2 .group'] },
    { id: 'P02A', mock: 'P02', name: '마이 — 관리자', state: '관리자', opts: { user: { ...customer, role: 'owner', username: 'owner_demo' } }, go: async p => { await myOf(p); } },
    { id: 'S19', name: '찜 — 목록', state: '목록', go: async p => { await myOf(p, { row: '찜' }); }, part: ['.grid .pc', '.pgrid .pc'] },
    { id: 'S19E', mock: 'S19', name: '찜 — 비어 있음', state: '비어 있음', opts: { emptyWish: true }, go: async p => { await myOf(p, { row: '찜' }); }, part: ['.empty', '.v2 .ui-empty'] },
    { id: 'S23', name: '내 쿠폰 — 사용 가능', state: '사용 가능', go: async p => { await myOf(p, { row: '내 쿠폰' }); }, part: ['.sheet', '.sheet.v2'] },
    { id: 'S23U', mock: 'S23', name: '내 쿠폰 — 사용 완료', state: '사용 완료', go: async p => { await myOf(p, { row: '내 쿠폰' }); await p.getByRole('tab', { name: /사용 완료/ }).click(); await wait(p, 400); }, part: ['.sheet', '.sheet.v2'] },
    { id: 'S24', name: '로그인 이력', go: async p => { await myOf(p, { row: '로그인 이력' }); }, part: ['.sheet', '.sheet.v2'] },
    { id: 'S21', name: '회원정보 수정', state: '기본', go: async p => { await myOf(p); await p.locator('.my-v2 .row.prof').click(); await wait(p, 700); }, part: ['.sheet', '.sheet.v2'] },
    { id: 'S22', name: '비밀번호 변경', state: '입력 중', go: async p => { await myOf(p, { row: '비밀번호 변경' }); await p.locator('#pw-cur').fill('oldpass1'); await p.locator('#pw-new').fill('Newpass1'); await p.locator('#pw-cf').fill('Newpass1'); await wait(p, 300); }, part: ['.sheet', '.sheet.v2'] },
    { id: 'S25', name: '회원탈퇴', state: '입력', go: async p => { await myOf(p); await p.getByRole('button', { name: '회원탈퇴' }).click(); await wait(p, 700); }, part: ['.sheet', '.sheet.v2'] },
    { id: 'S33', name: '로그아웃 확인', state: '확인', go: async p => { await myOf(p, { row: '로그아웃' }); }, part: ['.alert', '.alert'] },
    { id: 'S33D', mock: 'S33', name: '로그아웃 완료 안내', state: '완료 안내', go: async p => { await myOf(p, { row: '로그아웃' }); await p.locator('.alert .af button', { hasText: '로그아웃' }).click(); await wait(p, 900); }, part: ['.alert', '.alert'] },
    { id: 'S40', name: '회사 소개·사업자 정보', state: '쿠폰 켬 · 오늘 도착', go: async p => { await myOf(p, { guest: true, row: '회사 소개·사업자 정보' }); } },
    // 공지(S26) — 마이 → 공지사항 · 첫 줄을 펼친 모양(목업 「목록」)
    { id: 'S26', name: '공지사항 — 목록', state: '목록', go: async p => { await myOf(p, { guest: true, row: '공지사항' }); await p.locator('.nt-row').first().click(); await wait(p, 300); }, part: ['.group', '.v2 .group'] },
    { id: 'S26E', mock: 'S26', name: '공지사항 — 비어 있음', state: '비어 있음', opts: { noNotices: true }, go: async p => { await myOf(p, { guest: true, row: '공지사항' }); }, part: ['.empty', '.v2 .ui-empty'] },
    { id: 'S26A', mock: 'S26', name: '공지사항 — 관리자 등록', state: '관리자 등록', opts: { user: { ...customer, role: 'owner', username: 'owner_demo' } }, go: async p => { await myOf(p, { row: '공지사항' }); await p.getByRole('button', { name: '+ 등록' }).click(); await p.locator('#nt-title').focus(); await wait(p, 300); } },
    // 묶음 5 뒷부분 — 로그인(S27) · 회원가입 3단계(P04) · 찾기(S29) · 첫 로그인 비밀번호(S31) · 매장 이용 동의(S32)
    { id: 'S27', name: '로그인', state: '기본', go: async p => { await loginPage(p); await fillLogin(p); await p.getByPlaceholder(/비밀번호를 입력해 ?주세요/).focus(); await wait(p, 300); }, part: ['.auth', '.v2 .auth'] },
    { id: 'S27E', mock: 'S27', name: '로그인 — 오류', state: '오류', opts: { loginFail: true }, go: async p => { await loginPage(p); await fillLogin(p); await p.getByRole('button', { name: '로그인', exact: true }).filter({ visible: true }).first().click(); await wait(p, 700); await p.locator('body').click({ position: { x: 5, y: 5 } }); }, part: ['.auth', '.v2 .auth'] },
    { id: 'P04', name: '회원가입 1단계 — 어디로 배송할까요', state: '1단계', go: async p => { await signupStep(p, 1); }, part: ['.auth', '.v2 .auth'] },
    { id: 'P04B', mock: 'P04', name: '회원가입 2단계 — 계정 만들기', state: '2단계 · 본인확인 전', go: async p => { await signupStep(p, 2); } },
    { id: 'P04C', mock: 'P04', name: '회원가입 3단계 — 동의', state: '3단계 · 동의', go: async p => { await signupStep(p, 3); }, part: ['.group', '.v2 .group.consents'] },
    { id: 'P04N', mock: 'P04', name: '회원가입 3단계 — 필수만', state: '3단계 · 선택 안 함', go: async p => { await signupStep(p, 31); }, part: ['.group', '.v2 .group.consents'] },
    { id: 'P04D', mock: 'P04', name: '가입 완료 — 쿠폰 켬', state: '가입 완료 · 쿠폰 켬', go: async p => { await signupStep(p, 4); } },
    { id: 'P04X', mock: 'P04', name: '가입 완료 — 쿠폰 꺼짐', state: '가입 완료 · 쿠폰 꺼짐', opts: { noCoupon: true }, go: async p => { await signupStep(p, 4); } },
    { id: 'S29', name: '아이디·비밀번호 찾기(준비 중)', state: '아이디 찾기', go: async p => { await loginPage(p); await p.getByRole('button', { name: '아이디/비밀번호 찾기' }).click(); await wait(p, 600); } },
    { id: 'S31', name: '첫 로그인 비밀번호 바꾸기', opts: { mustChange: true }, go: async p => { await login(p); await p.locator('#mcp-pw').fill('Newpass1'); await wait(p, 300); }, part: ['.alert', '.alert'] },
    { id: 'S32', name: '매장 이용 동의', opts: { needsConsent: true }, go: async p => { await login(p); await wait(p, 600); }, part: ['.sheet', '.sheet.v2'] },
  ],
  // 묶음 6 — 새 화면 중 서버가 이미 있는 것부터(2026-11-13 새벽)
  6: [
    { id: 'S41', name: '최근 본 상품 — 목록', state: '목록', go: async p => { await myOf(p, { row: '최근 본 상품' }); }, part: ['.grid .pc', '.pgrid .pc'] },
    { id: 'S41E', mock: 'S41', name: '최근 본 상품 — 비어 있음', state: '비어 있음', opts: { noRecent: true }, go: async p => { await myOf(p, { row: '최근 본 상품' }); }, part: ['.empty', '.v2 .ui-empty'] },
    { id: 'S42', name: '내 리뷰 — 목록', state: '목록', go: async p => { await myOf(p, { row: '내 리뷰' }); }, part: ['.review', '.v2 .review'] },
    { id: 'S42E', mock: 'S42', name: '내 리뷰 — 비어 있음', state: '비어 있음', opts: { noReviews: true }, go: async p => { await myOf(p, { row: '내 리뷰' }); }, part: ['.empty', '.v2 .ui-empty'] },
    // 매장안내(S44)·고객센터(S46) — 마이 → 회사 소개 → 칩
    { id: 'S44', name: '매장안내 — 목록', state: '목록', go: async p => { await aboutChip(p, '매장안내'); }, part: ['.store-card', '.v2 .store-card'] },
    { id: 'S44C', mock: 'S44', name: '매장안내 — 매장 바꾸기 확인', state: '매장 바꾸기 확인', go: async p => { await aboutChip(p, '매장안내'); await p.getByRole('button', { name: '이 매장으로' }).last().click(); await wait(p, 400); }, part: ['.alert', '.alert'] },
    { id: 'S44X', mock: 'S44', name: '매장안내 — 불러오지 못함', state: '불러오지 못함', opts: { storesFail: true }, go: async p => { await aboutChip(p, '매장안내'); }, part: ['.empty', '.v2 .ui-empty'] },
    { id: 'S46', name: '고객센터 — 기본', state: '기본', go: async p => { await aboutChip(p, '고객센터'); }, part: ['.group', '.v2 .group'] },
    { id: 'S46O', mock: 'S46', name: '고객센터 — 질문 펼침', state: '질문 펼침', go: async p => { await aboutChip(p, '고객센터'); await p.locator('.faq-row').first().click(); await wait(p, 300); }, part: ['.faq .group', '.v2 .faq .group'] },
    { id: 'S42D', mock: 'S42', name: '내 리뷰 — 삭제 확인', state: '삭제 확인', go: async p => { await myOf(p, { row: '내 리뷰' }); await p.locator('.mr-del').first().click(); await wait(p, 400); }, part: ['.alert', '.alert'] },
  ],
};

async function shootMock(browser, s, size, theme) {
  const ctx = await browser.newContext({ viewport: size.viewport, deviceScaleFactor: size.dsf, colorScheme: theme });
  await ctx.route('**/*', r => (r.request().url().startsWith('file:') ? r.continue() : r.abort()));
  const p = await ctx.newPage();
  await p.goto(`${MOCK}?solo=${s.mock || s.id}&theme=${theme}${s.state ? `&state=${encodeURIComponent(s.state)}` : ''}`);
  await wait(p, 500);
  const full = await p.screenshot();
  const part = s.part ? await p.locator(s.part[0]).first().screenshot().catch(() => null) : null;
  await ctx.close();
  return { full, part };
}

async function shootApp(browser, s, size, theme) {
  const ctx = await browser.newContext({ viewport: size.viewport, deviceScaleFactor: size.dsf, isMobile: true, hasTouch: true, userAgent: ANDROID_UA, colorScheme: theme, locale: 'ko-KR' });
  await ctx.addInitScript(() => { try { localStorage.setItem('guestStoreId', '11'); localStorage.setItem('srmart_pwa_dismissed_at', String(Date.now())); window.open = () => null; } catch (e) {} });
  const ctl = { holdChunks: false };
  await ctx.route('**/*', async (r) => {
    const u = new URL(r.request().url());
    if (u.origin === new URL(BASE).origin && u.pathname.startsWith('/api/')) {
      const res = route(u.pathname.slice(4), r.request().method(), u.search, s.opts || {});
      if (res.delay) return;
      if (res.abort) return r.abort();   // 인터넷이 끊긴 것처럼(응답 자체가 없다)
      return r.fulfill({ status: res.status, contentType: 'application/json', body: JSON.stringify(res.body) });
    }
    if (ctl.holdChunks && /\.chunk\.js$/.test(u.pathname)) return;   // 조각을 끝까지 안 준다 → 불러오는 중 화면
    if (u.hostname === 'localhost' && u.port === '5001') return r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ next_redirect_pc_url: 'about:blank' }) });   // 카카오페이 준비(가짜 — capture-app 과 같다)
    if (u.origin !== new URL(BASE).origin) return r.abort();          // 외부(글꼴·우편번호·사진 CDN)는 막는다 — 사진이 그날 인터넷에 좌우되지 않게
    return r.continue();
  });
  const p = await ctx.newPage();
  const errors = [];
  p.on('pageerror', e => errors.push(String(e.message).slice(0, 120)));
  try {
    await p.goto(BASE + '/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await wait(p, 1800);
    await s.go(p, ctx, ctl);
    const full = await p.screenshot();
    const part = s.part ? await p.locator(s.part[1]).filter({ visible: true }).first().screenshot().catch(() => null) : null;
    return { full, part, errors };
  } finally { await ctx.close(); }
}

// 두 사진을 같은 크기(목업 기준)로 맞추고 차이 비율 + 빨간 표시 사진
async function diff(a, b) {
  const ma = await sharp(a).metadata();
  const W = ma.width, H = ma.height;
  const ra = await sharp(a).ensureAlpha().raw().toBuffer();
  const rb = await sharp(b).resize(W, H, { fit: 'fill' }).ensureAlpha().raw().toBuffer();
  const out = Buffer.alloc(W * H * 4);
  let n = 0;
  for (let i = 0; i < W * H; i++) {
    const o = i * 4;
    const d = Math.max(Math.abs(ra[o] - rb[o]), Math.abs(ra[o + 1] - rb[o + 1]), Math.abs(ra[o + 2] - rb[o + 2]));
    if (d > 32) { n++; out[o] = 255; out[o + 1] = 0; out[o + 2] = 0; out[o + 3] = 255; }
    else { const g = Math.round((rb[o] + rb[o + 1] + rb[o + 2]) / 3 * 0.35 + 165); out[o] = g; out[o + 1] = g; out[o + 2] = g; out[o + 3] = 255; }
  }
  const png = await sharp(out, { raw: { width: W, height: H, channels: 4 } }).png({ compressionLevel: 9 }).toBuffer();
  return { pct: Math.round((n / (W * H)) * 1000) / 10, png };
}

const small = buf => sharp(buf, { limitInputPixels: false }).png({ palette: true, quality: 90, compressionLevel: 9 }).toBuffer();

// 두 칸(목업|앱) 사진 — check-progress.js 가 보는 compare/<ID>_<theme>.png
async function sideBySide(a, b) {
  const ma = await sharp(a).metadata();
  const bb = await sharp(b).resize(ma.width, ma.height, { fit: 'fill' }).toBuffer();
  const gap = 16;
  return sharp({ create: { width: ma.width * 2 + gap, height: ma.height, channels: 3, background: { r: 128, g: 128, b: 128 } } })
    .composite([{ input: a, left: 0, top: 0 }, { input: bb, left: ma.width + gap, top: 0 }]).png({ palette: true, compressionLevel: 9 }).toBuffer();
}

// 시트는 화면 5개씩 나눈다 — 묶음 2(21화면)를 한 장으로 붙였더니 sharp 의 픽셀 한도를 넘어 시트가 안 나왔다
const SHEET_PER = 5;
async function sheets(browser, rows, theme) {
  const all = [...new Set(rows.filter(r => r.theme === theme).map(c => c.id))];
  const pages = Math.ceil(all.length / SHEET_PER);
  for (let i = 0; i < pages; i++) await sheet(browser, rows, theme, all.slice(i * SHEET_PER, (i + 1) * SHEET_PER), pages > 1 ? `_${i + 1}` : '', pages > 1 ? ` (${i + 1}/${pages})` : '');
}
async function sheet(browser, rows, theme, ids, suffix, pageLabel) {
  const cells = rows.filter(r => r.theme === theme);
  const rel = f => pathToFileURL(f).href;
  const html = `<!doctype html><meta charset="utf-8"><style>
    body{margin:0;padding:24px;font:14px/1.4 -apple-system,"Apple SD Gothic Neo","Malgun Gothic",sans-serif;background:${theme === 'dark' ? '#111' : '#f4f4f6'};color:${theme === 'dark' ? '#eee' : '#111'}}
    h1{font-size:20px;margin:0 0 4px} p.n{margin:0 0 16px;color:#888}
    .row{margin:0 0 28px} .row h2{font-size:16px;margin:0 0 8px}
    .sz{display:inline-block;vertical-align:top;margin:0 18px 0 0}
    .sz b{display:block;margin:0 0 4px} .trip{display:flex;gap:6px} .trip figure{margin:0}
    .trip img{height:300px;border:1px solid #888;display:block} figcaption{font-size:12px;color:#888;text-align:center}
    .pct{font-weight:700;color:#e33}
  </style><h1>묶음 ${BUNDLE} 비교 — ${theme === 'dark' ? '어둡게' : '밝게'} · 목업 | 앱 | 차이(빨강)${pageLabel}</h1>
  <p class="n">차이 % = 목업 크기로 맞춘 두 사진에서 다른 점의 비율. 전체 칸은 목업 기기 액자(상태바 시계·홈 막대) 때문에 0 이 될 수 없다 — 「부품」 칸이 진짜 비교다.</p>
  ${ids.map(id => { const rs = cells.filter(c => c.id === id); return `<div class="row"><h2>${id} ${rs[0].name}</h2>${rs.map(c => `<div class="sz"><b>${c.label}${c.part ? ' · 부품' : ''} <span class="pct">${c.pct}%</span></b><div class="trip"><figure><img src="${rel(c.mockFile)}"><figcaption>목업</figcaption></figure><figure><img src="${rel(c.appFile)}"><figcaption>앱</figcaption></figure><figure><img src="${rel(c.diffFile)}"><figcaption>차이</figcaption></figure></div></div>`).join('')}</div>`; }).join('')}`;
  const f = path.join(OUT, `_sheet_${theme}${suffix}.html`);
  fs.writeFileSync(f, html);
  const ctx = await browser.newContext({ viewport: { width: 2400, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(rel(f));
  await wait(p, 600);
  const buf = await p.screenshot({ fullPage: true });
  await ctx.close();
  fs.writeFileSync(path.join(OUT, `sheet_${theme}${suffix}.png`), await small(buf));
  fs.unlinkSync(f);
}

(async () => {
  const list = BUNDLES[BUNDLE];
  if (!list) throw new Error(`묶음 ${BUNDLE} 화면 목록이 없다`);
  // --only S26,S26A — 그 화면만 다시 찍는다. 숫자(report)·시트는 지난 결과와 **합쳐서** 다시 쓴다(나머지 줄이 사라지지 않게)
  const ONLY = (arg('--only', '') || '').split(',').map(x => x.trim()).filter(Boolean);
  const unknown = ONLY.filter(id => !list.some(s => s.id === id));
  if (unknown.length) throw new Error(`--only 에 묶음 ${BUNDLE} 에 없는 화면: ${unknown.join(',')}`);
  const shootList = ONLY.length ? list.filter(s => ONLY.includes(s.id)) : list;
  for (const d of [APP_DIR, CMP_DIR, OUT, path.join(OUT, 'parts')]) fs.mkdirSync(d, { recursive: true });
  const browser = await chromium.launch();
  const rows = [];
  for (const s of shootList) {
    for (const size of sizesOf(s)) for (const theme of ['light', 'dark']) {
      const m = await shootMock(browser, s, size, theme);
      let a;
      try { a = await shootApp(browser, s, size, theme); } catch (e) { console.log(`🔴 ${s.id} ${size.label} ${theme} 앱 사진 실패 — ${e.message.split('\n')[0]}`); continue; }
      const base = `${s.id}_${size.tag}${theme}`;
      if (!s.partOnly) {
        const appFile = path.join(APP_DIR, `${base}.png`);
        fs.writeFileSync(appFile, await small(a.full));
        if (size.key === 'phone' || size.key === 'tland') fs.writeFileSync(path.join(CMP_DIR, `${base}.png`), await sideBySide(m.full, a.full));
        const dd = await diff(m.full, a.full);
        const mockFile = path.join(OUT, `${base}_mock.png`), diffFile = path.join(OUT, `${base}_diff.png`), appCopy = path.join(OUT, `${base}_app.png`);
        fs.writeFileSync(mockFile, await small(m.full)); fs.writeFileSync(diffFile, await small(dd.png)); fs.writeFileSync(appCopy, await small(a.full));
        rows.push({ id: s.id, name: s.name, theme, size: size.key, label: size.label, part: false, pct: dd.pct, mockFile, appFile: appCopy, diffFile, errors: a.errors });
      }
      if (m.part && a.part) {
        const dd = await diff(m.part, a.part);
        const pb = path.join(OUT, 'parts', base);
        fs.writeFileSync(pb + '_mock.png', m.part); fs.writeFileSync(pb + '_app.png', a.part); fs.writeFileSync(pb + '_diff.png', dd.png);
        rows.push({ id: s.id, name: s.name, theme, size: size.key, label: size.label, part: true, pct: dd.pct, mockFile: pb + '_mock.png', appFile: pb + '_app.png', diffFile: pb + '_diff.png', errors: a.errors });
      } else if (s.part) {
        console.log(`⚠ ${s.id} ${size.label} ${theme} 부품을 못 찾았다(목업 ${m.part ? '있음' : '없음'} · 앱 ${a.part ? '있음' : '없음'})`);
      }
    }
    const mine = rows.filter(r => r.id === s.id);
    console.log(`${s.id} ${s.name} — ${mine.map(r => `${r.label}${r.part ? '·부품' : ''}·${r.theme === 'dark' ? '어둡게' : '밝게'} ${r.pct}%`).join(' | ')}${mine.some(r => r.errors.length) ? ' 🔴 스크립트 오류: ' + [...new Set(mine.flatMap(r => r.errors))].join(' / ') : ''}`);
  }
  const relp = f => path.relative(ROOT, f).split(path.sep).join('/');
  if (ONLY.length) {
    let old = [];
    try { old = JSON.parse(fs.readFileSync(path.join(OUT, 'report.json'), 'utf8')); } catch { /* 지난 결과가 없으면 이번 것만 */ }
    const kept = old.filter(r => !ONLY.includes(r.id)).map(r => ({ ...r, errors: r.errors || [], mockFile: path.join(ROOT, r.mockFile), appFile: path.join(ROOT, r.appFile), diffFile: path.join(ROOT, r.diffFile) }));
    const order = id => list.findIndex(x => x.id === id);
    const all = [...kept, ...rows].sort((a, b) => order(a.id) - order(b.id));
    rows.length = 0; rows.push(...all);
  }
  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(rows.map(r => ({ ...r, mockFile: relp(r.mockFile), appFile: relp(r.appFile), diffFile: relp(r.diffFile) })), null, 1));
  const md = [`# 묶음 ${BUNDLE} 픽셀 차이 (${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC)`, '', '| 화면 | 크기 | 비교 | 밝게 % | 어둡게 % |', '|---|---|---|---|---|'];
  for (const s of list) for (const size of sizesOf(s)) for (const part of [false, true]) {
    const l = rows.find(r => r.id === s.id && r.size === size.key && r.part === part && r.theme === 'light');
    const d = rows.find(r => r.id === s.id && r.size === size.key && r.part === part && r.theme === 'dark');
    if (l || d) md.push(`| ${s.id} ${s.name} | ${size.label} | ${part ? '부품' : '화면 전체'} | ${l ? l.pct : '-'} | ${d ? d.pct : '-'} |`);
  }
  fs.writeFileSync(path.join(OUT, 'report.md'), md.join('\n') + '\n');
  // 숫자를 먼저 적고 시트를 만든다 — 시트가 실패해도 숫자는 남는다
  for (const t of ['light', 'dark']) await sheets(browser, rows, t);
  await browser.close();
  console.log('저장: ' + relp(OUT));
})().catch(e => { console.error('🔴', e); process.exit(1); });

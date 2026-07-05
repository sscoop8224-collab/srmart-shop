// 카카오페이 결제는 src/api.js의 PAY_API 인스턴스로 중앙화되었습니다.
// (환경별 baseURL 처리 + 하드코딩 localhost 제거)
// 기존 import 경로(`./pages/KakaoPay`)를 유지하기 위해 재-export 합니다.
export { kakaoPayReady } from '../api';

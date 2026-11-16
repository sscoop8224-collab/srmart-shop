import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dongsin.srmart',
  appName: '에스알마트',
  webDir: 'build',
  android: {
    allowMixedContent: true,
    // captureInput=true는 웹뷰가 raw 입력을 가로채 한글 IME(조합 입력)를 깨뜨림(숫자만 입력됨) → false.
    captureInput: false,
    webContentsDebuggingEnabled: false,
    loggingBehavior: 'none',
    backgroundColor: '#077D3C',   // 웹뷰 기본 배경 = 다크그린(스플래시와 동일) → 로드 중 흰 화면 방지
  },
  server: {
    androidScheme: 'https',
    // 웹뷰가 배포된 라이브 쇼핑몰을 로드(호스티드). 도메인 고정.
    // 🔴 브랜드마다 주소가 다르다(2026-11-15): 에스알마트 /srm/ · 아람마트 /aram/ — 값의 원본은 brands/<id>/brand.json 의 url.
    //    이 값은 에스알마트(srm) 것이다. cap sync 뒤 scripts/cap-brand-config.cjs 가 브랜드(flavor)별 사본을
    //    android/app/src/<브랜드>/assets/capacitor.config.json 에 쓴다(flavor 쪽이 main 을 덮는다).
    //    🔴 nginx 에 /srm/·/aram/ 이 걸리기 전에 이 주소로 APK 를 찍으면 앱이 홈페이지를 연다(docs/ARAM_WEB_PATH.md).
    // 이점: 웹 배포가 앱에 바로 반영(웹 변경 시 APK 재빌드 불필요). 단, 서버 접속 필요(오프라인=빈 화면).
    url: 'https://www.dongsinmarket.com/srm/',
    cleartext: false,
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
    Keyboard: {
      resize: 'body',
      style: 'default',
      resizeOnFullScreen: true,
    },
    SplashScreen: {
      launchShowDuration: 0,
      launchAutoHide: false,
      backgroundColor: '#077D3C',
      androidScaleType: 'FIT_CENTER',
      showSpinner: false,
      // 런치 스플래시 종료는 MainActivity에서 직접(즉시 제거) 처리 → 플러그인 런치 제어 미사용(launchShowDuration:0 유지).
    },
    StatusBar: {
      overlaysWebView: false,
      style: 'DARK',
    },
  },
};

export default config;
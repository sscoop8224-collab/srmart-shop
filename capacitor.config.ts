import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dongshin.srmart',
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
    // 이점: 웹 배포가 앱에 바로 반영(웹 변경 시 APK 재빌드 불필요). 단, 서버 접속 필요(오프라인=빈 화면).
    url: 'https://www.dongsinmarket.com/shop/',
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
      // launchFadeOutDuration>0이면 플러그인이 종료를 직접 처리(즉시 제거) → Android12 기본 종료 애니(초록 노출) 회피.
      launchFadeOutDuration: 1,
    },
    StatusBar: {
      overlaysWebView: false,
      style: 'DARK',
    },
  },
};

export default config;
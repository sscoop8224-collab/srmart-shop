import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dongshin.srmart',
  appName: '에스알마트',
  webDir: 'build',
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    loggingBehavior: 'none',
  },
  server: {
    androidScheme: 'https',
    // 웹뷰가 배포된 라이브 쇼핑몰을 로드(호스티드). Tailscale IP 제거 → 도메인 고정.
    // 이점: 웹 배포가 앱에 바로 반영(웹 변경 시 APK 재빌드 불필요). 단, 서버 접속 필요(오프라인=빈 화면).
    url: 'https://dongsinmarket.co.kr/shop/',
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
    },
    StatusBar: {
      overlaysWebView: false,
      style: 'DARK',
    },
  },
};

export default config;
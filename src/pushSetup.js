// pushSetup.js — 앱(네이티브) 푸시 알림 초기화.
//  앱 최초 실행 시 알림 권한을 요청(안드로이드 13+ 표준 프롬프트)하고,
//  허용되면 FCM 토큰을 발급받아 서버(device_tokens)에 등록한다. 웹에서는 아무것도 하지 않음.
import { Capacitor } from '@capacitor/core';
import { registerPushToken } from './api';

let _done = false;

export async function initPush() {
  if (_done) return;
  if (!Capacitor.isNativePlatform()) return;           // 웹은 스킵(푸시는 네이티브 앱 전용)
  _done = true;
  let PushNotifications;
  try { ({ PushNotifications } = await import('@capacitor/push-notifications')); }
  catch { return; }                                    // 플러그인 없음(구 APK 등) → 조용히 종료

  try {
    // 1) 권한 확인 → 필요 시 요청("알림을 허용하시겠어요?")
    let perm = await PushNotifications.checkPermissions();
    if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') {
      perm = await PushNotifications.requestPermissions();
    }
    if (perm.receive !== 'granted') return;            // 거부 → 등록 안 함(알림 안 감)

    // 2) 토큰 발급 리스너 → 서버 등록
    PushNotifications.addListener('registration', (token) => {
      const guestStoreId = Number(localStorage.getItem('guestStoreId')) || undefined;
      registerPushToken(token.value, Capacitor.getPlatform(), guestStoreId).catch(() => {});
    });
    PushNotifications.addListener('registrationError', (err) => {
      console.warn('[push] 토큰 등록 오류:', err?.error || err);
    });
    // 포그라운드 수신(필요 시 앱 내 표시). 지금은 시스템 알림에 맡김.
    PushNotifications.addListener('pushNotificationReceived', () => {});

    // 3) FCM 등록 시작 → 'registration' 이벤트로 토큰 도착
    await PushNotifications.register();
  } catch (e) {
    console.warn('[push] 초기화 오류:', e?.message || e);
  }
}

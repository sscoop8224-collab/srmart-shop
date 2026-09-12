// pushSetup.js — 앱(네이티브) 푸시 알림 초기화.
//  앱 최초 실행 시 알림 권한을 요청(안드로이드 13+ 표준 프롬프트)하고,
//  허용되면 FCM 토큰을 발급받아 서버(device_tokens)에 등록한다. 웹에서는 아무것도 하지 않음.
import { Capacitor } from '@capacitor/core';
import { registerPushToken } from './api';

let _done = false;

/**
 * 알림을 **탭했을 때** 갈 곳. App 이 initPush(onOpen) 으로 넘긴다.
 *
 * 리스너를 여기서 바로 네비게이션하지 않고 콜백으로 빼는 이유: 이 파일은 화면 구조를
 * 모른다(pos 의 hal 계층과 같은 원칙). 나중에 알림 종류가 늘어도 여기는 type 만 넘기면 된다.
 */
export async function initPush(onOpen) {
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

    // 3) **알림을 탭했을 때** — 전자영수증 알림이면 그 영수증으로 보낸다.
    //
    // 이게 없으면 앱만 열리고 손님은 영수증을 직접 찾아 들어가야 한다. 계산대는 이미
    // 푸시를 보내고 있었는데 받는 쪽에 이 처리가 없어서, 알림이 사실상 "앱 열기" 였다.
    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
      const data = action?.notification?.data || {};
      if (data.type === 'pos_receipt') onOpen?.({ type: 'pos_receipt', saleId: Number(data.sale_id) || null });
    });

    // 4) FCM 등록 시작 → 'registration' 이벤트로 토큰 도착
    await PushNotifications.register();
  } catch (e) {
    console.warn('[push] 초기화 오류:', e?.message || e);
  }
}

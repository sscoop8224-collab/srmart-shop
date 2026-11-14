// 네이티브 앱 정보 — 패키지(app_id) · 버전 (2026-11-14 대표님 결정 b · 지시 12)
//
//   · 서버가 브랜드를 정할 때 **앱 패키지**를 믿는다(웹 번들의 BRAND 와 앱이 어긋나도 앱 기준 — 지금은 두 앱이 같은 웹 주소를 연다).
//   · 최소 버전 확인은 **네이티브 버전**(versionName)으로 한다. 웹 번들은 서버에서 바로 바뀌므로 볼 필요가 없다.
//   · 웹(브라우저)에서는 null.
import { Capacitor } from '@capacitor/core';

let _info = null;

/** @returns {Promise<{ id: string, version: string, build: string } | null>} */
export function nativeAppInfo() {
  if (!Capacitor.isNativePlatform()) return Promise.resolve(null);
  if (!_info) {
    _info = import('@capacitor/app')
      .then(({ App }) => App.getInfo())
      .then(i => ({ id: String(i.id || ''), version: String(i.version || ''), build: String(i.build || '') }))
      .catch(() => null);
  }
  return _info;
}

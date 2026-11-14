// 최소 버전 확인 (2026-11-14 대표님 지시 12) — 판단은 서버 src/services/appVersions.js 한 곳
//
// 앱(네이티브)이 켜질 때 한 번, 패키지·네이티브 버전을 서버에 알린다. 대표가 어드민 「쇼핑앱 최소 버전」에
// 정한 버전보다 낮으면 앱 화면 대신 「새 버전으로 업데이트해 주세요」 한 장만 보이고, 단추가 스토어를 연다.
//   · 웹(브라우저)은 확인하지 않는다 — 웹 화면은 서버에서 바로 바뀐다.
//   · 🔴 확인이 실패하면(서버·네트워크) 막지 않는다. 잘못 막으면 손님은 앱을 아예 못 쓴다.
import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { checkAppVersion } from '../api';
import { nativeAppInfo } from '../appInfo';
import { BRAND } from '../brand';

export default function UpdateGate({ children }) {
  const [need, setNeed] = useState(null);   // null = 막지 않음 · { store_url, message, min_version, version }

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let alive = true;
    (async () => {
      const info = await nativeAppInfo();
      if (!info) return;
      const r = await checkAppVersion({ app_id: info.id, platform: Capacitor.getPlatform(), version: info.version });
      if (alive && r && r.data && r.data.update_required) setNeed({ ...r.data, version: info.version });
    })().catch(() => { /* 막지 않는다 */ });
    return () => { alive = false; };
  }, []);

  if (!need) return children;

  const open = () => { if (need.store_url) window.open(need.store_url, '_system'); };
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'var(--bg)', color: 'var(--text)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', textAlign: 'center', gap: 14 }}>
      <img src={`${process.env.PUBLIC_URL}/icons/icon-144.png`} alt="" width={72} height={72} style={{ borderRadius: 18 }} />
      <div style={{ fontSize: 'var(--fs-title1)', fontWeight: 800 }}>새 버전으로 업데이트해 주세요</div>
      <div style={{ fontSize: 15, color: 'var(--text-2)', lineHeight: 1.6 }}>
        {BRAND.name} 앱이 새로 나왔어요. 업데이트한 뒤에 계속 쓸 수 있어요.
        {need.message ? <><br />{need.message}</> : null}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-3)' }}>지금 버전 {need.version} · 필요한 버전 {need.min_version} 이상</div>
      {need.store_url && (
        <button type="button" onClick={open}
          style={{ marginTop: 8, minHeight: 'var(--hit)', padding: '0 28px', border: 0, borderRadius: 12, background: 'var(--brand-fill)', color: 'var(--on-brand-fill)', fontSize: 16, fontWeight: 700, fontFamily: 'inherit' }}>
          업데이트하러 가기
        </button>
      )}
    </div>
  );
}

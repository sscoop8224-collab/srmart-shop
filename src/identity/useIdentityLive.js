// 본인확인이 「연동 켬」 인가 — 화면이 본인확인 단계를 그릴지 정한다(2026-11-16 지시 7)
//   null = 아직 모름(읽는 중) · true · false. 못 읽으면 false — 화면은 옛 방법(문자 인증·「준비 중」)으로 간다.
//   🔴 판정은 서버가 한다. 이 값은 「어느 화면을 그릴까」만 정한다(가입 입구가 다시 본다 — IDENTITY_REQUIRED).
import { useEffect, useState } from 'react';
import { identityStatus } from './identityClient';

export default function useIdentityLive(enabled = true) {
  const [live, setLive] = useState(null);
  useEffect(() => {
    if (!enabled) return undefined;
    let off = false;
    identityStatus().then((s) => { if (!off) setLive(!!s.live); });
    return () => { off = true; };
  }, [enabled]);
  return [live, setLive];
}

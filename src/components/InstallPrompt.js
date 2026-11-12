// 앱 설치 안내 (목업 정본 v1 의 S38, 묶음 6 · 2026-11-13 새벽)
// 언제: 설치 안 한 웹 손님에게 3초 뒤 한 번 · 닫으면 7일 숨김 · 홈페이지 「앱 다운로드」(/shop/?install=1)로 오면 바로(숨김 무시) — 예전 그대로.
// 모양(목업):
//   · 안드로이드 = 탭바 위 카드 — 아이콘 · 「에스알마트 앱 설치」 · 「설치」(브라우저 설치 창) · 닫기
//   · 아이폰 = 아래 시트 「홈 화면에 추가하기」 — Safari 「공유 → 홈 화면에 추가」 안내 · 「나중에」
import { useState, useEffect } from 'react';
import Icon from './ui/Icon';

const DISMISSED_KEY = 'srmart_pwa_dismissed_at';
const DISMISS_DAYS  = 7;
const ICON = `${process.env.PUBLIC_URL}/icons/icon-144.png`;

function isIOS() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
}

function isInStandaloneMode() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow]                     = useState(false);
  const [showIOS, setShowIOS]               = useState(false);

  useEffect(() => {
    if (isInStandaloneMode()) return;

    // 홈페이지 '앱 다운로드'에서 넘어온 경우(/shop/?install=1) — 설치 UI를 즉시 띄우고 7일 숨김도 무시.
    const forceInstall = new URLSearchParams(window.location.search).get('install') === '1';

    if (!forceInstall) {
      const dismissed = localStorage.getItem(DISMISSED_KEY);
      if (dismissed) {
        const days = (Date.now() - Number(dismissed)) / (1000 * 60 * 60 * 24);
        if (days < DISMISS_DAYS) return;
      }
    }

    const delay = forceInstall ? 0 : 3000;

    if (isIOS()) {
      // iOS: Safari 공유 메뉴 안내 (기본 3초 딜레이, 설치 유도 진입 시 즉시)
      const t = setTimeout(() => setShowIOS(true), delay);
      return () => clearTimeout(t);
    }

    // Android 등: beforeinstallprompt 캡처 후 설치 배너(설치 버튼=사용자 제스처로 네이티브 프롬프트).
    let timer;
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      timer = setTimeout(() => setShow(true), delay);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => { window.removeEventListener('beforeinstallprompt', handler); if (timer) clearTimeout(timer); };
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setShow(false);
    setShowIOS(false);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    }
    setDeferredPrompt(null);
    setShow(false);
  };

  if (showIOS) {
    return (
      <div className="overlay sheet-over" role="dialog" aria-modal="true" aria-labelledby="install-ios-title" onClick={(e) => { if (e.target === e.currentTarget) dismiss(); }}>
        <div className="sheet v2 plain">
          <div className="grabber" />
          <div className="sheet-h">
            <div className="nav-side" />
            <div className="nav-title" id="install-ios-title">홈 화면에 추가하기</div>
            <div className="nav-side r"><button type="button" className="nav-btn b" onClick={dismiss}>나중에</button></div>
          </div>
          <div className="sheet-b">
            <div className="pad install-ios">
              <img src={ICON} alt="" />
              <p>Safari 아래쪽 <b>공유</b> <Icon name="share" size="sm" /> 버튼을 누른 뒤<br /><b>「홈 화면에 추가」</b>를 골라 주세요.</p>
              <p className="f-hint">홈 화면에 추가하면 앱처럼 빠르게 열려요</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!show) return null;
  return (
    <div className="v2 install-v2">
      <div className="toast install-card" role="dialog" aria-label="에스알마트 앱 설치">
        <img src={ICON} alt="" />
        <div className="install-txt"><b>에스알마트 앱 설치</b><div className="f-hint">홈 화면에서 앱처럼 빠르게 열려요</div></div>
        <button type="button" className="ui-btn sm pri" onClick={install}>설치</button>
        <button type="button" className="nav-btn plain" aria-label="닫기" onClick={dismiss}><Icon name="x" size="sm" /></button>
      </div>
    </div>
  );
}

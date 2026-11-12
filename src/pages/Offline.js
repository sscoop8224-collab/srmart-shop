import { useState } from 'react';
import Icon from '../components/ui/Icon';

// 오프라인(S36) — 목업 정본 v1 그대로: 전체 화면 · 빨간 동그라미 아이콘 · 「다시 시도」 → 「연결 확인 중…」(묶음 1 · 2026-11-12)
export default function Offline({ onRetry }) {
  const [checking, setChecking] = useState(false);

  const handleRetry = async () => {
    setChecking(true);
    try {
      await fetch('/manifest.json', { cache: 'no-store' });
      if (onRetry) onRetry();
      else window.location.reload();
    } catch {
      setChecking(false);
    }
  };

  return (
    <div style={{ background: 'var(--bg-plain)', minHeight: '100vh', paddingTop: '30vh' }}>
      <div className="ui-empty">
        <div className="big r"><Icon name="wifiOff" /></div>
        <h3>인터넷 연결 없음</h3>
        <p>네트워크 연결을 확인하고 다시 시도해 주세요.</p>
        {checking ? (
          <button type="button" className="ui-btn dis" disabled>
            <span className="spin" style={{ width: 18, height: 18, borderWidth: 2 }} />연결 확인 중…
          </button>
        ) : (
          <button type="button" className="ui-btn pri" onClick={handleRetry}>
            <Icon name="refresh" size="sm" />다시 시도
          </button>
        )}
      </div>
    </div>
  );
}

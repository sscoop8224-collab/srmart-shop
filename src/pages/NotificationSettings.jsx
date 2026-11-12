// 알림 설정 — 주문·배송 알림 / 혜택 알림(광고성) 따로 켜고 끈다 (2026-11-12 대표님 지시 5 · 목업 S50).
//
// ── 왜 둘로 나누나 ───────────────────────────────────────────────────────
//
// 주문·배송 알림은 손님이 시킨 일의 진행 소식이고, 혜택 알림(행사·쿠폰)은 **광고성 정보**다.
// 광고성 정보는 받는 사람의 사전 동의가 있어야 보낼 수 있고(정보통신망법 제50조), 동의·거부를
// 바꾸면 **그 처리 결과(날짜·내용)를 알려야** 한다. 그래서 혜택 알림은 바꿀 때마다 날짜를 보여 주고
// 「(날짜) 혜택 알림 수신에 동의/거부하셨어요」 를 띄운다. 날짜는 **서버가 남긴 값**(marketing_push_at)을 쓴다.
//
// ── 저장 실패 ────────────────────────────────────────────────────────────
//
// 스위치는 누르는 즉시 움직이고(기다리게 하지 않는다), 저장에 실패하면 **원래 값으로 되돌리고** 알린다.
// 되돌리지 않으면 화면은 「끔」인데 서버는 「켬」이라, 끈 줄 아는 손님에게 행사 푸시가 계속 간다.
import { useEffect, useState } from 'react';
import { getNotificationPrefs, updateNotificationPrefs } from '../api';
import { useDialog } from '../DialogContext';

// 'YYYY-MM-DD HH:mm:ss' → '2026.11.12'. 문자열을 자른다 — Date 로 바꾸면 시간대에 따라 하루 밀릴 수 있다.
export function fmtPrefDate(at) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(at || ''));
  return m ? `${m[1]}.${m[2]}.${m[3]}` : '';
}

/** 켜짐 → 「2026.11.12 동의」, 꺼짐 + 날짜 → 「2026.11.12 거부」, 날짜 없음 → '' */
export function consentLabel(on, at, words = ['동의', '거부']) {
  const d = fmtPrefDate(at);
  if (!d) return '';
  return `${d} ${on ? words[0] : words[1]}`;
}

export default function NotificationSettings({ goBack }) {
  const { notify } = useDialog();
  const [prefs, setPrefs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState('');   // 저장 중인 항목 키 — 그동안 같은 스위치를 다시 못 누른다

  const load = () => {
    setLoading(true);
    setError('');
    getNotificationPrefs()
      .then((res) => setPrefs(res.data || null))
      .catch(() => setError('알림 설정을 불러오지 못했어요.'))
      .finally(() => setLoading(false));
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);

  const toggle = async (key) => {
    if (!prefs || saving) return;
    const before = prefs;
    const next = !prefs[key];
    setPrefs({ ...prefs, [key]: next });
    setSaving(key);
    try {
      const res = await updateNotificationPrefs({ [key]: next });
      const saved = res.data || { ...before, [key]: next };
      setPrefs(saved);
      if (key === 'marketing_push') {
        // 정보통신망법 — 수신 동의·거부 처리 결과를 알린다(날짜는 서버 기록).
        const d = fmtPrefDate(saved.marketing_push_at);
        const on = !!saved.marketing_push;
        await notify({
          title: on ? '혜택 알림을 켰어요' : '혜택 알림을 껐어요',
          message: `${d ? d + ' ' : ''}혜택 알림 수신에 ${on ? '동의' : '거부'}하셨어요.`
            + (on ? '' : '\n행사·쿠폰 푸시와 문자가 가지 않아요.'),
        });
      }
    } catch {
      setPrefs(before);
      notify('저장하지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSaving('');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg, #f7f8fa)', paddingBottom: 100 }}>
      <Header title="알림 설정" onBack={goBack} />

      {loading && <Empty text="불러오는 중…" />}

      {!loading && error && (
        <div style={{ padding: '48px 20px', textAlign: 'center' }}>
          <div style={{ color: 'var(--text2, #868e96)', fontSize: 14, marginBottom: 12 }}>{error}</div>
          <button type="button" onClick={load} style={retryBtn}>다시 시도</button>
        </div>
      )}

      {!loading && !error && prefs && (
        <>
          <Section title="주문" foot="꺼도 주문내역에서 그대로 볼 수 있어요.">
            <SwitchRow
              label="주문·배송 알림"
              sub={['주문 접수 · 배송 출발·도착 · 픽업 준비', consentLabel(prefs.order_notify, prefs.order_notify_at, ['켬', '끔'])].filter(Boolean).join(' · ')}
              on={!!prefs.order_notify}
              busy={saving === 'order_notify'}
              onToggle={() => toggle('order_notify')}
            />
          </Section>

          <Section
            title="광고성 정보"
            foot={prefs.marketing_push
              ? '행사·쿠폰 소식을 보내요. 끄면 행사 푸시·문자가 가지 않아요.'
              : '혜택 알림을 끈 동안에는 행사·쿠폰 푸시와 문자가 가지 않아요. 다시 켜면 그날 날짜로 동의가 남아요.'}
          >
            <SwitchRow
              label="혜택 알림 (푸시·문자)"
              sub={consentLabel(prefs.marketing_push, prefs.marketing_push_at) || (prefs.marketing_push ? '수신 동의' : '수신 미동의')}
              on={!!prefs.marketing_push}
              busy={saving === 'marketing_push'}
              onToggle={() => toggle('marketing_push')}
            />
          </Section>
        </>
      )}
    </div>
  );
}

function Header({ title, onBack }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px',
      background: 'var(--card, #fff)', position: 'sticky', top: 0, zIndex: 10,
      borderBottom: '1px solid var(--primary-light)',
    }}>
      <button
        type="button"
        onClick={onBack}
        style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', padding: 0, lineHeight: 1, color: 'var(--text, #222)' }}
        aria-label="뒤로"
      >
        ‹
      </button>
      <span style={{ fontSize: 17, fontWeight: 800, color: 'var(--text, #222)' }}>{title}</span>
    </div>
  );
}

function Empty({ text }) {
  return (
    <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text2, #868e96)', fontSize: 14 }}>
      {text}
    </div>
  );
}

function Section({ title, foot, children }) {
  return (
    <div style={{ margin: '16px 16px 0' }}>
      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text2, #868e96)', padding: '0 4px 8px' }}>{title}</div>
      <div style={{ background: 'var(--card, #fff)', borderRadius: 16, overflow: 'hidden' }}>{children}</div>
      {foot && <div style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--text2, #868e96)', padding: '8px 4px 0' }}>{foot}</div>}
    </div>
  );
}

function SwitchRow({ label, sub, on, busy, onToggle }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={busy}
      onClick={onToggle}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px',
        background: 'none', border: 'none', cursor: busy ? 'default' : 'pointer', textAlign: 'left',
        fontFamily: 'inherit',
      }}
    >
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 15, fontWeight: 600, color: 'var(--text, #222)' }}>{label}</span>
        {sub && <span style={{ display: 'block', marginTop: 3, fontSize: 12, color: 'var(--text2, #868e96)' }}>{sub}</span>}
      </span>
      <span aria-hidden="true" style={{
        flexShrink: 0, width: 50, height: 30, borderRadius: 15, position: 'relative',
        background: on ? 'var(--primary, #00c471)' : 'var(--gray-300, #ced4da)',
        opacity: busy ? 0.6 : 1, transition: 'background 0.2s',
      }}>
        <span style={{
          position: 'absolute', top: 3, left: on ? 23 : 3, width: 24, height: 24, borderRadius: '50%',
          background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.25)', transition: 'left 0.2s',
        }} />
      </span>
    </button>
  );
}

const retryBtn = {
  padding: '10px 18px', borderRadius: 10, border: '1px solid var(--primary)', background: 'var(--card, #fff)',
  color: 'var(--primary-dark, #009a58)', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
};

// 🔴 시험용 본인확인 「업체 창」 — 운영 빌드에는 들어가지 않는다 (2026-11-16 지시 7)
//
//   IdentitySheet 가 `process.env.REACT_APP_IDENTITY_MOCK === '1'` 일 때만 require 한다. 운영 빌드는 .env.production 의
//   REACT_APP_IDENTITY_MOCK=0 때문에 그 조건이 빌드 때 false 로 정해져 이 파일이 번들에서 통째로 빠진다.
//   scripts/check-identity-mock.cjs 가 ① 그 줄 ② 이 파일을 다른 곳이 바로 import 하지 않는지 ③ 빌드 결과에 아래 표지
//   (IDENTITY-MOCK-FORM)가 없는지를 본다 — postbuild 에서 돈다.
//
//   모양은 목업 S48 「업체 창」(통신사 · 이름 · 생년월일 · 번호 · 인증번호) — 진짜 업체 창은 업체가 그린다.
//   여기서 넣은 값은 서버 mock 어댑터가 그대로 「확인됨」으로 받는다(서버도 시험 서버에서만 live — 신뢰 경계는 서버).
import { useState } from 'react';
import Icon from '../components/ui/Icon';

const CARRIERS = ['SKT', 'KT', 'LG U+', '알뜰폰'];

export default function MockVendorForm({ onSubmit }) {
  const [carrier, setCarrier] = useState(0);
  const [v, setV] = useState({ name: '', birthdate: '', phone: '', code: '' });
  const [err, setErr] = useState('');
  const set = (k) => (e) => { setV((p) => ({ ...p, [k]: e.target.value })); setErr(''); };
  const submit = () => {
    const birthdate = v.birthdate.replace(/\D/g, '');
    const phone = v.phone.replace(/\D/g, '');
    if (!v.name.trim()) return setErr('이름을 넣어 주세요.');
    if (birthdate.length !== 8) return setErr('생년월일 8자리(예: 19900512)를 넣어 주세요.');
    if (phone.length < 10) return setErr('휴대폰 번호를 넣어 주세요.');
    if (v.code.replace(/\D/g, '').length !== 6) return setErr('인증번호 6자리를 넣어 주세요(시험용 — 아무 숫자).');
    return onSubmit({ name: v.name.trim(), birthdate, phone });
  };
  return (
    <div className="verify-win" data-testid="IDENTITY-MOCK-FORM">
      <div className="vw-h"><Icon name="lock" size="sm" />시험용 본인확인 — 실제 업체 창이 아니에요</div>
      <div className="pad">
        <div className="seg" role="radiogroup" aria-label="통신사">
          {CARRIERS.map((c, i) => <button key={c} type="button" role="radio" aria-checked={carrier === i} className={carrier === i ? 'on' : ''} onClick={() => setCarrier(i)}>{c}</button>)}
        </div>
        <label className="f-lbl" htmlFor="mv-name">이름</label>
        <div className="field"><input id="mv-name" value={v.name} onChange={set('name')} placeholder="이름" autoComplete="off" /></div>
        <label className="f-lbl" htmlFor="mv-birth">생년월일</label>
        <div className="field"><input id="mv-birth" inputMode="numeric" value={v.birthdate} onChange={set('birthdate')} placeholder="생년월일 8자리 (19900512)" autoComplete="off" /></div>
        <label className="f-lbl" htmlFor="mv-phone">휴대폰 번호</label>
        <div className="field"><input id="mv-phone" inputMode="tel" value={v.phone} onChange={set('phone')} placeholder="010-0000-0000" autoComplete="off" /></div>
        <div className="addr-row" style={{ marginTop: 'var(--sp-2)' }}>
          <div className="field" style={{ flex: 1 }}><input aria-label="인증번호" inputMode="numeric" value={v.code} onChange={set('code')} placeholder="인증번호 6자리" autoComplete="one-time-code" /></div>
          <button type="button" className="ui-btn md line" onClick={submit}>확인</button>
        </div>
        {err && <div className="f-err"><Icon name="alert" size="sm" />{err}</div>}
        <div className="f-hint">이 칸들은 업체 창 안이에요 — 앱은 결과(이름·생년월일·번호)만 받아요</div>
      </div>
    </div>
  );
}

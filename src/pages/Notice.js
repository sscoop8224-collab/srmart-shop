// 공지사항 (목업 정본 v1 의 S26, 묶음 5 · 2026-11-12 밤)
// 결정 4 · F2: **서버에 연결한다.** 예전 화면은 공지를 앱 안 메모리에만 들고 있어서
//   ⑴ 손님에게는 늘 빈 화면이었고 ⑵ 관리자가 「등록」해도 **그 기기 화면에만** 생겼다가 새로고침하면 사라졌다(서버에 안 갔다).
// 지금: 목록 = `GET /api/shop/notices?store_id=`(전 매장 공지 + 이 매장 공지 · 고정 먼저) · 누르면 펼침.
//   관리자(대표·점장) 「+ 등록」 = 어드민 「공지 관리」와 같은 `POST /api/admin/shop-notices`
//   (점장은 서버가 자기 매장 공지로 정한다 · 대표는 전 매장 공지).
//   「삭제」 = 서버에 지우는 길이 없어 **숨기기**(`PUT /api/admin/shop-notices/:id/visible`) — 기록은 남고 어드민에서 다시 보일 수 있다.
import { useCallback, useEffect, useState } from 'react';
import { getShopNotices, createShopNotice, hideShopNotice } from '../api';
import { useDialog } from '../DialogContext';
import Icon from '../components/ui/Icon';

const ymd = (s) => String(s || '').slice(0, 10).replace(/-/g, '.');   // 서버가 'YYYY-MM-DD HH:mm' 글자로 준다(DATE_FORMAT) — 날짜 밀림 없음

function Notice({ storeId, isAdmin, goBack }) {
  const { notify, confirm } = useDialog();
  const [list, setList] = useState(null);       // null = 불러오는 중
  const [failed, setFailed] = useState(false);
  const [open, setOpen] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: '', body: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setFailed(false);
    getShopNotices(storeId)
      .then((r) => setList(Array.isArray(r.data) ? r.data : []))
      .catch(() => { setFailed(true); setList([]); });
  }, [storeId]);
  useEffect(() => { load(); }, [load]);

  const handleAdd = async () => {
    if (!form.title.trim() || !form.body.trim()) { notify('제목과 내용을 입력해 주세요.'); return; }
    try {
      setSaving(true);
      await createShopNotice({ title: form.title, body: form.body });
      setForm({ title: '', body: '' });
      setShowForm(false);
      notify({ icon: 'check', title: '공지를 올렸어요' });
      load();
    } catch (e) {
      notify(e.response?.data?.error || '공지를 올리지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSaving(false);
    }
  };

  const handleHide = async (n) => {
    const ok = await confirm({ title: '이 공지를 숨길까요?', message: '손님 화면에서 사라져요. 어드민 「공지 관리」에서 다시 보이게 할 수 있어요.', okLabel: '숨기기', danger: true });
    if (!ok) return;
    try {
      await hideShopNotice(n.id);
      load();
    } catch (e) {
      notify(e.response?.data?.error || '숨기지 못했어요. 잠시 후 다시 시도해 주세요.');
    }
  };

  return (
    <div className="v2 notice-v2">
      <header className="app-nav">
        <div className="nav-row">
          <div className="nav-side"><button type="button" className="nav-btn" aria-label="뒤로" onClick={goBack}><Icon name="chevL" /></button></div>
          <div className="nav-title" />
          <div className="nav-side r">{isAdmin && <button type="button" className="nav-btn b" onClick={() => setShowForm(true)}>+ 등록</button>}</div>
        </div>
        <div className="large"><h1>공지사항</h1></div>
      </header>

      <div className="tw">
        {isAdmin && showForm && (
          <section className="sec">
            <div className="group pad">
              <label className="f-lbl" htmlFor="nt-title">제목</label>
              <div className="field"><input id="nt-title" value={form.title} maxLength={120} placeholder="제목을 입력해 주세요" onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} /></div>
              <label className="f-lbl" htmlFor="nt-body">내용</label>
              <textarea id="nt-body" className="area" value={form.body} placeholder="내용을 입력해 주세요" onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} />
              <div className="btn-row" style={{ marginTop: 'var(--sp-3)' }}>
                <button type="button" className="ui-btn gray" onClick={() => { setShowForm(false); setForm({ title: '', body: '' }); }}>취소</button>
                <button type="button" className={`ui-btn ${saving ? 'dis' : 'pri'}`} disabled={saving} onClick={handleAdd}>{saving ? '올리는 중…' : '등록'}</button>
              </div>
            </div>
          </section>
        )}

        {list === null ? (
          <div className="ui-empty"><p>불러오는 중…</p></div>
        ) : failed ? (
          <div className="ui-empty">
            <div className="big"><Icon name="wifiOff" /></div>
            <h3>공지사항을 불러오지 못했어요</h3>
            <p>인터넷 연결을 확인하고 다시 시도해 주세요.</p>
            <button type="button" className="ui-btn pri" onClick={load}>다시 시도</button>
          </div>
        ) : list.length === 0 ? (
          <div className="ui-empty">
            <div className="big"><Icon name="bell" /></div>
            <h3>등록된 공지사항이 없어요</h3>
            <p>새로운 소식을 기다려 주세요.</p>
          </div>
        ) : (
          <section className="sec">
            <div className="group">
              {list.map((n) => {
                const on = open === n.id;
                return (
                  <div key={n.id} className="nt-item">
                    <button type="button" className="row nt-row" aria-expanded={on} onClick={() => setOpen(on ? null : n.id)}>
                      <span className="lbl">
                        <span className={`pill${n.is_pinned ? ' g' : ''}`}>{n.is_pinned ? '공지' : '안내'}</span> {n.title}
                        <small>{ymd(n.created_at)}</small>
                      </span>
                      <span className={`chev${on ? ' up' : ''}`}><Icon name="chevD" size="sm" /></span>
                    </button>
                    {on && (
                      <div className="nt-body">
                        {n.body}
                        {isAdmin && <div className="nt-admin"><button type="button" className="link danger" onClick={() => handleHide(n)}>숨기기</button></div>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

export default Notice;

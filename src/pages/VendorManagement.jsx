import { useState, useEffect } from 'react';
import API from '../api';

const G = '#00c471';
const GD = '#00a85e';

const EMPTY_FORM = {
  name: '', business_number: '', phone: '', email: '',
  address: '', contact_person: '', memo: '', status: '거래중',
  payment_method: '현금',
};

const PAYMENT_METHODS = ['현금', '카드', '계좌이체', '외상', '어음'];

const FILTERS = ['전체', '거래중', '거래중지'];

export default function VendorManagement({ goBack, darkMode }) {
  const dark     = darkMode;
  const bg       = dark ? '#1a1a1a' : '#f8fffe';
  const cardBg   = dark ? '#2a2a2a' : 'white';
  const headerBg = dark ? '#222' : 'white';
  const border   = dark ? '#333' : '#f0faf5';
  const text     = dark ? '#f0f0f0' : '#1a1a1a';
  const sub      = dark ? '#888' : '#adb5bd';
  const inputBg  = dark ? '#333' : '#f2fbf6';
  const inputBorder = dark ? '#444' : '#e0f5eb';
  const modalBg  = dark ? '#2a2a2a' : 'white';

  const [vendors, setVendors]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filterTab, setFilterTab] = useState('전체');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);

  useEffect(() => { fetchVendors(); }, []);

  const fetchVendors = () => {
    setLoading(true);
    API.get('/vendors')
      .then(res => setVendors(res.data))
      .catch(() => setVendors([]))
      .finally(() => setLoading(false));
  };

  const openAdd = () => { setForm(EMPTY_FORM); setEditTarget(null); setShowModal(true); };
  const openEdit = (v) => {
    setForm({
      name: v.name, business_number: v.business_number || '',
      phone: v.phone || '', email: v.email || '',
      address: v.address || '', contact_person: v.contact_person || '',
      memo: v.memo || '', status: v.status || '거래중',
      payment_method: v.payment_method || '현금',
    });
    setEditTarget(v);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { alert('거래처명을 입력해주세요!'); return; }
    setSaving(true);
    try {
      if (editTarget) await API.put(`/vendors/${editTarget.id}`, form);
      else await API.post('/vendors', form);
      setShowModal(false);
      fetchVendors();
    } catch { alert('저장 중 오류가 발생했어요.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (v) => {
    if (!window.confirm(`"${v.name}" 거래처를 삭제할까요?`)) return;
    try { await API.delete(`/vendors/${v.id}`); fetchVendors(); }
    catch { alert('삭제 중 오류가 발생했어요.'); }
  };

  const filtered = vendors
    .filter(v => filterTab === '전체' || v.status === filterTab)
    .filter(v =>
      v.name.includes(search) ||
      (v.business_number || '').includes(search) ||
      (v.contact_person || '').includes(search) ||
      (v.phone || '').includes(search)
    );

  const inputStyle = {
    width: '100%', padding: '12px 14px', borderRadius: 12,
    border: `1.5px solid ${inputBorder}`, fontSize: 14, outline: 'none',
    background: inputBg, color: text, boxSizing: 'border-box', fontFamily: 'inherit',
  };

  const StatusBadge = ({ status }) => {
    const active = status === '거래중';
    return (
      <span style={{
        fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 20,
        background: active ? (dark ? '#1e3a2a' : '#e8faf3') : (dark ? '#3a3a3a' : '#f1f3f5'),
        color: active ? GD : '#868e96',
      }}>
        {status || '거래중'}
      </span>
    );
  };

  return (
    <div style={{ background: bg, minHeight: '100vh', paddingBottom: 100, maxWidth: 480, margin: '0 auto' }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', background: dark ? 'linear-gradient(135deg, #0d4d2a 0%, #1a5c2a 100%)' : 'linear-gradient(135deg, #00c471 0%, #00a85e 100%)', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={goBack}
          style={{ width: 40, height: 40, flexShrink: 0, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'white' }}>거래처 관리</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>총 {vendors.length}개</div>
        </div>
        <button onClick={openAdd}
          style={{ padding: '7px 14px', background: 'rgba(255,255,255,0.2)', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 20, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          + 추가
        </button>
      </div>

      {/* 필터 탭 */}
      <div style={{ display: 'flex', gap: 8, padding: '12px 20px 0', background: headerBg, borderBottom: `1px solid ${border}` }}>
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilterTab(f)}
            style={{
              padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 600, fontFamily: 'inherit',
              background: filterTab === f ? G : (dark ? '#333' : '#f0faf5'),
              color: filterTab === f ? 'white' : sub,
              marginBottom: 12,
            }}>
            {f}
            {f !== '전체' && (
              <span style={{ marginLeft: 4, fontSize: 11 }}>
                ({vendors.filter(v => v.status === f || (!v.status && f === '거래중')).length})
              </span>
            )}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px 20px' }}>
        {/* 검색 */}
        <div style={{ position: 'relative', marginBottom: 16 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={sub} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="거래처명, 사업자번호, 담당자 검색..."
            style={{ ...inputStyle, paddingLeft: 40 }} />
        </div>

        {/* 목록 */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40, color: sub }}>불러오는 중...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: sub }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🏢</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: text }}>거래처가 없어요</div>
            <div style={{ fontSize: 12, marginTop: 4 }}>+ 추가 버튼으로 등록해보세요</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(v => (
              <div key={v.id} style={{ background: cardBg, borderRadius: 16, border: `1px solid ${border}`, boxShadow: dark ? 'none' : '0 2px 8px rgba(0,0,0,0.04)', padding: '14px 16px' }}>
                {/* 카드 상단: 이름 + 뱃지 + 버튼 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: dark ? '#333' : '#f0faf5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: text, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{v.name}</div>
                    <StatusBadge status={v.status} />
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => openEdit(v)}
                      style={{ padding: '5px 12px', fontSize: 12, fontWeight: 600, background: dark ? '#333' : '#f0faf5', color: GD, border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                      수정
                    </button>
                    <button onClick={() => handleDelete(v)}
                      style={{ padding: '5px 12px', fontSize: 12, fontWeight: 600, background: dark ? '#3a1a1a' : '#fff0f1', color: '#ff4757', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                      삭제
                    </button>
                  </div>
                </div>

                {/* 카드 하단: 상세정보 */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingLeft: 44 }}>
                  {[
                    { label: '사업자번호', value: v.business_number },
                    { label: '담당자', value: v.contact_person },
                    { label: '전화', value: v.phone },
                    { label: '이메일', value: v.email },
                    { label: '결제방식', value: v.payment_method },
                  ].filter(r => r.value).map(r => (
                    <div key={r.label} style={{ display: 'flex', gap: 8 }}>
                      <span style={{ fontSize: 11, color: sub, fontWeight: 600, minWidth: 56, flexShrink: 0 }}>{r.label}</span>
                      <span style={{ fontSize: 11, color: text }}>{r.value}</span>
                    </div>
                  ))}
                  {v.memo && (
                    <div style={{ fontSize: 11, color: sub, marginTop: 2, fontStyle: 'italic' }}>{v.memo}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 추가/수정 모달 */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', zIndex: 1000 }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false); }}>
          <div style={{ background: modalBg, borderRadius: '24px 24px 0 0', padding: '20px 20px 40px', width: '100%', maxWidth: 480, margin: '0 auto', maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box' }}>
            <div style={{ width: 36, height: 4, background: dark ? '#444' : '#dee2e6', borderRadius: 2, margin: '0 auto 18px' }} />
            <div style={{ fontSize: 17, fontWeight: 700, color: text, marginBottom: 18 }}>
              {editTarget ? '거래처 수정' : '거래처 추가'}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { key: 'name',            label: '거래처명 *',  placeholder: '거래처명' },
                { key: 'business_number', label: '사업자번호',   placeholder: '000-00-00000' },
                { key: 'contact_person',  label: '담당자명',     placeholder: '담당자 이름' },
                { key: 'phone',           label: '전화번호',     placeholder: '02-0000-0000' },
                { key: 'email',           label: '이메일',       placeholder: 'example@mail.com' },
                { key: 'address',         label: '주소',         placeholder: '주소' },
              ].map(f => (
                <div key={f.key}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: GD, marginBottom: 5 }}>{f.label}</div>
                  <input value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                    placeholder={f.placeholder} style={inputStyle} />
                </div>
              ))}

              {/* 결제 방식 드롭다운 */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: GD, marginBottom: 5 }}>결제 방식</div>
                <select value={form.payment_method} onChange={e => setForm({ ...form, payment_method: e.target.value })}
                  style={{ ...inputStyle, cursor: 'pointer' }}>
                  {PAYMENT_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              {/* 거래 상태 드롭다운 */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: GD, marginBottom: 5 }}>거래 상태</div>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                  style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="거래중">거래중</option>
                  <option value="거래중지">거래중지</option>
                </select>
              </div>

              {/* 메모 */}
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: GD, marginBottom: 5 }}>메모</div>
                <textarea value={form.memo} onChange={e => setForm({ ...form, memo: e.target.value })}
                  placeholder="특이사항, 계약 조건 등" rows={3}
                  style={{ ...inputStyle, resize: 'none', fontFamily: 'inherit' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              <button onClick={() => setShowModal(false)}
                style={{ flex: 1, padding: '14px', borderRadius: 14, border: `1.5px solid ${inputBorder}`, background: 'transparent', color: sub, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                취소
              </button>
              <button onClick={handleSave} disabled={saving}
                style={{ flex: 1, padding: '14px', borderRadius: 14, border: 'none', background: saving ? '#aaa' : `linear-gradient(135deg, ${G}, ${GD})`, color: 'white', fontSize: 15, fontWeight: 700, cursor: saving ? 'default' : 'pointer' }}>
                {saving ? '저장 중...' : (editTarget ? '수정 완료' : '추가 완료')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

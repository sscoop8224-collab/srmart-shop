// AI 상담 (목업 정본 v1 의 S37, 묶음 6 · 2026-11-13 새벽)
// 여는 곳: 홈 검색창 오른쪽 AI 상담 단추(③ 로봇, 2026-11-13 B안 — 떠 있는 단추 없음) · 고객센터(S46) 「AI 상담」 줄.
// 모양: 아래에서 올라오는 시트 「쇼핑 도우미」 — 맨 위에 **사람이 아닌 AI 라는 고지**(파란 안내) · 말풍선(내 말 = 초록, AI = 카드) · 아래 입력줄.
//   응답을 기다리는 동안 「입력 중…」 · 오류는 빨간 글씨 말풍선(목업 「오류」).
// AI 키는 서버(연동 관리)에만 보관 — 클라이언트 하드코딩 없음. 챗봇은 백엔드 /api/chatbot 경유(보내는 값은 예전 그대로: 메시지 · 이전 대화 · 매장).
import React, { useState, useRef, useEffect } from 'react';
import API from '../api';
import { useStore } from '../StoreContext';
import Icon from './ui/Icon';

const ERR = '죄송해요, 일시적인 오류가 발생했어요. 다시 시도해 주세요!';

const Chatbot = ({ open = false, onClose }) => {
  const store = useStore();
  const currentStoreId = store?.currentStoreId || null;   // 고객이 선택한 점포 → 챗봇 컨텍스트 스코프
  const [messages, setMessages] = useState([]);           // 인사·고지는 위 안내 칸이 한다(대화에 넣지 않는다)
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages, loading, open]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    const priorHistory = messages.filter((m) => !m.error).map((m) => ({ role: m.role === 'user' ? 'user' : 'model', content: m.content }));
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);
    try {
      // 서버가 연동 관리에 등록된 AI로 응답(키는 서버에만). 미설정 시 안내 메시지 반환.
      const res = await API.post('/chatbot', { message: text, history: priorHistory, store_id: currentStoreId });
      setMessages((prev) => [...prev, { role: 'model', content: res.data?.reply || ERR }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'model', content: ERR, error: true }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!open) return null;
  return (
    <div className="overlay sheet-over" role="dialog" aria-modal="true" aria-labelledby="chat-title" onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="sheet v2 chat-sheet">
        <div className="grabber" />
        <div className="sheet-h">
          <div className="nav-side" />
          <div className="nav-title" id="chat-title">쇼핑 도우미</div>
          <div className="nav-side r"><button type="button" className="nav-btn plain" aria-label="닫기" onClick={onClose}><Icon name="x" /></button></div>
        </div>
        <div className="sheet-b">
          <div className="sec chat-note">
            <div className="notice b"><Icon name="robot" /><div>안녕하세요! 에스알마트 AI 상담사예요 <b>(사람이 아닌 AI 도우미예요)</b>. 상품·배송·주문 문의를 도와드려요.</div></div>
          </div>
          <div className="chat" aria-live="polite">
            {messages.map((m, i) => (
              <div key={i} className={`bub ${m.role === 'user' ? 'me' : 'ai'}${m.error ? ' err' : ''}`}>{m.content}</div>
            ))}
            {loading && <div className="bub ai wait">입력 중…</div>}
            <div ref={endRef} />
          </div>
        </div>
        <div className="composer">
          <div className="field">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="메시지를 입력하세요" aria-label="메시지" enterKeyHint="send" />
          </div>
          <button type="button" className="send" aria-label="보내기" disabled={loading || !input.trim()} onClick={sendMessage}><Icon name="send" size="sm" /></button>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;

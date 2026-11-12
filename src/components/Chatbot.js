import React, { useState, useRef, useEffect } from 'react';
import API from '../api';
import { useStore } from '../StoreContext';

// AI 키는 서버(연동 관리)에만 보관 — 클라이언트 하드코딩 제거. 챗봇은 백엔드 /api/chatbot 경유.
// 여는 곳은 홈 헤더의 AI 상담 아이콘이다(떠 있는 단추 없앰 — 토큰 문서 4절 7, 묶음 1 · 2026-11-12).
// 창 모양 자체는 6번 묶음(S38 AI 상담)에서 목업대로 바꾼다.
const Chatbot = ({ open = false, onClose }) => {
  const store = useStore();
  const currentStoreId = store?.currentStoreId || null;   // 고객이 선택한 점포 → 챗봇 컨텍스트 스코프
  const isOpen = !!open;
  const [messages, setMessages] = useState([
    { role: 'model', content: '안녕하세요! SR마트 AI 상담사입니다 😊 (사람이 아닌 AI 도우미예요)\n상품·배송·주문 문의를 도와드려요. 무엇이든 물어보세요!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);


  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const text = input.trim();
    const priorHistory = messages.map(m => ({ role: m.role === 'user' ? 'user' : 'model', content: m.content }));
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setLoading(true);

    try {
      // 서버가 연동 관리에 등록된 AI로 응답(키는 서버에만). 미설정 시 안내 메시지 반환.
      const res = await API.post('/chatbot', { message: text, history: priorHistory, store_id: currentStoreId });
      const replyText = res.data?.reply || '죄송해요, 다시 시도해주세요!';
      setMessages(prev => [...prev, { role: 'model', content: replyText }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'model',
        content: '죄송해요, 일시적인 오류가 발생했어요. 다시 시도해주세요!'
      }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>

      {/* 챗봇 창 */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: 'calc(var(--tab-h) + env(safe-area-inset-bottom) + var(--sp-3) + var(--bottom-bar-extra, 0px))',
          right: '16px',
          width: 'min(320px, calc(100vw - 32px))',
          height: 'min(460px, calc(100vh - 180px))',
          backgroundColor: '#fff',
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1001,
          overflow: 'hidden',
          border: '1px solid var(--primary-light)',
        }}>
          {/* 헤더 */}
          <div style={{
            background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
            padding: '14px 16px',
            fontWeight: 'bold',
            fontSize: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'white',
          }}>
            <span>🛒 SR Mart 쇼핑 도우미</span>
            <span style={{ fontSize: '11px', fontWeight: 700, background: 'rgba(255,255,255,0.25)', padding: '2px 8px', borderRadius: '10px', marginLeft: 'auto' }}>AI 상담</span>
            <button type="button" aria-label="닫기" onClick={onClose} style={{ background: 'none', border: 0, color: 'inherit', fontSize: 18, lineHeight: 1, cursor: 'pointer', padding: '0 2px', fontFamily: 'inherit' }}>✕</button>
          </div>

          {/* 메시지 목록 */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '12px',
            display: 'flex', flexDirection: 'column', gap: '8px',
            background: 'var(--primary-light)',
          }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
              }}>
                <div style={{
                  maxWidth: '80%', padding: '10px 13px',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  backgroundColor: msg.role === 'user' ? 'var(--primary)' : 'white',
                  color: msg.role === 'user' ? 'white' : '#1a1a1a',
                  fontSize: '13px', lineHeight: '1.5',
                  whiteSpace: 'pre-wrap',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '10px 13px', borderRadius: '16px 16px 16px 4px',
                  backgroundColor: 'white', fontSize: '13px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                }}>
                  ⏳ 생각 중...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 입력창 */}
          <div style={{
            padding: '10px', borderTop: '1px solid var(--primary-light)',
            display: 'flex', gap: '8px', background: 'white',
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="메시지를 입력하세요..."
              style={{
                flex: 1, padding: '8px 12px', borderRadius: '20px',
                border: '1.5px solid var(--primary-light)', fontSize: '13px',
                outline: 'none', background: 'var(--primary-light)',
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              style={{
                padding: '8px 14px', borderRadius: '20px',
                background: 'linear-gradient(135deg, var(--primary), var(--primary-dark))',
                border: 'none', cursor: 'pointer',
                fontWeight: 'bold', fontSize: '13px',
                color: 'white',
              }}
            >
              전송
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Chatbot;
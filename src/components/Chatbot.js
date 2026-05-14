import React, { useState, useRef, useEffect } from 'react';

const API_KEY = "AIzaSyAAATL1cbqm407rXp9Lm-e17XHJxFySxP4";

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', content: '안녕하세요! SR Mart 쇼핑 도우미예요 😊\n상품 추천, 주문 문의 등 무엇이든 물어보세요!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const history = newMessages.map(m => ({
        role: m.role,
        parts: [{ text: m.content }]
      }));

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            system_instruction: {
              parts: [{ text: `당신은 SR Mart(동신마켓) 검암점의 친절한 쇼핑 도우미 AI입니다.
모든 답변은 한국어로 하세요.
고객의 상품 추천, 주문 문의, 매장 정보 등을 친절하고 간결하게 안내해주세요.
매장 정보: 편의점/소형마트, 카카오페이 결제 가능, 온라인 주문 가능.` }]
            },
            contents: history
          })
        }
      );

      const data = await response.json();
      const replyText = data.candidates[0].content.parts[0].text;
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
      {/* 말풍선 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          bottom: '76px',
          right: '16px',
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          backgroundColor: '#00c471',
          border: 'none',
          cursor: 'pointer',
          fontSize: '22px',
          boxShadow: '0 4px 12px rgba(0,196,113,0.4)',
          zIndex: 1001,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* 챗봇 창 */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '136px',
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
          border: '1px solid #f0faf5',
        }}>
          {/* 헤더 */}
          <div style={{
            background: 'linear-gradient(135deg, #00c471, #00a85e)',
            padding: '14px 16px',
            fontWeight: 'bold',
            fontSize: '15px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'white',
          }}>
            🛒 SR Mart 쇼핑 도우미
          </div>

          {/* 메시지 목록 */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '12px',
            display: 'flex', flexDirection: 'column', gap: '8px',
            background: '#f8fffe',
          }}>
            {messages.map((msg, idx) => (
              <div key={idx} style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
              }}>
                <div style={{
                  maxWidth: '80%', padding: '10px 13px',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  backgroundColor: msg.role === 'user' ? '#00c471' : 'white',
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
            padding: '10px', borderTop: '1px solid #f0faf5',
            display: 'flex', gap: '8px', background: 'white',
          }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="메시지를 입력하세요..."
              style={{
                flex: 1, padding: '8px 12px', borderRadius: '20px',
                border: '1.5px solid #e8faf3', fontSize: '13px',
                outline: 'none', background: '#f8fffe',
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              style={{
                padding: '8px 14px', borderRadius: '20px',
                background: 'linear-gradient(135deg, #00c471, #00a85e)',
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
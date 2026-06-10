import { useState, useEffect } from 'react';

export default function HomePage({ onShop, onLogin, darkMode }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const bg      = darkMode ? '#1a1a1a' : '#ffffff';
  const cardBg  = darkMode ? '#2a2a2a' : '#f8f9fa';
  const text    = darkMode ? '#f0f0f0' : '#1a1a1a';
  const sub     = darkMode ? '#a0a0a0' : '#6c757d';
  const border  = darkMode ? '#2e2e2e' : '#e9ecef';
  const navBg   = darkMode ? 'rgba(26,26,26,0.93)' : 'rgba(255,255,255,0.93)';
  const navText = darkMode ? '#c0c0c0' : '#555';
  const heroBg  = darkMode
    ? 'linear-gradient(135deg, #0a2418 0%, #1a1a1a 100%)'
    : 'linear-gradient(135deg, #edfaf4 0%, #ffffff 100%)';

  const NAV_LINKS = ['매장안내', '이벤트', '공지사항', '고객센터'];
  const FEATURES = [
    { icon: '🌿', title: '신선한 식품',    desc: '매일 아침 직접 선별한 신선한 식품을 빠르게 배달해드립니다.' },
    { icon: '🚚', title: '빠른 배송',      desc: '주문 후 당일 배송! 신선함을 그대로 집 앞까지 전달합니다.' },
    { icon: '💰', title: '합리적인 가격',  desc: '대형마트보다 저렴하게, 동네마트의 따뜻함으로 만나보세요.' },
  ];

  return (
    <div style={{ background: bg, minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>

      {/* ── Navbar ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: navBg, backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
        borderBottom: `1px solid ${border}`,
        height: 64, padding: '0 clamp(16px, 4vw, 60px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* 로고 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg, #00c471, #00a85e)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: 13, letterSpacing: '-0.5px' }}>SR</span>
          </div>
          <span style={{ fontSize: 17, fontWeight: 800, color: '#00c471', letterSpacing: '-0.3px' }}>에스알마트</span>
        </div>

        {/* 우측 메뉴 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {!isMobile && NAV_LINKS.map(item => (
            <button key={item} style={{
              background: 'none', border: 'none', color: navText,
              fontSize: 14, cursor: 'pointer', padding: '8px 12px', borderRadius: 8,
              fontFamily: 'inherit', fontWeight: 500,
            }}>
              {item}
            </button>
          ))}
          <button onClick={onLogin} style={{
            background: 'linear-gradient(135deg, #00c471, #00a85e)', color: 'white',
            border: 'none', borderRadius: 9, padding: '8px 20px',
            fontSize: 14, fontWeight: 700, cursor: 'pointer', marginLeft: isMobile ? 0 : 10,
            fontFamily: 'inherit',
          }}>
            로그인
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section style={{
        background: heroBg,
        padding: 'clamp(56px, 10vw, 110px) clamp(20px, 5vw, 80px)',
        position: 'relative', overflow: 'hidden',
        minHeight: 480, display: 'flex', alignItems: 'center',
      }}>
        {/* 장식 원 */}
        <div style={{ position: 'absolute', top: -100, right: -100, width: 480, height: 480, background: 'rgba(0,196,113,0.07)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, right: isMobile ? -60 : 120, width: 280, height: 280, background: 'rgba(0,196,113,0.05)', borderRadius: '50%', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 660 }}>
          {/* 배지 */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: darkMode ? '#1a3a2a' : '#e2f9ee',
            border: '1px solid rgba(0,196,113,0.3)', borderRadius: 20,
            padding: '5px 15px', marginBottom: 28,
          }}>
            <div style={{ width: 7, height: 7, background: '#00c471', borderRadius: '50%' }} />
            <span style={{ fontSize: 13, color: '#00a85e', fontWeight: 600 }}>동신마켓이 운영하는 온라인 마트</span>
          </div>

          {/* 제목 */}
          <h1 style={{
            fontSize: 'clamp(30px, 6vw, 58px)', fontWeight: 900,
            color: text, lineHeight: 1.18, margin: '0 0 18px',
            letterSpacing: '-1.5px', wordBreak: 'keep-all',
          }}>
            오늘의 신선함을{' '}
            <span style={{ color: '#00c471' }}>집 앞까지</span>
          </h1>

          {/* 부제 */}
          <p style={{
            fontSize: 'clamp(15px, 2vw, 18px)', color: sub,
            margin: '0 0 38px', lineHeight: 1.75, maxWidth: 460,
          }}>
            신선한 식품부터 생활용품까지,<br />
            동신마켓이 엄선한 상품을 빠르게 배달해드립니다.
          </p>

          {/* 버튼 */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={onShop} style={{
              background: 'linear-gradient(135deg, #00c471, #00a85e)',
              color: 'white', border: 'none', borderRadius: 14,
              padding: '14px 30px', fontSize: 16, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 6px 24px rgba(0,196,113,0.38)',
            }}>
              🛒 지금 쇼핑하러 가기
            </button>
            <button style={{
              background: 'transparent',
              color: text,
              border: `2px solid ${darkMode ? '#3a3a3a' : '#d0d0d0'}`,
              borderRadius: 14, padding: '14px 30px', fontSize: 16, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              📱 앱 다운로드
            </button>
          </div>
        </div>
      </section>

      {/* ── Feature 카드 3개 ── */}
      <section style={{ padding: 'clamp(48px, 8vw, 80px) clamp(20px, 5vw, 80px)' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: 'clamp(22px, 4vw, 36px)', fontWeight: 800, color: text, margin: '0 0 12px', letterSpacing: '-0.5px' }}>
            왜 에스알마트인가요?
          </h2>
          <p style={{ fontSize: 15, color: sub, margin: 0 }}>고객 만족을 위한 에스알마트의 약속</p>
        </div>

        <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 1200, margin: '0 auto' }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{
              flex: '1 1 280px',
              background: cardBg, borderRadius: 20, padding: '32px 28px',
              border: `1px solid ${border}`, textAlign: 'center',
            }}>
              <div style={{ fontSize: 52, marginBottom: 18 }}>{f.icon}</div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: text, margin: '0 0 10px' }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: sub, margin: 0, lineHeight: 1.75 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{
        background: 'linear-gradient(135deg, #00c471 0%, #00a85e 100%)',
        padding: 'clamp(48px, 8vw, 80px) clamp(20px, 5vw, 80px)',
        textAlign: 'center',
      }}>
        {/* 배지 */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.22)', borderRadius: 20,
          padding: '5px 16px', marginBottom: 24,
        }}>
          <span style={{ fontSize: 13, color: 'white', fontWeight: 600 }}>🎁 신규회원 10% 할인 쿠폰 증정</span>
        </div>

        <h2 style={{
          fontSize: 'clamp(24px, 4vw, 42px)', fontWeight: 900, color: 'white',
          margin: '0 0 14px', letterSpacing: '-0.5px',
        }}>
          지금 바로 시작하세요
        </h2>
        <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.85)', margin: '0 0 36px' }}>
          가입하면 바로 사용 가능한 10% 할인 쿠폰을 드립니다.
        </p>

        <button onClick={onShop} style={{
          background: 'white', color: '#00a85e', border: 'none',
          borderRadius: 14, padding: '15px 40px', fontSize: 17, fontWeight: 800,
          cursor: 'pointer', fontFamily: 'inherit',
          boxShadow: '0 6px 24px rgba(0,0,0,0.15)',
        }}>
          무료로 시작하기 →
        </button>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: '#1a1a1a', padding: 'clamp(32px, 5vw, 52px) clamp(20px, 5vw, 80px)' }}>
        <div style={{
          display: 'flex', gap: 40, flexWrap: 'wrap',
          justifyContent: 'space-between', maxWidth: 1200, margin: '0 auto',
          paddingBottom: 32, borderBottom: '1px solid #2e2e2e',
        }}>
          {/* 사업자 정보 */}
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#f0f0f0', marginBottom: 14 }}>동신마켓</div>
            <div style={{ fontSize: 13, color: '#777', lineHeight: 1.9 }}>
              <div>대표자: 이민우</div>
              <div>사업자등록번호: 732-57-00964</div>
              <div>주소: 인천시 강화군 내가면 고비고개로 878-30, 2층</div>
            </div>
          </div>

          {/* 고객센터 */}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#aaa', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 12 }}>고객센터</div>
            <div style={{ fontSize: 13, color: '#777', lineHeight: 2 }}>
              <div>전화: <span style={{ color: '#00c471', fontWeight: 700 }}>032-328-2850</span></div>
              <div>팩스: 032-562-2858</div>
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 28, fontSize: 12, color: '#444' }}>
          © 2026 Dongsin Market. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

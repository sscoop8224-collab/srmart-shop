import { useState, useEffect } from 'react';
import Sidebar from '../layout/Sidebar';

// 기본 권한 설정 (처음 실행 시 적용)
const DEFAULT_PERMISSIONS = {
  adminPC:          { staff: true,  manager: true  },
  adminPC_orders:   { staff: true,  manager: true  },
  adminPC_products: { staff: false, manager: true  },
  adminPC_inventory:{ staff: false, manager: true  },
  adminPC_purchase: { staff: false, manager: true  },
  adminPC_members:  { staff: false, manager: false },
  adminPC_reviews:  { staff: false, manager: true  },
  adminPC_stats:    { staff: false, manager: true  },
  adminPC_settlement:{ staff: false, manager: false },
  adminPC_settings: { staff: false, manager: false },
};

const MENU_LABELS = {
  adminPC:           '대시보드',
  adminPC_orders:    '주문 관리',
  adminPC_products:  '상품 관리',
  adminPC_inventory: '재고 관리',
  adminPC_purchase:  '검수 매입',
  adminPC_members:   '회원 관리',
  adminPC_reviews:   '리뷰 관리',
  adminPC_stats:     '매출 통계',
  adminPC_settlement:'카카오페이 정산',
  adminPC_settings:  '기본 설정',
};

const LIGHT = {
  bg: '#f5f5f3', cardBg: '#ffffff', cardBorder: '#e0e0e0',
  textPrimary: '#1a1a1a', textSecondary: '#444444', textTertiary: '#777777',
  topbarBg: '#ffffff', topbarBorder: '#e0e0e0',
  theadBg: '#f0f0ee',
};
const DARK = {
  bg: '#111111', cardBg: '#1e1e1e', cardBorder: '#2e2e2e',
  textPrimary: '#f0f0f0', textSecondary: '#bbbbbb', textTertiary: '#777777',
  topbarBg: '#1a1a1a', topbarBorder: '#2e2e2e',
  theadBg: '#252525',
};

export default function RoleSettings({ setPage, dark, setDark }) {
  const c = dark ? DARK : LIGHT;

  const [perms, setPerms] = useState(() => {
    const saved = localStorage.getItem('srmart_role_perms');
    return saved ? JSON.parse(saved) : DEFAULT_PERMISSIONS;
  });
  const [saved, setSaved] = useState(false);

  const toggle = (page, role) => {
    setPerms(prev => ({
      ...prev,
      [page]: {
        ...prev[page],
        [role]: !prev[page][role],
      }
    }));
    setSaved(false);
  };

  const handleSave = () => {
    localStorage.setItem('srmart_role_perms', JSON.stringify(perms));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    if (window.confirm('기본값으로 초기화할까요?')) {
      setPerms(DEFAULT_PERMISSIONS);
      localStorage.setItem('srmart_role_perms', JSON.stringify(DEFAULT_PERMISSIONS));
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: c.bg }}>
      <Sidebar currentPage="adminPC_roles" setPage={setPage} dark={dark} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* 상단바 */}
        <div style={{ background: c.topbarBg, borderBottom: `1px solid ${c.topbarBorder}`, padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: c.textPrimary }}>권한 설정</div>
            <div style={{ fontSize: 12, color: c.textTertiary, marginTop: 2 }}>메뉴별 직원/매장관리자 접근 권한을 설정하세요. 대표자는 항상 모든 메뉴에 접근 가능합니다.</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleReset} style={{ padding: '8px 16px', borderRadius: 8, border: `1px solid ${c.cardBorder}`, background: 'transparent', color: c.textSecondary, fontSize: 13, cursor: 'pointer' }}>
              초기화
            </button>
            <button onClick={handleSave} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#00c471', color: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              {saved ? '✓ 저장됨' : '저장'}
            </button>
          </div>
        </div>

        {/* 권한 테이블 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <div style={{ background: c.cardBg, borderRadius: 12, border: `1px solid ${c.cardBorder}`, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: c.theadBg }}>
                  <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: c.textSecondary, width: '50%' }}>메뉴</th>
                  <th style={{ padding: '12px 20px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#854F0B', width: '20%' }}>
                    직원
                  </th>
                  <th style={{ padding: '12px 20px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#0F6E56', width: '20%' }}>
                    매장관리자
                  </th>
                  <th style={{ padding: '12px 20px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#534AB7', width: '10%' }}>
                    대표자
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(MENU_LABELS).map(([page, label], i) => (
                  <tr key={page} style={{ borderTop: `1px solid ${c.cardBorder}`, background: i % 2 === 0 ? 'transparent' : dark ? '#1a1a1a' : '#fafafa' }}>
                    <td style={{ padding: '14px 20px', fontSize: 14, color: c.textPrimary, fontWeight: 500 }}>
                      {label}
                    </td>
                    {/* 직원 체크박스 */}
                    <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={perms[page]?.staff ?? false}
                        onChange={() => toggle(page, 'staff')}
                        style={{ width: 18, height: 18, accentColor: '#00c471', cursor: 'pointer' }}
                      />
                    </td>
                    {/* 매장관리자 체크박스 */}
                    <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={perms[page]?.manager ?? false}
                        onChange={() => toggle(page, 'manager')}
                        style={{ width: 18, height: 18, accentColor: '#00c471', cursor: 'pointer' }}
                      />
                    </td>
                    {/* 대표자는 항상 체크 */}
                    <td style={{ padding: '14px 20px', textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={true}
                        disabled
                        style={{ width: 18, height: 18, accentColor: '#534AB7', cursor: 'not-allowed', opacity: 0.6 }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: 16, padding: '12px 16px', borderRadius: 8, background: dark ? '#1a2a1a' : '#e6f9f1', border: '1px solid #00c471' }}>
            <p style={{ fontSize: 12, color: dark ? '#88ddaa' : '#007a40', margin: 0, lineHeight: 1.6 }}>
              💡 <strong>저장</strong> 버튼을 눌러야 변경사항이 적용돼요. 매장관리자에 체크하면 직원도 자동으로 포함되지 않으니 각각 설정해주세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
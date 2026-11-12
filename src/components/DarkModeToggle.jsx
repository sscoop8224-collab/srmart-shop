import { useTheme } from '../ThemeContext';

const SEGMENTS = [
  { id: 'auto',  label: '자동', icon: '🔄' },
  { id: 'light', label: '라이트', icon: '☀️' },
  { id: 'dark',  label: '다크',  icon: '🌙' },
];


export default function DarkModeToggle() {
  // 고른 모드는 ThemeContext 한 곳이 든다(옛 저장 키를 여기서 따로 읽지 않는다 — 묶음 1)
  const { darkMode, themeMode: active, setThemeMode: handleSelect } = useTheme();

  const containerStyle = {
    display: 'inline-flex',
    background: darkMode ? '#2a2a2a' : 'white',
    border: `1.5px solid ${darkMode ? '#3a3a3a' : '#e0e0e0'}`,
    borderRadius: '12px',
    padding: '3px',
    gap: '2px',
  };

  const btnBase = {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    padding: '6px 13px',
    borderRadius: '9px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    fontFamily: 'inherit',
    transition: 'background 0.18s, color 0.18s',
  };

  return (
    <div style={containerStyle}>
      {SEGMENTS.map(({ id, label, icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => handleSelect(id)}
            style={{
              ...btnBase,
              background: isActive ? 'var(--primary)' : 'transparent',
              color: isActive ? 'white' : (darkMode ? '#9e9e9e' : '#666'),
              boxShadow: isActive ? '0 2px 8px rgba(0,196,113,0.35)' : 'none',
            }}
          >
            <span style={{ fontSize: '14px', lineHeight: 1 }}>{icon}</span>
            {label}
          </button>
        );
      })}
    </div>
  );
}

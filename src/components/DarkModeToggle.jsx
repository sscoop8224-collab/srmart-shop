import { useState } from 'react';
import { useTheme } from '../ThemeContext';

const SEGMENTS = [
  { id: 'auto',  label: '자동', icon: '🔄' },
  { id: 'light', label: '라이트', icon: '☀️' },
  { id: 'dark',  label: '다크',  icon: '🌙' },
];

function getActiveSegment() {
  return localStorage.getItem('srmart_dark_manual') === 'true'
    ? (localStorage.getItem('srmart_dark_mode') === 'true' ? 'dark' : 'light')
    : 'auto';
}

export default function DarkModeToggle() {
  const { darkMode, setDarkMode, resetToSystem } = useTheme();
  const [active, setActive] = useState(getActiveSegment);

  const handleSelect = (id) => {
    if (id === 'auto') {
      resetToSystem();
    } else if (id === 'light') {
      setDarkMode(false);
    } else {
      setDarkMode(true);
    }
    setActive(id);
  };

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
              background: isActive ? '#00c471' : 'transparent',
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

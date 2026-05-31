import { useState } from 'react';
import { useTheme } from '../../ThemeContext';

export default function Input({
  label, value, onChange, placeholder,
  type = 'text', name, disabled = false,
  error, rows,
  style = {}, inputStyle = {},
}) {
  const { darkMode } = useTheme();
  const [focused, setFocused] = useState(false);

  const bg     = darkMode ? '#1e1e1e' : '#f8fffe';
  const border = error
    ? '#ff4757'
    : focused
      ? '#00c471'
      : (darkMode ? '#3a3a3a' : '#e8faf3');
  const text   = darkMode ? '#f0f0f0' : '#212529';
  const sub    = darkMode ? '#9e9e9e' : '#adb5bd';

  const base = {
    width: '100%', padding: '11px 14px',
    borderRadius: 12, border: `1.5px solid ${border}`,
    fontSize: 14, outline: 'none',
    background: disabled ? (darkMode ? '#2a2a2a' : '#f1f3f5') : bg,
    color: text, fontFamily: 'inherit',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
    ...inputStyle,
  };

  return (
    <div style={style}>
      {label && (
        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#00a85e', marginBottom: 6 }}>
          {label}
        </label>
      )}
      {rows ? (
        <textarea
          name={name} value={value} onChange={onChange}
          placeholder={placeholder} rows={rows} disabled={disabled}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{ ...base, resize: 'vertical' }}
        />
      ) : (
        <input
          name={name} type={type} value={value} onChange={onChange}
          placeholder={placeholder} disabled={disabled}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={base}
        />
      )}
      {error && (
        <div style={{ fontSize: 11, color: '#ff4757', marginTop: 4, fontWeight: 500 }}>
          {error}
        </div>
      )}
    </div>
  );
}

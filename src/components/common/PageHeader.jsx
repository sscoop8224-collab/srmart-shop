import { useTheme } from '../../ThemeContext';

export default function PageHeader({
  title,
  subtitle,
  onBack,
  right,
  sticky = true,
}) {
  const { darkMode } = useTheme();
  const bg     = darkMode ? '#222222' : '#ffffff';
  const border = darkMode ? '#3a3a3a' : '#f0faf5';
  const text   = darkMode ? '#f0f0f0' : '#1a1a1a';
  const sub    = darkMode ? '#9e9e9e' : '#adb5bd';
  const btnBg  = darkMode ? '#333333' : '#f0faf5';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '16px 20px',
      background: bg,
      borderBottom: `1px solid ${border}`,
      position: sticky ? 'sticky' : 'relative',
      top: 0, zIndex: 10,
    }}>
      {onBack && (
        <button onClick={onBack} style={{
          width: 38, height: 38, flexShrink: 0,
          background: btnBg, border: 'none', borderRadius: '50%',
          cursor: 'pointer', fontSize: 18,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#00a85e',
        }}>←</button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: text, lineHeight: 1.2 }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: 11, color: sub, marginTop: 2 }}>{subtitle}</div>
        )}
      </div>
      {right && <div style={{ flexShrink: 0 }}>{right}</div>}
    </div>
  );
}

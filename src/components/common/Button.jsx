import { useTheme } from '../../ThemeContext';

const variants = {
  primary: (t) => ({
    background: 'linear-gradient(135deg, #00c471, #00a85e)',
    color: '#fff',
    border: 'none',
    boxShadow: '0 4px 16px rgba(0,196,113,0.28)',
  }),
  secondary: (t) => ({
    background: t.surface,
    color: t.text,
    border: `1.5px solid ${t.borderLight}`,
    boxShadow: 'none',
  }),
  danger: (t) => ({
    background: t.dangerBg,
    color: t.dangerText,
    border: 'none',
    boxShadow: 'none',
  }),
  ghost: (t) => ({
    background: 'transparent',
    color: '#00a85e',
    border: `1.5px solid ${t.borderLight}`,
    boxShadow: 'none',
  }),
  info: (t) => ({
    background: t.infoBg,
    color: t.infoText,
    border: 'none',
    boxShadow: 'none',
  }),
};

const sizes = {
  sm: { padding: '5px 12px', fontSize: 11, borderRadius: 8,  height: 28 },
  md: { padding: '9px 16px', fontSize: 13, borderRadius: 12, height: 40 },
  lg: { padding: '13px 20px', fontSize: 15, borderRadius: 14, height: 50 },
  full: { padding: '13px 20px', fontSize: 15, borderRadius: 14, height: 50, width: '100%' },
};

export default function Button({
  children, onClick, variant = 'primary', size = 'md',
  disabled = false, style = {}, type = 'button',
}) {
  const { darkMode } = useTheme();
  const t = buildTheme(darkMode);
  const v = variants[variant]?.(t) ?? variants.primary(t);
  const s = sizes[size] ?? sizes.md;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...v, ...s,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        fontWeight: 700,
        fontFamily: 'inherit',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        whiteSpace: 'nowrap',
        transition: 'opacity 0.15s',
        boxSizing: 'border-box',
        ...style,
      }}>
      {children}
    </button>
  );
}

function buildTheme(dark) {
  return {
    surface:     dark ? '#2a2a2a' : '#ffffff',
    text:        dark ? '#f0f0f0' : '#212529',
    borderLight: dark ? '#3a3a3a' : '#e8faf3',
    dangerBg:    dark ? '#3a1a1a' : '#fff0f1',
    dangerText:  dark ? '#ff9999' : '#ff4757',
    infoBg:      dark ? '#1a2a40' : '#e8f0fe',
    infoText:    '#1a73e8',
  };
}

import { useTheme } from '../../ThemeContext';

export default function Card({
  children, style = {},
  padding = '16px',
  radius = 16,
  shadow = true,
  border = true,
  onClick,
}) {
  const { darkMode } = useTheme();
  const surface     = darkMode ? '#2a2a2a' : '#ffffff';
  const borderColor = darkMode ? '#3a3a3a' : '#f0faf5';
  const cardShadow  = darkMode ? 'none' : '0 2px 12px rgba(0,0,0,0.06)';

  return (
    <div
      onClick={onClick}
      style={{
        background:   surface,
        borderRadius: radius,
        padding,
        border:       border ? `1px solid ${borderColor}` : 'none',
        boxShadow:    shadow ? cardShadow : 'none',
        cursor:       onClick ? 'pointer' : 'default',
        ...style,
      }}>
      {children}
    </div>
  );
}

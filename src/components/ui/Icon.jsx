// 아이콘 — 목업 정본 v1 의 ICON 표(index.html)를 그대로 옮긴 것(묶음 1). 선 굵기·크기는 styles/ui.css 의 .ic
// 새 아이콘이 필요하면 목업 표에서 같은 이름으로 가져온다(따로 그리지 않는다).
const PATHS = {
  doc: "<path d=\"M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z\"/><path d=\"M14 3v5h5M9 13h6M9 17h6\"/>",
  phone: "<rect x=\"6\" y=\"2.5\" width=\"12\" height=\"19\" rx=\"2.5\"/><path d=\"M11 18.5h2\"/>",
  send: "<path d=\"M4 12 20 4l-6 16-3-7z\"/>",
  share: "<path d=\"M12 3v12M7.5 7.5 12 3l4.5 4.5\"/><path d=\"M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7\"/>",
  pin: "<path d=\"M12 21.5s7-6.2 7-12a7 7 0 0 0-14 0c0 5.8 7 12 7 12z\"/><circle cx=\"12\" cy=\"9.5\" r=\"2.5\"/>",
  star: "<path d=\"m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z\"/>",
  msg: "<path d=\"M21 14.5a2 2 0 0 1-2 2H8l-4.5 4V5a2 2 0 0 1 2-2H19a2 2 0 0 1 2 2z\"/>",
  plus: "<path d=\"M12 5v14M5 12h14\"/>",
  minus: "<path d=\"M5 12h14\"/>",
  truck: "<path d=\"M2 6h12v10H2zM14 9.5h4l3 3.5v3h-7\"/><circle cx=\"6\" cy=\"18\" r=\"2\"/><circle cx=\"17.5\" cy=\"18\" r=\"2\"/>",
  eye: "<path d=\"M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/>",
  box: "<path d=\"M21 8 12 3 3 8v8l9 5 9-5z\"/><path d=\"M3 8l9 5 9-5M12 13v8\"/>",
  home: "<path d=\"M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z\"/>",
  search: "<circle cx=\"11\" cy=\"11\" r=\"7\"/><path d=\"m20 20-3.5-3.5\"/>",
  cart: "<circle cx=\"9\" cy=\"20\" r=\"1.4\"/><circle cx=\"18\" cy=\"20\" r=\"1.4\"/><path d=\"M2.5 3h2.6l2.4 12.2a1.6 1.6 0 0 0 1.6 1.3h9a1.6 1.6 0 0 0 1.6-1.3L21 7H6\"/>",
  receipt: "<path d=\"M5 3v18l2-1.3L9 21l2-1.3L13 21l2-1.3L17 21l2-1.3V3l-2 1.3L15 3l-2 1.3L11 3 9 4.3 7 3z\"/><path d=\"M8.5 9h7M8.5 13h5\"/>",
  user: "<circle cx=\"12\" cy=\"8\" r=\"4\"/><path d=\"M4 21a8 8 0 0 1 16 0\"/>",
  bell: "<path d=\"M18 8.5a6 6 0 0 0-12 0c0 6.5-3 8.5-3 8.5h18s-3-2-3-8.5\"/><path d=\"M10.3 21a2 2 0 0 0 3.4 0\"/>",
  sparkle: "<path d=\"M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.5 2.5M15.2 15.2l2.5 2.5M6.3 17.7l2.5-2.5M15.2 8.8l2.5-2.5\"/>",
  chevD: "<path d=\"m6 9 6 6 6-6\"/>",
  chevR: "<path d=\"m9 6 6 6-6 6\"/>",
  chevL: "<path d=\"m15 6-6 6 6 6\"/>",
  check: "<path d=\"m5 12.5 4.5 4.5L19 7.5\"/>",
  alert: "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 7.5v5.5M12 16.5v.5\"/>",
  info: "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 11v6M12 7.5v.5\"/>",
  wifiOff: "<path d=\"M3 3l18 18M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 5-2.6M14.5 10.6A10 10 0 0 1 19 13M2 9.5a15 15 0 0 1 4-2.6M11 6a15 15 0 0 1 11 3.5\"/><circle cx=\"12\" cy=\"20\" r=\".8\"/>",
  refresh: "<path d=\"M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7\"/>",
  x: "<path d=\"M6 6l12 12M18 6 6 18\"/>",
  tag: "<path d=\"M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z\"/><circle cx=\"7.5\" cy=\"7.5\" r=\"1.3\"/>",
  moon: "<path d=\"M20.5 13.5A8.5 8.5 0 1 1 10.5 3.5a6.7 6.7 0 0 0 10 10z\"/>",
  sun: "<circle cx=\"12\" cy=\"12\" r=\"4\"/><path d=\"M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4\"/>",
  auto: "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 3v18\" /><path d=\"M12 3a9 9 0 0 1 0 18\" fill=\"currentColor\"/>",
  store: "<path d=\"M4 9.5V20h16V9.5M3 9.5l1.5-5.5h15L21 9.5a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z\"/><path d=\"M9.5 20v-5h5v5\"/>",
  heart: "<path d=\"M12 20.5s-8-4.7-8-10.4A4.6 4.6 0 0 1 12 7.3a4.6 4.6 0 0 1 8 2.8c0 5.7-8 10.4-8 10.4z\"/>",
  logout: "<path d=\"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9\"/>",
  trash: "<path d=\"M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13\"/>",
  lock: "<rect x=\"4\" y=\"10.5\" width=\"16\" height=\"10.5\" rx=\"2\"/><path d=\"M8 10.5V7a4 4 0 0 1 8 0v3.5\"/>",
  gift: "<rect x=\"3\" y=\"8\" width=\"18\" height=\"4.5\" rx=\"1\"/><path d=\"M5 12.5V21h14v-8.5M12 8v13M12 8S10.5 3 8 4s.5 4 4 4 6.5-3 4-4-4 4-4 4\"/>",
  // 묶음 5 — 마이(P02)
  clock: "<circle cx=\"12\" cy=\"12\" r=\"9\"/><path d=\"M12 7v5l3 2\"/>",
  shield: "<path d=\"M12 21.5s8-3.8 8-10V5l-8-3-8 3v6.5c0 6.2 8 10 8 10z\"/>",
  external: "<path d=\"M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5\"/>",
};

export default function Icon({ name, size = '', fill = false, className = '' }) {
  return (
    <svg
      className={['ic', size, fill ? 'fill' : '', className].filter(Boolean).join(' ')}
      viewBox="0 0 24 24"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: PATHS[name] || '' }}
    />
  );
}

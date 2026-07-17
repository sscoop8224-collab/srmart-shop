# SR마트 브랜드 아이콘 (공식 확정 — 변경 금지)

## PWA/앱 아이콘 공식 사양
- **배경**: #00c471 그린 **통짜** 바탕 (중간층 흰 판 **없음**).
- **로고**: `srm-logo-master.png` (원본 srm-logo — 노란 SRM' + 초록 요소 + 한글 서체) 를
  **무변형**으로 아이콘 폭 **65%** 중앙 배치.
- **금지**: 로고 재창작 · 서체 변형 · 색 치환(흰색화 등) · 배경 구조 변경.
- **기준 커밋**: `8c8ba30e` (srmart-shop).

## 마스터 파일
- `srm-logo-master.png` — 아이콘 파생의 **원본**(원본 srm-logo-transparent 사본). 이 파일에서만 파생한다.

## 재생성 / 사이즈 추가
shop 루트에서:
```
node brand/generate-pwa-icons.cjs
```
→ `public/icons/icon-<size>.png` (72~512) + `public/logo192.png` + `public/logo512.png` 생성.
사이즈 추가는 `generate-pwa-icons.cjs`의 `SIZES` 배열에만 추가한다(**로고 재창작 금지**, 이 스크립트로만 파생).

## 주의
`public/srm-logo.svg` 는 벡터가 아니라 base64 PNG를 감싼 **래스터**라 SVG fill 색치환이 불가하다.
색/형태 변형은 하지 않는다(사양상 원본 무변형).

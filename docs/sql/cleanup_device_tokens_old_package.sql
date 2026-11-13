-- cleanup_device_tokens_old_package.sql — 옛 쇼핑앱(패키지 com.dongshin.srmart)의 푸시 토큰 정리 (2026-11-13 작성 · 🔴 아직 안 돌렸다)
--
-- 왜: 2026-11-13 패키지 이름을 com.dongshin.srmart → com.dongsin.srmart 로 바꿨다(철자를 도메인 dongsinmarket 에 맞춤).
--     안드로이드는 패키지가 다르면 **다른 앱**으로 본다. 옛 앱의 FCM 토큰은 새 앱에 닿지 않는다.
--     옛 앱을 지우면 그 토큰은 발송 때 「등록 안 됨」으로 돌아오고, 발송 입구(index.js /api/admin/push/send 등)가 그때 스스로 지운다.
--     이 파일은 그것을 기다리지 않고 **한 번에** 치우는 것이다.
--
-- 🔴 device_tokens 에는 「어느 앱(패키지)의 토큰인가」 칸이 없다 — 토큰 글자로도 가릴 수 없다.
--    그래서 **시점**으로 가른다: 새 패키지 앱은 2026-11-13 까지 한 번도 배포되지 않았으므로, 그날 표에 있던 줄은 전부 옛 앱 것이다.
--    2026-11-13 읽기 확인(앱 계정 SELECT): 2건 · 둘 다 android · 둘 다 비회원(user_id NULL) · 매장 1건(store 1) + 없음 1건
--                                         · 처음 2026-07-24 22:25 · 마지막 2026-09-03 09:14 · 가장 큰 id 10
--    → 아래 DELETE 는 id <= 10 이고 2026-11-14 이전에 생긴 줄만 지운다(새 앱이 등록한 줄은 id 가 11 이상이라 안 걸린다).
--
-- 언제: 새 앱(com.dongsin.srmart)을 직원·시험 폰에 깔고, 옛 앱을 지운 **뒤**. 순서가 바뀌어도 해는 없다
--       (옛 앱이 남아 있으면 다음 실행 때 같은 토큰을 다시 등록한다 — 그 줄은 id 가 새로 생기므로 이 파일로는 안 지워진다).
--
-- cmd에서 실행 — 먼저 백업(비밀번호를 묻는다 · 한 줄만):
--   mysqldump -u root -p -h 127.0.0.1 -P 3306 --default-character-set=utf8mb4 --single-transaction srmart device_tokens > E:\backups\srmart_manual_device_tokens_<날짜>.sql
-- 적용(한 줄만):
--   mysql -u root -p -h 127.0.0.1 -P 3306 --default-character-set=utf8mb4 srmart < C:\srmart\srmart-shop\docs\sql\cleanup_device_tokens_old_package.sql
-- 확인(한 줄만 — 0 이 나와야 한다):
--   mysql -u root -p -h 127.0.0.1 -P 3306 --default-character-set=utf8mb4 srmart -e "SELECT COUNT(*) AS old_cnt FROM device_tokens WHERE id <= 10 AND created_at < '2026-11-14 00:00:00';"

-- 지우기 전에 무엇을 지우는지 찍는다(토큰 값은 찍지 않는다)
SELECT id, platform, user_id, store_id, created_at, updated_at
  FROM device_tokens
 WHERE id <= 10 AND created_at < '2026-11-14 00:00:00';

START TRANSACTION;
DELETE FROM device_tokens
 WHERE id <= 10 AND created_at < '2026-11-14 00:00:00';
SELECT ROW_COUNT() AS deleted_cnt;   -- 2026-11-13 기준으로는 2 가 나와야 한다
COMMIT;

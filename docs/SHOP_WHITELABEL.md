# 쇼핑앱 화이트라벨 — 브랜드마다 앱 따로 찍기

같은 화면 코드로 브랜드(마트)마다 **따로 설치되는 앱**을 만든다(2026-11-13 대표님 지시).
지금 브랜드는 에스알마트(`srm`)와 아람마트(`aram`) 둘이다.

## 🔴 철자 규칙 — 회사는 `dongsin`, 패키지는 `com.dongsin.<브랜드>mart`

> **회사 철자는 `dongsin`** — 도메인 `dongsinmarket.com` 과 같다. `dongshin`(h 가 든 철자)은 쓰지 않는다.
> **안드로이드 패키지 이름은 `com.dongsin.<브랜드>mart`** 꼴로 짓는다.

| 브랜드 | id | 앱 이름 | 패키지(applicationId) | 매장 코드 | 바탕색 |
|---|---|---|---|---|---|
| 에스알마트 | `srm` | 에스알마트 | `com.dongsin.srmart` | 001·002·003 | `#00c471`(아이콘) · `#077D3C`(스플래시) |
| 아람마트 | `aram` | 아람마트 | `com.dongsin.arammart` | 004 | `#DB102E` |

- 🔴 **패키지 이름은 플레이스토어에 한 번 올리면 바꿀 수 없다.** 바꾸면 안드로이드가 **다른 앱**으로 본다.
  그러면 덮어 설치가 안 되고, 푸시 토큰과 기기에 저장된 값이 모두 끊긴다.
  2026-11-13 에 `com.dongshin.srmart` → `com.dongsin.srmart` 로 바꾼 것은 **등록하기 전이라서** 할 수 있었다.
- 동신포스는 지금 `com.srmart.pos` 다. 바꾼다면 같은 규칙으로 `com.dongsin.pos` 가 된다. 이 일은 포스 창이 맡는다.
  상위 `C:\srmart\CLAUDE.md` 의 「release 키스토어 전환」 때 같이 바꾸기로 되어 있다.
- 새 브랜드를 붙일 때는 아래 「새 브랜드 붙이기」를 따른다. 패키지 이름은 **대표님이 확정한 뒤에** 적는다.

## 어디에 무엇이 있나

| 무엇 | 자리 | 비고 |
|---|---|---|
| 브랜드 설정 | `brands/<id>/brand.json` | 이름·appId·매장·색·그림 자리 |
| 패키지 이름 | `android/app/build.gradle` 의 `productFlavors` | 🔴 `brand.json` 의 `appId` 와 **같은 값**이어야 한다(사람이 맞춘다) |
| 자바 코드 자리 | `namespace "com.dongsin.srmart"` · `app/src/main/java/com/dongsin/srmart/MainActivity.java` | 두 브랜드가 **같이** 쓴다. 기기에 깔리는 이름(applicationId)과는 따로다. 그래서 아람 APK 의 시작 화면 클래스 이름도 `com.dongsin.srmart.MainActivity` 로 찍힌다 — 정상이다 |
| 앱 이름 | 에스알마트 `app/src/main/res/values/strings.xml` · 아람 `app/src/aram/res/values/strings.xml` | |
| 색 | 에스알마트 `main/res/values/*.xml` · 아람 `app/src/aram/res/values/colors.xml` | `ic_launcher_background` · `splashBackground` |
| 아이콘·스플래시 | 에스알마트 `main/res`(공식 확정 사양 · `brand/generate-android-icons.cjs`) · 아람 `app/src/aram/res` | 아람은 `node brand/generate-android-brand.cjs aram` 으로 만든다 |
| 원본 그림 | `C:\srmart\brand\<id>\<id>_01~09` | 원본은 고치지 않는다(README) |
| 푸시 설정 | `app/src/srm/google-services.json` · `app/src/aram/google-services.json` | Firebase 콘솔에서 **그 패키지로** 받은 파일. 아직 없다(아래 「대표님 할 일」) |

🔴 `generate-android-brand.cjs` 는 `main/res` 에 있는 그림을 **같은 이름·같은 크기로 전부** 다시 만든다.
하나라도 빠지면 그 칸(예: `drawable-port-hdpi/splash.png`)에는 **에스알마트 그림이 그대로** 들어간다.
안드로이드는 이름과 조건이 같은 그림만 브랜드 쪽 것으로 바꿔 끼우기 때문이다.

## 빌드

```
cd C:\srmart\srmart-shop\android
gradlew.bat assembleSrmDebug assembleAramDebug
```

결과는 `app/build/outputs/apk/<srm|aram>/debug/app-<srm|aram>-debug.apk` 에 나온다.
확인은 `aapt2 dump badging <apk>` 로 한다. `package:` 줄에서 패키지를, `application-label:` 줄에서 앱 이름을 본다.

- `google-services.json` 이 어느 브랜드에도 없으면 **푸시 없이** 빌드한다. 이때 경고 한 줄이 찍힌다.
  한 브랜드 파일만 있으면 다른 브랜드는 경고만 남기고 푸시 없이 빌드된다(`missingGoogleServicesStrategy = 'WARN'`).
- 🔴 앱이 띄우는 웹 주소는 브랜드마다 다르다(2026-11-15 준비): 에스알마트 `/srm/` · 아람 `/aram/`(`brands/<id>/brand.json` 의 url).
  `npx cap sync android` **뒤에** `node scripts/cap-brand-config.cjs` 를 돌려 flavor 자리에 주소 사본을 쓴다(안 하면 두 앱이 같은 주소를 연다).
  🔴 nginx 에 `/srm/`·`/aram/` 을 건 **뒤에** APK 를 찍는다 — 적용 순서·되돌리기는 `docs/ARAM_WEB_PATH.md`.

## 서명 키 — 지금과 정식 출시 계획

**지금**: 두 브랜드 모두 이 PC 의 안드로이드 **디버그 키**(`C:\Users\user\.android\debug.keystore`)로 서명한다.
release 빌드에는 서명 설정이 없다.

| | 값 |
|---|---|
| 인증서 | `CN=Android Debug, O=Android, C=US` |
| SHA-1 | `3B:0D:DE:D4:FB:A5:A5:5E:84:76:DA:E1:83:85:4A:31:0C:BF:9C:82` |
| SHA-256 | `7B:70:0B:FE:B6:C6:47:BB:FB:92:9A:34:8D:F9:2E:0F:B2:B9:64:3D:CA:D1:B5:CB:F3:E6:32:56:AE:E1:AB:C0` |
| 카카오 키 해시(SHA-1 의 base64) | `Ow3e1PulpV6Edtrhg4VKMQy/nII=` |

지문은 비밀이 아니다. 콘솔에 등록하는 값이다. 디버그 키의 비밀번호는 안드로이드 기본값이라 따로 지킬 것이 없다.
🔴 **플레이스토어는 디버그 키로 서명한 앱을 받지 않는다.** 그래서 정식 출시 전에 아래처럼 바꾼다.

**정식 출시 계획** (만드는 것은 대표님 승인 뒤에 한다):

1. **플레이 앱 서명(Play App Signing)을 쓴다.** 앱에 실제로 서명하는 키는 구글이 들고 있고, 우리는 **업로드 키**만 든다.
   업로드 키를 잃어도 플레이 콘솔에서 재설정을 요청할 수 있다. 직접 들고 있는 서명 키를 잃으면 **그 앱은 영영 업데이트할 수 없다.**
   새 앱은 AAB 로 올려야 하므로 어차피 이 방식이 기본이다.
2. **업로드 키는 브랜드마다 따로** 만든다: `shop-srm-upload.jks` · `shop-aram-upload.jks`.
   화이트라벨 브랜드는 나중에 운영 주체가 달라질 수 있다. 키를 넘기거나 폐기해도 다른 브랜드가 다치지 않아야 한다.
3. **보관 위치**
   - 원본: `C:\srmart\keys\` — **저장소 밖**이다.
   - 백업: `E:\backups\keys\`. C 드라이브와 다른 디스크다(DB 백업과 같은 원칙).
   - 하나 더: 오프라인 USB 에 한 벌 둔다.
   - 비밀번호는 **파일에 적지 않는다.** 대표님 비밀번호 관리 도구에 둔다.
4. **gradle 은 키를 `android/keystore.properties` 에서 읽는다.** 이 파일은 git 무시이고, 비밀번호가 들어가므로 커밋하지 않는다.
   `*.jks`·`*.keystore`·`keystore.properties` 는 `android/.gitignore` 에 걸어 두었다(2026-11-13).
5. **업로드 키를 만든 뒤에 할 일**
   - 업로드 키의 SHA-1·SHA-256 을 Firebase 와 카카오에 **추가로** 등록한다.
   - 플레이가 만든 **앱 서명 키**의 SHA-1·SHA-256 도 등록한다(플레이 콘솔 → 앱 무결성).
   - 셋 다 등록해 두면 디버그·업로드·스토어 빌드가 모두 푸시를 받는다.

## 푸시 알림 — 패키지가 바뀌면 옛 토큰은 끝이다

- 앱은 켜질 때마다 FCM 토큰을 받아 `POST /api/push/register` 로 등록한다(`src/pushSetup.js` → `device_tokens` upsert).
  그래서 **새 앱도 처음 켜질 때 토큰을 새로 등록한다.** 단, 그 브랜드의 `google-services.json` 이 들어간 APK 여야 한다.
  파일이 없으면 등록을 시도하다 오류를 받고 조용히 넘어간다(`pushSetup.js` 의 try/catch).
- 🔴 `device_tokens` 에는 **어느 앱(패키지)의 토큰인지** 적는 칸이 없다. 토큰 글자로도 가릴 수 없다.
  2026-11-13 표에 있는 2건은 새 앱이 아직 배포되지 않았으므로 **전부 옛 앱 것이다.**
  정리 SQL: `docs/sql/cleanup_device_tokens_old_package.sql`. 파일만 있고 **아직 안 돌렸다.**
- 옛 앱을 지운 기기의 토큰은 다음 발송 때 「등록 안 됨」으로 돌아온다. 그러면 발송 입구가 스스로 지운다(`index.js` 의 `invalidTokens`).
- **나중 일 — 브랜드가 둘이면 푸시도 브랜드별로 보내야 한다.** 아람 손님에게 에스알마트 알림이 가면 안 된다.
  `device_tokens` 에 앱 구분 칸(예: `app_id`)을 두고, 앱이 등록할 때 자기 패키지를 실어 보내게 하는 것이 맞다.
  이것은 스키마 변경이라 대표님 승인 뒤에 한다.

## 대표님 할 일 — 순서대로

1. **Firebase 콘솔에 두 패키지 앱을 등록한다.** 같은 프로젝트에 안드로이드 앱 두 개를 둔다.
   - `com.dongsin.srmart` (에스알마트), `com.dongsin.arammart` (아람마트)
   - 각 앱에 위 표의 **디버그 키 SHA-1·SHA-256** 을 넣는다. 업로드 키는 만든 뒤에 추가한다.
2. **`google-services.json` 을 앱마다 받아 아래 자리에 넣는다.** 파일 이름은 그대로 둔다.
   - `C:\srmart\srmart-shop\android\app\src\srm\google-services.json`
   - `C:\srmart\srmart-shop\android\app\src\aram\google-services.json`
   - 넣은 뒤 Claude 에게 「넣었다」고 알려 주시면, APK 를 다시 빌드해 푸시 설정이 들어갔는지 확인한다.
3. **옛 앱 `com.dongshin.srmart` 은 Firebase 콘솔에서 지운다.** 직원·시험 폰을 다 바꾼 뒤에 한다.
   지우면 옛 토큰이 확실히 「등록 안 됨」이 되어 서버가 스스로 치운다.
4. **카카오 개발자 콘솔.** 지금 앱은 카카오 SDK·카카오 로그인을 쓰지 않는다. 카카오페이는 서버가 REST 로 부른다.
   그래서 **당장 앱 동작에는 영향이 없다.** 다만 「플랫폼 → Android」에 `com.dongshin.srmart` 이 등록돼 있으면 이렇게 고친다.
   - 패키지명: `com.dongsin.srmart` 로 바꾸고, `com.dongsin.arammart` 을 추가한다.
   - 키 해시: `Ow3e1PulpV6Edtrhg4VKMQy/nII=` 를 넣는다(디버그 키). 업로드·앱 서명 키 해시는 나중에 추가한다.
5. **직원·시험 폰에서 옛 앱을 지우고 새 앱을 깐다.** 옛 앱과 새 앱은 **다른 앱**이라 둘 다 깔린다.
   옛 앱을 꼭 지워야 홈 화면에 「에스알마트」가 두 개 생기지 않는다.
   새 앱에서는 로그인을 다시 한다. 장바구니는 서버에 있으므로 그대로 따라온다(서버 장바구니가 반영된 뒤).
6. **`docs/sql/cleanup_device_tokens_old_package.sql` 을 돌린다.** 백업 → 적용 → 확인 명령이 파일 머리에 있다.

## 새 브랜드 붙이기

1. 원본 그림 9종을 `C:\srmart\brand\<id>\` 에 둔다. 정식 로고가 오기 전에는 `brand/make-temp-brand.cjs` 를 쓴다.
2. `brands/<id>/brand.json` 을 만든다. `appId` 는 `com.dongsin.<브랜드>mart` 꼴로, **대표님 확정 뒤에** 적는다.
3. `android/app/build.gradle` 의 `productFlavors` 에 같은 `applicationId` 로 한 갈래를 더한다.
   `google-services.json` 을 찾는 목록(`['srm', 'aram']`)에도 이름을 더한다.
4. `app/src/<id>/res/values/strings.xml` 와 `colors.xml` 을 만든다(아람 것을 본뜬다).
5. `node brand/generate-android-brand.cjs <id>` 를 돌린다. 그다음 `gradlew.bat assemble<Id>Debug` 로 빌드하고 aapt2 로 확인한다.

# 브랜드별 웹 주소 — `/srm` · `/aram` (2026-11-15 준비 · 적용 전)

> 이 문서는 **준비만** 한 것이다. nginx·pm2·배포·홈페이지에 아직 아무것도 반영하지 않았다.
> 적용은 대표님 승인 뒤에 아래 순서로 한다.

## 주소와 서빙 구조

| 주소 | 무엇이 나가나 | 서버 | 누가 여나 |
|---|---|---|---|
| `https://www.dongsinmarket.com/shop/` | 에스알마트 빌드 (`build`) | pm2 `srmart-shop` · 3000 | **이미 깔린 앱** — 그대로 둔다 |
| `https://www.dongsinmarket.com/srm/` | 에스알마트 빌드 (같은 `build`) | pm2 `srmart-shop` · 3000 | 새로 찍는 에스알마트 앱(`capacitor.config.ts`) · QR 안내 화면 |
| `https://www.dongsinmarket.com/aram/` | 아람마트 빌드 (`build_aram`, `REACT_APP_BRAND=aram`) | pm2 `srmart-shop-aram` · **127.0.0.1:3002** | 아람 앱 · QR 안내 화면 |

- `.co.kr` · `.com` 과 `www` 가 붙은 이름까지 넷이 **443 server 블록 하나**를 같이 쓴다. 그래서 nginx 초안 하나로 두 도메인에 같이 걸린다.
- 쇼핑앱은 `homepage: "."` 로 빌드한다. 주소가 모두 상대 경로라 **같은 빌드가 `/shop/`·`/srm/` 어디서나 돈다.** 그래서 `/srm/` 은 새 서버 없이 3000 으로 보낸다.
- 아람 serve 는 **127.0.0.1 에만** 연다(`-l tcp://127.0.0.1:3002`). nginx 만 부르면 되기 때문이다.
  에스알마트 serve(3000)는 지금 `0.0.0.0` 에 열려 있다. 운영 바인딩은 대표님 결정 사항이라 건드리지 않았다.
- 주소의 원본은 `brands/<id>/brand.json` 의 `url`·`webPath` 다. 배포 스크립트·안드로이드 사본·검사기가 모두 여기서 읽는다.

## 한 출처(www.dongsinmarket.com)에 브랜드가 둘이라 고친 것

| 부딪히는 것 | 무엇이 나나 | 고친 것 |
|---|---|---|
| 서비스워커 캐시 | Cache Storage 는 범위가 아니라 **출처 단위**다. 옛 `activate` 는 「내 이름 아닌 캐시 전부」를 지운다. 그래서 `/srm/` 과 `/aram/` 이 서로의 캐시(오프라인 화면 포함)를 지운다 | 캐시 이름 `shop-v7:<범위>`. 지울 때는 같은 범위 옛 판과 옛 이름 `srmart-shop-v1~6` 만 지운다. 꺼낼 때는 내 캐시에서만 꺼낸다 |
| 손님이 고른 매장 (`localStorage`) | 같은 브라우저에서 에스알마트에서 고른 매장이 아람 웹으로 넘어간다. 그러면 아람 간판 아래 다른 브랜드 매장의 가격이 보인다 | 키를 브랜드마다 나눴다(`GUEST_STORE_KEY`). 에스알마트는 옛 키 `guestStoreId` 그대로 쓴다(지금 손님이 고른 매장을 지키려고). |

시험(2026-11-15, 127.0.0.1 임시 서버에 두 빌드를 `/srm/`·`/aram/` 으로 같이 띄움):
- 서비스워커가 각자 범위를 맡았다.
- 캐시 `shop-v7:/srm/`·`shop-v7:/aram/` 이 둘 다 남았다(오프라인 화면 포함).
- 오프라인이면 각자 자기 오프라인 화면이 나온다.
- 아람 화면은 에스알마트에서 고른 매장을 이어받지 않는다.
- 제목은 각각 「에스알마트」·「아람마트」다.

배포 때 도는 `check-sw.cjs`·`check-f11.cjs` 도 로컬 `/aram` 에서 통과했다.

### 아직 같이 쓰는 것 — 판단이 필요하다(고치지 않았다)

- **로그인 토큰 `srmart_token`.** 같은 브라우저에서 `/srm/` 에 로그인하면 `/aram/` 에서도 로그인돼 있다. 회원이 한 체계라 지금은 그대로 두었다. 네이티브 앱은 앱마다 저장소가 따로라 상관없다.
- **첫 화면 광고.**
  - `public/index.html` 이 `/api/splash-ads` 를 브랜드 머리글(`X-Shop-Brand`) 없이 미리 부른다. 서버는 머리글이 없으면 에스알마트로 본다.
  - 광고 이미지 캐시 이름(`srmart-splash-ads-v1`)도 브랜드가 같이 쓴다.
  - 그래서 아람 웹 첫 화면에 에스알마트 광고가 잠깐 보일 수 있다.

## 적용 순서 (대표님 승인 뒤 · cmd 기준)

1. **쇼핑앱 가지를 main 에 합친다** (`shop-prep-1115`).
   - 🔴 합친 뒤에는 nginx 를 걸기 전까지 `deploy-shop.cjs` 가 확인 단계에서 멈추고 스스로 되돌린다. `/srm/` 이 아직 홈페이지를 내주기 때문이다(안전한 쪽으로 실패).
   - 그래서 합치기와 2번을 붙여서 한다.
2. **nginx** — **관리자** cmd 에서 한다.
   ```
   fc /b C:\nginx\conf\nginx.conf C:\srmart\srmart-shop\deploy\nginx\nginx.conf.live-20261115
   ```
   「차이가 없습니다」가 나와야 다음으로 간다. 다르면 그 사이 누가 nginx 를 바꾼 것이니 멈춘다(초안을 다시 만든다).
   ```
   copy C:\nginx\conf\nginx.conf E:\backups\nginx.conf.before-20261115
   copy /y C:\srmart\srmart-shop\deploy\nginx\nginx.conf.draft-20261115 C:\nginx\conf\nginx.conf
   C:\nginx\nginx.exe -t -p C:\nginx\
   ```
   `syntax is ok` · `test is successful` 두 줄이 나와야 다음으로 간다. 아니면 아래 「되돌리기 ①」.
   ```
   C:\nginx\nginx.exe -s reload -p C:\nginx\
   curl -s https://www.dongsinmarket.com/srm/ | findstr "static/js/main"
   curl -s https://www.dongsinmarket.com/shop/ | findstr "static/js/main"
   ```
   두 줄 모두 **같은** `static/js/main.….js` 가 나와야 한다. `/aram/` 은 3번 전까지 502 다(정상).
3. **에스알마트 배포** — `node C:\srmart\srmart-shop\scripts\deploy-shop.cjs`
   - `/srm` 을 본다(+ `/shop` 이 같은 build 인지).
   - 서비스워커 판이 `v7` 로 올라가므로, 이미 깔린 기기는 옛 캐시를 한 번 비우고 새로 받는다.
4. **아람 첫 배포** — `node C:\srmart\srmart-shop\scripts\deploy-shop.cjs --brand aram`
   - 처음에는 `build_aram` 을 새로 만들고 pm2 에 `srmart-shop-aram`(127.0.0.1:3002)을 올린다.
   - 확인에 실패하면 멈추고 `build_aram_failed_<시각>` 으로 옮긴다.
   - 결과 줄의 `netstat :3002 → TCP 127.0.0.1:3002 …` 를 본다.
5. **`pm2 save`** — 재부팅 뒤에도 `srmart-shop-aram` 이 뜨게 한다.
   - 재부팅하면 pm2 는 저장 목록(`dump.pm2`)으로 되살아난다. 저장하지 않으면 재부팅 뒤 `/aram/` 이 502 다.
6. **QR 안내 화면** — `copy /y C:\srmart\srmart-shop\landing\app\index.html C:\srmart\homepage\app\index.html`
   - 바뀌는 것: 「쇼핑몰 열기」 단추가 에스알마트는 `/srm/` 을, 아람은 `/aram/` 을 연다. 아람은 지금은 「준비 중」이다.
   - 바꾸기 전 원본은 `E:\backups\homepage_app_index_20261115.html` 로 먼저 복사한다.
7. **안드로이드 APK** (스토어 등록 때)
   ```
   cd /d C:\srmart\srmart-shop
   npx cap sync android
   node scripts\cap-brand-config.cjs
   node scripts\cap-brand-config.cjs --check
   cd android
   gradlew.bat assembleSrmRelease assembleAramRelease
   ```
   - `cap sync` 는 main 자리에 주소 하나만 쓴다. 그래서 `cap-brand-config.cjs` 가 브랜드(flavor) 자리에 `/srm/`·`/aram/` 사본을 쓴다. flavor 쪽이 main 을 덮는다.
   - 🔴 **nginx(2번)보다 먼저 APK 를 찍지 않는다.** 앱이 홈페이지를 연다.

## 되돌리기

- **① nginx** (관리자 cmd):
  ```
  copy /y E:\backups\nginx.conf.before-20261115 C:\nginx\conf\nginx.conf
  C:\nginx\nginx.exe -t -p C:\nginx\
  C:\nginx\nginx.exe -s reload -p C:\nginx\
  ```
  `/shop/` 은 처음부터 안 바뀌었으니 이미 깔린 앱은 영향이 없다.
- **② 아람 serve 멈춤**:
  ```
  pm2 stop srmart-shop-aram
  pm2 save
  ```
  목록에서 아예 빼려면 `pm2 delete srmart-shop-aram` 다음에 `pm2 save` 를 한다.
- **③ 에스알마트 화면** — 배포 결과 줄의 「되돌릴 곳 `build_prev_<시각>`」 이다(배포 스크립트 실패 시 자동). 사람이 되돌릴 때는 `pm2 stop srmart-shop` → 폴더 이름 맞바꾸기 → `pm2 start srmart-shop` 순서다.
- **④ QR 안내 화면** — `copy /y E:\backups\homepage_app_index_20261115.html C:\srmart\homepage\app\index.html`

## 지키는 검사

`scripts/check-brand-paths.cjs` 는 prebuild 에서 돈다(자가 시험 14건). 보는 것:
- 앱 주소(`capacitor.config.ts` = srm `brand.json`)
- 배포 칸(포트·폴더·pm2 겹침, `/shop` 확인)
- nginx 초안(네 이름, `/shop` 3000 그대로, 브랜드마다 경로 → 그 포트)
- 서비스워커 범위 캐시
- 매장 기억 키
- QR 안내 주소
- 안드로이드 사본 gitignore

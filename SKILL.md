---
name: 학원-홈페이지-템플릿
description: 원장님 학원 홈페이지와 관리자 화면을 템플릿으로 세운다. 원장님은 구글 로그인과 정보 확인만 하고, 템플릿 받기·Firebase 연결·장부 값으로 학원 정보 채우기·배포·실제 주소 확인은 요메이트가 한다. "학원 홈페이지 만들어 줘", "홈페이지 세팅해 줘", "상담 신청 받는 사이트", "월말 리포트 링크 보내는 곳"에 쓴다.
---

# 학원 홈페이지 템플릿

템플릿 저장소: https://github.com/from5302-lab/yomates-academy-homepage
데모(가짜 학원 '한빛영어학원'): https://yomates-academy-demo.web.app (기능 전부 켬) · https://yomates-academy-demo.web.app/?demo=basic (기본만)

**원칙:** 원장님이 할 일은 두 가지뿐이다.
1. 구글 로그인 (Firebase 로그인, 관리자 화면 로그인)
2. 처음 설정 화면에서 학원 정보가 맞는지 보고 '다음'을 누르기

코드는 고치지 않는다. 학원마다 다른 것은 모두 `academy.json` 한 파일과 관리자 화면의 '홈페이지 정보' 탭에 들어간다.

**틀은 하나, 기능은 켜고 끈다.**
- 늘 켜짐: 학원 소개, 반·시간표, 오시는 길, 입회·상담 신청, 관리자 한눈에·일정, 처음 설정
- 켜고 끄는 기능(`features`): `report` 월말 리포트, `pay` 원비 납부 표, `fees` 원비 공개, `teachers` 선생님 소개, `reviews` 후기, `notice` 공지 띠, `leveltest` 레벨테스트, `makeup` 보강 신청
- 끈 기능은 홈페이지 메뉴와 관리자 메뉴에서 사라지고, 보안 규칙이 그 자료(리포트, 원비, 보강 신청, 레벨테스트 결과)를 막는다.
- 원장님은 처음 설정 2단계 '기능'에서 체크로 고르고, 나중에 '홈페이지 정보' 탭에서 언제든 바꾼다.

**학원마다 다른 모양(사진은 넣지 않는다).** 로고에서 뽑은 주 색(로고를 올리면 저절로 뽑힌다), 글꼴(`gothic`·`serif`), 모서리(`sharp`·`soft`·`round`), 첫 화면 배치(`split`·`center`)로 나눈다. `look`에 적는다.

다 끝나면 원장님은 아래를 갖는다.
- `https://<프로젝트아이디>.web.app`: 학원 소개, 반·시간표, 원비, 선생님, 후기, 오시는 길, 입회·상담 신청, 위쪽 공지 띠
- `https://<프로젝트아이디>.web.app/admin`: 원장님 구글 계정만 들어가는 관리자 화면
  - 한눈에: 오늘·이번 주 일정, 상담 신청, 리포트 발송, 원비 미납이 한 화면에
  - 상담: 문의 → 예약 → 등록 상태 바꾸기. 예약 시각을 고르면 일정에 들어간다
  - 일정: 상담·보강·시험
  - 학생: 반·학생 명단, 구글 시트 줄 붙여 넣기 또는 CSV 올리기
  - 리포트: 학생별 다섯 칸(이번 달 한 것, 숫자, 잘한 것, 다음 달 목표, 집에서 도와주실 것), 학부모가 여는 링크, 보냄·안 보냄
  - 원비: 달마다 납부·미납 표
  - 문자: 리포트 문자, 미납 안내 문자를 '보낼 목록 CSV(번호,내용)'로 내려받는다. 보내는 것은 솔라피 스킬이 한다

요금은 무료(Spark)로 돈다. Functions를 쓰지 않으니 Blaze 카드 등록이 필요 없다.

## 꼭 지킬 것

- **실제 학생 정보는 원장님 Firebase에만:** 학생·학부모 번호를 채팅, 깃허브, `academy.json`에 쓰지 않는다. 명단은 관리자 화면에서 넣는다.
- **원비는 교육청에 게시한 금액 그대로:** 장부 값과 교육청 게시 금액이 다르면 넣기 전에 원장님께 묻는다. 할인가·이벤트가는 원비 칸에 넣지 않는다.
- **후기는 학부모 허락을 받은 것만**, 이름은 `김○○`처럼 가린다.
- **명령마다 `--project <아이디>`:** 원장님이 고르지 않은 프로젝트에는 배포하지 않는다.
- **`.git`은 올라가지 않게:** `firebase.json`의 hosting ignore에 `.git`, `**/.*`, `node_modules`가 있다. 지우지 않는다. 그래도 받은 폴더의 `.git`은 지운다(3단계).
- 줄을 나눌 곳은 `academy.json`에 `\n`으로 적는다. 뜻 단위로 끊는다("매일 20분 소리 내어 읽고,\n한 달에 한 권 끝까지 읽습니다.").

## 1. 원장님께 먼저 확인할 것 (한 번에)

- 관리자로 쓸 구글 이메일 (여럿이면 모두)
- 켤 기능: 월말 리포트, 원비 납부 표, 원비 공개, 선생님 소개, 후기, 공지 띠, 레벨테스트, 보강 신청 중 무엇을 쓸지
- 레벨테스트를 켜면 쓰고 있는 진단 문항과 점수별 추천 반
- 홈페이지 주소로 쓸 영어 이름 (예: `hanbit-english` → `https://hanbit-english.web.app`)

## 2. 템플릿 받기

```
git clone --depth 1 https://github.com/from5302-lab/yomates-academy-homepage ~/firebase-sites/<아이디>
cd ~/firebase-sites/<아이디> && rm -rf .git
echo '{ "projects": { "default": "<아이디>" } }' > .firebaserc
```

## 3. Firebase 프로젝트 (firebase-세팅 스킬)

https://github.com/from5302-lab/yomates-firebase-skill 의 순서를 따른다. 원장님은 로그인만 한다.
1. 도구 설치, `firebase login`(원장님), 프로젝트 만들기
2. 그 스킬의 4단계(작업 폴더와 첫 화면 파일)는 하지 않는다. 2단계에서 받은 폴더가 작업 폴더다. 아래 명령은 모두 그 폴더에서 돌린다
3. 웹 앱 등록 후 설정값을 `public/firebase-config.json`에 저장
   ```
   firebase apps:create web "<학원 이름> web" --project <아이디>
   firebase apps:sdkconfig web --project <아이디> --out public/firebase-config.json
   ```
   이 파일이 `{}`이면 사이트는 데모(이 브라우저에만 저장)로 돈다. 설정값이 들어가면 Firestore를 쓴다.
4. Firestore 만들기 (`asia-northeast3`, 서울)
5. 「필요할 때만 → Google 로그인 켜기」를 한다. 관리자 화면 로그인에 필요하다.

## 4. 장부 값으로 academy.json 채우기

`academy.json`은 지금 가짜 학원 값이다. 원장님 장부(학원 정보 페이지, 교육청 게시 원비표, 시간표)에서 찾아 모두 바꾼다.

| 칸 | 넣을 것 |
|---|---|
| name | 학원 이름 |
| tagline | 한 줄 소개. 두 줄이면 `\n` |
| intro | 학원 소개 몇 줄 |
| logo | 비워 두면 이름 첫 글자. 그림은 관리자 화면에서 올린다 |
| color | 주 색 `#RRGGBB` (간판·로고 색). 로고 파일이 있으면 관리자 화면에서 로고를 올릴 때 저절로 뽑힌다 |
| look | `{ "font": "gothic", "corner": "soft", "layout": "split" }`. 옆 학원과 겹치지 않게 고른다 |
| features | 켤 기능만 `true`. 원장님께 무엇을 쓸지 먼저 묻는다 |
| address, parking, phone | 주소, 주차, 대표 번호 |
| regNo | 학원·교습소 등록번호 문구 |
| consultSlots | 상담 가능 시간 목록 |
| classes | 반마다 name, grade, days, time, seats, fee(원, 숫자) |
| feeNote | 원비 아래 한 줄(교재비 등) |
| teachers | name, role, line |
| reviews | who(가린 이름), text. 없으면 `[]` |
| notice | text, until(`YYYY-MM-DD`, 지나면 저절로 내려감). 없으면 `{}` |
| levelQuestions | 레벨테스트를 켰을 때 문항: q(문제), o1~o4(보기), a(정답 번호 1~4). 원장님이 쓰는 진단 문항을 그대로 옮긴다 |
| levelResults | 점수 구간: min(이 점수부터), name, cls(추천 반), text |
| admins | 1단계에서 받은 관리자 구글 이메일 |

장부에 없는 값은 지어내지 않는다. 비워 두고 원장님이 처음 설정 화면에서 채우게 한다.

그다음 반영한다.
```
node tools/apply.mjs
node tools/shots.mjs        # og.png, apple-touch-icon.png (playwright가 없으면 건너뜀)
```
`apply.mjs`는 공개용 `public/academy.json`(관리자 이메일 뺌), `firestore.rules`(관리자 이메일 넣음), `public/favicon.svg`, 홈페이지 제목·OG 글을 만든다.

## 5. 배포

```
firebase deploy --only hosting,firestore:rules --project <아이디>
```
판은 최근 20개만 남긴다. Firebase 콘솔 → Hosting → 출시 기록 옆 메뉴 → '보관할 출시 수'를 20으로 한다.

## 6. 원장님 첫 로그인 (원장님이 하는 일)

원장님께 `https://<아이디>.web.app/admin`을 열어 구글로 들어가게 한다.
- 처음 설정 5단계(학원 / 위치·연락 / 반·원비 / 선생님·상담 / 확인)가 4단계에서 채운 값으로 이미 채워져 있다.
- 원장님은 맞는지 보고 '다음', 마지막에 '홈페이지에 올리기'만 누른다. 이때 값이 Firestore `site/config`에 저장되고, 그 뒤로 홈페이지는 이 값을 읽는다.
- 나중에 고칠 것은 관리자 화면 '홈페이지 정보' 탭에서 고친다. 같은 탭에서 JSON 내려받기·JSON 파일로 채우기도 된다.
- 학생 명단: '학생' 탭 → 양식 내려받기 → 구글 시트에 적고 줄을 복사해 붙여 넣기.

## 7. 실제 주소 확인 (내가 한다)

- `curl -s -o /dev/null -w "%{http_code}" https://<아이디>.web.app/` → 200
- `curl -s -o /dev/null -w "%{http_code}" https://<아이디>.web.app/.git/config` → 404
- 홈페이지에서 가짜 이름으로 상담 신청을 한 건 보내고, 관리자 화면 '상담'에 뜨는지 본 다음 그 신청을 지운다.
- 휴대폰 크기(390px)와 PC(1280px)로 홈페이지를 캡처해 원장님께 보여 준다.

## 문자 보내기 (솔라피 스킬)

https://github.com/from5302-lab/yomates-solapi-skill 이 세팅돼 있어야 한다.
1. 원장님이 관리자 화면 '리포트' 또는 '원비'에서 'CSV 내려받기'를 누른다. 한 줄이 `번호,내용`이고, 줄바꿈은 `\n`으로 들어 있다.
2. 미리보기: `node ~/yomates-solapi/solapi.mjs bulk --file <내려받은 파일>`
3. 원장님께 건수와 문구를 보여 주고 확인받은 뒤 `--yes`를 붙여 보낸다.
4. 보낸 뒤 그 CSV 파일을 바로 지운다(학부모 번호가 들어 있다).
5. 리포트는 내려받을 때 뜨는 확인 창에서 '보냄'으로 표시된다.

## 보안 규칙 요약 (firestore.rules)

- 누구나: 홈페이지 정보 읽기, 상담 신청 쓰기(칸·길이·동의 확인, 한 번 쓰면 못 고침)
- 켠 기능만: 보강 신청 쓰기(`makeup`), 20자 이상 무작위 주소로 리포트 한 건 읽기(`report`), 레벨테스트 결과를 붙인 상담 신청(`leveltest`)
- 그 밖의 읽기·쓰기(상담 목록, 일정, 학생, 원비, 리포트 목록, 보강 목록)는 `admins` 이메일 계정만. 끈 기능의 자료는 관리자도 못 읽고 못 쓴다
- 기능을 켜고 끄는 것은 Firestore `site/config`의 `features`를 보고 정해진다. 처음 설정을 저장하기 전에는 모든 선택 기능이 꺼진 것으로 본다

## 막힐 때

- **관리자 화면에 '관리자 계정이 아니에요':** 그 이메일이 `academy.json` admins에 없다. 넣고 `node tools/apply.mjs` 뒤 `firebase deploy --only firestore:rules --project <아이디>`.
- **로그인 창이 바로 닫힘:** Google 로그인이 꺼져 있거나 승인된 도메인에 주소가 없다(2단계 5).
- **홈페이지가 '준비하고 있어요':** `public/academy.json`이 없다. `node tools/apply.mjs` 뒤 다시 배포.
- **상담 신청이 '보내지 못했어요':** `firestore:rules`를 배포하지 않았다.
- 상담 신청은 1년 보관이다. 1년이 지난 신청이 있으면 '상담' 탭 위에 지우기 줄이 뜬다.

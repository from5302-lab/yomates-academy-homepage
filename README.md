# 학원 홈페이지 템플릿 (요메이트용)

원장님은 학원 정보만 넣으면 되는 학원 홈페이지와 관리자 화면이에요.
빌드가 없는 정적 사이트라 Firebase Hosting(무료)과 Firestore, 구글 로그인만 있으면 돌아요.

- 데모(가짜 학원 '한빛영어학원'): https://yomates-academy-demo.web.app · 관리자 화면 https://yomates-academy-demo.web.app/admin
- 기본 기능만 켠 데모: https://yomates-academy-demo.web.app/?demo=basic · https://yomates-academy-demo.web.app/admin?demo=basic
- 틀은 하나이고 기능을 켜고 꺼요: 월말 리포트, 원비 납부 표, 원비 공개, 선생님 소개, 후기, 공지 띠, 레벨테스트, 보강 신청 (`academy.json`의 `features`)
- 학원마다 모양이 달라요: 로고에서 뽑은 색, 글꼴, 모서리, 첫 화면 배치 (`look`). 사진은 넣지 않아요
- 세팅 순서: [SKILL.md](SKILL.md) (요메이트 스킬 `학원-홈페이지-템플릿`)

## 들어 있는 것

| 주소 | 내용 |
|---|---|
| `/` | 학원 소개, 반·시간표, 오시는 길, 입회·상담 신청 + 켠 기능(원비, 레벨테스트, 선생님, 후기, 보강 신청, 공지 띠) |
| `/admin` | 처음 설정, 한눈에(일정·상담·리포트·원비), 상담, 일정, 학생, 리포트, 원비, 홈페이지 정보 |
| `/r/?t=…` | 학부모가 여는 월말 리포트 |

## 파일

- `academy.json`: 학원마다 다른 값 전부 (지금은 가짜 학원 예시)
- `tools/apply.mjs`: academy.json을 사이트와 보안 규칙에 반영
- `tools/shots.mjs`: 공유 그림(og.png)과 홈 화면 아이콘
- `firestore.rules.template`: 보안 규칙 원본 (관리자 이메일은 apply.mjs가 넣음)
- `public/firebase-config.json`: `{}`이면 데모로 돌고, Firebase 웹 앱 설정값을 넣으면 실제로 돌아요

문자는 사이트에서 보내지 않아요. 관리자 화면에서 '보낼 목록 CSV(번호,내용)'를 내려받아 [솔라피 스킬](https://github.com/from5302-lab/yomates-solapi-skill)의 `bulk --file`로 보내요.

MIT License

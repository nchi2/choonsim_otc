# AI Agent Workflow – Choonsim OTC / Main 사이트

> 이 파일은 **AI 에이전트(예: Cursor, ChatGPT)** 가 따라갈 개발 체크리스트입니다.  
> 사람과 AI 모두 이 파일을 항상 최신 상태로 유지합니다.
> 이 프로젝트의 기본 스택은 **Next.js(App Router) + TypeScript + styled-components + Prisma + PlanetScale(MySQL) + Vercel** 입니다.

---

## 🔺 기본 규칙 (AI를 위한 규칙)

- [ ] RULE-1: 작업을 시작하기 전에, 이 문서를 맨 위부터 끝까지 훑어보고 **가장 앞쪽에 있는 [ ] 항목** 중에서 사람이 요청한 범위와 일치하는 작업을 선택한다.예 : 1.1.1까지 진행됨, 1.1.2 설정 시작 . . . 과 같이 여태까지 어떤게 완료됐고 이제 뭘 하려고하는건지 이해했음을 설명하고 진행한다.
- [ ] RULE-2: 한 번에 **한 개의 체크박스**만 처리한다. 한 항목을 완료하고 사용자에게 다음 항목 진행 여부를 확인한 후 진행한다.
- [ ] RULE-3: 어떤 항목을 완료했으면, 해당 줄의 `[ ]`를 `[x]`로 변경하고, 필요하다면 바로 아래 줄에 `- 결과:`로 간단히 요약을 남기고, `- 확인방법:`을 추가하여 사용자가 어떻게 확인할 수 있는지 명시한다. (예: 파일 존재 확인, 브라우저에서 확인, 명령어 실행 등)
- [ ] RULE-4: 새로운 할 일이 생기면, 기존 구조를 유지하면서 하위에 `- [ ] BACKLOG-...` 형태로 추가한다.
- [ ] RULE-5: 내가 "우선순위 변경"을 요청하면, 섹션 순서는 유지하되 **설명에 (우선순위 높음)** 같은 메모를 붙인다.
- [ ] RULE-7: 프로젝트에 필요없는 파일과 폴더는 작업 중 발견되면 삭제 요청을 한다. (더이상 사용할 필요가 없을 때, 사용되지않고 있는 코드)
- [ ] RULE-8: 확인방법을 작성할 때는 코드/파일 확인뿐만 아니라, **로컬 화면에서 어떻게 보여야 하는지 시각적 확인 방법**도 함께 명시한다. (예: "브라우저에서 http://localhost:3000 접속 시 상단 탭 제목이 'Choonsim OTC'로 표시되면 정상")
- [ ] RULE-9: 모든 UI 컴포넌트는 **모바일 반응형 웹**으로 제작한다. 모바일 우선(mobile-first) 접근 방식을 사용하고, 데스크톱에서는 확장된 레이아웃을 보여준다. styled-components의 미디어 쿼리를 활용하여 반응형을 구현한다.
- [ ] RULE-10: **컴포넌트 분리 구조 규칙** - 각 페이지의 코드가 길어지면 반드시 컴포넌트로 분리한다. 각 페이지마다 폴더를 만들어서 관리한다.
  - [ ] 공통 레이아웃: `components/layouts/PageLayout.tsx` 생성 (Header, Footer, PageContainer, MainContent 포함)
  - [ ] 페이지별 구조: 각 페이지는 `app/[경로]/page/` 폴더 구조로 관리
    - `app/[경로]/page/page.tsx` - 메인 로직만 포함
    - `app/[경로]/page/components/` - 페이지 전용 컴포넌트들
    - `app/[경로]/page/styles.ts` - 페이지 전용 styled-components
    - `app/[경로]/page/hooks/` - 페이지 전용 커스텀 훅 (선택)
  - [ ] 공통 폼 컴포넌트: `components/forms/` 폴더에 재사용 가능한 폼 컴포넌트 분리 (FormInput, FormSelect, FormRadio 등)
  - [ ] 스타일 분리: styled-components는 `styles.ts` 파일로 분리하여 `import * as S from './styles'` 형태로 사용
  - [ ] 로직 분리: 복잡한 로직은 커스텀 훅(`hooks/`)으로 분리
  - [ ] 예시 구조:

---

## ✅ 완료된 섹션

## 1. 프로젝트 세팅 + Vercel 배포

### 1.1 Next.js 프로젝트 생성

- [x] 1.1.1 `npx create-next-app@latest` 로 프로젝트 생성 (옵션: TypeScript = Yes, App Router = Yes).
- 결과: Next.js 16.0.3, TypeScript, App Router 설정 완료
- 확인방법: `package.json`에서 `"next": "16.0.3"` 확인, `app/` 폴더 구조 확인

- [x] 1.1.2 ESLint, Prettier 설정 (기본값 유지 또는 필요한 규칙 최소 설정).
- 결과: eslint.config.mjs 설정 완료
- 확인방법: `eslint.config.mjs` 파일 존재 확인, `npm run lint` 실행 시 에러 없음

- [x] 1.1.3 `.gitignore` / 기본 Git 초기화 (`git init`, 첫 커밋).
- 결과: .gitignore 파일 생성 완료
- 확인방법: `.gitignore` 파일 존재 확인, `git status` 실행 시 node_modules 등이 무시되는지 확인

### 1.2 styled-components 세팅

- [x] 1.2.1 styled-components 설치 및 Next.js SSR 설정.
- 결과: styled-components 설치, registry.tsx 생성, next.config.ts에 compiler 설정 추가
- 확인방법:

  - 코드 확인: `package.json`의 `dependencies`에 `"styled-components": "^6.1.13"` 확인
  - 파일 확인: `app/registry.tsx` 파일 존재 확인, `next.config.ts`에 `compiler: { styledComponents: true }` 확인

- [x] 1.2.2 `globals.css`에서 Tailwind 관련 코드 제거, 기본 스타일만 유지.
- 결과: @import "tailwindcss" 제거, 기본 CSS 변수와 body 스타일만 유지
- 확인방법: `app/globals.css` 파일에서 `@import "tailwindcss"` 라인이 없고, 기본 CSS만 있는지 확인

- [x] 1.2.3 간단한 테스트용 styled-components로 동작 확인.
- 결과: app/page.tsx에 styled-components로 테스트 박스 생성하여 동작 확인 완료
- 확인방법:
  - 코드 확인: `app/page.tsx`에서 `styled.div` 사용 확인
  - 화면 확인: `npm run dev` 실행 후 `http://localhost:3000` 접속, 파란색 박스가 보이고 콘솔에 styled-components 관련 에러가 없으면 정상 작동

### 1.3 레이아웃 & 기본 라우팅

- [x] 1.3.1 `app/layout.tsx`에서 공통 `<html>`, `<body>`, 기본 폰트/배경 설정.
- [x] 1.3.2 `components/Header.tsx` 생성 (로고 + 기본 네비게이션 자리만).
- [x] 1.3.3 `components/Footer.tsx` 생성 (간단한 카피라이트 텍스트).
- [x] 1.3.4 `app/page.tsx` → 메인 페이지 뼈대만 생성 ("Choonsim 메인" 텍스트 정도).
- [x] 1.3.5 `app/otc/page.tsx` → OTC 메인 페이지 뼈대만 생성.
- [x] 1.3.6 `app/otc/sell/apply/page.tsx` → 판매 신청 페이지 뼈대만 생성.

### 1.4 Vercel 배포

- [x] 1.4.1 GitHub 또는 Git 원격 repo 생성 및 푸시.
- 결과: GitHub 저장소 생성 및 로컬 코드 푸시 완료
- 확인방법:
  - 코드 확인: `git remote -v` 실행 시 origin이 GitHub 저장소를 가리키는지 확인
  - 화면 확인: GitHub 저장소 페이지에서 파일들이 올라가 있는지 확인, 최신 커밋이 보이면 정상
- [x] 1.4.2 Vercel에서 새로운 프로젝트 생성 후 Git repo 연결.
- [x] 1.4.3 기본 환경변수(현재는 없으면 비워두고) 설정 확인.
  - 결과: 현재 프로젝트에는 환경변수가 필요하지 않음 (DB 연결 전, Prisma 설치 전). `.gitignore`에 `.env*` 포함되어 환경변수 파일이 버전 관리에서 제외됨. Vercel 대시보드에서 환경변수 섹션 확인 완료, 현재 설정된 환경변수 없음. 추후 2.3 섹션에서 DB 연결 시 `DATABASE_URL` 환경변수 추가 예정
  - 확인방법:
    - 코드 확인: 프로젝트 전체에서 `process.env` 사용 확인, 현재 사용하는 환경변수 없음
    - 파일 확인: `.gitignore`에 `.env*` 포함 확인
    - Vercel 확인: Vercel 프로젝트 대시보드 → Settings → Environment Variables에서 현재 설정된 환경변수 없음 확인
    - 화면 확인: Vercel 배포가 환경변수 없이도 정상 작동하는지 확인
- [x] 1.4.4 배포 완료 후, `https://...vercel.app/` 로
  - [x] `/`
  - [x] `/otc`
  - [x] `/otc/sell/apply`
        각 페이지가 접속 가능한지 확인.
- [x] 1.4.5 이 섹션이 완료되면, 이 섹션 상단에 `✅ 1. 프로젝트 세팅 완료` 메모 추가.

---

## 2. 신청서 폼 제작

### 2.0 OTC 메인 페이지 탭 기능

- [x] 2.0.1 OTC 메인 페이지(`app/otc/page.tsx`)에 탭 기능 추가
  - [x] 호가형 탭 (기본 탭) - 호가 섹션 (플레이스홀더) - 구매하기/판매하기 버튼 섹션
  - [x] 카드형 탭 - 판매 정보 카드 그리드 레이아웃 (가격순 정렬) - 카드 클릭 시 구매 신청 페이지로 이동 (`/otc/buy/apply?mode=card&price=...&amount=...`) - [x] 카드 정보 표시 업데이트: 총 금액(단가 × 수량), 상태(대기중/진행중) 추가 - [x] 더미 카드 데이터 생성 (테스트용) - [x] 더미 카드 데이터에 status 필드 추가 (대기중/진행중, 완료는 추후 분류)
  - 결과: OTC 메인 페이지에 호가형/카드형 탭 기능 추가. 호가형 탭은 기본 탭으로 호가 섹션(플레이스홀더)과 구매하기/판매하기 버튼 표시. 카드형 탭은 판매 정보 카드 그리드로 표시되며, 카드 클릭 시 구매 신청 페이지로 이동하며 가격과 수량이 쿼리 파라미터로 전달됨. 모바일 반응형 그리드 레이아웃 적용 (1열 → 2열 → 3열)
  - 확인방법:
    - 코드 확인: `app/otc/page.tsx`에서 `TabContainer`, `TabButton`, `CardGrid`, `Card` 컴포넌트 확인, `useState`로 탭 상태 관리 확인
    - 화면 확인:
      - `npm run dev` 실행 후 `http://localhost:3000/otc` 접속
      - 기본적으로 "호가형" 탭이 활성화되어 있고, 호가 섹션과 구매하기/판매하기 버튼이 표시되는지 확인
      - "카드형" 탭 클릭 시 판매 정보 카드들이 가격순으로 정렬되어 그리드 형태로 표시되는지 확인
      - 카드 클릭 시 `/otc/buy/apply?mode=card&price=...&amount=...` 형태의 URL로 이동하는지 확인
      - 모바일 화면에서 카드가 1열로, 태블릿에서 2열로, 데스크톱에서 3열로 표시되는지 확인

### 2.1 신청서 폼 UI 생성 (DB 연결 X)

- [x] 2.1.1 `app/otc/sell/apply/page.tsx`에 실제 폼 컴포넌트 추가.
- 결과: 폼 컴포넌트 추가 완료, styled-components로 Form, FormGroup, Label, Input, Select, RadioGroup 등 모든 스타일 컴포넌트 생성, useState로 폼 상태 관리, handleSubmit에서 console.log 및 alert로 데이터 확인
- 확인방법:

  - 코드 확인: `app/otc/sell/apply/page.tsx`에서 Form 컴포넌트와 모든 스타일 컴포넌트 확인
  - 화면 확인: `npm run dev` 실행 후 `http://localhost:3000/otc/sell/apply` 접속, 모든 입력 필드가 보이고, 폼을 작성 후 "신청하기" 버튼 클릭 시 alert 창에 입력한 데이터가 JSON 형태로 표시되면 정상

- [x] 2.1.2 입력 필드 추가:
  - [x] 성함 (text) - placeholder: "예: 홍길동"
  - [x] 연락처 (tel) - 자동 포맷팅 (000-0000-0000 형식), 숫자만 입력 가능, placeholder: "예: 010-1234-5678"
  - [x] 판매 희망 수량 (number) - 숫자만 입력 가능, 소수점 두 자리까지만 허용, placeholder: "예: 100.50 (숫자만 입력, 소수점 두 자리까지)"
  - [x] 희망 가격 (number) - LBANK 현재가 기준 위아래 10개씩 선택 가능, 직접 입력 가능, 만원 단위 검증, placeholder: "예: 100000"
  - [x] 소량 판매 허용/비허용 (radio: 허용/비허용)
  - [x] 방문할 회관 선택 (select – 서울/광주/부산/대전 등 더미 옵션)
- 결과:
  - 모든 입력 필드 추가 완료
  - 연락처: `formatPhoneNumber` 함수로 숫자만 추출 후 000-0000-0000 형식으로 자동 포맷팅, 11자리 제한, `handlePhoneChange` 핸들러로 연동
  - 수량: `formatAmount` 함수로 숫자와 소수점만 허용, 소수점 두 자리까지만 제한, `handleAmountChange` 핸들러로 연동
  - 가격: LBANK API 연동 (`/api/market-prices`), 현재가 기준 위아래 10개씩(총 21개) 만원 단위 옵션 생성, Select와 직접 입력 Input 모두 제공, 만원 단위 검증 및 경고 메시지 표시
  - useState로 상태 관리, handleSubmit에서 console.log 및 alert로 데이터 확인
- 확인방법:

  - 코드 확인:
    - `app/otc/sell/apply/page.tsx`에서 모든 입력 필드 확인
    - `formatPhoneNumber`, `formatAmount` 함수 확인
    - `useEffect`로 LBANK 가격 불러오기 확인
    - `generatePriceOptions` 함수로 가격 옵션 생성 확인
    - `handleCustomPriceChange`에서 만원 단위 검증 확인
  - 화면 확인:
    - `npm run dev` 실행 후 `http://localhost:3000/otc/sell/apply` 접속
    - 연락처 입력 시 숫자만 입력되고 자동으로 하이픈이 추가되어 000-0000-0000 형식으로 표시되는지 확인
    - 수량 입력 시 소수점 두 자리까지만 입력되는지 확인
    - LBANK 현재가가 표시되고, 가격 Select에서 현재가 기준 위아래 10개씩 옵션이 보이는지 확인 (낮은 가격이 아래에 표시)
    - 직접 입력 필드에 만원 단위가 아닌 값(예: 12345)을 입력하면 "가격은 10,000원 단위로 입력해주세요." 경고 메시지가 표시되는지 확인
    - 만원 단위 값(예: 100000)을 입력하면 경고 메시지가 사라지는지 확인

- [x] 2.1.3 필수값 유효성 체크 (프론트 단):
  - [x] 빈 값 제출 막기
  - [x] 수량/가격이 0 이상인지 체크
- [x] 2.1.4 제출 버튼 클릭 시, **현재는** `console.log(formData)` 또는 `alert(JSON.stringify(formData))` 로 입력값만 확인.
- 결과: `handleSubmit` 함수에서 `e.preventDefault()` 후 `console.log("Form Data:", formData)`와 `alert(JSON.stringify(formData, null, 2))` 호출하여 입력 데이터 확인
- 확인방법:
  - 코드 확인: `app/otc/sell/apply/page.tsx`의 `handleSubmit` 함수에서 `console.log`와 `alert` 호출 확인
  - 화면 확인: `npm run dev` 실행 후 `http://localhost:3000/otc/sell/apply` 접속, 폼 작성 후 "신청하기" 버튼 클릭 시 콘솔과 alert 창에 입력한 데이터가 JSON 형태로 표시되면 정상
- [x] 2.1.5 UI 스타일 최소 정리 (styled-components 사용, 모바일에서도 보기 좋게).
- 결과:
  - 모든 폼 컴포넌트가 styled-components로 구현되어 있음 (Form, FormGroup, Label, Input, Select, RadioGroup, SubmitButton 등)
  - 모바일 우선 반응형 스타일 적용 (미디어 쿼리 사용)
  - 각 입력 필드와 버튼이 모바일에서도 적절한 크기와 간격으로 표시됨
  - 에러 메시지 스타일링 완료 (ErrorMessage 컴포넌트)
- 확인방법:

  - 코드 확인: `app/otc/sell/apply/page.tsx`에서 모든 styled-components 사용 확인, 미디어 쿼리(@media) 사용 확인
  - 화면 확인:
    - `npm run dev` 실행 후 `http://localhost:3000/otc/sell/apply` 접속
    - 브라우저 개발자 도구에서 모바일 뷰(375px)로 확인 시 모든 필드가 세로로 잘 정렬되고 가독성이 좋은지 확인
    - 데스크톱 뷰(768px 이상)로 확인 시 필드 간격과 폰트 크기가 적절하게 확장되는지 확인
    - 두 폼의 스타일이 통일되어 있는지 확인 (버튼 색상, 입력 필드 스타일 등)

- [x] 2.1.6.6 구매 신청 페이지 리다이렉트 로직

  - [x] 제출 성공 시 확인 페이지로 리다이렉트
    - 결과: 구매 신청 API(`/api/buyer-request`) 생성 완료. 구매 신청 폼에서 API 호출 후 성공 페이지로 리다이렉트 구현. 구매 신청 성공 페이지에 `assetType` 포함하여 판매 신청 성공 페이지와 동일한 구조로 구현 완료
  - 확인방법:
    - 코드 확인: `app/api/buyer-request/route.ts` 파일 존재 확인
    - 코드 확인: `app/otc/buy/apply/page.tsx`에서 API 호출 및 리다이렉트 로직 확인
    - 화면 확인: 구매 신청 제출 후 성공 페이지 표시 확인

- [x] 2.2.10 메인 페이지 OTC 섹션 추가 및 컴포넌트 분리
  - [x] 메인 페이지(`app/page/page.tsx`)에 OTC 섹션 추가
  - [x] `/api/market-prices` API를 호출하여 USDT/KRW, BMB/USDT, BMB/KRW(LBANK) 가격 표시
  - [x] 가격 정보 카드 3개와 "OTC 거래하기" 버튼 포함
  - [x] 로딩 상태 및 에러 처리 구현
  - [x] 컴포넌트 분리: `app/page/components/OTCSection.tsx`로 분리
  - [x] 스타일 분리: `app/page/styles.ts`에 모든 styled-components export 추가 (OTCSection, OTCTitle, PriceInfoContainer, PriceCard, PriceLabel, PriceValue, PriceSubValue, LoadingText, ErrorText, OTCButton)
  - [x] Vercel 빌드 에러 수정: `OTCSection` export 누락 문제 해결
  - 결과: 메인 페이지에 OTC 섹션 추가 완료. `/api/market-prices` API를 호출하여 실시간 가격 정보 표시. 가격 정보 카드 3개(USDT/KRW, BMB/USDT, BMB/KRW)와 "OTC 거래하기" 버튼 포함. 로딩 및 에러 상태 처리. 이후 컴포넌트 분리 작업으로 `app/page/components/OTCSection.tsx`로 분리하고, `app/page/styles.ts`에 모든 스타일 컴포넌트 export 추가. Vercel 배포 시 발생한 빌드 에러(Export OTCSection doesn't exist) 해결
  - 확인방법:
    - 코드 확인:
      - `app/page/page.tsx`에서 `OTCSection` 컴포넌트 import 확인
      - `app/page/components/OTCSection.tsx` 파일 존재 및 가격 데이터 fetching 로직 확인
      - `app/page/styles.ts`에서 `OTCSection`, `OTCTitle`, `PriceCard` 등 모든 필요한 컴포넌트가 export되어 있는지 확인
      - `app/page/components/OTCSection.tsx`에서 `import * as S from "../styles"`로 스타일 import 확인
    - 화면 확인:
      - `npm run dev` 실행 후 `http://localhost:3000` 접속 시 OTC 섹션이 표시되고 가격 정보가 로드되는지 확인
      - "OTC 거래하기" 버튼 클릭 시 `/otc`로 이동하는지 확인
      - 로딩 중일 때 "가격 정보를 불러오는 중..." 메시지 표시 확인
      - 에러 발생 시 에러 메시지 표시 확인
    - 배포 확인:
      - `npm run build` 실행 시 빌드 에러가 없는지 확인
      - Vercel 배포 후 빌드가 성공적으로 완료되는지 확인
      - 배포된 사이트에서 메인 페이지가 정상적으로 표시되는지 확인

### 2.3 PlanetScale + Prisma 설정 및 신청서 폼 DB 연결 테스트

#### 2.3-A PlanetScale(MySQL) 세팅

- [x] 2.3.A.1 PlanetScale 대시보드에서 새 데이터베이스 생성 (예: `choonsim-otc`).

  - 결과: PlanetScale 대시보드에서 `choonsim-otc` 데이터베이스 생성 완료. 데이터베이스가 생성되고 `main` 브랜치가 자동으로 생성됨
  - 확인방법:
    - 화면 확인: PlanetScale 대시보드에서 데이터베이스 목록에 `choonsim-otc`가 표시되는지 확인
    - 브랜치 확인: 데이터베이스 상세 페이지에서 `main` 브랜치가 존재하는지 확인d

- [x] 2.3.A.2 `main` 브랜치 생성/사용 여부 확인.

  - 결과: PlanetScale에서 데이터베이스 생성 시 `main` 브랜치가 자동으로 생성됨. 현재 `main` 브랜치를 사용 중
  - 확인방법:
    - 화면 확인: PlanetScale 대시보드 → 데이터베이스 → Branches 섹션에서 `main` 브랜치가 표시되는지 확인

- [x] 2.3.A.3 Prisma 용 **connection string** 생성 (일반적으로 `pscale connect` 또는 패널에서 `DATABASE_URL` 형태 복사).

  - 결과: PlanetScale 대시보드에서 Prisma용 connection string 생성 완료. Connection string 형식: `mysql://...` (사용자명, 비밀번호, 호스트, 포트, 데이터베이스명 포함)
  - 확인방법:
    - 화면 확인: PlanetScale 대시보드 → Connect → Prisma에서 connection string이 표시되는지 확인
    - 형식 확인: Connection string이 `mysql://`로 시작하는지 확인

- [x] 2.3.A.4 프로젝트 루트 `.env` 파일에 `DATABASE_URL="mysql://..."` 설정.

  - 결과: 프로젝트 루트에 `.env` 파일 생성 및 `DATABASE_URL` 환경변수 설정 완료. `.gitignore`에 `.env*` 포함되어 있어 버전 관리에서 제외됨
  - 확인방법:
    - 코드 확인: 프로젝트 루트에 `.env` 파일 존재 확인
    - 내용 확인: `.env` 파일에 `DATABASE_URL="mysql://..."` 형식의 값이 설정되어 있는지 확인 (실제 connection string 값)
    - 보안 확인: `.gitignore`에 `.env*` 포함 확인, Git에 커밋되지 않았는지 확인 (`git status`에서 `.env`가 나타나지 않아야 함)

- [x] 2.3.A.5 Vercel 환경변수에도 동일한 `DATABASE_URL` 등록 준비 (배포 시 필요).
  - 결과: Vercel 대시보드에서 환경변수 등록 방법 확인 완료. 배포 시 Vercel 프로젝트 설정 → Environment Variables에서 `DATABASE_URL` 추가 예정
  - 확인방법:
    - 화면 확인: Vercel 프로젝트 대시보드 → Settings → Environment Variables 경로 확인
    - 참고: 현재는 로컬 개발용 `.env`만 설정, 배포 시 Vercel에도 동일한 값 추가 필요

#### 2.3-B Prisma 설치 및 스키마 정의

- [x] 2.3.B.1 `npm install prisma @prisma/client` 설치.

  - 결과: Prisma 및 Prisma Client 설치 완료. `package.json`의 `dependencies`에 `prisma`와 `@prisma/client` 의존성 추가됨
  - 확인방법:
    - 코드 확인: `package.json`의 `dependencies`에 `"@prisma/client": "^6.19.0"`와 `"prisma": "^6.19.0"` 확인
    - 명령어 확인: `npx prisma --version` 실행 시 버전 정보가 표시되는지 확인

- [x] 2.3.B.2 `npx prisma init` 실행하여 `prisma/schema.prisma` 및 `.env` 생성 (이미 있으면 스킵).

  - 결과: `prisma/schema.prisma`와 `.env`가 이미 존재함. `npx prisma init` 수행 여부와 동일한 상태이므로 완료 처리
  - 확인방법:
    - 파일 확인: 프로젝트 루트에 `prisma/schema.prisma` 파일 존재
    - 명령어 확인: `npx prisma --version` 실행 시 CLI가 동작

- [x] 2.3.B.3 `prisma/schema.prisma` 의 datasource를 PlanetScale MySQL 에 맞게 설정:

  - 결과: `prisma/schema.prisma`의 `datasource db`에서 `provider`를 `"postgresql"`에서 `"mysql"`로 변경 완료. PlanetScale MySQL에 맞게 설정됨
  - 확인방법:

    - 코드 확인: `prisma/schema.prisma` 파일에서 `provider = "mysql"` 확인
    - 명령어 확인: `npx prisma db pull` 실행 시 에러 없이 실행되는지 확인 (또는 연결 성공 메시지 확인)

  - [x] 2.3.B.4 `SellerRequest` 모델 정의:
  - 결과: `prisma/schema.prisma`에 `SellerRequest` 모델 추가 완료. 필드: `id`, `name`, `phone`, `amount`, `price`, `allowPartial`, `branch`, `status`, `createdAt`, `updatedAt`. 참고: 매칭 시스템은 추후 반영 예정이며, 현재는 데이터 입력/조회 테스트용 기본 스키마. 추후 스키마 변경 예정
  - 확인방법:

    - 코드 확인: `prisma/schema.prisma` 파일에 `model SellerRequest { ... }` 정의 확인
    - 필드 확인: 모든 필드(`id`, `name`, `phone`, `amount`, `price`, `allowPartial`, `branch`, `status`, `createdAt`, `updatedAt`)가 정의되어 있는지 확인

  - [x] 2.3.B.5 PlanetScale 사용 방식에 맞게 `npx prisma db push` 로 스키마를 반영.
  - 결과: `npx prisma db push` 실행 완료. "The database is already in sync with the Prisma schema." 메시지 확인. PlanetScale 데이터베이스에 `SellerRequest` 테이블이 생성/동기화됨
  - 확인방법:
    - 명령어 확인: `npx prisma db push` 실행 시 "The database is already in sync with the Prisma schema." 또는 성공 메시지 확인
    - 데이터베이스 확인: PlanetScale 대시보드에서 `SellerRequest` 테이블이 생성되었는지 확인

- [x] 2.3.B.6 `lib/prisma.ts` 파일 생성 (PrismaClient 싱글톤 설정).
  - 결과: `lib/prisma.ts` 파일 생성 완료. PrismaClient 싱글톤 패턴으로 설정하여 개발 환경에서 Hot Reload 시에도 인스턴스 재생성을 방지
  - 확인방법:
    - 파일 확인: 프로젝트 루트에 `lib/prisma.ts` 파일 존재 확인
    - 코드 확인: `PrismaClient` import 및 싱글톤 패턴 구현 확인 (`globalForPrisma` 사용)

#### 2.3-C API Route + 폼 연동

**참고**: 현재 단계는 데이터 입력/조회 테스트가 목적입니다. 매칭 시스템은 추후 반영 예정이며, 스키마는 추후 변경될 수 있습니다.

- [x] 2.3.C.1 `app/api/seller-request/route.ts` 생성.

  - [x] `POST` 요청 body 파싱.
  - [x] 필수 필드(`name`, `phone`, `amount`, `price`, `branch`) 검증, 잘못되면 400 반환.
  - [x] Prisma로 `SellerRequest`에 insert (`status = "PENDING"` 기본값).
  - [x] 성공 시 201 + `{ id }` JSON 반환.
  - 결과: `app/api/seller-request/route.ts` 생성 완료. POST 요청 처리, 필수 필드 검증, Prisma를 통한 데이터 삽입, 에러 처리 구현 완료. `amount`는 Int 필드이므로 `Math.floor()`로 정수 변환 처리
  - 확인방법:
    - 파일 확인: `app/api/seller-request/route.ts` 파일 존재 확인
    - 코드 확인: POST 함수, 필드 검증 로직, Prisma `create` 호출, 201 응답 확인

- [x] 2.3.C.2 신청 폼에서 `fetch('/api/seller-request')`로 POST 연동.

  - [x] 성공 시 "신청이 접수되었습니다" 메시지 표시.
  - [x] 실패 시 에러 메시지 표시.
  - 결과: 판매 신청 폼(`app/otc/sell/apply/page.tsx`)에서 `/api/seller-request`로 POST 요청 연동 완료. 성공 시 "신청이 접수되었습니다" alert 표시 및 폼 초기화, 실패 시 에러 메시지 표시. HTML 응답(에러 페이지) 처리 로직 포함. Prisma Client 생성 문제 해결(`provider = "prisma-client-js"`로 변경)
  - 확인방법:
    - 코드 확인: `app/otc/sell/apply/page.tsx`의 `handleSubmit` 함수에서 `fetch('/api/seller-request')` 호출 확인, 성공/실패 처리 로직 확인
    - 화면 확인: `npm run dev` 실행 후 `http://localhost:3000/otc/sell/apply` 접속, 폼 작성 후 "신청하기" 버튼 클릭 시 "신청이 접수되었습니다" 메시지 표시 및 폼이 초기화되는지 확인
    - 서버 확인: 브라우저 개발자 도구 Network 탭에서 POST 요청이 201 상태로 성공하는지 확인

- [x] 2.3.C.3 `npx prisma studio` 또는 PlanetScale 콘솔에서 데이터가 실제로 들어갔는지 확인.

  - 결과: Prisma Studio 또는 PlanetScale 콘솔을 통해 판매 신청 데이터가 데이터베이스에 정상적으로 저장되는 것을 확인 완료
  - 확인방법:
    - 명령어 확인: `npx prisma studio` 실행 후 `http://localhost:5555` 접속, `SellerRequest` 테이블에서 데이터 확인
    - 또는 PlanetScale 대시보드에서 `SellerRequest` 테이블의 데이터 확인

- [x] 2.3.C.4 어드민 페이지 구성 및 데이터 조회 테스트.

  - [x] 어드민 페이지 기본 구조 생성 (`/admin/otc/requests` 또는 유사 경로).
  - [x] API Route 생성 (`app/api/seller-requests/route.ts` - GET 요청으로 전체 목록 조회).
  - [x] 어드민 페이지에서 API를 호출하여 데이터가 잘 불러와지는지 확인.
  - [x] 테이블 형태로 데이터 표시 (기본 UI만, 상세 기능은 추후).
  - 결과: 어드민 페이지(`app/admin/otc/requests/page.tsx`) 생성 완료. API Route(`app/api/seller-requests/route.ts`) 생성 완료. GET 요청으로 전체 신청 목록을 최신순으로 조회. 테이블 형태로 데이터 표시 (ID, 작성일, 성함, 연락처(마스킹), 수량, 가격, 소량 허용 여부, 회관, 상태). 반응형 디자인 적용, 로딩/에러 상태 처리
  - 확인방법:
    - 코드 확인: `app/admin/otc/requests/page.tsx` 파일 존재 확인, `app/api/seller-requests/route.ts` 파일 존재 확인
    - 화면 확인: `npm run dev` 실행 후 `http://localhost:3000/admin/otc/requests` 접속, 테이블에 신청 내역이 표시되는지 확인
    - API 확인: 브라우저 개발자 도구 Network 탭에서 `/api/seller-requests` GET 요청이 200 상태로 성공하는지 확인

- [x] 2.3.C.5 Vercel에 최신 코드 배포 후, 배포 환경에서도 신청 → DB 반영 되는지 테스트.
  - [x] Vercel 환경변수 설정: `DATABASE_URL` 추가 (Production, Preview, Development 모두)
  - [x] 최신 코드 Git 푸시 및 자동 배포 확인
  - [x] 배포된 사이트에서 판매 신청 폼 제출 테스트
  - [x] 배포된 사이트에서 어드민 페이지에서 데이터 확인
  - 결과: (완료 후 작성)
  - 확인방법:
    - Vercel 확인: Vercel 대시보드 → Settings → Environment Variables에서 `DATABASE_URL` 설정 확인
    - 배포 확인: Vercel 대시보드 → Deployments에서 배포 성공 여부 확인
    - 화면 확인: 배포된 URL에서 판매 신청 폼 제출 후 어드민 페이지에서 데이터 확인
    - 데이터 확인: PlanetScale 콘솔에서 배포 환경에서 제출한 데이터가 저장되었는지 확인

---

## 3. 신청내역 조회 (운영자용 최소 버전)

- [x] 3.1 `/admin/otc/requests/page.tsx` (또는 유사 경로) 생성.

  - 결과: 어드민 페이지가 이미 2.3.C.4에서 생성 완료됨. `/admin/otc/requests/page.tsx` 파일 존재
  - 확인방법: `app/admin/otc/requests/page.tsx` 파일 존재 확인

- [x] 3.2 서버 컴포넌트에서 `prisma.sellerRequest.findMany({ orderBy: { createdAt: 'desc' } })` 호출.

  - 참고: 현재는 클라이언트 컴포넌트에서 API Route를 통해 조회. 서버 컴포넌트로 변경 또는 유지 결정 필요

- [x] 3.3 테이블 형태 UI 작성:

  - [x] 컬럼: 작성일, 성함, 연락처, 수량, 가격, 소량 허용 여부, 회관, 상태.
  - [x] 스크롤 가능하게 또는 페이지네이션 없이 우선 전체 리스트만.
  - 결과: 2.3.C.4에서 완료됨. 테이블 형태로 데이터 표시, 가로 스크롤 가능한 반응형 테이블 구현

- [x] 3.4 연락처 등 민감 정보는 최소한으로 표시할지 정책 정리 (예: `010-****-1234` 마스킹 여부).

  - 결과: 연락처 마스킹 처리 구현 완료 (예: `010-****-5678`)
  - 확인방법: 어드민 페이지에서 연락처가 마스킹되어 표시되는지 확인

- [x] 3.5 별도 로그인/보안은 아직 없이 **주소를 아는 사람만 보는 임시 페이지**로 사용.

  - 참고: 추후 3.7에서 로그인 기능 추가 예정

- [x] 3.6 운영자가 실제로 테스트용 몇 개 데이터를 보고 검증.

- [x] 3.7 운영자 페이지 로그인 기능 추가.
  - [x] 로그인 페이지 생성 (`/admin/login`).
  - [x] 환경변수 기반 인증: `ADMIN_USERNAME`, `ADMIN_PASSWORD` 환경변수 사용.
  - [x] 세션 관리: Next.js API Route를 통한 세션 쿠키 관리 또는 JWT 토큰 사용.
  - [x] 미들웨어 또는 페이지 레벨에서 인증 체크: `/admin/*` 경로 접근 시 로그인 여부 확인.
  - [x] 로그아웃 기능: 로그아웃 버튼 및 API Route 구현.
  - [x] Vercel 환경변수 설정.
    - [x] Production, Preview, Development 환경에 `ADMIN_USERNAME`, `ADMIN_PASSWORD` 추가
  - 결과: (완료 후 작성)
  - 확인방법:
    - 코드 확인: `/admin/login` 페이지, 인증 API Route, 미들웨어/보호 로직 확인
    - 환경변수 확인: `.env` 파일 및 Vercel 환경변수에 `ADMIN_USERNAME`, `ADMIN_PASSWORD` 설정 확인
    - 화면 확인: 미인증 상태에서 `/admin/otc/requests` 접속 시 로그인 페이지로 리다이렉트되는지 확인
    - 로그인 테스트: 올바른 자격증명으로 로그인 후 어드민 페이지 접근 가능한지 확인
    - 로그아웃 테스트: 로그아웃 후 다시 어드민 페이지 접근 시 로그인 페이지로 리다이렉트되는지 확인

---

## 4. OTC 메인 페이지 (`/otc`) 1차 버전

### 4.1 UI 구조 잡기

- [x] 4.1.1 `Header` 컴포넌트 재사용해서 상단 네비 구성.
- [x] 4.1.2 "모빅 가격 섹션" 영역 생성:

  - [x] **임시 구성**: `/api/market-prices` API를 호출하여 LBANK 가격 표시 (6.2.1에서 이미 구현됨)

- [x] 4.1.3 "호가창 / 카드형태 탭" UI:

  - [x] 탭 버튼 2개: "호가창 보기", "카드형 보기".
  - [x] 탭에 따라 다른 컴포넌트 렌더링되도록 state 구성.
  - [x] **임시 구성**: 카드형 매물 데이터가 아직 없으므로 더미 데이터로 카드형 탭 구성
    - 더미 카드 데이터 예시: `[{ id: 1, price: 900000, amount: 3.2, branch: "서울", allowPartial: false }, ...]` 형태의 배열 생성
    - 카드형 탭에서 더미 카드들을 표시하고, 각 카드에 "구매하기" 버튼 추가 (링크: `/otc/buy/apply?mode=card&price=900000&amount=3.2`)
    - **추후 업데이트 필요**: 4.2.3에서 실제 DB 데이터로 교체

- [x] 4.1.4 "구매하기 / 판매하기" 버튼 섹션:

  - [x] "구매하기" 버튼 → `/otc/buy/apply?mode=free` 로 이동 (일반 구매 모드).
  - [x] "판매하기" 버튼 → `/otc/sell/apply` 로 이동.
  - [x] **임시 구성**: 구매하기 버튼은 링크만 연결, 카드형 매물의 구매하기는 4.1.3의 더미 카드에서 연결

- [x] 4.1.5 `Footer` 컴포넌트 재사용.

### 4.2 DB 연동 (간단 버전 – 호가창/카드형 탭)

- [x] 4.2.1 호가창 탭: `allowPartial = true`(소량 판매 허용)인 `SellerRequest` 불러오기.

  - 결과: `app/api/otc/listed-requests/route.ts` 생성 완료. `allowPartial = true` 필터링, 가격 오름차순 정렬. 동일 가격대 물량 합산 로직 추가
  - 확인방법:
    - 코드 확인: `app/api/otc/listed-requests/route.ts` 파일에서 `allowPartial: true` 필터링 확인
    - 화면 확인: 호가형(소액) 탭에서 소량 판매 허용된 신청건만 표시되는지 확인
    - 물량 합산 확인: 동일 가격대 항목들의 물량이 합쳐져서 표시되는지 확인

- [x] 4.2.2 각 호가에 **총 물량(동일 가격대 합산) / 가격** 표시.

  - 결과: 호가형 탭에서 동일 가격대의 물량을 합산하여 표시. 업비트 호가창 스타일로 시각화 - 각 행의 배경에 물량 비율만큼 가로 막대 그래프 표시. 가격은 막대 그래프 밖 왼쪽에 고정 배치, 물량은 막대 그래프 위 오른쪽에 배치. 가격과 총 물량만 표시 (회관 정보, 소량 허용 여부 제거). 판매자는 이미 모빅을 전송한 상태이므로 회관 정보 불필요
  - 확인방법:
    - 코드 확인: `app/otc/page.tsx`에서 가격 기준 그룹화 및 물량 합산 로직 확인, 최대 물량 대비 비율로 막대 그래프 너비 계산 확인, `OrderBookBar` 컴포넌트로 배경 막대 구현 확인, `OrderBookItemBarContainer`로 막대 그래프 영역 분리 확인, 가격이 막대 그래프 밖에 배치되는지 확인
    - 화면 확인:
      - 호가형 탭에서 동일 가격의 항목이 하나로 합쳐지고 물량이 합산되어 표시되는지 확인
      - 가격이 왼쪽에 고정되어 있고 막대 그래프 배경이 가격 영역을 덮지 않는지 확인
      - 물량 영역에만 물량 비율만큼 가로 막대가 표시되는지 확인 (가장 큰 물량이 100%, 나머지는 비율로 표시)
      - 물량 텍스트가 막대 위에 명확하게 보이는지 확인
      - 회관 정보와 소량 허용 정보가 표시되지 않는지 확인

- [x] 4.2.3 카드형 탭: `allowPartial = false`(소량 판매 비허용)인 요청만 표시.

  - 결과: `app/api/otc/card-requests/route.ts` 생성 완료. `allowPartial = false` 필터링, 가격 오름차순 정렬. 실제 DB 데이터로 카드형 탭 표시
  - 확인방법:
    - 코드 확인: `app/api/otc/card-requests/route.ts` 파일에서 `allowPartial: false` 필터링 확인
    - 화면 확인: 카드형(일괄) 탭에서 소량 판매 비허용인 신청건만 표시되는지 확인
    - 카드 클릭 확인: 카드 클릭 시 구매 신청 페이지로 올바른 가격/수량이 전달되는지 확인

- [x] 4.2.4 아직은 "BUY/SELL 매칭 로직" 없이 **단순한 리스트/카드형 표시**만 구현.
  - 결과: 단순 리스트/카드형 표시만 구현. 매칭 로직은 추후 구현 예정

---

## 5. 운영자 페이지 기능 추가 – 상태 변경

- [x] 5.0 운영자 페이지 로그인 기능 (우선순위 높음).

  - [x] 5.0.1 로그인 페이지 UI 생성 (`/admin/login`).
    - 결과: `/admin/login/page.tsx` 생성 완료. 사용자명, 비밀번호 입력 필드, 로그인 버튼, 에러 메시지 표시 영역 포함
    - 확인방법: `app/admin/login/page.tsx` 파일 존재 확인, 브라우저에서 `/admin/login` 접속 시 로그인 폼 표시 확인
  - [x] 5.0.2 인증 API Route 생성 (`/api/admin/auth/login`).
    - 결과: `app/api/admin/auth/login/route.ts` 생성 완료. POST 요청으로 사용자명/비밀번호 검증, 환경변수와 비교, 세션 쿠키 발급
    - 확인방법: `app/api/admin/auth/login/route.ts` 파일 존재 확인, 브라우저 개발자 도구 Network 탭에서 로그인 요청 확인
  - [x] 5.0.3 인증 미들웨어 또는 API Route 보호.
    - 결과: `middleware.ts` 생성 완료. `/admin/*` 경로 접근 시 세션 쿠키 확인, 미인증 시 `/admin/login`으로 리다이렉트
    - 확인방법: `middleware.ts` 파일 존재 확인, 미인증 상태에서 `/admin/otc/requests` 접속 시 로그인 페이지로 리다이렉트되는지 확인
  - [x] 5.0.4 로그아웃 기능 구현.
    - 결과: `app/api/admin/auth/logout/route.ts` 생성 완료. 로그아웃 버튼 UI를 어드민 페이지에 추가. 세션 쿠키 삭제 후 로그인 페이지로 리다이렉트
    - 확인방법:
      - 코드 확인: `app/api/admin/auth/logout/route.ts` 파일 존재 확인, `app/admin/otc/requests/page.tsx`에 로그아웃 버튼 확인
      - 화면 확인: 어드민 페이지에서 로그아웃 버튼이 표시되는지 확인
      - 기능 확인: 로그아웃 버튼 클릭 시 로그인 페이지로 리다이렉트되는지 확인
  - [x] 5.0.5 Vercel 환경변수 설정.
    - [x] Production, Preview, Development 환경에 `ADMIN_USERNAME`, `ADMIN_PASSWORD` 추가
    - 결과: (완료 후 작성)
    - 확인방법:
      - Vercel 확인: Vercel 대시보드 → Settings → Environment Variables에서 `ADMIN_USERNAME`, `ADMIN_PASSWORD` 설정 확인
      - 배포 확인: 배포된 사이트에서 로그인 기능이 정상 작동하는지 확인

- [x] 5.1 운영자 페이지에서 각 신청건의 상태를 변경할 수 있는 UI 추가 (`select` 또는 버튼).
- [x] 5.2 새로운 API Route (예: `PATCH /api/seller-request/:id/status` 또는 `POST /api/seller-request/status`) 작성.
- [x] 5.3 상태 값 상수/enum 정의: `PENDING`, `LISTED`, `MATCHED`, `COMPLETED` 등
  - 결과: `lib/constants.ts`에 `REQUEST_STATUS` 객체와 `STATUS_LABELS` 매핑 정의 완료. `PENDING`, `LISTED`, `MATCHED`, `COMPLETED` 4가지 상태 정의. `RequestStatus` 타입도 함께 정의
  - 확인방법:
    - 코드 확인: `lib/constants.ts`에서 `REQUEST_STATUS`와 `STATUS_LABELS` 확인
    - 사용처 확인: API Route와 프론트엔드에서 해당 상수 사용 확인
- [x] 5.4 상태 변경 후, `/otc` 페이지의 호가/카드형 리스트가 자동으로 반영되는지 확인.
- [ ] 5.5 (선택) 간단한 비밀번호/토큰 기반 보호 (예: 환경변수 `ADMIN_KEY`를 헤더/쿼리에 넣어 체크).

---

## 6. 메인 페이지 (`/`) 1차 버전

### 6.1 메인 페이지 구조 (더미 데이터 기준)

- [x] 6.1.1 Header 포함.

  - 결과: `PageLayout` 컴포넌트를 통해 Header가 모든 페이지에 포함됨. 메인 페이지도 `PageLayout`을 사용하므로 Header가 자동으로 포함됨
  - 확인방법:
    - 코드 확인: `app/page.tsx`에서 `PageLayout` 사용 확인
    - 화면 확인: `npm run dev` 실행 후 `http://localhost:3000` 접속 시 상단에 Header가 표시되는지 확인

- [x] 6.1.3 "고액권 | SBMB 섹션":

  - [x] 텍스트 설명 + 버튼(예: "자세히 보기" / "신청하기" – 실제 페이지는 나중).

- 결과: `app/page/components/HighValueSection.tsx` 컴포넌트 생성. "고액권 | SBMB" 제목, 설명 텍스트, CTA 버튼 구성. 2025-11-25 업데이트: `자세히 보기` CTA를 `/high-value` 라우트로 이동하도록 `Link`로 교체하고, 전용 페이지 `app/high-value/page.tsx`를 추가하여 탭형 고액권/ SBMB 안내, 신청 버튼, `/hwallets/*.png` 자산 이미지를 노출함. `Section`, `SectionTitle`, `SectionDescription`, `ActionButton` 스타일 컴포넌트 사용. 모바일 반응형 스타일 적용

  - 확인방법:
    - 코드 확인: `app/page/components/HighValueSection.tsx` 파일 존재 확인, CTA가 `/high-value` 링크를 사용하도록 수정되었는지 확인
    - 코드 확인: `app/high-value/page.tsx`에 고액권/ SBMB 탭 페이지가 구현되어 있는지 확인
    - 화면 확인: `npm run dev` 실행 후 `http://localhost:3000` 및 `/high-value` 접속 시 섹션과 세부 페이지가 정상 표시되는지 확인

- [x] 6.1.4 "모빅 뉴스(모빅경제) 섹션":

  - [x] 더미 카드 2~3개 (썸네일 / 제목 / 작성일 | 작성자 구조)
  - [x] "모빅경제 바로가기" 버튼 (실제 블로그/사이트로 링크).
  - 결과: `app/page/components/NewsSection.tsx` 컴포넌트 생성. 더미 뉴스 데이터 3개를 카드 그리드로 표시. 카드 레이아웃: 썸네일(16:9 비율) → 제목 → 작성일 | 작성자. `NewsCardThumbnail`, `NewsCardTitle`, `NewsCardMeta` 스타일 컴포넌트 사용. "모빅경제 바로가기" 버튼 포함. 모바일에서는 1열, 태블릿에서는 2열, 데스크톱에서는 3열로 표시되는 반응형 그리드 레이아웃 적용
  - 확인방법:
    - 코드 확인: `app/page/components/NewsSection.tsx` 파일 존재, 더미 뉴스 데이터 3개 확인
    - 화면 확인: `npm run dev` 실행 후 `http://localhost:3000` 접속 시 "모빅 뉴스 (모빅경제)" 섹션이 표시되고 뉴스 카드 3개가 그리드 형태로 보이는지 확인. "모빅경제 바로가기" 버튼이 표시되는지 확인

- [x] 6.1.5 "모빅 블로그/유튜브 섹션":
  - [x] 더미 데이터 2~3개 (위러브 모빅 글 또는 유튜브 영상 카드 형태).
  - [x] "자세히 보기" 버튼.
  - 결과: `app/page/components/BlogSection.tsx` 컴포넌트 생성. 더미 블로그/유튜브 데이터 3개(제목, 요약, 날짜 포함)를 카드 그리드로 표시. `NewsSection`과 동일한 스타일 컴포넌트 재사용. "자세히 보기" 버튼 포함. 모바일 반응형 그리드 레이아웃 적용
  - 확인방법:
    - 코드 확인: `app/page/components/BlogSection.tsx` 파일 존재, 더미 블로그 데이터 3개 확인
    - 화면 확인: `npm run dev` 실행 후 `http://localhost:3000` 접속 시 "모빅 블로그 / 유튜브" 섹션이 표시되고 블로그 카드 3개가 그리드 형태로 보이는지 확인. "자세히 보기" 버튼이 표시되는지 확인

---

## 진행 중 / 미완료 섹션

## 2.1.6 신청 제출 후 확인 페이지 (우선순위 높음) 🔺

> 판매/구매 신청 제출 후 신청자에게 신청 정보와 이후 절차를 안내하는 확인 페이지 생성

- [x] 2.1.6.1 회관 정보 관리 시스템

  - [x] `lib/branch-info.ts` 파일 생성
    - 회관별 주소, 네이버 지도 URL 등 정보 상수 정의
    - 회관: 서초 모빅회관, 수원 모빅회관, 대전 커뮤니티센터, 호남광주 모빅회관, 대구 모빅회관, 부산 모빅회관
    - 결과: `lib/branch-info.ts` 파일 생성 완료. 6개 회관 정보(이름, 주소, 네이버 지도 URL) 정의. `BRANCH_NAMES`, `getBranchInfo()`, `getBranchAddressText()` 유틸리티 함수 포함
  - [x] 각 회관의 정확한 주소 정보 수집 및 입력
    - 결과: 6개 회관의 정확한 주소 및 네이버 지도 URL 입력 완료
  - [x] 구매/판매 신청 폼에 회관 선택 옵션 추가
    - 결과: 판매 신청 폼(`app/otc/sell/apply/page.tsx`)과 구매 신청 폼(`app/otc/buy/apply/page.tsx`)에 `BRANCH_NAMES`를 사용하여 동적으로 회관 선택 옵션 생성. 하드코딩된 옵션 제거
  - 확인방법:
    - 코드 확인: `lib/branch-info.ts` 파일 존재 및 6개 회관 정보 확인
    - 화면 확인: 판매/구매 신청 폼에서 회관 선택 드롭다운에 6개 회관이 표시되는지 확인

- [x] 2.1.6.2 판매 신청 확인 페이지 (`/otc/sell/apply/success`)

  - [x] 확인 페이지 UI 생성
    - 신청 완료 메시지
    - 신청 번호 표시
    - 신청자 정보 섹션 (성함, 연락처)
    - 신청 내용 섹션 (수량, 단가, 총 금액, 회관, 소량 판매 허용 여부)
    - 결과: 확인 페이지 생성 완료. 신청 정보 표시, 모달로 회관 정보 및 절차 안내 제공
  - [x] 회관 위치 정보 섹션
    - 선택된 회관의 주소 표시
    - "주소 복사" 버튼 (클립보드 복사 기능)
    - "네이버 지도" 버튼 (네이버 지도 링크)
    - 결과: 모달 내부에 회관 정보 섹션 구현. 주소 복사 및 네이버 지도 버튼 포함
  - [x] 이후 절차 설명 섹션
    - 판매자 프로세스 단계별 설명
    - 주의사항 안내
    - 결과: 모달 내부에 이후 절차 설명 및 주의사항 포함
  - [x] 액션 버튼
    - "돌아가기" 버튼 (`/otc`로 이동)
    - "회관 정보 및 절차 안내 보기" 버튼 (모달 열기)
    - 결과: 버튼 구현 완료
  - [x] 반응형 디자인 적용 (모바일 우선)
    - 결과: 모바일 우선 반응형 디자인 적용 완료

- [x] 2.1.6.3 구매 신청 확인 페이지 (`/otc/buy/apply/success`)

  - [x] 확인 페이지 UI 생성 (판매 신청 확인 페이지와 유사한 구조)
    - 결과: 구매 신청 확인 페이지 생성 완료. 판매 신청 확인 페이지와 유사한 구조로 구현. 모달로 회관 정보 및 절차 안내 제공
  - [x] 구매자 프로세스 설명
    - 구매자 프로세스 단계별 설명
    - 구매자 특화 주의사항 안내
    - 결과: 구매자 프로세스 설명 구현 완료. 원화 입금 → 즉시 매칭 → 모빅코인 전송 프로세스 포함. 구매자 특화 주의사항 (구매의사 명확히, 입금 우선 매칭, P2P 거래 이력 확인) 포함
  - [x] 회관 위치 정보 표시
    - 결과: 모달 내부에 회관 정보 섹션 구현. 주소 복사 및 네이버 지도 버튼 포함
  - [x] 액션 버튼
    - 결과: "돌아가기" 버튼 및 "회관 정보 및 절차 안내 보기" 버튼 구현 완료

- [x] 2.1.6.4 API 수정 - 신청 제출 시 상세 정보 반환

  - [x] `POST /api/seller-request` 응답에 신청 상세 정보 포함
    - 신청 ID, 신청자 정보, 신청 내용 등
    - 결과: API 응답에 신청 상세 정보(id, name, phone, amount, price, allowPartial, branch, status, createdAt) 포함

- [x] 2.1.6.5 판매 신청 페이지 리다이렉트 로직

  - [x] 제출 성공 시 확인 페이지로 리다이렉트
    - 쿼리 파라미터로 신청 ID 전달
    - 또는 신청 상세 정보를 쿼리 파라미터로 전달
    - 결과: 제출 성공 시 쿼리 파라미터로 신청 상세 정보를 전달하여 확인 페이지로 리다이렉트 구현 완료

- [ ] 2.1.6.6 구매 신청 페이지 리다이렉트 로직
  - [ ] 제출 성공 시 확인 페이지로 리다이렉트

## 5. 자산 종류 선택 기능 (최우선순위) 🔺

> OTC 메인 페이지에 4개의 자산 종류(BMB, MOVL, WBMB, SBMB)를 선택할 수 있는 컴포넌트 추가
> 각 자산은 기존 OTC와 동일한 구조이지만 다른 자산을 다룸

- [x] 5.1 DB 스키마 수정 - 자산 종류 필드 추가

  - [x] 5.1.1 `prisma/schema.prisma`의 `SellerRequest` 모델에 `assetType` 필드 추가
    - 타입: `String` (또는 `Enum` - BMB, MOVL, WBMB, SBMB)
    - 기본값: `"BMB"` (기존 데이터 호환성)
    - 필수 필드로 설정
    - 결과: `prisma/schema.prisma`에 `assetType String @default("BMB")` 필드 추가 완료
    - 확인방법: `prisma/schema.prisma` 파일에서 `assetType` 필드가 `branch`와 `status` 사이에 올바르게 추가되었는지 확인
  - [x] 5.1.2 PlanetScale에 스키마 반영 (`npx prisma db push`)
    - 결과: `npx prisma db push` 실행 완료. PlanetScale 데이터베이스에 `assetType` 컬럼 추가됨
    - 확인방법: PlanetScale 대시보드에서 `SellerRequest` 테이블에 `assetType` 컬럼 추가 확인
  - [x] 5.1.3 기존 데이터 업데이트 (모두 "BMB"로 설정)
    - 결과: 기존 레코드에 기본값 `"BMB"`가 자동으로 설정됨
    - 확인방법: PlanetScale 대시보드에서 모든 레코드의 `assetType`이 "BMB"로 설정되어 있는지 확인

- [ ] 5.2 자산 종류 선택 컴포넌트 UI

  - [ ] 5.2.1 OTC 메인 페이지(`/otc`) 상단에 자산 종류 선택 컴포넌트 추가
    - 위치: `Title` 아래, `TabContainer` 위
    - 4개의 아이콘/버튼을 가로로 일자 배치
    - 각 버튼: BMB, MOVL, WBMB, SBMB
    - 선택된 자산은 시각적으로 구분 (배경색, 테두리 등)
    - 기본 선택: BMB
  - [ ] 5.2.2 자산 종류별 아이콘/이미지 준비 (선택사항)
    - 각 자산을 구분할 수 있는 아이콘 또는 텍스트 라벨
  - [ ] 5.2.3 반응형 디자인 적용
    - 모바일: 작은 아이콘/텍스트로 표시
    - 데스크톱: 큰 아이콘/텍스트로 표시

- [x] 5.3 상태 관리 및 데이터 필터링

  - [x] 5.3.1 `useState`로 선택된 자산 종류 관리 (`assetType` state)
    - 결과: `assetType` state 추가 완료. URL 쿼리 파라미터에서 초기값 가져오기 구현 (`searchParams.get("asset") || "BMB"`)
    - 확인방법: 코드에서 `const [assetType, setAssetType] = useState<string>(() => { return searchParams.get("asset") || "BMB"; });` 확인
  - [x] 5.3.2 자산 선택 시 해당 자산의 데이터만 표시되도록 필터링
    - 결과: API 호출 시 `assetType` 쿼리 파라미터 전달. `useEffect` 의존성에 `assetType` 추가하여 자산 변경 시 자동으로 데이터 재로딩
    - 확인방법:
      - 코드 확인: `/api/otc/listed-requests?assetType=${assetType}` 및 `/api/otc/card-requests?assetType=${assetType}&status=LISTED` 확인
      - 화면 확인: 자산 버튼 클릭 시 해당 자산의 데이터만 표시되는지 확인
  - [x] 5.3.3 URL 쿼리 파라미터로 자산 종류 관리
    - 예: `/otc?asset=BMB`, `/otc?asset=MOVL`
    - 페이지 새로고침 시에도 선택된 자산 유지
    - 하이브리드 방식: 탭 + 캐싱 + URL 쿼리 파라미터
    - 결과: `useSearchParams`와 `useRouter` 사용하여 URL 쿼리 파라미터(`/otc?asset=BMB`)로 자산 종류 관리. 페이지 새로고침 시에도 선택된 자산 유지. `handleAssetTypeChange` 함수로 URL 업데이트. 구매하기/판매하기 버튼 및 카드 링크에 `assetType` 파라미터 포함
    - 확인방법:
      - 코드 확인: `handleAssetTypeChange` 함수와 URL 변경 감지 `useEffect` 확인
      - 화면 확인: 자산 버튼 클릭 시 URL이 `/otc?asset=BMB` 형태로 변경되는지 확인. 페이지 새로고침 후에도 선택된 자산이 유지되는지 확인

- [x] 5.4 API Routes 수정 - 자산 종류 필터링 추가

  - [x] 5.4.1 `GET /api/otc/listed-requests` - `assetType` 쿼리 파라미터 추가
    - 예: `/api/otc/listed-requests?assetType=BMB`
    - `assetType`이 없으면 기본값 "BMB" 사용
    - 결과: `request` 파라미터 추가하여 `searchParams`에서 `assetType` 추출. 기본값 "BMB". Prisma 쿼리에 `assetType` 필터링 조건 추가
    - 확인방법:
      - 코드 확인: `app/api/otc/listed-requests/route.ts`에서 `assetType` 파라미터 처리 확인
      - 테스트: `/api/otc/listed-requests?assetType=BMB` 호출 시 BMB 자산만 반환되는지 확인
  - [x] 5.4.2 `GET /api/otc/card-requests` - `assetType` 쿼리 파라미터 추가
    - 예: `/api/otc/card-requests?assetType=MOVL&status=LISTED`
    - 결과: `request` 파라미터 추가하여 `searchParams`에서 `assetType` 추출. 기본값 "BMB". Prisma 쿼리에 `assetType` 필터링 조건 추가. `status` 파라미터도 함께 처리
    - 확인방법:
      - 코드 확인: `app/api/otc/card-requests/route.ts`에서 `assetType` 파라미터 처리 확인
      - 테스트: `/api/otc/card-requests?assetType=MOVL&status=LISTED` 호출 시 MOVL 자산만 반환되는지 확인
  - [x] 5.4.3 `POST /api/seller-request` - 요청 본문에 `assetType` 필드 추가
    - 필수 필드로 검증
    - 결과: 요청 본문에서 `assetType` 추출 및 필수 필드 검증 추가. 유효성 검증 (BMB, MOVL, WBMB, SBMB). Prisma create 시 `assetType` 포함. 응답에 `assetType` 포함
    - 확인방법:
      - 코드 확인: `app/api/seller-request/route.ts`에서 `assetType` 필드 처리 확인
      - 테스트: `assetType` 없이 요청 시 400 에러 반환 확인. 유효하지 않은 `assetType` 값으로 요청 시 400 에러 반환 확인

- [x] 5.5 구매/판매 신청 페이지 수정

  - [x] 5.5.1 구매 신청 페이지(`/otc/buy/apply`) - `assetType` 쿼리 파라미터 처리
    - URL에서 `assetType` 받아서 폼에 반영
    - 기본값: "BMB"
    - 결과: `useSearchParams`에서 `assetType` 추출. 기본값 "BMB". 리다이렉트 시 쿼리 파라미터에 `assetType` 포함
    - 확인방법:
      - 코드 확인: `app/otc/buy/apply/page.tsx`에서 `assetType` 처리 확인
      - 화면 확인: `/otc/buy/apply?assetType=MOVL` 접속 시 assetType이 유지되는지 확인
  - [x] 5.5.2 판매 신청 페이지(`/otc/sell/apply`) - `assetType` 쿼리 파라미터 처리
    - URL에서 `assetType` 받아서 폼에 반영
    - 기본값: "BMB"
    - 결과: `useSearchParams`에서 `assetType` 추출. 기본값 "BMB". API 호출 시 `assetType` 포함
    - 확인방법:
      - 코드 확인: `app/otc/sell/apply/page.tsx`에서 `assetType` 처리 확인
      - 화면 확인: `/otc/sell/apply?assetType=MOVL` 접속 시 assetType이 유지되는지 확인
  - [x] 5.5.3 신청 제출 시 `assetType` 포함하여 API 호출
    - 결과: 판매 신청 시 `/api/seller-request`에 `assetType` 포함. 구매 신청 시 리다이렉트 쿼리 파라미터에 `assetType` 포함
    - 확인방법:
      - 코드 확인: `handleSubmit` 함수에서 `assetType` 포함 확인
      - 네트워크 탭: API 호출 시 `assetType` 필드 포함 확인
  - [x] 5.5.4 구매 신청 폼 - 호가 기반 가격/수량 선택 로직 구현
    - 구매 신청은 호가에 올라온 판매 건에 대해서만 가능
    - `/otc/buy/apply?mode=free`에서 호가 데이터(`/api/otc/orderbook-levels`) 불러오기
    - 가격 선택: 호가에 있는 가격만 Select 옵션으로 표시 (가격 + 가능 수량 표시)
    - 수량 제한: 선택한 가격의 호가 수량 이하로만 입력 가능 (초과 시 자동 제한 및 에러 메시지)
    - 결과: 호가형(소액) 구매 모드에서 `OrderBookLevel` 데이터를 불러와 가격 선택 드롭다운 제공. 선택한 가격의 `totalAmount`를 최대 수량으로 제한. 가격 미선택 시 수량 입력 비활성화
    - 확인방법:
      - 코드 확인: `app/otc/buy/apply/page.tsx`에서 `orderBookLevels` state 및 가격 선택 로직 확인
      - 화면 확인: `/otc/buy/apply?mode=free&assetType=BMB` 접속 시 호가 가격 선택 드롭다운 표시 확인
      - 화면 확인: 가격 선택 후 수량 입력 시 최대값 제한 확인

- [x] 5.6 어드민 페이지 수정

  - [x] 5.6.1 어드민 페이지(`/admin/otc/requests`) - 자산 종류 필터 추가
    - 드롭다운 또는 탭으로 자산 종류 선택
    - 선택된 자산의 신청 내역만 표시
    - 결과: `FilterContainer`와 `FilterSelect` 컴포넌트 추가. 드롭다운으로 전체/BMB/MOVL/WBMB/SBMB 선택 가능. 선택 시 API 호출에 `assetType` 쿼리 파라미터 포함. `useEffect` 의존성에 `assetType` 추가하여 필터 변경 시 자동으로 데이터 재로딩
    - 확인방법:
      - 코드 확인: `app/admin/otc/requests/page.tsx`에서 필터 UI 및 로직 확인
      - 화면 확인: 드롭다운에서 자산 종류 선택 시 해당 자산의 신청 내역만 표시되는지 확인
      - 네트워크 탭: `/api/seller-requests?assetType=BMB` 형태로 API 호출되는지 확인
  - [x] 5.6.2 테이블에 "자산 종류" 컬럼 추가
    - 결과: 테이블 헤더에 "자산 종류" 컬럼 추가 (연락처 다음). 테이블 셀에 `request.assetType || "BMB"` 표시. `SellerRequest` 인터페이스에 `assetType?: string` 필드 추가
    - 확인방법:
      - 코드 확인: 테이블 헤더와 셀에 자산 종류 컬럼 추가 확인
      - 화면 확인: 테이블에 자산 종류가 표시되는지 확인

- [ ] 5.7 통합 테스트
  - [ ] 5.7.1 각 자산 종류별로 판매 신청 생성 및 조회 테스트
  - [ ] 5.7.2 각 자산 종류별로 구매 신청 생성 및 조회 테스트
  - [ ] 5.7.3 OTC 메인 페이지에서 자산 선택 시 올바른 데이터 표시 확인
  - [ ] 5.7.4 어드민 페이지에서 자산 종류별 필터링 확인

---

## 6. 호가 요약 데이터 구조 개편 (중요)

> 개인정보 보호와 성능 최적화를 위해, 호가창은 "요약 데이터"만 조회하도록 구조를 개편한다.
> 카드형 API도 민감 정보(이름/연락처)를 제외한 필드만 반환하도록 조정한다.

- [x] 6.1 카드형 API 응답 필드 축소

  - [x] 6.1.1 `/api/otc/card-requests` 응답에서 이름/연락처 등 민감 정보 제외
    - 결과: Prisma 쿼리에 `select` 옵션 추가하여 `name`, `phone` 필드를 제외. `id`, `amount`, `price`, `allowPartial`, `branch`, `status`, `assetType`, `createdAt`, `updatedAt`만 반환
    - 확인방법:
      - 코드 확인: `app/api/otc/card-requests/route.ts`에서 `select` 옵션 확인
      - 네트워크 탭: 카드형 API 응답에 이름/연락처가 포함되지 않는지 확인
  - [x] 6.1.2 프론트엔드(`app/otc/page.tsx`)에서 민감 정보 사용 코드 제거
    - 결과: `SellerRequest` 인터페이스에서 `name`, `phone`을 optional(`name?`, `phone?`)로 변경. 카드형 UI는 이미 이름/연락처를 사용하지 않으므로 추가 변경 없음
    - 확인방법:
      - 코드 확인: `app/otc/page.tsx`에서 `SellerRequest` 인터페이스 확인
      - 화면 확인: 카드형 UI가 이름/연락처 없이도 정상 렌더링되는지 확인

- [x] 6.2 호가 요약 테이블 설계 (`OrderBookLevel` 가칭)

  - [x] 6.2.1 Prisma 스키마에 요약 테이블 추가 (필드 예시: `id`, `assetType`, `branch`, `price`, `totalAmount`, `updatedAt`)
    - 결과: `prisma/schema.prisma`에 `OrderBookLevel` 모델 추가 완료. 필드: `id`, `assetType`, `price`, `totalAmount`, `requestCount`, `updatedAt`. 복합 유니크 인덱스 `@@unique([assetType, price])` 및 인덱스 `@@index([assetType, price])` 추가
    - 확인방법:
      - 코드 확인: `prisma/schema.prisma`에 `OrderBookLevel` 모델 존재 확인
  - [x] 6.2.2 PlanetScale에 실제 테이블 생성 (`prisma db push` 또는 DDL)
    - 결과: `npx prisma db push` 실행하여 PlanetScale에 `OrderBookLevel` 테이블 생성 완료
    - 확인방법:
      - DB 확인: PlanetScale 대시보드에서 `OrderBookLevel` 테이블이 생성되어 있는지 확인
      - 명령어 실행: `npx prisma db push` 성공 메시지 확인

- [ ] 6.3 요약 데이터 동기화 로직

  - [ ] 6.3.1 `SellerRequest` 상태/allowPartial/가격 변경 시 요약 테이블을 재계산하는 서비스 구현
    - 옵션 A: 서버 액션/Route Handler에서 `SellerRequest` 업데이트 직후 요약 테이블 갱신
    - 옵션 B: `cron` 또는 별도 스크립트로 주기적 재계산
  - [ ] 6.3.2 가격별 수량 합계 로직: `allowPartial = true`와 `status = LISTED` 조건만 포함
  - 결과: (완료 후 작성)
  - 확인방법:
    - 상태 변경 → 요약 테이블 값이 최신화되는지 DB에서 직접 확인
    - 단가/수량 변경 → 요약 테이블의 `totalAmount`가 갱신되는지 확인

- [ ] 6.4 호가형 탭 데이터 소스 교체

  - [ ] 6.4.1 `/api/otc/listed-requests` 대신 `/api/otc/orderbook-levels` (신규)에서 요약 데이터 조회
  - [ ] 6.4.2 `app/otc/page.tsx`의 호가형 탭이 요약 데이터만 사용하도록 수정 (가격/총수량/막대그래프 비율 계산)
  - [ ] 6.4.3 기존 `listedRequests` 관련 로직 정리 (불필요한 개인정보 상태 제거)
  - 결과: (완료 후 작성)
  - 확인방법:
    - 네트워크 탭: 호가형 탭이 신규 API만 호출하는지 확인
    - 화면 확인: 가격 및 총 수량이 기존과 동일하게 표시되는지 확인

- [x] 6.5 어드민 페이지 영향도 점검
  - [x] 6.5.1 어드민 페이지(`/admin/otc/requests`)는 기존 `SellerRequest` 데이터를 그대로 사용 (개인정보 필요)
    - 결과: 어드민 페이지는 `/api/seller-requests` API를 사용하여 전체 `SellerRequest` 데이터를 조회. 이름, 연락처 등 개인정보가 포함된 데이터를 표시. 호가형 탭과는 별도로 운영되어 영향 없음
    - 확인방법:
      - 코드 확인: `app/admin/otc/requests/page.tsx`에서 `/api/seller-requests` 사용 확인
      - 화면 확인: 어드민 페이지에서 이름, 연락처 등 개인정보가 정상적으로 표시되는지 확인

---

## 7. 주간 운영 사이클 – 가격 고정 & 판매의사 확인 프로세스

> 매주 일요일 오전 9시에 전체 매물이 재정비되는 구조.
> 매칭 중지 → 판매의사 확인 → 상태 갱신 순으로 진행되는 핵심 운영 로직.

- [x] 7.1 판매 신청 후 가격/수량 변경 불가 정책

  - [x] 7.1.1 판매 신청 폼에 운영 정책 안내문 추가
    - "판매 신청 이후 가격/수량은 그 주 일요일 오전 09:00까지 고정되며, 취소/변경은 일요일까지 불가능합니다."
    - "일요일 09:00 이후 운영자가 연락을 드리며 판매의사(유지/변경/취소 여부)를 확인합니다."
    - "연락이 닿지 않을 경우, 호가에서 제외되어 대기됩니다."
    - 결과: `PolicyNotice`, `PolicyTitle`, `PolicyList`, `PolicyItem`, `PolicyHighlight` styled components 추가. 운영 정책 안내문을 회관 선택 필드 다음에 배치. "취소/변경은 일요일까지 불가능합니다." 텍스트를 붉은색으로 강조
    - 확인방법:
      - 코드 확인: `app/otc/sell/apply/page.tsx`에 안내문 컴포넌트 확인
      - 화면 확인: 판매 신청 폼에 안내문이 표시되고 강조 텍스트가 붉은색으로 표시되는지 확인
  - [x] 7.1.2 "해당 운영 정책을 이해했습니다" 체크박스 추가 (`agreedPolicy` 필드)
    - 체크하지 않으면 제출 불가
    - API에서 미체크 시 400 에러 반환
    - 결과: `agreedPolicy` state 추가. `CheckboxContainer`, `CheckboxInput`, `CheckboxLabel` styled components 추가. `validateForm`에 `agreedPolicy` 검증 추가. API 호출 시 `agreedPolicy` 포함. `app/api/seller-request/route.ts`에서 `agreedPolicy` 필수 필드 검증 및 true 값 검증 추가
    - 확인방법:
      - 코드 확인: `app/otc/sell/apply/page.tsx`에 체크박스 및 검증 로직 확인
      - 화면 확인: 체크박스가 표시되고 미체크 시 제출 불가 확인
      - API 확인: `agreedPolicy` 없이 요청 시 400 에러 반환 확인

- [x] 7.2 DB 상태(enum) 확장

  - [x] 7.2.1 `lib/constants.ts`에 `PENDING_CONFIRMATION` 상태 추가
    - `REQUEST_STATUS` enum에 `PENDING_CONFIRMATION: "PENDING_CONFIRMATION"` 추가
    - `STATUS_LABELS`에 `PENDING_CONFIRMATION: "판매의사 확인중"` 추가
    - 결과: `REQUEST_STATUS`에 `PENDING_CONFIRMATION: "PENDING_CONFIRMATION"` 추가. `STATUS_LABELS`에 `PENDING_CONFIRMATION: "판매의사 확인중"` 추가
    - 확인방법:
      - 코드 확인: `lib/constants.ts`에 새 상태 값 및 라벨 확인
  - [x] 7.2.2 Prisma 스키마 확인 (status는 String이므로 enum 변경 불필요)
    - 결과: `prisma/schema.prisma`에서 `status` 필드가 `String` 타입으로 정의되어 있어 enum 변경 불필요. `PENDING_CONFIRMATION` 상태 값을 그대로 사용 가능
    - 확인방법:
      - 코드 확인: `prisma/schema.prisma`에서 `status String` 확인
      - 어드민 페이지: 상태 변경 드롭다운에 "판매의사 확인중" 옵션 확인

- [x] 7.3 일요일 오전 09:00 자동 처리 (또는 운영자 수동 버튼)

  - [x] 7.3.1 API Route 생성: `POST /api/admin/weekly-reset` 또는 `POST /api/admin/confirm-sales-intent`
    - `status = LISTED`인 모든 매물을 `PENDING_CONFIRMATION`으로 일괄 변경
    - `assetType`별로 처리 (BMB, MOVL, WBMB, SBMB)
  - [x] 7.3.2 운영자 페이지에 "주간 재정비 실행" 버튼 추가
    - 버튼 클릭 시 위 API 호출
    - 실행 전 확인 다이얼로그 표시
    - 실행 후 결과 메시지 표시 (변경된 건수 등)

- [x] 7.4 호가형/카드형 탭 데이터 필터링 업데이트

  - [x] 7.4.1 `/api/otc/listed-requests` 필터 확인
    - `status = LISTED`만 반환 (이미 구현되어 있음)
    - `PENDING_CONFIRMATION`은 자동으로 제외됨
    - 결과: `app/api/otc/listed-requests/route.ts`에서 `status: REQUEST_STATUS.LISTED` 필터링 적용. PENDING_CONFIRMATION 상태는 자동으로 제외됨
    - 확인방법:
      - 코드 확인: `app/api/otc/listed-requests/route.ts`에서 `status: REQUEST_STATUS.LISTED` 확인
      - API 테스트: PENDING_CONFIRMATION 상태의 매물이 응답에 포함되지 않는지 확인
  - [x] 7.4.2 `/api/otc/card-requests` 필터 확인
    - `status = LISTED`만 반환 (쿼리 파라미터로 필터링)
    - `PENDING_CONFIRMATION`은 자동으로 제외됨
    - 결과: `app/otc/page.tsx`에서 카드형 데이터 조회 시 `status=LISTED` 쿼리 파라미터 전달. `app/api/otc/card-requests/route.ts`에서 status 파라미터 처리. PENDING_CONFIRMATION 상태는 자동으로 제외됨
    - 확인방법:
      - 코드 확인: `app/otc/page.tsx`에서 `status=LISTED` 파라미터 전달 확인
      - API 테스트: PENDING_CONFIRMATION 상태의 매물이 응답에 포함되지 않는지 확인
      - 화면 확인: 호가형/카드형 탭에서 PENDING_CONFIRMATION 매물이 표시되지 않는지 확인

- [x] 7.5 운영자 확인 및 상태 반영 로직

  - [x] 7.5.1 운영자 페이지에서 `PENDING_CONFIRMATION` 상태 매물 필터링 기능
    - 상태 드롭다운에 "판매의사 확인중" 필터 추가
    - 결과: `statusFilter` state 추가. 상태 필터 드롭다운 추가 (전체/PENDING/LISTED/PENDING_CONFIRMATION/MATCHED/COMPLETED). API 호출 시 `status` 쿼리 파라미터 포함. `app/api/seller-requests/route.ts`에 `status` 필터 처리 추가
    - 확인방법:
      - 코드 확인: `app/admin/otc/requests/page.tsx`에서 상태 필터 UI 및 로직 확인
      - 화면 확인: 운영자 페이지에서 "판매의사 확인중" 필터로 매물 조회 확인
      - API 확인: `/api/seller-requests?status=PENDING_CONFIRMATION` 형태로 호출되는지 확인
  - [x] 7.5.2 상태 변경 옵션
    - 판매 유지 → `LISTED`로 변경
    - 가격/수량 변경 → 수정 후 `LISTED`로 변경
    - 판매 중단 → `COMPLETED` 또는 `CANCELLED`로 변경
    - 연락 불가 → `PENDING_CONFIRMATION` 유지
    - 결과: 어드민 페이지의 상태 변경 드롭다운을 통해 모든 상태로 변경 가능. 상태 변경 API(`PATCH /api/seller-request/:id/status`)가 이미 구현되어 있어 위 옵션들이 모두 가능함
    - 확인방법:
      - 화면 확인: 운영자 페이지에서 상태 드롭다운으로 상태 변경 가능한지 확인
      - 기능 확인: PENDING_CONFIRMATION → LISTED 변경 시 OrderBookLevel 동기화 확인

- [x] 7.6 판매 신청 폼 `agreedPolicy` 필드 추가
  - [x] 7.6.1 `app/otc/sell/apply/page.tsx`에 `agreedPolicy` state 추가
  - [x] 7.6.2 체크박스 UI 추가 및 제출 시 검증 로직 추가
  - [x] 7.6.3 `POST /api/seller-request`에 `agreedPolicy` 필드 추가 및 검증
  - 결과: 7.1에서 이미 구현 완료. `agreedPolicy` state, 체크박스 UI, 검증 로직, API 검증 모두 완료
  - 확인방법:
    - 코드 확인: 판매 신청 폼에 체크박스 및 검증 로직 확인
    - 화면 확인: 체크박스 미체크 시 제출 불가 확인
    - API 확인: `agreedPolicy` 미전송 시 400 에러 반환 확인

---

## 8. LBANK 가격 연동 (메인 페이지)

- [x] 8.1 `app/api/price/bmb/route.ts` 같은 API Route 생성.
  - [x] LBANK BMB/USDT 가격 API 호출 (현재가만).
  - [x] 필요한 최소 필드(가격, 24h 변화율 등)만 JSON으로 반환.
  - 결과: `app/api/price/bmb/route.ts` 생성 완료. LBANK에서 BMB/USDT 가격 조회. USDT/KRW 가격 조회 (Bithumb → Upbit fallback). BMB/KRW 가격 계산. 최소 필드만 반환 (price, usdtPrice, usdtKrwPrice, timestamp). 에러 처리 포함
  - 확인방법:
    - 코드 확인: `app/api/price/bmb/route.ts` 파일 존재 확인
    - API 테스트: `/api/price/bmb` 호출 시 BMB 가격 정보 반환 확인
- [ ] 8.2 메인 페이지, `/otc` 페이지에서 해당 API를 호출하여 실시간 가격 표시.
  - [ ] 서버 컴포넌트에서 `fetch` + `next: { revalidate: 30 }` 등 캐싱 옵션 적용.
- [ ] 8.3 API 실패 시 예외 처리 (예: "가격 정보를 불러올 수 없습니다." 메시지).

---

## 9. 모빅경제 / 위러브모빅 / 유튜브 연동 준비

### 9.1 모빅경제 API 스펙 정리 & 요청

- [ ] 9.1.1 필요 데이터 정의:
  - [ ] 비트모빅 카테고리 최신 n개.
  - [ ] 필드: `id`, `title`, `summary`, `thumbnail`, `link`, `publishedAt`, `tags`.
- [ ] 9.1.2 위 스펙을 기반으로 **운영자에게 보낼 "API 요청서 문구"** 초안 작성.
- [ ] 9.1.3 초안 문구를 별도 파일 (예: `docs/mobick-economy-api-request.md`) 로 저장.
- [ ] 9.1.4 실 API가 오기 전까지 사용할 더미 JSON 파일 생성 (`data/mock-mobick-news.json`).
- [ ] 9.1.5 메인 페이지에서 이 더미 JSON 기준으로 렌더링 로직 구현.

### 9.2 위러브모빅 / 유튜브 연동 기획

- [ ] 9.2.1 옵션 A: 위러브모빅 API 스펙 정의 (모빅경제와 비슷한 형태).
- [ ] 9.2.2 옵션 B: YouTube Data API 사용 시 필요한 정보 정리:
  - [ ] 채널 ID 또는 재생목록 ID 목록.
  - [ ] 가져올 필드(제목, 썸네일, 업로드 시간, 링크 등).
- [ ] 9.2.3 이 스펙을 기반으로 별도 문서 (예: `docs/youtube-api-plan.md`) 작성.
- [ ] 9.2.4 메인 페이지에 "유튜브 최신 영상" 영역 더미 데이터로 카드 UI 구현.
- [ ] 9.2.5 실제 API 연동은 **운영자/환경변수/키 수급 이후**에 진행하도록 주석으로 명시.
- [ ] 9.2.6 YouTube 자동 연동 구현 단계 (요청 채널 기준)
  - 채널 핸들/URL 목록:
    - `https://www.youtube.com/@futureman77777` : UC89C4CVYn1W8wzXp5Zvb68w
    - `https://www.youtube.com/@oceanpage` : UCY4iRMfL6NyekvBS47VYYtA
    - `https://www.youtube.com/@MobickClipSnack` : UCAh6H2aP9ACLF24_QWD27cw
    - `https://www.youtube.com/@MobickerGabriel` : UCuslGcmrP0wXKLFJpvkN8Mg
    - `https://www.youtube.com/@hoguhogu11` : UC8P7tiKm39c66cSU0mqy32Q
    - `https://www.youtube.com/@vivikim2029` : UC-qJDtz16KSxTTnTrIMk3Dg
    - `https://www.youtube.com/@otaverse` : UCjAmcKweNBx-Ju2xOPBOkkQ
  - [ ] 9.2.6.1 각 채널의 `channelId` 확보
    - 방법: `channels.list` API 또는 DevTools → `ytInitialData`에서 `channelId` 추출, 혹은 서드파티 툴 활용
    - 확인: `lib/youtube/channels.ts` (가칭)에 `{ handle, channelId, displayName }` 저장
  - [ ] 9.2.6.2 환경변수 및 API Key 설정
    - `.env.local`/Vercel에 `YOUTUBE_API_KEY` 추가
    - `next.config.js` 또는 `lib/env.ts`에서 검증 로직 추가
  - [ ] 9.2.6.3 서버 API 라우트 작성
    - 경로: `app/api/youtube/latest/route.ts`
    - 기능: `search.list` 또는 `playlistItems.list` 호출 → 채널별 최신 N개 수집 → 통합/정렬 → JSON 반환
    - 캐싱: `revalidate = 300`(5분) 또는 Upstash/Redis 캐시 사용
    - 예외 처리: API 제한(429) 시 마지막 성공 캐시 반환
  - [ ] 9.2.6.4 채널 구성/필터 유틸 작성
    - `lib/youtube/client.ts` 또는 `lib/youtube/fetch-latest.ts`에서 fetch 로직 모듈화
    - 채널별 태그/분류 필드 추가 (추후 UI 필터에 활용)
  - [ ] 9.2.6.5 프론트엔드 UI 구현
    - 메인 페이지(`app/page/components/NewsSection.tsx` 또는 신규 `YouTubeSection.tsx`)에 카드 UI 구성
    - 데이터 fetch → 로딩/오류 상태 → 카드(썸네일, 제목, 채널명, 업로드 시각, `https://youtube.com/watch?v=...` 링크)
    - “더 보기” 버튼: 플레이리스트 또는 채널 링크로 이동
  - [ ] 9.2.6.6 QA 및 문서화
    - 로컬에서 API 호출 테스트 (`curl /api/youtube/latest`)
    - README/`docs/youtube-api-plan.md`에 사용 방법과 환경변수 설명 추가
    - 배포 전 Vercel 환경변수 적용 여부 확인

---

## 10. 본인 신청 현황 조회 (SMS 인증)

- [ ] 10.1 SMS API 연동 준비

  - [ ] 10.1.1 SMS 서비스 선택 및 계정 생성 (알리고, 카카오 알림톡, AWS SNS 등)
  - [ ] 10.1.2 환경변수 설정 (`SMS_API_KEY`, `SMS_API_SECRET`, `SMS_SENDER_NUMBER` 등)
  - [ ] 10.1.3 SMS 발송 유틸리티 함수 생성 (`lib/sms.ts`)
  - 결과: (완료 후 작성)
  - 확인방법: SMS 발송 테스트

- [ ] 10.2 인증번호 관리 시스템

  - [ ] 10.2.1 인증번호 생성 함수 (6자리 랜덤 숫자)
  - [ ] 10.2.2 인증번호 저장 방식 선택 및 구현 (메모리/Redis/DB)
  - [ ] 10.2.3 인증번호 만료 시간 설정 (5분)
  - [ ] 10.2.4 인증번호 재발송 제한 (1분 이내 재발송 방지)
  - 결과: (완료 후 작성)
  - 확인방법: 인증번호 생성 및 저장 로직 확인

- [ ] 10.3 조회 페이지 UI

  - [ ] 10.3.1 `/otc/my-request` 페이지 생성
  - [ ] 10.3.2 연락처 입력 폼
  - [ ] 10.3.3 "인증번호 발송" 버튼
  - [ ] 10.3.4 인증번호 입력 필드
  - [ ] 10.3.5 "조회하기" 버튼
  - [ ] 10.3.6 신청 내역 표시 영역 (카드 또는 테이블 형태)
  - 결과: (완료 후 작성)
  - 확인방법: 브라우저에서 `/otc/my-request`

---

## 11. 구매 신청 DB 저장 및 관리 (우선순위 높음) 🔺

- [x] 11.1 BuyerRequest 모델 추가

  - [x] `prisma/schema.prisma`에 `BuyerRequest` 모델 추가
  - [x] 필드: `id`, `name`, `phone`, `amount`, `price`, `branch`, `assetType`, `status`, `agreedRisk`, `agreedPrivacy`, `createdAt`, `updatedAt`
  - 결과: `BuyerRequest` 모델 추가 완료. Prisma 마이그레이션 및 Client 재생성 완료
  - 확인방법:
    - 코드 확인: `prisma/schema.prisma`에서 `BuyerRequest` 모델 확인
    - DB 확인: PlanetScale에서 `BuyerRequest` 테이블 생성 확인

- [x] 11.2 구매 신청 API 생성

  - [x] `app/api/buyer-request/route.ts` 생성
  - [x] POST 요청 처리, 필수 필드 검증, Prisma를 통한 데이터 삽입
  - 결과: 구매 신청 API 생성 완료. 필수 필드 검증, 동의 필드 검증, assetType 유효성 검증 포함
  - 확인방법:
    - 코드 확인: `app/api/buyer-request/route.ts` 파일 존재 및 로직 확인
    - API 테스트: POST 요청 시 구매 신청이 DB에 저장되는지 확인

- [x] 11.3 구매 신청 폼 API 연동

  - [x] 구매 신청 페이지에서 `/api/buyer-request` 호출
  - [x] 성공 시 확인 페이지로 리다이렉트
  - 결과: 구매 신청 폼 제출 시 API 호출 및 성공 페이지 리다이렉트 구현 완료
  - 확인방법:
    - 코드 확인: `app/otc/buy/apply/page.tsx`에서 API 호출 로직 확인
    - 화면 확인: 구매 신청 제출 후 성공 페이지 표시 확인

- [x] 11.4 구매 신청 성공 페이지 수정
  - [x] `assetType` 쿼리 파라미터 처리
  - [x] 판매 신청 성공 페이지와 동일한 구조로 구현
  - 결과: 구매 신청 성공 페이지에 `assetType` 포함, 자산 종류 표시, 수량 표시에 `assetType` 사용
  - 확인방법:
    - 코드 확인: `app/otc/buy/apply/success/page.tsx`에서 `assetType` 처리 확인
    - 화면 확인: 구매 신청 성공 페이지에서 자산 종류가 올바르게 표시되는지 확인

---

## 12. 어드민 페이지 - 구매건 관리 및 매칭 로직 (우선순위 높음) 🔺

- [x] 12.1 남은 수량(remainingAmount) 필드 추가

  - [x] `prisma/schema.prisma`의 `SellerRequest` 모델에 `remainingAmount Int` 필드 추가
  - [x] `prisma/schema.prisma`의 `BuyerRequest` 모델에 `remainingAmount Int` 필드 추가
  - [x] 기본값: `amount`와 동일한 값으로 설정 (생성 시 `remainingAmount = amount`)
  - [x] 마이그레이션 실행 및 Prisma Client 재생성
  - [x] 기존 데이터 업데이트: `remainingAmount = amount`
  - [x] 판매 신청 API 수정: 생성 시 `remainingAmount = amount` 설정
  - [x] 구매 신청 API 수정: 생성 시 `remainingAmount = amount` 설정
  - 결과: `remainingAmount` 필드 추가 완료. Prisma 마이그레이션 및 기존 데이터 업데이트 완료. 판매/구매 신청 API에서 `remainingAmount = amount` 설정
  - 확인방법:
    - 코드 확인: `prisma/schema.prisma`에서 `remainingAmount` 필드 확인
    - DB 확인: PlanetScale에서 `remainingAmount` 컬럼 추가 확인
    - API 확인: 신청 생성 시 `remainingAmount`가 `amount`와 동일하게 설정되는지 확인

- [x] 12.2 어드민 페이지에 구매건 섹션 추가

  - [x] `app/admin/otc/requests/page.tsx`에 구매건 테이블 추가
  - [x] 판매건 섹션 아래에 구매건 섹션 배치 (탭 없이 비교하기 쉽게)
  - [x] 구매건 API Route 확인/수정 (`app/api/buyer-requests/route.ts`)
  - [x] 구매건 목록 조회 (필터링: assetType, status)
  - [x] 구매건 상태 변경 기능 (드롭다운)
  - [x] 남은 수량(remainingAmount) 표시
  - [x] 신청 수량(amount)과 남은 수량(remainingAmount) 모두 표시
  - 결과: 어드민 페이지에 구매건 섹션 추가 완료. 판매건 아래에 배치. 필터링, 상태 변경, 수량 표시 기능 포함
  - 확인방법:
    - 코드 확인: 어드민 페이지에 구매건 테이블 추가 확인
    - 화면 확인: 어드민 페이지에서 판매건 아래에 구매건 섹션이 표시되는지 확인
    - 화면 확인: 신청 수량과 남은 수량이 모두 표시되는지 확인

- [x] 12.3 매칭 섹션 추가

  - [x] 매칭된 건들(MATCHED 상태)을 최상단에 별도 섹션으로 표시
  - [x] 판매건과 구매건의 매칭 정보 표시
  - [x] 매칭된 상대방 정보 표시 (구매건의 경우 판매자 정보, 판매건의 경우 구매자 정보)
  - [x] 매칭 수량 표시
  - [x] 매칭 가격 표시
  - [x] 매칭된 판매건과 구매건을 서브섹션으로 구분하여 표시
  - [x] 각 건 클릭 시 상세 정보 모달 표시
  - 결과: 매칭 섹션 추가 완료. 매칭된 판매건/구매건 서브섹션 구분. 매칭 정보 테이블. 클릭 시 상세 모달 표시
  - 확인방법:
    - 화면 확인: 어드민 페이지 최상단에 매칭 섹션이 표시되는지 확인
    - 화면 확인: 매칭된 판매건과 구매건이 별도 서브섹션으로 표시되는지 확인
    - 화면 확인: 각 건 클릭 시 모달이 표시되는지 확인

- [x] 12.4 매칭 완료 모달 구현

  - [x] MATCHED 상태를 COMPLETED로 변경할 때 모달 표시
  - [x] 모달 내용:
    - 매칭 정보: 매칭 ID, 매칭 수량, 매칭 가격, 총 금액, 매칭일시
    - 판매건 정보: 판매건 ID, 성함, 연락처, 신청 수량, 남은 수량, 가격, 회관
    - 구매건 정보: 구매건 ID, 성함, 연락처, 신청 수량, 남은 수량, 가격, 회관
  - [x] "확인 완료" 버튼 클릭 시:
    - `POST /api/match/[id]/complete` API 호출
    - Match 레코드의 status를 COMPLETED로 변경
    - 관련 판매건/구매건의 remainingAmount가 0이고 status가 LISTED/MATCHED인 경우 COMPLETED로 변경
    - 남은 수량(remainingAmount)은 이미 매칭 시 차감되었으므로 그대로 유지
  - 결과: 매칭 완료 모달 구현 완료. 매칭 모달에서 "확인 완료" 버튼 클릭 시 API 호출하여 Match 상태를 COMPLETED로 변경. 관련 판매건/구매건 상태도 자동 업데이트. 트랜잭션으로 안전하게 처리.
  - 확인방법:
    - 코드 확인: `app/api/match/[id]/complete/route.ts` 파일에서 Match 완료 로직 확인
    - 코드 확인: `app/admin/otc/requests/page.tsx`에서 매칭 모달의 "확인 완료" 버튼 클릭 핸들러 확인
    - 화면 확인: 어드민 페이지에서 매칭 모달 열기 → "확인 완료" 버튼 클릭 → 상태가 COMPLETED로 변경되는지 확인
    - DB 확인: Match 테이블에서 status가 COMPLETED로 변경되었는지 확인
    - 화면 확인: 관련 판매건/구매건의 상태도 자동으로 업데이트되는지 확인

- [x] 12.5 매칭 로직 수정 (remainingAmount 고려)

  - [x] 12.5.1 매칭 조건 수정
    - 같은 `assetType`
    - 같은 `price`
    - 판매건 `remainingAmount` > 0 (남은 수량이 있어야 함)
    - 판매건 상태: `LISTED` (신청 순서대로, 먼저 신청한사람이 우선 매칭됨)
    - 구매건 상태: `LISTED`로 변경 시 매칭 시도
  - [x] 12.5.2 매칭 테이블 생성 (매칭 정보 저장)
    - `Match` 모델 추가 (`sellerRequestId`, `buyerRequestId`, `matchedAmount`, `matchedPrice`, `status`, `createdAt`, `updatedAt`)
    - 매칭 정보를 별도 테이블에 저장하여 추적 가능하게 함
  - [x] 12.5.3 매칭 로직 구현 (여러 판매건 순차 매칭)
    - 구매건이 LISTED 상태가 되면:
      - 같은 가격의 판매건들을 `createdAt` 순서대로 정렬
      - 구매 수량만큼 순차적으로 매칭:
        - 판매건 1의 `remainingAmount`에서 차감
        - 판매건 1의 `remainingAmount`가 0이 되면 다음 판매건으로 이동
        - 모든 구매 수량이 매칭될 때까지 반복
      - 각 판매건의 `remainingAmount` 차감
      - 매칭된 각 판매건-구매건 쌍에 대해 `Match` 레코드 생성
      - 구매건 상태 → `MATCHED` (전체 매칭 완료 시) 또는 `LISTED` (일부만 매칭 시)
      - 판매건의 `remainingAmount`가 0이면 → `COMPLETED`, 남으면 `LISTED` 유지
    - 매칭 실패 시:
      - 구매건 상태 → `LISTED` (매칭 대기 상태)
  - [x] 12.5.4 구매건 상태 변경 API 수정
    - `PATCH /api/buyer-request/[id]/status` 수정
    - 상태를 `LISTED`로 변경 시 자동 매칭 로직 실행
    - 매칭 가능한 판매건 검색 (remainingAmount 기준)
  - 결과: 매칭 로직 수정 완료. `remainingAmount` 기반 매칭. 여러 판매건 순차 매칭. `Match` 레코드 생성. 구매건 상태 변경 시 자동 매칭 실행
  - 확인방법:
    - 코드 확인: 매칭 로직에서 `remainingAmount` 사용 확인
    - 코드 확인: `Match` 모델 및 매칭 정보 저장 확인
    - 화면 확인: 구매건을 LISTED로 변경 시 자동 매칭되는지 확인
    - DB 확인: 매칭 후 `remainingAmount` 차감 및 `Match` 레코드 생성 확인
    - 예시 시나리오 테스트:
      - 판매건 1: 가격 700,000원, 신청 5개, 남은 5개
      - 판매건 2: 가격 700,000원, 신청 10개, 남은 10개
      - 구매건 1: 가격 700,000원, 신청 7개, 남은 7개 → LISTED
      - 결과: 판매건 1 남은 0개, 판매건 2 남은 8개, 구매건 1 MATCHED

- [ ] 12.6 거래 그룹 모델 및 거래 취소 기능

  - [x] 12.6.1 거래 그룹 모델 생성

    - `TradeGroup` 모델 추가 (`buyerRequestId`, `totalMatchedAmount`, `totalMatchedPrice`, `status`, `createdAt`, `updatedAt`)
    - 하나의 구매건이 여러 판매건과 매칭된 경우 하나의 거래 그룹으로 묶기
    - 매칭이 일어날 때마다 거래 그룹 생성 또는 기존 그룹에 추가
    - 결과: `TradeGroup` 모델이 `prisma/schema.prisma`에 정의되어 있음. `buyerRequestId`를 unique로 설정하여 하나의 구매건당 하나의 거래 그룹만 존재하도록 함.
    - 확인방법:
      - 코드 확인: `prisma/schema.prisma`에서 `TradeGroup` 모델 확인
      - 코드 확인: `buyerRequestId`가 `@@unique`로 설정되어 있는지 확인

  - [x] 12.6.2 매칭 로직 수정 (거래 그룹 생성)

    - 구매건이 여러 판매건과 매칭될 때:
      - 해당 구매건의 거래 그룹 조회 또는 생성
      - 모든 매칭을 하나의 거래 그룹으로 묶기
      - 거래 그룹에 총 매칭 수량, 총 매칭 가격 저장
    - 결과: `lib/match-requests.ts`의 `matchBuyerRequest` 함수에 거래 그룹 생성/업데이트 로직 추가 완료. 매칭 성공 시 `TradeGroup.upsert`를 사용하여 거래 그룹을 생성하거나 기존 그룹의 `totalMatchedAmount`를 증가시킴. 트랜잭션 내에서 처리하여 데이터 일관성 보장.
    - 확인방법:
      - 코드 확인: `lib/match-requests.ts`에서 `tx.tradeGroup.upsert` 호출 확인
      - 코드 확인: `totalMatchedAmount` 계산 및 저장 로직 확인
      - DB 확인: 매칭 후 `TradeGroup` 테이블에 레코드가 생성되는지 확인
      - DB 확인: 여러 번 매칭 시 `totalMatchedAmount`가 누적되는지 확인

  - [x] 12.6.3 거래 취소 API 생성
    - `POST /api/trade-group/[buyerRequestId]/cancel` 생성
    - 해당 구매건과 연결된 모든 매칭 취소:
      - 모든 `Match` 레코드 조회 (해당 `buyerRequestId`)
      - 각 판매건의 `remainingAmount` 복구
      - 구매건 `remainingAmount` 복구
      - 판매건 상태 → `LISTED` (COMPLETED였던 경우)
      - 구매건 상태 → `LISTED`
      - 모든 `Match` 레코드 삭제
      - 거래 그룹 삭제 또는 상태 변경
    - 결과: `app/api/trade-group/[buyerRequestId]/cancel/route.ts`에 거래 그룹 취소 API 구현 완료. 해당 구매건과 연결된 모든 `Match` 레코드를 조회하여 취소 처리. 각 판매건과 구매건의 `remainingAmount` 복구 및 상태를 `LISTED`로 변경. 모든 `Match` 레코드와 `TradeGroup` 삭제. `allowPartial = true`인 판매건이 있으면 `OrderBookLevel` 동기화. 모든 작업을 트랜잭션으로 처리하여 데이터 일관성 보장.
    - 확인방법:
      - 코드 확인: `app/api/trade-group/[buyerRequestId]/cancel/route.ts` 파일에서 거래 그룹 취소 로직 확인
      - 코드 확인: 트랜잭션 내에서 모든 작업이 처리되는지 확인
      - 코드 확인: `Match` 레코드 삭제 및 `TradeGroup` 삭제 로직 확인
      - API 테스트: POST 요청으로 거래 그룹 취소 시도 → 성공 응답 확인
      - DB 확인: 취소 후 `Match` 레코드가 삭제되었는지 확인
      - DB 확인: 취소 후 `TradeGroup` 레코드가 삭제되었는지 확인
      - DB 확인: 판매건/구매건의 `remainingAmount`와 상태가 복구되었는지 확인

- [x] 12.6.4 어드민 페이지에 거래 취소 버튼 추가

  - 매칭 섹션 하단에 "거래 취소하기" 버튼 추가
  - 거래 그룹별로 취소 버튼 표시
  - 확인 다이얼로그 표시 후 취소 실행
  - 결과: `app/admin/otc/requests/page.tsx`에 거래 그룹별 취소 버튼 추가 완료. 매칭 정보 테이블 아래에 거래 그룹별 취소 섹션 추가. 구매건별로 그룹화하여 각 거래 그룹에 대한 취소 버튼 표시. 거래 그룹 정보(구매건 ID, 이름, 매칭 건수, 총 수량, 가격) 표시. 확인 다이얼로그 후 `POST /api/trade-group/[buyerRequestId]/cancel` API 호출. 취소 성공 시 페이지 새로고침.
  - 확인방법:
    - 코드 확인: `app/admin/otc/requests/page.tsx`에서 `handleTradeGroupCancel` 함수 확인
    - 코드 확인: 거래 그룹별 취소 버튼 렌더링 로직 확인
    - 화면 확인: 어드민 페이지 매칭 섹션 하단에 거래 그룹별 취소 버튼이 표시되는지 확인
    - 화면 확인: 거래 그룹 정보(구매건 ID, 매칭 건수, 총 수량, 가격)가 올바르게 표시되는지 확인
    - 화면 확인: 취소 버튼 클릭 시 확인 다이얼로그가 표시되는지 확인
    - 화면 확인: 취소 성공 후 페이지가 새로고침되고 매칭 정보가 업데이트되는지 확인

- [x] 12.7 매칭 상세 기록 저장

  - [x] 12.7.1 매칭 상세 기록 모델 생성

    - `MatchDetail` 모델 추가 또는 기존 모델에 필드 추가
    - 각 `Match` 레코드에 이미 상세 정보가 포함되어 있으므로, 추가 모델 없이 `Match` 테이블 활용
    - 결과: `Match` 테이블에 이미 매칭 상세 정보가 저장됨. `sellerRequestId`, `buyerRequestId`, `matchedAmount`, `matchedPrice`, `status` 등 모든 필요한 정보가 포함되어 있음. 추가 모델 생성 불필요.
    - 확인방법:
      - 코드 확인: `prisma/schema.prisma`에서 `Match` 모델 확인
      - DB 확인: `Match` 테이블에 매칭 상세 정보가 저장되는지 확인

  - [x] 12.7.2 구매건에 매칭 상세 정보 조회 API

    - `GET /api/buyer-request/[id]/matches` 생성
    - 해당 구매건과 연결된 모든 `Match` 레코드 조회
    - 각 매칭의 판매건 정보 포함
    - 결과: `app/api/buyer-request/[id]/matches/route.ts` 생성 완료. 구매건 ID로 연결된 모든 `Match` 레코드 조회. 각 매칭의 판매건 정보 포함. 구매건 존재 여부 확인 및 에러 처리 포함.
    - 확인방법:
      - 코드 확인: `app/api/buyer-request/[id]/matches/route.ts` 파일 확인
      - API 테스트: `GET /api/buyer-request/[id]/matches` 요청 → 매칭 정보 반환 확인
      - DB 확인: 구매건 ID로 `Match` 레코드 조회되는지 확인

  - [x] 12.7.3 판매건에 매칭 상세 정보 조회 API

    - `GET /api/seller-request/[id]/matches` 생성
    - 해당 판매건과 연결된 모든 `Match` 레코드 조회
    - 각 매칭의 구매건 정보 포함
    - 결과: `app/api/seller-request/[id]/matches/route.ts` 생성 완료. 판매건 ID로 연결된 모든 `Match` 레코드 조회. 각 매칭의 구매건 정보 포함. 판매건 존재 여부 확인 및 에러 처리 포함.
    - 확인방법:
      - 코드 확인: `app/api/seller-request/[id]/matches/route.ts` 파일 확인
      - API 테스트: `GET /api/seller-request/[id]/matches` 요청 → 매칭 정보 반환 확인
      - DB 확인: 판매건 ID로 `Match` 레코드 조회되는지 확인

  - [x] 12.7.4 어드민 페이지 모달에 매칭 상세 정보 표시
    - 거래 그룹별 승인 모달 구현
    - 거래 그룹별 승인 버튼 클릭 시 해당 거래 그룹의 모든 매칭 정보 표시
    - 모달 내용:
      - 구매건 정보 (구매건 ID, 구매자 이름, 연락처)
      - 매칭 정보 목록 (각 매칭의 판매건 ID, 판매자 이름, 연락처, 매칭 수량, 매칭 가격, 총 금액)
      - 요약 정보 (총 매칭 건수, 총 매칭 수량, 매칭 가격)
    - 승인 확인 버튼 클릭 시 일괄 승인 처리
    - 결과: 거래 그룹별 승인 기능 구현 완료. `POST /api/trade-group/[buyerRequestId]/complete` API 생성. 어드민 페이지에 거래 그룹별 승인 버튼 추가. 거래 그룹 승인 모달에서 해당 거래 그룹의 모든 매칭 정보(구매건과 어떤 판매건들이 매칭됐는지, 각각 수량은 몇개씩 매칭됐는지) 표시. 승인 확인 버튼 클릭 시 모든 MATCHED 상태의 Match를 COMPLETED로 일괄 변경. 관련 판매건/구매건 상태도 자동 업데이트.
    - 확인방법:
      - 코드 확인: `app/api/trade-group/[buyerRequestId]/complete/route.ts` 파일 확인
      - 코드 확인: 어드민 페이지의 `handleTradeGroupCompleteClick` 함수 확인
      - 코드 확인: 거래 그룹 승인 모달 렌더링 로직 확인
      - 화면 확인: 거래 그룹별 승인 버튼 클릭 시 모달이 표시되는지 확인
      - 화면 확인: 모달에 구매건 정보, 매칭 정보 목록, 요약 정보가 표시되는지 확인
      - 화면 확인: 승인 확인 버튼 클릭 시 일괄 승인되는지 확인
      - DB 확인: 승인 후 모든 Match 레코드의 status가 COMPLETED로 변경되는지 확인

- [x] 12.7.5 거래 그룹 조회 API 생성

  - `GET /api/trade-group/[buyerRequestId]` 생성
  - 거래 그룹 정보와 함께 관련된 모든 Match 정보 조회
  - 각 Match의 판매건 정보 포함
  - 구매건 정보 포함
  - 결과: `app/api/trade-group/[buyerRequestId]/route.ts` 생성 완료. 거래 그룹 조회 시 `TradeGroup`, `BuyerRequest`, 관련된 모든 `Match` 레코드 및 각 매칭의 판매건 정보를 함께 반환. 거래 그룹의 세부 매칭 정보(어떤 판매건들과 매칭됐는지, 각각 수량은 몇개씩 매칭됐는지)를 조회할 수 있음.
  - 확인방법:
    - 코드 확인: `app/api/trade-group/[buyerRequestId]/route.ts` 파일 확인
    - API 테스트: `GET /api/trade-group/[buyerRequestId]` 요청 → 거래 그룹 정보 및 매칭 정보 반환 확인
    - DB 확인: 거래 그룹 조회 시 관련 Match 레코드가 함께 조회되는지 확인

- [x] 12.7.6 Vercel 빌드 오류 해결 (Prisma Client 생성)

  - `package.json`에 `postinstall` 스크립트 추가
  - `build` 스크립트에 `prisma generate` 추가
  - 결과: `package.json`에 `postinstall: "prisma generate"` 추가 및 `build` 스크립트에 `prisma generate &&` 추가 완료. Vercel 빌드 시 Prisma Client가 자동으로 생성되어 `prisma.buyerRequest`, `prisma.sellerRequest`, `prisma.match`, `prisma.tradeGroup` 등을 사용할 수 있음.
  - 확인방법:
    - 코드 확인: `package.json`에서 `postinstall` 및 `build` 스크립트 확인
    - 빌드 확인: Vercel 빌드가 성공적으로 완료되는지 확인
    - 빌드 확인: TypeScript 오류가 해결되었는지 확인

- [ ] 12.8 판매 등록 확인 모달 (우선순위 높음) 🔺

  - [ ] 12.8.1 상태 변경 모달 표시
    - 판매건 상태를 `PENDING` → `LISTED`로 변경하려 할 때 확인 모달 표시
    - 안내문 텍스트 박스 + “위 내용을 인지시켰습니까?” 체크박스
  - [ ] 12.8.2 QR/지갑 정보 입력 UI
    - QR 코드 영역 표시
    - 공개 지갑 주소 텍스트 노출
    - `{amount} BMB 전송 안내` 문구 포함
    - 판매자 공개주소 입력란 + QR 스캔 버튼
  - [ ] 12.8.3 등록 처리
    - 필수 체크/입력값 검증 후 “등록하기” 버튼 활성화
    - `PATCH /api/seller-request/[id]/status` 호출 시 추가 메타데이터 전달 구조 정의
    - 등록 성공 시 모달 닫기 + 상태 업데이트
  - 결과: (완료 후 작성)
  - 확인방법:
    - 화면 확인: `PENDING → LISTED` 변경 시 모달이 표시되는지 확인
    - 화면 확인: 안내문/체크박스/QR/주소 UI가 올바르게 표시되는지 확인
    - 화면 확인: 필수 입력 후 “등록하기” 버튼이 활성화되는지 확인
    - 코드 확인: 상태 변경 API에 추가 데이터가 전달되는지 확인

- [ ] BACKLOG-신청자용 매칭 정보 조회 기능
  - [ ] BACKLOG-신청 번호 + 전화번호 인증 API
  - [ ] BACKLOG-신청자용 조회 페이지 생성
  - [ ] BACKLOG-매칭 정보 표시
  - 결과: (완료 후 작성)
  - 확인방법:
    - 코드 확인: 신청자용 조회 API 및 페이지 확인
    - 화면 확인: 신청 번호와 전화번호로 조회 가능한지 확인
    - 화면 확인: 매칭 정보가 올바르게 표시되는지 확인

# vibePack 설정 가이드

이 문서는 vibePack의 모든 외부 서비스 설정 방법을 단계별로 안내합니다.

---

## 목차

0. [시작하기 (zip 파일 설치)](#0-시작하기-zip-파일-설치)
1. [Supabase (인증 & 데이터베이스)](#1-supabase-인증--데이터베이스)
2. [데이터베이스 마이그레이션](#2-데이터베이스-마이그레이션)
3. [OAuth 프로바이더](#3-oauth-프로바이더)
   - [Google](#31-google)
   - [GitHub](#32-github)
   - [Kakao](#33-kakao)
   - [Naver](#34-naver)
   - [Apple](#35-apple)
4. [Polar (결제)](#4-polar-결제)
5. [Resend (이메일)](#5-resend-이메일)
6. [Sentry (모니터링)](#6-sentry-모니터링)
7. [Vercel (배포)](#7-vercel-배포)
8. [환경 변수 전체 목록](#8-환경-변수-전체-목록)

---

## 0. 시작하기 (zip 파일 설치)

### 사전 요구사항

시작하기 전에 다음이 설치되어 있는지 확인하세요:

- **Node.js** 18.x 이상 — [다운로드](https://nodejs.org/)
- **pnpm** 10.x — Node.js 설치 후 `corepack enable` 실행하면 자동 활성화
  ```bash
  corepack enable
  ```

### zip 파일 압축 해제

다운로드 받은 `vibepack.zip` 파일을 원하는 디렉토리에 압축 해제합니다.

```bash
# 원하는 위치에 압축 해제
unzip vibepack.zip -d my-project

# 프로젝트 디렉토리로 이동
cd my-project
```

> **macOS/Windows**: 파인더나 탐색기에서 zip 파일을 더블 클릭하여 압축 해제할 수도 있습니다.

### 의존성 설치

```bash
pnpm install
```

### 환경 변수 설정

`.env.example` 파일을 복사하여 `.env.local` 파일을 생성합니다.

```bash
cp .env.example .env.local
```

`.env.local` 파일을 열고, 최소한 다음 값을 채워넣으세요 (Supabase 설정 후):

```env
# 앱 기본 설정
NEXT_PUBLIC_APP_NAME="내 프로젝트 이름"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Supabase (필수 — 아래 섹션 1 참고)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
DATABASE_URL="postgresql://postgres.[project-ref]:[password]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres"
```

> 나머지 환경 변수(결제, 이메일, 모니터링 등)는 해당 서비스를 활성화할 때 추가하면 됩니다.

### 데이터베이스 스키마 적용

Supabase 프로젝트 생성 및 환경 변수 설정이 완료되면:

```bash
pnpm db:push
```

### 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 에 접속하면 vibePack이 실행됩니다.

### Git 초기화 (선택)

새 프로젝트로 시작하려면 기존 git 히스토리를 제거하고 새로 초기화합니다.

```bash
rm -rf .git
git init
git add .
git commit -m "Initial commit from vibePack boilerplate"
```

---

## 1. Supabase (인증 & 데이터베이스)

Supabase는 인증, PostgreSQL 데이터베이스, 파일 스토리지를 제공합니다.

### 프로젝트 생성

1. [Supabase Dashboard](https://supabase.com/dashboard) 접속 → **New Project**
2. Organization 선택 (없으면 생성)
3. 설정:
   - **Name**: 프로젝트 이름
   - **Database Password**: 안전한 비밀번호 설정 (따로 저장해둘 것)
   - **Region**: Northeast Asia (Tokyo) — 한국에서 가장 가까운 리전
4. 프로젝트 생성 완료 대기 (약 2분)

### API 키 확인

1. [Project Settings → API](https://supabase.com/dashboard/project/_/settings/api) 이동
2. 다음 값을 `.env`에 복사:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...    # Project API keys → anon public
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...         # Project API keys → service_role (비밀)
```

### 데이터베이스 연결 문자열

1. [Project Settings → Database](https://supabase.com/dashboard/project/_/settings/database) 이동
2. **ORMs** 탭 선택 → **Drizzle** 선택
3. 표시되는 `DATABASE_URL`을 `.env`에 복사:

```env
# Transaction pooler (port 6543) — 런타임 + 마이그레이션 모두 사용
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres
```

> **참고**: `[password]`를 프로젝트 생성 시 설정한 데이터베이스 비밀번호로 교체하세요.
>
> **왜 Transaction pooler인가?** Vercel 서버리스 환경에서는 함수 호출마다 새 DB 커넥션이 생깁니다. Direct connection(port 5432)을 쓰면 커넥션이 빠르게 고갈되므로, Supavisor pooler(port 6543)를 통해 커넥션을 관리해야 합니다. 이 프로젝트는 `DATABASE_URL` 하나로 런타임과 마이그레이션을 모두 처리하므로, pooler URL 하나로 통일합니다.

### 인증 설정

1. [Authentication → URL Configuration](https://supabase.com/dashboard/project/_/auth/url-configuration) 이동
2. **Site URL**: `http://localhost:3000` (개발) 또는 프로덕션 도메인
3. **Redirect URLs**에 다음 추가:
   - `http://localhost:3000/api/auth/callback`
   - `https://your-domain.com/api/auth/callback` (프로덕션)

### 이메일 템플릿 (선택)

1. [Authentication → Email Templates](https://supabase.com/dashboard/project/_/auth/templates) 이동
2. 필요시 확인 이메일, 비밀번호 재설정 이메일 템플릿 커스터마이징

### 스토리지 버킷 (아바타 업로드용)

1. [Storage](https://supabase.com/dashboard/project/_/storage/buckets) 이동
2. **New Bucket** → 이름: `avatars`, **Public bucket** 체크 → **Create bucket**

> **RLS 정책은 불필요합니다.** 아바타 업로드/삭제는 API Route에서 인증 확인 후 Admin Client(`service_role` 키)로 처리하므로 RLS를 우회합니다. Public bucket이므로 이미지 읽기는 URL로 누구나 가능합니다.

---

## 2. 데이터베이스 마이그레이션

Supabase 프로젝트 생성 후 스키마를 적용합니다.

```bash
# 스키마를 데이터베이스에 푸시
pnpm db:push

# 또는 마이그레이션 파일 생성 후 적용
pnpm db:generate
```

### 테이블 구조

| 테이블 | 설명 |
|--------|------|
| `users` | 사용자 프로필 (supabase_user_id로 Supabase Auth와 연결) |
| `subscriptions` | 구독 정보 (Polar 연동) |
| `payments` | 결제 내역 (Polar 연동) |

---

## 3. OAuth 프로바이더

OAuth 설정은 **Supabase 대시보드에서** 각 프로바이더의 Client ID/Secret을 등록하는 방식입니다.

모든 프로바이더의 **Callback URL** (Supabase에 입력):
```
https://<project-ref>.supabase.co/auth/v1/callback
```

> 이 값은 Supabase Dashboard → Authentication → Providers에서 각 프로바이더 설정 시 표시됩니다.

---

### 3.1 Google

**콘솔**: [Google Cloud Console](https://console.cloud.google.com/apis/credentials)

1. 프로젝트 선택 (없으면 생성)
2. **OAuth 동의 화면 구성** (최초 1회):
   - [Google 인증 플랫폼 → 브랜딩](https://console.cloud.google.com/auth/branding) 이동
   - **앱 이름**: 프로젝트 이름
   - **사용자 지원 이메일**: 본인 이메일
   - **대상**: 외부(External)
   - 나머지 기본값 → 저장
3. **사용자 인증 정보** → **사용자 인증 정보 만들기** → **OAuth 클라이언트 ID**
4. 애플리케이션 유형: **웹 애플리케이션**
5. **승인된 리디렉션 URI** 추가:
   - `https://<project-ref>.supabase.co/auth/v1/callback`
6. 생성된 Client ID, Client Secret 저장

**Supabase 설정**:
1. [Authentication → Providers → Google](https://supabase.com/dashboard/project/_/auth/providers) 이동
2. **Enable Google provider** 활성화
3. Client ID, Client Secret 입력
4. 저장

```env
GOOGLE_CLIENT_ID=123456789-xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxx
```

---

### 3.2 GitHub

**콘솔**: [GitHub Developer Settings → OAuth Apps](https://github.com/settings/developers)

1. **New OAuth App** 클릭
2. 설정:
   - **Application name**: 앱 이름
   - **Homepage URL**: `http://localhost:3000` 또는 프로덕션 URL
   - **Authorization callback URL**: `https://<project-ref>.supabase.co/auth/v1/callback`
3. **Register application** 클릭
4. Client ID 확인 → **Generate a new client secret** 클릭

**Supabase 설정**:
1. [Authentication → Providers → GitHub](https://supabase.com/dashboard/project/_/auth/providers) 이동
2. Enable → Client ID, Client Secret 입력 → 저장

```env
GITHUB_CLIENT_ID=Iv1.xxxxxxxxxxxx
GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxx
```

---

### 3.3 Kakao

**콘솔**: [Kakao Developers](https://developers.kakao.com/console/app)

1. **애플리케이션 추가하기** 클릭
2. 앱 이름, 사업자명 입력 → 저장
3. **앱 키** 탭에서 **REST API 키** 확인 (= Client ID)
4. **제품 설정 → 카카오 로그인** 이동:
   - **활성화 설정**: ON
   - **Redirect URI**: `https://<project-ref>.supabase.co/auth/v1/callback`
5. **제품 설정 → 카카오 로그인 → 동의항목**:
   - 닉네임: 필수 동의
   - 프로필 사진: 선택 동의
   - 이메일: 필수 동의 (비즈 앱 전환 필요할 수 있음)
6. **앱 키 → 보안** 탭에서 **Client Secret** 생성 → 활성화

**Supabase 설정**:
1. [Authentication → Providers → Kakao](https://supabase.com/dashboard/project/_/auth/providers) 이동
2. Enable → Client ID (REST API 키), Client Secret 입력 → 저장

```env
KAKAO_CLIENT_ID=xxxxxxxxxxxxxxxxxxxxxxxx
KAKAO_CLIENT_SECRET=xxxxxxxxxxxxxxxx
```

---

### 3.4 Naver

**콘솔**: [Naver Developers](https://developers.naver.com/apps/#/register)

1. **애플리케이션 등록** 클릭
2. 설정:
   - **애플리케이션 이름**: 앱 이름
   - **사용 API**: 네이버 로그인 선택
   - **제공 정보**: 이메일 (필수), 이름 (필수), 프로필 사진 (선택)
   - **서비스 환경**: PC 웹
   - **서비스 URL**: `http://localhost:3000`
   - **Callback URL**: `https://<project-ref>.supabase.co/auth/v1/callback`
3. 등록 완료 후 **Client ID**, **Client Secret** 확인

**Supabase 설정**:
1. Supabase는 Naver를 기본 지원하지 않으므로 **Custom OIDC Provider**로 등록하거나, Supabase의 서드파티 프로바이더 설정을 확인하세요.
2. [Supabase Naver Auth 문서](https://supabase.com/docs/guides/auth/social-login) 참고

```env
NAVER_CLIENT_ID=xxxxxxxxxxxxxxxx
NAVER_CLIENT_SECRET=xxxxxxxxxxxxxxxx
```

---

### 3.5 Apple

**콘솔**: [Apple Developer → Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list)

> Apple Developer Program 멤버십 필요 (연 $99)

1. **Identifiers** → **App IDs** 등록 (Sign in with Apple 활성화)
2. **Services IDs** 등록:
   - Identifier: 번들 ID 형식 (예: `com.yourapp.web`)
   - **Sign in with Apple** 활성화 → Configure:
     - **Domains**: `<project-ref>.supabase.co`
     - **Return URLs**: `https://<project-ref>.supabase.co/auth/v1/callback`
3. **Keys** → 새 키 생성:
   - **Sign in with Apple** 체크
   - 키 다운로드 (.p8 파일) — **한 번만 다운로드 가능**
4. 필요한 값:
   - **Service ID** (위에서 만든 Services ID의 Identifier)
   - **Key ID** (생성한 키의 ID)
   - **Team ID** (Apple Developer 계정 → Membership에서 확인)
   - **Private Key** (.p8 파일 내용)

**Supabase 설정**:
1. [Authentication → Providers → Apple](https://supabase.com/dashboard/project/_/auth/providers) 이동
2. Enable → Service ID, Secret Key 입력 → 저장
3. Secret Key는 JWT 형식으로 생성 필요 — [Supabase Apple Auth 문서](https://supabase.com/docs/guides/auth/social-login/auth-apple) 참고

```env
APPLE_SERVICE_ID=com.yourapp.web
APPLE_KEY_ID=XXXXXXXXXX
APPLE_TEAM_ID=XXXXXXXXXX
APPLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIGT...\n-----END PRIVATE KEY-----"
```

---

## 4. Polar (결제)

Polar는 구독 및 일회성 결제를 처리합니다.

**대시보드**: [Polar Dashboard](https://polar.sh/dashboard)

### 계정 및 조직 설정

1. [Polar](https://polar.sh) 접속 → 회원가입/로그인
2. **Organization** 생성 (또는 기존 조직 선택)
3. Organization ID 확인: Settings → 조직 정보에서 ID 복사

### API 토큰 생성

1. [Polar Settings → Developers](https://polar.sh/dashboard/settings) 이동
2. **Personal Access Token** 또는 **Organization Access Token** 생성
3. 필요한 스코프:
   - `products:read` — 상품/플랜 조회
   - `checkouts:read` — 결제 세션 조회
   - `checkouts:write` — 결제 세션 생성
   - `subscriptions:read` — 구독 상태 조회
   - `subscriptions:write` — 구독 취소/재개
   - `orders:read` — 결제 완료 내역 조회

### 상품(Product) 생성

1. [Polar Dashboard → Products](https://polar.sh/dashboard) 이동
2. **Pro 플랜** 생성:
   - 이름, 설명, 가격 설정
   - 생성 후 Product ID 복사
3. **Enterprise 플랜** 생성:
   - 동일하게 설정
   - 생성 후 Product ID 복사

### 웹훅 설정

1. [Polar Dashboard → Settings → Webhooks](https://polar.sh/dashboard/settings) 이동
2. **Add Endpoint** 클릭:
   - **URL**: `https://your-domain.com/api/payments/webhook`
   - **Events** (8개 모두 체크):
     - `checkout.created` — 결제 시작 기록
     - `checkout.updated` — 결제 상태 변경 (완료 처리)
     - `subscription.created` — 구독 생성 + 확인 이메일 발송
     - `subscription.updated` — 구독 정보 변경 (기간, 상태)
     - `subscription.active` — 구독 활성화
     - `subscription.canceled` — 구독 취소
     - `subscription.revoked` — 구독 철회 (즉시 종료/환불)
     - `order.created` — 일회성 결제 완료
3. 생성 후 **Webhook Secret** 복사

### 환경 변수

```env
POLAR_ACCESS_TOKEN=polar_at_xxxxxxxxxxxxx
POLAR_ORGANIZATION_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
POLAR_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
NEXT_PUBLIC_POLAR_PRO_PRODUCT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
NEXT_PUBLIC_POLAR_ENTERPRISE_PRODUCT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

> **개발 환경**: Polar Sandbox 모드를 사용하면 실제 결제 없이 테스트 가능합니다. [Polar Sandbox 문서](https://docs.polar.sh/sandbox) 참고.

---

## 5. Resend (이메일)

Resend는 트랜잭션 이메일(환영 메일, 비밀번호 재설정 등)을 발송합니다.

**대시보드**: [Resend Dashboard](https://resend.com/overview)

### 계정 설정

1. [Resend](https://resend.com) 접속 → 회원가입
2. [API Keys](https://resend.com/api-keys) → **Create API Key**
3. 권한: **Sending access** (Full access 불필요)
4. API Key 복사 (한 번만 표시됨)

### 도메인 인증

1. [Domains](https://resend.com/domains) → **Add Domain**
2. 도메인 입력 (예: `yourdomain.com`)
3. 표시되는 DNS 레코드를 도메인 DNS에 추가:
   - **MX** 레코드
   - **TXT** 레코드 (SPF)
   - **CNAME** 레코드 (DKIM)
4. **Verify** 클릭 → 인증 완료 대기

> **개발 환경**: 도메인 인증 없이도 `onboarding@resend.dev`로 본인 이메일에 테스트 발송 가능 (무료 플랜 제한).

### 환경 변수

```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

### 이메일 템플릿 미리보기

```bash
pnpm email:dev
# http://localhost:3000 에서 이메일 템플릿 미리보기
```

프로젝트에 포함된 이메일 템플릿:
- `welcome.tsx` — 회원가입 환영 메일
- `reset-password.tsx` — 비밀번호 재설정
- `magic-link.tsx` — 매직 링크 로그인
- `otp.tsx` — OTP 인증 코드
- `subscription.tsx` — 구독 상태 변경 알림

---

## 6. Sentry (모니터링)

Sentry는 에러 트래킹과 성능 모니터링을 제공합니다.

**대시보드**: [Sentry Dashboard](https://sentry.io)

### 프로젝트 생성

1. [Sentry](https://sentry.io) 접속 → 회원가입/로그인
2. **Create Project** → Platform: **Next.js** 선택
3. 프로젝트 이름 입력 → **Create Project**

### DSN 확인

1. [Project Settings → Client Keys (DSN)](https://sentry.io/settings/projects/) 이동
2. **DSN** 값 복사

### Auth Token 생성 (소스맵 업로드용)

1. [Auth Tokens](https://sentry.io/settings/auth-tokens/) 이동
2. **Create New Token**:
   - Scopes: `project:releases`, `org:read`
3. 토큰 복사

### 환경 변수

```env
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@o123456.ingest.sentry.io/123456
SENTRY_AUTH_TOKEN=sntrys_xxxxxxxxxxxxx
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
```

---

## 7. Vercel (배포)

**대시보드**: [Vercel Dashboard](https://vercel.com/dashboard)

### 프로젝트 연결

1. [Vercel](https://vercel.com) 접속 → 로그인
2. **Add New Project** → GitHub 리포지토리 연결
3. **Framework Preset**: Next.js (자동 감지됨)
4. **Root Directory**: `.` (기본값)
5. **Build Command**: `pnpm build` (자동 감지됨)

### 환경 변수 설정

1. [Project Settings → Environment Variables](https://vercel.com/docs/environment-variables) 이동
2. 이 문서의 [환경 변수 전체 목록](#8-환경-변수-전체-목록)에 있는 모든 변수 추가
3. 환경별(Production, Preview, Development) 값을 다르게 설정 가능

### 리전 설정

`vercel.json`에 이미 `icn1` (인천) 리전이 설정되어 있습니다. 다른 리전이 필요하면 수정하세요.

### 도메인 연결

1. [Project Settings → Domains](https://vercel.com/docs/custom-domains) 이동
2. 커스텀 도메인 추가
3. DNS 설정: Vercel이 안내하는 A 레코드 또는 CNAME 추가

### 배포 후 체크리스트

- [ ] Supabase **Site URL**을 프로덕션 도메인으로 변경
- [ ] Supabase **Redirect URLs**에 프로덕션 콜백 URL 추가
- [ ] OAuth 프로바이더들의 Redirect URI에 프로덕션 콜백 URL 추가
- [ ] Polar Webhook URL을 프로덕션 URL로 변경
- [ ] `NEXT_PUBLIC_APP_URL`을 프로덕션 도메인으로 설정

---

## 8. 환경 변수 전체 목록

### 필수 (항상)

| 변수 | 설명 | 얻는 곳 |
|------|------|---------|
| `NEXT_PUBLIC_APP_NAME` | 앱 이름 | 직접 설정 |
| `NEXT_PUBLIC_APP_URL` | 앱 URL | 직접 설정 (`http://localhost:3000`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | [Supabase → Settings → API](https://supabase.com/dashboard/project/_/settings/api) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon 키 | 위와 동일 |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role 키 | 위와 동일 |
| `DATABASE_URL` | PostgreSQL 연결 문자열 | [Supabase → Settings → Database](https://supabase.com/dashboard/project/_/settings/database) |

### 결제 (Polar 활성화 시)

| 변수 | 설명 | 얻는 곳 |
|------|------|---------|
| `POLAR_ACCESS_TOKEN` | Polar API 토큰 | [Polar → Settings](https://polar.sh/dashboard/settings) |
| `POLAR_ORGANIZATION_ID` | Polar 조직 ID | Polar 조직 설정 |
| `POLAR_WEBHOOK_SECRET` | Polar 웹훅 시크릿 | Polar 웹훅 설정 시 발급 |
| `NEXT_PUBLIC_POLAR_PRO_PRODUCT_ID` | Pro 플랜 상품 ID | Polar 상품 생성 후 |
| `NEXT_PUBLIC_POLAR_ENTERPRISE_PRODUCT_ID` | Enterprise 플랜 상품 ID | Polar 상품 생성 후 |

### 이메일 (Resend 활성화 시)

| 변수 | 설명 | 얻는 곳 |
|------|------|---------|
| `RESEND_API_KEY` | Resend API 키 | [Resend → API Keys](https://resend.com/api-keys) |
| `RESEND_FROM_EMAIL` | 발신 이메일 주소 | 인증된 도메인 기반 설정 |

### 모니터링 (Sentry)

| 변수 | 설명 | 얻는 곳 |
|------|------|---------|
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN | [Sentry → Project Settings → Client Keys](https://sentry.io/settings/) |
| `SENTRY_AUTH_TOKEN` | Sentry 인증 토큰 | [Sentry → Auth Tokens](https://sentry.io/settings/auth-tokens/) |
| `SENTRY_ORG` | Sentry 조직 slug | Sentry 대시보드 URL에서 확인 |
| `SENTRY_PROJECT` | Sentry 프로젝트 slug | Sentry 프로젝트 설정 |

### OAuth (선택한 프로바이더별)

| 프로바이더 | 변수 | 얻는 곳 |
|-----------|------|---------|
| Google | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) |
| GitHub | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | [GitHub Developer Settings](https://github.com/settings/developers) |
| Kakao | `KAKAO_CLIENT_ID`, `KAKAO_CLIENT_SECRET` | [Kakao Developers](https://developers.kakao.com/console/app) |
| Naver | `NAVER_CLIENT_ID`, `NAVER_CLIENT_SECRET` | [Naver Developers](https://developers.naver.com/apps/) |
| Apple | `APPLE_SERVICE_ID`, `APPLE_KEY_ID`, `APPLE_TEAM_ID`, `APPLE_PRIVATE_KEY` | [Apple Developer](https://developer.apple.com/account/resources/identifiers/list) |

---

## 빠른 시작 체크리스트

### 최소 설정 (개발 환경)

- [ ] Supabase 프로젝트 생성
- [ ] `.env`에 Supabase URL, Anon Key, Service Role Key, DATABASE_URL 설정
- [ ] `pnpm install`
- [ ] `pnpm db:push`
- [ ] `pnpm dev`

### 전체 기능 활성화

- [ ] Supabase 프로젝트 생성 및 API 키 설정
- [ ] 데이터베이스 마이그레이션 (`pnpm db:push`)
- [ ] 사용할 OAuth 프로바이더 설정 (각 콘솔에서 앱 등록 → Supabase에 연동)
- [ ] Polar 계정 생성 → 상품 생성 → 웹훅 설정
- [ ] Resend 계정 생성 → 도메인 인증 → API 키 발급
- [ ] Sentry 프로젝트 생성 → DSN 및 Auth Token 설정
- [ ] 모든 환경 변수 `.env`에 입력
- [ ] `pnpm dev`로 로컬 테스트
- [ ] Vercel에 배포 → 환경 변수 설정 → 프로덕션 URL로 서비스 콜백 업데이트

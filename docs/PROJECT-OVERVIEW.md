# vibePack 프로젝트 종합 분석서

> Next.js 기반 SaaS 보일러플레이트 — 인증, 결제, 이메일, 모니터링, 다국어(i18n)를 포함한 풀스택 프로젝트

---

## 목차

1. [기술 스택](#1-기술-스택)
2. [프로젝트 구조 (Feature-Sliced Design)](#2-프로젝트-구조-feature-sliced-design)
3. [라우팅 및 라우트 가드](#3-라우팅-및-라우트-가드)
4. [인증 시스템](#4-인증-시스템)
5. [결제 시스템 (Polar)](#5-결제-시스템-polar)
6. [데이터베이스 스키마](#6-데이터베이스-스키마)
7. [다국어 (i18n)](#7-다국어-i18n)
8. [테마 시스템](#8-테마-시스템)
9. [이메일 시스템](#9-이메일-시스템)
10. [데이터 페칭 (SWR)](#10-데이터-페칭-swr)
11. [위젯 및 UI 컴포넌트](#11-위젯-및-ui-컴포넌트)
12. [콘텐츠 시스템 (MDX)](#12-콘텐츠-시스템-mdx)
13. [Provider 구성](#13-provider-구성)
14. [API 응답 형식](#14-api-응답-형식)
15. [테스팅](#15-테스팅)
16. [주요 설정 파일](#16-주요-설정-파일)

---

## 1. 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 16+ (App Router), React 19, TypeScript 5.x (strict) |
| 스타일링 | Tailwind CSS 3.x (class 기반 다크모드), shadcn/ui |
| 데이터베이스 | PostgreSQL 15 (Supabase), Drizzle ORM |
| 인증 | Supabase Auth (이메일/비밀번호, 소셜 OAuth, 매직 링크, OTP) |
| 결제 | Polar SDK (구독 + 일회성) |
| 이메일 | Resend + React Email 템플릿 |
| 데이터 페칭 | SWR 2.x |
| 폼 | react-hook-form 7.x + Zod 검증 |
| 다국어 | next-intl (ko 기본, en), URL 기반 로케일 |
| 테마 | next-themes (light/dark/system) |
| 테스팅 | Vitest + React Testing Library, Playwright |
| 모니터링 | Sentry |
| 배포 | Vercel (region: icn1) |

---

## 2. 프로젝트 구조 (Feature-Sliced Design)

FSD 아키텍처를 따르며, **상위 레이어 → 하위 레이어**로만 import 가능 (역방향 불가).

```
src/
├── app/            → Next.js App Router (레이아웃, 라우트 그룹, API 라우트)
├── pages/          → 페이지 컴포지션 (서버 컴포넌트)
├── widgets/        → 자립형 UI 블록 (header, footer, sidebar, landing 등)
├── features/       → 사용자 시나리오 (auth/login, auth/register, settings 등)
├── entities/       → 비즈니스 모델 (user, subscription, payment)
├── shared/         → 재사용 기반 (ui, api, config, lib, providers, types, hooks)
├── db/             → Drizzle 스키마 & 마이그레이션
├── i18n/           → next-intl 설정, 라우팅, 네비게이션 헬퍼
└── content/        → MDX 블로그 및 법률 페이지
```

### 슬라이스 내부 구조

```
slice-name/
├── index.ts        # 공개 API (barrel export)
├── ui/             # 컴포넌트
├── model/          # 비즈니스 로직, 훅, 상태
├── api/            # API 호출
├── lib/            # 유틸리티
└── config/         # 설정
```

### 경로 별칭

```
@/app/*  @/pages/*  @/widgets/*  @/features/*  @/entities/*  @/shared/*  @/db/*  @/content/*  @/i18n/*
```

---

## 3. 라우팅 및 라우트 가드

### 라우트 그룹 구조

```
src/app/[locale]/
├── (marketing)/    → 공개 페이지 (Header + Footer 레이아웃)
│   ├── page.tsx          → / (랜딩)
│   ├── pricing/          → /pricing
│   ├── blog/             → /blog, /blog/[slug]
│   └── legal/            → /legal/terms, /legal/privacy
│
├── (auth)/         → 인증 페이지 (중앙 정렬, max-w-md)
│   ├── login/            → /login
│   ├── register/         → /register
│   ├── forgot-password/  → /forgot-password
│   ├── reset-password/   → /reset-password
│   ├── magic-link/       → /magic-link
│   ├── otp/              → /otp
│   └── verify-email/     → /verify-email
│
└── (dashboard)/    → 보호된 페이지 (TopBar 레이아웃, 인증 필수)
    ├── dashboard/        → /dashboard
    └── dashboard/settings/
        ├── profile/      → /dashboard/settings/profile
        └── account/      → /dashboard/settings/account
```

### 미들웨어 동작 흐름 (`src/middleware.ts`)

요청이 들어오면 다음 순서로 처리됩니다:

```
요청 수신
  │
  ▼
[Step 1] next-intl 미들웨어 실행
  │  → 로케일 감지 및 URL 프리픽스 처리
  │  → 예: / → /ko/ (기본 로케일로 리다이렉트)
  │  → 리다이렉트 발생 시 즉시 반환
  │
  ▼
[Step 2] Supabase 세션 갱신
  │  → updateSession(request) 호출
  │  → 쿠키에서 토큰 읽고 getUser()로 서버에서 재검증
  │  → (getSession() 대신 getUser() 사용 — 토큰 위조 방지)
  │  → 새 세션 쿠키 설정
  │
  ▼
[Step 3] 경로에서 로케일 프리픽스 제거
  │  → 예: /ko/dashboard → /dashboard
  │
  ▼
[Step 4] 보호된 경로 검증 (/dashboard, /settings)
  │  ├── 미인증 사용자 → /login으로 리다이렉트 (redirectTo 쿼리 포함)
  │  └── 이메일 미확인 사용자 → /verify-email로 리다이렉트
  │
  ▼
[Step 5] 인증 경로 검증 (/login, /register 등)
     ├── 인증된 사용자 + /verify-email + 이메일 미확인 → 접근 허용
     └── 인증된 사용자 + 기타 인증 경로 → /dashboard로 리다이렉트
```

### 이중 보호: 대시보드 레이아웃

미들웨어 외에 대시보드 레이아웃(`(dashboard)/layout.tsx`)에서도 서버 사이드로 재확인합니다:

```typescript
// 서버 컴포넌트에서 다시 확인
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) redirect("/login");
```

### 라우트 접근 규칙 요약

| 경로 그룹 | 미인증 사용자 | 인증 + 이메일 미확인 | 인증 + 이메일 확인 |
|-----------|-------------|--------------------|--------------------|
| (marketing) | 접근 가능 | 접근 가능 | 접근 가능 |
| (auth) | 접근 가능 | verify-email만 접근 | /dashboard로 리다이렉트 |
| (dashboard) | /login으로 리다이렉트 | /verify-email로 리다이렉트 | 접근 가능 |

---

## 4. 인증 시스템

Supabase Auth를 기반으로 6가지 인증 방식을 지원합니다.

### 4.1 Supabase 클라이언트 구성

| 클라이언트 | 파일 | 용도 |
|-----------|------|------|
| Browser Client | `src/shared/api/supabase/client.ts` | 클라이언트 컴포넌트에서 OAuth, 매직 링크, OTP 처리 |
| Server Client | `src/shared/api/supabase/server.ts` | 서버 액션/라우트에서 인증 확인 |
| Admin Client | `src/shared/api/supabase/server.ts` | 서비스 역할 키 사용 (사용자 삭제, 생성 등) |
| Middleware Client | `src/shared/api/supabase/middleware.ts` | 미들웨어에서 토큰 재검증 |

### 4.2 이메일/비밀번호 로그인

```
LoginForm → useLogin() → POST /api/auth/login
```

1. Zod 스키마로 입력 검증
2. 레이트 제한 확인 (15분당 10회)
3. `supabase.auth.signInWithPassword()` 호출
4. 세션 쿠키 자동 설정
5. 성공 → `/dashboard`로 리다이렉트

### 4.3 회원가입

```
RegisterForm → useRegister() → POST /api/auth/register
```

1. Zod 스키마로 입력 검증
2. `supabase.auth.signUp()` — 확인 이메일 발송
3. DB에 사용자 프로필 생성
4. DB 삽입 실패 시 Admin 클라이언트로 Supabase 사용자 롤백
5. 환영 이메일 발송 (fire-and-forget)
6. 성공 → `/verify-email`로 리다이렉트

### 4.4 소셜 로그인 (OAuth)

```
SocialLoginButtons → window.location.href = /api/auth/social/{provider}
```

**지원 프로바이더**: Google, GitHub, Kakao, Naver, Apple

**OAuth 흐름**:
1. `GET /api/auth/social/[provider]` — 프로바이더 검증
2. `supabase.auth.signInWithOAuth()` — OAuth 프로바이더로 리다이렉트
3. 사용자가 인증 완료
4. 콜백 URL로 리다이렉트: `/api/auth/callback?code=...`
5. `exchangeCodeForSession(code)` — 세션 설정
6. DB에 사용자 upsert (신규: 생성 / 기존: 메타데이터 업데이트)
7. `/dashboard`로 리다이렉트

### 4.5 매직 링크

```
MagicLinkForm → useMagicLink() → POST /api/auth/magic-link
```

1. Zod 검증 + 레이트 제한 (시간당 5회)
2. `supabase.auth.signInWithOtp()` — 이메일 링크 발송
3. 항상 성공 응답 (이메일 열거 방지)
4. 사용자가 이메일 링크 클릭 → `/api/auth/callback` → `/dashboard`

**만료 시간**: 10분

### 4.6 OTP (일회용 비밀번호)

**2단계 흐름**:

```
[Step 1] OTPForm (send) → POST /api/auth/otp/send
  → 레이트 제한: 15분당 5회
  → supabase.auth.signInWithOtp() (코드 모드)

[Step 2] OTPForm (verify) → POST /api/auth/otp/verify
  → 6자리 코드 입력
  → supabase.auth.verifyOtp() (type: 'email')
  → 레이트 제한: 5분당 3회
  → 성공 → /dashboard
```

**설정**: 6자리, 5분 만료, 최대 3회 시도

### 4.7 비밀번호 재설정

```
[Step 1] ForgotPasswordForm → POST /api/auth/forgot-password
  → 레이트 제한: 시간당 5회
  → supabase.auth.resetPasswordForEmail()
  → 항상 성공 응답

[Step 2] 이메일 링크 클릭 → /api/auth/callback → /reset-password
  → ResetPasswordForm → POST /api/auth/reset-password
  → supabase.auth.updateUser({ password })
  → 성공 → /login
```

**만료 시간**: 1시간

### 4.8 이메일 확인

1. 회원가입 시 Supabase가 확인 이메일 자동 발송
2. 이메일 링크 클릭 → `/api/auth/callback` → `email_confirmed_at` 설정
3. 미확인 사용자는 보호 경로 접근 시 `/verify-email`로 리다이렉트
4. 재발송: `POST /api/auth/resend-verification` (15분당 5회)

### 4.9 보안 기능

| 보안 기능 | 구현 |
|----------|------|
| 레이트 제한 | 로그인 15분/10회, 매직링크 1시간/5회, OTP발송 15분/5회, OTP검증 5분/3회 |
| 이메일 열거 방지 | 항상 200 OK 반환 (계정 존재 여부 노출 방지) |
| 토큰 보안 | httpOnly 쿠키만 사용, 응답 본문에 토큰 미포함 |
| 세션 검증 | `getUser()` 사용 — 매번 서버에서 재검증 |
| 입력 검증 | Zod 스키마 + 이메일 정규화 (소문자) |

---

## 5. 결제 시스템 (Polar)

### 5.1 요금제 구성

| 플랜 | 월간 | 연간 | API 호출 | 스토리지 |
|------|------|------|---------|---------|
| Free | 0원 | 0원 | 100/월 | 100 MB |
| Pro | 19,000원 | 190,000원 | 10,000/월 | 10 GB |
| Enterprise | 99,000원 | 990,000원 | 무제한 | 무제한 |

설정 파일: `src/entities/subscription/config/plans.ts`

### 5.2 결제 전체 흐름

```
┌─────────────────────────────────────────────┐
│              결제 전체 흐름                    │
└─────────────────────────────────────────────┘

[1] 클라이언트: POST /api/payments/checkout
    Body: { planId: 'pro'|'enterprise', interval: 'monthly'|'yearly' }
         │
         ▼
[2] 서버: 인증 확인 → 플랜 검증 → Polar API checkouts.create()
    Metadata: { userId, planId, interval }
         │
         ▼
[3] 응답: { checkoutUrl } → 사용자를 Polar 결제 페이지로 리다이렉트
         │
         ▼
[4] 사용자가 Polar에서 결제 완료
         │
         ▼
[5] Webhook: checkout.created → payments 레코드 생성 (status: pending)
         │
         ▼
[6] Webhook: checkout.updated → 결제 상태 'completed'로 업데이트
         │
         ▼
[7] Webhook: subscription.created
    → subscriptions 레코드 생성 (status: active)
    → 구독 확인 이메일 발송
         │
         ▼
[8] 클라이언트: GET /api/payments/subscription → 구독 정보 조회
    useSubscription() 훅으로 자동 갱신
```

### 5.3 구독 관리

`POST /api/payments/subscription`으로 다음 액션 수행:

| 액션 | 설명 | Polar API |
|------|------|-----------|
| `cancel` | 기간 종료 후 취소 | `subscriptions.update({ cancelAtPeriodEnd: true })` |
| `resume` | 취소 철회 | `subscriptions.update({ cancelAtPeriodEnd: false })` |
| `change_plan` | 플랜 변경 | `subscriptions.update({ productId: newPlan })` |

### 5.4 Webhook 이벤트 처리

| 이벤트 | 처리 내용 |
|--------|----------|
| `checkout.created` | 결제 레코드 생성 (pending) |
| `checkout.updated` | 결제 상태 업데이트 (completed) |
| `subscription.created` | 구독 레코드 생성 + 확인 이메일 |
| `subscription.updated` | 구독 상태/기간 업데이트 |
| `subscription.active` | 상태 → active |
| `subscription.canceled` | 상태 → canceled, cancelAtPeriodEnd = true |
| `subscription.revoked` | 상태 → canceled, 기간 날짜 초기화 |
| `order.created` | 결제 레코드 생성 (completed) |

---

## 6. 데이터베이스 스키마

Drizzle ORM으로 관리되며, Supabase PostgreSQL을 사용합니다.

### 6.1 ERD

```
┌──────────────────┐
│      users       │
├──────────────────┤
│ id (PK, uuid)    │
│ supabaseUserId   │  ← Supabase Auth 연동
│ email (unique)   │
│ name             │
│ avatarUrl        │
│ locale ('ko'|'en')│
│ createdAt        │
│ updatedAt        │
└──────────────────┘
         │
         │ 1:N
         ├─────────────────────┐
         │                     │
         ▼                     ▼
┌──────────────────┐  ┌──────────────────┐
│  subscriptions   │  │    payments      │
├──────────────────┤  ├──────────────────┤
│ id (PK, uuid)    │  │ id (PK, uuid)    │
│ userId (FK)      │  │ userId (FK)      │
│ polarSubscriptionId│ │ polarPaymentId   │
│ polarCustomerId  │  │ amount (integer) │
│ planId           │  │ currency ('KRW') │
│ status (enum)    │  │ status (enum)    │
│ currentPeriodStart│ │ description      │
│ currentPeriodEnd │  │ metadata (JSON)  │
│ cancelAtPeriodEnd│  │ createdAt        │
│ createdAt        │  └──────────────────┘
│ updatedAt        │
└──────────────────┘
```

### 6.2 Enum 값

```typescript
// 구독 상태
subscription_status: 'active' | 'canceled' | 'past_due' | 'unpaid' | 'incomplete' | 'trialing'

// 결제 상태
payment_status: 'pending' | 'completed' | 'failed' | 'refunded'
```

### 6.3 DB 연결 설정

```typescript
// src/db/client.ts
const db = drizzle(postgres(DATABASE_URL), { schema });

// Vercel 서버리스 환경 최적화
// max: 1, idle_timeout: 20s, connect_timeout: 10s
// 프로덕션에서는 Supabase 커넥션 풀러 (포트 6543) 사용
```

---

## 7. 다국어 (i18n)

### 7.1 설정

| 항목 | 값 |
|------|-----|
| 라이브러리 | next-intl |
| 지원 언어 | 한국어 (ko, 기본), 영어 (en) |
| URL 형식 | `/ko/...`, `/en/...` (항상 로케일 프리픽스) |
| 로케일 감지 | 자동 (브라우저 기반) |

### 7.2 파일 구조

```
src/i18n/
├── config.ts       → locales = ["ko", "en"], defaultLocale = "ko"
├── routing.ts      → defineRouting({ localePrefix: "always", localeDetection: true })
├── request.ts      → 서버 사이드 번역 로드
└── navigation.ts   → 로케일 인식 Link, redirect, usePathname, useRouter

public/locales/
├── ko/common.json  → 한국어 번역 (342+ 키)
└── en/common.json  → 영어 번역
```

### 7.3 사용법

```typescript
// 클라이언트 컴포넌트
"use client";
const t = useTranslations("auth.login");
// → t("title"), t("email"), t("password")

// 서버 컴포넌트
const t = await getTranslations("auth.login");

// 로케일 인식 네비게이션
import { Link, useRouter, usePathname, redirect } from "@/i18n/navigation";
```

### 7.4 번역 키 구조

```
common.*        → 로딩, 에러, 재시도, 페이지네이션
nav.*           → 메뉴 항목
auth.*          → 로그인, 회원가입, 비밀번호, 매직 링크, OTP, 소셜 인증, 이메일 확인
locale.*        → 언어 이름
footer.*        → 저작권, 링크
legal.*         → 이용약관, 개인정보처리방침
theme.*         → 라이트/다크/시스템
dashboard.*     → 환영 메시지, 통계, 액션
settings.*      → 프로필, 아바타, 비밀번호, 연동 계정
landing.*       → 히어로, 기능, 사용법, 후기, CTA
blog.*          → 포스트 목록, 카테고리, 태그
pricing.*       → 플랜, 결제, FAQ
```

---

## 8. 테마 시스템

### 8.1 설정

- **라이브러리**: next-themes
- **방식**: `class` 기반 (`<html>` 요소에 `.dark` 클래스 토글)
- **기본 테마**: system (시스템 설정 따름)
- **전환 애니메이션**: 비활성화 (`disableTransitionOnChange: true`)

### 8.2 CSS 변수 (시맨틱 토큰)

```css
/* 라이트 모드 */
--background: 0 0% 100%;        /* 흰색 */
--foreground: 0 0% 3.9%;        /* 거의 검정 */
--primary: 0 0% 9%;             /* 검정 */
--muted: 0 0% 96.1%;            /* 연한 회색 */
--border: 0 0% 89.8%;           /* 테두리 */

/* 다크 모드 (.dark) */
--background: 0 0% 3.9%;        /* 아주 어두운 */
--foreground: 0 0% 98%;         /* 흰색 */
--border: 0 0% 14.9%;           /* 어두운 테두리 */
```

### 8.3 사용법

```tsx
// Tailwind 시맨틱 클래스 사용
<div className="bg-background text-foreground border">
  <p className="text-muted-foreground">보조 텍스트</p>
  <div className="bg-card">카드 콘텐츠</div>
</div>

// 테마 토글 위젯
<ThemeToggle /> // 드롭다운: 라이트 / 다크 / 시스템
```

---

## 9. 이메일 시스템

### 9.1 구성

- **서비스**: Resend
- **템플릿**: React Email (`@react-email/components`)
- **위치**: `src/shared/api/resend/templates/`

### 9.2 이메일 템플릿 목록

| 템플릿 | Props | 용도 |
|--------|-------|------|
| `WelcomeEmail` | name, loginUrl | 회원가입 환영 이메일 |
| `MagicLinkEmail` | magicLink, expiryMinutes | 매직 링크 로그인 |
| `ResetPasswordEmail` | resetLink, expiryHours | 비밀번호 재설정 |
| `OtpEmail` | code, expiryMinutes | OTP 인증 코드 |
| `SubscriptionEmail` | (구독 관련 정보) | 구독 확인 |

모든 템플릿은 일관된 디자인: 흰색 컨테이너, vibePack 푸터, 반응형 레이아웃.

---

## 10. 데이터 페칭 (SWR)

### 10.1 SWR Provider 설정

```typescript
// src/shared/providers/swr-provider.tsx
SWRConfig({
  fetcher: url → fetch(url).json(),
  revalidateOnFocus: false,    // 창 포커스 시 갱신 비활성화
  shouldRetryOnError: false,   // 에러 시 자동 재시도 비활성화
});
```

### 10.2 Entity 훅

| 훅 | API | 반환값 |
|----|-----|--------|
| `useUser()` | `GET /api/user/profile` | `{ user, error, isLoading }` |
| `useSubscription()` | `GET /api/payments/subscription` | `{ subscription, error, isLoading, isPro, mutate }` |

### 10.3 데이터 흐름

```
클라이언트 컴포넌트
  → SWR 훅 (useUser, useSubscription)
    → fetch(/api/...)
      → API 라우트 (서버)
        → Supabase Auth 확인
        → Drizzle ORM DB 쿼리
        → JSON 응답
      ← { success: true, data: T }
    ← SWR 캐시 + 상태 관리
  ← { data, error, isLoading }
```

---

## 11. 위젯 및 UI 컴포넌트

### 11.1 위젯 목록

| 위젯 | 위치 | 설명 |
|------|------|------|
| **Header** | `src/widgets/header/` | 로고 + 네비게이션 + 테마 토글 + 언어 전환 + 인증 CTA + 모바일 메뉴 |
| **Footer** | `src/widgets/footer/` | 로고 + 설명 + 링크 (이용약관, 개인정보, GitHub, Twitter) + 저작권 |
| **TopBar** | `src/widgets/top-bar/` | 대시보드 네비게이션 + 테마/언어 + 사용자 메뉴 |
| **ThemeToggle** | `src/widgets/theme-toggle/` | 다크/라이트/시스템 테마 전환 드롭다운 |
| **LanguageSwitcher** | `src/widgets/language-switcher/` | 한국어/영어 전환 드롭다운 |
| **Landing** | `src/widgets/landing/` | HeroSection, FeaturesSection, HowItWorksSection, TestimonialsSection, CtaSection |
| **PricingTable** | `src/widgets/pricing-table/` | 월간/연간 토글, 플랜 카드, FAQ 아코디언 |
| **Blog** | `src/widgets/blog/` | BlogContent, PostList, PostCard, MDX 컴포넌트 |
| **Sidebar** | `src/widgets/sidebar/` | 플레이스홀더 (향후 구현 예정) |

### 11.2 shadcn/ui 컴포넌트 (29개)

`src/shared/ui/`에 위치:

- **폼**: input, form, label, textarea, select, checkbox, switch
- **피드백**: button, badge, skeleton, loading-spinner, error-boundary
- **메뉴**: dropdown-menu, sheet
- **표시**: card, separator, avatar, tabs, accordion
- **다이얼로그**: dialog, toast, toaster (sonner)
- **유틸**: seo, error-boundary

모든 컴포넌트는 Radix UI 프리미티브 + Tailwind 스타일링 기반.

---

## 12. 콘텐츠 시스템 (MDX)

### 12.1 블로그

```
src/content/blog/
├── getting-started.mdx    → 프론트매터: title, date, author, category, tags, locale, published
└── draft-post.mdx         → 템플릿 포스트
```

- `next-mdx-remote`로 MDX 렌더링
- `gray-matter`로 프론트매터 파싱
- `reading-time`으로 읽기 시간 계산
- 커스텀 MDX 컴포넌트 (제목 auto-slugify, 시맨틱 Tailwind 스타일)

### 12.2 법률 페이지

```
src/content/legal/
├── privacy-en.mdx / privacy-ko.mdx    → 개인정보처리방침 (한/영)
└── terms-en.mdx / terms-ko.mdx        → 이용약관 (한/영)
```

- `LegalPage` 컴포넌트: 헤더 + 목차 사이드바 + 본문
- `TableOfContents`: 스티키 네비게이션

---

## 13. Provider 구성

루트 레이아웃에서 다음 순서로 Provider가 중첩됩니다:

```
IntlProvider (최상위)
  │  → next-intl 메시지 + 로케일
  └── ThemeProvider
      │  → next-themes (light/dark/system)
      └── AuthProvider
          │  → Supabase 세션 + onAuthStateChange 리스너
          │  → 제공: user, session, isLoading, signOut()
          └── SWRProvider
              │  → 글로벌 fetcher + SWR 설정
              └── {children}
```

---

## 14. API 응답 형식

모든 API 라우트는 일관된 형식을 따릅니다:

```typescript
// 성공 응답
{
  success: true,
  data: T,
  message?: string
}

// 에러 응답
{
  success: false,
  error: {
    code: string,          // 'UNAUTHORIZED', 'VALIDATION_ERROR' 등
    message: string,
    details?: {            // Zod 검증 에러 시
      [field: string]: string[]
    }
  }
}
```

헬퍼 함수: `src/shared/lib/api/response.ts`
- `successResponse<T>(data, message?, status?)`
- `errorResponse(code, message, status, details?)`
- `zodErrorResponse(error)`

---

## 15. 테스팅

### 15.1 구성

| 구분 | 도구 | 위치 |
|------|------|------|
| 단위 테스트 | Vitest + React Testing Library | `src/__tests__/` (소스 구조 미러링) |
| E2E 테스트 | Playwright | 별도 설정 |

### 15.2 i18n 모킹 패턴

```typescript
vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}));
```

### 15.3 실행 명령

```bash
pnpm test                                      # 전체 단위 테스트
pnpm test -- src/__tests__/widgets/landing/    # 특정 디렉토리
pnpm test -- --testNamePattern "renders hero"  # 패턴 매칭
pnpm test:coverage                             # 커버리지 포함
pnpm test:e2e                                  # E2E 테스트
```

---

## 16. 주요 설정 파일

### 사이트 설정 (`src/shared/config/site.ts`)

```typescript
{
  name: "vibePack",
  description: "Your SaaS Boilerplate",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ogImage: "/og-image.png",
  locale: "ko_KR",
  creator: "vibePack"
}
```

### 인증 설정 (`src/shared/config/auth.ts`)

```typescript
{
  providers: ["google", "github", "kakao", "naver", "apple"],
  password: { minLength: 8, uppercase, lowercase, number, specialChar },
  magicLink: { expiryMinutes: 10 },
  otp: { digits: 6, expiryMinutes: 5, maxAttempts: 3 },
  forgotPassword: { expiryHours: 1, rateLimit: 5/hour },
  emailVerification: { resendCooldown: 60s }
}
```

### 네비게이션 설정 (`src/shared/config/navigation.ts`)

```typescript
{
  marketingNav: [Home, Pricing, Blog],
  authNav: [Login, Register],
  dashboardNav: [Dashboard, Settings → {Profile, Account}],
  protectedRoutes: ["/dashboard"],
  authOnlyRoutes: ["/login", "/register", "/forgot-password", "/magic-link", "/otp"]
}
```

---

## 주요 API 라우트 맵

```
src/app/api/
├── auth/
│   ├── login/route.ts           → POST (이메일/비밀번호 로그인)
│   ├── register/route.ts        → POST (회원가입)
│   ├── logout/route.ts          → POST (로그아웃)
│   ├── social/[provider]/route.ts → GET (소셜 OAuth 시작)
│   ├── callback/route.ts        → GET (OAuth/매직링크 콜백)
│   ├── magic-link/route.ts      → POST (매직 링크 발송)
│   ├── otp/
│   │   ├── send/route.ts        → POST (OTP 발송)
│   │   └── verify/route.ts      → POST (OTP 검증)
│   ├── forgot-password/route.ts → POST (비밀번호 재설정 링크)
│   ├── reset-password/route.ts  → POST (비밀번호 변경)
│   └── resend-verification/route.ts → POST (확인 이메일 재발송)
│
├── payments/
│   ├── checkout/route.ts        → POST (Polar 결제 시작)
│   ├── subscription/route.ts    → GET (구독 조회) / POST (구독 관리)
│   └── webhook/route.ts         → POST (Polar 웹훅)
│
└── user/
    └── profile/route.ts         → GET (프로필 조회) / PATCH (프로필 수정)
```

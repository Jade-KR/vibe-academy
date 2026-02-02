# vibe-academy 시작 가이드

> 이 문서는 Setup CLI에 의해 자동 생성되었습니다.

## 프로젝트 구성 요약

| 기능 | 상태 |
| --- | --- |
| 인증 | 이메일/비밀번호, Google OAuth |
| 결제 | Polar |
| 언어 | 한국어 + 영어 |
| 다크모드 | 지원 |
| 이메일 | Resend |
| 블로그 | MDX |

## 환경 변수 설정

프로젝트 루트의 `.env` 파일을 열어 아래 값들을 채워주세요.

### 1. Supabase

Supabase 프로젝트를 생성하고 다음 값을 설정하세요:

- `NEXT_PUBLIC_SUPABASE_URL` - 프로젝트 URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - anon 퍼블릭 키
- `SUPABASE_SERVICE_ROLE_KEY` - service role 키 (서버 전용)
- `DATABASE_URL` - PostgreSQL 연결 문자열

> 콘솔: [https://supabase.com/dashboard](https://supabase.com/dashboard)

### 2. OAuth 프로바이더

Supabase Dashboard > Authentication > Providers 에서 각 프로바이더를 활성화하세요.

**Google OAuth**

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

> 콘솔: [https://console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)

### 3. Polar (결제)

Polar 계정을 생성하고 organization을 설정하세요:

- `POLAR_ACCESS_TOKEN` - API 액세스 토큰
- `POLAR_ORGANIZATION_ID` - 조직 ID
- `POLAR_WEBHOOK_SECRET` - 웹훅 시크릿
- `NEXT_PUBLIC_POLAR_CHECKOUT_URL` - 결제 페이지 URL

> 콘솔: [https://polar.sh/dashboard](https://polar.sh/dashboard)

### 4. Resend (이메일)

Resend에서 API 키를 발급받고 도메인을 인증하세요:

- `RESEND_API_KEY` - API 키
- `RESEND_FROM_EMAIL` - 발신 이메일 (예: noreply@yourdomain.com)

> 콘솔: [https://resend.com/api-keys](https://resend.com/api-keys)

### 5. Sentry (모니터링)

Sentry 프로젝트를 생성하고 DSN을 설정하세요:

- `SENTRY_DSN` - 클라이언트 DSN
- `SENTRY_AUTH_TOKEN` - 인증 토큰 (소스맵 업로드용)

> 콘솔: [https://sentry.io](https://sentry.io)

## 시작하기

```bash
# 1. 의존성 설치
pnpm install

# 2. 환경 변수 설정
# .env 파일의 빈 값들을 채워주세요

# 3. 데이터베이스 마이그레이션
pnpm db:push

# 4. 개발 서버 시작
pnpm dev
```

## 다음 단계 체크리스트

- [ ] `.env` 파일의 환경 변수 값 채우기
- [ ] `src/shared/config/site.ts`에서 사이트 이름, 설명, URL 수정
- [ ] 로고 교체 (`public/` 디렉토리)
- [ ] 브랜드 컬러 설정 (`tailwind.config.ts`)
- [ ] 랜딩 페이지 커스터마이징
- [ ] Polar에서 상품/구독 플랜 생성
- [ ] Resend에서 도메인 인증 완료
- [ ] 이메일 템플릿 커스터마이징
- [ ] 블로그 첫 포스트 작성 (`src/content/blog/`)
- [ ] Sentry 프로젝트 설정
- [ ] Vercel에 배포

## 유용한 명령어

| 명령어 | 설명 |
| --- | --- |
| `pnpm dev` | 개발 서버 시작 |
| `pnpm build` | 프로덕션 빌드 |
| `pnpm lint` | ESLint 실행 |
| `pnpm typecheck` | TypeScript 타입 체크 |
| `pnpm test` | Vitest 단위 테스트 |
| `pnpm test:e2e` | Playwright E2E 테스트 |
| `pnpm db:push` | DB 스키마 적용 |
| `pnpm db:generate` | DB 마이그레이션 생성 |
| `pnpm email:dev` | 이메일 템플릿 미리보기 |

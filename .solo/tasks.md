# Task List — 코딩 강의 플랫폼

> PRD: `docs/PRD-lecture-platform.md`
> Status: **approved**
> Total: 27 tasks · ~101 hours estimated

---

## Tech Stack Detection

| Category | Detected |
|----------|----------|
| Frontend | Next.js 16+, React 19, TypeScript 5.x, Tailwind CSS 3.x, shadcn/ui |
| Backend | Supabase Auth, Polar SDK, Resend, Cloudflare R2 |
| Database | PostgreSQL 15 (Supabase), Drizzle ORM |
| Video | hls.js, FFmpeg (HLS encoding), Cloudflare R2 (storage/CDN) |
| New deps | hls.js, embla-carousel-react, @dnd-kit/core, recharts, rehype-pretty-code, @vercel/og, @aws-sdk/client-s3 |

## Skill Mapping

| Skill | Status |
|-------|--------|
| `vercel-react-best-practices` | available |
| `supabase-postgres-best-practices` | available |
| `web-design-guidelines` | available |

---

## Phase 0: Foundation (의존성 없음)

| ID | Task | Priority | Hours | Skills |
|----|------|----------|-------|--------|
| task-021 | 신규 패키지 설치 (hls.js, embla, dnd-kit, recharts, @vercel/og, @aws-sdk/client-s3, rehype-pretty-code) | high | 0.5 | — |
| task-020 | i18n 번역 확장 — 강의 플랫폼 번역 키 추가 | medium | 2 | — |
| task-025 | 이메일 템플릿 추가 (결제 완료, 환불 완료) | medium | 2 | — |
| task-007 | Header/Footer 위젯 업데이트 — 강의 플랫폼 네비게이션 | high | 2 | web-design-guidelines |
| task-012 | 비디오 플레이어 위젯 — hls.js + 커스텀 컨트롤 UI | high | 6 | vercel-react |
| task-001 | DB 스키마 확장 — users role + 9개 신규 테이블 | high | 3 | supabase-postgres |

## Phase 1: Core API/Entity (← Phase 0)

| ID | Task | Priority | Hours | Dependencies | Skills |
|----|------|----------|-------|-------------|--------|
| task-006 | 미들웨어 확장 — dashboard/learn/admin 라우트 보호 | high | 1 | task-001 | — |
| task-002 | Entity 레이어 — course, lesson, enrollment, progress, review, discussion | high | 4 | task-001 | vercel-react |
| task-003 | 공개 API Routes — 강의 목록, 강의 상세, 리뷰 조회 | high | 3 | task-001 | supabase-postgres |
| task-004 | 인증 API Routes — 등록/학습/진도/토론/리뷰 | high | 6 | task-001 | supabase-postgres |
| task-005 | 관리자 API Routes — 강의 CRUD, 회원/매출/쿠폰 | high | 5 | task-001 | supabase-postgres |
| task-019 | R2 연동 — 영상 업로드 + Presigned URL 발급 | high | 3 | task-001 | — |

## Phase 2: Pages & Features (← Phase 1)

| ID | Task | Priority | Hours | Dependencies | Skills |
|----|------|----------|-------|-------------|--------|
| task-008 | 랜딩 페이지 리뉴얼 — 드림코딩 벤치마킹 | high | 6 | task-002, task-003, task-007 | vercel-react, web-design |
| task-009 | CourseCard 위젯 + 강의 목록 페이지 | high | 3 | task-002, task-003, task-007 | vercel-react, web-design |
| task-017 | 문의 + 리뷰 모아보기 + 환불정책 페이지 | medium | 3 | task-003, task-007 | web-design |
| task-015 | 토론 패널 위젯 — 게시글 + 댓글 CRUD | high | 4 | task-002, task-004 | vercel-react |
| task-016 | 수강생 대시보드 — 내 강의 + 진도율 | high | 3 | task-002, task-004 | vercel-react, web-design |
| task-011 | 결제 연동 확장 — Polar 강의 구매 + Enrollment | high | 4 | task-004 | — |
| task-014 | 진도 저장 시스템 — 자동/수동 완료 | high | 3 | task-004, task-012 | — |
| task-026 | 단위 테스트 — 유틸, Zod, 진도, 쿠폰 | medium | 3 | task-001, task-002 | — |

## Phase 3: Complex Pages (← Phase 2)

| ID | Task | Priority | Hours | Dependencies | Skills |
|----|------|----------|-------|-------------|--------|
| task-010 | 강의 상세 페이지 — 커리큘럼, 미리보기, 구매 위젯, FAQ | high | 8 | task-002, task-003, task-009 | vercel-react, web-design |
| task-013 | 학습 페이지 — 3단 레이아웃 | high | 8 | task-002, task-004, task-012 | vercel-react, web-design |
| task-018 | 관리자 라우트 그룹 + 강의 CRUD UI | high | 8 | task-005, task-006 | vercel-react, web-design |
| task-023 | Webhook 확장 — Polar 강의 결제 이벤트 | high | 3 | task-001, task-011 | — |

## Phase 4: Polish (← Phase 3)

| ID | Task | Priority | Hours | Dependencies | Skills |
|----|------|----------|-------|-------------|--------|
| task-022 | 관리자 — 회원 관리 + 매출 대시보드 + 쿠폰 UI | medium | 6 | task-005, task-018 | vercel-react, web-design |
| task-024 | SEO + 사이트맵 + OG 이미지 | medium | 3 | task-010 | — |
| task-027 | 컴포넌트 테스트 — CourseCard, Curriculum, Discussion 등 | medium | 4 | task-009, task-010, task-015 | — |

---

## Dependency Graph

```
task-021 (패키지 설치) ──────────────────────────────────────────┐
task-020 (i18n) ─────────────────────────────────────────────────┤
task-025 (이메일 템플릿) ────────────────────────────────────────┤
task-007 (Header/Footer) ───────────── task-008 (랜딩)           │
         │                             task-009 (강의 목록)      │
         │                             task-017 (문의/리뷰/환불)  │
         │                                                       │
task-012 (비디오 플레이어) ──── task-013 (학습 페이지)             │
         │                     task-014 (진도 저장)               │
         │                                                       │
task-001 (DB 스키마) ─┬── task-006 (미들웨어) ── task-018 (관리자 UI)
                      │                                    │
                      ├── task-002 (엔티티) ─┬── task-008   ├── task-022 (회원/매출/쿠폰)
                      │                     ├── task-009 ── task-010 (강의 상세) ── task-024 (SEO)
                      │                     ├── task-015 (토론) ── task-027 (컴포넌트 테스트)
                      │                     ├── task-016 (대시보드)
                      │                     └── task-026 (단위 테스트)
                      │
                      ├── task-003 (공개 API) ─── task-008, task-009, task-017
                      │
                      ├── task-004 (인증 API) ─── task-011 (결제) ── task-023 (Webhook)
                      │                          task-013, task-014, task-015, task-016
                      │
                      ├── task-005 (관리자 API) ── task-018, task-022
                      │
                      └── task-019 (R2 연동)
```

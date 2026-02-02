# Product Requirements Document (PRD)

## 코딩 강의 플랫폼

---

**문서 버전**: 2.0
**작성일**: 2026년 2월
**상태**: Draft
**벤치마크**: [드림코딩 아카데미](https://academy.dream-coding.com/)

---

## 목차

1. [개요](#1-개요)
2. [목표 및 성공 지표](#2-목표-및-성공-지표)
3. [사용자 정의](#3-사용자-정의)
4. [기능 요구사항](#4-기능-요구사항)
5. [비기능 요구사항](#5-비기능-요구사항)
6. [기술 스택](#6-기술-스택)
7. [데이터 모델](#7-데이터-모델)
8. [API 설계](#8-api-설계)
9. [페이지 및 라우트 구조](#9-페이지-및-라우트-구조)
10. [UI/UX 요구사항](#10-uiux-요구사항)
11. [보안 요구사항](#11-보안-요구사항)
12. [테스트 전략](#12-테스트-전략)
13. [배포 전략](#13-배포-전략)
14. [마일스톤](#14-마일스톤)
15. [리스크 및 의존성](#15-리스크-및-의존성)

---

## 1. 개요

### 1.1 프로젝트 배경

드림코딩 아카데미를 벤치마킹한 1인 운영 코딩 강의 플랫폼. 기존 vibePack(Next.js SaaS 보일러플레이트)을 기반으로 강의 판매·수강·관리 시스템을 구축한다.

### 1.2 프로젝트 범위

#### 포함 (In Scope)

- 랜딩 페이지 (히어로, 추천 강의, 카테고리별 섹션, 가치 제안, 리뷰 하이라이트)
- 강의 목록 페이지 (카테고리별 그룹, 카드 그리드)
- 강의 상세 페이지 (소개 영상, 커리큘럼 아코디언, 수강평, 강사 소개, FAQ, 구매 위젯)
- 리뷰 모아보기 페이지
- 문의 페이지
- 학습 페이지 (비디오 플레이어, 커리큘럼 사이드바, 토론 패널, 레슨 설명 MDX, 진도 관리)
- 수강생 대시보드 (내 강의, 진도율)
- 관리자 대시보드 (강의 CRUD, 회원 관리, 매출 통계)
- 결제 시스템 (Polar)
- 리뷰 시스템
- 법적 페이지 (이용약관, 개인정보처리방침, 환불정책)

#### 제외 (Out of Scope)

- 취업이야기/성공스토리 페이지
- 로드맵 페이지
- 모바일 앱 (웹 반응형으로 대체)
- 실시간 라이브 강의
- 커뮤니티/포럼 (Phase 2)
- AI 학습 도우미 (Phase 2)

### 1.3 용어 정의

| 용어 | 정의 |
|------|------|
| **수강생** | 강의를 구매/수강하는 회원 |
| **관리자** | 강의를 등록하고 플랫폼을 운영하는 1인 운영자 |
| **강의 (Course)** | 하나의 주제를 다루는 교육 콘텐츠 단위 (slug 기반 URL) |
| **챕터 (Chapter)** | 강의 내 섹션 단위 |
| **레슨 (Lesson)** | 챕터 내 개별 영상 콘텐츠 |
| **등록 (Enrollment)** | 수강생의 강의 구매 완료 상태 |
| **진도 (Progress)** | 레슨별 시청 완료 및 재생 위치 |

---

## 2. 목표 및 성공 지표

### 2.1 비즈니스 목표

| 목표 | 설명 |
|------|------|
| **MVP 런칭** | 첫 강의 판매 가능한 상태 |
| **첫 매출** | 최초 유료 결제 발생 |
| **손익분기** | 월 운영비 이상 매출 |

### 2.2 핵심 성과 지표 (KPIs)

| 지표 | 목표값 | 측정 방법 |
|------|--------|----------|
| 페이지 로드 시간 (LCP) | < 2.5초 | Lighthouse |
| Core Web Vitals | Good | Vercel Analytics |
| 결제 성공률 | > 95% | Polar Dashboard |
| 에러율 | < 0.1% | Sentry |
| 완강률 | > 30% | 내부 DB |

### 2.3 사용자 역할

| 역할 | 권한 |
|------|------|
| **비회원 (Guest)** | 랜딩, 강의 소개, 미리보기 영상, 리뷰 조회 |
| **회원 (Member)** | 강의 구매, 수강, 진도 관리, 리뷰 작성, 프로필 관리 |
| **관리자 (Admin)** | 강의 CRUD, 회원 관리, 매출 확인, 쿠폰 관리 |

---

## 3. 사용자 정의

### 3.1 페르소나

#### 김주니어 — 비전공 개발자 지망생 (25세)
- **목표**: 프론트엔드 개발자 취업
- **Pain**: 무엇을 어떤 순서로 공부해야 할지 모름
- **기대**: 체계적인 커리큘럼, 실무 중심 강의

#### 박시니어 — 3년차 백엔드 개발자 (32세)
- **목표**: 풀스택으로 영역 확장
- **Pain**: 시간이 부족하여 핵심만 빠르게 배우고 싶음
- **기대**: 배속 재생, 선택적 학습, 실무 팁

---

## 4. 기능 요구사항

### 4.1 우선순위

- **P0 (Must Have)**: MVP 런칭에 필수
- **P1 (Should Have)**: 런칭 후 1개월 내
- **P2 (Nice to Have)**: 향후 로드맵

---

### 4.2 회원 시스템

> 기존 vibePack 보일러플레이트의 인증 시스템(Supabase Auth)을 그대로 활용.
> `src/features/auth/`, `src/app/[locale]/(auth)/`, `src/app/api/auth/` 기반.

#### FR-AUTH-001: 소셜 로그인 [P0]
- Google, GitHub OAuth 2.0
- 최초 로그인 시 자동 회원가입, 프로필 정보 자동 수집
- 기존 보일러플레이트 로그인/회원가입 플로우 재사용

#### FR-AUTH-002: 이메일 로그인 [P0]
- 이메일/비밀번호 로그인 (기존 보일러플레이트)
- Magic Link 로그인 (Resend 경유)
- 이메일 인증 (기존 verify-email 플로우)

#### FR-AUTH-003: 프로필 관리 [P1]
- 기존 보일러플레이트의 settings/profile, settings/account 페이지 재사용
- 이름, 프로필 이미지, 비밀번호 변경

#### FR-AUTH-004: 회원 탈퇴 [P1]
- 탈퇴 확인 모달
- 개인정보 즉시 익명화, 구매 내역은 법적 보관 기간 유지

---

### 4.3 강의 시스템

#### FR-COURSE-001: 랜딩 페이지 [P0]
드림코딩 아카데미 홈 구조 벤치마킹:

| 섹션 | 설명 |
|------|------|
| **히어로** | "Code Your Dream" 슬로건, 부제목, CTA 버튼, 히어로 이미지/GIF |
| **추천 강의 캐러셀** | 대표 강의 7개 카드 슬라이더 (썸네일, 난이도 뱃지, 제목, 리뷰 수) |
| **가치 제안** | 3개 카드 — 교육 철학/방법론 소개 |
| **카테고리별 강의 섹션** | "프론트엔드 기본", "프론트엔드 심화", "백엔드", "개발자 기본기" 등 카테고리 그룹별 강의 3-4개씩 |
| **리뷰 하이라이트** | 수강평 일부 발췌 + "더 많은 후기 보러가기" 링크 |

**수락 기준**:
- ✅ 반응형 (모바일 1열, 태블릿 2열, 데스크톱 3열)
- ✅ 캐러셀 페이지네이션/인디케이터
- ✅ 이미지 lazy loading
- ✅ LCP < 2.5초

#### FR-COURSE-002: 강의 목록 페이지 (`/courses`) [P0]
드림코딩 `/courses` 벤치마킹:

- 카테고리별 그룹으로 강의 카드 나열 (필터 UI 없이 섹션별 분류)
- 카드 구성: 애니메이션 썸네일 (GIF/WebP), 난이도 뱃지 (초급/중급/고급), 강의 제목, 짧은 설명, 리뷰 수
- 가격은 카드에 직접 표시하지 않음 (상세 페이지에서 확인)
- 무료 강의와 유료 강의 동일한 카드 형태

**수락 기준**:
- ✅ 카테고리별 섹션 구분
- ✅ 반응형 그리드 (1열/2열/3열)
- ✅ 이미지 lazy loading

#### FR-COURSE-003: 강의 상세 페이지 (`/courses/[slug]`) [P0]
드림코딩 개별 강의 페이지 벤치마킹:

| 섹션 | 설명 |
|------|------|
| **히어로 배너** | 강의 제목, 부제목, 등록 CTA |
| **소개 영상** | 임베디드 비디오 플레이어 (미리보기/트레일러) |
| **Sticky 구매 위젯** | 가격, "바로 등록하기" 버튼, 포함사항 목록 (스크롤 시 고정) |
| **기술 스택 그리드** | 강의에서 다루는 기술 아이콘/로고 그리드 |
| **배우는 것** | 프로젝트별 학습 모듈 소개 (이미지 + 설명) |
| **커리큘럼** | 챕터별 아코디언 — 레슨 제목, 시간, 미리보기 뱃지, 챌린지 표시 |
| **강사 소개** | 프로필 이미지, 경력, 소셜 링크 |
| **수강평** | 평균 별점, 리뷰 수, 개별 리뷰 목록 |
| **FAQ** | 자주 묻는 질문 아코디언 (수강기간, 환불, 수강권 등) |
| **수강 전 필요사항** | 선수 지식 목록 |
| **관련 강의** | 추천 다음 강의 카드 |

**수락 기준**:
- ✅ 커리큘럼 아코디언 펼치기/접기
- ✅ 미리보기 영상 재생
- ✅ Sticky 구매 위젯 (데스크톱 사이드바, 모바일 하단 고정)
- ✅ SEO 메타 태그 + OG 이미지 동적 생성
- ✅ 구매 완료 사용자에게는 "이어서 학습하기" 버튼 표시

#### FR-COURSE-004: 강의 구매 [P0]
- Polar 결제 연동 (기존 보일러플레이트 결제 플로우 확장)
- 결제 수단: 카드, 해외 결제
- 쿠폰 코드 적용 (P1)
- 결제 완료 → Webhook → Enrollment 생성 → 즉시 수강 가능
- 결제 확인 이메일 발송 (Resend)

#### FR-COURSE-005: 강의 환불 [P1]
- 환불 조건: 구매 후 7일 이내 AND 시청 영상 5개 미만 (드림코딩 정책 참고)
- 환불 요청 → 관리자 검토 → Polar API 환불 처리
- 환불 완료 시 이메일 알림

---

### 4.4 학습 시스템

#### FR-LEARN-001: 비디오 재생 [P0]
hls.js + Tailwind 커스텀 UI로 구현. R2에서 HLS URL을 받아 재생.

- hls.js로 HLS 스트리밍 (`master.m3u8` → 어댑티브 비트레이트)
- Safari는 네이티브 HLS 사용 (hls.js 불필요), Chrome/Firefox는 hls.js
- 커스텀 컨트롤 UI: 재생/일시정지, 시크바, 볼륨, 배속 (0.5x~2x), 화질 (720p/1080p), 전체화면
- 키보드 단축키 (Space: 재생/정지, ←→: 10초 이동, ↑↓: 볼륨)
- 버퍼링 상태 표시
- 모바일 정상 재생 (터치 제스처)

#### FR-LEARN-002: 진도 저장 [P0]
- 영상 재생 위치 5초마다 자동 저장
- 90% 이상 시청 시 완료 처리
- "완료하고 다음으로" 수동 완료 버튼
- 챕터별 + 전체 진도율 계산

#### FR-LEARN-003: 커리큘럼 네비게이션 [P0]
- **좌측 사이드바**에 챕터/레슨 목록 (데스크톱)
- 토글 버튼으로 열기/닫기 (닫으면 플레이어 영역 확장)
- 하단 시트 커리큘럼 (모바일)
- 완료 상태 아이콘 (체크/미완료)
- 현재 레슨 하이라이트
- 이전/다음 레슨 버튼
- URL이 레슨별로 변경 (공유 가능)

#### FR-LEARN-004: 토론 패널 [P0]
- **우측 사이드바**에 레슨별 토론 패널 (게시글 + 댓글 형식)
- 토글 버튼으로 열기/닫기 (닫으면 플레이어 영역 확장)
- 게시글: 제목, 본문, 작성자, 작성일
- 댓글: 게시글 하위 댓글 (1단계), 작성자, 작성일
- 게시글/댓글 작성·수정·삭제 (본인 것만)
- 관리자는 모든 게시글/댓글 삭제 가능
- 레슨별로 스코프 — 해당 레슨의 토론만 표시
- 모바일: 하단 시트로 표시

#### FR-LEARN-005: 레슨 설명 [P0]
- 플레이어 하단에 해당 레슨의 설명 표시
- MDX로 작성된 콘텐츠 렌더링 (코드 블록 하이라이팅, 이미지, 링크 등)
- 레슨별 `description` 필드에 MDX 마크다운 저장

#### FR-LEARN-006: 학습 노트 [P2]
- 마크다운 에디터
- 타임스탬프 삽입
- 자동 저장 (3초 디바운스)

---

### 4.5 대시보드

#### FR-DASH-001: 내 강의 목록 [P0]
- 구매한 강의 카드 목록
- 강의별 진도율 프로그레스 바
- 마지막 학습일 표시
- "이어서 학습하기" 버튼

#### FR-DASH-002: 학습 통계 [P2]
- 총 학습 시간
- 완강한 강의 수
- 주간 학습 히트맵
- 연속 학습일 (스트릭)

---

### 4.6 리뷰 시스템

#### FR-REVIEW-001: 리뷰 작성 [P1]
- 별점 (1~5), 제목, 텍스트 (최소 20자, 최대 1000자)
- 진도율 50% 이상 수강한 강의만 작성 가능
- 강의당 1개 리뷰 제한, 수정/삭제 가능

#### FR-REVIEW-002: 리뷰 조회 [P1]
- 강의 상세 페이지 내 리뷰 섹션 (평균 별점, 개별 리뷰)
- 독립 리뷰 페이지 (`/reviews`) — 드림코딩 `/pages/reviews` 벤치마킹
  - 페이지 헤더 ("수강 리뷰!")
  - "최근 6개월 리뷰" 안내
  - 리뷰 카드: 작성자명, 강의명, 별점, 제목, 본문, 작성일
  - 수직 피드 레이아웃

---

### 4.7 문의 페이지

#### FR-CONTACT-001: 문의 페이지 [P0]
드림코딩 `/pages/contact` 벤치마킹:
- 심플한 레이아웃: 제목 "연락 및 문의"
- 이메일 주소 표시
- 답변 소요일 안내 (영업일 기준 1~5일)
- 일러스트 이미지

---

### 4.8 관리자 시스템

#### FR-ADMIN-001: 강의 관리 (CRUD) [P0]
- 강의 기본 정보 입력 (제목, slug, 설명, 가격, 난이도, 썸네일, 카테고리)
- 챕터 추가/수정/삭제/순서변경
- 레슨 추가/수정/삭제/순서변경
- 영상 업로드 (MP4 → FFmpeg HLS 인코딩 → R2 업로드, 초기엔 로컬 인코딩 후 수동 업로드)
- 미리보기 설정 (레슨별)
- 공개/비공개 설정
- 드래그앤드롭 순서 변경

#### FR-ADMIN-002: 회원 관리 [P1]
- 회원 목록 (이메일, 이름, 가입일, 구매 강의 수)
- 검색 (이메일, 이름)
- 강의 수동 등록/해제
- CSV 내보내기

#### FR-ADMIN-003: 매출 대시보드 [P1]
- 일별/월별 매출 차트
- 강의별 매출
- 결제/환불 내역 목록

#### FR-ADMIN-004: 쿠폰 관리 [P1]
- 쿠폰 코드 생성 (자동/수동)
- 할인 유형: 정액 / 정률
- 적용 대상: 특정 강의 / 전체
- 유효기간 및 사용 횟수 제한

---

### 4.9 알림 시스템

#### FR-NOTIF-001: 이메일 알림 [P0]
기존 보일러플레이트의 Resend 인프라 활용:
- 회원가입 환영
- 결제 완료 (영수증)
- 환불 완료
- 비밀번호 재설정

---

## 5. 비기능 요구사항

### 5.1 성능

| 항목 | 요구사항 |
|------|----------|
| LCP | < 2.5초 |
| FID | < 100ms |
| CLS | < 0.1 |
| API 응답 (p95) | < 500ms |

### 5.2 접근성

| 항목 | 요구사항 |
|------|----------|
| WCAG | 2.1 AA |
| 키보드 접근성 | 모든 기능 |
| 색상 대비 | 4.5:1 이상 |

### 5.3 호환성

| 항목 | 지원 범위 |
|------|----------|
| 브라우저 | Chrome 90+, Safari 14+, Firefox 90+, Edge 90+ |
| 해상도 | 320px ~ 2560px |

### 5.4 국제화

기존 보일러플레이트의 next-intl 설정 그대로 활용:
- 기본 언어: 한국어 (`ko`)
- 추가 언어: 영어 (`en`)
- URL 프리픽스: `/ko/...`, `/en/...`
- 통화: KRW (기본), USD

---

## 6. 기술 스택

> 기존 vibePack 보일러플레이트 기반. 변경/추가 사항만 별도 표기.

### 6.1 기존 보일러플레이트 그대로 사용

| 분류 | 기술 |
|------|------|
| Framework | Next.js 16+ (App Router), React 19, TypeScript 5.x (strict) |
| Styling | Tailwind CSS 3.x, shadcn/ui |
| Database | PostgreSQL 15 (Supabase), Drizzle ORM |
| Auth | Supabase Auth (소셜 OAuth, 이메일/비밀번호, Magic Link) |
| Payments | Polar SDK |
| Email | Resend + React Email |
| Data Fetching | SWR 2.x |
| Forms | react-hook-form 7.x + Zod |
| i18n | next-intl (ko, en) |
| Theme | next-themes (light/dark/system) |
| Testing | Vitest + RTL, Playwright |
| Monitoring | Sentry |
| Deploy | Vercel (icn1) |
| Icons | lucide-react |

### 6.2 신규 추가 기술

| 분류 | 기술 | 용도 |
|------|------|------|
| Video Storage/CDN | Cloudflare R2 | HLS 세그먼트 저장 + CDN 서빙 (egress 무료) |
| Video Encoding | FFmpeg | MP4 → HLS 멀티 화질 인코딩 (720p/1080p) |
| Video Player | hls.js + 커스텀 UI | HLS 재생, Tailwind 기반 컨트롤 UI 직접 구현 |
| File Upload | Cloudflare R2 | 강의 썸네일, 강사 프로필 이미지, HLS 세그먼트 |
| Carousel | Embla Carousel | 랜딩 페이지 강의 캐러셀 |
| DnD | @dnd-kit/core | 관리자 챕터/레슨 순서 변경 |
| Charts | Recharts | 관리자 매출 차트, 학습 통계 |
| MDX Rendering | next-mdx-remote + rehype-pretty-code | 레슨 설명 MDX 렌더링 + 코드 하이라이팅 |
| OG Image | @vercel/og (Satori) | 동적 OG 이미지 생성 |

### 6.3 비디오 스트리밍 아키텍처

Cloudflare Stream 대신 **R2 + FFmpeg 셀프 인코딩** 방식으로 시청 비용을 $0으로 유지한다.

#### 파이프라인

```
관리자 영상 업로드 (MP4)
         │
         ▼
   FFmpeg HLS 인코딩 (서버사이드 또는 로컬)
   ├── master.m3u8              (마스터 플레이리스트)
   ├── 720p/playlist.m3u8       (720p 스트림)
   │    └── segment-001.ts, 002.ts, ...
   └── 1080p/playlist.m3u8      (1080p 스트림)
        └── segment-001.ts, 002.ts, ...
         │
         ▼
   Cloudflare R2 버킷에 업로드
   /videos/{courseSlug}/{chapterOrder}-{lessonOrder}/
         │
         ▼
   프론트엔드에서 hls.js로 재생
   https://{R2_CUSTOM_DOMAIN}/videos/{courseSlug}/1-1/master.m3u8
```

#### FFmpeg 인코딩 커맨드

```bash
ffmpeg -i input.mp4 \
  -filter_complex "[0:v]split=2[v720][v1080]; \
    [v720]scale=-2:720[v720out]; \
    [v1080]scale=-2:1080[v1080out]" \
  -map "[v720out]" -map 0:a -c:v h264 -b:v 2500k -c:a aac -ar 48000 \
    -hls_time 4 -hls_playlist_type vod -hls_segment_filename '720p/seg-%03d.ts' 720p/playlist.m3u8 \
  -map "[v1080out]" -map 0:a -c:v h264 -b:v 5000k -c:a aac -ar 48000 \
    -hls_time 4 -hls_playlist_type vod -hls_segment_filename '1080p/seg-%03d.ts' 1080p/playlist.m3u8
```

#### R2 비용 (사실상 무료)

| 항목 | 무료 한도 | 초과 시 |
|------|-----------|---------|
| 저장 | 10GB/월 | $0.015/GB/월 |
| 읽기 요청 | 1,000만/월 | $0.36/100만 |
| **전송 (egress)** | **무제한** | **$0** |

100시간 강의 (멀티 화질) ≈ 50~80GB 저장 → 월 $1~2. 시청 비용 $0.

#### 영상 보호

- R2 버킷은 비공개. 프론트엔드에서 직접 접근 불가.
- API Route에서 Enrollment 확인 후 **R2 Presigned URL** (만료 시간 포함) 발급.
- 미리보기(is_preview) 레슨은 인증 없이 Presigned URL 제공.

### 6.4 FSD 아키텍처 확장

기존 보일러플레이트 구조에 강의 관련 슬라이스 추가:

```
src/
├── app/[locale]/
│   ├── (auth)/              # 기존 유지
│   ├── (marketing)/         # 확장
│   │   ├── page.tsx         # 랜딩
│   │   ├── courses/         # 강의 목록
│   │   ├── courses/[slug]/  # 강의 상세
│   │   ├── reviews/         # 리뷰 모아보기
│   │   └── contact/         # 문의
│   ├── (dashboard)/         # 확장
│   │   ├── dashboard/       # 내 강의 + 진도
│   │   ├── learn/[slug]/    # 학습 페이지
│   │   └── settings/        # 기존 유지
│   └── (admin)/             # 신규
│       └── admin/
│           ├── courses/     # 강의 CRUD
│           ├── users/       # 회원 관리
│           ├── analytics/   # 매출 통계
│           └── coupons/     # 쿠폰 관리
├── entities/                # 확장
│   ├── user/                # 기존 유지
│   ├── subscription/        # 기존 유지 (필요 시)
│   ├── course/              # 신규 — Course 타입, useCourse, useCourses hooks
│   ├── lesson/              # 신규 — Lesson 타입, useLesson hooks
│   ├── enrollment/          # 신규 — Enrollment 타입, useEnrollment hooks
│   ├── review/              # 신규 — Review 타입, useReviews hooks
│   ├── progress/            # 신규 — Progress 타입, useProgress hooks
│   └── discussion/          # 신규 — Discussion/Comment 타입, useDiscussions hooks
├── features/                # 확장
│   ├── auth/                # 기존 유지
│   ├── settings/            # 기존 유지
│   ├── purchase/            # 신규 — 결제 플로우
│   ├── learning/            # 신규 — 비디오 플레이어, 진도 관리
│   ├── discussion/          # 신규 — 토론 게시글/댓글 CRUD
│   ├── review/              # 신규 — 리뷰 작성/수정/삭제
│   └── admin/               # 신규 — 관리자 기능
│       ├── course-editor/
│       ├── user-manager/
│       ├── analytics/
│       └── coupon-manager/
├── widgets/                 # 확장
│   ├── header/              # 기존 수정 (네비게이션 업데이트)
│   ├── footer/              # 기존 수정
│   ├── landing/             # 기존 수정 (강의 섹션으로 변경)
│   ├── course-card/         # 신규 — 강의 카드 컴포넌트
│   ├── course-detail/       # 신규 — 강의 상세 위젯들
│   ├── curriculum/          # 신규 — 커리큘럼 아코디언
│   ├── video-player/        # 신규 — 비디오 플레이어 위젯
│   ├── review-list/         # 신규 — 리뷰 목록
│   ├── discussion-panel/    # 신규 — 토론 패널 (게시글 + 댓글)
│   ├── lesson-description/  # 신규 — 레슨 MDX 설명 렌더러
│   ├── instructor/          # 신규 — 강사 소개
│   └── pricing-widget/      # 신규 — Sticky 구매 위젯
├── shared/                  # 기존 유지 + 확장
├── db/                      # 스키마 확장
└── i18n/                    # 기존 유지
```

---

## 7. 데이터 모델

### 7.1 ERD

기존 보일러플레이트 테이블(`users`, `subscriptions`, `payments`) + 신규 테이블.

```
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│    users     │       │   courses    │       │   chapters   │
├──────────────┤       ├──────────────┤       ├──────────────┤
│ id (PK)      │       │ id (PK)      │       │ id (PK)      │
│ supabase_    │       │ title        │       │ course_id(FK)│
│   user_id    │       │ slug (unique)│       │ title        │
│ email        │       │ description  │       │ order        │
│ name         │       │ long_desc    │       │ created_at   │
│ avatar_url   │       │ price        │       └──────┬───────┘
│ role         │       │ level        │              │
│ locale       │       │ category     │              │
│ created_at   │       │ thumbnail_url│       ┌──────▼───────┐
│ updated_at   │       │ preview_url  │       │   lessons    │
└──────┬───────┘       │ instructor_  │       ├──────────────┤
       │               │   bio        │       │ id (PK)      │
       │               │ is_published │       │ chapter_id   │
       │               │ is_free      │       │ title        │
       │               │ created_at   │       │ description  │ ← MDX
       │               │ updated_at   │       │ video_url    │
       │               └──────┬───────┘       │ duration     │
       │                      │               │ is_preview   │
       │               ┌──────▼───────┐       │ order        │
       │               │ enrollments  │       │ created_at   │
       │               ├──────────────┤       └──────┬───────┘
       └──────────────►│ id (PK)      │              │
                       │ user_id (FK) │              │
                       │ course_id(FK)│       ┌──────▼───────┐
                       │ payment_id   │       │ discussions  │
                       │ purchased_at │       ├──────────────┤
                       │ expires_at   │       │ id (PK)      │
                       └──────────────┘       │ lesson_id(FK)│
                                              │ user_id (FK) │
       ┌──────────────┐                       │ title        │
       │   progress   │                       │ content      │
       ├──────────────┤                       │ created_at   │
       │ id (PK)      │                       │ updated_at   │
       │ user_id (FK) │                       └──────┬───────┘
       │ lesson_id(FK)│                              │
       │ completed    │                       ┌──────▼───────┐
       │ position     │                       │   comments   │
       │ updated_at   │                       ├──────────────┤
       └──────────────┘                       │ id (PK)      │
                                              │ discussion_id│
       ┌──────────────┐                       │ user_id (FK) │
       │   reviews    │                       │ content      │
       ├──────────────┤                       │ created_at   │
       │ id (PK)      │                       │ updated_at   │
       │ user_id (FK) │                       └──────────────┘
       │ course_id(FK)│
       │ rating (1-5) │       ┌──────────────┐
       │ title        │       │   coupons    │
       │ content      │       ├──────────────┤
       │ created_at   │       │ id (PK)      │
       │ updated_at   │       │ code (unique)│
       └──────────────┘       │ discount     │
                              │ discount_type│
                              │ course_id(FK)│
                              │ max_uses     │
                              │ used_count   │
                              │ expires_at   │
                              │ created_at   │
                              └──────────────┘
```

### 7.2 기존 테이블 변경

#### `users` 테이블 — 컬럼 추가

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `role` | enum('user', 'admin') | 사용자 역할. 기본값 'user' |

### 7.3 신규 테이블 Drizzle 스키마

```typescript
// db/schema/courses.ts
export const levelEnum = pgEnum('course_level', ['beginner', 'intermediate', 'advanced']);

export const courses = pgTable('courses', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),                // 짧은 소개 (카드용)
  longDescription: text('long_description'),        // 마크다운 상세 소개
  price: integer('price').notNull().default(0),     // 센트 단위 (0 = 무료)
  level: levelEnum('level').default('beginner').notNull(),
  category: text('category'),                       // "frontend-basic", "backend" 등
  thumbnailUrl: text('thumbnail_url'),
  previewVideoUrl: text('preview_video_url'),       // 소개 영상 URL
  instructorBio: text('instructor_bio'),            // 마크다운
  isPublished: boolean('is_published').default(false).notNull(),
  isFree: boolean('is_free').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// db/schema/chapters.ts
export const chapters = pgTable('chapters', {
  id: uuid('id').primaryKey().defaultRandom(),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  order: integer('order').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// db/schema/lessons.ts
export const lessons = pgTable('lessons', {
  id: uuid('id').primaryKey().defaultRandom(),
  chapterId: uuid('chapter_id').references(() => chapters.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  description: text('description'),                 // MDX 마크다운 (레슨 설명, 플레이어 하단 표시)
  videoUrl: text('video_url'),
  duration: integer('duration'),                    // 초 단위
  isPreview: boolean('is_preview').default(false).notNull(),
  order: integer('order').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// db/schema/enrollments.ts
export const enrollments = pgTable('enrollments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  paymentId: text('payment_id'),                    // Polar payment ID
  purchasedAt: timestamp('purchased_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'),
}, (table) => [
  unique().on(table.userId, table.courseId),
]);

// db/schema/progress.ts
export const progress = pgTable('progress', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  lessonId: uuid('lesson_id').references(() => lessons.id, { onDelete: 'cascade' }).notNull(),
  completed: boolean('completed').default(false).notNull(),
  position: integer('position').default(0).notNull(), // 초 단위 재생 위치
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  unique().on(table.userId, table.lessonId),
]);

// db/schema/reviews.ts
export const reviews = pgTable('reviews', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  rating: integer('rating').notNull(),              // 1-5
  title: text('title'),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  unique().on(table.userId, table.courseId),
]);

// db/schema/coupons.ts
export const discountTypeEnum = pgEnum('discount_type', ['fixed', 'percentage']);

export const coupons = pgTable('coupons', {
  id: uuid('id').primaryKey().defaultRandom(),
  code: text('code').notNull().unique(),
  discount: integer('discount').notNull(),
  discountType: discountTypeEnum('discount_type').notNull(),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'set null' }),
  maxUses: integer('max_uses'),
  usedCount: integer('used_count').default(0).notNull(),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// db/schema/discussions.ts
export const discussions = pgTable('discussions', {
  id: uuid('id').primaryKey().defaultRandom(),
  lessonId: uuid('lesson_id').references(() => lessons.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// db/schema/comments.ts
export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  discussionId: uuid('discussion_id').references(() => discussions.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

---

## 8. API 설계

### 8.1 설계 원칙

- Next.js App Router API Routes
- JSON 응답, Zod 서버 검증
- 인증: Supabase Auth (기존 보일러플레이트 미들웨어)
- 에러 형식: `{ error: { code: string, message: string } }`

### 8.2 API 엔드포인트

#### 기존 유지 (보일러플레이트)

| Method | Endpoint | 설명 |
|--------|----------|------|
| POST | `/api/auth/login` | 로그인 |
| POST | `/api/auth/register` | 회원가입 |
| POST | `/api/auth/logout` | 로그아웃 |
| POST | `/api/auth/callback` | OAuth 콜백 |
| GET | `/api/user/profile` | 내 프로필 |
| PATCH | `/api/user/profile` | 프로필 수정 |
| POST | `/api/payments/webhook` | Polar Webhook |

#### 신규 — 강의 (Public)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/api/courses` | 강의 목록 (카테고리 필터) | - |
| GET | `/api/courses/[slug]` | 강의 상세 (커리큘럼 포함) | - |
| GET | `/api/courses/[slug]/reviews` | 강의 리뷰 목록 | - |
| GET | `/api/reviews` | 전체 리뷰 (리뷰 모아보기) | - |

#### 신규 — 등록/학습 (Protected)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/api/enrollments` | 내 등록 목록 | ✅ |
| GET | `/api/enrollments/[courseId]` | 등록 상태 확인 | ✅ |
| POST | `/api/checkout/[courseSlug]` | 결제 세션 생성 | ✅ |
| GET | `/api/learn/[courseSlug]` | 학습 데이터 (커리큘럼 + 진도) | ✅ |
| GET | `/api/learn/[courseSlug]/lessons/[lessonId]` | R2 Presigned HLS URL 발급 | ✅ |
| PATCH | `/api/progress/[lessonId]` | 진도 업데이트 | ✅ |

#### 신규 — 토론 (Protected)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/api/discussions/[lessonId]` | 레슨별 토론 목록 (댓글 포함) | ✅ |
| POST | `/api/discussions/[lessonId]` | 게시글 작성 | ✅ |
| PATCH | `/api/discussions/[discussionId]` | 게시글 수정 | ✅ |
| DELETE | `/api/discussions/[discussionId]` | 게시글 삭제 (본인 또는 Admin) | ✅ |
| POST | `/api/discussions/[discussionId]/comments` | 댓글 작성 | ✅ |
| PATCH | `/api/comments/[commentId]` | 댓글 수정 | ✅ |
| DELETE | `/api/comments/[commentId]` | 댓글 삭제 (본인 또는 Admin) | ✅ |

#### 신규 — 리뷰 (Protected)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| POST | `/api/reviews` | 리뷰 작성 | ✅ |
| PATCH | `/api/reviews/[id]` | 리뷰 수정 | ✅ |
| DELETE | `/api/reviews/[id]` | 리뷰 삭제 | ✅ |

#### 신규 — 관리자 (Admin)

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| GET | `/api/admin/courses` | 강의 목록 (모든 상태) | Admin |
| POST | `/api/admin/courses` | 강의 생성 | Admin |
| PATCH | `/api/admin/courses/[id]` | 강의 수정 | Admin |
| DELETE | `/api/admin/courses/[id]` | 강의 삭제 | Admin |
| POST | `/api/admin/courses/[id]/chapters` | 챕터 추가 | Admin |
| PATCH | `/api/admin/chapters/[id]` | 챕터 수정 | Admin |
| POST | `/api/admin/chapters/[id]/lessons` | 레슨 추가 | Admin |
| PATCH | `/api/admin/lessons/[id]` | 레슨 수정 | Admin |
| PATCH | `/api/admin/courses/[id]/reorder` | 챕터/레슨 순서 변경 | Admin |
| GET | `/api/admin/users` | 회원 목록 | Admin |
| GET | `/api/admin/analytics` | 매출 통계 | Admin |
| POST | `/api/admin/coupons` | 쿠폰 생성 | Admin |
| GET | `/api/admin/coupons` | 쿠폰 목록 | Admin |
| DELETE | `/api/admin/coupons/[id]` | 쿠폰 삭제 | Admin |

### 8.3 API 응답 예시

```json
// GET /api/courses
{
  "data": [
    {
      "id": "uuid",
      "title": "React 완벽 가이드",
      "slug": "react",
      "description": "React의 개념부터 클론코딩까지",
      "price": 16000,
      "level": "intermediate",
      "category": "frontend-advanced",
      "thumbnailUrl": "https://...",
      "isFree": false,
      "reviewCount": 1725,
      "averageRating": 5.0
    }
  ]
}

// GET /api/courses/[slug] (상세)
{
  "data": {
    "id": "uuid",
    "title": "React 완벽 가이드",
    "slug": "react",
    "description": "...",
    "longDescription": "## 마크다운 ...",
    "price": 16000,
    "level": "intermediate",
    "category": "frontend-advanced",
    "thumbnailUrl": "https://...",
    "previewVideoUrl": "https://...",
    "instructorBio": "## 강사 소개 ...",
    "isFree": false,
    "reviewCount": 1725,
    "averageRating": 5.0,
    "totalDuration": 79620,
    "totalLessons": 85,
    "chapters": [
      {
        "id": "uuid",
        "title": "챕터 1: 소개",
        "order": 1,
        "lessons": [
          {
            "id": "uuid",
            "title": "강의 소개",
            "duration": 237,
            "isPreview": true,
            "order": 1
          }
        ]
      }
    ]
  }
}
```

---

## 9. 페이지 및 라우트 구조

> 모든 라우트는 `[locale]` 프리픽스 (`/ko/...`, `/en/...`) 하에 배치.

### 9.1 Marketing Routes (비로그인 접근 가능)

| Route | 페이지 | 설명 |
|-------|--------|------|
| `/` | 랜딩 페이지 | 히어로, 추천 강의, 카테고리 섹션, 가치 제안, 리뷰 |
| `/courses` | 강의 목록 | 카테고리별 전체 강의 그리드 |
| `/courses/[slug]` | 강의 상세 | 소개, 커리큘럼, 리뷰, FAQ, 구매 위젯 |
| `/reviews` | 리뷰 모아보기 | 전체 수강평 피드 |
| `/contact` | 문의 | 이메일 연락처 |
| `/legal/terms` | 이용약관 | 기존 보일러플레이트 |
| `/legal/privacy` | 개인정보처리방침 | 기존 보일러플레이트 |
| `/legal/refund` | 환불 정책 | 신규 |

### 9.2 Auth Routes (기존 유지)

| Route | 페이지 |
|-------|--------|
| `/login` | 로그인 |
| `/register` | 회원가입 |
| `/forgot-password` | 비밀번호 찾기 |
| `/reset-password` | 비밀번호 재설정 |
| `/verify-email` | 이메일 인증 |

### 9.3 Dashboard Routes (로그인 필수)

| Route | 페이지 | 설명 |
|-------|--------|------|
| `/dashboard` | 대시보드 | 내 강의 목록, 진도율, 이어서 학습 |
| `/dashboard/settings/profile` | 프로필 | 기존 보일러플레이트 |
| `/dashboard/settings/account` | 계정 | 기존 보일러플레이트 |
| `/learn/[courseSlug]` | 학습 메인 | 첫 레슨 또는 이어보기 리다이렉트 |
| `/learn/[courseSlug]/[lessonId]` | 레슨 학습 | 좌: 커리큘럼, 중: 플레이어+MDX 설명, 우: 토론 |

### 9.4 Admin Routes (Admin role 필수)

| Route | 페이지 | 설명 |
|-------|--------|------|
| `/admin` | 관리자 대시보드 | 요약 통계 |
| `/admin/courses` | 강의 관리 | 강의 목록 + CRUD |
| `/admin/courses/new` | 강의 생성 | 새 강의 |
| `/admin/courses/[id]/edit` | 강의 수정 | 커리큘럼 편집 포함 |
| `/admin/users` | 회원 관리 | 회원 목록 |
| `/admin/analytics` | 매출 통계 | 차트 |
| `/admin/coupons` | 쿠폰 관리 | 쿠폰 CRUD |

### 9.5 특수 Routes

| Route | 설명 |
|-------|------|
| `/api/*` | API 엔드포인트 |
| `/sitemap.xml` | 동적 사이트맵 |
| `/robots.txt` | 로봇 설정 |

---

## 10. UI/UX 요구사항

### 10.1 디자인 시스템

기존 보일러플레이트의 Tailwind + shadcn/ui 디자인 시스템 유지. 커스텀 컬러:

```css
/* 기본 — 기존 보일러플레이트 시맨틱 토큰 사용 */
bg-background, text-foreground, text-muted-foreground, bg-muted/50, bg-card, border

/* 추가 — 강의 관련 */
--level-beginner: #22c55e;   /* green-500 */
--level-intermediate: #3b82f6; /* blue-500 */
--level-advanced: #ef4444;   /* red-500 */
```

**폰트**: Pretendard (한글), Inter 또는 시스템 sans-serif (영문), JetBrains Mono (코드)

### 10.2 주요 커스텀 컴포넌트

| 컴포넌트 | 위치 | 설명 |
|----------|------|------|
| `CourseCard` | `widgets/course-card/` | 썸네일, 난이도 뱃지, 제목, 리뷰 수 |
| `VideoPlayer` | `widgets/video-player/` | hls.js + 커스텀 컨트롤, 배속, 화질, 단축키 |
| `Curriculum` | `widgets/curriculum/` | 좌측 토글 패널, 아코디언, 레슨 목록, 진도 표시 |
| `DiscussionPanel` | `widgets/discussion-panel/` | 우측 토글 패널, 게시글 목록, 댓글 스레드, 작성 폼 |
| `LessonDescription` | `widgets/lesson-description/` | MDX 렌더러, 코드 하이라이팅 |
| `ReviewCard` | `widgets/review-list/` | 별점, 제목, 내용, 작성자, 날짜 |
| `PricingWidget` | `widgets/pricing-widget/` | Sticky 사이드바, 가격, 포함사항, CTA |
| `InstructorSection` | `widgets/instructor/` | 프로필, 경력, 소셜 링크 |

### 10.3 페이지 와이어프레임

#### 랜딩 페이지 (드림코딩 홈 벤치마킹)
```
┌──────────────────────────────────────────────────┐
│ [Logo]          [강의][리뷰][문의]    [로그인]     │
├──────────────────────────────────────────────────┤
│                                                  │
│         Code Your Dream                          │
│    여러분의 멋진 꿈을 코딩하세요                    │
│         [지금 시작하기]                            │
│                         [Hero Image/GIF]         │
├──────────────────────────────────────────────────┤
│  ◀ [강의1] [강의2] [강의3] [강의4] ▶  캐러셀       │
│    ● ○ ○ ○                                      │
├──────────────────────────────────────────────────┤
│  ┌────────┐ ┌────────┐ ┌────────┐               │
│  │ 가치1  │ │ 가치2  │ │ 가치3  │               │
│  │ 교육철학│ │ 분석력 │ │ 경험  │               │
│  └────────┘ └────────┘ └────────┘               │
├──────────────────────────────────────────────────┤
│  프론트엔드 기본                                   │
│  ┌──────┐ ┌──────┐ ┌──────┐                     │
│  │ JS   │ │포폴  │ │브라우저│                     │
│  │ 초급  │ │ 초급  │ │ 초급  │                     │
│  └──────┘ └──────┘ └──────┘                     │
├──────────────────────────────────────────────────┤
│  프론트엔드 심화                                   │
│  ┌──────┐ ┌──────┐ ┌──────┐                     │
│  │React │ │TS    │ │Next  │                     │
│  │ 중급  │ │ 중급  │ │ 고급  │                     │
│  └──────┘ └──────┘ └──────┘                     │
├──────────────────────────────────────────────────┤
│  수강평 하이라이트                                  │
│  "정말 좋은 강의입니다..."  [더 많은 후기 보러가기]  │
├──────────────────────────────────────────────────┤
│  [Footer: 이용약관 | 개인정보 | 환불정책 | 문의]    │
│  [YouTube] [GitHub]  © 2026                      │
└──────────────────────────────────────────────────┘
```

#### 강의 상세 페이지
```
┌──────────────────────────────────────────────────┐
│ [Header]                                         │
├──────────────────────────────────────────────────┤
│  강의 제목                                        │
│  부제목 설명                                      │
│  [바로 등록하기 →]                                │
├──────────────────────────┬───────────────────────┤
│                          │ $169              [S] │
│  [소개 영상 플레이어]      │ ────────────         │
│                          │ ✓ 수강 기간 무제한     │
│                          │ ✓ Q&A 지원           │
│                          │ [바로 등록하기 →]      │
│                          │ (Sticky Sidebar)      │
├──────────────────────────┴───────────────────────┤
│  기술 스택: [React] [TS] [Tailwind] [Node] ...    │
├──────────────────────────────────────────────────┤
│  이 강의에서 배우는 것                              │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐   │
│  │ 프로젝트1  │ │ 프로젝트2  │ │ 프로젝트3  │   │
│  │ [이미지]   │ │ [이미지]   │ │ [이미지]   │   │
│  │ 설명...    │ │ 설명...    │ │ 설명...    │   │
│  └────────────┘ └────────────┘ └────────────┘   │
├──────────────────────────────────────────────────┤
│  커리큘럼 (15 챕터 · 85 레슨 · 22시간)             │
│  ▼ 챕터 1: 소개 (6개 강의, 26분)                  │
│    └ 1.1 강의 소개  [미리보기]         3:57       │
│    └ 1.2 개발 환경 설치               4:32       │
│    └ 1.3 ❓ 첫번째 챌린지                        │
│    └ 1.4 💡 챌린지 풀이              5:10       │
│  ▶ 챕터 2: 기본 문법 (12개 강의, 1시간 28분)       │
│  ▶ 챕터 3: ...                                  │
├──────────────────────────────────────────────────┤
│  강사 소개                                        │
│  [프로필 이미지] 이름 — 경력 설명                   │
│  [YouTube] [GitHub]                              │
├──────────────────────────────────────────────────┤
│  수강평 (1725개) ⭐ 5.0                           │
│  ┌──────────────────────────────────────┐        │
│  │ ⭐⭐⭐⭐⭐  리뷰 제목                    │        │
│  │ 리뷰 본문 텍스트...                     │        │
│  │ 작성자 · 2026-01-15                   │        │
│  └──────────────────────────────────────┘        │
│  (리뷰 더 보기)                                   │
├──────────────────────────────────────────────────┤
│  자주 묻는 질문                                    │
│  ▶ 수강기간은 얼마나 되나요?                        │
│  ▶ 환불은 어떻게 하나요?                           │
│  ▶ 수강 전 필요한 사전 지식이 있나요?                │
├──────────────────────────────────────────────────┤
│  수강 전 필요사항: HTML/CSS 기초, JavaScript 기초   │
├──────────────────────────────────────────────────┤
│  관련 강의: [강의 카드]                             │
├──────────────────────────────────────────────────┤
│  [Footer]                                        │
└──────────────────────────────────────────────────┘
```

#### 학습 페이지

3단 레이아웃: 좌측 커리큘럼 | 중앙 플레이어+설명 | 우측 토론. 좌/우 패널은 토글로 개별 열기/닫기 가능.

```
┌───────────────────────────────────────────────────────────────────┐
│ [Logo] 강의명                              [대시보드] [프로필]     │
├──────────────┬──────────────────────────────┬─────────────────────┤
│ [◀ 토글]     │                              │           [토글 ▶]  │
│ 커리큘럼      │     [Video Player]           │ 토론               │
│ ─────────    │     [HLS + 배속 + 화질]       │ ─────────          │
│ ▼ 챕터 1     │                              │ ┌───────────────┐  │
│   ✅ 1.1 소개│                              │ │ Q: ORM 질문    │  │
│   ▶️ 1.2 설치│                              │ │ 작성자 · 2h ago│  │
│   ○ 1.3 문법 │──────────────────────────────│ │ 💬 3 댓글      │  │
│ ▶ 챕터 2     │ 레슨 제목                     │ └───────────────┘  │
│ ▶ 챕터 3     │ [← 이전] [완료하고 다음 →]     │ ┌───────────────┐  │
│              │──────────────────────────────│ │ Q: 배포 관련    │  │
│ 진도:████░░  │ 레슨 설명 (MDX)               │ │ ...            │  │
│ 40%          │ ─────────────────            │ └───────────────┘  │
│              │ ## 이번 레슨에서는...          │                    │
│              │ 코드 예시:                     │ [+ 새 게시글 작성]  │
│              │ ```tsx                        │                    │
│              │ const app = ...               │                    │
│              │ ```                           │                    │
├──────────────┴──────────────────────────────┴─────────────────────┤
│ [Footer]                                                          │
└───────────────────────────────────────────────────────────────────┘

패널 토글 상태:
- 양쪽 열림: 커리큘럼(240px) | 플레이어+설명(fluid) | 토론(320px)
- 한쪽 닫힘: 플레이어+설명 영역 확장
- 양쪽 닫힘: 플레이어+설명 전체 너비
- 모바일: 패널 숨김, 하단 탭으로 커리큘럼/토론 전환 (하단 시트)
```

### 10.4 반응형 브레이크포인트

| 이름 | 범위 | 그리드 |
|------|------|--------|
| Mobile | 0–639px | 1열 |
| Tablet | 640–1023px | 2열 |
| Desktop | 1024–1279px | 3열 |
| Large | 1280px+ | 3열 (max-width) |

---

## 11. 보안 요구사항

### 11.1 인증/인가

| 항목 | 요구사항 |
|------|----------|
| 인증 | Supabase Auth (JWT, HttpOnly Cookie) |
| Admin 검증 | API Route에서 `users.role === 'admin'` 체크 |
| 영상 보호 | R2 비공개 버킷 + Enrollment 확인 후 Presigned URL 발급 (만료 시간 설정) |
| CSRF | SameSite Cookie + Origin 검증 |

### 11.2 입력 검증

| 항목 | 요구사항 |
|------|----------|
| 서버 검증 | Zod 스키마 |
| SQL Injection | Drizzle ORM 파라미터화 쿼리 |
| XSS | React 자동 이스케이프, 마크다운 렌더링 시 sanitize |

### 11.3 속도 제한

| 항목 | 요구사항 |
|------|----------|
| API | 100 req/분 (IP 기준) |
| 로그인 시도 | 5회/분 |
| 진도 저장 | 12 req/분 (5초 간격) |

---

## 12. 테스트 전략

### 12.1 테스트 도구

기존 보일러플레이트 설정 그대로 사용:
- **Unit/Component**: Vitest + React Testing Library (jsdom, globals)
- **E2E**: Playwright
- **테스트 위치**: `src/__tests__/` (소스 미러링)
- **i18n mock**: 기존 패턴 유지

### 12.2 테스트 대상 (우선순위)

#### Unit Tests
- 가격 포맷팅 유틸 (KRW/USD)
- 진도율 계산 로직
- 쿠폰 할인 계산
- Zod 검증 스키마 (리뷰, 강의 생성 등)
- 환불 가능 여부 판정

#### Component Tests
- CourseCard 렌더링 (제목, 뱃지, 리뷰 수)
- Curriculum 아코디언 (펼치기/접기)
- DiscussionPanel 게시글/댓글 렌더링
- LessonDescription MDX 렌더링
- 패널 토글 동작 (열기/닫기)
- ReviewCard 별점 표시
- PricingWidget (가격, CTA 상태)

#### E2E Tests
- 비회원: 랜딩 → 강의 목록 → 강의 상세 → 미리보기 재생
- 회원가입 → 로그인
- 강의 구매 플로우 (Polar checkout mock)
- 학습 플로우 (영상 재생 → 진도 저장 → 다음 레슨)
- 토론 플로우 (게시글 작성 → 댓글 작성)
- 리뷰 작성

### 12.3 커버리지 목표

| 영역 | 목표 |
|------|------|
| Unit | 80%+ |
| Component | 70%+ |
| E2E | 핵심 시나리오 100% |

---

## 13. 배포 전략

### 13.1 환경

기존 보일러플레이트의 Vercel 배포 유지:

| 환경 | URL | 용도 |
|------|-----|------|
| Development | localhost:3000 | 로컬 개발 |
| Preview | Vercel Preview | PR 미리보기 |
| Production | 커스텀 도메인 | 운영 (icn1 리전) |

### 13.2 환경 변수

기존 보일러플레이트 환경 변수 + 추가:

```env
# 기존 유지 (Supabase, Polar, Resend, Sentry, GA 등)

# 신규 — Cloudflare R2 (영상 + 정적 파일)
R2_ACCOUNT_ID=                  # Cloudflare 계정 ID
R2_ACCESS_KEY_ID=               # R2 API 토큰 Access Key
R2_SECRET_ACCESS_KEY=           # R2 API 토큰 Secret Key
R2_BUCKET_NAME=                 # R2 버킷 이름
R2_PUBLIC_DOMAIN=               # R2 커스텀 도메인 (CDN)
```

---

## 14. 마일스톤

### Phase 1: MVP (핵심 기능)

| 작업 | 설명 |
|------|------|
| DB 스키마 확장 | courses, chapters, lessons, enrollments, progress, reviews, coupons, discussions, comments 테이블 |
| 강의 CRUD API | 관리자 강의 생성/수정/삭제 |
| 랜딩 페이지 | 히어로, 캐러셀, 카테고리 섹션, 가치 제안 |
| 강의 목록 | 카테고리별 그리드 |
| 강의 상세 | 커리큘럼, 미리보기, 구매 위젯, FAQ |
| 결제 연동 | Polar checkout → webhook → enrollment |
| 학습 페이지 | 3단 레이아웃 (커리큘럼/플레이어+MDX설명/토론), 토글 패널, 진도 저장 |
| 대시보드 | 내 강의, 진도율, 이어서 학습 |
| Header/Footer | 네비게이션 업데이트 |
| 문의 페이지 | 이메일 연락처 |
| 법적 페이지 | 환불 정책 추가 |

### Phase 2: 성장 기능

| 작업 | 설명 |
|------|------|
| 리뷰 시스템 | 작성, 수정, 삭제, 리뷰 모아보기 페이지 |
| 관리자 — 회원 관리 | 회원 목록, 검색, 수동 등록 |
| 관리자 — 매출 대시보드 | 차트, 결제 내역 |
| 쿠폰 시스템 | 생성, 적용, 관리 |
| 이메일 알림 | 결제 완료, 환불 완료 |
| SEO 최적화 | 사이트맵, OG 이미지, 메타 태그 |

### Phase 3: 확장

| 작업 | 설명 |
|------|------|
| AI Q&A 도우미 | 강의 내용 기반 RAG |
| 학습 통계 | 히트맵, 스트릭, 총 학습 시간 |
| 학습 노트 | 마크다운 에디터, 타임스탬프 |
| 번들 패키지 | 강의 묶음 할인 |
| 커뮤니티 확장 | 토론 알림, 좋아요, 검색 |

---

## 15. 리스크 및 의존성

### 15.1 기술적 리스크

| 리스크 | 영향 | 대응 |
|--------|------|------|
| 영상 스트리밍 품질 | 높음 | CDN + 어댑티브 비트레이트, 사전 테스트 |
| Polar 서비스 장애 | 높음 | Webhook 재시도, 결제 상태 폴링 |
| 영상 무단 다운로드 | 중간 | R2 Presigned URL 만료, Referer 검증, HLS 세그먼트 암호화(AES-128) |
| Supabase 무료 한도 | 중간 | 사용량 모니터링, 유료 전환 계획 |

### 15.2 외부 의존성

| 서비스 | 용도 | 대안 |
|--------|------|------|
| Supabase | DB, Auth | PlanetScale, Clerk |
| Polar | 결제 | Stripe, Paddle |
| Vercel | 호스팅 | Cloudflare Pages |
| Resend | 이메일 | SendGrid |
| Cloudflare R2 | 영상 저장/CDN (egress 무료) | S3 + CloudFront, Bunny.net Storage |

---

**문서 끝**

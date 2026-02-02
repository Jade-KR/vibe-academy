# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**vibePack** is a Next.js SaaS boilerplate with auth, payments, email, monitoring, and i18n. PRD at `docs/vibePack-PRD.md`.

## Tech Stack

- **Framework**: Next.js 16+ (App Router), React 19, TypeScript 5.x (strict)
- **Styling**: Tailwind CSS 3.x (class-based dark mode), shadcn/ui
- **Database**: PostgreSQL 15 (Supabase), Drizzle ORM
- **Auth**: Supabase Auth (email/password, social OAuth, magic link, OTP)
- **Payments**: Polar SDK (subscriptions + one-time)
- **Email**: Resend with React email templates
- **Data Fetching**: SWR 2.x
- **Forms**: react-hook-form 7.x + Zod validation
- **i18n**: next-intl (ko default, en), URL-based locale prefix (`/ko/...`, `/en/...`)
- **Theme**: next-themes (light/dark/system)
- **Testing**: Vitest + React Testing Library, Playwright
- **Monitoring**: Sentry (planned, not yet installed)
- **Deploy**: Vercel (region: icn1)

## Commands

```bash
pnpm dev                # Start dev server
pnpm build              # Production build
pnpm lint               # ESLint
pnpm lint:fix           # ESLint autofix
pnpm format             # Prettier
pnpm typecheck          # tsc --noEmit
pnpm test               # Vitest unit tests
pnpm test -- src/__tests__/widgets/landing/  # Run tests for specific directory
pnpm test -- --testNamePattern "renders hero" # Run tests matching name pattern
pnpm test:ui            # Vitest browser UI
pnpm test:coverage      # Vitest with coverage
pnpm test:e2e           # Playwright E2E
pnpm test:e2e:ui        # Playwright browser UI
pnpm db:generate        # Drizzle generate migrations
pnpm db:push            # Drizzle push schema
pnpm db:studio          # Drizzle Studio (DB browser)
pnpm db:seed            # Seed database
pnpm setup              # Full setup (env validation, migrations, seed, build)
pnpm email:dev          # Preview email templates
```

## Architecture: Feature-Sliced Design (FSD)

The codebase follows **FSD** with strict layer hierarchy. Imports flow downward only — upper layers may import from lower layers, never the reverse.

```
src/app/         → Next.js App Router (layouts, route groups, API routes)
src/pages/       → Page compositions (thin server components)
src/widgets/     → Self-contained UI blocks (header, footer, sidebar, landing, pricing-table, etc.)
src/features/    → User scenarios (auth/login, auth/register, settings/profile, etc.)
src/entities/    → Business models (user, subscription, payment — hooks & types)
src/shared/      → Reusable foundation (ui, api, config, lib, providers, types, hooks)
src/db/          → Drizzle schema & migrations (outside FSD layers)
src/i18n/        → next-intl config, routing, navigation helpers
src/content/     → MDX blog posts and legal pages
```

### Path Aliases

```
@/app/*  @/pages/*  @/widgets/*  @/features/*  @/entities/*  @/shared/*  @/db/*  @/content/*  @/i18n/*
```

### Slice Internal Structure

Each feature, entity, or widget follows this pattern:

```
slice-name/
  index.ts       # Public API (barrel export — only export what should be consumed)
  ui/            # Components
  model/         # Business logic, hooks, state
  api/           # API calls
  lib/           # Utilities
  config/        # Configuration
```

### Key Shared Locations

- `src/shared/ui/` — shadcn/ui components (Button, Card, Dialog, Toast, etc.), import via `@/shared/ui`
- `src/shared/api/supabase/` — Browser client, server client, storage helper, middleware
- `src/shared/api/polar/` — Polar payment client and webhooks
- `src/shared/api/resend/` — Email client and React templates
- `src/shared/config/` — site.ts, auth.ts, navigation.ts
- `src/shared/lib/` — cn() utility, format helpers, Zod validation schemas
- `src/shared/providers/` — Individual provider components (SWR, theme, auth); composed in `src/app/providers.tsx`
- `src/shared/types/` — Shared TypeScript type definitions

### Route Groups

- `src/app/[locale]/(auth)/` — Auth pages. Redirects to dashboard if already authenticated.
- `src/app/[locale]/(dashboard)/` — Protected. Requires auth + email verification.
- `src/app/[locale]/(marketing)/` — Public. Landing, pricing, blog, legal.
- `src/app/api/` — REST API routes (auth, user, payments, health)

### Data Flow

- Client components use SWR hooks (`useUser`, `useSubscription`) from `@/entities/` fetching from API routes
- API routes use Supabase server client for auth and Drizzle ORM for DB queries
- Payments: Polar checkout → webhook → DB update
- Middleware (`src/middleware.ts`): locale routing (next-intl) → Supabase session refresh → route protection (redirect unauthenticated users, redirect unverified email, redirect authenticated users away from auth pages)

### Database Schema

Three tables in `src/db/schema/`: `users` (profile + supabase_user_id), `subscriptions` (polar_subscription_id, plan_id, status, period), `payments` (polar_payment_id, amount, currency, status). Enums: `subscription_status`, `payment_status`.

### i18n

- Config: `src/i18n/config.ts` (locales, defaultLocale), `src/i18n/routing.ts`, `src/i18n/request.ts`
- Navigation: `import { Link } from "@/i18n/navigation"` — locale-aware Link, redirect, usePathname, useRouter
- Translations: `public/locales/{ko,en}/common.json`
- Client components: `useTranslations("namespace")`
- Server components: `await getTranslations("namespace")`

### Component Conventions

- `"use client"` directive for components using hooks (useTranslations, useState, etc.)
- UI primitives: `import { Button, Card } from "@/shared/ui"`
- Icons: `lucide-react`
- Links with buttons: `<Button asChild><Link href="/path">{text}</Link></Button>`
- Semantic Tailwind tokens for dark mode: `bg-background`, `text-foreground`, `text-muted-foreground`, `bg-muted/50`, `bg-card`, `border`
- Filenames: kebab-case. Components: PascalCase named exports.

### Testing

- Unit tests: `src/__tests__/` mirroring source structure (Vitest + jsdom + React Testing Library)
- E2E tests: `e2e/` directory (Playwright, Chromium only)
- Setup file: `src/__tests__/setup.ts` includes ResizeObserver polyfill for Radix UI components
- Mock pattern for i18n in tests:
  ```typescript
  vi.mock("next-intl", () => ({
    useTranslations: () => (key: string) => key,
  }));
  vi.mock("@/i18n/navigation", () => ({
    Link: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
  }));
  ```

### Code Style

- **Prettier**: double quotes, semicolons, trailing commas, 2-space indent, 100 char print width
- **ESLint**: `next/core-web-vitals` + `@typescript-eslint/recommended` + `prettier`; unused vars must be `_` prefixed; `no-explicit-any` is warn-level
- **Provider nesting order** in `src/app/providers.tsx`: IntlProvider → ThemeProvider → AuthProvider → SWRProvider

## Solo Workflow

This project uses the solo workflow plugin. Skills in `.claude/skills/`:

- `vercel-react-best-practices` — React/Next.js performance patterns
- `supabase-postgres-best-practices` — Postgres optimization
- `web-design-guidelines` — UI/UX review

## Reference Docs

- `docs/PROJECT-OVERVIEW.md` — Comprehensive Korean-language architecture document covering auth flows, payment system, middleware chain, provider composition, API response format, and all widget/entity details
- `docs/PRD-lecture-platform.md` — PRD for the lecture platform (next phase, builds on vibePack boilerplate)

## 꼭 지켜야할것

- 구현과정과 생각은 영어로 하고, 최종 결과만 한글로 말해줘.

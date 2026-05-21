# Tools & Technology

## Language & Runtime

- **Node.js:** 22 LTS
- **TypeScript:** 5.x (strict mode on every package)
- **Package manager:** npm (npm workspaces)

## Web (`apps/web`)

- **Vite** — build tool, dev server.
- **React 18** with TypeScript.
- **Tailwind CSS** — utility-first styling, design tokens via `tailwind.config.ts`.
- **TanStack Query** with `@tanstack/query-async-storage-persister` for IndexedDB persistence.
- **Zustand** — global state for UI prefs and offline status.
- **Formik + Yup** — forms (sign-in, sign-up).
- **react-i18next** — i18n.
- **Mapbox GL JS** — interactive map.
- **Vite PWA plugin** (`vite-plugin-pwa`) — Service Worker, offline app shell, Mapbox tile cache.
- **Vitest + React Testing Library** — unit/integration tests.
- **Cypress** — E2E (deferred to phase 7).

## Mobile (`apps/mobile`)

- **Expo SDK 50+** with TypeScript.
- **Expo Router** — file-based routing.
- **React Native Paper** — UI components.
- **TanStack Query** persisted via `expo-sqlite`.
- **Zustand**, **Formik + Yup**, **react-i18next** (matches web).
- **`@rnmapbox/maps`** — native Mapbox with `OfflineManager` for offline packs.
- **Expo SecureStore** — Cognito refresh tokens.
- **`expo-auth-session`** — Cognito Hosted UI.
- **Jest + React Native Testing Library** — unit/integration.
- **Maestro** — E2E (deferred).

## Shared (`packages/shared`)

- **Zod** — schemas + parsing for shared types.
- **TanStack Query** hooks (consumed by both apps).

## Backend (`backend/`)

- **Express** behind `serverless-http` for AWS Lambda.
- **Joi** — request validation middleware.
- **AWS SDK v3** — DynamoDB, Secrets Manager, Cognito.
- **`aws-jwt-verify`** — Cognito JWT validation middleware.
- **`dayjs`** — date utilities.
- **Vitest** — unit tests with `vi.mock` for AWS SDK + Spotify.

## Scraper (`scraper/`)

- **Cheerio** — HTML parsing.
- **`undici`** — fetch.
- **Lambda + EventBridge** — scheduled trigger.

## Infrastructure (`infrastructure/`)

- **CloudFormation** (YAML) with nested stacks via SAM CLI.
- **`cfn-lint`**, **`cfn_nag`** — validation and security scan.

## CI/CD

- **GitHub Actions** — `ci.yml` (reusable), `deploy-dev.yml` (auto on PR/main), `deploy-prod.yml` (manual dispatch).
- **EAS Build** — mobile binaries.
- **EAS Update** — OTA updates for mobile.

## Dev tooling

- **ESLint** (Airbnb + TypeScript ruleset).
- **Prettier** with `.prettierrc`.
- **Husky** — `pre-commit` (lint-staged), `pre-push` (full tests), `commit-msg` (commitlint).
- **commitlint** with conventional-config.
- **lint-staged** — only run on staged files.

## External Services

| Service         | Purpose                     | Auth                                                   |
| --------------- | --------------------------- | ------------------------------------------------------ |
| Spotify Web API | Artist metadata, top tracks | Client Credentials (server-side only)                  |
| Mapbox          | Map tiles, custom styles    | Public restricted token (web), download token (mobile) |
| Amazon Cognito  | Optional user accounts      | OAuth2 / JWT                                           |
| AWS DynamoDB    | Single-table data store     | IAM role                                               |

## Environment Setup

```bash
# Prereqs: node 22, npm 10, AWS CLI configured, SAM CLI, Expo CLI, EAS CLI

git clone <repo>
cd unofficial-glasto
npm install                    # installs all workspace deps
npm run dev:web                # starts Vite dev server on :5173
npm run dev:mobile             # starts Expo on :8081
npm run dev:backend            # starts Express locally on :3000

# Infrastructure (dev):
cd infrastructure
sam build && sam deploy --guided --stack-name glasto-dev
```

`.env.example` files in each app document required environment variables. Copy to `.env.local` (web) or set via `expo-constants` extra config (mobile).

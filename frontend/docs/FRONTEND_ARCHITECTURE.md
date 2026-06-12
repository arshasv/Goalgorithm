# FIFA Elite Analytics — Frontend Architecture

> This document defines the planned technical architecture for the FIFA Elite Analytics frontend application. It covers folder structure, technology decisions, API integration, state management, routing, and component organization. No implementation code exists yet — this is a design-first planning document.

---

## Technology Stack (Planned)

| Layer | Technology | Rationale |
|---|---|---|
| **Framework** | React 18+ | Component-driven, ecosystem maturity, hooks-based patterns |
| **Build Tool** | Vite | Fast dev server, ESBuild-based HMR, minimal config |
| **Language** | TypeScript | Type safety for API contracts, better IDE support |
| **Routing** | React Router v6 | Nested layouts, data loaders, standard SPA routing |
| **State Management** | Zustand | Lightweight, no boilerplate, selective subscriptions |
| **Server State** | TanStack Query (React Query) | Caching, background refetching, optimistic updates for API data |
| **Styling** | Vanilla CSS (CSS Modules) | Full control, design token integration via CSS custom properties |
| **Charts** | Recharts or Victory | React-native chart components, responsive, accessible |
| **HTTP Client** | Axios | Interceptors for auth, centralized error handling |
| **Form Handling** | React Hook Form + Zod | Performant form validation, schema-based |
| **Icons** | Lucide React | Consistent, lightweight, tree-shakeable icon set |
| **Testing** | Vitest + React Testing Library | Vite-native testing, component-level and integration tests |
| **Linting** | ESLint + Prettier | Code quality and formatting enforcement |

---

## Planned Folder Structure

```
frontend/
│
├── docs/                              ← You are here (design documentation)
│   ├── DESIGN_SYSTEM.md
│   ├── DESIGN_TOKENS.md
│   ├── COMPONENT_GUIDELINES.md
│   └── FRONTEND_ARCHITECTURE.md
│
├── public/                            ← Static assets served as-is
│   ├── favicon.ico
│   ├── logo.svg
│   └── fonts/                         ← Self-hosted web fonts (Outfit, Inter, JetBrains Mono)
│
├── src/
│   │
│   ├── main.tsx                       ← App entry point, provider wrappers
│   ├── App.tsx                        ← Root component with router setup
│   │
│   ├── assets/                        ← Images, SVGs, static media
│   │   ├── images/
│   │   └── icons/
│   │
│   ├── styles/                        ← Global styles and design tokens
│   │   ├── tokens.css                 ← CSS custom properties (design tokens)
│   │   ├── reset.css                  ← CSS reset / normalize
│   │   ├── global.css                 ← Global typography, body styles
│   │   ├── animations.css             ← @keyframes definitions
│   │   └── themes/
│   │       ├── dark.css               ← Dark mode token overrides
│   │       └── light.css              ← Light mode token overrides
│   │
│   ├── components/                    ← Reusable UI components
│   │   ├── common/                    ← Generic components used everywhere
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Button.module.css
│   │   │   │   └── Button.test.tsx
│   │   │   ├── Modal/
│   │   │   ├── Toast/
│   │   │   ├── Skeleton/
│   │   │   ├── EmptyState/
│   │   │   └── Badge/
│   │   │
│   │   ├── navigation/               ← Navigation-specific components
│   │   │   ├── Navbar/
│   │   │   ├── Sidebar/
│   │   │   └── Breadcrumbs/
│   │   │
│   │   ├── data-display/             ← Data visualization components
│   │   │   ├── LeaderboardTable/
│   │   │   ├── TeamCard/
│   │   │   ├── MatchCard/
│   │   │   ├── ScoreBreakdownCard/
│   │   │   ├── RankBadge/
│   │   │   ├── GradeBadge/
│   │   │   ├── PhaseIndicator/
│   │   │   └── DashboardCard/
│   │   │
│   │   ├── charts/                   ← Chart wrapper components
│   │   │   ├── StackedBarChart/
│   │   │   ├── LineChart/
│   │   │   ├── RadarChart/
│   │   │   └── DonutChart/
│   │   │
│   │   └── forms/                    ← Form-specific components
│   │       ├── FormInput/
│   │       ├── FormSelect/
│   │       ├── FormDatePicker/
│   │       ├── ScoreInput/
│   │       └── SearchFilterBar/
│   │
│   ├── layouts/                       ← Page layout shells
│   │   ├── DashboardLayout.tsx        ← Sidebar + Navbar + content area
│   │   ├── DashboardLayout.module.css
│   │   ├── AuthLayout.tsx             ← Centered card layout (login, future)
│   │   └── MinimalLayout.tsx          ← Full-width, no sidebar
│   │
│   ├── pages/                         ← Route-level page components
│   │   ├── Dashboard/
│   │   │   ├── DashboardPage.tsx
│   │   │   └── DashboardPage.module.css
│   │   ├── Leaderboard/
│   │   │   ├── LeaderboardPage.tsx
│   │   │   └── LeaderboardPage.module.css
│   │   ├── Matches/
│   │   │   ├── MatchListPage.tsx
│   │   │   ├── MatchDetailPage.tsx
│   │   │   └── Matches.module.css
│   │   ├── Teams/
│   │   │   ├── TeamListPage.tsx
│   │   │   ├── TeamProfilePage.tsx
│   │   │   └── Teams.module.css
│   │   ├── Evaluations/
│   │   │   ├── TechnicalEvalPage.tsx
│   │   │   ├── PresentationEvalPage.tsx
│   │   │   └── Evaluations.module.css
│   │   ├── Admin/
│   │   │   ├── MatchManagementPage.tsx
│   │   │   ├── ScoreRecalcPage.tsx
│   │   │   ├── AuditLogPage.tsx
│   │   │   └── Admin.module.css
│   │   └── NotFound/
│   │       └── NotFoundPage.tsx
│   │
│   ├── hooks/                         ← Custom React hooks
│   │   ├── useTheme.ts               ← Theme toggle and persistence
│   │   ├── useAuth.ts                ← Auth state and role access
│   │   ├── useMediaQuery.ts          ← Responsive breakpoint detection
│   │   ├── useSidebar.ts             ← Sidebar collapse state
│   │   └── useDebounce.ts            ← Input debouncing
│   │
│   ├── services/                      ← API communication layer
│   │   ├── api.ts                    ← Axios instance with base config
│   │   ├── leaderboardService.ts     ← Leaderboard API calls
│   │   ├── matchService.ts           ← Match CRUD API calls
│   │   ├── predictionService.ts      ← Prediction submission/retrieval
│   │   ├── scoringService.ts         ← Score calculation triggers
│   │   ├── evaluationService.ts      ← Phase 2/3 evaluation API calls
│   │   └── teamService.ts           ← Team management API calls
│   │
│   ├── stores/                        ← Zustand state stores
│   │   ├── themeStore.ts             ← Light/dark mode state
│   │   ├── sidebarStore.ts           ← Sidebar collapsed/expanded state
│   │   ├── authStore.ts              ← User role and auth token
│   │   └── notificationStore.ts     ← Toast notification queue
│   │
│   ├── queries/                       ← TanStack Query hooks
│   │   ├── useLeaderboard.ts         ← Leaderboard data fetching
│   │   ├── useMatches.ts             ← Match list and detail fetching
│   │   ├── useTeams.ts               ← Team data fetching
│   │   ├── useScores.ts              ← Score breakdown fetching
│   │   └── useEvaluations.ts         ← Evaluation data fetching
│   │
│   ├── types/                         ← TypeScript type definitions
│   │   ├── api.types.ts              ← API response/request types
│   │   ├── leaderboard.types.ts      ← Leaderboard domain types
│   │   ├── match.types.ts            ← Match domain types
│   │   ├── prediction.types.ts       ← Prediction domain types
│   │   ├── score.types.ts            ← Score breakdown domain types
│   │   ├── evaluation.types.ts       ← Evaluation domain types
│   │   ├── team.types.ts             ← Team domain types
│   │   └── common.types.ts           ← Shared utility types
│   │
│   ├── utils/                         ← Pure utility functions
│   │   ├── formatters.ts             ← Number, date, score formatting
│   │   ├── validators.ts            ← Client-side validation helpers
│   │   ├── constants.ts              ← App-wide constants (max scores, phase names)
│   │   └── classNames.ts            ← CSS module class name helpers
│   │
│   └── config/                        ← App configuration
│       ├── routes.ts                 ← Route path constants
│       ├── apiConfig.ts              ← API base URL, timeout, retry config
│       └── appConfig.ts              ← Feature flags, environment detection
│
├── index.html                         ← Vite HTML entry point
├── vite.config.ts                     ← Vite configuration
├── tsconfig.json                      ← TypeScript configuration
├── tsconfig.node.json                 ← Node-specific TS config (vite config)
├── package.json                       ← Dependencies and scripts
├── .eslintrc.cjs                      ← ESLint configuration
├── .prettierrc                        ← Prettier configuration
└── .env.example                       ← Environment variable template
```

---

## API Communication Approach

### Architecture

The frontend communicates with the FastAPI backend via a centralized HTTP client layer. All API calls flow through a single path:

```
Component → TanStack Query Hook → Service Function → Axios Instance → Backend API
```

### Axios Instance Configuration

A single pre-configured Axios instance is used application-wide:

| Setting | Value |
|---|---|
| Base URL | Read from `VITE_API_BASE_URL` env variable |
| Default timeout | 15 seconds |
| Response format | JSON |
| Content-Type | `application/json` |

### Request Interceptors (Planned)

| Interceptor | Purpose |
|---|---|
| **Auth Header** | Attach JWT token from auth store to `Authorization` header |
| **Request ID** | Generate unique request ID for traceability |

### Response Interceptors (Planned)

| Interceptor | Purpose |
|---|---|
| **Error Normalization** | Transform backend error envelope into consistent frontend error type |
| **401 Handler** | Redirect to login on authentication failure |
| **Network Error Handler** | Show "connection lost" toast on network failures |

### Service Layer Pattern

Each service module exports typed async functions:

```
leaderboardService.ts
├── getLeaderboard()            → GET /api/v1/leaderboard
├── calculateLeaderboard()      → POST /api/v1/leaderboard/calculate
└── exportLeaderboard(format)   → GET /api/v1/leaderboard/export
```

Services handle request construction and return typed response data. They do not manage caching, loading states, or error UI — that is the responsibility of TanStack Query hooks.

### TanStack Query Integration

Each entity domain has a dedicated query hooks file:

| Hook | Query Key | Stale Time | Refetch |
|---|---|---|---|
| `useLeaderboard()` | `['leaderboard']` | 30 seconds | On window focus |
| `useMatches()` | `['matches']` | 60 seconds | On window focus |
| `useMatch(id)` | `['match', id]` | 30 seconds | On mount |
| `useTeams()` | `['teams']` | 5 minutes | On window focus |
| `useScoreBreakdown(matchId, teamId)` | `['score', matchId, teamId]` | 30 seconds | Manual |

Mutations (POST/PUT/DELETE) use `useMutation` with `onSuccess` callbacks that invalidate related query keys.

### Backend API Mapping

Based on the existing [API Planning](../../docs/api) documentation:

| Frontend Service | Backend Endpoint | Method |
|---|---|---|
| `predictionService.submitPrediction()` | `/api/v1/predictions` | POST |
| `matchService.getMatches()` | `/api/v1/matches` | GET |
| `scoringService.calculateMatchScore()` | `/api/v1/calculate-match-score` | POST |
| `scoringService.calculateTechnicalScore()` | `/api/v1/technical-score` | POST |
| `scoringService.calculatePresentationScore()` | `/api/v1/presentation-score` | POST |
| `leaderboardService.calculateLeaderboard()` | `/api/v1/leaderboard/calculate` | POST |
| `leaderboardService.getLeaderboard()` | `/api/v1/leaderboard` | GET |

### Error Handling Strategy

All API errors are transformed into a consistent `ApiError` type:

| Field | Type | Description |
|---|---|---|
| `code` | string | Backend error code (e.g., `VALIDATION_ERROR`) |
| `message` | string | Human-readable error message |
| `status` | number | HTTP status code |
| `details` | object or null | Additional validation details if present |

Components access error state via TanStack Query's `error` field and render appropriate error UI.

---

## State Management Plan

### State Categories

| Category | Tool | Scope | Examples |
|---|---|---|---|
| **Server State** | TanStack Query | Cached API data | Leaderboard, matches, teams, scores |
| **Client UI State** | Zustand | App-level UI state | Theme, sidebar collapsed, auth token |
| **Local Component State** | React `useState` | Single component | Form input values, dropdown open, accordion expanded |
| **URL State** | React Router | Route-level | Current page, match ID, team ID, sort column |

### Zustand Stores

| Store | State | Actions |
|---|---|---|
| `themeStore` | `theme: 'dark' \| 'light'` | `toggleTheme()`, `setTheme(theme)` |
| `sidebarStore` | `collapsed: boolean` | `toggle()`, `collapse()`, `expand()` |
| `authStore` | `token: string \| null`, `role: Role \| null` | `login(token)`, `logout()`, `getRole()` |
| `notificationStore` | `toasts: Toast[]` | `addToast(toast)`, `removeToast(id)` |

### State Principles

1. **Server state is the source of truth** — The frontend never locally computes scores or rankings. All scoring data comes from the backend.
2. **Minimal client state** — Only UI preferences and auth tokens are stored client-side.
3. **URL as state** — Filters, sort order, selected match/team are reflected in the URL for shareability.
4. **No prop drilling** — Shared state accessed via hooks (`useTheme()`, `useAuth()`) not via props chains.

---

## Routing Plan

### Route Structure

| Path | Page | Layout | Access |
|---|---|---|---|
| `/` | Dashboard | DashboardLayout | All roles |
| `/leaderboard` | Leaderboard | DashboardLayout | All roles |
| `/matches` | Match List | DashboardLayout | All roles |
| `/matches/:matchId` | Match Detail | DashboardLayout | All roles |
| `/teams` | Team List | DashboardLayout | All roles |
| `/teams/:teamId` | Team Profile | DashboardLayout | All roles |
| `/evaluations/technical` | Technical Evaluation Form | DashboardLayout | Committee |
| `/evaluations/presentation` | Presentation Evaluation Form | DashboardLayout | Committee |
| `/admin/matches` | Match Management | DashboardLayout | Organizer |
| `/admin/recalculate` | Score Recalculation | DashboardLayout | Organizer |
| `/admin/audit` | Audit Log | DashboardLayout | Organizer |
| `*` | 404 Not Found | MinimalLayout | All roles |

### Route Organization

Routes are organized using React Router v6 nested layout routes:

```
<Routes>
  <Route element={<DashboardLayout />}>
    <Route index element={<DashboardPage />} />
    <Route path="leaderboard" element={<LeaderboardPage />} />
    <Route path="matches" element={<MatchListPage />} />
    <Route path="matches/:matchId" element={<MatchDetailPage />} />
    <Route path="teams" element={<TeamListPage />} />
    <Route path="teams/:teamId" element={<TeamProfilePage />} />
    <Route path="evaluations/technical" element={<TechnicalEvalPage />} />
    <Route path="evaluations/presentation" element={<PresentationEvalPage />} />
    <Route path="admin/matches" element={<MatchManagementPage />} />
    <Route path="admin/recalculate" element={<ScoreRecalcPage />} />
    <Route path="admin/audit" element={<AuditLogPage />} />
  </Route>
  <Route path="*" element={<NotFoundPage />} />
</Routes>
```

### Route Guards (Planned)

- Role-based access control enforced at the route level
- Unauthorized access redirects to Dashboard with a warning toast
- Auth token validated before protected route renders

---

## Component Organization

### Component File Structure

Each component follows a consistent file structure:

```
ComponentName/
├── ComponentName.tsx           ← Component implementation
├── ComponentName.module.css    ← Scoped styles (CSS Modules)
├── ComponentName.test.tsx      ← Unit/integration tests
└── index.ts                    ← Re-export for clean imports
```

### Component Categories

| Category | Location | Responsibility |
|---|---|---|
| **Common** | `components/common/` | Generic, reusable across all pages |
| **Navigation** | `components/navigation/` | App navigation structure |
| **Data Display** | `components/data-display/` | Domain-specific data rendering |
| **Charts** | `components/charts/` | Visualization wrappers |
| **Forms** | `components/forms/` | Input controls and form groups |
| **Layouts** | `layouts/` | Page-level layout shells |
| **Pages** | `pages/` | Route-level page compositions |

### Component Design Rules

1. **Components are purely presentational or container — never both**
   - Presentational: receives props, renders UI, no API calls
   - Container: fetches data via hooks, passes to presentational children

2. **No business logic in components**
   - Score calculations, validation rules, and data transformations belong in `utils/` or come from the backend

3. **CSS Modules for scoping**
   - Each component's styles are scoped via `.module.css` files
   - Global design tokens accessed via `var(--token-name)` within module files

4. **Co-located tests**
   - Every component has a `.test.tsx` file in the same directory

---

## Integration with Backend APIs

### Contract Alignment

The frontend TypeScript types in `types/` are derived directly from the backend's Pydantic schemas and the [Input/Output Contracts](../../docs/api) documentation. This ensures type safety across the stack.

| Backend Schema | Frontend Type |
|---|---|
| `PredictionRequest` | `prediction.types.ts → PredictionInput` |
| `ActualResultRequest` | `match.types.ts → ActualResult` |
| `MatchScoreResponse` | `score.types.ts → ScoreBreakdown` |
| `LeaderboardEntry` | `leaderboard.types.ts → LeaderboardEntry` |
| `TechnicalEvaluationRequest` | `evaluation.types.ts → TechnicalEvalInput` |
| `PresentationEvaluationRequest` | `evaluation.types.ts → PresentationEvalInput` |

### Data Flow

```
Backend API  →  Axios  →  Service Layer  →  TanStack Query  →  Component Props  →  UI
                                                   ↑
                                              Cache Layer
                                         (stale-while-revalidate)
```

### CORS Configuration

The backend FastAPI server must include the frontend origin in its CORS allowed origins. This is a backend configuration concern but the frontend expects:

| Header | Expected Value |
|---|---|
| `Access-Control-Allow-Origin` | Frontend dev server URL (e.g., `http://localhost:5173`) |
| `Access-Control-Allow-Methods` | `GET, POST, PUT, DELETE, OPTIONS` |
| `Access-Control-Allow-Headers` | `Content-Type, Authorization` |

### Environment Variables

| Variable | Purpose | Example |
|---|---|---|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8000/api/v1` |
| `VITE_APP_TITLE` | Application title | `FIFA Elite Analytics` |
| `VITE_ENABLE_MOCK` | Enable mock data mode for development | `false` |

---

## Development Workflow

### Available Scripts (Planned)

| Command | Purpose |
|---|---|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Production build |
| `npm run preview` | Preview production build locally |
| `npm run test` | Run Vitest test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Run ESLint |
| `npm run format` | Run Prettier |
| `npm run type-check` | Run TypeScript compiler check (no emit) |

### Development Dependencies

| Dependency | Purpose |
|---|---|
| `vite` | Build tool and dev server |
| `typescript` | Type checking |
| `vitest` | Test runner |
| `@testing-library/react` | Component testing |
| `@testing-library/user-event` | User interaction simulation |
| `jsdom` | Browser environment for tests |
| `eslint` | Code linting |
| `prettier` | Code formatting |
| `msw` | Mock Service Worker for API mocking in tests |

---

## Related Documents

| Document | Purpose |
|---|---|
| [Design System](DESIGN_SYSTEM.md) | Visual philosophy and UX principles |
| [Design Tokens](DESIGN_TOKENS.md) | Concrete design token values |
| [Component Guidelines](COMPONENT_GUIDELINES.md) | Per-component specs and states |
| [Backend Architecture](../../backend/BACKEND_ARCHITECTURE.md) | Backend layer structure |
| [API Planning](../../docs/api) | Backend API endpoint documentation |

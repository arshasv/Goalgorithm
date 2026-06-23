# Frontend Architecture Quality

## Purpose
This QA skill evaluates the structure, composition, state management, performance, and component hierarchy of React-based frontends. It validates hooks abstraction, container-presenter patterns, component reusability, rendering optimization, routing isolation, and folder structure consistency to ensure a highly scalable and maintainable UI workspace.

## Files Analyzed
- `react-frontend/src/components/**/*.jsx` / `*.tsx` (Reusable visual components)
- `react-frontend/src/pages/**/*.jsx` / `*.tsx` (Page-level view components)
- `react-frontend/src/contexts/**/*.js` / `*.tsx` (Global context and state management)
- `react-frontend/src/hooks/**/*.js` / `*.ts` (Custom React hooks)
- `react-frontend/src/api/**/*.js` / `*.ts` (Client API calling services)
- `react-frontend/src/App.jsx` and `main.jsx` (Application routing and setup)

## Checks Performed
1. **Component Separation and Hierarchy**: Verify page-level container components (handling API calls and side effects) are separated from modular presentational components (handling visual rendering and user interaction).
2. **State Management Health**: Audit context usage and state lifecycle. Identify state duplication, props drilling, and unnecessary context wrapper nestings that cause application-wide performance degradation.
3. **Custom Hook Extraction**: Check if repetitive patterns (e.g. data fetching, authentication states, form handling) are cleanly extracted into custom React hooks (`useAuth`, `useFetch`, etc.).
4. **Rendering Optimization**: Search for rendering bottlenecks, such as inline functions passed to child components without memoization (`useCallback`/`useMemo`), and large un-memoized loops.
5. **Folder Structure Consistency**: Validate structure conforms to logical folders: `/components` (shared), `/pages` (views), `/contexts` (states), `/hooks` (side effects), and `/api` (rest handlers).
6. **Dead Code and Placeholders**: Detect unused imports, dead components, console logs, and hardcoded test states.

## Scoring Criteria
- **90 - 100: Production Grade**: Strong separation of views and presentation, clean hooks usage, well-structured API client layers, proper route protection, and zero props-drilling issues.
- **80 - 89: Minor Improvements Needed**: Component separation is mostly clean, but contains minor inline styles, localized hooks that should be shared, or light props-drilling.
- **70 - 79: Acceptable but Needs Fixes**: Page views executing complex inline business logic or calculations, redundant rendering triggers, or context abuse.
- **Below 70: Not Production Ready**: Monolithic components mixing layouts, forms, API calls, and logic in single files; unstructured state management; unprotected frontend routes.

## Point Distribution
- **Component Reusability & SRP - 30 Points**: Minimal component complexity, modular design, single responsibility per UI piece.
- **State Management & Data Flow - 25 Points**: Clean local state, efficient global context, no props-drilling, clean reactive hooks.
- **API Integration & Service Isolation - 25 Points**: API calls abstracted outside of UI views, clean Axios/Fetch clients, loading/error states management.
- **Code Organization & Cleanliness - 20 Points**: Consistent folder hierarchy, no console logs or inline styling mess, clean imports.

## Failure Conditions
- **Critical Failure (Instant Sub-70 Score)**: Axios/Fetch HTTP requests written directly inside presentation component rendering loops without services/hooks abstractions.
- **Critical Failure (Instant Sub-70 Score)**: Route-protection boundaries missing on sensitive dashboard views (e.g. organizer dashboard open to unauthenticated users).
- **Critical Failure**: Storing critical secrets, API keys, or raw passwords in client-side constant files or plain JS objects.

## Suggested Tools
- `eslint-plugin-react` and `eslint-plugin-react-hooks` (Linting guidelines)
- `dependency-cruiser` (Visualizing component hierarchy and circular imports)
- Chrome React Developer Tools (Profiling and checking rendering performance)

## Final Output Format
The skill must generate:

Score: [Score]/100
Status: [PASS / WARNING / FAIL]

Critical Issues:
- [List of critical violations, if any]

Recommendations:
- [Actionable steps to improve component structure and rendering hygiene]

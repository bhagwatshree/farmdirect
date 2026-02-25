# Test Coverage Plan — 85% Frontend + Backend

## Strategy
- **Backend**: Jest + Supertest (integration tests hitting real Express routes)
- **Frontend**: React Testing Library + Jest (bundled with CRA react-scripts)
- Store state is reset per test using `beforeEach` for full isolation
- Rate limiter skipped in `NODE_ENV=test` to avoid flaky tests

---

## Phase 1 — Backend Infrastructure (4 file changes)

1. **Create `backend/src/app.js`** — extract Express setup from index.js (no `listen`); skip rate-limiter when `NODE_ENV=test`
2. **Update `backend/src/index.js`** — import app.js, call `listen` only
3. **Update `backend/package.json`** — add jest + supertest devDeps; test script with `--coverage --coverageThreshold 85`
4. **Install** `jest supertest` into backend devDependencies

## Phase 2 — Backend Test Files (5 files)

| File | Scenarios |
|------|-----------|
| `__tests__/health.test.js` | GET /api/health returns 200 |
| `__tests__/middleware/auth.middleware.test.js` | no header, non-Bearer, invalid JWT, valid JWT |
| `__tests__/routes/auth.test.js` | register: missing fields, bad role, duplicate email, success; login: bad email, bad password, success |
| `__tests__/routes/fruits.test.js` | GET list + filters, GET by id, POST auth/role/validation/success, PUT not-found/success, DELETE success |
| `__tests__/routes/orders.test.js` | POST role-check/no-items/not-found/low-stock/success, GET customer+farmer views, PUT status validation |

## Phase 3 — Frontend Infrastructure (2 files)

1. **Create `frontend/src/setupTests.js`** — import `@testing-library/jest-dom`
2. **Create `frontend/src/__tests__/testUtils.jsx`** — `renderWithProviders(ui, opts)` wrapper with Theme + Auth + Cart + Router

## Phase 4 — Frontend Test Files (14 files)

| File | Key scenarios |
|------|---------------|
| `utils/constants.test.js` | all helper functions, known+unknown categories, constants shape |
| `context/AuthContext.test.jsx` | login persists to localStorage, logout clears it, initial load from storage |
| `context/CartContext.test.jsx` | addItem new+existing, removeItem, updateQty, qty≤0 removes, clearCart, total, count |
| `components/ProtectedRoute.test.jsx` | no user→/login, wrong role→/, correct role renders children |
| `components/FruitCard.test.jsx` | renders name/price, image shown, img error→emoji fallback, add-to-cart, guest→/login |
| `components/ImageCarousel.test.jsx` | single+multiple images, no images→emoji, navigation arrows |
| `components/Navbar.test.jsx` | guest shows Login/Register, logged-in shows avatar/logout, farmer sees My Farm |
| `pages/LoginPage.test.jsx` | renders form, successful login navigates, API error shown, loading state |
| `pages/RegisterPage.test.jsx` | renders form, farmer role shows phone field, successful register navigates |
| `pages/HomePage.test.jsx` | fetches + renders fruit cards, category chips navigate, search form submits |
| `pages/ListingsPage.test.jsx` | loading spinner, renders cards, empty state, category filter active styling |
| `pages/CartPage.test.jsx` | empty state, renders items with emoji, qty controls, checkout calls API |
| `pages/OrdersPage.test.jsx` | loading→orders list, formatOrderId used, farmer sees customer name, empty state |
| `pages/ProductDetailPage.test.jsx` | loading→details, add-to-cart, out-of-stock chip, farmer hides cart button |

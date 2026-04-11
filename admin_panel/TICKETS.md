# Admin Panel — Implementation Tickets

Read `PLAN.md` fully before starting. Key things to keep in mind:

- Next.js 14, static export, no API routes, no SSR
- Admin session in localStorage (access JWT + refresh JWT)
- API auto-refresh: proactively refresh before access token expires
- QR code generated client-side with `qrcode` package
- Tour form handles multilingual fields + nested waypoints + POIs with rich text

> ✅ **Tickets A01–A33 are complete.**

---

## Epic 1: Project Foundation

### A01 — Initialize Next.js project

**Steps:**

- `npx create-next-app@latest` with TypeScript, Tailwind CSS, ESLint, App Router
- Install: `next-pwa`, `qrcode`, `@types/qrcode`
- `next.config.js`: `output: 'export'`, `trailingSlash: true`
- `.env.local`:
  ```
  NEXT_PUBLIC_API_BASE_URL=https://api.sport-rent.800.hr
  NEXT_PUBLIC_TOUR_APP_URL=https://app.sport-rent.800.hr
  NEXT_PUBLIC_SESSION_KEY=admin_session
  ```

**Acceptance criteria:**

- `npm run dev` starts without errors
- `npm run build` outputs `/out` directory

---

### A02 — PWA manifest and icons

- name: "800 Admin", display: "standalone", start_url: "/"
- Icons: 192x192, 512x512 (maskable)

---

### A03 — TypeScript types

**Files:** `src/types/tour.ts`, `src/types/session.ts`, `src/types/api.ts`

`tour.ts` — same types as self-guided app:

- `Locale`, `Coordinates`, `Waypoint`, `Tour`

`session.ts`:

```ts
type AdminSession = {
  accessToken: string;
  refreshToken: string;
  accessExpiresAt: number; // unix timestamp (seconds)
  email: string;
};
```

`api.ts` — request/response types for every endpoint:

- `CreateTokenRequest`, `CreateTokenResponse`
- `CreateTourRequest`, `UpdateTourRequest`
- `LoginRequest`, `LoginResponse`, `RefreshResponse`
- etc.

---

## Epic 2: Auth Infrastructure

### A04 — Session helpers

**File:** `src/lib/session.ts`

```ts
export function saveSession(session: AdminSession): void;
export function getSession(): AdminSession | null;
export function clearSession(): void;
export function isAccessTokenExpiringSoon(session: AdminSession): boolean;
// returns true if accessExpiresAt - now < 60 seconds
```

---

### A05 — API client with auto-refresh

**File:** `src/lib/api.ts`

Core `apiFetch(path, options)` wrapper:

1. Get session from localStorage
2. If `isAccessTokenExpiringSoon()` → call `POST /auth/refresh` first → update session
3. Make the request with `Authorization: Bearer {accessToken}`
4. If response is 401 → try refresh once → retry → if still 401 → `clearSession()` → `window.location.href = '/login'`
5. Return typed response

Export typed API functions:

```ts
// Auth
export const login = (email: string, password: string) => ...
export const refresh = (refreshToken: string) => ...
export const logout = () => ...

// Users
export const listUsers = () => ...
export const createUser = (email: string, password: string) => ...

// Tokens
export const listTokens = () => ...
export const createToken = (label: string, durationHours: number) => ...
export const getTokenStats = () => ...

// Tours
export const listTours = () => ...
export const createTour = (tour: CreateTourRequest) => ...
export const updateTour = (id: string, tour: UpdateTourRequest) => ...
export const deleteTour = (id: string) => ...
```

**Acceptance criteria:**

- All API calls go through the wrapper (no raw fetch elsewhere)
- 401 → refresh → retry works transparently
- Expired refresh → redirects to /login

---

### A06 — useSession hook

**File:** `src/hooks/useSession.ts`

```ts
// Returns: { session: AdminSession | null, isLoading: boolean }
```

- Reads localStorage on mount
- Returns `isLoading: true` briefly on first render

---

### A07 — Route guard component

**File:** `src/components/auth/RouteGuard.tsx`

- Uses `useSession()`
- While loading: show spinner
- No session: redirect to `/login`
- Has session: render children
- Wrap all protected pages in root `layout.tsx` (skip for `/login`)

---

## Epic 3: Login Page

### A08 — Login page

**File:** `src/app/login/page.tsx`

- Email + password form
- On submit: `login(email, password)` → `saveSession(response)` → redirect to `/`
- Show error message on 401
- Show loading state on submit
- If already has valid session → redirect to `/`

**Acceptance criteria:**

- Valid credentials → session saved → redirected to dashboard
- Wrong credentials → error shown, no redirect

---

## Epic 4: Dashboard

### A09 — Stats card component

**File:** `src/components/ui/StatsCard.tsx`

**Props:** `label: string`, `value: number | string`, `description?: string`

Simple card with large number and label. Used on dashboard.

---

### A10 — Dashboard page

**File:** `src/app/page.tsx`

- Calls `getTokenStats()` on mount
- Renders 4 `StatsCard` components:
  - Active today
  - Expired
  - Total
  - Not yet scanned
- Show skeleton loaders while loading

**Acceptance criteria:**

- Stats load and display correctly
- Skeleton shown during API call

---

## Epic 5: Token Management

### A11 — Token table

**File:** `src/components/tokens/TokenTable.tsx`

**Props:** `tokens: AccessToken[]`

Columns: Code, Label, Duration, Status (badge: active/expired/not_scanned), Created, First Scanned, Copy Link

- Status badge: green (active), grey (expired), orange (not_scanned)
- Copy Link: copies `{TOUR_APP_URL}/auth?token={code}` to clipboard, shows "Kopirano!" toast

---

### A12 — Token list page

**File:** `src/app/tokens/page.tsx`

- Calls `listTokens()` on mount
- Renders `TokenTable`
- "Generiraj novi token" button → navigate to `/tokens/new`
- Skeleton while loading

---

### A13 — Token form

**File:** `src/components/tokens/TokenForm.tsx`

**Props:** `onSubmit: (label: string, durationHours: number) => void`, `isLoading: boolean`

- Label: text input (free text, required)
- Duration: segmented control — 6h / 24h / 48h / Custom
  - Custom: number input in hours
- Submit button: "Generiraj token"

---

### A14 — QR display component

**File:** `src/components/tokens/QRDisplay.tsx`

**Props:** `qrContent: string`, `code: string`, `expiresAt: string`, `label: string`

- Generate QR with `qrcode.toDataURL(qrContent)` on mount → show as `<img>`
- "Preuzmi QR" button: creates download link from data URL
- `CopyLinkButton` component below QR
- Token details: code, label, expires at (formatted)
- "Generiraj novi token" button (navigates back to form)

---

### A15 — Copy link button

**File:** `src/components/tokens/CopyLinkButton.tsx`

**Props:** `url: string`

- Shows the full URL as truncated text
- Copy button: copies to clipboard → "Kopirano!" for 2 seconds

---

### A16 — Generate token page

**File:** `src/app/tokens/new/page.tsx`

Two states:

1. **Form state:** render `TokenForm`
2. **Success state:** render `QRDisplay`

Flow:

- Form submit → `createToken(label, durationHours)` → set state to success with response
- Success: show QRDisplay
- "Generiraj novi token" → reset to form state

---

## Epic 6: Tour Management

### A17 — Tour table

**File:** `src/components/tours/TourTable.tsx`

**Props:** `tours: Tour[]`, `onDelete: (id: string) => void`

Columns: Name (HR), Distance, Duration, Difficulty, Waypoints count, Edit, Delete

- Edit: navigate to `/tours/{id}/edit`
- Delete: show `ConfirmDialog` → call `deleteTour(id)` → remove from list

---

### A18 — Tour list page

**File:** `src/app/tours/page.tsx`

- `listTours()` on mount
- Renders `TourTable`
- "Nova tura" button → `/tours/new`

---

### A19 — Locale tab switcher

**File:** `src/components/tours/LocaleTabSwitcher.tsx`

**Props:** `activeLocale: 'hr' | 'en'`, `onChange: (locale) => void`

- "HR | EN" tab switcher
- Used inside TourForm to switch which language fields are visible

---

### A20 — Waypoint editor

**File:** `src/components/tours/WaypointEditor.tsx`

**Props:** `waypoints: Waypoint[]`, `onChange: (waypoints: Waypoint[]) => void`, `activeLocale: 'hr' | 'en'`

Each waypoint row (collapsible card):

- Auto-generated `id` (slug from HR name, or UUID if name empty)
- `lat` + `lng` number inputs
- `triggerRadiusMeters` number input (default: 50)
- Name (HR or EN based on `activeLocale`)
- Description (HR or EN based on `activeLocale`) — plain text, short
- Image URLs: list of text inputs + "Dodaj sliku" button
- **`richDescription`** (HR or EN based on `activeLocale`) — `RichTextEditor` component (A30)
- **`POIEditor`** section (A31) — collapsed by default, expandable
- Delete waypoint button
- Move up / move down buttons

"Dodaj waypoint" button at the bottom.

**Acceptance criteria:**

- Adding/removing/reordering waypoints works correctly
- Switching locale shows the correct language fields for both description, richDescription, and POI content (other locale data is preserved)
- POI section can be expanded/collapsed per waypoint

---

### A21 — Tour form

**File:** `src/components/tours/TourForm.tsx`

**Props:** `initialValues?: Partial<Tour>`, `onSubmit: (tour: CreateTourRequest) => void`, `isLoading: boolean`

Fields:

- `LocaleTabSwitcher` at top (controls language shown for all multilingual fields)
- `id` (slug): text input, disabled if editing
- Name (HR + EN): text inputs (shown based on active locale)
- Description (HR + EN): textarea (shown based on active locale)
- Distance: text input (e.g. "20 km")
- Duration: text input (e.g. "~4h")
- Difficulty: select (easy / moderate / hard)
- Cover image URL: text input
- Start location: lat + lng number inputs
- Route: textarea (JSON array of {lat, lng}, or paste GPX — just JSON for v1)
  - Show point count below textarea
- `WaypointEditor`

Validation before submit:

- id, name.hr, name.en, route (parseable JSON with ≥2 points), ≥1 waypoint

---

### A22 — Create tour page

**File:** `src/app/tours/new/page.tsx`

- Render `TourForm` with no initial values
- On submit: `createTour(data)` → on success: navigate to `/tours`
- Show API error if create fails

---

### A23 — Edit tour page

**File:** `src/app/tours/[id]/edit/page.tsx`

- `listTours()` → find tour by id → 404 if not found
- Render `TourForm` with `initialValues={tour}`
- On submit: `updateTour(id, data)` → on success: navigate to `/tours`

---

## Epic 7: User Management

### A24 — User table

**File:** `src/components/users/UserTable.tsx`

Columns: Email, Created By, Created At

---

### A25 — User list page

**File:** `src/app/users/page.tsx`

- `listUsers()` on mount
- Renders `UserTable`
- "Novi korisnik" button → `/users/new`

---

### A26 — User form + create page

**Files:** `src/components/users/UserForm.tsx`, `src/app/users/new/page.tsx`

Form: email + password (min 8 chars) + confirm password
On submit: `createUser(email, password)` → navigate to `/users`

---

## Epic 8: UI Polish

### A27 — Shared UI components

**Files:** `src/components/ui/`

- `ConfirmDialog.tsx` — modal with "Jesi li siguran?" + confirm/cancel buttons
- `Toast.tsx` — bottom-of-screen toast notification, auto-dismiss after 2s
- `Skeleton.tsx` — animated grey rectangle for loading states
- `ErrorMessage.tsx` — red box with error text

---

### A28 — Navigation layout

**File:** `src/app/layout.tsx` (updated)

- Sidebar (desktop) / bottom tab bar (mobile) with links:
  - Dashboard, Tokeni, Ture, Korisnici
- Current page highlighted
- Logout button (calls `logout()` → clears session → redirects to /login)
- Show logged-in email in sidebar footer

---

### A29 — Loading states

- Add `Skeleton` loaders to: dashboard, token list, tour list, user list
- Add spinner to form submit buttons while loading
- Handle and display API errors on all pages

---

## Implementation Order

```
A01 → A02 → A03                    (foundation)
A04 → A05 → A06 → A07             (auth infrastructure)
A08                                 (login page)
A09 → A10                           (dashboard)
A11 → A12 → A13 → A14 → A15 → A16 (tokens)
A17 → A18 → A19 → A30 → A31 → A20 → A21 → A22 → A23  (tours — A30+A31 before waypoint editor)
A24 → A25 → A26                    (users)
A27 → A28 → A29                    (UI polish)
```

---

## Epic 9: Rich Content Editing

### A30 — Rich text editor component

**File:** `src/components/ui/RichTextEditor.tsx`

Install: `@uiw/react-md-editor` (Markdown editor with preview, no native deps)

```ts
// Props
interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number; // default: 200
}
```

- Renders a split Markdown editor (edit + preview tabs)
- Stores content as plain Markdown string
- Used inside WaypointEditor (richDescription) and POIEditor (description)
- Must work with `"use client"` — wrap in dynamic import with `ssr: false` since the editor uses browser APIs

**Acceptance criteria:**

- Markdown typed in editor renders as formatted HTML in preview tab
- Value is a plain Markdown string (no JSON/HTML wrapper)
- Switching locale in parent does not lose the other locale's content

---

### A31 — POI editor component

**File:** `src/components/tours/POIEditor.tsx`

**Props:** `pois: POI[]`, `onChange: (pois: POI[]) => void`, `activeLocale: 'hr' | 'en'`

Where `POI` matches the backend schema:

```ts
type POI = {
  id: string;
  title: { hr: string; en: string };
  description: { hr: string; en: string }; // Markdown
  images: string[];
  coordinates?: { lat: number; lng: number }; // optional map pin
  videoUrl?: string;
};
```

Each POI row (collapsible card):

- Auto-generated `id` (slug from HR title, or UUID if empty)
- Title input (HR or EN based on `activeLocale`)
- `description`: `RichTextEditor` (A30) — HR or EN based on `activeLocale`
- Image URLs: list of text inputs + "Dodaj sliku" button
- **Coordinates**: `lat` + `lng` number inputs (optional, side by side) — "Lokacija na karti (optional)"
- Video URL: single text input, optional (YouTube or Vimeo embed URL)
- Delete POI button
- Move up / move down buttons

"Dodaj POI" button at the bottom.

**Acceptance criteria:**

- Adding/removing/reordering POIs works
- Switching locale shows correct language fields; other locale data preserved
- Coordinates fields are optional — leaving them blank omits `coordinates` from the submitted POI
- Video URL field accepts any URL (no validation beyond non-empty string)

---

### A32 — Delete token (unused only)

**Files:** `src/lib/api.ts` (add `deleteToken`), `src/components/tokens/TokenTable.tsx` (add delete column)

**API function:**

```ts
export const deleteToken = (code: string) =>
  apiFetch(`/tokens/${code}`, { method: 'DELETE' });
```

**TokenTable changes:**

- Add a "Obriši" (delete) column — only rendered for tokens with `status === 'not_scanned'`
- Clicking shows `ConfirmDialog`: "Jesi li siguran da želiš obrisati ovaj token?"
- On confirm: call `deleteToken(code)` → remove token from list on success
- Show `ErrorMessage` if API returns 403 (already used) or any other error
- Tokens with `status === 'active'` or `'expired'` show no delete button (they've been scanned)

**Acceptance criteria:**

- Delete button only visible on `not_scanned` tokens
- Confirm dialog appears before delete
- Token disappears from list immediately on success
- 403 response shows an inline error message

---

## Epic 10: Optional Route + Walking Route

### A33 — Optional tour route + waypoint walking route

**Files:** `src/components/tours/TourForm.tsx` (A21 update), `src/components/tours/WaypointEditor.tsx` (A20 update)

#### TourForm changes (make `route` optional)

- Remove `route` from the required validation list — a tour can now be saved with no route
- Update the route textarea label to: **"Route (optional)"**
- Update the hint text below to: "JSON array of {lat, lng} — leave empty if no GPS track available"
- Update point count display: only show "N points" when there is parseable content; if empty show nothing
- Validation rule: if the field is non-empty, it must still be parseable JSON with ≥ 2 points (invalid JSON or fewer than 2 points still blocks submit with an error)

#### WaypointEditor changes (add `walkingRoute`)

Each waypoint card gains a collapsible **"Walking route"** section below the `richDescription` field:

- Toggle button: "Walking route" with a chevron (collapsed by default)
- When expanded: textarea for JSON array of `{lat, lng}` — same UX pattern as the main route textarea in TourForm
- Show point count below the textarea when content is parseable
- No validation beyond parseable JSON (min 2 points not enforced — the walking route is fully optional and informational)
- Store as `walkingRoute: Coordinates[] | undefined` on the Waypoint — omit the field entirely when the textarea is empty

**Acceptance criteria:**

- TourForm submits successfully with an empty route textarea
- TourForm still rejects non-empty route with fewer than 2 valid points
- WaypointEditor walking route section is collapsed by default
- Entering valid JSON in the walking route textarea stores the coordinates correctly
- Clearing the walking route textarea omits `walkingRoute` from the submitted waypoint (no empty array)

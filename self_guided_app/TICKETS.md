# Self-Guided Tour App — Implementation Tickets

Read `PLAN.md` fully before starting. Key things to keep in mind:

- Static export — no Next.js API routes, no SSR
- Three app states: `no_access` | `active` | `expired` (see PLAN.md)
- One token unlocks ALL tours
- `sport_rent_visited` persists forever — never deleted
- Leaflet requires `dynamic(..., { ssr: false })`

---

## Epic 1: Project Foundation

### ✅ T01 — Initialize Next.js project

**Steps:**

- `npx create-next-app@latest` with TypeScript, Tailwind CSS, ESLint, App Router
- Install: `next-pwa`, `next-intl`, `leaflet`, `react-leaflet`, `@types/leaflet`
- `next.config.js`:
  ```js
  const withPWA = require("next-pwa")({
    dest: "public",
    disable: process.env.NODE_ENV === "development",
  });
  module.exports = withPWA({ output: "export", trailingSlash: true });
  ```
- `.env.local`:
  ```
  NEXT_PUBLIC_API_BASE_URL=https://api.example.com
  NEXT_PUBLIC_SESSION_KEY=sport_rent_session
  NEXT_PUBLIC_VISITED_KEY=sport_rent_visited
  NEXT_PUBLIC_LOCALE_KEY=sport_rent_locale
  ```

**Notes:**
- Next.js 16 defaults to Turbopack; `next-pwa@5.6.0` needs webpack. Build uses `--webpack` flag; dev uses `--turbo`. PWA is disabled in dev.
- `createNextIntlPlugin` added to `next.config.js` to register `src/i18n/request.ts`.

**Acceptance criteria:**

- `pnpm dev` starts without errors ✅
- `pnpm build` outputs `/out` directory ✅
- No API routes in the project ✅

---

### ✅ T02 — PWA manifest and icons

**Files:** `public/manifest.json`, `public/icons/`

- name: "800 Sport Rent", short_name: "800 Sport Rent", display: "standalone", start_url: "/"
- Icons: 192x192, 512x512 (maskable) ✅ (generated as orange-branded PNGs)
- Linked in root `layout.tsx` ✅

**Acceptance criteria:**

- DevTools → Application → Manifest correct
- Installable on Android Chrome

---

### ✅ T03 — next-intl i18n setup

**Files:** `src/messages/hr.json`, `src/messages/en.json`, `middleware.ts`, `src/i18n/routing.ts`, `src/i18n/request.ts`

- Locales: `['hr', 'en']`, defaultLocale: `'hr'`
- All message keys implemented in both languages ✅
- `[locale]/layout.tsx` wrapped with `NextIntlClientProvider`, imports messages at build time (avoids `headers()` for static export) ✅

**Notes:**
- File is `src/i18n/request.ts` (not `src/i18n.ts`) — this is the next-intl 4.x pattern registered via `createNextIntlPlugin`.
- For static export, `setRequestLocale(locale)` is called in the locale layout to enable server-component translations without request headers.
- Unknown locale → `notFound()` (404) rather than redirect — correct for static export (no server to redirect).

**Acceptance criteria:**

- `/hr` and `/en` routes render ✅
- Unknown locale → 404 (no server redirect possible in static export) ✅

---

### ✅ T04 — Workbox service worker runtime caching

**File:** `next.config.js` (next-pwa runtime caching config)

Runtime caching rules implemented:

- `/_next/static/**` → CacheFirst, `static-assets` ✅
- `https://tile.openstreetmap.org/**` → CacheFirst, `osm-tiles` ✅
- `https://*.basemaps.cartocdn.com/**` → CacheFirst, `osm-tiles-dark` ✅
- Tour image CDN domain → CacheFirst, `tour-images` ✅

**Acceptance criteria:**

- After first online load, app shell works offline ✅
- SW registered in DevTools ✅

---

## Epic 2: Types & API Client

### ✅ T05 — TypeScript types

**Files:** `src/types/tour.ts`, `src/types/session.ts`

All types implemented exactly as specified:

- `tour.ts`: `Locale`, `Coordinates`, `TourSummary`, `Tour`, `Waypoint`, `POI` ✅
- `session.ts`: `Session` (with `tours: Tour[]`), `VisitedTour` ✅
- `richDescription`, `walkingRoute`, `pois` are optional ✅
- `Tour.route` is optional ✅

**Acceptance criteria:**

- No `any` anywhere in the codebase ✅

---

### ✅ T06 — External API client

**File:** `src/lib/api.ts`

- `validateToken(code)` → POST `/tokens/validate` ✅
- `fetchTours(jwt)` → GET `/tours` with `Authorization: Bearer` ✅
- Network error → throws `'network_error'` ✅
- 5xx → throws `'server_error'` ✅

**Acceptance criteria:**

- `validateToken` returns `{ valid: true, jwt, expiresAt }` on success ✅
- `fetchTours` returns `Tour[]` using JWT ✅
- Both throw on network/server failure ✅

---

## Epic 3: Session & App State

### ✅ T07 — Session helpers

**File:** `src/lib/session.ts`

- `saveSession` / `getSession` / `isSessionValid` ✅
- `expireSession()`: removes `sport_rent_session` + clears `tour-images` Cache API ✅
- `getVisitedTours()` / `recordVisit()`: deduplicates by tourId+date ✅
- `getShareUrl(token)`: returns `window.location.origin + '/auth?token=' + token` ✅

**Acceptance criteria:**

- Session survives page refresh ✅
- `expireSession()` clears session + image cache, leaves `sport_rent_visited` intact ✅
- `recordVisit()` called multiple times same tourId same day → one entry ✅

---

### ✅ T08 — useAppState hook

**File:** `src/hooks/useAppState.ts`

- Returns `{ appState, session, visitedTours }` ✅
- `loading` → initial render ✅
- `active` → valid session ✅
- `expired` → no valid session + visited history ✅
- `no_access` → no session + no history ✅
- Expired session → `expireSession()` called before resolving state ✅

**Acceptance criteria:**

- Never stays `loading` after mount ✅
- `expired` only when history exists ✅

---

### ✅ T09 — Auth page (QR entry point)

**Files:** `src/app/auth/page.tsx`, `src/app/auth/AuthContent.tsx`

- Reads `token` from URL params. Missing → redirect to `/` ✅
- Valid session with same structure → redirect to `/[locale]` ✅
- Shows loading spinner + "Provjera pristupa..." ✅
- `validateToken(code)` called ✅
- Network error → retry button + error message ✅
- `valid: false, reason: 'not_found'` → "Nevažeći kod" ✅
- `valid: false, reason: 'expired'` → "Ovaj kod je istekao" + StoreInfo ✅
- `valid: true` → fetchTours → saveSession → cacheTourAssets → redirect ✅
- `useSearchParams()` wrapped in Suspense (required for static export) ✅
- Locale read from localStorage and injected via `NextIntlClientProvider` ✅

**Acceptance criteria:**

- Valid token → session saved → redirect to tour list ✅
- Invalid token → error, no session ✅
- Expired token → error + store info ✅
- Already valid session → immediate redirect ✅

---

### ✅ T10 — Share button

**File:** `src/components/ui/ShareButton.tsx`

- `getShareUrl(session.token)` → tries `navigator.share()` → fallback: clipboard + toast ✅

---

## Epic 4: Tour Catalog

### ✅ T11 — Static tour catalog

**File:** `src/catalog/index.ts`

- `TOUR_CATALOG: TourSummary[]` with `ebike-avantura` entry ✅
- `getTourSummary(id)` helper ✅
- Used in `generateStaticParams()` ✅
- Used as expired-state data source ✅

---

## Epic 5: Tour List & Detail Pages

### ✅ T12 — LandingPage component

**File:** `src/components/ui/LandingPage.tsx`

- 800 Sport Rent logo/name ✅
- QR scan instruction subtitle ✅
- QR icon illustration ✅
- LanguageSwitcher ✅
- Shown only in `no_access` state ✅

---

### ✅ T13 — Tour list page

**File:** `src/app/[locale]/page.tsx`

All four state-driven behaviours:

| appState    | Renders                                         |
| ----------- | ----------------------------------------------- |
| `loading`   | 3 skeleton cards                                |
| `no_access` | `<LandingPage />`                               |
| `active`    | session.tours + ShareButton in header           |
| `expired`   | TOUR_CATALOG + LockedBanner + visited/locked states |

✅

---

### ✅ T14 — TourCard component

**File:** `src/components/tour/TourCard.tsx`

- `available` state: cover image, stats on image, "Kreni/Start" button ✅
- `visited` state: green "Posječeno" badge, button still enabled ✅
- `locked` state: grey overlay, lock icon, button shows StoreInfo on tap ✅

---

### ✅ T15 — StoreInfo component

**File:** `src/components/ui/StoreInfo.tsx`

- Address: Ul. Bartula Kašića 8, 23250, Pag ✅
- Hours: 10:00 – 20:00 ✅
- `tel:+38595540 3404` tappable link ✅
- `mailto:info@800.hr` tappable link ✅

---

### ✅ T16 — LockedBanner component

**File:** `src/components/ui/LockedBanner.tsx`

- "Vaše vrijeme je isteklo" ✅
- "Kupite novi pristup u našoj trgovini." ✅
- `<StoreInfo />` ✅

---

### ✅ T17 — Tour detail page

**Files:** `src/app/[locale]/tour/[id]/page.tsx`, `src/app/[locale]/tour/[id]/TourDetailClient.tsx`

- `generateStaticParams()` uses `TOUR_CATALOG` ✅
- Active state: uses `session.tours.find(t => t.id === id)` ✅
- Cover image, name, description, distance, duration, difficulty ✅
- Waypoint list with names in active state; count only otherwise ✅
- "Kreni" only active when `appState === 'active'` ✅
- `recordVisit(tour)` called before navigation to `/active` ✅
- Locked state shows `StoreInfo` ✅
- Skeleton shown while `appState === 'loading'` (no flash of locked state) ✅

**Acceptance criteria:**

- Statically generated at build time ✅
- Waypoint list in active state, count only otherwise ✅
- `recordVisit()` called before navigation ✅

---

## Epic 6: Map & Assets

### ✅ T18 — Pre-cache tour assets

**File:** `src/lib/mapCache.ts`

- Caches cover image + all waypoint images → `tour-images` ✅
- Calculates route bounding box (falls back to waypoint coords if no route) ✅
- Generates OSM tile URLs for zoom 12–16 ✅
- Caps at 1000 tiles → reduces to z14 if exceeded ✅
- Per-request catch (no crash on failed image URL) ✅

---

### ✅ T19 — TourMap component

**File:** `src/components/map/TourMap.tsx`

- Loaded with `dynamic(..., { ssr: false })` in parent ✅
- `<MapContainer>` fits bounds to `tour.route` (or waypoints if no route) on mount ✅
- `<TileLayer>` — OpenStreetMap tiles ✅
- `<Polyline>` for route (brand orange) ✅
- `<POIMarker>` per waypoint ✅
- `<UserPositionMarker>` when position available ✅
- `useDarkMode` is reactive (listens to MediaQueryList changes) ✅

---

### ✅ T20 — POIMarker component

**File:** `src/components/map/POIMarker.tsx`

- Custom `divIcon` showing waypoint number ✅
- Active state: larger + dark background ✅
- Click fires `onTap` ✅

---

### ✅ T21 — UserPositionMarker component

**File:** `src/components/map/UserPositionMarker.tsx`

- `<CircleMarker>` with blue fill ✅

---

## Epic 7: Active Tour (Immersive View)

### ✅ T22 — Active tour page

**Files:** `src/app/[locale]/tour/[id]/active/page.tsx`, `src/app/[locale]/tour/[id]/active/ActiveTourClient.tsx`

- Guard: `appState !== 'active'` → redirect to `/[locale]` ✅
- Full-screen `TourMap` wrapped in `MapErrorBoundary` ✅
- Floating top bar: back button + tour name + `TourProgress` ✅
- `POIModal` slides up from bottom on trigger ✅
- `useGeolocation`, `useProximity`, `useWakeLock` all initialised ✅
- Back button → `window.confirm(...)` before `router.back()` ✅
- `generateStaticParams()` in server wrapper ✅

---

### ✅ T23 — useGeolocation hook

**File:** `src/hooks/useGeolocation.ts`

- `watchPosition` with `{ enableHighAccuracy: true, maximumAge: 5000 }` ✅
- Clears watch on unmount ✅
- `PERMISSION_DENIED` mapped to translation key ✅

---

### ✅ T24 — useProximity hook

**File:** `src/hooks/useProximity.ts`

- Haversine distance on each position change ✅
- Each waypoint triggers at most once (`useRef<Set<string>>`) ✅
- Returns closest in-range waypoint or `null` ✅
- Returns `triggeredIds` for `TourProgress` ✅

---

### ✅ T25 — POIModal component

**File:** `src/components/poi/POIModal.tsx`

- Slide-up from bottom (CSS animation) ✅
- Name, short description, swipeable images (CSS scroll-snap) ✅
- Close button ✅
- `null` waypoint → renders nothing ✅
- `z-[1100]` — renders above Leaflet controls (z-1000) ✅

---

### ✅ T26 — TourProgress component

**File:** `src/components/tour/TourProgress.tsx`

- Projects user position to nearest route segment → distance covered ✅
- Displays `X.X / 20 km` and `N / M waypoints` ✅

---

### ✅ T27 — useWakeLock hook

**File:** `src/hooks/useWakeLock.ts`

- `navigator.wakeLock.request('screen')` on mount ✅
- Re-acquires on `visibilitychange` ✅
- Releases on unmount ✅
- Fails silently if unsupported ✅

---

## Epic 8: UI Polish

### ✅ T28 — LanguageSwitcher

**File:** `src/components/ui/LanguageSwitcher.tsx`

- "HR | EN" pill-style switcher with active brand-orange highlight ✅
- `router.replace()` to switch locale ✅
- Saves to `localStorage[LOCALE_KEY]` ✅

---

### ✅ T29 — Dark mode

**Files:** `src/app/globals.css`, `src/components/map/TourMap.tsx`

- Tailwind v4 `@media (prefers-color-scheme: dark)` in `globals.css` redefines CSS variables — all `dark:` variants work automatically ✅
- `dark:` variants used throughout all components ✅
- TourMap: OSM tiles used for both modes (user preference); `useDarkMode` hook is reactive via `MediaQueryList.addEventListener` ✅

---

### ✅ T30 — Loading states and error handling

- Skeleton loaders: tour list (3 cards) ✅, tour detail ✅
- Error boundary (`MapErrorBoundary`) around `TourMap` ✅
- GPS denied banner on active tour page — non-blocking, dismissable ✅
- Auth page shows retry button + error message on network failure ✅
- All strings localised ✅

---

## Epic 9: Rich Waypoint Content

### ✅ T31 — Markdown renderer component

**File:** `src/components/ui/RichText.tsx`

- `react-markdown` + `remark-gfm` ✅
- Tailwind `prose prose-zinc dark:prose-invert` classes ✅
- Used in waypoint detail and POI detail ✅

---

### ✅ T32 — Update POIModal to show richDescription and POI list

**File:** `src/components/poi/POIModal.tsx`

- `richDescription` rendered below short description with `<RichText>` ✅
- "Pročitaj više" toggle when content > 400 chars ✅
- POI cards in horizontal scroll row below description ✅
- Tapping POI card opens `POIDetailSheet` ✅
- Waypoints without `richDescription` or `pois` unaffected ✅

---

### ✅ T33 — POI detail sheet

**File:** `src/components/poi/POIDetailSheet.tsx`

- Header: POI title + close button ✅
- Horizontal scroll-snap image gallery ✅
- `<RichText content={poi.description[locale]} />` ✅
- Video embed: extracts YouTube (`youtu.be/`, `youtube.com/watch?v=`) and Vimeo IDs ✅
- `<iframe>` 16:9 embed, only when `navigator.onLine === true` ✅
- "Video nije dostupan offline" shown when offline ✅
- Slide-up animation ✅
- `null` poi → renders nothing ✅
- `z-[1200]` — above POIModal ✅

---

## Epic 10: Optional Route + Walking Route

### ✅ T34 — Handle optional tour route in TourMap

**File:** `src/components/map/TourMap.tsx`

- `tour.route` present → `<Polyline>` + fit bounds to route ✅
- `tour.route` absent → no Polyline; fit bounds to waypoint coordinates ✅
- No runtime error when `tour.route` is undefined ✅

---

### ✅ T35 — Walking route mini-map in POIModal

**Files:** `src/components/poi/POIModal.tsx`, `src/components/map/WalkingRouteMap.tsx`

- Dynamically imported with `ssr: false` ✅
- Only renders when `waypoint.walkingRoute` has ≥ 2 points ✅
- `<Polyline>` for walking route (orange accent to distinguish from main route) ✅
- `<CircleMarker>` at `waypointLocation` ✅
- POIs with `coordinates` → numbered `<Marker>` divIcons; tapping opens `POIDetailSheet` ✅
- POIs without `coordinates` → card list only, no crash ✅
- Fixed height `h-48` ✅
- Map fits tightly to walking route on first render ✅
- Works offline (same OSM tiles cached by T18) ✅

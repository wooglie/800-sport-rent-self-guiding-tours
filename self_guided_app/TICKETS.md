# Self-Guided Tour App — Implementation Tickets

Read `PLAN.md` fully before starting. Key things to keep in mind:

- Static export — no Next.js API routes, no SSR
- Three app states: `no_access` | `active` | `expired` (see PLAN.md)
- One token unlocks ALL tours
- `sport_rent_visited` persists forever — never deleted
- Leaflet requires `dynamic(..., { ssr: false })`

---

## Epic 1: Project Foundation

### T01 — Initialize Next.js project

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

**Acceptance criteria:**

- `npm run dev` starts without errors
- `npm run build` outputs `/out` directory
- No API routes in the project

---

### T02 — PWA manifest and icons

**Files:** `public/manifest.json`, `public/icons/`

- name: "800 Sport Rent", short_name: "800 Sport Rent", display: "standalone", start_url: "/"
- Icons: 192x192, 512x512 (maskable)
- Linked in root `layout.tsx`

**Acceptance criteria:**

- DevTools → Application → Manifest correct
- Installable on Android Chrome

---

### T03 — next-intl i18n setup

**Files:** `src/messages/hr.json`, `src/messages/en.json`, `middleware.ts`, `src/i18n.ts`

- Locales: `['hr', 'en']`, defaultLocale: `'en'`
- Initial message keys:
  ```json
  {
    "nav": { "back": "Natrag" },
    "landing": {
      "title": "Dobrodošli",
      "subtitle": "Skenirajte QR kod koji ste dobili pri kupnji ture."
    },
    "tours": {
      "title": "Ture",
      "start": "Kreni",
      "visited": "Posječeno",
      "locked": "Tura zaključana"
    },
    "expired": {
      "title": "Vaše vrijeme je isteklo",
      "body": "Kupite novi pristup u našoj trgovini.",
      "store": "Pronađite nas"
    },
    "share": { "button": "Podijeli pristup", "copied": "Link kopiran!" },
    "auth": {
      "validating": "Provjera pristupa...",
      "invalid": "Nevažeći kod",
      "expired_token": "Ovaj kod je istekao",
      "error": "Greška pri provjeri. Pokušajte ponovno."
    },
    "active": { "exit_confirm": "Jesi li siguran da želiš izaći iz ture?" },
    "errors": {
      "gps": "GPS nije dostupan — uključite lokaciju",
      "offline": "Potrebna je internetska veza za prvu prijavu"
    }
  }
  ```
- Wrap `[locale]/layout.tsx` with `NextIntlClientProvider`

**Acceptance criteria:**

- `/hr` and `/en` routes render
- Unknown locale redirects to `/hr`

---

### T04 — Workbox service worker

**File:** `next.config.js` (next-pwa runtime caching config)

Runtime caching rules:

- `/_next/static/**` → CacheFirst
- `https://tile.openstreetmap.org/**` → CacheFirst, `osm-tiles`
- `https://*.basemaps.cartocdn.com/**` → CacheFirst, `osm-tiles-dark`
- Tour image CDN domain → CacheFirst, `tour-images`

**Acceptance criteria:**

- After first online load, app shell works offline
- SW registered in DevTools

---

## Epic 2: Types & API Client

### T05 — TypeScript types

**Files:** `src/types/tour.ts`, `src/types/session.ts`

Define exactly as in `PLAN.md`:

- `tour.ts`: `Locale`, `Coordinates`, `TourSummary`, `Tour`, `Waypoint`, `POI`
- `session.ts`: `Session` (with `tours: Tour[]`), `VisitedTour`

`Waypoint` and `POI` must include the rich content fields:

```ts
type Waypoint = {
  id: string;
  coordinates: Coordinates;
  triggerRadiusMeters: number;
  name: Record<Locale, string>;
  description: Record<Locale, string>;
  images: string[];
  richDescription?: Record<Locale, string>; // Markdown
  pois?: POI[];
};

type POI = {
  id: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>; // Markdown
  images: string[];
  videoUrl?: string;
};
```

**Acceptance criteria:**

- No `any` anywhere in the codebase
- `richDescription` and `pois` are optional so existing waypoints without them still typecheck

---

### T06 — External API client

**File:** `src/lib/api.ts`

```ts
type ValidateTokenResponse =
  | { valid: true; jwt: string; expiresAt: string }
  | { valid: false; reason: "not_found" | "expired" };

// Step 1: validate the short QR code → get a tour JWT
export async function validateToken(code: string): Promise<ValidateTokenResponse>;
// POST {BASE_URL}/tokens/validate  body: { code }

// Step 2: use the JWT to fetch all tours
export async function fetchTours(jwt: string): Promise<Tour[]>;
// GET {BASE_URL}/tours  header: Authorization: Bearer {jwt}
```

- Network error → throw `'network_error'`
- 5xx → throw `'server_error'`

**Acceptance criteria:**

- `validateToken` returns `{ valid: true, jwt, expiresAt }` on success — no tours in this response
- `fetchTours` returns `Tour[]` using the JWT from the previous step
- Both throw (not return) on network/server failure

---

## Epic 3: Session & App State

### T07 — Session helpers

**File:** `src/lib/session.ts`

```ts
export function saveSession(session: Session): void;
export function getSession(): Session | null;
export function isSessionValid(session: Session): boolean;

export function expireSession(): void;
// 1. Read session
// 2. Delete sport_rent_session from localStorage
// 3. Clear 'tour-images' Cache API cache

export function getVisitedTours(): VisitedTour[];
export function recordVisit(tour: Tour): void;
// Appends VisitedTour to sport_rent_visited (no duplicates by tourId+date)

export function getShareUrl(token: string): string;
// Returns: window.location.origin + '/auth?token=' + token
```

**Acceptance criteria:**

- Session survives page refresh
- `expireSession()` clears session + image cache, leaves `sport_rent_visited` intact
- `recordVisit()` called multiple times with same tourId still only adds one entry per day

---

### T08 — useAppState hook

**File:** `src/hooks/useAppState.ts`

```ts
type AppState = 'loading' | 'no_access' | 'active' | 'expired'

// Returns:
{
  appState: AppState
  session: Session | null       // only set when appState === 'active'
  visitedTours: VisitedTour[]   // always loaded from localStorage
}
```

**Logic:**

- `loading`: initial render (localStorage not yet read)
- `no_access`: no valid session AND `visitedTours` is empty
- `active`: valid session (`isSessionValid`)
- `expired`: no valid session AND `visitedTours` has entries

If session is present but expired → call `expireSession()` before resolving state.

This is the single source of truth for what to render. Used in `[locale]/page.tsx` and `[locale]/layout.tsx`.

**Acceptance criteria:**

- Never stays `loading` after mount resolves
- `expired` only when history exists (otherwise `no_access`)

---

### T09 — Auth page (QR entry point)

**File:** `src/app/auth/page.tsx`

QR code links to: `https://yourdomain.com/auth?token=XXX`

**Steps:**

1. Read `token` from URL params. Missing → redirect to `/`
2. If valid session with same token exists → redirect to `/[locale]`
3. Show loading spinner + "Provjera pristupa..."
4. Call `validateToken(code)`
5. Network error → show retry button + error message
6. `valid: false, reason: 'not_found'` → show "Nevažeći kod"
7. `valid: false, reason: 'expired'` → show "Ovaj kod je istekao" + StoreInfo
8. `valid: true` → call `fetchTours(jwt)` → `saveSession({ token: code, expiresAt, createdAt: now, tours })` → `cacheTourAssets(tours)` → redirect to `/[locale]`

All strings via `useTranslations()`.

**Acceptance criteria:**

- Valid token → session saved with all tours → redirect to tour list
- Invalid token → error, no session saved
- Expired token → error + store info shown
- Already valid session → immediate redirect (no API call)

---

### T10 — Share button

**File:** `src/components/ui/ShareButton.tsx`

- `getShareUrl(session.token)` → try `navigator.share()` → fallback: clipboard + toast

---

## Epic 4: Tour Catalog

### T11 — Static tour catalog

**File:** `src/catalog/index.ts`

Hardcoded `TourSummary[]`. Used for:

1. `generateStaticParams()` in tour detail pages (static generation needs IDs at build time)
2. Tour list data source in **expired** state

```ts
export const TOUR_CATALOG: TourSummary[] = [
  {
    id: "ebike-avantura",
    name: { hr: "E-bike avantura", en: "E-bike Adventure" },
    description: {
      hr: "Tura vodi kroz stari grad Pag, uz bazene soli do Paške solane, a završava panoramskim pogledom na grad, planinu Velebit i okolne otoke.",
      en: "We ride from the town center through the Old Town and the saltworks, finishing with a panoramic view of Pag, Velebit mountain range and the surrounding islands.",
    },
    distance: "20 km",
    duration: "~4h",
    difficulty: "moderate",
    coverImage: "https://d10r6qv1jolyvi.cloudfront.net/image/promo-5.jpg",
  },
];

export function getTourSummary(id: string): TourSummary | null;
```

---

## Epic 5: Tour List & Detail Pages

### T12 — LandingPage component

**File:** `src/components/ui/LandingPage.tsx`

Shown when `appState === 'no_access'`.

**Content:**

- 800 Sport Rent logo/name
- "Skenirajte QR kod koji ste dobili pri kupnji ture."
- QR icon or illustration
- LanguageSwitcher

**Acceptance criteria:**

- No navigation options other than language switch
- Shown only in `no_access` state

---

### T13 — Tour list page

**File:** `src/app/[locale]/page.tsx`

Reads `appState` from `useAppState()` and renders accordingly:

| appState    | Tour data source | TourCard state      | Extra UI                      |
| ----------- | ---------------- | ------------------- | ----------------------------- |
| `loading`   | —                | skeleton loaders    | —                             |
| `no_access` | —                | —                   | `<LandingPage />`             |
| `active`    | `session.tours`  | available / visited | `<ShareButton />` in header   |
| `expired`   | `TOUR_CATALOG`   | visited / locked    | `<LockedBanner />` above list |

**Acceptance criteria:**

- Each state renders correctly with no flash between states
- Tour data source switches without page reload

---

### T14 — TourCard component

**File:** `src/components/tour/TourCard.tsx`

**Props:**

```ts
{
  tour: Tour | TourSummary
  locale: Locale
  state: 'available' | 'visited' | 'locked'
  onStart?: () => void   // called when "Kreni" is tapped in 'available' state
}
```

**Visual states:**

- `available`: cover image, name, description, stats, "Kreni" button (primary)
- `visited`: same + green "Posječeno" badge. "Kreni" button still enabled (can repeat)
- `locked`: same + greyed out "Tura zaključana" instead of button. Tapping shows `StoreInfo` inline or as modal

**Acceptance criteria:**

- `visited` badge shows correctly based on `sport_rent_visited`
- `locked` state tapping shows store info, does not navigate

---

### T15 — StoreInfo component

**File:** `src/components/ui/StoreInfo.tsx`

Reusable component. Shown in locked TourCard and in auth page for expired tokens.

**Content:**

- "Pronađite nas:" heading
- Ul. Bartula Kašića 8, 23250, Pag
- Radno vrijeme: 10:00 – 20:00
- `<a href="tel:+38595540 3404">+385 95 540 3404</a>`
- `<a href="mailto:info@800.hr">info@800.hr</a>`

---

### T16 — LockedBanner component

**File:** `src/components/ui/LockedBanner.tsx`

Shown above the tour list in `expired` state.

**Content:**

- "Vaše vrijeme je isteklo"
- "Kupite novi pristup u našoj trgovini."
- `<StoreInfo />`

---

### T17 — Tour detail page

**File:** `src/app/[locale]/tour/[id]/page.tsx`

- `generateStaticParams()` uses `TOUR_CATALOG.map(t => ({ id: t.id }))`
- Load tour: if `appState === 'active'`, use `session.tours.find(t => t.id === id)`. Else use `getTourSummary(id)`
- Show: cover image, name, full description, distance, duration, difficulty
- Waypoint list: if active session, show `waypoint.name[locale]` for each. Else show count only ("4 znamenitosti")
- "Kreni" button: only active when `appState === 'active'`. On tap → `recordVisit(tour)` → navigate to `/[locale]/tour/[id]/active`
- Locked state: show `StoreInfo` instead of button

**Acceptance criteria:**

- Statically generated at build time
- Waypoint list shows in active state, count only in other states
- `recordVisit()` called before navigation

---

## Epic 6: Map & Assets

### T18 — Pre-cache tour assets

**File:** `src/lib/mapCache.ts`

Called from auth page after token validation, while online.

```ts
export async function cacheTourAssets(tours: Tour[]): Promise<void>;
```

For each tour:

1. Cache cover image + all waypoint images → `tour-images`
2. Calculate route bounding box
3. Generate OSM tile URLs for zoom 12–16 (tile XY from lat/lng formula)
4. Cap at 1000 tiles per tour (reduce to z14 if exceeded)
5. Fetch + cache all tiles → `osm-tiles`

**Acceptance criteria:**

- After auth, all tours work offline (map + images)
- No crash if one image URL fails (catch per-request, log warning)

---

### T19 — TourMap component

**File:** `src/components/map/TourMap.tsx`

Loaded in parent as: `dynamic(() => import('@/components/map/TourMap'), { ssr: false })`

**Props:**

```ts
{
  tour: Tour
  userPosition: Coordinates | null
  activeWaypointId: string | null
  onWaypointTap: (waypoint: Waypoint) => void
}
```

- `<MapContainer>` fits bounds to `tour.route` on mount
- `<TileLayer>` — OSM light or CartoDB dark based on `prefers-color-scheme`
- `<Polyline>` for route (brand color)
- `<POIMarker>` per waypoint
- `<UserPositionMarker>` when position is not null

**Acceptance criteria:**

- Renders without any API key
- Route + markers visible
- User position updates live

---

### T20 — POIMarker component

**File:** `src/components/map/POIMarker.tsx`

**Props:** `waypoint: Waypoint`, `index: number`, `isActive: boolean`, `onTap: () => void`

- Custom `divIcon` showing waypoint number
- Active state: larger + highlighted color
- Click fires `onTap`

---

### T21 — UserPositionMarker component

**File:** `src/components/map/UserPositionMarker.tsx`

**Props:** `position: Coordinates`

- `<CircleMarker>` with CSS pulse animation (blue dot)

---

## Epic 7: Active Tour (Immersive View)

### T22 — Active tour page

**File:** `src/app/[locale]/tour/[id]/active/page.tsx`

**Guard:** On mount, check `appState`. If not `active` → redirect to `/[locale]` immediately. This prevents direct URL access without a session.

**Layout:**

- Full-screen `TourMap`
- Floating top bar: back button + tour name + `TourProgress`
- `POIModal` slides up from bottom on trigger

**Steps:**

- Load `tour` from `session.tours.find(t => t.id === id)`
- Init `useGeolocation`, `useProximity(tour.waypoints, position)`, `useWakeLock`
- `activeWaypoint` state: set by proximity trigger or marker tap
- Back button → `window.confirm(t('active.exit_confirm'))` before `router.back()`

**Acceptance criteria:**

- Redirect if no valid session (cannot access via direct URL)
- Map full-screen on mobile
- Back requires confirmation

---

### T23 — useGeolocation hook

**File:** `src/hooks/useGeolocation.ts`

```ts
// Returns: { position: Coordinates | null, error: string | null, isSupported: boolean }
```

- `watchPosition` with `{ enableHighAccuracy: true, maximumAge: 5000 }`
- Clear watch on unmount
- Map `PERMISSION_DENIED` error to translation key

---

### T24 — useProximity hook

**File:** `src/hooks/useProximity.ts`

```ts
// Args: waypoints: Waypoint[], userPosition: Coordinates | null
// Returns: { triggeredWaypoint: Waypoint | null, triggeredIds: Set<string> }
```

- Haversine distance on each `userPosition` change
- Each waypoint triggers at most once (tracked in `useRef<Set<string>>`)
- Returns closest in-range waypoint, or `null`
- Also returns `triggeredIds` for use in `TourProgress`

---

### T25 — POIModal component

**File:** `src/components/poi/POIModal.tsx`

**Props:** `waypoint: Waypoint | null`, `locale: Locale`, `onClose: () => void`

- Slide-up from bottom (`transform: translateY` transition)
- Content: name, description, swipeable images (CSS scroll-snap)
- Close: button or swipe-down gesture
- `null` waypoint → renders nothing

---

### T26 — TourProgress component

**File:** `src/components/tour/TourProgress.tsx`

**Props:** `tour: Tour`, `userPosition: Coordinates | null`, `visitedCount: number`

- Project `userPosition` to nearest route segment → distance covered
- Display: `X.X / 20 km` and `N / M waypoints`

---

### T27 — useWakeLock hook

**File:** `src/hooks/useWakeLock.ts`

- `navigator.wakeLock.request('screen')` on mount
- Re-acquire on `visibilitychange`
- Release on unmount
- Fail silently if unsupported

---

## Epic 8: UI Polish

### T28 — LanguageSwitcher

**File:** `src/components/ui/LanguageSwitcher.tsx`

- "HR | EN" with active highlighted
- next-intl `useRouter().replace()` to switch
- Saves to `localStorage[LOCALE_KEY]`

---

### T29 — Dark mode

**Files:** `tailwind.config.ts`, `TourMap.tsx`

- `darkMode: 'media'` in Tailwind
- `dark:` variants on all components
- `TourMap`: switch tile URL to CartoDB dark when `prefers-color-scheme: dark`

---

### T30 — Loading states and error handling

- Skeleton loaders: tour list (3 cards), tour detail
- Error boundary around `TourMap`
- GPS denied banner on active tour page (non-blocking, dismissable)
- Offline banner on `/auth` page when network request fails
- All strings localised

---

## Implementation Order

```
T01 → T02 → T03 → T04                          (foundation)
T05 → T06                                        (types + API client)
T07 → T08 → T09 → T10                           (session + app state)
T11                                              (static catalog)
T12 → T13 → T14 → T15 → T16 → T17              (tour pages + UI states)
T18 → T19 → T20 → T21                           (map + asset caching)
T22 → T23 → T24 → T25 → T26 → T27              (active tour)
T28 → T29 → T30                                 (UI polish)
T31 → T32 → T33                                 (rich content — waypoint richDescription + POIs)
```

---

## Epic 9: Rich Waypoint Content

### T31 — Markdown renderer component

**File:** `src/components/ui/RichText.tsx`

Install: `react-markdown`, `remark-gfm`

```ts
// Props
interface RichTextProps {
  content: string;
  className?: string;
}
```

- Renders a Markdown string as styled HTML
- Apply Tailwind `prose` classes (`@tailwindcss/typography` plugin) for readable body text
- Used in waypoint detail (richDescription) and POI detail (description)

**Acceptance criteria:**

- Headings, bold, italic, lists, links render correctly
- No raw HTML escaping issues

---

### T32 — Update POIModal to show richDescription and POI list

**File:** `src/components/poi/POIModal.tsx` (update T25)

Extend the existing waypoint modal:

1. **richDescription** (if present): show below the short `description`, rendered with `<RichText>`. Collapsed by default with a "Pročitaj više" toggle if content is long.

2. **POI list** (if `waypoint.pois` is non-empty): show a horizontal scroll row of POI cards below the description. Each card: title + first image thumbnail. Tapping a POI card opens `POIDetailSheet` (T33).

**Acceptance criteria:**

- Waypoints without `richDescription` or `pois` render exactly as before (no regressions)
- `richDescription` renders formatted Markdown
- POI cards scroll horizontally if there are more than 2

---

### T33 — POI detail sheet

**File:** `src/components/poi/POIDetailSheet.tsx`

**Props:** `poi: POI | null`, `locale: Locale`, `onClose: () => void`

Full-screen bottom sheet that opens when a POI card is tapped:

- **Header**: POI title + close button
- **Image gallery**: horizontal scroll-snap, same pattern as waypoint images
- **Description**: `<RichText content={poi.description[locale]} />`
- **Video** (if `poi.videoUrl` is set):
  - Extract video ID from YouTube (`youtu.be/` or `youtube.com/watch?v=`) or Vimeo URL
  - Render `<iframe>` embed (16:9 aspect ratio)
  - Note: video requires internet — show "Video nije dostupan offline" if navigator.onLine is false

**Acceptance criteria:**

- Opens/closes with slide-up animation
- Video embed only shown when online
- Works with 0, 1, or multiple images
- `null` poi → renders nothing

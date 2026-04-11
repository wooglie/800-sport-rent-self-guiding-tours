# Self-Guided Tour App — Architecture Plan

## Overview

A PWA (Progressive Web App) built with Next.js (static export). One purchased token gives access to **all available tours**. After scanning the QR code, the user lands on a tour list, picks a tour, and enters the immersive view (GPS map + POIs). When the session expires, the tour list remains visible with basic info, completed tours are marked, but the immersive view is locked with a prompt to return to the store.

Deployed as a static site to AWS S3 + CloudFront. No server-side rendering.

---

## Tech Stack

| Layer      | Choice                                 | Reason                                      |
| ---------- | -------------------------------------- | ------------------------------------------- |
| Framework  | Next.js 14 (App Router, static export) | SSG output, PWA support, file-based routing |
| Language   | TypeScript                             | Type safety, better DX                      |
| Styling    | Tailwind CSS                           | Fast, mobile-first                          |
| Map        | Leaflet + react-leaflet                | Free, no API key, OSM tiles, works offline  |
| i18n       | next-intl                              | Best Next.js App Router support             |
| PWA / SW   | next-pwa (Workbox)                     | Handles service worker + caching            |
| State      | React Context + useReducer             | Sufficient for this app size                |
| Deployment | AWS S3 + CloudFront                    | Static hosting, CDN, HTTPS                  |

**No database. No server. No API routes.** All tour data comes from the external API at token validation time and is cached in localStorage.

---

## Deployment

```
next build        → /out directory (static HTML/CSS/JS)
aws s3 sync /out  → S3 bucket
CloudFront        → CDN + HTTPS + routing
```

`next.config.js` must have:

```js
output: "export";
trailingSlash: true;
```

---

## App States

The entire app behaviour is driven by three states read from localStorage on every load:

| State              | Condition                                  | What user sees                                                                        |
| ------------------ | ------------------------------------------ | ------------------------------------------------------------------------------------- |
| **No access**      | No session, no visit history               | Landing page — "Scan your QR code"                                                    |
| **Active session** | Valid session (`expiresAt > now`)          | Full tour list + immersive view available                                             |
| **Expired**        | No valid session, but visit history exists | Tour list (basic info) + visited badges + immersive locked + "Return to store" prompt |

---

## External API Contract

The app calls one external endpoint. This API is **not part of this implementation** — it will be built separately. The contract is defined here so both sides agree.

Base URL: `NEXT_PUBLIC_API_BASE_URL`

---

### `POST /tokens/validate`

Called once when user scans QR and has no valid session.

**Request:**

```json
{ "code": "string" }
```

**Response — valid (200):**

```json
{
  "valid": true,
  "jwt": "<tour JWT>",
  "expiresAt": "2026-04-11T14:00:00.000Z"
}
```

**Response — invalid/expired (200):**

```json
{ "valid": false, "reason": "not_found | expired" }
```

**Response — server error (500):**

```json
{ "error": "string" }
```

---

### `GET /tours`

Called immediately after successful token validation, while still online. Returns all tour data which is then cached for offline use.

**Request header:** `Authorization: Bearer <tour JWT>`

**Response (200):**

```json
[
  {
    "id": "string",
    "name": { "hr": "string", "en": "string" },
    "description": { "hr": "string", "en": "string" },
    "distance": "string",
    "duration": "string",
    "difficulty": "easy | moderate | hard",
    "coverImage": "string (absolute URL)",
    "startLocation": { "lat": 0.0, "lng": 0.0 },
    "route": [{ "lat": 0.0, "lng": 0.0 }],
    "waypoints": [
      {
        "id": "string",
        "coordinates": { "lat": 0.0, "lng": 0.0 },
        "triggerRadiusMeters": 50,
        "name": { "hr": "string", "en": "string" },
        "description": { "hr": "string", "en": "string" },
        "images": ["string (absolute URL)"]
      }
    ]
  }
]
```

---

## Project File Structure

```
/src
  /app
    /[locale]
      layout.tsx                  # i18n provider (no session guard here)
      page.tsx                    # Tour list — behaviour driven by app state
      /tour/[id]
        page.tsx                  # Tour detail — info + images + "Kreni" button
      /tour/[id]/active
        page.tsx                  # Immersive view — requires valid session
    /auth
      page.tsx                    # QR entry point: validate token → save session → redirect
  /components
    /tour
      TourCard.tsx                # Three visual states: available, visited, locked
      TourDetail.tsx
      TourProgress.tsx
    /map
      TourMap.tsx                 # dynamic import, ssr: false
      POIMarker.tsx
      UserPositionMarker.tsx
    /poi
      POIModal.tsx
    /ui
      LandingPage.tsx             # Shown when no session + no history
      LockedBanner.tsx            # Shown on tour list when expired
      StoreInfo.tsx               # Address, hours, phone — shown when locked
      ShareButton.tsx
      LanguageSwitcher.tsx
  /hooks
    useSession.ts
    useAppState.ts                # Derives 'no_access' | 'active' | 'expired' from localStorage
    useGeolocation.ts
    useProximity.ts
    useWakeLock.ts
  /lib
    session.ts
    api.ts
    mapCache.ts
  /catalog
    index.ts                      # Static TourSummary[] embedded in build
  /types
    tour.ts
    session.ts
  /messages
    hr.json
    en.json
/public
  manifest.json
  /icons
```

---

## Data Models

```ts
// --- tour.ts ---

type Locale = "hr" | "en";
type Coordinates = { lat: number; lng: number };

// Embedded in build — used for post-expiry tour list (no API needed)
type TourSummary = {
  id: string;
  name: Record<Locale, string>;
  description: Record<Locale, string>;
  distance: string;
  duration: string;
  difficulty: "easy" | "moderate" | "hard";
  coverImage: string;
};

// Full tour data — comes from API, stored in session
// API also returns createdAt/updatedAt which the app ignores but should not break on
type Tour = TourSummary & {
  startLocation: Coordinates;
  route: Coordinates[];
  waypoints: Waypoint[];
  createdAt?: string;
  updatedAt?: string;
};

type Waypoint = {
  id: string;
  coordinates: Coordinates;
  triggerRadiusMeters: number;
  name: Record<Locale, string>;
  description: Record<Locale, string>;  // short plain-text description
  images: string[];
  richDescription?: Record<Locale, string>; // long Markdown content
  pois?: POI[];                             // sub-points of interest
};

type POI = {
  id: string;
  title: Record<Locale, string>;
  description: Record<Locale, string>; // Markdown
  images: string[];
  videoUrl?: string;                    // YouTube / Vimeo embed URL
};

// --- session.ts ---

type Session = {
  token: string;    // the short QR code — used for sharing, NOT the tour JWT
  expiresAt: string; // ISO timestamp
  createdAt: string; // ISO timestamp
  tours: Tour[]; // ALL tours from API, cached here
};

// Written when user starts a tour's immersive view. Persists after expiry.
type VisitedTour = {
  tourId: string;
  tourName: Record<Locale, string>;
  startedAt: string; // ISO timestamp
};
```

### localStorage Keys

| Key                  | Content                               | Cleared on expiry |
| -------------------- | ------------------------------------- | ----------------- |
| `sport_rent_session` | Full `Session` object (token + tours) | Yes               |
| `sport_rent_visited` | `VisitedTour[]`                       | **No**            |
| `sport_rent_locale`  | `'hr' \| 'en'`                        | No                |

On session expiry:

1. Delete `sport_rent_session`
2. Clear `tour-images` Cache API entries
3. Keep `sport_rent_visited` — used to show history on the locked tour list

---

## Session & Navigation Flow

```
User opens app
       ↓
Read localStorage
       ↓
No session + no visited history → LandingPage ("Skenirajte QR kod")
       ↓
Valid session → Tour list (full data from session.tours)
       ↓
Expired + visited history exists → Tour list (static catalog) + locked state
       ↓
QR scan → /auth?token=XXX → validate → save session → redirect to /[locale]
```

**Tour list → Immersive:**

```
User taps "Kreni" on a tour
       ↓
Check session: valid? → navigate to /[locale]/tour/[id]/active
                         write VisitedTour to sport_rent_visited
               expired? → show LockedBanner + StoreInfo (no navigation)
```

**Sharing:** ShareButton copies `/auth?token=` + `session.token`. Anyone who opens it goes through the same auth flow with the same `expiresAt`.

---

## Static Tour Catalog

`/src/catalog/index.ts` exports a hardcoded `TourSummary[]`. Used:

1. For `generateStaticParams()` in tour detail pages
2. As fallback data source for the tour list in **expired** state (when session is gone but user should still see basic info)

In the **active** state, the tour list uses richer `Tour[]` data from `session.tours` (includes route, waypoints, images).

Current catalog entry (`ebike-avantura`):

```ts
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
}
```

---

## Offline Strategy

**On initial app load:**

- App shell auto-cached by next-pwa

**After successful token validation:**

1. Fetch + cache all tour cover images and waypoint images → Cache API `tour-images`
2. For each tour: calculate bounding box of `tour.route`, generate OSM tile URLs for zoom 12–16, fetch + cache → Cache API `osm-tiles`
3. Tile count cap: if any single tour exceeds 1000 tiles, cap at zoom 14

**Service worker runtime caching:**

- `https://tile.openstreetmap.org/**` → CacheFirst (`osm-tiles`)
- `https://*.basemaps.cartocdn.com/**` → CacheFirst (`osm-tiles-dark`)
- Tour image CDN URLs → CacheFirst (`tour-images`)

---

## Store Info (shown when expired)

Hardcoded in `StoreInfo.tsx` — no config needed:

- **Adresa:** Ul. Bartula Kašića 8, 23250, Pag
- **Radno vrijeme:** 10:00 – 20:00
- **Telefon:** +385 95 540 3404 (tappable `tel:` link)
- **Email:** info@800.hr (tappable `mailto:` link)

---

## Map (Leaflet + OpenStreetMap)

- `leaflet` + `react-leaflet`
- `TourMap` loaded with `dynamic(() => import(...), { ssr: false })`
- Light tiles: `https://tile.openstreetmap.org/{z}/{x}/{y}.png`
- Dark tiles: `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png`
- Route: `<Polyline>`
- Waypoints: custom `<Marker>` with numbered divIcon
- User position: pulsing `<CircleMarker>`

---

## Key Decisions

- **One token = all tours.** Simpler purchase flow, more value for the buyer.
- **Post-expiry graceful degradation.** User can still browse tour info and see what they completed — they're not locked out of the app entirely.
- **Immersive view requires valid session.** Checked client-side on navigation to `/active`.
- **Visit history persists.** `sport_rent_visited` is never deleted, even across re-purchases (new token, new session, history accumulates).
- **Static catalog is the post-expiry fallback.** No API call or session needed to render basic tour info.
- **No audio.** Out of scope for v1.
- **Admin panel out of scope.** Tokens are pre-generated by a separate system.

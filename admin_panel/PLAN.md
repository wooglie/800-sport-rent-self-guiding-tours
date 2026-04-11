# Admin Panel — Architecture Plan

## Overview

React admin panel (Next.js static export + PWA) deployed to S3 + CloudFront at `admin.sport-rent.800.hr`. Provides full management of tours, access tokens, and admin users. Infrastructure (S3 bucket + CloudFront distribution) is provisioned by the SAM template in `backend/`.

---

## Tech Stack

| Layer         | Choice                                             |
| ------------- | -------------------------------------------------- |
| Framework     | Next.js 14 (App Router, static export)             |
| Language      | TypeScript                                         |
| Styling       | Tailwind CSS                                       |
| PWA           | next-pwa (installable)                             |
| QR generation | `qrcode` (client-side)                             |
| Deployment    | `npm run build` → `aws s3 sync /out s3://{bucket}` |

`next.config.js`:

```js
output: "export";
trailingSlash: true;
```

---

## Pages & Features

| Route              | Description                                                                |
| ------------------ | -------------------------------------------------------------------------- |
| `/login`           | Email + password login form                                                |
| `/`                | Dashboard: stats cards (active today, expired, total, not scanned)         |
| `/tokens`          | Token list table + copy link button per row                                |
| `/tokens/new`      | Generate token form → QR code + copy link + download PNG                   |
| `/tours`           | Tour list table (name HR, distance, duration, waypoint count, edit/delete) |
| `/tours/new`       | Create tour form (all fields, multilingual, waypoints)                     |
| `/tours/[id]/edit` | Edit tour form (prefilled)                                                 |
| `/users`           | Admin user list                                                            |
| `/users/new`       | Create admin user form                                                     |

---

## Auth Flow

### Storage

```ts
// localStorage key: 'admin_session'
type AdminSession = {
  accessToken: string; // JWT, short-lived
  refreshToken: string; // JWT, long-lived
  accessExpiresAt: number; // unix timestamp
  email: string;
};
```

### Login flow

1. POST /auth/login → `{ accessToken, refreshToken }`
2. Decode accessToken to get expiry → save AdminSession to localStorage
3. Redirect to `/`

### API client (proactive refresh)

- Before every API call: if `accessExpiresAt - now < 60s` → call POST /auth/refresh first
- On 401 response: attempt refresh → retry original request → if refresh fails → clear session → redirect to `/login`

### Route guard

- All pages except `/login` check for valid session on mount
- If no session → redirect to `/login`

### Logout

- POST /auth/logout
- Delete `admin_session` from localStorage
- Redirect to `/login`

---

## Token Generation Flow

1. Admin fills form: label (free text) + duration (preset or custom hours)
2. POST /tokens → `{ code, expiresAt, qrContent }`
   - `qrContent = {TOUR_APP_URL}/auth?token={code}`
3. Success screen shows:
   - QR code (generated client-side from `qrContent` using `qrcode` package)
   - Copy link button (copies `qrContent` to clipboard)
   - Download QR as PNG button
   - Token details (code, label, expires at)
4. "Generate another" button resets the form

---

## Tour Editor

The tour form handles a complex nested data structure. Key UX considerations:

- **Multilingual fields:** Tab switcher between HR and EN for name, description, waypoint names/descriptions
- **Route input:** Paste GPX or JSON array of coordinates. Display count of points. (Map preview is v2.)
- **Waypoints:** List with add/remove/reorder. Each waypoint: id (auto-generated slug), coordinates (lat/lng inputs), radius, multilingual name + description, image URLs (list of text inputs).
- **Cover image:** URL input (images hosted externally)
- **Difficulty:** Select (easy / moderate / hard)

---

## Project Structure

```
admin_panel/
  src/
    app/
      login/page.tsx
      layout.tsx              # route guard + session provider
      page.tsx                # dashboard
      tokens/
        page.tsx              # token list
        new/page.tsx          # generate token
      tours/
        page.tsx              # tour list
        new/page.tsx          # create tour
        [id]/edit/page.tsx    # edit tour
      users/
        page.tsx              # user list
        new/page.tsx          # create user
    components/
      auth/
        LoginForm.tsx
        RouteGuard.tsx
      tokens/
        TokenTable.tsx
        TokenForm.tsx
        QRDisplay.tsx
        CopyLinkButton.tsx
      tours/
        TourTable.tsx
        TourForm.tsx
        WaypointEditor.tsx
        LocaleTabSwitcher.tsx
      users/
        UserTable.tsx
        UserForm.tsx
      ui/
        StatsCard.tsx
        ConfirmDialog.tsx
        Toast.tsx
    hooks/
      useSession.ts           # read/validate admin session from localStorage
      useApi.ts               # axios/fetch wrapper with auto-refresh
    lib/
      api.ts                  # typed API client functions
      session.ts              # save/get/clear admin session helpers
    types/
      tour.ts                 # Tour, Waypoint, TourSummary (same as self-guided app)
      session.ts              # AdminSession
      api.ts                  # API request/response types
  public/
    manifest.json
    icons/
  next.config.js
  .env.local
  .env.example
```

---

## Environment Variables

```
NEXT_PUBLIC_API_BASE_URL=https://api.sport-rent.800.hr
NEXT_PUBLIC_TOUR_APP_URL=https://app.sport-rent.800.hr
NEXT_PUBLIC_SESSION_KEY=admin_session
```

---

## Deployment

The S3 bucket and CloudFront distribution are created by `backend/template.yaml`. After `sam deploy`, get the bucket name from SAM outputs, then:

```bash
npm run build
aws s3 sync out/ s3://{AdminPanelBucketName} --delete
aws cloudfront create-invalidation --distribution-id {DistributionId} --paths "/*"
```

The CloudFront invalidation is needed to clear cached files after each deploy.

---

## Key Decisions

- **No separate backend for admin panel.** It calls the same API as the tour app (different endpoints, different JWT type).
- **Tour form handles complexity client-side.** No autosave or drafts for v1. Submit only when the full form is valid.
- **QR generated client-side.** No server involvement — just `qrcode.toDataURL(qrContent)`.
- **next-pwa for installability.** Admin can save the panel to their home screen for quick access.

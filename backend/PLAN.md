# Backend — Architecture Plan

## Overview

AWS SAM project (TypeScript, Node 20.x) deployed to eu-central-1. Provides API for two consumers:

1. **Self-guided tour app** — validates short code → issues Tour JWT → fetches tours
2. **Admin panel** — full CRUD for users, tokens, tours; stateless JWT auth

One SAM template defines all AWS infrastructure: DynamoDB, Lambda, API Gateway, S3, CloudFront.

---

## AWS Resources (template.yaml)

| Resource                  | Details                                                    |
| ------------------------- | ---------------------------------------------------------- |
| DynamoDB::Table           | Users, AccessTokens, Tours (3 tables)                      |
| Lambda                    | One function per endpoint handler                          |
| API Gateway               | REST, Regional, eu-central-1                               |
| API Gateway Custom Domain | api.sport-rent.800.hr (ACM cert in eu-central-1)           |
| Lambda Authorizer         | admin.ts (admin JWT), tour.ts (tour JWT)                   |
| S3::Bucket (x2)           | Admin panel static files + self-guided tour app files      |
| CloudFront::Distribution  | One per static app (admin panel + tour app) + one for API  |
| CloudFront OAC (x2)       | Origin Access Control for each S3 bucket                   |

---

## Two JWT Types

### Admin JWT

- **Access token:** short-lived, signed with `ADMIN_JWT_SECRET`
- **Refresh token:** long-lived, signed with `ADMIN_REFRESH_SECRET`
- Both stateless — not stored in DB
- Payload: `{ sub: userId, email, role: 'admin', type: 'admin_access' | 'admin_refresh' }`
- Logout: client deletes tokens, server does nothing

### Tour JWT

- Issued by `POST /tokens/validate` when short code is valid
- Expiry matches the AccessToken's `expiresAt` (customer's purchase period)
- Signed with `TOUR_JWT_SECRET`
- Payload: `{ type: 'tour', exp: <unix timestamp> }`
- Used by tour app to call `GET /tours` (cached offline after first fetch)

---

## DynamoDB Tables

### Users

```
PK: userId (UUID)
GSI: email-index (PK: email)
Fields:
  userId     String
  email      String
  passwordHash  String  (argon2)
  role       String  ('admin')
  createdAt  String  (ISO)
  createdBy  String  (userId or 'system')
```

### AccessTokens (short codes for QR)

```
PK: code  (8-char random URL-safe string)
Fields:
  code           String
  label          String  (admin note, e.g. "Obiteljski Kovač")
  durationHours  Number
  expiresAt      String  (ISO)
  createdAt      String  (ISO)
  createdBy      String  (userId)
  firstScannedAt String | null
TTL: expiresAt (DynamoDB TTL attribute — numeric epoch)
```

### Tours

```
PK: tourId  (slug, e.g. "ebike-avantura")
Fields:
  id          String
  name        Map  { hr: String, en: String }
  description Map  { hr: String, en: String }
  distance    String  (e.g. "20 km")
  duration    String  (e.g. "~4h")
  difficulty  String  ("easy" | "moderate" | "hard")
  coverImage  String  (absolute URL)
  startLocation  Map  { lat: Number, lng: Number }
  route       List of { lat: Number, lng: Number }?  — optional GPS track for the whole tour
  waypoints   List of {
    id: String
    coordinates: { lat, lng }
    triggerRadiusMeters: Number
    name: { hr, en }
    description: { hr, en }          — short description (plain text)
    images: List of String (URLs)
    richDescription: { hr, en }?     — long description (Markdown)
    walkingRoute: List of { lat, lng }?  — optional walking path inside the waypoint area
    pois: List of {                  — optional sub-points of interest
      id: String
      title: { hr, en }
      description: { hr, en }        — Markdown
      images: List of String (URLs)
      coordinates: { lat, lng }?     — optional map pin for this POI
      videoUrl: String?              — YouTube / Vimeo embed URL
    }?
  }
  createdAt   String
  updatedAt   String
No TTL.
```

---

## API Endpoints

### Public (no auth)

#### `POST /tokens/validate`

- Body: `{ code: string }`
- Looks up `code` in AccessTokens table
- If not found → `{ valid: false, reason: "not_found" }`
- If `expiresAt < now` → `{ valid: false, reason: "expired" }`
- If valid and `firstScannedAt` is null → update it to now
- Issues Tour JWT with `exp = expiresAt`
- Returns: `{ valid: true, jwt: "<tour JWT>", expiresAt: "<ISO>" }`

#### `GET /tours` (tour JWT)

- Authorization: Bearer `<tour JWT>` (validated by tour Lambda Authorizer)
- Returns all items from Tours table as `Tour[]`

### API Key protected (`x-api-key` header)

#### `POST /admin/users`

Bootstrap endpoint to create the first admin. Also usable to create additional admins by anyone with the key.

- Body: `{ email, password }`
- Hashes password with argon2
- Returns: `{ userId, email }`

#### `POST /admin/users/{userId}/reset-password`

- Body: `{ newPassword }`
- Updates passwordHash in Users table

### Admin JWT protected (Bearer `<admin access JWT>`)

#### Auth

```
POST /auth/login     Body: { email, password } → { accessToken, refreshToken }
POST /auth/refresh   Body: { refreshToken }    → { accessToken }
POST /auth/logout    200 OK (client discards tokens)
```

#### Users

```
GET  /users         → User[]
POST /users         Body: { email, password } → User
```

#### AccessTokens

```
GET  /tokens         → AccessToken[] (sorted by createdAt desc)
POST /tokens         Body: { label, durationHours } → { code, expiresAt, qrContent }
                     qrContent = {TOUR_APP_URL}/auth?token={code}
GET  /tokens/stats   → { activeToday, expired, total, notYetScanned }
```

#### Tours (admin)

```
GET    /admin/tours         → Tour[]
POST   /admin/tours         Body: Tour (without id, timestamps) → Tour
PUT    /admin/tours/{id}    Body: Partial<Tour> → Tour
DELETE /admin/tours/{id}    → 204
```

---

## Project Structure

```
backend/
  template.yaml
  samconfig.toml
  src/
    functions/
      auth/
        login/handler.ts
        refresh/handler.ts
        logout/handler.ts
      admin/
        createUser/handler.ts
        resetPassword/handler.ts
      users/
        list/handler.ts
        create/handler.ts
      tokens/
        validate/handler.ts       # public
        create/handler.ts
        list/handler.ts
        stats/handler.ts
      tours/
        listPublic/handler.ts     # tour JWT
        listAdmin/handler.ts      # admin JWT
        create/handler.ts
        update/handler.ts
        delete/handler.ts
    lib/
      dynamodb.ts    # DynamoDB client + helpers
      jwt.ts         # signAdminAccess, signAdminRefresh, signTourJwt, verify*
      password.ts    # hash, compare (argon2)
      response.ts    # ok(), badRequest(), unauthorized(), notFound(), serverError()
    authorizer/
      admin.ts       # validates admin JWT for API Gateway
      tour.ts        # validates tour JWT for API Gateway
  package.json
  tsconfig.json
  .env.example
```

---

## Environment Variables

```
# JWT
ADMIN_JWT_SECRET                   (required)
ADMIN_JWT_EXPIRY_MINUTES           (default: 15)
ADMIN_REFRESH_SECRET               (required)
ADMIN_REFRESH_EXPIRY_DAYS          (default: 30)
TOUR_JWT_SECRET                    (required)

# Auth
ADMIN_API_KEY                      (required, for bootstrap endpoint)

# DynamoDB
USERS_TABLE
ACCESS_TOKENS_TABLE
TOURS_TABLE

# App
TOUR_APP_URL                       (e.g. https://app.sport-rent.800.hr)
```

---

## DNS Setup

### api.sport-rent.800.hr (API Gateway Regional)

1. Request ACM certificate for `api.sport-rent.800.hr` in **eu-central-1**
2. ACM gives CNAME record for validation → add to Netlify DNS
3. `sam deploy` — SAM creates API Gateway + custom domain with cert
4. SAM outputs: API Gateway regional domain (e.g. `d-xxx.execute-api.eu-central-1.amazonaws.com`)
5. Add CNAME in Netlify: `api.sport-rent.800.hr` → API Gateway domain

### admin.sport-rent.800.hr (CloudFront)

1. Request ACM certificate for `admin.sport-rent.800.hr` in **us-east-1** (required for CloudFront)
2. Validate via CNAME in Netlify DNS
3. Pass cert ARN to `sam deploy` as parameter `AdminCloudfrontCertArn`
4. SAM outputs: CloudFront domain (e.g. `d1234.cloudfront.net`)
5. Add CNAME in Netlify: `admin.sport-rent.800.hr` → CloudFront domain

**DNS stays on Netlify. No Route53 needed. Two CNAME records total.**

---

## Deployment Flow

```bash
# 1. First time only: create ACM certs manually in AWS Console
#    - api cert in eu-central-1
#    - admin cert in us-east-1

# 2. Deploy all infrastructure + Lambda code
sam build
sam deploy --parameter-overrides AdminCloudfrontCertArn=arn:aws:acm:us-east-1:...

# 3. Add CNAMEs in Netlify (one-time, after first deploy)

# 4. Bootstrap first admin user
curl -X POST https://api.sport-rent.800.hr/admin/users \
  -H "x-api-key: {ADMIN_API_KEY}" \
  -d '{"email":"you@800.hr","password":"..."}'

# 5. Deploy admin panel (see admin_panel/PLAN.md)
```

---

## Key Decisions

- **Stateless JWT for admin.** No DB table for refresh tokens. Logout only clears client-side. Acceptable for an admin panel with few users.
- **Tour JWT is separate from admin JWT.** Different secrets, different payloads, different authorizers. Tour app cannot call admin endpoints.
- **Short code (not UUID) for QR.** 8-char URL-safe string is short enough to type manually if needed.
- **Tours table in DynamoDB.** Admin panel manages tour content. No hardcoded tour data in Lambda code.
- **One SAM template for everything.** S3 + CloudFront for admin panel defined here alongside the API. Single `sam deploy` provisions all infrastructure.

# Backend — Implementation Tickets

Read `PLAN.md` fully before starting. Key things to keep in mind:

- TypeScript, Node 20.x, AWS SAM
- Two JWT types: admin (stateless, no DB) and tour (issued on token validate)
- Three DynamoDB tables: Users, AccessTokens, Tours
- API Gateway is Regional (eu-central-1), not Edge-optimized

> ✅ **Tickets B01–B28 are complete.** Backend is deployed to AWS (eu-central-1) behind CloudFront.

---

## Epic 1: Project Setup

### B01 — Initialize SAM project

**Steps:**

- `sam init` with Node 20.x + TypeScript template, or create manually
- `package.json` with dependencies:
  - `@aws-sdk/client-dynamodb`, `@aws-sdk/lib-dynamodb`
  - `jsonwebtoken`, `@types/jsonwebtoken`
  - `argon2`
  - `uuid`
- `tsconfig.json`: target ES2020, module commonjs, strict true, outDir dist/
- `.env.example` with all required env vars (see PLAN.md)
- `samconfig.toml` with default stack name, region eu-central-1, confirm changeset false

**Acceptance criteria:**

- `sam build` completes without errors
- TypeScript compiles without errors

---

### B02 — DynamoDB helper + response helpers

**Files:** `src/lib/dynamodb.ts`, `src/lib/response.ts`

`dynamodb.ts`:

- Create DynamoDB DocumentClient (singleton)
- Export typed helpers: `getItem`, `putItem`, `updateItem`, `deleteItem`, `query`, `scan`

`response.ts`:

- Export: `ok(body)`, `created(body)`, `noContent()`, `badRequest(message)`, `unauthorized(message)`, `forbidden()`, `notFound(message)`, `serverError(message)`
- All return `{ statusCode, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(...) }`

**Acceptance criteria:**

- All functions typed, no `any`
- CORS header on all responses

---

### B03 — JWT helpers

**File:** `src/lib/jwt.ts`

```ts
export function signAdminAccess(payload: {
  userId: string;
  email: string;
}): string;
export function signAdminRefresh(payload: { userId: string }): string;
export function signTourJwt(expiresAt: string): string; // exp = Date.parse(expiresAt)/1000

export function verifyAdminAccess(token: string): AdminAccessPayload | null;
export function verifyAdminRefresh(token: string): AdminRefreshPayload | null;
export function verifyTourJwt(token: string): TourPayload | null;

type AdminAccessPayload = {
  userId: string;
  email: string;
  role: "admin";
  type: "admin_access";
};
type AdminRefreshPayload = { userId: string; type: "admin_refresh" };
type TourPayload = { type: "tour" };
```

- Use env vars: `ADMIN_JWT_SECRET`, `ADMIN_JWT_EXPIRY_MINUTES`, `ADMIN_REFRESH_SECRET`, `ADMIN_REFRESH_EXPIRY_DAYS`, `TOUR_JWT_SECRET`
- All verify functions return `null` on invalid/expired (never throw)

**Acceptance criteria:**

- Round-trip test: sign → verify returns correct payload
- Expired token verify returns null

---

### B04 — Password helpers

**File:** `src/lib/password.ts`

```ts
export async function hashPassword(plain: string): Promise<string>; // argon2id
export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean>;
```

---

### B05 — Lambda Authorizers

**Files:** `src/authorizer/admin.ts`, `src/authorizer/tour.ts`

Both follow API Gateway Lambda Authorizer (TOKEN type) pattern:

- Extract token from `event.authorizationToken` (strip "Bearer ")
- Call appropriate verify function
- If valid → return `Allow` policy with `principalId = userId` (or "tour")
- If invalid → return `Deny` policy (or throw "Unauthorized")

`admin.ts` uses `verifyAdminAccess()`
`tour.ts` uses `verifyTourJwt()`

**Acceptance criteria:**

- Returns valid IAM policy document on valid token
- Returns Deny on expired or invalid token

---

### B06 — SAM template: DynamoDB tables + IAM

**File:** `template.yaml`

Define 3 DynamoDB tables with:

- BillingMode: PAY_PER_REQUEST
- TTL configuration on AccessTokens (attribute: `expiresAtEpoch`)
- GSI on Users table: `email-index`

Define IAM role for Lambda functions with permissions:

- `dynamodb:GetItem`, `PutItem`, `UpdateItem`, `DeleteItem`, `Query`, `Scan` on all 3 tables

**Acceptance criteria:**

- `sam validate` passes
- `sam build` succeeds

---

### B07 — SAM template: API Gateway + Authorizers + Custom Domain

**File:** `template.yaml` (continued)

- Define `AWS::Serverless::Api` with:
  - `EndpointConfiguration: REGIONAL`
  - `Auth` section with two Lambda Authorizers (admin, tour)
  - `Cors` settings (allow origin: \*, headers: Content-Type + Authorization + x-api-key)
- Define `AWS::ApiGateway::DomainName` for `api.sport-rent.800.hr`
  - `RegionalCertificateArn`: parameter `ApiCertArn`
- Define `AWS::ApiGateway::BasePathMapping`
- Output: API Gateway regional domain name (for Netlify CNAME)

**Parameters:**

```yaml
Parameters:
  ApiCertArn:
    Type: String
    Description: ACM cert ARN for api.sport-rent.800.hr (eu-central-1)
  AdminCloudfrontCertArn:
    Type: String
    Description: ACM cert ARN for admin.sport-rent.800.hr (us-east-1)
```

**Acceptance criteria:**

- `sam validate` passes
- API Gateway deploys with custom domain after `sam deploy`

---

### B08 — SAM template: S3 + CloudFront for admin panel

**File:** `template.yaml` (continued)

- `AWS::S3::Bucket`: AdminPanelBucket (block all public access)
- `AWS::CloudFront::OriginAccessControl`
- `AWS::S3::BucketPolicy`: allow CloudFront OAC to read
- `AWS::CloudFront::Distribution`:
  - Origin: S3 bucket
  - DefaultRootObject: index.html
  - CustomErrorResponses: 404 → /404.html (200), for SPA routing
  - Aliases: `admin.sport-rent.800.hr`
  - ViewerCertificate: `AdminCloudfrontCertArn` (parameter)
  - PriceClass: PriceClass_100
- Output: CloudFront domain name (for Netlify CNAME), S3 bucket name

**Acceptance criteria:**

- `sam deploy` creates S3 + CloudFront
- CloudFront serves files from S3 after upload

---

## Epic 2: Admin User Endpoints

### B09 — Bootstrap: create admin user

**File:** `src/functions/admin/createUser/handler.ts`

- Validate `x-api-key` header against `ADMIN_API_KEY` env var
- Validate body: `{ email, password }` (email format, password min 8 chars)
- Check Users GSI: email must not already exist
- Hash password with `hashPassword()`
- PutItem to Users table
- Return `created({ userId, email })`

**Acceptance criteria:**

- Returns 201 on success
- Returns 409 if email already exists
- Returns 403 if API key missing or wrong

---

### B10 — Reset password (API key protected)

**File:** `src/functions/admin/resetPassword/handler.ts`

- Validate `x-api-key`
- Load user by userId (path param)
- Return 404 if not found
- Hash new password, update passwordHash in Users table
- Return `ok({ message: 'Password reset' })`

---

## Epic 3: Auth Endpoints

### B11 — Login

**File:** `src/functions/auth/login/handler.ts`

- Body: `{ email, password }`
- Query Users by email (GSI)
- Return 401 if not found
- `verifyPassword()` — return 401 if wrong
- `signAdminAccess({ userId, email })` → accessToken
- `signAdminRefresh({ userId })` → refreshToken
- Return `ok({ accessToken, refreshToken })`

**Acceptance criteria:**

- Returns tokens on valid credentials
- Returns 401 on wrong email or password (same message, no enumeration)

---

### B12 — Refresh

**File:** `src/functions/auth/refresh/handler.ts`

- Body: `{ refreshToken }`
- `verifyAdminRefresh(refreshToken)` → null = 401
- Load user by userId from payload (verify user still exists)
- `signAdminAccess({ userId, email })` → new accessToken
- Return `ok({ accessToken })`

---

### B13 — Logout

**File:** `src/functions/auth/logout/handler.ts`

- Protected by admin authorizer
- Body: ignored
- Return `ok({ message: 'Logged out' })`
- (Client deletes tokens from localStorage)

---

## Epic 4: User Management

### B14 — List users

**File:** `src/functions/users/list/handler.ts`

- Scan Users table
- Return `ok(users)` — exclude `passwordHash` from response

---

### B15 — Create user (by existing admin)

**File:** `src/functions/users/create/handler.ts`

- Protected by admin authorizer
- Body: `{ email, password }`
- Same logic as B09 but uses admin JWT userId as `createdBy`
- Return `created({ userId, email })`

---

## Epic 5: AccessToken Endpoints

### B16 — Create access token (short code)

**File:** `src/functions/tokens/create/handler.ts`

- Body: `{ label: string, durationHours: number }`
- Generate code: 8 random URL-safe chars (use `crypto.randomBytes`)
- `expiresAt = now + durationHours`
- `expiresAtEpoch = Math.floor(Date.parse(expiresAt) / 1000)` (for DynamoDB TTL)
- PutItem to AccessTokens
- `qrContent = {TOUR_APP_URL}/auth?token={code}`
- Return `created({ code, label, expiresAt, qrContent })`

**Acceptance criteria:**

- Code is unique (retry on collision, max 3 attempts)
- qrContent is the correct tour app URL

---

### B17 — List access tokens

**File:** `src/functions/tokens/list/handler.ts`

- Scan AccessTokens table
- Compute status per item:
  - `not_scanned`: `firstScannedAt` is null
  - `active`: `expiresAt > now`
  - `expired`: `expiresAt <= now`
- Sort by `createdAt` descending
- Return `ok(tokens)` (include computed `status` field)

---

### B18 — Token stats

**File:** `src/functions/tokens/stats/handler.ts`

- Scan AccessTokens
- Count:
  - `total`: all items
  - `activeToday`: `expiresAt > now` AND `createdAt >= startOfToday`
  - `expired`: `expiresAt <= now`
  - `notYetScanned`: `firstScannedAt` is null AND `expiresAt > now`
- Return `ok({ total, activeToday, expired, notYetScanned })`

---

## Epic 6: Token Validate (Public)

### B19 — Validate access token

**File:** `src/functions/tokens/validate/handler.ts`

**No auth required. This is called by the self-guided tour app.**

- Body: `{ code: string }`
- GetItem from AccessTokens by code
- Not found → `ok({ valid: false, reason: 'not_found' })`
- `expiresAt <= now` → `ok({ valid: false, reason: 'expired' })`
- If `firstScannedAt` is null → UpdateItem: set `firstScannedAt = now`
- `signTourJwt(expiresAt)` → jwt
- Return `ok({ valid: true, jwt, expiresAt })`

**Acceptance criteria:**

- Sets firstScannedAt only on first successful validation
- Returns same jwt structure on subsequent valid calls (firstScannedAt already set, no update)

---

## Epic 7: Tours Endpoints

### B20 — List tours (public, tour JWT)

**File:** `src/functions/tours/listPublic/handler.ts`

- Protected by tour authorizer
- Scan Tours table
- Return `ok(tours)`

---

### B21 — List tours (admin JWT)

**File:** `src/functions/tours/listAdmin/handler.ts`

- Protected by admin authorizer
- Scan Tours table
- Return `ok(tours)`

---

### B22 — Create tour

**File:** `src/functions/tours/create/handler.ts`

- Body: full Tour object (without id, timestamps)
- Validate required fields: id (slug), name.hr, name.en, route (min 2 points), waypoints (min 1)
- `id` must be URL-safe slug (validate with regex)
- Check Tours: id must not already exist
- PutItem with `createdAt = now`, `updatedAt = now`
- Return `created(tour)`

---

### B23 — Update tour

**File:** `src/functions/tours/update/handler.ts`

- Path param: `id`
- GetItem → 404 if not found
- Merge incoming fields with existing item
- UpdateItem with `updatedAt = now`
- Return `ok(updatedTour)`

---

### B24 — Delete tour

**File:** `src/functions/tours/delete/handler.ts`

- Path param: `id`
- GetItem → 404 if not found
- DeleteItem
- Return `noContent()`

---

### B25 — Wire all functions in SAM template

**File:** `template.yaml`

Add `AWS::Serverless::Function` for each handler with:

- `CodeUri: src/functions/{path}`
- `Handler: handler.handler`
- `Runtime: nodejs20.x`
- `Environment` with all required env vars from SSM or inline
- `Events` with API Gateway event (method, path, auth type)

Auth types per endpoint:

- `NONE`: POST /tokens/validate, GET /tours (tour authorizer), POST /auth/login, POST /auth/refresh
- `CUSTOM` (admin authorizer): all other protected endpoints
- x-api-key: handled in Lambda code (not API Gateway usage plans)

**Acceptance criteria:**

- `sam build && sam deploy` deploys all functions
- All endpoints reachable at api.sport-rent.800.hr

---

## Implementation Order

```
B01 → B02 → B03 → B04              (project setup + lib)
B05                                  (authorizers)
B06 → B07 → B08                    (SAM template)
B09 → B10                           (admin bootstrap)
B11 → B12 → B13                    (auth)
B14 → B15                           (users)
B16 → B17 → B18                    (access tokens)
B19                                  (validate — public)
B20 → B21 → B22 → B23 → B24       (tours)
B25                                  (wire everything in template)
B26                                  (Zod schema validation for tours)
```

---

## Epic 8: Schema Validation

### B26 — Zod validation for Tour / Waypoint / POI

**File:** `src/lib/schemas.ts`

Install `zod` as a dependency.

Define and export Zod schemas that exactly mirror the DynamoDB data model:

```ts
export const CoordinatesSchema = z.object({ lat: z.number(), lng: z.number() });
export const LocalizedStringSchema = z.object({ hr: z.string(), en: z.string() });

export const POISchema = z.object({
  id: z.string().min(1),
  title: LocalizedStringSchema,
  description: LocalizedStringSchema,   // markdown / rich text
  images: z.array(z.string()),
  videoUrl: z.string().url().optional(),
});

export const WaypointSchema = z.object({
  id: z.string().min(1),
  coordinates: CoordinatesSchema,
  triggerRadiusMeters: z.number().positive(),
  name: LocalizedStringSchema,
  description: LocalizedStringSchema,
  images: z.array(z.string()),
  richDescription: LocalizedStringSchema.optional(),
  pois: z.array(POISchema).optional(),
});

export const TourInputSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Must be a URL-safe slug'),
  name: LocalizedStringSchema,
  description: LocalizedStringSchema,
  distance: z.string().min(1),
  duration: z.string().min(1),
  difficulty: z.enum(['easy', 'moderate', 'hard']),
  coverImage: z.string().url(),
  startLocation: CoordinatesSchema,
  route: z.array(CoordinatesSchema).min(2, 'Route must have at least 2 points'),
  waypoints: z.array(WaypointSchema).min(1, 'At least one waypoint required'),
});

export const TourUpdateSchema = TourInputSchema.partial().omit({ id: true });

export type TourInput = z.infer<typeof TourInputSchema>;
export type TourUpdate = z.infer<typeof TourUpdateSchema>;
```

Replace manual validation in `src/functions/tours/create/handler.ts` and `src/functions/tours/update/handler.ts` with `TourInputSchema.safeParse(body)` / `TourUpdateSchema.safeParse(body)`. Return `badRequest(error.message)` on parse failure.

**Acceptance criteria:**

- `sam build` succeeds with zod added
- Invalid tour body (missing `name.en`, bad slug, route < 2 points) returns 400 with a descriptive message
- Valid tour body passes through unchanged

---

### B27 — Delete access token (unused only)

**File:** `src/functions/tokens/delete/handler.ts`

- Protected by admin authorizer
- Path param: `code`
- `GetItem` from AccessTokens → 404 if not found
- If `firstScannedAt` is **not** null → return `403 { error: "Token has already been used and cannot be deleted" }`
- `DeleteItem`
- Return `noContent()`

Wire in `template.yaml`:

```yaml
DeleteTokenFunction:
  Path: /tokens/{code}
  Method: DELETE
  Auth: AdminAuthorizer
```

**Acceptance criteria:**

- Returns 204 on successful delete of an unused token
- Returns 403 if token has been scanned at least once
- Returns 404 if token does not exist

---

### B28 — Optional route + walkingRoute on Waypoint + coordinates on POI

**File:** `src/lib/schemas.ts`

Three schema changes:

1. Make `route` optional on `TourInputSchema` — some tours may not have a GPS track yet:

```ts
route: z.array(CoordinatesSchema).min(2, 'Route must have at least 2 points').optional(),
```

2. Add optional `walkingRoute` to `WaypointSchema` — a guided walking path inside a waypoint area (e.g. "walk through the old town square and stop at these 3 spots"):

```ts
walkingRoute: z.array(CoordinatesSchema).optional(),
```

3. Add optional `coordinates` to `POISchema` — a map pin so the self-guided app can show each POI as a numbered marker on the walking route mini-map:

```ts
coordinates: CoordinatesSchema.optional(),
```

No handler changes needed — all fields are passed through unchanged by the create/update handlers since they merge/spread the validated body.

---

### B29 — S3 + CloudFront for self-guided tour app

**File:** `template.yaml`

Mirror the admin panel S3 + CloudFront setup (B08) for the self-guided tour app:

- `TourAppBucket` — S3 bucket, all public access blocked, name: `${StackName}-tour-app`
- `TourAppOAC` — CloudFront Origin Access Control (`${StackName}-tour-app-oac`)
- `TourAppBucketPolicy` — allows CloudFront OAC to `s3:GetObject`
- `TourAppDistribution` — CloudFront distribution:
  - Origin: `TourAppBucket` (via OAC)
  - `DefaultRootObject: index.html`
  - `PriceClass_100`
  - `CachingOptimized` policy
  - `CustomErrorResponses`: 404 → `/404.html` (200), 403 → `/index.html` (200) — for SPA routing
- Outputs: `TourAppBucketName`, `TourAppDistributionId`, `TourAppDomain`

> ✅ **Already implemented in template.yaml.**

**Deploy:**

```bash
sam deploy  # picks up new resources
aws s3 sync self_guided_app/out s3://$(sam list stack-outputs --stack-name sport-rent-backend --output json | jq -r '.[] | select(.OutputKey=="TourAppBucketName") | .OutputValue')
```

**Acceptance criteria:**

- `sam deploy` creates bucket + CloudFront distribution
- Uploading the Next.js `/out` directory and opening the CloudFront domain shows the app

---

### B28 — Optional route + walkingRoute on Waypoint + coordinates on POI

**File:** `src/lib/schemas.ts`

Three schema changes:

1. Make `route` optional on `TourInputSchema` — some tours may not have a GPS track yet:

```ts
route: z.array(CoordinatesSchema).min(2, 'Route must have at least 2 points').optional(),
```

2. Add optional `walkingRoute` to `WaypointSchema` — a guided walking path inside a waypoint area (e.g. "walk through the old town square and stop at these 3 spots"):

```ts
walkingRoute: z.array(CoordinatesSchema).optional(),
```

3. Add optional `coordinates` to `POISchema` — a map pin so the self-guided app can show each POI as a numbered marker on the walking route mini-map:

```ts
coordinates: CoordinatesSchema.optional(),
```

No handler changes needed — all fields are passed through unchanged by the create/update handlers since they merge/spread the validated body.

**Acceptance criteria:**

- Tour create/update with no `route` field succeeds (does not return 400)
- Tour create/update with `route: []` or `route` with 1 point still fails with 400 (min(2) still applies when the field is present)
- Waypoint with `walkingRoute: [{ lat, lng }, ...]` is stored and returned correctly
- POI with `coordinates: { lat, lng }` is stored and returned correctly
- POI without `coordinates` is stored and returned correctly (field absent, not null)
- `sam build` succeeds

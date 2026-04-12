# 800 Sport Rent — Backend

AWS SAM backend for the Sport Rent tour platform. Includes API Gateway + Lambda functions, DynamoDB tables, and CloudFront distributions for the tour app, admin panel, and API.

DNS is managed externally on **Netlify DNS** under the `800.hr` zone. There is no Route 53 in this stack.

---

## Architecture

```
Netlify DNS
  app.sport-rent.800.hr   ──CNAME──▶  TourAppDistribution.cloudfront.net
  admin.sport-rent.800.hr ──CNAME──▶  AdminPanelDistribution.cloudfront.net
  api.sport-rent.800.hr   ──CNAME──▶  ApiDistribution.cloudfront.net
                                              │
                                    ACM cert (us-east-1)
                                    sport-rent-cert stack
```

Two CloudFormation stacks:

| Stack                | Template          | Region         | Purpose                                         |
| -------------------- | ----------------- | -------------- | ----------------------------------------------- |
| `sport-rent-cert`    | `cert-stack.yaml` | `us-east-1`    | ACM certificate (CloudFront requires us-east-1) |
| `sport-rent-backend` | `template.yaml`   | `eu-central-1` | Everything else                                 |

---

## Prerequisites

- AWS CLI configured (`aws configure`)
- SAM CLI installed (`brew install aws-sam-cli`)
- pnpm installed

---

## First-time deployment

### Step 1 — Deploy the certificate stack

This is a one-time step. The stack creates the ACM certificate and waits for DNS validation to complete.

```bash
sam deploy --config-env cert --template cert-stack.yaml
```

The deployment will **pause and wait** while the certificate is in `PENDING_VALIDATION` state. Do not cancel it — proceed to Step 2.

---

### Step 2 — Add ACM validation records to Netlify DNS

While the deployment is waiting, look at the SAM deploy event log — the validation records appear directly in the `ResourceStatusReason` column as the certificate is created, e.g.:

```
Content of DNS Record is: {Name: _505e2fa....app.sport-rent.800.hr., Type: CNAME, Value: _8000a....acm-validations.aws.}
```

You can read them straight from there. Alternatively, open a second terminal and query ACM directly (works before the stack completes):

```bash
CERT_ARN=$(aws cloudformation describe-stack-resource \
  --stack-name sport-rent-cert \
  --logical-resource-id CloudFrontCertificate \
  --region us-east-1 \
  --query 'StackResourceDetail.PhysicalResourceId' \
  --output text)

aws acm describe-certificate \
  --certificate-arn "$CERT_ARN" \
  --region us-east-1 \
  --query 'Certificate.DomainValidationOptions[*].ResourceRecord'
```

This prints 3 objects like:

```json
[
  {
    "Name": "_abc123.app.sport-rent.800.hr.",
    "Type": "CNAME",
    "Value": "_xyz.acm-validations.aws."
  },
  {
    "Name": "_abc123.admin.sport-rent.800.hr.",
    "Type": "CNAME",
    "Value": "_xyz.acm-validations.aws."
  },
  {
    "Name": "_abc123.api.sport-rent.800.hr.",
    "Type": "CNAME",
    "Value": "_xyz.acm-validations.aws."
  }
]
```

**In Netlify DNS** (zone: `800.hr`), add all 3 records. Strip the trailing dot, then drop the `.800.hr` suffix — Netlify appends the zone automatically:

| Type  | Name to enter in Netlify   | Value (strip trailing dot) |
| ----- | -------------------------- | -------------------------- |
| CNAME | `_abc123.app.sport-rent`   | `_xyz.acm-validations.aws` |
| CNAME | `_abc123.admin.sport-rent` | `_xyz.acm-validations.aws` |
| CNAME | `_abc123.api.sport-rent`   | `_xyz.acm-validations.aws` |

> These validation records are permanent — ACM uses them for automatic certificate renewal. Do not delete them.

Once DNS propagates (usually under 5 minutes on Netlify), the certificate validates automatically and the deployment in Step 1 completes.

---

### Step 3 — Note the certificate ARN

If `$CERT_ARN` is still set from Step 2, just run:

```bash
echo "$CERT_ARN"
```

Otherwise retrieve it again (cert stack must be complete):

```bash
CERT_ARN=$(aws cloudformation describe-stack-resource \
  --stack-name sport-rent-cert \
  --logical-resource-id CloudFrontCertificate \
  --region us-east-1 \
  --query 'StackResourceDetail.PhysicalResourceId' \
  --output text)
echo "$CERT_ARN"
```

Output looks like: `arn:aws:acm:us-east-1:123456789012:certificate/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

Update `samconfig.toml` — replace the placeholder in the `[default.deploy.parameters]` `parameter_overrides` line:

```
CloudFrontCertArn="arn:aws:acm:us-east-1:123456789012:certificate/xxxxxxxx-..."
```

---

### Step 4 — Deploy the main stack

```bash
sam build && sam deploy
```

This deploys to `eu-central-1`. Takes ~5 minutes.

---

### Step 5 — Add CloudFront CNAME records to Netlify DNS

After the main stack is deployed, get the 3 CloudFront domain names from the stack outputs:

```bash
aws cloudformation describe-stacks \
  --stack-name sport-rent-backend \
  --region eu-central-1 \
  --query 'Stacks[0].Outputs[?contains(OutputKey, `CloudFrontDomain`)].{Key:OutputKey,Value:OutputValue}' \
  --output table
```

**In Netlify DNS** (zone: `800.hr`), add 3 CNAME records. Netlify appends `.800.hr` automatically, so enter only the part before it:

| Type  | Name to enter in Netlify | Value                                               |
| ----- | ------------------------ | --------------------------------------------------- |
| CNAME | `app.sport-rent`         | `xxxxx.cloudfront.net` (TourAppCloudFrontDomain)    |
| CNAME | `admin.sport-rent`       | `yyyyy.cloudfront.net` (AdminPanelCloudFrontDomain) |
| CNAME | `api.sport-rent`         | `zzzzz.cloudfront.net` (ApiCloudFrontDomain)        |

Once DNS propagates, all three custom domains are live:

- `https://app.sport-rent.800.hr`
- `https://admin.sport-rent.800.hr`
- `https://api.sport-rent.800.hr`

---

## Deploying app builds

After the initial setup, content is deployed by uploading built files to S3 and invalidating CloudFront.

### Tour app

```bash
# From self_guided_app/
pnpm build

aws s3 sync out/ s3://$(aws cloudformation describe-stacks \
  --stack-name sport-rent-backend --region eu-central-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`TourAppBucketName`].OutputValue' \
  --output text) --delete

aws cloudfront create-invalidation \
  --distribution-id $(aws cloudformation describe-stacks \
    --stack-name sport-rent-backend --region eu-central-1 \
    --query 'Stacks[0].Outputs[?OutputKey==`TourAppDistributionId`].OutputValue' \
    --output text) \
  --paths "/*"
```

### Admin panel

```bash
# From admin_panel/
pnpm build

aws s3 sync out/ s3://$(aws cloudformation describe-stacks \
  --stack-name sport-rent-backend --region eu-central-1 \
  --query 'Stacks[0].Outputs[?OutputKey==`AdminPanelBucketName`].OutputValue' \
  --output text) --delete

aws cloudfront create-invalidation \
  --distribution-id $(aws cloudformation describe-stacks \
    --stack-name sport-rent-backend --region eu-central-1 \
    --query 'Stacks[0].Outputs[?OutputKey==`AdminPanelDistributionId`].OutputValue' \
    --output text) \
  --paths "/*"
```

---

## Subsequent backend deploys

For normal backend changes (Lambda code, new endpoints, etc.):

```bash
sam build && sam deploy
```

The cert stack never needs to be redeployed unless the domain name changes.

---

## Summary: what goes into Netlify DNS and when

| When                              | Type  | Records                                                                                                                  |
| --------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------ |
| During cert stack deploy (Step 2) | CNAME | 3 × ACM validation records — name: `_abc123.app/admin/api.sport-rent`, value: `_xyz.acm-validations.aws` — **permanent** |
| After main stack deploys (Step 5) | CNAME | `app.sport-rent` → CloudFront, `admin.sport-rent` → CloudFront, `api.sport-rent` → CloudFront                            |

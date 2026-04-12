#!/bin/bash
set -e

BUCKET="sport-rent-backend-admin-panel"
DISTRIBUTION_ID="E30OAWGS9ME0ZN"

echo "Building..."
pnpm run build

# Upload _next/static/ first with immutable cache (files are content-hashed)
echo "Uploading static assets..."
aws s3 sync out/_next/ "s3://$BUCKET/_next/" \
  --cache-control "public, max-age=31536000, immutable" \
  --delete

# Upload everything else (HTML, public assets) with no-cache
echo "Uploading pages..."
aws s3 sync out/ "s3://$BUCKET/" \
  --exclude "_next/*" \
  --cache-control "no-cache, no-store, must-revalidate" \
  --delete

# Invalidate CloudFront so it stops serving cached index.html pointing to old chunks
echo "Invalidating CloudFront..."
aws cloudfront create-invalidation \
  --distribution-id "$DISTRIBUTION_ID" \
  --paths "/*"

echo "Deployed."

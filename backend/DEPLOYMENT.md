CloudFormation outputs from deployed stack
-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
Outputs
-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
Key                 AdminPanelDistributionId
Description         CloudFront distribution ID for admin panel
Value               E30OAWGS9ME0ZN

Key                 TourAppCloudFrontDomain
Description         CloudFront domain for tour app (CNAME target)
Value               d1gznryaow6eau.cloudfront.net

Key                 TourAppBucketName
Description         S3 bucket name for self-guided tour app static files
Value               sport-rent-backend-tour-app

Key                 TourAppDistributionId
Description         CloudFront distribution ID for self-guided tour app
Value               E3ADGVBBDK0BYR

Key                 ApiGatewayUrl
Description         Direct API Gateway URL (internal)
Value               https://vmokx9b2zi.execute-api.eu-central-1.amazonaws.com/prod

Key                 AdminPanelBucketName
Description         S3 bucket name for admin panel static files
Value               sport-rent-backend-admin-panel

Key                 ApiSubdomain
Description         API custom domain (point CNAME to ApiCloudFrontDomain)
Value               https://api.sport-rent.800.hr

Key                 ApiUrl
Description         API URL via CloudFront (use this in your apps)
Value               https://d2km0xf4jm65i.cloudfront.net

Key                 ApiCloudFrontDomain
Description         CloudFront domain for API (CNAME target)
Value               d2km0xf4jm65i.cloudfront.net

Key                 TourAppDomain
Description         CloudFront domain for self-guided tour app
Value               https://d1gznryaow6eau.cloudfront.net

Key                 AppSubdomain
Description         Tour app custom domain (point CNAME to TourAppCloudFrontDomain)
Value               https://app.sport-rent.800.hr

Key                 AdminSubdomain
Description         Admin panel custom domain (point CNAME to AdminPanelCloudFrontDomain)
Value               https://admin.sport-rent.800.hr

Key                 AdminPanelCloudFrontDomain
Description         CloudFront domain for admin panel (CNAME target)
Value               d1p6lony0didbz.cloudfront.net

Key                 AdminPanelDomain
Description         CloudFront domain for admin panel
Value               https://d1p6lony0didbz.cloudfront.net

Key                 ApiDistributionId
Description         CloudFront distribution ID for API
Value               E2MB0JV3HZALH3




4. After deploy, create your first admin user
curl -X POST https://d2km0xf4jm65i.cloudfront.net/admin/users \
  -H "Content-Type: application/json" \
  -H "x-api-key: 4085e97e766f86aea0c264080c9e491da4a0174234070cd1671e6574f1970764" \
  -d '{"email":"info@800.hr","password":"gljiva123"}'

5. Test login
curl -X POST https://d2km0xf4jm65i.cloudfront.net/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"info@800.hr","password":"gljiva123"}'
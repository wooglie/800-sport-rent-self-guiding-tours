CloudFormation outputs from deployed stack
-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
Outputs
-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------
Key                 ApiGatewayUrl
Description         Direct API Gateway URL (internal)
Value               https://vmokx9b2zi.execute-api.eu-central-1.amazonaws.com/prod

Key                 AdminPanelBucketName
Description         S3 bucket name for admin panel static files
Value               sport-rent-backend-admin-panel

Key                 ApiUrl
Description         API URL via CloudFront (use this in your apps)
Value               https://d2km0xf4jm65i.cloudfront.net

Key                 AdminPanelDistributionId
Description         CloudFront distribution ID for admin panel
Value               E30OAWGS9ME0ZN

Key                 AdminPanelDomain
Description         CloudFront domain for admin panel
Value               d1p6lony0didbz.cloudfront.net

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
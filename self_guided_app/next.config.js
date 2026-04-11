const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  runtimeCaching: [
    {
      urlPattern: /\/_next\/static\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "static-assets",
        expiration: { maxEntries: 200, maxAgeSeconds: 365 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /^https:\/\/tile\.openstreetmap\.org\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "osm-tiles",
        expiration: { maxEntries: 5000, maxAgeSeconds: 7 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /^https:\/\/.*\.basemaps\.cartocdn\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "osm-tiles-dark",
        expiration: { maxEntries: 5000, maxAgeSeconds: 7 * 24 * 60 * 60 },
      },
    },
    {
      // Match any CloudFront domain — tour images may be served from any CloudFront distribution
      urlPattern: /^https:\/\/[^/]+\.cloudfront\.net\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "tour-images",
        expiration: { maxEntries: 500, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
  ],
});

const createNextIntlPlugin = require("next-intl/plugin");
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

module.exports = withPWA(withNextIntl(nextConfig));

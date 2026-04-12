const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  // next-pwa injects its register.js into webpack's "main.js" entry, but
  // Next.js 16 App Router uses "main-app.js" — so that chunk is never loaded.
  // We register the SW ourselves in src/app/sw-register.tsx instead.
  register: false,
  additionalManifestEntries: [
    // Pre-cache all known HTML entry points so they're available offline
    // immediately after SW install, regardless of which URL the user entered from.
    { url: "/",      revision: `${Date.now()}` },
    { url: "/hr/",   revision: `${Date.now()}` },
    { url: "/en/",   revision: `${Date.now()}` },
    { url: "/auth/", revision: `${Date.now()}` },
    // Pre-cache Next.js App Router RSC payload files for the locale home pages.
    // The root page does router.replace("/hr") on load — Next.js App Router
    // fetches these /__next.*.txt files for every client-side navigation.
    // Without them in the precache, going offline breaks navigation immediately
    // even if the HTML shell is cached.
    { url: "/__next.__PAGE__.txt",            revision: `${Date.now()}` },
    { url: "/__next._full.txt",               revision: `${Date.now()}` },
    { url: "/__next._head.txt",               revision: `${Date.now()}` },
    { url: "/__next._index.txt",              revision: `${Date.now()}` },
    { url: "/__next._tree.txt",               revision: `${Date.now()}` },
    { url: "/hr/__next.$d$locale.__PAGE__.txt", revision: `${Date.now()}` },
    { url: "/hr/__next.$d$locale.txt",          revision: `${Date.now()}` },
    { url: "/hr/__next._full.txt",              revision: `${Date.now()}` },
    { url: "/hr/__next._head.txt",              revision: `${Date.now()}` },
    { url: "/hr/__next._index.txt",             revision: `${Date.now()}` },
    { url: "/hr/__next._tree.txt",              revision: `${Date.now()}` },
    { url: "/en/__next.$d$locale.__PAGE__.txt", revision: `${Date.now()}` },
    { url: "/en/__next.$d$locale.txt",          revision: `${Date.now()}` },
    { url: "/en/__next._full.txt",              revision: `${Date.now()}` },
    { url: "/en/__next._head.txt",              revision: `${Date.now()}` },
    { url: "/en/__next._index.txt",             revision: `${Date.now()}` },
    { url: "/en/__next._tree.txt",              revision: `${Date.now()}` },
    { url: "/auth/__next.auth.__PAGE__.txt",    revision: `${Date.now()}` },
    { url: "/auth/__next.auth.txt",             revision: `${Date.now()}` },
    { url: "/auth/__next._full.txt",            revision: `${Date.now()}` },
    { url: "/auth/__next._head.txt",            revision: `${Date.now()}` },
    { url: "/auth/__next._index.txt",           revision: `${Date.now()}` },
    { url: "/auth/__next._tree.txt",            revision: `${Date.now()}` },
  ],
  runtimeCaching: [
    {
      // Cache Next.js App Router RSC payload files fetched during client-side
      // navigation (e.g. /hr/tour/ebike-avantura/__next._full.txt).
      // These are not in the precache above (tour slugs change), so cache them
      // at runtime after the first online visit — then they work offline.
      urlPattern: /__next\.[^/]*\.txt/,
      handler: "NetworkFirst",
      options: {
        cacheName: "rsc-payloads",
        networkTimeoutSeconds: 3,
        expiration: { maxEntries: 200, maxAgeSeconds: 24 * 60 * 60 },
      },
    },
    {
      // Runtime-cache any app HTML page that isn't in the precache above
      // (e.g. tour detail pages like /hr/tour/ebike-avantura/).
      // NetworkFirst: try network, fall back to cache — ensures fresh content
      // while still working offline after the first online visit.
      urlPattern: /\/(hr|en)(\/.*)?\/$/,
      handler: "NetworkFirst",
      options: {
        cacheName: "html-pages",
        networkTimeoutSeconds: 3,
        expiration: { maxEntries: 30, maxAgeSeconds: 24 * 60 * 60 },
      },
    },
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

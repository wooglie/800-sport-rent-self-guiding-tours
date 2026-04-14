// The next-intl middleware (middleware.ts) redirects "/" to "/hr" before this
// component is ever reached in production. This server component exists as a
// silent fallback for RSC payload requests (e.g. /__next.__PAGE__.txt) so that
// those internal fetches don't trigger hook-related errors from a client
// component trying to call useRouter during static generation.
export default function RootPage() {
  return null;
}

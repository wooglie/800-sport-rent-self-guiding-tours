import type { Tour, Coordinates } from "@/types/tour";

function tileXY(lat: number, lng: number, zoom: number): { x: number; y: number } {
  const n = Math.pow(2, zoom);
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n);
  return { x, y };
}

function tileUrls(coords: Coordinates[], minZoom: number, maxZoom: number): string[] {
  if (coords.length === 0) return [];

  const lats = coords.map((c) => c.lat);
  const lngs = coords.map((c) => c.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const urls: string[] = [];
  for (let z = minZoom; z <= maxZoom; z++) {
    const topLeft = tileXY(maxLat, minLng, z);
    const bottomRight = tileXY(minLat, maxLng, z);
    for (let x = topLeft.x; x <= bottomRight.x; x++) {
      for (let y = topLeft.y; y <= bottomRight.y; y++) {
        urls.push(`https://tile.openstreetmap.org/${z}/${x}/${y}.png`);
      }
    }
  }
  return urls;
}

async function cacheUrls(urls: string[], cacheName: string): Promise<void> {
  const cache = await caches.open(cacheName);
  await Promise.all(
    urls.map(async (url) => {
      try {
        const cached = await cache.match(url);
        if (cached) return;
        const res = await fetch(url, { mode: "cors" });
        if (res.ok) await cache.put(url, res);
      } catch {
        console.warn(`[mapCache] Failed to cache: ${url}`);
      }
    })
  );
}

export async function cacheTourAssets(tours: Tour[]): Promise<void> {
  for (const tour of tours) {
    // Cache cover image, waypoint images, and all POI images
    const imageUrls = [
      tour.coverImage,
      ...tour.waypoints.flatMap((w) => w.images),
      ...tour.waypoints.flatMap((w) => (w.pois ?? []).flatMap((p) => p.images)),
    ].filter(Boolean);
    await cacheUrls(imageUrls, "tour-images");

    // Calculate tile coords: use route if available, else waypoint coordinates
    const coords: Coordinates[] =
      tour.route && tour.route.length > 0
        ? tour.route
        : tour.waypoints.map((w) => w.coordinates);

    let tiles = tileUrls(coords, 12, 16);
    // Cap at 1000 tiles per tour — reduce to z14 if exceeded
    if (tiles.length > 1000) {
      tiles = tileUrls(coords, 12, 14);
    }
    await cacheUrls(tiles, "osm-tiles");
  }
}

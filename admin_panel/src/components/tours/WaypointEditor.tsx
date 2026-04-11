"use client";

import { useState } from "react";
import type { Waypoint, Locale } from "@/types/tour";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { LocationPicker } from "./LocationPicker";

function generateId(hrName: string, index: number): string {
  const slug = hrName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return slug || `waypoint-${index + 1}`;
}

function emptyWaypoint(index: number): Waypoint {
  return {
    id: `waypoint-${index + 1}`,
    coordinates: { lat: 0, lng: 0 },
    triggerRadiusMeters: 50,
    name: { hr: "", en: "" },
    description: { hr: "", en: "" },
    images: [],
  };
}

type WaypointEditorProps = {
  waypoints: Waypoint[];
  onChange: (waypoints: Waypoint[]) => void;
  activeLocale: Locale;
};

export function WaypointEditor({
  waypoints,
  onChange,
  activeLocale,
}: WaypointEditorProps) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);

  function update(index: number, patch: Partial<Waypoint>) {
    const updated = waypoints.map((w, i) =>
      i === index ? { ...w, ...patch } : w,
    );
    onChange(updated);
  }

  function updateName(index: number, locale: Locale, value: string) {
    const wp = waypoints[index];
    const newName = { ...wp.name, [locale]: value };
    const newId = locale === "hr" ? generateId(value, index) : wp.id;
    update(index, { name: newName, id: newId });
  }

  function updateDesc(index: number, locale: Locale, value: string) {
    update(index, {
      description: { ...waypoints[index].description, [locale]: value },
    });
  }

  function addImageUrl(index: number) {
    update(index, { images: [...waypoints[index].images, ""] });
  }

  function updateImageUrl(wpIndex: number, imgIndex: number, value: string) {
    const urls = [...waypoints[wpIndex].images];
    urls[imgIndex] = value;
    update(wpIndex, { images: urls });
  }

  function removeImageUrl(wpIndex: number, imgIndex: number) {
    const urls = waypoints[wpIndex].images.filter((_, i) => i !== imgIndex);
    update(wpIndex, { images: urls });
  }

  function remove(index: number) {
    onChange(waypoints.filter((_, i) => i !== index));
  }

  function moveUp(index: number) {
    if (index === 0) return;
    const arr = [...waypoints];
    [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
    onChange(arr);
  }

  function moveDown(index: number) {
    if (index === waypoints.length - 1) return;
    const arr = [...waypoints];
    [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
    onChange(arr);
  }

  return (
    <div className="space-y-4">
      {waypoints.map((wp, index) => (
        <div
          key={index}
          className="rounded-xl border border-gray-200 bg-white p-4"
        >
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">
              Waypoint {index + 1}
              {wp.id && (
                <span className="ml-2 font-mono text-xs text-slate-400">
                  #{wp.id}
                </span>
              )}
            </span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => moveUp(index)}
                disabled={index === 0}
                className="rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 disabled:opacity-30"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => moveDown(index)}
                disabled={index === waypoints.length - 1}
                className="rounded px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 disabled:opacity-30"
              >
                ↓
              </button>
              <button
                type="button"
                onClick={() => remove(index)}
                className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50"
              >
                Ukloni
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-xs font-medium text-slate-600">
                  Koordinate
                </label>
                <button
                  type="button"
                  onClick={() => setPickerIndex(index)}
                  className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-slate-500 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
                >
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                  Karta
                </button>
              </div>
              <input
                type="number"
                step="any"
                placeholder="Lat"
                value={wp.coordinates.lat}
                onChange={(e) =>
                  update(index, {
                    coordinates: {
                      ...wp.coordinates,
                      lat: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">
                &nbsp;
              </label>
              <input
                type="number"
                step="any"
                placeholder="Lng"
                value={wp.coordinates.lng}
                onChange={(e) =>
                  update(index, {
                    coordinates: {
                      ...wp.coordinates,
                      lng: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">
                Radijus (m)
              </label>
              <input
                type="number"
                min={1}
                value={wp.triggerRadiusMeters}
                onChange={(e) =>
                  update(index, {
                    triggerRadiusMeters: parseInt(e.target.value) || 50,
                  })
                }
                className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-600">
                Naziv ({activeLocale.toUpperCase()})
              </label>
              <input
                type="text"
                value={wp.name[activeLocale]}
                onChange={(e) =>
                  updateName(index, activeLocale, e.target.value)
                }
                className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600">
                Opis ({activeLocale.toUpperCase()})
              </label>
              <textarea
                value={wp.description[activeLocale]}
                onChange={(e) =>
                  updateDesc(index, activeLocale, e.target.value)
                }
                rows={2}
                className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="mt-3">
            <p className="text-xs font-medium text-slate-600">Slike</p>
            <div className="mt-1 space-y-2">
              {wp.images.map((url, imgIdx) => (
                <div key={imgIdx} className="flex items-center gap-2">
                  {/* Thumbnail */}
                  <button
                    type="button"
                    onClick={() => url && setLightboxSrc(url)}
                    className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 transition-transform hover:scale-110 hover:shadow-md disabled:pointer-events-none"
                    disabled={!url}
                  >
                    {url ? (
                      <img
                        src={url}
                        alt=""
                        className="h-full w-full cursor-zoom-in object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display =
                            "none";
                        }}
                        onLoad={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display =
                            "";
                        }}
                      />
                    ) : null}
                  </button>
                  <input
                    type="text"
                    value={url}
                    placeholder="https://..."
                    onChange={(e) =>
                      updateImageUrl(index, imgIdx, e.target.value)
                    }
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => removeImageUrl(index, imgIdx)}
                    className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => addImageUrl(index)}
              className="mt-1 text-xs text-slate-500 underline hover:text-slate-700"
            >
              Dodaj sliku
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() =>
          onChange([...waypoints, emptyWaypoint(waypoints.length)])
        }
        className="w-full rounded-xl border-2 border-dashed border-slate-300 py-3 text-sm font-medium text-slate-500 hover:border-slate-400 hover:text-slate-700"
      >
        + Dodaj waypoint
      </button>

      {lightboxSrc && (
        <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}

      {pickerIndex !== null && (
        <LocationPicker
          initialLat={waypoints[pickerIndex]?.coordinates.lat}
          initialLng={waypoints[pickerIndex]?.coordinates.lng}
          onConfirm={(lat, lng) => {
            update(pickerIndex, { coordinates: { lat, lng } });
            setPickerIndex(null);
          }}
          onCancel={() => setPickerIndex(null)}
        />
      )}
    </div>
  );
}

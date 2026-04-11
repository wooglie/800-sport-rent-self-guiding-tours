"use client";

import { useState } from "react";
import type { POI, Locale } from "@/types/tour";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { ImageLightbox } from "@/components/ui/ImageLightbox";
import { LocationPicker } from "./LocationPicker";

function generatePoiId(hrTitle: string, index: number): string {
  const slug = hrTitle
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return slug || `poi-${index + 1}`;
}

function emptyPOI(index: number): POI {
  return {
    id: `poi-${index + 1}`,
    title: { hr: "", en: "" },
    description: { hr: "", en: "" },
    images: [],
    videoUrl: "",
  };
}

type POIEditorProps = {
  pois: POI[];
  onChange: (pois: POI[]) => void;
  activeLocale: Locale;
};

export function POIEditor({ pois, onChange, activeLocale }: POIEditorProps) {
  const [expandedIndexes, setExpandedIndexes] = useState<Set<number>>(
    new Set()
  );
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);

  function toggleExpand(index: number) {
    setExpandedIndexes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  function update(index: number, patch: Partial<POI>) {
    onChange(pois.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }

  function updateTitle(index: number, locale: Locale, value: string) {
    const poi = pois[index];
    const newTitle = { ...poi.title, [locale]: value };
    const newId = locale === "hr" ? generatePoiId(value, index) : poi.id;
    update(index, { title: newTitle, id: newId });
  }

  function updateDesc(index: number, locale: Locale, value: string) {
    update(index, {
      description: { ...pois[index].description, [locale]: value },
    });
  }

  function addImageUrl(index: number) {
    update(index, { images: [...pois[index].images, ""] });
  }

  function updateImageUrl(poiIdx: number, imgIdx: number, value: string) {
    const urls = [...pois[poiIdx].images];
    urls[imgIdx] = value;
    update(poiIdx, { images: urls });
  }

  function removeImageUrl(poiIdx: number, imgIdx: number) {
    update(poiIdx, {
      images: pois[poiIdx].images.filter((_, i) => i !== imgIdx),
    });
  }

  function remove(index: number) {
    setExpandedIndexes((prev) => {
      const next = new Set<number>();
      prev.forEach((i) => {
        if (i < index) next.add(i);
        else if (i > index) next.add(i - 1);
      });
      return next;
    });
    onChange(pois.filter((_, i) => i !== index));
  }

  function moveUp(index: number) {
    if (index === 0) return;
    const arr = [...pois];
    [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
    onChange(arr);
  }

  function moveDown(index: number) {
    if (index === pois.length - 1) return;
    const arr = [...pois];
    [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
    onChange(arr);
  }

  return (
    <div className="space-y-2">
      {pois.map((poi, index) => {
        const isExpanded = expandedIndexes.has(index);
        const titlePreview =
          poi.title[activeLocale] || poi.title[activeLocale === "hr" ? "en" : "hr"] || `POI ${index + 1}`;

        return (
          <div
            key={index}
            className="rounded-lg border border-slate-200 bg-slate-50"
          >
            {/* POI header */}
            <div className="flex items-center gap-2 px-3 py-2">
              <button
                type="button"
                onClick={() => toggleExpand(index)}
                className="flex flex-1 items-center gap-2 text-left"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">
                  {index + 1}
                </span>
                <span className="flex-1 truncate text-xs font-medium text-slate-700">
                  {titlePreview}
                </span>
                <svg
                  className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <div className="flex shrink-0 gap-0.5">
                <button
                  type="button"
                  onClick={() => moveUp(index)}
                  disabled={index === 0}
                  className="rounded px-1.5 py-1 text-xs text-slate-400 hover:bg-slate-200 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveDown(index)}
                  disabled={index === pois.length - 1}
                  className="rounded px-1.5 py-1 text-xs text-slate-400 hover:bg-slate-200 disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  className="rounded px-1.5 py-1 text-xs text-red-400 hover:bg-red-50 hover:text-red-600"
                >
                  ×
                </button>
              </div>
            </div>

            {/* Expanded content */}
            {isExpanded && (
              <div className="space-y-3 border-t border-slate-200 bg-white px-3 py-3">
                {/* Title */}
                <div>
                  <label className="block text-xs font-medium text-slate-600">
                    Naziv ({activeLocale.toUpperCase()})
                  </label>
                  <input
                    type="text"
                    value={poi.title[activeLocale]}
                    onChange={(e) => updateTitle(index, activeLocale, e.target.value)}
                    placeholder={activeLocale === "hr" ? "Naziv POI-a" : "POI title"}
                    className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                {/* Rich description */}
                <div>
                  <label className="block text-xs font-medium text-slate-600">
                    Opis ({activeLocale.toUpperCase()}) — Markdown
                  </label>
                  <div className="mt-1">
                    <RichTextEditor
                      value={poi.description[activeLocale]}
                      onChange={(v) => updateDesc(index, activeLocale, v)}
                      placeholder={activeLocale === "hr" ? "Opis u Markdown formatu..." : "Description in Markdown..."}
                      minHeight={160}
                    />
                  </div>
                </div>

                {/* Images */}
                <div>
                  <p className="text-xs font-medium text-slate-600">Slike</p>
                  <div className="mt-1 space-y-2">
                    {poi.images.map((url, imgIdx) => (
                      <div key={imgIdx} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => url && setLightboxSrc(url)}
                          disabled={!url}
                          className="h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 transition-transform hover:scale-110 hover:shadow-md disabled:pointer-events-none"
                        >
                          {url && (
                            <img
                              src={url}
                              alt=""
                              className="h-full w-full cursor-zoom-in object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = "none";
                              }}
                              onLoad={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = "";
                              }}
                            />
                          )}
                        </button>
                        <input
                          type="text"
                          value={url}
                          placeholder="https://..."
                          onChange={(e) => updateImageUrl(index, imgIdx, e.target.value)}
                          className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                        <button
                          type="button"
                          onClick={() => removeImageUrl(index, imgIdx)}
                          className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
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

                {/* Video URL */}
                <div>
                  <label className="block text-xs font-medium text-slate-600">
                    Video URL (YouTube / Vimeo, opcionalno)
                  </label>
                  <input
                    type="text"
                    value={poi.videoUrl ?? ""}
                    onChange={(e) => update(index, { videoUrl: e.target.value })}
                    placeholder="https://youtube.com/..."
                    className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                {/* Coordinates (optional) */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-slate-600">
                      Lokacija na karti (opcionalno)
                    </label>
                    <button
                      type="button"
                      onClick={() => setPickerIndex(index)}
                      className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium text-slate-500 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Karta
                    </button>
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      step="any"
                      placeholder="Lat"
                      value={poi.coordinates?.lat ?? ""}
                      onChange={(e) =>
                        update(index, {
                          coordinates: {
                            lat: parseFloat(e.target.value) || 0,
                            lng: poi.coordinates?.lng ?? 0,
                          },
                        })
                      }
                      className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                    <input
                      type="number"
                      step="any"
                      placeholder="Lng"
                      value={poi.coordinates?.lng ?? ""}
                      onChange={(e) =>
                        update(index, {
                          coordinates: {
                            lat: poi.coordinates?.lat ?? 0,
                            lng: parseFloat(e.target.value) || 0,
                          },
                        })
                      }
                      className="block w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={() => {
          const newIndex = pois.length;
          onChange([...pois, emptyPOI(newIndex)]);
          setExpandedIndexes((prev) => new Set([...prev, newIndex]));
        }}
        className="w-full rounded-lg border border-dashed border-slate-300 py-2 text-xs font-medium text-slate-500 hover:border-slate-400 hover:text-slate-700"
      >
        + Dodaj POI
      </button>

      {lightboxSrc && (
        <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}

      {pickerIndex !== null && (
        <LocationPicker
          initialLat={pois[pickerIndex]?.coordinates?.lat}
          initialLng={pois[pickerIndex]?.coordinates?.lng}
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

"use client";

import { useState } from "react";
import type { Tour, Locale, Waypoint, Coordinates } from "@/types/tour";
import type { CreateTourRequest } from "@/types/api";
import { WaypointEditor } from "./WaypointEditor";
import { RouteMap } from "./RouteMap";
import { LocationPicker } from "./LocationPicker";
import { ImageLightbox } from "@/components/ui/ImageLightbox";

type TourFormProps = {
  initialValues?: Partial<Tour>;
  onSubmit: (tour: CreateTourRequest) => void;
  isLoading: boolean;
  isEditing?: boolean;
  activeLocale: Locale;
};

function parseRoute(raw: string): Coordinates[] | null {
  try {
    const parsed = JSON.parse(raw);
    if (
      Array.isArray(parsed) &&
      parsed.length >= 2 &&
      parsed.every(
        (p) => typeof p.lat === "number" && typeof p.lng === "number"
      )
    ) {
      return parsed as Coordinates[];
    }
    return null;
  } catch {
    return null;
  }
}

export function TourForm({
  initialValues,
  onSubmit,
  isLoading,
  isEditing = false,
  activeLocale,
}: TourFormProps) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [startPickerOpen, setStartPickerOpen] = useState(false);

  const [id, setId] = useState(initialValues?.id ?? "");
  const [nameHr, setNameHr] = useState(initialValues?.name?.hr ?? "");
  const [nameEn, setNameEn] = useState(initialValues?.name?.en ?? "");
  const [descHr, setDescHr] = useState(initialValues?.description?.hr ?? "");
  const [descEn, setDescEn] = useState(initialValues?.description?.en ?? "");
  const [distance, setDistance] = useState(initialValues?.distance ?? "");
  const [duration, setDuration] = useState(initialValues?.duration ?? "");
  const [difficulty, setDifficulty] = useState<Tour["difficulty"]>(
    initialValues?.difficulty ?? "easy"
  );
  const [coverImage, setCoverImageUrl] = useState(
    initialValues?.coverImage ?? ""
  );
  const [startLat, setStartLat] = useState(
    initialValues?.startLocation?.lat ?? 0
  );
  const [startLng, setStartLng] = useState(
    initialValues?.startLocation?.lng ?? 0
  );
  const [routeRaw, setRouteRaw] = useState(
    initialValues?.route ? JSON.stringify(initialValues.route, null, 2) : ""
  );
  const [waypoints, setWaypoints] = useState<Waypoint[]>(
    initialValues?.waypoints ?? []
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  const parsedRoute = parseRoute(routeRaw);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);

    if (!id.trim()) {
      setValidationError("ID ture je obavezan.");
      return;
    }
    if (!nameHr.trim() || !nameEn.trim()) {
      setValidationError("Naziv na HR i EN je obavezan.");
      return;
    }
    if (!parsedRoute) {
      setValidationError(
        "Ruta mora biti validan JSON niz s najmanje 2 koordinate ({lat, lng})."
      );
      return;
    }
    if (waypoints.length === 0) {
      setValidationError("Dodaj najmanje jedan waypoint.");
      return;
    }

    const tour: CreateTourRequest = {
      id: id.trim(),
      name: { hr: nameHr, en: nameEn },
      description: { hr: descHr, en: descEn },
      distance,
      duration,
      difficulty,
      coverImage,
      startLocation: { lat: startLat, lng: startLng },
      route: parsedRoute,
      waypoints,
    };

    onSubmit(tour);
  }

  const inputClass =
    "mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";
  const labelClass = "block text-sm font-medium text-slate-700";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ID */}
      <div>
        <label htmlFor="tour-id" className={labelClass}>
          ID ture (slug)
        </label>
        <input
          id="tour-id"
          type="text"
          required
          disabled={isEditing}
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="npr. velebit-north"
          className={`${inputClass} ${isEditing ? "bg-slate-50 text-slate-400 cursor-not-allowed" : ""}`}
        />
      </div>

      {/* Name */}
      {activeLocale === "hr" ? (
        <div>
          <label htmlFor="name-hr" className={labelClass}>
            Naziv (HR)
          </label>
          <input
            id="name-hr"
            type="text"
            required
            value={nameHr}
            onChange={(e) => setNameHr(e.target.value)}
            className={inputClass}
          />
        </div>
      ) : (
        <div>
          <label htmlFor="name-en" className={labelClass}>
            Name (EN)
          </label>
          <input
            id="name-en"
            type="text"
            required
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            className={inputClass}
          />
        </div>
      )}

      {/* Description */}
      {activeLocale === "hr" ? (
        <div>
          <label htmlFor="desc-hr" className={labelClass}>
            Opis (HR)
          </label>
          <textarea
            id="desc-hr"
            rows={4}
            value={descHr}
            onChange={(e) => setDescHr(e.target.value)}
            className={inputClass}
          />
        </div>
      ) : (
        <div>
          <label htmlFor="desc-en" className={labelClass}>
            Description (EN)
          </label>
          <textarea
            id="desc-en"
            rows={4}
            value={descEn}
            onChange={(e) => setDescEn(e.target.value)}
            className={inputClass}
          />
        </div>
      )}

      {/* Distance + Duration + Difficulty */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label htmlFor="distance" className={labelClass}>
            Udaljenost
          </label>
          <input
            id="distance"
            type="text"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            placeholder="npr. 20 km"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="duration" className={labelClass}>
            Trajanje
          </label>
          <input
            id="duration"
            type="text"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="npr. ~4h"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="difficulty" className={labelClass}>
            Težina
          </label>
          <select
            id="difficulty"
            value={difficulty}
            onChange={(e) =>
              setDifficulty(e.target.value as Tour["difficulty"])
            }
            className={inputClass}
          >
            <option value="easy">Lagana</option>
            <option value="moderate">Srednja</option>
            <option value="hard">Teška</option>
          </select>
        </div>
      </div>

      {/* Cover image */}
      <div>
        <label htmlFor="coverImage" className={labelClass}>
          Naslovna slika (URL)
        </label>
        <input
          id="coverImage"
          type="text"
          value={coverImage}
          onChange={(e) => setCoverImageUrl(e.target.value)}
          placeholder="https://..."
          className={inputClass}
        />
        {coverImage && (
          <button
            type="button"
            onClick={() => setLightboxSrc(coverImage)}
            className="mt-2 block w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 transition-opacity hover:opacity-90"
          >
            <img
              src={coverImage}
              alt="Naslovna slika"
              className="max-h-48 w-full cursor-zoom-in object-cover"
              onError={(e) => {
                (e.currentTarget.parentElement as HTMLElement).style.display = "none";
              }}
              onLoad={(e) => {
                (e.currentTarget.parentElement as HTMLElement).style.display = "";
              }}
            />
          </button>
        )}
      </div>

      {/* Start location */}
      <div>
        <div className="flex items-center justify-between">
          <p className={labelClass}>Početna lokacija</p>
          <button
            type="button"
            onClick={() => setStartPickerOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Odaberi na karti
          </button>
        </div>
        <div className="mt-2 grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="start-lat" className="text-xs text-slate-500">
              Lat
            </label>
            <input
              id="start-lat"
              type="number"
              step="any"
              value={startLat}
              onChange={(e) => setStartLat(parseFloat(e.target.value) || 0)}
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="start-lng" className="text-xs text-slate-500">
              Lng
            </label>
            <input
              id="start-lng"
              type="number"
              step="any"
              value={startLng}
              onChange={(e) => setStartLng(parseFloat(e.target.value) || 0)}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {startPickerOpen && (
        <LocationPicker
          initialLat={startLat}
          initialLng={startLng}
          onConfirm={(lat, lng) => {
            setStartLat(lat);
            setStartLng(lng);
            setStartPickerOpen(false);
          }}
          onCancel={() => setStartPickerOpen(false)}
        />
      )}

      {/* Route */}
      <div>
        <label htmlFor="route" className={labelClass}>
          Ruta (JSON niz koordinata)
        </label>
        <textarea
          id="route"
          rows={6}
          value={routeRaw}
          onChange={(e) => setRouteRaw(e.target.value)}
          placeholder='[{"lat": 45.123, "lng": 16.456}, ...]'
          className={`${inputClass} font-mono text-xs`}
        />
        <p className={`mt-1 text-xs ${parsedRoute ? "text-emerald-600" : routeRaw.trim() ? "text-rose-500" : "text-slate-400"}`}>
          {parsedRoute
            ? `${parsedRoute.length} točaka`
            : routeRaw.trim()
            ? "Neispravan JSON"
            : "Zalijepite JSON niz koordinata"}
        </p>
      </div>

      {/* Map preview */}
      {(parsedRoute || waypoints.length > 0 || startLat !== 0) && (
        <div>
          <p className={`${labelClass} mb-2`}>Pregled na karti</p>
          <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm">
            <RouteMap
              route={parsedRoute ?? []}
              waypoints={waypoints}
              startLocation={{ lat: startLat, lng: startLng }}
              activeLocale={activeLocale}
            />
          </div>
        </div>
      )}

      {/* Waypoints */}
      <div>
        <p className={`${labelClass} mb-3`}>Waypointovi</p>
        <WaypointEditor
          waypoints={waypoints}
          onChange={setWaypoints}
          activeLocale={activeLocale}
        />
      </div>

      {validationError && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
          {validationError}
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50"
      >
        {isLoading && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        )}
        {isEditing ? "Spremi promjene" : "Kreiraj turu"}
      </button>

      {lightboxSrc && (
        <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />
      )}
    </form>
  );
}

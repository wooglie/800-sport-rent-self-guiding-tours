"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Reuse the same icon fix
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type Pos = { lat: number; lng: number };

type LocationPickerInnerProps = {
  initialLat?: number;
  initialLng?: number;
  onConfirm: (lat: number, lng: number) => void;
  onCancel: () => void;
};

function ClickHandler({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function RecenterOnInit({ pos }: { pos: Pos | null }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.setView([pos.lat, pos.lng], map.getZoom());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

export function LocationPickerInner({
  initialLat = 0,
  initialLng = 0,
  onConfirm,
  onCancel,
}: LocationPickerInnerProps) {
  const hasInitial = initialLat !== 0 || initialLng !== 0;
  const [position, setPosition] = useState<Pos | null>(
    hasInitial ? { lat: initialLat, lng: initialLng } : null
  );

  const center: [number, number] = hasInitial
    ? [initialLat, initialLng]
    : [44.4403, 15.0576]; // Pag fallback

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Escape") onCancel();
  }

  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      onKeyDown={handleKey}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/10">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Odaberi lokaciju</h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Klikni na kartu za postavljanje markera, ili ga povuci na željenu lokaciju.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="ml-4 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Map */}
        <div style={{ height: 420 }} className="relative">
          <MapContainer
            center={center}
            zoom={hasInitial ? 15 : 13}
            scrollWheelZoom
            style={{ height: "100%", width: "100%" }}
            className="z-0"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClickHandler onPick={(lat, lng) => setPosition({ lat, lng })} />
            {position && (
              <Marker
                position={[position.lat, position.lng]}
                draggable
                autoPan
                eventHandlers={{
                  dragend(e) {
                    const ll = (e.target as L.Marker).getLatLng();
                    setPosition({ lat: ll.lat, lng: ll.lng });
                  },
                }}
              />
            )}
            <RecenterOnInit pos={hasInitial ? { lat: initialLat, lng: initialLng } : null} />
          </MapContainer>

          {/* Crosshair hint when no marker yet */}
          {!position && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="rounded-lg bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-600 shadow">
                Klikni za postavljanje markera
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-5 py-3">
          {position ? (
            <p className="font-mono text-xs text-slate-500">
              <span className="text-slate-700">{position.lat.toFixed(6)}</span>
              <span className="mx-1.5 text-slate-300">,</span>
              <span className="text-slate-700">{position.lng.toFixed(6)}</span>
            </p>
          ) : (
            <p className="text-xs text-slate-400">Nije odabrana lokacija</p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Odustani
            </button>
            <button
              type="button"
              disabled={!position}
              onClick={() => position && onConfirm(position.lat, position.lng)}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-40"
            >
              Potvrdi lokaciju
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

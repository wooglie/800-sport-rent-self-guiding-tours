"use client";

import { useState } from "react";

type TokenFormProps = {
  onSubmit: (label: string, durationHours: number) => void;
  isLoading: boolean;
};

const DURATION_PRESETS = [6, 24, 48] as const;

const inputClass =
  "mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";

export function TokenForm({ onSubmit, isLoading }: TokenFormProps) {
  const [label, setLabel] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<number | "custom">(24);
  const [customHours, setCustomHours] = useState(1);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const hours = selectedPreset === "custom" ? customHours : selectedPreset;
    onSubmit(label, hours);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-6">
      <div>
        <label htmlFor="label" className="block text-sm font-medium text-slate-700">
          Naziv tokena
        </label>
        <input
          id="label"
          type="text"
          required
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="npr. Obitelj Horvat"
          className={inputClass}
        />
      </div>

      <div>
        <p className="block text-sm font-medium text-slate-700">Trajanje</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {DURATION_PRESETS.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => setSelectedPreset(h)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                selectedPreset === h
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-indigo-50 hover:text-indigo-700"
              }`}
            >
              {h}h
            </button>
          ))}
          <button
            type="button"
            onClick={() => setSelectedPreset("custom")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              selectedPreset === "custom"
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-indigo-50 hover:text-indigo-700"
            }`}
          >
            Prilagođeno
          </button>
        </div>

        {selectedPreset === "custom" && (
          <div className="mt-3">
            <label htmlFor="customHours" className="block text-sm text-slate-600">
              Broj sati
            </label>
            <input
              id="customHours"
              type="number"
              min={1}
              max={8760}
              value={customHours}
              onChange={(e) => setCustomHours(Number(e.target.value))}
              className="mt-1 w-32 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50"
      >
        {isLoading && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        )}
        Generiraj token
      </button>
    </form>
  );
}

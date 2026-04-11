"use client";

import { useState } from "react";
import Link from "next/link";
import type { Tour } from "@/types/tour";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const DIFFICULTY_LABELS = {
  easy: "Lagana",
  moderate: "Srednja",
  hard: "Teška",
};

type TourTableProps = {
  tours: Tour[];
  onDelete: (id: string) => void;
};

export function TourTable({ tours, onDelete }: TourTableProps) {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  if (tours.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        Nema tura. Dodaj prvu!
      </p>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-slate-50 text-xs font-medium uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3 text-left">Naziv (HR)</th>
              <th className="px-4 py-3 text-left">Udaljenost</th>
              <th className="px-4 py-3 text-left">Trajanje</th>
              <th className="px-4 py-3 text-left">Težina</th>
              <th className="px-4 py-3 text-left">Waypointovi</th>
              <th className="px-4 py-3 text-left">Akcija</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {tours.map((tour) => (
              <tr key={tour.id} className="hover:bg-slate-50/70">
                <td className="px-4 py-3 font-medium">{tour.name.hr}</td>
                <td className="px-4 py-3 text-slate-500">{tour.distance}</td>
                <td className="px-4 py-3 text-slate-500">{tour.duration}</td>
                <td className="px-4 py-3 text-slate-500">
                  {DIFFICULTY_LABELS[tour.difficulty]}
                </td>
                <td className="px-4 py-3 text-slate-500">
                  {tour.waypoints.length}
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link
                      href={`/tours/edit?id=${tour.id}`}
                      className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      Uredi
                    </Link>
                    <button
                      onClick={() => setConfirmId(tour.id)}
                      className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-rose-50 hover:text-rose-700"
                    >
                      Obriši
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {confirmId && (
        <ConfirmDialog
          message="Jesi li siguran da želiš obrisati ovu turu?"
          onConfirm={() => {
            onDelete(confirmId);
            setConfirmId(null);
          }}
          onCancel={() => setConfirmId(null)}
        />
      )}
    </>
  );
}

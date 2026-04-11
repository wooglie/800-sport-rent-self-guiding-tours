"use client";

import { useState } from "react";
import type { AccessToken } from "@/types/api";
import { TokenQRModal } from "./TokenQRModal";

const TOUR_APP_URL =
  process.env.NEXT_PUBLIC_TOUR_APP_URL ?? "https://app.sport-rent.800.hr";

const STATUS_LABELS: Record<AccessToken["status"], string> = {
  active: "Aktivan",
  expired: "Istekao",
  not_scanned: "Nije skenirano",
};

const STATUS_CLASSES: Record<AccessToken["status"], string> = {
  active: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  expired: "bg-slate-100 text-slate-500 ring-1 ring-slate-200",
  not_scanned: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
};

type TokenTableProps = {
  tokens: AccessToken[];
};

export function TokenTable({ tokens }: TokenTableProps) {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [qrToken, setQrToken] = useState<AccessToken | null>(null);

  async function handleCopy(code: string) {
    await navigator.clipboard.writeText(`${TOUR_APP_URL}/auth?token=${code}`);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  if (tokens.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white py-12 text-center shadow-sm">
        <p className="text-sm text-slate-500">Nema tokena. Generiraj prvi!</p>
      </div>
    );
  }

  return (
    <>
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-slate-100 text-sm">
        <thead>
          <tr className="bg-slate-50">
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Kod</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Naziv</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Trajanje</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Kreiran</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Prvo skeniranje</th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Akcija</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {tokens.map((token) => (
            <tr key={token.code} className="transition-colors hover:bg-slate-50/70">
              <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-700">{token.code}</td>
              <td className="px-4 py-3 font-medium text-slate-800">{token.label}</td>
              <td className="px-4 py-3 text-slate-500">{token.durationHours}h</td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASSES[token.status]}`}
                >
                  {STATUS_LABELS[token.status]}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-500">
                {new Date(token.createdAt).toLocaleDateString("hr")}
              </td>
              <td className="px-4 py-3 text-slate-500">
                {token.firstScannedAt
                  ? new Date(token.firstScannedAt).toLocaleDateString("hr")
                  : "—"}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQrToken(token)}
                    className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 transition-colors hover:bg-indigo-100"
                  >
                    QR
                  </button>
                  <button
                    onClick={() => handleCopy(token.code)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                      copiedCode === token.code
                        ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                        : "bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-700"
                    }`}
                  >
                    {copiedCode === token.code ? "Kopirano!" : "Kopiraj link"}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    {qrToken && (
      <TokenQRModal token={qrToken} onClose={() => setQrToken(null)} />
    )}
    </>
  );
}

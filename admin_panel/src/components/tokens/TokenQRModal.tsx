"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { CopyLinkButton } from "./CopyLinkButton";
import type { AccessToken } from "@/types/api";

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

type TokenQRModalProps = {
  token: AccessToken;
  onClose: () => void;
};

export function TokenQRModal({ token, onClose }: TokenQRModalProps) {
  const qrContent = `${TOUR_APP_URL}/auth?token=${token.code}`;
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    QRCode.toDataURL(qrContent, { width: 280, margin: 2 })
      .then(setDataUrl)
      .catch(console.error);
  }, [qrContent]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  function handleDownload() {
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `qr-${token.code}.png`;
    link.click();
  }

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === backdropRef.current && onClose()}
    >
      <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{token.label}</h3>
            <p className="mt-0.5 font-mono text-xs text-slate-400">{token.code}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* QR */}
        <div className="flex justify-center bg-slate-50 px-8 py-6">
          {dataUrl ? (
            <img
              src={dataUrl}
              alt={`QR kod za token ${token.code}`}
              className="rounded-xl shadow-sm"
            />
          ) : (
            <div className="h-[280px] w-[280px] animate-pulse rounded-xl bg-slate-200" />
          )}
        </div>

        {/* Details + actions */}
        <div className="space-y-3 px-5 py-4">
          {/* Token meta */}
          <dl className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between px-3 py-2">
              <dt className="text-xs font-medium text-slate-500">Status</dt>
              <dd>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[token.status]}`}>
                  {STATUS_LABELS[token.status]}
                </span>
              </dd>
            </div>
            <div className="flex items-center justify-between px-3 py-2">
              <dt className="text-xs font-medium text-slate-500">Istječe</dt>
              <dd className="text-xs font-semibold text-slate-800">
                {new Date(token.expiresAt).toLocaleString("hr")}
              </dd>
            </div>
            <div className="flex items-center justify-between px-3 py-2">
              <dt className="text-xs font-medium text-slate-500">Trajanje</dt>
              <dd className="text-xs font-semibold text-slate-800">{token.durationHours}h</dd>
            </div>
          </dl>

          {/* Copy link */}
          <CopyLinkButton url={qrContent} />

          {/* Download */}
          <button
            onClick={handleDownload}
            disabled={!dataUrl}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Preuzmi QR kao PNG
          </button>
        </div>
      </div>
    </div>
  );
}

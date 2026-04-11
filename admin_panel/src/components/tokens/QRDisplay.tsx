"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { CopyLinkButton } from "./CopyLinkButton";

type QRDisplayProps = {
  qrContent: string;
  code: string;
  expiresAt: string;
  label: string;
  onReset: () => void;
};

export function QRDisplay({
  qrContent,
  code,
  expiresAt,
  label,
  onReset,
}: QRDisplayProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(qrContent, { width: 300, margin: 2 })
      .then(setDataUrl)
      .catch(console.error);
  }, [qrContent]);

  function handleDownload() {
    if (!dataUrl) return;
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `qr-${code}.png`;
    link.click();
  }

  return (
    <div className="flex flex-col items-center gap-6">
      {/* QR Code */}
      <div className="rounded-2xl bg-white p-5 shadow-md ring-1 ring-slate-200">
        {dataUrl ? (
          <img
            src={dataUrl}
            alt={`QR kod za token ${code}`}
            className="rounded-lg"
          />
        ) : (
          <div className="h-[300px] w-[300px] animate-pulse rounded-lg bg-slate-100" />
        )}
      </div>

      {/* Actions */}
      <div className="w-full max-w-sm space-y-3">
        <CopyLinkButton url={qrContent} />

        <button
          onClick={handleDownload}
          disabled={!dataUrl}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Preuzmi QR
        </button>
      </div>

      {/* Token details */}
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <dl className="divide-y divide-slate-100">
          <div className="flex justify-between py-2">
            <dt className="text-xs font-medium text-slate-500">Kod</dt>
            <dd className="font-mono text-xs font-semibold text-slate-800">{code}</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-xs font-medium text-slate-500">Naziv</dt>
            <dd className="text-xs font-semibold text-slate-800">{label}</dd>
          </div>
          <div className="flex justify-between py-2">
            <dt className="text-xs font-medium text-slate-500">Istječe</dt>
            <dd className="text-xs font-semibold text-slate-800">
              {new Date(expiresAt).toLocaleString("hr")}
            </dd>
          </div>
        </dl>
      </div>

      <button
        onClick={onReset}
        className="rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
      >
        Generiraj novi token
      </button>
    </div>
  );
}

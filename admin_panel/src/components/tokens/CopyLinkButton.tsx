"use client";

import { useState } from "react";

type CopyLinkButtonProps = {
  url: string;
};

export function CopyLinkButton({ url }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <span className="flex-1 truncate font-mono text-xs text-slate-500">{url}</span>
      <button
        onClick={handleCopy}
        className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
          copied
            ? "bg-emerald-100 text-emerald-700"
            : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-indigo-50 hover:text-indigo-700"
        }`}
      >
        {copied ? "Kopirano!" : "Kopiraj"}
      </button>
    </div>
  );
}

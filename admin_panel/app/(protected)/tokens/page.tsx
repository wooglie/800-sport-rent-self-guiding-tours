"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listTokens } from "@/lib/api";
import { TokenTable } from "@/components/tokens/TokenTable";
import { Skeleton } from "@/components/ui/Skeleton";
import type { AccessToken } from "@/types/api";

export default function TokensPage() {
  const [tokens, setTokens] = useState<AccessToken[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listTokens()
      .then(setTokens)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Greška pri učitavanju")
      );
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Tokeni</h1>
        <Link
          href="/tokens/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Generiraj novi token
        </Link>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      {tokens ? (
        <TokenTable tokens={tokens} />
      ) : (
        <Skeleton className="h-64 w-full" />
      )}
    </div>
  );
}

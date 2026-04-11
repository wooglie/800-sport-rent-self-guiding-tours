"use client";

import { useState } from "react";
import { createToken } from "@/lib/api";
import { TokenForm } from "@/components/tokens/TokenForm";
import { QRDisplay } from "@/components/tokens/QRDisplay";
import type { CreateTokenResponse } from "@/types/api";

type SuccessState = CreateTokenResponse & { label: string };

export default function NewTokenPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessState | null>(null);

  async function handleSubmit(label: string, durationHours: number) {
    setError(null);
    setIsLoading(true);
    try {
      const result = await createToken(label, durationHours);
      setSuccess({ ...result, label });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Greška pri generiranju tokena"
      );
    } finally {
      setIsLoading(false);
    }
  }

  function handleReset() {
    setSuccess(null);
    setError(null);
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">
        {success ? "Token generiran" : "Novi token"}
      </h1>

      {error && (
        <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      {success ? (
        <QRDisplay
          qrContent={success.qrContent}
          code={success.code}
          expiresAt={success.expiresAt}
          label={success.label}
          onReset={handleReset}
        />
      ) : (
        <TokenForm onSubmit={handleSubmit} isLoading={isLoading} />
      )}
    </div>
  );
}

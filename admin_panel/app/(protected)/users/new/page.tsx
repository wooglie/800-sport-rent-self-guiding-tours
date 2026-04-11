"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUser } from "@/lib/api";
import { UserForm } from "@/components/users/UserForm";

export default function NewUserPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(email: string, password: string) {
    setError(null);
    setIsLoading(true);
    try {
      await createUser(email, password);
      router.push("/users");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Greška pri kreiranju korisnika"
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Novi korisnik</h1>

      {error && (
        <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      <UserForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
}

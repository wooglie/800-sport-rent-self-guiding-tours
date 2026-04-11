"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listUsers } from "@/lib/api";
import { UserTable } from "@/components/users/UserTable";
import { Skeleton } from "@/components/ui/Skeleton";
import type { AdminUser } from "@/types/api";

export default function UsersPage() {
  const [users, setUsers] = useState<AdminUser[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listUsers()
      .then(setUsers)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Greška pri učitavanju")
      );
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Korisnici</h1>
        <Link
          href="/users/new"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Novi korisnik
        </Link>
      </div>

      {error && (
        <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </p>
      )}

      {users ? (
        <UserTable users={users} />
      ) : (
        <Skeleton className="h-64 w-full" />
      )}
    </div>
  );
}

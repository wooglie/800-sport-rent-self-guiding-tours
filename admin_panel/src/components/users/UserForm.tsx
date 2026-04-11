"use client";

import { useState } from "react";

type UserFormProps = {
  onSubmit: (email: string, password: string) => void;
  isLoading: boolean;
};

const inputClass =
  "mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20";

export function UserForm({ onSubmit, isLoading }: UserFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);

    if (password.length < 8) {
      setValidationError("Lozinka mora imati najmanje 8 znakova.");
      return;
    }
    if (password !== confirm) {
      setValidationError("Lozinke se ne podudaraju.");
      return;
    }

    onSubmit(email, password);
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-sm space-y-5">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-700">
          Email adresa
        </label>
        <input
          id="email"
          type="email"
          required
          placeholder="korisnik@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-slate-700">
          Lozinka
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          placeholder="Najmanje 8 znakova"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="confirm" className="block text-sm font-medium text-slate-700">
          Potvrdi lozinku
        </label>
        <input
          id="confirm"
          type="password"
          required
          placeholder="Ponovi lozinku"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className={inputClass}
        />
      </div>

      {validationError && (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
          {validationError}
        </p>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50"
      >
        {isLoading && (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
        )}
        Kreiraj korisnika
      </button>
    </form>
  );
}

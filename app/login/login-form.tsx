"use client";

import { useActionState } from "react";
import { login } from "./actions";

export default function LoginForm() {
  const [error, formAction, isPending] = useActionState(login, undefined);

  return (
    <form
      action={formAction}
      className="w-full flex flex-col gap-4"
      style={{
        maxWidth: 360,
        background: "var(--surface-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-md)",
        padding: 28,
      }}
    >
      <div className="flex flex-col gap-1">
        <h1
          className="m-0"
          style={{ fontFamily: "var(--font-display)", fontSize: 26, color: "var(--text-strong)" }}
        >
          Admin
        </h1>
        <p className="m-0" style={{ fontSize: 13, color: "var(--ink-500)" }}>
          Hub de estudos · acesso restrito
        </p>
      </div>

      <label className="flex flex-col gap-1">
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-600)" }}>Email</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          className="w-full"
          style={{
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-sm)",
            padding: "10px 12px",
            fontSize: 15,
          }}
        />
      </label>

      <label className="flex flex-col gap-1">
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-600)" }}>Senha</span>
        <input
          type="password"
          name="password"
          required
          autoComplete="current-password"
          className="w-full"
          style={{
            border: "1px solid var(--border-default)",
            borderRadius: "var(--radius-sm)",
            padding: "10px 12px",
            fontSize: 15,
          }}
        />
      </label>

      {error && <p className="m-0" style={{ fontSize: 13, color: "var(--negative-600)" }}>{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="cursor-pointer border-0"
        style={{
          background: "var(--brand)",
          color: "var(--on-brand)",
          borderRadius: "var(--radius-sm)",
          padding: "11px 0",
          fontSize: 15,
          fontWeight: 600,
          opacity: isPending ? 0.7 : 1,
        }}
      >
        {isPending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}

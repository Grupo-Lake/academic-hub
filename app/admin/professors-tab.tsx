"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Professor } from "@/lib/professors";
import { addProfessor, updateProfessor, deleteProfessor } from "./actions";
import { inputStyle } from "./admin-ui";

function ProfessorRow({ professor, onRemoved }: { professor: Professor; onRemoved: () => void }) {
  const router = useRouter();
  const [name, setName] = useState(professor.name);
  const [email, setEmail] = useState(professor.email ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    try {
      await updateProfessor(professor.id, { name, email: email || null });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Excluir "${professor.name}"?`)) return;
    await deleteProfessor(professor.id);
    onRemoved();
  }

  return (
    <div
      className="flex flex-col sm:flex-row gap-2"
      style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-xs)", padding: 8 }}
    >
      <input style={{ ...inputStyle, flex: 1 }} value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" />
      <input
        style={{ ...inputStyle, flex: 1 }}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="E-mail (opcional)"
      />
      <div className="flex gap-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="cursor-pointer border-0"
          style={{ background: "var(--brand)", color: "var(--on-brand)", borderRadius: "var(--radius-sm)", padding: "0 14px", fontSize: 13, fontWeight: 600 }}
        >
          {saving ? "Salvando…" : "Salvar"}
        </button>
        <button
          onClick={handleDelete}
          className="cursor-pointer border-0"
          style={{ background: "var(--negative-100)", color: "var(--negative-600)", borderRadius: "var(--radius-xs)", padding: "0 12px", fontSize: 13 }}
        >
          Excluir
        </button>
      </div>
    </div>
  );
}

export default function ProfessorsTab({ professors }: { professors: Professor[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleAdd() {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await addProfessor({ name: name.trim(), email: email.trim() || undefined });
      setName("");
      setEmail("");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        className="flex flex-col sm:flex-row gap-2"
        style={{ border: "1px dashed var(--border-default)", borderRadius: "var(--radius-lg)", padding: 16 }}
      >
        <input style={{ ...inputStyle, flex: 1 }} placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} />
        <input
          style={{ ...inputStyle, flex: 1 }}
          placeholder="E-mail (opcional)"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <button
          onClick={handleAdd}
          disabled={busy || !name.trim()}
          className="cursor-pointer border-0"
          style={{ background: "var(--lake-700)", color: "var(--on-brand)", borderRadius: "var(--radius-sm)", padding: "9px 16px", fontSize: 14, fontWeight: 600 }}
        >
          + Professor(a)
        </button>
      </div>
      {professors.map((p) => (
        <ProfessorRow key={p.id} professor={p} onRemoved={() => router.refresh()} />
      ))}
    </div>
  );
}

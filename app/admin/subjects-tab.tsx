"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminSubject } from "@/lib/admin-subjects";
import type { Professor } from "@/lib/professors";
import type { LibraryMaterial } from "@/lib/materials";
import { addSubject } from "./actions";
import { inputStyle } from "./admin-ui";
import SubjectCard from "./subject-card";

function NewSubjectForm({ professors, onCreated }: { professors: Professor[]; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [profId, setProfId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleAdd() {
    if (!name.trim()) return;
    setBusy(true);
    setStatus(null);
    try {
      const { id } = await addSubject({ name: name.trim(), code: code.trim() || undefined, profId });
      setStatus(`Criada como "${id}".`);
      setName("");
      setCode("");
      setProfId(null);
      onCreated();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{ border: "1px dashed var(--border-default)", borderRadius: "var(--radius-lg)", padding: 16, display: "flex", flexDirection: "column", gap: 8 }}
    >
      <div className="flex flex-col sm:flex-row gap-2">
        <input style={{ ...inputStyle, flex: 1 }} placeholder="Nome da disciplina" value={name} onChange={(e) => setName(e.target.value)} />
        <input style={{ ...inputStyle, width: "100%" }} className="sm:!w-24" placeholder="Código (opcional)" value={code} onChange={(e) => setCode(e.target.value)} />
        <select
          style={{ ...inputStyle, flex: 1 }}
          value={profId ?? ""}
          onChange={(e) => setProfId(e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">— sem professor —</option>
          {professors.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <button
          onClick={handleAdd}
          disabled={busy || !name.trim()}
          className="cursor-pointer border-0"
          style={{ background: "var(--lake-700)", color: "var(--on-brand)", borderRadius: "var(--radius-sm)", padding: "9px 16px", fontSize: 14, fontWeight: 600 }}
        >
          + Disciplina
        </button>
      </div>
      {status && <span style={{ fontSize: 12, color: "var(--ink-500)" }}>{status}</span>}
    </div>
  );
}

export default function SubjectsTab({
  subjects,
  professors,
  library,
}: {
  subjects: AdminSubject[];
  professors: Professor[];
  library: LibraryMaterial[];
}) {
  const router = useRouter();

  function refresh() {
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <NewSubjectForm professors={professors} onCreated={refresh} />
      {subjects.map((subject) => (
        <SubjectCard key={subject.id} subject={subject} professors={professors} library={library} onRemoved={refresh} />
      ))}
    </div>
  );
}

"use client";

import { useState } from "react";
import type { AdminSubject } from "@/lib/admin-subjects";
import type { Professor } from "@/lib/professors";
import type { LibraryMaterial } from "@/lib/materials";
import { saveSubject, deleteSubject } from "./actions";
import { inputStyle } from "./admin-ui";
import CategoryEditor, { type EditableExam } from "./category-editor";

export default function SubjectCard({
  subject,
  professors,
  library,
  onRemoved,
}: {
  subject: AdminSubject;
  professors: Professor[];
  library: LibraryMaterial[];
  onRemoved: () => void;
}) {
  const [code, setCode] = useState(subject.code ?? "");
  const [name, setName] = useState(subject.name);
  const [profId, setProfId] = useState(subject.profId);
  const [exams, setExams] = useState<EditableExam[]>(() => subject.exams.map((e) => ({ ...e })));
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setStatus(null);
    try {
      await saveSubject(subject.id, {
        code: code.trim() || null,
        name,
        profId,
        exams: exams.map((e) => ({
          examId: e.examId,
          category: e.category.trim(),
          date: e.date,
          when: e.when,
          topics: e.topics,
          materialIds: e.materials.map((m) => m.id),
        })),
      });
      setStatus("Salvo.");
    } catch (e) {
      setStatus(e instanceof Error ? `Erro: ${e.message}` : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Excluir "${name}"? Isso remove provas, tópicos e categorias dela.`)) return;
    await deleteSubject(subject.id);
    onRemoved();
  }

  return (
    <article
      style={{
        background: "var(--surface-card)",
        border: "1px solid var(--border-subtle)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-sm)",
        padding: 18,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          style={{ ...inputStyle, width: "100%" }}
          className="sm:w-20"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Código (opcional)"
        />
        <input
          style={{ ...inputStyle, flex: 1 }}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome da disciplina"
        />
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
          onClick={handleDelete}
          className="cursor-pointer border-0"
          style={{ background: "var(--negative-100)", color: "var(--negative-600)", borderRadius: "var(--radius-xs)", padding: "0 12px", fontSize: 13, minHeight: 34 }}
        >
          Excluir
        </button>
      </div>

      <CategoryEditor exams={exams} library={library} onChange={setExams} />

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="cursor-pointer border-0"
          style={{
            background: "var(--brand)",
            color: "var(--on-brand)",
            borderRadius: "var(--radius-sm)",
            padding: "9px 20px",
            fontSize: 14,
            fontWeight: 600,
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? "Salvando…" : "Salvar"}
        </button>
        {status && <span style={{ fontSize: 13, color: "var(--ink-500)" }}>{status}</span>}
      </div>
    </article>
  );
}

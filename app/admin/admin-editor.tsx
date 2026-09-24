"use client";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import sanitize from "sanitize-filename";
import imageCompression from "browser-image-compression";
import type { AdminMaterial, AdminSubject } from "@/lib/admin-subjects";
import type { Period } from "@/lib/subjects";
import { saveSubject, addSubject, deleteSubject, logout } from "./actions";

const IMAGE_COMPRESSION_THRESHOLD_BYTES = 300 * 1024;

async function prepareFileForUpload(file: File): Promise<File> {
  const cleanName = sanitize(file.name) || "arquivo";

  if (file.type.startsWith("image/") && file.size > IMAGE_COMPRESSION_THRESHOLD_BYTES) {
    const compressed = await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1600,
      useWebWorker: true,
    });
    return new File([compressed], cleanName, { type: compressed.type || file.type });
  }

  return cleanName === file.name ? file : new File([file], cleanName, { type: file.type });
}

function extKind(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "pdf":
      return "PDF";
    case "pptx":
    case "ppt":
      return "Slides";
    case "docx":
    case "doc":
      return "Doc";
    case "xlsx":
    case "xls":
      return "Planilha";
    case "png":
    case "jpg":
    case "jpeg":
      return "Imagem";
    default:
      return "Arquivo";
  }
}

const PERIOD_LABEL: Record<Period, string> = { p1: "P1", p2: "P2" };

const inputStyle: React.CSSProperties = {
  border: "1px solid var(--border-default)",
  borderRadius: "var(--radius-xs)",
  padding: "7px 10px",
  fontSize: 14,
  fontFamily: "var(--font-sans)",
  width: "100%",
};

function updateAt<T>(list: T[], index: number, value: T): T[] {
  return list.map((item, i) => (i === index ? value : item));
}

function removeAt<T>(list: T[], index: number): T[] {
  return list.filter((_, i) => i !== index);
}

function MaterialRow({
  material,
  onChange,
  onRemove,
}: {
  material: AdminMaterial;
  onChange: (patch: Partial<AdminMaterial>) => void;
  onRemove: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const rawFile = e.target.files?.[0];
    e.target.value = "";
    if (!rawFile) return;
    setUploading(true);
    setError(null);
    try {
      const file = await prepareFileForUpload(rawFile);
      const blob = await upload(file.name, file, {
        access: "public",
        handleUploadUrl: "/api/blob-upload",
      });
      onChange({ href: blob.url, kind: material.kind || extKind(file.name) });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no upload.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div
      className="flex flex-col gap-1"
      style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-xs)", padding: 8 }}
    >
      <div className="flex gap-1">
        <input
          style={{ ...inputStyle, flex: 2 }}
          value={material.label}
          onChange={(e) => onChange({ label: e.target.value })}
          placeholder="Rótulo"
        />
        <input
          style={{ ...inputStyle, flex: 1 }}
          value={material.kind}
          onChange={(e) => onChange({ kind: e.target.value })}
          placeholder="Tipo"
        />
        <button
          onClick={onRemove}
          className="cursor-pointer border-0"
          style={{ background: "var(--surface-sunken)", borderRadius: "var(--radius-xs)", width: 30, fontSize: 14 }}
        >
          ×
        </button>
      </div>
      <div className="flex gap-1 items-center">
        <input
          style={{ ...inputStyle, flex: 1 }}
          value={material.href}
          onChange={(e) => onChange({ href: e.target.value })}
          placeholder="URL (ou anexe um arquivo)"
        />
        <label
          className="cursor-pointer"
          style={{ fontSize: 12, fontWeight: 600, color: "var(--lake-700)", whiteSpace: "nowrap", padding: "0 6px" }}
        >
          {uploading ? "Enviando…" : "Anexar"}
          <input
            type="file"
            accept=".pdf,.pptx,.ppt,.docx,.doc,.xlsx,.xls,image/png,image/jpeg"
            onChange={handleFile}
            disabled={uploading}
            style={{ display: "none" }}
          />
        </label>
      </div>
      {error && <span style={{ fontSize: 11, color: "var(--negative-600)" }}>{error}</span>}
    </div>
  );
}

function SubjectCard({
  subject,
  onRemoved,
}: {
  subject: AdminSubject;
  onRemoved: () => void;
}) {
  const [s, setS] = useState(subject);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setStatus(null);
    try {
      await saveSubject(s.id, { code: s.code, name: s.name, prof: s.prof, exams: s.exams });
      setStatus("Salvo.");
    } catch (e) {
      setStatus(e instanceof Error ? `Erro: ${e.message}` : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Excluir "${s.name}"? Isso remove provas, tópicos e materiais dela.`)) return;
    await deleteSubject(s.id);
    onRemoved();
  }

  function updateExam(period: Period, patch: Partial<(typeof s.exams)[Period]>) {
    setS((prev) => ({ ...prev, exams: { ...prev.exams, [period]: { ...prev.exams[period], ...patch } } }));
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
      <div className="flex gap-2 flex-wrap">
        <input
          style={{ ...inputStyle, width: 80 }}
          value={s.code}
          onChange={(e) => setS((p) => ({ ...p, code: e.target.value }))}
          placeholder="Código"
        />
        <input
          style={{ ...inputStyle, flex: 1, minWidth: 180 }}
          value={s.name}
          onChange={(e) => setS((p) => ({ ...p, name: e.target.value }))}
          placeholder="Nome da disciplina"
        />
        <input
          style={{ ...inputStyle, flex: 1, minWidth: 180 }}
          value={s.prof}
          onChange={(e) => setS((p) => ({ ...p, prof: e.target.value }))}
          placeholder="Professor(a)"
        />
        <button
          onClick={handleDelete}
          className="cursor-pointer border-0"
          style={{ background: "var(--negative-100)", color: "var(--negative-600)", borderRadius: "var(--radius-xs)", padding: "0 12px", fontSize: 13 }}
        >
          Excluir
        </button>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {(["p1", "p2"] as Period[]).map((period) => {
          const exam = s.exams[period];
          return (
            <div
              key={period}
              style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: 12, display: "flex", flexDirection: "column", gap: 10 }}
            >
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.1em", color: "var(--lake-700)" }}>
                {PERIOD_LABEL[period]}
              </span>
              <div className="flex gap-2">
                <input
                  type="date"
                  style={inputStyle}
                  value={exam.date}
                  onChange={(e) => updateExam(period, { date: e.target.value })}
                />
                <input
                  style={inputStyle}
                  value={exam.when}
                  onChange={(e) => updateExam(period, { when: e.target.value })}
                  placeholder="Sex · 19h00 · Sala 12"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-500)" }}>Tópicos</span>
                {exam.topics.map((topic, i) => (
                  <div key={i} className="flex gap-1">
                    <input
                      style={inputStyle}
                      value={topic}
                      onChange={(e) => updateExam(period, { topics: updateAt(exam.topics, i, e.target.value) })}
                    />
                    <button
                      onClick={() => updateExam(period, { topics: removeAt(exam.topics, i) })}
                      className="cursor-pointer border-0"
                      style={{ background: "var(--surface-sunken)", borderRadius: "var(--radius-xs)", width: 30, fontSize: 14 }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => updateExam(period, { topics: [...exam.topics, ""] })}
                  className="cursor-pointer border-0 text-left"
                  style={{ background: "none", color: "var(--lake-700)", fontSize: 12, fontWeight: 600, padding: "2px 0" }}
                >
                  + tópico
                </button>
              </div>

              <div className="flex flex-col gap-1.5">
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-500)" }}>Materiais</span>
                {exam.materials.map((m, i) => (
                  <MaterialRow
                    key={i}
                    material={m}
                    onChange={(patch) => updateExam(period, { materials: updateAt(exam.materials, i, { ...m, ...patch }) })}
                    onRemove={() => updateExam(period, { materials: removeAt(exam.materials, i) })}
                  />
                ))}
                <button
                  onClick={() =>
                    updateExam(period, { materials: [...exam.materials, { label: "", kind: "", href: "" }] })
                  }
                  className="cursor-pointer border-0 text-left"
                  style={{ background: "none", color: "var(--lake-700)", fontSize: 12, fontWeight: 600, padding: "2px 0" }}
                >
                  + material
                </button>
              </div>
            </div>
          );
        })}
      </div>

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

function NewSubjectForm({ onCreated }: { onCreated: () => void }) {
  const [id, setId] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [prof, setProf] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleAdd() {
    if (!id.trim() || !name.trim()) return;
    setBusy(true);
    try {
      await addSubject({ id: id.trim(), code: code.trim(), name: name.trim(), prof: prof.trim() });
      setId("");
      setCode("");
      setName("");
      setProf("");
      onCreated();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      style={{
        border: "1px dashed var(--border-default)",
        borderRadius: "var(--radius-lg)",
        padding: 16,
        display: "flex",
        gap: 8,
        flexWrap: "wrap",
        alignItems: "center",
      }}
    >
      <input style={{ ...inputStyle, width: 100 }} placeholder="id (ex: fis)" value={id} onChange={(e) => setId(e.target.value)} />
      <input style={{ ...inputStyle, width: 80 }} placeholder="Código" value={code} onChange={(e) => setCode(e.target.value)} />
      <input style={{ ...inputStyle, flex: 1, minWidth: 160 }} placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} />
      <input style={{ ...inputStyle, flex: 1, minWidth: 160 }} placeholder="Professor(a)" value={prof} onChange={(e) => setProf(e.target.value)} />
      <button
        onClick={handleAdd}
        disabled={busy}
        className="cursor-pointer border-0"
        style={{ background: "var(--lake-700)", color: "var(--on-brand)", borderRadius: "var(--radius-sm)", padding: "9px 16px", fontSize: 14, fontWeight: 600 }}
      >
        + Disciplina
      </button>
    </div>
  );
}

export default function AdminEditor({ initialSubjects }: { initialSubjects: AdminSubject[] }) {
  const router = useRouter();

  function refresh() {
    router.refresh();
  }

  return (
    <div className="min-h-screen px-[18px] py-10" style={{ background: "var(--grad-mist)" }}>
      <main className="mx-auto flex flex-col gap-4" style={{ maxWidth: 860 }}>
        <div className="flex justify-between items-center">
          <h1 className="m-0" style={{ fontFamily: "var(--font-display)", fontSize: 28, color: "var(--text-strong)" }}>
            Admin · Hub de estudos
          </h1>
          <form action={logout}>
            <button
              type="submit"
              className="cursor-pointer border-0"
              style={{ background: "var(--surface-sunken)", color: "var(--ink-600)", borderRadius: "var(--radius-sm)", padding: "8px 16px", fontSize: 13, fontWeight: 600 }}
            >
              Sair
            </button>
          </form>
        </div>

        <NewSubjectForm onCreated={refresh} />

        {initialSubjects.map((subject) => (
          <SubjectCard key={subject.id} subject={subject} onRemoved={refresh} />
        ))}
      </main>
    </div>
  );
}

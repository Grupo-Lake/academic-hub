"use client";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { upload } from "@vercel/blob/client";
import type { LibraryMaterial } from "@/lib/materials";
import { addLibraryMaterial, updateLibraryMaterial, deleteLibraryMaterial } from "./actions";
import { prepareFileForUpload, extKind, inputStyle } from "./admin-ui";

function MaterialRow({ material, onRemoved }: { material: LibraryMaterial; onRemoved: () => void }) {
  const router = useRouter();
  const [label, setLabel] = useState(material.label);
  const [kind, setKind] = useState(material.kind);
  const [href, setHref] = useState(material.href);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await updateLibraryMaterial(material.id, { label, kind, href });
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Excluir "${material.label}" da biblioteca?`)) return;
    setError(null);
    try {
      await deleteLibraryMaterial(material.id);
      onRemoved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir.");
    }
  }

  return (
    <div
      className="flex flex-col gap-1"
      style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-xs)", padding: 8 }}
    >
      <div className="flex flex-col sm:flex-row gap-2">
        <input style={{ ...inputStyle, flex: 2 }} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Rótulo" />
        <input style={{ ...inputStyle, flex: 1 }} value={kind} onChange={(e) => setKind(e.target.value)} placeholder="Tipo" />
        <input style={{ ...inputStyle, flex: 2 }} value={href} onChange={(e) => setHref(e.target.value)} placeholder="URL" />
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
      {error && <span style={{ fontSize: 11, color: "var(--negative-600)" }}>{error}</span>}
    </div>
  );
}

export default function MaterialsTab({ materials }: { materials: LibraryMaterial[] }) {
  const router = useRouter();
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
      const blob = await upload(file.name, file, { access: "public", handleUploadUrl: "/api/blob-upload" });
      await addLibraryMaterial({ label: file.name, kind: extKind(file.name), href: blob.url });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no upload.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        style={{ border: "1px dashed var(--border-default)", borderRadius: "var(--radius-lg)", padding: 16, display: "flex", flexDirection: "column", gap: 6 }}
      >
        <label className="cursor-pointer" style={{ fontSize: 13, fontWeight: 600, color: "var(--lake-700)" }}>
          {uploading ? "Enviando…" : "+ enviar material para a biblioteca"}
          <input
            type="file"
            accept=".pdf,.pptx,.ppt,.docx,.doc,.xlsx,.xls,image/png,image/jpeg"
            onChange={handleFile}
            disabled={uploading}
            style={{ display: "none" }}
          />
        </label>
        {error && <span style={{ fontSize: 11, color: "var(--negative-600)" }}>{error}</span>}
      </div>
      {materials.map((m) => (
        <MaterialRow key={m.id} material={m} onRemoved={() => router.refresh()} />
      ))}
    </div>
  );
}

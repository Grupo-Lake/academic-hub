"use client";

import { useState, type ChangeEvent } from "react";
import { upload } from "@vercel/blob/client";
import type { LibraryMaterial } from "@/lib/materials";
import { addLibraryMaterial } from "./actions";
import { prepareFileForUpload, extKind, inputStyle } from "./admin-ui";

export default function MaterialPicker({
  attached,
  library,
  onChange,
}: {
  attached: LibraryMaterial[];
  library: LibraryMaterial[];
  onChange: (materials: LibraryMaterial[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const attachedIds = new Set(attached.map((m) => m.id));
  const available = library.filter((m) => !attachedIds.has(m.id));

  function detach(id: number) {
    onChange(attached.filter((m) => m.id !== id));
  }

  function attachExisting(id: number) {
    const material = library.find((m) => m.id === id);
    if (!material) return;
    onChange([...attached, material]);
  }

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
      const material = await addLibraryMaterial({ label: file.name, kind: extKind(file.name), href: blob.url });
      onChange([...attached, material]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no upload.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {attached.map((m) => (
        <div
          key={m.id}
          className="flex items-center gap-2"
          style={{ border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-xs)", padding: "6px 8px" }}
        >
          <span style={{ flex: 1, fontSize: 13 }}>{m.label}</span>
          <span style={{ fontSize: 11, color: "var(--ink-500)", fontFamily: "var(--font-mono)" }}>{m.kind}</span>
          <button
            onClick={() => detach(m.id)}
            className="cursor-pointer border-0"
            style={{ background: "var(--surface-sunken)", borderRadius: "var(--radius-xs)", width: 26, fontSize: 13 }}
          >
            ×
          </button>
        </div>
      ))}
      <div className="flex gap-2 flex-wrap items-center">
        <select
          style={{ ...inputStyle, flex: 1, minWidth: 160 }}
          value=""
          onChange={(e) => attachExisting(Number(e.target.value))}
        >
          <option value="">+ da biblioteca…</option>
          {available.map((m) => (
            <option key={m.id} value={m.id}>
              {m.label} ({m.kind})
            </option>
          ))}
        </select>
        <label
          className="cursor-pointer"
          style={{ fontSize: 12, fontWeight: 600, color: "var(--lake-700)", whiteSpace: "nowrap" }}
        >
          {uploading ? "Enviando…" : "+ enviar novo"}
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

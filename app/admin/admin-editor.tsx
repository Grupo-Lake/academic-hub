"use client";

import { useState } from "react";
import type { AdminSubject } from "@/lib/admin-subjects";
import type { Professor } from "@/lib/professors";
import type { LibraryMaterial } from "@/lib/materials";
import { logout } from "./actions";
import SubjectsTab from "./subjects-tab";
import ProfessorsTab from "./professors-tab";
import MaterialsTab from "./materials-tab";

type Tab = "subjects" | "professors" | "materials";

const TABS: { key: Tab; label: string }[] = [
  { key: "subjects", label: "Disciplinas" },
  { key: "professors", label: "Professores" },
  { key: "materials", label: "Materiais" },
];

export default function AdminEditor({
  initialSubjects,
  professors,
  materials,
}: {
  initialSubjects: AdminSubject[];
  professors: Professor[];
  materials: LibraryMaterial[];
}) {
  const [tab, setTab] = useState<Tab>("subjects");

  return (
    <div className="min-h-screen px-[18px] py-10" style={{ background: "var(--grad-mist)" }}>
      <main className="mx-auto flex flex-col gap-4" style={{ maxWidth: 860 }}>
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h1
            className="m-0"
            style={{ fontFamily: "var(--font-display)", fontSize: "clamp(22px, 5vw, 28px)", color: "var(--text-strong)" }}
          >
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

        <div
          className="flex gap-1 flex-wrap rounded-full self-start"
          style={{ background: "var(--surface-sunken)", padding: 4 }}
        >
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="cursor-pointer border-0"
              style={{
                fontSize: 13,
                fontWeight: 600,
                padding: "7px 16px",
                borderRadius: "var(--radius-pill)",
                background: tab === t.key ? "var(--surface-card)" : "transparent",
                color: tab === t.key ? "var(--lake-700)" : "var(--ink-500)",
                boxShadow: tab === t.key ? "var(--shadow-xs)" : "none",
                transition: "all .15s ease",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "subjects" && <SubjectsTab subjects={initialSubjects} professors={professors} library={materials} />}
        {tab === "professors" && <ProfessorsTab professors={professors} />}
        {tab === "materials" && <MaterialsTab materials={materials} />}
      </main>
    </div>
  );
}

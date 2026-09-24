"use client";

import type { LibraryMaterial } from "@/lib/materials";
import { inputStyle, updateAt, removeAt } from "./admin-ui";
import MaterialPicker from "./material-picker";

export type EditableExam = {
  examId: number | null;
  category: string;
  date: string;
  when: string;
  topics: string[];
  materials: LibraryMaterial[];
};

export default function CategoryEditor({
  exams,
  library,
  onChange,
}: {
  exams: EditableExam[];
  library: LibraryMaterial[];
  onChange: (exams: EditableExam[]) => void;
}) {
  function updateExam(index: number, patch: Partial<EditableExam>) {
    onChange(updateAt(exams, index, { ...exams[index], ...patch }));
  }

  function removeExam(index: number) {
    onChange(removeAt(exams, index));
  }

  function addExam() {
    const today = new Date().toISOString().slice(0, 10);
    onChange([...exams, { examId: null, category: "", date: today, when: "", topics: [], materials: [] }]);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        {exams.map((exam, i) => (
          <div
            key={exam.examId ?? `new-${i}`}
            style={{
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: 12,
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div className="flex gap-1 items-center">
              <input
                style={{
                  ...inputStyle,
                  flex: 1,
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  letterSpacing: "0.06em",
                }}
                value={exam.category}
                onChange={(e) => updateExam(i, { category: e.target.value })}
                placeholder="Categoria (ex: P1, Extras, Trabalhos)"
              />
              <button
                onClick={() => removeExam(i)}
                className="cursor-pointer border-0"
                style={{ background: "var(--negative-100)", color: "var(--negative-600)", borderRadius: "var(--radius-xs)", width: 30, fontSize: 14 }}
              >
                ×
              </button>
            </div>

            <div className="flex gap-2 flex-wrap">
              <input
                type="date"
                style={{ ...inputStyle, flex: 1, minWidth: 130 }}
                value={exam.date}
                onChange={(e) => updateExam(i, { date: e.target.value })}
              />
              <input
                style={{ ...inputStyle, flex: 2, minWidth: 160 }}
                value={exam.when}
                onChange={(e) => updateExam(i, { when: e.target.value })}
                placeholder="Sex · 19h00 · Sala 12"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-500)" }}>Tópicos</span>
              {exam.topics.map((topic, ti) => (
                <div key={ti} className="flex gap-1">
                  <input
                    style={inputStyle}
                    value={topic}
                    onChange={(e) => updateExam(i, { topics: updateAt(exam.topics, ti, e.target.value) })}
                  />
                  <button
                    onClick={() => updateExam(i, { topics: removeAt(exam.topics, ti) })}
                    className="cursor-pointer border-0"
                    style={{ background: "var(--surface-sunken)", borderRadius: "var(--radius-xs)", width: 30, fontSize: 14 }}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                onClick={() => updateExam(i, { topics: [...exam.topics, ""] })}
                className="cursor-pointer border-0 text-left"
                style={{ background: "none", color: "var(--lake-700)", fontSize: 12, fontWeight: 600, padding: "2px 0" }}
              >
                + tópico
              </button>
            </div>

            <div className="flex flex-col gap-1.5">
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-500)" }}>Materiais</span>
              <MaterialPicker
                attached={exam.materials}
                library={library}
                onChange={(materials) => updateExam(i, { materials })}
              />
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={addExam}
        className="cursor-pointer border-0 text-left"
        style={{ background: "none", color: "var(--lake-700)", fontSize: 13, fontWeight: 600, padding: "4px 0" }}
      >
        + categoria
      </button>
    </div>
  );
}

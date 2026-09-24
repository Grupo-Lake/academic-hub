"use client";

import { useState } from "react";
import type { Period, Subject } from "@/lib/subjects";

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

function daysUntil(dateStr: string, today: Date): number {
  return Math.round((new Date(`${dateStr}T12:00:00`).getTime() - today.getTime()) / 864e5);
}

function fmt(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`);
  return `${String(d.getDate()).padStart(2, "0")} ${MONTHS[d.getMonth()]}`;
}

export default function StudyHub({ subjects: DATA }: { subjects: Subject[] }) {
  const [period, setPeriod] = useState<Period>("p1");
  const [open, setOpen] = useState<Record<string, boolean>>({ bd: true });
  const [done, setDone] = useState<Record<string, boolean>>({});

  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const sorted = [...DATA].sort((a, b) => a.exams[period].date.localeCompare(b.exams[period].date));
  const anyOpen = sorted.some((s) => open[s.id]);

  let doneCount = 0;
  let totalCount = 0;
  const subjects = sorted.map((s) => {
    const exam = s.exams[period];
    const topics = exam.topics.map((label, i) => {
      const key = `${s.id}-${period}-${i}`;
      const isDone = !!done[key];
      totalCount++;
      if (isDone) doneCount++;
      return { key, label, done: isDone };
    });
    const days = daysUntil(exam.date, today);
    const isOpen = !!open[s.id];
    return {
      ...s,
      exam,
      topics,
      isOpen,
      dateLabel: fmt(exam.date),
      soon: days <= 7,
      doneOfTotal: `${topics.filter((t) => t.done).length}/${topics.length}`,
    };
  });

  const next = sorted.find((s) => daysUntil(s.exams[period].date, today) >= 0) ?? sorted[0];
  const nextExam = next.exams[period];
  const nextDays = daysUntil(nextExam.date, today);
  const overallPct = totalCount ? Math.round((doneCount / totalCount) * 100) : 0;
  const periodLabel = period.toUpperCase();

  function toggleSubject(id: string) {
    setOpen((s) => ({ ...s, [id]: !s[id] }));
  }

  function toggleTopic(key: string) {
    setDone((s) => ({ ...s, [key]: !s[key] }));
  }

  function toggleAll() {
    setOpen(anyOpen ? {} : Object.fromEntries(DATA.map((s) => [s.id, true])));
  }

  return (
    <div
      className="min-h-screen flex justify-center px-[18px] pt-10 pb-14"
      style={{ background: "var(--grad-mist)" }}
    >
      <main className="w-full max-w-[440px] flex flex-col gap-[22px]">
        <header className="flex flex-col items-center gap-3 text-center">
          <div
            className="w-19 h-19 rounded-full flex items-center justify-center"
            style={{
              width: 76,
              height: 76,
              background: "var(--grad-lake)",
              boxShadow: "var(--shadow-md)",
              color: "var(--on-brand)",
              fontFamily: "var(--font-display)",
              fontSize: 30,
              letterSpacing: "-0.02em",
            }}
          >
            FZL
          </div>
          <div className="flex flex-col gap-1.5">
            <span
              className="uppercase"
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                letterSpacing: "0.14em",
                color: "var(--lake-600)",
              }}
            >
              Fatec Zona Leste · 3º ADS Noite · 2026/2
            </span>
            <h1
              className="m-0"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 400,
                fontSize: 34,
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                color: "var(--text-strong)",
              }}
            >
              Hub de estudos <em style={{ color: "var(--lake-600)", fontStyle: "italic" }}>{periodLabel}</em>
            </h1>
            <p
              className="m-0"
              style={{ fontSize: 15, lineHeight: 1.5, color: "var(--ink-500)" }}
            >
              Tudo o que você precisa para as provas, organizado por disciplina.
            </p>
          </div>
          <div
            className="flex gap-1 rounded-full"
            style={{ background: "var(--surface-sunken)", padding: 4 }}
          >
            {(["p1", "p2"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="cursor-pointer border-0"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  padding: "7px 18px",
                  borderRadius: "var(--radius-pill)",
                  background: period === p ? "var(--surface-card)" : "transparent",
                  color: period === p ? "var(--lake-700)" : "var(--ink-500)",
                  boxShadow: period === p ? "var(--shadow-xs)" : "none",
                  transition: "all .15s ease",
                }}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>
        </header>

        <section
          className="relative overflow-hidden flex flex-col gap-4"
          style={{
            borderRadius: "var(--radius-xl)",
            background: "var(--grad-dusk)",
            color: "var(--text-on-dark)",
            padding: "22px 22px 20px",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          <div
            className="absolute rounded-full"
            style={{
              right: -70,
              top: -70,
              width: 220,
              height: 220,
              border: "1px solid rgba(237,247,243,.12)",
              boxShadow: "0 0 0 28px rgba(237,247,243,.04), 0 0 0 56px rgba(237,247,243,.03)",
            }}
          />
          <div className="relative flex justify-between items-start gap-3">
            <div className="flex flex-col gap-1">
              <span
                className="uppercase"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  letterSpacing: "0.14em",
                  color: "var(--text-on-dark-muted)",
                }}
              >
                Próxima prova · {periodLabel}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 24,
                  lineHeight: 1.1,
                  letterSpacing: "-0.01em",
                }}
              >
                {next.name}
              </span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--lake-200)" }}>
                {fmt(nextExam.date)} · {nextExam.when.split(" · ")[1]}
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span style={{ fontFamily: "var(--font-display)", fontSize: 48, lineHeight: 1, letterSpacing: "-0.03em" }}>
                {nextDays}
              </span>
              <span
                className="uppercase"
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  letterSpacing: "0.1em",
                  color: "var(--text-on-dark-muted)",
                }}
              >
                dias
              </span>
            </div>
          </div>
          <div className="relative flex flex-col gap-2">
            <div className="flex justify-between" style={{ fontSize: 13, color: "var(--text-on-dark-muted)" }}>
              <span>Progresso geral</span>
              <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-on-dark)" }}>
                {doneCount}/{totalCount} tópicos
              </span>
            </div>
            <div
              className="rounded-full overflow-hidden"
              style={{ height: 6, background: "rgba(237,247,243,.14)" }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  background: "var(--lake-300)",
                  transition: "width .3s cubic-bezier(.4,0,.2,1)",
                  width: `${overallPct}%`,
                }}
              />
            </div>
          </div>
        </section>

        <div className="flex justify-between items-baseline px-1 pt-1">
          <span
            className="uppercase"
            style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.14em", color: "var(--ink-500)" }}
          >
            Disciplinas
          </span>
          <button
            onClick={toggleAll}
            className="border-0 bg-transparent py-1.5 cursor-pointer"
            style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, color: "var(--lake-700)" }}
          >
            {anyOpen ? "Recolher tudo" : "Expandir tudo"}
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {subjects.map((s) => (
            <article
              key={s.id}
              className="overflow-hidden"
              style={{
                background: "var(--surface-card)",
                border: "1px solid var(--border-subtle)",
                borderRadius: "var(--radius-lg)",
                boxShadow: "var(--shadow-sm)",
                transition: "box-shadow .18s ease",
              }}
            >
              <button
                onClick={() => toggleSubject(s.id)}
                aria-expanded={s.isOpen}
                className="w-full border-0 bg-transparent flex items-center gap-3.5 cursor-pointer text-left hover:bg-[var(--lake-50)]"
                style={{
                  padding: "16px 16px 16px 18px",
                  fontFamily: "var(--font-sans)",
                  minHeight: 72,
                }}
              >
                <div
                  className="flex-none rounded-xl flex items-center justify-center"
                  style={{
                    width: 42,
                    height: 42,
                    background: "var(--lake-50)",
                    color: "var(--lake-700)",
                    fontFamily: "var(--font-mono)",
                    fontSize: 13,
                    fontWeight: 500,
                  }}
                >
                  {s.code}
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-[3px]">
                  <span style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.25, color: "var(--text-strong)" }}>
                    {s.name}
                  </span>
                  <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--ink-500)" }}>
                    {periodLabel} · {s.dateLabel} · {s.doneOfTotal}
                  </span>
                </div>
                {s.soon && (
                  <span
                    className="flex-none uppercase rounded-full"
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: 10,
                      letterSpacing: "0.08em",
                      padding: "4px 8px",
                      background: "var(--coral-100)",
                      color: "var(--coral-700)",
                    }}
                  >
                    Em breve
                  </span>
                )}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="flex-none"
                  style={{
                    color: "var(--ink-400)",
                    transition: "transform .18s ease",
                    transform: s.isOpen ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>
              <div
                className="grid"
                style={{
                  transition: "grid-template-rows .22s cubic-bezier(.4,0,.2,1)",
                  gridTemplateRows: s.isOpen ? "1fr" : "0fr",
                }}
              >
                <div className="overflow-hidden min-h-0">
                  <div
                    className="flex flex-col gap-[18px]"
                    style={{
                      padding: "4px 18px 18px",
                      borderTop: "1px solid var(--border-subtle)",
                    }}
                  >
                    <div className="flex flex-wrap gap-2 pt-3.5">
                      <span
                        className="rounded-full"
                        style={{ fontSize: 12, padding: "5px 10px", background: "var(--surface-sunken)", color: "var(--ink-600)" }}
                      >
                        {s.prof}
                      </span>
                      <span
                        className="rounded-full"
                        style={{
                          fontSize: 12,
                          padding: "5px 10px",
                          background: "var(--surface-sunken)",
                          color: "var(--ink-600)",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {s.exam.when}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span
                        className="uppercase"
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 11,
                          letterSpacing: "0.14em",
                          color: "var(--ink-500)",
                        }}
                      >
                        Conteúdo da prova
                      </span>
                      <div className="flex flex-col">
                        {s.topics.map((t) => (
                          <label
                            key={t.key}
                            className="flex items-center gap-3 cursor-pointer"
                            style={{ minHeight: 44, borderBottom: "1px solid var(--border-subtle)" }}
                          >
                            <input
                              type="checkbox"
                              checked={t.done}
                              onChange={() => toggleTopic(t.key)}
                              className="flex-none m-0"
                              style={{ width: 18, height: 18, accentColor: "var(--lake-700)" }}
                            />
                            <span
                              style={{
                                fontSize: 15,
                                lineHeight: 1.35,
                                color: t.done ? "var(--ink-400)" : "var(--text-body)",
                                textDecoration: t.done ? "line-through" : "none",
                              }}
                            >
                              {t.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <span
                        className="uppercase"
                        style={{
                          fontFamily: "var(--font-mono)",
                          fontSize: 11,
                          letterSpacing: "0.14em",
                          color: "var(--ink-500)",
                        }}
                      >
                        Materiais
                      </span>
                      {s.exam.links.map(({ label, kind, href }) => (
                        <a
                          key={label}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between gap-3 rounded-2xl hover:!border-[var(--lake-400)] hover:!bg-[var(--lake-50)] hover:!text-[var(--lake-800)]"
                          style={{
                            minHeight: 48,
                            padding: "12px 16px",
                            border: "1px solid var(--border-default)",
                            background: "var(--paper)",
                            color: "var(--text-strong)",
                            fontSize: 15,
                            fontWeight: 500,
                            transition: "all .15s ease",
                          }}
                        >
                          <span>{label}</span>
                          <span
                            className="uppercase"
                            style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: 11,
                              letterSpacing: "0.08em",
                              color: "var(--ink-400)",
                            }}
                          >
                            {kind} ↗
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>

        <footer className="flex flex-col items-center gap-1.5 pt-3 text-center">
          <span style={{ fontFamily: "var(--font-display)", fontSize: 18, color: "var(--lake-700)" }}>
            Bons estudos.
          </span>
          <span style={{ fontSize: 12, color: "var(--ink-400)" }}>
            Material organizado pela turma · não oficial da Fatec
          </span>
        </footer>
      </main>
    </div>
  );
}

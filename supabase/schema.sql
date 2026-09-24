-- Hub Acadêmico — schema + seed data
-- Run this once in the Supabase SQL Editor (Project > SQL Editor > New query).

create table if not exists subjects (
  id text primary key,
  code text not null,
  name text not null,
  prof text not null,
  sort_order int not null default 0
);

create table if not exists exams (
  id bigint generated always as identity primary key,
  subject_id text not null references subjects(id) on delete cascade,
  period text not null check (period in ('p1', 'p2')),
  exam_date date not null,
  when_label text not null,
  unique (subject_id, period)
);

create table if not exists topics (
  id bigint generated always as identity primary key,
  exam_id bigint not null references exams(id) on delete cascade,
  label text not null,
  sort_order int not null default 0
);

create table if not exists materials (
  id bigint generated always as identity primary key,
  exam_id bigint not null references exams(id) on delete cascade,
  label text not null,
  kind text not null,
  href text not null default '#',
  sort_order int not null default 0
);

alter table subjects enable row level security;
alter table exams enable row level security;
alter table topics enable row level security;
alter table materials enable row level security;

-- Public read-only content: no auth in this app, everyone can read.
create policy "public read subjects" on subjects for select to anon, authenticated using (true);
create policy "public read exams" on exams for select to anon, authenticated using (true);
create policy "public read topics" on topics for select to anon, authenticated using (true);
create policy "public read materials" on materials for select to anon, authenticated using (true);

-- ---------- Seed data ----------

insert into subjects (id, code, name, prof, sort_order) values
  ('es', 'ES1', 'Engenharia de Software I', 'Prof. Marcos Lima', 1),
  ('bd', 'BD', 'Banco de Dados', 'Profa. Ana Ribeiro', 2),
  ('ed', 'ED', 'Estruturas de Dados', 'Prof. Rafael Souza', 3),
  ('so', 'SO', 'Sistemas Operacionais', 'Prof. Carlos Mendes', 4),
  ('md', 'MD', 'Matemática Discreta', 'Profa. Juliana Costa', 5),
  ('in', 'IN2', 'Inglês II', 'Profa. Beatriz Alves', 6)
on conflict (id) do nothing;

insert into exams (subject_id, period, exam_date, when_label) values
  ('es', 'p1', '2026-10-02', 'Sex · 19h00 · Sala 12'),
  ('es', 'p2', '2026-12-04', 'Sex · 19h00 · Sala 12'),
  ('bd', 'p1', '2026-09-29', 'Ter · 21h00 · Lab 3'),
  ('bd', 'p2', '2026-11-24', 'Ter · 21h00 · Lab 3'),
  ('ed', 'p1', '2026-10-06', 'Ter · 19h00 · Lab 1'),
  ('ed', 'p2', '2026-12-01', 'Ter · 19h00 · Lab 1'),
  ('so', 'p1', '2026-10-08', 'Qui · 19h00 · Sala 8'),
  ('so', 'p2', '2026-12-03', 'Qui · 19h00 · Sala 8'),
  ('md', 'p1', '2026-10-09', 'Sex · 21h00 · Sala 5'),
  ('md', 'p2', '2026-12-02', 'Sex · 21h00 · Sala 5'),
  ('in', 'p1', '2026-10-13', 'Ter · 19h00 · Sala 2'),
  ('in', 'p2', '2026-12-08', 'Ter · 19h00 · Sala 2')
on conflict (subject_id, period) do nothing;

insert into topics (exam_id, label, sort_order)
select e.id, t.label, t.sort_order
from exams e
join (
  values
    ('es', 'p1', 'Modelos de processo (cascata, espiral)', 1),
    ('es', 'p1', 'Requisitos funcionais e não funcionais', 2),
    ('es', 'p1', 'Diagrama de casos de uso', 3),
    ('es', 'p1', 'Scrum: papéis e cerimônias', 4),
    ('es', 'p2', 'Diagrama de classes (UML)', 1),
    ('es', 'p2', 'Testes de software: unitários e integração', 2),
    ('es', 'p2', 'Métricas de qualidade de software', 3),
    ('es', 'p2', 'Gerenciamento ágil (Kanban)', 4),
    ('bd', 'p1', 'Modelo entidade-relacionamento', 1),
    ('bd', 'p1', 'Normalização (1FN a 3FN)', 2),
    ('bd', 'p1', 'SQL: SELECT, JOIN, GROUP BY', 3),
    ('bd', 'p2', 'Transações e controle de concorrência', 1),
    ('bd', 'p2', 'Índices e otimização de consultas', 2),
    ('bd', 'p2', 'Procedures e triggers', 3),
    ('ed', 'p1', 'Listas encadeadas', 1),
    ('ed', 'p1', 'Pilhas e filas', 2),
    ('ed', 'p1', 'Recursão', 3),
    ('ed', 'p1', 'Complexidade (Big-O)', 4),
    ('ed', 'p2', 'Árvores binárias e AVL', 1),
    ('ed', 'p2', 'Grafos: BFS e DFS', 2),
    ('ed', 'p2', 'Tabelas hash', 3),
    ('ed', 'p2', 'Algoritmos de ordenação', 4),
    ('so', 'p1', 'Processos e threads', 1),
    ('so', 'p1', 'Escalonamento de CPU', 2),
    ('so', 'p1', 'Deadlock', 3),
    ('so', 'p2', 'Gerência de memória', 1),
    ('so', 'p2', 'Sistemas de arquivos', 2),
    ('so', 'p2', 'Sincronização e semáforos', 3),
    ('md', 'p1', 'Lógica proposicional', 1),
    ('md', 'p1', 'Conjuntos e relações', 2),
    ('md', 'p1', 'Indução matemática', 3),
    ('md', 'p2', 'Grafos e árvores', 1),
    ('md', 'p2', 'Contagem e combinatória', 2),
    ('md', 'p2', 'Relações de recorrência', 3),
    ('in', 'p1', 'Simple past vs. present perfect', 1),
    ('in', 'p1', 'Reading: technical texts', 2),
    ('in', 'p2', 'Future forms: will vs. going to', 1),
    ('in', 'p2', 'Reading: academic articles', 2)
) as t(subject_id, period, label, sort_order)
  on t.subject_id = e.subject_id and t.period = e.period;

insert into materials (exam_id, label, kind, sort_order)
select e.id, m.label, m.kind, m.sort_order
from exams e
join (
  values
    ('es', 'p1', 'Resumo da matéria', 'PDF', 1),
    ('es', 'p1', 'Lista de exercícios 1', 'PDF', 2),
    ('es', 'p1', 'Slides das aulas 1–6', 'Drive', 3),
    ('es', 'p2', 'Resumo da matéria P2', 'PDF', 1),
    ('es', 'p2', 'Lista de exercícios 2', 'PDF', 2),
    ('es', 'p2', 'Slides das aulas 7–12', 'Drive', 3),
    ('bd', 'p1', 'Lista de SQL resolvida', 'PDF', 1),
    ('bd', 'p1', 'Simulado P1', 'Forms', 2),
    ('bd', 'p1', 'Gravação: revisão', 'Vídeo', 3),
    ('bd', 'p2', 'Lista de SQL avançado', 'PDF', 1),
    ('bd', 'p2', 'Simulado P2', 'Forms', 2),
    ('bd', 'p2', 'Gravação: revisão P2', 'Vídeo', 3),
    ('ed', 'p1', 'Exercícios em C', 'GitHub', 1),
    ('ed', 'p1', 'Visualizador de estruturas', 'Site', 2),
    ('ed', 'p2', 'Exercícios em C — parte 2', 'GitHub', 1),
    ('ed', 'p2', 'Visualizador de árvores e grafos', 'Site', 2),
    ('so', 'p1', 'Resumo por capítulo', 'PDF', 1),
    ('so', 'p1', 'Lista 1', 'PDF', 2),
    ('so', 'p2', 'Resumo por capítulo P2', 'PDF', 1),
    ('so', 'p2', 'Lista 2', 'PDF', 2),
    ('md', 'p1', 'Lista de exercícios', 'PDF', 1),
    ('md', 'p1', 'Videoaulas recomendadas', 'YouTube', 2),
    ('md', 'p2', 'Lista de exercícios 2', 'PDF', 1),
    ('md', 'p2', 'Videoaulas recomendadas P2', 'YouTube', 2),
    ('in', 'p1', 'Vocabulary list', 'PDF', 1),
    ('in', 'p1', 'Practice test', 'Forms', 2),
    ('in', 'p2', 'Vocabulary list P2', 'PDF', 1),
    ('in', 'p2', 'Practice test 2', 'Forms', 2)
) as m(subject_id, period, label, kind, sort_order)
  on m.subject_id = e.subject_id and m.period = e.period;

-- Migração 002 — professores, biblioteca de materiais reutilizável, categorias livres.
-- Run this once in the Supabase SQL Editor (Project > SQL Editor > New query).
-- Ordem importa: cada bloco faz backfill antes de remover as colunas antigas.

-- ---------- 1. Professores ----------

create table if not exists professors (
  id bigint generated always as identity primary key,
  name text not null,
  email text,
  sort_order int not null default 0
);

alter table professors enable row level security;
create policy "public read professors" on professors for select to anon, authenticated using (true);
create policy "authenticated write professors" on professors for all to authenticated using (true) with check (true);

-- Backfill: um professor por valor distinto hoje em subjects.prof.
insert into professors (name, sort_order)
select prof, row_number() over (order by prof)
from (select distinct prof from subjects where prof is not null and trim(prof) <> '') as p;

alter table subjects add column if not exists prof_id bigint references professors(id) on delete set null;

update subjects s
set prof_id = p.id
from professors p
where p.name = s.prof and s.prof_id is null;

alter table subjects drop column if exists prof;

-- ---------- 2. Categorias livres (antes p1/p2 fixos) ----------

alter table exams rename column period to category;
alter table exams drop constraint if exists exams_period_check;
alter table exams alter column category type text;
-- unique(subject_id, period) foi renomeada junto para unique(subject_id, category)
-- pelo rename da coluna acima — segue garantindo uma categoria por nome por disciplina.

-- ---------- 3. Biblioteca de materiais reutilizável ----------

create table if not exists exam_materials (
  exam_id bigint not null references exams(id) on delete cascade,
  material_id bigint not null references materials(id) on delete cascade,
  sort_order int not null default 0,
  primary key (exam_id, material_id)
);

alter table exam_materials enable row level security;
create policy "public read exam_materials" on exam_materials for select to anon, authenticated using (true);
create policy "authenticated write exam_materials" on exam_materials for all to authenticated using (true) with check (true);

-- Backfill: cada linha existente de materials vira um vínculo exam_materials para si mesma.
insert into exam_materials (exam_id, material_id, sort_order)
select exam_id, id, sort_order from materials;

alter table materials drop column if exists exam_id;
alter table materials drop column if exists sort_order;
alter table materials add column if not exists created_at timestamptz not null default now();

-- ---------- 4. Código passa a ser opcional ----------

alter table subjects alter column code drop not null;

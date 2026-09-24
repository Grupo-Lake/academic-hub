-- Allows any authenticated user to write. Safe here because the app has no
-- public sign-up — the only authenticated users are admins created manually
-- in the Supabase dashboard (Authentication > Users > Add user).

create policy "authenticated write subjects" on subjects
  for all to authenticated using (true) with check (true);

create policy "authenticated write exams" on exams
  for all to authenticated using (true) with check (true);

create policy "authenticated write topics" on topics
  for all to authenticated using (true) with check (true);

create policy "authenticated write materials" on materials
  for all to authenticated using (true) with check (true);

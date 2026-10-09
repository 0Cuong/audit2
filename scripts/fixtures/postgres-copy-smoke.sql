-- Synthetic CI fixture only. It contains no recovered or user data.
COPY public.memories (id, title, category, url, description, is_favorite, date, tags, created_at) FROM stdin;
fixture-memory-1	CI parser smoke	photo	/fixture.jpg	fixture only	f	2026-01-01	[]	2026-01-01 00:00:00+00
\.
COPY public.couple_members (couple_id, user_id, role, created_at) FROM stdin;
fixture-couple	fixture-user	owner	2026-01-01 00:00:00+00
\.

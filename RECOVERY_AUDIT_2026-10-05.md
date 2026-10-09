# Recovery Audit — 2026-10-05

## Result

**Media recovery is complete at the repository/inventory level: 36 image payloads are accounted for.**

- **31** Supabase Storage objects are present in the live `memories` bucket.
- The repository contains **29** `memories/uploads/*` files + **2** `memories/bucket-list/*` files = **31** binary storage files.
- The PostgreSQL backup contains the corresponding `storage.objects` metadata and the public-table rows that reference the media.
- **5** additional anniversary images were embedded directly in PostgreSQL as `data:image/*;base64` values and were extracted to `recovered/anniversaries/`.

## Important finding

The backup itself does **not** contain the binary contents of the 31 Supabase Storage objects; it contains their storage metadata. The binary recovery is therefore represented by the separate repository storage tree:

`recpvczpwybpbbntwnnk.storage (1)/recpvczpwybpbbntwnnk/memories/`

This tree currently contains:

- `uploads/` — 29 files
- `bucket-list/` — 2 files

The filenames and byte sizes align with the live Storage inventory.

## Anniversary media

All 5 anniversary rows with inline `data:image/*;base64` media have corresponding recovered files:

- `7b7e2939-b6b7-42a3-9121-555cba8f259f` — JPEG
- `c8ded1f9-614a-48d3-88f0-36885a2d5bb5` — JPEG
- `8cba8636-fe14-417b-98a9-298cf44ed4eb` — JPEG
- `24704498-7327-40fc-812c-d5fe51eb04e7` — **WebP payload currently named .jpg**
- `2538fd50-9ea9-4d57-b8d3-3ed6458019c3` — JPEG

The WebP finding is based on the source data URI prefix `UklGR`, which is the RIFF/WebP signature. Its bytes were recovered, but its filename extension is technically wrong.

## Recovery pipeline status

The existing Cloudflare recovery script already supports:

1. Parsing the PostgreSQL backup's public-table COPY sections.
2. Importing rows with `insert-if-missing`.
3. Importing local storage files when `STORAGE_DUMP_PATH` is supplied.
4. Verifying the target `/api/health` endpoint before live import.

The separate Supabase-to-Cloudflare migration script also reads Supabase Storage objects directly and uploads their binary contents.

## Remaining blocker

The remaining uncertainty is **live Cloudflare/D1 verification**, not Supabase media recovery. The repository-side recovery assets and the Supabase-side source inventory are now accounted for. No destructive database migration was performed during this audit.

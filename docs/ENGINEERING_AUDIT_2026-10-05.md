# audit2 Engineering Audit — 2026-10-05

## Baseline

The repository currently tracks 188 blobs at roughly 18.5 MB. The application source is about 0.9 MB, while recovery data, storage dumps, and the PostgreSQL backup account for most tracked bytes.

The recent history shows deliberate cleanup: historical root fix scripts were removed, worker storage constants were centralized, and a route-extraction draft was removed after review.

## Strengths to preserve

- Lazy-loaded page routes and a global ErrorBoundary.
- Safe localStorage helpers and local-first recovery behavior.
- Explicit worker table/column validation and parameterized D1 queries.
- Update/delete operations refuse missing filters.
- Recovery scripts have dry-run and import-secret gates.
- Existing design tokens and cinematic components are project-specific rather than a generic component-library rewrite.

## Findings

### Fixed in this change
- CI run 106 failed at lint because `worker/schema.js` exported `TABLES` twice. The duplicate export was removed while preserving the newer centralized `worker/modules/storage-constants.js` bucket definition.

### Resolved in the current production-guards branch
- CORS no longer reflects arbitrary origins. Same-origin requests remain valid; cross-origin requests require an exact `CORS_ORIGIN` allowlist. Wildcard `*` is rejected by the parser.
- `wrangler.json` defaults `CORS_ORIGIN` to an empty same-origin-only policy. Cross-origin clients must explicitly configure trusted origins.

### Release blockers / follow-ups
- No package lockfile is tracked. CI uses mutable `npm install`, reducing reproducibility.
- `wrangler.json` still contains a placeholder D1 database ID. It no longer uses wildcard CORS; the default is same-origin only.
- The worker data and storage write/read APIs have no application authentication or tenant isolation. The API should not be treated as a production security boundary until this is designed and verified.
- The default development command intentionally uses `recovery-server.mjs`; direct Vite remains available as `npm run dev:vite`.
- Recovery artifacts are large but must remain intact until migration is independently verified; this audit does not delete or relocate them.

## Complexity hotspots

The largest frontend modules are Memories, Journal, AppearanceStudioModal, LoveMap, Music, PersonalizationContext, and the personalization type model. Refactor these only when a concrete maintenance or verification gain is demonstrated.

## Safe improvement strategy

This pass adds a portable skill catalog, deterministic routing, skill validation, agent instructions, and CI validation without adding runtime dependencies or touching recovered data.

## Verification

The known pre-change CI evidence was: typecheck passed; lint failed on the duplicate export; build was skipped because CI stops on lint failure. After this commit, the main-branch workflow should be used as the authoritative clean-state verification.

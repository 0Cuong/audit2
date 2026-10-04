---
name: verification
description: Define and execute evidence-based checks for build, lint, type safety, browser, accessibility, performance, and recovery work.
---

# Verification

Run repository checks that actually exist:
- npm run skills:check
- npm run typecheck
- npm run lint
- npm run build

## Change matrix

| Change | Minimum evidence |
|---|---|
| TypeScript logic | typecheck + targeted test |
| Worker/API | lint + build + endpoint check |
| UI | typecheck + lint + build + browser inspection |
| Accessibility | browser inspection + keyboard/focus/reduced-motion |
| Recovery/migration | parser/inventory + source/target comparison |
| External skill | provenance + license + static safety review |

When a check fails, fix the smallest concrete cause and rerun dependent checks. Never mask failures by weakening rules or skipping the failing stage.

Report exactly what ran and what could not run.

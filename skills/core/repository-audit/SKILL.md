---
name: repository-audit
description: Audit an existing repository before substantial changes; map architecture, risks, debt, verification gaps, and safe change boundaries.
---

# Repository Audit

## When to use
Use before a substantial refactor, migration, recovery change, dependency change, or unfamiliar feature.

## Workflow
1. Inventory the tree, manifests, configs, scripts, tests, CI, docs, and large artifacts.
2. Trace entrypoints, runtime boundaries, data flow, state ownership, and external services.
3. Identify strengths worth preserving before listing weaknesses.
4. Identify duplication, dead code, unsafe defaults, oversized modules, missing tests, and fragile compatibility layers.
5. Check recent commit history to distinguish intentional cleanup from accidental leftovers.
6. Separate evidence from hypotheses.
7. Define the smallest safe change set and explicit stop conditions.

## Evidence
For every material finding record location, observed behavior, impact, confidence, and verification method.

## Output
Return an architecture map, strengths, blockers, high-risk areas, quick wins, larger follow-ups, and a verification plan.

## Do not
Delete unfamiliar files merely because their names look temporary. Do not rewrite architecture before understanding it. Do not treat recovery backups as disposable. Do not report unverified runtime behavior as fact.

---
name: skill-router
description: Select the smallest useful combination of local agent skills for a task based on task type, technology, risk, and required verification.
---

# Skill Router

Classify the task by kind, technologies, risk, and verification needs.

## Routing rules

| Signal | Prefer |
|---|---|
| unknown or large repo | repository-audit |
| frontend visual change | anti-slop-frontend + visual-qa |
| animation/cinematic interaction | anti-slop-frontend + visual-qa + performance checks |
| external skill/library | github-skill-discovery + external-skill-review |
| data/recovery/migration | repository-audit + verification |
| production/security change | repository-audit + external-skill-review + verification |

Use the smallest useful skill set. Do not activate every skill by default.

## Output

Return JSON containing task, skills, risk, verification, and research_required.

Routing is selection only; do not claim a routed skill was executed.

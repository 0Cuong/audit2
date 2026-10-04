# audit2 Agent Skills

## Canonical layout

The repository uses `skills/<category>/<skill-name>/SKILL.md`. Each skill has YAML frontmatter with `name` and `description`, then a focused workflow. Supporting detail belongs in `references/` when a skill grows.

## Runtime model

1. Read the task.
2. Route to the smallest useful skill set.
3. Load supporting references only when required.
4. Inspect the repository before changing it.
5. Implement the smallest coherent change.
6. Run task-appropriate verification.
7. Record real evidence.

The local catalog is intentionally portable across coding agents. Host-specific installation paths are not part of project logic.

## Provenance

External candidates are tracked in `skills/registry.json`. A source is never considered adopted only because it is popular. License, maintenance, compatibility, security, and duplication are checked first.

Current curated research includes Leonxlnx/taste-skill, Vercel design-systems-to-agent-skills, Vercel web-interface-guidelines, and JustineBijuPaul/frontend-ai-skills. Only justified principles are adapted locally; no external installer or arbitrary source code is executed.

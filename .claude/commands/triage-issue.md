---
allowed-tools: Bash(gh issue view:*), Bash(gh issue edit:*), Bash(gh issue list:*), Bash(gh label list:*)
description: Triage a GitHub issue — apply labels only, no comments
---

## Context

- Issue to triage: $ARGUMENTS
- Available labels: !`gh label list --limit 50`

## Your task

Triage the GitHub issue number provided in $ARGUMENTS:

1. View the issue: `gh issue view $ARGUMENTS`
2. Check the available labels with `gh label list`
3. Apply the appropriate labels using `gh issue edit $ARGUMENTS --add-label "label1,label2"`

### Label selection rules

**Category labels** (pick the most relevant):
- `bug` — something isn't working as expected
- `enhancement` — new feature or improvement request
- `question` — more information is requested
- `documentation` — improvements or additions to docs

**Lifecycle labels** (only when clearly warranted):
- `needs-repro` — bug report lacks reproduction steps
- `needs-info` — missing essential information to proceed

### Constraints
- ONLY add labels from the list returned by `gh label list` — never create or guess label names
- Do NOT post any comments on the issue
- Be conservative: only add lifecycle labels when clearly warranted
- Your only action is adding or removing labels via `gh issue edit`

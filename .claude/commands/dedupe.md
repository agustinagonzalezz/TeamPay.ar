---
allowed-tools: Bash(gh issue view:*), Bash(gh issue list:*), Bash(gh issue comment:*), Bash(gh search issues:*)
description: Find duplicate GitHub issues and comment with potential duplicates
---

## Context

- Issue to check: $ARGUMENTS

## Your task

Find up to 3 likely duplicate issues for the GitHub issue number in $ARGUMENTS.

Follow these steps:

1. **Check if deduplication is needed**
   - View the issue: `gh issue view $ARGUMENTS --comments`
   - Skip if: the issue is closed, it's broad product feedback without a specific problem, or it already has a duplicates comment

2. **Summarize the issue**
   - Extract the core problem, error messages, environment details, and reproduction steps

3. **Search for duplicates in parallel** using diverse approaches:
   - Search by error message keywords
   - Search by feature/component name
   - Search by user-reported behavior
   - Search by title similarity
   - Example: `gh search issues "error message here" --repo owner/repo --state open --limit 10`

4. **Filter false positives**
   - Only keep issues that describe the same root cause
   - Discard tangentially related issues

5. **Comment with findings** (only if real duplicates found):
   ```
   gh issue comment $ARGUMENTS --body "Potential duplicates found:
   - #<issue1>: <title>
   - #<issue2>: <title>
   - #<issue3>: <title>"
   ```

### Constraints
- Do not proceed if no real duplicates are found
- Maximum 3 duplicates per comment
- Be precise: similar symptoms ≠ same bug

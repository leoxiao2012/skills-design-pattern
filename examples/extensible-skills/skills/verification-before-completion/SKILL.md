---
name: verification-before-completion
description: "Use before claiming work is complete, fixed, passing, ready, verified, or implemented. Requires fresh verification evidence."
---

<!-- skills-hooks:start -->
## Project Hooks

This skill participates in project-level orchestration.

At runtime, load `.skills/hooks.yaml` if it exists and apply these hook events:

- `before_skill.<current_skill>`: before starting this skill.
- `after_skill.<current_skill>`: after this skill completes successfully.
- `before_claim.*`: before saying or implying that work is complete, fixed, passing, ready, verified, or implemented.
- `on_error.<current_skill>` and `on_error.*`: after this skill hits a recoverable error or blocker.

For `before_claim.*`, set hook context before applying hooks:

- `claim_type`: one of `complete`, `fixed`, `passing`, `ready`, `verified`, or `implemented`.
- `claim_text`: the sentence you were about to say.
- `evidence`: commands, checks, files, or observations already collected.

If a `before_claim` hook runs verification and fails, do not make the claim. Report the failed verification instead.

For `on_error.*`, set hook context before applying hooks:

- `error_type`: one of `missing_input`, `command_failed`, `verification_failed`, `ambiguous_instruction`, `blocked`, or `unexpected`.
- `error_message`: a concise description of the failure.
- `error_recoverable`: whether another skill can reasonably help.
- `failed_command`: the command string, if any.

Only apply `on_error` when recovery is plausible. Do not recursively trigger the same error hook more than once in one execution chain.

Each hook entry uses one small protocol:

- `id`: stable hook identifier.
- `skill`: optional skill to invoke when the hook applies.
- `condition`: optional natural-language or simple expression condition.
- `required`: optional boolean, defaults to `false`; if `true` and the hook cannot be satisfied, stop instead of continuing.
- `description`: natural-language instruction for how to apply the hook.

Hooks are project-level orchestration. Do not treat `.skills/hooks.yaml` as this skill's internal workflow.
<!-- skills-hooks:end -->

# Verification Before Completion

No completion claim is valid without fresh evidence from the current session.

## Gate

Before claiming any work is complete, fixed, passing, ready, verified, or implemented:

1. Identify the command or inspection that proves the claim.
2. Run the full command freshly.
3. Read the full output and exit code.
4. Compare the output to the claim.
5. Report the actual state with evidence.

If the command fails, say what failed and do not claim completion.

## Evidence Examples

| Claim | Required evidence |
| --- | --- |
| Tests pass | Test command output with zero failures |
| Build passes | Build command exits 0 |
| Lint clean | Linter exits 0 with no errors |
| Bug fixed | Reproduction or regression test passes |
| Task complete | Plan checklist item is satisfied and verification passed |
| Requirements met | Requirements checklist maps to implemented behavior |

## Red Flags

Stop and verify before using phrases like:

- "done"
- "complete"
- "fixed"
- "passes"
- "ready"
- "works"
- "should be fine"

## Output Format

Report verification compactly:

```text
Verification:
- Command: `npm test`
- Result: exit 0
- Evidence: 42 tests passed, 0 failed
```

If verification is incomplete:

```text
Verification:
- Command: `npm test`
- Result: exit 1
- Evidence: 2 tests failed in auth/session.test.ts
- Status: Not complete
```

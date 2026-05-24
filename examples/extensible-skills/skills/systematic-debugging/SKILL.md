---
name: systematic-debugging
description: "Use when a failure, regression, or confusing behavior needs diagnosis before more changes are made."
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

# Systematic Debugging

Diagnose the problem before changing code. The goal is to identify the failing behavior, isolate the cause, and apply the smallest fix that can be verified.

## Process

1. State the observed failure and the expected behavior.
2. Reproduce the failure with the smallest command, test, or manual flow available.
3. Capture the exact error message, logs, or failing assertion.
4. Form one hypothesis at a time.
5. Inspect the smallest relevant code path.
6. Add or identify a regression test if the failure is code-related.
7. Make the smallest change that addresses the proven cause.
8. Run the reproduction again.
9. Run the relevant broader verification.

## Rules

- Do not make speculative fixes.
- Do not change unrelated code while debugging.
- Do not claim the issue is fixed until the original reproduction passes.
- If multiple causes are possible, test them separately.
- If reproduction is impossible, say what evidence is missing and ask the user for it.

## Completion

Set `debugging_complete = true` only when:

- the original failure has been reproduced or convincingly explained
- the cause has been identified
- the fix has been verified with fresh evidence
- any follow-up risk is documented

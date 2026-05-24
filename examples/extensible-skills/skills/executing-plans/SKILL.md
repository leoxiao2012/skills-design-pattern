---
name: executing-plans
description: "Use when an approved implementation plan should be executed task by task with verification checkpoints."
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

# Executing Plans

Load an approved implementation plan, review it critically, execute it task by task, and verify each completed batch before claiming progress.

## Process

1. Announce: "I'm using the executing-plans skill to implement this plan."
2. Locate and read the approved plan.
3. Review the plan before modifying files:
   - Is every task concrete enough to execute?
   - Are commands and expected results specified?
   - Are file paths plausible?
   - Are there missing dependencies or risky assumptions?
4. If the plan has critical gaps, stop and ask the user before implementation.
5. If the plan is executable, create a task checklist from the plan.
6. For each task:
   - mark it in progress
   - follow the plan steps exactly
   - run the specified verification commands
   - record evidence before claiming completion
   - mark it complete only after verification passes
7. Before claiming a task or batch is complete, expose the intended claim so project-level `before_claim` hooks can require verification.
8. After all tasks complete, run the full final verification requested by the plan.

## Stop Conditions

Stop and ask for help when:

- a command repeatedly fails
- the plan references missing files, symbols, or dependencies
- verification fails and the fix is not obvious
- the user changes scope
- continuing would require guessing

## Rules

- Do not skip verification steps.
- Do not claim success based on intuition.
- Do not start implementation without an approved plan.
- Do not silently change the plan's architecture.
- If a small deviation is necessary, explain it and update the plan or ask for approval.

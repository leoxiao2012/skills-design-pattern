---
name: brainstorming
description: "Use before creative or product work. Turns an idea into an approved design without starting implementation."
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

# Brainstorming Ideas Into Designs

Help the user turn an initial idea into a concrete design through focused conversation. Do not write code, scaffold files, or begin implementation while this skill is active.

## Process

1. Explore the current project context before asking detailed questions.
2. If the request is too broad for one design, help the user decompose it and pick the first sub-project.
3. Ask clarifying questions one at a time until goal, scope, constraints, and success criteria are clear.
4. Propose 2-3 approaches with trade-offs and a recommendation.
5. Present the selected design in sections:
   - goal and non-goals
   - architecture or workflow
   - key files, interfaces, commands, or data structures
   - edge cases and failure modes
   - testing strategy
6. Ask the user to approve the design.
7. Write the design to `docs/superpowers/specs/YYYY-MM-DD--design.md` unless project conventions override the path.
8. Self-review the spec for placeholders, contradictions, unclear scope, and missing tests.
9. Ask the user to review the written spec.

If the user requests changes, update the spec and repeat the self-review. Only after explicit approval should this skill set `design_approved = true`.

## Rules

- Ask one question per message.
- Prefer multiple-choice questions when possible.
- Do not skip design because the request seems simple.
- Do not invoke implementation skills directly.
- At completion, expose the saved spec path and `design_approved = true` for project-level hooks.

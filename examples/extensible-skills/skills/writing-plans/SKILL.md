---
name: writing-plans
description: "Use after an approved design or requirements document, before touching code."
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

# Writing Plans

Create a complete implementation plan that another agent or engineer can execute without conversation history. Do not modify production code while this skill is active.

## Inputs

Use the approved design document as the primary input. If the spec path is unknown, inspect likely locations such as:

- `docs/superpowers/specs/`
- `docs/specs/`
- project-specific docs directories

If there is no approved design, stop and ask for one.

## Process

1. Announce: "I'm using the writing-plans skill to create the implementation plan."
2. Read the approved design and relevant project files.
3. Check scope. If the design contains independent subsystems, recommend separate plans.
4. Map the file structure before writing tasks:
   - files to create
   - files to modify
   - tests to add or update
   - commands to run
5. Write the plan to `docs/superpowers/plans/YYYY-MM-DD--implementation-plan.md` unless project conventions override the path.
6. Break work into small tasks that each leave the repo in a coherent state.
7. Include exact commands, expected results, and test data where relevant.
8. Self-review the plan against the approved design.
9. Ask the user to approve the plan and choose an execution mode.

## Plan Format

Every plan must start with:

```markdown
# [Feature Name] Implementation Plan

> **For agentic workers:** Use `executing-plans` for inline execution, or a subagent workflow if available.

**Goal:** [One sentence describing what this builds]
**Architecture:** [2-3 sentences about the implementation approach]
**Tech Stack:** [Key technologies, libraries, and commands]

---
```

Each task should use checkbox syntax:

```markdown
### Task N: [Component Name]

**Files:**
- Create: `exact/path/to/new_file`
- Modify: `exact/path/to/existing_file`
- Test: `exact/path/to/test_file`

- [ ] Step 1: Write the failing test
- [ ] Step 2: Run the test and confirm the expected failure
- [ ] Step 3: Implement the minimal change
- [ ] Step 4: Run the test and confirm it passes
- [ ] Step 5: Commit the task
```

## Quality Bar

Never write placeholders such as "TBD", "TODO", "add validation", "handle edge cases", or "write tests" without concrete details.

Every task must include enough detail for a skilled engineer with no project context:

- exact file paths
- exact symbols, commands, or interfaces
- concrete test cases
- expected command output or success criteria
- commit boundaries

## Completion

After saving and self-reviewing the plan, ask:

```text
Plan complete and saved to `[path]`.

Two execution options:
1. Subagent-driven execution, if the runtime supports it.
2. Inline execution with `executing-plans`.

Which approach?
```

Only set `plan_approved = true` after explicit approval. If the user chooses inline execution, set `execution_mode = 'inline'` for project-level hooks.

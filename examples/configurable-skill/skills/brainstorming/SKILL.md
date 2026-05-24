---
name: brainstorming
description: "Use before creative or product work. Turns an idea into an approved design without starting implementation."
---

# Brainstorming Ideas Into Designs

Help the user turn an initial idea into a concrete design through focused conversation. Do not write code, scaffold files, or begin implementation while this skill is active.

## Required Setup

Read `workflow.yaml` in this skill directory before doing any work. Treat it as the source of truth for this skill's process.

If `workflow.yaml` is missing, malformed, or ambiguous, stop and ask the user to fix the configuration.

## Execution Contract

Follow the configured workflow exactly:

- Execute steps in order.
- Do not skip a step unless its `when` condition is explicitly false.
- For each step, follow `instruction`, obey `rules`, and satisfy `completion`.
- If a step has `outputs`, produce those outputs before moving on.
- If a step has `gate: user_approval`, pause and wait for explicit user approval.
- If the user rejects a section, revise that section and ask again before continuing.
- When all steps are complete, perform only the configured `terminal_action`.

## Operating Principles

- One question per message.
- Prefer concrete multiple-choice questions when the choice space is clear.
- Explore the current project before proposing a design.
- Always present alternatives before settling on one design.
- Keep the design sized to the work: short for simple changes, detailed for complex systems.
- Do not treat simplicity as permission to skip design.
- Capture decisions explicitly so the next skill or engineer can implement without guessing.
- Keep unrelated refactors out of scope unless they directly support the requested work.

## Design Quality Bar

A completed design must answer:

- What user problem or workflow is being solved?
- What is in scope and out of scope?
- Which approach was chosen, and why?
- What files, modules, services, or interfaces are likely affected?
- What data flows through the system?
- What edge cases and failure modes matter?
- How will the work be tested?

Do not transition out of this skill until the configured user review gate is complete.

# 配置化 Skills

## Intent

把单个 Skill 的 workflow、process flow、检查点和终止动作从 `SKILL.md` 中抽离出来，放入该 Skill 自己的配置文件。`SKILL.md` 负责解释和执行流程，配置文件负责表达流程。

## Problem

很多 Skill 会把完整流程硬编码在 `SKILL.md` 中。例如一个 brainstorming Skill 可能直接写死探索上下文、询问澄清问题、提出方案、产出设计文档、转入计划 Skill 等步骤。

这种方式简单直接，但当团队想调整顺序、增加检查点、替换终止动作或复用同一个 Skill 的不同流程变体时，就必须修改 `SKILL.md`。这会让 Skill 的稳定行为和团队流程混在一起。

## Forces

- Skill 的核心能力应该稳定，团队流程可能频繁变化。
- 流程变体应该容易审查和版本化，而不是散落在长篇提示词中。
- 配置需要足够表达步骤、条件、用户确认点和终止动作，但不能复杂到变成一套新的编程语言。
- `SKILL.md` 仍然需要对 Agent 给出明确约束，避免 Agent 自由解释配置。

## Solution

让 `SKILL.md` 成为一个稳定的流程解释器，并把流程放到 Skill 本地的 YAML 文件中。

典型结构：

```text
skills/brainstorming/
  SKILL.md
  workflow.yaml
```

`SKILL.md` 只描述通用执行规则：

- 读取同目录下的 `workflow.yaml`。
- 按 `workflow.steps` 顺序执行。
- 每一步必须满足 `completion` 后才能进入下一步。
- 遇到 `gate` 时暂停并请求用户确认。
- 只允许执行 `terminal_action` 指定的后续动作。
- 如果配置缺失或无法解析，停止并向用户说明问题。

## Example

`skills/brainstorming/SKILL.md` 示例：

```markdown
---
name: brainstorming
description: "Turn an idea into a validated design before implementation."
---

# Brainstorming

Read `workflow.yaml` in this skill directory before doing any work.

Follow the configured workflow exactly:

- Execute steps in order.
- Do not skip a step unless its `when` condition is explicitly false.
- For each step, follow its `instruction` and satisfy its `completion`.
- If a step has `gate: user_approval`, pause and wait for user approval.
- When all steps are complete, perform only the configured `terminal_action`.

If `workflow.yaml` is missing, malformed, or ambiguous, stop and ask the user to fix the configuration.
```

`skills/brainstorming/workflow.yaml` 示例：

```yaml
version: 1
skill: brainstorming

workflow:
  steps:
    - id: explore_context
      instruction: "Inspect the current project structure, docs, and recent changes before asking questions."
      completion: "You can summarize the relevant current state and constraints."

    - id: clarify_intent
      instruction: "Ask one clarifying question at a time until goal, success criteria, scope, and constraints are clear."
      completion: "The user intent is stable enough to propose approaches."

    - id: propose_approaches
      instruction: "Present 2-3 viable approaches with trade-offs and a recommendation."
      completion: "The user has selected or accepted one approach."

    - id: present_design
      instruction: "Present the design in sections sized to the complexity of the request."
      completion: "The design is concrete enough for implementation planning."
      gate: user_approval

    - id: write_design_doc
      instruction: "Write the approved design to docs/specs/YYYY-MM-DD--design.md."
      completion: "The design document exists and has no placeholders or contradictions."

  terminal_action:
    type: stop
    reason: "Brainstorming is complete. Project-level hooks may choose a next skill."
```

## Consequences

收益：

- 单个 Skill 的流程更容易改动和审查。
- 不同团队可以复用同一个 `SKILL.md`，只维护自己的 `workflow.yaml`。
- Skill 的稳定执行约束和业务流程配置分离。

代价：

- Agent 必须先读取并理解配置，启动成本略高。
- YAML 表达能力需要控制边界，否则会演变成难以调试的 DSL。
- 配置错误会直接影响 Skill 执行质量，因此需要明确失败策略。

适用场景：

- 单个 Skill 内部流程较长。
- 流程经常被团队、项目或阶段调整。
- 需要在不同项目中复用同一类 Skill，但每个项目的执行步骤略有不同。

不适用场景：

- Skill 只有一两个固定动作。
- 流程变化本身需要改动 Skill 的核心能力，而不只是调整步骤。

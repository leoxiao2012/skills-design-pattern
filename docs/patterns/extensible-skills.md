# 可扩展 Skills

## Intent

用一个项目级 hooks 配置文件定义多个 Skills 之间的编排关系，让项目可以在某个 Skill 执行前、执行后、声明完成前或失败时插入额外 Skill 或动作。

## Problem

有些团队不只是想修改一个 Skill 的内部流程，而是想把多个 Skills 组装成项目自己的工作流。例如：

- brainstorming 完成并获得批准后，自动进入 writing-plans。
- writing-plans 完成后，自动触发 checklist 或 review。
- implementation 前必须先运行 security-review。
- 任意 Skill 失败时进入 systematic-debugging 或 recovery Skill。

如果每个 Skill 都在自己的 `SKILL.md` 中硬编码下一个 Skill，就会产生强耦合：Skill 之间互相知道太多，项目也很难替换编排顺序。

## Forces

- 跨 Skill 编排属于项目策略，不应该散落在每个 Skill 内部。
- 一个项目应该只有一个权威 hooks 配置文件，避免多个 Skill 各自声明编排逻辑。
- Hooks 应该能通过初始化命令创建，让项目有固定入口。
- Hooks 应该表达粗粒度生命周期扩展点，而不是描述某个 Skill 的内部步骤。
- 编排必须有循环防护和失败策略，避免 Skill 无限调用。

## Solution

在项目级目录中维护唯一的 hooks 配置文件，例如：

```text
.skills/
  hooks.yaml
```

该文件可以由 SDP CLI 初始化生成。`sdp` 是 Skills Design Patterns 的缩写：

```bash
sdp init
```

初始化后的项目约定：

- CLI 在安装或初始化时，为每个 `SKILL.md` 注入统一的 hooks loader 片段。
- Skill 根据自身名称和当前粗粒度生命周期事件查询匹配的 hooks。
- hooks 可以触发其他 Skill，也可以要求执行检查、生成文档或请求用户确认。
- `.skills/hooks.yaml` 是项目级编排入口，不放在任何单个 Skill 目录内。
- 单个 Skill 不需要手写 hooks 说明，避免不同技能的扩展协议不一致。

这与配置化 Skills 的边界不同：

- `skills/<name>/workflow.yaml` 配置的是一个 Skill 内部怎么做。
- `.skills/hooks.yaml` 配置的是多个 Skills 之间怎么连接。

## Hook Points

推荐从少量稳定扩展点开始：

```yaml
version: 1

hooks:
  before_skill: {}
  after_skill: {}
  before_claim: {}
  on_error: {}
```

常见语义：

- `before_skill`：某个 Skill 启动前触发。
- `after_skill`：某个 Skill 正常完成后触发。
- `before_claim`：Agent 准备声明完成、修复或通过前触发。
- `on_error`：某个 Skill 失败、配置缺失或用户拒绝关键 gate 时触发。

## Hook Entry Protocol

每条 hook 只使用一组小而统一的字段：

- `id`：稳定 hook 标识。
- `skill`：可选，需要触发的 Skill。
- `condition`：可选，触发条件，可以是简单表达式或自然语言条件。
- `required`：可选，默认为 `false`；为 `true` 且 hook 无法满足时，停止而不是继续。
- `description`：自然语言说明，也是给 Agent 的执行提示。

不要在 hook 中引入 `action`、`state`、`message`、`when` 等重复字段。条件统一写入 `condition`，执行提示统一写入 `description`。

## Example

`.skills/hooks.yaml` 示例：

```yaml
version: 1

hooks:
  before_skill:
    writing-plans:
      - id: require_approved_design
        condition: "design_approved == true"
        required: true
        description: "Writing an implementation plan requires an approved design. If no approved design exists, stop and ask the user to approve or provide one."

  after_skill:
    brainstorming:
      - id: continue_to_plan
        skill: writing-plans
        condition: "design_approved == true"
        description: "After an approved design is produced, continue by writing an implementation plan."

    writing-plans:
      - id: execute_inline_plan
        skill: executing-plans
        condition: "plan_approved == true && execution_mode == 'inline'"
        description: "If the user approved the plan and chose inline execution, continue by executing the plan."

  before_claim:
    "*":
      - id: require_fresh_verification
        skill: verification-before-completion
        condition: "claim_type in ['complete', 'fixed', 'passing', 'ready', 'verified', 'implemented']"
        required: true
        description: "Before claiming completion, fixes, passing checks, readiness, verification, or implementation, require fresh verification evidence."

  on_error:
    "*":
      - id: debug_recoverable_failure
        skill: systematic-debugging
        condition: "error_recoverable == true"
        description: "When a recoverable error occurs, switch to systematic debugging instead of guessing."
```

`sdp` CLI 可以为支持 hooks 的 Skill 统一注入如下片段，而不是要求每个 `SKILL.md` 手写：

```markdown
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
```

CLI 注入流程示例：

```bash
sdp init
sdp hooks inject skills/
```

`sdp hooks inject` 可以扫描 `skills/**/SKILL.md`，通过 frontmatter 中的 `name` 字段识别技能名称，并把 `.skills/hooks-loader.md` 插入或更新到固定标记之间。这样 hooks 协议只维护一份，不会因为手写内容而漂移。

## Execution Rules

为了避免 hooks 变成不可控的隐式流程，建议约定以下规则：

- 读取顺序固定：由 CLI 注入的 hooks loader 读取项目级 `.skills/hooks.yaml`，再执行当前 Skill 生命周期事件。
- 匹配顺序固定：精确 Skill 名称优先，`"*"` 通配规则后执行。
- 失败策略显式：hook 失败时默认停止当前链路，除非 hook 标记为 `optional: true`。
- 循环防护必需：同一执行链中，同一个 `skill + hook id` 不能重复触发。
- 用户 gate 优先：如果当前 Skill 需要用户批准，`after_skill` hooks 只能在批准后触发。
- 最小权限：hooks 只能触发声明的 Skill 或声明的安全动作，不能执行任意 shell 命令，除非项目另有显式安全策略。

## Consequences

收益：

- 项目可以集中管理跨 Skill 编排逻辑。
- 单个 Skill 不需要硬编码下游 Skill，复用性更好。
- 团队可以通过 `.skills/hooks.yaml` 组合出自己的工作流。
- 初始化命令让项目约定清晰，类似其他工具在项目根目录生成 `.specify/`、`.github/` 或类似配置目录。

代价：

- 执行链路变得间接，需要工具或日志帮助解释“为什么触发了下一个 Skill”。
- hooks 可能制造隐式副作用，必须限制触发范围和失败策略。
- 多个 hooks 组合后可能产生顺序依赖，需要保持配置简洁。

适用场景：

- 一个项目需要把多个 Skills 串成稳定工作流。
- 团队希望在已有 Skills 前后插入审查、检查、同步或诊断步骤。
- 项目需要统一治理 Skill 编排，而不是改每个 Skill。

不适用场景：

- 只想改变单个 Skill 内部步骤，此时应使用配置化 Skills。
- Skill 之间没有稳定的生命周期关系。
- 项目无法接受隐式触发下一个 Skill 的行为。

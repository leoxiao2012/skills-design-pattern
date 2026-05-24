# 配置化 Skill 示例：Brainstorming

这个示例以类似 superpowers 的 brainstorming 技能为原型，展示如何把单个 Skill 的内部流程放到同目录 `workflow.yaml` 中。

```text
skills/brainstorming/
  SKILL.md
  workflow.yaml
```

`SKILL.md` 定义稳定执行规则，`workflow.yaml` 定义具体流程、检查点、用户 gate 和输出文档。这个示例可以直接作为 Agent Skill 的起点使用。

核心边界：这里配置的是 brainstorming 自己内部怎么做，不负责组装其他 Skills 的项目级执行链。如果项目希望在 brainstorming 完成后自动进入 writing-plans，应使用项目级 `.skills/hooks.yaml`。

# Agent Skills 设计模式索引

Agent Skills 可以像传统软件工程一样沉淀可复用的设计模式。一个好的 Skill 不只是把提示词写进 `SKILL.md`，还应该明确哪些部分稳定、哪些部分应该被配置、哪些部分允许被项目扩展。

## 模式

| 模式 | 解决问题 | 典型配置 |
| --- | --- | --- |
| [配置化 Skills](patterns/configurable-skills.md) | 单个 Skill 内部怎么做 | `skills/<name>/workflow.yaml` |
| [可扩展 Skills](patterns/extensible-skills.md) | 多个 Skills 如何组装 | `.skills/hooks.yaml` |

## 示例

- [配置化 Skill 示例](../examples/configurable-skill/)
- [可扩展 Skills 示例](../examples/extensible-skills/)

## 边界原则

单个 Skill 的内部流程不要写进 `.skills/hooks.yaml`，跨 Skill 的编排关系不要写进单个 Skill 的 `workflow.yaml`。


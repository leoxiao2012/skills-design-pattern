# Agent Skills 设计模式

本文档已拆分为更稳定的索引和独立模式文档：

- [设计模式索引](index.md)
- [配置化 Skills](patterns/configurable-skills.md)
- [可扩展 Skills](patterns/extensible-skills.md)

## 核心边界

配置化 Skills 解决的是一个 Skill 内部怎么做，典型配置是 `skills/<name>/workflow.yaml`。

可扩展 Skills 解决的是多个 Skills 如何组装，典型配置是项目级唯一的 `.skills/hooks.yaml`。

单个 Skill 的内部流程不要写进 `.skills/hooks.yaml`，跨 Skill 的编排关系不要写进单个 Skill 的 `workflow.yaml`。


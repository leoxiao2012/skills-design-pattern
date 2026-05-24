# 可扩展 Skills 示例：项目级工作流编排

这个示例以类似 superpowers 的技能集合为原型，展示项目级唯一 `.skills/hooks.yaml` 如何组装多个 Skills。

```text
.skills/
  hooks.yaml
  hooks-loader.md
skills/
  brainstorming/
    SKILL.md
  writing-plans/
    SKILL.md
  executing-plans/
    SKILL.md
  systematic-debugging/
    SKILL.md
  verification-before-completion/
    SKILL.md
```

核心边界：`.skills/hooks.yaml` 配置跨 Skill 编排，不描述某个 Skill 的内部步骤。

初始化命令：

```bash
sdp init
```

该命令生成 `.skills/hooks.yaml`。

hooks loader 不需要每个技能手写。CLI 可以统一注入：

```bash
sdp hooks inject skills/
```

注入器扫描 `skills/**/SKILL.md`，读取 frontmatter 中的 `name`，并把 `.skills/hooks-loader.md` 插入到固定标记之间。这样每个 Skill 的主体只描述自身能力，跨 Skill 编排由 `.skills/hooks.yaml` 和 CLI 注入片段共同处理。

本示例的默认链路：

1. `brainstorming` 产出并确认设计。
2. `after_skill.brainstorming` 触发 `writing-plans`。
3. `writing-plans` 产出计划并让用户选择执行方式。
4. 如果选择 inline execution，`after_skill.writing-plans` 触发 `executing-plans`。
5. 任意技能准备声明完成、修复或通过前，`before_claim.*` 触发 `verification-before-completion`。
6. 任意技能遇到可恢复错误时，`on_error.*` 触发 `systematic-debugging`。

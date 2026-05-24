# Agent Skills Design Patterns

本项目收集 Agent Skills 的设计模式，目标是像传统软件工程模式一样，为 Skill 的设计、组合、配置和扩展提供可复用的结构。

## 已收录模式

- [配置化 Skills](docs/patterns/configurable-skills.md)：用外部配置描述单个 Skill 的内部流程。
- [可扩展 Skills](docs/patterns/extensible-skills.md)：用项目级 hooks 配置组装多个 Skills 的执行逻辑。

## 文档入口

- [设计模式索引](docs/index.md)
- [兼容入口](docs/agent-skills-design-patterns.md)

## 示例

- [配置化 Skill 示例](examples/configurable-skill/)
- [可扩展 Skills 示例](examples/extensible-skills/)

## CLI

本仓库提供一个最小 TypeScript CLI：`sdp`，表示 Skills Design Patterns。

```bash
npm run build
node dist/cli.js init
node dist/cli.js hooks inject skills/
```

打包或链接后可直接使用：

```bash
sdp init
sdp hooks inject skills/
```

## 核心边界

配置化 Skills 解决的是一个 Skill 内部怎么做，典型配置是 `skills/<name>/workflow.yaml`。

可扩展 Skills 解决的是多个 Skills 如何组装，典型配置是项目级唯一的 `.skills/hooks.yaml`。

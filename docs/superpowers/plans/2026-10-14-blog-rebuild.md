# onlylo Astro 博客改造 Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development for the isolated content migration task; the coordinating agent integrates the site and performs browser verification. Steps use checkboxes. No git commits/worktrees: this directory has no source repository.

**Goal:** 把已认可的卡片原型变成可维护、可构建的正式博客，并整理八篇真实笔记。

**Architecture:** Astro 7 + 内容集合输出静态页面。原始笔记经可重复导入脚本生成规范文章；共享布局和组件维持原型视觉，全站搜索由构建时生成的内容索引驱动。

**Tech Stack:** Astro 7, TypeScript, Markdown/Shiki, vanilla browser JavaScript, Node tests, Python Playwright.

---

### Task 1: 迁移笔记（独立任务）
Files: scripts/note-catalog.mjs, scripts/import-notes.mjs, tests/import-notes.test.mjs, src/content/notes/*.md, docs/content-migration.md.
- [x] 先写迁移核心测试：保留代码/正文、清理导出 HTML 样式、丢失图片占位、确定性导入、凭据仅替换副本。
- [x] 读取八篇正文，设置 title/description/category/tags/cover/series/seriesOrder/date?/importedAt。
- [x] 实现脚本，导入完整内容，保留原文；记录缺失图片和替换位置，不输出凭据值。
- [x] 测试通过，检查系列六篇完整及跳过 Day 04。

### Task 2: 框架与组件
Files: package.json, package-lock.json, astro.config.mjs, tsconfig.json, src/content.config.ts, src/lib/notes.ts, src/layouts/Base.astro, src/components/*, src/styles/*, src/scripts/site.ts, static/*.
- [x] 备份旧 package 配置到 docs/legacy；安装 Astro 与 check 依赖。
- [x] 内容 schema 与站点元数据、URL 辅助函数、摘要和阅读时长。
- [x] 从 04-cards.html 提取视觉资产与样式，分为 Header/Icons/Hero/PostCard/Sidebar/ProjectCard。
- [x] 实现搜索（标题、标签及正文）、分类过滤、主题切换、移动菜单。

### Task 3: 页面与文章
Files: src/pages/index.astro, notes/index.astro, notes/[...slug].astro, series/[slug].astro, projects/index.astro, about/index.astro, 404.astro, search-index.json.ts, rss.xml.ts, sitemap.xml.ts, [...legacy].astro.
- [x] 首页真实文章、系列入口、项目；列表分类/标签/搜索查询参数。
- [x] 文章完整 Markdown、目录与移动目录、代码复制、系列前后篇、阅读进度。
- [x] 系列页列实际六篇，说明 Day 04 无独立笔记；其他页面真实文案。
- [x] 两篇旧地址跳转，RSS/sitemap/SEO 与本地资源。

### Task 4: 交付与验证
Files: .github/workflows/deploy.yml, README.md, .gitignore, tests/site/build.test.mjs, scripts/verify-authoring.mjs, docs/verification/*.
- [x] 编写构建页面验证：八篇正文、内部链接、旧地址、搜索索引、系列内容。
- [x] Node tests + npm run check + npm run build；修复实际问题。
- [x] 在生产预览中验证搜索/筛选/长文/主题/复制/目录/移动端；截图。
- [x] 独立代码审查，修复后重跑对应验证。
- [x] GitHub Pages 工作流，README 安装/写作/导入/部署；更新历史方案状态。


验证记录：14 项内容迁移与搜索测试、7 项生成站点测试、短文与草稿写作流程、浏览器 42 组响应式检查与主要交互。最终命令结果、截图和已知资源缺失见 docs/verification/2026-10-14-report.md。

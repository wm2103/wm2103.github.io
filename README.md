# onlylo 个人博客

Astro 静态博客，采用已确认的 Heo / 安知鱼方向：模块化首屏、彩色分类、双列文章与个人侧栏。支持完整 Markdown 文章、系列、标签筛选、全文搜索、文章目录、代码复制、深浅色主题、RSS。

## 本地运行

推荐 Node.js 24 LTS（当前依赖最低要求 22.19），使用 npm：

~~~sh
npm ci
npm run dev
~~~

浏览器打开终端显示的地址，默认 http://127.0.0.1:4321。

当前电脑的全局 Node 为 20，本项目已经单独安装 Node 24 到忽略的 .tools 目录。启动脚本会在全局 Node 版本较低时自动使用它。其他机器可以直接安装 Node 24；也可选择项目内安装：

~~~sh
npm install --prefix .tools node@24 --no-save
~~~

构建与验证：

~~~sh
npm test
npm run check
npm run build
npm run test:site
npm run preview
~~~

额外验证新增短文与草稿流程：`node scripts/verify-authoring.mjs`。脚本临时创建两篇验证文章，检查后自动清理并重新构建原内容。浏览器交互验证可在预览服务启动后运行 `python scripts/verify-browser.py`（需要 Python Playwright 与 Chrome）。

静态产物在 dist/。这是正式站点，需要通过本地开发/预览服务器查看；之前可双击的设计稿仍在 previews/04-cards.html。

## 写一篇新笔记

在 `src/content/notes/` 新建 Markdown 文件，例如 `redis-locks.md`。文件名会决定地址 `/notes/redis-locks/`，文章发布后尽量不要改名；否则链接和搜索索引里的地址也会变化。

~~~yaml
---
title: Redis 锁的学习记录
description: 记录锁的基本用途、实现思路和注意事项。
category: web
tags:
  - Redis
  - Java
cover: web
date: 2026-10-14
draft: false
---
~~~

字段说明：

- `title`、`description`、`category` 是必填项。分类目前可填 `web`（开发笔记）或 `ai`（深度学习）。
- `tags` 是可选标签列表；同名标签会自动出现在笔记页筛选区，不需要额外配置。
- `cover` 可选 `web`、`neural`、`sky`，省略时默认 `web`。
- `date` 填原始发布日期，格式为 `YYYY-MM-DD`。不确定原始日期时省略它，可用 `importedAt` 记录整理日期；不要用文件修改时间冒充发布日期。
- `draft: true` 会让文章暂不生成页面、搜索索引、RSS 项和 sitemap 地址；准备发布时改为 `false` 或删除该字段。
- 苍穹外卖系列文章使用 `series: sky-takeout`，并为每篇设置唯一的正整数 `seriesOrder`。
- `sourceLabel` 可标注课程、书籍或其他原始资料来源。

随后正常写 Markdown。目录从一到三级标题自动生成；代码使用带语言名称的围栏，例如 `~~~java`。新增图片放在 `static/images/`，在正文中写 `![说明](/images/example.png)`。文章和图片使用能看懂用途的名称，避免依赖随机远程封面。

本博客直接发布 `src/content/notes/` 中的 Markdown。`docs/notes/` 是原始整理材料，不会自动发布。`npm run import:notes` 仅用于重新生成迁移清单中的旧笔记副本；新写的笔记不要加入该导入流程。

## 笔记分类如何工作

文章 frontmatter 的 `category` 保存稳定的分类标识，例如 `web`；页面展示的中文名、首页分类入口和分类筛选配置集中在 `src/lib/categories.ts`。其中 `categorySlugs` 会供 `src/content.config.ts` 的 Zod schema 校验文章分类；拼错或未定义的分类会在构建时被拒绝。

构建时，`allNotes()` 读取笔记集合并排除草稿。`PostCard.astro` 把分类标识写入卡片的 `data-category`，同时用分类配置显示中文名。`FilterBar.astro` 根据配置生成分类按钮，首页 `Hero.astro` 根据同一份配置生成分类入口。浏览器脚本 `src/scripts/site.ts` 读取按钮和卡片上的 `data-*` 属性，按分类显示文章，并处理 `/notes/?category=web` 这样的筛选地址。文章页的面包屑、文章分类标签和 `search-index.json` 也使用分类中文名映射。

要新增分类，例如“读书笔记”，在 `src/lib/categories.ts` 的 `categoryDefinitions` 中增加一个唯一 slug 和对应的中文名、描述、色调及图标。schema、首页入口、笔记筛选、文章展示和搜索数据会自动读取新配置；选择已有的 `blue`、`coral` 或 `green` 色调，以及 `src/components/Icons.astro` 中已定义的图标名。若要在“关于”页面单独介绍这个分类，再编辑 `src/pages/about/index.astro`。标签与分类不同：标签只需写在文章的 `tags` 中，不需要修改配置。

## 本地预览与发布

本地预览：

~~~powershell
npm run dev
~~~

检查笔记 schema 和页面构建：

~~~powershell
npm run check
npm run build
npm run test:site
~~~

确认后提交并推送到 `main`，GitHub Actions 会自动验证、构建并部署到 `https://wm2103.github.io/`。新文章的地址可在本地预览检查后再发布。

## 本次笔记整理

已导入两篇旧笔记，以及 docs/notes 中苍穹外卖 Day 01/02/03/05/06/07，共八篇。Day 04 没有独立笔记，系列保留缺号。新系列只标注整理日期。

- 原始输入：source/_posts/ 和 docs/notes/，均保留未修改。
- 发布副本：src/content/notes/，是当前站点的直接内容源。
- 导入目录清单与摘要：scripts/note-catalog.mjs。
- 重复导入：npm run import:notes；只覆盖清单内八篇，不会清除以后新写的文章。
- 修改导入文章的长期内容时，优先修改对应原文，再执行导入；直接改发布副本会在下次导入时被覆盖。
- 旧正文中的实际配置凭据已在发布副本替换成环境变量占位符；原始 docs/notes 默认被 Git 忽略，因此 CI 不执行重新导入，而直接构建已提交的发布副本。
- 六张本地图片没有提供，文章保留明确缺图说明。754 个语雀外链图片地址仍指向原站，未声称全部离线保存；失败时显示原图链接。
- 详细处理位置、来源校验值与缺图清单见 docs/content-migration.md。笔记属于课程/资料整理，保留来源及原有批注。

搜索索引在构建时包含完整文章的纯文本，打开搜索框后才下载。主题偏好存储在浏览器本地。Markdown 与 HTML 配图在构建时加入懒加载属性，长笔记随阅读位置加载图片。

## 维护项目与站点信息

- 首页与栏目：src/pages/ 与 src/components/。
- 项目介绍：src/pages/projects/index.astro 与 src/components/ProjectCard.astro。
- 个人资料：src/components/Profile.astro、src/pages/about/index.astro。
- 站点 URL：astro.config.mjs（可设置 SITE_URL 环境变量覆盖）。
- 样式：src/styles/base.css 为已确认原型的基础；site.css 为正式页面。
- 旧地址：src/pages/[...legacy].astro，兼容两篇旧文及归档、分类、标签入口。
- RSS / sitemap / robots / 搜索索引：src/pages/ 对应端点。

## 浏览统计

浏览数据由 Umami Cloud 保存并在其 Dashboard 中查看，不保存在 GitHub Pages 仓库。注册 Umami Cloud 后添加网站，域名填 `wm2103.github.io`，复制 Website ID。官方操作步骤见[添加网站](https://docs.umami.is/docs/add-a-website)和[收集数据](https://docs.umami.is/docs/collect-data)；本博客接入过程已记录在 [`umami-cloud-analytics`](src/content/notes/umami-cloud-analytics.md)。

本地可将 `.env.example` 复制为 `.env` 并填写 `UMAMI_WEBSITE_ID`；不要提交 `.env`。部署工作流已经内置当前 Umami 网站的公开 Website ID；如果以后更换统计网站，可以在 GitHub 仓库 Settings → Secrets and variables → Actions → Variables 中新增同名变量 `UMAMI_WEBSITE_ID`，它会覆盖工作流中的默认值。Website ID 会出现在网页源代码中，不是密码或 API 密钥。未配置 ID 时站点不会加载统计脚本。数据从启用后开始累计，不会补算接入前的历史访问。

Umami 脚本只在 `site` 配置的正式域名工作，忽略 URL 查询参数并尊重浏览器的 Do Not Track 信号。分类筛选只改变查询参数；博客关闭脚本自动追踪，并在每次文档加载时手动记录一次页面浏览，避免筛选操作被重复计数。

## GitHub Pages 发布

当前配置针对已有的用户站仓库 wm2103/wm2103.github.io，根路径 /。不适用于 project-name 子目录站点；若另建项目仓库，需先统一调整 base 和全站路径。

.github/workflows/deploy.yml 会在 main 推送时验证、构建并发布 dist/，PR 只验证构建不发布。首次启用需在 GitHub 仓库 Settings → Pages → Build and deployment 中选择 GitHub Actions。

当前源码仓库的 `main` 分支连接到 `wm2103/wm2103.github.io`。向 `main` 推送会触发上述 GitHub Actions 工作流；首次使用 GitHub Pages 时，在仓库 Settings → Pages → Build and deployment 中选择 GitHub Actions。

不要上传 node_modules、dist、.tools、原始含配置凭据的 docs/notes 或旧部署缓存。仅 dist/ 会成为公开站点；CI 不会发布 docs、原始笔记或预览目录。

## 旧站保留

source/、themes/、public/、Hexo 配置与 .deploy_git/ 保留在本地，便于对照迁移。旧 package.json / 锁文件备份在 docs/legacy/。新框架静态资源目录是 static/，不会把旧 public/ 自动打包进新站。


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

在 src/content/notes/ 新建英文固定文件名，例如 redis-locks.md。文件名决定地址 /notes/redis-locks/，发布后尽量不改。

~~~yaml
---
title: Redis 锁的学习记录
description: 记录锁的基本用途、实现思路和注意事项。
category: web
tags:
  - Redis
  - Java
cover: sky
date: 2026-10-14
draft: false
---
~~~

然后正常写 Markdown。category 可选 web（开发笔记）、ai（深度学习）；cover 可选 web、neural、sky。只有加入苍穹外卖系列的文章才添加 series: sky-takeout 和唯一的 seriesOrder。不确定原始日期时省略 date，用 importedAt 表示整理日期；不要用文件修改时间冒充发布日期。

draft: true 的文章不会生成页面、索引或订阅项。目录从一到三级标题自动生成。代码请写成带语言的围栏，Java 泛型等不要裸写在普通段落中。

新增图片放 static/images/，在 Markdown 中写 ![说明](/images/example.png)。文章名与截图应有明确用途，避免随机远程封面。

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

## GitHub Pages 发布

当前配置针对已有的用户站仓库 wm2103/wm2103.github.io，根路径 /。不适用于 project-name 子目录站点；若另建项目仓库，需先统一调整 base 和全站路径。

.github/workflows/deploy.yml 会在 main 推送时验证、构建并发布 dist/，PR 只验证构建不发布。首次启用需在 GitHub 仓库 Settings → Pages → Build and deployment 中选择 GitHub Actions。

**当前本地目录没有源码 Git 仓库，旧 .deploy_git 只有生成站点的部署历史。** 本轮没有初始化远程源码分支、推送或执行上线。首次发布前应先把当前源码纳入对应仓库的源码分支，再启用上述工作流，确认旧仓库已有内容后再整合，避免覆盖历史。

不要上传 node_modules、dist、.tools、原始含配置凭据的 docs/notes 或旧部署缓存。仅 dist/ 会成为公开站点；CI 不会发布 docs、原始笔记或预览目录。

## 旧站保留

source/、themes/、public/、Hexo 配置与 .deploy_git/ 保留在本地，便于对照迁移。旧 package.json / 锁文件备份在 docs/legacy/。新框架静态资源目录是 static/，不会把旧 public/ 自动打包进新站。


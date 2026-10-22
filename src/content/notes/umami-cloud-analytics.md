---
title: "博客接入 Umami Cloud：给 GitHub Pages 增加访问统计"
description: "记录在 Astro 静态博客中接入 Umami Cloud，收集页面浏览数据并在控制台查看分析的配置过程。"
category: "web"
tags: ["Umami", "Astro", "GitHub Pages", "网站统计"]
cover: "web"
date: "2026-10-22"
draft: false
---

## 为什么静态博客需要外部统计服务

博客部署在 GitHub Pages 上，发布后的页面是静态文件，没有自己的应用服务器和数据库，不能在站点里直接累计所有访客的浏览数据。浏览器的 `localStorage` 只属于当前访客的设备，也不能汇总成全站统计。

Umami Cloud 托管统计数据和分析面板。博客加载 Umami 提供的浏览器脚本后，脚本把页面浏览数据发送给 Umami；登录控制台后，可以按时间、页面、来源、国家地区、设备和浏览器查看统计。网站 ID 会出现在公开页面代码中，因此它用于标记站点，不是登录凭据或 API 密钥。

## 创建 Umami 网站

1. 在 [Umami Cloud](https://cloud.umami.is/) 注册并登录。
2. 在 Websites 中添加网站，名称可以使用 `onlylo`，域名填写 `wm2103.github.io`。
3. 打开该网站的 Tracking code，复制其中的 Website ID。Cloud 跟踪脚本地址为 `https://cloud.umami.is/script.js`。

Umami 官方文档：[添加网站](https://docs.umami.is/docs/add-a-website)、[收集数据](https://docs.umami.is/docs/collect-data)。

## 配置博客和 GitHub Actions

本项目通过构建环境变量 `UMAMI_WEBSITE_ID` 注入 Website ID。当前仓库的 GitHub Actions 已内置你提供的 Website ID，因此不需要额外配置 GitHub Variables，推送到 `main` 后就会开始统计。

如果以后在 Umami Cloud 新建了网站，想替换统计目标，再到 GitHub 仓库打开 Settings → Secrets and variables → Actions → Variables，点击 **New repository variable**，名称填写 `UMAMI_WEBSITE_ID`，值填写新的 Website ID。变量名必须完全一致；它会覆盖工作流里的默认值。若页面中暂时看不到 Variables，也不影响当前站点部署和统计。Website ID 是公开标识符，构建时会写入网页 HTML，不要把 Umami 登录密码或 API 密钥放进这个变量。

每次向 `main` 推送时，GitHub Actions 会使用变量或默认 ID 构建站点并发布。若在本地预览，也可以在项目根目录 `.env` 中设置同名变量；`.env` 已加入 Git 忽略规则，不要提交实际配置文件。没有 ID 时不会生成 Umami 脚本，普通构建仍可正常完成。

## 当前接入选项

公共布局 `src/layouts/Base.astro` 会在存在 Website ID 时加入 Umami 脚本，因此首页、笔记、项目和关于页面都会被统计。脚本限定在 `wm2103.github.io` 域名运行，并忽略 URL 查询参数。分类筛选会通过 `history.replaceState` 修改查询参数；本项目关闭自动追踪，等脚本加载后只手动记录一次当前页面浏览，避免每次点击筛选都增加一条页面浏览。

同时开启 `data-do-not-track`，使脚本在浏览器提供 Do Not Track 信号时跳过统计。Umami 加载失败、被浏览器扩展拦截或用户启用相关隐私设置时，相应访问可能不会进入统计数据。

## 查看数据和验证

部署完成后访问 `https://wm2103.github.io/`，然后到 Umami Cloud 对应网站的 Dashboard 查看访问量、访客趋势、热门页面、来源和设备分布。也可以打开浏览器开发者工具的 Network 面板，确认 `cloud.umami.is/script.js` 已加载且有统计请求。

数据从接入并成功部署后开始累计，不会补算之前的访问。当前只记录页面浏览，没有添加搜索词、个人信息或自定义点击事件。需要继续了解跟踪选项时，可查阅 [Umami 跟踪器配置](https://docs.umami.is/docs/tracker-configuration)和[手动跟踪页面浏览](https://docs.umami.is/docs/tracker-functions#pageviews)。

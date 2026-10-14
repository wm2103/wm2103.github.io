# 学习笔记迁移记录

首次整理日期：2026-10-14。此文件由 `node scripts/import-notes.mjs` 生成，可重复生成。

已导入 8 篇完整笔记，原文共 653,342 字节，保留 250 个围栏代码块。
清理导出字体/跨度标签及内联样式 2492 处，包括行内代码中可识别的语雀导出字体包装；有意书写的 HTML 示例与原有围栏代码保留。没有删去学习批注、未完成标记、来源链接或参考资料。
另为 1 段已人工核对的代码补齐围栏，导入后共 251 个围栏代码块。

## 导入清单

| 文章 | 来源 | 原文行数 | 外链图片引用 | 缺失本地图片 |
| --- | --- | ---: | ---: | ---: |
| [Vue + Spring Boot 项目入门](../src/content/notes/vue-spring-boot.md) | source/_posts/vue springboot 黑马.md | 751 | 347 | 0 |
| [神经网络：从感知器到卷积网络](../src/content/notes/neural-network.md) | source/_posts/神经网络.md | 2121 | 189 | 0 |
| [苍穹外卖 Day 01：环境搭建与登录](../src/content/notes/sky-takeout-day01.md) | docs/notes/苍穹外卖DAY01.md | 901 | 30 | 2 |
| [苍穹外卖 Day 02：员工与分类管理](../src/content/notes/sky-takeout-day02.md) | docs/notes/苍穹外卖DAY02.md | 2228 | 42 | 1 |
| [苍穹外卖 Day 03：AOP 与菜品管理](../src/content/notes/sky-takeout-day03.md) | docs/notes/苍穹外卖DAY03.md | 1840 | 25 | 2 |
| [苍穹外卖 Day 05：Redis 与营业状态](../src/content/notes/sky-takeout-day05.md) | docs/notes/苍穹外卖-day05.md | 897 | 20 | 1 |
| [苍穹外卖 Day 06：微信登录与商品浏览](../src/content/notes/sky-takeout-day06.md) | docs/notes/苍穹外卖DAY06.md | 1625 | 76 | 0 |
| [苍穹外卖 Day 07：缓存与购物车](../src/content/notes/sky-takeout-day07.md) | docs/notes/苍穹外卖DAY07.md | 1147 | 25 | 0 |

苍穹外卖系列按现有 Day 01、02、03、05、06、07 排序。Day 05 原文说明 Day 04 没有独立讲义，未创建缺失章节。
两篇旧文章保留已有日期：Vue + Spring Boot 为 2024-04-27，神经网络为 2024-04-10；六篇课程笔记只记录整理日期，没有推测发布日期。
来源标签明确为课程学习笔记或学习摘录。神经网络笔记保留正文与文末原文链接，课程截图、示例代码和个人追问均未改写为原创成果。

## 本地图片缺失

发现 6 处本地图片引用没有对应文件，已用包含配图含义的引用块替换。以下路径相对于各自的源笔记。

| 源文件及行号 | 原图片路径 | 页面占位说明 |
| --- | --- | --- |
| docs/notes/苍穹外卖DAY01.md:173 | `assets/image-20221107101238205.png` | sky.sql 数据库导入界面 |
| docs/notes/苍穹外卖DAY01.md:405 | `assets/image-20221107152041371.png` | 前端请求经 Nginx 转发到后端接口的示意图 |
| docs/notes/苍穹外卖DAY02.md:1582 | `assets/image-20221112154253995.png` | 按 id 查询员工信息的接口测试截图 |
| docs/notes/苍穹外卖DAY03.md:550 | `assets/image-20221121154841887.png` | 公共字段自动填充后的 SQL 控制台输出 |
| docs/notes/苍穹外卖DAY03.md:557 | `assets/image-20221121155104152.png` | category 表中时间与操作用户字段的自动填充结果 |
| docs/notes/苍穹外卖-day05.md:40 | `assets/image-20221130173459174.png` | Redis 的 key-value 数据结构示意图 |

## 外链图片状态

正文保留 754 处外链图片引用（754 个不同 URL）。所有 URL、查询参数与片段均保留在对应导入文章中。
外链图片没有下载到本地，也没有逐个联网验证。以下均为尚未解决的外部资源依赖；图床失效、鉴权或防盗链仍可能导致加载失败。此报告不将“保留链接”记为“图片已恢复”。

| 外部图床 | 引用次数 | 状态 |
| --- | ---: | --- |
| cdn.nlark.com | 754 | 原 URL 保留，可用性未验证 |

## 配置值替换

仅在导入副本中替换 4 处符合实际云服务格式的配置值。原始文件不变，报告不记录原值。AppID 是应用标识，与对应密钥一起改为环境变量示例。
教学默认密码、变量引用和普通代码未做泛化替换；图片内的配置文本不在本次纯文本检查范围内。

| 源文件及行号 | 类型 | 副本中的环境变量占位符 |
| --- | --- | --- |
| docs/notes/苍穹外卖DAY03.md:695 | 阿里云 AccessKey ID | `${ALIYUN_ACCESS_KEY_ID}` |
| docs/notes/苍穹外卖DAY03.md:696 | 阿里云 AccessKey Secret | `${ALIYUN_ACCESS_KEY_SECRET}` |
| docs/notes/苍穹外卖DAY06.md:664 | 微信小程序 AppID（应用标识） | `${WECHAT_APP_ID}` |
| docs/notes/苍穹外卖DAY06.md:665 | 微信小程序 AppSecret | `${WECHAT_APP_SECRET}` |

## 代码排版修复

只对清单中记录且正文逐行匹配的片段添加代码围栏；代码文本不改动。若源文变更导致不匹配，导入器会报错，避免把其他正文误当作代码。

| 源文件及行号 | 语言 | 原因 |
| --- | --- | --- |
| docs/notes/苍穹外卖DAY02.md:557–563 | java | 异常处理示例遗漏围栏，Result<String> 中的泛型会被 Markdown 当作 HTML 标签 |

## 图片排版修复

仅移除清单中记录且原始行完全匹配的独立图片行缩进，避免图片被渲染为代码块；图片链接、查询参数与片段保留。列表中的图片及围栏中的 Markdown 示例不做统一去缩进。源文不匹配或目标位于代码围栏内时，导入器会报错。

| 源文件及行号 | 原因 |
| --- | --- |
| source/_posts/神经网络.md:744 | 神经网络结构配图误带空格和制表符缩进，被 Markdown 渲染为代码块 |

## 原文完整性与再次导入

下列 SHA-256 在导入前后相同。导入器只更新 `scripts/note-catalog.mjs` 清单中的文章与本报告；不会清空内容目录，后续直接添加的新文章保持不变。
调整已导入文章的元数据时修改清单；调整正文时修改对应源文件并重新导入。直接修改生成的八篇文章会被下次导入覆盖。

| 原始文件 | SHA-256 |
| --- | --- |
| source/_posts/vue springboot 黑马.md | `13d6080e4c035435e88c19704ec871e9c35e4b9c66345a193462a9b424988cf6` |
| source/_posts/神经网络.md | `b29fad239493db2cc7a40425a157ffa59d06452c65d3f43eac0796767c3adf0c` |
| docs/notes/苍穹外卖DAY01.md | `7243644555a652b51ad8598f2b1e9b8456e75b0714ad903a9955326bfeaf8dc6` |
| docs/notes/苍穹外卖DAY02.md | `88923cd52f277ba4c7e3820b1001135d8546c0cd486b452a47a3a311f0e32493` |
| docs/notes/苍穹外卖DAY03.md | `bbaa0c9b78efacc3c6b54859c0d70b367948d984dba2e31b8920ceb96568f67b` |
| docs/notes/苍穹外卖-day05.md | `d4d8d096c0150d2bea4e7cb341e1dd7357d63db013ac5e57e2476a4c4a57a930` |
| docs/notes/苍穹外卖DAY06.md | `02f46c2e1f37778207375e5aa0ea9ebff98018ac7759432dd6fb97b32ce986a8` |
| docs/notes/苍穹外卖DAY07.md | `505e601803b5d3f720e2bda3d9a0dc135580cc73b17c31664b2fd3ca8b64c1a8` |

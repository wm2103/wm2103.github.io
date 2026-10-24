---
title: "电商问数 03：开发环境与基础服务"
description: "记录 uv、Python 环境、Docker Desktop，以及 MySQL、Qdrant、Elasticsearch 和 Embedding 等基础服务准备。"
category: "ai"
tags: ["电商问数","AI Agent","Python","Docker","开发环境"]
cover: "neural"
importedAt: "2026-10-24"
sourceLabel: "shopkeeper-agent 电商问数项目学习笔记，含个人批注"
---

> 这章讲了下基础的uv下载基础命令，docker安装配置等，还是挺实用的，不过第一次配置的话有点麻烦
>

**本章课程目标：**

+ 理解「电商问数」项目为什么使用 `uv` 管理 Python 环境与依赖。
+ 掌握 `uv add`、`uv remove`、`uv sync` 这几个最常用命令。
+ 明确本项目依赖哪些基础服务，以及这些服务分别解决什么问题。
+ 了解 `Docker Desktop`、镜像加速、代理配置和 `docker compose` 的基本使用方式。

**学习建议：** 这一章更适合当成环境清单来读。先把项目创建、依赖安装、`.env` 配置这些后端准备做完，再确认 MySQL、Qdrant、Elasticsearch、Embedding 服务是否能启动。不要急着看业务代码；只要基础服务没跑稳，后面的报错大多都会变成环境问题。

**对应代码分支：**`03-env-services`



## 1、先建立整体认识
「电商问数」实际项目仓库是 `shopkeeper-agent`，前后端代码放在同一个仓库里：

+ 后端入口：`shopkeeper-agent/main.py`
+ 后端代码：`shopkeeper-agent/app/`
+ 前端项目：`shopkeeper-agent/frontend/`

不过这一章的重点会放在**后端环境和基础服务准备**上，本项目不会涉及前端项目的创建过程，前端代码已经放在当前仓库的 `frontend` 目录下，后面需要启动前端时，进入这个目录安装依赖并运行即可。

其中：

+ 后端使用 `Python 3.14+`，并通过 `uv` 管理虚拟环境和依赖。
+ 前端使用 `React + Vite + Tailwind CSS`，需要 `Node.js` 和 `pnpm`。
+ 后端项目运行时还依赖 `MySQL`、`Qdrant`、`Elasticsearch`、`Kibana` 以及 Embedding 推理服务。

如果只从“这一章先要准备什么”来看，最重要的是下面四件事：

1. 安装好 `Python 3.14+`
2. 安装好 `uv`
3. 安装好 `Docker Desktop`
4. 准备一个可用的开发工具，例如 `PyCharm` 或 `VS Code`

## 2、创建后端项目与使用 uv
### 2.1 为什么本项目使用 uv
官网：[https://docs.astral.sh/uv/](https://docs.astral.sh/uv/)

先用一句话理解：`uv` 是一个用于管理 Python 项目、虚拟环境和依赖的现代化工具。

在 Python 生态里，大家以前比较熟悉的做法通常有两类：

+ 组合使用 `venv + pip`，其中 `venv` 负责创建虚拟环境，`pip` 负责安装依赖。
+ 直接使用 `conda`，由它统一管理环境和依赖。

而在这个项目里，选择的是 `uv`。相比传统做法，它更像一套**一体化方案**：把创建项目、创建虚拟环境、安装依赖、移除依赖、同步环境这些动作统一到了同一套命令里。

它的几个主要优点是：

+ **速度更快**：`uv` 由 `Rust` 编写，环境创建和依赖安装通常都比传统方式快。
+ **工程化更顺手**：项目初始化、依赖管理和虚拟环境管理统一在一套命令里。
+ **更适合团队协作**：依赖会写入 `pyproject.toml` 和锁文件，方便别人拉到项目后快速同步环境。

一句话概括：**在「电商问数」中，**`**uv**`** 既负责管理虚拟环境，也负责管理项目依赖，是后端开发环境的基础工具。**

**补充理解：**`**uv**`** 和 **`**venv**`** 是什么关系**

你可能会问：既然我们在用 `uv`，为什么项目目录里看到的却还是 `.venv`？ 原因并不复杂：`uv` 在虚拟环境这一层，本质上仍然是围绕 Python 的 `venv` 机制来工作的。 也就是说：

+ `venv` 负责“虚拟环境”这件事
+ `uv` 负责把“创建环境、初始化项目、安装依赖、锁定版本”这些流程整合起来 所以项目目录中出现 `.venv` 是正常的，这不代表没有使用 `uv`。

### 2.2 安装 uv
在使用 `uv` 之前，需要先把它安装到系统环境中。

最直接的方式是使用 `pip`：

```plain
pip install uv
```

如果下载速度较慢，也可以结合国内镜像：

```plain
pip install -i https://pypi.tuna.tsinghua.edu.cn/simple uv
```

如果你使用的是 macOS，请执行：

```plain
brew install uv
```

**注意：**

+ 这一步不需要先激活某个已有虚拟环境
+ 这里安装的是系统层面的 `uv` 工具
+ 后面创建具体项目时，`uv` 才会为项目生成独立的 `.venv`

安装完成后，可以先检查一下：

```plain
uv --version
```

> 之前下载过，跳过
>

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1792158234825-88f718d7-882c-4fb1-ac1c-68706788eb08.png)

如果能够正常输出版本号，就说明 `uv` 已经可以使用了。

```plain
didilili@DidililiMacBook-Pro shopkeeper-agent % uv --version
uv 0.11.6 (65950801c 2026-04-09 aarch64-apple-darwin)
```

看到版本号即可，不需要和这里的示例完全一致。

### 2.3 创建后端项目
> 我用的是方式二
>

这一节主要讲后端项目 `shopkeeper-agent` 的创建方式。

PyCharm 下载地址：https://www.jetbrains.com/zh-cn/pycharm/

根据你的开发工具情况，可以分成两种场景：

+ `PyCharm` 已经支持 `uv`
+ `PyCharm` 没有 `uv` 选项，需要手动创建

这里也可以顺手说明一下：  
如果你使用的是 `VS Code` 或其他编辑器，通常也可以直接采用**方式二**。因为方式二的核心并不是依赖某个特定 IDE，而是先在终端里把 `uv` 项目创建好，再用你习惯的编辑器打开这个目录。

**方式一：在 PyCharm 中直接创建 uv 项目**

如果你的 `PyCharm` 版本较新，并且系统里已经安装了 `uv`，那么在新建项目时，通常可以直接看到 `uv` 这个解释器类型选项。

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1792158068198-80858161-f361-40ab-bee8-1c5bee76fe79.png)

创建时可以按下面这个顺序操作：

1. 选择 `New Project`
2. 在解释器类型中选择 `uv`
3. 指定项目目录，例如 `shopkeeper-agent`
4. 选择 Python 版本，建议与当前项目保持一致，使用 `3.14`
5. 点击 `Create`

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1792158068164-9474e620-349a-4fc2-b320-03867eb01941.png)

创建完成后，你通常会看到项目目录中自动生成了这些内容：

+ `pyproject.toml` 用来描述项目和依赖
+ `uv.lock` 用来锁定依赖版本
+ `.venv` 是这个项目自己的虚拟环境

**方式二：**`**PyCharm**`** 没有 **`**uv**`** 选项时，手动创建项目**

如果你在 `PyCharm` 里看不到 `uv` 选项，通常是因为 IDE 版本较老。这种情况下也不用担心，完全可以在终端里手动创建，再导入 IDE。

第一步，在你希望放项目的目录下执行：

```plain
uv init shopkeeper-agent
```

这个命令的作用，是初始化一个新的 `uv` 项目目录。

然后进入项目目录：

```plain
cd shopkeeper-agent
```

接着创建虚拟环境：

```plain
uv venv
```

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1792158629170-af95d560-8996-447b-b91d-6765ea1cd811.png)

> 之前一般用conda ，讲解下
>
> + `**uv init shopkeeper-agent**`：不是安装依赖，也不是从 GitHub 拉代码。它做的是“创建一个新的 Python 项目骨架”，类似 `poetry new` + 一部分 `conda create` 的项目初始化。
> + `**uv venv**`：在项目里创建虚拟环境 `.venv`，类似 `conda create -n xxx`，但环境放在项目目录下，而不是 conda 的全局 `envs` 目录。
>
> `**uv init shopkeeper-agent**`** 到底做了什么？**
>
> 假设你在 `D:\projects` 目录下执行：
>
> bash
>
> uv init shopkeeper-agent
>
> 它会：
>
> 1. 在当前目录下创建一个新目录：`shopkeeper-agent/`
> 2. 在这个目录里生成一个 Python 项目的基础文件，通常包括：
>     - `pyproject.toml`：项目元数据、依赖声明、构建配置
>     - `README.md`
>     - `.python-version`：记录项目使用的 Python 版本
>     - 一个入口文件，例如 `main.py` 或 `hello.py`，不同 uv 版本略有差异
> 3. 把 `shopkeeper-agent` 规范成项目名。因为名字里有连字符，Python 包名可能会变成 `shopkeeper_agent`。
>
> `uv venv` 做了什么？
>
> 在项目根目录执行：
>
> bash
>
> uv venv
>
> 它会：
>
> 1. 在当前项目下创建虚拟环境目录 `.venv/`
> 2. 根据 `.python-version` 或你指定的版本选择 Python 解释器
> 3. 生成类似下面的路径：
>     - Windows：`.venv\Scripts\python.exe`
>     - macOS/Linux：`.venv/bin/python`
>
> 创建后目录类似：
>
> shopkeeper-agent\
>
> ├── .venv\
>
> │   ├── Scripts\ 或 bin\
>
> │   └── ...
>
> ├── pyproject.toml
>
> └── ...
>
> `uv venv` 只创建环境，**不安装项目依赖**。你还需要：
>
> bash
>
> uv sync
>
> 执行完成后，项目目录里通常会出现 `.venv`。这时再回到 `PyCharm`，直接打开这个项目目录即可。  
如果 IDE 没有自动选中解释器，就手动把解释器指向项目里的虚拟环境：
>
> + macOS / Linux 一般是 `.venv/bin/python`
> + Windows 一般是 `.venv\\Scripts\\python.exe`
>



也就是说，即使 `PyCharm` 没有直接集成 `uv`，你依然可以：

先在终端里手动创建 `uv` 项目

再用 IDE 打开目录

最后把解释器切到 `.venv` 对应的 Python

### 2.4 常用 uv 命令
在这个项目里，`uv` 最常用的其实就三类命令：

+ 添加依赖：`uv add`
+ 移除依赖：`uv remove`
+ 同步依赖：`uv sync`

**添加依赖**

如果你想往当前项目里新增一个依赖，可以使用：

```plain
uv add 包名
# 例如
uv add fastapi
```

执行完成后，依赖会被写入 `pyproject.toml`。

**删除依赖**

如果你想删除某个依赖，可以使用：

```plain
uv remove 包名
# 例如
uv remove fastapi
```

**同步依赖**

`uv sync` 是这个项目里非常重要的一个命令。它的作用可以简单理解成：

根据当前项目的 `pyproject.toml` 和 `uv.lock`，把你的本地环境同步到正确状态。

例如，当你拿到别人发来的项目代码时，最常见的做法不是自己一个个安装依赖，而是直接执行：

```plain
uv sync
```

这样它就会读取项目中已经声明好的依赖，并自动把环境补齐。

> 这里如果也是把代码clone下来运行，可以直接运行这个 uv sync
>
> <!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1792158965224-91e86ce5-f2e6-4d5a-8df9-7c7ac56929d8.png)
>

### 2.5 安装后端依赖
如果你是第一次接触 `uv`，可以这样理解：

+ `uv add` 更像“往项目里新增依赖”
+ `uv sync` 更像“把项目需要的依赖一次性装齐”

手动添加项目依赖：

```plain
# Windows
uv add fastapi[standard] sqlalchemy asyncmy qdrant-client "elasticsearch[async]>=8,<9" langchain langchain-deepseek langchain-huggingface langgraph jieba omegaconf pyyaml loguru cryptography huggingface-hub greenlet python-dotenv
# macOS
uv add "fastapi[standard]" sqlalchemy asyncmy qdrant-client "elasticsearch[async]>=8,<9" langchain langchain-deepseek langchain-huggingface langgraph jieba omegaconf pyyaml loguru cryptography huggingface-hub greenlet python-dotenv
```

执行完命令以后，在pyproject.toml：

```plain
[project]
name = "shopkeeper-agent"
version = "0.1.0"
description = "Add your description here"
readme = "README.md"
requires-python = ">=3.14"
dependencies = [
    "asyncmy>=0.2.11",
    "cryptography>=46.0.7",
    "elasticsearch[async]>=8,<9",
    "fastapi[standard]>=0.135.3",
    "greenlet>=3.4.0",
    "huggingface-hub>=1.10.1",
    "jieba>=0.42.1",
    "langchain>=1.2.15",
    "langchain-deepseek>=1.0.1",
    "langchain-huggingface>=1.2.1",
    "langgraph>=1.1.6",
    "loguru>=0.7.3",
    "omegaconf>=2.3.0",
    "python-dotenv>=1.2.2",
    "pyyaml>=6.0.3",
    "qdrant-client>=1.17.1",
    "sqlalchemy>=2.0.49",
]
```

### 2.6 核心依赖说明
| 依赖 | 主要作用 |
| --- | --- |
| `fastapi[standard]` | 高性能异步 Web 框架，作为整个服务的 API 入口 |
| `sqlalchemy` | Python 常用 ORM，用统一模型管理数据库读写与事务 |
| `asyncmy` | MySQL 的高性能 `asyncio`<br/> 驱动，配合 `SQLAlchemy`<br/> 实现全异步数据库访问 |
| `qdrant-client` | 向量数据库客户端，用于 Embedding 向量存储与相似度检索 |
| `elasticsearch[async]` | 异步 Elasticsearch 客户端，用于全文检索 |
| `langchain` | LLM 应用编排框架，用于构建 RAG、工具调用和 Prompt 链路 |
| `langchain-deepseek` | LangChain 与 DeepSeek 模型的接入层，用于连接项目实际使用的大模型服务 |
| `langchain-huggingface` | LangChain 与 HuggingFace 模型的桥接层，主要用于 Embedding 或模型加载 |
| `langgraph` | 用图结构构建可控的 Agent 流程 |
| `jieba` | 中文分词与关键词提取工具 |
| `omegaconf` | 分层配置管理工具，适合多环境、多模型、多参数场景 |
| `python-dotenv` | 从 `.env`<br/> 文件读取环境变量，避免把密钥写死在代码中 |
| `pyyaml` | 用于 YAML 文件的读取与写入 |
| `loguru` | 更简洁的日志库，适合工程化项目统一管理日志输出 |
| `cryptography` | 加密与证书基础库，也是很多网络、数据库和安全相关依赖的底层基础 |
| `greenlet` | SQLAlchemy 等异步/同步协作场景中的底层协程支持库 |
| `huggingface-hub` | 用于模型下载以及 HuggingFace 生态接入 |




## 3、创建后端所需的基础服务
除了前后端代码环境，这个项目还依赖几类基础服务。

### 3.1 基础服务总览
本项目主要会用到下面这些服务：

| 服务 | 主要作用 |
| --- | --- |
| `MySQL` | 用于存储数据仓库的元数据信息，包括表信息、字段信息和指标信息；同时也充当业务数据仓库使用，用来模拟真实数仓场景 |
| `Qdrant` | 作为向量数据库，用于存储字段信息和指标信息的向量表示；当用户提问时，系统会通过语义相似度检索出最相关的元数据，为生成 SQL 提供高相关性的上下文 |
| `Elasticsearch` | 对各维度字段的实际取值建立倒排索引；当用户问题中出现“华北地区”“数码品类”这类自然语言描述时，可以通过全文检索匹配到数据库中真实存在的字段取值，为生成 SQL 时的 `WHERE`<br/> 条件或 `GROUP BY`<br/> 分组提供依据 |
| `Kibana` | Elasticsearch 的可视化管理与调试界面，用于索引管理、查询语句调试以及检索效果验证，方便在开发过程中观察和优化检索行为 |
| `Text Embedding Inference` | 用于部署 Embedding 模型推理服务，将元数据文本和用户问题转换成向量表示，为 `Qdrant`<br/> 提供向量数据来源，是语义检索能力的基础 |


从整体分工上看：`MySQL` 负责保存结构化数据，`Qdrant` 负责语义相似度检索，`Elasticsearch` 负责全文匹配，`Kibana` 负责调试和验证检索效果，Embedding 服务负责把文本转换成向量。

后端代码负责“组织流程”，而这些基础服务负责“提供数据、检索和向量能力”。

### 3.2 为什么使用 Docker 启动服务
这里推荐的方式是：**尽量通过 Docker 统一启动这些服务**。

如果你对 `Docker` 的基础概念、镜像、容器或常见操作还有疑问，建议先参考：

[第 8 章 Docker 快速入门与 Dify 部署排障](https://didilili.github.io/ai-agents-from-zero/#/../8-Docker%E5%BF%AB%E9%80%9F%E5%85%A5%E9%97%A8%E4%B8%8EDify%E9%83%A8%E7%BD%B2%E6%8E%92%E9%9A%9C)

这样做的好处很直接：

+ 不用在本机分别手动安装 `MySQL`、`Qdrant`、`Elasticsearch`、`Kibana`
+ 不同同学的环境差异会小很多
+ 后面如果要重建环境，也更方便

课程里的思路其实是：

+ 用 `Docker Desktop` 作为本机容器运行环境
+ 用 `docker compose` 一次性启动多项服务

你可以先把 `docker compose` 理解成：

用一个配置文件同时描述多个容器，然后通过一条命令把它们统一启动起来。

### 3.3 安装 Docker Desktop
启动基础服务，首先需要安装 `Docker Desktop`。

#### 3.3.1 Windows 环境
> 我是Windows环境，之前嫌麻烦没安装，刚好安装一下
>

在 Windows 上安装时，建议优先使用 `WSL 2` 作为 Docker 的运行基础。

原因是：

+ Docker 本身更适合运行在 Linux 生态上
+ `WSL 2` 比较贴近真实 Linux 环境
+ 性能和兼容性通常比旧方案更好

如果需要检查本机是否已经安装 `WSL`，先执行：

```plain
wsl --version
```

> 不知道什么时候下载的
>
> <!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1792159498232-03dbeadb-c005-40a3-99ce-ea146db3a7b8.png)
>

如果没有安装，可以参考 Docker Desktop 或微软官方文档先完成 `WSL 2` 安装，再继续安装 Docker Desktop。

参考文档：[https://docs.docker.com/desktop/setup/install/windows-install](https://docs.docker.com/desktop/setup/install/windows-install)

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1792159561412-a22f55d3-1bd9-4002-8420-fc490a92f533.png)

下载了第一个，安装提示失败

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1792159920372-cf6d0fb4-dcf3-4fff-849d-ac7c33ac509b.png)

问了下deepseek

> **简单翻译**：  
Docker Desktop 需要依赖 Windows 的“虚拟机平台”（Virtual Machine Platform）功能，但你当前的电脑没有开启这个功能。并且，你当前使用的是**“单用户安装”**（Per-user installation），这种安装模式没有管理员权限，无法自动帮你开启该功能。
>
> Docker 底层需要依赖 WSL 2（Windows Subsystem for Linux 2）或 Hyper-V 来运行 Linux 容器，而 WSL 2 必须依赖“虚拟机平台”这个 Windows 特性。
>
> 方案一：使用管理员 PowerShell 安装 WSL（推荐，更彻底）
>
> 这是图片中提示的首选方法。
>
> 以管理员身份运行 PowerShell：
>
>     - 按 `Win` 键，搜索 `PowerShell`。
>     - 右键点击“Windows PowerShell”，选择 **“以管理员身份运行”**。
>
> **执行命令**：
>
> 1. powershellwsl --install
>
> 这个命令会自动开启“虚拟机平台”、“Windows 子系统 Linux”等所需功能，并下载安装 WSL 2 内核。
>
> 2. **重启电脑**：  
执行完成后，**必须重启电脑**才能使功能生效。
> 3. **重新安装 Docker Desktop**：  
重启后，重新双击你现在的安装包进行安装，此时就不会再报这个错误了。
>
> 按照上面流程修复了下
>
> <!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1792223269000-62f17cdb-95cd-43ca-a9e5-87331fd57499.png)
>
> 正常下载了
>
> <!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1792223371912-d60f4481-3042-428e-924e-1de4443f2d8c.png)
>
> <!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1792226155082-9b5523eb-8cfa-4336-b435-fbb2a0d93959.png)
>

#### 3.3.2 macOS 环境
在 macOS 上相对简单一些，直接根据自己的芯片类型选择安装包即可：

+ Apple 芯片选择 `Apple Silicon`
+ Intel 芯片选择 `Intel`

安装完成后，打开 Docker Desktop，确认它能正常启动即可。

#### 3.3.3 图形界面和命令行都可以用
安装好 Docker Desktop 后，你既可以通过图形界面观察容器、镜像、卷。

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1792159349031-3109686b-a93e-4865-874a-309f176f628a.png)

也可以继续使用命令行，例如：

```plain
docker ps
```

如果这个命令能够正常输出当前容器列表，就说明 Docker 环境已经基本可用。

### 3.4 Docker 拉镜像失败怎么办
这里还有一个很实际的问题： 装好 Docker 之后，并不代表你立刻就能顺利执行 `docker pull`。

常见原因是默认镜像源访问不稳定，因此一般有两种解决思路：

+ 配置镜像加速
+ 配置代理

这部分属于 Docker 通用问题，完整解释统一放在 [第 8 章 - 网络慢或镜像拉取失败](https://didilili.github.io/ai-agents-from-zero/#/../8-Docker%E5%BF%AB%E9%80%9F%E5%85%A5%E9%97%A8%E4%B8%8EDify%E9%83%A8%E7%BD%B2%E6%8E%92%E9%9A%9C?id=_44-%e7%bd%91%e7%bb%9c%e6%85%a2%e6%88%96%e9%95%9c%e5%83%8f%e6%8b%89%e5%8f%96%e5%a4%b1%e8%b4%a5)。本节只保留本项目启动前需要知道的操作入口。

### 3.5 服务启动方式
现在 Docker 已经安装配置完毕，并且启动成功，接下来配置本套项目所需的基础服务。在`shopkeeper-agent`仓库的根目录下有 `docker` 目录，里面有以下文件：

+ `docker-compose.yaml`
+ `mysql` 初始化脚本
+ `elasticsearch` 自定义镜像构建文件
+ `embedding` 模型相关文件

#### 3.5.1 启动前准备 Embedding 模型
这里有一个很容易漏掉的前置步骤：Embedding 模型需要单独下载。

项目通过 `Text Embeddings Inference` 加载 `BAAI/bge-large-zh-v1.5`，这个模型文件体积比较大，没有直接提交到 Git 仓库中。也就是说，仓库里有 `docker/embedding/` 这个目录约定，但第一次启动基础服务之前，你需要先把模型文件放进去。

项目要求的本地目录是：

```plain
shopkeeper-agent/docker/embedding/bge-large-zh-v1.5
```

在 `shopkeeper-agent` 项目根目录下，可以使用下面的命令下载：

```plain
uv run hf download BAAI/bge-large-zh-v1.5 --local-dir docker/embedding/bge-large-zh-v1.5
```

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1792159799216-b4263478-0cc5-46d0-8c00-4d92c7fe0754.png)

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1792160083739-04a6bf90-e5be-45a5-97a4-470c3267dbf6.png)

> 问了下AI，说是：
>
> 从截图来看，模型下载在达到 **33%** 时因网络底层连接被强制中断而失败，核心原因是网络波动叠加了 `hf_transfer` 多线程并发，导致大文件分块传输时握手超时或被断开。
>
> 从报错堆栈可以看到，中断发生在 `httpcore._sync.connection_pool` 的 `handle_request` 阶段，触发了底层 TCP 连接的重置（ConnectionReset/EOF）。国内网络在下载 HuggingFace 大模型（bge-large-zh-v1.5 总大小大概 1.3GB）时，默认走海外源且同时启动多线程分块请求，很容易在 30%~40% 左右连接超时。你可以按下面三个方案逐步调整：
>
> 
>



🛠️ 方案一：关闭 hf_transfer 多线程（优先推荐）

`hf_transfer` 是用 Rust 编写的并行下载加速组件，在网络出口较弱或多线程带宽受限时极容易断连，关闭它可以回退到单线程稳定下载。

在当前的 PowerShell 终端里执行以下两条命令：

powershell

```plain
# 1. 显式关闭 HF 的多线程加速开关
$env:HF_HUB_ENABLE_HF_TRANSFER="0"

# 2. 重新执行下载命令（支持断点续传，已下载的33%会直接跳过）
uv run hf download BAAI/bge-large-zh-v1.5 --local-dir docker/embedding/bge-large-zh-v1.5
```

**补充**：如果发现环境变量依然未生效（部分库会强制锁定 `HF_HUB_ENABLE_HF_TRANSFER` 为开启状态），可以直接在项目当前的 uv 虚拟环境中卸载这个组件：

powershell

uv pip uninstall hf_transfer



⚡ 方案二：切换国内镜像源（提速并规避连接超时）

HuggingFace 官方源在国内访问经常被限速或屏蔽，通过设置环境变量将端点指向社区维护的公益镜像 `hf-mirror.com` 会更稳定。

在同一个终端中执行：

powershell

```plain
$env:HF_ENDPOINT="https://hf-mirror.com"
$env:HF_HUB_ENABLE_HF_TRANSFER="0"

# 重新发起下载
uv run hf download BAAI/bge-large-zh-v1.5 --local-dir docker/embedding/bge-large-zh-v1.5
```

。。。但是都不行，然后 

切换到 ModelScope（推荐，最稳妥）

ModelScope 是阿里达摩院旗下的模型平台，国内下载速度非常稳定，且专为国内网络环境优化，无需担心镜像重定向或证书问题。

**安装 ModelScope 库**（如果尚未安装）：

1. powershelluv pip install modelscope

**使用 ModelScope 下载模型**：

2. powershelluv run modelscope download --model BAAI/bge-large-zh-v1.5 --local_dir docker/embedding/bge-large-zh-v1.5

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1792225275846-d2b45ac0-f05c-4e7b-b43a-01165b97f2c1.png)

好像是安装成功了，但是快的异常，大小没啥问题，<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1792225368797-aeb7cabc-a95e-4590-a5c3-e2b9470cedbe.png)

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1792225399775-b20c071c-cf59-44d9-8564-25fa70d00888.png)





如果你是手动下载模型，也要把解压后的模型文件放到同一个目录下。目录中至少应该能看到类似下面这些文件：

```plain
config.json
tokenizer.json
tokenizer_config.json
pytorch_model.bin
vocab.txt
```

后面 `docker-compose.yaml` 中的 Embedding 服务会通过目录挂载读取这里的模型文件：

```plain
volumes:
  - ./embedding/bge-large-zh-v1.5:/models/bge-large-zh-v1.5
```

如果这个目录不存在，或者里面没有完整模型文件，Embedding 容器即使启动了，也无法正常提供向量化服务。后续构建元数据知识库、字段向量索引、指标向量索引时都会依赖它，所以需要在第一次 `docker compose up -d` 之前就准备好。

#### 3.5.2 启动基础服务
可以按照以下步骤操作：

1. 进入 `docker-compose.yaml` 所在目录
2. 执行 `docker compose up -d` 启动整套服务

第一次启动时，时间可能会比较长，因为需要下载镜像，之后再启动时，时间会非常快。

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1792159348790-9ef8ba7b-0663-4ff8-81aa-fb1dd532780c.png)

> 我的启动截图，没配置镜像源，好像速度是慢点
>
> <!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1792226566424-9f94c9c9-6ee2-4267-93b2-2854b82a00ec.png)
>
> 依旧报错，ai说是没配置镜像源。。。还有个问题，docker默认镜像放在了C盘，记得修改
>
> 最推荐的方法是通过 Docker Desktop 的图形界面（GUI）操作，简单且不易出错。
>
> 1. **准备工作**：在 D 盘（或其他非系统盘）新建一个空文件夹，例如 `D:\DockerData`。
> 2. **打开设置**：右键点击系统托盘区的 Docker Desktop 图标，选择 **Settings**（设置）。
> 3. **找到路径**：在设置窗口左侧导航栏中，依次点击 **Resources**（资源） -> **Advanced**（高级）。
> 4. **修改路径**：找到 **Disk image location** 选项，点击 **Browse**（浏览），选择你刚才创建的文件夹（如 `D:\DockerData`）。
> 5. **应用并迁移**：点击 **Apply & restart**（应用并重启）。Docker 会询问是否移动现有数据，选择 **Yes, move it**（是，移动它）即可。
>
> ### 配置国内镜像加速器（最推荐）
> 这是解决 Docker Hub 网络问题最通用的方法，90% 的拉取失败问题都可以通过这个方案解决。
>
> 1. **打开配置**：右键点击系统托盘区的 Docker Desktop 图标，选择 **Settings**（设置） → **Docker Engine**（Docker 引擎）。
>
> **修改配置**：在右侧的 JSON 配置框中，找到 `"registry-mirrors"` 字段（如果没有就手动添加），填入以下可用的国内镜像地址：
>
> 2. json
>

```plain
{
  "registry-mirrors": [
    "https://docker.m.daocloud.io",
    "https://docker.1panel.live",
    "https://hub.rat.dev",
    "https://dockerproxy.com"
  ]
}
```

3. **应用并重启**：点击 **Apply & restart**（应用并重启），等 Docker 重启完成后，**重新打开一个终端**，再次执行 `docker compose up -d` 即可。

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1792227018534-b327da43-6797-4066-8e94-17a9087a6776.png)

> 又双报错,不过这个还好，就是端口号冲突，把3306就是mysql.exe在任务管理器里面关一下
>
> <!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1792227252670-493bcf66-f89f-49d3-8e0f-09a5f7c94879.png)
>
> <!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1792227244494-b405ebc7-471a-4414-9341-e8f995ee5c8f.png)
>
> 终于成功了，第一次见window上面的桌面docker，还挺新奇hhh
>





启动成功后，可以在 Docker Desktop 中查看容器运行状态：

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1792159349600-150c364c-1108-4033-82f8-29eeef269a75.png)

如果要停止并删除这组容器，则执行：

```plain
docker compose down
```

如果只是临时停止，也可以使用：

```plain
docker compose stop
```

总结：

+ `docker compose up -d` 后台启动整套服务
+ `docker compose stop` 临时停止服务，但保留容器
+ `docker compose down` 停止并删除容器

`up`、`stop`、`down`、`down -v` 的区别见 [第 8 章 - Compose 命令速查](https://didilili.github.io/ai-agents-from-zero/#/../8-Docker%E5%BF%AB%E9%80%9F%E5%85%A5%E9%97%A8%E4%B8%8EDify%E9%83%A8%E7%BD%B2%E6%8E%92%E9%9A%9C?id=_36-compose-%e5%91%bd%e4%bb%a4%e9%80%9f%e6%9f%a5)。这里尤其要记住：如果只是停止本项目基础服务，不要随手执行 `docker compose down -v`，它会删除命名卷中的 MySQL、Elasticsearch、Qdrant 数据。

## 4、docker-compose.yaml 文件分析
### 4.1 基本理解
项目对应文件路径：`shopkeeper-agent/docker/docker-compose.yaml`

```yaml
services:
  mysql:
    image: mysql:8.0
    container_name: mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_USER: didilili
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./mysql:/docker-entrypoint-initdb.d
    command: --character-set-server=utf8mb4
      --collation-server=utf8mb4_general_ci

  elasticsearch:
    build: ./elasticsearch
    container_name: elasticsearch
    restart: unless-stopped
    environment:
      discovery.type: single-node
      xpack.security.enabled: "false"
    ports:
      - "9200:9200"
    volumes:
      - es_data:/usr/share/elasticsearch/data
  kibana:
    image: kibana:8.19.10
    container_name: kibana
    restart: unless-stopped
    environment:
      ELASTICSEARCH_HOSTS: http://elasticsearch:9200
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch

  qdrant:
    image: qdrant/qdrant:v1.16
    container_name: qdrant
    restart: unless-stopped
    ports:
      - "6333:6333" # HTTP
      - "6334:6334" # gRPC
    volumes:
      - qdrant_data:/qdrant/storage

  embedding:
    image: ghcr.io/huggingface/text-embeddings-inference:cpu-1.8
    platform: linux/amd64
    container_name: embedding
    restart: unless-stopped
    ports:
      - "8081:80"
    environment:
      MODEL_ID: /models/bge-large-zh-v1.5
      MAX_CONCURRENT_REQUESTS: "16"
      MAX_BATCH_TOKENS: "16384"
    volumes:
      - ./embedding/bge-large-zh-v1.5:/models/bge-large-zh-v1.5

volumes:
  mysql_data:
  es_data:
  qdrant_data:
```

如果只把 `docker compose up -d` 理解成“一条启动命令”，其实会错过很重要的一层工程认识。`Compose` 文件不是单纯为了少敲几条命令，而是用一份配置把“这个项目依赖哪些服务、这些服务怎么启动、端口怎么映射、数据怎么持久化、目录怎么挂载”统一描述清楚。

在「电商问数」里，这份 `Compose` 文件可以理解成：一份基础服务清单。它描述的不是某一个容器，而是“让这个项目跑起来，需要哪几类容器协同工作”。

### 4.2 基础服务说明
+ MySQL 容器：负责元数据库和模拟数据仓库
+ Elasticsearch 容器：负责全文检索
+ Kibana 容器：负责 Elasticsearch 的可视化操作
+ Qdrant 容器：负责向量检索
+ Embedding 服务容器：负责把文本转换成向量

### 4.3 配置项具体说明
如果你顺着这份 `Compose` 文件往下看，最值得先掌握的是下面几类配置：

+ `image` 表示直接使用现成镜像，例如 `mysql:8.0`、`kibana:8.19.10`、`qdrant/qdrant:v1.16`。
+ `build` 表示不是直接使用现成镜像，而是先根据当前目录中的 `Dockerfile` 自行构建镜像。这里的 `elasticsearch` 使用 `build: ./elasticsearch`，就是因为通常还需要额外安装中文分词插件。
+ `container_name` 用来给容器指定一个更直观的名字，后面在 `Docker Desktop` 或命令行里查看时会更方便。
+ `restart: unless-stopped` 表示容器如果因为异常原因停止，会自动重启；只有你手动停止它时，才不会继续自动拉起。
+ `environment` 用来给容器注入启动时所需的环境变量。例如： 
    - MySQL 这里配置了 `MYSQL_ROOT_PASSWORD`、`MYSQL_USER`、`MYSQL_PASSWORD`，用于初始化数据库密码和普通用户。
    - Kibana 这里通过 `ELASTICSEARCH_HOSTS` 连接到 Elasticsearch。
    - Embedding 服务这里通过 `MODEL_ID` 指定加载的模型目录。
+ `ports` 用来做宿主机和容器之间的端口映射。比如： 
    - `3306:3306` 表示本机通过 `3306` 访问 MySQL
    - `9200:9200` 表示本机通过 `9200` 访问 Elasticsearch
    - `5601:5601` 表示本机通过 `5601` 打开 Kibana
    - `6333:6333` 和 `6334:6334` 分别对应 Qdrant 的 HTTP 和 gRPC 端口
    - `8081:80` 表示本机通过 `8081` 访问 Embedding 服务
+ `volumes` 用来做数据持久化或目录挂载。这一项很重要，因为如果不挂载，容器删掉之后，里面的数据或文件通常也会一起丢失。 这里先分清两种最常见的写法： 
    - **命名卷（named volume）** 形如 `mysql_data:/var/lib/mysql`。左边的 `mysql_data` 不是当前目录下的文件夹，而是 Docker 管理的一块持久化存储；右边的 `/var/lib/mysql` 是容器里的目录。
    - **目录挂载（bind mount）** 形如 `./mysql:/docker-entrypoint-initdb.d`。左边的 `./mysql` 是你当前项目目录下的真实文件夹；右边的 `/docker-entrypoint-initdb.d` 是容器里的目录。  

+  这两种写法的核心区别可以记成一句话： 
    - **命名卷**更适合存“容器运行后产生的数据”
    - **目录挂载**更适合把“宿主机现成的文件”交给容器使用
+  也可以再补一个最直接的判断口诀： 
    - 左边如果是 `./xxx`、`../xxx`、`/绝对路径/xxx`，通常就是**目录挂载**
    - 左边如果只是 `mysql_data`、`es_data`、`qdrant_data` 这种名字，通常就是**命名卷**
+  这里还有一个很关键但也最容易混淆的点： 
    - **删除容器**，不等于删除命名卷
    - **删除容器**，通常也不等于删除宿主机上的挂载目录
+  也就是说，只要你删掉的是容器本身，而没有把对应的 volume 或宿主机目录一起删掉，那么数据通常还在。真正容易导致数据丢失的，往往不是“删容器”这一步，而是把 volume 一并删除，或者手动删掉宿主机上的挂载目录。 结合当前这份 `docker-compose.yaml`，可以逐条这样理解： 
    - `mysql_data:/var/lib/mysql` 这是 MySQL 的数据目录持久化。MySQL 真正的数据文件会写到容器内的 `/var/lib/mysql`，而 `mysql_data` 负责把这份数据长期保存下来。这样即使把 MySQL 容器删掉，只要没有把这个 volume 一起删掉，数据库数据通常还在。
    - `./mysql:/docker-entrypoint-initdb.d` 这是把项目里的初始化 SQL 脚本挂进 MySQL 容器。MySQL 官方镜像第一次启动时，会自动执行 `/docker-entrypoint-initdb.d` 目录下的脚本，所以这里的作用不是“保存数据”，而是“把建库建表和初始化数据脚本交给容器执行”。
    - `es_data:/usr/share/elasticsearch/data` 这是 Elasticsearch 的数据持久化目录。如果不挂载，索引数据会跟着容器生命周期走；容器一删，全文检索的数据也容易丢。
    - `qdrant_data:/qdrant/storage` 这是 Qdrant 的向量数据持久化目录。它和 MySQL、Elasticsearch 的思路一样，都是把检索所需的数据留在 Docker 的持久化存储里，而不是只留在容器内部。
    - `./embedding/bge-large-zh-v1.5:/models/bge-large-zh-v1.5` 这是把宿主机上的本地 Embedding 模型目录挂进容器。这里挂载的不是数据库数据，而是模型文件本身。容器启动后，会从 `/models/bge-large-zh-v1.5` 读取模型权重。
+  另外，底部这段： 

```plain
volumes:
  mysql_data:
  es_data:
  qdrant_data:
```

 表示这份 Compose 文件额外声明了 3 个**命名卷**。它的含义是：上面各服务在使用这些 volume，这里则是统一把它们定义出来。 如果把 `volumes` 再压缩成一句最容易记忆的话，可以这样理解： 

    - 左边决定“数据或文件从哪里来”
    - 右边决定“容器到哪里去读或写”
+ `depends_on` 用来表达服务之间的依赖关系。比如 `kibana` 依赖 `elasticsearch`，它的意思不是“等 Elasticsearch 一切业务状态都完全正常后再启动”，而是“先把依赖服务启动起来，再启动当前服务”。  


你可以按这个顺序去读一份 `Compose` 文件：

1. 看 `services` 里一共定义了哪些服务
2. 看每个服务是 `image` 还是 `build`
3. 看 `ports`，确认本机通过哪些端口访问
4. 看 `volumes`，确认哪些数据会落到宿主机
5. 看 `environment`，确认这个服务启动时依赖什么配置
6. 看 `depends_on`，确认服务之间的依赖关系

### 4.4 工程思路具体分析
再结合各服务本身来看，这份 `Compose` 文件还体现了几个很重要的工程思路：

+ **MySQL 不只是启动了一个数据库容器** 它还通过 `./mysql:/docker-entrypoint-initdb.d` 挂载了初始化脚本目录。这样容器第一次启动时，就会自动执行其中的 SQL 文件，把 `meta` 数据库、`dw` 数据库、相关表结构以及模拟数据一起初始化好。
+ **MySQL 的数据目录被单独持久化了**`mysql_data:/var/lib/mysql` 的作用，是把 MySQL 真正存数据的目录挂载出来。这样即使容器被删除，数据也不会因为容器消失而丢失。
+ **Elasticsearch 使用 **`**build**`** 而不是 **`**image**` 这是因为项目里的全文检索是中文场景，通常需要额外安装 `IK` 分词器，所以不能直接拿一个原生镜像就结束。
+ **Kibana 本质上是 Elasticsearch 的调试界面** 它不是必需的核心存储服务，但在开发阶段非常有用，因为可以直接通过 Web 页面观察索引、执行查询和验证检索结果。
+ **Qdrant 同时开放了两类端口** 一个是更常用的 HTTP 端口，一个是 gRPC 端口。教学项目里通常优先使用 HTTP 即可，但把两个端口都开放出来，后续扩展会更方便。
+ **Embedding 服务被单独部署成了一个独立容器** 这意味着“文本转向量”这件事不是耦合在业务代码里完成的，而是通过一个单独的推理服务来提供接口，这样后端代码只需要调用服务即可。 这里也可以补充理解一下：Embedding 并不是只能用这种“独立服务”的方式来部署。它也可以直接耦合在业务代码里，也就是由后端程序自己加载模型、自己完成文本转向量的过程。只是当前这套教程为了让工程结构更清晰、服务职责更独立，选择了“单独部署成推理服务”这条方案。 这里的容器里运行的，也不是我们平时理解的那种“对话大模型”，而是一个专门负责把文本转换成向量的 Embedding 模型。它的职责不是生成回答，而是把字段说明、指标说明、用户问题等文本编码成向量，供后续的向量检索使用。
+ **Embedding 服务挂载了本地模型目录**`./embedding/bge-large-zh-v1.5:/models/bge-large-zh-v1.5` 的作用，是把本地模型权重映射到容器中，再通过 `MODEL_ID` 告诉服务从哪里加载模型。
+ **教学环境使用的是 CPU 版本的 Embedding 服务** 这样做主要是为了降低本地部署门槛。真实生产环境中，如果追求更高性能，通常会改用 GPU 版本。  


如果把这一整段压缩成一句更容易记忆的话，可以这样理解：

**这份 **`**Compose**`** 文件的价值，不只是启动容器，而是把“数据库、检索、向量化”这一整套基础能力一次性准备好。**

---

**本章小结：**

这一章的目标，是先把开发环境的整体思路建立起来。你需要知道后端为什么使用 `uv`、项目可以如何创建、常用依赖命令有哪些、为什么课程里推荐用 Docker 统一启动服务，只要这一层认知搭好了，下一章进入基础服务配置学习时，你就不会觉得“代码是一套、环境又是另一套”。








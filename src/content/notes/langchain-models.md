---
title: "LangChain Models：模型调用与工具使用"
description: "依据 LangChain Models 文档整理聊天模型初始化、调用与流式输出、工具调用、结构化输出和高级配置。"
category: "ai"
tags: ["LangChain","大语言模型","模型调用","工具调用","官方文档"]
cover: "neural"
importedAt: "2026-10-24"
sourceLabel: "LangChain 官方文档学习笔记，含个人批注与译文整理"
---

> 虽然这章相对基础点，但是还是建议关闭自动补全，手打一下常用的代码，以为自己会打和真的会打还是有区别
>
> 
>
> 创建chat模型
>
> from langchain.chat_models import init_chat_model
>
> model = init_chat_model(model=,api_key=,base_url=,model_provider=)
>
> 
>
> 只看了前面的，高级主题还没看
>

# **基本用法**
模型可以以两种方式使用：

1. **与智能体（agents）一起使用** – 在创建代理时，模型可以动态指定。
2. **独立使用** – 模型可以直接调用（在代理循环之外）用于文本生成、分类或提取等任务，无需代理框架。

## **初始化模型**
在 LangChain 中使用独立模型的最简单方法是通过 ` `init_chat_model` ` 从您选择的聊天模型提供商初始化（示例如下）：

```bash
pip install -U "langchain[openai]"
```

```bash
uv add "langchain[openai]"
```

```python
import os
from langchain.chat_models import init_chat_model

os.environ["OPENAI_API_KEY"] = "sk-..."

model = init_chat_model("gpt-5.5")
```

```python
import os
from langchain_openai import ChatOpenAI

os.environ["OPENAI_API_KEY"] = "sk-..."

model = ChatOpenAI(model="gpt-5.5")
```

> 这两个 init_chat_model()有什么区别 
>
> `init_chat_model`是一个**工厂函数**，你可以把它理解为一个"万能适配器"。它的设计目标是**提供统一的接口来初始化来自任何受支持提供商的聊天模型**，而不仅限于OpenAI。
>
> `ChatOpenAI`是`langchain_openai`包中为OpenAI API专门设计的**具体实现类**。它直接继承了LangChain的标准接口，提供了最直接、**细粒度的配置方式**。
>

```python
response = model.invoke("为什么鹦鹉会说话？")
```



## 参数
聊天模型接受可用于配置其行为的参数。支持参数的完整集因模型和提供商而异，但标准参数包括：

**model** `string` _required_

您希望使用的特定模型的名称或标识符。您还可以使用 '{model_provider}:{model}' 格式在单个参数中同时指定模型及其提供商，例如 'openai:o1'。

**api****_****key** `string`

用于与模型提供商进行身份验证所需的密钥。这通常是在您注册访问模型时颁发的。通常通过设置 环境变量 (其值在程序外部设置的变量，通常通过操作系统或微服务内置的功能实现。) 来访问。

**temperature** `number`

控制模型输出的随机性。较高的数字使响应更具创造性；较低的数字使响应更具确定性。

**max****_****tokens** `number`

限制响应中的 令牌 (模型读取和生成的基本单位。提供商可能有不同的定义，但一般来说，它们可以代表整个或部分单词。) 总数，有效地控制输出可以有多长。

**timeout** `number`

在取消请求之前等待模型响应的最长时间（以秒为单位）。

**max****_****retries** `number` (default: 6)

如果由于网络超时或速率限制等问题导致请求失败，系统将尝试重新发送请求的最大次数。重试使用带有抖动的指数退避。网络错误、速率限制 (429) 和服务器错误 (5xx) 会自动重试。客户端错误如 401（未授权）或 404 不会重试。对于不可靠网络上的长时间运行 [智能体](https://docs.langchain.com/oss/python/deepagents/overview.md) 任务，考虑将此增加到 10–15。

使用 `[init_chat_model](https://reference.langchain.com/python/langchain/chat_models/base/init_chat_model)`，将这些参数作为内联 `**kwargs` (任意关键字参数) 传递：

```python
model = init_chat_model(
    "claude-sonnet-4-6",
    # Kwargs passed to the model:
    temperature=0.7,
    timeout=30,
    max_tokens=1000,
    max_retries=6,  # Default; increase for unreliable networks
)
```

> [!NOTE]
>
> 每个聊天模型集成可能有额外的参数用于控制特定于提供商的功能。
>
> 例如，`[ChatOpenAI](https://reference.langchain.com/python/langchain-openai/chat_models/base/ChatOpenAI)` 有 `use_responses_api` 来决定是使用 OpenAI Responses 还是 Completions API。
>
> 要查找给定聊天模型支持的所有参数，请访问 [聊天模型集成](https://docs.langchain.com/oss/python/integrations/chat.md) 页面。
>



也可以写在.env文件里面，通过 load_dotenv = os.getenv(encoding='utf-8') 加载

```python
import os
from dotenv import load_dotenv
load_dotenv = os.getenv(encoding='utf-8')


model = init_chat_model(
    model="gpt-oss-20b",  # 模型名称或者ID
    model_provider="openai",
    api_key=os.getenv("custom-api-key"),
    base_url=os.getenv("custom-api-base-url"),
    max_tokens=2048,
    max_retries=3,
    timeout=60,
)
```

## 调用
必须调用聊天模型才能生成输出。有三种主要的调用方法，每种方法都适用于不同的用例。

### 调用
调用模型最直接的方法是使用 `[invoke()](https://reference.langchain.com/python/langchain-core/language_models/chat_models/BaseChatModel/invoke)` 并传入单条消息或消息列表。

```python
response = model.invoke("Why do parrots have colorful feathers?")
print(response)
```

可以向聊天模型提供消息列表以表示对话历史。每条消息都有一个角色，模型使用该角色指示对话中谁发送了消息。

有关角色、类型和内容的更多详细信息，请参阅 [消息](https://docs.langchain.com/oss/python/langchain/messages.md) 指南。

```python
conversation = [
    {"role": "system", "content": "You are a helpful assistant that translates English to French."},
    {"role": "user", "content": "Translate: I love programming."},
    {"role": "assistant", "content": "J'adore la programmation."},
    {"role": "user", "content": "Translate: I love building applications."}
]

response = model.invoke(conversation)
print(response)  # AIMessage("J'adore créer des applications.")
```

> 可以看到 除了 “content“ 还有一些其它信息
>

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1792746717161-4ffcc3db-d8c1-4530-a5c8-4b21b1316055.png)

> 问题 如果说conversation里面最后一条是 role assistant 或者说不规范会发生什么
>
> 如果 `conversation` 列表的最后一条是 `role: "assistant"`，或者格式不规范，结果**完全取决于你背后使用的模型提供商**。对于你之前代码中可能的 `gpt-5.5`（OpenAI 接口），它可能不会立即报错，甚至会被用作“预填充”来引导模型补全；但对于 **Anthropic（Claude）或 MistralAI**，这通常会直接导致一个 `**400 Bad Request**`** 错误**。
>

```python
from langchain.messages import HumanMessage, AIMessage, SystemMessage

conversation = [
    SystemMessage("You are a helpful assistant that translates English to French."),
    HumanMessage("Translate: I love programming."),
    AIMessage("J'adore la programmation."),
    HumanMessage("Translate: I love building applications.")
]

response = model.invoke(conversation)
print(response)  # AIMessage("J'adore créer des applications.")
```

> 如果您的调用返回类型是字符串，请确保您使用的是chat model而不是 LLM。传统的文本补全 LLM 直接返回字符串。LangChain 聊天模型以前缀 "Chat" 开头，例如 `[ChatOpenAI](https://reference.langchain.com/python/langchain-openai/chat_models/base/ChatOpenAI)`(/oss/integrations/chat/openai)。
>

> 为什么？
>
> LangChain 提供了两类语言模型，它们的设计哲学截然不同：
>
> **1. Chat Model（聊天模型）—— 对话式交互**  
你的代码使用的正是这一类，例如 `ChatOpenAI`、`ChatAnthropic`。
>
> + **输入**：**消息列表**。就像你代码里的 `[SystemMessage(...), HumanMessage(...)]`，每条消息都有明确的角色（system / human / ai）。
> + **输出**：**始终是 **`**AIMessage**`** 对象**。这个对象不仅包含回复文本（`.content`），还封装了元数据、工具调用等结构化信息。
> + **设计目标**：专门为**多轮对话**和**复杂的代理（Agent）工作流**而设计，能精确管理对话历史。
>
> **2. LLM（传统文本补全模型）—— 字符串管道**  
这就是提示中提到的“传统 LLM”，例如 `OpenAI`（非 `ChatOpenAI`）。
>
> + **输入**：**一个纯字符串**（prompt）。
> + **输出**：**一个纯字符串**（completion）。
> + **设计目标**：像一条**无状态的管道**，只负责“字符串进，字符串出”，不内置对话历史的概念。
>

### 流式传输
大多数模型可以在生成过程中流式传输其输出内容。通过渐进式显示输出，流式传输显著改善了用户体验，特别是对于较长的响应。

调用 `[stream()](https://reference.langchain.com/python/langchain-core/language_models/chat_models/BaseChatModel/stream)` 返回一个 迭代器 (按顺序逐步提供对集合中每个项的访问的对象。)，该迭代器在产生时输出块。您可以使用循环实时处理每个块：

```python
for chunk in model.stream("Why do parrots have colorful feathers?"):
    print(chunk.text, end="|", flush=True)
```

```python
for chunk in model.stream("What color is the sky?"):
    for block in chunk.content_blocks:
        if block["type"] == "reasoning" and (reasoning := block.get("reasoning")):
            print(f"Reasoning: {reasoning}")
        elif block["type"] == "tool_call_chunk":
            print(f"Tool call chunk: {block}")
        elif block["type"] == "text":
            print(block["text"])
        else:
            ...
```

与 `[invoke()](#invoke)` 不同（它在模型完成生成完整响应后返回单个 `[AIMessage](https://reference.langchain.com/python/langchain-core/messages/ai/AIMessage)`），`stream()` 返回多个 `[AIMessageChunk](https://reference.langchain.com/python/langchain-core/messages/ai/AIMessageChunk)` 对象，每个对象包含一部分输出文本。重要的是，流中的每个块都设计为可以通过求和收集为完整消息：

```python
full = None  # None | AIMessageChunk
for chunk in model.stream("What color is the sky?"):
    full = chunk if full is None else full + chunk
    print(full.text)

# The
# The sky
# The sky is
# The sky is typically
# The sky is typically blue
# ...

print(full.content_blocks)
# [{"type": "text", "text": "The sky is typically blue..."}]
```

生成的消息可以与使用 `[invoke()](#invoke)` 生成的消息一样处理——例如，它可以聚合到消息历史记录中，并作为对话上下文传递回模型。

> [!WARNING]
>
> 仅当程序中的所有步骤都知道如何处理块流时，流式传输才有效。例如，无法流式传输的应用程序可能需要先在整个内存中存储输出才能进行处理。
>

> **高级流式传输主题**
>

> **流式传输事件**
>
> LangChain 聊天模型也可以使用 `astream_events()` 流式传输语义事件。
>
> 这简化了基于事件类型和其他元数据的过滤，并将在后台聚合完整消息。下面是一个示例。
>

```plain
async for event in model.astream_events("Hello"):

    if event["event"] == "on_chat_model_start":
        print(f"Input: {event['data']['input']}")

    elif event["event"] == "on_chat_model_stream":
        print(f"Token: {event['data']['chunk'].text}")

    elif event["event"] == "on_chat_model_end":
        print(f"Full message: {event['data']['output'].text}")

    else:
        pass
```

```plain
Input: Hello
Token: Hi
Token:  there
Token: !
Token:  How
Token:  can
Token:  I
...
Full message: Hi there! How can I help today?
```

> 有关事件类型和其他详细信息，请参见 `[astream_events()](https://reference.langchain.com/python/langchain_core/language_models/#langchain_core.language_models.chat_models.BaseChatModel.astream_events)` 参考。
>

> **“自动流式传输”聊天模型**
>
> LangChain 通过在特定情况下自动启用流式传输模式来简化聊天模型的流式传输，即使您没有显式调用流式传输方法。当您使用非流式传输调用方法但仍希望流式传输整个应用程序（包括来自聊天模型的中间结果）时，这特别有用。
>
> 例如，在 [LangGraph 智能体](https://docs.langchain.com/oss/python/langchain/agents.md) 中，您可以在节点中调用 `model.invoke()`，但如果以流式传输模式运行，LangChain 将自动委托给流式传输。
>
> #### 工作原理
> 当您 `invoke()` 聊天模型时，如果检测到您正在尝试流式传输整个应用程序，LangChain 将自动切换到内部流式传输模式。就使用 invoke 的代码而言，调用的结果将是相同的；然而，在聊天模型被流式传输时，LangChain 将负责在 LangChain 的回调系统中调用 `[on_llm_new_token](https://reference.langchain.com/python/langchain-core/callbacks/base/AsyncCallbackHandler/on_llm_new_token)` 事件。
>
> 回调事件允许 LangGraph `stream()` 和 `astream_events()` 实时显示聊天模型的输出。
>

### 批处理
将一组独立的请求批处理到模型中可以显著提高性能并降低成本，因为处理可以并行完成：

```python
responses = model.batch([
    "Why do parrots have colorful feathers?",
    "How do airplanes fly?",
    "What is quantum computing?"
])
for response in responses:
    print(response)
```

> 本节描述了聊天模型方法 `[batch()](https://reference.langchain.com/python/langchain_core/language_models/#langchain_core.language_models.chat_models.BaseChatModel.batch)`，它在客户端并行化模型调用。
>
> 它**不同于**推理提供商支持的批处理 API，例如 [OpenAI](https://platform.openai.com/docs/guides/batch) 或 [Anthropic](https://platform.claude.com/docs/en/build-with-claude/batch-processing#message-batches-api)。
>

默认情况下，`[batch()](https://reference.langchain.com/python/langchain_core/language_models/#langchain_core.language_models.chat_models.BaseChatModel.batch)` 将仅返回整个批次的最终输出。如果您希望在每个输入完成生成时接收其输出，可以使用 `[batch_as_completed()](https://reference.langchain.com/python/langchain_core/language_models/#langchain_core.language_models.chat_models.BaseChatModel.batch_as_completed)` 流式传输结果：

```python
for response in model.batch_as_completed([
    "Why do parrots have colorful feathers?",
    "How do airplanes fly?",
    "What is quantum computing?"
]):
    print(response)
```

> 使用 `[batch_as_completed()](https://reference.langchain.com/python/langchain_core/language_models/#langchain_core.language_models.chat_models.BaseChatModel.batch_as_completed)` 时，结果可能会乱序到达。每个结果都包含输入索引，以便根据需要匹配以重建原始顺序。
>

> 使用 `[batch()](https://reference.langchain.com/python/langchain_core/language_models/#langchain_core.language_models.chat_models.BaseChatModel.batch)` 或 `[batch_as_completed()](https://reference.langchain.com/python/langchain_core/language_models/#langchain_core.language_models.chat_models.BaseChatModel.batch_as_completed)` 处理大量输入时，您可能希望控制最大并行调用数。这可以通过在 `[RunnableConfig](https://reference.langchain.com/python/langchain-core/runnables/config/RunnableConfig)` 字典中设置 `[max_concurrency](https://reference.langchain.com/python/langchain-core/runnables/config/RunnableConfig)` 属性来完成。
>
> 有关支持属性的完整列表，请参见 `[RunnableConfig](https://reference.langchain.com/python/langchain-core/runnables/config/RunnableConfig)` 参考。
>

```plain
model.batch(
    list_of_inputs,
    config={
        'max_concurrency': 5,  # Limit to 5 parallel calls
    }
)
```

有关批处理的更多详细信息，请参见 [reference](https://reference.langchain.com/python/langchain_core/language_models/#langchain_core.language_models.chat_models.BaseChatModel.batch)。

## 工具调用
模型可以请求调用执行任务的工具，例如从数据库获取数据、搜索网络或运行代码。工具是以下两者的配对：

1. 一个模式，包括工具的名称、描述和/或参数定义（通常是 JSON 模式）
2. 一个函数或 协程 (一种可以挂起执行并在稍后恢复的方法) 来执行。

> 您可能听说过“函数调用”一词。我们将其与“工具调用”互换使用。
>

以下是用户和模型之间的基本工具调用流程：

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/svg/40625813/1792747937627-204b4938-47d6-471e-be69-53022fb39be2.svg)

要使您定义的工具可供模型使用，必须使用 `[bind_tools](https://reference.langchain.com/python/langchain-core/language_models/chat_models/BaseChatModel/bind_tools)` 将它们绑定。在随后的调用中，模型可以选择按需调用任何绑定的工具。

某些模型提供商提供 内置工具 (在服务端执行的工具，例如网络搜索和代码解释器)，可以通过模型或调用参数启用（例如 `[ChatOpenAI](/oss/python/integrations/chat/openai)`、`[ChatAnthropic](/oss/python/integrations/chat/anthropic)`）。有关详细信息，请查看各自的 [提供商参考](https://docs.langchain.com/oss/python/integrations/providers/overview.md)。

> 有关创建工具的详细信息和其他选项，请参阅 [工具指南](https://docs.langchain.com/oss/python/langchain/tools.md)。
>

```python
from langchain.tools import tool

@tool
def get_weather(location: str) -> str:
    """Get the weather at a location."""
    return f"It's sunny in {location}."


model_with_tools = model.bind_tools([get_weather])  # [!code highlight]

response = model_with_tools.invoke("What's the weather like in Boston?")
for tool_call in response.tool_calls:
    # View tool calls made by the model
    print(f"Tool: {tool_call['name']}")
    print(f"Args: {tool_call['args']}")
```

> <!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1792757505311-e49be6fc-204c-4e58-bbd6-752a85312cdf.png)
>
> 这种情况，模型只执行了一次工具调用，没有输出
>

绑定用户定义的工具时，模型的响应包括执行工具的**请求**。当单独使用模型而不使用 [智能体](https://docs.langchain.com/oss/python/langchain/agents.md) 时，您需要执行请求的工具并将结果返回给模型以供后续推理使用。当使用 [智能体](https://docs.langchain.com/oss/python/langchain/agents.md) 时，智能体循环将为您处理工具执行循环。

下面，我们展示了一些您可以使用工具调用的常见方式。

> **工具执行循环**
>
> 当模型返回工具调用时，您需要执行工具并将结果传递回模型。这会创建一个对话循环，模型可以使用工具结果生成最终响应。LangChain 包括 [智能体](https://docs.langchain.com/oss/python/langchain/agents.md) 抽象，为您处理此编排。
>
> 这是一个如何执行的简单示例：
>
> 工具返回的每个 `[ToolMessage](https://reference.langchain.com/python/langchain-core/messages/tool/ToolMessage)` 都包含一个 `tool_call_id`，它与原始工具调用匹配，帮助模型将结果与请求关联起来。
>

```python
# Bind (potentially multiple) tools to the model
model_with_tools = model.bind_tools([get_weather])

# Step 1: Model generates tool calls
messages = [{"role": "user", "content": "What's the weather in Boston?"}]
ai_msg = model_with_tools.invoke(messages)
messages.append(ai_msg)

# Step 2: Execute tools and collect results
for tool_call in ai_msg.tool_calls:
    # Execute the tool with the generated arguments
    tool_result = get_weather.invoke(tool_call)
    messages.append(tool_result)

# Step 3: Pass results back to model for final response
final_response = model_with_tools.invoke(messages)
print(final_response.text)
# "The current weather in Boston is 72°F and sunny."
```

> <!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1792757541031-3b998146-aa70-4540-980e-981121db0b54.png)
>
> 这种情况模型看到了工具调用才有输出
>

> **强制工具调用**
>
> 默认情况下，模型有权根据用户的输入选择使用哪个绑定的工具。但是，您可能希望强制选择工具，确保模型使用特定工具或给定列表中的**任何**工具：
>

```plain
model_with_tools = model.bind_tools([tool_1], tool_choice="any")
```

```plain
model_with_tools = model.bind_tools([tool_1], tool_choice="tool_1")
```

> **并行工具调用**
>
> 许多模型支持在适当时并行调用多个工具。这允许模型同时从不同来源获取信息。
>
> 模型根据请求操作的独立性智能地确定何时并行执行是合适的。
>

```python
model_with_tools = model.bind_tools([get_weather])

response = model_with_tools.invoke(
    "What's the weather in Boston and Tokyo?"
)


# The model may generate multiple tool calls
print(response.tool_calls)
# [
#   {'name': 'get_weather', 'args': {'location': 'Boston'}, 'id': 'call_1'},
#   {'name': 'get_weather', 'args': {'location': 'Tokyo'}, 'id': 'call_2'},
# ]


# Execute all tools (can be done in parallel with async)
results = []
for tool_call in response.tool_calls:
    if tool_call['name'] == 'get_weather':
        result = get_weather.invoke(tool_call)
    ...
    results.append(result)
```

> 大多数支持工具调用的模型默认启用并行工具调用。一些（包括 [OpenAI](https://docs.langchain.com/oss/python/integrations/chat/openai) 和 [Anthropic](https://docs.langchain.com/oss/python/integrations/chat/anthropic)）允许您禁用此功能。为此，请设置 `parallel_tool_calls=False`：
>

```python
model.bind_tools([get_weather], parallel_tool_calls=False)
```

> **流式传输工具调用**
>
> 流式传输响应时，工具调用通过 `[ToolCallChunk](https://reference.langchain.com/python/langchain-core/messages/tool/ToolCallChunk)` 逐步构建。这允许您在生成时查看工具调用，而无需等待完整响应。
>
> 您可以累积块以构建完整的工具调用：
>

```python
for chunk in model_with_tools.stream(
    "What's the weather in Boston and Tokyo?"
):
    # Tool call chunks arrive progressively
    for tool_chunk in chunk.tool_call_chunks:
        if name := tool_chunk.get("name"):
            print(f"Tool: {name}")
        if id_ := tool_chunk.get("id"):
            print(f"ID: {id_}")
        if args := tool_chunk.get("args"):
            print(f"Args: {args}")

# Output:
# Tool: get_weather
# ID: call_SvMlU1TVIZugrFLckFE2ceRE
# Args: {"lo
# Args: catio
# Args: n": "B
# Args: osto
# Args: n"}
# Tool: get_weather
# ID: call_QMZdy6qInx13oWKE7KhuhOLR
# Args: {"lo
# Args: catio
# Args: n": "T
# Args: okyo
# Args: "}
```

```python
gathered = None
for chunk in model_with_tools.stream("What's the weather in Boston?"):
    gathered = chunk if gathered is None else gathered + chunk
    print(gathered.tool_calls)
```

## 结构化输出
可以要求模型以匹配给定模式的格式提供响应。这对于确保输出可以轻松解析并在后续处理中使用非常有用。LangChain 支持多种模式类型和强制执行结构化输出的方法。

> 要了解结构化输出，请参阅 [结构化输出](https://docs.langchain.com/oss/python/langchain/structured-output)。
>

**Pydantic**

Pydantic 模型 提供最丰富的功能集，包括字段验证、描述和嵌套结构。

```python
from pydantic import BaseModel, Field

class Movie(BaseModel):
    """A movie with details."""
    title: str = Field(description="The title of the movie")
    year: int = Field(description="The year the movie was released")
    director: str = Field(description="The director of the movie")
    rating: float = Field(description="The movie's rating out of 10")

model_with_structure = model.with_structured_output(Movie)
response = model_with_structure.invoke("Provide details about the movie Inception")
print(response)  # Movie(title="Inception", year=2010, director="Christopher Nolan", rating=8.8)
```

<!-- 这是一张图片，ocr 内容为： -->
![](https://cdn.nlark.com/yuque/0/2026/png/40625813/1792758020760-de208d61-51f3-4983-8d53-dbeacdf5926e.png)

**TypedDict**

Python 的 `TypedDict` 提供了比 Pydantic 模型更简单的替代方案，适合不需要运行时验证的情况。

```python
from typing_extensions import TypedDict, Annotated

class MovieDict(TypedDict):
    """A movie with details."""
    title: Annotated[str, ..., "The title of the movie"]
    year: Annotated[int, ..., "The year the movie was released"]
    director: Annotated[str, ..., "The director of the movie"]
    rating: Annotated[float, ..., "The movie's rating out of 10"]

model_with_structure = model.with_structured_output(MovieDict)
response = model_with_structure.invoke("Provide details about the movie Inception")
print(response)  # {'title': 'Inception', 'year': 2010, 'director': 'Christopher Nolan', 'rating': 8.8}
```

**JSON Schema**

提供 [JSON Schema](https://json-schema.org/understanding-json-schema/about) 以获得最大的控制和互操作性。

```python
import json

json_schema = {
    "title": "Movie",
    "description": "A movie with details",
    "type": "object",
    "properties": {
        "title": {
            "type": "string",
            "description": "The title of the movie"
        },
        "year": {
            "type": "integer",
            "description": "The year the movie was released"
        },
        "director": {
            "type": "string",
            "description": "The director of the movie"
        },
        "rating": {
            "type": "number",
            "description": "The movie's rating out of 10"
        }
    },
    "required": ["title", "year", "director", "rating"]
}

model_with_structure = model.with_structured_output(
    json_schema,
    method="json_schema",
)
response = model_with_structure.invoke("Provide details about the movie Inception")
print(response)  # {'title': 'Inception', 'year': 2010, ...}
```

> **结构化输出的关键注意事项**
>
> + **Method 参数**：某些提供商支持不同的结构化输出方法：
>     - `'json_schema'`：使用提供商提供的专用结构化输出功能。
>     - `'function_calling'`：通过强制遵循给定模式的 [工具调用](#tool-calling) 派生出结构化输出。
>     - `'json_mode'`：某些提供商提供的 `'json_schema'` 的前身。生成有效的 JSON，但模式必须在提示词中描述。
> + **Include raw**：设置 `include_raw=True` 以获取解析后的输出和原始 AI 消息。
> + **Validation**：Pydantic 模型提供自动验证。`TypedDict` 和 JSON Schema 需要手动验证。
>
> 有关支持的方法和配置选项，请查看您的 提供商集成页面。
>

> **示例：消息输出与解析结构并存**
>
> 返回原始 `[AIMessage](https://reference.langchain.com/python/langchain-core/messages/ai/AIMessage)` 对象 alongside 解析后的表示形式以访问响应元数据（如 [令牌用量](#token-usage)）可能很有用。为此，在调用 `[with_structured_output](https://reference.langchain.com/python/langchain-core/language_models/chat_models/BaseChatModel/with_structured_output)` 时设置 `[include_raw=True](https://reference.langchain.com/python/langchain-core/language_models/chat_models/BaseChatModel/with_structured_output)`：
>

```python
from pydantic import BaseModel, Field

class Movie(BaseModel):
    """A movie with details."""
    title: str = Field(description="The title of the movie")
    year: int = Field(description="The year the movie was released")
    director: str = Field(description="The director of the movie")
    rating: float = Field(description="The movie's rating out of 10")

model_with_structure = model.with_structured_output(Movie, include_raw=True)  # [!code highlight]
response = model_with_structure.invoke("Provide details about the movie Inception")
response
# {
#     "raw": AIMessage(...),
#     "parsed": Movie(title=..., year=..., ...),
#     "parsing_error": None,
# }
```

> **示例：嵌套结构**
>
> 模式可以是嵌套的：
>

```python
from pydantic import BaseModel, Field

class Actor(BaseModel):
    name: str
    role: str

class MovieDetails(BaseModel):
    title: str
    year: int
    cast: list[Actor]
    genres: list[str]
    budget: float | None = Field(None, description="Budget in millions USD")

model_with_structure = model.with_structured_output(MovieDetails)
```

```python
from typing_extensions import Annotated, TypedDict

class Actor(TypedDict):
    name: str
    role: str

class MovieDetails(TypedDict):
    title: str
    year: int
    cast: list[Actor]
    genres: list[str]
    budget: Annotated[float | None, ..., "Budget in millions USD"]

model_with_structure = model.with_structured_output(MovieDetails)
```

## 高级主题
### 模型档案
> 模型档案需要 `langchain>=1.1`。
>

LangChain 聊天模型可以通过 `profile` 属性暴露支持的功能和能力的字典：

```json
model.profile
# {
  #   "max_input_tokens": 400000,
  #   "image_inputs": True,
  #   "reasoning_output": True,
  #   "tool_calling": True,
  #   ...
  # }
```

有关字段的完整列表，请参见 [API 参考](https://reference.langchain.com/python/langchain-core/language_models/model_profile/ModelProfile)。

大部分模型档案数据由 [models.dev](https://github.com/sst/models.dev) 项目提供支持，这是一个提供模型能力数据的开源倡议。这些数据经过增强，添加了额外字段以用于与 LangChain 配合使用。这些增强内容与上游项目的演变保持一致。

模型档案数据允许应用程序动态绕过模型能力。例如：

1. [摘要中间件](https://docs.langchain.com/oss/python/langchain/middleware/built-in.md#summarization) 可以根据模型的上下文窗口大小触发摘要。
2. `create_agent` 中的 [结构化输出](https://docs.langchain.com/oss/python/langchain/structured-output.md) 策略可以自动推断（例如，通过检查对原生结构化输出功能的支持）。
3. 模型输入可以根据支持的 [模态](#multimodal) 和最大输入令牌进行限制。
4. [Deep Agents CLI](https://docs.langchain.com/oss/python/deepagents/cli.md) 将 [交互式模型切换器](https://docs.langchain.com/oss/python/deepagents/cli/providers.md#which-models-appear-in-the-switcher) 过滤为报告 `tool_calling` 支持和文本 I/O 的模型，并在选择器详细视图中显示上下文窗口大小和能力标志。

> **更新或覆盖档案数据**
>
> 如果模型档案数据缺失、过时或不正确，可以更改它。
>
> **选项 1（快速修复）**
>
> 您可以使用任何有效的档案实例化聊天模型：
>
> `profile` 也是一个普通的 `dict`，可以就地更新。如果模型实例是共享的，请考虑使用 `model_copy` 以避免修改共享状态。
>
> **选项 2（修复上游数据）**
>
> 数据的主要来源是 [models.dev](https://models.dev/) 项目。这些数据与 LangChain [集成包](https://docs.langchain.com/oss/python/integrations/providers/overview.md) 中的额外字段和覆盖合并，并随这些包一起分发。
>
> 模型档案数据可以通过以下过程更新：
>
> 1. （如果需要）通过向其 [GitHub 仓库](https://github.com/sst/models.dev) 提交拉取请求来更新 [models.dev](https://models.dev/) 处的源数据。
> 2. （如果需要）通过向 LangChain [集成包](https://docs.langchain.com/oss/python/integrations/providers/overview.md) 提交拉取请求来更新 `langchain_<package>/data/profile_augmentations.toml` 中的额外字段和覆盖。
> 3. 使用 `[langchain-model-profiles](https://pypi.org/project/langchain-model-profiles/)` CLI 工具从 [models.dev](https://models.dev/) 拉取最新数据，合并增强内容并更新档案数据：
>
> 此命令：
>
> + 从 models.dev 下载 `<provider>` 的最新数据
> + 合并 `<data_dir>` 中 `profile_augmentations.toml` 的增强内容
> + 将合并的档案写入 `<data_dir>` 中的 `profiles.py`
>
> 例如：从 [LangChain monorepo](https://github.com/langchain-ai/langchain) 中的 `[libs/partners/anthropic](https://github.com/langchain-ai/langchain/tree/master/libs/partners/anthropic)`：
>

```plain
custom_profile = {
    "max_input_tokens": 100_000,
    "tool_calling": True,
    "structured_output": True,
    # ...
}
model = init_chat_model("...", profile=custom_profile)
```

```plain
new_profile = model.profile | {"key": "value"}
model.model_copy(update={"profile": new_profile})
```

```plain
pip install langchain-model-profiles
```

```plain
langchain-profiles refresh --provider <provider> --data-dir <data_dir>
```

```plain
uv run --with langchain-model-profiles --provider anthropic --data-dir langchain_anthropic/data
```

> [!WARNING]
>
> 模型档案是一项 beta 功能。档案的格式可能会更改。
>

### 多模态
某些模型可以处理并返回非文本数据，如图像、音频和视频。您可以通过提供 [内容块](https://docs.langchain.com/oss/python/langchain/messages.md#message-content) 将非文本数据传递给模型。

> [!TIP]
>
> 所有具有底层多模态功能的 LangChain 聊天模型都支持：
>
> 1. 跨提供商标准格式的数据（见 [我们的消息指南](https://docs.langchain.com/oss/python/langchain/messages.md)）
> 2. OpenAI [聊天补全](https://platform.openai.com/docs/api-reference/chat) 格式
> 3. 特定于该提供商的任何格式（例如，Anthropic 模型接受 Anthropic 原生格式）
>

有关详细信息，请参阅消息指南的 [多模态部分](https://docs.langchain.com/oss/python/langchain/messages.md#multimodal)。

某些模型 (并非所有 LLM 都一样！) 可以在其响应中返回多模态数据。如果被调用这样做，生成的 `[AIMessage](https://reference.langchain.com/python/langchain-core/messages/ai/AIMessage)` 将具有多模态类型的內容块。

```plain
response = model.invoke("Create a picture of a cat")
print(response.content_blocks)
# [
#     {"type": "text", "text": "Here's a picture of a cat"},
#     {"type": "image", "base64": "...", "mime_type": "image/jpeg"},
# ]
```

有关特定提供商的详细信息，请参阅 [集成页面](https://docs.langchain.com/oss/python/integrations/providers/overview.md)。

### 推理
许多模型能够执行多步推理以得出结论。这涉及将复杂问题分解为更小、更易管理的步骤。

**如果底层模型支持**，您可以显示此推理过程以更好地了解模型如何得出最终答案。

```plain
for chunk in model.stream("Why do parrots have colorful feathers?"):
    reasoning_steps = [r for r in chunk.content_blocks if r["type"] == "reasoning"]
    print(reasoning_steps if reasoning_steps else chunk.text)
```

```plain
response = model.invoke("Why do parrots have colorful feathers?")
reasoning_steps = [b for b in response.content_blocks if b["type"] == "reasoning"]
print(" ".join(step["reasoning"] for step in reasoning_steps))
```

根据模型的不同，有时您可以指定它应该投入多少精力进行推理。同样，您可以要求模型完全关闭推理。这可能采取推理“层级”（例如，`'low'` 或 `'high'`）或整数令牌预算的形式。

有关详细信息，请查看您的相应聊天模型的 [集成页面](https://docs.langchain.com/oss/python/integrations/providers/overview.md) 或 [参考](https://reference.langchain.com/python/integrations/)。

### 本地模型
LangChain 支持在您自己的硬件上本地运行模型。这对于数据隐私至关重要的场景、您想调用自定义模型的场景，或者您想避免使用基于云的模型所产生的成本的场景非常有用。

[Ollama](https://docs.langchain.com/oss/python/integrations/chat/ollama) 是本地运行聊天和嵌入模型最简单的方法之一。

### 提示词缓存
许多提供商提供提示词缓存功能，以减少重复处理相同令牌的延迟和成本。这些功能可以是 **隐式** 或 **显式** 的：

+ **隐式提示词缓存**：如果请求命中缓存，提供商将自动传递成本节省。示例：[OpenAI](https://docs.langchain.com/oss/python/integrations/chat/openai) 和 [Gemini](https://docs.langchain.com/oss/python/integrations/chat/google_generative_ai)。
+ **显式缓存**：提供商允许您手动指示缓存点以获得更大的控制或保证成本节省。示例：
    - `[ChatOpenAI](https://reference.langchain.com/python/langchain-openai/chat_models/base/ChatOpenAI)`（通过 `prompt_cache_key`）
    - Anthropic 的 `[AnthropicPromptCachingMiddleware](/oss/python/integrations/chat/anthropic#prompt-caching)`
    - [Gemini](https://reference.langchain.com/python/integrations/langchain_google_genai/)。
    - [AWS Bedrock](https://docs.langchain.com/oss/python/integrations/chat/bedrock#prompt-caching)

> [!WARNING]
>
> 提示词缓存通常在最小输入令牌阈值以上才会启用。有关详细信息，请查看 [提供商页面](https://docs.langchain.com/oss/python/integrations/chat.md)。
>

缓存使用情况将反映在模型响应的 [用量元数据](https://docs.langchain.com/oss/python/langchain/messages.md#token-usage) 中。

### 服务端工具使用
某些提供商支持服务端 [工具调用](#tool-calling) 循环：模型可以与网络搜索、代码解释器和其他工具交互，并在单个对话回合中分析结果。

如果模型在服务端调用工具，响应消息的内容将包括代表工具调用和结果的內容。访问响应的 [内容块](https://docs.langchain.com/oss/python/langchain/messages.md#standard-content-blocks) 将以与提供商无关的格式返回服务端工具调用和结果：

```plain
from langchain.chat_models import init_chat_model

model = init_chat_model("gpt-4.1-mini")

tool = {"type": "web_search"}
model_with_tools = model.bind_tools([tool])

response = model_with_tools.invoke("What was a positive news story from today?")
print(response.content_blocks)
```

```plain
[
    {
        "type": "server_tool_call",
        "name": "web_search",
        "args": {
            "query": "positive news stories today",
            "type": "search"
        },
        "id": "ws_abc123"
    },
    {
        "type": "server_tool_result",
        "tool_call_id": "ws_abc123",
        "status": "success"
    },
    {
        "type": "text",
        "text": "Here are some positive news stories from today...",
        "annotations": [
            {
                "end_index": 410,
                "start_index": 337,
                "title": "article title",
                "type": "citation",
                "url": "..."
            }
        ]
    }
]
```

这代表单个对话回合；没有相关的 [ToolMessage](https://docs.langchain.com/oss/python/langchain/messages.md#tool-message) 对象需要在客户端 [工具调用](#tool-calling) 中传递。

有关可用工具和用法详细信息，请查看您的给定提供商的 [集成页面](https://docs.langchain.com/oss/python/integrations/chat.md)。

### 速率限制
许多聊天模型提供商限制了给定时间段内可进行的调用次数。如果您达到速率限制，通常会收到提供商的速率限制错误响应，并且需要等待后才能发出更多请求。

为了帮助管理速率限制，聊天模型集成接受 `rate_limiter` 参数，可以在初始化期间提供以控制请求发出的速率。

> **初始化和使用速率限制器**
>
> LangChain 附带（可选的）内置 `[InMemoryRateLimiter](https://reference.langchain.com/python/langchain-core/rate_limiters/InMemoryRateLimiter)`。此限制器是线程安全的，可以在同一进程中的多个线程之间共享。
>

```plain
from langchain_core.rate_limiters import InMemoryRateLimiter

rate_limiter = InMemoryRateLimiter(
    requests_per_second=0.1,  # 1 request every 10s
    check_every_n_seconds=0.1,  # Check every 100ms whether allowed to make a request
    max_bucket_size=10,  # Controls the maximum burst size.
)

model = init_chat_model(
    model="gpt-5",
    model_provider="openai",
    rate_limiter=rate_limiter  # [!code highlight]
)
```

> [!WARNING]
>
> 提供的速率限制器只能限制每单位时间的请求数量。如果您还需要基于请求大小进行限制，它将没有帮助。
>

### 基础 URL 和代理设置
您可以为实施 OpenAI Chat Completions API 的提供商配置自定义基础 URL。

> [!WARNING]
>
> `model_provider="openai"`（或直接使用 `ChatOpenAI`）针对官方 OpenAI API 规范。路由器和代理的特定于提供商的字段可能不会被提取或保留。
>
> 对于 OpenRouter 和 LiteLLM，请使用专用集成：
>
> + [OpenRouter via ](https://docs.langchain.com/oss/python/integrations/chat/openrouter)`[ChatOpenRouter](/oss/python/integrations/chat/openrouter)` (`langchain-openrouter`)
> + [LiteLLM via ](https://docs.langchain.com/oss/python/integrations/chat)`[ChatLiteLLM](/oss/python/integrations/chat)`[ / ](https://docs.langchain.com/oss/python/integrations/chat)`[ChatLiteLLMRouter](/oss/python/integrations/chat)` (`langchain-litellm`)
>

> **自定义基础 URL**
>
> 许多模型提供商提供 OpenAI 兼容 API（例如，[Together AI](https://www.together.ai/)、[vLLM](https://github.com/vllm-project/vllm)）。您可以通过指定适当的 `base_url` 参数使用 `[init_chat_model](https://reference.langchain.com/python/langchain/chat_models/base/init_chat_model)` 与这些提供商配合：
>

```plain
model = init_chat_model(
    model="MODEL_NAME",
    model_provider="openai",
    base_url="BASE_URL",
    api_key="YOUR_API_KEY",
)
```

> 使用直接聊天模型类实例化时，参数名称可能因提供商而异。有关详细信息，请查看各自的 [参考](https://docs.langchain.com/oss/python/integrations/providers/overview.md)。
>

> **HTTP 代理配置**
>
> 对于需要 HTTP 代理的部署，某些模型集成支持代理配置：
>

```plain
from langchain_openai import ChatOpenAI

model = ChatOpenAI(
    model="gpt-4.1",
    openai_proxy="http://proxy.example.com:8080"
)
```

> [!NOTE]
>
> 代理支持因集成而异。请查看特定模型提供商的 [参考](https://docs.langchain.com/oss/python/integrations/providers/overview.md) 以获取代理配置选项。
>

### 对数概率
某些模型可以配置为返回表示给定令牌可能性的令牌级对数概率，方法是在初始化模型时设置 `logprobs` 参数：

```plain
model = init_chat_model(
    model="gpt-4.1",
    model_provider="openai"
).bind(logprobs=True)

response = model.invoke("Why do parrots talk?")
print(response.response_metadata["logprobs"])
```

### Token 用量
许多模型提供商在调用响应中返回令牌用量信息。当可用时，此信息将包含在相应模型生成的 `[AIMessage](https://reference.langchain.com/python/langchain-core/messages/ai/AIMessage)` 对象中。有关更多详细信息，请参阅 [消息](https://docs.langchain.com/oss/python/langchain/messages.md) 指南。

> [!NOTE]
>
> 某些提供商 API，特别是 OpenAI 和 Azure OpenAI 聊天补全，要求用户在流式传输上下文中选择接收令牌用量数据。有关详细信息，请查看集成指南的 [流式传输用量元数据](https://docs.langchain.com/oss/python/integrations/chat/openai#streaming-usage-metadata) 部分。
>

您可以使用回调或上下文管理器跟踪应用程序中跨模型的聚合令牌计数，如下所示：

**回调处理器**

```plain
from langchain.chat_models import init_chat_model
from langchain_core.callbacks import UsageMetadataCallbackHandler

model_1 = init_chat_model(model="gpt-4.1-mini")
model_2 = init_chat_model(model="claude-haiku-4-5-20251001")

callback = UsageMetadataCallbackHandler()
result_1 = model_1.invoke("Hello", config={"callbacks": [callback]})
result_2 = model_2.invoke("Hello", config={"callbacks": [callback]})
print(callback.usage_metadata)
```

```plain
{
    'gpt-4.1-mini-2025-04-14': {
        'input_tokens': 8,
        'output_tokens': 10,
        'total_tokens': 18,
        'input_token_details': {'audio': 0, 'cache_read': 0},
        'output_token_details': {'audio': 0, 'reasoning': 0}
    },
    'claude-haiku-4-5-20251001': {
        'input_tokens': 8,
        'output_tokens': 21,
        'total_tokens': 29,
        'input_token_details': {'cache_read': 0, 'cache_creation': 0}
    }
}
```

**上下文管理器**

```plain
from langchain.chat_models import init_chat_model
from langchain_core.callbacks import get_usage_metadata_callback

model_1 = init_chat_model(model="gpt-4.1-mini")
model_2 = init_chat_model(model="claude-haiku-4-5-20251001")

with get_usage_metadata_callback() as cb:
    model_1.invoke("Hello")
    model_2.invoke("Hello")
    print(cb.usage_metadata)
```

```plain
{
    'gpt-4.1-mini-2025-04-14': {
        'input_tokens': 8,
        'output_tokens': 10,
        'total_tokens': 18,
        'input_token_details': {'audio': 0, 'cache_read': 0},
        'output_token_details': {'audio': 0, 'reasoning': 0}
    },
    'claude-haiku-4-5-20251001': {
        'input_tokens': 8,
        'output_tokens': 21,
        'total_tokens': 29,
        'input_token_details': {'cache_read': 0, 'cache_creation': 0}
    }
}
```

### 调用配置
调用模型时，您可以使用 `[RunnableConfig](https://reference.langchain.com/python/langchain-core/runnables/config/RunnableConfig)` 字典通过 `config` 参数传递其他配置。这提供了对执行行为、回调和元数据跟踪的运行时控制。

常见的配置选项包括：

```plain
response = model.invoke(
    "Tell me a joke",
    config={
        "run_name": "joke_generation",      # Custom name for this run
        "tags": ["humor", "demo"],          # Tags for categorization
        "metadata": {"user_id": "123"},     # Custom metadata
        "callbacks": [my_callback_handler], # Callback handlers
    }
)
```

这些配置值特别有用，当：

+ 使用 [LangSmith](https://docs.langchain.com/langsmith/home.md) 跟踪进行调试
+ 实现自定义日志记录或监控
+ 在生产中控制资源使用
+ 跟踪复杂管道中的调用

> **关键配置属性**
>
> **run****_****name** `string`
>
> 在日志和跟踪中标识此特定调用。不继承自子调用。
>
> **tags** `string[]`
>
> 继承自所有子调用的标签，用于在调试工具中进行过滤和组织。
>
> **metadata** `object`
>
> 用于跟踪附加上下文的自定义键值对，继承自所有子调用。
>
> **max****_****concurrency** `number`
>
> 在使用 `[batch()](https://reference.langchain.com/python/langchain_core/language_models/#langchain_core.language_models.chat_models.BaseChatModel.batch)` 或 `[batch_as_completed()](https://reference.langchain.com/python/langchain_core/language_models/#langchain_core.language_models.chat_models.BaseChatModel.batch_as_completed)` 时控制最大并行调用数。
>
> **callbacks** `array`
>
> 用于监控和响应执行期间事件的处理器。
>
> **recursion****_****limit** `number`
>
> 防止复杂管道中无限循环的链的最大递归深度。
>

> [!TIP]
>
> 有关所有支持属性的完整列表，请参见 `[RunnableConfig](https://reference.langchain.com/python/langchain-core/runnables/config/RunnableConfig)` 参考。
>

### 可配置模型
您还可以通过指定 `[configurable_fields](https://reference.langchain.com/python/langchain_core/language_models/#langchain_core.language_models.chat_models.BaseChatModel.configurable_fields)` 创建运行时可配置的模型。如果您不指定模型值，则 `'model'` 和 `'model_provider'` 将默认可配置。

```plain
from langchain.chat_models import init_chat_model

configurable_model = init_chat_model(temperature=0)

configurable_model.invoke(
    "what's your name",
    config={"configurable": {"model": "gpt-5-nano"}},  # Run with GPT-5-Nano
)
configurable_model.invoke(
    "what's your name",
    config={"configurable": {"model": "claude-sonnet-4-6"}},  # Run with Claude
)
```

> **带默认值的可配置模型**
>
> 我们可以创建带默认模型值的可配置模型，指定哪些参数是可配置的，并为可配置参数添加前缀：
>
> 有关 `configurable_fields` 和 `config_prefix` 的更多详细信息，请参见 `[init_chat_model](https://reference.langchain.com/python/langchain/chat_models/base/init_chat_model)` 参考。
>

```plain
first_model = init_chat_model(
        model="gpt-4.1-mini",
        temperature=0,
        configurable_fields=("model", "model_provider", "temperature", "max_tokens"),
        config_prefix="first",  # Useful when you have a chain with multiple models
)

first_model.invoke("what's your name")
```

```plain
first_model.invoke(
    "what's your name",
    config={
        "configurable": {
            "first_model": "claude-sonnet-4-6",
            "first_temperature": 0.5,
            "first_max_tokens": 100,
        }
    },
)
```

> **声明式地使用可配置模型**
>
> 我们可以像对待常规实例化的聊天模型对象一样，在可配置模型上调用声明式操作，如 `bind_tools`、`with_structured_output`、`with_configurable` 等，并链接可配置模型。
>

```plain
from pydantic import BaseModel, Field


class GetWeather(BaseModel):
    """Get the current weather in a given location"""

        location: str = Field(description="The city and state, e.g. San Francisco, CA")


class GetPopulation(BaseModel):
    """Get the current population in a given location"""

        location: str = Field(description="The city and state, e.g. San Francisco, CA")


model = init_chat_model(temperature=0)
model_with_tools = model.bind_tools([GetWeather, GetPopulation])

model_with_tools.invoke(
    "what's bigger in 2024 LA or NYC", config={"configurable": {"model": "gpt-4.1-mini"}}
).tool_calls
```

```plain
[
    {
        'name': 'GetPopulation',
        'args': {'location': 'Los Angeles, CA'},
        'id': 'call_Ga9m8FAArIyEjItHmztPYA22',
        'type': 'tool_call'
    },
    {
        'name': 'GetPopulation',
        'args': {'location': 'New York, NY'},
        'id': 'call_jh2dEvBaAHRaw5JUDthOs7rt',
        'type': 'tool_call'
    }
]
```

```plain
model_with_tools.invoke(
    "what's bigger in 2024 LA or NYC",
    config={"configurable": {"model": "claude-sonnet-4-6"}},
).tool_calls
```

```plain
[
    {
        'name': 'GetPopulation',
        'args': {'location': 'Los Angeles, CA'},
        'id': 'toolu_01JMufPf4F4t2zLj7miFeqXp',
        'type': 'tool_call'
    },
    {
        'name': 'GetPopulation',
        'args': {'location': 'New York City, NY'},
        'id': 'toolu_01RQBHcE8kEEbYTuuS8WqY1u',
        'type': 'tool_call'
    }
]
```

---

[Edit this page on GitHub](https://github.com/langchain-ai/docs/edit/main/src/i18n\zh-CN\oss\langchain\models.mdx) or [file an issue](https://github.com/langchain-ai/docs/issues/new/choose).

[Connect these docs](https://docs.langchain.com/use-these-docs) to Claude, VSCode, and more via MCP for real-time answers.



This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.


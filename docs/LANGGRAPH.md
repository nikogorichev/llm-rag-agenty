# LangGraph — справочник и шпаргалка для собеседований

Приложение к **`modules/06b-langgraph/`** (практическому занятию) и модулю 06,
Задание 4 (первое знакомство). Этот файл — справочник «нужен ответ прямо сейчас»:
понятия, API-шпаргалка для Python **и** TypeScript, паттерны, которые проверяют
на собеседованиях, и подводные камни, которые кусаются в продакшене.

> Версии, на которые ориентируется этот текст: **Python `langgraph` 1.x**
> (`langchain-core` 1.x), **TypeScript `@langchain/langgraph` 0.2.x**
> (`@langchain/core` 0.3.x). Концепции стабильны; некоторые пути импорта меняются
> между версиями — отмечено в тексте.

---

# # 1. Что такое LangGraph (по одному предложению)

- **LangGraph** = типизированный, с чекпоинтами и стримингом **рантайм конечного
  автомата** для LLM-воркфлоу. Вы определяете узлы + рёбра над общим состоянием;
  он берёт на себя персистентность, возобновление, стриминг и участие человека.
- **LangChain** = слой моделей/инструментов/промптов (`ChatModel`, `@tool`,
  ретриверы). LangGraph _использует_ его как интерфейс к моделям, но это
  отдельный движок.
- **LangSmith** = SaaS для наблюдаемости и оценки (трейсинг). **LangGraph
  Studio** = визуальный отладчик. **LangGraph Platform** = хостинг деплоя
  (граф → API + управляемый чекпоинтер + очередь).

**Когда его использовать:** нужна память между шагами, возобновление после падения,
врезки с одобрением человека, стриминг токенов/шагов, ветвление/повтор, либо передача
управления между агентами. **Когда не стоит:** один линейный промпт → просто вызовите
модель.

---

# # 2. Базовая терминология| Термин                | Значение                                                                                                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| **State**             | типизированный словарь, который проходит через граф. Единый источник правды.                                             |
| **Channel**           | одно поле состояния. У каждого есть **reducer**.                                                                         |
| **Reducer**           | способ, которым обновление от узла мержится в канал. По умолчанию = перезапись; `add_messages` = добавление+дедупликация; кастомный = сумма/объединение и т. д. |
| **Node**              | функция `(state) -> partial update`. Почти чистая; возвращает только изменённые ключи.                                    |
| **Edge**              | фиксированный переход `A -> B`.                                                                                           |
| **Conditional edge**  | функция `(state) -> next_node_name`; это ваша логика управления потоком.                                                 |
| **`StateGraph`**      | билдер, к которому вы добавляете узлы и рёбра.                                                                            |
| **`compile()`**       | превращает билдер в запускаемое приложение (опционально с checkpointer).                                                 |
| **Super-step**        | один «тик»: все запланированные на этот раунд узлы выполняются, затем состояние сохраняется (checkpointed).               |
| **Checkpointer**      | сохраняет состояние на каждом супер-шаге; включает память, возобновление, прерывания и «путешествия во времени».          |
| **Thread**            | одна беседа/запуск, идентифицируется по `thread_id` в `config`.                                                           |
| **`Command`**         | возвращаемое значение узла, которое одновременно обновляет состояние и выполняет маршрутизацию (`goto`).                  || **`interrupt()`**    | приостановка внутри узла, передача полезной нагрузки (payload), возобновление позже.                                                                   |
| **Subgraph**         | скомпилированный граф, используемый как узел в родительском графе.                                                                      |

---

# # 3. API шпаргалка (Python ‖ TypeScript)

## # Определение состояния```python
# Python
from typing import Annotated, TypedDict
from langchain_core.messages import AnyMessage
from langgraph.graph import add_messages
import operator

class State(TypedDict):
    messages: Annotated[list[AnyMessage], add_messages]  # append + dedupe by id
    count: Annotated[int, operator.add]                  # SUM
    label: str                                           # overwrite (default)

# Prebuilt shortcut for the common case:
from langgraph.graph import MessagesState   # == {messages: add_messages}
```

```ts
// TypeScript
import { Annotation, MessagesAnnotation } from "@langchain/langgraph";
import { BaseMessage } from "@langchain/core/messages";

const State = Annotation.Root({
  messages: Annotation<BaseMessage[]>({
    reducer: (a, b) => a.concat(b),
    default: () => [],
  }),
  count: Annotation<number>({ reducer: (a, b) => a + b, default: () => 0 }),
  label: Annotation<string>(), // no reducer => overwrite
});
// Prebuilt shortcut: MessagesAnnotation  (just { messages })
```### Сборка, компиляция, запуск```python
from langgraph.graph import StateGraph, START, END
g = StateGraph(State)
g.add_node("agent", agent_node)
g.add_node("tools", tools_node)
g.add_edge(START, "agent")
g.add_conditional_edges("agent", route)   # route(state) -> "tools" | END
g.add_edge("tools", "agent")
app = g.compile()                          # add checkpointer=... for persistence
app.invoke({"messages": [...]}, {"configurable": {"thread_id": "t1"}})
```

```ts
import { StateGraph, START, END } from "@langchain/langgraph";
const app = new StateGraph(State)
  .addNode("agent", agentNode)
  .addNode("tools", toolsNode)
  .addEdge(START, "agent")
  .addConditionalEdges("agent", route)
  .addEdge("tools", "agent")
  .compile();
await app.invoke({ messages: [...] }, { configurable: { thread_id: "t1" } });
```### Готовый шаблон ReAct (пропускаем шаблонный код)```python
from langgraph.prebuilt import create_react_agent, ToolNode, tools_condition
app = create_react_agent(model, tools)          # whole agent in one line
# or hand-wire with:  ToolNode(tools)  +  add_conditional_edges("agent", tools_condition)
```

```ts
import {
  createReactAgent,
  ToolNode,
  toolsCondition,
} from "@langchain/langgraph/prebuilt";
const app = createReactAgent({ llm: model, tools });
```### Сохранение данных```python
from langgraph.checkpoint.memory import InMemorySaver        # alias: MemorySaver
app = g.compile(checkpointer=InMemorySaver())
# persistent: from langgraph.checkpoint.sqlite import SqliteSaver
#   with SqliteSaver.from_conn_string("cp.sqlite") as cp: app = g.compile(checkpointer=cp)
```

```ts
import { MemorySaver } from "@langchain/langgraph";
const app = g.compile({ checkpointer: new MemorySaver() });
// persistent: import { SqliteSaver } from "@langchain/langgraph-checkpoint-sqlite";
```### Вовлечение человека в процесс```python
from langgraph.types import interrupt, Command
def node(state):
    decision = interrupt({"approve?": pending})   # pauses here
    ...
app.invoke(Command(resume="approve"), config)     # resumes from the interrupt
# static form: g.compile(checkpointer=cp, interrupt_before=["tools"])
#   then app.invoke(None, config) to continue
```

```ts
import { interrupt, Command } from "@langchain/langgraph";
const decision = interrupt({ approve: pending });
await app.invoke(new Command({ resume: "approve" }), config);
// static: g.compile({ checkpointer, interruptBefore: ["tools"] });
```### Стриминг```python
for chunk in app.stream(inputs, config, stream_mode="updates"):   # node deltas
for snap  in app.stream(inputs, config, stream_mode="values"):    # full state
for tok, meta in app.stream(inputs, config, stream_mode="messages"):  # LLM tokens
# multiple: stream_mode=["updates", "messages"] -> yields (mode, payload)
```

```ts
for await (const chunk of await app.stream(inputs, { streamMode: "updates" })) {
}
for await (const [tok] of await app.stream(inputs, { streamMode: "messages" })) {
}
```### Подграфы```python
sub = sub_builder.compile()
parent.add_node("research", sub)                  # a compiled graph IS a node
for ns, chunk in app.stream(inputs, subgraphs=True, stream_mode="updates"): ...
```

```ts
const sub = subBuilder.compile();
parent.addNode("research", sub);
for await (const [ns, chunk] of await app.stream(inputs, {
  subgraphs: true,
  streamMode: "updates",
})) {
}
```### Передача управления между агентами```python
from langgraph.types import Command
def supervisor(state) -> Command:
    return Command(goto="researcher", update={"next": "researcher"})
# workers return Command(goto="supervisor", update={...}) to hand back
```

```ts
import { Command } from "@langchain/langgraph";
return new Command({ goto: "researcher", update: { next: "researcher" } });
// In TS, declare reachable targets: .addNode("supervisor", fn, { ends: ["researcher", END] })
```### Путешествие во времени```python
snap = app.get_state(config)                      # current StateSnapshot
for s in app.get_state_history(config): ...       # all checkpoints, newest first
app.invoke(None, old_snap.config)                 # fork/resume from an old checkpoint
app.update_state(config, {"messages": [...]})     # edit -> new checkpoint, then continue
```

```ts
const snap = await app.getState(config);
for await (const s of app.getStateHistory(config)) {}
await app.updateState(config, { messages: [...] });
```---

# # 4. Паттерны, которые просят нарисовать на собеседованиях

**ReAct агент** (стандартный вариант; создаётся с помощью `create_react_agent`):```
START → agent → (tool_calls? ) → tools → agent → … → END
```**Ворота утверждения человеком:** `agent → [interrupt before tools] → human approves → tools`.
Пара interrupt + checkpointer — это и есть весь ответ.

**Мультиагент с супервизором:** один узел `supervisor` возвращает `Command(goto=worker)`;
каждый worker возвращает `Command(goto=supervisor)`; цикл до `goto=END`. Варианты:
**swarm** (воркеры передают управление напрямую друг другу), **иерархический**
(супервизоры супервизоров через подграфы).

**Map-reduce / fan-out:** API `Send` отправляет узел по динамическому списку:
`return [Send("worker", {"item": x}) for x in items]`, результаты собираются редьюсером канала.
Использовать для «суммаризировать каждый из N документов, затем объединить».

**Цикл рефлексии:** `generate → critique → (good? END : generate)` — условное ребро
обратно к `generate`, пока узел-судья не одобрит.

---

# # 5. Подводные камни (то, что реально ломает)

- **Без checkpointer → нет памяти / прерываний / путешествия во времени.**
  Компилируйте с ним, иначе ни одна из этих фич не заработает. Многотуровая память требует
  того же `thread_id`.
- **Несовпадение редьюсера.** Если канал-список постоянно перезаписывается, вы забыли его
  append-редьюсер. Если сообщения дублируются, вы делали конкатенацию _и_ использовали
  `add_messages` (он уже аппендит — возвращайте только _новые_ сообщения из узла).
- **`interrupt()` при возобновлении перезапускает узел с начала.** Код до вызова `interrupt`
  выполняется снова. Делайте работу до прерывания идемпотентной (или переносите её после).
- **`Command(goto=...)` требует, чтобы целевой узел был достижим.** В Python это обычно
  работает само; в TS объявите `{ ends: [...] }` на узле, иначе компилятор не увидит
  динамическое ребро.
- **Tool-calling требует модели с поддержкой.** `create_react_agent` / `bind_tools` нужны
  модели OpenAI/Anthropic/совместимые (или Ollama с моделью, поддерживающей инструменты,
  вроде `llama3.2`). Обычная текстовая модель молча не будет вызывать инструменты.
- **`MemorySaver` только in-process.** Он исчезает при перезапуске — используйте
  `SqliteSaver`/`PostgresSaver` для сохранности.
- **Сдвиги импортов между версиями.** `MemorySaver`↔`InMemorySaver`,
  расположение `langgraph.prebuilt`, а также `Command`/`interrupt` живущие в
  `langgraph.types` (Python) против корня пакета (TS). Проверьте установленную версию,
  если импорт выдаёт 404.

---

# # 6. Ответы на 60-секундном собеседовании- **«LangGraph vs LangChain?»** LangChain — это слой моделей/инструментов/промптов; LangGraph — это stateful-рантайм в виде графа поверх него. Он отвечает за персистентность, стриминг, участие человека в цикле (human-in-the-loop) и управление потоками в мультиагентных системах.
- **«Почему не просто while-цикл?»** Цикл работает, пока вам не понадобится долговременная память, восстановление после сбоя, этапы подтверждения, токен-стриминг изнутри цикла или ветвление/повтор. LangGraph даёт всё это ценой одного абстракционного слоя.
- **«Что такое reducer?»** Функция слияния для отдельного канала. Именно поэтому список сообщений растёт (reducer с добавлением), а скалярное поле перезаписывается.
- **«Как добавить шаг с человеческим подтверждением?»** `interrupt()` внутри узла (или `interrupt_before` при компиляции) + чекпоинтер; возобновление через `Command(resume=…)`.
- **«Как память сохраняется между сессиями?»** Чекпоинтер с ключом `thread_id`; замените `InMemorySaver` на `SqliteSaver`/`PostgresSaver` для персистентности.
- **«Как агенты передают управление друг другу?»** `Command(goto=other_node, update=shared_state)` — передача управления — это просто «записать общее состояние + перейти».
- **«Как отладить неудачный производственный прогон?»** Воспроизведите его: `get_state_history` для поиска места, где пошло не так, форкните от предыдущего чекпоинта или воспользуйтесь `update_state` для исправления, а затем изучите полный трейс в LangSmith.
- **«Как масштабировать большую агентную систему?»** Комбинируйте **подграфы** (каждый — отдельный сфокусированный агент) вместо одного гигантского графа; изолируйте приватные каналы; разворачивайте на LangGraph Platform с долговременным чекпоинтером.

---

# # 7. Переход к практическому занятию| Концепт                                            | Exercise               |
| --------------------------------------------------- | ---------------------- |
| State / channels / reducers                         | `06b-langgraph` Task 1 |
| Условные ребра, `ToolNode`, `create_react_agent`    | Task 2                 |
| Checkpointer + threads + persistence                | Task 3                 |
| `interrupt()` / human-in-the-loop                   | Task 4                 |
| Режимы стриминга (updates/values/messages)          | Task 5                 |
| Subgraphs                                           | Task 6                 |
| Supervisor / передача `Command`                     | Task 7                 |
| Time travel (history/fork/update_state)             | Task 8                 |

Official docs: <https://langchain-ai.github.io/langgraph/> (Python) and
<https://langchain-ai.github.io/langgraphjs/> (TypeScript).
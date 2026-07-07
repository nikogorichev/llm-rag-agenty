# Модуль 06c — Фреймворки агентов: LangChain, CrewAI, AutoGen, LlamaIndex, Semantic Kernel

> **Метки глубины** 🟢 уровень приложения · 🟡 собрать один фрагмент вручную · 🔴 с нуля

В Модуле 06 мы построили цикл агента с нуля, а в 06b углубились в **LangGraph**.
Однако на собеседованиях и в рабочих командах также спрашивают о других названиях, которые часто звучат:
**LangChain** (конвейер `|` / LCEL (LangChain Expression Language), память, ретриверы), **CrewAI** (агенты на основе ролей /
задачи / экипаж), **AutoGen** (разговаривающие агенты в групповом чате),
**LlamaIndex** (Documents → index → query engine для RAG) и **Semantic Kernel**
(ядро именованных функций, которые вы вызываете и связываете в цепочки).

Набор фреймворков, который рассматривается в этом модуле, — **LangChain, CrewAI, AutoGen,
LlamaIndex и Semantic Kernel** — это именно тот набор названий, который встречается в
продакшен‑описаниях вакансий в области GenAI и оркестрации агентов (наряду с LangGraph из 06b).

Вместо того чтобы механически учить пять API, этот модуль сохраняет нашу педагогику «с нуля»:
вы **переimplementируете базовую абстракцию каждого фреймворка за ~60–100 строк**,
используя обычную функцию модели. Когда вы создадите механизм, в README сопоставит каждый ваш
класс с API реальной библиотеки — чтобы вы могли уверенно говорить как о том, «как это работает»,
так и о том, «что импортировать».

Единая зависимость, необходимая каждому фреймворку, — это **чат-модель**. Чтобы оставаться проверяемым
**оффлайн**, каждое упражнение написано для работы с крошечной прослойкой:```
ChatFn = (messages) => string        # Python: Callable[[list[dict]], str]
```- С флагом `--stub` harness подставляет **детерминированную фейковую модель** — без сети,
  без API-ключа, с точными проверками.
- Без флага он собирает тот же самый `ChatFn` из `get_provider().chat`
  (Python: `from llm_core import get_provider`) / `getProvider().chat`
  (TypeScript: `from '@learn-ai/llm-core'`), так что _тот же код_ выполняется
  с настоящей LLM (Large Language Model).

Этот шов и есть урок: **«фреймворк» — это в основном оркестрация вокруг
одного вызова `model(messages) -> text`.** Если свести модель к функции,
фреймворки сжимаются до небольшого набора идей ниже.

> **Необходимое условие:** завершите модуль 06 (задания 1 и 4). Вы должны уметь
> сказать: «агент — это цикл над вызовом модели». Этот модуль про «обвязку»,
  которую эти популярные библиотеки наворачивают вокруг того самого цикла.

---

# # Концепции

Каждый фреймворк здесь — это **композиция + ограниченный цикл** над одной
функцией модели. Никакого анализа — «математика» — это композиция функций,
свертка (левая аккумуляция), косинусное сходство и модульный поворот.
Ниже мы выводим каждую из этих идей.

## # 1. LCEL — это композиция функций (задание 1)

LangChain Expression Language — это оператор `|`: `chain = prompt | model | parser`.
**Runnable** — это любой объект с методом `invoke(input) -> output`. Конвейерная
композиция объединяет их: `a | b` — это объект, чей `invoke` запускает `a`,
а затем передаёт результат в `b`.

Цепочка шагов `s₁, s₂, …, sₙ`, применённая к входу `x`, — это повторное применение:```
out = sₙ( … s₂( s₁(x) ) … )
```Или, что то же самое, **свертка слева** (fold left) по списку шагов с текущим аккумулятором `acc`:```
acc ← x
for step in steps:
    acc ← step.invoke(acc)
return acc
````pipe(other)` — это алгебра для построения списка шагов. Чтобы сохранить его плоским (чтобы `a.pipe(b).pipe(c)` была одной последовательностью из 3 шагов, а не вложенными парами), выполняйте разворачивание любых операндов-последовательностей:```
left  = self.steps  if self  is a RunnableSequence else [self]
right = other.steps if other is a RunnableSequence else [other]
RunnableSequence(left + right)
```Конкретные шаги тривиальны: `PromptTemplate(template).format(**vars)` заполняет
`{placeholders}`; `ModelRunnable(chat_fn)` превращает строку в одно пользовательское сообщение
и вызывает модель; `StrOutputParser` извлекает текст. Это и есть вся «магия».

**Соответствует реальному LangChain:** `prompt | model | parser` собирает `RunnableSequence`
через `Runnable.__or__`; `PromptTemplate.from_template(...)`, любая чат-модель (уже
является Runnable) и `StrOutputParser` — это стандартные компоненты.

## # 2. Память — это список; ретривер — это ранжировщик; RAG (Retrieval-Augmented Generation) — это промпт (Task 2)

**Память.** `ConversationBufferMemory` — это список ходов `(user, ai)`.
`save_context` добавляет; `load_memory_variables` преобразует их обратно в строку
транскрипта (строки `Human: …` / `AI: …`), которую можно передать в следующий промпт.
Скрытого состояния нет.

**Ретривер.** Ретривер ранжирует документы по отношению к запросу. Мы ранжируем с помощью
**косинуса «мешка слов»**, чтобы это работало оффлайн и детерминированно — без embeddings.

Токенизируем в слова в нижнем регистре и считаем их → разреженный вектор `v`, где `v[w]` —
количество слова `w`. Косинусное сходство двух векторов частот `a`, `b`:```
cosine(a, b) = (a · b) / (‖a‖ · ‖b‖)

a · b = Σ_w  a[w] · b[w]        (sum over shared words)
‖a‖   = sqrt( Σ_w a[w]² )
```Это косинус угла между векторами: `1`, когда направления совпадают,
`0`, когда у них нет общих слов. Если какая-либо из норм равна `0`, считаем схожесть равной `0`.
**top-k retrieval** = оцениваем каждый документ, сортируем по косинусу по убыванию, берём первые `k`.

**RAG-цепочка.** Получаем контекст, помещаем его (вместе с историей диалога) в
шаблон промпта, затем вызываем модель. Тот же поток слева направо, как в Задании 1, с
историей, которая передаётся вместе и обновляется после каждого шага.

**Соответствие реальному LangChain:** `ConversationBufferMemory` (те же `save_context` /
`load_memory_variables`); `VectorStoreRetriever` (косинус эмбеддингов вместо мешка слов), представленный как Runnable; `PromptTemplate` с плейсхолдерами `{context}` /
`{question}`.

## # 3. Crew — это свёртка, которая прокидывает контекст (Задание 3)

CrewAI: **Agent** — это персона — `role`, `goal`, `backstory` — привязанная к модели.
Выполнение **Task** = сформировать _привязанный к роли_ (role-grounded) промпт и вызвать модель:```
System: You are {role}. Your goal is {goal}. Backstory: {backstory}.
User:   {task.description}
        [Context from previous work: {context}]   (only when context is non-empty)
        Expected output: {task.expected_output}
```**Crew** (экипаж) с `process = "sequential"` — это **свертка (fold) по задачам**, которая накапливает контекст: вывод каждой задачи становится контекстом для следующей:```
context₀ = ""                       (nothing done yet)
for i in 1..n:
    outᵢ    = agentᵢ.execute(taskᵢ, contextᵢ₋₁)
    contextᵢ = outᵢ                  (thread forward)
return outₙ                          (last task's output = final result)
```Мультипоточность — это вся оркестрация. Порядок задач обеспечивается последовательным итерированием по списку; запускается исследователь (пустой контекст), затем писатель (его контекст — это вывод исследователя).

**Соответствует crewai:** `Agent(role=, goal=, backstory=, llm=)`,
`Task(description=, agent=, expected_output=)`,
`Crew(agents=[…], tasks=[…], process=Process.sequential).kickoff()`.

## # 4. GroupChat — это ограниченный цикл с модульной сменой спикера (Task 4)

AutoGen: несколько **ConversableAgents** делят **одну транскрипцию**. Менеджер выбирает следующего спикера, просит ответить, учитывая _всю историю_, добавляет ответ и повторяет. Два условия остановки делают процесс конечным — **бюджет** (`max_round`) и **сигнал завершения** (ответ содержит `"TERMINATE"`).

Пусть `agents = [g₀, …, g_{m-1}]` и транскрипция `H`. Инициализируем `H` начальным сообщением. Для раунда `r = 0, 1, 2, …`:```
speaker = agents[r mod m]            # round-robin = index modulo m
reply   = speaker.generate_reply(H)  # depends on the whole transcript
append {speaker.name, reply} to H
if "TERMINATE" in reply:  stop       # done-signal
if (r + 1) >= max_round:  stop       # budget
```Итак, итоговая длина транскрипта:```
1 (initial) + min(rounds_until_terminate, max_round) replies
````generate_reply` формирует вход модели, добавляя в начало системное сообщение агента,
а затем воспроизводит историю диалога в виде сообщений с меткой говорящего (`"{name}: {content}"`),
чтобы каждый агент видел, кто и что сказал.

**Соответствует реальному AutoGen:** `ConversableAgent(name=, system_message=)`,
`GroupChat(agents=, max_round=)`, `GroupChatManager(...)`; реальный AutoGen поддерживает
более умный выбор следующего говорящего и колбэк `is_termination_msg` — наша
циклическая схема + проверка по фразе — это минимальная версия обоих механизмов.

## # 5. Query engine — это retrieve-then-synthesize (Task 5)

LlamaIndex: оборачиваем исходный текст в **Documents**, строим на их основе **VectorStoreIndex**,
а затем обращаемся к **query engine**. `VectorStoreIndex.from_documents(docs)` делает две вещи:
_разбивает_ каждый Document на **Nodes** (здесь: по пустым строкам, один Node на
абзац) и _индексирует_ каждый Node вектором. Мы повторно используем **bag-of-words
cosine** из Task 2 в качестве «embedding», чтобы весь пайплайн был оффлайн и детерминированным —
без сети, без реальных embeddings.

`index.as_query_engine().query(q)` — это затем **retrieve-then-synthesize**:```
nodes   = top-k Nodes by cosine(query, node.vector)   # same ranking as Task 2
context = join the retrieved nodes' text
prompt  = SYNTHESIS_TEMPLATE(context, query)          # stuff context in
answer  = model(prompt)                                # one synthesis call
```Часть с извлечением идентична ретриверу из Задачи 2 (оценить каждый узел, отсортировать по убыванию косинусного сходства, взять первые `k`); часть с синтезом — это один вызов модели по шаблону над текстами извлечённых узлов. Это и есть вся ментальная модель RAG.

**Соответствие в реальном llama-index-core:** `Document(text=...)`,
`VectorStoreIndex.from_documents(docs)` (парсер узлов разбивает + реальная модель эмбеддингов векторизирует каждый узел), `index.as_query_engine().query(q)` → возвращает `Response`, где `.source_nodes` — это то, что было извлечено, а `.response` — синтезированный текст.

## # 6. Kernel — это реестр именованных функций, которые вы объединяете в цепочку (Задача 6)

Semantic Kernel: **Kernel** хранит **функции, которые вы вызываете по имени**. Два типа функций имеют общий интерфейс (`invoke(**args) -> str`), именно это позволяет ядру обрабатывать их единообразно и связывать в цепочки:

- **семантическая функция** = шаблон промпта + модель. Рендеринг заполняет `{placeholders}` в шаблоне аргументами, затем вызывает модель:
  `prompt = template.format(**args)`, `reply = model(prompt)`.
- **нативная (native) функция** = обычный код (вызываемый объект Python/JS, без модели).

**Последовательная оркестрация** — это небольшой конвейер — свёртка, которая передаёт каждый вывод дальше как `input` следующей функции (тот же механизм передачи данных, что и в Crew из Задачи 3, но поверх именованных функций ядра):```
out_0 = x
for f in [f_1, ..., f_n]:
    out = kernel.invoke(f, input=out_prev)   # feed prior output forward
return out_last
```Таким образом, цепочка `clean → summarize → translate` запускает нативный очиститель, передаёт его результат в prompt суммаризации, а затем передаёт _этот_ результат в prompt перевода — одно значение последовательно проходит через именованные функции.

**Соответствует реальному Semantic Kernel:** prompt-функция против метода `@kernel_function` (нативного); `kernel.add_function(...)` / `add_plugin(...)` для регистрации; `kernel.invoke(function_name=..., ...)` для запуска; последовательная оркестрация (или chaining invoke) для запуска пайплайна.

---

# # Задачи

Полосы: 🟢 использовать/компоновать · 🟡 использовать + собрать часть вручную · 🔴 собрать механизм.
Каждая задача поддерживает режим `--stub` (оффлайн, детерминированный) и реальный путь через общего провайдера.

## # Task 1 🟢 — LCEL runnable (`prompt | model | parser`)

**Цель:** Реализовать LCEL от LangChain, чтобы `chain = prompt.pipe(model).pipe(parser)` прогонял отформатированный prompt через модель и парсил результат.

**Файлы:**

- `py/01_lcel.py`
- `ts/01-lcel.ts`

**Шаги:**

1. Реализуйте `Runnable.pipe(other)` / `pipe()` — возвращайте `RunnableSequence`,
   выполняя flattening, если один из операндов уже является последовательностью.
2. Реализуйте `RunnableSequence.invoke(input)` — свёртка слева (fold left), где
   вывод каждого шага подаётся на вход следующему.
3. Реализуйте `PromptTemplate.format(**vars)` / `format(vars)` — заполнение
   `{placeholders}`.
4. Harness собирает `chain = prompt.pipe(model).pipe(parser)` и вызывает его
   на словаре input; также собирается 3-шаговая числовая последовательность для
   проверки порядка.

**Приёмочные тесты (`--stub`):**

- `chain.invoke({"topic": "vector databases"})` возвращает
  `"[stub-reply] Write a one-line tagline about vector databases."` — строку,
   которую сгенерировала фейковая модель на основе _отформатированного_ prompt
   (парсер удаляет начальные/конечные пробелы).
- 3-шаговая последовательность применяет шаги по порядку: `(4 + 1) * 3 → "result=15"`,
   а перестановка первых двух шагов даёт `"result=13"` — что доказывает соблюдение
   порядка.

---

## # Task 2 🟡 — память + ретривер (крошечная RAG-цепочка)

**Цель:** Реализовать `ConversationBufferMemory` и детерминированный bag-of-words
косинусный ретривер, затем соединить `retriever → prompt(context+question+history) → model`
в RAG-цепочку, которая также работает с памятью.

**Файлы:**- `py/02_memory_retriever.py`
- `ts/02-memory-retriever.ts`

**Шаги:**

1. Реализовать методы памяти `save_context` (добавить ход) и `load_memory_variables`
   (отрендерить буфер в строку-транскрипт `Human:/AI:`).
2. Реализовать `cosine(a, b)` для разреженных векторов частот (dot / product of norms;
   `0`, если одна из норм равна `0`).
3. Реализовать `Retriever.get_relevant(query, k)` — оценить каждый документ по косинусу,
   отсортировать по убыванию, вернуть top-k.
4. Реализовать `build_rag_prompt(history, context, question)` — заполнить RAG-шаблон.
5. Предоставленный `RagChain.ask` связывает всё воедино: загрузка памяти → поиск →
   сборка промпта → вызов модели → сохранение хода.

**Acceptance (`--stub`):**

- Ретривер возвращает **Python**-документ для вопроса
  `"Which language is used for data science?"` (наибольшее лексическое пересечение).
- После двух ходов память хранит **оба** хода (`len(turns) == 2`, присутствуют оба Q/A).
- Последний промпт цепи **содержит полученный контекст** (документ про Эйфелеву башню
  для второго вопроса) **и** текст предыдущего хода (память перенесена вперед).

---

## # Task 3 🟡 — экипаж CrewAI (roles → tasks → sequential crew)

**Goal:** ПереIMPLEMENTить сущности CrewAI `Agent` / `Task` / `Crew`, чтобы экипаж из двух агентов
(researcher → writer) выполнил последовательный пайплайн, передающий каждый результат дальше.

**Files:**

- `py/03_crew.py`
- `ts/03-crew.ts`

**Шаги:**

1. Реализовать `Agent.execute(task, context)` — собрать промпт на основе роли
   (system = role/goal/backstory; user = description + опциональный context + expected
   output) и вызвать `chat_fn`.
2. Реализовать `Crew.kickoff()` — запустить задачи по порядку, передавая вывод каждой
   задачи в `context` следующей; записать транскрипт; вернуть последний вывод.

**Acceptance (`--stub`):**

- Экипаж из двух агентов возвращает финальную строку, равную выводу **writer** (последняя
  задача).
- Порядок задач соблюдён: researcher запускается первым с **пустым** контекстом;
   writer запускается вторым.
- `context_in` у writer — **точно** вывод researcher — это доказывает, что вывод пробросился
   (в заглушке ответы тегируются как `with-context` / `no-context`).

---

## # Task 4 🟡 — групповой чат AutoGen (round-robin + termination)**Цель:** Реализовать аналог `ConversableAgent` / `GroupChat` /
`GroupChatManager` из AutoGen так, чтобы менеджер управлял диалогом по кругу
(round-robin) над общей историей переписки, останавливаясь на `max_round` или
при фразе `"TERMINATE"`.

**Файлы:**

- `py/04_groupchat.py`
- `ts/04-groupchat.ts`

**Шаги:**

1. Реализовать `ConversableAgent.generate_reply(history)` — добавить системное
   сообщение в начало, воспроизвести общую переписку в виде сообщений с метками
   говорящих, вызвать модель, очистить результат.
2. Реализовать `GroupChatManager.run(initial_message)` — инициализировать историю,
   выполнять цикл до `max_round`, выбирать говорящего по формуле
   `r % len(agents)` (round-robin), добавлять каждый ответ в историю и прервать
   цикл досрочно, если ответ содержит `"TERMINATE"`.

**Acceptance (`--stub`):**

- История переписки упорядочена с правильными метками говорящих: `["user", "planner",
"critic"]`.
- Заранее заданный critic выдаёт `"TERMINATE"` на своём ходу, поэтому цикл
   останавливается досрочно: в истории ровно `3` сообщения (1 начальное + 2 ответа).
- Количество ответов никогда не превышает `max_round` (бюджет соблюдается).

---

## # Task 5 🟡 — LlamaIndex query engine (Документы → индекс → query engine)

**Цель:** Реализовать ментальную модель RAG из LlamaIndex так, чтобы
`VectorStoreIndex.from_documents(docs).as_query_engine().query(q)` разбивал документы
на чанки (nodes), извлекал top-k по косинусу «мешка слов» (оффлайн, без
embeddings) и синтезировал ответ с помощью модели.

**Файлы:**

- `py/05_llamaindex.py`
- `ts/05-llamaindex.ts`

**Шаги:**

1. Реализовать `VectorStoreIndex.retrieve(query, k)` — оценить каждый Node по
   косинусу относительно запроса, отсортировать по убыванию, вернуть top-k Nodes.
   (Тот же топ-k по косинусу, что и в Task 2, но над Nodes вместо исходных строк
   документов. `cosine`, chunking и `from_documents` предоставлены.)
2. Реализовать `QueryEngine.query(q)` — извлечь top-k nodes, объединить их текст
   в блок контекста, заполнить шаблон синтеза (сохранить его в `last_prompt`) и
   вызвать модель одним пользовательским сообщением.

**Acceptance (`--stub`):**- Индекс разбивает 3 документа на **6 узлов** (по одному на абзац).
- Для запроса `"Where is the Eiffel Tower located?"` первым полученным узлом является
  узел **Eiffel-Tower** (наибольшее лексическое совпадение).
- Промпт синтеза (`last_prompt`) **содержит текст полученного узла** и строку
  `Query:`; (заглушечный) ответ синтезируется **исходя из** этого полученного контекста.

---

## # Задание 6 🟡 — Semantic Kernel (именованные функции + последовательный чейнинг)

**Цель:** Реализовать ядро Semantic Kernel (`Kernel`) так, чтобы оно регистрировало
**семантическую функцию** (шаблон промпта + модель) и **нативную функцию** (обычный код),
вызывало их **по имени** и объединяло в **цепочку** (chain) в последовательный пайплайн.

**Файлы:**

- `py/06_semantic_kernel.py`
- `ts/06-semantic-kernel.ts`

**Шаги:**

1. Реализуйте `KernelFunction.invoke(**args)` — ветка native вызывает обычный код;
   ветка semantic рендерит шаблон промпта из аргументов, оборачивает его в одно
   пользовательское сообщение и вызывает модель.
2. Реализуйте `Kernel.invoke(name, **args)` — найдите функцию по имени и делегируйте
   вызов (отчётливо сообщайте об ошибке для неизвестного имени).
3. Реализуйте `Kernel.run_pipeline(names, initial_input)` — пройдитесь по именованным
   функциям, пробрасывая каждый выход дальше на вход (`input`) следующей функции.

**Критерии приёма (`--stub`):**

- Нативная функция `clean` выполняет реальный код (сворачивает лишние пробелы в
  `"RAG grounds a model in retrieved documents."`).
- Единичный вызов semantic рендерит свой шаблон с аргументом (заглушка просто
   возвращает точный отрендеренный промпт).
- Пайплайн `clean → summarize → translate` пробрасывает выходы вперёд: финальное
  значение вкладывает промпт translate в вывод summarize, который, в свою очередь,
  вложен в очищенный текст — это доказывает, что результат каждого шага подавался на вход следующему.

---

# # Критерий завершения- [ ] Задание 1: `01_lcel` / `01-lcel --stub` запускается, вывод цепочки распечатан, а также выполняются проверки порядка из 3 шагов.
- [ ] Задание 2: `02_memory_retriever` / `02-memory-retriever --stub` показывает корректный извлечённый документ, оба диалоговых хода в памяти, а также контекст и историю в prompt.
- [ ] Задание 3: `03_crew` / `03-crew --stub` возвращает вывод writer, а контекст writer совпадает с выводом researcher.
- [ ] Задание 4: `04_groupchat` / `04-groupchat --stub` создаёт корректно размеченную транскрипцию с досрочным завершением в пределах `max_round`.
- [ ] Задание 5: `05_llamaindex` / `05-llamaindex --stub` разбивает документы на узлы (nodes), извлекает узел Eiffel-Tower и выполняет синтез на основе извлечённого контекста.
- [ ] Задание 6: `06_semantic_kernel` / `06-semantic-kernel --stub` запускает нативную функцию, отрисовывает семантическую функцию и пропускает через последовательный pipeline.
- [ ] Вы можете назвать для каждого своего класса **реальный API библиотеки**, которому он соответствует (см. примечания «Maps to real …» выше).

---

# # Шпаргалка по фреймворкам (что говорить на собеседовании)| Фреймворк          | Примитив, который вы построили                 | Реальное имя API                                                   |
| ------------------- | ---------------------------------------- | ------------------------------------------------------------------ |
| **LangChain**       | `Runnable` + `pipe` = LCEL               | `prompt \| model \| parser`, `RunnableSequence`, `StrOutputParser` |
| **LangChain**       | буфер памяти + retriever RAG            | `ConversationBufferMemory`, `VectorStoreRetriever`                 |
| **CrewAI**          | основанный на ролях `Agent`, последовательный `Crew` | `Agent`, `Task`, `Crew`, `Process.sequential`                      |
| **AutoGen**         | общая расшифровка + round-robin manager  | `ConversableAgent`, `GroupChat`, `GroupChatManager`                |
| **LlamaIndex**      | индекс Nodes + движок запросов (RAG)      | `Document`, `VectorStoreIndex.from_documents`, `as_query_engine().query` |
| **Semantic Kernel** | ядро именованных функций + чейнинг     | `Kernel`, `@kernel_function` / `add_function`, `kernel.invoke`     |
| **LangGraph**       | (модуль 06b) stateful runtime графа      | `StateGraph`, checkpointer, `Command(goto=…)`                      |

Суть, объединяющая их всё: **каждый фреймворк — это оркестрация вокруг единственного вызова `model(messages) -> text`** — LCEL компонует его, CrewAI передает контекст через вызовы, привязанные к ролям, AutoGen зацикливает его над общей расшифровкой, LlamaIndex сначала делает retrieval, затем синтез с его помощью, Semantic Kernel вызывает и выстраивает его в цепочки как именованные функции, а LangGraph оборачивает его в state machine с чекпоинтами.

---

# # Углубляемся- **LangChain — LCEL / Runnable interface:** <https://python.langchain.com/docs/concepts/lcel/>
- **LangChain — memory & retrievers:** <https://python.langchain.com/docs/concepts/chat_history/> ·
  <https://python.langchain.com/docs/concepts/retrievers/>
- **CrewAI docs (Agents / Tasks / Crews / Processes):** <https://docs.crewai.com/>
- **AutoGen (ConversableAgent, GroupChat):** <https://microsoft.github.io/autogen/>
- **LlamaIndex (Documents, VectorStoreIndex, query engines):** <https://docs.llamaindex.ai/>
- **Semantic Kernel (Kernel, functions/plugins, orchestration):** <https://learn.microsoft.com/semantic-kernel/>
- **When to pick which:** LangChain/LCEL для линейных пайплайнов; LlamaIndex для
  приложений, заточенных под RAG (индексация + query engines); CrewAI для
  ролевых пайплайнов задач; AutoGen для свободного многоагентного диалога;
  Semantic Kernel для оркестрации функций/плагинов (силен в .NET / enterprise);
  LangGraph (06b), когда нужна персистентность, human-in-the-loop или сложная
  маршрутизация.

---

# # Окружение

Для этих задач чат-модель нужна **только** при запуске не через `--stub`. Для
  офлайн-проверки (acceptance criteria) всегда запускайте с `--stub` — он
  использует встроенную фейковую модель и не требует провайдера, ключа или сети.

**Python:**```bash
uv run python modules/06c-agent-frameworks/py/01_lcel.py --stub   # offline
uv run python modules/06c-agent-frameworks/py/01_lcel.py          # real: uses get_provider()
```**TypeScript:** соберите ядро один раз, а затем запускайте с помощью `tsx`:```bash
pnpm build:core
pnpm tsx modules/06c-agent-frameworks/ts/01-lcel.ts --stub        # offline
pnpm tsx modules/06c-agent-frameworks/ts/01-lcel.ts               # real: uses getProvider()
```Реальный путь считывает переменную `LLM_PROVIDER` (по умолчанию `ollama`) точно так же, как и все остальные модули — никаких новых переменных окружения. Путь с нулевой стоимостью — Ollama (`ollama pull llama3.2`).

> **Примечание (реальный путь в TypeScript):** в переimplemented версиях `ChatFn` остаётся **синхронной**, чтобы логика композиции оставалась читаемой, но `provider.chat()` — `async`. Путь с `--stub` полностью синхронен и служит офлайн-проверкой. Чтобы запустить задачи TS на реальной модели, сделайте соответствующие методы `invoke`/`execute`/`generateReply` `async` и добавьте `await provider.chat(messages)` — заголовочный комментарий в каждом файле указывает точное место. (В Python `provider.chat` синхронен, поэтому реальный путь в Python работает как есть.)
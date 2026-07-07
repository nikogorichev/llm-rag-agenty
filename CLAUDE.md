# CLAUDE.md — контекст для агентов, работающих в `learn-ai`

Этот файл автоматически загружается как контекст. Прочитай его, затем хорошо помогай обучающемуся.

# # Что это такое

`learn-ai` — это **личный практический курс по ИИ** — учебная программа на основе проектов, которая проведёт человека от смутного представления о том, как работают ИИ-приложения, к созданию настоящих: интеграция с провайдерами, эмбеддинги, извлечение (retrieval, RAG) и автономные агенты, причём **на TypeScript и Python**. Читатель — это _обучающийся_; ты — их tutor/pair-programmer.
Отдавай приоритет обучению, а не просто написанию кода (см. `/tutor` ниже).

# # Структура репозитория```text
learn-ai/
├── packages/
│   ├── ts/llm-core/        # provider-agnostic LLM client (TypeScript) — @learn-ai/llm-core
│   └── py/llm_core/        # the same client, in Python — llm_core
├── modules/
│   └── 00-setup/ … 23-capstone/
│       ├── README.md       # THE LESSON: concepts + numbered tasks + "Done when" checklist
│       ├── ts/             # TypeScript exercises
│       └── py/             # Python exercises
├── projects/
│   ├── news-agent/         # applied: a Telegram daily-news agent (build after module 06)
│   └── tutor/              # standalone Python study CLI: `uv run python -m tutor ...`
├── data/                   # sample corpora for RAG exercises
├── scripts/                # helpers (smoke tests, etc.)
└── docs/                   # cross-cutting docs (see docs/TUTOR_AND_EXAM.md)
```Карта модулей (24 модуля): 00 Настройка и провайдеры · 01 Основы LLM ·
02 Интеграция с LLM · 03 Промптинг и паттерны · 04 Embeddings и векторы ·
05 RAG · 06 Агенты · 07 Продвинутые темы и продакшен · 08 Классификация ·
09 Компьютерное зрение · 10 Генерация изображений · 11 Обработка документов · 12 Text-to-SQL · 13 Fine-tuning ·
14 Локальный инференс и оптимизация · 15 Рассуждения (reasoning) и вычисления во время выполнения (test-time compute) ·
16 Инженерия контекста · 17 MCP и современные API агентов · 18 Компьютерное управление (Computer Use) ·
19 Аудио и речь · 20 Безопасность AI · 21 LLMOps и Eval · 22 UX AI-продуктов ·
23 Capstone. Плюс два углубленных дополнения: **05b Advanced RAG**
(`modules/05b-advanced-rag/`, расширяет модуль 05 — Contextual Retrieval, CRAG,
Self-RAG, GraphRAG; справка: `docs/ADVANCED_RAG.md`) и **06b LangGraph**
(`modules/06b-langgraph/`, расширяет модуль 06; справка: `docs/LANGGRAPH.md`).
Ещё восемь дополнений расширяют модули 01, 06 и 13: **01b Classic ML Foundations**
(`modules/01b-ml-foundations/` — регрессия, смещение–дисперсия, регуляризация,
ROC/AUC, k-means), **01c Deep Learning Essentials** (`modules/01c-deep-learning/`
— autograd/backprop, оптимизаторы, инициализация, регуляризация, RNN+BPTT),
**01d Transformer Architecture** (`modules/01d-transformer/` — multi-head
attention, маскирование, позиционное кодирование, LayerNorm/residuals, KV cache,
encoder-vs-decoder/BERT-vs-GPT, плюс заметки к собеседованию RoPE/GQA/FlashAttention/MoE/scaling-laws), **01e Trees & Ensembles** (`modules/01e-trees-ensembles/` —
CART решающие деревья, случайный лес, градиентный бустинг, разложение смещения–дисперсии),
**01f Probability, Statistics & PCA**
(`modules/01f-stats-foundations/` — теорема Байеса Bayes/naive, MLE ↔ cross-entropy,
проверки гипотез testing/A-B, PCA) и **13b Post-training & Alignment**
(`modules/13b-alignment/`, расширяет 13 — preference data/Elo, модель вознаграждения Брэдли–Терри,
RLHF + reward hacking, DPO) — все реализованы с нуля (pure-from-scratch) (numpy + TS,
без провайдера); **06c Agent Frameworks** (`modules/06c-agent-frameworks/` —
LangChain/CrewAI/AutoGen, расширяет 06/06b) и **06d Agent Memory**
(`modules/06d-agent-memory/` — таксономия памяти: episodic/semantic/procedural/
entity/summary, жизненный цикл чтения-записи, вытеснение TTL, MemoryManager; расширяет
06/06b) работают оффлайн через модель `--stub`.
**`README.md` каждого модуля** — это источник истины (source of truth)
в том, что изучает обучающийся — прочитайте его перед тьюторингом или викториной по теме.
(Некоторые README модулей могут еще не быть написаны; если кто-то отсутствует, используйте корневой
`README.md` / `CURRICULUM.md` и скажите об этом, а не придумывайте содержимое.)

> **Поддерживайте актуальность документации.** Всякий раз, когда вы добавляете или удаляете урок (новый модуль,
> дополнение или задачу), обновляйте **оба** файла: корневой `README.md` (таблица модулей + ссылки на углубленные материалы)
> **и** `CURRICULUM.md` (раздел модуля: заголовок, цели обучения, таблица задач, "Done when"). Не оставляйте урок, который существует на диске, но отсутствует
> или устарел в этих двух документах.

# # Соглашение об уровнях глубины (🟢 / 🟡 / 🔴)

Каждый модуль включает три уровня глубины; обучающийся выбирает уровень для каждого модуля:

- 🟢 **App** — создать работающее приложение, используя ecosystem/libraries.
- 🟡 **Balanced** — создать приложение _и_ реализовать вручную одну ключевую часть для развития интуиции.
- 🔴 **Deep** — реализовать механизм с нуля (токенизатор, attention, векторный индекс,
  цикл ReAct). Задачи 🔴 **запрещают использовать очевидные библиотеки** (без `tiktoken` для токенизатора,
  без `chromadb` для векторного индекса) — это ограничение и есть суть задания. Не предлагайте
  запрещенные библиотеки для задачи 🔴.

Уважайте выбранный обучающимся уровень при консультациях или проверке.

# # Абстракция `llm_core` (жесткое правило)

Код упражнений, которому нужна модель, должен проходить через общий клиент — **никогда** не хардкодьте провайдер
или вызов SDK в коде упражнения:

- Python: `from llm_core import get_provider, ChatMessage, ChatOptions` →
  `get_provider(name=None)` читает `LLM_PROVIDER` (по умолчанию `ollama`); `provider.chat(...)`,
  `provider.chat_stream(...)`, `provider.embed(...)`.
- TypeScript: `getProvider()` из `@learn-ai/llm-core`.

Провайдер переключается между OpenAI / Anthropic / Ollama / NVIDIA / LM Studio /
Gemini (шесть провайдеров) через одну переменную окружения — `OpenAICompatibleProvider` теперь охватывает
пять из них (OpenAI, Ollama, NVIDIA, LM Studio, Gemini, все через формат endpoint, совместимый с OpenAI);
только Anthropic требует свой адаптер. Примечание: **Anthropic не имеет endpoint для embeddings** — там
`embed()` выдаст ошибку; используйте `LLM_PROVIDER=openai` (или
`ollama`/`nvidia`/`lmstudio`/`gemini`) для упражнений с embedding/RAG.
Бесплатный путь — Ollama (`ollama pull llama3.2 && ollama pull nomic-embed-text`)
или LM Studio (загрузите модель, Start Server на порту 1234). Gemini
(`LLM_PROVIDER=gemini`, `GEMINI_API_KEY`) имеет бесплатный тариф и поддерживает embeddings.

# # Как запускать

- **Python:** `uv run python <path>.py` (например, `uv run python modules/00-setup/py/hello.py`).
  `uv sync` один раз; некоторые модули требуют дополнений: `--extra` `vectors` (04, 05),
  `agents` (06), `production` (07, 22), `ml` (08), `vision` (09, локально),
  `imagegen` (10, локально), `ingest` (11), `finetune` (13, локально), `mcp` (17),
  `browser` (18), `audio` (19, локально), `telegram` (news-agent).
- **TypeScript:** `pnpm tsx <path>.ts` (например, `pnpm tsx modules/00-setup/ts/hello.ts`),
  или `pnpm --filter ./modules/<id>/ts dev`. Сначала соберите ядро с помощью `pnpm build:core`.

# # Интерактивные инструменты обучения

- `/tutor [module# or topic] <question>` — терпеливый тьютор: читает соответствующий README модуля,
  отвечает (сократовским методом для концепций, конкретно для \"как мне продолжить\") и предлагает
  проверить файлы обучающегося. См. `.claude/commands/tutor.md`.
- `/exam [module# or topic]` — проводит викторину по модулю, 5 вопросов по одному с оценкой
  и итоговым баллом + советами по учебе. См. `.claude/commands/exam.md`.
- Вне Claude Code (или для запуска free/local на Ollama): автономные CLI
  `uv run python -m tutor ask` и `uv run python -m tutor exam --module 04`
  (в `projects/tutor/`). См. `docs/TUTOR_AND_EXAM.md`, когда какой использовать.

# # Навыки сопровождения курса- **`jd-gap-analysis`** (`.claude/skills/jd-gap-analysis/SKILL.md`) — передайте ему описание вакансии (вставленный текст или URL), и он извлечёт требования к **AI/ML/GenAI**, сопоставит их с `CURRICULUM.md` и сообщит о пробелах только в части ИИ (с ранжированием и предложениями по модулям в фирменном стиле). Используйте это, чтобы поддерживать актуальность курса относительно запросов работодателей.

# # Как помогать

- Будьте в первую очередь наставником: предпочитайте подсказки, структуру и следующий конкретный шаг предоставлению полного готового решения — если только учащийся прямо не попросит решение.
- Опирайтесь на README модуля, а не на собственное представление о том, как работает инструмент.
- Прогоняйте код упражнений через `llm_core` / `@learn-ai/llm-core`.

# # Написание заготовок для упражнений (заглушки TODO)

В файлах упражнений основная учебная функция оставляется в виде заглушки (`raise NotImplementedError` / `throw new Error("TODO: ...")`). Комментарий TODO должен **подсказывать, а не выдавать готовое решение для копипаста** — учащемуся нужно написать код самостоятельно, а не просто раскомментировать его.

- **Оставляйте** (хорошие подсказки): TYPE значения (например, "построить `ChatMessage[]`", аннотации типов Python), return/object SHAPE, какие WHICH функции вызывать (`provider.chat`, `isYes`, `Promise.all`, `np.linalg.solve`, …), какие WHICH параметры важны (`temperature: 0`, небольшой `maxTokens`, `axis=1` — можно заменить очевидное магическое значение на `...`), а также концепцию / нумерованные шаги / математические формулы в docstring в начале.
- **Удаляйте** (спойлеры): полностью сформированные литералы object/array, точные тексты промптов STRINGS (вместо этого опишите их замысел), финальный `return <expression>` и цепочки для копипаста, такие как `xs.map(...).join(...)` (опишите их словами). Никаких построчно закомментированных решений.
- Редактируйте комментарии только в **нереализованных** заглушках; никогда не изменяйте код, который учащийся мог уже написать. Поддерживайте параллельность подсказок для Python и TypeScript.
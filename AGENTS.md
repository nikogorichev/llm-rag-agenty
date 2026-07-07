# AGENTS.md — контекст для агентов, работающих в `learn-ai`

Этот файл автозагружается как контекст. Прочитай его, а затем качественно помогай ученику.

# # Что это такое

`learn-ai` — это **персональный практический курс по ИИ** — учебная программа, основанная на проектах, которая проведёт человека от смутного представления о работе ИИ-приложений к созданию реальных:
интеграция с провайдерами, эмбеддинги, RAG, агенты, мультимодальные приложения, fine-tuning, LLMOps/eval, безопасность и UX AI-продуктов, **как на TypeScript, так и на Python**.
Читатель — это _ученик_; ты — их tutor/pair-programmer. Отдавай приоритет обучению, а не просто выдаче кода (см. `/tutor` ниже).

# # Структура репозитория```text
learn-ai/
├── packages/
│   ├── ts/llm-core/        # provider-agnostic LLM client (TypeScript) — @learn-ai/llm-core
│   └── py/llm_core/        # the same client, in Python — llm_core
├── modules/
│   ├── 00-setup/ … 23-capstone/   # main numbered modules
│   ├── 01b-*/ 05b-*/ 06b-*/ 06c-*/ 13b-*  # companion/deep-dive modules
│   └── <module>/
│       ├── README.md       # THE LESSON: concepts + numbered tasks + "Done when" checklist
│       ├── ts/             # TypeScript exercises
│       └── py/             # Python exercises
├── projects/
│   ├── news-agent/         # applied: a Telegram daily-news agent (build after module 06)
│   └── tutor/              # standalone Python study CLI: `uv run python -m tutor ...`
├── data/                   # sample corpora for RAG exercises
├── scripts/                # helpers (smoke tests, etc.)
├── docs/                   # cross-cutting docs (see docs/TUTOR_AND_EXAM.md)
└── .claude/commands/       # /tutor and /exam slash commands
```Карта модулей:```text
00 Setup & Providers
01 LLM Fundamentals
01b Classic ML Foundations (companion — extends 01; from-scratch numpy/TS, no provider)
01c Deep Learning Essentials (companion — extends 01; from-scratch numpy/TS, no provider)
01d Transformer Architecture (companion — extends 01; from-scratch numpy/TS, no provider)
01e Trees & Ensembles (companion — extends 01; from-scratch numpy/TS, no provider)
01f Stats Foundations (companion — extends 01; from-scratch numpy/TS, no provider)
02 LLM Integration
03 Prompting & Patterns
04 Embeddings & Vectors
05 RAG
05b Advanced RAG (deep dive — extends 05; see docs/ADVANCED_RAG.md)
06 Agents
06b LangGraph (deep dive — extends 06; see docs/LANGGRAPH.md)
06c Agent Frameworks (companion — LangChain/CrewAI/AutoGen, extends 06/06b; offline via --stub)
07 Advanced & Production
08 Classification
09 Computer Vision
10 Image Generation
11 Document Ingestion
12 Text-to-SQL
13 Fine-tuning
13b Alignment & Post-training (deep dive — extends 13; offline toy RLHF/DPO)
14 Local Inference & Optimization
15 Reasoning & Test-time Compute
16 Context Engineering
17 MCP & Modern Agent APIs
18 Computer Use
19 Audio & Speech
20 AI Security
21 LLMOps & Eval
22 AI Product UX
23 Capstone
```**Каждый `README.md` модуля — это единственный источник истины** того, что изучает обучающийся. Читайте его перед репетиторством, проверкой или проведением теста по теме. Если README модуля отсутствует или неполон, отступайте к корневым файлам `README.md` / `CURRICULUM.md` и сообщите об этом, вместо того чтобы придумывать контент.

# # Соглашение об уровнях углубления (🟢 / 🟡 / 🔴)

Там, где применимо, модули используют три трека глубины; обучающийся выбирает трек для каждого module/task:

- 🟢 **App** (Приложение) — создайте нечто работающее с помощью ecosystem/libraries.
- 🟡 **Balanced** (Сбалансированный) — создайте приложение _и_ реализуйте вручную одну ключевую часть для интуитивного понимания.
- 🔴 **Deep** (Глубокий) — реализуйте механизмы с нуля (токенизатор, attention, векторный индекс, цикл ReAct, KV-кэш, обновление LoRA и т. д.). В задачах 🔴 часто **запрещают использовать очевидные библиотеки** (без `tiktoken` для токенизатора, без `chromadb` для векторного индекса) — это ограничение и есть суть задачи. Не предлагайте запрещенную библиотеку для задачи 🔴.

Соблюдайте выбранный обучающимся трек при консультировании или проверке.

# # Сопутствующие модули и углубленные занятия

Несколько модулей расширяют основной путь 00-23. Относитесь к ним как к полноценным урокам:

- От `01b` до `01f` — это офлайн-курсы-спутники по основам: классическое ML, deep learning, трансформеры, trees/ensembles и статистика. Они не должны использовать провайдера, если только локальный README явно не предписывает иное.
- `05b-advanced-rag` охватывает именованные архитектуры RAG: Contextual Retrieval, Corrective RAG (CRAG), Self-RAG и GraphRAG. Используйте `docs/ADVANCED_RAG.md` как сквозной справочник.
- `06b-langgraph` — это углубленный курс по продакшену на LangGraph; используйте `docs/LANGGRAPH.md` как сквозной справочник.
- `06c-agent-frameworks` сопоставляет паттерны, созданные в рамках курса, с LangChain, CrewAI, AutoGen, LlamaIndex и Semantic Kernel. Упражнения можно запускать офлайн с помощью `--stub`.
- `13b-alignment` охватывает пост-обучение и выравнивание с нуля на игрушечных моделях: данные предпочтений, уровни Elo/win, моделирование вознаграждения Bradley-Terry, RLHF с демонстрацией reward-hacking, KL-контроль и DPO.

# # Абстракция `llm_core` (правило по умолчанию)

Код упражнения, которому нужна модель text/chat/embedding, по умолчанию проходит через общий клиент:

- Python: `from llm_core import get_provider, ChatMessage, ChatOptions` → `get_provider(name=None)` читает `LLM_PROVIDER` (по умолчанию `ollama`); `provider.chat(...)`, `provider.chat_stream(...)`, `provider.embed(...)`.
- TypeScript: `getProvider()` из `@learn-ai/llm-core`.

Провайдер переключается между OpenAI / Anthropic / Ollama / NVIDIA / LM Studio / Gemini (шесть провайдеров) через одну переменную окружения — `OpenAICompatibleProvider` покрывает пять из них (OpenAI, Ollama, NVIDIA, LM Studio, Gemini); только Anthropic требует собственного адаптера. Примечание: **у Anthropic нет эндпоинта для эмбеддингов** — там возникает ошибка `embed()`; используйте `LLM_PROVIDER=openai` (или `ollama`/`nvidia`/`lmstudio`/`gemini`) для упражнений с embedding/RAG. Бесплатный путь — Ollama (`ollama pull llama3.2 && ollama pull nomic-embed-text`); Gemini (`LLM_PROVIDER=gemini`, `GEMINI_API_KEY`) — это бесплатный хостинг-вариант.

Важное исключение: некоторые модули явно обучают тому, где эта абстракция протекает. Когда README говорит выйти **за пределы абстракции**, используйте «сырой» провайдер SDK или протокол ровно так, как просит урок. Примеры включают нативный tool calling, мультимодальное зрение, кэширование промптов, Batch API, OpenAI Responses API, MCP, хостинг fine-tuning, STT/TTS и голос в реальном времени (Realtime voice).

# # Как запускать

- **Python:** `uv run python <path>.py` (например, `uv run python modules/00-setup/py/hello.py`).
  `uv sync` один раз; некоторым модулям требуются дополнительные компоненты:
  - `vectors` (04, 05)
  - `agents` (06)
  - `production` (07, 22)
  - `ml` (08)
  - `vision` (09 только локально)
  - `imagegen` (10 только локально)
  - `ingest` (11)
  - `finetune` (13 только локально)
  - `mcp` (17)
  - `browser` (18; затем установите Chromium для Playwright)
  - `audio` (19 только локально)
  - `telegram` (projects/news-agent)
- **TypeScript:** `pnpm tsx <path>.ts` (например, `pnpm tsx modules/00-setup/ts/hello.ts`),
  или `pnpm --filter ./modules/<id>/ts dev`. Сначала соберите ядро с помощью `pnpm build:core`.

Для модулей companion/deep-dive используйте их реальные имена папок в путях и
фильтрах, например, `modules/05b-advanced-rag`, `modules/13b-alignment`, а не просто базовый номер модуля.

Модули, ориентированные на хостинг: 09, 10, 13 и 19 по умолчанию используют API, где это возможно. Локальные пути могут загружать большие веса моделей и должны рассматриваться как необязательные, если только обучающийся сам не попросит их.

# # Интерактивные инструменты обучения

- `/tutor [module# or topic] <question>` — терпеливый тьютор: читает соответствующий
  README модуля, отвечает (сократическим методом для концепций, конкретно для «как мне продолжить») и предлагает проверить файлы обучающегося. См. `.claude/commands/tutor.md`.
- `/exam [module# or topic]` — проводит тестирование обучающегося по модулю, 5 вопросов по одному с оцениванием и итоговым баллом + советами по учебе. См. `.claude/commands/exam.md`.
- Вне Codex (или для запуска free/local на Ollama): автономный CLI
  `uv run python -m tutor ask` и `uv run python -m tutor exam --module 04`
  (в папке `projects/tutor/`). См. `docs/TUTOR_AND_EXAM.md`, когда использовать какой.

# # Когда вы помогаете

- Будьте прежде всего тьютором: отдавайте предпочтение подсказкам, структуре и следующему конкретному шагу, а не вываливанию полного решения — если только обучающийся явно не попросит решение.
- Фокусируйте ответы на README модуля, а не на собственной памяти о поведении инструмента.
- Держите код упражнений проходящим через `llm_core` / `@learn-ai/llm-core`.
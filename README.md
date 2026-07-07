# LLM • RAG • Автономные Агенты

**Практический курс по созданию современных AI-приложений**

> Полный перевод на русский язык

От первого «Hello, LLM» до production-агентов с инструментами, памятью, оценкой и мониторингом.

---

## Подход курса

Вы не просто читаете. Каждый модуль — это код, который вы запускаете, ломаете и дорабатываете.

| Уровень          | Что это значит                                      | Примеры модулей     |
|------------------|-----------------------------------------------------|---------------------|
| 🟢 **Приложение**     | Работающее приложение на готовых инструментах      | все модули          |
| 🟡 **Сбалансированный** | Приложение + ручная реализация ключевого механизма | 01, 03–05, 07       |
| 🔴 **Глубокий**       | Реализация с нуля (attention, векторный индекс и т.д.) | 01, 04, 06, 13      |

Выбирайте свой уровень. Глубокие задачи необязательны, но именно они дают настоящее понимание.

---


# # Карта| № | Модуль | Что вы создадите | Основные идеи |
|---|---|---|---|
| 00 | [Setup & Providers](modules/00-setup/) | "Hello LLM" для 6 провайдеров | ключи API, абстракция провайдера, OpenAI-совместимые API |
| 01 | [LLM Fundamentals](modules/01-fundamentals/) | токенизатор BPE, косинусное сходство, игрушечный attention head, сэмплеры | токены, embeddings, attention, семплинг, что вообще такое «модель» |
| 02 | [LLM Integration](modules/02-llm-integration/) | потоковый чат, JSON/структурированный вывод, tool calling, повторы | цикл request/response, function calling, стоимость и токены |
| 03 | [Prompting & Patterns](modules/03-prompting/) | библиотека промптов + оценщик | few-shot, chain-of-thought, самосогласованность, оценка промптов |
| 04 | [Embeddings & Vectors](modules/04-embeddings-vectors/) | векторный индекс в памяти с нуля, затем Chroma/Qdrant | embeddings, ANN search, разбиение на чанки, гибридный (BM25 + dense) поиск |
| 05 | [RAG](modules/05-rag/) | полный RAG-пайплайн Q&A + оценка | chunk→embed→retrieve→rerank→generate, цитирование, верность (faithfulness) |
| 06 | [Agents](modules/06-agents/) | агент ReAct с нуля, затем с LangGraph | инструменты, циклы планирования, память, мультиагентность || 07  | [Advanced & Production](modules/07-advanced-production/)                   | Средство оценки (harness), трассировка, кеширование, обслуживаемая API                                                       | LLM как судья, наблюдаемость, контроль затрат, развертывание           |
| 08  | [Classification](modules/08-classification/)                               | Классификатор текста тремя способами + один с нуля на softmax/GD                                           | LLM zero-shot против embeddings+ML против обученной головы, метрики (F1)    |
| 09  | [Computer Vision](modules/09-computer-vision/)                             | Классификация изображений, CLIP zero-shot, мультимодальное зрение LLM, свертка с нуля            | пиксели→признаки, CNN/ViT, CLIP, vision LLMs                     |
| 10  | [Image Generation](modules/10-image-generation/)                           | Text-to-image (размещенный Stable Diffusion), img2img/inpainting, игрушечный diffusion-сэмплер               | процесс диффузии, латентное пространство, U-Net, guidance                |
| 11  | [Document Ingestion](modules/11-document-ingestion/)                       | Реальный pipeline ingest-а RAG (PDF/HTML, очистка, чанкование с учетом структуры, инкрементальная индексация) | фронтенд для «грязных» данных, который реально нужен RAG                     |
| 12  | [Text-to-SQL](modules/12-text-to-sql/)                                     | NL→SQL поверх реальной БД, с защитой + гибридной маршрутизацией                                                | запросы к структурированным данным, заземление по схеме, защитные механизмы (guardrails) SQL      |
| 13  | [Fine-tuning](modules/13-fine-tuning/)                                     | Prompt против RAG против fine-tune; размещенный SFT; LoRA с нуля; дистилляция                            | SFT, LoRA/QLoRA, подготовка датасета, когда применять fine-tune                |
| 14  | [Local Inference & Optimization](modules/14-local-inference-optimization/) | Квантование и бенчмарки пропускной способности, KV cache с нуля, routing/fallbacks модели             | квантование, KV cache, serving-движки, нагрузочное тестирование           |
| 15  | [Reasoning & Test-time Compute](modules/15-reasoning-test-time-compute/)   | Модели рассуждения против стандартных, самосогласованность, best-of-N, самосовершенствование                             | расширенное мышление, трата вычислений на inference                |
| 16  | [Context Engineering](modules/16-context-engineering/)                     | Бюджетирование токенов, кеширование промптов, уплотнение памяти, map-reduce, пакетная API                          | использование контекстного окна как ограниченного бюджета                     || 17  | [MCP & Modern Agent APIs](modules/17-mcp/)                                 | Сервер MCP курса + агент, который его использует; Responses API                                         | Model Context Protocol, hosted tools, remote MCP                |
| 18  | [Computer Use](modules/18-computer-use/)                                   | Браузерный агент (vision + DOM grounded) с safety gates                                          | computer-use models, automation, action allowlists              |
| 19  | [Audio & Speech](modules/19-audio-speech/)                                 | STT, TTS, голосовой репетитор; VAD/denoise; realtime                                                     | Whisper, TTS, voice agents, аудиопрепроцессинг                 |
| 20  | [AI Security](modules/20-ai-security/)                                     | Атакуйте, а затем защитите собственного RAG агента; red-team harness                                          | OWASP LLM Top 10, prompt injection, excessive agency            |
| 21  | [LLMOps & Eval](modules/21-llmops-eval/)                                   | Версионированные eval-наборы, CI regression gate, мониторинг, цикл обратной связи                               | жизненный цикл eval, ворота регрессии, human review              |
| 22  | [AI Product UX](modules/22-ai-product-ux/)                                 | Реальное мини-приложение: streaming UI, детализация цитат, обратная связь, approval flow                       | доверие, состояния сбоев, «показать источники», human-in-the-loop        |
| 23  | [Capstone](modules/23-capstone/)                                           | Приложение-агент на базе RAG, end-to-end                                                                | всё вышеперечисленное, интегрировано                                    |

> **Deep dive — [`modules/05b-advanced-rag/`](modules/05b-advanced-rag/):** расширяет
> модуль 05 описанными **продвинутыми архитектурами RAG** (TS + Py): Contextual
> Retrieval, Corrective RAG (CRAG), Self-RAG и GraphRAG (multi-hop, с
> нуля) — паттерны обратной связи и графов, которые устраняют слепые зоны наивного RAG. [`docs/ADVANCED_RAG.md`](docs/ADVANCED_RAG.md) — это справочник +
> pick-by-failure cheat-sheet.> **Глубокое погружение — [`modules/06b-langgraph/`](modules/06b-langgraph/):** расширяет модуль 06 полным уроком по **LangGraph** (TS + Py): состояние и редьюсеры, условные переходы/`ToolNode`, персистентность, участие человека `interrupt()`, стриминг, подграфы, передача управления супервайзеру и «путешествие во времени» — функции продакшена, о которых спрашивают на собеседованиях. [`docs/LANGGRAPH.md`](docs/LANGGRAPH.md) — это справочник + шпаргалка.

> **Дополнения к основам — [`modules/01b-ml-foundations/`](modules/01b-ml-foundations/), [`modules/01c-deep-learning/`](modules/01c-deep-learning/), [`modules/01d-transformer/`](modules/01d-transformer/), [`modules/01e-trees-ensembles/`](modules/01e-trees-ensembles/), [`modules/01f-stats-foundations/`](modules/01f-stats-foundations/):** расширяют модуль 01 разбором вопросов по теории классического ML / глубокого обучения / трансформеров — чистый код на numpy + TS с нуля, провайдеры не нужны. **01b** охватывает регрессию, смещение и дисперсию, гребневую регрессию, кросс-валидацию, ROC/AUC и k-means; **01c** реализует скалярный движок автограда + MLP, оптимизаторы (SGD/Momentum/Adam), инициализацию, регуляризацию и RNN с BPTT; **01d** собирает декодер в стиле GPT — многоголовое внимание с каузальной маской, синусоидальное позиционное кодирование, блоки pre-LN типа LayerNorm/GELU/FFN, KV-кэш и сравнение энкодера и декодера (BERT vs GPT), а также заметки к собеседованиям про RoPE, GQA/MQA, FlashAttention, MoE и законы масштабирования; **01e** строит деревья решений (CART), случайные леса, градиентный бустинг и эмпирическое разложение смещения и дисперсии; **01f** охватывает теорему Байеса и наивный Байес, MLE (и почему перекрёстная энтропия _это_ MLE), проверку гипотез / критерии A/B и PCA с нуля.

> **Глубокое погружение — [`modules/13b-alignment/`](modules/13b-alignment/):** расширяет модуль 13 темой **посттренинга и выравнивания** — ответ на вопрос «как на самом деле обучают ChatGPT?» для собеседований, реализованный с нуля на игрушечных моделях (TS + Py, полностью офлайн): данные предпочтений + Elo/win, модель вознаграждения Брэдли–Терри, RLHF с REINFORCE, включая демо **reward hacking** (эффект Гудхарта) с ограничением KL и без него, а также **DPO** с нуля с выводом формул.> **Глубокое погружение — [`modules/06c-agent-frameworks/`](modules/06c-agent-frameworks/):** расширяет модули 06/06b пятью фреймворками, которые часто встречаются на собеседованиях — **LangChain** (LCEL `prompt | model | parser`, буферная память, retrievers/RAG), **CrewAI** (role → task → sequential crew), **AutoGen** (round-robin group chat), **LlamaIndex** (Documents → index → query engine для RAG) и **Semantic Kernel** (skills/functions + планировщик) — каждый заново реализован через `llm_core`, а затем сопоставлен с API реальной библиотеки. Каждая задача выполняется офлайн с помощью детерминированной модели `--stub`.

> **Глубокое погружение — [`modules/06d-agent-memory/`](modules/06d-agent-memory/):** расширяет модули 06/06b темой **инженерии памяти агента** — различие между memory-augmented и memory-aware, а также полной таксономией (эпизодическая, семантическая, процедурная, сущностная, сводная): жизненный цикл «чтение перед / запись после», пороги релевантности для зашумленного поиска, извлечение сущностей + слияние, сжатие сводок с расширением по требованию (just-in-time), а также составной `MemoryManager` с вытеснением по TTL, который удерживает контекст в пределах бюджета токенов на протяжении всего диалога. Офлайн через `--stub`, как в 06c.

**Приоритет хостинга** (по умолчанию используются API, опциональный тяжелый локальный путь задокументирован): модули **09, 10** (vision/diffusion), **13** (fine-tuning), **19** (аудио). Никаких загрузок в несколько гигабайт, если вы сами не выберете этот вариант.

**Путаетесь в аббревиатурах?** Каждое сокращение, используемое в курсе (BM25, RAG, HNSW, KV cache, LoRA, …), расшифровывается при первом упоминании в каждом уроке и собрано в [`docs/GLOSSARY.md`](docs/GLOSSARY.md).

**Прикладные проекты** (в [`projects/`](projects/)):

- [`projects/news-agent`](projects/news-agent/) — Telegram-бот, которым управляет агент, чтобы собирать новости по выбранной вами теме и публиковать ежедневный дайджест. Соберите его после модуля 06; он объединяет интеграцию, агентов, инструменты и планирование в то, что вы действительно запустите. (`uv run python -m news_agent --dry-run`, чтобы попробовать без настройки Telegram.)
- [`projects/tutor`](projects/tutor/) — ваш учебный напарник: **режим «Вопрос-ответ»** для вопросов о проекте и порядке действий, а также **режим экзамена**, который проводит тестирование по модулю и ставит оценку. Бесплатно работает на Ollama. Можно использовать с первого дня. Также есть слэш-команды Claude Code `/tutor` и `/exam`, если вы используете Claude Code — см. [`docs/TUTOR_AND_EXAM.md`](docs/TUTOR_AND_EXAM.md).

Прочитайте [`CURRICULUM.md`](CURRICULUM.md), чтобы узнать подробный план по неделям, предварительные условия и чеклисты «вы закончили, когда…».

---

# # Структура репозитория```text
learn-ai/
├── packages/
│   ├── ts/llm-core/        # provider-agnostic LLM client (TypeScript)
│   └── py/llm_core/        # the same, in Python
├── modules/
│   ├── 00-setup/ … 23-capstone/   # 24 modules
│   │   ├── README.md       # the lesson + tasks + "done when" checklist
│   │   ├── ts/             # TypeScript exercises
│   │   └── py/             # Python exercises
├── projects/
│   ├── news-agent/         # the Telegram daily-news agent
│   └── tutor/              # Q&A + exam study CLI
├── docs/                   # TOOLING.md, TUTOR_AND_EXAM.md
├── data/                   # sample corpora for RAG exercises
├── scripts/                # helpers (smoke tests, etc.)
└── .claude/commands/       # /tutor and /exam slash commands
```Два пакета ``llm-core`` — основа курса: вы пишете код упражнений для одного небольшого интерфейса и переключаетесь между OpenAI ↔ Claude ↔ Ollama ↔ LM Studio ↔ NVIDIA ↔ Gemini, просто меняя одну переменную окружения. Понимание того, _почему_ такая абстракция возможна (и где она даёт течь), — это содержание модулей 00–02.

---

# # Настройка (выполните один раз)

## # 1. Клонирование и секреты```bash
cp .env.example .env
# edit .env — you only need keys for the providers you'll use.
# Zero-cost path: install Ollama and leave LLM_PROVIDER=ollama.
```### 2. Выберите бесплатный или платный путь

| Вариант                              | Стоимость                         | Настройка                                                                                                                              |
| --------------------------------- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| **Ollama** (рекомендуется для начала) | бесплатно                         | [Install Ollama](https://ollama.com), затем `ollama pull llama3.2 && ollama pull nomic-embed-text`                                  |
| **LM Studio**                     | бесплатно                         | [Install LM Studio](https://lmstudio.ai), загрузить модель, Start Server (порт 1234) → `LLM_PROVIDER=lmstudio` + `LMSTUDIO_CHAT_MODEL` |
| **NVIDIA NIM**                    | бесплатный тариф                    | получите ключ на [build.nvidia.com](https://build.nvidia.com) → `NVIDIA_API_KEY` в `.env`                                             |
| **Google Gemini**                 | бесплатный тариф                    | ключ на [aistudio.google.com/apikey](https://aistudio.google.com/apikey) → `GEMINI_API_KEY` в `.env`, `LLM_PROVIDER=gemini`        |
| **OpenAI**                        | платно (~$5 хватит на курс) | ключ на [platform.openai.com](https://platform.openai.com/api-keys)                                                                 |
| **Anthropic**                     | платно                         | ключ на [console.anthropic.com](https://console.anthropic.com); установите `ANTHROPIC_MODEL=claude-haiku-4-5` для дешёвых итераций          |

## # 3. Python```bash
# uv (https://docs.astral.sh/uv/) manages the env + the editable llm_core install.
uv sync
uv run python scripts/smoke_test.py        # verifies your provider works
```Некоторые модули требуют extras: `uv sync --extra` `vectors` (04, 05), `agents` (06),
`production` (07, 22), `ml` (08), `vision` (09, только локально), `imagegen` (10,
только локально), `ingest` (11), `mcp` (17), `browser` (18), `finetune` (13,
только локально), `audio` (19, только локально), `telegram` (news-agent). Extras
`vision`, `imagegen`, `finetune` и `audio` необязательны — эти модули по умолчанию
используют облачные API.

## # 4. TypeScript```bash
pnpm install
pnpm build:core
pnpm --filter ./modules/00-setup/ts dev      # or: cd modules/00-setup/ts && pnpm dev
```---

# # Как проходить курс

1. `cd modules/00-setup` и прочитайте `README.md`. Каждый модуль README — это урок: сначала концепции, затем пронумерованные задачи с критериями приемки.
2. Выполните задачу 🟢 (приложение), чтобы получить рабочий результат, а затем вернитесь к 🟡/🔴.
3. Запустите одно и то же упражнение с двумя разными провайдерами и обратите внимание на изменения.
4. Не пропускайте модуль 01, даже если он кажется наименее «полезным» — это базовая интуиция, необходимая для всего дальнейшего.

Рекомендуемый темп: ~1 module/week при неполной занятости. Модули 04→05→06 — это суть курса; выделите на них дополнительное время.

---

# # Соглашения

- Упражнения, требующие модель, используют `getProvider()` / `get_provider()` из `llm-core`. Никогда не хардкодите провайдера в коде упражнения.
- В каждой папке с задачей есть свой короткий `README` / docstring с объяснением _что_ и _почему_ — считайте написание этих заметок частью упражнения.
- 🔴 Задачи «from scratch» (с нуля) запрещают использование очевидных библиотек (никакого `tiktoken` для задачи с токенизатором, никакого `chromadb` для задачи с векторным индексом) — в этом и есть суть.

---

# # Лицензия

[MIT](LICENSE) — используйте, форкайте, учитесь. Вклад приветствуется.
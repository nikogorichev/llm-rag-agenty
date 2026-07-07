# news-agent — ежедневный Telegram-дайджест новостей на базе LLM

Telegram-бот, которым управляет **LLM-агент**: он собирает свежие новости по теме
по вашему выбору, определяет, что действительно важно, составляет ёмкий дайджест
и публикует его в чат или канал — по команде и автоматически один раз в день.

Это флагманский прикладной проект курса `learn-ai`. Собирайте его после
модуля 06; он объединяет всё пройденное в рабочий сервис, которым вы будете
действительно пользоваться.```
┌──────────────────────────────────────────────────────────────────────────┐
│                              news-agent                                    │
│                                                                            │
│   Telegram          ┌───────────────┐                                      │
│   /news, /settopic ─┤ telegram_bot  │◄──── commands from you               │
│   daily @ 09:00 ────┤  + scheduler  │                                      │
│                     └──────┬────────┘                                      │
│                            │ run_once(topic)                               │
│                            ▼                                               │
│                     ┌───────────────┐    pipeline.py (orchestration)       │
│                     │   pipeline    │                                      │
│                     └──┬─────────┬──┘                                      │
│              fetch_news│         │curate                                   │
│                        ▼         ▼                                         │
│              ┌───────────┐   ┌───────────────────────────┐                │
│              │ sources.py│   │        agent.py           │                 │
│              │  RSS +    │   │  ┌─────────┐  ┌─────────┐  │                 │
│              │  Google   │──►│  │  RANK   │─►│  WRITE  │  │                 │
│              │  News     │   │  │ (LLM)   │  │ (LLM)   │  │                 │
│              │ +dedupe   │   │  └─────────┘  └─────────┘  │                 │
│              │ +recency  │   └────────────┬──────────────┘                 │
│              └───────────┘                │ digest text                    │
│                                           ▼                                │
│                                    post_digest() ──► Telegram chat         │
│                                                                            │
│   every LLM call → llm_core.get_provider()  (Ollama / OpenAI / Claude / …) │
└──────────────────────────────────────────────────────────────────────────┘
```## Возможности

1. **Retrieve** — забирает свежие статьи по теме из RSS-ленты поиска Google News
   (плюс любые дополнительные RSS-ленты, которые вы настроите), нормализует их,
   отбрасывает всё, что старше ~30 часов, и удаляет почти дубликаты.
2. **Curate (агент)** — двухэтапный LLM-пайплайн: сначала *ранжирует* элементы,
   выбирая самые важные и уникальные, затем *составляет* краткий дайджест
   (однострочное вступление + 5–8 пунктов с заголовками, каждый с однострочным
   резюме и ссылкой на источник).
3. **Post** — отправляет дайджест в ваш Telegram-чат/канал, разбивая длинные
   сообщения, чтобы не превышать лимит в 4096 символов. Запускается по команде
   `/news` и автоматически каждый день в `NEWS_POST_HOUR`.

Каждый вызов модели проходит через общего провайдера `llm_core`, поэтому
из коробки он работает на **бесплатной локальной модели Ollama**, а с любым
облачным провайдером — сменой одной переменной окружения.

# # Как работает агент

`agent.py` намеренно представляет собой компактный **многошаговый агент**, а не
один гигантский промпт (паттерн из модуля 06):

- **Шаг RANK** — модель получает нумерованный список кандидатов и возвращает
  только индексы лучших и наиболее уникальных, в порядке убывания релевантности.
  Мы разбираем эти числа обратно в переупорядоченный, сокращённый список.
  Минимальный промпт и тривиальный формат вывода (только числа) делают этот
  шаг надёжным даже на небольших локальных моделях.
- **Шаг WRITE** — модель получает *только* выбранные элементы и строгое
   описание формата, а затем составляет дайджест в чистом Markdown.

Оба шага используют один и тот же экземпляр провайдера. Если LLM недоступен или
возвращает мусор на каком-либо этапе, пайплайн **корректно деградирует** до
детерминированного дайджеста без участия LLM (`fallback_digest`), так что бот
всегда публикует что-то полезное. Такая отказоустойчивость — сознательный выбор:
см. обработку ошибок в `sources.py`, `agent.py` и `pipeline.py`.# # Connection to the course- **02 — LLM integration**: all model access is performed via `get_provider()` / `ChatMessage` / `ChatOptions`; provider switching is done with a single environment variable. You will see the request/response loop, system prompts, and the use of `max_tokens` and `temperature`.
- **05 — RAG-ish retrieval**: the agent does not answer from memory — it *retrieves* a fresh corpus (web, via RSS), normalizes and filters it, and then passes only relevant items to the model. This "retrieve, then generate" scheme is the essence of RAG, where the open web serves as the knowledge base.
- **06 — agents**: the rank→write pipeline plus planned, autonomous actions (the bot publishes posts by itself and reacts to commands) is a minimal but real agent: it decides *what to do* (which stories to publish) and *acts* (sends posts to Telegram).

---

# # Setup

# # # 1. Create a Telegram bot and get a token

1. Open Telegram and chat with the [@BotFather](https://t.me/BotFather) bot.
2. Send `/newbot`, choose a name and a username ending in `bot`.
3. BotFather will reply with an HTTP API **token**, e.g.
   `123456789:AAH...`. This is your `TELEGRAM_BOT_TOKEN`.

# # # 2. Find your chat id

The bot publishes messages to a specific chat or channel (`TELEGRAM_CHAT_ID`). The easiest ways:

- **Private chat:** send any message to your new bot, then open in a browser
  `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates` and find
  `result[].message.chat.id` (this is a number, possibly negative).
- **Channel:** add the bot as a channel **admin**, post a message in the channel,
  then check `getUpdates` (or use the public channel `@username`,
  e.g. `TELEGRAM_CHAT_ID=@my_news_channel`).
- Alternatively, chat with [@userinfobot](https://t.me/userinfobot) / `@RawDataBot` to find your id.

# # # 3. Install dependencies

This project uses the `telegram` extra, which is already declared in the repository's root `pyproject.toml`:```bash
# from the repo root
uv sync --extra telegram
```Это установит `python-telegram-bot>=21`, `feedparser>=6`, `httpx>=0.27` и
`apscheduler>=3.10` (в дополнение к базовому `llm_core`).

# # # 5. Настройте переменные окружения

Добавьте их в `.env` в корне репозитория (вместе с обычными ключами `LLM_PROVIDER`):

| Переменная | Обязательная | По умолчанию | Описание |
| --- | --- | --- | --- |
| `TELEGRAM_BOT_TOKEN` | для публикации | — | токен от @BotFather |
| `TELEGRAM_CHAT_ID` | для публикации | — | чат/канал для публикации |
| `NEWS_TOPIC` | нет | `artificial intelligence` | тема по умолчанию для отслеживания |
| `NEWS_POST_HOUR` | нет | `9` | местный час (24‑часовой формат) для ежедневной публикации |
| `NEWS_MAX_ITEMS` | нет | `7` | заголовков в дайджесте (1–20) |
| `NEWS_RECENCY_HOURS` | нет | `30` | учитывать только элементы, новее указанного |
| `NEWS_EXTRA_FEEDS` | нет | — | дополнительные RSS‑URLы (разделены запятыми/пробелами/новыми строками) |
| `NEWS_LANG` / `NEWS_COUNTRY` | нет | `en-US` / `US` | локаль Google News |
| `LLM_PROVIDER` + ключи провайдера | да | `ollama` | см. `.env.example` в репозитории |

**Бесплатный путь:** установите [Ollama](https://ollama.com), выполните
`ollama pull llama3.2`, оставьте `LLM_PROVIDER=ollama`, и для самого дайджеста
API‑ключи вам не понадобятся.

# # # 6. Запуск

Всегда начинайте с `--dry-run` — нужен **только** провайдер LLM (настройка Telegram не
требуется), и дайджест выводится в консоль, чтобы вы могли сразу увидеть работу всего
конвейера:```bash
# 1) See it work end-to-end with zero Telegram setup:
uv run python -m news_agent --dry-run
uv run python -m news_agent --dry-run --topic "open source LLMs" -v

# 2) Post a single digest to Telegram (needs the token + chat id):
uv run python -m news_agent --once

# 3) Run the bot + daily scheduler (posts every day at NEWS_POST_HOUR):
uv run python -m news_agent bot
```Пока бот запущен, отправляйте ему сообщения:

| Команда | Действие |
| --- | --- |
| `/start` | приветствие + текущая тема |
| `/help` | список команд |
| `/news` | собрать и опубликовать дайджест прямо сейчас |
| `/topic` | показать текущую тему |
| `/settopic <topic>` | сменить тему (будет использована и в следующем дайджесте) |

# # Запуск тестов

Тесты покрывают **только логику** — без сети, без LLM:```bash
uv run pytest projects/news-agent/test_news_agent.py
```Они проверяют дедупликацию, фильтр по свежести, сплиттер Telegram-сообщений, удаление HTML, построение URL, а также парсинг конфигурации и её валидацию на небольших фикстурах.

# # Структура проекта```
projects/news-agent/
├── news_agent/
│   ├── __init__.py        # public surface + docs
│   ├── config.py          # env → Settings, defaults + validation
│   ├── sources.py         # RSS retrieval, normalize, dedupe, recency filter
│   ├── agent.py           # LLM rank→write curation pipeline (the "agent")
│   ├── pipeline.py        # run_once / post_digest orchestration + splitter
│   ├── scheduler.py       # APScheduler daily job
│   ├── telegram_bot.py    # python-telegram-bot Application + commands
│   └── __main__.py        # CLI: bot | --once | --dry-run
├── test_news_agent.py     # pytest unit tests (pure logic)
└── README.md
```## Ideas for extension

- **Per‑user topics**: store each chat’s topic (and schedule) in the persistent
  `Application` storage or in a small SQLite DB, so different users receive their own digests
  and topics survive restarts.
- **More / better sources**: add RSS feeds from Bing News / Hacker News / arXiv / subreddits
  via `NEWS_EXTRA_FEEDS`, or fetch the full article text instead of the short RSS description and summarize it.
- **Embeddings deduplication**: replace the title‑similarity heuristic in
  `sources.dedupe` with semantic clustering using `embed()` from `llm_core`
  and a cosine‑similarity threshold (Module 04) to catch paraphrased duplicates.
- **Tone / categorization**: make the agent tag each story
  (positive/negative, research vs product vs politics) and group items by category.
- **Attribution / fact‑checking**: add an LLM‑judge pass (Module 07) that
  verifies every item is backed by a source reference before sending.
- **Inline buttons**: add Telegram inline keyboards for “read more”, changing the
  topic, or triggering a fresh digest without typing a command.

```
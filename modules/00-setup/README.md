# Модуль 00 — Настройка и провайдеры

Ваше первое знакомство с курсом. К концу вы отправите настоящий prompt
настоящей модели и увидите ответ, id модели и количество токенов —
из **Python** и из **TypeScript**, к **двум разным провайдерам**.

Этот модуль намеренно небольшой. Его задача — обеспечить остальную часть курса
работоспособностью «из коробки»: один крошечный интерфейс (`get_provider()` / `getProvider()`), который вы
будете переиспользовать в каждом следующем модуле, и чёткая ментальная модель того, что на самом деле
происходит, когда вы «вызываете LLM».

---

# # Концепции

## # Что такое «провайдер LLM»?

Большая языковая модель (LLM) — это большая нейросеть, которая, получив текст,
предсказывает, какой текст должен идти дальше. Вы почти никогда не запускаете эту сеть
самостоятельно — это десятки гигабайт и нужен GPU (Graphics Processing Unit). Вместо этого **провайдер**
размещает её за HTTP (HyperText Transfer Protocol) API (Application Programming Interface): вы отправляете POST-запрос с сообщениями, они стримят токены в ответ.

В этом курсе _провайдер_ — это любой сервис, который может ответить на одни и те же
три вопроса:

1. **chat** — по данному диалогу сгенерировать ответ.
2. **chat (streaming)** — то же самое, но выдавать ответ токен за токеном по мере генерации.
3. **embed** — превратить текст в вектор чисел (используется с модуля 04).

`llm-core` (в `packages/`) оборачивает шесть таких сервисов — OpenAI, Anthropic (Claude),
Ollama, NVIDIA NIM (NVIDIA Inference Microservices), LM Studio и Google Gemini — за единым интерфейсом, чтобы ваш код в упражнениях не был привязан к конкретному вендору. Ниже вы увидите, _почему_ возможна эта абстракция, и _где она даёт течь_ в модуле 02.

## # Почему формат HTTP OpenAI стал де-факто стандартом

Когда OpenAI выпустила `/v1/chat/completions`, формат JSON (JavaScript Object Notation) запроса и ответа
оказался простым и достаточно удачным, чтобы его скопировали все. Сегодня **Ollama, NVIDIA NIM,
vLLM, LM Studio, Together, Groq, Google Gemini** и многие другие предоставляют _точно
тот же формат эндпоинта_. Это огромный плюс: один клиентский класс — меняются только
`base_url`, API-ключ и id модели — говорит со всеми ими.

Именно это делает `OpenAICompatibleProvider` в `llm-core`. Один класс покрывает **пять из наших шести провайдеров** (OpenAI, Ollama, NVIDIA, LM Studio, Gemini). Вы указываете `http://localhost:11434/v1` для Ollama, `http://localhost:1234/v1` для LM Studio, `https://integrate.api.nvidia.com/v1` для NVIDIA или `https://generativelanguage.googleapis.com/v1beta/openai/` для Gemini, а остальной код остаётся таким же.

```text
            same request/response shape
 your code ───────────────────────────────▶  /v1/chat/completions
                                              ├─ api.openai.com      (OpenAI)
                                              ├─ localhost:11434     (Ollama)
                                              ├─ localhost:1234      (LM Studio)
                                              ├─ integrate.api.nvidia.com (NVIDIA)
                                              └─ generativelanguage.googleapis.com (Gemini)
```

### В чём отличие Anthropic

Anthropic (создатель Claude) выпустила свой API независимо, в собственном формате: поле верхнего уровня `system` вместо системного _message_, другая структура JSON в ответе, `input_tokens`/`output_tokens` вместо `prompt_tokens`/`completion_tokens`, и **вообще нет embeddings endpoint**. Поэтому в `llm-core` есть отдельный `AnthropicProvider`, который адаптирует API Claude к тому же интерфейсу. Если попросить Claude выдать embedding, будет ошибка — для эмбеддингов используйте OpenAI, Ollama, NVIDIA, LM Studio или Gemini.

Это разделение (один общий класс, совместимый с OpenAI, и отдельный класс для Anthropic) — само по себе урок: абстракции работают до тех пор, пока вендор не делает что-то действительно отличное, тогда вы адаптируетесь на границах.

## # Кратко о токенах

Модели видят не символы или слова — они видят **токены** (подсловные фрагменты). Каждый ответ сообщает, сколько токенов ушло на вход (`input_tokens`) и сколько вышло (`output_tokens`); именно на этом основывается тарификация у платных провайдеров. Мы выводим это в каждом упражнении, чтобы стоимость была на виду. В модуле 01 мы с нуля соберём токенизатор, чтобы вы точно поняли, что такое токен.

---

# # Настройка окружения

## # Выберите путь

Для начала вам нужен только **один** работающий провайдер. Бесплатные варианты — Ollama и LM Studio (оба запускают модели локально, ключ не нужен).

| Путь                       | Стоимость                   | Как                                                                                                                                                                                                 |
| -------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Ollama** (рекомендуется) | бесплатно                   | [Установите Ollama](https://ollama.com), затем `ollama pull llama3.2 && ollama pull nomic-embed-text`. Оставьте `LLM_PROVIDER=ollama`.                                                              |
| **LM Studio**              | бесплатно                   | [Установите LM Studio](https://lmstudio.ai), загрузите модель, нажмите **Start Server** (порт 1234). Установите `LLM_PROVIDER=lmstudio` и `LMSTUDIO_CHAT_MODEL` в идентификатор загруженной модели. |
| **NVIDIA NIM**             | бесплатный тариф            | Получите ключ на [build.nvidia.com](https://build.nvidia.com), добавьте его в `NVIDIA_API_KEY`.                                                                                                     |
| **Google Gemini**          | бесплатный тариф            | Получите ключ на [aistudio.google.com/apikey](https://aistudio.google.com/apikey) → `GEMINI_API_KEY`. Установите `LLM_PROVIDER=gemini` (совместимая с OpenAI точка входа).                          |
| **OpenAI**                 | платно (~$5 хватит на курс) | Ключ на [platform.openai.com](https://platform.openai.com/api-keys) → `OPENAI_API_KEY`.                                                                                                             |
| **Anthropic**              | платно                      | Ключ на [console.anthropic.com](https://console.anthropic.com) → `ANTHROPIC_API_KEY`. Установите `ANTHROPIC_MODEL=claude-haiku-4-5` для экономичных итераций.                                       |

Скопируйте шаблон env и заполните ключи для выбранного пути/путей:

```bash
cp .env.example .env   # from the repo root; edit it
```

`LLM_PROVIDER` (по умолчанию `ollama`) определяет, какой провайдер возвратят `get_provider()` / `getProvider()`, если не передать имя. Чтобы попробовать конкретный провайдер без редактирования `.env`, передайте имя явно: `get_provider("anthropic")`.

## # Запуск упражнений

**Python** (из корня репозитория):

```bash
uv run python modules/00-setup/py/hello.py
uv run python modules/00-setup/py/compare_providers.py
uv run python modules/00-setup/py/streaming.py
```

**TypeScript** (из корня репозитория):

```bash
pnpm tsx modules/00-setup/ts/hello.ts
pnpm tsx modules/00-setup/ts/compare_providers.ts
pnpm tsx modules/00-setup/ts/streaming.ts
```

Эти три файла — **готовые эталонные реализации**, они уже запускаются.
Прочитайте их сверху вниз; это шаблон, который копирует каждое последующее упражнение.

---

# # Tasks

## # Task 1 — Hello, LLM 🟢

**Цель:** отправить один prompt и вывести ответ, идентификатор модели и статистику токенов.

**Steps**

1. Запустите `hello.py` / `hello.ts` как есть, используя вашего провайдера по умолчанию.
2. Прочитайте файл: обратите внимание, что он вызывает `get_provider()` без аргументов (то есть использует `LLM_PROVIDER`), формирует одно сообщение `user` и считывает `.text`, `.model`, `.usage` из результата.
3. Запустите снова, принудительно используя _второй_ провайдер — измените `LLM_PROVIDER` в `.env` или отредактируйте файл, чтобы вызвать `get_provider("ollama")` (или `"nvidia"` и т. д.).

**Acceptance:** вы видите объяснение из двух предложений, идентификатор модели и количество токенов как минимум для **двух** провайдеров.

## # Task 2 — Сравнение провайдеров 🟢

**Цель:** отправить _один и тот же_ prompt всем шести провайдерам и вывести ответы вместе — пропуская любого провайдера с отсутствующим ключом/сервером, без падения.

**Steps**

1. Запустите `compare_providers.py` / `compare_providers.ts`.
2. Обратите внимание, как каждый вызов провайдера обёрнут в try/except (Python) / try/catch (TS): отсутствующий ключ или недоступный сервер Ollama выводят дружелюбное сообщение _skipped_ вместо того, чтобы уронить весь скрипт.
3. Сравните ответы. Один и тот же prompt, разные модели — различаются ли они по длине, тону, количеству токенов?

**Acceptance:** скрипт выполняется до конца, даже если настроен только один провайдер, при этом чётко отмечается, какой провайдер отработал, а какой был пропущен.

## # Task 3 — Streaming 🟢

**Цель:** выводить токены по мере поступления, вместо того чтобы ждать полного ответа.

**Steps**

1. Запустите `streaming.py` / `streaming.ts`.
2. Наблюдайте, как вывод появляется по частям. Это использует `chat_stream()` / `chatStream()`, который выдаёт текстовые чанки по мере генерации моделью.
3. Обратите внимание, что цикл просто конкатенирует и выводит чанки без перевода строки до самого конца.

**Acceptance:** вы видите, как ответ формируется постепенно, а не сразу весь.

---

# # Done when

- [x] Вы вызвали `hello` как минимум для **двух** провайдеров и увидели ответ, модель и токены.
- [x] `compare_providers` выполняется без ошибок: пропущенные провайдеры игнорируются, без падений.
- [x] Вы увидели, как `streaming` выводит токены по мере поступления.
- [x] Вы можете объяснить одним предложением, почему один клиентский класс покрывает OpenAI + Ollama + NVIDIA + LM Studio + Gemini, а для Anthropic нужен свой.

---

# # Углубляемся

- [OpenAI Chat Completions reference](https://platform.openai.com/docs/api-reference/chat) — форма, которую скопировали все остальные.
- [Ollama OpenAI-compatibility docs](https://github.com/ollama/ollama/blob/main/docs/openai.md) — те же эндпоинты, но локально.
- [Anthropic Messages API](https://docs.anthropic.com/en/api/messages) — посмотрите, в чём отличия (поля верхнего уровня `system`, `input_tokens`).
- [NVIDIA NIM](https://build.nvidia.com) — OpenAI-совместимый хостинг с бесплатным тарифом.
- [Gemini OpenAI-compatibility docs](https://ai.google.dev/gemini-api/docs/openai) — эндпоинт Google `/v1beta/openai/`; бесплатный тариф на [aistudio.google.com/apikey](https://aistudio.google.com/apikey).
- Почитайте `packages/ts/llm-core/src/providers/` и `packages/py/llm_core/llm_core/providers/` — реальные адаптеры, которые вы используете.

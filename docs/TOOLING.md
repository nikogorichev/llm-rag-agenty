# Справочник по инструментам

Всё необходимое для установки, форматирования, линтинга, тестирования и запуска кода в этом репозитории.

---

# # Первичная настройка

## # JavaScript / TypeScript```bash
pnpm install
```Это устанавливает все зависимости JS/TS **и** запускает `husky` через скрипт `prepare`, который регистрирует Git hooks. Вам нужно сделать это только один раз (или после `git clone`).

Соберите общий пакет TypeScript перед запуском любого модуля:```bash
pnpm build:core
```### Python```bash
uv sync
```[uv](https://docs.astral.sh/uv/) создаёт `.venv/` в корне проекта, устанавливает `llm_core` как редактируемый пакет, а также все инструменты разработки (Ruff, pytest). Базовый набор намеренно облегчён, чтобы установка прошла быстро.

### # Дополнительные зависимости — устанавливайте, когда дойдёте до соответствующего модуля

| Дополнение | Команда | Используется в |
| --- | --- | --- |
| `vectors` | `uv sync --extra vectors` | Модули 04, 05 (Chroma, Qdrant, BM25) |
| `agents` | `uv sync --extra agents` | Модуль 06 (LangGraph) |
| `production` | `uv sync --extra production` | Модуль 07 (FastAPI, Uvicorn) |
| `telegram` | `uv sync --extra telegram` | `projects/news-agent` |

Их можно комбинировать: `uv sync --extra vectors --extra agents`.

## # Рекомендуемые расширения VSCode

| Расширение | ID | Назначение |
| --- | --- | --- |
| Prettier | `esbenp.prettier-vscode` | Форматирование JS/TS/JSON/MD/YAML при сохранении |
| Ruff | `charliermarsh.ruff` | Форматирование и линтинг Python при сохранении |
| Python | `ms-python.python` | Поддержка языка, поиск тестов |

---

# # Форматирование

## # JavaScript / TypeScript / JSON / Markdown / YAML

[Prettier](https://prettier.io) отвечает за форматирование всего перечисленного. Конфигурация находится в `.prettierrc.json` (ширина строки 88 символов, двойные кавычки, висячие запятые, окончания строк LF).```bash
pnpm format          # write in-place
pnpm format:check    # CI / check without writing
```### Python

Форматтер Ruff (совместимый с Black) обрабатывает файлы `.py`.```bash
uv run ruff format .          # write in-place
uv run ruff format --check .  # check without writing
```### Форматирование при сохранении

В репозитории уже есть файлы `.vscode/settings.json` (и `extensions.json`), поэтому автоматическое форматирование при сохранении работает «из коробки» сразу после установки рекомендуемых расширений. `editor.formatOnSave` включен для всех поддерживаемых типов файлов: Prettier используется как средство форматирования по умолчанию для JS/TS/JSON/MD/YAML, а для Python — Ruff.

При сохранении файлов Python выполняется **только форматирование** — намеренно **не** запускаются `source.fixAll.ruff` и `source.organizeImports.ruff`. Эти автоматические действия удаляют импорты, которые Ruff считает неиспользуемыми. Это привело бы к тому, что заранее предоставленные импорты в заготовках упражнений (например, `ChatMessage`) молча удалялись бы при сохранении, еще до того, как вы напишете код в блоке TODO, который их использует. Запускайте `uv run ruff check --fix .` вручную, когда действительно хотите это сделать. Если вам нужно исправление при сохранении, добавьте блок `codeActionsOnSave` в локальные настройки (это не повлияет на общую конфигурацию).

## # Универсальные базовые настройки (`.editorconfig`)

`.editorconfig` содержит правила отступов, кодировки, концовок строк и наличия пустой строки в конце файла для **любого** редактора (JetBrains, Zed, Vim, VS Code с расширением EditorConfig), так что для соответствия стилю репозитория не обязательно устанавливать Prettier/Ruff. Он дублирует их настройки: отступ в 2 пробела (4 для Python), переводы строк LF, кодировка UTF-8, удаление пробелов в конце строк (кроме Markdown, где два пробела означают жесткий перенос строки). Prettier и Ruff остаются эталоном для полного форматирования, а `.editorconfig` служит универсальным базовым резервным вариантом.

---

# # Линтинг

Ruff — единственный линтер для Python. Он охватывает pycodestyle (E/W), Pyflakes (F), сортировку импортов (I), pyupgrade (UP) и Bugbear (B).```bash
uv run ruff check .           # report issues
uv run ruff check --fix .     # auto-fix where possible
```Отдельный линтер для JS/TS не настроен — Prettier отвечает за стиль, а компилятор TypeScript (`pnpm typecheck`) выявляет ошибки типов.

---

# # Тесты

## # TypeScript — Jest```bash
pnpm test
```Jest использует `@swc/jest` для быстрой транспиляции (без проверки типов — для этого есть `pnpm typecheck`). Он сканирует `modules/` и `packages/` в поисках файлов, соответствующих шаблону `**/*.test.ts`.

## # Python — pytest```bash
uv run pytest
```pytest сканирует `modules/`, `packages/` и `projects/` в поисках файлов, соответствующих `test_*.py` или `*_test.py`. Флаг `-q` установлен по умолчанию в `pyproject.toml`.

---

# # Запуск отдельных файлов

## # TypeScript```bash
pnpm tsx scripts/smoke.ts
# or any exercise file:
pnpm tsx modules/00-setup/ts/hello.ts
````tsx` транспилирует на лету через esbuild — для разовых скриптов этап сборки не требуется.

## # Python```bash
uv run python scripts/smoke_test.py
# or any exercise file:
uv run python modules/00-setup/py/hello.py
```Команда `uv run` гарантирует, что виртуальное окружение `.venv` активно, а пакет `llm_core` доступен в PATH.

---

# # Git hooks (Husky)

Хуки регистрируются автоматически при выполнении `pnpm install` (через скрипт `prepare`). В корне репозитория должна появиться папка `.husky/`.

## # pre-commit — lint-staged

Выполняется при каждом `git commit`. Обрабатываются только индексированные файлы:

| Шаблон индексированного файла | Действие |
| --- | --- |
| `*.{ts,tsx,js,jsx,json,md,yaml,yml}` | `prettier --write` |
| `*.py` | `uv run ruff format`, затем `uv run ruff check --fix` |

Если Prettier или Ruff внесут изменения в файл, модифицированная версия автоматически включится в коммит.

## # pre-push — полный набор тестов

Выполняется при каждом `git push`. Запускаются оба набора тестов:```text
→ jest (TypeScript)
→ pytest (Python)
```Код выхода pytest 5 (no tests collected) трактуется как успешный, чтобы пустой набор тестов не блокировал вас.

## # Аварийный обход```bash
git commit --no-verify   # skip pre-commit
git push --no-verify     # skip pre-push
```Используйте умеренно — хуки существуют, чтобы отлавливать поломки до того, как код попадёт в репозиторий.

---

# # Устранение неполадок

**Хуки не запускаются после клонирования**
Выполните `pnpm install` — это перезапустит `husky` через скрипт жизненного цикла `prepare` и зарегистрирует хуки в `.git/hooks/`.

**Ошибка `ruff: command not found` в хуке**
Ruff находится в dev-группе uv, а не в системном PATH. Хуки вызывают `uv run ruff ...`, который всегда использует `.venv` внутри проекта. Если самого `uv` нет, установите его: `curl -LsSf https://astral.sh/uv/install.sh | sh`.

**pytest или jest не найдены**
Оба инструмента находятся в dev-зависимостях. Выполните `pnpm install` (JS) и `uv sync` (Python), чтобы восстановить их.

**Ошибки импорта `llm_core` в Python**
`uv sync` устанавливает его как редактируемый пакет. Если появляется `ModuleNotFoundError: No module named 'llm_core'`, выполните `uv sync` ещё раз из корня репозитория.

**`@learn-ai/llm-core` не найден в TS**
Выполните `pnpm build:core`, чтобы собрать TypeScript-пакет перед импортом.
# llm_core (Python)

Агностичный к провайдеру LLM-клиент, который используется во всех практических заданиях на Python в этом курсе. Пишите код, опираясь на один небольшой интерфейс, а затем меняйте базовую модель — **OpenAI, Anthropic (Claude), Ollama, LM Studio или NVIDIA NIM** — простой сменой одной переменной окружения.

> Само существование этого модуля — тоже часть урока (модули 00–02): HTTP API OpenAI стал фактическим стандартом, поэтому один класс покрывает OpenAI, Ollama, NVIDIA и LM Studio; только Anthropic предоставляет собственный API и требует отдельного адаптера.

# # Установка

Автоматически устанавливается в editable-режиме в окружение uv репозитория:```bash
uv sync                       # from the repo root
```## Использование```python
from llm_core import get_provider, ChatMessage, ChatOptions

llm = get_provider()                       # reads LLM_PROVIDER from .env (default: ollama)
result = llm.chat([
    ChatMessage("system", "You are concise."),
    ChatMessage("user", "What is a vector embedding?"),
])
print(result.model, result.usage, result.text)

# messages can also be plain dicts:
llm.chat([{"role": "user", "content": "hi"}], ChatOptions(temperature=0.2))

# Streaming
for delta in llm.chat_stream([ChatMessage("user", "Tell a joke")]):
    print(delta, end="", flush=True)

# Embeddings (not available on Anthropic — raises NotImplementedError)
vecs = get_provider("ollama").embed(["hello", "world"]).vectors
```Использовать конкретного провайдера: `get_provider("anthropic")`.

# # Интерфейс```python
class LLMProvider(Protocol):
    name: str
    chat_model: str
    embed_model: str
    def chat(self, messages, options: ChatOptions | None = None) -> ChatResult: ...
    def chat_stream(self, messages, options=None) -> Iterator[str]: ...
    def embed(self, input: list[str]) -> EmbeddingResult: ...
````messages` принимает объекты `ChatMessage(role, content)` или словари вида `{"role", "content"}`. `ChatOptions(temperature=None, max_tokens=None, stop=None, model=None)`. У `ChatResult` есть `.text`, `.model`, `.usage` (`.input_tokens` / `.output_tokens`) и `.raw` (нетронутый ответ провайдера, чтобы изучить реальную структуру).

# # Провайдеры и переменные окружения

| Provider   | `LLM_PROVIDER` | Ключ                 | Примечания                                                                       |
| ---------- | -------------- | ------------------- | -------------------------------------------------------------------------------- |
| Ollama     | `ollama`       | не требуется        | локальный, бесплатный; используется по умолчанию. `OLLAMA_CHAT_MODEL`, `OLLAMA_EMBED_MODEL` |
| OpenAI     | `openai`       | `OPENAI_API_KEY`    | `OPENAI_CHAT_MODEL`, `OPENAI_EMBED_MODEL`                                        |
| Anthropic  | `anthropic`    | `ANTHROPIC_API_KEY` | `ANTHROPIC_MODEL`; **без embeddings**                                            |
| NVIDIA NIM | `nvidia`       | `NVIDIA_API_KEY`    | совместим с OpenAI; переменные модели `NVIDIA_*`                                 |
| LM Studio  | `lmstudio`     | не требуется        | локальный, совместим с OpenAI (по умолчанию `http://localhost:1234/v1`); переменные `LMSTUDIO_*` |

Полный список см. в [`.env.example`](../../../.env.example).

# # Заметки по дизайну / ограничения

- Интерфейс **намеренно минимален**. Продвинутые функции (tool calling, структурированный вывод, мультимодальность, кэширование промптов) рассматриваются для каждого провайдера в модулях напрямую через базовые SDK — не скрыты за «текучей» абстракцией. Именно так следует понимать указание в упражнении «выйти за пределы абстракции».
- Вызов `embed()` у провайдера Anthropic намеренно вызывает ошибку (у Claude нет endpoint для embeddings) — используйте `openai`/`ollama`/`nvidia` для задач с embeddings.

Версия на TypeScript находится в [`packages/ts/llm-core`](../../ts/llm-core/).
# @learn-ai/llm-core

Независимый от провайдера LLM-клиент, который используется во всех упражнениях на TypeScript в этом курсе. Пишите код, опираясь на один компактный интерфейс, а затем меняйте базовую модель — **OpenAI, Anthropic (Claude), Ollama, LM Studio или NVIDIA NIM** — изменением всего одной переменной окружения.

> Само существование этого пакета — часть урока (модули 00–02): HTTP API OpenAI стал де-факто стандартом, поэтому один класс покрывает OpenAI, Ollama, NVIDIA и LM Studio; только Anthropic предоставляет отличный API и имеет собственный адаптер.

# # Установка / сборка

Это пакет workspace — уже подключен. Из корня репозитория:```bash
pnpm install
pnpm build:core      # compiles src → dist (run once, or `pnpm --filter @learn-ai/llm-core dev` to watch)
```## Использование```ts
import { getProvider } from "@learn-ai/llm-core";

const llm = getProvider(); // reads LLM_PROVIDER from .env (default: ollama)
const { text, model, usage } = await llm.chat([
  { role: "system", content: "You are concise." },
  { role: "user", content: "What is a vector embedding?" },
]);
console.log(model, usage, text);

// Streaming
for await (const delta of llm.chatStream([{ role: "user", content: "Tell a joke" }])) {
  process.stdout.write(delta);
}

// Embeddings (not available on Anthropic — throws with a helpful message)
const { vectors } = await getProvider("ollama").embed(["hello", "world"]);
```Принудительное использование конкретного провайдера: `getProvider("anthropic")`.

# # The interface```ts
interface LLMProvider {
  name: string;
  chatModel: string;
  embedModel: string;
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResult>;
  chatStream(messages: ChatMessage[], options?: ChatOptions): AsyncIterable<string>;
  embed(input: string[]): Promise<EmbeddingResult>;
}
````ChatMessage` = `{ role: "system" | "user" | "assistant"; content: string }`.
`ChatOptions` = `{ temperature?, maxTokens?, stop?, model? }`.
`ChatResult` = `{ text, model, usage?, raw? }` (`raw` — нетронутый ответ провайдера,
на случай, если нужно посмотреть реальную структуру).

# # Провайдеры и переменные окружения

| Provider   | `LLM_PROVIDER` | Key                 | Notes                                                                            |
| ---------- | -------------- | ------------------- | -------------------------------------------------------------------------------- |
| Ollama     | `ollama`       | none                | локальный, бесплатный; используется по умолчанию. `OLLAMA_CHAT_MODEL`, `OLLAMA_EMBED_MODEL`                  |
| OpenAI     | `openai`       | `OPENAI_API_KEY`    | `OPENAI_CHAT_MODEL`, `OPENAI_EMBED_MODEL`                                        |
| Anthropic  | `anthropic`    | `ANTHROPIC_API_KEY` | `ANTHROPIC_MODEL`; **без embeddings**                                             |
| NVIDIA NIM | `nvidia`       | `NVIDIA_API_KEY`    | совместим с OpenAI; переменные модели `NVIDIA_*`                                         |
| LM Studio  | `lmstudio`     | none                | локальный, совместим с OpenAI (по умолчанию `http://localhost:1234/v1`); переменные `LMSTUDIO_*` vars |

Полный список см. в [`.env.example`](../../../.env.example).

# # Примечания к дизайну / ограничения

- Интерфейс **намерно минималистичный**. Продвинутые функции (tool calling,
  структурированный вывод, мультимодальность, кэширование промптов) рассматриваются
  для каждого провайдера в модулях с прямым использованием соответствующих SDK —
  они не скрыты за протекающей абстракцией. Поэтому, когда в упражнении сказано
  «выйти за рамки абстракции», это именно тот случай.
- `embed()` у провайдера Anthropic выбрасывает ошибку намеренно (у Claude нет
  endpoint для embeddings) — для работы с embeddings используйте `openai`/`ollama`/`nvidia`.

Python-аналог находится в [`packages/py/llm_core`](../../py/llm_core/).
/**
 * Задание 5 — Tool / function calling 🟢
 *
 * Чему учит:
 *   - В llm_core только chat/stream/embed. Tool calling требует более богатых
 *     запросов (определения tools, tool_choice и т.д.) — это «сырые» SDK провайдеров.
 *     Здесь вы выходите ЗА пределы абстракции — и понимаете, зачем она тонкая.
 *   - Ручной цикл инструментов:
 *       1. Отправить messages + описания tools.
 *       2. Модель отвечает tool_call (имя + JSON аргументов).
 *       3. Вы выполняете tool локально.
 *       4. Добавляете сообщение с результатом tool и снова вызываете модель.
 *       5. Модель даёт финальный текстовый ответ.
 *   - OpenAI-стиль (SDK openai) так же работает для ollama, lmstudio, nvidia —
 *     тот же формат API.
 *   - У Anthropic другой wire format, та же логика цикла.
 *
 * Запуск:
 *   pnpm tsx modules/02-llm-integration/ts/05-tool-calling.ts
 *
 * Нужен env (один из вариантов):
 *   LLM_PROVIDER=openai    + OPENAI_API_KEY
 *   LLM_PROVIDER=ollama    (локально; модель с tools, напр. llama3.2)
 *   LLM_PROVIDER=lmstudio  (локально; tool-модель + Start Server на :1234)
 *   LLM_PROVIDER=anthropic + ANTHROPIC_API_KEY  (часть B)
 *
 * Локальный tool calling (Ollama / LM Studio):
 *   Часть A — сырой OpenAI wire format; оба сервера совместимы — меняются только env:
 *     LM Studio:  LLM_PROVIDER=lmstudio  [LMSTUDIO_BASE_URL=http://localhost:1234/v1]
 *                 [LMSTUDIO_CHAT_MODEL=qwen2.5-7b-instruct]
 *     Ollama:     LLM_PROVIDER=ollama    [OLLAMA_CHAT_MODEL=llama3.2]
 *   Важно: tool calling зависит от *модели*, не от сервера. Нужна instruct-модель
 *   с tools (Qwen2.5-Instruct, Llama-3.1/3.2-Instruct, Mistral-Nemo). Маленькие/
 *   сильно квантованные модели часто пропускают вызов или ломают JSON аргументов —
 *   смотрите на `message.tool_calls?.length`, а не только на finish_reason.
 */

import "dotenv/config";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

// ---------------------------------------------------------------------------
// Фиктивный tool: get_weather
// В проде здесь был бы запрос к weather API. Здесь — заглушка без внешнего ключа.
// ---------------------------------------------------------------------------
function getWeather(
  location: string,
  unit: "celsius" | "fahrenheit" = "celsius",
): string {
  // TODO: сделайте ответ чуть разнообразнее — разные города → разные данные,
  //       чтобы модель видела разный результат для London и Tokyo.
  const fakeData: Record<string, { temp: number; condition: string }> = {
    london: { temp: 15, condition: "cloudy" },
    tokyo: { temp: 22, condition: "sunny" },
    new_york: { temp: 18, condition: "partly cloudy" },
  };
  const key = location.toLowerCase().replace(/\s+/g, "_");
  const weather = fakeData[key] ?? { temp: 20, condition: "unknown" };
  const temp = unit === "fahrenheit" ? (weather.temp * 9) / 5 + 32 : weather.temp;
  return JSON.stringify({
    location,
    temperature: temp,
    unit,
    condition: weather.condition,
  });
}

// ---------------------------------------------------------------------------
// ЧАСТЬ A: tool calling в стиле OpenAI
// Работает для OpenAI, Ollama (если модель поддерживает tools), NVIDIA, LM Studio.
// ---------------------------------------------------------------------------

// TODO 1: Опишите tool в формате OpenAI.
//         Нужно: type "function", function.name, function.description,
//         function.parameters (JSON Schema с required).
const weatherToolDefinition: OpenAI.Chat.Completions.ChatCompletionTool = {
  type: "function",
  function: {
    name: "get_weather",
    description: "TODO: описание, когда модели вызывать этот tool",
    parameters: {
      // TODO: JSON Schema параметров
      // Подсказка: properties { location: { type: "string" }, unit: { type: "string", enum: [...] } }
      type: "object",
      properties: {},
      required: [],
    },
  },
};

async function runOpenAIToolLoop(question: string): Promise<void> {
  console.log("=== Part A: OpenAI-style tool calling ===\n");

  // LLM_PROVIDER — единый выбор baseURL, ключа и модели (как в llm-core).
  // Часть A намеренно на сыром OpenAI SDK — конфиг собираем вручную.
  const provider = process.env.LLM_PROVIDER ?? "ollama";
  const PROVIDER_CONFIG: Record<
    string,
    { apiKey: string; baseURL?: string; model: string }
  > = {
    openai: {
      apiKey: process.env.OPENAI_API_KEY ?? "",
      model: process.env.OPENAI_CHAT_MODEL ?? "gpt-4o-mini",
    },
    ollama: {
      apiKey: "ollama", // любая непустая строка; локальный сервер не проверяет
      baseURL: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434/v1",
      model: process.env.OLLAMA_CHAT_MODEL ?? "llama3.2",
    },
    lmstudio: {
      apiKey: "lm-studio",
      baseURL: process.env.LMSTUDIO_BASE_URL ?? "http://localhost:1234/v1",
      model: process.env.LMSTUDIO_CHAT_MODEL ?? "qwen2.5-7b-instruct",
    },
    nvidia: {
      apiKey: process.env.NVIDIA_API_KEY ?? "",
      baseURL: process.env.NVIDIA_BASE_URL ?? "https://integrate.api.nvidia.com/v1",
      model: process.env.NVIDIA_CHAT_MODEL ?? "meta/llama-3.1-8b-instruct",
    },
  };
  const config = PROVIDER_CONFIG[provider];
  if (!config) {
    throw new Error(
      `Part A (OpenAI-style) supports: ${Object.keys(PROVIDER_CONFIG).join(", ")}. ` +
        `Got LLM_PROVIDER="${provider}". For anthropic, see Part B.`,
    );
  }
  const client = new OpenAI({ apiKey: config.apiKey, baseURL: config.baseURL });
  const model = config.model;
  console.log(`Provider: ${provider} / ${model}`);

  console.log(`Question: ${question}\n`);

  // -------------------------------------------------------------------------
  // TODO 2: Первый запрос. Массив `messages` (тип
  //         OpenAI.Chat.Completions.ChatCompletionMessageParam[]) с вопросом user,
  //         затем client.chat.completions.create({ ... }) с `model`, `messages`,
  //         `tools: [weatherToolDefinition]`, tool_choice: "auto".
  //         Ответ: response.choices[0].message и finish_reason.
  // -------------------------------------------------------------------------

  // -------------------------------------------------------------------------
  // TODO 3: Если finish_reason — tool call ("tool_calls"):
  //         a) Добавить assistant message в `messages` как есть (там tool_calls).
  //         b) Для каждого message.tool_calls: JSON.parse(function.arguments),
  //            вызвать getWeather(), добавить { role: "tool", tool_call_id, content }
  //            (tool_call_id = id вызова, чтобы модель связала пару).
  //         c) Второй вызов API с расширенным `messages`.
  //         d) Вывести final message.content.
  //         (В проде цикл до тех пор, пока не кончатся tool calls; здесь хватит
  //         одного круга или двух вызовов tool для London + Tokyo.)
  // -------------------------------------------------------------------------

  console.log("TODO: реализуйте цикл tool выше.");
}

// ---------------------------------------------------------------------------
// ЧАСТЬ B: tool calling в стиле Anthropic
// Другой wire format, та же идея цикла.
// ---------------------------------------------------------------------------

async function runAnthropicToolLoop(question: string): Promise<void> {
  console.log("\n=== Part B: Anthropic-style tool calling ===\n");

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
  const model = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5";

  console.log(`Question: ${question}\n`);

  // -------------------------------------------------------------------------
  // TODO 4: Tool Anthropic (тип Anthropic.Tool). Те же смыслы, что в OpenAI,
  //         но поля плоские: `name`, `description`, `input_schema` (JSON Schema) —
  //         без обёртки "function", ключ схемы — input_schema, не parameters.
  // -------------------------------------------------------------------------

  // -------------------------------------------------------------------------
  // TODO 5: Первый запрос.
  //         client.messages.create({ model, max_tokens, tools: [tool], messages })
  //         Проверить response.stop_reason === "tool_use".
  // -------------------------------------------------------------------------

  // -------------------------------------------------------------------------
  // TODO 6: Для каждого блока content с type "tool_use":
  //         - выполнить tool;
  //         - добавить ответ assistant (как есть) в messages;
  //         - добавить user message с content = [{ type: "tool_result", tool_use_id, content }];
  //         - снова вызвать API и вывести финальный текст.
  //         У Anthropic чередуются user/assistant; результаты tool — ВНУТРИ user,
  //         не отдельная роль "tool" на верхнем уровне.
  // -------------------------------------------------------------------------

  console.log("TODO: реализуйте цикл Anthropic tool выше.");
  console.log("(Пропустите часть B, если нет ANTHROPIC_API_KEY)");
}

async function main() {
  const question = "What's the weather like in London and Tokyo right now?";

  // OpenAI-совместимый путь (также ollama / lmstudio / nvidia)
  await runOpenAIToolLoop(question);

  // Anthropic (нужен ANTHROPIC_API_KEY)
  if (process.env.ANTHROPIC_API_KEY) {
    await runAnthropicToolLoop(question);
  } else {
    console.log("\nSkipping Part B (no ANTHROPIC_API_KEY set).");
  }
}

main().catch(console.error);

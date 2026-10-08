/**
 * Задание 3 — Токены и стоимость 🟡
 *
 * Чему учит:
 *   - LLM видят не слова, а токены (субсловные куски). Зная число токенов,
 *     вы укладываетесь в контекстное окно и прогнозируете расход на API.
 *   - Контекстное окно = макс. (вход + выход) токенов за один запрос.
 *     Превышение → обрезка или ошибка; управлять этим — ваша задача.
 *   - Стоимость = (input_tokens × price_in) + (output_tokens × price_out).
 *     Цены у моделей сильно различаются — здесь это на конкретных цифрах.
 *
 * Зависимости (уже в package.json):
 *   @dqbd/tiktoken — WASM-порт tiktoken от OpenAI, работает в Node.
 *
 * Запуск:
 *   pnpm tsx modules/02-llm-integration/ts/03-tokens-cost.ts
 */

import { getProvider } from "@learn-ai/llm-core";
// TODO: раскомментируйте, когда разберётесь, что делают эти импорты
import { get_encoding } from "@dqbd/tiktoken";

// ---------------------------------------------------------------------------
// Таблица цен — $ за 1 000 000 токенов (середина 2025; сверяйте актуальные цены).
// Добавляйте или обновляйте строки по мере знакомства с новыми моделями.
// ---------------------------------------------------------------------------
const PRICE_TABLE: Record<
  string,
  { inputPer1M: number; outputPer1M: number; contextK: number }
> = {
  "gpt-4o-mini": { inputPer1M: 0.15, outputPer1M: 0.6, contextK: 128 },
  "gpt-4o": { inputPer1M: 5.0, outputPer1M: 15.0, contextK: 128 },
  "claude-haiku-4-5": { inputPer1M: 0.8, outputPer1M: 4.0, contextK: 200 },
  "claude-opus-4-8": { inputPer1M: 15.0, outputPer1M: 75.0, contextK: 200 },
  "llama3.2": { inputPer1M: 0.0, outputPer1M: 0.0, contextK: 128 },
};

const SAMPLE_TEXT = `
Retrieval-Augmented Generation (RAG) is a technique that improves large language
model outputs by retrieving relevant documents from an external knowledge base before
generating a response. Unlike pure parametric models that rely solely on weights
learned during training, RAG systems can incorporate up-to-date or domain-specific
information at inference time. This makes them particularly useful for question
answering, enterprise search, and chatbots that need factual grounding. Retrieval-Augmented Generation (RAG) is a technique that improves large language
model outputs by retrieving relevant documents from an external knowledge base before
generating a response. Unlike pure parametric models that rely solely on weights
learned during training, RAG systems can incorporate up-to-date or domain-specific
information at inference time. This makes them particularly useful for question
answering, enterprise search, and chatbots that need factual grounding.
`.trim();

// ---------------------------------------------------------------------------
// TODO 1: Реализуйте countTokens через tiktoken.
//         `get_encoding("cl100k_base")` возвращает энкодер. Вызовите `.encode(text)`
//         — получите Uint32Array id токенов; `.length` — число токенов.
//         Не забудьте `.free()` у энкодера, иначе утечка WASM-памяти.
// ---------------------------------------------------------------------------
function countTokens(text: string): number {
  // Замените fallback ниже: энкодер "cl100k_base" через get_encoding(),
  // encode текста, `.length` массива id как счётчик, перед return — `.free()`
  // (WASM сам по себе не собирается GC).
  const encoder = get_encoding("cl100k_base");
  const tokens = encoder.encode(text);
  encoder.free();
  return tokens.length;
  // Грубый fallback, пока не реализуете выше:
  // return Math.ceil(text.split(/\s+/).length * 1.3);
}

// ---------------------------------------------------------------------------
// TODO 2: Реализуйте estimateCost.
//         Найдите модель в PRICE_TABLE. Если нет — верните null.
//         Формула:  (inputTokens / 1_000_000) * inputPer1M
//                 + (outputTokens / 1_000_000) * outputPer1M
// ---------------------------------------------------------------------------
function estimateCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
): { cost: number; contextK: number } | null {
  // TODO: реализуйте
  const modelInfo = PRICE_TABLE[model];
  if (!modelInfo) {
    return null;
  }
  const cost =
    (inputTokens / 1_000_000) * modelInfo.inputPer1M +
    (outputTokens / 1_000_000) * modelInfo.outputPer1M;
  return { cost, contextK: modelInfo.contextK };
}

const TURN_INPUT_TOKENS = 500;
const TURN_OUTPUT_TOKENS = 200;

/** Сколько «ходов» (фикс. input/output на ход) влезает в бюджет $ для модели. */
function affordableTurns(
  budgetUsd: number,
  model: string,
  inputPerTurn = TURN_INPUT_TOKENS,
  outputPerTurn = TURN_OUTPUT_TOKENS,
): number | null {
  const perTurn = estimateCost(model, inputPerTurn, outputPerTurn);
  if (!perTurn) return null;
  if (perTurn.cost <= 0) return Infinity;
  return Math.floor(budgetUsd / perTurn.cost);
}

async function main() {
  const llm = getProvider();
  console.log(`Provider: ${llm.name} / ${llm.chatModel}\n`);

  // ---------------------------------------------------------------------------
  // TODO 3: Посчитайте токены в SAMPLE_TEXT и выведите вместе с числом
  //         символов. Токенов обычно меньше, чем символов, но больше, чем слов —
  //         токены это субсловные единицы.
  // ---------------------------------------------------------------------------
  const tokenCount = countTokens(SAMPLE_TEXT);
  console.log("--- token counting ---");
  console.log(`Characters : ${SAMPLE_TEXT.length}`);
  console.log(`Words      : ${SAMPLE_TEXT.split(/\s+/).length}`);
  console.log(`Tokens     : ${tokenCount} (TODO: подключите tiktoken)`);

  // ---------------------------------------------------------------------------
  // TODO 4: Сделайте реальный вызов API и возьмите точные счётчики из поля
  //         `usage` в ChatResult. Сравните с оценкой tiktoken — насколько близко?
  // ---------------------------------------------------------------------------
  console.log("\n--- real API call ---");
  const prompt = "Summarise this in one sentence: " + SAMPLE_TEXT;
  const resp = await llm.chat([{ role: "user", content: prompt }]);
  console.log(`Tokens output: ${resp.usage?.outputTokens}`);
  console.log(`Tokens input: ${resp.usage?.inputTokens}`);
  //         Отправьте `prompt` одним user-сообщением через llm.chat(). Счётчики
  //         с `result.usage` (inputTokens / outputTokens — у части провайдеров
  //         может быть undefined) и сравните с countTokens(prompt).
  console.log("TODO: выполните реальный вызов API выше.");

  // ---------------------------------------------------------------------------
  // TODO 5: Оцените стоимость для нескольких моделей и выведите таблицу.
  //         Формат: model | input tok | output tok | cost ($)
  // ---------------------------------------------------------------------------
  console.log("\n--- cost comparison ---");
  const exampleInput = resp.usage?.inputTokens ?? 0;
  const exampleOutput = resp.usage?.outputTokens ?? 0;
  console.log(
    `Assuming ${exampleInput} input tokens, ${exampleOutput} output tokens:\n`,
  );
  console.log("Model".padEnd(24) + "Context".padEnd(12) + "Est. cost");
  console.log("-".repeat(50));
  for (const [model, info] of Object.entries(PRICE_TABLE)) {
    const cost = estimateCost(model, exampleInput, exampleOutput);
    const costStr = cost ? `$${cost.cost.toFixed(6)}` : "TODO";
    const ctxStr = `${info.contextK}K`;
    console.log(model.padEnd(24) + ctxStr.padEnd(12) + costStr);
  }

  // ---------------------------------------------------------------------------
  // TODO 6 (по желанию): Функция: заданный бюджет в долларах и модель → сколько
  //         «ходов» (средние 500 input + 200 output токенов на ход) вы можете
  //         оплатить. Выведите результат для каждой модели из таблицы.
  // ---------------------------------------------------------------------------
  const budgetUsd = 10;
  console.log("\n--- budget → turns ---");
  console.log(
    `Budget $${budgetUsd}; per turn: ${TURN_INPUT_TOKENS} input + ${TURN_OUTPUT_TOKENS} output tokens\n`,
  );
  console.log("Model".padEnd(24) + "Cost/turn".padEnd(14) + "Affordable turns");
  console.log("-".repeat(52));
  for (const model of Object.keys(PRICE_TABLE)) {
    const perTurn = estimateCost(model, TURN_INPUT_TOKENS, TURN_OUTPUT_TOKENS);
    const turns = affordableTurns(budgetUsd, model);
    const costStr =
      perTurn && perTurn.cost > 0
        ? `$${perTurn.cost.toFixed(6)}`
        : perTurn
          ? "$0"
          : "n/a";
    const turnsStr =
      turns === null
        ? "n/a"
        : turns === Infinity
          ? "unlimited (local/free)"
          : String(turns);
    console.log(model.padEnd(24) + costStr.padEnd(14) + turnsStr);
  }
}

main().catch(console.error);

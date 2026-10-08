/**
 * Задание 2 — Потоковая передача 🟢
 *
 * Чему учит:
 *   - Стриминг отдаёт токены по мере генерации — интерфейс отзывчивее даже
 *     при длинном ответе. Провайдер шлёт Server-Sent Events (SSE); SDK
 *     превращает их в async-итератор, который вы обходите через `for await`.
 *   - Time-to-first-token (TTFT) — задержка, которую пользователь *чувствует*.
 *     Общее время генерации тоже важно, но TTFT обычно заметнее.
 *   - При стриминге ошибки иначе: ответ может оборваться на середине.
 *
 * Запуск:
 *   pnpm tsx modules/02-llm-integration/ts/02-streaming.ts
 */

import { getProvider } from "@learn-ai/llm-core";

const PROMPT =
  "Как работает внимание трансформера в точности 5 пунктов, каждый 1-2 предложения.";

async function main() {
  const llm = getProvider();
  console.log(`Provider: ${llm.name} / ${llm.chatModel}\n`);
  console.log(`Prompt: ${PROMPT}\n`);
  console.log("--- streaming response ---");

  // ---------------------------------------------------------------------------
  // TODO 1: Зафиксируйте время до первого вызова, чтобы посчитать TTFT и
  //         общее время. Используйте `performance.now()`.
  // ---------------------------------------------------------------------------
  const startTime = performance.now(); // TODO: замените на performance.now()

  let firstTokenTime: number | null = null;
  let fullText = "";
  const stream = llm.chatStream([{ role: "user", content: PROMPT }]);
  for await (const chunk of stream) {
    if (firstTokenTime === null) {
      firstTokenTime = performance.now();
    }
    process.stdout.write(chunk);
    fullText += chunk;
  }

  // ---------------------------------------------------------------------------
  // TODO 2: Вызовите llm.chatStream() с одним user-сообщением (PROMPT).
  //         Обойдите async-итератор. Для каждого чанка:
  //           a) Если это первый чанк — запишите `firstTokenTime`.
  //           b) Пишите чанк в stdout БЕЗ перевода строки, чтобы токены шли
  //              в одну строку: process.stdout.write(chunk)
  //           c) Добавляйте чанк в `fullText`.
  //         `firstTokenTime` изначально null; задайте его один раз — на первом чанке.
  // ---------------------------------------------------------------------------

  console.log("\nTODO: реализуйте стриминг выше.");

  console.log(`First token time: ${firstTokenTime ?? 0 - startTime}ms`);
  console.log(`Total time: ${performance.now() - startTime}ms`);
  console.log(`Tokens: ${fullText.split(" ").length}`);
  console.log(
    `Tokens per second: ${(fullText.split(" ").length / (performance.now() - startTime)) * 1000}`,
  );

  // ---------------------------------------------------------------------------
  // TODO 3: После цикла выведите статистику:
  //   - Время до первого токена  = firstTokenTime - startTime  (мс)
  //   - Общее время              = performance.now() - startTime  (мс)
  //   - Токенов в ответе         = грубо: fullText.split(" ").length
  //   - Токенов в секунду        = tokens / (totalTime / 1000)
  //         Учтите случай, когда чанков не было (firstTokenTime всё ещё null).
  //         Для конца снова `performance.now()`.
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // TODO 4 (по желанию): Тот же PROMPT через llm.chat() (без стриминга) и
  //         сравните время. В сумме оно похоже, но без стриминга ничего не
  //         видно, пока ответ не соберётся целиком.
  // ---------------------------------------------------------------------------

  console.log("--- chat response ---");
  const chatStartTime = performance.now();
  const resp = await llm.chat([{ role: "user", content: PROMPT }]);
  console.log(`Chat time: ${performance.now() - chatStartTime}ms`);
  console.log(`Tokens: ${resp.text.split(" ").length}`);
  console.log(`Tokens output: ${resp.usage?.outputTokens}`);
  console.log(
    `Tokens per second: ${(resp.text.split(" ").length / (performance.now() - chatStartTime)) * 1000}`,
  );
}

main().catch(console.error);

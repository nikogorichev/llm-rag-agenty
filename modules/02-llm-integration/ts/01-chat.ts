/**
 * Задание 1 — Чат и системные промпты 🟢
 *
 * Чему учит:
 *   - Как работает многоходовый чат: у модели нет памяти — на каждый запрос
 *     вы отправляете всю историю диалога.
 *   - Как роль "system" задаёт поведение, не показываясь пользователю.
 *   - Почему важен порядок сообщений (system → user → assistant → user …).
 *
 * Запуск:
 *   pnpm tsx modules/02-llm-integration/ts/01-chat.ts
 */

import { getProvider, ChatMessage } from "@learn-ai/llm-core";
import * as readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

// ---------------------------------------------------------------------------
// TODO 1: Задайте системный промпт — персона или рамки ответов ассистента.
//         Коротко (1–3 предложения). Пример: «Ты лаконичный помощник-репетитор
//         по программированию. Объясняй просто. Если уместно — покажи фрагмент кода.»
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT =
  "Ты помошник, который отвечает на вопросы пользователя в стиле гопника";

async function main() {
  const llm = getProvider();
  console.log(`Using provider: ${llm.name} / model: ${llm.chatModel}\n`);

  // ---------------------------------------------------------------------------
  // TODO 2: Инициализируйте историю диалога.
  //         Она начинается с системного сообщения и растёт по ходу реплик
  //         пользователя и ассистента. Соберите массив ChatMessage.
  //         Подсказка: у системного сообщения role — "system".
  // ---------------------------------------------------------------------------
  //         Заполните массив одним сообщением с role "system" и SYSTEM_PROMPT.
  const history: ChatMessage[] = [{ role: "system", content: SYSTEM_PROMPT }];

  const rl = readline.createInterface({ input, output });
  console.log('Multi-turn chat started. Type "exit" to quit.\n');

  while (true) {
    const userInput = await rl.question("You: ");
    if (userInput.trim().toLowerCase() === "exit") break;
    if (!userInput.trim()) continue;
    history.push({ role: "user", content: userInput });
    const resp = await llm.chat(history);
    history.push({ role: "assistant", content: resp.text });
    console.log(`Assistant: ${resp.text}`);

    // -------------------------------------------------------------------------
    // TODO 3: Один ход диалога:
    //         - Добавьте реплику пользователя в `history` (role: "user").
    //         - Вызовите `llm.chat(history)` со ВСЕЙ историей (у модели нет своей
    //           памяти — история и есть память).
    //         - Добавьте ответ в `history` (role: "assistant"), чтобы следующий
    //           ход его видел.
    //         - Выведите ответ с префиксом "Assistant: ".
    // -------------------------------------------------------------------------

    // console.log("TODO: реализуйте цикл чата выше.\n");
    // break; // уберите эту строку, когда реализуете цикл
  }

  rl.close();

  console.log(history);
  // ---------------------------------------------------------------------------
  // TODO 4 (по желанию): В конце выведите полную историю — то, что ушло в модель
  //         на последнем запросе. Заметьте, как она растёт с каждым ходом —
  //         это заполнение «контекстного окна». Что будет, если диалог станет
  //         длиннее лимита?
  // ---------------------------------------------------------------------------
}

main().catch(console.error);

/**
 * Задание 4 — Структурированный вывод 🟢
 *
 * Чему учит:
 *   - LLM отдают текст. Чтобы получить структуру (JSON, типизированные объекты),
 *     нужен JSON mode, декодирование по схеме или промпт + парсер — и валидация,
 *     чтобы отловить «придуманные» поля.
 *   - Zod: схема + parse/validate в одном шаге. Если JSON модели не совпал —
 *     понятная ошибка и повтор.
 *   - Зачем схема: без неё это `JSON.parse` и надежда. Типобезопасный разбор
 *     ловит ошибки на границе между моделью и вашим кодом.
 *
 * Zod уже в зависимостях package.json этого модуля.
 *
 * Запуск:
 *   pnpm tsx modules/02-llm-integration/ts/04-structured-output.ts
 */

import { ChatMessage, getProvider } from "@learn-ai/llm-core";
import zodToJsonSchema from "openai/src/_vendor/zod-to-json-schema/index.js";
import { z } from "zod";

// ---------------------------------------------------------------------------
// TODO 1: Опишите схему Zod для извлекаемых данных.
//         Начните с Recipe ниже, потом попробуйте свою.
// ---------------------------------------------------------------------------
const RecipeSchema = z.object({
  name: z.string().describe("Name of the dish"),
  ingredients: z
    .array(
      z.object({
        item: z.string(),
        amount: z.string(),
      }),
    )
    .describe("List of ingredients with amounts"),
  steps: z.array(z.string()).describe("Ordered cooking steps"),
  prepTimeMinutes: z.number().int().positive().describe("Prep time in minutes"),
  servings: z.number().int().positive(),
});

type Recipe = z.infer<typeof RecipeSchema>;

// ---------------------------------------------------------------------------
// TODO 2: Соберите промпт: модель должна ответить JSON по схеме выше.
//         Вставить схему (или её описание) в промпт — самый переносимый путь.
//         Подсказка: JSON.stringify(zodToJsonSchema(...)) или перечислить поля
//         в system-сообщении вручную.
// ---------------------------------------------------------------------------
function buildPrompt(request: string): string {
  // System-сообщение с требуемым форматом ответа.
  return `You are a recipe assistant. When asked for a recipe, respond ONLY with
valid JSON matching this exact structure — no markdown, no prose, just JSON:
{
  "name": "string",
  "ingredients": [{"item": "string", "amount": "string"}],
  "steps": ["string"],
  "prepTimeMinutes": number,
  "servings": number
}


User request: ${request}`;
}

// ${JSON.stringify(zodToJsonSchema(RecipeSchema))}

// ---------------------------------------------------------------------------
// TODO 3: Реализуйте parseRecipe.
//         a) Модель часто оборачивает JSON в ```json ... ``` или добавляет текст —
//            сначала снимите ограждения с `rawText` (подойдёт regex replace).
//         b) JSON.parse очищенной строки в try/catch.
//         c) Передайте объект в RecipeSchema.parse() — Zod проверит форму
//            и вернёт типизированный Recipe.
//         d) Верните объект; при ошибке parse или валидации — throw с понятным Error.
// ---------------------------------------------------------------------------
function parseRecipe(rawText: string): Recipe {
  // TODO: реализуйте
  // throw new Error("parseRecipe ещё не реализован");
  const json = rawText.replace(/```json\s*(.*?)\s*```/s, "$1").trim();
  try {
    return RecipeSchema.parse(JSON.parse(json));
  } catch (error) {
    throw new Error(
      `Failed to parse recipe: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}

async function main() {
  const llm = getProvider();
  console.log(`Provider: ${llm.name} / ${llm.chatModel}\n`);

  const request = "a simple pasta carbonara for 2 people";
  console.log(`Requesting recipe for: "${request}"\n`);

  const messages: ChatMessage[] = [{ role: "user", content: buildPrompt(request) }];
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`--- attempt ${attempt}/${maxAttempts} ---`);
    const result = await llm.chat(messages, { temperature: 0.1 });
    try {
      const recipe = parseRecipe(result.text);
      console.log(`Recipe (attempt ${attempt}):\n${JSON.stringify(recipe, null, 2)}`);
      return;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn(`Parse failed: ${msg}`);
      console.warn(`Raw model output (first 500 chars):\n${result.text.slice(0, 500)}`);
      if (attempt === maxAttempts) throw error;
      messages.push({ role: "assistant", content: result.text });
      messages.push({
        role: "user",
        content: `JSON parse/validation failed: ${msg}. Reply with ONLY valid JSON matching the schema, no markdown.`,
      });
    }
  }

  // ---------------------------------------------------------------------------
  // TODO 5: Цикл повторов — если parseRecipe бросает ошибку, добавьте в историю
  //         сообщение об ошибке и попросите модель исправить вывод. До 3 попыток.
  //         Паттерн «repair on parse failure» — снова встретится в модуле 03.
  // ---------------------------------------------------------------------------

  // ---------------------------------------------------------------------------
  // TODO 6 (по желанию): Другая схема — извлечь структуру из текста. Вставьте
  //         фрагмент новости и извлеките:
  //         { headline, date, people: string[], summary }.
  //         Zod покажет, когда модель пропустила поле.
  // ---------------------------------------------------------------------------
}

main().catch(console.error);

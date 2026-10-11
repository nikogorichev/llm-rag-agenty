import "dotenv/config";
import { z } from "zod";
// import { zodToJsonSchema } from "zod-to-json-schema";
// import { ChatMessage, getProvider } from "@learn-ai/llm-core";
import { Agent, run, webSearchTool } from "@openai/agents";

enum AnimeStatus {
  ONGOING = "ongoing",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}
enum AnimeType {
  TV = "TV",
  MOVIE = "Movie",
  OVA = "OVA",
  ONA = "ONA",
  SPECIAL = "Special",
}

// export const Anime = z.object({
//   name: z.string().describe("Name of the anime"),
//   description: z.string().describe("Description of the anime"),
//   popularCharacters: z.array(z.string()).describe("Popular characters in the anime"),
//   rating: z.number().int().positive().describe("Rating of the anime"),
//   releaseDate: z.string().describe("Release date of the anime"),
//   genre: z.array(z.string()).describe("Genre of the anime"),
//   studio: z.string().describe("Studio of the anime"),
//   episodes: z.number().int().positive().describe("Number of episodes in the anime"),
//   duration: z.number().int().positive().describe("Duration of the anime"),
//   status: z.nativeEnum(AnimeStatus).describe("Status of the anime"),
//   type: z.nativeEnum(AnimeType).describe("Type of the anime"),
// });

// type Anime = z.infer<typeof Anime>;

// const buildPrompt = (title: string): string => {
//   return `
//   Ты помощник который помогает найти информацию об аниме.
//   ${JSON.stringify(zodToJsonSchema(Anime))}

//   Найди информацию об аниме с названием: ${title}
//   и верни её в следующем формате на русском языке:
//   ${JSON.stringify(zodToJsonSchema(Anime))}

//   Если аниме не найдено, верни null.
//   `;
// };

// const validateResponse = (response: string): Anime => {
//   const json = response.replace(/```json\s*(.*?)\s*```/s, "$1").trim();
//   try {
//     return Anime.parse(JSON.parse(json));
//   } catch (error) {
//     throw new Error(
//         `Failed to parse recipe: ${error instanceof Error ? error.message : String(error)}`,
//       );
//   }
// };

// async function getAnimeInfo(title: string) {
//     const llm = getProvider();
//     const messages: ChatMessage[] = [{ role: "user", content: buildPrompt(title) }];
//     const maxAttempts = 3;
//     for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//         console.log(`--- attempt ${attempt}/${maxAttempts} ---`);
//         const result = await llm.chat(messages, { temperature: 0.4 });
//         try {
//             const anime = validateResponse(result.text);
//             console.log(`Anime (attempt ${attempt}):\n${JSON.stringify(anime, null, 2)}`);
//             return;
//         } catch (error) {
//             const msg = error instanceof Error ? error.message : String(error);
//             console.warn(`Parse failed: ${msg}`);
//             console.warn(`Raw model output (first 500 chars):\n${result.text.slice(0, 500)}`);
//             if (attempt === maxAttempts) throw error;
//             messages.push({ role: "assistant", content: result.text });
//             messages.push({ role: "user", content: `JSON parse/validation failed: ${msg}. Reply with ONLY valid JSON matching the schema, no markdown.` });
//         }
//     }
// }

// getAnimeInfo("триган").catch(console.error);

const Anime = z.object({
  name: z.string(),
  description: z.string(),
  popularCharacters: z.array(z.string()),
  rating: z.number(),
  releaseDate: z.string(),
  genre: z.array(z.string()),
  studio: z.string(),
});

const agent = new Agent({
  name: "Anime assistant",
  instructions: "Ты помощник который помогает найти информацию об аниме.",
  model: "gpt-4o-mini",
  tools: [webSearchTool()],
  outputType: Anime,
});

const result = await run(agent, "дорохедоро");
console.log(result.finalOutput);

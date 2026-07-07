# Capstone — TypeScript starter

Эта папка предназначена для вашей работы. Здесь нет заготовки; приведённая ниже структура — это предложение для варианта A (ассистент для вопросно-ответной системы по документации). Адаптируйте её по своему усмотрению.

# # Рекомендуемая структура```
ts/
├── README.md            ← this file; update it as you build
├── package.json
├── tsconfig.json
├── src/
│   ├── ingest.ts        ← parse formats (11), clean (11), chunk + embed + index (04/11)
│   ├── retriever.ts     ← dense + BM25 hybrid retrieval (04), RRF, reranking (05)
│   ├── generator.ts     ← RAG generate: passages + question → answer + citations (05)
│   ├── agent.ts         ← agent loop wrapping retriever + generator + tools (06/17)
│   ├── tools.ts         ← tool definitions (search, calculator, SQL, etc.) (06/12)
│   ├── eval.ts          ← versioned eval harness: load QA pairs, run, LLM-judge score (07/21)
│   └── server.ts        ← Hono or Express: POST /ask/stream → SSE, POST /ask → JSON (07/22)
├── data/
│   └── corpus/          ← your source documents
├── eval_set.jsonl       ← {question, referenceAnswer} per line
└── tests/
    └── retriever.test.ts
```## Запуск примеров```bash
# ingest (parse → clean → chunk → embed → index)
pnpm tsx src/ingest.ts --corpus data/corpus/ --collection my_docs

# ask a question
pnpm tsx src/agent.ts --question "What does X say about Y?"

# eval harness
pnpm tsx src/eval.ts --evalSet eval_set.jsonl

# serve
pnpm tsx src/server.ts   # → http://localhost:3000/ask
```## Ключевые импорты```ts
import { getProvider } from "@learn-ai/llm-core";

const llm = getProvider();  // reads LLM_PROVIDER from .env — never hardcode a vendor
```## Зависимости, которые нужно добавить по мере необходимости```jsonc
// for vectors (add to package.json dependencies):
"chromadb": "^1.x",
"qdrant-js": "^1.x",

// for document ingestion:
"pdf-parse": "^1.x",
"cheerio": "^1.x",

// for the API server:
"hono": "^4.x",
// or:
"express": "^4.x",
"@types/express": "^4.x",

// for MCP tools (module 17):
"@modelcontextprotocol/sdk": "^1.x",

// for testing:
"vitest": "^2.x"
```Установите с помощью `pnpm install`.

# # С чего начать

1. Ещё раз перечитайте README в `modules/05-rag/`, `modules/06-agents/` и `modules/11-document-ingestion/`.
2. Выберите небольшой корпус документов (10–50) по интересующей вас теме — вы сразу заметите, если ответы будут неверными.
3. Сначала добейтесь работы `ingest.ts` и простого запроса через `retriever.ts`, прежде чем трогать генератор. Качество поиска — это база, на которой держится всё остальное.
4. Напишите 5 тестовых вопросов вручную, прежде чем писать код для оценок (eval). Они быстро выявляют проблемы с поиском.
5. После M3 добавьте защитные меры (module 20) и CI-ворота для оценки (module 21), прежде чем считать проект завершённым.
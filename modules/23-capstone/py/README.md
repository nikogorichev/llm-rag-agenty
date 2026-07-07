# Capstone — Python-шаблон

Эта папка предназначена для вашей работы. Здесь нет заготовки; структура ниже — это предложение для варианта A (помощник для вопросно-ответной системы по документации). Адаптируйте её по своему усмотрению.

# # Предлагаемая структура```
py/
├── README.md          ← this file; update it as you build
├── ingest.py          ← parse formats (11), clean (11), chunk + embed + index (04/11)
├── retriever.py       ← dense + BM25 hybrid retrieval (04), RRF fusion, reranking (05)
├── generator.py       ← RAG generate: passages + question → answer + citations (05)
├── agent.py           ← agent loop wrapping retriever + generator + tools (06/17)
├── tools.py           ← tool definitions (search, calculator, SQL, etc.) (06/12)
├── eval.py            ← versioned eval harness: load QA pairs, run, LLM-judge score (07/21)
├── server.py          ← FastAPI app: POST /ask/stream → SSE, POST /ask → JSON (07/22)
├── data/
│   └── corpus/        ← your source documents (PDF, Markdown, HTML, plain text)
├── eval_set.jsonl     ← {question, reference_answer} pairs for automated eval
└── tests/
    └── test_retriever.py
```## Запуск примеров```bash
# ingest your corpus (parse → clean → chunk → embed → index)
uv run python py/ingest.py --corpus py/data/corpus/ --collection my_docs

# ask a question interactively
uv run python py/agent.py --question "What does X say about Y?"

# run the eval harness
uv run python py/eval.py --eval-set py/eval_set.jsonl

# serve the API
uv run python py/server.py   # → http://localhost:8000/ask
```## Ключевые импорты```python
from llm_core import get_provider, ChatMessage

llm = get_provider()   # reads LLM_PROVIDER from .env — never hardcode a vendor
```Для работы с векторами: `uv sync --extra vectors` (добавляет chromadb, qdrant-client, rank-bm25).

Для загрузки документов: `uv add pypdf beautifulsoup4 httpx` (или `uv sync --extra ingestion`).

Для API: `uv sync --extra production` (добавляет fastapi, uvicorn).

# # С чего начать

1. Перечитайте README в модулях `modules/05-rag/`, `modules/06-agents/` и `modules/11-document-ingestion/`.
2. Подберите небольшой корпус документов (10–50 штук). Лучше всего использовать документы, которые вы действительно планируете запрашивать — так вы сразу заметите, если ответы будут неверными.
3. Сначала соберите M1 (ingestion + query) и убедитесь, что retrieval работает хорошо, прежде чем переходить к генератору. Плохой retrieval нельзя исправить более качественным prompt.
4. Напишите вручную 5 тестовых вопросов, прежде чем писать код для оценки — они сразу выявят проблемы с поиском.
5. После M3 добавьте усиление безопасности (module 20) и контроль оценки (module 21) перед тем, как считать проект завершённым.
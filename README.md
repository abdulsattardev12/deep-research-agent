# Deep Research Agent with OpenAI Agents SDK and Firecrawl

A research assistant that uses OpenAI's Agents SDK and Firecrawl for deep web research, with a FastAPI backend and a Next.js frontend.

## Features

- **Deep Web Research**: Searches the web, extracts content, and synthesizes findings via Firecrawl
- **Enhanced Analysis**: Elaboration agent adds context, examples, and practical implications
- **Modern Workspace UI**: Next.js frontend with live progress streaming and markdown reports
- **Downloadable Reports**: Export findings as markdown

## Project structure

```
ai_deep_research_agent/
├── backend/                 # FastAPI API
│   ├── main.py              # routes + CORS
│   ├── services/
│   │   └── research.py      # agents + Firecrawl tool
│   ├── requirements.txt
│   └── .env.example
├── frontend/                # Next.js UI
│   └── src/
│       ├── app/             # pages (/, /settings)
│       ├── components/
│       │   ├── research/    # workspace UI
│       │   └── ui/          # shared primitives
│       ├── lib/             # api, keys, utils
│       └── types/
├── legacy/                  # original Streamlit app (optional)
└── README.md
```

## Requirements

- Python 3.10+
- Node.js 18+
- OpenAI API key
- Firecrawl API key

## Setup

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # then add your API keys
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Add API keys in **Settings** (or set them in `backend/.env`).

## How it works

1. Enter a research topic in the workspace
2. Backend runs the research agent (Firecrawl deep research)
3. Elaboration agent enhances the initial report
4. Live SSE updates show search progress; the final report is viewable and downloadable

## API

| Endpoint | Description |
| --- | --- |
| `GET /health` | Health + env key status |
| `POST /api/research` | Run research (JSON response) |
| `POST /api/research/stream` | Run research with SSE progress events |

## Example topics

- Latest developments in quantum computing
- Impact of climate change on marine ecosystems
- Advancements in renewable energy storage
- Ethical considerations in artificial intelligence

## Legacy Streamlit UI

See [`legacy/README.md`](legacy/README.md).

## Technical details

1. **Research Agent** — Firecrawl deep research (`max_depth: 3`, `time_limit: 180`, `max_urls: 10`)
2. **Elaboration Agent** — Expands the report with explanations, examples, and implications

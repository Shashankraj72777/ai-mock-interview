# interviewroom

**Live app:** [ai-mock-interview-eight-blond.vercel.app](https://ai-mock-interview-eight-blond.vercel.app/)
**Repo:** [github.com/Shashankraj72777/ai-mock-interview](https://github.com/Shashankraj72777/ai-mock-interview)

A live, AI-driven mock technical interview platform. You write real code in a Monaco editor, an AI interviewer asks role-specific questions, evaluates your solution against a strict grading rubric, and generates a final report — not a static question bank, an actual back-and-forth conversation.

Built by **Shashank Raj**.

---

## Why this exists

Most "AI interview practice" tools are a wrapper around a question list. This one is built as a real-time system: a Socket.IO connection drives the interview live, an AI model generates and evaluates questions on the fly, and the scoring is designed to be honest rather than encouraging — a blank or nonsense answer gets scored as what it is, not softened into a passing grade.

## Features

- **Full auth system** — signup/login with JWT, bcrypt-hashed passwords
- **Live AI interview** — Monaco code editor + a Socket.IO connection to the backend, with the AI generating each question in real time based on your chosen role
- **Configurable interview length** — 5 to 100 questions, in steps of 5
- **Questions never repeat** — the AI is given your last ~40 previously-asked questions for that role (across all past sessions) and explicitly instructed not to repeat or rephrase them
- **Strict, accurate scoring** — a fixed rubric (0–10 for no real attempt, up to 86–100 for a clean solution); blank/near-empty submissions are scored `0` deterministically in code, never left to the AI's judgment; the final score is a real computed average of sub-scores, not an AI "impression"
- **Exit and resume** — leave mid-interview and pick up on the same question later, backed by live session state in Redis
- **Full report card** — final score, AI-written summary, strengths, areas to improve, and a question-by-question breakdown
- **Session history** — view and delete past interviews from the dashboard
- **30 roles across 7 categories** — from Frontend/Backend SDE to ML Engineer, SRE, Security Engineer, and Engineering Manager
- **Dark/light theme**, fully responsive, built with a custom design system (not a default template)

## Tech stack

**Frontend:** Next.js (App Router), TypeScript, Tailwind CSS, Monaco Editor, Socket.IO client
**Backend:** Node.js, Express, Socket.IO, PostgreSQL, Redis, JWT auth
**AI:** Google Gemini API
**Infrastructure:** Vercel (frontend), Render (backend), Render PostgreSQL, Upstash Redis

## Architecture

```
┌─────────────┐        WebSocket (Socket.IO)        ┌──────────────┐
│   Next.js    │ <───────────────────────────────── │  Node/Express │
│   (Vercel)   │ ─────────────────────────────────> │   (Render)    │
└─────────────┘                                       └──────┬───────┘
                                                               │
                                     ┌─────────────────────────┼─────────────────────┐
                                     │                          │                     │
                              ┌──────▼──────┐           ┌───────▼──────┐      ┌───────▼──────┐
                              │   Redis      │           │  PostgreSQL   │      │  Gemini API   │
                              │ (live session│           │ (users,       │      │ (generate &    │
                              │  state)      │           │  sessions,    │      │  evaluate      │
                              │              │           │  transcripts) │      │  questions)    │
                              └─────────────┘           └───────────────┘      └───────────────┘
```

**The core design rule:** Redis is the *only* source of truth while an interview is live — current question, running Q&A history, everything. Postgres is written to only at clear checkpoints (session start, each completed question, session end). This avoids the race conditions between "what the user sees" and "what's saved" that are the most common source of bugs in real-time apps.

## Getting started locally

```bash
git clone https://github.com/Shashankraj72777/ai-mock-interview.git
cd ai-mock-interview
```

**Backend:**
```bash
cd backend
npm install
cp .env.example .env   # fill in DATABASE_URL, REDIS_URL, JWT_SECRET, GEMINI_API_KEY
psql your_db -f src/db/schema.sql
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
echo "NEXT_PUBLIC_BACKEND_URL=http://localhost:4000" > .env.local
npm run dev
```

Requires a local PostgreSQL and Redis instance (or point `DATABASE_URL`/`REDIS_URL` at hosted ones).

## Project structure

```
ai-mock-interview/
├── frontend/           Next.js app
│   ├── app/              routes: landing, auth, dashboard, interview, report
│   └── lib/               API client, Socket.IO client, auth context
└── backend/             Express + Socket.IO server
    ├── src/routes/         REST endpoints (auth, sessions)
    ├── src/sockets/        live interview logic
    └── src/services/       AI calls, DB queries
```

## Notable engineering decisions

- **Deterministic scoring over AI judgment where possible** — the final score is calculated in code as a real average, not generated by the AI, so it can't drift upward regardless of how the prompt is worded. Only the qualitative feedback (summary, strengths) is left to the model.
- **Repeat-avoidance via prompt-injected history** — rather than tracking used questions in a separate system, each generation call is given the recent question list directly and instructed to avoid it, keeping the logic simple and stateless between calls.
- **Swapped LLM providers twice during development** (initially Anthropic → Groq for a free tier → Google Gemini for stronger instruction-following on strict grading) without touching any calling code, since `ai.service.ts` exposes the same three functions regardless of provider underneath.

## License

MIT

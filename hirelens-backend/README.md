# HireLens Backend

> AI-powered resume screening API built with FastAPI, scikit-learn, and Supabase.

---

## Prerequisites

- Python 3.11+
- A [Supabase](https://supabase.com) project with the schema below
- Node.js frontend running at `http://localhost:3000` (or update `FRONTEND_URL`)

---

## Setup

```bash
# 1. Clone / navigate into the backend directory
cd hirelens-backend

# 2. Create and activate a virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure environment variables
copy .env.example .env   # Windows
# cp .env.example .env   # macOS / Linux

# Edit .env and fill in your Supabase URL and service-role key
```

---

## Running Locally

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Interactive docs will be available at:

- **Swagger UI** → http://localhost:8000/docs
- **ReDoc**       → http://localhost:8000/redoc

---

## API Endpoints

### `GET /api/v1/health`
Liveness probe.

```bash
curl http://localhost:8000/api/v1/health
```

**Response:**
```json
{ "status": "healthy", "version": "1.0.0" }
```

---

### `POST /api/v1/analyze`
Upload a job description and one or more resumes (PDF / DOCX). Returns a ranked candidate list.

```bash
curl -X POST http://localhost:8000/api/v1/analyze \
  -F "job_description=We are hiring a Senior Python Engineer with FastAPI and PostgreSQL experience." \
  -F "resumes=@/path/to/alice_resume.pdf" \
  -F "resumes=@/path/to/bob_resume.docx"
```

**Response:**
```json
{
  "status": "success",
  "job_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "ranked_candidates": [
    {
      "resume_id": "b1e2c3d4-...",
      "filename": "alice_resume.pdf",
      "score": 0.8723,
      "matched_keywords": ["python", "fastapi", "postgresql"],
      "missing_keywords": ["docker", "kubernetes"]
    }
  ]
}
```

**Constraints:**
- Maximum **20 resumes** per request.
- Accepted file types: `application/pdf`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

---

### `GET /api/v1/results/{job_id}`
Retrieve stored analysis results for a previous job.

```bash
curl http://localhost:8000/api/v1/results/3fa85f64-5717-4562-b3fc-2c963f66afa6
```

**Response:**
```json
{
  "status": "success",
  "job_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "ranked_candidates": [
    {
      "resume_id": "b1e2c3d4-...",
      "filename": "alice_resume.pdf",
      "score": 0.8723,
      "matched_keywords": ["python", "fastapi", "postgresql"],
      "missing_keywords": ["docker", "kubernetes"]
    }
  ]
}
```

---

## Supabase SQL — Create Tables

Copy and run the following SQL in your Supabase SQL editor (**Database → SQL Editor → New query**):

```sql
-- ─── job_descriptions ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS job_descriptions (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    raw_text            TEXT        NOT NULL,
    preprocessed_text   TEXT,
    jd_keywords         JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── resumes ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS resumes (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id          UUID        NOT NULL REFERENCES job_descriptions(id) ON DELETE CASCADE,
    filename        TEXT        NOT NULL,
    storage_path    TEXT        NOT NULL,
    parsed_text     TEXT,
    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── analysis_results ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS analysis_results (
    id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id              UUID        NOT NULL REFERENCES job_descriptions(id) ON DELETE CASCADE,
    resume_id           UUID        NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    score               FLOAT       NOT NULL,
    matched_keywords    JSONB,
    missing_keywords    JSONB,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Indexes for common query patterns ────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_analysis_results_job_id  ON analysis_results(job_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_score   ON analysis_results(score DESC);
CREATE INDEX IF NOT EXISTS idx_resumes_job_id           ON resumes(job_id);
```

---

## Error Response Shape

All errors return a consistent JSON body:

```json
{
  "status": "error",
  "message": "Descriptive error message here.",
  "code": 422
}
```

---

## Architecture Overview

```
POST /api/v1/analyze
       │
       ├── File validation (MIME type, count)
       ├── parser.extract_text()   ← pdfplumber / python-docx
       ├── scorer.analyze()        ← TF-IDF + cosine similarity (scikit-learn)
       └── Supabase inserts        ← job_descriptions → resumes → analysis_results
```

The TF-IDF vectorizer is stateless and re-initialised per request (Phase 1 scope).

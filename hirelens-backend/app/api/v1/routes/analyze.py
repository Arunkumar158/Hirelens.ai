import logging
import uuid
from typing import List

from fastapi import APIRouter, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse

from app.db.supabase import get_client
from app.services import parser, scorer

logger = logging.getLogger(__name__)

router = APIRouter()

# Allowed MIME types for resume uploads
_ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

_MAX_RESUMES = 20


@router.post("/analyze")
async def analyze_resumes(
    job_description: str = Form(...),
    resumes: List[UploadFile] = None,
):
    """
    Accept a job description and one or more resume files, score them using
    TF-IDF cosine similarity, persist results to Supabase, and return a
    ranked candidate list.
    """
    if resumes is None:
        resumes = []

    # ── 1. Validate ──────────────────────────────────────────────────────────

    if len(resumes) == 0:
        raise HTTPException(status_code=400, detail="No resumes uploaded.")

    if len(resumes) > _MAX_RESUMES:
        raise HTTPException(
            status_code=400,
            detail=f"Too many resumes. Maximum allowed per request is {_MAX_RESUMES}.",
        )

    for resume_file in resumes:
        if resume_file.content_type not in _ALLOWED_CONTENT_TYPES:
            raise HTTPException(
                status_code=422,
                detail=(
                    f"Unsupported file type '{resume_file.content_type}' for "
                    f"'{resume_file.filename}'. Only PDF and DOCX are accepted."
                ),
            )

    # ── 2. Extract text from each resume ─────────────────────────────────────

    logger.info("Extracting text from %d resume(s) …", len(resumes))
    resume_texts: list[str] = []
    for resume_file in resumes:
        text = await parser.extract_text(resume_file)
        resume_texts.append(text)

    # ── 3. Score ──────────────────────────────────────────────────────────────

    logger.info("Scoring resumes against job description …")
    scores = scorer.analyze(job_description, resume_texts)

    # ── 4. Persist to Supabase ───────────────────────────────────────────────

    job_id = str(uuid.uuid4())
    db = get_client()

    try:
        # Insert job description
        db.table("job_descriptions").insert(
            {"id": job_id, "raw_text": job_description}
        ).execute()
    except Exception as exc:
        logger.error("Supabase insert (job_descriptions) failed: %s", exc)
        raise HTTPException(
            status_code=503,
            detail="Database unavailable while saving job description.",
        ) from exc

    ranked: list[dict] = []

    for resume_file, score_data in zip(resumes, scores):
        resume_id = str(uuid.uuid4())
        storage_path = f"{job_id}/{resume_id}/{resume_file.filename}"

        try:
            # Insert resume record
            db.table("resumes").insert(
                {
                    "id": resume_id,
                    "job_id": job_id,
                    "filename": resume_file.filename,
                    "storage_path": storage_path,
                }
            ).execute()

            # Insert analysis result
            db.table("analysis_results").insert(
                {
                    "job_id": job_id,
                    "resume_id": resume_id,
                    "score": score_data["score"],
                    "matched_keywords": score_data["matched_keywords"],
                    "missing_keywords": score_data["missing_keywords"],
                }
            ).execute()
        except Exception as exc:
            logger.error(
                "Supabase insert failed for resume '%s': %s",
                resume_file.filename,
                exc,
            )
            raise HTTPException(
                status_code=503,
                detail=f"Database unavailable while saving results for '{resume_file.filename}'.",
            ) from exc

        ranked.append(
            {
                "resume_id": resume_id,
                "filename": resume_file.filename,
                "score": score_data["score"],
                "matched_keywords": score_data["matched_keywords"],
                "missing_keywords": score_data["missing_keywords"],
            }
        )

    # ── 5. Sort by score descending ───────────────────────────────────────────

    ranked.sort(key=lambda c: c["score"], reverse=True)

    logger.info("Analysis complete. job_id=%s, candidates=%d", job_id, len(ranked))

    return JSONResponse(
        content={
            "status": "success",
            "job_id": job_id,
            "ranked_candidates": ranked,
        }
    )

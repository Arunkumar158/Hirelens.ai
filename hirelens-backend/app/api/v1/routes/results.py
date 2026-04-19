import logging

from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse

from app.db.supabase import get_client

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/results/{job_id}")
async def get_results(job_id: str):
    """
    Retrieve previously computed analysis results for a given job_id.

    Returns candidates ranked by score (descending), enriched with filename
    from the resumes table.
    """
    db = get_client()

    try:
        # Fetch all analysis results for this job
        results_resp = (
            db.table("analysis_results")
            .select("id, resume_id, score, matched_keywords, missing_keywords")
            .eq("job_id", job_id)
            .order("score", desc=True)
            .execute()
        )
        analysis_rows = results_resp.data or []
    except Exception as exc:
        logger.error("Supabase query (analysis_results) failed: %s", exc)
        raise HTTPException(
            status_code=503,
            detail="Database unavailable. Please try again later.",
        ) from exc

    if not analysis_rows:
        raise HTTPException(
            status_code=404,
            detail=f"No results found for job_id '{job_id}'.",
        )

    # Collect all resume_ids so we can batch-fetch filenames
    resume_ids = [row["resume_id"] for row in analysis_rows]

    try:
        resumes_resp = (
            db.table("resumes")
            .select("id, filename")
            .in_("id", resume_ids)
            .execute()
        )
        resumes_rows = resumes_resp.data or []
    except Exception as exc:
        logger.error("Supabase query (resumes) failed: %s", exc)
        raise HTTPException(
            status_code=503,
            detail="Database unavailable while fetching resume metadata.",
        ) from exc

    # Build a resume_id → filename lookup
    filename_map: dict[str, str] = {r["id"]: r["filename"] for r in resumes_rows}

    ranked_candidates = []
    for row in analysis_rows:
        ranked_candidates.append(
            {
                "resume_id": row["resume_id"],
                "filename": filename_map.get(row["resume_id"], "unknown"),
                "score": row["score"],
                "matched_keywords": row["matched_keywords"] or [],
                "missing_keywords": row["missing_keywords"] or [],
            }
        )

    logger.info("Returning %d results for job_id=%s", len(ranked_candidates), job_id)

    return JSONResponse(
        content={
            "status": "success",
            "job_id": job_id,
            "ranked_candidates": ranked_candidates,
        }
    )

import logging
import uuid

from fastapi import APIRouter, HTTPException, UploadFile
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


@router.get("/resumes")
async def list_resumes():
    """List all unique resumes uploaded."""
    db = get_client()
    try:
        resp = (
            db.table("resumes")
            .select("id, filename, created_at")
            .order("created_at", desc=True)
            .execute()
        )
        return JSONResponse(content={"status": "success", "resumes": resp.data or []})
    except Exception as exc:
        logger.error("Failed to fetch resumes: %s", exc)
        # Fallback if created_at doesn't exist
        try:
            resp = db.table("resumes").select("id, filename").execute()
            return JSONResponse(content={"status": "success", "resumes": resp.data or []})
        except:
            raise HTTPException(status_code=500, detail="Failed to fetch resumes")


@router.get("/history")
async def get_history():
    """List all previous analysis jobs with their job descriptions and results."""
    db = get_client()
    try:
        # Fetch analysis results joined with job descriptions
        # Note: In a real app, we might want to aggregate by job_id
        # For now, let's fetch results and join with job descriptions
        results_resp = (
            db.table("analysis_results")
            .select("job_id, resume_id, score, created_at")
            .order("created_at", desc=True)
            .execute()
        )
        results = results_resp.data or []
        
        if not results:
            return JSONResponse(content={"status": "success", "history": []})

        # Fetch job descriptions
        job_ids = list(set(r["job_id"] for r in results))
        jobs_resp = (
            db.table("job_descriptions")
            .select("id, raw_text")
            .in_("id", job_ids)
            .execute()
        )
        jobs_map = {j["id"]: j["raw_text"] for j in jobs_resp.data or []}

        # Fetch resumes
        resume_ids = list(set(r["resume_id"] for r in results))
        resumes_resp = (
            db.table("resumes")
            .select("id, filename")
            .in_("id", resume_ids)
            .execute()
        )
        resumes_map = {r["id"]: r["filename"] for r in resumes_resp.data or []}

        history = []
        for r in results:
            history.append({
                "id": f"{r['job_id']}-{r['resume_id']}",
                "job_id": r["job_id"],
                "resume_id": r["resume_id"],
                "filename": resumes_map.get(r["resume_id"], "Unknown"),
                "job_description": jobs_map.get(r["job_id"], "No description"),
                "score": int(r["score"] * 100) if isinstance(r["score"], float) else r["score"],
                "timestamp": r["created_at"]
            })

        return JSONResponse(content={"status": "success", "history": history})
    except Exception as exc:
        logger.error("Failed to fetch history: %s", exc)
@router.post("/resumes/upload")
async def upload_resume(file: UploadFile):
    """Upload a resume without running an analysis."""
    db = get_client()
    resume_id = str(uuid.uuid4())
    # standalone uploads don't have a job_id, but let's use a dummy or none
    try:
        db.table("resumes").insert({
            "id": resume_id,
            "filename": file.filename,
            "storage_path": f"standalone/{resume_id}/{file.filename}"
        }).execute()
        return JSONResponse(content={"status": "success", "resume_id": resume_id})
    except Exception as exc:
        logger.error("Standalone upload failed: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to upload resume")


@router.delete("/resumes/{resume_id}")
async def delete_resume(resume_id: str):
    """Delete a resume by ID."""
    db = get_client()
    try:
        # First delete associated analysis results
        db.table("analysis_results").delete().eq("resume_id", resume_id).execute()
        # Then delete the resume
        db.table("resumes").delete().eq("id", resume_id).execute()
        return JSONResponse(content={"status": "success", "message": "Resume deleted"})
    except Exception as exc:
        logger.error("Delete failed for resume %s: %s", resume_id, exc)
        raise HTTPException(status_code=500, detail="Failed to delete resume")

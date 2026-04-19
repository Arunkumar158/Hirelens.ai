import io
import logging

import pdfplumber
from docx import Document
from fastapi import HTTPException, UploadFile

logger = logging.getLogger(__name__)


async def extract_text(file: UploadFile) -> str:
    """
    Extract plain text from an uploaded PDF or DOCX file.

    Args:
        file: The uploaded file object from FastAPI.

    Returns:
        Extracted text as a single string.

    Raises:
        HTTPException 422: If the file type is not supported.
        HTTPException 400: If no text could be extracted from the file.
    """
    filename: str = file.filename or ""
    lower_name = filename.lower()

    raw_bytes: bytes = await file.read()

    if lower_name.endswith(".pdf"):
        extracted = _extract_pdf(raw_bytes, filename)
    elif lower_name.endswith(".docx"):
        extracted = _extract_docx(raw_bytes, filename)
    else:
        raise HTTPException(
            status_code=422,
            detail=f"Unsupported file type: {filename}",
        )

    if not extracted.strip():
        raise HTTPException(
            status_code=400,
            detail=f"Could not extract text from {filename}",
        )

    return extracted


# ── private helpers ────────────────────────────────────────────────────────────


def _extract_pdf(data: bytes, filename: str) -> str:
    """Extract all text from a PDF byte buffer using pdfplumber."""
    try:
        with pdfplumber.open(io.BytesIO(data)) as pdf:
            pages = [page.extract_text() or "" for page in pdf.pages]
        return " ".join(pages)
    except Exception as exc:
        logger.error("PDF extraction failed for '%s': %s", filename, exc)
        raise HTTPException(
            status_code=400,
            detail=f"Failed to parse PDF '{filename}': {exc}",
        ) from exc


def _extract_docx(data: bytes, filename: str) -> str:
    """Extract all paragraph text from a DOCX byte buffer using python-docx."""
    try:
        doc = Document(io.BytesIO(data))
        paragraphs = [para.text for para in doc.paragraphs]
        return " ".join(paragraphs)
    except Exception as exc:
        logger.error("DOCX extraction failed for '%s': %s", filename, exc)
        raise HTTPException(
            status_code=400,
            detail=f"Failed to parse DOCX '{filename}': {exc}",
        ) from exc

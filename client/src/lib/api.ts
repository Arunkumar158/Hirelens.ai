const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// ── Types ────────────────────────────────────────────────────────────────────

export type Candidate = {
  resume_id: string;
  filename: string;
  score: number; // raw float 0.0–1.0
  matched_keywords: string[];
  missing_keywords: string[];
};

export type AnalysisResponse = {
  status: string;
  job_id: string;
  ranked_candidates: Candidate[];
};

// ── Score label helper ───────────────────────────────────────────────────────

export function getScoreLabel(score: number): {
  label: string;
  color: "green" | "blue" | "yellow" | "red";
} {
  if (score >= 0.85) return { label: "Excellent Match", color: "green" };
  if (score >= 0.65) return { label: "Good Match", color: "blue" };
  if (score >= 0.40) return { label: "Partial Match", color: "yellow" };
  return { label: "Low Match", color: "red" };
}

// ── API functions ────────────────────────────────────────────────────────────

/**
 * POST /api/v1/analyze
 * Uploads a job description and one or more resume files. Returns ranked candidates.
 */
export async function analyzeResumes(
  jobDescription: string,
  files: File[]
): Promise<AnalysisResponse> {
  const formData = new FormData();
  formData.append("job_description", jobDescription);
  files.forEach((file) => formData.append("resumes", file));

  // Do NOT set Content-Type manually — browser sets multipart boundary automatically
  const response = await fetch(`${BASE_URL}/api/v1/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText);
  }

  return response.json() as Promise<AnalysisResponse>;
}

/**
 * GET /api/v1/results/:jobId
 * Retrieves previously computed analysis results by job ID.
 */
export async function getResults(jobId: string): Promise<AnalysisResponse> {
  const response = await fetch(`${BASE_URL}/api/v1/results/${jobId}`);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText);
  }

  return response.json() as Promise<AnalysisResponse>;
}

/**
 * GET /api/v1/resumes
 * Lists all uploaded resumes.
 */
export async function getResumes(): Promise<any[]> {
  const response = await fetch(`${BASE_URL}/api/v1/resumes`);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText);
  }
  const data = await response.json();
  return data.resumes.map((r: any) => ({
    id: r.id,
    filename: r.filename,
    uploadedAt: r.created_at || new Date(),
  }));
}

/**
 * GET /api/v1/history
 * Lists all previous analysis results.
 */
export async function getHistory(): Promise<any[]> {
  const response = await fetch(`${BASE_URL}/api/v1/history`);
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText);
  }
  const data = await response.json();
  return data.history.map((h: any) => ({
    id: h.id,
    jobId: h.job_id,
    resumeId: h.resume_id,
    jobDescription: h.job_description,
    score: h.score,
    timestamp: h.timestamp || new Date(),
  }));
}

/**
 * POST /api/v1/resumes/upload
 * Uploads a resume without analysis.
 */
export async function uploadResume(file: File): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${BASE_URL}/api/v1/resumes/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText);
  }

  return response.json();
}

/**
 * DELETE /api/v1/resumes/:resumeId
 * Deletes a resume.
 */
export async function deleteResume(resumeId: string): Promise<any> {
  const response = await fetch(`${BASE_URL}/api/v1/resumes/${resumeId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText);
  }

  return response.json();
}



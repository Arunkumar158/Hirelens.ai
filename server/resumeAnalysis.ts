import { InsertAnalysis } from "@shared/schema";

// Mock extraction of skills from resume text
export function extractSkillsFromResume(resumeText: string): string[] {
  // In a real system, this would use NLP to extract skills
  const commonSkills = [
    "javascript", "typescript", "react", "node", "python", "java", "c++", "c#",
    "html", "css", "sql", "nosql", "mongodb", "postgresql", "mysql", "aws", "azure",
    "gcp", "docker", "kubernetes", "git", "agile", "scrum", "jira", "confluence",
    "communication", "teamwork", "problem solving", "critical thinking",
    "leadership", "project management", "data analysis", "machine learning", "ai"
  ];
  
  const resumeLower = resumeText.toLowerCase();
  return commonSkills.filter(skill => resumeLower.includes(skill));
}

// Mock extraction of required skills from job description
export function extractSkillsFromJobDescription(jobDescription: string): string[] {
  // In a real system, this would use NLP to extract skills
  const commonSkills = [
    "javascript", "typescript", "react", "node", "python", "java", "c++", "c#",
    "html", "css", "sql", "nosql", "mongodb", "postgresql", "mysql", "aws", "azure",
    "gcp", "docker", "kubernetes", "git", "agile", "scrum", "jira", "confluence",
    "communication", "teamwork", "problem solving", "critical thinking",
    "leadership", "project management", "data analysis", "machine learning", "ai"
  ];
  
  const jdLower = jobDescription.toLowerCase();
  return commonSkills.filter(skill => jdLower.includes(skill));
}

// Calculate match score between resume and job description
export function calculateMatchScore(resumeSkills: string[], jobSkills: string[]): number {
  if (jobSkills.length === 0) return 0;
  
  const matchedSkills = resumeSkills.filter(skill => jobSkills.includes(skill));
  return Math.round((matchedSkills.length / jobSkills.length) * 100);
}

// Generate feedback based on match analysis
export function generateFeedback(score: number, matchedSkills: string[], missingSkills: string[]): string {
  if (score >= 90) {
    return "Excellent match! Your resume is very well aligned with this job description.";
  } else if (score >= 70) {
    return "Good match! Your resume aligns well with most requirements, but there's room for improvement.";
  } else if (score >= 50) {
    return "Moderate match. Consider tailoring your resume more specifically to this job's requirements.";
  } else {
    return "Low match. Your resume needs significant tailoring to better align with this job's requirements.";
  }
}

// Generate suggestions based on match analysis
export function generateSuggestions(matchedSkills: string[], missingSkills: string[]): string {
  let suggestions = "";
  
  if (missingSkills.length > 0) {
    suggestions += `Consider highlighting these missing skills if you have them: ${missingSkills.join(", ")}. `;
  }
  
  suggestions += "Make sure to quantify your achievements with metrics where possible. ";
  suggestions += "Use action verbs at the beginning of bullet points to emphasize your contributions. ";
  
  if (matchedSkills.length > 0) {
    suggestions += `Emphasize your experience with ${matchedSkills.slice(0, 3).join(", ")} more prominently. `;
  }
  
  return suggestions;
}

// Main function to analyze resume against job description
export function analyzeResume(resumeText: string, jobDescription: string): InsertAnalysis {
  const resumeSkills = extractSkillsFromResume(resumeText);
  const jobSkills = extractSkillsFromJobDescription(jobDescription);
  
  const matchedSkills = resumeSkills.filter(skill => jobSkills.includes(skill));
  const missingSkills = jobSkills.filter(skill => !resumeSkills.includes(skill));
  
  const score = calculateMatchScore(resumeSkills, jobSkills);
  const feedback = generateFeedback(score, matchedSkills, missingSkills);
  const suggestions = generateSuggestions(matchedSkills, missingSkills);
  
  return {
    resumeId: 0, // This will be set by the calling function
    jobId: null,
    jobDescription,
    score,
    feedback,
    suggestions,
    matchedSkills,
    missingSkills
  };
}

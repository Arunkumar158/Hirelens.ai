import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import multer from "multer";
import path from "path";
import fs from "fs";
import { analyzeResume } from "./resumeAnalysis";
import { z } from "zod";
import { 
  insertResumeSchema, 
  insertJobSchema, 
  insertAnalysisSchema 
} from "@shared/schema";

// Configure multer for file uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadDir = path.join(process.cwd(), "uploads");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, file.fieldname + "-" + uniqueSuffix + ext);
    },
  }),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error("Only PDF files are allowed"));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

function isAuthenticated(req: Request, res: Response, next: Function) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}

function checkRole(role: string) {
  return (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated() && req.user?.role === role) {
      return next();
    }
    res.status(403).json({ message: "Forbidden" });
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  setupAuth(app);

  // Helper to extract text from PDF
  // In a real implementation, this would use a PDF parsing library
  const extractTextFromPDF = async (filePath: string): Promise<string> => {
    // Mock PDF text extraction
    return `Resume content with skills including JavaScript, React, Node.js, TypeScript, 
    HTML, CSS, Git, and experience in web development, API integration, and responsive design.`;
  };

  // User routes
  app.get("/api/users", isAuthenticated, checkRole("admin"), async (req, res) => {
    try {
      const users = await storage.getUsers();
      // Remove passwords from response
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  // Resume routes
  app.post("/api/resumes", isAuthenticated, upload.single("resume"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const resumeText = await extractTextFromPDF(req.file.path);
      
      const resume = await storage.createResume({
        userId: req.user!.id,
        filename: req.file.originalname,
        content: resumeText
      });

      res.status(201).json(resume);
    } catch (error) {
      console.error("Error uploading resume:", error);
      res.status(500).json({ message: "Failed to upload resume" });
    }
  });

  app.get("/api/resumes", isAuthenticated, async (req, res) => {
    try {
      const resumes = await storage.getResumesByUser(req.user!.id);
      res.json(resumes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch resumes" });
    }
  });

  // Job routes
  app.post("/api/jobs", isAuthenticated, checkRole("recruiter"), async (req, res) => {
    try {
      const jobData = insertJobSchema.parse({
        ...req.body,
        recruiterId: req.user!.id
      });
      
      const job = await storage.createJob(jobData);
      res.status(201).json(job);
    } catch (error) {
      console.error("Error creating job:", error);
      res.status(400).json({ message: "Invalid job data" });
    }
  });

  app.get("/api/jobs", isAuthenticated, checkRole("recruiter"), async (req, res) => {
    try {
      const jobs = await storage.getJobsByRecruiter(req.user!.id);
      res.json(jobs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch jobs" });
    }
  });

  // Analysis routes
  app.post("/api/analyze", isAuthenticated, async (req, res) => {
    try {
      const schema = z.object({
        resumeId: z.number(),
        jobDescription: z.string().min(1),
        jobId: z.number().optional(),
      });
      
      const { resumeId, jobDescription, jobId } = schema.parse(req.body);
      
      const resume = await storage.getResume(resumeId);
      if (!resume) {
        return res.status(404).json({ message: "Resume not found" });
      }
      
      if (resume.userId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized access to this resume" });
      }
      
      // Get the resume content
      const resumeText = resume.content || "";
      
      // Analyze the resume against the job description
      const analysisData = analyzeResume(resumeText, jobDescription);
      
      // Save the analysis
      const analysis = await storage.createAnalysis({
        ...analysisData,
        resumeId,
        jobId: jobId || null
      });
      
      res.status(201).json(analysis);
    } catch (error) {
      console.error("Error analyzing resume:", error);
      res.status(400).json({ message: "Invalid analysis request" });
    }
  });

  app.get("/api/analyses", isAuthenticated, async (req, res) => {
    try {
      const resumeId = parseInt(req.query.resumeId as string);
      if (!resumeId) {
        return res.status(400).json({ message: "Resume ID is required" });
      }
      
      const resume = await storage.getResume(resumeId);
      if (!resume) {
        return res.status(404).json({ message: "Resume not found" });
      }
      
      if (resume.userId !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized access to this resume" });
      }
      
      const analyses = await storage.getAnalysesByResume(resumeId);
      res.json(analyses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch analyses" });
    }
  });

  // Admin stats route
  app.get("/api/admin/stats", isAuthenticated, checkRole("admin"), async (req, res) => {
    try {
      const users = await storage.getUsers();
      
      // Get counts by role
      const jobseekerCount = users.filter(user => user.role === "jobseeker").length;
      const recruiterCount = users.filter(user => user.role === "recruiter").length;
      
      // Get all resumes and analyses
      let allResumes: any[] = [];
      for (const user of users) {
        const resumes = await storage.getResumesByUser(user.id);
        allResumes = allResumes.concat(resumes);
      }
      
      let allAnalyses: any[] = [];
      for (const resume of allResumes) {
        const analyses = await storage.getAnalysesByResume(resume.id);
        allAnalyses = allAnalyses.concat(analyses);
      }
      
      // Calculate top skills from all analyses
      const allSkills: Record<string, number> = {};
      allAnalyses.forEach(analysis => {
        if (analysis.matchedSkills) {
          const skills = Array.isArray(analysis.matchedSkills) ? analysis.matchedSkills : [];
          skills.forEach(skill => {
            allSkills[skill] = (allSkills[skill] || 0) + 1;
          });
        }
      });
      
      // Sort skills by frequency
      const topSkills = Object.entries(allSkills)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([skill, count]) => ({ skill, count }));
      
      res.json({
        totalUsers: users.length,
        jobseekerCount,
        recruiterCount,
        totalResumes: allResumes.length,
        totalAnalyses: allAnalyses.length,
        topSkills
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ message: "Failed to fetch admin statistics" });
    }
  });

  // Bulk analysis for recruiters
  app.post("/api/recruiter/bulk-analyze", isAuthenticated, checkRole("recruiter"), async (req, res) => {
    try {
      const schema = z.object({
        jobId: z.number(),
        resumeIds: z.array(z.number())
      });
      
      const { jobId, resumeIds } = schema.parse(req.body);
      
      const job = await storage.getJob(jobId);
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
      
      if (job.recruiterId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized access to this job" });
      }
      
      const results = [];
      
      for (const resumeId of resumeIds) {
        const resume = await storage.getResume(resumeId);
        if (!resume || !resume.content) continue;
        
        const analysisData = analyzeResume(resume.content, job.description);
        
        const analysis = await storage.createAnalysis({
          ...analysisData,
          resumeId,
          jobId
        });
        
        results.push(analysis);
      }
      
      // Sort results by score (highest first)
      results.sort((a, b) => b.score - a.score);
      
      res.status(201).json(results);
    } catch (error) {
      console.error("Error performing bulk analysis:", error);
      res.status(400).json({ message: "Invalid bulk analysis request" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

import { 
  users, type User, type InsertUser,
  resumes, type Resume, type InsertResume,
  jobs, type Job, type InsertJob,
  analyses, type Analysis, type InsertAnalysis
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(id: number, password: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  
  // Resume operations
  createResume(resume: InsertResume): Promise<Resume>;
  getResume(id: number): Promise<Resume | undefined>;
  getResumesByUser(userId: number): Promise<Resume[]>;
  
  // Job operations
  createJob(job: InsertJob): Promise<Job>;
  getJob(id: number): Promise<Job | undefined>;
  getJobsByRecruiter(recruiterId: number): Promise<Job[]>;
  
  // Analysis operations
  createAnalysis(analysis: InsertAnalysis): Promise<Analysis>;
  getAnalysis(id: number): Promise<Analysis | undefined>;
  getAnalysesByResume(resumeId: number): Promise<Analysis[]>;
  getAnalysesByJob(jobId: number): Promise<Analysis[]>;
  
  // Session store
  sessionStore: session.SessionStore;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private resumes: Map<number, Resume>;
  private jobs: Map<number, Job>;
  private analyses: Map<number, Analysis>;
  
  private userIdCounter: number;
  private resumeIdCounter: number;
  private jobIdCounter: number;
  private analysisIdCounter: number;
  
  sessionStore: session.SessionStore;

  constructor() {
    this.users = new Map();
    this.resumes = new Map();
    this.jobs = new Map();
    this.analyses = new Map();
    
    this.userIdCounter = 1;
    this.resumeIdCounter = 1;
    this.jobIdCounter = 1;
    this.analysisIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Create admin user
    this.createUser({
      username: "admin",
      password: "adminpassword",
      name: "Admin User",
      email: "admin@hirelens.com",
      role: "admin"
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase(),
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const timestamp = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: timestamp
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserPassword(id: number, password: string): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) {
      return undefined;
    }

    const updatedUser: User = {
      ...existingUser,
      password,
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Resume operations
  async createResume(insertResume: InsertResume): Promise<Resume> {
    const id = this.resumeIdCounter++;
    const timestamp = new Date();
    const resume: Resume = {
      ...insertResume,
      id,
      uploadedAt: timestamp
    };
    this.resumes.set(id, resume);
    return resume;
  }
  
  async getResume(id: number): Promise<Resume | undefined> {
    return this.resumes.get(id);
  }
  
  async getResumesByUser(userId: number): Promise<Resume[]> {
    return Array.from(this.resumes.values()).filter(
      (resume) => resume.userId === userId
    );
  }

  // Job operations
  async createJob(insertJob: InsertJob): Promise<Job> {
    const id = this.jobIdCounter++;
    const timestamp = new Date();
    const job: Job = {
      ...insertJob,
      id,
      createdAt: timestamp
    };
    this.jobs.set(id, job);
    return job;
  }
  
  async getJob(id: number): Promise<Job | undefined> {
    return this.jobs.get(id);
  }
  
  async getJobsByRecruiter(recruiterId: number): Promise<Job[]> {
    return Array.from(this.jobs.values()).filter(
      (job) => job.recruiterId === recruiterId
    );
  }

  // Analysis operations
  async createAnalysis(insertAnalysis: InsertAnalysis): Promise<Analysis> {
    const id = this.analysisIdCounter++;
    const timestamp = new Date();
    const analysis: Analysis = {
      ...insertAnalysis,
      id,
      timestamp
    };
    this.analyses.set(id, analysis);
    return analysis;
  }
  
  async getAnalysis(id: number): Promise<Analysis | undefined> {
    return this.analyses.get(id);
  }
  
  async getAnalysesByResume(resumeId: number): Promise<Analysis[]> {
    return Array.from(this.analyses.values()).filter(
      (analysis) => analysis.resumeId === resumeId
    );
  }
  
  async getAnalysesByJob(jobId: number): Promise<Analysis[]> {
    return Array.from(this.analyses.values()).filter(
      (analysis) => analysis.jobId === jobId
    );
  }
}

export const storage = new MemStorage();

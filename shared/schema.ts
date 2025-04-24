import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name"),
  email: text("email"),
  role: text("role").default("jobseeker").notNull(), // jobseeker, recruiter, admin
  createdAt: timestamp("created_at").defaultNow(),
});

export const resumes = pgTable("resumes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  filename: text("filename").notNull(),
  content: text("content"), // extracted text content
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  recruiterId: integer("recruiter_id").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(), // job description text
  createdAt: timestamp("created_at").defaultNow(),
});

export const analyses = pgTable("analyses", {
  id: serial("id").primaryKey(),
  resumeId: integer("resume_id").notNull(),
  jobId: integer("job_id"), // optional if analyzing against a pasted JD
  jobDescription: text("job_description"), // for jobseekers who paste JD directly
  score: integer("score").notNull(), // match score 0-100
  feedback: text("feedback"),
  suggestions: text("suggestions"),
  matchedSkills: jsonb("matched_skills"), // array of matched skills
  missingSkills: jsonb("missing_skills"), // array of missing skills
  timestamp: timestamp("timestamp").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  role: true,
});

export const insertResumeSchema = createInsertSchema(resumes).pick({
  userId: true,
  filename: true,
  content: true,
});

export const insertJobSchema = createInsertSchema(jobs).pick({
  recruiterId: true,
  title: true,
  description: true,
});

export const insertAnalysisSchema = createInsertSchema(analyses).pick({
  resumeId: true,
  jobId: true,
  jobDescription: true,
  score: true,
  feedback: true,
  suggestions: true,
  matchedSkills: true,
  missingSkills: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertResume = z.infer<typeof insertResumeSchema>;
export type Resume = typeof resumes.$inferSelect;

export type InsertJob = z.infer<typeof insertJobSchema>;
export type Job = typeof jobs.$inferSelect;

export type InsertAnalysis = z.infer<typeof insertAnalysisSchema>;
export type Analysis = typeof analyses.$inferSelect;

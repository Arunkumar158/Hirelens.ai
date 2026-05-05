import { type ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase, type SupabaseJob } from '@/lib/supabase';
import { analyzeResumes, getScoreLabel, type Candidate } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import DashboardStats from './DashboardStats';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3, Briefcase, FileUp, Loader2, Users } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const jobSchema = z.object({
  title: z.string().min(1, "Job title is required"),
  description: z.string().min(10, "Job description must be at least 10 characters"),
});

type JobFormValues = z.infer<typeof jobSchema>;

type Job = SupabaseJob;

type UploadCandidate = {
  id: number;
  name: string;
  fileName: string;
  appliedJobId: string;
  status: 'Pending' | 'Analyzed';
  matchScore: number;
  missingSkills: string[];
};

const RECRUITER_ID = '00000000-0000-0000-0000-000000000001';

export default function RecruiterContent() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('jobs');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [uploadJobId, setUploadJobId] = useState<string | null>(null);
  const [uploadedCandidates, setUploadedCandidates] = useState<UploadCandidate[]>([]);
  const [isRanking, setIsRanking] = useState(false);
  const [rankResults, setRankResults] = useState<Candidate[]>([]);
  const [rankJobId, setRankJobId] = useState<string | null>(null);
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [isSavingJob, setIsSavingJob] = useState(false);

  // ── API integration state (manual Analyze Resumes section) ────────────────
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [apiCandidates, setApiCandidates] = useState<Candidate[]>([]);
  const [analyzeJobDescription, setAnalyzeJobDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const analyzeFileInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch jobs from Supabase ──────────────────────────────────────────────
  const fetchJobs = async () => {
    setIsLoadingJobs(true);
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('recruiter_id', RECRUITER_ID)
      .order('created_at', { ascending: false });
    if (!error && data) setJobs(data);
    setIsLoadingJobs(false);
  };

  useEffect(() => { fetchJobs(); }, []);

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: { title: '', description: '' },
  });

  const onSubmit = async (data: JobFormValues) => {
    setIsSavingJob(true);
    const { error } = await supabase.from('jobs').insert({
      recruiter_id: RECRUITER_ID,
      title: data.title,
      description: data.description,
      status: 'active',
    });
    setIsSavingJob(false);
    if (error) {
      toast({ title: 'Failed to create job', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Job created!', description: `"${data.title}" is now active.` });
      form.reset();
      setIsCreateJobOpen(false);
      fetchJobs();
    }
  };
  
  const allMissingSkills = ['System Design', 'AWS', 'Leadership', 'Kubernetes', 'Testing', 'GraphQL', 'CI/CD'];
  const hasJobs = Array.isArray(jobs) && jobs.length > 0;
  const activeJobs = (jobs || []).filter((job: Job) => job.status === 'active');

  const candidatesForSelectedJob = useMemo(() => {
    if (!selectedJobId) return uploadedCandidates;
    return uploadedCandidates.filter((c) => c.appliedJobId === selectedJobId);
  }, [selectedJobId, uploadedCandidates]);

  const rankedCandidates = useMemo(
    () => [...candidatesForSelectedJob].sort((a, b) => b.matchScore - a.matchScore),
    [candidatesForSelectedJob]
  );

  const totalApplications = uploadedCandidates.length;
  const analyzedCandidates = uploadedCandidates.filter((candidate) => candidate.status === 'Analyzed');
  const averageMatch = analyzedCandidates.length
    ? Math.round(analyzedCandidates.reduce((sum, candidate) => sum + candidate.matchScore, 0) / analyzedCandidates.length)
    : 0;
  const topMatchScore = analyzedCandidates.length
    ? `${Math.max(...analyzedCandidates.map((candidate) => candidate.matchScore))}%`
    : '0%';

  const topSkillGaps = useMemo(() => {
    const frequency: Record<string, number> = {};
    uploadedCandidates.forEach((candidate) => {
      candidate.missingSkills.forEach((skill) => {
        frequency[skill] = (frequency[skill] || 0) + 1;
      });
    });
    return Object.entries(frequency)
      .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
      .slice(0, 4);
  }, [uploadedCandidates]);

  const qualityByJob = useMemo(() => {
    return (jobs || []).map((job: Job) => {
      const jobCandidates = uploadedCandidates.filter((c) => c.appliedJobId === job.id);
      const quality = jobCandidates.length
        ? Math.round(jobCandidates.reduce((sum, c) => sum + c.matchScore, 0) / jobCandidates.length)
        : 0;
      return { jobId: job.id, title: job.title, candidates: jobCandidates.length, quality };
    }).sort((a, b) => b.quality - a.quality);
  }, [jobs, uploadedCandidates]);

  const topRankScore = rankResults.length
    ? `${Math.round(Math.max(...rankResults.map((c) => c.score)) * 100)}%`
    : topMatchScore;

  const stats = [
    { label: 'Active Jobs', value: activeJobs.length || 0 },
    { label: 'Candidates Analyzed', value: analyzedCandidates.length + rankResults.length },
    { label: 'Top Match Score', value: topRankScore },
  ];

  const sanitizeCandidateName = (fileName: string) => {
    return fileName
      .replace(/\.pdf$/i, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const handleCandidateUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!uploadJobId || !selectedJob || files.length === 0) {
      toast({ title: 'Select a job first', variant: 'destructive' });
      return;
    }
    event.target.value = '';
    let saved = 0;
    let firstStorageError: string | null = null;
    for (const file of files) {
      const path = `${selectedJob.id}/${file.name}`;
      const { error: storageErr } = await supabase.storage
        .from('resumes')
        .upload(path, file, { upsert: true });
      if (storageErr) {
        firstStorageError = storageErr.message;
        continue;
      }
      const { error: dbErr } = await supabase.from('resumes').insert({
        job_id_local: selectedJob.id,
        filename: file.name,
        storage_path: path,
        uploaded_at: new Date().toISOString(),
      });
      if (dbErr) {
        firstStorageError = dbErr.message;
        continue;
      }
      saved++;
      const uid = Date.now() + saved;
      setUploadedCandidates((prev) => [
        {
          id: uid,
          name: sanitizeCandidateName(file.name),
          fileName: file.name,
          appliedJobId: selectedJob.id,
          status: 'Pending' as const,
          matchScore: 0,
          missingSkills: [],
        },
        ...prev,
      ]);
    }
    if (saved > 0) {
      toast({
        title: `${saved} resume(s) uploaded`,
        description: `Saved for "${selectedJob.title}".`,
      });
    }
    if (firstStorageError) {
      toast({
        title: `Upload error`,
        description: firstStorageError,
        variant: 'destructive',
      });
    }

  };

  const runRanking = async () => {
    if (!selectedJobId || !selectedJob) {
      toast({ title: 'Please select a job first', variant: 'destructive' });
      return;
    }
    // Fetch resume records from Supabase
    const { data: records, error: recErr } = await supabase
      .from('resumes')
      .select('*')
      .eq('job_id_local', selectedJob.id);
    if (recErr || !records?.length) {
      toast({
        title: 'No resumes found',
        description: 'Upload resumes for this job first.',
        variant: 'destructive',
      });
      return;
    }
    setIsRanking(true);
    setRankResults([]);
    // Download each file from Supabase Storage
    const fileObjects: File[] = [];
    for (const rec of records) {
      const { data: blob } = await supabase.storage
        .from('resumes')
        .download(rec.storage_path);
      if (blob) {
        fileObjects.push(new File([blob], rec.filename, { type: 'application/pdf' }));
      }
    }
    if (fileObjects.length === 0) {
      toast({ title: 'Could not download resumes', variant: 'destructive' });
      setIsRanking(false);
      return;
    }
    try {
      const response = await analyzeResumes(selectedJob.description, fileObjects);
      setRankResults(response.ranked_candidates);
      setRankJobId(response.job_id);
      toast({
        title: 'Ranking complete!',
        description: `${response.ranked_candidates.length} candidates ranked.`,
      });
    } catch (err: any) {
      toast({
        title: 'Ranking failed',
        description: err.message ?? 'Backend error. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsRanking(false);
    }
  };

  // ── Real API: analyze resumes ─────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (selectedFiles.length === 0) {
      setAnalysisError('Please upload at least one resume');
      return;
    }
    if (!analyzeJobDescription.trim()) {
      setAnalysisError('Please enter a job description');
      return;
    }
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const response = await analyzeResumes(analyzeJobDescription, selectedFiles);
      setApiCandidates(response.ranked_candidates);
      setJobId(response.job_id);
    } catch (err: any) {
      setAnalysisError(err.message ?? 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAnalyzeFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(Array.from(e.target.files || []));
    e.target.value = '';
  };

  const getJobTitle = (appliedJobId: string) => jobs?.find((j) => j.id === appliedJobId)?.title || 'Unknown job';

  const getStatusBadge = (candidate: UploadCandidate) => {
    if (candidate.status === 'Pending') {
      return <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">Pending</Badge>;
    }
    if (candidate.matchScore >= 80) {
      return <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50">High Match</Badge>;
    }
    return <Badge variant="outline" className="text-amber-700 border-amber-300 bg-amber-50">Average</Badge>;
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Recruiter Dashboard</h1>
      
      <DashboardStats stats={stats} />
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="jobs">My Jobs</TabsTrigger>
          <TabsTrigger value="candidates">Candidates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="jobs" className="space-y-6 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4">
              <div>
                <CardTitle>My Job Listings</CardTitle>
                <CardDescription>View and manage your job postings</CardDescription>
              </div>
              <Button
                onClick={() => setIsCreateJobOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                + New Job
              </Button>
            </CardHeader>
            <CardContent>
              {isLoadingJobs ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : hasJobs ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job Title</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Applicants</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobs.map((job: any) => (
                        <TableRow
                          key={job.id}
                          className="cursor-pointer hover:bg-blue-50/70 transition-colors"
                          onClick={() => {
                            setSelectedJobId(job.id);
                            setActiveTab('candidates');
                          }}
                        >
                          <TableCell className="font-medium">{job.title}</TableCell>
                          <TableCell>{formatDate(job.created_at)}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {uploadedCandidates.filter((candidate) => candidate.appliedJobId === job.id).length} applicants
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Briefcase className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No jobs created yet</p>
                  <p className="text-sm text-gray-400">Click + New Job to create your first listing</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Dialog open={isCreateJobOpen} onOpenChange={setIsCreateJobOpen}>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Job</DialogTitle>
                <DialogDescription>Add a new job posting to analyze resumes against.</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Senior Frontend Developer" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Paste the full job description including required skills..."
                            className="h-32 resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsCreateJobOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700"
                      disabled={isSavingJob}
                    >
                      {isSavingJob ? 'Creating...' : 'Create Job'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </TabsContent>
        
        <TabsContent value="candidates" className="space-y-6 mt-6">
          {/* ── Existing upload section (kept unchanged) ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileUp className="h-5 w-5 text-blue-600" />
                Bulk Upload
              </CardTitle>
              <CardDescription>Upload candidate resumes and assign them to an active job listing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <p className="text-sm font-medium mb-2">Active Job</p>
                  <select
                    className="w-full h-10 rounded-md border px-3 text-sm bg-white"
                    value={uploadJobId || ''}
                    onChange={(event) => {
                      const id = event.target.value || null;
                      setUploadJobId(id);
                      const job = activeJobs.find((j) => j.id === id) || null;
                      setSelectedJob(job);
                      if (!selectedJobId && id) setSelectedJobId(id);
                    }}
                  >
                    <option value="">Select active job</option>
                    {activeJobs.map((job) => (
                      <option key={job.id} value={job.id}>{job.title}</option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">Resume Files (PDF)</label>
                  <label className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-blue-200 bg-blue-50/50 p-6 text-center cursor-pointer hover:bg-blue-50 transition-colors">
                    <FileUp className="h-8 w-8 text-blue-600 mb-2" />
                    <span className="text-sm text-slate-700">Click to upload multiple PDF resumes</span>
                    <span className="text-xs text-slate-500 mt-1">Candidate names are extracted from file names</span>
                    <input
                      type="file"
                      accept="application/pdf"
                      multiple
                      className="hidden"
                      disabled={!uploadJobId}
                      onChange={handleCandidateUpload}
                    />
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Existing candidate table (kept unchanged) ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Candidate Management &amp; Ranking
                </span>
                <div className="flex items-center gap-3">
                  <select
                    className="h-9 rounded-md border px-2 text-sm bg-white"
                    value={selectedJobId || ''}
                    onChange={(event) => {
                      const id = event.target.value || null;
                      setSelectedJobId(id);
                      const job = jobs.find((j) => j.id === id) || null;
                      setSelectedJob(job);
                    }}
                  >
                    <option value="">All Jobs</option>
                    {jobs?.map((job) => (
                      <option key={job.id} value={job.id}>{job.title}</option>
                    ))}
                  </select>
                  <Button
                    onClick={runRanking}
                    disabled={!selectedJobId || isRanking}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isRanking
                      ? <><span className="animate-spin mr-2">⟳</span>Ranking...</>
                      : 'Rank Candidates'}
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>Automatically sorted from highest to lowest match score for the selected job.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isRanking && (
                <div className="rounded-md border border-blue-100 bg-blue-50 p-4">
                  <p className="text-sm text-blue-800 animate-pulse">Downloading resumes and running AI ranking...</p>
                </div>
              )}
              {rankedCandidates.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  Upload resumes to see candidates here.
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Candidate Name</TableHead>
                        <TableHead>Applied Job</TableHead>
                        <TableHead>Match Score</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rankedCandidates.map((candidate) => (
                        <TableRow key={candidate.id}>
                          <TableCell className="font-medium">{candidate.name}</TableCell>
                          <TableCell>{getJobTitle(candidate.appliedJobId)}</TableCell>
                          <TableCell className="w-56">
                            <div className="space-y-1">
                              <div className="flex items-center justify-between text-xs text-slate-600">
                                <span>{candidate.status === 'Analyzed' ? `${candidate.matchScore}%` : '--'}</span>
                              </div>
                              <Progress value={candidate.matchScore} className="h-2" />
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(candidate)}</TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={candidate.status !== 'Analyzed'}
                            >
                              View Report
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Ranked Results from "Rank Candidates" ── */}
          {rankResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Ranked Results
                  {rankJobId && (
                    <span className="ml-2 text-xs font-normal text-slate-400">Job ID: {rankJobId}</span>
                  )}
                </CardTitle>
                <CardDescription>
                  {rankResults.length} candidate{rankResults.length !== 1 ? 's' : ''} ranked by AI match score for the selected job.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {rankResults.map((candidate, index) => {
                  const pct = Math.round(candidate.score * 100);
                  const { label: scoreLabel, color: scoreColor } = getScoreLabel(candidate.score);
                  const verdict =
                    candidate.score >= 0.85 ? 'Strong fit — recommend for interview' :
                    candidate.score >= 0.65 ? 'Good candidate — worth a closer look' :
                    candidate.score >= 0.40 ? 'Partial match — consider for adjacent roles' :
                                              'Low match — does not meet core requirements';
                  const total = candidate.matched_keywords.length + candidate.missing_keywords.length;
                  const coveragePct = total > 0
                    ? Math.round((candidate.matched_keywords.length / total) * 100)
                    : 0;
                  const bothEmpty = candidate.matched_keywords.length === 0 && candidate.missing_keywords.length === 0;
                  const scoreColorClasses: Record<string, string> = {
                    green: 'bg-green-50 border-green-300 text-green-700',
                    blue: 'bg-blue-50 border-blue-300 text-blue-700',
                    yellow: 'bg-yellow-50 border-yellow-300 text-yellow-700',
                    red: 'bg-red-50 border-red-300 text-red-700',
                  };
                  return (
                    <div key={candidate.resume_id} className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
                      <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-slate-100 bg-slate-50">
                        <div className="flex items-center gap-3">
                          <span className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white text-xs font-bold shrink-0">
                            #{index + 1}
                          </span>
                          <div>
                            <p className="font-semibold text-sm text-slate-800">{candidate.filename}</p>
                            <p className="text-xs text-slate-500">{verdict}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {candidate.score >= 0.65 && (
                            <span className="text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                              ⭐ Shortlist
                            </span>
                          )}
                          <div className="text-right">
                            <p className="text-2xl font-bold text-slate-900">{pct}%</p>
                            <span className={`text-xs font-medium border rounded-full px-2 py-0.5 ${scoreColorClasses[scoreColor]}`}>
                              {scoreLabel}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="px-4 py-3">
                        {bothEmpty ? (
                          <p className="text-xs text-slate-500 italic">Keyword analysis unavailable — try a more detailed job description</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs font-semibold text-green-700 mb-2">✅ Skills Matched</p>
                              {candidate.matched_keywords.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {candidate.matched_keywords.map((kw) => (
                                    <span key={kw} className="text-xs px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700">{kw}</span>
                                  ))}
                                </div>
                              ) : <p className="text-xs text-slate-400">No matching skills found</p>}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-red-700 mb-2">❌ Skills Missing</p>
                              {candidate.missing_keywords.length > 0 ? (
                                <div className="flex flex-wrap gap-1.5">
                                  {candidate.missing_keywords.map((kw) => (
                                    <span key={kw} className="text-xs px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700">{kw}</span>
                                  ))}
                                </div>
                              ) : <p className="text-xs text-slate-400">All key skills present</p>}
                            </div>
                          </div>
                        )}
                        {!bothEmpty && (
                          <p className="mt-3 text-xs text-slate-500">
                            Covers <span className="font-semibold text-slate-700">{coveragePct}%</span> of required skills
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* ── Manual: AI Resume Analysis (live backend) ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                AI Resume Analysis
              </CardTitle>
              <CardDescription>
                Upload resumes and paste a job description to get AI-powered match scores and keyword analysis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Job description */}
              <div>
                <label className="block text-sm font-medium mb-2">Job Description</label>
                <textarea
                  className="w-full min-h-[120px] rounded-md border border-slate-300 px-3 py-2 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Paste the full job description including required skills and qualifications..."
                  value={analyzeJobDescription}
                  onChange={(e) => setAnalyzeJobDescription(e.target.value)}
                  disabled={isAnalyzing}
                />
              </div>

              {/* File upload */}
              <div>
                <label className="block text-sm font-medium mb-2">Resume Files (PDF / DOCX)</label>
                <label className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-blue-200 bg-blue-50/50 p-5 text-center cursor-pointer hover:bg-blue-50 transition-colors">
                  <FileUp className="h-7 w-7 text-blue-600 mb-2" />
                  <span className="text-sm text-slate-700">Click to select one or more resume files</span>
                  <input
                    ref={analyzeFileInputRef}
                    type="file"
                    accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    multiple
                    className="hidden"
                    onChange={handleAnalyzeFileChange}
                  />
                </label>
                {selectedFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {selectedFiles.map((f) => (
                      <div key={f.name} className="flex items-center gap-2 rounded-md bg-blue-50 border border-blue-200 px-3 py-1.5">
                        <FileUp className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        <span className="text-xs text-slate-700 truncate">{f.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Error state */}
              {analysisError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3">
                  <p className="text-sm text-red-700">{analysisError}</p>
                  <button
                    className="mt-2 text-xs font-medium text-red-600 hover:underline"
                    onClick={() => setAnalysisError(null)}
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* Submit */}
              <div className="flex justify-end">
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isAnalyzing ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Analyzing {selectedFiles.length} resume(s)...</>
                  ) : 'Analyze Resumes'}
                </Button>
              </div>

              {/* Results: ranked candidate cards */}
              {apiCandidates.length > 0 && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-700">
                      {apiCandidates.length} Candidate{apiCandidates.length !== 1 ? 's' : ''} Ranked
                      {jobId && <span className="ml-2 text-xs font-normal text-slate-400">Job ID: {jobId}</span>}
                    </h3>
                  </div>

                  {apiCandidates.map((candidate, index) => {
                    const pct = Math.round(candidate.score * 100);
                    const { label: scoreLabel, color: scoreColor } = getScoreLabel(candidate.score);
                    const verdict =
                      candidate.score >= 0.85 ? 'Strong fit — recommend for interview' :
                      candidate.score >= 0.65 ? 'Good candidate — worth a closer look' :
                      candidate.score >= 0.40 ? 'Partial match — consider for junior or adjacent roles' :
                                                'Low match — does not meet core requirements';
                    const total = candidate.matched_keywords.length + candidate.missing_keywords.length;
                    const coveragePct = total > 0
                      ? Math.round((candidate.matched_keywords.length / total) * 100)
                      : 0;
                    const bothEmpty = candidate.matched_keywords.length === 0 && candidate.missing_keywords.length === 0;

                    const scoreColorClasses: Record<string, string> = {
                      green: 'bg-green-50 border-green-300 text-green-700',
                      blue: 'bg-blue-50 border-blue-300 text-blue-700',
                      yellow: 'bg-yellow-50 border-yellow-300 text-yellow-700',
                      red: 'bg-red-50 border-red-300 text-red-700',
                    };

                    return (
                      <div key={candidate.resume_id} className="rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
                        {/* Card header */}
                        <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-slate-100 bg-slate-50">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-600 text-white text-xs font-bold shrink-0">
                              #{index + 1}
                            </span>
                            <div>
                              <p className="font-semibold text-sm text-slate-800">{candidate.filename}</p>
                              <p className="text-xs text-slate-500">{verdict}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {candidate.score >= 0.65 && (
                              <span className="text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                                ⭐ Shortlist Candidate
                              </span>
                            )}
                            <div className="text-right">
                              <p className="text-2xl font-bold text-slate-900">{pct}%</p>
                              <span className={`text-xs font-medium border rounded-full px-2 py-0.5 ${scoreColorClasses[scoreColor]}`}>
                                {scoreLabel}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Keywords */}
                        <div className="px-4 py-3">
                          {bothEmpty ? (
                            <p className="text-xs text-slate-500 italic">
                              Keyword analysis unavailable — try a more detailed job description
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Matched */}
                              <div>
                                <p className="text-xs font-semibold text-green-700 mb-2">✅ Skills Matched</p>
                                {candidate.matched_keywords.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {candidate.matched_keywords.map((kw) => (
                                      <span key={kw} className="text-xs px-2 py-0.5 rounded-full bg-green-50 border border-green-200 text-green-700">{kw}</span>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-slate-400">No matching skills found</p>
                                )}
                              </div>
                              {/* Missing */}
                              <div>
                                <p className="text-xs font-semibold text-red-700 mb-2">❌ Skills Missing</p>
                                {candidate.missing_keywords.length > 0 ? (
                                  <div className="flex flex-wrap gap-1.5">
                                    {candidate.missing_keywords.map((kw) => (
                                      <span key={kw} className="text-xs px-2 py-0.5 rounded-full bg-red-50 border border-red-200 text-red-700">{kw}</span>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-xs text-slate-400">All key skills present</p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Coverage insight */}
                          {!bothEmpty && (
                            <p className="mt-3 text-xs text-slate-500">
                              Covers <span className="font-semibold text-slate-700">{coveragePct}%</span> of required skills
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-500">Total Applications</p>
                <p className="text-2xl font-semibold mt-1">{totalApplications}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-500">Average Match Score</p>
                <p className="text-2xl font-semibold mt-1">{averageMatch}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-slate-500">Analyzed Candidates</p>
                <p className="text-2xl font-semibold mt-1">{analyzedCandidates.length}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Top Skill Gaps
                </CardTitle>
                <CardDescription>Skills most frequently missing across uploaded candidates.</CardDescription>
              </CardHeader>
              <CardContent>
                {topSkillGaps.length === 0 ? (
                  <p className="text-sm text-slate-500">No skill gap data yet. Rank candidates to populate this view.</p>
                ) : (
                  <div className="space-y-2">
                    {topSkillGaps.map(([skill, count]) => (
                      <div key={skill} className="flex items-center justify-between rounded-md border p-2">
                        <span className="text-sm font-medium">{skill}</span>
                        <Badge variant="outline">{count} candidates</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Candidate Quality by Job</CardTitle>
                <CardDescription>Higher bars indicate stronger average candidate fit.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {qualityByJob.length === 0 ? (
                    <p className="text-sm text-slate-500">Create jobs and upload candidates to view quality trends.</p>
                  ) : qualityByJob.map((item: { jobId: number; title: string; candidates: number; quality: number }) => (
                    <div key={item.jobId} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="truncate pr-3">{item.title}</span>
                        <span className="text-slate-600">{item.quality}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100">
                        <div className="h-2 rounded-full bg-blue-600" style={{ width: `${item.quality}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
            </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

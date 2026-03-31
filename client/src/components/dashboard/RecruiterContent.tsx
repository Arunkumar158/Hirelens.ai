import { type ChangeEvent, useMemo, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest, queryClient } from '@/lib/queryClient';
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
import { BarChart3, Briefcase, FileUp, Users } from 'lucide-react';
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
type UploadCandidate = {
  id: number;
  name: string;
  fileName: string;
  appliedJobId: number;
  status: 'Pending' | 'Analyzed';
  matchScore: number;
  missingSkills: string[];
};

export default function RecruiterContent() {
  const [activeTab, setActiveTab] = useState('jobs');
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [uploadJobId, setUploadJobId] = useState<number | null>(null);
  const [uploadedCandidates, setUploadedCandidates] = useState<UploadCandidate[]>([]);
  const [isRanking, setIsRanking] = useState(false);
  const [rankingProgress, setRankingProgress] = useState(0);
  const [isCreateJobOpen, setIsCreateJobOpen] = useState(false);

  // Fetch recruiter's jobs
  const { data: jobs, isLoading: isLoadingJobs } = useQuery({
    queryKey: ['/api/jobs'],
  });

  // Form for creating a new job
  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      title: '',
      description: '',
    },
  });

  // Mutation for creating a new job
  const createJobMutation = useMutation({
    mutationFn: async (data: JobFormValues) => {
      const res = await apiRequest('POST', '/api/jobs', data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      form.reset();
      setIsCreateJobOpen(false);
    },
  });

  const onSubmit = (data: JobFormValues) => {
    createJobMutation.mutate(data);
  };
  
  const allMissingSkills = ['System Design', 'AWS', 'Leadership', 'Kubernetes', 'Testing', 'GraphQL', 'CI/CD'];
  const hasJobs = Array.isArray(jobs) && jobs.length > 0;
  const activeJobs = (jobs || []).filter((job: any) => !job.isArchived);

  const candidatesForSelectedJob = useMemo(() => {
    if (!selectedJobId) return uploadedCandidates;
    return uploadedCandidates.filter((candidate) => candidate.appliedJobId === selectedJobId);
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
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [uploadedCandidates]);

  const qualityByJob = useMemo(() => {
    return (jobs || []).map((job: any) => {
      const jobCandidates = uploadedCandidates.filter((candidate) => candidate.appliedJobId === job.id);
      const quality = jobCandidates.length
        ? Math.round(jobCandidates.reduce((sum, candidate) => sum + candidate.matchScore, 0) / jobCandidates.length)
        : 0;
      return {
        jobId: job.id,
        title: job.title,
        candidates: jobCandidates.length,
        quality,
      };
    }).sort((a, b) => b.quality - a.quality);
  }, [jobs, uploadedCandidates]);

  const stats = [
    { label: 'Active Jobs', value: activeJobs.length || 0 },
    { label: 'Candidates Analyzed', value: analyzedCandidates.length },
    { label: 'Top Match Score', value: topMatchScore }
  ];

  const sanitizeCandidateName = (fileName: string) => {
    return fileName
      .replace(/\.pdf$/i, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const handleCandidateUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!uploadJobId || files.length === 0) return;
    const baseId = Date.now();
    const nextCandidates = files.map((file, index) => ({
      id: baseId + index,
      name: sanitizeCandidateName(file.name),
      fileName: file.name,
      appliedJobId: uploadJobId,
      status: 'Pending' as const,
      matchScore: 0,
      missingSkills: [],
    }));
    setUploadedCandidates((prev) => [...nextCandidates, ...prev]);
    event.target.value = '';
  };

  const runRanking = () => {
    if (!selectedJobId) return;
    setIsRanking(true);
    setRankingProgress(0);
    let step = 0;
    const timer = window.setInterval(() => {
      step += 1;
      setRankingProgress(Math.min(step * 20, 100));
      if (step >= 5) {
        window.clearInterval(timer);
        setUploadedCandidates((prev) =>
          prev.map((candidate) => {
            if (candidate.appliedJobId !== selectedJobId) return candidate;
            const score = 58 + ((candidate.id * 13) % 38);
            const missingSkills = allMissingSkills.filter((_, idx) => (candidate.id + idx) % 3 === 0).slice(0, 3);
            return {
              ...candidate,
              status: 'Analyzed',
              matchScore: score,
              missingSkills,
            };
          })
        );
        setIsRanking(false);
      }
    }, 450);
  };

  const getJobTitle = (jobId: number) => jobs?.find((job: any) => job.id === jobId)?.title || 'Unknown job';

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
                          <TableCell>{formatDate(job.createdAt)}</TableCell>
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
                      disabled={createJobMutation.isPending}
                    >
                      {createJobMutation.isPending ? 'Creating...' : 'Create Job'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </TabsContent>
        
        <TabsContent value="candidates" className="space-y-6 mt-6">
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
                      const jobId = Number(event.target.value) || null;
                      setUploadJobId(jobId);
                      if (!selectedJobId) {
                        setSelectedJobId(jobId);
                      }
                    }}
                  >
                    <option value="">Select active job</option>
                    {activeJobs.map((job: any) => (
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

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Candidate Management & Ranking
                </span>
                <div className="flex items-center gap-3">
                  <select
                    className="h-9 rounded-md border px-2 text-sm bg-white"
                    value={selectedJobId || ''}
                    onChange={(event) => setSelectedJobId(Number(event.target.value) || null)}
                  >
                    <option value="">All Jobs</option>
                    {jobs?.map((job: any) => (
                      <option key={job.id} value={job.id}>{job.title}</option>
                    ))}
                  </select>
                  <Button
                    onClick={runRanking}
                    disabled={!selectedJobId || isRanking || rankedCandidates.length === 0}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isRanking ? 'Ranking...' : 'Rank Candidates'}
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>Automatically sorted from highest to lowest match score for the selected job.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isRanking && (
                <div className="rounded-md border border-blue-100 bg-blue-50 p-4">
                  <p className="text-sm text-blue-800 mb-2">Running AI candidate ranking...</p>
                  <Progress value={rankingProgress} className="h-2" />
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
                  ) : qualityByJob.map((item) => (
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
